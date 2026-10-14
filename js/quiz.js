// 수학 퀴즈 공통 부분: 정답 판정, 도형 그림, 난이도 목록과 등록.
// 학년별 문제는 js/quiz/elementary.js, middle.js, high.js 가 MR.Quiz.register 로 등록한다.
// MR.Quiz.make(kind, difficulty) → { kind, html, figure, hint, inputMode, answerText, check(input) → { correct, note } }
//
// 퀴즈 종류: addSub(일반 공격) / multiply(카가리) / fraction(아쿠아마린) / division(프리시아) / geometry(히나)
//            stats(자료와 통계 · 보스 라파의 침묵 저항 퀴즈)
// 이름은 초등 기준 단원에서 따왔고, 학년이 올라가면 같은 자리에 그 학년의 비슷한 역할 단원이 들어간다.
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
  // 낱말 뒤 조사: 마지막 글자에 받침이 있으면 '을', 없으면 '를'
  const eul = (w) => {
    const code = w.charCodeAt(w.length - 1) - 0xac00;
    return `${w}${code >= 0 && code < 11172 && code % 28 ? '을' : '를'}`;
  };

  const DIFFICULTIES = [
    { id: 'g12', group: '초등학교', short: '1~2학년', name: '초등 1~2학년' },
    { id: 'g34', group: '초등학교', short: '3~4학년', name: '초등 3~4학년' },
    { id: 'g56', group: '초등학교', short: '5~6학년', name: '초등 5~6학년' },
    { id: 'm1', group: '중학교', short: '1학년', name: '중학교 1학년' },
    { id: 'm2', group: '중학교', short: '2학년', name: '중학교 2학년' },
    { id: 'm3', group: '중학교', short: '3학년', name: '중학교 3학년' },
    { id: 'h1', group: '고등학교', short: '1학년', name: '고등학교 1학년' },
    { id: 'h2', group: '고등학교', short: '2학년', name: '고등학교 2학년' },
    { id: 'h3', group: '고등학교', short: '3학년', name: '고등학교 3학년' },
  ];
  const DEFAULT = 'g56';
  const KINDS = ['addSub', 'multiply', 'fraction', 'division', 'geometry', 'stats'];

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

  // 소수 답 (예: 2.4). 값이 같으면 2.40 처럼 써도 정답
  const decimalText = (x) => fmt(Number(x.toFixed(6)));
  function decimalQuiz(kind, html, answer, extra = {}) {
    return {
      kind,
      html,
      hint: '소수로 입력하세요. (예: 2.5)',
      inputMode: 'decimal',
      answerText: decimalText(answer),
      check(input) {
        const t = String(input).trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
        if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return { correct: false };
        return { correct: Math.abs(Number(t) - answer) < 1e-9 };
      },
      ...extra,
    };
  }

  // ---------- 식 표기 도우미 ----------
  const sup = (v) => `<sup>${v}</sup>`;
  const sub = (v) => `<sub>${v}</sub>`;
  // 첫 항: 1x → x, −1x → −x
  const lead = (n, suffix = '') => (suffix && n === 1 ? suffix : suffix && n === -1 ? `${MINUS}${suffix}` : `${fmt(n)}${suffix}`);
  // 복소수 a + bi
  const cplx = (a, b) => {
    if (b === 0) return fmt(a);
    if (a === 0) return lead(b, 'i');
    return `${fmt(a)}${term(b, 'i')}`;
  };
  const paren = (n) => (n < 0 ? `(${fmt(n)})` : String(n));
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
  const perm = (n, r) => factorial(n) / factorial(n - r);
  const comb = (n, r) => perm(n, r) / factorial(r);
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
  const degHint = '숫자만 입력하세요. (단위: °)';

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

  // 삼각형의 세 각. labels: [A, B, C] 각 위치에 적을 글자
  figures.triangleAngles = function (labels) {
    const A = [40, 120], B = [205, 120], C = [115, 22];
    return svgWrap(shape([A, B, C]) +
      label(A[0] + 26, A[1] - 8, labels[0], 'middle', 'fig-angle') +
      label(B[0] - 26, B[1] - 8, labels[1], 'middle', 'fig-angle') +
      label(C[0], C[1] + 30, labels[2], 'middle', 'fig-angle'));
  };
  // 사각형의 네 각
  figures.quadAngles = function (labels) {
    const P = [[45, 120], [200, 120], [185, 30], [70, 18]];
    const off = [[24, -10], [-24, -10], [-20, 22], [16, 24]];
    return svgWrap(shape(P) + P.map((p, i) => label(p[0] + off[i][0], p[1] + off[i][1], labels[i], 'middle', 'fig-angle')).join(''));
  };
  // 원과 반지름(또는 지름)
  figures.circleRadius = function (text, diameter) {
    const cx = 120, cy = 72, r = 58;
    return svgWrap(`<circle cx="${cx}" cy="${cy}" r="${r}" class="fig-circle"/>` +
      (diameter ? line(cx - r, cy, cx + r, cy) : line(cx, cy, cx + r, cy)) +
      `<circle cx="${cx}" cy="${cy}" r="2.5" class="fig-dot"/>` + vertex(cx - 2, cy + 16, 'O') +
      label(diameter ? cx : cx + r / 2, cy - 8, text));
  };
  // 막대그래프. rows: [[이름, 값], ...], 눈금은 step 간격
  figures.barChart = function (rows, step, unit) {
    const max = Math.ceil(Math.max(...rows.map((r) => r[1])) / step) * step;
    const x0 = 34, y0 = 122, h = 104, w = 196;
    const bw = w / rows.length;
    let g = '';
    // 눈금선은 모두 그리고, 숫자는 너무 빽빽하지 않게 일부만 적는다
    const every = max / step > 8 ? 2 : 1;
    for (let v = 0, i = 0; v <= max; v += step, i++) {
      const y = y0 - (v / max) * h;
      g += `<line x1="${x0}" y1="${y}" x2="${x0 + w}" y2="${y}" class="fig-grid"/>` + (i % every ? '' : label(x0 - 6, y + 4, v, 'end', 'fig-tick'));
    }
    rows.forEach(([name, v], i) => {
      const bh = (v / max) * h;
      g += `<rect x="${x0 + i * bw + bw * 0.2}" y="${y0 - bh}" width="${bw * 0.6}" height="${bh}" class="fig-bar"/>` +
        label(x0 + i * bw + bw / 2, y0 + 15, name, 'middle', 'fig-tick');
    });
    return svgWrap(g + label(x0 - 6, 10, `(${unit})`, 'start', 'fig-tick'));
  };
  // 부채꼴: 반지름 r, 중심각 angle
  figures.sector = function (r, angle) {
    const cx = 120, cy = 80, R = 60;
    const a0 = -90 - angle / 2, a1 = -90 + angle / 2;
    const pt = (a) => [+(cx + R * Math.cos((a * Math.PI) / 180)).toFixed(1), +(cy + R * Math.sin((a * Math.PI) / 180)).toFixed(1)];
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
    return svgWrap(`<path d="M${cx} ${cy} L${x0} ${y0} A${R} ${R} 0 ${angle > 180 ? 1 : 0} 1 ${x1} ${y1} Z" class="fig-shape"/>` +
      label((cx + x0) / 2 - 10, (cy + y0) / 2 + 4, `${r} cm`, 'end') + label(cx, cy + 22, `${angle}°`, 'middle', 'fig-angle'));
  };
  // 이등변삼각형 (AB = AC 표시)
  figures.isosceles = function (apexText, leftText, rightText) {
    const A = [120, 18], B = [50, 122], C = [190, 122];
    const tick = (p, q) => {
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      return `<line x1="${mx - 5}" y1="${my - 3}" x2="${mx + 5}" y2="${my + 3}" class="fig-mark"/>`;
    };
    return svgWrap(shape([A, B, C]) + tick(A, B) + tick(A, C) +
      vertex(A[0], A[1] - 4, 'A') + vertex(B[0] - 10, B[1] + 4, 'B') + vertex(C[0] + 10, C[1] + 4, 'C') +
      label(A[0], A[1] + 30, apexText, 'middle', 'fig-angle') + label(B[0] + 28, B[1] - 8, leftText, 'middle', 'fig-angle') +
      label(C[0] - 28, C[1] - 8, rightText, 'middle', 'fig-angle'));
  };
  // 닮은 두 삼각형 ABC ∽ DEF
  figures.similar = function (ab, bc, de, ef) {
    const t1 = [[48, 120], [118, 120], [64, 64]], t2 = [[138, 120], [232, 120], [162, 38]];
    return svgWrap(shape(t1) + shape(t2) +
      vertex(t1[2][0], t1[2][1] - 6, 'A') + vertex(t1[0][0] - 2, t1[0][1] + 14, 'B') + vertex(t1[1][0] + 4, t1[1][1] + 14, 'C') +
      vertex(t2[2][0], t2[2][1] - 6, 'D') + vertex(t2[0][0] - 2, t2[0][1] + 14, 'E') + vertex(t2[1][0] + 4, t2[1][1] + 14, 'F') +
      label(52, 90, ab, 'end') + label(83, 136, bc) + label(146, 76, de, 'end') + label(185, 136, ef));
  };
  // 원에 내접하는 사각형 ABCD
  figures.inscribedQuad = function (aText, cText) {
    const cx = 120, cy = 72, r = 58;
    const at = (deg) => [+(cx + r * Math.cos((deg * Math.PI) / 180)).toFixed(1), +(cy + r * Math.sin((deg * Math.PI) / 180)).toFixed(1)];
    const A = at(200), B = at(110), C = at(-15), D = at(-100);
    return svgWrap(`<circle cx="${cx}" cy="${cy}" r="${r}" class="fig-circle"/>` + shape([A, B, C, D]).replace('fig-shape', 'fig-inner') +
      vertex(A[0] - 10, A[1] + 4, 'A') + vertex(B[0], B[1] + 14, 'B') + vertex(C[0] + 10, C[1] + 4, 'C') + vertex(D[0], D[1] - 5, 'D') +
      label(A[0] + 26, A[1] + 2, aText, 'middle', 'fig-angle') + label(C[0] - 24, C[1] + 6, cText, 'middle', 'fig-angle'));
  };
  // 두 변과 그 끼인각
  figures.sasTriangle = function (b, c, angle) {
    const A = [50, 120], B = [205, 120], C = angle > 90 ? [10, 40] : [100, 28];
    return svgWrap(shape([A, B, C]) + vertex(A[0] + 2, A[1] + 15, 'A') + vertex(B[0] + 8, B[1] + 4, 'B') + vertex(C[0], C[1] - 6, 'C') +
      label((A[0] + B[0]) / 2, A[1] + 16, c) + label((A[0] + C[0]) / 2 - 6, (A[1] + C[1]) / 2, b, 'end') +
      label(A[0] + 22, A[1] - 8, `${angle}°`, 'middle', 'fig-angle') + label((B[0] + C[0]) / 2 + 8, (B[1] + C[1]) / 2 - 4, 'x', 'start'));
  };

  // ---------- 자료 표 ----------
  // rows: [[머리, 값], ...] 를 가로 표로 그린다. 값 대신 '○' 개수로 그리면 그래프처럼 보인다
  function dataTable(head, rows, asCircles) {
    const cell = (v) => (asCircles ? `<span class="tally">${'○'.repeat(v)}</span>` : v);
    return `<table class="quiz-table"><tr><th>${head[0]}</th>${rows.map((r) => `<th>${r[0]}</th>`).join('')}</tr>` +
      `<tr><th>${head[1]}</th>${rows.map((r) => `<td>${cell(r[1])}</td>`).join('')}</tr></table>`;
  }

  function sample(arr, n) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  }

  // 학년별 파일이 { labels, generators } 를 등록한다
  const LEVELS = {};

  MR.QuizKit = {
    rand, pick, gcd, MINUS, fmt, term, eun, gwa, eul, sup, sub, lead, cplx, paren,
    factorial, perm, comb, SQUARE_FREE, root, coefRoot, blank, nonZero, TRIPLES, degHint,
    intQuiz, fractionQuiz, decimalQuiz, reduce, fracHtml, mixedHtml, improperHtml, figures, dataTable, sample,
  };

  MR.Quiz = {
    DIFFICULTIES,
    DEFAULT,
    kinds: KINDS,
    register(id, level) {
      LEVELS[id] = level;
    },
    label(kind, difficulty) {
      return (LEVELS[difficulty] || LEVELS[DEFAULT]).labels[kind];
    },
    difficultyName(difficulty) {
      const d = DIFFICULTIES.find((x) => x.id === difficulty);
      return d ? d.name : '';
    },
    make(kind, difficulty = DEFAULT) {
      const table = (LEVELS[difficulty] || LEVELS[DEFAULT]).generators;
      const gen = table[kind];
      if (!gen) throw new Error(`알 수 없는 퀴즈 종류: ${kind}`);
      return gen.call(table);
    },
    _parseFraction: parseFraction,
  };
})((globalThis.MR = globalThis.MR || {}));
