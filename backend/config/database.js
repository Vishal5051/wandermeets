const mysql = require('mysql2/promise');
require('dotenv').config();

const url = require('url');

const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;

let pool;
if (connectionString) {
  try {
    const parsed = url.parse(connectionString);
    const auth = parsed.auth ? parsed.auth.split(':') : [];
    pool = mysql.createPool({
      host: parsed.hostname,
      port: parsed.port || 3306,
      database: parsed.pathname ? parsed.pathname.substring(1) : undefined,
      user: auth[0],
      password: auth[1],
      ssl: {
        rejectUnauthorized: false
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    });
  } catch (err) {
    console.error('Failed to parse database connection URI, falling back to direct string:', err.message);
    pool = mysql.createPool(connectionString);
  }
} else {
  pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'wandermeets',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    multipleStatements: true,
  });
}

// Helper: execute a stored procedure and return the result rows
// Usage: db.callProc('sp_name', [param1, param2])
const callProc = async (procedureName, params = []) => {
  const placeholders = params.map(() => '?').join(', ');
  const sql = `CALL ${procedureName}(${placeholders})`;
  const [results] = await pool.execute(sql, params);
  // MySQL returns an array of result sets; the first is the actual data
  if (Array.isArray(results) && Array.isArray(results[0])) {
    return results[0];
  }
  return results;
};

// Helper: run a raw query (for cases not covered by stored procedures)
const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = {
  pool,
  query,
  callProc,
};
