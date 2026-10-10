// 스테이지 목록. level 은 몬스터 강화 단계, reward 는 클리어 시 얻는 경험치 물약 수.
(function (MR) {
  const S = 'slime';
  const A = 'armorSlime';

  MR.CHAPTERS = [{ id: 1, name: '슬라임 평원' }];

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
    { id: '1-12', level: 11, enemies: [A, A, A, S], reward: 10 },
  ];
})((globalThis.MR = globalThis.MR || {}));
