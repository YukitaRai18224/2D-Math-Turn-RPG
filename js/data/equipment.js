// 장비 정의. 캐릭터마다 5부위에 장비를 하나씩 끼고 있고(처음엔 +0), 강화석으로 강화한다.
// 부위별 능력치 = base + perLevel × 강화 단계
(function (MR) {
  MR.EQUIP_SLOTS = [
    { id: 'weapon', name: '무기', icon: '⚔️', stat: 'atk', statName: '공격력', base: 8, perLevel: 4 },
    { id: 'hat', name: '모자', icon: '🎩', stat: 'def', statName: '방어력', base: 3, perLevel: 2 },
    { id: 'top', name: '상의', icon: '👕', stat: 'hp', statName: '체력', base: 40, perLevel: 25 },
    { id: 'bottom', name: '하의', icon: '👖', stat: 'def', statName: '방어력', base: 3, perLevel: 2 },
    { id: 'shoes', name: '신발', icon: '👟', stat: 'spd', statName: '속도', base: 1, perLevel: 1 },
  ];

  // 캐릭터별 장비 이름
  MR.EQUIP_NAMES = {
    kagari: { weapon: '홍련검', hat: '진홍 머리띠', top: '기사의 흉갑', bottom: '기사의 치마', shoes: '철갑 장화' },
    aquamarine: { weapon: '물결 지팡이', hat: '물방울 머리핀', top: '심해 원피스', bottom: '파도 레깅스', shoes: '조개 구두' },
    pricia: { weapon: '정원사의 지팡이', hat: '밀짚모자', top: '꽃무늬 앞치마', bottom: '들판 치마', shoes: '흙길 부츠' },
    hina: { weapon: '해바라기 부채', hat: '하늘색 리본', top: '여름 셔츠', bottom: '면 바지', shoes: '햇살 운동화' },
    rafa: { weapon: '허수의 열쇠 지팡이', hat: '은빛 머리장식', top: '태엽 코르셋', bottom: '은사 치마', shoes: '자동인형 구두' },
  };

  // 장비 등급. mult 는 무기·모자·상의·하의 능력치 배율, spdMult 는 신발(속도) 배율.
  // 치명타 보너스는 무기에만 붙는다. salvage 는 겹친 장비를 분해할 때 받는 강화석
  MR.WEAPON_GRADES = [
    { id: 'common', name: 'Common', ko: '일반', color: '#b8c2d6', mult: 1.0, spdMult: 1.0, crit: 0, critDmg: 0, salvage: 1 },
    { id: 'uncommon', name: 'Uncommon', ko: '고급', color: '#2bff88', mult: 1.3, spdMult: 1.15, crit: 0, critDmg: 0, salvage: 2 },
    { id: 'rare', name: 'Rare', ko: '희귀', color: '#2f9bff', mult: 1.7, spdMult: 1.3, crit: 0.03, critDmg: 0, salvage: 4 },
    { id: 'epic', name: 'Epic', ko: '영웅', color: '#b46bff', mult: 2.2, spdMult: 1.5, crit: 0.06, critDmg: 0.15, salvage: 8 },
    { id: 'legendary', name: 'Legendary', ko: '전설', color: '#ffb22e', mult: 3.0, spdMult: 1.5, crit: 0.1, critDmg: 0.3, salvage: 15 },
  ];
  MR.GEAR_GRADES = MR.WEAPON_GRADES;
  // 방어구(모자·상의·하의·신발)는 Epic 까지
  MR.ARMOR_MAX_GRADE = 3;
  MR.ARMOR_SLOTS = ['hat', 'top', 'bottom', 'shoes'];

  // 스테이지 클리어 시 무기 등급 확률(%) — 챕터별. 보스 스테이지는 다음 챕터의 확률을 쓴다
  MR.WEAPON_DROP = {
    1: [60, 30, 9, 1, 0],
    2: [45, 35, 15, 4.5, 0.5],
    3: [30, 38, 22, 8, 2],
    4: [20, 35, 28, 13, 4],
    5: [12, 30, 32, 18, 8],
  };

  MR.weaponDropTable = function (stage) {
    const ch = Number(stage.id.split('-')[0]) + (stage.boss ? 1 : 0);
    const keys = Object.keys(MR.WEAPON_DROP).map(Number);
    return MR.WEAPON_DROP[Math.min(ch, Math.max(...keys))];
  };

  // 등급 뽑기. 방어구는 Epic 을 넘지 않는다 (Legendary 가 나오면 Epic)
  MR.rollGearGrade = function (stage, slotId) {
    const table = MR.weaponDropTable(stage);
    let r = Math.random() * table.reduce((a, b) => a + b, 0);
    let grade = 0;
    for (let i = 0; i < table.length; i++) {
      r -= table[i];
      if (r < 0) { grade = i; break; }
    }
    return slotId && slotId !== 'weapon' ? Math.min(grade, MR.ARMOR_MAX_GRADE) : grade;
  };
  MR.rollWeaponGrade = (stage) => MR.rollGearGrade(stage, 'weapon');

  MR.gradeMult = function (slotId, grade) {
    const g = MR.WEAPON_GRADES[grade || 0];
    return slotId === 'shoes' ? g.spdMult : g.mult;
  };

  MR.equipValue = function (slot, level, grade) {
    return Math.round((slot.base + slot.perLevel * level) * MR.gradeMult(slot.id, grade));
  };

  // levels: { weapon: 3, hat: 0, ... }, grades: { weapon: 2, hat: 1, ... } 등급 번호
  // → { hp, atk, def, spd, crit, critDmg } 추가 능력치 (치명타는 무기 등급에서만)
  MR.equipBonus = function (levels, grades) {
    const gs = typeof grades === 'number' ? { weapon: grades } : grades || {};
    const w = MR.WEAPON_GRADES[gs.weapon || 0];
    const bonus = { hp: 0, atk: 0, def: 0, spd: 0, crit: w.crit, critDmg: w.critDmg };
    for (const slot of MR.EQUIP_SLOTS) {
      bonus[slot.stat] += MR.equipValue(slot, (levels && levels[slot.id]) || 0, gs[slot.id]);
    }
    return bonus;
  };
})((globalThis.MR = globalThis.MR || {}));
