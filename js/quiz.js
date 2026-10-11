// 수학 퀴즈 생성기. 난이도 3단계 × 퀴즈 종류 5가지.
// MR.Quiz.make(kind, difficulty) → { kind, html, figure, hint, inputMode, answerText, check(input) → { correct, note } }
//
// 퀴즈 종류: addSub(일반 공격) / multiply(카가리) / fraction(아쿠아마린) / division(프리시아) / geometry(히나)
// 1~2학년 교육과정에는 분수·나눗셈이 없어서 비슷한 역할의 단원(가르기·모으기, 곱셈구구 거꾸로)으로 대신한다.
(function (MR) {
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const MINUS = '−';
  const fmt = (n) => (n < 0 ? `${MINUS}${-n}` : String(n));
  // 식 안의 계수/상수항: x² + 5x − 3 형태로 표시
  const term = (n, suffix = '') => n === 0 ? '' : (n < 0 ? ` ${MINUS} ${-n === 1 && suffix ? '' : -n}${suffix}` : ` + ${n === 1 && suffix ? '' : n}${suffix}`);
  // 숫자 뒤 조사: 받침이 있는 수(0,1,3,6,7,8,10)는 '은/과', 없으면 '는/와'
  const hasBatchim = (n) => [0, 1, 3, 6, 7, 8].includes(n % 10) || n === 10;
  const eun = (n) => `${n}${hasBatchim(n) ? '은' : '는'}`;
  const gwa = (n) => `${n}${hasBatchim(n) ? '과' : '와'}`;

  const DIFFICULTIES = [
    { id: 'g12', name: '초등 1~2학년' },
    { id: 'g56', name: '초등 5~6학년' },
    { id: 'm3', name: '중학교 3학년' },
  ];
  const DEFAULT = 'g56';

  const LABELS = {
    g12: {
      addSub: '한·두 자리 수의 덧셈/뺄셈',
      multiply: '곱셈구구',
      fraction: '가르기·모으기와 세 수의 계산',
      division: '곱셈구구로 □ 구하기',
      geometry: '도형의 변·꼭짓점과 길이',
    },
    g56: {
      addSub: '자연수의 덧셈/뺄셈',
      multiply: '자연수의 곱셈',
      fraction: '분수의 덧셈/뺄셈',
      division: '자연수의 나눗셈',
      geometry: '도형의 둘레/넓이',
    },
    m3: {
      addSub: '제곱근의 덧셈/뺄셈',
      multiply: '곱셈 공식과 제곱근의 곱셈',
      fraction: '삼각비와 유리수의 계산',
      division: '인수분해와 이차방정식',
      geometry: '원의 성질과 피타고라스 정리',
    },
  };

  // ---------- 정답 판정 ----------
  function parseInteger(input, allowNegative) {
    const s = String(input).trim().replace(/,/g, '').replace(/[−–]/g, '-').replace(/\s+/g, '');
    const re = allowNegative ? /^-?\d+$/ : /^\d+$/;
    return re.test(s) ? Number(s) : null;
  }

  function intQuiz(kind, html, answer, extra = {}) {
    const neg = !!extra.allowNegative;
    return {
      kind,
      html,
      hint: neg ? '정수로 입력하세요. 음수는 -5 처럼 입력해요.' : '자연수로 입력하세요.',
      inputMode: neg ? 'text' : 'numeric',
      answerText: fmt(answer),
      check(input) {
        return { correct: parseInteger(input, neg) === answer };
      },
      ...extra,
    };
  }

  // ---------- 분수 ----------
  // 분수는 { n, d } (d > 0, 부호는 n 에)로 다룬다.
  const reduce = ({ n, d }) => {
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  };

  function fracHtml(n, d) {
    return `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
  }

  // 대분수 표시 (양수만): 3/2 → 1 1/2
  function mixedHtml({ n, d }) {
    const w = Math.floor(n / d);
    const r = n % d;
    if (r === 0) return String(w);
    return (w ? `${w}` : '') + fracHtml(r, d);
  }

  function mixedText({ n, d }) {
    const w = Math.floor(n / d);
    const r = n % d;
    if (r === 0) return String(w);
    return (w ? `${w} ` : '') + `${r}/${d}`;
  }

  // 가분수 표시 (부호 포함)
  function improperHtml({ n, d }) {
    if (d === 1) return fmt(n);
    return (n < 0 ? MINUS : '') + fracHtml(Math.abs(n), d);
  }

  function improperText({ n, d }) {
    return d === 1 ? fmt(n) : `${n < 0 ? '-' : ''}${Math.abs(n)}/${d}`;
  }

  // "3/4", "1 1/2", "2", "-5/6" 를 { n, d, form } 로 해석
  function parseFraction(input) {
    let s = String(input).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    let sign = 1;
    if (s.startsWith('-')) {
      sign = -1;
      s = s.slice(1).trim();
    }
    let m;
    if ((m = s.match(/^(\d+)$/))) return { n: sign * +m[1], d: 1, form: 'int' };
    if ((m = s.match(/^(\d+)\/(\d+)$/)) && +m[2] > 0) return { n: sign * +m[1], d: +m[2], form: 'frac', num: +m[1] };
    if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/)) && +m[3] > 0)
      return { n: sign * (+m[1] * +m[3] + +m[2]), d: +m[3], form: 'mixed', num: +m[2] };
    return null;
  }

  // style: 'mixed' 면 대분수(초등), 'improper' 면 가분수(중학교)를 기약 형태로 본다
  function fractionQuiz(html, answer, style, extra = {}) {
    const ans = reduce(answer);
    const text = style === 'mixed' ? mixedText(ans) : improperText(ans);
    return {
      kind: 'fraction',
      html,
      hint: style === 'mixed'
        ? '예: 3/4, 1 1/2 (대분수는 자연수와 분수 사이를 띄어 쓰기)'
        : '예: 3/4, -5/6, 2 (기약분수로 입력)',
      inputMode: 'text',
      answerText: text,
      check(input) {
        const v = parseFraction(input);
        if (!v || v.n * ans.d !== ans.n * v.d) return { correct: false };
        // 값은 맞지만 기약분수가 아니면 안내만 한다
        let tidy;
        if (v.form === 'int') tidy = true;
        else if (style === 'mixed') tidy = gcd(v.num, v.d) === 1 && v.num < v.d;
        else tidy = v.form === 'frac' && gcd(v.num, v.d) === 1 && v.d !== 1;
        return { correct: true, note: tidy ? '' : `기약분수로 나타내면 ${text} 이에요.` };
      },
      ...extra,
    };
  }

  // ---------- 도형 그림 ----------
  const SVG_W = 240;
  const SVG_H = 150;

  function svgWrap(inner) {
    return `<svg class="quiz-figure" viewBox="0 0 ${SVG_W} ${SVG_H}" role="img">${inner}</svg>`;
  }
  const label = (x, y, text, anchor = 'middle', cls = 'fig-label') =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${text}</text>`;
  const vertex = (x, y, text) => label(x, y, text, 'middle', 'fig-vertex');
  const shape = (points) => `<polygon points="${points.map((p) => p.join(',')).join(' ')}" class="fig-shape"/>`;
  const line = (x1, y1, x2, y2, cls = 'fig-line') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
  const dashed = (x1, y1, x2, y2) => line(x1, y1, x2, y2, 'fig-dash');
  const rightMark = (x, y, dx = 8, dy = -8) =>
    `<polyline points="${x + dx},${y} ${x + dx},${y + dy} ${x},${y + dy}" class="fig-mark"/>`;

  const figures = {
    rect(w, h) {
      return svgWrap(shape([[50, 25], [190, 25], [190, 115], [50, 115]]) +
        label(120, 135, `${w} cm`) + label(200, 75, `${h} cm`, 'start'));
    },
    square(s) {
      return svgWrap(shape([[75, 15], [165, 15], [165, 105], [75, 105]]) + label(120, 125, `${s} cm`));
    },
    parallelogram(base, h) {
      return svgWrap(shape([[80, 20], [200, 20], [160, 110], [40, 110]]) +
        dashed(80, 20, 80, 110) + rightMark(80, 110) +
        label(100, 130, `${base} cm`) + label(86, 70, `${h} cm`, 'start'));
    },
    triangle(base, h) {
      return svgWrap(shape([[40, 115], [200, 115], [140, 20]]) +
        dashed(140, 20, 140, 115) + rightMark(140, 115) +
        label(120, 137, `${base} cm`) + label(146, 75, `${h} cm`, 'start'));
    },
    trapezoid(top, bottom, h) {
      return svgWrap(shape([[80, 25], [160, 25], [200, 110], [40, 110]]) +
        dashed(80, 25, 80, 110) + rightMark(80, 110) +
        label(120, 17, `${top} cm`) + label(120, 132, `${bottom} cm`) + label(86, 72, `${h} cm`, 'start'));
    },
    rhombus(d1, d2) {
      return svgWrap(shape([[120, 10], [190, 70], [120, 130], [50, 70]]) +
        dashed(50, 70, 190, 70) + dashed(120, 10, 120, 130) +
        label(85, 64, `${d1} cm`) + label(126, 104, `${d2} cm`, 'start'));
    },
    // 정다각형. side 가 있으면 아래쪽 변에 길이를 적는다
    regular(nSides, side) {
      const cx = 120, cy = 70, r = 55;
      const start = -Math.PI / 2 + (nSides % 2 === 0 ? Math.PI / nSides : 0);
      const pts = [];
      for (let i = 0; i < nSides; i++) {
        const a = start + (i * 2 * Math.PI) / nSides;
        pts.push([+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1)]);
      }
      let text = '';
      if (side) {
        let best = 0;
        for (let i = 1; i < nSides; i++) {
          const y = pts[i][1] + pts[(i + 1) % nSides][1];
          if (y > pts[best][1] + pts[(best + 1) % nSides][1]) best = i;
        }
        const p = pts[best], q = pts[(best + 1) % nSides];
        text = label((p[0] + q[0]) / 2, Math.max(p[1], q[1]) + 18, `${side} cm`);
      }
      return svgWrap(shape(pts) + text);
    },
    // 직각삼각형 ABC (∠C = 90°). a = BC(세로), b = AC(가로), c = AB(빗변). 값 대신 'x' 도 가능
    rightTriangle(a, b, c, markA) {
      const A = [40, 118], B = [190, 28], C = [190, 118];
      return svgWrap(shape([A, B, C]) + rightMark(190, 118, -9, -9) +
        vertex(A[0] - 10, A[1] + 5, 'A') + vertex(B[0] + 10, B[1], 'B') + vertex(C[0] + 10, C[1] + 8, 'C') +
        (markA ? `<path d="M64 118 A24 24 0 0 0 60.6 106" class="fig-mark"/>` : '') +
        (a !== null ? label(198, 77, a, 'start') : '') +
        (b !== null ? label(115, 138, b) : '') +
        (c !== null ? label(104, 64, c, 'end') : ''));
    },
    // 원 O 위의 점 A, B, P. 중심각 ∠AOB 와 원주각 ∠APB
    circleAngle(central, centralText, inscribedText) {
      const cx = 120, cy = 72, r = 58;
      const rad = (deg) => (deg * Math.PI) / 180;
      const at = (deg) => [+(cx + r * Math.cos(rad(deg))).toFixed(1), +(cy + r * Math.sin(rad(deg))).toFixed(1)];
      const A = at(90 + central / 2), B = at(90 - central / 2), P = at(-90);
      return svgWrap(`<circle cx="${cx}" cy="${cy}" r="${r}" class="fig-circle"/>` +
        line(cx, cy, ...A) + line(cx, cy, ...B) + line(...P, ...A) + line(...P, ...B) +
        `<circle cx="${cx}" cy="${cy}" r="2.5" class="fig-dot"/>` +
        vertex(cx - 12, cy - 4, 'O') + vertex(A[0] - 10, A[1] + 12, 'A') + vertex(B[0] + 10, B[1] + 12, 'B') + vertex(P[0], P[1] - 6, 'P') +
        label(cx, cy + 22, centralText, 'middle', 'fig-angle') + label(P[0], P[1] + 26, inscribedText, 'middle', 'fig-angle'));
    },
  };

  // ---------- 초등 1~2학년 ----------
  const g12 = {
    addSub() {
      if (Math.random() < 0.35) {
        // 한 자리 수 (받아올림/받아내림 포함)
        const a = rand(2, 9), b = rand(2, 9);
        if (Math.random() < 0.5) return intQuiz('addSub', `${a} + ${b} = ?`, a + b);
        const big = a + b;
        return intQuiz('addSub', `${big} − ${b} = ?`, a);
      }
      // 두 자리 수
      if (Math.random() < 0.5) {
        const a = rand(11, 88), b = rand(11, 99 - a);
        return intQuiz('addSub', `${a} + ${b} = ?`, a + b);
      }
      const a = rand(30, 99), b = rand(11, a - 5);
      return intQuiz('addSub', `${a} − ${b} = ?`, a - b);
    },
    multiply() {
      const a = rand(2, 9), b = rand(1, 9);
      return intQuiz('multiply', `${a} × ${b} = ?`, a * b);
    },
    division() {
      const a = rand(2, 9), b = rand(2, 9);
      return Math.random() < 0.5
        ? intQuiz('division', `□ × ${b} = ${a * b}<br><small>□에 알맞은 수는?</small>`, a)
        : intQuiz('division', `${a} × □ = ${a * b}<br><small>□에 알맞은 수는?</small>`, b);
    },
    // 가르기·모으기, 세 수의 덧셈/뺄셈
    fraction() {
      const r = Math.random();
      if (r < 0.35) {
        const total = rand(5, 10), part = rand(1, total - 1);
        return intQuiz('fraction', `${eun(total)} ${gwa(part)} □(으)로 가를 수 있어요.<br><small>□에 알맞은 수는?</small>`, total - part);
      }
      if (r < 0.6) {
        const a = rand(1, 9), b = rand(1, 9);
        const t = a + b;
        return intQuiz('fraction', `${a} + □ = ${t}<br><small>□에 알맞은 수는?</small>`, b);
      }
      const a = rand(2, 9), b = rand(1, 9), c = rand(1, 9);
      if (Math.random() < 0.5) return intQuiz('fraction', `${a} + ${b} + ${c} = ?`, a + b + c);
      const big = a + b + c;
      return intQuiz('fraction', `${big} − ${b} − ${c} = ?`, a);
    },
    geometry() {
      const shapes = [
        [3, '삼각형'], [4, '사각형'], [5, '오각형'], [6, '육각형'],
      ];
      if (Math.random() < 0.6) {
        const [n, name] = pick(shapes);
        const what = pick(['변', '꼭짓점']);
        return intQuiz('geometry', `${name}의 ${what}은 몇 개일까요?`, n, {
          figure: figures.regular(n),
          hint: '숫자만 입력하세요.',
        });
      }
      const w = rand(3, 9), h = rand(2, w);
      return intQuiz('geometry', '네 변의 길이를 모두 더하면 몇 cm일까요?', 2 * (w + h), {
        figure: figures.rect(w, h),
        hint: '숫자만 입력하세요. (단위: cm)',
      });
    },
  };

  // ---------- 초등 5~6학년 ----------
  function randomFraction(allowMixed) {
    const d = rand(2, 10);
    const n = rand(1, d - 1);
    const w = allowMixed && Math.random() < 0.4 ? rand(1, 3) : 0;
    return { n: w * d + n, d };
  }

  const g56 = {
    addSub() {
      const big = Math.random() < 0.4;
      if (Math.random() < 0.5) {
        const a = big ? rand(1000, 8999) : rand(100, 999);
        const b = rand(100, 999);
        return intQuiz('addSub', `${a} + ${b} = ?`, a + b);
      }
      const a = big ? rand(1000, 9999) : rand(300, 999);
      const b = rand(100, Math.min(999, a - 1));
      return intQuiz('addSub', `${a} − ${b} = ?`, a - b);
    },
    multiply() {
      if (Math.random() < 0.5) {
        const a = rand(12, 99), b = rand(12, 99);
        return intQuiz('multiply', `${a} × ${b} = ?`, a * b);
      }
      const a = rand(102, 999), b = rand(3, 9);
      return intQuiz('multiply', `${a} × ${b} = ?`, a * b);
    },
    division() {
      let divisor, quotient;
      if (Math.random() < 0.5) {
        divisor = rand(3, 9);
        quotient = rand(Math.ceil(100 / divisor), Math.floor(999 / divisor));
      } else {
        divisor = rand(11, 32);
        quotient = rand(4, Math.floor(999 / divisor));
      }
      return intQuiz('division', `${divisor * quotient} ÷ ${divisor} = ?`, quotient);
    },
    fraction() {
      let a, b;
      do {
        a = randomFraction(true);
        b = randomFraction(Math.random() < 0.3);
      } while (a.d === b.d || a.n * b.d === b.n * a.d);
      const isAdd = Math.random() < 0.5;
      if (!isAdd && a.n * b.d < b.n * a.d) [a, b] = [b, a];
      const ans = { n: isAdd ? a.n * b.d + b.n * a.d : a.n * b.d - b.n * a.d, d: a.d * b.d };
      return fractionQuiz(`${mixedHtml(a)} ${isAdd ? '+' : '−'} ${mixedHtml(b)} = ?`, ans, 'mixed');
    },
    geometry() {
      const kinds = [
        () => {
          const w = rand(6, 25), h = rand(3, w - 1);
          return Math.random() < 0.5
            ? { text: '직사각형의 둘레는 몇 cm일까요?', ans: 2 * (w + h), fig: figures.rect(w, h), unit: 'cm' }
            : { text: '직사각형의 넓이는 몇 cm²일까요?', ans: w * h, fig: figures.rect(w, h), unit: 'cm²' };
        },
        () => {
          const s = rand(4, 20);
          return Math.random() < 0.5
            ? { text: '정사각형의 둘레는 몇 cm일까요?', ans: 4 * s, fig: figures.square(s), unit: 'cm' }
            : { text: '정사각형의 넓이는 몇 cm²일까요?', ans: s * s, fig: figures.square(s), unit: 'cm²' };
        },
        () => {
          const n = pick([5, 6, 8]);
          const s = rand(4, 15);
          const name = { 5: '정오각형', 6: '정육각형', 8: '정팔각형' }[n];
          return { text: `${name}의 둘레는 몇 cm일까요?`, ans: n * s, fig: figures.regular(n, s), unit: 'cm' };
        },
        () => {
          const b = rand(5, 20), h = rand(3, 15);
          return { text: '평행사변형의 넓이는 몇 cm²일까요?', ans: b * h, fig: figures.parallelogram(b, h), unit: 'cm²' };
        },
        () => {
          let b, h;
          do { b = rand(4, 20); h = rand(3, 16); } while ((b * h) % 2);
          return { text: '삼각형의 넓이는 몇 cm²일까요?', ans: (b * h) / 2, fig: figures.triangle(b, h), unit: 'cm²' };
        },
        () => {
          let t, bt, h;
          do { t = rand(3, 12); bt = rand(t + 2, 20); h = rand(3, 12); } while (((t + bt) * h) % 2);
          return { text: '사다리꼴의 넓이는 몇 cm²일까요?', ans: ((t + bt) * h) / 2, fig: figures.trapezoid(t, bt, h), unit: 'cm²' };
        },
        () => {
          let d1, d2;
          do { d1 = rand(6, 20); d2 = rand(4, 16); } while ((d1 * d2) % 2);
          return { text: '마름모의 넓이는 몇 cm²일까요?', ans: (d1 * d2) / 2, fig: figures.rhombus(d1, d2), unit: 'cm²' };
        },
      ];
      const q = pick(kinds)();
      return intQuiz('geometry', q.text, q.ans, { figure: q.fig, hint: `숫자만 입력하세요. (단위: ${q.unit})` });
    },
  };

  // ---------- 중학교 3학년 ----------
  const SQUARE_FREE = [2, 3, 5, 6, 7];
  const root = (n) => `√${n}`;
  const coefRoot = (c, n) => `${c === 1 ? '' : c}√${n}`;
  const blank = '<small>□에 알맞은 수는?</small>';
  const nonZero = (a, b) => {
    let v;
    do { v = rand(a, b); } while (v === 0);
    return v;
  };
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];

  const m3 = {
    // 제곱근의 덧셈/뺄셈
    addSub() {
      const r = Math.random();
      if (r < 0.4) {
        const n = pick(SQUARE_FREE), a = rand(2, 9);
        let b;
        do { b = rand(1, 9); } while (b === a);
        const add = Math.random() < 0.5;
        return intQuiz('addSub', `${coefRoot(a, n)} ${add ? '+' : '−'} ${coefRoot(b, n)} = □${root(n)}<br>${blank}`,
          add ? a + b : a - b, { allowNegative: true });
      }
      if (r < 0.75) {
        // 근호 안을 간단히 한 뒤 계산: √12 + √27 = □√3
        const n = pick([2, 3, 5]), p = rand(1, 4), q = rand(2, 5);
        const add = Math.random() < 0.5;
        return intQuiz('addSub', `${root(n * p * p)} ${add ? '+' : '−'} ${root(n * q * q)} = □${root(n)}<br>${blank}`,
          add ? p + q : p - q, { allowNegative: true });
      }
      const p = rand(2, 15), q = rand(2, 15);
      const add = Math.random() < 0.5;
      return intQuiz('addSub', `${root(p * p)} ${add ? '+' : '−'} ${root(q * q)} = ?`, add ? p + q : p - q, { allowNegative: true });
    },
    // 곱셈 공식, 제곱근의 곱셈
    multiply() {
      const r = Math.random();
      if (r < 0.4) {
        const a = nonZero(-9, 9), b = nonZero(-9, 9);
        return intQuiz('multiply', `(x${term(a)})(x${term(b)}) = x² + □x${term(a * b)}<br>${blank}`, a + b, { allowNegative: true });
      }
      if (r < 0.65) {
        const a = nonZero(-9, 9);
        return intQuiz('multiply', `(x${term(a)})² = x² + □x + ${a * a}<br>${blank}`, 2 * a, { allowNegative: true });
      }
      const n = pick(SQUARE_FREE), p = rand(1, 4), q = rand(1, 4);
      return intQuiz('multiply', `${root(n * p * p)} × ${root(n * q * q)} = ?`, n * p * q);
    },
    // 인수분해, 이차방정식, 제곱근의 나눗셈
    division() {
      const r = Math.random();
      if (r < 0.35) {
        const a = nonZero(-9, 9);
        let b;
        do { b = nonZero(-9, 9); } while (b === a || b === -a);
        return intQuiz('division', `x²${term(a + b, 'x')}${term(a * b)} = (x${term(a)})(x + □)<br>${blank}`, b, { allowNegative: true });
      }
      if (r < 0.7) {
        const p = nonZero(-9, 9);
        let q;
        do { q = nonZero(-9, 9); } while (q === p);
        // (x − p)(x − q) = 0
        const big = Math.random() < 0.5;
        return intQuiz('division', `x²${term(-(p + q), 'x')}${term(p * q)} = 0<br><small>두 근 중 ${big ? '큰' : '작은'} 근은?</small>`,
          big ? Math.max(p, q) : Math.min(p, q), { allowNegative: true });
      }
      const n = pick(SQUARE_FREE), p = rand(2, 9);
      return intQuiz('division', `${root(n * p * p)} ÷ ${root(n)} = ?`, p);
    },
    // 삼각비, 유리수의 계산
    fraction() {
      if (Math.random() < 0.55) {
        const [s1, s2, h] = pick(TRIPLES);
        const k = rand(1, 3);
        // a = BC(∠A 의 대변), b = AC(이웃변)
        const [a, b] = Math.random() < 0.5 ? [s1 * k, s2 * k] : [s2 * k, s1 * k];
        const c = h * k;
        const fn = pick(['sin', 'cos', 'tan']);
        const ans = { sin: { n: a, d: c }, cos: { n: b, d: c }, tan: { n: a, d: b } }[fn];
        return fractionQuiz(`${fn} A = ?`, ans, 'improper', {
          figure: figures.rightTriangle(a, b, c, true),
        });
      }
      const x = { n: nonZero(-9, 9), d: rand(2, 9) };
      const y = { n: nonZero(-9, 9), d: rand(2, 9) };
      const op = pick(['+', '−', '×', '÷']);
      let ans;
      if (op === '+') ans = { n: x.n * y.d + y.n * x.d, d: x.d * y.d };
      else if (op === '−') ans = { n: x.n * y.d - y.n * x.d, d: x.d * y.d };
      else if (op === '×') ans = { n: x.n * y.n, d: x.d * y.d };
      else ans = { n: x.n * y.d * Math.sign(y.n), d: x.d * Math.abs(y.n) };
      const show = (f) => {
        const r = reduce(f);
        const html = improperHtml(r);
        return r.n < 0 ? `(${html})` : html;
      };
      return fractionQuiz(`${show(x)} ${op} ${show(y)} = ?`, ans, 'improper');
    },
    // 원주각, 피타고라스 정리
    geometry() {
      const r = Math.random();
      if (r < 0.45) {
        const central = rand(4, 16) * 10;
        const askInscribed = Math.random() < 0.5;
        return askInscribed
          ? intQuiz('geometry', '∠APB 의 크기는 몇 도일까요?', central / 2, {
            figure: figures.circleAngle(central, `${central}°`, 'x'),
            hint: '숫자만 입력하세요. (단위: °)',
          })
          : intQuiz('geometry', '∠AOB 의 크기는 몇 도일까요?', central, {
            figure: figures.circleAngle(central, 'x', `${central / 2}°`),
            hint: '숫자만 입력하세요. (단위: °)',
          });
      }
      const [s1, s2, h] = pick(TRIPLES);
      const k = rand(1, 3);
      const [a, b, c] = Math.random() < 0.5 ? [s1 * k, s2 * k, h * k] : [s2 * k, s1 * k, h * k];
      const hint = '숫자만 입력하세요. (단위: cm)';
      if (Math.random() < 0.5) {
        return intQuiz('geometry', '빗변 AB 의 길이 x 는 몇 cm일까요?', c, { figure: figures.rightTriangle(`${a} cm`, `${b} cm`, 'x', false), hint });
      }
      return intQuiz('geometry', '변 BC 의 길이 x 는 몇 cm일까요?', a, { figure: figures.rightTriangle('x', `${b} cm`, `${c} cm`, false), hint });
    },
  };

  const GENERATORS = { g12, g56, m3 };

  MR.Quiz = {
    DIFFICULTIES,
    DEFAULT,
    kinds: Object.keys(g56),
    label(kind, difficulty) {
      return (LABELS[difficulty] || LABELS[DEFAULT])[kind];
    },
    difficultyName(difficulty) {
      const d = DIFFICULTIES.find((x) => x.id === difficulty);
      return d ? d.name : '';
    },
    make(kind, difficulty = DEFAULT) {
      const gen = (GENERATORS[difficulty] || GENERATORS[DEFAULT])[kind];
      if (!gen) throw new Error(`알 수 없는 퀴즈 종류: ${kind}`);
      return gen();
    },
    _parseFraction: parseFraction,
  };
})((globalThis.MR = globalThis.MR || {}));
