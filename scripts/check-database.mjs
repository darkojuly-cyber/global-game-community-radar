import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 2000 });
try { await client.connect(); await client.query('SELECT 1'); await client.end(); }
catch { await client.end().catch(()=>{}); process.exitCode=1; }
