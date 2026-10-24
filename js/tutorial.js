// 튜토리얼: 화면의 한 부분을 밝게 비추고 설명 말풍선을 띄우는 단계별 안내.
// MR.Tutorial.maybe(id) 는 그 튜토리얼을 아직 안 봤으면 보여 준다 (계정별로 기억).
// 각 단계: { target: CSS 선택자(없으면 화면 가운데), title, text, when?: () => 보여 줄지 }
(function (MR) {
  const TOURS = {
    map: [
      { title: 'The ZERO 에 온 걸 환영해요!', text: '수학 문제를 풀어서 몬스터와 싸우는 턴제 RPG예요. 처음 해 보는 사람을 위해 화면을 하나씩 소개할게요.' },
      { target: '.difficulty', title: '문제 난이도', text: '내 학년에 맞는 난이도를 골라 주세요. 초등 1~2학년부터 고등학교 3학년까지 있고, 언제든 바꿀 수 있어요.' },
      { target: '.party-strip', title: '내 파티', text: '함께 싸우는 동료 4명이에요. 캐릭터마다 잘하는 수학 단원이 달라요.' },
      { target: '[data-act=gacha]', title: '캐릭터 뽑기', text: '스테이지를 처음 깨면 루비를 받아요. 루비로 캐릭터를 뽑을 수 있어요.' },
      { target: '[data-act=party]', title: '파티 · 레벨업', text: '경험치 물약으로 캐릭터를 강하게 만들어요. 1-2를 클리어하면 열려요.' },
      { target: '.stage-grid .stage-btn', title: '첫 스테이지', text: '여기를 눌러 첫 전투를 시작해 보세요! 전투에서도 차근차근 알려 줄게요.' },
    ],
    battle: [
      { target: '.enemy-row', title: '적', text: '싸울 몬스터예요. 몬스터를 누르면 공격할 대상(▼ 대상)을 바꿀 수 있어요.' },
      { target: '.turn-strip', title: '행동 순서', text: '속도가 빠른 순서대로 한 명씩 행동해요. 맨 앞이 지금 차례예요.' },
      { target: '.ally-row', title: '내 캐릭터', text: '초록 막대는 체력, 노란 막대는 에너지예요. 체력이 0이 되면 쓰러져요.' },
      { target: '[data-act=attack]', title: '일반 공격', text: '적을 공격한 뒤 덧셈·뺄셈 같은 퀴즈가 나와요. 맞히면 스킬 포인트(◆)를 1개 얻어요.' },
      { target: '[data-act=skill]', title: '고유 스킬', text: '스킬 포인트 1개를 써서 더 강한 기술을 써요. 캐릭터만의 퀴즈를 맞히면 보너스 효과가 생겨요!' },
      { target: '.sp', title: '스킬 포인트', text: '파티 모두가 함께 쓰는 포인트예요. 일반 공격으로 모으고 고유 스킬로 써요.' },
      { target: '.ult-btn', title: '궁극기', text: '에너지가 가득 차면 버튼이 빛나요. 언제든 눌러 두면 지금 행동이 끝난 뒤 바로 발동해요.' },
      { target: '.log', title: '전투 기록', text: '무슨 일이 일어났는지 여기에 적혀요. 이제 직접 싸워 보세요. 화이팅!' },
    ],
    quiz: [
      { target: '.quiz-q', title: '퀴즈', text: '문제를 풀어 정답을 입력하고 「확인」(또는 Enter)을 누르세요. 틀려도 공격은 그대로 들어가요.' },
      { target: '.quiz-hint', title: '답 쓰는 법', text: '답의 형태가 여기에 적혀 있어요. 분수는 3/4, 대분수는 1 1/2, 음수는 -5 처럼 써요.' },
      { target: '.pad-toggle', title: '연습장', text: '계산이 복잡하면 연습장을 열어 손으로 풀이를 적어 보세요.' },
    ],
    levelup: [
      { target: '.char-grid .char-card .stats', title: '레벨업', text: '아래 「레벨업」 버튼을 누르면 경험치 물약을 써서 체력·공격력·방어력이 올라요. 레벨이 오르면 고유 스킬과 궁극기도 강해져요.' },
      { target: '.char-grid .char-card .break-box', title: '돌파', text: '뽑기에서 같은 캐릭터가 또 나오면 돌파 재료가 돼요. 돌파하면 능력치와 특별한 효과가 생겨요.' },
    ],
    party: [
      { target: '.party-toggle', title: '출전 멤버 고르기', text: '동료가 5명 이상이 되면 이 버튼으로 전투에 나갈 4명을 골라요.' },
    ],
    equip: [
      { target: '.equip-tabs', title: '장비 강화', text: '캐릭터마다 무기·모자·상의·하의·신발을 끼고 있어요. 위에서 캐릭터를 골라요.' },
      { target: '.equip-slots', title: '강화', text: '스테이지를 클리어하면 받는 강화석(💎)으로 장비를 강화해요. 강화는 실패하지 않아요!' },
    ],
    gacha: [
      { target: '.gacha-faces', title: '뽑기', text: '모든 캐릭터가 같은 확률로 나와요. 처음 나온 캐릭터는 동료가 되고, 이미 있는 캐릭터는 돌파 재료가 돼요.' },
      { target: '.gacha-buttons', title: '루비', text: '루비 100개로 1회, 900개로 10회 뽑을 수 있어요.' },
    ],
  };

  let active = null; // { steps, index, resolve }
  let box, card;

  function done() {
    return (MR.Progress.state.tutorial = MR.Progress.state.tutorial || {});
  }

  function ensureLayer() {
    if (box && document.body.contains(box)) return;
    const layer = document.createElement('div');
    layer.id = 'tutorial-layer';
    layer.innerHTML = '<div class="tut-block"></div><div class="tut-box"></div><div class="tut-card" role="dialog" aria-live="polite"></div>';
    document.body.appendChild(layer);
    box = layer.querySelector('.tut-box');
    card = layer.querySelector('.tut-card');
    card.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-tut]');
      if (!btn) return;
      if (btn.dataset.tut === 'next') go(active.index + 1);
      else if (btn.dataset.tut === 'prev') go(active.index - 1);
      else finish();
    });
    window.addEventListener('resize', () => active && place());
  }

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // 대상이 화면에 없는 단계는 건너뛴다
  function usable(step) {
    if (step.when && !step.when()) return false;
    return !step.target || visible(document.querySelector(step.target));
  }

  function go(i) {
    const steps = active.steps;
    let idx = i;
    const dir = i >= active.index ? 1 : -1;
    while (idx >= 0 && idx < steps.length && !usable(steps[idx])) idx += dir;
    if (idx < 0) idx = active.index;
    if (idx >= steps.length) return finish();
    active.index = idx;
    render();
  }

  function render() {
    const step = active.steps[active.index];
    const usableCount = active.steps.filter(usable).length;
    const pos = active.steps.slice(0, active.index + 1).filter(usable).length;
    const last = !active.steps.slice(active.index + 1).some(usable);
    card.innerHTML = `
      <div class="tut-step">${pos} / ${usableCount}</div>
      <b class="tut-title">${step.title}</b>
      <p>${step.text}</p>
      <div class="tut-buttons">
        <button class="link-btn" data-tut="skip">건너뛰기</button>
        ${pos > 1 ? '<button class="btn" data-tut="prev">이전</button>' : ''}
        <button class="btn primary" data-tut="next">${last ? '시작하기!' : '다음 ▶'}</button>
      </div>`;
    const target = step.target && document.querySelector(step.target);
    if (target) {
      const r = target.getBoundingClientRect();
      // 화면보다 큰 대상은 위쪽을 맞추고, 아니면 가장 가까운 위치로 스크롤
      target.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? 'start' : 'nearest', behavior: 'auto' });
    }
    place();
    setTimeout(() => card.querySelector('[data-tut=next]').focus(), 20);
  }

  // 밝힐 영역과 말풍선 위치
  function place() {
    const step = active.steps[active.index];
    const target = step.target && document.querySelector(step.target);
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!target) {
      box.style.cssText = `left:${vw / 2}px;top:${vh / 2}px;width:0;height:0;`;
      card.style.cssText = `left:50%;top:50%;transform:translate(-50%,-50%);`;
      return;
    }
    const r = target.getBoundingClientRect();
    const pad = 6;
    box.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;`;
    const cw = Math.min(340, vw - 24);
    const left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), vw - cw - 12);
    const below = r.bottom + 14;
    const ch = card.offsetHeight || 170;
    const top = below + ch < vh ? below : Math.max(12, r.top - ch - 14);
    card.style.cssText = `left:${left}px;top:${top}px;width:${cw}px;`;
  }

  function finish() {
    if (!active) return;
    const { id, resolve } = active;
    done()[id] = true;
    MR.Progress.save();
    active = null;
    document.getElementById('tutorial-layer')?.classList.remove('on');
    resolve();
  }

  MR.Tutorial = {
    tours: TOURS,
    isActive: () => !!active,

    // 아직 안 본 튜토리얼이면 보여 준다
    maybe(id) {
      if (active || !MR.Auth.current || done()[id] || !TOURS[id]) return Promise.resolve();
      return this.run(id);
    },

    run(id) {
      if (active) return Promise.resolve();
      ensureLayer();
      return new Promise((resolve) => {
        active = { id, steps: TOURS[id], index: 0, resolve };
        // 화면이 그려진 다음 위치를 잰다
        const mine = active;
        requestAnimationFrame(() => {
          // 그 사이 취소되었거나 다른 튜토리얼로 바뀌었으면 아무것도 하지 않는다
          if (active !== mine) return;
          if (!active.steps.some(usable)) return finish();
          document.getElementById('tutorial-layer').classList.add('on');
          go(0);
        });
      });
    },

    // 화면을 통째로 바꿀 때(로그아웃 등) 보던 튜토리얼을 본 것으로 치지 않고 닫는다
    cancel() {
      if (!active) return;
      const { resolve } = active;
      active = null;
      document.getElementById('tutorial-layer')?.classList.remove('on');
      resolve();
    },

    // 「튜토리얼 다시 보기」: 모든 튜토리얼을 안 본 상태로 되돌린다
    reset() {
      MR.Progress.state.tutorial = {};
      MR.Progress.save();
    },
  };
})((globalThis.MR = globalThis.MR || {}));
