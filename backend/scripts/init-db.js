const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDatabase = async () => {
  const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;
  let rootConn;
  const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'wandermeets';

  if (connectionString) {
    try {
      const url = require('url');
      const parsed = url.parse(connectionString);
      const auth = parsed.auth ? parsed.auth.split(':') : [];
      rootConn = await mysql.createConnection({
        host: parsed.hostname,
        port: parsed.port || 3306,
        database: parsed.pathname ? parsed.pathname.substring(1) : undefined,
        user: auth[0],
        password: auth[1],
        ssl: {
          rejectUnauthorized: false
        },
        multipleStatements: true,
      });
      console.log(`📡 Connected to MySQL database via connection string with SSL.`);
    } catch (err) {
      console.error('Failed to connect via connection URI parsing, trying direct connection string:', err.message);
      let uri = connectionString;
      if (uri.includes('?')) {
        if (!uri.includes('multipleStatements=')) {
          uri += '&multipleStatements=true';
        }
      } else {
        uri += '?multipleStatements=true';
      }
      rootConn = await mysql.createConnection(uri);
    }
  } else {
    try {
      // Connect without database first to try to create it (local development)
      rootConn = await mysql.createConnection({
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        multipleStatements: true,
      });
      console.log(`📡 Connected to MySQL host. Creating database "${dbName}" if not exists...`);
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await rootConn.query(`USE \`${dbName}\``);
    } catch (err) {
      console.log(`⚠️  Could not connect without database: ${err.message}. Trying direct connection to "${dbName}"...`);
      rootConn = await mysql.createConnection({
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: dbName,
        multipleStatements: true,
      });
    }
  }

  try {
    console.log('🚀 Initializing WanderMeets MySQL Database...\n');

    // Run schema script
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await rootConn.query(schemaSql);
    console.log('✅ Schema created (all tables + sample data)');

    // Run procedures script
    const procPath = path.join(__dirname, '..', 'sql', 'procedures.sql');
    const procSql = fs.readFileSync(procPath, 'utf8');

    // Strip comments to ensure statement execution is clean and drop statements are not filtered out
    const procSqlCleaned = procSql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    // First, run any standalone statements (USE, DROP) outside DELIMITER blocks to clean up old procedures
    const outsideBlocks = procSqlCleaned.replace(/DELIMITER\s+\/\/[\s\S]*?DELIMITER\s+;/g, '').trim();
    if (outsideBlocks) {
      const stmts = outsideBlocks.split(';').map(s => s.trim()).filter(s => s.length > 5);
      for (const stmt of stmts) {
        try {
          await rootConn.query(stmt);
        } catch (err) {
          // ignore
        }
      }
    }

    // Extract procedure bodies between DELIMITER // ... DELIMITER ;
    // Each block contains CREATE PROCEDURE statements
    const regex = /DELIMITER\s+\/\/([\s\S]*?)DELIMITER\s+;/g;
    let match;
    let procCount = 0;

    while ((match = regex.exec(procSqlCleaned)) !== null) {
      const block = match[1].trim();
      // Split on // to get individual statements
      const statements = block.split(/\/\//).map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        try {
          await rootConn.query(stmt);
          if (stmt.toUpperCase().includes('CREATE PROCEDURE')) procCount++;
        } catch (err) {
          console.warn('⚠️  Warning:', err.message.substring(0, 100));
        }
      }
    }

    console.log(`✅ ${procCount} stored procedures created`);

    console.log('\n✨ Database initialization complete!\n');
    console.log('📊 Summary:');
    console.log('   - 10 tables created');
    console.log('   - 25+ stored procedures for CRUD operations');
    console.log('   - 3 sample users added');
    console.log('   - 3 sample activities in Rishikesh\n');
    console.log('🔐 Default login credentials:');
    console.log('   Email: sarah@example.com');
    console.log('   Password: password123\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await rootConn.end();
  }
};

initDatabase().catch(console.error);
