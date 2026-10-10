// 전투 엔진. 화면(DOM)과 분리되어 있고, 입출력은 io 객체를 통해서만 한다.
//
// io 인터페이스
//   chooseAction(unit)  → Promise<{ type: 'attack' | 'skill' | 'interrupt' | 'abort' }>
//   quiz({ quiz, title, reward, unit }) → Promise<boolean>   (정답 여부)
//   delay(ms)           → Promise
//   update()            화면 갱신
//   log(text)           전투 기록
//   fx(event)           연출 (피해/회복 숫자 등)
//
// 턴 진행: 매 라운드 살아 있는 유닛이 속도(spd) 순서로 한 번씩 행동한다.
// 궁극기: 에너지가 가득 차면 언제든 예약할 수 있고, 진행 중인 행동이 끝난 뒤 다음 턴이 시작되기 전에 발동한다.
(function (MR) {
  const ENEMY_LETTERS = 'ABCD';

  function makeAlly(key, level) {
    const def = MR.CHARACTERS[key];
    const s = MR.statsAtLevel(def.base, level);
    return {
      uid: `a_${key}`, key, side: 'ally', def, name: def.name, level,
      maxHp: s.hp, hp: s.hp, baseAtk: s.atk, baseDef: s.def, spd: s.spd,
      maxEnergy: def.maxEnergy, energy: Math.round(def.maxEnergy * MR.CONFIG.ENERGY.start),
      buffs: [], alive: true,
    };
  }

  function makeEnemy(key, stageLevel, index, needsLetter) {
    const def = MR.MONSTERS[key];
    const m = 1 + MR.CONFIG.ENEMY_SCALE * (stageLevel - 1);
    const hp = Math.round(def.base.hp * m);
    return {
      uid: `e_${index}`, key, side: 'enemy', def,
      name: needsLetter ? `${def.name} ${ENEMY_LETTERS[index]}` : def.name,
      level: stageLevel,
      maxHp: hp, hp, baseAtk: Math.round(def.base.atk * m), baseDef: Math.round(def.base.def * m), spd: def.base.spd,
      buffs: [], alive: true,
    };
  }

  class Battle {
    constructor(stage, levels, io) {
      this.stage = stage;
      this.io = io;
      this.allies = MR.PARTY_ORDER.map((k) => makeAlly(k, levels[k] || 1));
      this.enemies = stage.enemies.map((k, i) =>
        makeEnemy(k, stage.level, i, stage.enemies.filter((x) => x === k).length > 1));
      this.sp = MR.CONFIG.SP_START;
      this.round = 0;
      this.order = [];
      this.orderIndex = -1;
      this.current = null;
      this.ultQueue = [];
      this.selectedUid = this.enemies[0].uid;
      this.over = false;
      this.result = null; // 'win' | 'lose' | 'retreat'
    }

    // ---------- 조회 ----------
    get units() { return [...this.allies, ...this.enemies]; }
    aliveAllies() { return this.allies.filter((u) => u.alive); }
    aliveEnemies() { return this.enemies.filter((u) => u.alive); }
    find(uid) { return this.units.find((u) => u.uid === uid); }

    stat(u, name) {
      const base = name === 'atk' ? u.baseAtk : u.baseDef;
      const pct = u.buffs.filter((b) => b.stat === name).reduce((s, b) => s + b.pct, 0);
      return Math.max(0, Math.round(base * (1 + pct)));
    }

    getTarget() {
      let t = this.find(this.selectedUid);
      if (!t || !t.alive) {
        t = this.aliveEnemies()[0];
        if (t) this.selectedUid = t.uid;
      }
      return t;
    }

    selectTarget(uid) {
      const t = this.find(uid);
      if (t && t.side === 'enemy' && t.alive) this.selectedUid = uid;
    }

    lowestHpAlly() {
      return this.aliveAllies().reduce((m, u) => (u.hp / u.maxHp < m.hp / m.maxHp ? u : m));
    }

    randomAllies(count) {
      const pool = this.aliveAllies();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, count);
    }

    // 이번 라운드에서 아직 행동하지 않은 유닛 (현재 유닛 포함)
    upcoming() {
      return this.order.slice(Math.max(0, this.orderIndex)).filter((u) => u.alive);
    }

    canUlt(u) {
      return !this.over && u.side === 'ally' && u.alive && u.energy >= u.maxEnergy;
    }

    // ---------- 상태 변경 ----------
    log(text) { this.io.log(text); }

    gainSp(n) { this.sp = Math.max(0, Math.min(MR.CONFIG.SP_MAX, this.sp + n)); }

    gainEnergy(u, n) {
      if (!u.alive || u.side !== 'ally') return;
      u.energy = Math.min(u.maxEnergy, u.energy + n);
    }

    addBuff(u, buff) {
      if (!u.alive) return;
      u.buffs = u.buffs.filter((b) => b.id !== buff.id);
      // 자기 턴 중에 받은 효과는 그 턴 종료 시 줄어들지 않는다
      u.buffs.push({ ...buff, fresh: this.current === u });
    }

    dealDamage(src, target, mult, ctx = {}) {
      if (!target || !target.alive) return 0;
      const trait = src.def.trait;
      const bonus = trait && trait.damageBonus ? trait.damageBonus(this, src, target, ctx) : 0;
      const raw = this.stat(src, 'atk') * mult * (1 + bonus);
      const k = MR.CONFIG.DEF_K;
      const dmg = Math.max(1, Math.round((raw * k) / (k + this.stat(target, 'def'))));
      target.hp = Math.max(0, target.hp - dmg);
      this.io.fx({ type: 'damage', uid: target.uid, amount: dmg });
      if (target.side === 'ally') this.gainEnergy(target, MR.CONFIG.ENERGY.hit);
      if (target.hp === 0) {
        target.alive = false;
        target.buffs = [];
        this.log(`${target.name}이(가) 쓰러졌다.`);
      }
      return dmg;
    }

    hitAll(src, mult) {
      const targets = src.side === 'ally' ? this.aliveEnemies() : this.aliveAllies();
      let total = 0;
      for (const t of targets) total += this.dealDamage(src, t, mult, { targetCount: targets.length });
      return total;
    }

    heal(src, target, mult) {
      if (!target || !target.alive) return 0;
      const trait = src.def.trait;
      const bonus = trait && trait.healBonus ? trait.healBonus(this, src, target) : 0;
      const amount = Math.round(this.stat(src, 'atk') * mult * (1 + bonus));
      const healed = Math.min(amount, target.maxHp - target.hp);
      target.hp += healed;
      this.io.fx({ type: 'heal', uid: target.uid, amount: healed });
      return healed;
    }

    requestUltimate(uid) {
      const u = this.find(uid);
      if (!u || !this.canUlt(u) || this.ultQueue.includes(uid)) return false;
      this.ultQueue.push(uid);
      this.log(`${u.name}의 궁극기가 예약되었다.`);
      return true;
    }

    abort() {
      this.over = true;
      this.result = 'retreat';
    }

    checkEnd() {
      if (this.over) return true;
      if (this.aliveEnemies().length === 0) { this.over = true; this.result = 'win'; }
      else if (this.aliveAllies().length === 0) { this.over = true; this.result = 'lose'; }
      return this.over;
    }

    // ---------- 진행 ----------
    async run() {
      for (const u of this.allies) {
        if (u.def.trait && u.def.trait.onBattleStart) u.def.trait.onBattleStart(this, u);
      }
      this.io.update();

      while (!this.over) {
        this.round++;
        this.order = this.units
          .filter((u) => u.alive)
          .sort((a, b) => b.spd - a.spd || (a.side === b.side ? 0 : a.side === 'ally' ? -1 : 1));
        this.log(`── ${this.round} 라운드 ──`);

        for (this.orderIndex = 0; this.orderIndex < this.order.length; this.orderIndex++) {
          await this.processUltimates();
          if (this.over) break;
          const u = this.order[this.orderIndex];
          if (!u.alive) continue;

          this.current = u;
          this.io.update();
          if (u.side === 'ally') await this.allyTurn(u);
          else await this.enemyTurn(u);
          this.endTurn(u);
          this.current = null;
          this.io.update();

          if (this.checkEnd()) break;
          await this.io.delay(MR.CONFIG.DELAY.afterAction);
          await this.processUltimates();
          if (this.over) break;
        }
      }
      this.current = null;
      this.ultQueue = [];
      this.io.update();
      return this.result;
    }

    async processUltimates() {
      while (this.ultQueue.length && !this.over) {
        const u = this.find(this.ultQueue.shift());
        if (!this.canUlt(u)) continue;
        await this.castUltimate(u);
        this.io.update();
        this.checkEnd();
      }
    }

    async allyTurn(u) {
      for (;;) {
        const choice = await this.io.chooseAction(u);
        if (this.over || choice.type === 'abort') return;
        if (choice.type === 'interrupt') {
          // 행동 선택 중에 궁극기를 누른 경우: 바로 발동하고 다시 행동을 고른다
          await this.processUltimates();
          if (this.over || !u.alive) return;
          continue;
        }
        if (choice.type === 'skill') {
          if (this.sp < 1) continue;
          await this.useSkill(u);
        } else {
          await this.useAttack(u);
        }
        return;
      }
    }

    async useAttack(u) {
      this.log(`${u.name}의 일반 공격!`);
      this.dealDamage(u, this.getTarget(), 1.0);
      this.gainEnergy(u, MR.CONFIG.ENERGY.attack);
      this.io.update();
      if (this.checkEnd()) return;

      const ok = await this.io.quiz({
        quiz: MR.Quiz.make('addSub'),
        title: `${u.name} · 일반 공격 퀴즈`,
        reward: '정답이면 스킬 포인트 +1',
        unit: u,
      });
      if (this.over) return;
      if (ok && this.sp < MR.CONFIG.SP_MAX) {
        this.gainSp(1);
        this.log('정답! 스킬 포인트 +1');
      } else if (ok) {
        this.log('정답! (스킬 포인트가 이미 최대)');
      }
    }

    async useSkill(u) {
      const sk = u.def.skill;
      this.gainSp(-1);
      this.io.update();
      const ok = await this.io.quiz({
        quiz: MR.Quiz.make(u.def.quiz),
        title: `${u.name} · ${sk.name}`,
        reward: sk.bonusDesc,
        unit: u,
      });
      if (this.over) return;
      this.log(`${u.name}의 고유 스킬 「${sk.name}」${ok ? ' (보너스 발동!)' : ''}`);
      sk.run(this, u, ok);
      this.gainEnergy(u, MR.CONFIG.ENERGY.skill);
      this.io.update();
      this.checkEnd();
    }

    async castUltimate(u) {
      const ult = u.def.ult;
      const spent = u.energy;
      u.energy = 0;
      this.log(`⚡ ${u.name}의 궁극기 「${ult.name}」!`);
      ult.run(this, u);
      this.io.update();
      if (this.checkEnd()) return;

      const refund = Math.round(spent * ult.refund);
      const ok = await this.io.quiz({
        quiz: MR.Quiz.make(u.def.quiz),
        title: `${u.name} · 에너지 회수 퀴즈`,
        reward: `정답이면 에너지 ${refund} 회복`,
        unit: u,
      });
      if (this.over) return;
      if (ok) {
        this.gainEnergy(u, refund);
        this.log(`정답! ${u.name}의 에너지 +${refund}`);
      }
    }

    async enemyTurn(u) {
      await this.io.delay(MR.CONFIG.DELAY.enemyAction);
      if (this.over) return;
      u.def.act(this, u);
    }

    endTurn(u) {
      u.buffs = u.buffs
        .map((b) => (b.fresh ? { ...b, fresh: false } : { ...b, turns: b.turns - 1 }))
        .filter((b) => b.turns > 0);
    }
  }

  MR.Battle = Battle;
})((globalThis.MR = globalThis.MR || {}));
