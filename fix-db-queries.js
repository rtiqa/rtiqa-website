const fs = require('fs');
let code = fs.readFileSync('server/platform/db.ts', 'utf-8');

// There are occurrences like:
// pool.query(
//   `...`,
//   [...]
// ).catch((err) => { ... });

// I will just use a regex to transform pool.query(...).catch((err) => { ... })
// into try { await pool.query(...); } catch(err: any) { ... }
// Wait, regex for this is error-prone.
// Let's do it manually via a script that matches the known blocks.

// Or we can just use AST, but a simple string replacement will work if we are careful.

const replacements = [
  // 1. Attendance session persist
  {
    search: `      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist attendance session', err);
        throw err;
      }
      console.error('[PostgreSQL Session Persist Warning]:', (err as Error).message);
    });`,
    replace: `      ]
      );
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist attendance session', err);
        throw err;
      }
      console.error('[PostgreSQL Session Persist Warning]:', err.message);
    }`
  },
  // 2. Attendance session delete
  {
    search: `    pool.query('DELETE FROM attendance_sessions WHERE id = $1 AND organization_id = $2', [id, organizationId]).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Session Warning]:', (err as Error).message);
    });`,
    replace: `    try {
      await pool.query('DELETE FROM attendance_sessions WHERE id = $1 AND organization_id = $2', [id, organizationId]);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Session Warning]:', err.message);
    }`
  },
  // 3. Attendance record persist
  {
    search: `      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist attendance record', err);
        throw err;
      }
      console.error('[PostgreSQL Record Persist Warning]:', (err as Error).message);
    });`,
    replace: `      ]
      );
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist attendance record', err);
        throw err;
      }
      console.error('[PostgreSQL Record Persist Warning]:', err.message);
    }`
  },
  // 4. Assessment persist
  {
    search: `      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist assessment', err);
        throw err;
      }
      console.error('[PostgreSQL Assessment Persist Warning]:', (err as Error).message);
    });`,
    replace: `      ]
      );
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist assessment', err);
        throw err;
      }
      console.error('[PostgreSQL Assessment Persist Warning]:', err.message);
    }`
  },
  // 5. Assessment delete
  {
    search: `    pool.query('DELETE FROM assessments WHERE id = $1 AND organization_id = $2', [id, organizationId]).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Assessment Warning]:', (err as Error).message);
    });`,
    replace: `    try {
      await pool.query('DELETE FROM assessments WHERE id = $1 AND organization_id = $2', [id, organizationId]);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Assessment Warning]:', err.message);
    }`
  },
  // 6. Assessment Grade persist
  {
    search: `      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist assessment grade', err);
        throw err;
      }
      console.error('[PostgreSQL Grade Persist Warning]:', (err as Error).message);
    });`,
    replace: `      ]
      );
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist assessment grade', err);
        throw err;
      }
      console.error('[PostgreSQL Grade Persist Warning]:', err.message);
    }`
  },
  // 7. Assessment Grade delete
  {
    search: `    pool.query('DELETE FROM assessment_grades WHERE id = $1 AND organization_id = $2', [id, organizationId]).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Grade Warning]:', (err as Error).message);
    });`,
    replace: `    try {
      await pool.query('DELETE FROM assessment_grades WHERE id = $1 AND organization_id = $2', [id, organizationId]);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Grade Warning]:', err.message);
    }`
  },
  // 8. Storage Object persist
  {
    search: `      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist storage object', err);
        throw err;
      }
      console.error('[PostgreSQL Storage Object Persist Warning]:', (err as Error).message);
    });`,
    replace: `      ]
      );
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist storage object', err);
        throw err;
      }
      console.error('[PostgreSQL Storage Object Persist Warning]:', err.message);
    }`
  },
  // 9. Storage Object hard delete
  {
    search: `      pool.query('DELETE FROM storage_objects WHERE id = $1 AND organization_id = $2', [id, organizationId]).catch((err) => {
        if (process.env.NODE_ENV === 'production') throw err;
        console.error('[PostgreSQL Delete Storage Object Warning]:', (err as Error).message);
      });`,
    replace: `      try {
        await pool.query('DELETE FROM storage_objects WHERE id = $1 AND organization_id = $2', [id, organizationId]);
      } catch (err: any) {
        if (process.env.NODE_ENV === 'production') throw err;
        console.error('[PostgreSQL Delete Storage Object Warning]:', err.message);
      }`
  },
  // 10. Storage Object soft delete
  {
    search: `        [id, organizationId]
      ).catch((err) => {
        if (process.env.NODE_ENV === 'production') throw err;
        console.error('[PostgreSQL Soft Delete Storage Object Warning]:', (err as Error).message);
      });`,
    replace: `        [id, organizationId]
        );
      } catch (err: any) {
        if (process.env.NODE_ENV === 'production') throw err;
        console.error('[PostgreSQL Soft Delete Storage Object Warning]:', err.message);
      }`
  }
];

let changed = true;
while (changed) {
  changed = false;
  // Also we need to add try { await pool.query( around the long queries.
  code = code.replace(/    pool\.query\([\s\S]*?\n      \]\n      \);/g, (match) => {
    if (!match.startsWith('    try {\n      await pool.query(')) {
       changed = true;
       return match.replace('    pool.query(', '    try {\n      await pool.query(');
    }
    return match;
  });
}

for (const repl of replacements) {
  code = code.replace(repl.search, repl.replace);
}

// Ensure await is added to the block
code = code.replace(/    pool\.query\(\n      `INSERT INTO/g, '    try {\n      await pool.query(\n      `INSERT INTO');

fs.writeFileSync('server/platform/db.ts', code);
console.log('Modified queries');
