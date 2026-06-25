-- =============================================
-- WanderMates Stored Procedures (MySQL)
-- CRUD Operations for all entities
-- =============================================

-- USE wandermates;

-- =============================================
-- AUTH / USER PROCEDURES
-- =============================================

-- Check if email or username already exists
DROP PROCEDURE IF EXISTS sp_check_user_exists;
DELIMITER //
CREATE PROCEDURE sp_check_user_exists(
  IN p_email VARCHAR(255),
  IN p_username VARCHAR(100)
)
BEGIN
  SELECT id FROM users WHERE email = p_email OR username = p_username LIMIT 1;
END //
DELIMITER ;

-- Register a new user
DROP PROCEDURE IF EXISTS sp_register_user;
DELIMITER //
CREATE PROCEDURE sp_register_user(
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_full_name VARCHAR(255),
  IN p_username VARCHAR(100),
  IN p_gender VARCHAR(20),
  IN p_date_of_birth DATE,
  IN p_role VARCHAR(20)
)
BEGIN
  INSERT INTO users (email, password_hash, full_name, username, gender, date_of_birth, role)
  VALUES (p_email, p_password_hash, p_full_name, p_username, p_gender, p_date_of_birth, IFNULL(p_role, 'traveler'));

  SELECT id, email, full_name, username, gender, trust_score, role, created_at
  FROM users WHERE id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Login: get user by email
DROP PROCEDURE IF EXISTS sp_get_user_by_email;
DELIMITER //
CREATE PROCEDURE sp_get_user_by_email(
  IN p_email VARCHAR(255)
)
BEGIN
  SELECT id, email, password_hash, full_name, username, gender,
         profile_photo, bio, trust_score, verification_level, is_verified, role
  FROM users WHERE email = p_email OR username = p_email LIMIT 1;
END //
DELIMITER ;

-- Update last active timestamp
DROP PROCEDURE IF EXISTS sp_update_last_active;
DELIMITER //
CREATE PROCEDURE sp_update_last_active(
  IN p_user_id INT
)
BEGIN
  UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = p_user_id;
END //
DELIMITER ;

-- Get current user profile
DROP PROCEDURE IF EXISTS sp_get_user_profile;
DELIMITER //
CREATE PROCEDURE sp_get_user_profile(
  IN p_user_id INT
)
BEGIN
  SELECT id, email, full_name, username, gender, date_of_birth,
         profile_photo, bio, home_location, languages, interests,
         trust_score, verification_level, is_verified,
         aadhaar_status, aadhaar_number_masked,
         phone_verified, email_verified, created_at,
         (SELECT COUNT(*) FROM activities WHERE host_id = p_user_id AND is_active = 1) AS hosted_count,
         (SELECT COUNT(*) FROM activity_rsvps WHERE user_id = p_user_id AND status = 'confirmed') AS joined_count,
         (SELECT COUNT(*) FROM user_reviews WHERE user_id = p_user_id) AS reviews_count,
         -- Simplified connections: unique hosts/travelers the user has interacted with
         (SELECT COUNT(DISTINCT interaction_partner) FROM (
            SELECT user_id AS interaction_partner FROM activity_rsvps WHERE activity_id IN (SELECT id FROM activities WHERE host_id = p_user_id)
            UNION
            SELECT host_id AS interaction_partner FROM activities WHERE id IN (SELECT activity_id FROM activity_rsvps WHERE user_id = p_user_id)
          ) AS interactions) AS connections_count
  FROM users WHERE id = p_user_id;
END //
DELIMITER ;

-- Get user by ID (public profile)
DROP PROCEDURE IF EXISTS sp_get_user_by_id;
DELIMITER //
CREATE PROCEDURE sp_get_user_by_id(
  IN p_user_id INT
)
BEGIN
  SELECT id, full_name, username, gender, profile_photo, bio, 
         home_location, languages, interests,
         phone_verified, email_verified,
         trust_score, verification_level, is_verified,
         aadhaar_status,
         (SELECT COUNT(*) FROM activities WHERE host_id = p_user_id AND is_active = 1) AS hosted_count,
         (SELECT COUNT(*) FROM user_reviews WHERE user_id = p_user_id) AS reviews_count,
         -- Interactions: unique users this person has met
         (SELECT COUNT(DISTINCT interaction_partner) FROM (
            SELECT user_id AS interaction_partner FROM activity_rsvps WHERE activity_id IN (SELECT id FROM activities WHERE host_id = p_user_id)
            UNION
            SELECT host_id AS interaction_partner FROM activities WHERE id IN (SELECT activity_id FROM activity_rsvps WHERE user_id = p_user_id)
          ) AS interactions) AS connections_count
  FROM users WHERE id = p_user_id;
END //
DELIMITER ;

-- Get user by username (public profile)
DROP PROCEDURE IF EXISTS sp_get_user_by_username;
DELIMITER //
CREATE PROCEDURE sp_get_user_by_username(
  IN p_username VARCHAR(100)
)
BEGIN
  SELECT id, full_name, username, gender, profile_photo, bio,
         home_location, languages, interests, trust_score,
         verification_level, is_verified, created_at
  FROM users WHERE username = p_username;
END //
DELIMITER ;

-- Update user profile
DROP PROCEDURE IF EXISTS sp_update_user_profile;
DELIMITER //
CREATE PROCEDURE sp_update_user_profile(
  IN p_user_id INT,
  IN p_full_name VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_phone_number VARCHAR(20),
  IN p_bio TEXT,
  IN p_profile_photo VARCHAR(500),
  IN p_home_location VARCHAR(255),
  IN p_languages JSON,
  IN p_interests JSON
)
BEGIN
  -- Unverify phone if it changed
  UPDATE users 
  SET phone_verified = 0 
  WHERE id = p_user_id AND p_phone_number IS NOT NULL AND phone_number != p_phone_number;

  -- Unverify email if it changed
  UPDATE users
  SET email_verified = 0
  WHERE id = p_user_id AND p_email IS NOT NULL AND email != p_email;

  UPDATE users
  SET
    full_name = COALESCE(p_full_name, full_name),
    email = COALESCE(p_email, email),
    phone_number = COALESCE(p_phone_number, phone_number),
    bio = COALESCE(p_bio, bio),
    profile_photo = COALESCE(p_profile_photo, profile_photo),
    home_location = COALESCE(p_home_location, home_location),
    languages = COALESCE(p_languages, languages),
    interests = COALESCE(p_interests, interests)
  WHERE id = p_user_id;

  SELECT id, full_name, email, username, phone_number, phone_verified, email_verified, bio, profile_photo,
         home_location, languages, interests, aadhaar_status, trust_score, verification_level
  FROM users WHERE id = p_user_id;
END //
DELIMITER ;

-- Update phone verification status
DROP PROCEDURE IF EXISTS sp_update_phone_status;
DELIMITER //
CREATE PROCEDURE sp_update_phone_status(
  IN p_user_id INT,
  IN p_status TINYINT(1)
)
BEGIN
  UPDATE users 
  SET phone_verified = p_status, 
      trust_score = LEAST(100, trust_score + 10) 
  WHERE id = p_user_id;
  
  SELECT id, phone_verified, trust_score FROM users WHERE id = p_user_id;
END //
DELIMITER ;

-- Submit Aadhaar for verification
DROP PROCEDURE IF EXISTS sp_submit_aadhaar_verification;
DELIMITER //
CREATE PROCEDURE sp_submit_aadhaar_verification(
  IN p_user_id INT,
  IN p_aadhaar_number_masked VARCHAR(20),
  IN p_aadhaar_photo_url VARCHAR(500),
  IN p_profile_photo_url VARCHAR(500)
)
BEGIN
  UPDATE users
  SET 
    aadhaar_number_masked = p_aadhaar_number_masked,
    aadhaar_photo_url = p_aadhaar_photo_url,
    profile_photo = COALESCE(p_profile_photo_url, profile_photo),
    aadhaar_status = 'pending'
  WHERE id = p_user_id;
  
  -- Increase trust score slightly for submitting
  UPDATE users SET trust_score = trust_score + 5 WHERE id = p_user_id AND trust_score < 95;
  
  SELECT 'Verification submitted successfully' AS message;
END //
DELIMITER ;

-- Manage Emergency Contacts
DROP PROCEDURE IF EXISTS sp_manage_emergency_contact;
DELIMITER //
CREATE PROCEDURE sp_manage_emergency_contact(
  IN p_action VARCHAR(20),
  IN p_user_id INT,
  IN p_contact_id INT,
  IN p_name VARCHAR(255),
  IN p_relationship VARCHAR(100),
  IN p_phone VARCHAR(20)
)
BEGIN
  IF p_action = 'ADD' THEN
    INSERT INTO user_emergency_contacts (user_id, name, relationship, phone_number)
    VALUES (p_user_id, p_name, p_relationship, p_phone);
  ELSEIF p_action = 'DELETE' THEN
    DELETE FROM user_emergency_contacts WHERE id = p_contact_id AND user_id = p_user_id;
  END IF;
  
  SELECT id, name, relationship, phone_number FROM user_emergency_contacts WHERE user_id = p_user_id;
END //
DELIMITER ;

-- Trigger SOS Alert
DROP PROCEDURE IF EXISTS sp_trigger_sos;
DELIMITER //
CREATE PROCEDURE sp_trigger_sos(
  IN p_user_id INT,
  IN p_lat DOUBLE,
  IN p_lng DOUBLE
)
BEGIN
  INSERT INTO user_sos_alerts (user_id, latitude, longitude)
  VALUES (p_user_id, p_lat, p_lng);
  
  SELECT 'SOS Alert Triggered' AS message, LAST_INSERT_ID() AS alert_id;
END //
DELIMITER ;

-- Add Review (User, Activity, Wave, or Listing)
DROP PROCEDURE IF EXISTS sp_add_user_review;
DELIMITER //
CREATE PROCEDURE sp_add_user_review(
  IN p_user_id INT,
  IN p_reviewer_id INT,
  IN p_entity_type VARCHAR(20),
  IN p_entity_id INT,
  IN p_entity_title VARCHAR(255),
  IN p_rating INT,
  IN p_comment TEXT
)
BEGIN
  INSERT INTO user_reviews (user_id, reviewer_id, entity_type, entity_id, entity_title, rating, comment)
  VALUES (p_user_id, p_reviewer_id, IFNULL(p_entity_type, 'user'), p_entity_id, p_entity_title, p_rating, p_comment);
    
  -- Recalculate trust score based on average rating across all reviews for this user
  UPDATE users u
  SET trust_score = (
    SELECT LEAST(100, 50 + (AVG(rating) * 10)) 
    FROM user_reviews 
    WHERE user_id = p_user_id
  )
  WHERE id = p_user_id;
  
  SELECT 'Review added successfully' AS message;
END //
DELIMITER ;

-- Add Report (Fraud, Safety, etc.)
DROP PROCEDURE IF EXISTS sp_add_report;
DELIMITER //
CREATE PROCEDURE sp_add_report(
  IN p_reporter_id INT,
  IN p_reported_user_id INT,
  IN p_entity_type VARCHAR(20),
  IN p_entity_id INT,
  IN p_reason VARCHAR(255),
  IN p_description TEXT
)
BEGIN
  INSERT INTO user_reports (reporter_id, reported_user_id, entity_type, entity_id, reason, description, status)
  VALUES (p_reporter_id, p_reported_user_id, IFNULL(p_entity_type, 'user'), p_entity_id, p_reason, p_description, 'pending');
  
  -- Sligthly penalize trust score for being reported (can be refined)
  UPDATE users SET trust_score = GREATEST(0, trust_score - 5) WHERE id = p_reported_user_id;
  
  SELECT 'Report submitted successfully' AS message;
END //
DELIMITER ;

-- =============================================
-- ACTIVITY PROCEDURES
-- =============================================

-- Get nearby activities (within radius using Haversine formula)
DROP PROCEDURE IF EXISTS sp_get_nearby_activities;
DELIMITER //
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
    u.aadhaar_status AS host_verification,
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
    AND a.start_time < DATE_ADD(NOW(), INTERVAL 24 HOUR)
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
END //
DELIMITER ;

-- Create new activity
DROP PROCEDURE IF EXISTS sp_create_activity;
DELIMITER //
CREATE PROCEDURE sp_create_activity(
  IN p_host_id INT,
  IN p_title VARCHAR(255),
  IN p_description TEXT,
  IN p_activity_type VARCHAR(100),
  IN p_latitude DOUBLE,
  IN p_longitude DOUBLE,
  IN p_location_name VARCHAR(255),
  IN p_start_time DATETIME,
  IN p_end_time DATETIME,
  IN p_capacity INT,
  IN p_gender_filter VARCHAR(20),
  IN p_min_age INT,
  IN p_max_age INT
)
BEGIN
  INSERT INTO activities (
    host_id, title, description, activity_type,
    latitude, longitude, location_name,
    start_time, end_time, capacity, gender_filter, min_age, max_age
  )
  VALUES (
    p_host_id, p_title, p_description, p_activity_type,
    p_latitude, p_longitude, p_location_name,
    p_start_time, p_end_time, COALESCE(p_capacity, 10),
    COALESCE(p_gender_filter, 'all'), p_min_age, p_max_age
  );

  SELECT id, title, activity_type, location_name, start_time, capacity, created_at
  FROM activities WHERE id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Get single activity by ID
DROP PROCEDURE IF EXISTS sp_get_activity_by_id;
DELIMITER //
CREATE PROCEDURE sp_get_activity_by_id(
  IN p_activity_id INT,
  IN p_user_id INT
)
BEGIN
  SELECT 
    a.id, a.title, a.description, a.activity_type,
    a.longitude, a.latitude,
    a.location_name, a.start_time, a.end_time,
    a.capacity, a.current_attendees, a.gender_filter,
    a.min_age, a.max_age, a.created_at,
    u.id AS host_id, u.full_name AS host_name, u.username AS host_username,
    u.profile_photo AS host_photo, u.bio AS host_bio,
    u.trust_score AS host_trust_score, u.aadhaar_status AS host_verification,
    -- Check if user is attendee or host
    @is_attendee := (SELECT COUNT(*) FROM activity_rsvps WHERE activity_id = a.id AND user_id = p_user_id AND status = 'confirmed'),
    @is_host := (a.host_id = p_user_id),
    
    CASE WHEN @is_attendee OR @is_host THEN u.phone_number ELSE NULL END AS host_phone,
    CASE WHEN @is_attendee OR @is_host THEN u.email ELSE NULL END AS host_email,
    
    (SELECT COUNT(*) FROM activity_rsvps WHERE activity_id = a.id AND user_id = p_user_id) AS is_rsvped
  FROM activities a
  JOIN users u ON a.host_id = u.id
  WHERE a.id = p_activity_id;
END //
DELIMITER ;

-- Get activity attendees
DROP PROCEDURE IF EXISTS sp_get_activity_attendees;
DELIMITER //
CREATE PROCEDURE sp_get_activity_attendees(
  IN p_activity_id INT
)
BEGIN
  SELECT u.id, u.full_name, u.username, u.profile_photo,
         u.trust_score, u.verification_level
  FROM activity_rsvps ar
  JOIN users u ON ar.user_id = u.id
  WHERE ar.activity_id = p_activity_id AND ar.status = 'confirmed';
END //
DELIMITER ;

-- RSVP to activity
DROP PROCEDURE IF EXISTS sp_rsvp_activity;
DELIMITER //
CREATE PROCEDURE sp_rsvp_activity(
  IN p_activity_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE v_capacity INT;
  DECLARE v_current INT;
  DECLARE v_host_id INT;
  DECLARE v_existing INT;

  -- Get activity info
  SELECT capacity, current_attendees, host_id
  INTO v_capacity, v_current, v_host_id
  FROM activities WHERE id = p_activity_id AND is_active = 1;

  IF v_capacity IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Activity not found';
  END IF;

  IF v_host_id = p_user_id THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Cannot RSVP to your own activity';
  END IF;

  IF v_current >= v_capacity THEN
    SIGNAL SQLSTATE '45002' SET MESSAGE_TEXT = 'Activity is full';
  END IF;

  -- Check existing RSVP
  SELECT COUNT(*) INTO v_existing
  FROM activity_rsvps WHERE activity_id = p_activity_id AND user_id = p_user_id;

  IF v_existing > 0 THEN
    SIGNAL SQLSTATE '45003' SET MESSAGE_TEXT = 'Already RSVPed to this activity';
  END IF;

  -- Create RSVP and update count
  INSERT INTO activity_rsvps (activity_id, user_id, status) VALUES (p_activity_id, p_user_id, 'confirmed');
  UPDATE activities SET current_attendees = current_attendees + 1 WHERE id = p_activity_id;

  SELECT 'Successfully RSVPed to activity' AS message;
END //
DELIMITER ;

-- Cancel RSVP
DROP PROCEDURE IF EXISTS sp_cancel_rsvp;
DELIMITER //
CREATE PROCEDURE sp_cancel_rsvp(
  IN p_activity_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE v_deleted INT;

  DELETE FROM activity_rsvps WHERE activity_id = p_activity_id AND user_id = p_user_id;
  SET v_deleted = ROW_COUNT();

  IF v_deleted = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RSVP not found';
  END IF;

  UPDATE activities SET current_attendees = GREATEST(current_attendees - 1, 0) WHERE id = p_activity_id;

  SELECT 'RSVP cancelled successfully' AS message;
END //
DELIMITER ;

-- Delete activity (host only)
DROP PROCEDURE IF EXISTS sp_delete_activity;
DELIMITER //
CREATE PROCEDURE sp_delete_activity(
  IN p_activity_id INT,
  IN p_host_id INT
)
BEGIN
  DECLARE v_deleted INT;

  DELETE FROM activities WHERE id = p_activity_id AND host_id = p_host_id;
  SET v_deleted = ROW_COUNT();

  IF v_deleted = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Activity not found or unauthorized';
  END IF;

  SELECT 'Activity deleted successfully' AS message;
END //
DELIMITER ;

-- Get user's hosted activities
DROP PROCEDURE IF EXISTS sp_get_user_hosted_activities;
DELIMITER //
CREATE PROCEDURE sp_get_user_hosted_activities(
  IN p_user_id INT
)
BEGIN
  SELECT id, title, activity_type, location_name, start_time,
         capacity, current_attendees, created_at, longitude, latitude
  FROM activities
  WHERE host_id = p_user_id AND is_active = 1
  ORDER BY start_time DESC;
END //
DELIMITER ;

-- Get user's RSVPed activities
DROP PROCEDURE IF EXISTS sp_get_user_rsvped_activities;
DELIMITER //
CREATE PROCEDURE sp_get_user_rsvped_activities(
  IN p_user_id INT
)
BEGIN
  SELECT a.id, a.title, a.activity_type, a.location_name, a.start_time,
         a.capacity, a.current_attendees, a.longitude, a.latitude,
         u.full_name AS host_name, u.username AS host_username,
         ar.created_at AS rsvp_date
  FROM activity_rsvps ar
  JOIN activities a ON ar.activity_id = a.id
  JOIN users u ON a.host_id = u.id
  WHERE ar.user_id = p_user_id AND a.is_active = 1
  ORDER BY a.start_time DESC;
END //
DELIMITER ;

-- Get upcoming activities for a user (public profile)
DROP PROCEDURE IF EXISTS sp_get_user_upcoming_activities;
DELIMITER //
CREATE PROCEDURE sp_get_user_upcoming_activities(
  IN p_user_id INT
)
BEGIN
  SELECT id, title, activity_type, location_name, start_time,
         capacity, current_attendees
  FROM activities
  WHERE host_id = p_user_id AND is_active = 1 AND start_time > NOW()
  ORDER BY start_time ASC
  LIMIT 5;
END //
DELIMITER ;

-- =============================================
-- PRIVATE PIN PROCEDURES
-- =============================================

-- Get user's private pins
DROP PROCEDURE IF EXISTS sp_get_user_pins;
DELIMITER //
CREATE PROCEDURE sp_get_user_pins(
  IN p_user_id INT,
  IN p_lat DOUBLE,
  IN p_lng DOUBLE,
  IN p_radius_meters INT
)
BEGIN
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL AND p_radius_meters IS NOT NULL THEN
    SELECT 
      id, longitude, latitude, location_name, title, note,
      photos, voice_note_url, mood_emoji, visit_date, created_at
    FROM private_pins
    WHERE user_id = p_user_id
      AND (
        6371000 * ACOS(
          COS(RADIANS(p_lat)) * COS(RADIANS(latitude)) *
          COS(RADIANS(longitude) - RADIANS(p_lng)) +
          SIN(RADIANS(p_lat)) * SIN(RADIANS(latitude))
        )
      ) <= p_radius_meters
    ORDER BY visit_date DESC;
  ELSE
    SELECT 
      id, longitude, latitude, location_name, title, note,
      photos, voice_note_url, mood_emoji, visit_date, created_at
    FROM private_pins
    WHERE user_id = p_user_id
    ORDER BY visit_date DESC;
  END IF;
END //
DELIMITER ;

-- Create private pin
DROP PROCEDURE IF EXISTS sp_create_pin;
DELIMITER //
CREATE PROCEDURE sp_create_pin(
  IN p_user_id INT,
  IN p_latitude DOUBLE,
  IN p_longitude DOUBLE,
  IN p_location_name VARCHAR(255),
  IN p_title VARCHAR(255),
  IN p_note TEXT,
  IN p_photos JSON,
  IN p_voice_note_url VARCHAR(500),
  IN p_mood_emoji VARCHAR(10),
  IN p_visit_date DATETIME
)
BEGIN
  INSERT INTO private_pins (
    user_id, latitude, longitude, location_name, title,
    note, photos, voice_note_url, mood_emoji, visit_date
  )
  VALUES (
    p_user_id, p_latitude, p_longitude, p_location_name, p_title,
    p_note, p_photos, p_voice_note_url, p_mood_emoji, p_visit_date
  );

  SELECT id, location_name, title, visit_date, created_at
  FROM private_pins WHERE id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Get single pin
DROP PROCEDURE IF EXISTS sp_get_pin_by_id;
DELIMITER //
CREATE PROCEDURE sp_get_pin_by_id(
  IN p_pin_id INT,
  IN p_user_id INT
)
BEGIN
  SELECT id, longitude, latitude, location_name, title, note,
         photos, voice_note_url, mood_emoji, visit_date,
         created_at, updated_at
  FROM private_pins
  WHERE id = p_pin_id AND user_id = p_user_id;
END //
DELIMITER ;

-- Update private pin
DROP PROCEDURE IF EXISTS sp_update_pin;
DELIMITER //
CREATE PROCEDURE sp_update_pin(
  IN p_pin_id INT,
  IN p_user_id INT,
  IN p_location_name VARCHAR(255),
  IN p_title VARCHAR(255),
  IN p_note TEXT,
  IN p_photos JSON,
  IN p_voice_note_url VARCHAR(500),
  IN p_mood_emoji VARCHAR(10)
)
BEGIN
  DECLARE v_count INT;

  UPDATE private_pins
  SET
    location_name = COALESCE(p_location_name, location_name),
    title = COALESCE(p_title, title),
    note = COALESCE(p_note, note),
    photos = COALESCE(p_photos, photos),
    voice_note_url = COALESCE(p_voice_note_url, voice_note_url),
    mood_emoji = COALESCE(p_mood_emoji, mood_emoji)
  WHERE id = p_pin_id AND user_id = p_user_id;

  SET v_count = ROW_COUNT();

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pin not found';
  END IF;

  SELECT id, location_name, title, note, updated_at
  FROM private_pins WHERE id = p_pin_id;
END //
DELIMITER ;

-- Delete private pin
DROP PROCEDURE IF EXISTS sp_delete_pin;
DELIMITER //
CREATE PROCEDURE sp_delete_pin(
  IN p_pin_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE v_count INT;

  DELETE FROM private_pins WHERE id = p_pin_id AND user_id = p_user_id;
  SET v_count = ROW_COUNT();

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pin not found';
  END IF;

  SELECT 'Pin deleted successfully' AS message;
END //
DELIMITER ;

-- =============================================
-- RECOMMENDATION PROCEDURES
-- =============================================

-- Get nearby recommendations
DROP PROCEDURE IF EXISTS sp_get_nearby_recommendations;
DELIMITER //
CREATE PROCEDURE sp_get_nearby_recommendations(
  IN p_lat DOUBLE,
  IN p_lng DOUBLE,
  IN p_radius_meters INT,
  IN p_category VARCHAR(100)
)
BEGIN
  SELECT 
    id, longitude, latitude, location_name, category,
    pin_count, aggregate_rating, is_verified,
    last_pinned_at, created_at
  FROM recommendations
  WHERE 
    is_verified = 1
    AND (
      6371000 * ACOS(
        COS(RADIANS(p_lat)) * COS(RADIANS(latitude)) *
        COS(RADIANS(longitude) - RADIANS(p_lng)) +
        SIN(RADIANS(p_lat)) * SIN(RADIANS(latitude))
      )
    ) <= p_radius_meters
    AND (p_category IS NULL OR category = p_category)
  ORDER BY pin_count DESC, last_pinned_at DESC
  LIMIT 50;
END //
DELIMITER ;

-- Get single recommendation
DROP PROCEDURE IF EXISTS sp_get_recommendation_by_id;
DELIMITER //
CREATE PROCEDURE sp_get_recommendation_by_id(
  IN p_recommendation_id INT
)
BEGIN
  SELECT id, longitude, latitude, location_name, category,
         pin_count, aggregate_rating, is_verified,
         last_pinned_at, created_at
  FROM recommendations WHERE id = p_recommendation_id;
END //
DELIMITER ;

-- Update recommendations (auto-promote from pins)
DROP PROCEDURE IF EXISTS sp_update_recommendations;
DELIMITER //
CREATE PROCEDURE sp_update_recommendations(
  IN p_longitude DOUBLE,
  IN p_latitude DOUBLE,
  IN p_location_name VARCHAR(255)
)
BEGIN
  DECLARE v_unique_users INT;
  DECLARE v_rec_id INT;

  -- Count unique users who pinned within 50m of this location
  SELECT COUNT(DISTINCT user_id) INTO v_unique_users
  FROM private_pins
  WHERE (
    6371000 * ACOS(
      COS(RADIANS(p_latitude)) * COS(RADIANS(latitude)) *
      COS(RADIANS(longitude) - RADIANS(p_longitude)) +
      SIN(RADIANS(p_latitude)) * SIN(RADIANS(latitude))
    )
  ) <= 50
  AND location_name LIKE CONCAT('%', p_location_name, '%');

  -- If 3+ unique users pinned here, create or update recommendation
  IF v_unique_users >= 3 THEN
    SELECT id INTO v_rec_id FROM recommendations
    WHERE (
      6371000 * ACOS(
        COS(RADIANS(p_latitude)) * COS(RADIANS(latitude)) *
        COS(RADIANS(longitude) - RADIANS(p_longitude)) +
        SIN(RADIANS(p_latitude)) * SIN(RADIANS(latitude))
      )
    ) <= 50
    LIMIT 1;

    IF v_rec_id IS NOT NULL THEN
      UPDATE recommendations
      SET pin_count = v_unique_users, is_verified = 1, last_pinned_at = NOW()
      WHERE id = v_rec_id;
    ELSE
      INSERT INTO recommendations (latitude, longitude, location_name, category, pin_count, is_verified, last_pinned_at)
      VALUES (p_latitude, p_longitude, p_location_name, 'General', v_unique_users, 1, NOW());
    END IF;
  END IF;
END //
DELIMITER ;

-- =============================================
-- MARKETPLACE PROCEDURES
-- =============================================

-- Get marketplace listings (with optional category filter)
DROP PROCEDURE IF EXISTS sp_get_marketplace_listings;
DELIMITER //
CREATE PROCEDURE sp_get_marketplace_listings(
  IN p_category VARCHAR(100),
  IN p_latitude DOUBLE,
  IN p_longitude DOUBLE,
  IN p_radius INT
)
BEGIN
  SELECT id, vendor_id, created_by, title, description, category, price,
         latitude, longitude, location_name, vendor_name, duration,
         image_url, rating, is_active, created_at
  FROM marketplace_listings
  WHERE is_active = 1
    AND (p_category IS NULL OR category = p_category)
    AND (p_latitude IS NULL OR p_longitude IS NULL OR p_radius IS NULL OR
      (
        6371000 * ACOS(
          COS(RADIANS(p_latitude)) * COS(RADIANS(latitude)) *
          COS(RADIANS(longitude) - RADIANS(p_longitude)) +
          SIN(RADIANS(p_latitude)) * SIN(RADIANS(latitude))
        )
      ) <= p_radius
    )
  ORDER BY rating DESC, created_at DESC;
END //
DELIMITER ;

-- Get listing by ID
DROP PROCEDURE IF EXISTS sp_get_listing_by_id;
DELIMITER //
CREATE PROCEDURE sp_get_listing_by_id(
  IN p_id INT
)
BEGIN
  SELECT ml.*, mv.vendor_name AS verified_vendor_name, mv.is_verified AS vendor_verified
  FROM marketplace_listings ml
  LEFT JOIN marketplace_vendors mv ON ml.vendor_id = mv.id
  WHERE ml.id = p_id;
END //
DELIMITER ;

-- Get vendor by ID
DROP PROCEDURE IF EXISTS sp_get_vendor_by_id;
DELIMITER //
CREATE PROCEDURE sp_get_vendor_by_id(
  IN p_id INT
)
BEGIN
  SELECT * FROM marketplace_vendors WHERE id = p_id;
END //
DELIMITER ;

-- Get vendor listings
DROP PROCEDURE IF EXISTS sp_get_vendor_listings;
DELIMITER //
CREATE PROCEDURE sp_get_vendor_listings(
  IN p_vendor_id INT
)
BEGIN
  SELECT * FROM marketplace_listings
  WHERE vendor_id = p_vendor_id AND is_active = 1
  ORDER BY created_at DESC;
END //
DELIMITER ;

-- Create a marketplace listing
DROP PROCEDURE IF EXISTS sp_create_marketplace_listing;
DELIMITER //
CREATE PROCEDURE sp_create_marketplace_listing(
  IN p_created_by INT,
  IN p_title VARCHAR(255),
  IN p_description TEXT,
  IN p_category VARCHAR(100),
  IN p_price DECIMAL(10,2),
  IN p_latitude DOUBLE,
  IN p_longitude DOUBLE,
  IN p_location_name VARCHAR(255),
  IN p_vendor_name VARCHAR(255),
  IN p_duration VARCHAR(100),
  IN p_contact_phone VARCHAR(20),
  IN p_contact_email VARCHAR(255),
  IN p_image_url VARCHAR(500)
)
BEGIN
  INSERT INTO marketplace_listings (created_by, title, description, category, price,
    latitude, longitude, location_name, vendor_name, duration,
    contact_phone, contact_email, image_url)
  VALUES (p_created_by, p_title, p_description, p_category, p_price,
    p_latitude, p_longitude, p_location_name, p_vendor_name, p_duration,
    p_contact_phone, p_contact_email, p_image_url);

  SELECT * FROM marketplace_listings WHERE id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Delete a marketplace listing
DROP PROCEDURE IF EXISTS sp_delete_marketplace_listing;
DELIMITER //
CREATE PROCEDURE sp_delete_marketplace_listing(
  IN p_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count FROM marketplace_listings WHERE id = p_id AND created_by = p_user_id;

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Listing not found or unauthorized';
  END IF;

  DELETE FROM marketplace_listings WHERE id = p_id AND created_by = p_user_id;
END //
DELIMITER ;

-- Get vendor's own listings
DROP PROCEDURE IF EXISTS sp_get_my_marketplace_listings;
DELIMITER //
CREATE PROCEDURE sp_get_my_marketplace_listings(
  IN p_user_id INT
)
BEGIN
  SELECT * FROM marketplace_listings
  WHERE created_by = p_user_id
  ORDER BY created_at DESC;
END //
DELIMITER ;

-- Update a marketplace listing
DROP PROCEDURE IF EXISTS sp_update_marketplace_listing;
DELIMITER //
CREATE PROCEDURE sp_update_marketplace_listing(
  IN p_id INT,
  IN p_user_id INT,
  IN p_title VARCHAR(255),
  IN p_description TEXT,
  IN p_category VARCHAR(100),
  IN p_price DECIMAL(10,2),
  IN p_latitude DOUBLE,
  IN p_longitude DOUBLE,
  IN p_location_name VARCHAR(255),
  IN p_vendor_name VARCHAR(255),
  IN p_duration VARCHAR(100),
  IN p_contact_phone VARCHAR(20),
  IN p_contact_email VARCHAR(255),
  IN p_image_url VARCHAR(500)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count FROM marketplace_listings WHERE id = p_id AND created_by = p_user_id;

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Listing not found or unauthorized';
  END IF;

  UPDATE marketplace_listings SET
    title = IFNULL(p_title, title),
    description = IFNULL(p_description, description),
    category = IFNULL(p_category, category),
    price = IFNULL(p_price, price),
    latitude = IFNULL(p_latitude, latitude),
    longitude = IFNULL(p_longitude, longitude),
    location_name = IFNULL(p_location_name, location_name),
    vendor_name = IFNULL(p_vendor_name, vendor_name),
    duration = IFNULL(p_duration, duration),
    contact_phone = IFNULL(p_contact_phone, contact_phone),
    contact_email = IFNULL(p_contact_email, contact_email),
    image_url = IFNULL(p_image_url, image_url)
  WHERE id = p_id AND created_by = p_user_id;

  SELECT * FROM marketplace_listings WHERE id = p_id;
END //
DELIMITER ;

-- =============================================
-- BOOKING PROCEDURES
-- =============================================

-- Create a booking
DROP PROCEDURE IF EXISTS sp_create_booking;
DELIMITER //
CREATE PROCEDURE sp_create_booking(
  IN p_listing_id INT,
  IN p_user_id INT,
  IN p_quantity INT,
  IN p_total_price DECIMAL(10,2),
  IN p_booking_date DATE,
  IN p_notes TEXT
)
BEGIN
  INSERT INTO marketplace_bookings (listing_id, user_id, quantity, total_price, booking_date, notes)
  VALUES (p_listing_id, p_user_id, p_quantity, p_total_price, p_booking_date, p_notes);

  SELECT b.*, ml.title AS listing_title, ml.category, ml.vendor_name, ml.location_name
  FROM marketplace_bookings b
  JOIN marketplace_listings ml ON ml.id = b.listing_id
  WHERE b.id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Get bookings for a user (traveler)
DROP PROCEDURE IF EXISTS sp_get_user_bookings;
DELIMITER //
CREATE PROCEDURE sp_get_user_bookings(
  IN p_user_id INT
)
BEGIN
  SELECT b.*, ml.title AS listing_title, ml.category, ml.vendor_name, ml.location_name, ml.duration, ml.price AS unit_price
  FROM marketplace_bookings b
  JOIN marketplace_listings ml ON ml.id = b.listing_id
  WHERE b.user_id = p_user_id
  ORDER BY b.created_at DESC;
END //
DELIMITER ;

-- Get bookings for a vendor (all bookings on their listings)
DROP PROCEDURE IF EXISTS sp_get_vendor_bookings;
DELIMITER //
CREATE PROCEDURE sp_get_vendor_bookings(
  IN p_vendor_user_id INT
)
BEGIN
  SELECT b.*, ml.title AS listing_title, ml.category, ml.vendor_name, ml.location_name,
         u.full_name AS booker_name, u.email AS booker_email
  FROM marketplace_bookings b
  JOIN marketplace_listings ml ON ml.id = b.listing_id
  JOIN users u ON u.id = b.user_id
  WHERE ml.created_by = p_vendor_user_id
  ORDER BY b.created_at DESC;
END //
DELIMITER ;

-- Update booking status (vendor confirms/cancels)
DROP PROCEDURE IF EXISTS sp_update_booking_status;
DELIMITER //
CREATE PROCEDURE sp_update_booking_status(
  IN p_booking_id INT,
  IN p_vendor_user_id INT,
  IN p_status VARCHAR(30)
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count
  FROM marketplace_bookings b
  JOIN marketplace_listings ml ON ml.id = b.listing_id
  WHERE b.id = p_booking_id AND ml.created_by = p_vendor_user_id;

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found or unauthorized';
  END IF;

  UPDATE marketplace_bookings SET status = p_status WHERE id = p_booking_id;

  SELECT b.*, ml.title AS listing_title, ml.category, ml.vendor_name,
         u.full_name AS booker_name
  FROM marketplace_bookings b
  JOIN marketplace_listings ml ON ml.id = b.listing_id
  JOIN users u ON u.id = b.user_id
  WHERE b.id = p_booking_id;
END //
DELIMITER ;

-- Cancel booking (by the user who booked)
DROP PROCEDURE IF EXISTS sp_cancel_booking;
DELIMITER //
CREATE PROCEDURE sp_cancel_booking(
  IN p_booking_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count FROM marketplace_bookings WHERE id = p_booking_id AND user_id = p_user_id;

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found or unauthorized';
  END IF;

  UPDATE marketplace_bookings SET status = 'cancelled' WHERE id = p_booking_id AND user_id = p_user_id;

  SELECT * FROM marketplace_bookings WHERE id = p_booking_id;
END //
DELIMITER ;

-- =============================================
-- TRAVEL PACKAGE PROCEDURES
-- =============================================

-- Get or create travel provider for a user
DROP PROCEDURE IF EXISTS sp_get_or_create_provider;
DELIMITER //
CREATE PROCEDURE sp_get_or_create_provider(
  IN p_user_id INT
)
BEGIN
  DECLARE v_provider_id INT;
  SELECT id INTO v_provider_id FROM travel_providers WHERE user_id = p_user_id LIMIT 1;
  IF v_provider_id IS NULL THEN
    INSERT INTO travel_providers (user_id, company_name, contact_email)
    SELECT id, full_name, email FROM users WHERE id = p_user_id;
    SET v_provider_id = LAST_INSERT_ID();
  END IF;
  SELECT * FROM travel_providers WHERE id = v_provider_id;
END //
DELIMITER ;

-- Update provider profile
DROP PROCEDURE IF EXISTS sp_update_provider;
DELIMITER //
CREATE PROCEDURE sp_update_provider(
  IN p_user_id INT,
  IN p_company_name VARCHAR(255),
  IN p_description TEXT,
  IN p_contact_phone VARCHAR(20),
  IN p_contact_email VARCHAR(255),
  IN p_website VARCHAR(500),
  IN p_latitude DOUBLE,
  IN p_longitude DOUBLE,
  IN p_location_name VARCHAR(255)
)
BEGIN
  UPDATE travel_providers SET
    company_name = IFNULL(p_company_name, company_name),
    description = IFNULL(p_description, description),
    contact_phone = IFNULL(p_contact_phone, contact_phone),
    contact_email = IFNULL(p_contact_email, contact_email),
    website = IFNULL(p_website, website),
    latitude = IFNULL(p_latitude, latitude),
    longitude = IFNULL(p_longitude, longitude),
    location_name = IFNULL(p_location_name, location_name)
  WHERE user_id = p_user_id;
  SELECT * FROM travel_providers WHERE user_id = p_user_id;
END //
DELIMITER ;

-- Get all packages (with optional filters)
DROP PROCEDURE IF EXISTS sp_get_travel_packages;
DELIMITER //
CREATE PROCEDURE sp_get_travel_packages(
  IN p_category VARCHAR(100),
  IN p_travel_date DATE,
  IN p_latitude DOUBLE,
  IN p_longitude DOUBLE,
  IN p_radius_meters INT
)
BEGIN
  SELECT tp.*, tprov.company_name AS provider_name, tprov.is_verified AS provider_verified,
         tprov.rating AS provider_rating, tprov.location_name AS provider_location
  FROM travel_packages tp
  JOIN travel_providers tprov ON tp.provider_id = tprov.id
  WHERE tp.is_active = 1
    AND (p_category IS NULL OR tp.category = p_category)
    AND (p_travel_date IS NULL OR (p_travel_date BETWEEN tp.available_from AND tp.available_to))
    AND (p_latitude IS NULL OR p_longitude IS NULL OR p_radius_meters IS NULL OR
      (
        6371000 * ACOS(
          COS(RADIANS(p_latitude)) * COS(RADIANS(tp.destination_latitude)) *
          COS(RADIANS(tp.destination_longitude) - RADIANS(p_longitude)) +
          SIN(RADIANS(p_latitude)) * SIN(RADIANS(tp.destination_latitude))
        )
      ) <= p_radius_meters
    )
  ORDER BY tp.rating DESC, tp.total_bookings DESC;
END //
DELIMITER ;

-- Get single package by ID
DROP PROCEDURE IF EXISTS sp_get_package_by_id;
DELIMITER //
CREATE PROCEDURE sp_get_package_by_id(
  IN p_id INT
)
BEGIN
  SELECT tp.*, tprov.company_name AS provider_name, tprov.is_verified AS provider_verified,
         tprov.rating AS provider_rating, tprov.contact_phone AS provider_phone,
         tprov.contact_email AS provider_email, tprov.website AS provider_website,
         tprov.location_name AS provider_location
  FROM travel_packages tp
  JOIN travel_providers tprov ON tp.provider_id = tprov.id
  WHERE tp.id = p_id;
END //
DELIMITER ;

-- Create a travel package
DROP PROCEDURE IF EXISTS sp_create_travel_package;
DELIMITER //
CREATE PROCEDURE sp_create_travel_package(
  IN p_user_id INT,
  IN p_title VARCHAR(255),
  IN p_description TEXT,
  IN p_destination VARCHAR(255),
  IN p_destination_latitude DOUBLE,
  IN p_destination_longitude DOUBLE,
  IN p_duration_days INT,
  IN p_price DECIMAL(10,2),
  IN p_max_travelers INT,
  IN p_includes JSON,
  IN p_itinerary JSON,
  IN p_available_from DATE,
  IN p_available_to DATE,
  IN p_departure_dates JSON,
  IN p_category VARCHAR(100),
  IN p_image_url VARCHAR(500)
)
BEGIN
  DECLARE v_provider_id INT;
  SELECT id INTO v_provider_id FROM travel_providers WHERE user_id = p_user_id LIMIT 1;
  IF v_provider_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Provider profile not found';
  END IF;

  INSERT INTO travel_packages (provider_id, title, description, destination,
    destination_latitude, destination_longitude, duration_days, price,
    max_travelers, includes, itinerary, available_from, available_to,
    departure_dates, category, image_url)
  VALUES (v_provider_id, p_title, p_description, p_destination,
    p_destination_latitude, p_destination_longitude, p_duration_days, p_price,
    IFNULL(p_max_travelers, 20), p_includes, p_itinerary, p_available_from, p_available_to,
    p_departure_dates, IFNULL(p_category, 'Adventure'), p_image_url);

  SELECT tp.*, tprov.company_name AS provider_name
  FROM travel_packages tp
  JOIN travel_providers tprov ON tp.provider_id = tprov.id
  WHERE tp.id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Update a travel package
DROP PROCEDURE IF EXISTS sp_update_travel_package;
DELIMITER //
CREATE PROCEDURE sp_update_travel_package(
  IN p_id INT,
  IN p_user_id INT,
  IN p_title VARCHAR(255),
  IN p_description TEXT,
  IN p_destination VARCHAR(255),
  IN p_destination_latitude DOUBLE,
  IN p_destination_longitude DOUBLE,
  IN p_duration_days INT,
  IN p_price DECIMAL(10,2),
  IN p_max_travelers INT,
  IN p_includes JSON,
  IN p_itinerary JSON,
  IN p_available_from DATE,
  IN p_available_to DATE,
  IN p_departure_dates JSON,
  IN p_category VARCHAR(100),
  IN p_image_url VARCHAR(500)
)
BEGIN
  DECLARE v_provider_id INT;
  SELECT id INTO v_provider_id FROM travel_providers WHERE user_id = p_user_id LIMIT 1;

  UPDATE travel_packages SET
    title = IFNULL(p_title, title),
    description = IFNULL(p_description, description),
    destination = IFNULL(p_destination, destination),
    destination_latitude = IFNULL(p_destination_latitude, destination_latitude),
    destination_longitude = IFNULL(p_destination_longitude, destination_longitude),
    duration_days = IFNULL(p_duration_days, duration_days),
    price = IFNULL(p_price, price),
    max_travelers = IFNULL(p_max_travelers, max_travelers),
    includes = IFNULL(p_includes, includes),
    itinerary = IFNULL(p_itinerary, itinerary),
    available_from = IFNULL(p_available_from, available_from),
    available_to = IFNULL(p_available_to, available_to),
    departure_dates = IFNULL(p_departure_dates, departure_dates),
    category = IFNULL(p_category, category),
    image_url = IFNULL(p_image_url, image_url)
  WHERE id = p_id AND provider_id = v_provider_id;

  SELECT * FROM travel_packages WHERE id = p_id;
END //
DELIMITER ;

-- Delete a travel package
DROP PROCEDURE IF EXISTS sp_delete_travel_package;
DELIMITER //
CREATE PROCEDURE sp_delete_travel_package(
  IN p_id INT,
  IN p_user_id INT
)
BEGIN
  DECLARE v_provider_id INT;
  SELECT id INTO v_provider_id FROM travel_providers WHERE user_id = p_user_id LIMIT 1;
  DELETE FROM travel_packages WHERE id = p_id AND provider_id = v_provider_id;
  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Package not found or unauthorized';
  END IF;
  SELECT 'Package deleted' AS message;
END //
DELIMITER ;

-- Get provider's own packages
DROP PROCEDURE IF EXISTS sp_get_provider_packages;
DELIMITER //
CREATE PROCEDURE sp_get_provider_packages(
  IN p_user_id INT
)
BEGIN
  DECLARE v_provider_id INT;
  SELECT id INTO v_provider_id FROM travel_providers WHERE user_id = p_user_id LIMIT 1;
  SELECT tp.*, tprov.company_name AS provider_name
  FROM travel_packages tp
  JOIN travel_providers tprov ON tp.provider_id = tprov.id
  WHERE tp.provider_id = v_provider_id
  ORDER BY tp.created_at DESC;
END //
DELIMITER ;

-- Book a travel package
DROP PROCEDURE IF EXISTS sp_book_travel_package;
DELIMITER //
CREATE PROCEDURE sp_book_travel_package(
  IN p_package_id INT,
  IN p_user_id INT,
  IN p_travelers INT,
  IN p_travel_date DATE,
  IN p_total_price DECIMAL(10,2),
  IN p_notes TEXT
)
BEGIN
  INSERT INTO travel_package_bookings (package_id, user_id, travelers, travel_date, total_price, notes)
  VALUES (p_package_id, p_user_id, p_travelers, p_travel_date, p_total_price, p_notes);

  UPDATE travel_packages SET total_bookings = total_bookings + 1 WHERE id = p_package_id;

  SELECT b.*, tp.title AS package_title, tp.destination, tprov.company_name AS provider_name
  FROM travel_package_bookings b
  JOIN travel_packages tp ON tp.id = b.package_id
  JOIN travel_providers tprov ON tprov.id = tp.provider_id
  WHERE b.id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Get user's package bookings
DROP PROCEDURE IF EXISTS sp_get_user_package_bookings;
DELIMITER //
CREATE PROCEDURE sp_get_user_package_bookings(
  IN p_user_id INT
)
BEGIN
  SELECT b.*, tp.title AS package_title, tp.destination, tp.duration_days, tp.price AS unit_price,
         tprov.company_name AS provider_name
  FROM travel_package_bookings b
  JOIN travel_packages tp ON tp.id = b.package_id
  JOIN travel_providers tprov ON tprov.id = tp.provider_id
  WHERE b.user_id = p_user_id
  ORDER BY b.created_at DESC;
END //
DELIMITER ;

-- Get provider's package bookings
DROP PROCEDURE IF EXISTS sp_get_provider_package_bookings;
DELIMITER //
CREATE PROCEDURE sp_get_provider_package_bookings(
  IN p_user_id INT
)
BEGIN
  DECLARE v_provider_id INT;
  SELECT id INTO v_provider_id FROM travel_providers WHERE user_id = p_user_id LIMIT 1;
  SELECT b.*, tp.title AS package_title, tp.destination,
         u.full_name AS booker_name, u.email AS booker_email
  FROM travel_package_bookings b
  JOIN travel_packages tp ON tp.id = b.package_id
  JOIN users u ON u.id = b.user_id
  WHERE tp.provider_id = v_provider_id
  ORDER BY b.travel_date ASC;
END //
DELIMITER ;

-- Update package booking status
DROP PROCEDURE IF EXISTS sp_update_package_booking_status;
DELIMITER //
CREATE PROCEDURE sp_update_package_booking_status(
  IN p_booking_id INT,
  IN p_user_id INT,
  IN p_status VARCHAR(30)
)
BEGIN
  DECLARE v_provider_id INT;
  SELECT id INTO v_provider_id FROM travel_providers WHERE user_id = p_user_id LIMIT 1;

  UPDATE travel_package_bookings b
  JOIN travel_packages tp ON tp.id = b.package_id
  SET b.status = p_status
  WHERE b.id = p_booking_id AND tp.provider_id = v_provider_id;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found or unauthorized';
  END IF;

  SELECT b.*, tp.title AS package_title, u.full_name AS booker_name
  FROM travel_package_bookings b
  JOIN travel_packages tp ON tp.id = b.package_id
  JOIN users u ON u.id = b.user_id
  WHERE b.id = p_booking_id;
END //
DELIMITER ;

-- =============================================
-- MIGRATION & SAFETY PROCEDURES
-- =============================================

-- Procedure to verify email
DROP PROCEDURE IF EXISTS sp_verify_email;
DELIMITER //
CREATE PROCEDURE sp_verify_email(
    IN p_user_id INT,
    IN p_email VARCHAR(255)
)
BEGIN
    UPDATE users 
    SET email_verified = 1, 
        trust_score = LEAST(100, trust_score + 10) 
    WHERE id = p_user_id AND email = p_email;
    
    SELECT 'Email verified successfully' AS message;
END //
DELIMITER ;

-- Stored Procedures for Emergency Contacts
DROP PROCEDURE IF EXISTS sp_get_emergency_contacts;
DELIMITER //
CREATE PROCEDURE sp_get_emergency_contacts(
  IN p_user_id INT
)
BEGIN
  SELECT id, name, relationship, phone_number, created_at
  FROM emergency_contacts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_add_emergency_contact;
DELIMITER //
CREATE PROCEDURE sp_add_emergency_contact(
  IN p_user_id INT,
  IN p_name VARCHAR(255),
  IN p_relationship VARCHAR(255),
  IN p_phone VARCHAR(20)
)
BEGIN
  INSERT INTO emergency_contacts (user_id, name, relationship, phone_number)
  VALUES (p_user_id, p_name, p_relationship, p_phone);
  
  -- Return updated list
  CALL sp_get_emergency_contacts(p_user_id);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delete_emergency_contact;
DELIMITER //
CREATE PROCEDURE sp_delete_emergency_contact(
  IN p_contact_id INT,
  IN p_user_id INT
)
BEGIN
  DELETE FROM emergency_contacts 
  WHERE id = p_contact_id AND user_id = p_user_id;
  
  -- Return updated list
  CALL sp_get_emergency_contacts(p_user_id);
END //
DELIMITER ;

-- Update SOS Procedure to LOG every event
DROP PROCEDURE IF EXISTS sp_send_sos;
DELIMITER //
CREATE PROCEDURE sp_send_sos(
  IN p_user_id INT,
  IN p_latitude DECIMAL(10, 8),
  IN p_longitude DECIMAL(11, 8),
  IN p_message TEXT
)
BEGIN
  -- Insert into logs for verifiability
  INSERT INTO sos_logs (user_id, latitude, longitude, message)
  VALUES (p_user_id, p_latitude, p_longitude, p_message);
  
  -- Return success acknowledge
  SELECT 'SOS Logged & Signal Received' AS status;
END //
DELIMITER ;

-- Procedure to get user's SOS history
DROP PROCEDURE IF EXISTS sp_get_user_sos_history;
DELIMITER //
CREATE PROCEDURE sp_get_user_sos_history(
  IN p_user_id INT
)
BEGIN
  SELECT id, latitude, longitude, message, status, created_at
  FROM sos_logs
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 5;
END //
DELIMITER ;
