const fs = require('fs');
let code = fs.readFileSync('test/academic_persistence.test.ts', 'utf-8');

const calls = [
  'db.createAttendanceSession',
  'db.updateAttendanceSession',
  'db.deleteAttendanceSession',
  'db.markAttendance',
  'db.createAssessment',
  'db.updateAssessment',
  'db.deleteAssessment',
  'db.gradeAssessment',
  'db.deleteAssessmentGrade'
];

for (const call of calls) {
  const regex = new RegExp(call.replace(/\./g, '\\.'), 'g');
  code = code.replace(regex, `await ${call}`);
}

code = code.replace(/await await/g, 'await');
code = code.replace(/test\('([^']+)',\s*\(\)\s*=>\s*\{/g, "test('$1', async () => {");
fs.writeFileSync('test/academic_persistence.test.ts', code);
console.log('Fixed test');
