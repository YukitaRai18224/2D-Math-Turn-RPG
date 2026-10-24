// 전투 엔진/퀴즈 점검용 스크립트. 화면 없이 자동으로 전투를 돌린다.
//   node tests/sim.js            → 퀴즈 검사 + 스테이지별 승률표
//   node tests/sim.js 0.7        → 퀴즈 정답률 70% 가정
//   node tests/sim.js --samples  → 난이도별 예시 문제 출력
//   node tests/sim.js --chapter=2 → 챕터 2만 (Lv13~20 기준), --chapter=3 은 Lv22~40, --chapter=4 는 Lv42~60 기준
//   node tests/sim.js --party=kagari,rafa,pricia,hina → 출전 파티 지정
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ctx = vm.createContext({ console, Math });
ctx.globalThis = ctx;
for (const f of ['config.js', 'data/characters.js', 'data/equipment.js', 'data/breakthrough.js', 'data/monsters.js', 'data/stages.js', 'quiz.js',
  'quiz/elementary.js', 'quiz/middle.js', 'quiz/high.js', 'battle.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const MR = ctx.MR;
const accuracy = Number(process.argv.find((a) => /^[\d.]+$/.test(a)) || 0.8);
const partyArg = process.argv.find((a) => a.startsWith('--party='));
const party = partyArg ? partyArg.split('=')[1].split(',') : MR.PARTY_ORDER;

// ---------- 퀴즈 검사 ----------
for (const { id } of MR.Quiz.DIFFICULTIES) {
  for (const kind of MR.Quiz.kinds) {
    for (let i = 0; i < 2000; i++) {
      const q = MR.Quiz.make(kind, id);
      const where = `${id}/${kind}: ${q.html} / ${q.answerText}`;
      assert(q.check(q.answerText).correct, `정답 문자열이 오답 처리됨 (${where})`);
      assert(!q.check('').correct, `빈 입력이 정답 처리됨 (${where})`);
      assert(!/NaN|undefined|Infinity|\+ −|\+ \+/.test(q.html + q.answerText + (q.figure || '')), `잘못된 문제 (${where})`);
    }
  }
}
for (const { id } of MR.Quiz.DIFFICULTIES) {
  for (const kind of MR.Quiz.kinds) assert(MR.Quiz.label(kind, id), `라벨 없음 (${id}/${kind})`);
}
const f = MR.Quiz._parseFraction;
assert.deepStrictEqual([f('1 1/2').n, f('1 1/2').d], [3, 2]);
assert.strictEqual(f('1/0'), null);
console.log('퀴즈 검사 통과');
if (process.argv.includes('--samples')) {
  for (const { id, name } of MR.Quiz.DIFFICULTIES) {
    console.log(`\n[${name}]`);
    for (const kind of MR.Quiz.kinds) {
      for (let i = 0; i < 3; i++) {
        const q = MR.Quiz.make(kind, id);
        const text = q.html.replace(/<span class="frac"><span>([^<]+)<\/span><span>([^<]+)<\/span><\/span>/g, '($1/$2)').replace(/<sup>/g, '^').replace(/<br>/g, ' ').replace(/<[^>]+>/g, '');
        console.log(`  ${kind.padEnd(9)} ${text}  →  ${q.answerText}`);
      }
    }
  }
  process.exit(0);
}

// ---------- 자동 전투 ----------
function autoIo(battle) {
  return {
    async chooseAction(u) {
      // 80라운드가 지나도 안 끝나면 패배로 본다 (회복이 피해를 따라잡는 경우 대비)
      if (battle.round > 80) {
        battle.abort();
        return { type: 'abort' };
      }
      for (const a of battle.allies) if (battle.canUlt(a)) battle.requestUltimate(a.uid);
      if (battle.ultQueue.length) return { type: 'interrupt' };
      if (battle.isSilenced(u)) return { type: 'attack' };
      return { type: battle.sp >= 2 || (battle.sp >= 1 && u.key === 'pricia') ? 'skill' : 'attack' };
    },
    async chooseAlly({ allies }) {
      // 다음 차례가 가장 먼 아군에게 침묵을 넘긴다고 가정하지 않고, 무작위로 고른다
      return allies[Math.floor(Math.random() * allies.length)];
    },
    async quiz() { return Math.random() < accuracy; },
    async delay() {},
    update() {},
    log() {},
    fx() {},
  };
}

async function simulate(stage, level, runs = 150) {
  let wins = 0, rounds = 0;
  const levels = Object.fromEntries(MR.CHARACTER_ORDER.map((k) => [k, level]));
  for (let i = 0; i < runs; i++) {
    const io = {};
    const b = new MR.Battle(stage, levels, io, { party });
    Object.assign(io, autoIo(b));
    if ((await b.run()) === 'win') wins++;
    rounds += b.round;
  }
  return { winRate: wins / runs, avgRounds: rounds / runs };
}

(async () => {
  const chapter = process.argv.find((a) => a.startsWith('--chapter='));
  const ch = chapter ? chapter.split('=')[1] : null;
  const levelsToTest = { 2: [13, 16, 18, 20], 3: [22, 28, 34, 40], 4: [42, 48, 54, 60] }[ch] || [1, 4, 7, 10];
  console.log(`\n정답률 ${accuracy * 100}% 가정 · 파티: ${party.join(', ')} · 승률 (평균 라운드)`);
  console.log('스테이지 ' + levelsToTest.map((l) => `Lv${l}`.padStart(14)).join(''));
  for (const s of MR.STAGES.filter((x) => !ch || x.id.startsWith(`${ch}-`))) {
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
  console.log(`\n캐릭터 1명 1→${MR.CONFIG.MAX_LEVEL}레벨 물약: ${total}개 · 모든 스테이지를 한 번씩 클리어 시 물약: ${rewards}개`);
})();
