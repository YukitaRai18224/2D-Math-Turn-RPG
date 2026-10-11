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

    // 2-16 보스. 이름은 비즈네르 암호(Vigenère cipher)에서 따왔다.
    vigenere: {
      name: '암호의 대마녀 비즈네르',
      desc: '홀수 번째 턴마다 「암호화 치환」, 체력이 낮아지면 「복호화 엔진」으로 회복',
      look: 'witch',
      boss: true,
      color: '#7b3fd0',
      fixedStats: true, // 스테이지 레벨 강화를 받지 않는 고정 스탯
      base: { hp: 12000, atk: 1300, def: 250, spd: 100 },
      skills: {
        cipher: { name: '암호화 치환', desc: '모든 아군에게 공격력 80% 피해' },
        decrypt: { name: '복호화 엔진', desc: '자신의 최대 체력 15% 회복 (체력 50% 이하일 때, 4턴마다 1회)' },
        bolt: { name: '암호 탄환', desc: '무작위 아군 1명에게 공격력 130% 피해' },
      },
      async act(b, self) {
        const m = self.mem;
        m.turn = (m.turn || 0) + 1;
        m.healCooldown = Math.max(0, (m.healCooldown || 0) - 1);
        const sk = this.skills;

        if (self.hp / self.maxHp <= 0.5 && m.healCooldown === 0) {
          m.healCooldown = 4;
          await b.announce(self, sk.decrypt.name, 'decrypt');
          b.healMaxHp(self, 0.15);
        } else if (m.turn % 2 === 1) {
          await b.announce(self, sk.cipher.name, 'cipher');
          b.hitAll(self, 0.8);
        } else {
          const [t] = b.randomAllies(1);
          b.log(`${self.name}의 ${sk.bolt.name}!`);
          if (t) b.dealDamage(self, t, 1.3);
        }
      },
    },
  };
})((globalThis.MR = globalThis.MR || {}));
