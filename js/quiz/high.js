// 고등학교 문제: 1학년(공통수학), 2학년(수학Ⅰ·Ⅱ, 확률), 3학년(미적분, 기하, 확률과 통계)
(function (MR) {
  const {
    rand, pick, fmt, term, sup, sub, lead, cplx, paren, perm, comb, blank, nonZero, TRIPLES, degHint,
    intQuiz, fractionQuiz, fracHtml, figures,
  } = MR.QuizKit;

  const int = (kind, html, ans, extra = {}) => intQuiz(kind, html, ans, { allowNegative: true, ...extra });
  const frac = (kind, html, ans, extra = {}) => fractionQuiz(html, ans, 'improper', { kind, ...extra });
  // 이차식 x² + px + q 표기
  const quad = (p, q) => `x²${term(p, 'x')}${term(q)}`;
  // 3차 이하 다항식 a3 x³ + a2 x² + a1 x + a0 표기 (첫 항이 0 이면 다음 항부터)
  const poly = (cs) => {
    const sfx = ['', 'x', 'x²', 'x³'];
    let out = '';
    for (let i = cs.length - 1; i >= 0; i--) {
      if (cs[i] === 0) continue;
      out += out ? term(cs[i], sfx[i]) : lead(cs[i], sfx[i]);
    }
    return out || '0';
  };
  const evalPoly = (cs, x) => cs.reduce((s, c, i) => s + c * x ** i, 0);
  const lim = (v) => `lim${sub(v)}`;
  // 'x − 3' 처럼 수로 끝나는 식 뒤의 조사: 0·3·6 으로 끝나면 '으로', 나머지(1·7·8 은 ㄹ 받침)는 '로'
  const ro = (n) => ([0, 3, 6].includes(Math.abs(n) % 10) ? '으로' : '로');

  // ---------- 고등학교 1학년 ----------
  const h1 = {
    // 복소수의 덧셈/뺄셈
    addSub() {
      const a = rand(-9, 9), b = nonZero(-9, 9), c = rand(-9, 9), d = nonZero(-9, 9);
      const minus = Math.random() < 0.5;
      const re = minus ? a - c : a + c, im = minus ? b - d : b + d;
      const left = `(${cplx(a, b)}) ${minus ? '−' : '+'} (${cplx(c, d)})`;
      if (re === 0 && im === 0) return h1.addSub();
      return (Math.random() < 0.5 && re !== 0) || im === 0
        ? int('addSub', `${left} = □${term(im, 'i') || ' + 0i'}<br>${blank}`, re)
        : int('addSub', `${left} = ${re === 0 ? '' : `${fmt(re)} + `}□i<br>${blank}`, im);
    },
    // 복소수의 곱셈
    multiply() {
      if (Math.random() < 0.35) {
        const a = nonZero(-7, 7), b = nonZero(-7, 7);
        return int('multiply', `(${cplx(a, b)})(${cplx(a, -b)}) = ?`, a * a + b * b);
      }
      const a = rand(-6, 6), b = nonZero(-6, 6), c = rand(-6, 6), d = nonZero(-6, 6);
      const re = a * c - b * d, im = a * d + b * c;
      if (re === 0 && im === 0) return h1.multiply();
      return (Math.random() < 0.5 && re !== 0) || im === 0
        ? int('multiply', `(${cplx(a, b)})(${cplx(c, d)}) = □${term(im, 'i')}<br>${blank}`, re)
        : int('multiply', `(${cplx(a, b)})(${cplx(c, d)}) = ${re === 0 ? '' : `${fmt(re)} + `}□i<br>${blank}`, im);
    },
    // 이차방정식의 근과 계수의 관계
    fraction() {
      let p, q;
      do { p = rand(-9, 9); q = nonZero(-9, 9); } while (p === 0);
      const eq = `이차방정식 ${quad(p, q)} = 0 의 두 근을 α, β 라 할 때`;
      const k = rand(0, 3);
      if (k === 0) return frac('fraction', `${eq}<br><small>α + β 의 값은?</small>`, { n: -p, d: 1 });
      if (k === 1) return frac('fraction', `${eq}<br><small>αβ 의 값은?</small>`, { n: q, d: 1 });
      if (k === 2) return frac('fraction', `${eq}<br><small>α² + β² 의 값은?</small>`, { n: p * p - 2 * q, d: 1 });
      return frac('fraction', `${eq}<br><small>${fracHtml(1, 'α')} + ${fracHtml(1, 'β')} 의 값은?</small>`, { n: -p * Math.sign(q), d: Math.abs(q) });
    },
    // 나머지정리, 인수정리
    division() {
      const k = nonZero(-3, 3);
      if (Math.random() < 0.55) {
        const cs = [rand(-9, 9), rand(-6, 6), rand(-5, 5), nonZero(-3, 3)];
        return int('division', `f(x) = ${poly(cs)} 일 때<br><small>f(x) 를 x${term(-k)} ${ro(k)} 나눈 나머지는?</small>`, evalPoly(cs, k));
      }
      // x³ + b x² + a x + c 가 (x − k) 로 나누어떨어질 때 a
      const b = rand(-4, 4);
      let c;
      do { c = k * rand(-6, 6); } while (c === 0);
      const a = -(k ** 3 + b * k * k + c) / k;
      return int('division', `f(x) = x³${term(b, 'x²')} + ax${term(c)} 가<br><small>x${term(-k)} ${ro(k)} 나누어떨어질 때 a 의 값은?</small>`, a);
    },
    // 좌표평면: 두 점 사이 거리, 중점, 점과 직선 사이 거리, 원의 반지름
    geometry() {
      const r = Math.random();
      if (r < 0.3) {
        const [s1, s2, h] = pick(TRIPLES);
        const x1 = rand(-5, 5), y1 = rand(-5, 5);
        const sx = pick([1, -1]), sy = pick([1, -1]);
        return int('geometry', `두 점 A(${fmt(x1)}, ${fmt(y1)}), B(${fmt(x1 + sx * s1)}, ${fmt(y1 + sy * s2)}) 사이의 거리는?`, h);
      }
      if (r < 0.5) {
        const x1 = rand(-9, 9), y1 = rand(-9, 9);
        let x2, y2;
        do { x2 = rand(-9, 9); y2 = rand(-9, 9); } while ((x1 + x2) % 2 || (y1 + y2) % 2);
        const askX = Math.random() < 0.5;
        return int('geometry', `두 점 A(${fmt(x1)}, ${fmt(y1)}), B(${fmt(x2)}, ${fmt(y2)}) 의<br>중점의 ${askX ? 'x' : 'y'}좌표는?`, askX ? (x1 + x2) / 2 : (y1 + y2) / 2);
      }
      if (r < 0.75) {
        // 직선 ax + by + c = 0 과 점 (x0, y0) 사이 거리가 정수가 되도록
        const [na, nb, nh] = pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10]]);
        const a = na * pick([1, -1]), b = nb * pick([1, -1]);
        const dist = rand(1, 5);
        const x0 = rand(-4, 4), y0 = rand(-4, 4);
        const c = dist * nh * pick([1, -1]) - a * x0 - b * y0;
        return int('geometry', `점 P(${fmt(x0)}, ${fmt(y0)})와 직선 ${lead(a, 'x')}${term(b, 'y')}${term(c)} = 0<br>사이의 거리는?`, dist);
      }
      const hx = rand(-5, 5), hy = rand(-5, 5), rad = rand(1, 7);
      return int('geometry', `원 x² + y²${term(-2 * hx, 'x')}${term(-2 * hy, 'y')}${term(hx * hx + hy * hy - rad * rad)} = 0 의<br>반지름의 길이는?`, rad);
    },
    // 순열과 조합
    stats() {
      const r = Math.random();
      if (r < 0.35) {
        const n = rand(4, 8), k = rand(2, 3);
        return int('stats', `${sub(n)}P${sub(k)} 의 값은?`, perm(n, k));
      }
      if (r < 0.7) {
        const n = rand(4, 10), k = rand(2, Math.min(4, n - 1));
        return int('stats', `${sub(n)}C${sub(k)} 의 값은?`, comb(n, k));
      }
      if (Math.random() < 0.5) {
        const n = rand(5, 9), k = rand(2, 3);
        return int('stats', `학생 ${n}명 중에서 ${k}명의 대표를 뽑는 경우의 수는?`, comb(n, k));
      }
      const n = rand(4, 7), k = rand(2, 3);
      return int('stats', `학생 ${n}명 중에서 반장 1명, 부반장 1명${k === 3 ? ', 서기 1명' : ''}을 뽑는 경우의 수는?`, perm(n, k));
    },
  };

  // ---------- 고등학교 2학년 ----------
  const h2 = {
    // 로그의 계산
    addSub() {
      const r = Math.random();
      if (r < 0.4) {
        const a = pick([2, 3, 5]), m = rand(1, a === 2 ? 6 : 3);
        const b = pick([2, 3]), n = rand(1, b === 2 ? 5 : 3);
        return int('addSub', `log${sub(a)} ${a ** m} + log${sub(b)} ${b ** n} = ?`, m + n);
      }
      if (r < 0.7) {
        // log_a x + log_a y = log_a (xy)
        const a = pick([2, 3, 6, 10]), e = rand(1, 3);
        const total = a ** e;
        const divs = [];
        for (let d = 2; d < total; d++) if (total % d === 0) divs.push(d);
        if (!divs.length) return h2.addSub();
        const x = pick(divs);
        return int('addSub', `log${sub(a)} ${x} + log${sub(a)} ${total / x} = ?`, e);
      }
      const a = pick([2, 3]), e = rand(1, 4), y = rand(2, 7);
      return int('addSub', `log${sub(a)} ${a ** e * y} − log${sub(a)} ${y} = ?`, e);
    },
    // 지수법칙 (유리수 지수)
    multiply() {
      const r = Math.random();
      if (r < 0.5) {
        const [base, root, k] = pick([[8, 3, 2], [27, 3, 3], [16, 4, 2], [4, 2, 2], [9, 2, 3], [25, 2, 5], [32, 5, 2], [64, 3, 4], [81, 4, 3]]);
        const p = rand(1, 3);
        return int('multiply', `${base}${sup(fracHtml(p, root))} = ?`, k ** p);
      }
      if (r < 0.75) {
        const m = rand(-3, 6), n = rand(-3, 6);
        if (m + n < 0 || m + n > 8) return h2.multiply();
        return int('multiply', `2${sup(fmt(m))} × 2${sup(fmt(n))} = ?`, 2 ** (m + n));
      }
      const e = pick([2, 4, 6]);
      return int('multiply', `(√3)${sup(e)} = ?`, 3 ** (e / 2));
    },
    // 삼각함수의 값
    fraction() {
      const pi = (n, d) => (d === 1 ? (n === 1 ? 'π' : `${n}π`) : fracHtml(n === 1 ? 'π' : `${n}π`, d));
      const table = [
        ['sin', pi(1, 6), { n: 1, d: 2 }], ['cos', pi(1, 3), { n: 1, d: 2 }], ['tan', pi(1, 4), { n: 1, d: 1 }],
        ['sin', pi(5, 6), { n: 1, d: 2 }], ['cos', pi(2, 3), { n: -1, d: 2 }], ['sin', pi(7, 6), { n: -1, d: 2 }],
        ['cos', pi(1, 1), { n: -1, d: 1 }], ['sin', pi(3, 2), { n: -1, d: 1 }], ['tan', pi(3, 4), { n: -1, d: 1 }],
        ['cos', pi(5, 3), { n: 1, d: 2 }], ['sin', pi(11, 6), { n: -1, d: 2 }],
      ];
      if (Math.random() < 0.6) {
        const [fn, ang, ans] = pick(table);
        return frac('fraction', `${fn} ${ang} = ?`, ans);
      }
      const [[f1, a1, v1], [f2, a2, v2]] = [pick(table), pick(table)];
      const op = pick(['+', '×']);
      const ans = op === '+' ? { n: v1.n * v2.d + v2.n * v1.d, d: v1.d * v2.d } : { n: v1.n * v2.n, d: v1.d * v2.d };
      return frac('fraction', `${f1} ${a1} ${op} ${f2} ${a2} = ?`, ans);
    },
    // 등차수열, 등비수열, 합
    division() {
      const r = Math.random();
      if (r < 0.3) {
        const a = rand(-10, 10), d = nonZero(-5, 6), n = rand(5, 20);
        return int('division', `첫째항이 ${fmt(a)}, 공차가 ${fmt(d)}인 등차수열의<br>제${n}항은?`, a + (n - 1) * d);
      }
      if (r < 0.55) {
        const a = nonZero(-3, 5), q = pick([2, 3, -2]), n = rand(3, q === 3 ? 5 : 7);
        return int('division', `첫째항이 ${fmt(a)}, 공비가 ${fmt(q)}인 등비수열의<br>제${n}항은?`, a * q ** (n - 1));
      }
      if (r < 0.8) {
        const n = rand(5, 20);
        return int('division', `${sumSign(n)} k = ?`, (n * (n + 1)) / 2);
      }
      const n = rand(3, 15);
      return int('division', `${sumSign(n)} (2k − 1) = ?`, n * n);
    },
    // 사인법칙, 코사인법칙, 삼각형의 넓이
    geometry() {
      const r = Math.random();
      if (r < 0.45) {
        const [b, c, a, ang] = pick(COS_LAW);
        return int('geometry', `△ABC 에서 b = ${b}, c = ${c}, A = ${ang}° 일 때<br>a 의 값은?`, a, { figure: figures.sasTriangle(b, c, ang) });
      }
      if (r < 0.7) {
        const ang = pick([30, 150, 90]);
        const a = ang === 90 ? rand(2, 10) * 2 : rand(2, 12);
        return int('geometry', `△ABC 에서 a = ${a}, A = ${ang}° 일 때<br>외접원의 반지름의 길이는?`, ang === 90 ? a / 2 : a);
      }
      let b, c;
      do { b = rand(2, 12); c = rand(2, 12); } while ((b * c) % 4);
      return int('geometry', `△ABC 에서 b = ${b}, c = ${c}, A = 30° 일 때<br>넓이는?`, (b * c) / 4);
    },
    // 확률 (여사건, 독립, 조건부확률)
    stats() {
      const r = Math.random();
      if (r < 0.3) {
        const n = rand(2, 5);
        return frac('stats', `동전 ${n}개를 동시에 던질 때<br><small>적어도 한 개는 앞면이 나올 확률은?</small>`, { n: 2 ** n - 1, d: 2 ** n });
      }
      if (r < 0.55) {
        const p = { n: rand(1, 4), d: rand(5, 8) }, q = { n: rand(1, 3), d: rand(4, 7) };
        return frac('stats', `두 사건 A, B 가 서로 독립이고<br>P(A) = ${fracHtml(p.n, p.d)}, P(B) = ${fracHtml(q.n, q.d)} 일 때<br><small>P(A∩B) 의 값은?</small>`, { n: p.n * q.n, d: p.d * q.d });
      }
      if (r < 0.8) {
        const red = rand(2, 6), blue = rand(2, 6);
        return frac('stats', `빨간 공 ${red}개, 파란 공 ${blue}개가 든 주머니에서 2개를 동시에 꺼낼 때<br><small>2개 모두 빨간 공일 확률은?</small>`,
          { n: comb(red, 2), d: comb(red + blue, 2) });
      }
      const ab = rand(1, 5), b = rand(ab + 1, 10), total = rand(b + 1, 20);
      return frac('stats', `P(B) = ${fracHtml(b, total)}, P(A∩B) = ${fracHtml(ab, total)} 일 때<br><small>P(A|B) 의 값은?</small>`, { n: ab, d: b });
    },
  };

  // 끼인각이 60°/120° 일 때 세 변이 모두 정수인 (b, c, a)
  const COS_LAW = [];
  for (let b = 2; b <= 16; b++) {
    for (let c = b + 1; c <= 16; c++) {
      for (const [ang, sign] of [[60, -1], [120, 1]]) {
        const a2 = b * b + c * c + sign * b * c;
        const a = Math.round(Math.sqrt(a2));
        if (a * a === a2 && !(ang === 60 && (a === b || a === c))) COS_LAW.push([b, c, a, ang]);
      }
    }
  }

  function sumSign(n) {
    return `<span class="sigma"><small>${n}</small>Σ<small>k=1</small></span>`;
  }

  // ---------- 고등학교 3학년 ----------
  const h3 = {
    // 함수와 수열의 극한
    addSub() {
      if (Math.random() < 0.55) {
        const a = nonZero(-6, 6);
        if (Math.random() < 0.5) {
          return int('addSub', `${lim(`x→${fmt(a)}`)} ${fracHtml(`x² − ${a * a}`, `x${term(-a)}`)} = ?`, 2 * a);
        }
        const b = rand(-5, 5);
        // (x − a)(x − b) / (x − a) → a − b
        return int('addSub', `${lim(`x→${fmt(a)}`)} ${fracHtml(quad(-(a + b), a * b), `x${term(-a)}`)} = ?`, a - b);
      }
      const p = nonZero(-6, 6), q = rand(1, 6), c1 = rand(-9, 9), c2 = rand(1, 9);
      return frac('addSub', `${lim('n→∞')} ${fracHtml(`${lead(p, 'n²')}${term(c1, 'n')}`, `${lead(q, 'n²')}${term(c2)}`)} = ?`, { n: p, d: q });
    },
    // 미분계수
    multiply() {
      const cs = [rand(-9, 9), rand(-6, 6), rand(-4, 4), nonZero(-3, 3)];
      const k = rand(-3, 3);
      const deriv = 3 * cs[3] * k * k + 2 * cs[2] * k + cs[1];
      return int('multiply', `f(x) = ${poly(cs)} 일 때<br><small>f′(${fmt(k)}) 의 값은?</small>`, deriv);
    },
    // 정적분
    fraction() {
      const a = rand(-3, 3), b = rand(-4, 4), c = rand(-5, 5), top = rand(1, 3);
      if (a === 0 && b === 0 && c === 0) return h3.fraction();
      // ∫0^top (a x² + b x + c) dx = a top³/3 + b top²/2 + c top
      const ans = { n: 2 * a * top ** 3 + 3 * b * top ** 2 + 6 * c * top, d: 6 };
      return frac('fraction', `<span class="integral"><small>${top}</small>∫<small>0</small></span> (${poly([c, b, a])}) dx = ?`, ans);
    },
    // 무한등비급수
    division() {
      const a = nonZero(-6, 9);
      const rr = pick([{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 2, d: 3 }, { n: -1, d: 2 }, { n: 1, d: 4 }, { n: 3, d: 4 }, { n: -1, d: 3 }]);
      const ans = { n: a * rr.d, d: rr.d - rr.n };
      const rText = (rr.n < 0 ? '−' : '') + fracHtml(Math.abs(rr.n), rr.d);
      return frac('division', `첫째항이 ${fmt(a)}, 공비가 ${rText}인<br>무한등비급수의 합은?`, ans);
    },
    // 넓이(정적분 활용), 이차곡선
    geometry() {
      const r = Math.random();
      if (r < 0.4) {
        const k = rand(1, 6);
        return frac('geometry', `곡선 y = x² 과 직선 y = ${lead(k, 'x')} 로<br>둘러싸인 부분의 넓이는?`, { n: k ** 3, d: 6 });
      }
      if (r < 0.7) {
        const [s1, s2, h] = pick(TRIPLES.slice(0, 3));
        const k = rand(1, 2);
        const a = h * k, b = (Math.random() < 0.5 ? s1 : s2) * k, c = Math.sqrt(a * a - b * b);
        return int('geometry', `타원 ${fracHtml('x²', a * a)} + ${fracHtml('y²', b * b)} = 1 의 두 초점 사이의 거리는?`, 2 * c);
      }
      const p = rand(1, 6);
      return int('geometry', `포물선 y² = ${4 * p}x 의 초점의 x좌표는?`, p);
    },
    // 확률분포: 이항분포, 정규분포
    stats() {
      const r = Math.random();
      if (r < 0.4) {
        const pp = pick([{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 1, d: 4 }, { n: 2, d: 5 }, { n: 1, d: 6 }]);
        const n = pp.d * rand(2, 10);
        const askVar = Math.random() < 0.5;
        const mean = { n: n * pp.n, d: pp.d };
        const variance = { n: n * pp.n * (pp.d - pp.n), d: pp.d * pp.d };
        return frac('stats', `확률변수 X 가 이항분포 B(${n}, ${fracHtml(pp.n, pp.d)}) 를 따를 때<br><small>${askVar ? 'V(X)' : 'E(X)'} 의 값은?</small>`, askVar ? variance : mean);
      }
      const m = rand(5, 20) * 5, sd = pick([2, 4, 5, 10]), z = nonZero(-3, 3);
      return int('stats', `X 가 정규분포 N(${m}, ${sd}²) 을 따를 때<br><small>X = ${m + z * sd} 를 표준화한 값 Z 는?</small>`, z);
    },
  };

  MR.Quiz.register('h1', {
    generators: h1,
    labels: {
      addSub: '복소수의 덧셈/뺄셈',
      multiply: '복소수의 곱셈',
      fraction: '근과 계수의 관계',
      division: '나머지정리와 인수정리',
      geometry: '좌표평면 위의 도형',
      stats: '순열과 조합',
    },
  });

  MR.Quiz.register('h2', {
    generators: h2,
    labels: {
      addSub: '로그의 계산',
      multiply: '지수법칙',
      fraction: '삼각함수의 값',
      division: '등차·등비수열과 합',
      geometry: '사인법칙과 코사인법칙',
      stats: '확률',
    },
  });

  MR.Quiz.register('h3', {
    generators: h3,
    labels: {
      addSub: '함수와 수열의 극한',
      multiply: '미분계수',
      fraction: '정적분',
      division: '무한등비급수',
      geometry: '정적분의 활용과 이차곡선',
      stats: '이항분포와 정규분포',
    },
  });
})((globalThis.MR = globalThis.MR || {}));
