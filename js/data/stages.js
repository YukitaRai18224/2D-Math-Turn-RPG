// 스테이지 목록. level 은 몬스터 강화 단계, reward 는 클리어 시 얻는 경험치 물약 수.
// 스테이지 id 의 앞자리가 챕터 번호다 (2-16 → 챕터 2). mods 는 그 스테이지 몬스터의 능력치 배율 (보스 제외).
(function (MR) {
  const S = 'slime';
  const A = 'armorSlime';

  const G = 'ghost';
  // 챕터 4: 높은 레벨에서 방어력이 너무 커져 전투가 길어지지 않도록, 방어력은 낮추고 공격력은 높인다
  const CH4 = { atk: 1.6, def: 0.5 };
  const R = 'rafa';
  const V = 'vigenere';

  MR.CHAPTERS = [
    { id: 1, name: '슬라임 평원' },
    { id: 2, name: '암호의 탑' },
    { id: 3, name: '암호의 탑 꼭대기' },
    { id: 4, name: '악령의 회랑' },
  ];

  MR.STAGES = [
    { id: '1-1', level: 1, enemies: [S], reward: 3 },
    { id: '1-2', level: 1, enemies: [S, S], reward: 3 },
    { id: '1-3', level: 2, enemies: [S, A], reward: 4 },
    { id: '1-4', level: 3, enemies: [S, S, S], reward: 4 },
    { id: '1-5', level: 4, enemies: [A, A], reward: 5 },
    { id: '1-6', level: 5, enemies: [S, A, S], reward: 5 },
    { id: '1-7', level: 6, enemies: [S, S, S, S], reward: 6 },
    { id: '1-8', level: 6, enemies: [A, S, A], reward: 6 },
    { id: '1-9', level: 6, enemies: [S, A, S, S], reward: 7 },
    { id: '1-10', level: 7, enemies: [A, A, S], reward: 7 },
    { id: '1-11', level: 8, enemies: [A, S, A, S], reward: 8 },
    { id: '1-12', level: 8, enemies: [S, R, S], reward: 10, boss: true },

    { id: '2-1', level: 12, enemies: [S, S, S], reward: 8 },
    { id: '2-2', level: 12, enemies: [A, S, A], reward: 8 },
    { id: '2-3', level: 13, enemies: [S, S, S, S], reward: 9 },
    { id: '2-4', level: 13, enemies: [A, A], reward: 9 },
    { id: '2-5', level: 13, enemies: [S, A, S, A], reward: 9 },
    { id: '2-6', level: 14, enemies: [S, S, A], reward: 10 },
    { id: '2-7', level: 14, enemies: [A, A, A], reward: 10 },
    { id: '2-8', level: 14, enemies: [S, A, S, S], reward: 10 },
    { id: '2-9', level: 15, enemies: [S, S, S, S], reward: 11 },
    { id: '2-10', level: 15, enemies: [A, S, A, S], reward: 11 },
    { id: '2-11', level: 15, enemies: [A, A, A, S], reward: 12 },
    { id: '2-12', level: 16, enemies: [S, A, S, A], reward: 12 },
    { id: '2-13', level: 16, enemies: [A, A, S, S], reward: 13 },
    { id: '2-14', level: 16, enemies: [A, A, A, A], reward: 13 },
    { id: '2-15', level: 17, enemies: [A, S, A, S], reward: 14 },
    { id: '2-16', level: 17, enemies: [A, A, S, A], reward: 16 },

    { id: '3-1', level: 19, enemies: [G, S, G], reward: 15 },
    { id: '3-2', level: 20, enemies: [A, G, A], reward: 15 },
    { id: '3-3', level: 20, enemies: [S, G, S, G], reward: 16 },
    { id: '3-4', level: 21, enemies: [A, A, G], reward: 16 },
    { id: '3-5', level: 22, enemies: [G, A, G, A], reward: 17 },
    { id: '3-6', level: 22, enemies: [A, G, A], reward: 17 },
    { id: '3-7', level: 23, enemies: [G, S, A, G], reward: 18 },
    { id: '3-8', level: 24, enemies: [A, G, A, S], reward: 18 },
    { id: '3-9', level: 24, enemies: [G, G, G, G], reward: 19 },
    { id: '3-10', level: 25, enemies: [A, A, G, S], reward: 20 },
    { id: '3-11', level: 26, enemies: [A, G, A], reward: 20 },
    { id: '3-12', level: 26, enemies: [A, G, S, A], reward: 21 },
    { id: '3-13', level: 27, enemies: [G, A, G, A], reward: 22 },
    { id: '3-14', level: 28, enemies: [A, G, A, G], reward: 22 },
    { id: '3-15', level: 28, enemies: [G, S, A, A], reward: 23 },
    { id: '3-16', level: 29, enemies: [A, G, A, G], reward: 24 },
    { id: '3-17', level: 30, enemies: [A, G, G, A], reward: 25 },
    { id: '3-18', level: 31, enemies: [A, A, G, G], reward: 26 },
    { id: '3-19', level: 32, enemies: [A, G, A, G], reward: 28 },
    { id: '3-20', level: 32, enemies: [G, V, G], reward: 50, boss: true },

    { id: '4-1', level: 31, enemies: [G, S, G], reward: 30, mods: CH4 },
    { id: '4-2', level: 31, enemies: [A, G, A], reward: 30, mods: CH4 },
    { id: '4-3', level: 32, enemies: [G, G, S, G], reward: 31, mods: CH4 },
    { id: '4-4', level: 32, enemies: [A, S, A, G], reward: 31, mods: CH4 },
    { id: '4-5', level: 33, enemies: [G, A, G], reward: 32, mods: CH4 },
    { id: '4-6', level: 33, enemies: [A, A, G, G], reward: 33, mods: CH4 },
    { id: '4-7', level: 34, enemies: [S, G, A, G], reward: 33, mods: CH4 },
    { id: '4-8', level: 35, enemies: [A, G, A, S], reward: 34, mods: CH4 },
    { id: '4-9', level: 35, enemies: [G, G, G, G], reward: 35, mods: CH4 },
    { id: '4-10', level: 36, enemies: [A, G, G, A], reward: 35, mods: CH4 },
    { id: '4-11', level: 37, enemies: [G, A, S, A], reward: 36, mods: CH4 },
    { id: '4-12', level: 37, enemies: [A, A, G, S], reward: 37, mods: CH4 },
    { id: '4-13', level: 38, enemies: [G, S, G, A], reward: 38, mods: CH4 },
    { id: '4-14', level: 39, enemies: [A, G, A, G], reward: 38, mods: CH4 },
    { id: '4-15', level: 39, enemies: [G, G, A, A], reward: 39, mods: CH4 },
    { id: '4-16', level: 40, enemies: [A, S, G, A], reward: 40, mods: CH4 },
    { id: '4-17', level: 41, enemies: [G, A, G, G], reward: 41, mods: CH4 },
    { id: '4-18', level: 42, enemies: [A, A, G, A], reward: 42, mods: CH4 },
    { id: '4-19', level: 43, enemies: [G, G, S, A], reward: 43, mods: CH4 },
    { id: '4-20', level: 43, enemies: [A, G, A, G], reward: 44, mods: CH4 },
    { id: '4-21', level: 44, enemies: [G, A, A, G], reward: 45, mods: CH4 },
    { id: '4-22', level: 45, enemies: [A, A, G, G], reward: 46, mods: CH4 },
    { id: '4-23', level: 46, enemies: [G, G, A, G], reward: 48, mods: CH4 },
    { id: '4-24', level: 47, enemies: [A, G, A, G], reward: 52, mods: CH4 },
  ];
})((globalThis.MR = globalThis.MR || {}));
