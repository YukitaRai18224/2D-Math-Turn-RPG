// 캐릭터 돌파와 뽑기, 보석 재화.
// 돌파: 같은 캐릭터(뽑기에서 겹친 캐릭터)를 재료로 써서 최대 6돌파까지 올린다.
//   1~4돌파는 재료 1개, 5~6돌파는 재료 2개. 돌파할 때마다 능력치가 오르고 추가 효과가 생긴다.
(function (MR) {
  MR.BREAKTHROUGH = {
    max: 6,
    costs: [1, 1, 1, 1, 2, 2], // n돌파에 필요한 재료 수 (index = n - 1)
    statPct: 0.06, // 돌파 1단계마다 체력·공격력·방어력 +6% (최종 능력치 기준)
    // 돌파 단계에 도달하면 얻는 추가 효과 (누적)
    effects: [
      { name: '선제 충전', desc: '전투 시작 시 에너지 +20' },
      { name: '빠른 회수', desc: '궁극기 에너지 회수 퀴즈 정답 시 회수량 +15%p' },
      { name: '단단한 마음', desc: '받는 피해 -8%' },
      { name: '기본기 연마', desc: '일반 공격 피해 +30%' },
      { name: '숙련', desc: '고유 스킬의 피해·회복량 +15%' },
      { name: '수호의 빛', desc: '전투 시작 시 최대 체력 20%만큼 실드' },
    ],
  };

  // 돌파 단계에 따른 전투 보정값
  MR.breakthroughBonus = function (level) {
    const lv = level || 0;
    return {
      statMult: 1 + MR.BREAKTHROUGH.statPct * lv,
      startEnergy: lv >= 1 ? 20 : 0,
      refundBonus: lv >= 2 ? 0.15 : 0,
      damageTaken: lv >= 3 ? 0.92 : 1,
      attackMult: lv >= 4 ? 1.3 : 1,
      skillPower: lv >= 5 ? 1.15 : 1,
      startShield: lv >= 6 ? 0.2 : 0,
    };
  };

  // 보석 재화: 루비는 캐릭터 뽑기, 사파이어·에메랄드는 사용처 추가 예정
  MR.GEMS = [
    { id: 'ruby', name: '루비' },
    { id: 'sapphire', name: '사파이어' },
    { id: 'emerald', name: '에메랄드' },
  ];

  // 스테이지 최초 클리어 보상 (챕터가 올라갈수록 많고, 보스는 3배)
  MR.gemReward = function (stage) {
    const ch = Number(stage.id.split('-')[0]);
    const k = stage.boss ? 3 : 1;
    return {
      ruby: (30 + 10 * (ch - 1)) * k,
      sapphire: (10 + 5 * (ch - 1)) * k,
      emerald: (5 + 5 * (ch - 1)) * k,
    };
  };

  MR.GACHA = {
    cost: 100, // 1회 뽑기 루비
    cost10: 900, // 10회 뽑기 루비 (1회 무료)
    // 뽑기에 나오는 캐릭터 (모두 같은 확률)
    pool: () => MR.CHARACTER_ORDER,
  };
})((globalThis.MR = globalThis.MR || {}));
