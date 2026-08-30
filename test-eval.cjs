const { fileURLToPath } = require('url');
const import_meta = {};
try {
  const isDirectRun = Boolean(
    process.argv.some((arg) => arg.includes("server.ts") || arg.includes("server.cjs") || arg.includes("server.js")) || process.argv[1] && fileURLToPath(import_meta.url) === 'something'
  );
  console.log("isDirectRun evaluated to:", isDirectRun);
} catch (err) {
  console.error("Caught error:", err.message);
}
