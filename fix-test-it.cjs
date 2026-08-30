const fs = require('fs');
let code = fs.readFileSync('test/academic_persistence.test.ts', 'utf-8');
code = code.replace(/it\('([^']+)',\s*\(\)\s*=>\s*\{/g, "it('$1', async () => {");
fs.writeFileSync('test/academic_persistence.test.ts', code);
console.log('Fixed it');
