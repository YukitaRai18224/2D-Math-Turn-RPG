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
  };

  MR.equipValue = function (slot, level) {
    return slot.base + slot.perLevel * level;
  };

  // levels: { weapon: 3, hat: 0, ... } → { hp, atk, def, spd } 추가 능력치
  MR.equipBonus = function (levels) {
    const bonus = { hp: 0, atk: 0, def: 0, spd: 0 };
    for (const slot of MR.EQUIP_SLOTS) {
      bonus[slot.stat] += MR.equipValue(slot, (levels && levels[slot.id]) || 0);
    }
    return bonus;
  };
})((globalThis.MR = globalThis.MR || {}));
