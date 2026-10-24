// 스테이지 하나의 승률을 레벨별로 빠르게 확인하는 스크립트 (보스 능력치 조정용).
//   node tests/tune.js 3-20                          → 지금 데이터 그대로
//   node tests/tune.js 3-20 vigenere '{"hp":20000}' → 해당 몬스터의 base 능력치를 바꿔서
//   node tests/tune.js 3-20 - - 36,40,44             → 확인할 레벨 지정 (기본 30,35,40,45)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const [stageId, monsterKey, tweak, levelArg] = process.argv.slice(2);
const ctx = vm.createContext({ console, Math });
ctx.globalThis = ctx;
for (const f of ['config.js', 'data/characters.js', 'data/equipment.js', 'data/breakthrough.js', 'data/monsters.js', 'data/stages.js',
  'quiz.js', 'quiz/elementary.js', 'quiz/middle.js', 'quiz/high.js', 'battle.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const MR = ctx.MR;
const stage = MR.STAGES.find((s) => s.id === stageId);
if (!stage) throw new Error(`스테이지 없음: ${stageId}`);
if (monsterKey && monsterKey !== '-' && tweak && tweak !== '-') Object.assign(MR.MONSTERS[monsterKey].base, JSON.parse(tweak));
const levels = (levelArg || '30,35,40,45').split(',').map(Number);

(async () => {
  const out = [];
  for (const lv of levels) {
    let wins = 0, rounds = 0;
    const N = 150;
    for (let i = 0; i < N; i++) {
      const io = {};
      const b = new MR.Battle(stage, Object.fromEntries(MR.CHARACTER_ORDER.map((k) => [k, lv])), io);
      Object.assign(io, {
        async chooseAction(u) {
          if (b.round > 80) { b.abort(); return { type: 'abort' }; }
          for (const a of b.allies) if (b.canUlt(a)) b.requestUltimate(a.uid);
          if (b.ultQueue.length) return { type: 'interrupt' };
          if (b.isSilenced(u)) return { type: 'attack' };
          return { type: b.sp >= 2 || (b.sp >= 1 && u.key === 'pricia') ? 'skill' : 'attack' };
        },
        async chooseAlly({ allies }) { return allies[Math.floor(Math.random() * allies.length)]; },
        async quiz() { return Math.random() < 0.8; },
        async delay() {}, update() {}, log() {}, fx() {},
      });
      if ((await b.run()) === 'win') wins++;
      rounds += b.round;
    }
    out.push(`Lv${lv} ${Math.round((wins / N) * 100)}% (${(rounds / N).toFixed(1)}R)`);
  }
  console.log(`${stageId} ${tweak && tweak !== '-' ? tweak : ''} → ${out.join(' | ')}`);
})();
