const fs = require('fs');
let code = fs.readFileSync('server/platform/db.ts', 'utf-8');

// The functions to modify:
const functions = [
  'persistAttendanceSessionToPostgres',
  'deleteAttendanceSessionFromPostgres',
  'persistAttendanceRecordToPostgres',
  'persistAssessmentToPostgres',
  'deleteAssessmentFromPostgres',
  'persistAssessmentGradeToPostgres',
  'deleteAssessmentGradeFromPostgres',
  'persistStorageObjectToPostgres',
  'deleteStorageObjectFromPostgres'
];

for (const fn of functions) {
  // Find the signature
  const regex = new RegExp(`(private\\s+)(${fn}\\([^)]+\\)):\\s*void\\s*\\{`, 'g');
  code = code.replace(regex, '$1async $2: Promise<void> {');
}

fs.writeFileSync('server/platform/db.ts', code);
console.log('Modified signatures');
