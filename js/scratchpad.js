// 연습장: 퀴즈 창 옆에 손글씨로 풀이를 적을 수 있는 모눈 캔버스.
// 마우스, 손가락, 펜 모두 Pointer Events 로 처리한다. 퀴즈가 끝나면 내용은 지워진다.
(function (MR) {
  const PREF_KEY = 'mathrpg.scratchpad.open';
  const PEN_WIDTH = 2.6;
  const ERASER_WIDTH = 22;
  const COLORS = [
    { color: '#2a2622', name: '검정' },
    { color: '#d32f2f', name: '빨강' },
    { color: '#3a6fd8', name: '파랑' },
  ];

  // 연습장을 열어 둔 상태를 브라우저에 기억 (저장이 막혀 있으면 기본값: 닫힘)
  function prefOpen() {
    try {
      return localStorage.getItem(PREF_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setPref(open) {
    try {
      localStorage.setItem(PREF_KEY, open ? '1' : '0');
    } catch (e) {
      // 무시
    }
  }

  function mount(root) {
    root.innerHTML = `
      <div class="pad-toolbar" role="toolbar" aria-label="연습장 도구">
        ${COLORS.map((c, i) => `
          <button type="button" class="pad-tool ${i === 0 ? 'on' : ''}" data-tool="pen" data-color="${c.color}" title="${c.name} 펜">
            <i style="background:${c.color}"></i>${c.name}
          </button>`).join('')}
        <button type="button" class="pad-tool" data-tool="eraser" title="지우개">🧽 지우개</button>
        <span class="pad-spacer"></span>
        <button type="button" class="pad-tool" data-action="undo" title="되돌리기">↶ 되돌리기</button>
        <button type="button" class="pad-tool" data-action="clear" title="모두 지우기">🗑 모두 지우기</button>
      </div>
      <canvas class="pad-canvas" aria-label="연습장. 풀이를 자유롭게 적어 보세요."></canvas>`;

    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const strokes = []; // { erase, color, width, points: [[x, y], ...] } (CSS 픽셀 좌표)
    let current = null;
    let tool = { erase: false, color: COLORS[0].color };

    function drawSegment(s, from, to) {
      ctx.save();
      ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.stroke();
      ctx.restore();
    }

    function drawStroke(s) {
      const pts = s.points;
      if (pts.length === 1) drawSegment(s, pts[0], [pts[0][0] + 0.01, pts[0][1]]);
      for (let i = 1; i < pts.length; i++) drawSegment(s, pts[i - 1], pts[i]);
    }

    function redraw() {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      strokes.forEach(drawStroke);
    }

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        redraw();
      }
    }

    function point(ev) {
      const r = canvas.getBoundingClientRect();
      return [ev.clientX - r.left, ev.clientY - r.top];
    }

    canvas.addEventListener('pointerdown', (ev) => {
      if (ev.button !== undefined && ev.button > 0) return;
      ev.preventDefault();
      canvas.setPointerCapture(ev.pointerId);
      current = { erase: tool.erase, color: tool.color, width: tool.erase ? ERASER_WIDTH : PEN_WIDTH, points: [point(ev)] };
      strokes.push(current);
      drawStroke(current);
    });

    canvas.addEventListener('pointermove', (ev) => {
      if (!current) return;
      ev.preventDefault();
      const events = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev];
      for (const e of events.length ? events : [ev]) {
        const p = point(e);
        const prev = current.points[current.points.length - 1];
        current.points.push(p);
        drawSegment(current, prev, p);
      }
    });

    const finish = () => {
      current = null;
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);

    root.querySelector('.pad-toolbar').addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      if (btn.dataset.action === 'undo') {
        strokes.pop();
        redraw();
      } else if (btn.dataset.action === 'clear') {
        strokes.length = 0;
        redraw();
      } else if (btn.dataset.tool) {
        tool = btn.dataset.tool === 'eraser' ? { erase: true, color: '#000' } : { erase: false, color: btn.dataset.color };
        root.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b === btn));
      }
    });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    requestAnimationFrame(resize);

    return {
      destroy() {
        if (ro) ro.disconnect();
      },
    };
  }

  MR.Scratchpad = { mount, prefOpen, setPref };
})((globalThis.MR = globalThis.MR || {}));
