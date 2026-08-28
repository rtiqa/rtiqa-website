const fs = require('fs');
const file = 'server/platform/ai/rag/vectorStore.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/allowedLessonIds\?: string\[\];\n/g, '');
fs.writeFileSync(file, content);
