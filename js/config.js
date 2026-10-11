// 게임 전체에서 쓰는 밸런스 수치. 숫자를 조정할 때는 이 파일과 js/data/ 폴더만 고치면 된다.
(function (MR) {
  MR.CONFIG = {
    // 스킬 포인트 (파티 공용)
    SP_START: 3,
    SP_MAX: 5,

    // 에너지 획득량
    ENERGY: {
      start: 0.5, // 전투 시작 시 최대 에너지 대비 비율
      attack: 20, // 일반 공격 사용
      skill: 30, // 고유 스킬 사용
      hit: 10, // 피격 1회
    },

    // 피해 = 공격력 × 계수 × K / (K + 방어력)
    DEF_K: 300,

    // 레벨업
    MAX_LEVEL: 20,
    GROWTH: { hp: 0.08, atk: 0.08, def: 0.06 }, // 레벨당 기본 스탯 대비 증가율
    LEVEL_UNLOCK_STAGE: '1-2',
    levelUpCost(level) {
      // level → level+1 에 필요한 경험치 물약 수
      return 1 + Math.floor(level / 3);
    },

    // 몬스터 스탯 = 기본 스탯 × (1 + ENEMY_SCALE × (스테이지 레벨 - 1))
    ENEMY_SCALE: 0.35,

    // 연출 속도 (ms)
    DELAY: { enemyAction: 650, afterAction: 350, quizCorrect: 1000, quizWrong: 1900, skillBanner: 1100 },
  };

  MR.statsAtLevel = function (base, level) {
    const g = MR.CONFIG.GROWTH;
    const n = level - 1;
    return {
      hp: Math.round(base.hp * (1 + g.hp * n)),
      atk: Math.round(base.atk * (1 + g.atk * n)),
      def: Math.round(base.def * (1 + g.def * n)),
      spd: base.spd,
    };
  };
})((globalThis.MR = globalThis.MR || {}));
