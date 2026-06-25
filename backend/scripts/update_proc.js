const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection('mysql://root:12345@localhost:3306/wandermeets');
    await conn.query("DROP PROCEDURE IF EXISTS sp_get_nearby_activities");
    await conn.query(`
      CREATE PROCEDURE sp_get_nearby_activities(
        IN p_lat DOUBLE,
        IN p_lng DOUBLE,
        IN p_radius_meters INT,
        IN p_user_id INT,
        IN p_gender_filter VARCHAR(20)
      )
      BEGIN
        SELECT 
          a.id, a.title, a.description, a.activity_type,
          a.longitude, a.latitude,
          a.location_name, a.start_time, a.end_time,
          a.capacity, a.current_attendees, a.gender_filter,
          a.created_at,
          u.id AS host_id, u.full_name AS host_name, u.username AS host_username,
          u.profile_photo AS host_photo, u.trust_score AS host_trust_score,
          u.verification_level AS host_verification,
          (SELECT COUNT(*) FROM activity_rsvps WHERE activity_id = a.id AND user_id = p_user_id) AS is_rsvped,
          (
            6371000 * ACOS(
              COS(RADIANS(p_lat)) * COS(RADIANS(a.latitude)) *
              COS(RADIANS(a.longitude) - RADIANS(p_lng)) +
              SIN(RADIANS(p_lat)) * SIN(RADIANS(a.latitude))
            )
          ) AS distance_meters
        FROM activities a
        JOIN users u ON a.host_id = u.id
        WHERE 
          a.is_active = 1
          AND a.start_time > NOW()
          AND a.start_time < DATE_ADD(NOW(), INTERVAL 7 DAY)
          AND (
            6371000 * ACOS(
              COS(RADIANS(p_lat)) * COS(RADIANS(a.latitude)) *
              COS(RADIANS(a.longitude) - RADIANS(p_lng)) +
              SIN(RADIANS(p_lat)) * SIN(RADIANS(a.latitude))
            )
          ) <= p_radius_meters
          AND (p_gender_filter IS NULL OR p_gender_filter = 'all' OR a.gender_filter = p_gender_filter OR a.gender_filter = 'all')
        ORDER BY a.start_time ASC
        LIMIT 100;
      END
    `);
    console.log("Stored procedure updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
