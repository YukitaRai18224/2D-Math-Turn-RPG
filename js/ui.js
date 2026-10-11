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

  // ---------- 공통 ----------
  function bar(cls, value, max, text) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    return `<div class="bar ${cls}"><i style="width:${pct}%"></i><span>${text}</span></div>`;
  }

  function monsterSvg(look) {
    return look === 'witch' ? witchSvg() : slimeSvg(look);
  }

  // 암호의 대마녀 비즈네르
  function witchSvg() {
    return `
      <svg viewBox="0 -10 120 120" class="slime-svg witch-svg" aria-hidden="true">
        <ellipse cx="60" cy="104" rx="38" ry="5" fill="rgba(0,0,0,.15)"/>
        <g class="cipher-orbit" font-family="monospace" font-weight="700" font-size="11" fill="#b48cff">
          <text x="8" y="44">V</text><text x="104" y="38">K</text><text x="14" y="88">Q</text><text x="100" y="84">Z</text>
        </g>
        <path d="M60 46 L94 104 L26 104 Z" fill="#4a2386"/>
        <path d="M60 46 L67 104 L53 104 Z" fill="#7b3fd0"/>
        <path d="M30 104 L90 104 L88 98 L32 98 Z" fill="#e0b84a"/>
        <path d="M46 36 C42 56 38 72 32 86 L50 66 Z" fill="#2d1b4e"/>
        <path d="M74 36 C78 56 82 72 88 86 L70 66 Z" fill="#2d1b4e"/>
        <circle cx="60" cy="40" r="13" fill="#f6dccb"/>
        <path d="M47 38 Q52 28 60 30 Q68 28 73 38 Q66 33 60 34 Q54 33 47 38Z" fill="#2d1b4e"/>
        <ellipse cx="55" cy="42" rx="2" ry="2.6" fill="#7b3fd0"/>
        <ellipse cx="65" cy="42" rx="2" ry="2.6" fill="#7b3fd0"/>
        <path d="M56 49 Q60 51 64 48" stroke="#8a3a5a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M28 30 Q60 20 92 30 Q60 37 28 30 Z" fill="#2a1450"/>
        <path d="M43 28 L60 -6 Q63 -9 66 -5 L77 27 Z" fill="#2a1450"/>
        <path d="M44 25 L76 24 L77 28 L43 29 Z" fill="#e0b84a"/>
        <line x1="95" y1="54" x2="101" y2="104" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/>
        <circle class="witch-orb" cx="94" cy="50" r="6.5" fill="#c9a6ff"/>
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

  function buffChips(u) {
    return u.buffs
      .map((b) => {
        const up = b.pct > 0;
        return `<span class="chip ${up ? 'up' : 'down'}">${b.label} ${up ? '+' : ''}${Math.round(b.pct * 100)}% · ${b.turns}턴</span>`;
      })
      .join('');
  }

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
      const enemies = st.enemies.map((k) => `<span class="mini-slime">${monsterSvg(MR.MONSTERS[k].look)}</span>`).join('');
      return `
        <button class="stage-btn ${cleared ? 'cleared' : ''} ${st.boss ? 'boss' : ''}" data-act="stage" data-index="${i}" ${unlocked ? '' : 'disabled'}>
          ${st.boss ? '<span class="boss-tag">BOSS</span>' : ''}
          <span class="stage-id">${st.id}</span>
          <span class="stage-enemies">${unlocked ? enemies : '🔒'}</span>
          <span class="stage-meta">${cleared ? '✓ 클리어' : unlocked ? `🧪 ${st.reward}` : '잠김'}</span>
        </button>`;
    }).join('');

    app().innerHTML = `
      <div class="screen map">
        <header class="topbar">
          <h1>수학 턴제 RPG</h1>
          <div class="potions" title="경험치 물약">🧪 경험치 물약 <b>${s.potions}</b></div>
        </header>
        <section class="party-strip">
          ${MR.PARTY_ORDER.map((k) => {
            const c = MR.CHARACTERS[k];
            return `<div class="party-face" style="--c:${c.color}"><img src="${c.image}" alt=""><span>${c.name}<small>Lv.${P().level(k)}</small></span></div>`;
          }).join('')}
          <button class="btn" data-act="party">파티 · 레벨업${P().isLevelUpUnlocked() ? '' : ' 🔒'}</button>
        </section>
        <section class="difficulty">
          <h2>문제 난이도</h2>
          <div class="segmented" role="radiogroup" aria-label="문제 난이도">
            ${MR.Quiz.DIFFICULTIES.map((d) => `
              <button role="radio" aria-checked="${d.id === s.difficulty}" class="${d.id === s.difficulty ? 'on' : ''}"
                      data-act="difficulty" data-id="${d.id}">${d.name}</button>`).join('')}
          </div>
          <p class="difficulty-note">${MR.PARTY_ORDER.map((k) => `<span style="--c:${MR.CHARACTERS[k].color}"><b>${MR.CHARACTERS[k].name}</b> ${MR.Quiz.label(MR.CHARACTERS[k].quiz, s.difficulty)}</span>`).join('')}<span><b>일반 공격</b> ${MR.Quiz.label('addSub', s.difficulty)}</span></p>
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
          <button class="link-btn" data-act="reset">진행 상황 초기화</button>
        </footer>
      </div>`;
  }

  // ---------- 파티 · 레벨업 ----------
  function showParty() {
    const unlocked = P().isLevelUpUnlocked();
    const diff = P().state.difficulty;
    const cards = MR.PARTY_ORDER.map((k) => {
      const c = MR.CHARACTERS[k];
      const lv = P().level(k);
      const now = MR.statsAtLevel(c.base, lv);
      const cost = P().levelUpCost(k);
      const next = cost !== null ? MR.statsAtLevel(c.base, lv + 1) : null;
      const row = (label, key) =>
        `<tr><th>${label}</th><td>${now[key]}</td><td class="next">${next ? `→ ${next[key]}` : ''}</td></tr>`;
      let btn;
      if (!unlocked) btn = `<button class="btn" disabled>🔒 ${MR.CONFIG.LEVEL_UNLOCK_STAGE} 클리어 시 해금</button>`;
      else if (cost === null) btn = `<button class="btn" disabled>최대 레벨</button>`;
      else btn = `<button class="btn primary" data-act="levelup" data-key="${k}" ${P().canLevelUp(k) ? '' : 'disabled'}>레벨업 (🧪 ${cost})</button>`;

      return `
        <article class="char-card" style="--c:${c.color}">
          <div class="char-portrait"><img src="${c.image}" alt="${c.name}"></div>
          <div class="char-body">
            <h3>${c.name} <small>${c.role}</small> <span class="lv">Lv.${lv}</span></h3>
            <table class="stats">
              ${row('최대 체력', 'hp')}${row('공격력', 'atk')}${row('방어력', 'def')}
              <tr><th>속도</th><td>${now.spd}</td><td></td></tr>
            </table>
            ${btn}
            <dl class="kit">
              <dt>일반 공격</dt><dd>선택한 적에게 공격력 100% 피해. <em>${MR.Quiz.label('addSub', diff)} 퀴즈</em> 정답 시 스킬 포인트 +1</dd>
              <dt>고유 스킬 · ${c.skill.name}</dt><dd>${c.skill.desc}. <em>${MR.Quiz.label(c.quiz, diff)} 퀴즈</em> ${c.skill.bonusDesc}</dd>
              <dt>궁극기 · ${c.ult.name}</dt><dd>${c.ult.desc}. 에너지 ${c.maxEnergy} 소모, 퀴즈 정답 시 소모량의 ${Math.round(c.ult.refund * 100)}% 회복</dd>
              <dt>특성 · ${c.trait.name}</dt><dd>${c.trait.desc}</dd>
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
        </header>
        ${unlocked ? '' : `<p class="notice">레벨업 기능은 스테이지 ${MR.CONFIG.LEVEL_UNLOCK_STAGE}을 클리어하면 열립니다. 물약은 미리 모아둘 수 있어요.</p>`}
        <div class="char-grid">${cards}</div>
      </div>`;
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
    currentStageIndex = index;
    const stage = MR.STAGES[index];
    selectedChapter = Number(stage.id.split('-')[0]);
    logLines = [];
    battle = new MR.Battle(stage, P().state.levels, io, { difficulty: P().state.difficulty });
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
          : `<span class="strip-slime">${monsterSvg(u.def.look)}</span>`;
        return `<span class="strip-unit ${u.side} ${u === b.current ? 'now' : ''}" title="${u.name}" style="--c:${u.def.color || '#888'}">${face}</span>`;
      }).join('');

    const target = b.getTarget();
    document.getElementById('enemy-row').innerHTML = b.enemies.map((e) => `
      <button class="enemy-card ${e.boss ? 'boss' : ''} ${e.alive ? '' : 'dead'} ${e === target ? 'targeted' : ''} ${e === b.current ? 'active' : ''}"
              data-act="target" data-uid="${e.uid}" data-fx="${e.uid}" ${e.alive ? '' : 'disabled'}>
        ${e === target ? '<span class="target-mark">▼ 대상</span>' : ''}
        ${e.boss ? '<span class="boss-tag">BOSS</span>' : ''}
        ${monsterSvg(e.def.look)}
        <div class="unit-name">${e.name} <small>Lv.${e.level}</small></div>
        ${bar('hp', e.hp, e.maxHp, `${e.hp} / ${e.maxHp}`)}
        <div class="chips">${buffChips(e)}</div>
      </button>`).join('');

    document.getElementById('ally-row').innerHTML = b.allies.map((a) => {
      const full = a.alive && a.energy >= a.maxEnergy;
      const queued = b.ultQueue.includes(a.uid);
      return `
        <div class="ally-card ${a.alive ? '' : 'dead'} ${a === b.current ? 'active' : ''}" data-fx="${a.uid}" style="--c:${a.def.color}">
          <div class="portrait"><img src="${a.def.image}" alt="${a.name}"></div>
          <div class="ally-info">
            <div class="unit-name">${a.name} <small>Lv.${a.level}</small></div>
            ${bar('hp', a.hp, a.maxHp, `${a.hp} / ${a.maxHp}`)}
            ${bar('en', a.energy, a.maxEnergy, `⚡ ${a.energy} / ${a.maxEnergy}`)}
            <div class="chips">${buffChips(a)}</div>
            <button class="ult-btn ${full ? 'ready' : ''}" data-act="ult" data-uid="${a.uid}"
                    ${full && !queued && !b.over ? '' : 'disabled'} title="${a.def.ult.desc}">
              ${queued ? '예약됨' : `궁극기 · ${a.def.ult.name}`}
            </button>
          </div>
        </div>`;
    }).join('');

    const bar$ = document.getElementById('action-bar');
    if (waiting && b.current.side === 'ally') {
      const u = b.current;
      const sk = u.def.skill;
      bar$.innerHTML = `
        <div class="turn-label" style="--c:${u.def.color}"><b>${u.name}</b>의 차례 · 대상: ${target ? target.name : '-'}</div>
        <div class="action-buttons">
          <button class="btn action" data-act="attack">
            일반 공격<small>공격력 100% 피해 · 퀴즈 정답 시 SP +1</small>
          </button>
          <button class="btn action primary" data-act="skill" ${b.sp >= 1 ? '' : 'disabled'}>
            ${sk.name} <span class="cost">SP 1</span><small>${sk.desc}</small>
          </button>
        </div>`;
    } else if (b.current && b.current.side === 'enemy') {
      bar$.innerHTML = `<div class="turn-label enemy"><b>${b.current.name}</b>의 차례…</div>`;
    } else {
      bar$.innerHTML = `<div class="turn-label">…</div>`;
    }
  }

  const CIPHER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
    n.textContent = type === 'heal' ? `+${amount}` : `-${amount}`;
    n.style.left = `${r.left + r.width / 2 + (Math.random() * 30 - 15)}px`;
    n.style.top = `${r.top + r.height * 0.3}px`;
    document.getElementById('fx-layer').appendChild(n);
    setTimeout(() => n.remove(), 1000);
    el.classList.remove('hit', 'healed');
    void el.offsetWidth;
    el.classList.add(type === 'heal' ? 'healed' : 'hit');
  }

  // ---------- 퀴즈 창 ----------
  function askQuiz({ quiz, title, reward, unit }) {
    return new Promise((resolve) => {
      const color = unit && unit.def.color ? unit.def.color : '#666';
      modal().innerHTML = `
        <div class="overlay">
          <div class="quiz-card" style="--c:${color}">
            <div class="quiz-head">
              ${unit ? `<img src="${unit.def.image}" alt="">` : ''}
              <div><div class="quiz-title">${title}</div><div class="quiz-reward">${reward}</div></div>
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
        </div>`;
      const form = modal().querySelector('form');
      const input = form.elements.answer;
      setTimeout(() => input.focus(), 30);

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
          closeModal();
          resolve(res.correct);
        }, res.correct ? MR.CONFIG.DELAY.quizCorrect + (res.note ? 900 : 0) : MR.CONFIG.DELAY.quizWrong);
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
        <p>경험치 물약 <b>🧪 +${r.reward}</b> (보유 ${P().state.potions})</p>
        ${r.levelUpJustUnlocked ? '<p class="unlock">🎉 레벨업 기능이 열렸어요! 「파티 · 레벨업」에서 캐릭터를 강화하세요.</p>' : ''}`;
      buttons = `
        ${hasNext ? '<button class="btn primary" data-act="next">다음 스테이지</button>' : ''}
        ${r.levelUpJustUnlocked ? '<button class="btn" data-act="party">파티 · 레벨업</button>' : ''}
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
      case 'reset':
        if (confirm('모든 진행 상황(클리어 기록, 물약, 레벨)을 지울까요?')) {
          P().reset();
          showMap();
        }
        break;
      case 'levelup':
        if (P().levelUp(el.dataset.key)) showParty();
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
      P().load();
      showMap();
    },
    // 개발용: 브라우저 콘솔에서 MR.UI.battle() 로 현재 전투 상태를 볼 수 있다
    battle: () => battle,
  };
})((globalThis.MR = globalThis.MR || {}));
