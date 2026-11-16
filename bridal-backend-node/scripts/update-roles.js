const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    // 1. Set kurupudisatyadevi2005@gmail.com to role 'user'
    await db.query("UPDATE users SET role = 'user' WHERE LOWER(email) = 'kurupudisatyadevi2005@gmail.com'");
    console.log('✅ kurupudisatyadevi2005@gmail.com set to role: user');

    // 2. Ensure dedicated admin account exists
    const res = await db.query("SELECT * FROM users WHERE LOWER(email) = 'admin@satyamakeovers.com'");
    if (res.rows.length === 0) {
      const hashed = await bcrypt.hash('admin@123', 10);
      await db.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
        ['admin@satyamakeovers.com', hashed, 'admin']
      );
      console.log('✅ Created dedicated admin: admin@satyamakeovers.com (password: admin@123)');
    } else {
      await db.query("UPDATE users SET role = 'admin' WHERE LOWER(email) = 'admin@satyamakeovers.com'");
      console.log('✅ admin@satyamakeovers.com role verified as admin');
    }

    const all = await db.query('SELECT id, email, role FROM users ORDER BY id');
    console.log('Current users:', all.rows);
  } catch (err) {
    console.error('Error updating roles:', err);
  } finally {
    process.exit(0);
  }
}

run();
