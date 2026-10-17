// 스테이지 목록. level 은 몬스터 강화 단계, reward 는 클리어 시 얻는 경험치 물약 수.
// 스테이지 id 의 앞자리가 챕터 번호다 (2-16 → 챕터 2).
(function (MR) {
  const S = 'slime';
  const A = 'armorSlime';

  const R = 'rafa';
  const V = 'vigenere';

  MR.CHAPTERS = [
    { id: 1, name: '슬라임 평원' },
    { id: 2, name: '암호의 탑' },
    { id: 3, name: '암호의 탑 꼭대기' },
  ];

  MR.STAGES = [
    { id: '1-1', level: 1, enemies: [S], reward: 3 },
    { id: '1-2', level: 1, enemies: [S, S], reward: 3 },
    { id: '1-3', level: 2, enemies: [S, A], reward: 4 },
    { id: '1-4', level: 3, enemies: [S, S, S], reward: 4 },
    { id: '1-5', level: 4, enemies: [A, A], reward: 5 },
    { id: '1-6', level: 5, enemies: [S, A, S], reward: 5 },
    { id: '1-7', level: 6, enemies: [S, S, S, S], reward: 6 },
    { id: '1-8', level: 7, enemies: [A, S, A], reward: 6 },
    { id: '1-9', level: 8, enemies: [S, A, S, S], reward: 7 },
    { id: '1-10', level: 9, enemies: [A, A, S], reward: 7 },
    { id: '1-11', level: 10, enemies: [A, S, A, S], reward: 8 },
    { id: '1-12', level: 10, enemies: [S, R, S], reward: 10, boss: true },

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

    { id: '3-1', level: 19, enemies: [S, S, S], reward: 15 },
    { id: '3-2', level: 20, enemies: [A, S, A], reward: 15 },
    { id: '3-3', level: 20, enemies: [S, S, S, S], reward: 16 },
    { id: '3-4', level: 21, enemies: [A, A, S], reward: 16 },
    { id: '3-5', level: 22, enemies: [S, A, S, A], reward: 17 },
    { id: '3-6', level: 22, enemies: [A, S, A], reward: 17 },
    { id: '3-7', level: 23, enemies: [S, S, A, S], reward: 18 },
    { id: '3-8', level: 24, enemies: [A, S, A, S], reward: 18 },
    { id: '3-9', level: 24, enemies: [S, S, S, S], reward: 19 },
    { id: '3-10', level: 25, enemies: [A, A, S, S], reward: 20 },
    { id: '3-11', level: 26, enemies: [A, S, A], reward: 20 },
    { id: '3-12', level: 26, enemies: [A, A, S, S], reward: 21 },
    { id: '3-13', level: 27, enemies: [S, A, S, A], reward: 22 },
    { id: '3-14', level: 28, enemies: [A, S, A, S], reward: 22 },
    { id: '3-15', level: 28, enemies: [S, S, A, A], reward: 23 },
    { id: '3-16', level: 29, enemies: [A, S, A, S], reward: 24 },
    { id: '3-17', level: 30, enemies: [A, S, S, A], reward: 25 },
    { id: '3-18', level: 31, enemies: [A, A, S, S], reward: 26 },
    { id: '3-19', level: 32, enemies: [A, S, A, S], reward: 28 },
    { id: '3-20', level: 32, enemies: [S, V, S], reward: 50, boss: true },
  ];
})((globalThis.MR = globalThis.MR || {}));
