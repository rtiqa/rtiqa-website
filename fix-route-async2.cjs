const fs = require('fs');

function makeAsync(filename) {
  let code = fs.readFileSync(filename, 'utf-8');
  // Match any router.method('/path', ..., (req, res) => {
  // and replace with async (req, res) => {
  code = code.replace(/,\s*\(\s*req([^)]*)\)\s*=>/g, ', async (req$1) =>');
  fs.writeFileSync(filename, code);
}

makeAsync('server/platform/routes/attendanceRoutes.ts');
makeAsync('server/platform/routes/gradebookRoutes.ts');
makeAsync('server/platform/routes/storageRoutes.ts');
console.log('Fixed async with better regex');
