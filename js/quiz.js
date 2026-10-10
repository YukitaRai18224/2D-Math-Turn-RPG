// 수학 퀴즈 생성기 (초등 5~6학년 수준).
// MR.Quiz.make(kind) → { kind, html, figure, hint, inputMode, answerText, check(input) → { correct, note } }
(function (MR) {
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

  function parseNatural(input) {
    const s = String(input).trim().replace(/,/g, '');
    return /^\d+$/.test(s) ? Number(s) : null;
  }

  function intQuiz(kind, html, answer, extra = {}) {
    return {
      kind,
      html,
      hint: '자연수로 입력하세요.',
      inputMode: 'numeric',
      answerText: String(answer),
      check(input) {
        return { correct: parseNatural(input) === answer };
      },
      ...extra,
    };
  }

  // ---------- 분수 ----------
  // 분수는 { n, d } (가분수 형태)로 다룬다.
  const reduce = ({ n, d }) => {
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  };

  function fracHtml(n, d) {
    return `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
  }

  // 대분수 표시: 3/2 → 1 1/2
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

  // "3/4", "1 1/2", "2" 를 { n, d, form } 로 해석
  function parseFraction(input) {
    const s = String(input).trim().replace(/\s+/g, ' ');
    let m;
    if ((m = s.match(/^(\d+)$/))) return { n: +m[1], d: 1, form: 'int' };
    if ((m = s.match(/^(\d+)\/(\d+)$/)) && +m[2] > 0) return { n: +m[1], d: +m[2], form: 'frac' };
    if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/)) && +m[3] > 0)
      return { n: +m[1] * +m[3] + +m[2], d: +m[3], form: 'mixed', whole: +m[1], num: +m[2] };
    return null;
  }

  function randomFraction(allowMixed) {
    const d = rand(2, 10);
    const n = rand(1, d - 1);
    const w = allowMixed && Math.random() < 0.4 ? rand(1, 3) : 0;
    return { n: w * d + n, d };
  }

  // ---------- 도형 그림 ----------
  const SVG_W = 240;
  const SVG_H = 150;

  function svgWrap(inner) {
    return `<svg class="quiz-figure" viewBox="0 0 ${SVG_W} ${SVG_H}" role="img">${inner}</svg>`;
  }
  const label = (x, y, text, anchor = 'middle') =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" class="fig-label">${text}</text>`;
  const shape = (points) => `<polygon points="${points.map((p) => p.join(',')).join(' ')}" class="fig-shape"/>`;
  const dashed = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="fig-dash"/>`;
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
        label(160, 64, `${d1} cm`) + label(126, 104, `${d2} cm`, 'start'));
    },
    regular(nSides, side) {
      const cx = 120, cy = 72, r = 55;
      const pts = [];
      for (let i = 0; i < nSides; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / nSides;
        pts.push([+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1)]);
      }
      // 아래쪽 변에 길이 표시
      const [p, q] = nSides % 2 === 0 ? [pts[nSides / 2], pts[nSides / 2 + 1]] : [pts[(nSides - 1) / 2], pts[(nSides + 1) / 2]];
      return svgWrap(shape(pts) + label((p[0] + q[0]) / 2, Math.max(p[1], q[1]) + 18, `${side} cm`));
    },
  };

  // ---------- 생성기 ----------
  const generators = {
    // 일반 공격: 자연수의 덧셈/뺄셈
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

    // 카가리: 자연수의 곱셈
    multiply() {
      if (Math.random() < 0.5) {
        const a = rand(12, 99);
        const b = rand(12, 99);
        return intQuiz('multiply', `${a} × ${b} = ?`, a * b);
      }
      const a = rand(102, 999);
      const b = rand(3, 9);
      return intQuiz('multiply', `${a} × ${b} = ?`, a * b);
    },

    // 프리시아: 자연수의 나눗셈 (나누어떨어지는 문제)
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

    // 아쿠아마린: 분모가 다른 분수의 덧셈/뺄셈
    fraction() {
      let a, b;
      do {
        a = randomFraction(true);
        b = randomFraction(Math.random() < 0.3);
      } while (a.d === b.d || a.n * b.d === b.n * a.d);

      const isAdd = Math.random() < 0.5;
      if (!isAdd && a.n * b.d < b.n * a.d) [a, b] = [b, a];
      const ans = reduce({ n: isAdd ? a.n * b.d + b.n * a.d : a.n * b.d - b.n * a.d, d: a.d * b.d });

      return {
        kind: 'fraction',
        html: `${mixedHtml(a)} ${isAdd ? '+' : '−'} ${mixedHtml(b)} = ?`,
        hint: '예: 3/4, 1 1/2 (대분수는 자연수와 분수 사이를 띄어 쓰기)',
        inputMode: 'text',
        answerText: mixedText(ans),
        check(input) {
          const v = parseFraction(input);
          if (!v || v.n * ans.d !== ans.n * v.d) return { correct: false };
          // 값은 맞지만 기약분수(대분수)가 아니면 안내만 한다
          const tidy =
            v.form === 'int' ||
            (v.form === 'frac' && v.n < v.d && gcd(v.n, v.d) === 1) ||
            (v.form === 'mixed' && v.num < v.d && gcd(v.num, v.d) === 1);
          return { correct: true, note: tidy ? '' : `기약분수(대분수)로 나타내면 ${mixedText(ans)} 이에요.` };
        },
      };
    },

    // 히나: 도형의 둘레/넓이
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
      return intQuiz('geometry', q.text, q.ans, {
        figure: q.fig,
        hint: `숫자만 입력하세요. (단위: ${q.unit})`,
      });
    },
  };

  MR.Quiz = {
    kinds: Object.keys(generators),
    make(kind) {
      const gen = generators[kind];
      if (!gen) throw new Error(`알 수 없는 퀴즈 종류: ${kind}`);
      return gen();
    },
    _parseFraction: parseFraction,
  };
})((globalThis.MR = globalThis.MR || {}));
