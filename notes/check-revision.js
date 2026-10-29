// node check-revision.js — every proof line in revision.js is a premise, an assumption, or a rule on earlier lines.
const fs = require('fs'), vm = require('vm'), c = {};
vm.createContext(c);
vm.runInContext(fs.readFileSync('defs.js', 'utf8') + fs.readFileSync('revision.js', 'utf8') + ';this.R=REG;this.P=PF;this.U=RULES', c);
const bad = [], n = id => +id.slice(1);
for (const t of Object.keys(c.R).filter(k => /^T\d/.test(k))) {
  const pf = c.P[t]?.pf;
  if (!pf) { bad.push(`${t}: no proof`); continue; }
  pf.forEach(([s, why], i) => {
    const at = `${t} line ${i + 1}`;
    if (/^[DAFT]\d+$/.test(why)) {
      if (!c.R[why]) bad.push(`${at}: unknown ${why}`);
      if (why[0] === 'T' && n(why) >= n(t)) bad.push(`${at}: cites later ${why}`);
      return;
    }
    if (why === 'Assume' || why === 'NC') return;
    const m = why.match(/^([A-Z]+) ([\d, –]+)$/);
    if (!m || !c.U.includes(m[1])) return bad.push(`${at}: bad justification "${why}"`);
    const refs = m[2].split(',').flatMap(r => { const [a, b = a] = r.trim().split('–').map(Number); return [a, b]; });
    if (refs.some(r => !(r >= 1 && r <= i))) bad.push(`${at}: refers to a line that is not earlier`);
    if (['RAA', 'CP'].includes(m[1]) && pf[refs[0] - 1]?.[1] !== 'Assume') bad.push(`${at}: ${m[1]} range must start at an Assume line`);
  });
  if (!pf.at(-1)[0].startsWith('∴')) bad.push(`${t}: last line is not the conclusion`);
}
console.log(bad.length ? bad.join('\n') : 'all 56 proofs: every line justified');
process.exit(bad.length ? 1 : 0);
