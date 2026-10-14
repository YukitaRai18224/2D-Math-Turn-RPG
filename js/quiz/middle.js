// 중학교 문제: 1학년, 2학년, 3학년
(function (MR) {
  const {
    rand, pick, fmt, term, sup, lead, paren, comb, SQUARE_FREE, root, coefRoot, blank, nonZero, TRIPLES, degHint,
    intQuiz, fractionQuiz, decimalQuiz, reduce, fracHtml, improperHtml, figures, sample,
  } = MR.QuizKit;

  const showData = (arr) => `<div class="quiz-data">자료: ${arr.join(', ')}</div>`;
  // 음수 분수는 괄호로 감싸서 표시
  const showFrac = (f) => {
    const r = reduce(f);
    const html = improperHtml(r);
    return r.n < 0 ? `(${html})` : html;
  };
  // 반복되는 숫자 위에 점을 찍은 순환소수 표기
  const dot = (digits) => [...String(digits)].map((d) => `<span class="rep">${d}</span>`).join('');

  // ---------- 중학교 1학년 ----------
  const m1 = {
    // 정수의 덧셈/뺄셈
    addSub() {
      const a = nonZero(-15, 15), b = nonZero(-15, 15), c = nonZero(-15, 15);
      const op1 = pick(['+', '−']), op2 = pick(['+', '−']);
      const v = (op1 === '+' ? a + b : a - b);
      const ans = op2 === '+' ? v + c : v - c;
      return intQuiz('addSub', `${paren(a)} ${op1} ${paren(b)} ${op2} ${paren(c)} = ?`, ans, { allowNegative: true });
    },
    // 정수의 곱셈, 거듭제곱, 식의 값
    multiply() {
      const r = Math.random();
      if (r < 0.35) {
        const a = nonZero(-9, 9), b = nonZero(-9, 9), c = nonZero(-6, 6);
        return intQuiz('multiply', `${paren(a)} × ${paren(b)} × ${paren(c)} = ?`, a * b * c, { allowNegative: true });
      }
      if (r < 0.65) {
        const base = pick([-3, -2, 2, 3]), e = base === 2 || base === -2 ? rand(2, 5) : rand(2, 3);
        const k = nonZero(-4, 4);
        return intQuiz('multiply', `${paren(base)}${sup(e)} × ${paren(k)} = ?`, base ** e * k, { allowNegative: true });
      }
      const x = nonZero(-4, 4), a = nonZero(-5, 5), b = nonZero(-6, 6), c = rand(-9, 9);
      return intQuiz('multiply', `x = ${fmt(x)} 일 때<br>${lead(a, 'x²')}${term(b, 'x')}${term(c)} 의 값은?`, a * x * x + b * x + c, { allowNegative: true });
    },
    // 유리수의 사칙계산
    fraction() {
      const x = { n: nonZero(-9, 9), d: rand(2, 9) };
      const y = { n: nonZero(-9, 9), d: rand(2, 9) };
      const op = pick(['+', '−', '×', '÷']);
      let ans;
      if (op === '+') ans = { n: x.n * y.d + y.n * x.d, d: x.d * y.d };
      else if (op === '−') ans = { n: x.n * y.d - y.n * x.d, d: x.d * y.d };
      else if (op === '×') ans = { n: x.n * y.n, d: x.d * y.d };
      else ans = { n: x.n * y.d * Math.sign(y.n), d: x.d * Math.abs(y.n) };
      return fractionQuiz(`${showFrac(x)} ${op} ${showFrac(y)} = ?`, ans, 'improper');
    },
    // 일차방정식
    division() {
      const sol = nonZero(-9, 9);
      let a, c;
      do { a = nonZero(-6, 9); c = rand(-5, 5); } while (a === c);
      const b = rand(-15, 15);
      const d = a * sol + b - c * sol;
      const right = c === 0 ? fmt(d) : `${lead(c, 'x')}${term(d)}`;
      return intQuiz('division', `${lead(a, 'x')}${term(b)} = ${right}<br><small>x 의 값은?</small>`, sol, { allowNegative: true });
    },
    // 다각형의 각, 부채꼴
    geometry() {
      const r = Math.random();
      const names = { 3: '정삼각형', 4: '정사각형', 5: '정오각형', 6: '정육각형', 8: '정팔각형', 9: '정구각형', 10: '정십각형', 12: '정십이각형' };
      if (r < 0.3) {
        const n = rand(5, 12);
        return intQuiz('geometry', `${n}각형의 내각의 크기의 합은 몇 도일까요?`, (n - 2) * 180, { hint: degHint });
      }
      if (r < 0.6) {
        const n = pick([5, 6, 8, 9, 10, 12]);
        return Math.random() < 0.5
          ? intQuiz('geometry', `${names[n]}의 한 외각의 크기는?`, 360 / n, { figure: figures.regular(Math.min(n, 12)), hint: degHint })
          : intQuiz('geometry', `${names[n]}의 한 내각의 크기는?`, 180 - 360 / n, { figure: figures.regular(Math.min(n, 12)), hint: degHint });
      }
      // 부채꼴의 호의 길이 / 넓이 = □π
      for (;;) {
        const rad = rand(2, 12), ang = pick([30, 45, 60, 90, 120, 135, 150, 180, 240, 270]);
        const arc = (rad * ang) / 180, area = (rad * rad * ang) / 360;
        const askArc = Math.random() < 0.5;
        const v = askArc ? arc : area;
        if (!Number.isInteger(v)) continue;
        return intQuiz('geometry', `부채꼴의 ${askArc ? '호의 길이' : '넓이'}가 □π ${askArc ? 'cm' : 'cm²'}일 때<br>${blank}`, v, {
          figure: figures.sector(rad, ang),
          hint: '숫자만 입력하세요. (π 앞의 수)',
        });
      }
    },
    // 대푯값(중앙값, 최빈값), 상대도수
    stats() {
      const r = Math.random();
      if (r < 0.35) {
        const n = pick([6, 8]);
        let vals;
        do {
          vals = Array.from({ length: n }, () => rand(1, 40)).sort((a, b) => a - b);
        } while ((vals[n / 2 - 1] + vals[n / 2]) % 2);
        return intQuiz('stats', '다음 자료의 중앙값은?', (vals[n / 2 - 1] + vals[n / 2]) / 2, { figure: showData(sample(vals, n)), hint: '숫자만 입력하세요.' });
      }
      if (r < 0.65) {
        const mode = rand(2, 30);
        const others = sample(Array.from({ length: 30 }, (_, i) => i + 1).filter((v) => v !== mode), 5);
        const vals = sample([mode, mode, mode, ...others.slice(0, 2), others[2], others[2], ...others.slice(3)], 10);
        return intQuiz('stats', '다음 자료의 최빈값은?', mode, { figure: showData(vals), hint: '숫자만 입력하세요.' });
      }
      const total = pick([20, 25, 40, 50]);
      let f;
      do { f = rand(1, total - 1); } while (((f * 100) / total) % 1);
      return decimalQuiz('stats', `전체 도수가 ${total}인 도수분포표에서<br><small>도수가 ${f}인 계급의 상대도수는?</small>`, f / total);
    },
  };

  // ---------- 중학교 2학년 ----------
  const m2 = {
    // 다항식의 덧셈/뺄셈
    addSub() {
      const a = nonZero(-9, 9), b = nonZero(-9, 9), c = nonZero(-9, 9), d = nonZero(-9, 9);
      const sub = Math.random() < 0.5;
      const xc = sub ? a - c : a + c, yc = sub ? b - d : b + d;
      const left = `(${lead(a, 'x')}${term(b, 'y')}) ${sub ? '−' : '+'} (${lead(c, 'x')}${term(d, 'y')})`;
      if (Math.random() < 0.5 && yc !== 0) {
        return intQuiz('addSub', `${left}<br>= □x${term(yc, 'y')}<br>${blank}`, xc, { allowNegative: true });
      }
      return intQuiz('addSub', `${left}<br>= ${xc === 0 ? '' : lead(xc, 'x') + ' + '}□y<br>${blank}`, yc, { allowNegative: true });
    },
    // 지수법칙, 단항식의 곱셈
    multiply() {
      const r = Math.random();
      if (r < 0.3) {
        const m = rand(2, 9), n = rand(2, 9);
        return intQuiz('multiply', `a${sup(m)} × a${sup(n)} = a${sup('□')}<br>${blank}`, m + n);
      }
      if (r < 0.55) {
        const m = rand(2, 6), n = rand(2, 5);
        return intQuiz('multiply', `(a${sup(m)})${sup(n)} = a${sup('□')}<br>${blank}`, m * n);
      }
      const k = pick([-3, -2, 2, 3]), e = rand(1, 3), p = rand(2, 3);
      return intQuiz('multiply', `(${lead(k, 'x')}${e > 1 ? sup(e) : ''})${sup(p)} = □x${sup(e * p)}<br>${blank}`, k ** p, { allowNegative: true });
    },
    // 순환소수를 분수로
    fraction() {
      const r = Math.random();
      if (r < 0.4) {
        const a = rand(1, 8);
        return fractionQuiz(`0.${dot(a)} = ?<br><small>기약분수로 나타내세요.</small>`, { n: a, d: 9 }, 'improper');
      }
      if (r < 0.75) {
        let ab;
        do { ab = rand(10, 98); } while (ab % 11 === 0);
        return fractionQuiz(`0.${dot(ab)} = ?<br><small>기약분수로 나타내세요.</small>`, { n: ab, d: 99 }, 'improper');
      }
      const a = rand(1, 9);
      let b;
      do { b = rand(1, 9); } while (b === a);
      return fractionQuiz(`0.${a}${dot(b)} = ?<br><small>기약분수로 나타내세요.</small>`, { n: 10 * a + b - a, d: 90 }, 'improper');
    },
    // 연립일차방정식
    division() {
      const x = rand(-6, 9), y = rand(-6, 9);
      let a1, b1, a2, b2;
      do {
        a1 = nonZero(-4, 5); b1 = nonZero(-4, 5); a2 = nonZero(-4, 5); b2 = nonZero(-4, 5);
      } while (a1 * b2 - a2 * b1 === 0);
      const eq = (a, b) => `${lead(a, 'x')}${term(b, 'y')} = ${fmt(a * x + b * y)}`;
      const askX = Math.random() < 0.5;
      return intQuiz('division', `<span class="sys">${eq(a1, b1)}<br>${eq(a2, b2)}</span><br><small>${askX ? 'x' : 'y'} 의 값은?</small>`,
        askX ? x : y, { allowNegative: true });
    },
    // 이등변삼각형, 닮음, 피타고라스 정리
    geometry() {
      const r = Math.random();
      if (r < 0.35) {
        const apex = rand(10, 80) * 2;
        const base = (180 - apex) / 2;
        return Math.random() < 0.5
          ? intQuiz('geometry', 'AB = AC 인 이등변삼각형에서 ∠B 의 크기는?', base, { figure: figures.isosceles(`${apex}°`, 'x', ''), hint: degHint })
          : intQuiz('geometry', 'AB = AC 인 이등변삼각형에서 ∠A 의 크기는?', apex, { figure: figures.isosceles('x', `${base}°`, ''), hint: degHint });
      }
      if (r < 0.65) {
        const k = pick([{ n: 2, d: 1 }, { n: 3, d: 1 }, { n: 3, d: 2 }, { n: 5, d: 2 }, { n: 4, d: 3 }]);
        const ab = rand(1, 5) * k.d * 2, bc = rand(1, 6) * k.d * 2;
        const de = (ab * k.n) / k.d, ef = (bc * k.n) / k.d;
        return intQuiz('geometry', '△ABC ∽ △DEF 일 때 EF 의 길이 x 는?', ef, {
          figure: figures.similar(`${ab} cm`, `${bc} cm`, `${de} cm`, 'x'),
          hint: '숫자만 입력하세요. (단위: cm)',
        });
      }
      const [s1, s2, h] = pick(TRIPLES);
      const k = rand(1, 3);
      const [a, b, c] = Math.random() < 0.5 ? [s1 * k, s2 * k, h * k] : [s2 * k, s1 * k, h * k];
      const hint = '숫자만 입력하세요. (단위: cm)';
      return Math.random() < 0.5
        ? intQuiz('geometry', '빗변 AB 의 길이 x 는 몇 cm일까요?', c, { figure: figures.rightTriangle(`${a} cm`, `${b} cm`, 'x', false), hint })
        : intQuiz('geometry', '변 BC 의 길이 x 는 몇 cm일까요?', a, { figure: figures.rightTriangle('x', `${b} cm`, `${c} cm`, false), hint });
    },
    // 경우의 수와 확률
    stats() {
      const r = Math.random();
      if (r < 0.3) {
        const s = rand(3, 11);
        const count = 6 - Math.abs(7 - s);
        return intQuiz('stats', `서로 다른 주사위 두 개를 던질 때<br><small>나온 눈의 합이 ${s}인 경우의 수는?</small>`, count, { hint: '숫자만 입력하세요.' });
      }
      if (r < 0.55) {
        const n = rand(3, 5), k = rand(1, n - 1);
        return intQuiz('stats', `동전 ${n}개를 동시에 던질 때<br><small>앞면이 ${k}개 나오는 경우의 수는?</small>`, comb(n, k), { hint: '숫자만 입력하세요.' });
      }
      if (r < 0.8) {
        const s = rand(3, 11);
        return fractionQuiz(`서로 다른 주사위 두 개를 던질 때<br><small>나온 눈의 합이 ${s}일 확률은?</small>`, { n: 6 - Math.abs(7 - s), d: 36 }, 'improper', { kind: 'stats' });
      }
      const red = rand(2, 7), blue = rand(2, 7);
      return fractionQuiz(`빨간 공 ${red}개, 파란 공 ${blue}개가 든 주머니에서<br><small>공 한 개를 꺼낼 때 빨간 공일 확률은?</small>`, { n: red, d: red + blue }, 'improper', { kind: 'stats' });
    },
  };

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
    // 삼각비
    fraction() {
      const [s1, s2, h] = pick(TRIPLES);
      const k = rand(1, 3);
      // a = BC(∠A 의 대변), b = AC(이웃변)
      const [a, b] = Math.random() < 0.5 ? [s1 * k, s2 * k] : [s2 * k, s1 * k];
      const c = h * k;
      const fn = pick(['sin', 'cos', 'tan']);
      const ans = { sin: { n: a, d: c }, cos: { n: b, d: c }, tan: { n: a, d: b } }[fn];
      return fractionQuiz(`${fn} A = ?`, ans, 'improper', { figure: figures.rightTriangle(a, b, c, true) });
    },
    // 원주각과 중심각, 원에 내접하는 사각형
    geometry() {
      if (Math.random() < 0.6) {
        const central = rand(4, 16) * 10;
        return Math.random() < 0.5
          ? intQuiz('geometry', '∠APB 의 크기는 몇 도일까요?', central / 2, { figure: figures.circleAngle(central, `${central}°`, 'x'), hint: degHint })
          : intQuiz('geometry', '∠AOB 의 크기는 몇 도일까요?', central, { figure: figures.circleAngle(central, 'x', `${central / 2}°`), hint: degHint });
      }
      const a = rand(55, 125);
      return intQuiz('geometry', '원에 내접하는 사각형 ABCD 에서 ∠C 의 크기는?', 180 - a, {
        figure: figures.inscribedQuad(`${a}°`, 'x'),
        hint: degHint,
      });
    },
    // 산포도 (분산, 표준편차)
    stats() {
      const show = (arr) => `<div class="quiz-data">자료: ${arr.join(', ')}</div>`;
      const r = Math.random();
      // 평균과 분산이 정수가 되는 자료 (편차의 합 0)
      const askSd = r >= 0.55;
      for (let tries = 0; tries < 500; tries++) {
        const n = pick([4, 5]);
        const dev = Array.from({ length: n - 1 }, () => rand(-6, 6));
        dev.push(-dev.reduce((a, b) => a + b, 0));
        if (Math.abs(dev[n - 1]) > 8) continue;
        const ss = dev.reduce((a, d) => a + d * d, 0);
        if (ss === 0 || ss % n) continue;
        const variance = ss / n;
        const sd = Math.sqrt(variance);
        if (askSd && !Number.isInteger(sd)) continue;
        const mean = rand(5, 20);
        const vals = dev.map((d) => mean + d);
        return askSd
          ? intQuiz('stats', '다음 자료의 표준편차는?', sd, { figure: show(vals), hint: '숫자만 입력하세요. (평균을 먼저 구해 보세요)' })
          : intQuiz('stats', '다음 자료의 분산은?', variance, { figure: show(vals), hint: '숫자만 입력하세요. (평균을 먼저 구해 보세요)' });
      }
      return this.stats();
    },
  };


  MR.Quiz.register('m1', {
    generators: m1,
    labels: {
      addSub: '정수의 덧셈/뺄셈',
      multiply: '정수의 곱셈, 거듭제곱, 식의 값',
      fraction: '유리수의 사칙계산',
      division: '일차방정식',
      geometry: '다각형의 각, 부채꼴',
      stats: '대푯값과 상대도수',
    },
  });

  MR.Quiz.register('m2', {
    generators: m2,
    labels: {
      addSub: '다항식의 덧셈/뺄셈',
      multiply: '지수법칙과 단항식의 곱셈',
      fraction: '순환소수를 분수로',
      division: '연립일차방정식',
      geometry: '이등변삼각형, 닮음, 피타고라스 정리',
      stats: '경우의 수와 확률',
    },
  });

  MR.Quiz.register('m3', {
    generators: m3,
    labels: {
      addSub: '제곱근의 덧셈/뺄셈',
      multiply: '곱셈 공식과 제곱근의 곱셈',
      fraction: '삼각비',
      division: '인수분해와 이차방정식',
      geometry: '원주각, 원에 내접하는 사각형',
      stats: '산포도 (분산, 표준편차)',
    },
  });
})((globalThis.MR = globalThis.MR || {}));
