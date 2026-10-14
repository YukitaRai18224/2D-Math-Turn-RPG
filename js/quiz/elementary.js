// 초등학교 문제: 1~2학년, 3~4학년, 5~6학년
// 1~2학년 교육과정에는 분수·나눗셈이 없어서 비슷한 역할의 단원(가르기·모으기, 곱셈구구 거꾸로)으로 대신한다.
(function (MR) {
  const {
    rand, pick, eun, gwa, eul, degHint, intQuiz, fractionQuiz, decimalQuiz, mixedHtml, figures, dataTable, sample,
  } = MR.QuizKit;

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
    // 표와 ○ 그래프 읽기
    stats() {
      const names = sample(['사과', '바나나', '포도', '딸기', '귤'], 4);
      let counts;
      do { counts = names.map(() => rand(1, 8)); } while (new Set(counts).size < 4);
      const rows = names.map((n, i) => [n, counts[i]]);
      const asCircles = Math.random() < 0.5;
      const figure = dataTable(['과일', '학생 수'], rows, asCircles);
      const hint = '숫자만 입력하세요. (단위: 명)';
      const r = Math.random();
      if (r < 0.35) {
        return intQuiz('stats', '좋아하는 과일을 조사했어요.<br><small>조사한 학생은 모두 몇 명일까요?</small>', counts.reduce((a, b) => a + b, 0), { figure, hint });
      }
      if (r < 0.65) {
        return intQuiz('stats', '가장 많은 학생이 좋아하는 과일은<br><small>몇 명이 좋아할까요?</small>', Math.max(...counts), { figure, hint });
      }
      const [i, j] = sample([0, 1, 2, 3], 2).sort((a, b) => counts[b] - counts[a]);
      return intQuiz('stats', `${eul(names[i])} 좋아하는 학생은 ${names[j]}보다<br><small>몇 명 더 많을까요?</small>`, counts[i] - counts[j], { figure, hint });
    },
  };

  // ---------- 초등 3~4학년 ----------
  const g34 = {
    // 세 자리 수의 덧셈/뺄셈
    addSub() {
      if (Math.random() < 0.5) {
        const a = rand(100, 899), b = rand(100, 899);
        return intQuiz('addSub', `${a} + ${b} = ?`, a + b);
      }
      const a = rand(300, 999), b = rand(100, a - 50);
      return intQuiz('addSub', `${a} − ${b} = ?`, a - b);
    },
    // (두·세 자리 수) × (한·두 자리 수)
    multiply() {
      const r = Math.random();
      if (r < 0.35) {
        const a = rand(12, 99), b = rand(2, 9);
        return intQuiz('multiply', `${a} × ${b} = ?`, a * b);
      }
      if (r < 0.65) {
        const a = rand(102, 999), b = rand(2, 9);
        return intQuiz('multiply', `${a} × ${b} = ?`, a * b);
      }
      const a = rand(12, 99), b = rand(11, 99);
      return intQuiz('multiply', `${a} × ${b} = ?`, a * b);
    },
    // 분모가 같은 분수의 덧셈/뺄셈, 소수의 덧셈/뺄셈
    fraction() {
      const isAdd = Math.random() < 0.5;
      if (Math.random() < 0.6) {
        const d = rand(3, 12);
        let a = { n: rand(1, d - 1) + (Math.random() < 0.35 ? rand(1, 3) * d : 0), d };
        let b = { n: rand(1, d - 1) + (Math.random() < 0.2 ? rand(1, 2) * d : 0), d };
        if (!isAdd && a.n < b.n) [a, b] = [b, a];
        if (!isAdd && a.n === b.n) a = { n: a.n + d, d };
        return fractionQuiz(`${mixedHtml(a)} ${isAdd ? '+' : '−'} ${mixedHtml(b)} = ?`, { n: isAdd ? a.n + b.n : a.n - b.n, d }, 'mixed');
      }
      const places = Math.random() < 0.6 ? 1 : 2;
      const scale = places === 1 ? 10 : 100;
      let A = rand(scale + 1, 10 * scale - 1), B = rand(scale / 10 + 1, 10 * scale - 1);
      if (!isAdd && A <= B) [A, B] = [B + 1, A];
      return decimalQuiz('fraction', `${(A / scale).toFixed(places)} ${isAdd ? '+' : '−'} ${(B / scale).toFixed(places)} = ?`,
        (isAdd ? A + B : A - B) / scale);
    },
    // 나눗셈 (나누어떨어지는 나눗셈, 몫과 나머지)
    division() {
      const r = Math.random();
      if (r < 0.4) {
        const b = rand(2, 9), q = rand(11, Math.floor(99 / b));
        return intQuiz('division', `${b * q} ÷ ${b} = ?`, q);
      }
      if (r < 0.7) {
        const b = rand(12, 45), q = rand(Math.ceil(100 / b), Math.floor(999 / b));
        return intQuiz('division', `${b * q} ÷ ${b} = ?`, q);
      }
      const b = rand(3, 9), q = rand(4, 15), rem = rand(1, b - 1);
      return Math.random() < 0.5
        ? intQuiz('division', `${b * q + rem} ÷ ${b} 의 몫은?`, q)
        : intQuiz('division', `${b * q + rem} ÷ ${b} 의 나머지는?`, rem);
    },
    // 삼각형·사각형의 각, 원의 반지름과 지름
    geometry() {
      const r = Math.random();
      if (r < 0.35) {
        let a, b;
        do { a = rand(30, 100); b = rand(25, 120); } while (180 - a - b < 20);
        const angles = [`${a}°`, `${b}°`, '□'];
        const order = sample([0, 1, 2], 3);
        return intQuiz('geometry', '삼각형에서 □ 안에 알맞은 각도는?', 180 - a - b, {
          figure: figures.triangleAngles(order.map((i) => angles[i])),
          hint: degHint,
        });
      }
      if (r < 0.6) {
        let a, b, c;
        do { a = rand(60, 130); b = rand(60, 130); c = rand(60, 130); } while (360 - a - b - c < 40 || 360 - a - b - c > 170);
        const angles = sample([`${a}°`, `${b}°`, `${c}°`, '□'], 4);
        return intQuiz('geometry', '사각형에서 □ 안에 알맞은 각도는?', 360 - a - b - c, {
          figure: figures.quadAngles(angles),
          hint: degHint,
        });
      }
      if (r < 0.85) {
        const rad = rand(2, 15);
        return Math.random() < 0.5
          ? intQuiz('geometry', '원의 지름은 몇 cm일까요?', 2 * rad, { figure: figures.circleRadius(`${rad} cm`, false), hint: '숫자만 입력하세요. (단위: cm)' })
          : intQuiz('geometry', '원의 반지름은 몇 cm일까요?', rad, { figure: figures.circleRadius(`${2 * rad} cm`, true), hint: '숫자만 입력하세요. (단위: cm)' });
      }
      const s = rand(3, 25);
      return intQuiz('geometry', '정삼각형의 세 변의 길이의 합은 몇 cm일까요?', 3 * s, {
        figure: figures.regular(3, s),
        hint: '숫자만 입력하세요. (단위: cm)',
      });
    },
    // 막대그래프 읽기
    stats() {
      const names = sample(['국어', '수학', '과학', '사회', '영어', '체육'], rand(4, 5));
      const step = Math.random() < 0.5 ? 1 : 2;
      let values;
      do { values = names.map(() => rand(2, 12) * step); } while (new Set(values).size < names.length);
      const figure = figures.barChart(names.map((n, i) => [n, values[i]]), step, '명');
      const hint = '숫자만 입력하세요. (단위: 명)';
      const text = '좋아하는 과목별 학생 수를 막대그래프로 나타냈어요.';
      const r = Math.random();
      if (r < 0.35) return intQuiz('stats', `${text}<br><small>조사한 학생은 모두 몇 명일까요?</small>`, values.reduce((a, b) => a + b, 0), { figure, hint });
      if (r < 0.7) {
        return intQuiz('stats', `${text}<br><small>가장 많은 과목과 가장 적은 과목의 학생 수 차이는?</small>`,
          Math.max(...values) - Math.min(...values), { figure, hint });
      }
      const k = rand(0, names.length - 1);
      return intQuiz('stats', `${text}<br><small>${eul(names[k])} 좋아하는 학생은 몇 명일까요?</small>`, values[k], { figure, hint });
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
    // 자연수의 혼합 계산 (곱셈·나눗셈 먼저, 괄호 먼저)
    addSub() {
      const r = rand(0, 3);
      if (r === 0) {
        const a = rand(10, 60), b = rand(2, 9), c = rand(2, 9);
        const d = rand(1, Math.min(40, a + b * c - 1));
        return intQuiz('addSub', `${a} + ${b} × ${c} − ${d} = ?`, a + b * c - d);
      }
      if (r === 1) {
        const a = rand(3, 20), b = rand(2, 15), c = rand(2, 9);
        return intQuiz('addSub', `(${a} + ${b}) × ${c} = ?`, (a + b) * c);
      }
      if (r === 2) {
        const c = rand(2, 9), q = rand(2, 12), a = rand(q + 1, 80), d = rand(1, 30);
        return intQuiz('addSub', `${a} − ${c * q} ÷ ${c} + ${d} = ?`, a - q + d);
      }
      let a, b, c, d;
      do { a = rand(3, 15); b = rand(3, 12); c = rand(2, 9); d = rand(2, 9); } while (a * b <= c * d);
      return intQuiz('addSub', `${a} × ${b} − ${c} × ${d} = ?`, a * b - c * d);
    },
    // 분수의 곱셈, 소수의 곱셈
    multiply() {
      const r = Math.random();
      if (r < 0.35) {
        const A = rand(11, 99), n = rand(2, 9);
        return decimalQuiz('multiply', `${(A / 10).toFixed(1)} × ${n} = ?`, (A * n) / 10);
      }
      if (r < 0.55) {
        const A = rand(2, 9), B = rand(11, 49);
        return decimalQuiz('multiply', `${(A / 10).toFixed(1)} × ${(B / 10).toFixed(1)} = ?`, (A * B) / 100);
      }
      const a = randomFraction(Math.random() < 0.3);
      const b = Math.random() < 0.4 ? { n: rand(2, 9), d: 1 } : randomFraction(false);
      return fractionQuiz(`${mixedHtml(a)} × ${mixedHtml(b)} = ?`, { n: a.n * b.n, d: a.d * b.d }, 'mixed', { kind: 'multiply' });
    },
    // 분수의 나눗셈, 소수의 나눗셈
    division() {
      const r = Math.random();
      if (r < 0.35) {
        const q = rand(11, 99), n = rand(2, 9);
        return decimalQuiz('division', `${((q * n) / 10).toFixed(1)} ÷ ${n} = ?`, q / 10);
      }
      if (r < 0.55) {
        const q = rand(2, 12), B = rand(2, 9);
        return intQuiz('division', `${((B * q) / 10).toFixed(1)} ÷ ${(B / 10).toFixed(1)} = ?`, q);
      }
      const a = randomFraction(Math.random() < 0.3);
      const b = Math.random() < 0.35 ? { n: rand(2, 6), d: 1 } : randomFraction(false);
      return fractionQuiz(`${mixedHtml(a)} ÷ ${mixedHtml(b)} = ?`, { n: a.n * b.d, d: a.d * b.n }, 'mixed', { kind: 'division' });
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
    // 평균, 평균으로 모르는 값 구하기, 비율
    stats() {
      const people = sample(['민지', '서준', '하윤', '도윤', '지아', '시우'], rand(4, 5));
      const mean = rand(6, 18) * 5;
      let values;
      do {
        values = people.map(() => mean + rand(-12, 12));
        const diff = mean * people.length - values.reduce((a, b) => a + b, 0);
        values[values.length - 1] += diff;
      } while (values.some((v) => v < 10 || v > 100));
      const r = Math.random();
      if (r < 0.45) {
        return intQuiz('stats', '수학 점수의 평균은 몇 점일까요?', mean, {
          figure: dataTable(['이름', '점수'], people.map((p, i) => [p, values[i]])),
          hint: '숫자만 입력하세요. (단위: 점)',
        });
      }
      if (r < 0.8) {
        const k = rand(0, people.length - 1);
        return intQuiz('stats', `점수의 평균이 ${mean}점일 때<br><small>${people[k]}의 점수는 몇 점일까요?</small>`, values[k], {
          figure: dataTable(['이름', '점수'], people.map((p, i) => [p, i === k ? '□' : values[i]])),
          hint: '숫자만 입력하세요. (단위: 점)',
        });
      }
      const total = pick([20, 25, 40, 50, 200, 300]);
      const pct = pick([10, 20, 25, 30, 40, 50, 60, 75]);
      const ans = (total * pct) / 100;
      if (!Number.isInteger(ans)) return this.stats();
      const thing = pick(['축구', '피구', '줄넘기', '수영']);
      return intQuiz('stats', `학생 ${total}명 중 ${pct}%가 ${eul(thing)} 좋아해요.<br><small>${eul(thing)} 좋아하는 학생은 몇 명일까요?</small>`, ans, {
        hint: '숫자만 입력하세요. (단위: 명)',
      });
    },
  };

  MR.Quiz.register('g12', {
    generators: g12,
    labels: {
      addSub: '한·두 자리 수의 덧셈/뺄셈',
      multiply: '곱셈구구',
      fraction: '가르기·모으기와 세 수의 계산',
      division: '곱셈구구로 □ 구하기',
      geometry: '도형의 변·꼭짓점과 길이',
      stats: '표와 그래프 읽기',
    },
  });

  MR.Quiz.register('g34', {
    generators: g34,
    labels: {
      addSub: '세 자리 수의 덧셈/뺄셈',
      multiply: '두·세 자리 수의 곱셈',
      fraction: '같은 분모 분수와 소수의 덧셈/뺄셈',
      division: '나눗셈 (몫과 나머지)',
      geometry: '각도, 원의 반지름과 지름',
      stats: '막대그래프 읽기',
    },
  });

  MR.Quiz.register('g56', {
    generators: g56,
    labels: {
      addSub: '자연수의 혼합 계산',
      multiply: '분수와 소수의 곱셈',
      fraction: '분수의 덧셈/뺄셈',
      division: '분수와 소수의 나눗셈',
      geometry: '도형의 둘레/넓이',
      stats: '평균과 자료 해석',
    },
  });
})((globalThis.MR = globalThis.MR || {}));
