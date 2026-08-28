const fs = require('fs');
const file = 'server/platform/ai/rag/inMemoryVectorStore.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/if \(chunk\.sourceType === 'LESSON' && filter\.allowedLessonIds\) \{.*?return false;\n        \}\n      \}/s, '');
fs.writeFileSync(file, content);
