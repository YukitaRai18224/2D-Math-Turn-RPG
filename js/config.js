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
    MAX_LEVEL: 60,
    GROWTH: { hp: 0.08, atk: 0.08, def: 0.06 }, // 레벨당 기본 스탯 대비 증가율
    LEVEL_UNLOCK_STAGE: '1-2',
    levelUpCost(level) {
      // level → level+1 에 필요한 경험치 물약 수
      return 1 + Math.floor(level / 3);
    },

    // 장비 강화
    EQUIP_UNLOCK_STAGE: '1-8',
    MAX_ENHANCE: 20,
    enhanceCost(level) {
      // +level → +level+1 에 필요한 강화석 수
      return 1 + Math.floor(level / 2);
    },
    stoneReward(stage) {
      // 장비가 열린 뒤 스테이지를 클리어할 때마다 받는 강화석 (반복 클리어도 같은 양)
      return 1 + Math.ceil(stage.reward / 2);
    },

    // 이미 클리어한 스테이지를 다시 클리어하면 물약 보상이 줄어든다 (최소 REPEAT_REWARD_MIN 개)
    REPEAT_REWARD_PENALTY: 4,
    REPEAT_REWARD_MIN: 1,

    // 치명타: 따로 정하지 않은 몬스터의 기본값 (캐릭터는 characters.js 의 crit)
    ENEMY_CRIT: { rate: 0.05, dmg: 1.5 },

    // 몬스터 스탯 = 기본 스탯 × (1 + ENEMY_SCALE × (스테이지 레벨 - 1))
    ENEMY_SCALE: 0.35,

    // 연출 속도 (ms)
    DELAY: { enemyAction: 650, afterAction: 350, quizCorrect: 1000, quizWrong: 1900, skillBanner: 1100 },
  };

  // 캐릭터 레벨에 따른 [고유 스킬 레벨, 궁극기 레벨]. 특성은 고유 스킬 레벨을 따른다.
  MR.CONFIG.SKILL_LEVEL_TABLE = [
    { at: 1, skill: 1, ult: 1 },
    { at: 11, skill: 1, ult: 2 },
    { at: 21, skill: 2, ult: 2 },
    { at: 31, skill: 2, ult: 3 },
    { at: 41, skill: 3, ult: 3 },
    { at: 51, skill: 4, ult: 3 },
    { at: 60, skill: 4, ult: 4 },
  ];
  const skillRow = (charLevel) => {
    let row = MR.CONFIG.SKILL_LEVEL_TABLE[0];
    for (const r of MR.CONFIG.SKILL_LEVEL_TABLE) if (charLevel >= r.at) row = r;
    return row;
  };
  MR.skillLevelFor = (charLevel) => skillRow(charLevel).skill;
  MR.ultLevelFor = (charLevel) => skillRow(charLevel).ult;
  // 다음에 스킬·궁극기 레벨이 바뀌는 캐릭터 레벨과 그때의 레벨 (최대면 null)
  MR.nextSkillChange = function (charLevel) {
    return MR.CONFIG.SKILL_LEVEL_TABLE.find((r) => r.at > charLevel) || null;
  };

  // 한계 돌파: 레벨 20 → 21, 40 → 41 로 올리려면 경험치 물약과 에메랄드로 한계를 풀어야 한다
  MR.CONFIG.LIMIT_BREAKS = [
    { at: 20, potions: 15, emerald: 50 },
    { at: 40, potions: 40, emerald: 150 },
  ];

  // 설명은 문자열이거나 스킬 레벨을 받는 함수
  MR.describe = function (text, skillLevel) {
    return typeof text === 'function' ? text(skillLevel || 1) : text;
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
