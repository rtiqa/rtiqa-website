const fs = require('fs');
let code = fs.readFileSync('server/platform/db.ts', 'utf-8');
const catches = code.match(/\.catch\(/g);
console.log('Remaining .catch() occurrences:', catches ? catches.length : 0);
