// 진행 상황 저장 (브라우저 localStorage): 클리어한 스테이지, 경험치 물약, 캐릭터 레벨, 장비 강화, 강화석
(function (MR) {
  const KEY = 'mathrpg.save.v1';

  function defaults() {
    const levels = {};
    const equip = {};
    for (const k of MR.PARTY_ORDER) {
      levels[k] = 1;
      equip[k] = {};
      for (const slot of MR.EQUIP_SLOTS) equip[k][slot.id] = 0;
    }
    return { cleared: {}, potions: 0, stones: 0, levels, equip, difficulty: MR.Quiz.DEFAULT, stoneBackfill: true };
  }

  MR.Progress = {
    state: defaults(),
    backfillNotice: 0, // 이번 접속에서 지급한 소급 강화석 (화면 안내용)

    load() {
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(KEY));
      } catch (e) {
        saved = null;
      }
      const d = defaults();
      this.state = {
        cleared: (saved && saved.cleared) || d.cleared,
        potions: (saved && saved.potions) || 0,
        levels: { ...d.levels, ...((saved && saved.levels) || {}) },
        difficulty: saved && MR.Quiz.DIFFICULTIES.some((x) => x.id === saved.difficulty) ? saved.difficulty : d.difficulty,
        stones: (saved && saved.stones) || 0,
        equip: d.equip,
      };
      const savedEquip = (saved && saved.equip) || {};
      for (const k of MR.PARTY_ORDER) this.state.equip[k] = { ...d.equip[k], ...(savedEquip[k] || {}) };

      // 장비 업데이트 전에 1-8 이후 스테이지를 클리어한 저장 데이터는 그때 받지 못한 강화석을 한 번 지급한다
      this.state.stoneBackfill = !!(saved && saved.stoneBackfill);
      this.backfillNotice = 0;
      if (saved && !this.state.stoneBackfill) {
        const from = MR.STAGES.findIndex((st) => st.id === MR.CONFIG.EQUIP_UNLOCK_STAGE);
        const owed = MR.STAGES.slice(from)
          .filter((st) => this.isCleared(st.id))
          .reduce((sum, st) => sum + MR.CONFIG.stoneReward(st), 0);
        this.state.stones += owed;
        this.state.stoneBackfill = true;
        this.backfillNotice = owed;
        this.save();
      }
    },

    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.state));
      } catch (e) {
        // 저장이 막힌 환경에서는 이번 접속 동안만 유지된다
      }
    },

    setDifficulty(id) {
      if (!MR.Quiz.DIFFICULTIES.some((d) => d.id === id)) return;
      this.state.difficulty = id;
      this.save();
    },

    reset() {
      const difficulty = this.state.difficulty;
      this.state = defaults();
      this.state.difficulty = difficulty;
      this.save();
    },

    isCleared(id) {
      return !!this.state.cleared[id];
    },

    isStageUnlocked(index) {
      return index === 0 || this.isCleared(MR.STAGES[index - 1].id);
    },

    isLevelUpUnlocked() {
      return this.isCleared(MR.CONFIG.LEVEL_UNLOCK_STAGE);
    },

    isEquipUnlocked() {
      return this.isCleared(MR.CONFIG.EQUIP_UNLOCK_STAGE);
    },

    enhanceLevel(key, slotId) {
      return this.state.equip[key][slotId] || 0;
    },

    // 다음 강화에 필요한 강화석 수 (최대 강화면 null)
    enhanceCost(key, slotId) {
      const lv = this.enhanceLevel(key, slotId);
      return lv >= MR.CONFIG.MAX_ENHANCE ? null : MR.CONFIG.enhanceCost(lv);
    },

    canEnhance(key, slotId) {
      const cost = this.enhanceCost(key, slotId);
      return this.isEquipUnlocked() && cost !== null && this.state.stones >= cost;
    },

    // 강화는 실패하지 않는다
    enhance(key, slotId) {
      if (!this.canEnhance(key, slotId)) return false;
      this.state.stones -= this.enhanceCost(key, slotId);
      this.state.equip[key][slotId] = this.enhanceLevel(key, slotId) + 1;
      this.save();
      return true;
    },

    level(key) {
      return this.state.levels[key] || 1;
    },

    // 다음 레벨까지 필요한 물약 수 (최대 레벨이면 null)
    levelUpCost(key) {
      const lv = this.level(key);
      return lv >= MR.CONFIG.MAX_LEVEL ? null : MR.CONFIG.levelUpCost(lv);
    },

    canLevelUp(key) {
      const cost = this.levelUpCost(key);
      return this.isLevelUpUnlocked() && cost !== null && this.state.potions >= cost;
    },

    levelUp(key) {
      if (!this.canLevelUp(key)) return false;
      this.state.potions -= this.levelUpCost(key);
      this.state.levels[key] = this.level(key) + 1;
      this.save();
      return true;
    },

    // 다음에 이 스테이지를 클리어하면 받을 물약 수 (첫 클리어는 원래 보상, 반복 클리어는 줄어든 보상)
    rewardFor(stage) {
      if (!this.isCleared(stage.id)) return stage.reward;
      const c = MR.CONFIG;
      return Math.max(c.REPEAT_REWARD_MIN, stage.reward - c.REPEAT_REWARD_PENALTY);
    },

    recordClear(stage) {
      const wasUnlocked = this.isLevelUpUnlocked();
      const equipWasUnlocked = this.isEquipUnlocked();
      const firstClear = !this.isCleared(stage.id);
      const reward = this.rewardFor(stage);
      this.state.cleared[stage.id] = true;
      this.state.potions += reward;
      // 강화석은 장비가 열린 뒤부터 (장비를 여는 1-8 클리어 포함) 받는다
      const stones = this.isEquipUnlocked() ? MR.CONFIG.stoneReward(stage) : 0;
      this.state.stones += stones;
      this.save();
      return {
        reward,
        stones,
        firstClear,
        levelUpJustUnlocked: !wasUnlocked && this.isLevelUpUnlocked(),
        equipJustUnlocked: !equipWasUnlocked && this.isEquipUnlocked(),
      };
    },
  };
})((globalThis.MR = globalThis.MR || {}));
