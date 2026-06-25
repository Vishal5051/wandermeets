-- =============================================
-- WanderMates Database Schema (MySQL)
-- =============================================

-- CREATE DATABASE IF NOT EXISTS wandermates
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;

-- USE wandermates;

-- =============================================
-- DROP EXISTING TABLES (for clean re-init)
-- =============================================
DROP TABLE IF EXISTS group_messages;
DROP TABLE IF EXISTS group_chats;
DROP TABLE IF EXISTS user_email_verifications;
DROP TABLE IF EXISTS sos_logs;
DROP TABLE IF EXISTS emergency_contacts;
DROP TABLE IF EXISTS user_reports;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS wave_requests;
DROP TABLE IF EXISTS waves;
DROP TABLE IF EXISTS travel_package_bookings;
DROP TABLE IF EXISTS travel_packages;
DROP TABLE IF EXISTS travel_providers;
DROP TABLE IF EXISTS marketplace_bookings;
DROP TABLE IF EXISTS marketplace_listings;
DROP TABLE IF EXISTS marketplace_vendors;
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS private_pins;
DROP TABLE IF EXISTS activity_rsvps;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS user_reviews;
DROP TABLE IF EXISTS user_sos_alerts;
DROP TABLE IF EXISTS user_emergency_contacts;
DROP TABLE IF EXISTS users;

-- =============================================
-- TABLES
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  gender VARCHAR(20) DEFAULT NULL,
  date_of_birth DATE DEFAULT NULL,
  profile_photo VARCHAR(500) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  home_location VARCHAR(255) DEFAULT NULL,
  languages JSON DEFAULT NULL,
  interests JSON DEFAULT NULL,
  trust_score INT DEFAULT 50,
  verification_level VARCHAR(50) DEFAULT 'unverified',
  is_verified TINYINT(1) DEFAULT 0,
  aadhaar_number_masked VARCHAR(20) DEFAULT NULL,
  aadhaar_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified',
  aadhaar_photo_url VARCHAR(500) DEFAULT NULL,
  phone_number VARCHAR(20) DEFAULT NULL,
  phone_verified TINYINT(1) DEFAULT 0,
  email_verified TINYINT(1) DEFAULT 0,
  role VARCHAR(20) DEFAULT 'traveler',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  host_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  activity_type VARCHAR(100) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  location_name VARCHAR(255) DEFAULT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME DEFAULT NULL,
  capacity INT DEFAULT 10,
  current_attendees INT DEFAULT 0,
  gender_filter VARCHAR(20) DEFAULT 'all',
  min_age INT DEFAULT NULL,
  max_age INT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_activities_host FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_activities_location ON activities (latitude, longitude);
CREATE INDEX idx_activities_active ON activities (is_active, start_time);

-- Activity RSVPs table
CREATE TABLE IF NOT EXISTS activity_rsvps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_activity_user (activity_id, user_id),
  CONSTRAINT fk_rsvps_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_rsvps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Private Pins (Travel Journal)
CREATE TABLE IF NOT EXISTS private_pins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  location_name VARCHAR(255) DEFAULT NULL,
  title VARCHAR(255) DEFAULT NULL,
  note TEXT DEFAULT NULL,
  photos JSON DEFAULT NULL,
  voice_note_url VARCHAR(500) DEFAULT NULL,
  mood_emoji VARCHAR(10) DEFAULT NULL,
  visit_date DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_pins_location ON private_pins (latitude, longitude);

-- Crowdsourced Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  pin_count INT DEFAULT 0,
  positive_sentiment_count INT DEFAULT 0,
  is_verified TINYINT(1) DEFAULT 0,
  aggregate_rating DECIMAL(3,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_pinned_at DATETIME DEFAULT NULL
) ENGINE=InnoDB;

CREATE INDEX idx_recommendations_location ON recommendations (latitude, longitude);

-- Marketplace Vendors
CREATE TABLE IF NOT EXISTS marketplace_vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  contact_phone VARCHAR(20) DEFAULT NULL,
  contact_email VARCHAR(255) DEFAULT NULL,
  website VARCHAR(500) DEFAULT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Marketplace Listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT DEFAULT NULL,
  created_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  latitude DOUBLE DEFAULT NULL,
  longitude DOUBLE DEFAULT NULL,
  location_name VARCHAR(255) DEFAULT NULL,
  vendor_name VARCHAR(255) DEFAULT NULL,
  duration VARCHAR(100) DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  contact_phone VARCHAR(20) DEFAULT NULL,
  contact_email VARCHAR(255) DEFAULT NULL,
  rating DECIMAL(3,2) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_listing_vendor FOREIGN KEY (vendor_id) REFERENCES marketplace_vendors(id) ON DELETE SET NULL,
  CONSTRAINT fk_listing_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_listings_category ON marketplace_listings (category, is_active);
CREATE INDEX idx_listings_location ON marketplace_listings (latitude, longitude);

-- Marketplace Bookings
CREATE TABLE IF NOT EXISTS marketplace_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id INT NOT NULL,
  quantity INT DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  booking_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_listing FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_bookings_user ON marketplace_bookings (user_id, status);
CREATE INDEX idx_bookings_listing ON marketplace_bookings (listing_id, status);

-- Travel Providers (package providers)
CREATE TABLE IF NOT EXISTS travel_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  contact_phone VARCHAR(20) DEFAULT NULL,
  contact_email VARCHAR(255) DEFAULT NULL,
  website VARCHAR(500) DEFAULT NULL,
  latitude DOUBLE DEFAULT NULL,
  longitude DOUBLE DEFAULT NULL,
  location_name VARCHAR(255) DEFAULT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_provider_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Travel Packages
CREATE TABLE IF NOT EXISTS travel_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  destination VARCHAR(255) NOT NULL,
  destination_latitude DOUBLE DEFAULT NULL,
  destination_longitude DOUBLE DEFAULT NULL,
  duration_days INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_travelers INT DEFAULT 20,
  includes JSON DEFAULT NULL,
  itinerary JSON DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  available_from DATE NOT NULL,
  available_to DATE NOT NULL,
  departure_dates JSON DEFAULT NULL,
  category VARCHAR(100) DEFAULT 'Adventure',
  is_active TINYINT(1) DEFAULT 1,
  rating DECIMAL(3,2) DEFAULT NULL,
  total_bookings INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_package_provider FOREIGN KEY (provider_id) REFERENCES travel_providers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_packages_destination ON travel_packages (destination_latitude, destination_longitude);
CREATE INDEX idx_packages_dates ON travel_packages (available_from, available_to, is_active);
CREATE INDEX idx_packages_category ON travel_packages (category, is_active);

-- Travel Package Bookings
CREATE TABLE IF NOT EXISTS travel_package_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  package_id INT NOT NULL,
  user_id INT NOT NULL,
  travelers INT DEFAULT 1,
  travel_date DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pkgbooking_package FOREIGN KEY (package_id) REFERENCES travel_packages(id) ON DELETE CASCADE,
  CONSTRAINT fk_pkgbooking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_pkgbookings_user ON travel_package_bookings (user_id, status);
CREATE INDEX idx_pkgbookings_package ON travel_package_bookings (package_id, travel_date);

-- Waves table
CREATE TABLE IF NOT EXISTS waves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  host_id INT NOT NULL,
  origin_latitude DOUBLE NOT NULL,
  origin_longitude DOUBLE NOT NULL,
  origin_name VARCHAR(255) NOT NULL,
  destination_latitude DOUBLE NOT NULL,
  destination_longitude DOUBLE NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  departure_time DATETIME NOT NULL,
  capacity INT DEFAULT 4,
  current_travelers INT DEFAULT 1,
  price_per_seat DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  vibe_tags JSON DEFAULT NULL,
  car_model VARCHAR(100) DEFAULT NULL,
  car_number VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_waves_host FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Wave Requests
CREATE TABLE IF NOT EXISTS wave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wave_id INT NOT NULL,
  requester_id INT NOT NULL,
  seats_requested INT DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  service_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending',
  message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wave_requester (wave_id, requester_id),
  CONSTRAINT fk_wreq_wave FOREIGN KEY (wave_id) REFERENCES waves(id) ON DELETE CASCADE,
  CONSTRAINT fk_wreq_user FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant_1 INT NOT NULL,
  participant_2 INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_participants (participant_1, participant_2),
  CONSTRAINT fk_conv_p1 FOREIGN KEY (participant_1) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conv_p2 FOREIGN KEY (participant_2) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User Reports
CREATE TABLE IF NOT EXISTS user_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT DEFAULT NULL,
  reported_user_id INT NOT NULL,
  entity_type ENUM('user', 'activity', 'wave', 'listing') DEFAULT 'user',
  entity_id INT DEFAULT NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_report_reported FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User Emergency Contacts
CREATE TABLE IF NOT EXISTS user_emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User SOS Alerts
CREATE TABLE IF NOT EXISTS user_sos_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User Reviews
CREATE TABLE IF NOT EXISTS user_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  entity_type ENUM('user', 'activity', 'wave', 'listing') DEFAULT 'user',
  entity_id INT DEFAULT NULL,
  entity_title VARCHAR(255) DEFAULT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- AUXILIARY / MIGRATION TABLES
-- =============================================

-- Table to store email verification codes
CREATE TABLE IF NOT EXISTS user_email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_email_ver_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table to map activities/waves to chat rooms
CREATE TABLE IF NOT EXISTS group_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('activity', 'wave') NOT NULL,
    reference_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_group_chat (type, reference_id)
) ENGINE=InnoDB;

-- Table to store actual messages
CREATE TABLE IF NOT EXISTS group_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_msg_chat FOREIGN KEY (group_chat_id) REFERENCES group_chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Create Emergency Contacts Table (used by safety routes)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_emerg_contacts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Create SOS Logs Table (used by safety routes)
CREATE TABLE IF NOT EXISTS sos_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  message TEXT,
  status VARCHAR(50) DEFAULT 'received',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sos_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- SAMPLE DATA
-- =============================================

INSERT IGNORE INTO users (email, password_hash, full_name, username, gender, bio, trust_score, verification_level, role)
VALUES 
  ('sarah@example.com', '$2a$10$.zIUb570.xQ4oXXpHaz1w.xjuu0XFoB3L22kYB06hHcgS49nSckzW', 'Sarah Mitchell', 'sarahtravels', 'female', 'Adventure seeker | Digital Nomad', 75, 'verified', 'traveler'),
  ('alex@example.com', '$2a$10$.zIUb570.xQ4oXXpHaz1w.xjuu0XFoB3L22kYB06hHcgS49nSckzW', 'Alex Johnson', 'alexexplorer', 'male', 'Solo traveler | Photography enthusiast', 80, 'verified', 'traveler'),
  ('priya@example.com', '$2a$10$.zIUb570.xQ4oXXpHaz1w.xjuu0XFoB3L22kYB06hHcgS49nSckzW', 'Priya Sharma', 'priyawanders', 'female', 'Yoga teacher | Mountain lover', 70, 'phone_verified', 'traveler'),
  ('vendor@example.com', '$2a$10$.zIUb570.xQ4oXXpHaz1w.xjuu0XFoB3L22kYB06hHcgS49nSckzW', 'Red Chili Adventure', 'redchili', 'other', 'Adventure sports provider in Rishikesh since 2010', 90, 'verified', 'vendor');

INSERT IGNORE INTO activities (host_id, title, description, activity_type, latitude, longitude, location_name, start_time, capacity, gender_filter)
VALUES 
  (1, 'Morning Yoga by the Ganges', 'Join for peaceful morning yoga session with river view', 'Yoga', 30.0869, 78.2980, 'Parmarth Niketan, Rishikesh', DATE_ADD(NOW(), INTERVAL 2 HOUR), 10, 'all'),
  (2, 'Cafe Hopping in Tapovan', 'Exploring the best cafes in Tapovan area', 'Cafe', 30.1265, 78.3230, 'Tapovan, Rishikesh', DATE_ADD(NOW(), INTERVAL 4 HOUR), 5, 'all'),
  (3, 'Sunset Hike to Neer Garh', 'Easy hike to beautiful waterfall', 'Hike', 30.1420, 78.3175, 'Neer Garh Waterfall', DATE_ADD(NOW(), INTERVAL 6 HOUR), 8, 'all');

-- Sample Marketplace Data
INSERT IGNORE INTO marketplace_listings (created_by, title, description, category, price, latitude, longitude, location_name, vendor_name, duration, rating)
VALUES
  (1, 'River Rafting 16km', 'Exciting 16km river rafting from Shivpuri to Rishikesh with Grade III-IV rapids. Includes all safety gear, certified guides, and refreshments.', 'Rafting', 600.00, 30.1200, 78.3000, 'Shivpuri, Rishikesh', 'Red Chili Adventure', '3 hours', 4.80),
  (2, 'Hostel Dorm Bed', 'Comfortable dorm bed with mountain views, common kitchen, rooftop cafe, and a vibrant social scene. Perfect for solo travelers.', 'Stays', 450.00, 30.1265, 78.3230, 'Tapovan, Rishikesh', 'Zostel Rishikesh', 'Per night', 4.50),
  (3, 'Riverside Camping', 'Overnight camping on the banks of the Ganges with bonfire, music, dinner, and breakfast included. Luxury swiss tents.', 'Camping', 1200.00, 30.1200, 78.3000, 'Shivpuri, Rishikesh', 'Camp Wildex', '1 night', 4.70),
  (1, 'Photography Tour', 'Guided photography tour covering the best spots — Lakshman Jhula, Ram Jhula, Beatles Ashram, and sunset at Triveni Ghat.', 'Photography', 800.00, 30.0869, 78.2980, 'Rishikesh', 'Rishikesh Clicks', '4 hours', 4.60),
  (2, 'Morning Yoga Class', 'Traditional yoga session by the Ganges with experienced instructors. Includes pranayama, asanas, and meditation.', 'Yoga', 300.00, 30.0869, 78.2980, 'Parmarth Niketan, Rishikesh', 'Parmarth Niketan', '90 mins', 4.90),
  (3, 'Cafe Workspace Pass', 'Full day workspace access with high-speed WiFi, unlimited coffee/tea, and 10% off on food. River-view seating.', 'Cafe', 200.00, 30.1265, 78.3230, 'Tapovan, Rishikesh', 'Little Buddha Cafe', 'Full day', 4.40);

-- Sample Travel Provider
INSERT IGNORE INTO travel_providers (user_id, company_name, description, contact_email, latitude, longitude, location_name, is_verified, rating)
VALUES
  (4, 'Red Chili Adventure Tours', 'Premium adventure travel packages in Uttarakhand since 2010. Rafting, trekking, camping and more.', 'tours@redchili.com', 30.0869, 78.2980, 'Rishikesh, Uttarakhand', 1, 4.80);

-- Sample Travel Packages
INSERT IGNORE INTO travel_packages (provider_id, title, description, destination, destination_latitude, destination_longitude, duration_days, price, max_travelers, includes, itinerary, available_from, available_to, departure_dates, category, rating, total_bookings)
VALUES
  (1, 'Rishikesh Adventure Weekend', 'Action-packed 3-day adventure package including rafting, bungee jumping, and camping by the Ganges.', 'Rishikesh, Uttarakhand', 30.0869, 78.2980, 3, 4999.00, 15, '["White water rafting 16km", "Bungee jumping", "Riverside camping", "All meals", "Transport from Delhi"]', '[{"day":1,"title":"Arrival & Rafting","desc":"Check-in, safety briefing, 16km river rafting from Shivpuri"},{"day":2,"title":"Adventure Day","desc":"Bungee jumping at Mohan Chatti, cliff jumping, body surfing"},{"day":3,"title":"Explore & Depart","desc":"Morning yoga, Beatles Ashram visit, departure"}]', '2026-04-01', '2026-12-31', '["2026-04-20","2026-05-04","2026-05-18","2026-06-01","2026-06-15","2026-07-06","2026-08-03","2026-09-07","2026-10-05","2026-11-02","2026-12-07"]', 'Adventure', 4.90, 47),
  (1, 'Valley of Flowers Trek', 'Guided 5-day trek through the stunning Valley of Flowers National Park, a UNESCO World Heritage Site.', 'Valley of Flowers, Uttarakhand', 30.7280, 79.6053, 5, 8499.00, 12, '["Professional trek guide", "Camping equipment", "All meals on trek", "Permits & entry fees", "Transport from Rishikesh"]', '[{"day":1,"title":"Rishikesh to Govindghat","desc":"Drive to Govindghat, overnight stay"},{"day":2,"title":"Trek to Ghangaria","desc":"Trek 10km to base camp Ghangaria"},{"day":3,"title":"Valley of Flowers","desc":"Full day exploring the valley flora"},{"day":4,"title":"Hemkund Sahib","desc":"Optional trek to Hemkund Sahib lake"},{"day":5,"title":"Return trek","desc":"Trek back and drive to Rishikesh"}]', '2026-06-01', '2026-10-31', '["2026-06-15","2026-07-01","2026-07-15","2026-08-01","2026-08-15","2026-09-01","2026-09-15","2026-10-01"]', 'Trekking', 4.85, 32),
  (1, 'Spiritual Rishikesh Retreat', 'Rejuvenating 4-day wellness retreat with yoga, meditation, and Ayurvedic treatments by the Ganges.', 'Rishikesh, Uttarakhand', 30.0869, 78.2980, 4, 6999.00, 10, '["Daily yoga sessions", "Meditation classes", "Ayurvedic massage", "Sattvic meals", "Ganga Aarti experience", "Accommodation"]', '[{"day":1,"title":"Arrival & Orientation","desc":"Check-in, welcome ceremony, evening Ganga Aarti"},{"day":2,"title":"Yoga & Meditation","desc":"Morning yoga, pranayama workshop, afternoon meditation"},{"day":3,"title":"Healing Day","desc":"Ayurvedic consultation, massage therapy, sound healing"},{"day":4,"title":"Integration & Departure","desc":"Sunrise meditation, closing ceremony, departure"}]', '2026-04-01', '2026-12-31', '["2026-04-25","2026-05-10","2026-05-25","2026-06-10","2026-07-10","2026-08-10","2026-09-10","2026-10-10","2026-11-10","2026-12-10"]', 'Wellness', 4.95, 28);
