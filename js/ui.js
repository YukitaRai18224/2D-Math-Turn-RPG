// 화면 구성: 스테이지 선택 / 파티·레벨업 / 전투 / 퀴즈 창 / 결과 창
(function (MR) {
  const P = () => MR.Progress;
  const app = () => document.getElementById('app');
  const modal = () => document.getElementById('modal');

  let battle = null;
  let currentStageIndex = -1;
  let pendingAction = null; // 행동 선택을 기다리는 중이면 resolve 함수
  let logLines = [];
  let selectedChapter = null; // 스테이지 선택 화면에서 보고 있는 챕터
  let equipChar = null; // 장비 화면에서 보고 있는 캐릭터

  // ---------- 공통 ----------
  function bar(cls, value, max, text) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    return `<div class="bar ${cls}"><i style="width:${pct}%"></i><span>${text}</span></div>`;
  }

  function monsterSvg(def) {
    if (def.image) return `<img class="slime-svg monster-img" src="${def.image}" alt="">`;
    if (def.look === 'ghost') return ghostSvg();
    return def.look === 'witch' ? witchSvg(def.palette) : slimeSvg(def.look);
  }

  // 악령: 흐릿하게 떠다니는 보랏빛 유령
  function ghostSvg() {
    return `
      <svg viewBox="0 0 120 100" class="slime-svg ghost-svg" aria-hidden="true">
        <ellipse cx="60" cy="94" rx="30" ry="4" fill="rgba(60,20,90,.15)"/>
        <g class="ghost-body">
          <path d="M28 82 C24 40 40 12 60 12 C80 12 96 40 92 82 L84 74 L76 84 L68 74 L60 86 L52 74 L44 84 L36 74 Z" fill="#e9e2f7" stroke="#b9a6dc" stroke-width="2"/>
          <path d="M34 46 C34 30 46 20 60 20" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
          <ellipse cx="48" cy="46" rx="6" ry="9" fill="#3b2557"/>
          <ellipse cx="72" cy="46" rx="6" ry="9" fill="#3b2557"/>
          <circle cx="50" cy="43" r="2" fill="#c9a6ff"/><circle cx="74" cy="43" r="2" fill="#c9a6ff"/>
          <path d="M50 64 Q55 58 60 64 Q65 70 70 64" stroke="#3b2557" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M26 60 Q14 56 12 44" stroke="#b9a6dc" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path d="M94 60 Q106 56 108 44" stroke="#b9a6dc" stroke-width="5" fill="none" stroke-linecap="round"/>
        </g>
      </svg>`;
  }

  // 마녀 색 구성: 기본(비즈네르, 보라·암호 문자) / imaginary(라파, 청록·허수 i)
  const WITCH_PALETTES = {
    cipher: { robe: '#4a2386', trim: '#7b3fd0', hat: '#2a1450', hair: '#2d1b4e', eye: '#7b3fd0', orb: '#c9a6ff', glyph: '#b48cff', glyphs: ['V', 'K', 'Q', 'Z'] },
    imaginary: { robe: '#135e6c', trim: '#1f8a9e', hat: '#0b3a44', hair: '#e8eef2', eye: '#1f8a9e', orb: '#8ff0ff', glyph: '#3ec6dc', glyphs: ['i', '√−1', 'i²', '2i'] },
  };

  function witchSvg(paletteName) {
    const c = WITCH_PALETTES[paletteName] || WITCH_PALETTES.cipher;
    const g = c.glyphs;
    return `
      <svg viewBox="0 -10 120 120" class="slime-svg witch-svg" aria-hidden="true">
        <ellipse cx="60" cy="104" rx="38" ry="5" fill="rgba(0,0,0,.15)"/>
        <g class="cipher-orbit" font-family="ui-serif, Georgia, serif" font-style="italic" font-weight="700" font-size="11" fill="${c.glyph}">
          <text x="4" y="44">${g[0]}</text><text x="100" y="38">${g[1]}</text><text x="8" y="88">${g[2]}</text><text x="100" y="84">${g[3]}</text>
        </g>
        <path d="M60 46 L94 104 L26 104 Z" fill="${c.robe}"/>
        <path d="M60 46 L67 104 L53 104 Z" fill="${c.trim}"/>
        <path d="M30 104 L90 104 L88 98 L32 98 Z" fill="#e0b84a"/>
        <path d="M46 36 C42 56 38 72 32 86 L50 66 Z" fill="${c.hair}"/>
        <path d="M74 36 C78 56 82 72 88 86 L70 66 Z" fill="${c.hair}"/>
        <circle cx="60" cy="40" r="13" fill="#f6dccb"/>
        <path d="M47 38 Q52 28 60 30 Q68 28 73 38 Q66 33 60 34 Q54 33 47 38Z" fill="${c.hair}"/>
        <ellipse cx="55" cy="42" rx="2" ry="2.6" fill="${c.eye}"/>
        <ellipse cx="65" cy="42" rx="2" ry="2.6" fill="${c.eye}"/>
        <path d="M56 49 Q60 51 64 48" stroke="#8a3a5a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M28 30 Q60 20 92 30 Q60 37 28 30 Z" fill="${c.hat}"/>
        <path d="M43 28 L60 -6 Q63 -9 66 -5 L77 27 Z" fill="${c.hat}"/>
        <path d="M44 25 L76 24 L77 28 L43 29 Z" fill="#e0b84a"/>
        <line x1="95" y1="54" x2="101" y2="104" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/>
        <circle class="witch-orb" cx="94" cy="50" r="6.5" fill="${c.orb}"/>
        <circle cx="92" cy="48" r="2" fill="#fff" opacity=".8"/>
      </svg>`;
  }

  function slimeSvg(look) {
    const armor = look === 'armor';
    const body = armor ? '#7aa6c9' : '#6cc56f';
    const shade = armor ? '#5a86a9' : '#4fa552';
    return `
      <svg viewBox="0 0 120 100" class="slime-svg" aria-hidden="true">
        <ellipse cx="60" cy="92" rx="44" ry="6" fill="rgba(0,0,0,.12)"/>
        <path d="M14 88 C10 50 34 18 60 18 C86 18 110 50 106 88 Z" fill="${body}"/>
        <path d="M14 88 C30 92 90 92 106 88 C104 80 98 76 92 78 C70 84 50 84 28 78 C22 76 16 80 14 88Z" fill="${shade}"/>
        <ellipse cx="44" cy="40" rx="8" ry="5" fill="rgba(255,255,255,.55)"/>
        <ellipse cx="47" cy="60" rx="5" ry="7" fill="#233"/>
        <ellipse cx="73" cy="60" rx="5" ry="7" fill="#233"/>
        <path d="M54 74 Q60 79 66 74" stroke="#233" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${armor ? `
        <path d="M22 50 C24 24 44 12 60 12 C76 12 96 24 98 50 L86 50 C84 34 74 26 60 26 C46 26 36 34 34 50 Z" fill="#b8c2cc" stroke="#7d8894" stroke-width="2"/>
        <rect x="56" y="4" width="8" height="12" rx="3" fill="#d9534f"/>
        <path d="M30 70 L90 70 L86 86 L34 86 Z" fill="#b8c2cc" stroke="#7d8894" stroke-width="2"/>
        <circle cx="45" cy="78" r="2.5" fill="#7d8894"/><circle cx="75" cy="78" r="2.5" fill="#7d8894"/>` : ''}
      </svg>`;
  }

  // 보석 아이콘과 수량
  const gemIcon = (id) => `<i class="gem ${id}" aria-hidden="true"></i>`;
  function gemBadges(gems, cls = 'potions') {
    return MR.GEMS.map((g) => `<div class="${cls} gem-count" title="${g.name}">${gemIcon(g.id)} ${g.name} <b>${gems[g.id] || 0}</b></div>`).join('');
  }
  // 장비 등급 배지
  const gradeBadge = (g) => {
    const gr = MR.GEAR_GRADES[g || 0];
    return `<span class="grade-badge grade-${gr.id}" style="--g:${gr.color}" title="${gr.ko}">${gr.name}</span>`;
  };
  // 등급 효과 설명 (slotId 가 없으면 무기 기준)
  const gradeBonusText = (g, slotId = 'weapon') => {
    const gr = MR.GEAR_GRADES[g || 0];
    if (slotId !== 'weapon') return `${slotId === 'shoes' ? '속도' : '능력치'} ×${MR.gradeMult(slotId, g)}`;
    const parts = [`능력치 ×${gr.mult}`];
    if (gr.crit) parts.push(`치명타 확률 +${Math.round(gr.crit * 100)}%`);
    if (gr.critDmg) parts.push(`치명타 피해 +${Math.round(gr.critDmg * 100)}%`);
    return parts.join(' · ');
  };
  const gearGrades = (k) => P().state.gearGrade[k] || {};
  const stars = (n) => `<span class="stars" title="${n}돌파">${'★'.repeat(n)}${'☆'.repeat(MR.BREAKTHROUGH.max - n)}</span>`;

  // 레벨업으로 고유 스킬·궁극기 레벨이 올랐으면 안내 문구
  function skillUpNotice(key, lvBefore) {
    const lv = P().level(key);
    const name = MR.CHARACTERS[key].name;
    const parts = [];
    if (MR.skillLevelFor(lv) > MR.skillLevelFor(lvBefore)) parts.push(`고유 스킬 Lv.${MR.skillLevelFor(lv)}`);
    if (MR.ultLevelFor(lv) > MR.ultLevelFor(lvBefore)) parts.push(`궁극기 Lv.${MR.ultLevelFor(lv)}`);
    return parts.length ? `✨ ${name}: ${parts.join(', ')}!` : '';
  }

  // 이름 뒤 조사: 받침이 있으면 '이', 없으면 '가'
  function iga(name) {
    const code = name.charCodeAt(name.length - 1) - 0xac00;
    return `${name}${code >= 0 && code < 11172 && code % 28 ? '이' : '가'}`;
  }

  function buffChips(u) {
    return u.buffs
      .map((b) => {
        if (b.kind === 'silence') return `<span class="chip silence">🔇 침묵 · ${b.turns}턴</span>`;
        if (b.kind === 'mark') return `<span class="chip mark" title="다음 퀴즈를 틀리면 1턴 침묵">ⅰ 허수 표식</span>`;
        if (b.kind === 'imagMark') return `<span class="chip imag" title="최대 체력 10%를 넘는 피해를 받으면 터짐">ⅰ 표식 ×${b.stacks} · ${b.turns}턴</span>`;
        const up = b.pct > 0;
        return `<span class="chip ${up ? 'up' : 'down'}">${b.label} ${up ? '+' : ''}${Math.round(b.pct * 100)}% · ${b.turns}턴</span>`;
      })
      .join('');
  }

  // ---------- 시작 화면 · 로그인 ----------
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function showStart(message) {
    MR.Tutorial.cancel();
    battle = null;
    closeModal();
    const accounts = MR.Auth.list().sort((a, b) => b.lastPlayed - a.lastPlayed);
    const lastId = MR.Auth.lastProfileId();
    const cards = accounts.map((a) => {
      const sm = MR.Auth.summary(a.id);
      return `
        <div class="profile-card ${a.id === lastId ? 'last' : ''}">
          <button class="profile-main" data-act="profile-login" data-id="${a.id}">
            <span class="profile-avatar">${esc(a.name.slice(0, 1))}</span>
            <span class="profile-text">
              <b>${esc(a.name)} ${a.pin ? '<i class="lock" title="PIN 잠금">🔒</i>' : ''}</b>
              <small>${sm.last ? `${sm.last}까지 클리어` : '새 모험'} · 최고 Lv.${sm.maxLevel}</small>
            </span>
            <span class="profile-go">${a.id === lastId ? 'CONTINUE ▶' : 'START ▶'}</span>
          </button>
          <button class="profile-del" data-act="profile-delete" data-id="${a.id}" title="계정 삭제" aria-label="${esc(a.name)} 계정 삭제">✕</button>
        </div>`;
    }).join('');

    app().innerHTML = `
      <div class="start-screen">
        <div class="start-bg" aria-hidden="true"><div class="start-sun"></div><div class="start-grid"></div></div>
        <div class="start-inner">
          <header class="start-logo">
            <p class="start-kicker">// EDU-COMBAT SYSTEM v2.0</p>
            <h1 class="glitch" data-text="The ZERO">The ZERO</h1>
            <p class="start-sub">수학 턴제 RPG · 문제를 풀어 싸워라</p>
          </header>
          <div class="start-cast" aria-hidden="true">
            ${MR.CHARACTER_ORDER.map((k, i) => `<img src="${MR.CHARACTERS[k].image}" alt="" style="--c:${MR.CHARACTERS[k].color};--i:${i}">`).join('')}
          </div>
          <section class="login-panel">
            <h2><span>&gt;_</span> LOGIN</h2>
            ${message ? `<p class="login-msg">${message}</p>` : ''}
            ${accounts.length ? `<div class="profile-list">${cards}</div>` : '<p class="login-empty">아직 계정이 없어요. 아래에서 닉네임을 정해 시작하세요.</p>'}
            ${MR.Auth.hasLegacySave() ? '<p class="login-legacy">💾 이 기기에 로그인 기능 이전의 진행 기록이 있어요. 새로 만드는 계정이 그 기록을 이어받아요.</p>' : ''}
            <form class="new-profile" data-form="create" autocomplete="off">
              <h3>NEW ACCOUNT</h3>
              <label><span>닉네임</span><input name="name" maxlength="${MR.Auth.NAME_MAX}" placeholder="최대 ${MR.Auth.NAME_MAX}자" autocomplete="off"></label>
              <label><span>PIN <small>(선택 · 숫자 4자리)</small></span><input name="pin" inputmode="numeric" maxlength="4" type="password" placeholder="비워 두면 잠금 없음" autocomplete="off"></label>
              <button class="btn primary" type="submit">계정 만들고 시작 ▶</button>
              <p class="form-error" aria-live="polite"></p>
            </form>
            <p class="login-note">계정과 진행 상황은 <b>이 기기의 브라우저</b>에만 저장돼요. 다른 기기로는 이어지지 않고, PIN 은 다른 사람이 실수로 내 계정을 여는 것을 막는 간단한 잠금이에요.</p>
          </section>
        </div>
      </div>`;
  }

  // PIN 입력 창 (로그인 / 삭제 확인)
  function askPin(title, desc, onSubmit) {
    modal().innerHTML = `
      <div class="overlay">
        <form class="pin-card" data-form="pin" autocomplete="off">
          <div class="quiz-title">${title}</div>
          <p class="choose-desc">${desc}</p>
          <input name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" aria-label="PIN" autocomplete="off">
          <p class="form-error" aria-live="polite"></p>
          <div class="result-buttons">
            <button class="btn primary" type="submit">확인</button>
            <button class="btn" type="button" data-act="pin-cancel">취소</button>
          </div>
        </form>
      </div>`;
    const form = modal().querySelector('form');
    form._onPin = onSubmit;
    setTimeout(() => form.elements.pin.focus(), 30);
  }

  function enterGame(id) {
    if (!MR.Auth.login(id)) return;
    selectedChapter = null;
    showMap();
  }

  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest('[data-form]');
    if (!form) return;
    ev.preventDefault();
    const err = form.querySelector('.form-error');
    if (form.dataset.form === 'create') {
      const r = MR.Auth.create(form.elements.name.value, form.elements.pin.value);
      if (!r.ok) {
        err.textContent = r.error;
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        return;
      }
      MR.Auth.login(r.account.id, form.elements.pin.value);
      selectedChapter = null;
      showMap();
    } else if (form.dataset.form === 'pin') {
      const ok = form._onPin(form.elements.pin.value);
      if (!ok) {
        err.textContent = 'PIN 이 맞지 않아요.';
        form.elements.pin.value = '';
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
      }
    }
  });

  // ---------- 스테이지 선택 ----------
  function showMap() {
    battle = null;
    closeModal();
    const s = P().state;
    const chapterOf = (st) => Number(st.id.split('-')[0]);
    const chapterUnlocked = (ch) => MR.STAGES.some((st, i) => chapterOf(st) === ch.id && P().isStageUnlocked(i));
    if (!selectedChapter || !chapterUnlocked(MR.CHAPTERS.find((c) => c.id === selectedChapter))) {
      // 처음에는 열린 챕터 중 가장 마지막 챕터를 보여 준다
      selectedChapter = [...MR.CHAPTERS].reverse().find(chapterUnlocked).id;
    }
    const chapter = MR.CHAPTERS.find((c) => c.id === selectedChapter);
    const prevChapterLast = (ch) => [...MR.STAGES].reverse().find((st) => chapterOf(st) === ch.id - 1);

    const stages = MR.STAGES.map((st, i) => {
      if (chapterOf(st) !== selectedChapter) return '';
      const unlocked = P().isStageUnlocked(i);
      const cleared = P().isCleared(st.id);
      const enemies = st.enemies.map((k) => `<span class="mini-slime">${monsterSvg(MR.MONSTERS[k])}</span>`).join('');
      return `
        <button class="stage-btn ${cleared ? 'cleared' : ''} ${st.boss ? 'boss' : ''}" data-act="stage" data-index="${i}" ${unlocked ? '' : 'disabled'}>
          ${st.boss ? '<span class="boss-tag">BOSS</span>' : ''}
          <span class="stage-id">${st.id}</span>
          <span class="stage-enemies">${unlocked ? enemies : '🔒'}</span>
          <span class="stage-meta">${cleared ? `✓ 클리어 · 🧪 ${P().rewardFor(st)}` : unlocked ? `🧪 ${st.reward}` : '잠김'}</span>
        </button>`;
    }).join('');

    app().innerHTML = `
      <div class="screen map">
        <header class="topbar">
          <h1 class="brand">The <span>ZERO</span> <small>수학 턴제 RPG</small></h1>
          <div class="profile-chip" title="로그인한 계정">◉ ${esc(MR.Auth.current ? MR.Auth.current.name : '')}
            <button class="link-btn" data-act="logout">로그아웃</button></div>
          <div class="potions" title="경험치 물약">🧪 경험치 물약 <b>${s.potions}</b></div>
          ${P().isEquipUnlocked() ? `<div class="potions" title="강화석">💎 강화석 <b>${s.stones}</b></div>` : ''}
          ${gemBadges(s.gems)}
        </header>
        ${P().gemBackfillNotice ? `<p class="notice gift">🎁 지금까지 클리어한 스테이지의 최초 클리어 보석을 지급했어요: ${MR.GEMS.map((g) => `${gemIcon(g.id)} ${g.name} ${P().gemBackfillNotice[g.id]}`).join(' · ')}</p>` : ''}
        ${P().backfillNotice ? `<p class="notice gift">🎁 장비 업데이트 전에 클리어한 스테이지의 강화석 <b>💎 ${P().backfillNotice}개</b>를 지급했어요.</p>` : ''}
        <section class="party-strip">
          ${P().isPartyReady() ? '' : `<span class="party-warn">⚠ 출전 멤버 ${P().state.party.length}/${MR.PARTY_SIZE}명 · 파티 화면에서 골라 주세요</span>`}
          ${P().state.party.map((k) => {
            const c = MR.CHARACTERS[k];
            return `<div class="party-face" style="--c:${c.color}"><img src="${c.image}" alt=""><span>${c.name}<small>Lv.${P().level(k)}</small></span></div>`;
          }).join('')}
          <div class="party-buttons">
            <button class="btn gacha-btn" data-act="gacha">${gemIcon('ruby')} 캐릭터 뽑기</button>
            <button class="btn" data-act="party">파티 · 레벨업${P().isLevelUpUnlocked() ? '' : ' 🔒'}</button>
            <button class="btn" data-act="equip" title="${P().isEquipUnlocked() ? '' : `${MR.CONFIG.EQUIP_UNLOCK_STAGE} 클리어 시 열림`}">장비 강화${P().isEquipUnlocked() ? '' : ' 🔒'}</button>
          </div>
        </section>
        <section class="difficulty">
          <h2>문제 난이도</h2>
          <div class="diff-groups" role="radiogroup" aria-label="문제 난이도">
            ${[...new Set(MR.Quiz.DIFFICULTIES.map((d) => d.group))].map((g) => `
              <div class="diff-group">
                <span class="diff-group-name">${g}</span>
                <div class="segmented">
                  ${MR.Quiz.DIFFICULTIES.filter((d) => d.group === g).map((d) => `
                    <button role="radio" aria-checked="${d.id === s.difficulty}" aria-label="${d.name}" class="${d.id === s.difficulty ? 'on' : ''}"
                            data-act="difficulty" data-id="${d.id}">${d.short}</button>`).join('')}
                </div>
              </div>`).join('')}
          </div>
          <p class="difficulty-note">${P().roster().map((k) => `<span style="--c:${MR.CHARACTERS[k].color}"><b>${MR.CHARACTERS[k].name}</b> ${MR.Quiz.label(MR.CHARACTERS[k].quiz, s.difficulty)}</span>`).join('')}<span><b>일반 공격</b> ${MR.Quiz.label('addSub', s.difficulty)}</span></p>
        </section>
        <nav class="chapter-tabs" role="tablist">
          ${MR.CHAPTERS.map((ch) => {
            const open = chapterUnlocked(ch);
            const prev = prevChapterLast(ch);
            return `
              <button role="tab" aria-selected="${ch.id === selectedChapter}" class="chapter-tab ${ch.id === selectedChapter ? 'on' : ''}"
                      data-act="chapter" data-id="${ch.id}" ${open ? '' : 'disabled'}
                      title="${open ? '' : `${prev ? prev.id : ''} 클리어 시 열림`}">
                <small>Chapter ${ch.id}</small>${open ? ch.name : `🔒 ${prev ? prev.id : ''} 클리어 시 열림`}
              </button>`;
          }).join('')}
        </nav>
        <section class="chapter chapter-${chapter.id}">
          <h2>Chapter ${chapter.id} · ${chapter.name}</h2>
          <div class="stage-grid">${stages}</div>
        </section>
        <footer class="map-foot">
          <button class="link-btn" data-act="tutorial-reset">📘 튜토리얼 다시 보기</button>
          <button class="link-btn" data-act="reset">이 계정의 진행 상황 초기화</button>
        </footer>
      </div>`;
    MR.Tutorial.maybe('map');
  }

  // ---------- 파티 · 레벨업 ----------
  function showParty(notice) {
    const unlocked = P().isLevelUpUnlocked();
    const diff = P().state.difficulty;
    const equipOn = P().isEquipUnlocked();
    const roster = P().roster();
    const cards = roster.map((k) => {
      const c = MR.CHARACTERS[k];
      const lv = P().level(k);
      const eq = MR.equipBonus(P().state.equip[k], gearGrades(k));
      const eqCell = (key) => (equipOn ? `<td class="equip">${eq[key] ? `+${eq[key]}` : ''}</td>` : '');
      const now = MR.statsAtLevel(c.base, lv);
      const cost = P().levelUpCost(k);
      const next = cost !== null ? MR.statsAtLevel(c.base, lv + 1) : null;
      const row = (label, key) =>
        `<tr><th>${label}</th><td>${now[key]}</td><td class="next">${next ? `→ ${next[key]}` : ''}</td>${eqCell(key)}</tr>`;
      let btn;
      if (!unlocked) btn = `<button class="btn" disabled>🔒 ${MR.CONFIG.LEVEL_UNLOCK_STAGE} 클리어 시 해금</button>`;
      else if (cost === null) btn = `<button class="btn" disabled>최대 레벨</button>`;
      else if (P().needsLimitBreak(k)) {
        const lb = P().needsLimitBreak(k);
        btn = `<button class="btn limit-btn" data-act="limit" data-key="${k}" ${P().canLimitBreak(k) ? '' : 'disabled'}
                  title="Lv.${lb.at}에서 Lv.${lb.at + 1}로 가려면 한계 돌파가 필요해요">🔓 한계 돌파 (🧪 ${lb.potions} + ${gemIcon('emerald')} ${lb.emerald})</button>`;
      } else btn = `<button class="btn primary" data-act="levelup" data-key="${k}" ${P().canLevelUp(k) ? '' : 'disabled'}>레벨업 (🧪 ${cost})</button>`;
      const sl = MR.skillLevelFor(lv);
      const ul = MR.ultLevelFor(lv);
      const bl = P().breakLevel(k);
      const bcost = P().breakCost(k);
      const breakBtn = bcost === null
        ? '<button class="btn" disabled>최대 돌파</button>'
        : `<button class="btn break-btn" data-act="break" data-key="${k}" ${P().canBreak(k) ? '' : 'disabled'}>돌파 (재료 ${P().copies(k)}/${bcost})</button>`;
      const breakBox = `
        <div class="break-box">
          <div class="break-head">${stars(bl)} <b>${bl}돌파</b>${bl ? ` <small>능력치 +${Math.round(bl * MR.BREAKTHROUGH.statPct * 100)}%</small>` : ''} ${breakBtn}</div>
          <ul class="break-effects">${MR.BREAKTHROUGH.effects.map((ef, i) => `<li class="${i < bl ? 'on' : ''}"><b>${i + 1}돌파</b> ${ef.desc}</li>`).join('')}</ul>
        </div>`;
      const nextChange = MR.nextSkillChange(lv);
      const inParty = P().inParty(k);
      const partyFull = P().state.party.length >= MR.PARTY_SIZE;
      const partyBtn = roster.length > MR.PARTY_SIZE
        ? `<button class="btn party-toggle ${inParty ? 'on' : ''}" data-act="party-toggle" data-key="${k}" ${!inParty && partyFull ? 'disabled title="출전 멤버는 4명까지예요. 먼저 한 명을 빼 주세요."' : ''}>${inParty ? '✓ 출전 중' : '출전하기'}</button>`
        : '';

      return `
        <article class="char-card ${roster.length > MR.PARTY_SIZE && !inParty ? 'benched' : ''}" style="--c:${c.color}">
          <div class="char-portrait"><img src="${c.image}" alt="${c.name}">${partyBtn}</div>
          <div class="char-body">
            <h3>${c.title ? `<small class="char-title">${c.title}</small>` : ''}${c.name} <small>${c.role}</small> <span class="lv">Lv.${lv}</span></h3>
            <table class="stats">
              ${row('최대 체력', 'hp')}${row('공격력', 'atk')}${row('방어력', 'def')}
              <tr><th>속도</th><td>${now.spd}</td><td></td>${eqCell('spd')}</tr>
              <tr><th>치명타</th><td colspan="3">${Math.round((c.crit.rate + (equipOn ? eq.crit : 0)) * 100)}% · 피해 ${Math.round((c.crit.dmg + (equipOn ? eq.critDmg : 0)) * 100)}%</td></tr>
            </table>
            ${equipOn ? '<p class="equip-note">파란 숫자는 장비로 오른 능력치예요.</p>' : ''}
            ${btn}
            ${breakBox}
            <p class="skill-lv">고유 스킬 Lv.${sl} · 궁극기 Lv.${ul}${nextChange ? ` <small>· 캐릭터 Lv.${nextChange.at}에 ${nextChange.skill}/${nextChange.ult}</small>` : ' <small>· 최대</small>'}</p>
            <dl class="kit">
              <dt>일반 공격</dt><dd>선택한 적에게 공격력 100% 피해. <em>${MR.Quiz.label('addSub', diff)} 퀴즈</em> 정답 시 스킬 포인트 +1</dd>
              <dt>고유 스킬 · ${c.skill.name}</dt><dd>${MR.describe(c.skill.desc, sl)}. <em>${MR.Quiz.label(c.quiz, diff)} 퀴즈</em> ${MR.describe(c.skill.bonusDesc, sl)}</dd>
              <dt>궁극기 · ${c.ult.name}</dt><dd>${MR.describe(c.ult.desc, ul)}. 에너지 ${c.maxEnergy} 소모, 퀴즈 정답 시 소모량의 ${Math.round(c.ult.refund * 100)}% 회복</dd>
              <dt>특성 · ${c.trait.name}</dt><dd>${MR.describe(c.trait.desc, sl)}</dd>
            </dl>
          </div>
        </article>`;
    }).join('');

    app().innerHTML = `
      <div class="screen party">
        <header class="topbar">
          <button class="btn" data-act="map">← 스테이지 선택</button>
          <h1>파티 · 레벨업</h1>
          <span class="diff-chip">문제 난이도: ${MR.Quiz.difficultyName(diff)}</span>
          <div class="potions">🧪 경험치 물약 <b>${P().state.potions}</b></div>
          <div class="potions gem-count" title="에메랄드 (한계 돌파에 사용)">${gemIcon('emerald')} 에메랄드 <b>${P().state.gems.emerald}</b></div>
        </header>
        ${notice ? `<p class="notice gift">${notice}</p>` : ''}
        ${unlocked ? '' : `<p class="notice">레벨업 기능은 스테이지 ${MR.CONFIG.LEVEL_UNLOCK_STAGE}을 클리어하면 열립니다. 물약은 미리 모아둘 수 있어요.</p>`}
        <p class="skill-note">돌파: 뽑기에서 겹친 캐릭터는 돌파 재료가 돼요. 1~4돌파는 재료 1개, 5~6돌파는 재료 2개가 필요하고, 돌파할 때마다 능력치 +${Math.round(MR.BREAKTHROUGH.statPct * 100)}%와 추가 효과를 얻어요.</p>
        ${roster.length > MR.PARTY_SIZE ? `<p class="party-count">출전 멤버 <b>${P().state.party.length} / ${MR.PARTY_SIZE}</b> · 초상화 아래 버튼으로 출전 멤버를 바꿀 수 있어요.</p>` : ''}
        <p class="skill-note">고유 스킬/궁극기 레벨: ${MR.CONFIG.SKILL_LEVEL_TABLE.map((r) => `Lv.${r.at} ${r.skill}/${r.ult}`).join(' → ')}. 특성은 고유 스킬 레벨을 따라요.
          레벨 ${MR.CONFIG.LIMIT_BREAKS.map((lb) => `${lb.at}→${lb.at + 1}`).join(', ')}은 경험치 물약과 에메랄드로 <b>한계 돌파</b>를 해야 올라가요.</p>
        <div class="char-grid">${cards}</div>
      </div>`;
    if (unlocked) {
      MR.Tutorial.maybe('levelup').then(() => {
        if (roster.length > MR.PARTY_SIZE && document.querySelector('.party-toggle')) MR.Tutorial.maybe('party');
      });
    }
  }

  // ---------- 캐릭터 뽑기 ----------
  function showGacha(results) {
    const ruby = P().state.gems.ruby;
    const pool = MR.GACHA.pool();
    const rate = Math.round(1000 / pool.length) / 10;
    const resultCards = (results || []).map((r, i) => {
      const c = MR.CHARACTERS[r.key];
      return `
        <div class="pull-card ${r.isNew ? 'new' : ''}" style="--c:${c.color};animation-delay:${i * 90}ms">
          ${r.isNew ? '<span class="pull-new">NEW</span>' : ''}
          <img src="${c.image}" alt="">
          <b>${c.name}</b>
          <small>${r.isNew ? '동료가 되었어요!' : `돌파 재료 +1 (보유 ${P().copies(r.key)})`}</small>
        </div>`;
    }).join('');
    app().innerHTML = `
      <div class="screen gacha">
        <header class="topbar">
          <button class="btn" data-act="map">← 스테이지 선택</button>
          <h1>캐릭터 뽑기</h1>
          ${gemBadges(P().state.gems)}
        </header>
        <section class="gacha-banner">
          <div class="gacha-faces">
            ${pool.map((k) => `<div class="gacha-face ${P().isCharUnlocked(k) ? '' : 'missing'}" style="--c:${MR.CHARACTERS[k].color}">
              <img src="${MR.CHARACTERS[k].image}" alt=""><span>${MR.CHARACTERS[k].name}</span><small>${rate}%</small></div>`).join('')}
          </div>
          <p>처음 나온 캐릭터는 동료가 되고, 이미 있는 캐릭터는 <b>돌파 재료</b>가 돼요. 루비는 스테이지를 처음 클리어하면 얻어요.</p>
          <div class="gacha-buttons">
            <button class="btn primary" data-act="pull" data-count="1" ${ruby >= MR.GACHA.cost ? '' : 'disabled'}>1회 뽑기 <small>${gemIcon('ruby')} ${MR.GACHA.cost}</small></button>
            <button class="btn primary" data-act="pull" data-count="10" ${ruby >= MR.GACHA.cost10 ? '' : 'disabled'}>10회 뽑기 <small>${gemIcon('ruby')} ${MR.GACHA.cost10}</small></button>
          </div>
        </section>
        ${results ? `<section class="pull-results">${resultCards}</section>
          <p class="center"><button class="btn" data-act="party">파티 · 돌파 하러 가기</button></p>` : ''}
      </div>`;
    MR.Tutorial.maybe('gacha');
  }

  // ---------- 장비 강화 ----------
  function showEquip(flash) {
    const unlocked = P().isEquipUnlocked();
    if (!equipChar || !P().isCharUnlocked(equipChar)) equipChar = P().roster()[0];
    const k = equipChar;
    const c = MR.CHARACTERS[k];
    const lv = P().level(k);
    const base = MR.statsAtLevel(c.base, lv);
    const eq = MR.equipBonus(P().state.equip[k], gearGrades(k));

    const tabs = P().roster().map((key) => {
      const ch = MR.CHARACTERS[key];
      const total = MR.EQUIP_SLOTS.reduce((sum, sl) => sum + P().enhanceLevel(key, sl.id), 0);
      return `
        <button class="equip-tab ${key === k ? 'on' : ''}" data-act="equip-char" data-key="${key}" style="--c:${ch.color}">
          <img src="${ch.image}" alt=""><span>${ch.name}<small>무기 ${MR.GEAR_GRADES[P().weaponGrade(key)].name} · 강화 합계 +${total}</small></span>
        </button>`;
    }).join('');

    const slots = MR.EQUIP_SLOTS.map((sl) => {
      const elv = P().enhanceLevel(k, sl.id);
      const cost = P().enhanceCost(k, sl.id);
      const isWeapon = sl.id === 'weapon';
      const g = P().gearGrade(k, sl.id);
      const gr = MR.GEAR_GRADES[g];
      const now = MR.equipValue(sl, elv, g);
      const next = cost !== null ? MR.equipValue(sl, elv + 1, g) : null;
      let btn;
      if (!unlocked) btn = `<button class="btn" disabled>🔒</button>`;
      else if (cost === null) btn = `<button class="btn" disabled>최대 강화</button>`;
      else btn = `<button class="btn primary" data-act="enhance" data-slot="${sl.id}" ${P().canEnhance(k, sl.id) ? '' : 'disabled'}>강화 (💎 ${cost})</button>`;
      const pct = (elv / MR.CONFIG.MAX_ENHANCE) * 100;
      return `
        <div class="equip-slot ${flash === sl.id ? 'flash' : ''} ${elv >= MR.CONFIG.MAX_ENHANCE ? 'maxed' : ''} graded-slot grade-${gr.id}" style="--g:${gr.color}">
          <div class="equip-icon">${sl.icon}</div>
          <div class="equip-info">
            <div class="equip-name"><small>${sl.name}</small> ${gradeBadge(g)} ${MR.EQUIP_NAMES[k][sl.id]} <b class="plus">+${elv}</b></div>
            <div class="grade-note">${gradeBonusText(g, sl.id)}${!isWeapon && g >= MR.ARMOR_MAX_GRADE ? ' · 방어구 최고 등급' : ''}</div>
            <div class="equip-stat">${sl.statName} <b>+${now}</b>${next !== null ? ` <span class="next">→ +${next}</span>` : ''}</div>
            <div class="enh-bar"><i style="width:${pct}%"></i></div>
          </div>
          ${btn}
        </div>`;
    }).join('');

    const statRow = (label, key) => `<tr><th>${label}</th><td>${base[key]}</td><td class="equip">${eq[key] ? `+${eq[key]}` : ''}</td><td><b>${base[key] + eq[key]}</b></td></tr>`;

    app().innerHTML = `
      <div class="screen equip-screen">
        <header class="topbar">
          <button class="btn" data-act="map">← 스테이지 선택</button>
          <h1>장비 강화</h1>
          <div class="potions" title="강화석">💎 강화석 <b>${P().state.stones}</b></div>
        </header>
        ${unlocked ? '' : `<p class="notice">장비 강화는 스테이지 ${MR.CONFIG.EQUIP_UNLOCK_STAGE}을 클리어하면 열립니다. 그 뒤로 스테이지를 클리어할 때마다 강화석을 얻어요.</p>`}
        <nav class="equip-tabs">${tabs}</nav>
        <div class="equip-layout" style="--c:${c.color}">
          <aside class="equip-char">
            <img src="${c.image}" alt="${c.name}">
            <h3>${c.name} <small>Lv.${lv}</small></h3>
            <table class="stats equip-total">
              <tr><th></th><td>레벨</td><td>장비</td><td>합계</td></tr>
              ${statRow('최대 체력', 'hp')}${statRow('공격력', 'atk')}${statRow('방어력', 'def')}${statRow('속도', 'spd')}
            </table>
          </aside>
          <div class="equip-slots">${slots}</div>
        </div>
        <p class="equip-note">강화는 실패하지 않아요. 최대 +${MR.CONFIG.MAX_ENHANCE}까지 강화할 수 있어요.</p>
        <section class="grade-info">
          <h3>장비 등급</h3>
          <p class="equip-note">스테이지를 클리어할 때마다 동료 중 무작위 캐릭터의 <b>무기 1개</b>와 <b>방어구 1개</b>(모자·상의·하의·신발 중 무작위)를 무작위 등급으로 얻어요. 지금보다 좋은 등급이면 강화 단계를 그대로 유지한 채 바뀌고, 아니면 분해되어 강화석이 돼요. 방어구는 Epic 까지 있어요.</p>
          <table class="grade-table">
            <tr><th>등급</th>${MR.GEAR_GRADES.map((g, i) => `<td>${gradeBadge(i)}</td>`).join('')}</tr>
            <tr><th>무기</th>${MR.GEAR_GRADES.map((g, i) => `<td>${gradeBonusText(i).replace(' · ', '<br>')}</td>`).join('')}</tr>
            <tr><th>모자·상의·하의</th>${MR.GEAR_GRADES.map((g, i) => `<td>${i > MR.ARMOR_MAX_GRADE ? '—' : `능력치 ×${g.mult}`}</td>`).join('')}</tr>
            <tr><th>신발</th>${MR.GEAR_GRADES.map((g, i) => `<td>${i > MR.ARMOR_MAX_GRADE ? '—' : `속도 ×${g.spdMult}`}</td>`).join('')}</tr>
            <tr><th>분해 시</th>${MR.WEAPON_GRADES.map((g) => `<td>💎 ${g.salvage}</td>`).join('')}</tr>
            ${Object.keys(MR.WEAPON_DROP).filter((ch) => MR.CHAPTERS.some((c) => c.id === Number(ch))).map((ch) => `<tr><th>챕터 ${ch}</th>${MR.WEAPON_DROP[ch].map((p) => `<td>${p}%</td>`).join('')}</tr>`).join('')}
          </table>
          <p class="equip-note">보스 스테이지는 다음 챕터의 확률로 나와요. 방어구에서 Legendary 가 나오면 Epic 으로 얻어요.</p>
        </section>
      </div>`;
    if (unlocked) MR.Tutorial.maybe('equip');
  }

  // ---------- 전투 ----------
  const io = {
    chooseAction(u) {
      return new Promise((resolve) => {
        pendingAction = (choice) => {
          pendingAction = null;
          resolve(choice);
        };
        renderBattle();
      });
    },
    quiz: askQuiz,
    chooseAlly,
    delay: (ms) => new Promise((r) => setTimeout(r, ms)),
    update: () => renderBattle(),
    log(text) {
      logLines.push(text);
      if (logLines.length > 60) logLines.shift();
      const el = document.getElementById('log');
      if (el) {
        el.insertAdjacentHTML('beforeend', `<div>${text}</div>`);
        while (el.childElementCount > 60) el.firstElementChild.remove();
        el.scrollTop = el.scrollHeight;
      }
    },
    fx: showFx,
  };

  async function startBattle(index) {
    if (!P().isPartyReady()) {
      showParty(`⚠ 출전 멤버를 ${MR.PARTY_SIZE}명 골라야 전투를 시작할 수 있어요.`);
      return;
    }
    currentStageIndex = index;
    const stage = MR.STAGES[index];
    selectedChapter = Number(stage.id.split('-')[0]);
    logLines = [];
    battle = new MR.Battle(stage, P().state.levels, io, {
      difficulty: P().state.difficulty,
      equip: P().isEquipUnlocked() ? P().state.equip : null,
      party: P().state.party,
      breaks: P().state.breaks,
      gearGrades: P().state.gearGrade,
    });
    const b = battle;

    app().innerHTML = `
      <div class="screen battle">
        <header class="battle-top">
          <button class="btn" data-act="retreat">← 후퇴</button>
          <div class="stage-title">스테이지 ${stage.id}</div>
          <span class="diff-chip">${MR.Quiz.difficultyName(b.difficulty)}</span>
          <div id="round" class="round"></div>
          <div id="sp" class="sp"></div>
        </header>
        <div id="turn-strip" class="turn-strip"></div>
        <section id="enemy-row" class="enemy-row"></section>
        <section class="mid">
          <div id="action-bar" class="action-bar"></div>
          <div id="log" class="log"></div>
        </section>
        <section id="ally-row" class="ally-row"></section>
      </div>`;

    io.log(`스테이지 ${stage.id} 전투 시작!`);
    const result = await b.run();
    if (battle !== b || result === 'retreat') return;
    showResult(result);
  }

  function renderBattle() {
    const b = battle;
    if (!b || !document.getElementById('ally-row')) return;
    const waiting = !!pendingAction && b.current;

    document.getElementById('round').textContent = `${b.round} 라운드`;
    document.getElementById('sp').innerHTML =
      `<span>스킬 포인트</span>` +
      Array.from({ length: MR.CONFIG.SP_MAX }, (_, i) => `<i class="${i < b.sp ? 'on' : ''}"></i>`).join('');

    document.getElementById('turn-strip').innerHTML =
      '<span class="strip-label">행동 순서</span>' +
      b.upcoming().map((u) => {
        const face = u.side === 'ally'
          ? `<img src="${u.def.image}" alt="">`
          : `<span class="strip-slime">${monsterSvg(u.def)}</span>`;
        return `<span class="strip-unit ${u.side} ${u === b.current ? 'now' : ''}" title="${u.name}" style="--c:${u.def.color || '#888'}">${face}</span>`;
      }).join('');

    const target = b.getTarget();
    document.getElementById('enemy-row').innerHTML = b.enemies.map((e) => `
      <button class="enemy-card ${e.boss ? 'boss' : ''} ${e.alive ? '' : 'dead'} ${e === target ? 'targeted' : ''} ${e === b.current ? 'active' : ''}"
              data-act="target" data-uid="${e.uid}" data-fx="${e.uid}" ${e.alive ? '' : 'disabled'}>
        ${e === target ? '<span class="target-mark">▼ 대상</span>' : ''}
        ${e.boss ? '<span class="boss-tag">BOSS</span>' : ''}
        ${monsterSvg(e.def)}
        <div class="unit-name">${e.name} <small>Lv.${e.level}</small></div>
        ${bar('hp', e.hp, e.maxHp, `${e.hp} / ${e.maxHp}`)}
        <div class="chips">${buffChips(e)}</div>
      </button>`).join('');

    document.getElementById('ally-row').innerHTML = b.allies.map((a) => {
      const full = a.alive && a.energy >= a.maxEnergy;
      const queued = b.ultQueue.includes(a.uid);
      const silenced = b.isSilenced(a);
      return `
        <div class="ally-card ${a.alive ? '' : 'dead'} ${a === b.current ? 'active' : ''} ${silenced ? 'silenced' : ''}" data-fx="${a.uid}" data-ally="${a.uid}" style="--c:${a.def.color}">
          <div class="portrait"><img src="${a.def.image}" alt="${a.name}"></div>
          <div class="ally-info">
            <div class="unit-name">${a.name} <small>Lv.${a.level}${a.breakLevel ? ` · ${a.breakLevel}돌` : ''}</small></div>
            ${bar('hp', a.hp, a.maxHp, `${a.hp} / ${a.maxHp}`)}
            ${bar('en', a.energy, a.maxEnergy, `⚡ ${a.energy} / ${a.maxEnergy}`)}
            <div class="chips">${a.shield ? `<span class="chip shield">🛡 실드 ${a.shield}</span>` : ''}${buffChips(a)}</div>
            <button class="ult-btn ${full && !silenced ? 'ready' : ''}" data-act="ult" data-uid="${a.uid}"
                    ${b.canUlt(a) && !queued ? '' : 'disabled'} title="${MR.describe(a.def.ult.desc, a.ultLevel)}">
              ${silenced ? '🔇 침묵 중' : queued ? '예약됨' : `궁극기 · ${a.def.ult.name}`}
            </button>
          </div>
        </div>`;
    }).join('');

    const bar$ = document.getElementById('action-bar');
    if (waiting && b.current.side === 'ally') {
      setTimeout(() => MR.Tutorial.maybe('battle'), 0);
      const u = b.current;
      const sk = u.def.skill;
      bar$.innerHTML = `
        <div class="turn-label" style="--c:${u.def.color}"><b>${u.name}</b>의 차례 · 대상: ${target ? target.name : '-'}</div>
        <div class="action-buttons">
          <button class="btn action" data-act="attack">
            일반 공격<small>공격력 100% 피해 · 퀴즈 정답 시 SP +1</small>
          </button>
          <button class="btn action primary" data-act="skill" ${b.sp >= 1 && !b.isSilenced(u) ? '' : 'disabled'}>
            ${sk.name} <span class="cost">SP 1</span><small>${b.isSilenced(u) ? '🔇 침묵 중이라 쓸 수 없어요' : MR.describe(sk.desc, u.skillLevel)}</small>
          </button>
        </div>`;
    } else if (b.current && b.current.side === 'enemy') {
      bar$.innerHTML = `<div class="turn-label enemy"><b>${b.current.name}</b>의 차례…</div>`;
    } else {
      bar$.innerHTML = `<div class="turn-label">…</div>`;
    }
  }

  const CIPHER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function fxSpan(cls, text, x, y, style = '') {
    const n = document.createElement('span');
    n.className = cls;
    n.textContent = text;
    n.style.cssText = `left:${x}px;top:${y}px;${style}`;
    document.getElementById('fx-layer').appendChild(n);
    return n;
  }

  function showSkillFx({ uid, name, effect, side, color }) {
    const caster = battle && battle.find(uid);
    const layer = document.getElementById('fx-layer');
    const banner = document.createElement('div');
    banner.className = `skill-banner ${side} ${effect}`;
    if (color) banner.style.setProperty('--c', color);
    banner.innerHTML = `<small>${caster ? caster.name : ''}${effect === 'ult' ? ' · 궁극기' : ''}</small><b>${name}</b>`;
    // 적과 아군 사이(행동 버튼 영역) 가운데에 띄워서 양쪽 이펙트를 가리지 않게 한다
    const mid = document.querySelector('.battle .mid');
    if (mid) {
      const r = mid.getBoundingClientRect();
      banner.style.top = `${r.top + r.height / 2}px`;
    }
    layer.appendChild(banner);
    setTimeout(() => banner.remove(), 1600);

    const casterEl = document.querySelector(`[data-fx="${uid}"]`);
    if (casterEl) {
      casterEl.classList.remove('casting');
      void casterEl.offsetWidth;
      casterEl.classList.add('casting');
      setTimeout(() => casterEl.classList.remove('casting'), 1300);
    }

    if (effect === 'cipher') {
      // 암호 문자가 아군 쪽으로 쏟아지며 다른 글자로 바뀐다 (A → D 같은 치환)
      const row = document.getElementById('ally-row');
      if (!row) return;
      const r = row.getBoundingClientRect();
      row.classList.remove('cipher-hit');
      void row.offsetWidth;
      row.classList.add('cipher-hit');
      setTimeout(() => row.classList.remove('cipher-hit'), 1400);
      for (let i = 0; i < 26; i++) {
        const from = CIPHER_LETTERS[Math.floor(Math.random() * 26)];
        const n = fxSpan('fx-cipher', from, r.left + Math.random() * r.width, r.top - 40 + Math.random() * 30,
          `animation-delay:${Math.random() * 450}ms`);
        setTimeout(() => {
          const shift = 1 + Math.floor(Math.random() * 25);
          n.textContent = CIPHER_LETTERS[(CIPHER_LETTERS.indexOf(from) + shift) % 26];
        }, 450 + Math.random() * 300);
        setTimeout(() => n.remove(), 1500);
      }
    } else if (effect === 'decrypt') {
      // 흐트러진 글자가 제자리로 돌아오며 초록 고리가 퍼진다
      if (!casterEl) return;
      const r = casterEl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.4;
      for (let i = 0; i < 3; i++) {
        const ring = fxSpan('fx-ring', '', cx, cy, `animation-delay:${i * 220}ms`);
        setTimeout(() => ring.remove(), 1500);
      }
      const word = 'DECRYPT';
      [...word].forEach((ch, i) => {
        const n = fxSpan('fx-decrypt', CIPHER_LETTERS[Math.floor(Math.random() * 26)],
          cx + (i - (word.length - 1) / 2) * 18, cy + 30, `animation-delay:${i * 60}ms`);
        setTimeout(() => (n.textContent = ch), 500 + i * 70);
        setTimeout(() => n.remove(), 1500);
      });
    } else if (effect === 'mark') {
      // 허수 i 가 아군 카드마다 내려앉는다
      document.querySelectorAll('.ally-card:not(.dead)').forEach((card, k) => {
        const r = card.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
          const n = fxSpan('fx-imag', pick(['i', 'i', '√−1', 'i²']), r.left + r.width * (0.25 + 0.25 * i), r.top - 30,
            `animation-delay:${k * 90 + i * 120}ms`);
          setTimeout(() => n.remove(), 1600);
        }
      });
    } else if (effect === 'seal') {
      // 아군 전체에 봉인 사슬이 번쩍인다 (대상은 이어서 플레이어가 고른다)
      const row = document.getElementById('ally-row');
      if (!row) return;
      row.classList.remove('seal-hit');
      void row.offsetWidth;
      row.classList.add('seal-hit');
      setTimeout(() => row.classList.remove('seal-hit'), 1400);
      const r = row.getBoundingClientRect();
      const n = fxSpan('fx-seal', '🔇', r.left + r.width / 2, r.top + r.height / 2);
      setTimeout(() => n.remove(), 1400);
    } else if (effect === 'ult' && casterEl) {
      const r = casterEl.getBoundingClientRect();
      const burst = fxSpan('fx-burst', '', r.left + r.width / 2, r.top + r.height / 2, color ? `--c:${color}` : '');
      setTimeout(() => burst.remove(), 1000);
    }
  }

  function showFx(evt) {
    if (evt.type === 'skill') return showSkillFx(evt);
    const { type, uid, amount } = evt;
    const el = document.querySelector(`[data-fx="${uid}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const n = document.createElement('span');
    n.className = `fx-num ${type}`;
    n.textContent = type === 'heal' ? `+${amount}` : type === 'burst' ? `ⅰ -${amount}` : type === 'crit' ? `치명! -${amount}` : `-${amount}`;
    n.style.left = `${r.left + r.width / 2 + (Math.random() * 30 - 15)}px`;
    n.style.top = `${r.top + r.height * 0.3}px`;
    document.getElementById('fx-layer').appendChild(n);
    setTimeout(() => n.remove(), 1000);
    el.classList.remove('hit', 'healed', 'crit-hit');
    void el.offsetWidth;
    el.classList.add(type === 'heal' ? 'healed' : type === 'crit' ? 'crit-hit' : 'hit');
  }

  // ---------- 퀴즈 창 ----------
  function askQuiz({ quiz, title, reward, unit }) {
    return new Promise((resolve) => {
      const color = unit && unit.def.color ? unit.def.color : '#666';
      modal().innerHTML = `
        <div class="overlay">
          <div class="quiz-card" style="--c:${color}">
            <div class="quiz-main">
              <div class="quiz-head">
                ${unit ? `<img src="${unit.def.image}" alt="">` : ''}
                <div><div class="quiz-title">${title}</div><div class="quiz-reward">${reward}</div></div>
                <button type="button" class="pad-toggle" aria-pressed="false" title="손으로 풀이를 적을 수 있는 연습장">📝 연습장</button>
              </div>
              <div class="quiz-q">${quiz.html}</div>
              ${quiz.figure || ''}
              <form class="quiz-form" autocomplete="off">
                <input name="answer" inputmode="${quiz.inputMode}" autocomplete="off" aria-label="정답 입력" />
                <button class="btn primary" type="submit">확인</button>
              </form>
              <div class="quiz-hint">${quiz.hint}</div>
              <div class="quiz-result" aria-live="polite"></div>
            </div>
            <div class="quiz-pad" hidden></div>
          </div>
        </div>`;
      const card = modal().querySelector('.quiz-card');
      const form = modal().querySelector('form');
      const input = form.elements.answer;
      // 터치 화면에서는 입력칸에 바로 초점을 주면 키보드가 연습장을 가리므로, 마우스 환경에서만 자동 초점
      const finePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
      if (finePointer) setTimeout(() => input.focus(), 30);
      MR.Tutorial.maybe('quiz').then(() => finePointer && input.focus());

      // 연습장 (열어 둔 상태는 다음 퀴즈에도 유지)
      const padEl = modal().querySelector('.quiz-pad');
      const toggle = modal().querySelector('.pad-toggle');
      let pad = null;
      const setPad = (open) => {
        padEl.hidden = !open;
        card.classList.toggle('with-pad', open);
        toggle.setAttribute('aria-pressed', String(open));
        toggle.classList.toggle('on', open);
        if (open && !pad) pad = MR.Scratchpad.mount(padEl);
      };
      setPad(MR.Scratchpad.prefOpen());
      toggle.addEventListener('click', () => {
        const open = padEl.hidden;
        MR.Scratchpad.setPref(open);
        setPad(open);
        if (finePointer) input.focus();
      });

      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        if (!input.value.trim() || input.disabled) return;
        const res = quiz.check(input.value);
        input.disabled = true;
        form.querySelector('button').disabled = true;
        const out = modal().querySelector('.quiz-result');
        out.className = `quiz-result ${res.correct ? 'ok' : 'ng'}`;
        out.innerHTML = res.correct
          ? `정답! ${res.note ? `<small>${res.note}</small>` : ''}`
          : `아쉬워요. 정답은 <b>${quiz.answerText}</b>`;
        setTimeout(() => {
          if (pad) pad.destroy();
          closeModal();
          resolve(res.correct);
        }, res.correct ? MR.CONFIG.DELAY.quizCorrect + (res.note ? 900 : 0) : MR.CONFIG.DELAY.quizWrong);
      });
    });
  }

  // 보스 스킬 대상 등 플레이어가 자기 아군 한 명을 고르는 창
  function chooseAlly({ title, desc, allies }) {
    return new Promise((resolve) => {
      modal().innerHTML = `
        <div class="overlay">
          <div class="choose-card">
            <div class="quiz-title">${title}</div>
            <p class="choose-desc">${desc}</p>
            <div class="choose-grid">
              ${allies.map((a) => `
                <button class="choose-ally" data-pick="${a.uid}" style="--c:${a.def.color}">
                  <img src="${a.def.image}" alt="">
                  <b>${a.name}</b>
                  <small>${a.def.role}</small>
                  ${battle && battle.hasMark(a) ? '<span class="chip mark">ⅰ 허수 표식</span>' : ''}
                </button>`).join('')}
            </div>
          </div>
        </div>`;
      modal().querySelectorAll('[data-pick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const picked = allies.find((a) => a.uid === btn.dataset.pick);
          closeModal();
          resolve(picked);
        });
      });
    });
  }

  function closeModal() {
    modal().innerHTML = '';
  }

  // ---------- 결과 창 ----------
  function showResult(result) {
    const stage = MR.STAGES[currentStageIndex];
    let body = '';
    let buttons = '';
    if (result === 'win') {
      const r = P().recordClear(stage);
      const hasNext = currentStageIndex + 1 < MR.STAGES.length;
      body = `
        <p>경험치 물약 <b>🧪 +${r.reward}</b> (보유 ${P().state.potions})${r.firstClear ? '' : '<br><small class="repeat-note">반복 클리어 보상</small>'}</p>
        ${r.stones ? `<p>강화석 <b>💎 +${r.stones}</b> (보유 ${P().state.stones})</p>` : ''}
        ${r.drops.map((d) => {
          const slot = MR.EQUIP_SLOTS.find((x) => x.id === d.slot);
          return `<div class="weapon-drop ${d.upgraded ? 'up' : ''}" style="--g:${MR.GEAR_GRADES[d.grade].color}">
          <span class="weapon-icon">${slot.icon}</span>
          <span><small>${slot.name} 획득</small><b>${gradeBadge(d.grade)} ${MR.EQUIP_NAMES[d.key][d.slot]}</b>
            <small>${MR.CHARACTERS[d.key].name} · ${d.upgraded
              ? `등급 상승! ${MR.GEAR_GRADES[d.before].name} → ${MR.GEAR_GRADES[d.grade].name} (자동 장착)`
              : `이미 ${MR.GEAR_GRADES[d.before].name} 등급이 있어 분해했어요 · 💎 +${d.stones}`}</small></span>
        </div>`;
        }).join('')}
        ${r.gems ? `<p class="gem-reward">최초 클리어 보상 ${MR.GEMS.map((g) => `<span>${gemIcon(g.id)} ${g.name} <b>+${r.gems[g.id]}</b></span>`).join('')}</p>` : ''}
        ${r.joinCopies.map((k) => `<p class="unlock">${MR.CHARACTERS[k].name}은(는) 이미 동료라서 돌파 재료 1개를 얻었어요.</p>`).join('')}
        ${r.levelUpJustUnlocked ? '<p class="unlock">🎉 레벨업 기능이 열렸어요! 「파티 · 레벨업」에서 캐릭터를 강화하세요.</p>' : ''}
        ${r.equipJustUnlocked ? '<p class="unlock">🎉 장비 강화가 열렸어요! 「장비 강화」에서 강화석으로 장비를 강화하세요.</p>' : ''}
        ${r.newMembers.map((k) => `<p class="unlock join"><img src="${MR.CHARACTERS[k].image}" alt="">🎉 <b>${MR.CHARACTERS[k].title ? `[${MR.CHARACTERS[k].title}] ` : ''}${iga(MR.CHARACTERS[k].name)}</b> 동료가 되었어요! 「파티 · 레벨업」에서 출전 멤버로 고를 수 있어요.</p>`).join('')}`;
      buttons = `
        ${hasNext ? '<button class="btn primary" data-act="next">다음 스테이지</button>' : ''}
        ${r.levelUpJustUnlocked ? '<button class="btn" data-act="party">파티 · 레벨업</button>' : ''}
        ${r.equipJustUnlocked ? '<button class="btn" data-act="equip">장비 강화</button>' : ''}
        ${r.newMembers.length && !r.levelUpJustUnlocked ? '<button class="btn" data-act="party">파티 · 레벨업</button>' : ''}
        <button class="btn" data-act="retry">다시 하기</button>
        <button class="btn" data-act="map">스테이지 선택</button>`;
    } else {
      body = '<p>파티가 모두 쓰러졌어요. 레벨업을 하고 다시 도전해 보세요!</p>';
      buttons = `
        <button class="btn primary" data-act="retry">다시 하기</button>
        ${P().isLevelUpUnlocked() ? '<button class="btn" data-act="party">파티 · 레벨업</button>' : ''}
        <button class="btn" data-act="map">스테이지 선택</button>`;
    }
    modal().innerHTML = `
      <div class="overlay">
        <div class="result-card ${result}">
          <h2>${result === 'win' ? '승리!' : '패배…'}</h2>
          <p class="result-stage">스테이지 ${stage.id}</p>
          ${body}
          <div class="result-buttons">${buttons}</div>
        </div>
      </div>`;
  }

  // ---------- 입력 ----------
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const act = el.dataset.act;

    switch (act) {
      case 'stage':
        startBattle(Number(el.dataset.index));
        break;
      case 'chapter':
        selectedChapter = Number(el.dataset.id);
        showMap();
        break;
      case 'difficulty':
        P().setDifficulty(el.dataset.id);
        showMap();
        break;
      case 'party':
        closeModal();
        showParty();
        break;
      case 'map':
        showMap();
        break;
      case 'profile-login': {
        const id = el.dataset.id;
        const acc = MR.Auth.find(id);
        if (!acc) break;
        if (!MR.Auth.needsPin(id)) enterGame(id);
        else askPin(`「${esc(acc.name)}」 로그인`, 'PIN 4자리를 입력하세요.', (pin) => {
          if (!MR.Auth.login(id, pin)) return false;
          selectedChapter = null;
          showMap();
          return true;
        });
        break;
      }
      case 'profile-delete': {
        const id = el.dataset.id;
        const acc = MR.Auth.find(id);
        if (!acc) break;
        if (MR.Auth.needsPin(id)) {
          askPin(`「${esc(acc.name)}」 계정 삭제`, '삭제하면 이 계정의 진행 상황이 모두 사라져요. PIN 을 입력하면 삭제해요.', (pin) => {
            if (!MR.Auth.remove(id, pin)) return false;
            showStart(`「${esc(acc.name)}」 계정을 삭제했어요.`);
            return true;
          });
        } else if (confirm(`「${acc.name}」 계정을 삭제할까요? 이 계정의 진행 상황이 모두 사라져요.`)) {
          MR.Auth.remove(id);
          showStart(`「${esc(acc.name)}」 계정을 삭제했어요.`);
        }
        break;
      }
      case 'tutorial-reset':
        MR.Tutorial.reset();
        showMap();
        break;
      case 'pin-cancel':
        closeModal();
        break;
      case 'logout':
        if (battle) battle.abort();
        MR.Auth.logout();
        showStart();
        break;
      case 'reset':
        if (confirm(`「${MR.Auth.current ? MR.Auth.current.name : ''}」 계정의 모든 진행 상황(클리어 기록, 물약, 레벨, 보석)을 지울까요?`)) {
          P().reset();
          showMap();
        }
        break;
      case 'equip':
        closeModal();
        showEquip();
        break;
      case 'equip-char':
        equipChar = el.dataset.key;
        showEquip();
        break;
      case 'enhance':
        if (P().enhance(equipChar, el.dataset.slot)) showEquip(el.dataset.slot);
        break;
      case 'levelup': {
        const key = el.dataset.key;
        const lvBefore = P().level(key);
        if (P().levelUp(key)) showParty(skillUpNotice(key, lvBefore));
        break;
      }
      case 'limit': {
        const key = el.dataset.key;
        const lvBefore = P().level(key);
        if (P().limitBreak(key)) {
          showParty(`🔓 ${MR.CHARACTERS[key].name} 한계 돌파! 이제 Lv.${P().level(key)}부터 다시 레벨업할 수 있어요. ${skillUpNotice(key, lvBefore)}`);
        }
        break;
      }
      case 'gacha':
        closeModal();
        showGacha();
        break;
      case 'pull': {
        const results = P().pull(Number(el.dataset.count));
        if (results) showGacha(results);
        break;
      }
      case 'break':
        if (P().breakthrough(el.dataset.key)) {
          showParty(`⭐ ${MR.CHARACTERS[el.dataset.key].name} ${P().breakLevel(el.dataset.key)}돌파! ${MR.BREAKTHROUGH.effects[P().breakLevel(el.dataset.key) - 1].desc}`);
        }
        break;
      case 'party-toggle':
        if (P().toggleParty(el.dataset.key)) showParty();
        break;
      case 'retry':
        closeModal();
        startBattle(currentStageIndex);
        break;
      case 'next':
        closeModal();
        startBattle(currentStageIndex + 1);
        break;
      case 'retreat':
        if (battle && confirm('후퇴할까요? 보상은 받을 수 없어요.')) {
          battle.abort();
          if (pendingAction) pendingAction({ type: 'abort' });
          showMap();
        }
        break;
      case 'target':
        if (battle) {
          battle.selectTarget(el.dataset.uid);
          renderBattle();
        }
        break;
      case 'attack':
      case 'skill':
        if (pendingAction) pendingAction({ type: act });
        break;
      case 'ult':
        if (battle && battle.requestUltimate(el.dataset.uid)) {
          // 행동을 고르는 중이면 바로 발동, 아니면 진행 중인 행동이 끝난 뒤 발동
          if (pendingAction) pendingAction({ type: 'interrupt' });
          else renderBattle();
        }
        break;
    }
  });

  MR.UI = {
    start() {
      showStart();
    },
    // 개발용: 브라우저 콘솔에서 MR.UI.battle() 로 현재 전투 상태를 볼 수 있다
    battle: () => battle,
  };
})((globalThis.MR = globalThis.MR || {}));
