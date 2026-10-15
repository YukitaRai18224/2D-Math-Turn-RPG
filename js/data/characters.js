// 플레이어블 캐릭터 정의.
// skill.run / ult.run 은 (battle, self, quizCorrect) 를 받는다. 대상은 battle.getTarget() 으로 얻는다.
// trait 훅: damageBonus(b, self, target, ctx) / healBonus(b, self, target) → 추가 비율, onBattleStart(b, self), onTurnStart(b, self)
// desc 는 문자열이거나 스킬 레벨(1~4)을 받는 함수. self.skillLevel 로 스킬 레벨을 읽는다.
// unlockStage 가 있는 캐릭터는 그 스테이지를 클리어하면 동료가 된다.
(function (MR) {
  // 전체 캐릭터 순서와 처음 출전 파티
  MR.CHARACTER_ORDER = ['kagari', 'aquamarine', 'pricia', 'hina', 'rafa'];
  MR.PARTY_ORDER = ['kagari', 'aquamarine', 'pricia', 'hina'];
  MR.PARTY_SIZE = 4;

  const pct = (x) => Math.round(x * 100);
  // 스킬 레벨(1~4)에 맞는 값
  const L = (arr, lv) => arr[Math.min(arr.length, Math.max(1, lv || 1)) - 1];

  MR.CHARACTERS = {
    kagari: {
      name: '카가리',
      role: '단일 딜러',
      color: '#e0464b',
      image: 'assets/characters/kagari.png',
      base: { hp: 1000, atk: 120, def: 50, spd: 105 },
      maxEnergy: 120,
      quiz: 'multiply',
      skill: {
        name: '홍련 베기',
        mult: [2.0, 2.2, 2.45, 2.7],
        bonus: 1.0, // 퀴즈 정답 시 더해지는 계수
        desc: (lv) => `선택한 적에게 공격력 ${pct(L(K.skill.mult, lv))}% 피해`,
        bonusDesc: (lv) => `정답이면 피해가 ${pct(L(K.skill.mult, lv) + K.skill.bonus)}%로 증가`,
        run(b, self, ok) {
          b.dealDamage(self, b.getTarget(), L(this.mult, self.skillLevel) + (ok ? this.bonus : 0));
        },
      },
      ult: {
        name: '진홍의 일섬',
        mult: [4.5, 4.9, 5.4, 6.0],
        refund: 0.3,
        desc: (lv) => `선택한 적에게 공격력 ${pct(L(K.ult.mult, lv))}% 피해`,
        run(b, self) {
          b.dealDamage(self, b.getTarget(), L(this.mult, self.skillLevel));
        },
      },
      trait: {
        name: '마무리 일격',
        bonus: [0.25, 0.28, 0.32, 0.36],
        desc: (lv) => `체력이 50% 이하인 적에게 주는 피해 +${pct(L(K.trait.bonus, lv))}%`,
        damageBonus(b, self, target) {
          return target.hp / target.maxHp <= 0.5 ? L(this.bonus, self.skillLevel) : 0;
        },
      },
    },

    aquamarine: {
      name: '아쿠아마린',
      role: '광역 딜러',
      color: '#3a6fd8',
      image: 'assets/characters/aquamarine.png',
      base: { hp: 950, atk: 100, def: 45, spd: 100 },
      maxEnergy: 120,
      quiz: 'fraction',
      skill: {
        name: '물보라',
        mult: [1.1, 1.2, 1.32, 1.45],
        defDown: [0.3, 0.3, 0.35, 0.4],
        desc: (lv) => `모든 적에게 공격력 ${pct(L(A.skill.mult, lv))}% 피해`,
        bonusDesc: (lv) => `정답이면 먼저 모든 적의 방어력을 ${pct(L(A.skill.defDown, lv))}% 낮춤 (2턴)`,
        run(b, self, ok) {
          if (ok) {
            const down = L(this.defDown, self.skillLevel);
            for (const e of b.aliveEnemies()) {
              b.addBuff(e, { id: 'aqua_skill', stat: 'def', pct: -down, turns: 2, label: '방어력' });
            }
          }
          b.hitAll(self, L(this.mult, self.skillLevel));
        },
      },
      ult: {
        name: '해일',
        mult: [2.5, 2.75, 3.0, 3.3],
        refund: 0.3,
        desc: (lv) => `모든 적에게 공격력 ${pct(L(A.ult.mult, lv))}% 피해`,
        run(b, self) {
          b.hitAll(self, L(this.mult, self.skillLevel));
        },
      },
      trait: {
        name: '파도의 리듬',
        bonus: [0.2, 0.22, 0.25, 0.28],
        desc: (lv) => `3명 이상의 적을 동시에 공격하면 피해 +${pct(L(A.trait.bonus, lv))}%`,
        damageBonus(b, self, target, ctx) {
          return (ctx.targetCount || 1) >= 3 ? L(this.bonus, self.skillLevel) : 0;
        },
      },
    },

    pricia: {
      name: '프리시아',
      role: '힐러',
      color: '#3f9b4c',
      image: 'assets/characters/pricia.png',
      base: { hp: 1100, atk: 90, def: 55, spd: 95 },
      maxEnergy: 100,
      quiz: 'division',
      skill: {
        name: '꽃바구니',
        mult: [2.5, 2.75, 3.0, 3.3],
        others: [1.0, 1.1, 1.2, 1.35],
        desc: (lv) => `체력 비율이 가장 낮은 아군을 공격력 ${pct(L(P.skill.mult, lv))}%만큼 회복`,
        bonusDesc: (lv) => `정답이면 나머지 아군도 공격력 ${pct(L(P.skill.others, lv))}%만큼 회복`,
        run(b, self, ok) {
          const main = b.lowestHpAlly();
          b.heal(self, main, L(this.mult, self.skillLevel));
          if (ok) {
            for (const a of b.aliveAllies()) if (a !== main) b.heal(self, a, L(this.others, self.skillLevel));
          }
        },
      },
      ult: {
        name: '봄의 정원',
        mult: [3.0, 3.3, 3.6, 4.0],
        refund: 0.3,
        desc: (lv) => `모든 아군을 공격력 ${pct(L(P.ult.mult, lv))}%만큼 회복`,
        run(b, self) {
          for (const a of b.aliveAllies()) b.heal(self, a, L(this.mult, self.skillLevel));
        },
      },
      trait: {
        name: '응급 처치',
        bonus: [0.3, 0.35, 0.4, 0.45],
        desc: (lv) => `체력이 30% 이하인 아군을 회복할 때 회복량 +${pct(L(P.trait.bonus, lv))}%`,
        healBonus(b, self, target) {
          return target.hp / target.maxHp <= 0.3 ? L(this.bonus, self.skillLevel) : 0;
        },
      },
    },

    hina: {
      name: '히나',
      role: '서포터',
      color: '#e0a21b',
      image: 'assets/characters/hina.png',
      base: { hp: 1000, atk: 95, def: 50, spd: 110 },
      maxEnergy: 100,
      quiz: 'geometry',
      skill: {
        name: '해바라기 응원',
        buff: [0.2, 0.22, 0.25, 0.28],
        bonusBuff: [0.35, 0.38, 0.42, 0.46],
        desc: (lv) => `모든 아군의 공격력 +${pct(L(H.skill.buff, lv))}% (2턴)`,
        bonusDesc: (lv) => `정답이면 공격력 증가량이 +${pct(L(H.skill.bonusBuff, lv))}%로 상승`,
        run(b, self, ok) {
          const v = L(ok ? this.bonusBuff : this.buff, self.skillLevel);
          for (const a of b.aliveAllies()) {
            b.addBuff(a, { id: 'hina_skill', stat: 'atk', pct: v, turns: 2, label: '공격력' });
          }
        },
      },
      ult: {
        name: '한여름의 햇살',
        buff: [0.4, 0.43, 0.47, 0.52],
        sp: [1, 1, 1, 2],
        desc: (lv) => `모든 아군의 공격력 +${pct(L(H.ult.buff, lv))}% (3턴), 스킬 포인트 +${L(H.ult.sp, lv)}`,
        refund: 0.3,
        run(b, self) {
          for (const a of b.aliveAllies()) {
            b.addBuff(a, { id: 'hina_ult', stat: 'atk', pct: L(this.buff, self.skillLevel), turns: 3, label: '공격력' });
          }
          b.gainSp(L(this.sp, self.skillLevel));
        },
      },
      trait: {
        name: '준비성',
        sp: [1, 1, 1, 2],
        desc: (lv) => `전투 시작 시 스킬 포인트 +${L(H.trait.sp, lv)}`,
        onBattleStart(b, self) {
          b.gainSp(L(this.sp, self.skillLevel));
        },
      },
    },

    // 1-12 보스였던 허수의 대마녀. 쓰러뜨리면 동료가 된다.
    rafa: {
      name: '라파',
      title: '허수의 대마녀',
      role: '표식 딜러',
      color: '#b8892b',
      image: 'assets/characters/rafa.png',
      unlockStage: '1-12',
      base: { hp: 1050, atk: 80, def: 45, spd: 95 },
      maxEnergy: 120,
      quiz: 'stats',
      // 허수 표식: 표식이 있는 적이 최대 체력 10%를 넘는 피해를 받으면 터진다
      mark: { atk: [4, 6.5, 9, 12], hp: [0.15, 0.3, 0.4, 0.5], maxStacks: 4, turns: 2, threshold: 0.1 },
      skill: {
        name: '소멸 광선',
        mult: [2.0, 3.0, 4.5, 5.5],
        hits: 4,
        desc(lv) {
          const m = MR.CHARACTERS.rafa.mark;
          return `무작위 적에게 4회 공격력 ${pct(MR.CHARACTERS.rafa.skill.mult[lv - 1])}% 피해 (첫 공격은 선택한 적), 맞은 적에게 허수 표식 부여 ` +
            `(최대 ${m.maxStacks}중첩, ${m.turns}턴). 표식: 최대 체력 10%를 넘는 피해를 받으면 라파 공격력 ${pct(m.atk[lv - 1])}% + ` +
            `라파 최대 체력 ${pct(m.hp[lv - 1])}% 추가 피해 (1중첩 소모, 다시 부여되기 전까지 같은 캐릭터의 공격으로는 터지지 않음)`;
        },
        bonusDesc: '정답이면 공격 횟수가 5회로 증가',
        run(b, self, ok) {
          const mult = this.mult[self.skillLevel - 1];
          const hits = this.hits + (ok ? 1 : 0);
          for (let i = 0; i < hits; i++) {
            const alive = b.aliveEnemies();
            if (!alive.length) break;
            // 첫 공격은 선택한 적에게, 나머지는 무작위
            const t = i === 0 ? b.getTarget() : alive[Math.floor(Math.random() * alive.length)];
            b.dealDamage(self, t, mult);
            b.applyImagMark(self, t);
          }
        },
      },
      ult: {
        name: '시공간 왜곡',
        mult: [5, 5, 8, 11],
        refund: 0.3,
        desc(lv) {
          return `선택한 적에게 공격력 ${pct(MR.CHARACTERS.rafa.ult.mult[lv - 1])}% 피해, 1턴 침묵` +
            (lv >= 2 ? '. 침묵이 걸리면 이어서 모든 적에게 공격력 150% 피해, 준 피해만큼 자신에게 실드' : ' (스킬 2레벨: 모든 적 공격 + 실드 추가)');
        },
        run(b, self) {
          const t = b.getTarget();
          b.dealDamage(self, t, this.mult[self.skillLevel - 1]);
          b.addSilence(t, 1);
          if (self.skillLevel >= 2 && t.alive && b.isSilenced(t)) {
            const total = b.hitAll(self, 1.5);
            b.addShield(self, total);
          }
        },
      },
      trait: {
        name: '허수의 저주',
        desc: '자신의 턴이 시작될 때 현재 체력의 7% 피해를 입고, 속도가 110 이하면 그 턴 동안 공격력 +25%',
        onTurnStart(b, self) {
          b.selfDamage(self, Math.floor(self.hp * 0.07));
          if (self.spd <= 110) b.addBuff(self, { id: 'imag_curse', stat: 'atk', pct: 0.25, turns: 1, label: '공격력' });
        },
      },
    },
  };

  // 설명 함수에서 쓰는 짧은 이름
  const K = MR.CHARACTERS.kagari;
  const A = MR.CHARACTERS.aquamarine;
  const P = MR.CHARACTERS.pricia;
  const H = MR.CHARACTERS.hina;
})((globalThis.MR = globalThis.MR || {}));
