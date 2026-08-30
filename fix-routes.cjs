const fs = require('fs');

function processFile(filename, replacements) {
  let code = fs.readFileSync(filename, 'utf-8');
  for (const { search, replace } of replacements) {
    code = code.replace(search, replace);
  }
  fs.writeFileSync(filename, code);
}

// attendanceRoutes.ts
processFile('server/platform/routes/attendanceRoutes.ts', [
  {
    search: /const newSession = db\.createAttendanceSession\(/g,
    replace: 'const newSession = await db.createAttendanceSession('
  },
  {
    search: /const savedRecords = db\.markAttendance\(/g,
    replace: 'const savedRecords = await db.markAttendance('
  },
  {
    search: /const updated = db\.updateAttendanceSession\(/g,
    replace: 'const updated = await db.updateAttendanceSession('
  },
  {
    search: /db\.updateAttendanceSession\(session\.id, orgId, \{ status: 'COMPLETED' \}\);/g,
    replace: 'await db.updateAttendanceSession(session.id, orgId, { status: \'COMPLETED\' });'
  },
  {
    search: /const deleted = db\.deleteAttendanceSession\(/g,
    replace: 'const deleted = await db.deleteAttendanceSession('
  },
  {
    search: /db\.deleteAttendanceSession\(session\.id, orgId\);/g,
    replace: 'await db.deleteAttendanceSession(session.id, orgId);'
  }
]);

// gradebookRoutes.ts
processFile('server/platform/routes/gradebookRoutes.ts', [
  {
    search: /const assessment = db\.createAssessment\(/g,
    replace: 'const assessment = await db.createAssessment('
  },
  {
    search: /const updated = db\.updateAssessment\(/g,
    replace: 'const updated = await db.updateAssessment('
  },
  {
    search: /db\.deleteAssessment\(req\.params\.id, orgId\);/g,
    replace: 'await db.deleteAssessment(req.params.id, orgId);'
  },
  {
    search: /const grade = db\.gradeAssessment\(/g,
    replace: 'const grade = await db.gradeAssessment('
  },
  {
    search: /db\.deleteAssessmentGrade\(req\.params\.gradeId, orgId\);/g,
    replace: 'await db.deleteAssessmentGrade(req.params.gradeId, orgId);'
  }
]);

// storageRoutes.ts
processFile('server/platform/routes/storageRoutes.ts', [
  {
    search: /const obj = db\.createStorageObject\(/g,
    replace: 'const obj = await db.createStorageObject('
  },
  {
    search: /db\.deleteStorageObject\(req\.params\.id, req\.user\.organizationId\);/g,
    replace: 'await db.deleteStorageObject(req.params.id, req.user.organizationId);'
  }
]);

console.log('Modified routes');
