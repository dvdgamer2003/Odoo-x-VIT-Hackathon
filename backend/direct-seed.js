require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    // Check if already seeded
    const existing = await client.query("SELECT id FROM users WHERE email = 'admin@acme.com'");
    if (existing.rows.length > 0) {
      console.log('Seed data already exists. Skipping...');
      return;
    }

    console.log('Seeding database...');
    const passwordHash = await bcrypt.hash('password123', 12);

    // Create company
    const companyId = uuidv4();
    await client.query(
      `INSERT INTO companies (id, name, country, "defaultCurrency", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [companyId, 'ACME Corporation', 'US', 'USD']
    );
    console.log('Company created:', companyId);

    // Create admin
    const adminId = uuidv4();
    await client.query(
      `INSERT INTO users (id, "companyId", name, email, "passwordHash", role, "isManagerApprover", "mustChangePassword", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'ADMIN', false, false, NOW(), NOW())`,
      [adminId, companyId, 'Admin Boss', 'admin@acme.com', passwordHash]
    );
    console.log('Admin created');

    // Create manager
    const managerId = uuidv4();
    await client.query(
      `INSERT INTO users (id, "companyId", name, email, "passwordHash", role, "isManagerApprover", "mustChangePassword", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'MANAGER', true, false, NOW(), NOW())`,
      [managerId, companyId, 'Sarah Manager', 'manager@acme.com', passwordHash]
    );
    console.log('Manager created');

    // Create employee
    const employeeId = uuidv4();
    await client.query(
      `INSERT INTO users (id, "companyId", name, email, "passwordHash", role, "managerId", "isManagerApprover", "mustChangePassword", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'EMPLOYEE', $6, false, false, NOW(), NOW())`,
      [employeeId, companyId, 'Johnny Employee', 'johnny@acme.com', passwordHash, managerId]
    );
    console.log('Employee created');

    console.log('\n✅ Seeding completed successfully!');
    console.log('Test Accounts:');
    console.log('- admin@acme.com / password123');
    console.log('- manager@acme.com / password123');
    console.log('- johnny@acme.com / password123');

  } catch (e) {
    console.error('Seed error:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
