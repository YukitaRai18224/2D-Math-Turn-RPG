// 전투 엔진/퀴즈 점검용 스크립트. 화면 없이 자동으로 전투를 돌린다.
//   node tests/sim.js            → 퀴즈 검사 + 스테이지별 승률표
//   node tests/sim.js 0.7        → 퀴즈 정답률 70% 가정
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ctx = vm.createContext({ console, Math });
ctx.globalThis = ctx;
for (const f of ['config.js', 'data/characters.js', 'data/monsters.js', 'data/stages.js', 'quiz.js', 'battle.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const MR = ctx.MR;
const accuracy = Number(process.argv[2] || 0.8);

// ---------- 퀴즈 검사 ----------
for (const kind of MR.Quiz.kinds) {
  for (let i = 0; i < 2000; i++) {
    const q = MR.Quiz.make(kind);
    assert(q.check(q.answerText).correct, `${kind}: 정답 문자열이 오답 처리됨 (${q.html} / ${q.answerText})`);
    assert(!q.check('').correct, `${kind}: 빈 입력이 정답 처리됨`);
    assert(!/NaN|undefined/.test(q.html + q.answerText), `${kind}: 잘못된 문제 (${q.html})`);
  }
}
const f = MR.Quiz._parseFraction;
assert.deepStrictEqual([f('1 1/2').n, f('1 1/2').d], [3, 2]);
assert.strictEqual(f('1/0'), null);
console.log('퀴즈 검사 통과');

// ---------- 자동 전투 ----------
function autoIo(battle) {
  return {
    async chooseAction(u) {
      for (const a of battle.allies) if (battle.canUlt(a)) battle.requestUltimate(a.uid);
      if (battle.ultQueue.length) return { type: 'interrupt' };
      return { type: battle.sp >= 2 || (battle.sp >= 1 && u.key === 'pricia') ? 'skill' : 'attack' };
    },
    async quiz() { return Math.random() < accuracy; },
    async delay() {},
    update() {},
    log() {},
    fx() {},
  };
}

async function simulate(stage, level, runs = 300) {
  let wins = 0, rounds = 0;
  const levels = Object.fromEntries(MR.PARTY_ORDER.map((k) => [k, level]));
  for (let i = 0; i < runs; i++) {
    const io = {};
    const b = new MR.Battle(stage, levels, io);
    Object.assign(io, autoIo(b));
    if ((await b.run()) === 'win') wins++;
    rounds += b.round;
  }
  return { winRate: wins / runs, avgRounds: rounds / runs };
}

(async () => {
  const levelsToTest = [1, 4, 7, 10];
  console.log(`\n정답률 ${accuracy * 100}% 가정 · 승률 (평균 라운드)`);
  console.log('스테이지 ' + levelsToTest.map((l) => `Lv${l}`.padStart(14)).join(''));
  for (const s of MR.STAGES) {
    const cells = [];
    for (const lv of levelsToTest) {
      const r = await simulate(s, lv);
      cells.push(`${Math.round(r.winRate * 100)}% (${r.avgRounds.toFixed(1)})`.padStart(14));
    }
    console.log(s.id.padEnd(8) + cells.join(''));
  }

  // 레벨업 비용 합계
  let total = 0;
  for (let lv = 1; lv < MR.CONFIG.MAX_LEVEL; lv++) total += MR.CONFIG.levelUpCost(lv);
  const rewards = MR.STAGES.reduce((s, x) => s + x.reward, 0);
  console.log(`\n캐릭터 1명 1→${MR.CONFIG.MAX_LEVEL}레벨 물약: ${total}개 · 1-1~1-12 한 번씩 클리어 시 물약: ${rewards}개`);
})();
