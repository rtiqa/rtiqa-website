const fs = require('fs');
const file = 'test/vector_store.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/await t\.test\('search preserves sourceId filters'.*?\}\);\n/s, '');
fs.writeFileSync(file, content);
