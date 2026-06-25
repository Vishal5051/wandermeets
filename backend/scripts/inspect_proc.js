const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection('mysql://root:12345@localhost:3306/wandermeets');
    const [rows] = await conn.execute('SHOW CREATE PROCEDURE sp_get_nearby_activities');
    console.log(rows[0]['Create Procedure']);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
