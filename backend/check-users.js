require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT email, role FROM users').then(r => {
  if (r.rows.length === 0) {
    console.log('NO USERS FOUND - database is empty, need to seed');
  } else {
    console.log('Users in DB:', JSON.stringify(r.rows, null, 2));
  }
  pool.end();
}).catch(e => {
  console.error('DB Error:', e.message);
  pool.end();
});
