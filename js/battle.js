// 전투 엔진. 화면(DOM)과 분리되어 있고, 입출력은 io 객체를 통해서만 한다.
//
// io 인터페이스
//   chooseAction(unit)  → Promise<{ type: 'attack' | 'skill' | 'interrupt' | 'abort' }>
//   quiz({ quiz, title, reward, unit }) → Promise<boolean>   (정답 여부)
//   chooseAlly({ title, desc, allies }) → Promise<unit>       (플레이어가 아군 한 명을 고름)
//
// options.difficulty: 퀴즈 난이도 (MR.Quiz.DIFFICULTIES 의 id)
// options.equip: { 캐릭터 key: { weapon: 강화 단계, ... } } (없으면 장비 없음)
// options.party: 출전하는 캐릭터 key 배열 (없으면 MR.PARTY_ORDER)
// options.breaks: { 캐릭터 key: 돌파 단계 } (없으면 0)
// options.gearGrades: { 캐릭터 key: { weapon, hat, top, bottom, shoes: 등급 번호 } } (없으면 모두 Common)
//   delay(ms)           → Promise
//   update()            화면 갱신
//   log(text)           전투 기록
//   fx(event)           연출 (피해/회복 숫자, 스킬 이름 배너 등)
//
// 턴 진행: 매 라운드 살아 있는 유닛이 속도(spd) 순서로 한 번씩 행동한다.
// 궁극기: 에너지가 가득 차면 언제든 예약할 수 있고, 진행 중인 행동이 끝난 뒤 다음 턴이 시작되기 전에 발동한다.
(function (MR) {
  const ENEMY_LETTERS = 'ABCD';

  function makeAlly(key, level, equipLevels, breakLevel, gearGrades) {
    const def = MR.CHARACTERS[key];
    const s = MR.statsAtLevel(def.base, level);
    // 장비가 없으면(장비 기능이 열리기 전) 무기 등급도 적용하지 않는다
    const e = equipLevels ? MR.equipBonus(equipLevels, gearGrades) : MR.equipBonus(null, null);
    const br = MR.breakthroughBonus(breakLevel);
    const hp = Math.round((s.hp + e.hp) * br.statMult);
    return {
      uid: `a_${key}`, key, side: 'ally', def, name: def.name, level, skillLevel: MR.skillLevelFor(level), ultLevel: MR.ultLevelFor(level), shield: 0,
      breakLevel: breakLevel || 0, br, critRate: def.crit.rate + e.crit, critDmg: def.crit.dmg + e.critDmg,
      maxHp: hp, hp, baseAtk: Math.round((s.atk + e.atk) * br.statMult), baseDef: Math.round((s.def + e.def) * br.statMult), spd: s.spd + e.spd,
      maxEnergy: def.maxEnergy, energy: Math.min(def.maxEnergy, Math.round(def.maxEnergy * MR.CONFIG.ENERGY.start) + br.startEnergy),
      buffs: [], alive: true,
    };
  }

  function makeEnemy(key, stageLevel, index, letterIndex, mods) {
    const def = MR.MONSTERS[key];
    // fixedStats 인 몬스터(보스)는 스테이지 레벨로 강화하지 않고 base 값을 그대로 쓴다
    const m = def.fixedStats ? 1 : 1 + MR.CONFIG.ENEMY_SCALE * (stageLevel - 1);
    // 스테이지별 보정 (mods: { hp, atk, def } 배율). 보스에는 적용하지 않는다
    const mod = (stat) => (def.fixedStats || !mods || mods[stat] === undefined ? 1 : mods[stat]);
    const hp = Math.round(def.base.hp * m * mod('hp'));
    return {
      uid: `e_${index}`, key, side: 'enemy', def,
      name: letterIndex >= 0 ? `${def.name} ${ENEMY_LETTERS[letterIndex]}` : def.name,
      level: stageLevel,
      maxHp: hp, hp, baseAtk: Math.round(def.base.atk * m * mod('atk')), baseDef: Math.round(def.base.def * m * mod('def')), spd: def.base.spd,
      buffs: [], alive: true, boss: !!def.boss,
      critRate: (def.crit || MR.CONFIG.ENEMY_CRIT).rate, critDmg: (def.crit || MR.CONFIG.ENEMY_CRIT).dmg,
      mem: {}, // 몬스터가 전투 중 기억할 값 (행동 패턴, 재사용 대기 등)
    };
  }

  class Battle {
    constructor(stage, levels, io, options = {}) {
      this.stage = stage;
      this.io = io;
      this.difficulty = options.difficulty || MR.Quiz.DEFAULT;
      const equip = options.equip || {};
      const party = options.party || MR.PARTY_ORDER;
      const breaks = options.breaks || {};
      const grades = options.gearGrades || {};
      this.allies = party.map((k) => makeAlly(k, levels[k] || 1, equip[k], breaks[k], grades[k]));
      this.powerUnit = null; // 고유 스킬을 쓰는 중인 캐릭터 (돌파 '숙련' 효과용)
      this.enemies = stage.enemies.map((k, i) => {
        // 같은 종류가 여러 마리면 그 종류 안에서의 순서로 A, B, C… 를 붙인다
        const same = stage.enemies.filter((x) => x === k).length;
        const nth = stage.enemies.slice(0, i).filter((x) => x === k).length;
        return makeEnemy(k, stage.level, i, same > 1 ? nth : -1, stage.mods);
      });
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
      return !this.over && u.side === 'ally' && u.alive && u.energy >= u.maxEnergy && !this.isSilenced(u);
    }

    // 침묵: 고유 스킬과 궁극기를 쓸 수 없고 일반 공격만 가능
    isSilenced(u) {
      return u.buffs.some((b) => b.kind === 'silence');
    }

    hasMark(u) {
      return u.buffs.some((b) => b.kind === 'mark');
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
      const power = this.powerUnit === src ? src.br.skillPower : 1;
      // 치명타: 공격자의 치명타 확률로 판정, 터지면 치명타 피해 배율만큼 곱한다
      const crit = Math.random() < (src.critRate || 0);
      const critMult = crit ? src.critDmg : 1;
      const dmg = this.applyHit(target, this.stat(src, 'atk') * mult * (1 + bonus) * power * critMult, crit ? 'crit' : 'damage');
      if (target.side === 'ally') this.gainEnergy(target, MR.CONFIG.ENERGY.hit);
      if (target.alive) this.checkImagMark(src, target, dmg);
      return dmg;
    }

    // 방어력을 적용해 피해를 주고(실드가 먼저 막는다) 준 피해량을 돌려준다
    applyHit(target, raw, fxType = 'damage') {
      const k = MR.CONFIG.DEF_K;
      const taken = target.br ? target.br.damageTaken : 1;
      const dmg = Math.max(1, Math.round((raw * k * taken) / (k + this.stat(target, 'def'))));
      const absorbed = Math.min(target.shield || 0, dmg);
      if (absorbed) target.shield -= absorbed;
      target.hp = Math.max(0, target.hp - (dmg - absorbed));
      this.io.fx({ type: fxType, uid: target.uid, amount: dmg });
      if (target.hp === 0) this.kill(target);
      return dmg;
    }

    kill(target) {
      target.alive = false;
      target.buffs = [];
      target.shield = 0;
      this.log(`${target.name}이(가) 쓰러졌다.`);
    }

    // 자기 자신에게 주는 피해 (방어력·실드 무시, 쓰러지지는 않는다)
    selfDamage(u, amount) {
      const dmg = Math.min(amount, u.hp - 1);
      if (dmg <= 0) return 0;
      u.hp -= dmg;
      this.io.fx({ type: 'damage', uid: u.uid, amount: dmg });
      return dmg;
    }

    addShield(u, amount) {
      if (!u.alive || amount <= 0) return;
      u.shield = (u.shield || 0) + amount;
      this.log(`${u.name}에게 실드 ${amount}`);
    }

    // ---------- 허수 표식 (라파) ----------
    applyImagMark(src, target) {
      if (!target.alive) return;
      const spec = src.def.mark;
      const cur = target.buffs.find((b) => b.kind === 'imagMark');
      const stacks = Math.min(spec.maxStacks, (cur ? cur.stacks : 0) + 1);
      target.buffs = target.buffs.filter((b) => b.kind !== 'imagMark');
      // 다시 부여되면 누구의 공격으로든 다시 터질 수 있다
      target.buffs.push({ id: 'imagMark', kind: 'imagMark', label: '허수 표식', stacks, turns: spec.turns, sourceUid: src.uid, usedBy: [], fresh: this.current === target });
    }

    checkImagMark(attacker, target, dmg) {
      const mark = target.buffs.find((b) => b.kind === 'imagMark');
      if (!mark || mark.usedBy.includes(attacker.uid)) return;
      if (dmg <= target.maxHp * MR.CHARACTERS.rafa.mark.threshold) return;
      const owner = this.find(mark.sourceUid);
      if (!owner) return;
      const spec = owner.def.mark;
      const i = owner.skillLevel - 1;
      mark.usedBy.push(attacker.uid);
      mark.stacks -= 1;
      if (mark.stacks <= 0) target.buffs = target.buffs.filter((b) => b !== mark);
      this.log(`허수 표식이 터졌다! (${target.name})`);
      this.applyHit(target, this.stat(owner, 'atk') * spec.atk[i] + owner.maxHp * spec.hp[i], 'burst');
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
      const power = this.powerUnit === src ? src.br.skillPower : 1;
      return this.restoreHp(target, Math.round(this.stat(src, 'atk') * mult * (1 + bonus) * power));
    }

    // 최대 체력 비율로 회복 (몬스터 회복 스킬용)
    healMaxHp(target, pct) {
      if (!target || !target.alive) return 0;
      return this.restoreHp(target, Math.round(target.maxHp * pct));
    }

    restoreHp(target, amount) {
      const healed = Math.min(amount, target.maxHp - target.hp);
      target.hp += healed;
      this.io.fx({ type: 'heal', uid: target.uid, amount: healed });
      return healed;
    }

    // 스킬 이름 배너와 이펙트를 띄우고, 연출이 끝날 때까지 기다린다
    async announce(u, skillName, effect) {
      this.log(`${u.name}의 「${skillName}」!`);
      this.io.fx({ type: 'skill', uid: u.uid, name: skillName, effect, side: u.side, color: u.def.color });
      await this.io.delay(MR.CONFIG.DELAY.skillBanner);
    }

    addSilence(u, turns) {
      if (!u.alive) return;
      const cur = u.buffs.find((b) => b.kind === 'silence');
      const fresh = this.current === u;
      if (cur && cur.turns >= turns) return;
      u.buffs = u.buffs.filter((b) => b.kind !== 'silence');
      u.buffs.push({ id: 'silence', kind: 'silence', label: '침묵', turns, fresh });
      // 이미 예약된 궁극기도 취소된다
      this.ultQueue = this.ultQueue.filter((id) => id !== u.uid);
      this.log(`${u.name}이(가) ${turns}턴 동안 침묵에 걸렸다!`);
    }

    // 허수 표식: 다음 퀴즈를 틀리면 1턴 침묵. 퀴즈를 한 번 풀면 사라진다
    addMark(u) {
      if (!u.alive) return;
      u.buffs = u.buffs.filter((b) => b.kind !== 'mark');
      u.buffs.push({ id: 'mark', kind: 'mark', label: '허수 표식', turns: Infinity });
    }

    // 모든 퀴즈는 여기를 거친다 (허수 표식 처리)
    async askQuiz(u, { kind, title, reward }) {
      const marked = this.hasMark(u);
      const ok = await this.io.quiz({
        quiz: MR.Quiz.make(kind, this.difficulty),
        title,
        reward: marked ? `${reward}<br><span class="mark-warn">허수 표식: 틀리면 1턴 침묵</span>` : reward,
        unit: u,
      });
      if (this.over) return ok;
      if (marked) {
        u.buffs = u.buffs.filter((b) => b.kind !== 'mark');
        if (ok) this.log(`${u.name}의 허수 표식이 사라졌다.`);
        else this.addSilence(u, 1);
        this.io.update();
      }
      return ok;
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
        if (u.br.startShield) u.shield = Math.round(u.maxHp * u.br.startShield);
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
      const trait = u.def.trait;
      if (trait && trait.onTurnStart) {
        trait.onTurnStart(this, u);
        this.io.update();
      }
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
          if (this.sp < 1 || this.isSilenced(u)) continue;
          await this.useSkill(u);
        } else {
          await this.useAttack(u);
        }
        return;
      }
    }

    async useAttack(u) {
      this.log(`${u.name}의 일반 공격!`);
      this.dealDamage(u, this.getTarget(), 1.0 * u.br.attackMult);
      this.gainEnergy(u, MR.CONFIG.ENERGY.attack);
      this.io.update();
      if (this.checkEnd()) return;

      const ok = await this.askQuiz(u, {
        kind: 'addSub',
        title: `${u.name} · 일반 공격 퀴즈`,
        reward: '정답이면 스킬 포인트 +1',
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
      const ok = await this.askQuiz(u, {
        kind: u.def.quiz,
        title: `${u.name} · ${sk.name}`,
        reward: MR.describe(sk.bonusDesc, u.skillLevel),
      });
      if (this.over) return;
      this.log(`${u.name}의 고유 스킬 「${sk.name}」${ok ? ' (보너스 발동!)' : ''}`);
      this.powerUnit = u;
      sk.run(this, u, ok);
      this.powerUnit = null;
      this.gainEnergy(u, MR.CONFIG.ENERGY.skill);
      this.io.update();
      this.checkEnd();
    }

    async castUltimate(u) {
      const ult = u.def.ult;
      const spent = u.energy;
      u.energy = 0;
      this.io.update();
      await this.announce(u, ult.name, 'ult');
      ult.run(this, u);
      this.io.update();
      if (this.checkEnd()) return;

      const refund = Math.round(spent * (ult.refund + u.br.refundBonus));
      const ok = await this.askQuiz(u, {
        kind: u.def.quiz,
        title: `${u.name} · 에너지 회수 퀴즈`,
        reward: `정답이면 에너지 ${refund} 회복`,
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
      await u.def.act(this, u);
    }

    endTurn(u) {
      u.buffs = u.buffs
        .map((b) => (b.fresh ? { ...b, fresh: false } : { ...b, turns: b.turns - 1 }))
        .filter((b) => b.turns > 0);
    }
  }

  MR.Battle = Battle;
})((globalThis.MR = globalThis.MR || {}));
