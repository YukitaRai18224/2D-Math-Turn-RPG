// 진행 상황 저장 (브라우저 localStorage): 클리어한 스테이지, 경험치 물약, 캐릭터 레벨, 장비 강화, 강화석, 출전 파티,
// 보유 캐릭터, 돌파 단계와 재료, 보석(루비·사파이어·에메랄드)
(function (MR) {
  // 저장 위치: 로그인한 계정마다 다르다 (MR.Auth.saveKey). 로그인 전에는 예전 기본 위치
  let KEY = 'mathrpg.save.v1';

  function defaults() {
    const levels = {};
    const equip = {};
    for (const k of MR.CHARACTER_ORDER) {
      levels[k] = 1;
      equip[k] = {};
      for (const slot of MR.EQUIP_SLOTS) equip[k][slot.id] = 0;
    }
    const owned = {};
    for (const k of MR.PARTY_ORDER) owned[k] = true;
    return {
      cleared: {}, potions: 0, stones: 0, levels, equip, party: [...MR.PARTY_ORDER], difficulty: MR.Quiz.DEFAULT,
      owned, copies: {}, breaks: {}, limits: {}, gems: { ruby: 0, sapphire: 0, emerald: 0 },
      stoneBackfill: true, gemBackfill: true,
    };
  }

  MR.Progress = {
    state: defaults(),
    backfillNotice: 0, // 이번 접속에서 지급한 소급 강화석 (화면 안내용)
    gemBackfillNotice: null, // 이번 접속에서 지급한 소급 보석

    // 계정을 바꾸면 그 계정의 저장 데이터를 불러온다
    useProfile(key) {
      KEY = key;
      this.load();
    },

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
      this.state.owned = { ...d.owned, ...((saved && saved.owned) || {}) };
      this.state.copies = { ...((saved && saved.copies) || {}) };
      this.state.breaks = { ...((saved && saved.breaks) || {}) };
      // 한계 돌파 횟수: 이미 20·40레벨을 넘긴 캐릭터는 그만큼 한계 돌파를 한 것으로 본다
      this.state.limits = { ...((saved && saved.limits) || {}) };
      for (const k of MR.CHARACTER_ORDER) {
        const passed = MR.CONFIG.LIMIT_BREAKS.filter((lb) => this.state.levels[k] > lb.at).length;
        this.state.limits[k] = Math.max(this.state.limits[k] || 0, passed);
      }
      this.state.gems = { ...d.gems, ...((saved && saved.gems) || {}) };
      // 본 튜토리얼. 튜토리얼 기능 전에 이미 플레이한 기록은 기본 안내(첫 화면·전투·퀴즈)를 건너뛴다
      this.state.tutorial = { ...((saved && saved.tutorial) || {}) };
      if (saved && !saved.tutorial && Object.keys(saved.cleared || {}).length) {
        Object.assign(this.state.tutorial, { map: true, battle: true, quiz: true });
      }
      const savedEquip = (saved && saved.equip) || {};
      for (const k of MR.CHARACTER_ORDER) this.state.equip[k] = { ...d.equip[k], ...(savedEquip[k] || {}) };
      // 출전 파티: 저장된 값 중 열린 캐릭터만, 중복 없이
      const savedParty = (saved && Array.isArray(saved.party) && saved.party) || d.party;
      this.state.party = [...new Set(savedParty)].filter((k) => MR.CHARACTERS[k] && this.isCharUnlocked(k)).slice(0, MR.PARTY_SIZE);
      if (!this.state.party.length) this.state.party = [...d.party];

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

      // 보석 업데이트 전에 클리어한 스테이지의 최초 클리어 보석을 한 번 지급한다
      this.state.gemBackfill = !!(saved && saved.gemBackfill);
      this.gemBackfillNotice = null;
      if (saved && !this.state.gemBackfill) {
        const owedGems = { ruby: 0, sapphire: 0, emerald: 0 };
        for (const st of MR.STAGES) {
          if (!this.isCleared(st.id)) continue;
          const g = MR.gemReward(st);
          for (const id in owedGems) owedGems[id] += g[id];
        }
        for (const id in owedGems) this.state.gems[id] += owedGems[id];
        this.state.gemBackfill = true;
        if (owedGems.ruby) this.gemBackfillNotice = owedGems;
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

    // 보유한 캐릭터: 처음부터 있거나, 합류 스테이지를 클리어했거나, 뽑기로 얻은 캐릭터
    isCharUnlocked(key) {
      const def = MR.CHARACTERS[key];
      return !!def && (!!this.state.owned[key] || (!!def.unlockStage && this.isCleared(def.unlockStage)));
    },

    // ---------- 돌파 ----------
    breakLevel(key) {
      return this.state.breaks[key] || 0;
    },

    copies(key) {
      return this.state.copies[key] || 0;
    },

    // 다음 돌파에 필요한 재료 수 (최대 돌파면 null)
    breakCost(key) {
      const lv = this.breakLevel(key);
      return lv >= MR.BREAKTHROUGH.max ? null : MR.BREAKTHROUGH.costs[lv];
    },

    canBreak(key) {
      const cost = this.breakCost(key);
      return this.isCharUnlocked(key) && cost !== null && this.copies(key) >= cost;
    },

    breakthrough(key) {
      if (!this.canBreak(key)) return false;
      this.state.copies[key] = this.copies(key) - this.breakCost(key);
      this.state.breaks[key] = this.breakLevel(key) + 1;
      this.save();
      return true;
    },

    // ---------- 뽑기 ----------
    // count 회 뽑는다. 처음 나온 캐릭터는 동료가 되고, 이미 있는 캐릭터는 돌파 재료가 된다.
    pull(count) {
      const cost = count === 10 ? MR.GACHA.cost10 : MR.GACHA.cost * count;
      if (this.state.gems.ruby < cost) return null;
      this.state.gems.ruby -= cost;
      const pool = MR.GACHA.pool();
      const results = [];
      for (let i = 0; i < count; i++) {
        const key = pool[Math.floor(Math.random() * pool.length)];
        if (this.isCharUnlocked(key)) {
          this.state.copies[key] = this.copies(key) + 1;
          results.push({ key, isNew: false });
        } else {
          this.state.owned[key] = true;
          results.push({ key, isNew: true });
        }
      }
      this.save();
      return results;
    },

    // 동료가 된 캐릭터 목록 (CHARACTER_ORDER 순서)
    roster() {
      return MR.CHARACTER_ORDER.filter((k) => this.isCharUnlocked(k));
    },

    inParty(key) {
      return this.state.party.includes(key);
    },

    isPartyReady() {
      return this.state.party.length === MR.PARTY_SIZE;
    },

    // 출전 파티에 넣거나 뺀다 (최대 PARTY_SIZE 명)
    toggleParty(key) {
      if (!this.isCharUnlocked(key)) return false;
      if (this.inParty(key)) this.state.party = this.state.party.filter((k) => k !== key);
      else if (this.state.party.length < MR.PARTY_SIZE) this.state.party = [...this.state.party, key];
      else return false;
      this.save();
      return true;
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
      return this.isLevelUpUnlocked() && cost !== null && !this.needsLimitBreak(key) && this.state.potions >= cost;
    },

    // ---------- 한계 돌파 (레벨 20 → 21, 40 → 41) ----------
    // 지금 레벨에서 한계 돌파가 필요하면 그 정보, 아니면 null
    needsLimitBreak(key) {
      const lv = this.level(key);
      const done = this.state.limits[key] || 0;
      const idx = MR.CONFIG.LIMIT_BREAKS.findIndex((lb) => lb.at === lv);
      return idx >= 0 && done <= idx ? MR.CONFIG.LIMIT_BREAKS[idx] : null;
    },

    canLimitBreak(key) {
      const lb = this.needsLimitBreak(key);
      return this.isLevelUpUnlocked() && !!lb && this.state.potions >= lb.potions && this.state.gems.emerald >= lb.emerald;
    },

    // 한계를 풀고 바로 다음 레벨로 올린다
    limitBreak(key) {
      if (!this.canLimitBreak(key)) return false;
      const lb = this.needsLimitBreak(key);
      this.state.potions -= lb.potions;
      this.state.gems.emerald -= lb.emerald;
      this.state.limits[key] = (this.state.limits[key] || 0) + 1;
      this.state.levels[key] = this.level(key) + 1;
      this.save();
      return true;
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
      // 최초 클리어 보석
      const gems = firstClear ? MR.gemReward(stage) : null;
      if (gems) for (const id in gems) this.state.gems[id] += gems[id];
      // 합류 캐릭터: 이미 뽑기로 얻었다면 돌파 재료 1개로 준다
      const newMembers = [];
      const joinCopies = [];
      if (firstClear) {
        for (const k of MR.CHARACTER_ORDER.filter((c) => MR.CHARACTERS[c].unlockStage === stage.id)) {
          if (this.state.owned[k]) {
            this.state.copies[k] = this.copies(k) + 1;
            joinCopies.push(k);
          } else {
            this.state.owned[k] = true;
            newMembers.push(k);
          }
        }
      }
      this.save();
      return {
        reward,
        stones,
        firstClear,
        gems,
        newMembers,
        joinCopies,
        levelUpJustUnlocked: !wasUnlocked && this.isLevelUpUnlocked(),
        equipJustUnlocked: !equipWasUnlocked && this.isEquipUnlocked(),
      };
    },
  };
})((globalThis.MR = globalThis.MR || {}));
