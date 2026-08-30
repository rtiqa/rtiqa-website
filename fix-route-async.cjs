const fs = require('fs');

function processFile(filename) {
  let code = fs.readFileSync(filename, 'utf-8');
  code = code.replace(/router\.([a-z]+)\('([^']+)',\s*(checkAuth(?:WithRole\([^)]+\))?|upload\.[a-z]+\([^)]+\)|.*?),\s*\(req/g, 'router.$1(\'$2\', $3, async (req');
  fs.writeFileSync(filename, code);
}

processFile('server/platform/routes/attendanceRoutes.ts');
processFile('server/platform/routes/gradebookRoutes.ts');
processFile('server/platform/routes/storageRoutes.ts');
console.log('Fixed async');
