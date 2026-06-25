const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async () => {
  const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;
  let conn;
  if (connectionString) {
    try {
      const url = require('url');
      const parsed = url.parse(connectionString);
      const auth = parsed.auth ? parsed.auth.split(':') : [];
      conn = await mysql.createConnection({
        host: parsed.hostname,
        port: parsed.port || 3306,
        database: parsed.pathname ? parsed.pathname.substring(1) : undefined,
        user: auth[0],
        password: auth[1],
        ssl: {
          rejectUnauthorized: false
        },
        multipleStatements: true
      });
    } catch (err) {
      console.error('Failed to parse connection string for seeding, trying direct URL connection:', err.message);
      let uri = connectionString;
      if (uri.includes('?')) {
        if (!uri.includes('multipleStatements=')) {
          uri += '&multipleStatements=true';
        }
      } else {
        uri += '?multipleStatements=true';
      }
      conn = await mysql.createConnection(uri);
    }
  } else {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST, port: process.env.DB_PORT,
      user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME, multipleStatements: true
    });
  }

  const hash = await bcrypt.hash('Test@1234', 10);

  // Users
  await conn.query(`
    INSERT IGNORE INTO users (id, email, password_hash, full_name, username, gender, date_of_birth, bio, home_location, role, trust_score, is_verified) VALUES
    (10, 'arjun@test.com', ?, 'Arjun Mehta', 'arjun_travels', 'male', '1995-03-15', 'Solo traveler and photographer. Love mountains and chai.', 'Delhi, India', 'traveler', 85, 1),
    (11, 'priya@test.com', ?, 'Priya Sharma', 'priya_adventures', 'female', '1998-07-22', 'Adventure junkie. Rafting, trekking, paragliding!', 'Mumbai, India', 'traveler', 72, 1),
    (12, 'rohan@test.com', ?, 'Rohan Kapoor', 'rohan_k', 'male', '1992-11-08', 'Digital nomad working from the mountains. Coffee addict.', 'Bangalore, India', 'traveler', 90, 1),
    (13, 'ananya@test.com', ?, 'Ananya Desai', 'ananya_d', 'female', '2000-01-30', 'Yoga teacher and wellness enthusiast.', 'Pune, India', 'traveler', 65, 1),
    (14, 'vikram@test.com', ?, 'Vikram Singh', 'vikram_vendor', 'male', '1988-05-10', 'Running the best rafting company in Rishikesh since 2015.', 'Rishikesh, India', 'vendor', 95, 1),
    (15, 'meera@test.com', ?, 'Meera Joshi', 'meera_provider', 'female', '1990-09-18', 'Curating unforgettable Himalayan experiences for 8 years.', 'Rishikesh, India', 'provider', 88, 1)
  `, [hash, hash, hash, hash, hash, hash]);
  console.log('Users inserted');

  // Activities
  await conn.query(`
    INSERT IGNORE INTO activities (id, host_id, title, description, activity_type, latitude, longitude, location_name, start_time, end_time, capacity, current_attendees, gender_filter) VALUES
    (10, 10, 'Sunrise Yoga at Ram Jhula', 'Join us for a peaceful sunrise yoga session with views of the Ganges. All levels welcome.', 'Yoga', 30.0920, 78.3148, 'Ram Jhula, Rishikesh', '2026-04-16 06:00:00', '2026-04-16 07:30:00', 15, 4, 'all'),
    (11, 11, 'Rafting Crew Needed!', 'Looking for 4 more people to join our rafting group. 16km from Shivpuri. Rs 600 per person.', 'Adventure', 30.1200, 78.3000, 'Shivpuri, Rishikesh', '2026-04-16 09:00:00', '2026-04-16 12:00:00', 8, 4, 'all'),
    (12, 12, 'Digital Nomad Meetup', 'Fellow remote workers! Meet at Little Buddha Cafe for coworking, chai, and networking.', 'Social', 30.1265, 78.3230, 'Tapovan, Rishikesh', '2026-04-16 10:00:00', '2026-04-16 14:00:00', 20, 7, 'all'),
    (13, 13, 'Meditation and Sound Healing', 'Deep meditation session followed by Tibetan singing bowl healing. No experience needed.', 'Wellness', 30.0869, 78.2680, 'Parmarth Niketan, Rishikesh', '2026-04-16 17:00:00', '2026-04-16 18:30:00', 12, 3, 'all'),
    (14, 10, 'Beatles Ashram Photography Walk', 'Explore the abandoned Beatles Ashram with cameras. Composition tips included.', 'Photography', 30.0839, 78.3120, 'Beatles Ashram, Rishikesh', '2026-04-17 07:00:00', '2026-04-17 09:30:00', 10, 2, 'all'),
    (15, 11, 'Cliff Jumping at Neer Garh', 'Adrenaline seekers only! Heading to the Neer Garh waterfall for cliff jumping.', 'Adventure', 30.1050, 78.2900, 'Neer Garh Waterfall, Rishikesh', '2026-04-17 11:00:00', '2026-04-17 14:00:00', 6, 2, 'all'),
    (16, 12, 'Sunset Chai and Stories', 'Grab chai and share travel stories at Triveni Ghat steps while watching the sunset.', 'Social', 30.0858, 78.2610, 'Triveni Ghat, Rishikesh', '2026-04-17 17:30:00', '2026-04-17 19:00:00', 25, 9, 'all'),
    (17, 13, 'Morning Ganga Aarti Experience', 'Witness the magical Ganga Aarti ceremony together. Meeting at Parmarth Niketan.', 'Cultural', 30.0869, 78.2680, 'Parmarth Niketan, Rishikesh', '2026-04-18 18:00:00', '2026-04-18 19:30:00', 30, 12, 'all'),
    (18, 10, 'Camping and Bonfire Night', 'Riverside camping with bonfire, music, and stargazing. Rs 800 includes tent, dinner, breakfast.', 'Camping', 30.1200, 78.3000, 'Shivpuri Beach, Rishikesh', '2026-04-18 16:00:00', '2026-04-19 09:00:00', 12, 5, 'all'),
    (19, 11, 'Women-Only Trek to Patna Waterfall', 'Easy 3-hour trek through forest trail to Patna Waterfall. Women only.', 'Trekking', 30.0950, 78.2750, 'Rishikesh Forest Trail', '2026-04-19 07:00:00', '2026-04-19 12:00:00', 8, 3, 'female')
  `);
  console.log('Activities inserted');

  // RSVPs
  await conn.query(`
    INSERT IGNORE INTO activity_rsvps (activity_id, user_id, status) VALUES
    (10,11,'confirmed'),(10,12,'confirmed'),(10,13,'confirmed'),
    (11,10,'confirmed'),(11,12,'confirmed'),(11,13,'confirmed'),
    (12,10,'confirmed'),(12,11,'confirmed'),(12,13,'confirmed'),
    (13,10,'confirmed'),(13,11,'confirmed'),
    (14,11,'confirmed'),(14,12,'confirmed'),
    (15,10,'confirmed'),
    (16,10,'confirmed'),(16,11,'confirmed'),(16,13,'confirmed'),
    (17,10,'confirmed'),(17,11,'confirmed'),(17,12,'confirmed')
  `);
  console.log('RSVPs inserted');

  // Journal pins
  await conn.query(`
    INSERT IGNORE INTO private_pins (id, user_id, latitude, longitude, location_name, title, note, mood_emoji, visit_date) VALUES
    (10, 10, 30.0920, 78.3148, 'Ram Jhula, Rishikesh', 'First time at Ram Jhula', 'The suspension bridge over the Ganges was surreal. Amazing golden hour shots!', '😍', '2026-04-10 08:00:00'),
    (11, 10, 30.1200, 78.3000, 'Shivpuri, Rishikesh', 'Rafting Day!', 'Grade III rapids were insane! Best Rs 600 ever spent.', '🤩', '2026-04-11 10:00:00'),
    (12, 11, 30.0839, 78.3120, 'Beatles Ashram, Rishikesh', 'Beatles Ashram Vibes', 'Graffiti everywhere, peacocks roaming free. Spent 3 hours here.', '🎨', '2026-04-09 07:30:00'),
    (13, 11, 30.1050, 78.2900, 'Neer Garh Waterfall', 'Hidden Gem!', 'Crystal clear water pools. Jumped from 15 feet!', '💪', '2026-04-10 11:00:00'),
    (14, 12, 30.1265, 78.3230, 'Tapovan, Rishikesh', 'Best Cafe for Remote Work', 'Little Buddha Cafe - solid WiFi, great coffee, river views.', '💻', '2026-04-08 09:00:00'),
    (15, 12, 30.0858, 78.2610, 'Triveni Ghat, Rishikesh', 'Ganga Aarti Magic', 'Hundreds of diyas on the river, chanting filling the air.', '🙏', '2026-04-09 18:30:00'),
    (16, 13, 30.0869, 78.2680, 'Parmarth Niketan', 'Yoga Teacher Training Day 1', 'Started 200-hour YTT. 5am wake up, 3 hours of practice.', '🧘', '2026-04-07 06:00:00'),
    (17, 13, 30.0750, 78.2950, 'Vashishta Cave, Rishikesh', 'Ancient Meditation Cave', 'Meditated where sage Vashishta meditated thousands of years ago.', '✨', '2026-04-12 15:00:00')
  `);
  console.log('Journal pins inserted');

  // Recommendations
  await conn.query(`
    INSERT IGNORE INTO recommendations (id, latitude, longitude, location_name, category, pin_count, positive_sentiment_count, is_verified, aggregate_rating) VALUES
    (10, 30.0920, 78.3148, 'Ram Jhula', 'Landmark', 156, 142, 1, 4.70),
    (11, 30.1200, 78.3000, 'Shivpuri Rafting Point', 'Adventure', 234, 218, 1, 4.85),
    (12, 30.0839, 78.3120, 'Beatles Ashram', 'Cultural', 189, 170, 1, 4.60),
    (13, 30.1265, 78.3230, 'Little Buddha Cafe', 'Cafe', 98, 89, 1, 4.40),
    (14, 30.0869, 78.2680, 'Parmarth Niketan Ashram', 'Wellness', 312, 295, 1, 4.90),
    (15, 30.0858, 78.2610, 'Triveni Ghat', 'Cultural', 278, 260, 1, 4.80),
    (16, 30.1050, 78.2900, 'Neer Garh Waterfall', 'Nature', 145, 130, 1, 4.50),
    (17, 30.0750, 78.2950, 'Vashishta Cave', 'Spiritual', 87, 78, 1, 4.30),
    (18, 30.1100, 78.3100, 'Lakshman Jhula', 'Landmark', 201, 180, 1, 4.65),
    (19, 30.0800, 78.2700, 'Gita Bhawan', 'Spiritual', 67, 60, 1, 4.20)
  `);
  console.log('Recommendations inserted');

  // Travel provider for user 15
  await conn.query(`
    INSERT IGNORE INTO travel_providers (id, user_id, company_name, description, contact_email, contact_phone, latitude, longitude, location_name, is_verified, rating) VALUES
    (2, 15, 'Himalayan Soul Journeys', 'Boutique travel experiences focusing on wellness, culture, and sustainable tourism.', 'meera@himalayansoul.com', '+91-9876543210', 30.0869, 78.2980, 'Rishikesh, Uttarakhand', 1, 4.70)
  `);
  console.log('Provider inserted');

  // Travel packages
  await conn.query(`
    INSERT IGNORE INTO travel_packages (id, provider_id, title, description, destination, destination_latitude, destination_longitude, duration_days, price, max_travelers, includes, itinerary, available_from, available_to, departure_dates, category, rating, total_bookings) VALUES
    (4, 2, 'Chopta Tungnath Weekend Trek', 'Trek to the highest Shiva temple at 3680m. Stunning Himalayan panoramas and rhododendron forests.', 'Chopta, Uttarakhand', 30.4500, 79.2500, 3, 5499.00, 12,
     '["Transport from Rishikesh","Camping gear","All meals","Professional guide","First-aid support"]',
     '[{"day":1,"title":"Rishikesh to Chopta","desc":"Scenic 8-hour drive through Devprayag. Camp at Chopta meadows."},{"day":2,"title":"Summit Day","desc":"Trek to Tungnath temple, continue to Chandrashila peak at 4000m."},{"day":3,"title":"Return","desc":"Morning at leisure, drive back to Rishikesh."}]',
     '2026-04-01', '2026-11-30',
     '["2026-04-25","2026-05-09","2026-05-23","2026-06-06","2026-09-12","2026-10-10","2026-10-24","2026-11-07"]',
     'Trekking', 4.75, 23),

    (5, 2, 'Haridwar Heritage and Food Walk', 'A 2-day cultural immersion with ancient temples, street food tasting, and Ganga Aarti.', 'Haridwar, Uttarakhand', 29.9457, 78.1642, 2, 2999.00, 20,
     '["Guided heritage walk","Street food tasting (10+ items)","Ganga Aarti VIP seating","1 night heritage hotel","Breakfast and lunch"]',
     '[{"day":1,"title":"Heritage Walk and Food Trail","desc":"Mansa Devi temple via cable car, explore bazaars, taste legendary street food."},{"day":2,"title":"Aarti and Departure","desc":"Morning yoga at ashram, visit Shantikunj, evening Ganga Aarti at Har Ki Pauri."}]',
     '2026-04-01', '2026-12-31',
     '["2026-04-19","2026-05-03","2026-05-17","2026-06-07","2026-07-05","2026-08-02","2026-09-06","2026-10-04","2026-11-01","2026-12-06"]',
     'Cultural', 4.60, 38),

    (6, 2, 'Auli Skiing and Snow Trek', 'Experience Indias best skiing slopes with professional instructors, snow trekking and cable car rides.', 'Auli, Uttarakhand', 30.5267, 79.5667, 4, 9999.00, 10,
     '["Skiing equipment rental","Professional ski instructor","Cable car passes","3 nights hotel","All meals","Transport from Rishikesh"]',
     '[{"day":1,"title":"Travel to Auli","desc":"Drive to Joshimath, cable car to Auli. Explore snow meadows."},{"day":2,"title":"Skiing Day 1","desc":"Beginner and intermediate skiing lessons on the slopes."},{"day":3,"title":"Snow Trek and Skiing","desc":"Morning snow trek to Gorson Bugyal, afternoon free skiing."},{"day":4,"title":"Departure","desc":"Cable car down, visit Joshimath temples, drive back."}]',
     '2026-12-01', '2026-12-31',
     '["2026-12-12","2026-12-19","2026-12-26"]',
     'Adventure', 4.80, 15),

    (7, 1, 'Kedarnath Pilgrimage Trek', 'Sacred trek to one of the holiest Shiva temples with professional support and medical backup.', 'Kedarnath, Uttarakhand', 30.7352, 79.0669, 5, 7999.00, 15,
     '["Trek guide and support staff","Accommodation in guesthouses","All meals","Medical kit and oxygen","Transport from Rishikesh"]',
     '[{"day":1,"title":"Rishikesh to Guptkashi","desc":"8-hour drive through scenic Himalayan roads. Overnight at Guptkashi."},{"day":2,"title":"Trek to Kedarnath","desc":"Drive to Gaurikund, trek 16km to Kedarnath. Check into guesthouse."},{"day":3,"title":"Temple Darshan","desc":"Early morning darshan at Kedarnath temple, explore surroundings."},{"day":4,"title":"Trek Down","desc":"Return trek to Gaurikund, drive to Guptkashi."},{"day":5,"title":"Return to Rishikesh","desc":"Scenic drive back with stop at Devprayag sangam."}]',
     '2026-05-01', '2026-10-31',
     '["2026-05-10","2026-05-24","2026-06-07","2026-06-21","2026-07-12","2026-08-09","2026-09-06","2026-10-04"]',
     'Spiritual', 4.88, 52)
  `);
  console.log('Travel packages inserted');

  // Package bookings
  await conn.query(`
    INSERT IGNORE INTO travel_package_bookings (id, package_id, user_id, travelers, travel_date, total_price, status, notes) VALUES
    (1, 1, 10, 2, '2026-05-04', 9998.00, 'confirmed', 'Vegetarian meals please'),
    (2, 1, 11, 1, '2026-05-18', 4999.00, 'confirmed', NULL),
    (3, 2, 12, 1, '2026-07-01', 8499.00, 'pending', 'Need extra sleeping bag'),
    (4, 3, 13, 1, '2026-05-10', 6999.00, 'confirmed', 'Knee injury, need yoga modifications'),
    (5, 4, 10, 3, '2026-05-09', 16497.00, 'pending', 'One person is 60+, need slower pace'),
    (6, 5, 11, 2, '2026-05-03', 5998.00, 'confirmed', 'Allergic to nuts'),
    (7, 7, 10, 1, '2026-05-24', 7999.00, 'confirmed', NULL),
    (8, 6, 12, 2, '2026-12-19', 19998.00, 'pending', 'First time skiing, beginner instructor please'),
    (9, 1, 13, 1, '2026-06-01', 4999.00, 'cancelled', 'Plans changed'),
    (10, 5, 13, 1, '2026-06-07', 2999.00, 'confirmed', 'Excited for the food walk!')
  `);
  console.log('Package bookings inserted');

  // Marketplace bookings
  await conn.query(`
    INSERT IGNORE INTO marketplace_bookings (id, listing_id, user_id, quantity, total_price, status, booking_date, notes) VALUES
    (1, 1, 10, 2, 1200.00, 'confirmed', '2026-04-16', 'For me and my friend'),
    (2, 3, 11, 1, 1200.00, 'confirmed', '2026-04-17', 'Need tent near the river'),
    (3, 5, 13, 1, 300.00, 'confirmed', '2026-04-16', NULL),
    (4, 2, 12, 1, 450.00, 'pending', '2026-04-18', 'Is there a locker for laptop?'),
    (5, 4, 10, 2, 1600.00, 'confirmed', '2026-04-19', 'Bringing my DSLR and tripod'),
    (6, 6, 12, 1, 200.00, 'confirmed', '2026-04-16', 'Need corner seat with charger')
  `);
  console.log('Marketplace bookings inserted');

  // Summary
  const [rows] = await conn.query(`
    SELECT 'users' t, COUNT(*) c FROM users UNION ALL
    SELECT 'activities', COUNT(*) FROM activities UNION ALL
    SELECT 'rsvps', COUNT(*) FROM activity_rsvps UNION ALL
    SELECT 'journal_pins', COUNT(*) FROM private_pins UNION ALL
    SELECT 'recommendations', COUNT(*) FROM recommendations UNION ALL
    SELECT 'providers', COUNT(*) FROM travel_providers UNION ALL
    SELECT 'packages', COUNT(*) FROM travel_packages UNION ALL
    SELECT 'pkg_bookings', COUNT(*) FROM travel_package_bookings UNION ALL
    SELECT 'mkt_listings', COUNT(*) FROM marketplace_listings UNION ALL
    SELECT 'mkt_bookings', COUNT(*) FROM marketplace_bookings
  `);
  console.log('\n--- Data Summary ---');
  rows.forEach(r => console.log(`  ${r.t}: ${r.c}`));

  await conn.end();
  console.log('\nAll dummy data inserted!');
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
