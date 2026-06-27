const mysql = require('mysql2/promise');
const url = require('url');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function inspectDb() {
  const connectionString = process.env.MYSQL_URL;
  if (!connectionString) {
    console.error('MYSQL_URL environment variable is missing.');
    return;
  }

  console.log('Connecting to:', connectionString.replace(/:[^:@\s]+@/, ':****@')); // mask password

  let connection;
  try {
    const parsed = url.parse(connectionString);
    const auth = parsed.auth ? parsed.auth.split(':') : [];
    connection = await mysql.createConnection({
      host: parsed.hostname,
      port: parsed.port || 3306,
      database: parsed.pathname ? parsed.pathname.substring(1) : undefined,
      user: auth[0],
      password: auth[1],
      ssl: {
        rejectUnauthorized: false
      }
    });
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    return;
  }

  try {
    console.log('--- Inspecting users table ---');
    const [users] = await connection.execute('SELECT id, email, username, full_name, role, created_at FROM users LIMIT 20');
    console.log(`Total users found (limit 20): ${users.length}`);
    console.table(users);
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await connection.end();
  }
}

inspectDb();
