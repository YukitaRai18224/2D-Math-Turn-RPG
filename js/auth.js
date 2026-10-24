// 프로필 로그인: 이 기기(브라우저) 안에 닉네임별 계정을 만들고, 계정마다 진행 상황을 따로 저장한다.
// 서버가 없으므로 다른 기기로 이어지지 않고, PIN 은 남이 내 계정을 실수로 여는 것을 막는 정도의 잠금이다.
(function (MR) {
  const ACCOUNTS_KEY = 'mathrpg.accounts';
  const LAST_KEY = 'mathrpg.lastProfile';
  const LEGACY_KEY = 'mathrpg.save.v1'; // 로그인 기능 전의 저장 데이터
  const LEGACY_CLAIMED_KEY = 'mathrpg.legacyClaimed';
  const NAME_MAX = 12;

  const storage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // 무시
      }
    },
  };

  // 짧은 문자열 해시 (cyrb53). PIN 을 그대로 저장하지 않기 위한 용도
  function hash(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  const pinHash = (id, pin) => hash(`${id}:${pin}`, 7);

  MR.Auth = {
    NAME_MAX,
    current: null, // 로그인한 계정

    list() {
      try {
        const list = JSON.parse(storage.get(ACCOUNTS_KEY));
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },

    saveList(list) {
      storage.set(ACCOUNTS_KEY, JSON.stringify(list));
    },

    find(id) {
      return this.list().find((a) => a.id === id) || null;
    },

    saveKey(id) {
      return `mathrpg.save.p_${id}`;
    },

    lastProfileId() {
      return storage.get(LAST_KEY);
    },

    // 로그인 기능 전의 기록이 있고 아직 어느 계정에도 넘겨주지 않았는가
    hasLegacySave() {
      return !!storage.get(LEGACY_KEY) && !storage.get(LEGACY_CLAIMED_KEY);
    },

    validateName(name) {
      const n = String(name || '').trim();
      if (!n) return '닉네임을 입력해 주세요.';
      if (n.length > NAME_MAX) return `닉네임은 ${NAME_MAX}자까지 쓸 수 있어요.`;
      if (this.list().some((a) => a.name.toLowerCase() === n.toLowerCase())) return '이미 있는 닉네임이에요.';
      return null;
    },

    validatePin(pin) {
      const p = String(pin || '').trim();
      if (p && !/^\d{4}$/.test(p)) return 'PIN 은 숫자 4자리로 정하거나 비워 두세요.';
      return null;
    },

    // 새 계정. 로그인 기능 전의 기록이 있으면 처음 만드는 계정이 이어받는다
    create(name, pin) {
      const error = this.validateName(name) || this.validatePin(pin);
      if (error) return { ok: false, error };
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const p = String(pin || '').trim();
      const account = { id, name: String(name).trim(), pin: p ? pinHash(id, p) : null, created: Date.now(), lastPlayed: Date.now() };
      let inherited = false;
      if (this.hasLegacySave()) {
        storage.set(this.saveKey(id), storage.get(LEGACY_KEY));
        storage.set(LEGACY_CLAIMED_KEY, id);
        inherited = true;
      }
      this.saveList([...this.list(), account]);
      return { ok: true, account, inherited };
    },

    needsPin(id) {
      const a = this.find(id);
      return !!(a && a.pin);
    },

    checkPin(id, pin) {
      const a = this.find(id);
      return !!a && (!a.pin || a.pin === pinHash(id, String(pin || '').trim()));
    },

    login(id, pin) {
      const a = this.find(id);
      if (!a || !this.checkPin(id, pin)) return false;
      this.current = a;
      a.lastPlayed = Date.now();
      this.saveList(this.list().map((x) => (x.id === id ? a : x)));
      storage.set(LAST_KEY, id);
      MR.Progress.useProfile(this.saveKey(id));
      return true;
    },

    logout() {
      this.current = null;
    },

    remove(id, pin) {
      if (!this.checkPin(id, pin)) return false;
      this.saveList(this.list().filter((a) => a.id !== id));
      storage.remove(this.saveKey(id));
      if (storage.get(LAST_KEY) === id) storage.remove(LAST_KEY);
      if (this.current && this.current.id === id) this.current = null;
      return true;
    },

    // 계정 목록에 보여 줄 진행 요약
    summary(id) {
      try {
        const s = JSON.parse(storage.get(this.saveKey(id)));
        if (!s) return { cleared: 0, maxLevel: 1, last: null };
        const cleared = Object.keys(s.cleared || {});
        const last = MR.STAGES.filter((st) => cleared.includes(st.id)).pop();
        const maxLevel = Math.max(1, ...Object.values(s.levels || {}));
        return { cleared: cleared.length, maxLevel, last: last ? last.id : null };
      } catch (e) {
        return { cleared: 0, maxLevel: 1, last: null };
      }
    },
  };
})((globalThis.MR = globalThis.MR || {}));
