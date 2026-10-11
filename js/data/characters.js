// 플레이어블 캐릭터 정의.
// skill.run / ult.run 은 (battle, self, quizCorrect) 를 받는다. 대상은 battle.getTarget() 으로 얻는다.
// trait 훅: damageBonus(b, self, target, ctx) / healBonus(b, self, target) → 추가 비율, onBattleStart(b, self)
(function (MR) {
  MR.PARTY_ORDER = ['kagari', 'aquamarine', 'pricia', 'hina'];

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
        desc: '선택한 적에게 공격력 200% 피해',
        bonusDesc: '정답이면 피해가 300%로 증가',
        run(b, self, ok) {
          b.dealDamage(self, b.getTarget(), ok ? 3.0 : 2.0);
        },
      },
      ult: {
        name: '진홍의 일섬',
        desc: '선택한 적에게 공격력 450% 피해',
        refund: 0.3,
        run(b, self) {
          b.dealDamage(self, b.getTarget(), 4.5);
        },
      },
      trait: {
        name: '마무리 일격',
        desc: '체력이 50% 이하인 적에게 주는 피해 +25%',
        damageBonus(b, self, target) {
          return target.hp / target.maxHp <= 0.5 ? 0.25 : 0;
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
        desc: '모든 적에게 공격력 110% 피해',
        bonusDesc: '정답이면 먼저 모든 적의 방어력을 30% 낮춤 (2턴)',
        run(b, self, ok) {
          if (ok) {
            for (const e of b.aliveEnemies()) {
              b.addBuff(e, { id: 'aqua_skill', stat: 'def', pct: -0.3, turns: 2, label: '방어력' });
            }
          }
          b.hitAll(self, 1.1);
        },
      },
      ult: {
        name: '해일',
        desc: '모든 적에게 공격력 250% 피해',
        refund: 0.3,
        run(b, self) {
          b.hitAll(self, 2.5);
        },
      },
      trait: {
        name: '파도의 리듬',
        desc: '3명 이상의 적을 동시에 공격하면 피해 +20%',
        damageBonus(b, self, target, ctx) {
          return (ctx.targetCount || 1) >= 3 ? 0.2 : 0;
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
        desc: '체력 비율이 가장 낮은 아군을 공격력 250%만큼 회복',
        bonusDesc: '정답이면 나머지 아군도 공격력 100%만큼 회복',
        run(b, self, ok) {
          const main = b.lowestHpAlly();
          b.heal(self, main, 2.5);
          if (ok) {
            for (const a of b.aliveAllies()) if (a !== main) b.heal(self, a, 1.0);
          }
        },
      },
      ult: {
        name: '봄의 정원',
        desc: '모든 아군을 공격력 300%만큼 회복',
        refund: 0.3,
        run(b, self) {
          for (const a of b.aliveAllies()) b.heal(self, a, 3.0);
        },
      },
      trait: {
        name: '응급 처치',
        desc: '체력이 30% 이하인 아군을 회복할 때 회복량 +30%',
        healBonus(b, self, target) {
          return target.hp / target.maxHp <= 0.3 ? 0.3 : 0;
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
        desc: '모든 아군의 공격력 +20% (2턴)',
        bonusDesc: '정답이면 공격력 증가량이 +35%로 상승',
        run(b, self, ok) {
          for (const a of b.aliveAllies()) {
            b.addBuff(a, { id: 'hina_skill', stat: 'atk', pct: ok ? 0.35 : 0.2, turns: 2, label: '공격력' });
          }
        },
      },
      ult: {
        name: '한여름의 햇살',
        desc: '모든 아군의 공격력 +40% (3턴), 스킬 포인트 +1',
        refund: 0.3,
        run(b, self) {
          for (const a of b.aliveAllies()) {
            b.addBuff(a, { id: 'hina_ult', stat: 'atk', pct: 0.4, turns: 3, label: '공격력' });
          }
          b.gainSp(1);
        },
      },
      trait: {
        name: '준비성',
        desc: '전투 시작 시 스킬 포인트 +1',
        onBattleStart(b) {
          b.gainSp(1);
        },
      },
    },
  };
})((globalThis.MR = globalThis.MR || {}));
