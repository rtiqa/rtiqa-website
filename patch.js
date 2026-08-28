const fs = require('fs');
const file = 'server/platform/ai/rag/ragService.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\/\/ 1\. Resolve Curriculum to get allowed Lesson IDs.*?allowedLessonIds = Array\.from\(resolvedSourceIds\);/s, '');
content = content.replace(/allowedLessonIds,/g, '');
fs.writeFileSync(file, content);
