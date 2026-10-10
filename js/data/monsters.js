// 몬스터 정의. act(battle, self) 가 한 턴의 행동이다.
(function (MR) {
  MR.MONSTERS = {
    slime: {
      name: '슬라임',
      desc: '매 턴 무작위 아군 2명에게 공격력 100% 피해',
      look: 'slime',
      base: { hp: 500, atk: 95, def: 25, spd: 90 },
      act(b, self) {
        const targets = b.randomAllies(2);
        b.log(`${self.name}이(가) 몸통 박치기를 했다!`);
        for (const t of targets) b.dealDamage(self, t, 1.0);
      },
    },

    armorSlime: {
      name: '갑옷 슬라임',
      desc: '무작위 아군 1명에게 공격력 100% 피해. 체력과 방어력이 높다',
      look: 'armor',
      base: { hp: 1100, atk: 110, def: 100, spd: 80 },
      act(b, self) {
        const [t] = b.randomAllies(1);
        b.log(`${self.name}이(가) 공격했다!`);
        if (t) b.dealDamage(self, t, 1.0);
      },
    },
  };
})((globalThis.MR = globalThis.MR || {}));
