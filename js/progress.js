// 진행 상황 저장 (브라우저 localStorage): 클리어한 스테이지, 경험치 물약, 캐릭터 레벨
(function (MR) {
  const KEY = 'mathrpg.save.v1';

  function defaults() {
    const levels = {};
    for (const k of MR.PARTY_ORDER) levels[k] = 1;
    return { cleared: {}, potions: 0, levels, difficulty: MR.Quiz.DEFAULT };
  }

  MR.Progress = {
    state: defaults(),

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
        difficulty: (saved && saved.difficulty) || d.difficulty,
      };
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
      const firstClear = !this.isCleared(stage.id);
      const reward = this.rewardFor(stage);
      this.state.cleared[stage.id] = true;
      this.state.potions += reward;
      this.save();
      return { reward, firstClear, levelUpJustUnlocked: !wasUnlocked && this.isLevelUpUnlocked() };
    },
  };
})((globalThis.MR = globalThis.MR || {}));
