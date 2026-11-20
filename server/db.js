/**
 * Grand Heritage Catering - Database Connection & Schema Initialization
 * SQLite 3 Engine with WAL mode, Relational Schema, and Complete Pre-Seeding
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'catering.db');
const db = new sqlite3.Database(DB_PATH);

// Promise-based query helpers
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function initDB() {
  await exec(`PRAGMA journal_mode = WAL;`);
  await exec(`PRAGMA foreign_keys = ON;`);

  // 1. Settings Table
  await exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Users Table
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'admin', -- 'admin', 'coordinator', 'chef'
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Categories Table
  await exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 4. Menu Items Table
  await exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      description TEXT,
      price REAL NOT NULL,
      portion_size TEXT DEFAULT 'Per Guest',
      image_url TEXT,
      dietary_tags TEXT DEFAULT '[]', -- JSON string e.g. ["Halal", "Gluten-Free"]
      allergens TEXT DEFAULT '[]', -- JSON string e.g. ["Dairy", "Nuts"]
      calories INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Packages Table
  await exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      price_per_person REAL NOT NULL,
      min_guests INTEGER NOT NULL DEFAULT 15,
      max_guests INTEGER,
      courses_count INTEGER DEFAULT 3,
      description TEXT,
      included_items_json TEXT DEFAULT '[]',
      included_services_json TEXT DEFAULT '[]',
      image_url TEXT,
      badge TEXT,
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Inquiries / Bookings Table
  await exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_whatsapp TEXT,
      company_name TEXT,
      event_type TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT,
      venue_address TEXT NOT NULL,
      guest_count INTEGER NOT NULL,
      is_outdoor INTEGER DEFAULT 0,
      service_type TEXT NOT NULL,
      package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
      package_name TEXT,
      selected_items_json TEXT DEFAULT '[]',
      dietary_requirements_json TEXT DEFAULT '[]',
      allergies_notes TEXT,
      special_instructions TEXT,
      additional_services_json TEXT DEFAULT '[]',
      estimated_budget REAL DEFAULT 0,
      preferred_payment_method TEXT DEFAULT 'Credit Card / Bank Transfer',
      status TEXT DEFAULT 'New Inquiry', -- 'New Inquiry', 'Under Review', 'Quotation Sent', 'Awaiting Customer Approval', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'
      assigned_to TEXT,
      internal_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Quotations Table
  await exec(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT NOT NULL UNIQUE,
      inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      event_date TEXT,
      guest_count INTEGER,
      line_items_json TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0,
      delivery_fee REAL NOT NULL DEFAULT 0,
      setup_fee REAL NOT NULL DEFAULT 0,
      staffing_fee REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 13.0,
      tax_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      deposit_required REAL NOT NULL DEFAULT 0,
      terms_conditions TEXT,
      valid_until TEXT,
      status TEXT DEFAULT 'Draft', -- 'Draft', 'Sent', 'Accepted', 'Declined', 'Expired'
      client_feedback TEXT,
      sent_at DATETIME,
      responded_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Customers Table
  await exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      whatsapp TEXT,
      company TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Gallery Items Table
  await exec(`
    CREATE TABLE IF NOT EXISTS gallery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- 'wedding', 'corporate', 'birthday', 'buffet', 'presentation', 'outdoor', 'desserts'
      image_url TEXT NOT NULL,
      caption TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Testimonials Table
  await exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      company TEXT,
      event_type TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      review_text TEXT NOT NULL,
      photo_url TEXT,
      event_date TEXT,
      is_approved INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. FAQs Table
  await exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. Contact Messages Table
  await exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread', -- 'unread', 'replied', 'archived'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 13. Email Activity Logs
  await exec(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      subject TEXT NOT NULL,
      template_name TEXT,
      content_preview TEXT,
      status TEXT DEFAULT 'simulated_sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Initial Data if empty
  await seedDefaults();
}

async function seedDefaults() {
  // 1. Check & Seed Admin User
  const adminExists = await get(`SELECT id FROM users WHERE username = 'admin'`);
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await run(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?, ?)
    `, ['admin', 'admin@heritagecatering.com', hash, 'Executive Catering Director', 'admin']);
    console.log('✅ Default admin created: admin / admin123');
  }

  // 2. Check & Seed Settings
  const settingsCount = await get(`SELECT COUNT(*) as count FROM settings`);
  if (settingsCount.count === 0) {
    const defaultSettings = [
      ['business_name', 'Grand Heritage Catering & Events', 'general'],
      ['business_tagline', 'Exceptional Catering for Every Special Occasion', 'general'],
      ['business_type', 'Full-Service Catering & Event Production', 'general'],
      ['business_phone', '+1 (416) 555-0198', 'contact'],
      ['business_whatsapp', '+1 (416) 555-0198', 'contact'],
      ['business_email', 'events@heritagecatering.com', 'contact'],
      ['business_address', '128 King Street East, Suite 400, Toronto, ON M5C 1G6, Canada', 'contact'],
      ['business_hours', 'Mon - Sat: 8:00 AM - 8:00 PM | Sun: 9:00 AM - 5:00 PM', 'contact'],
      ['currency_symbol', '$', 'finance'],
      ['currency_code', 'CAD', 'finance'],
      ['default_tax_rate', '13.0', 'finance'],
      ['default_deposit_percent', '30.0', 'finance'],
      ['booking_policy', 'A 30% initial deposit confirms your date and culinary team. Balance is due 7 business days prior to your event. Free rescheduling or full cancellation available up to 14 days before the event.', 'policy'],
      ['hero_headline', 'Exceptional Catering for Every Special Occasion', 'content'],
      ['hero_subtext', 'From unforgettable weddings and executive corporate galas to vibrant private celebrations, we craft bespoke culinary experiences using farm-fresh seasonal ingredients, artistic presentations, and attentive five-star hospitality.', 'content'],
      ['about_story', 'Founded with a passion for exceptional cuisine and warm hospitality, Grand Heritage Catering brings chef-driven culinary artistry directly to your celebration. With over 15 years of industry experience and more than 2,500 successful events, our team blends classic techniques with modern gastronomy to ensure every guest is enchanted.', 'content'],
      ['social_instagram', 'https://instagram.com/grandheritagecatering', 'social'],
      ['social_facebook', 'https://facebook.com/grandheritagecatering', 'social'],
      ['social_linkedin', 'https://linkedin.com/company/grand-heritage-catering', 'social']
    ];

    for (const [key, val, cat] of defaultSettings) {
      await run(`INSERT INTO settings (setting_key, setting_value, category) VALUES (?, ?, ?)`, [key, val, cat]);
    }
  }

  // 3. Check & Seed Categories (10 required categories)
  const catCount = await get(`SELECT COUNT(*) as count FROM categories`);
  if (catCount.count === 0) {
    const categories = [
      ['Starters & Appetizers', 'starters-appetizers', 'Artisan hors d\'oeuvres, gourmet finger foods, and elegant passed canapés', 1],
      ['Main Courses', 'main-courses', 'Plated delicacies, slow-braised meats, poultry, and exquisite chef creations', 2],
      ['Rice & Biryani', 'rice-biryani', 'Aromatic saffron basmati rice, royal dum biryanis, and Mediterranean pilafs', 3],
      ['BBQ & Grilled Food', 'bbq-grilled-food', 'Charcoal-grilled skewers, prime steaks, smoked briskets, and BBQ specialties', 4],
      ['Pasta & Italian Food', 'pasta-italian-food', 'Handmade pasta, rich truffled risottos, and rustic Italian classics', 5],
      ['Salads', 'salads', 'Organic crisp greens, Mediterranean harvest bowls, and artisanal dressings', 6],
      ['Desserts', 'desserts', 'Handcrafted pastries, elegant mousse towers, and decadent celebration sweets', 7],
      ['Beverages', 'beverages', 'Artisan mocktails, cold-pressed juices, infused waters, and specialty coffees', 8],
      ['Vegetarian Options', 'vegetarian-options', 'Wholesome, vibrant, gourmet vegetarian dishes crafted with culinary finesse', 9],
      ['Special Dietary Options', 'special-dietary-options', 'Strict Halal, Gluten-Free, Vegan, and Allergy-conscious creations with zero cross-contamination', 10]
    ];

    for (const [name, slug, desc, order] of categories) {
      await run(`INSERT INTO categories (name, slug, description, display_order) VALUES (?, ?, ?, ?)`, [name, slug, desc, order]);
    }
  }

  // 4. Check & Seed Menu Items
  const menuCount = await get(`SELECT COUNT(*) as count FROM menu_items`);
  if (menuCount.count === 0) {
    const items = [
      // Starters & Appetizers (cat_id: 1)
      [
        'Truffle Wild Mushroom Arancini',
        'truffle-wild-mushroom-arancini',
        1,
        'Crispy golden risotto spheres infused with black truffle oil, wild forest mushrooms, and aged parmesan fondue dip.',
        12.50,
        '4 pieces per guest',
        'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Vegetarian']),
        JSON.stringify(['Dairy', 'Gluten']),
        320,
        1,
        1
      ],
      [
        'Smoked Salmon Blinis with Caviar',
        'smoked-salmon-blinis-with-caviar',
        1,
        'House-cured Atlantic smoked salmon on warm buckwheat blinis with dill creme fraiche and lemon zest.',
        15.00,
        '3 pieces per guest',
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Pescatarian', 'Halal']),
        JSON.stringify(['Fish', 'Dairy', 'Gluten']),
        240,
        1,
        2
      ],
      [
        'Charred Wagyu Beef Crostini',
        'charred-wagyu-beef-crostini',
        1,
        'Seared thinly sliced Wagyu beef on garlic sourdough crostini topped with horseradish emulsion and microgreens.',
        16.50,
        '3 pieces per guest',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Halal']),
        JSON.stringify(['Gluten', 'Dairy']),
        280,
        0,
        3
      ],

      // Main Courses (cat_id: 2)
      [
        'Slow-Braised Prime Beef Short Ribs',
        'slow-braised-prime-beef-short-ribs',
        2,
        '12-hour braised bone-in beef short rib served with caramelized shallot jus, roasted root vegetables, and silky potato purée.',
        34.00,
        'Generous entree plate',
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Halal', 'Gluten-Free']),
        JSON.stringify(['Dairy']),
        680,
        1,
        4
      ],
      [
        'Pan-Seared Chilean Sea Bass',
        'pan-seared-chilean-sea-bass',
        2,
        'Crispy skin sea bass fillet glazed with saffron beurre blanc, served over sweet pea risotto and asparagus tips.',
        38.00,
        'Generous entree plate',
        'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Pescatarian', 'Gluten-Free', 'Halal']),
        JSON.stringify(['Fish', 'Dairy']),
        520,
        1,
        5
      ],
      [
        'Rosemary Roasted Supreme of Chicken',
        'rosemary-roasted-supreme-of-chicken',
        2,
        'Free-range chicken supreme infused with fresh rosemary and garlic butter, accompanied by roasted baby carrots and thyme jus.',
        26.00,
        'Generous entree plate',
        'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Halal', 'Gluten-Free']),
        JSON.stringify(['Dairy']),
        510,
        0,
        6
      ],

      // Rice & Biryani (cat_id: 3)
      [
        'Royal Awadhi Lamb Dum Biryani',
        'royal-awadhi-lamb-dum-biryani',
        3,
        'Fragrant aged basmati rice layered with tender marinated lamb shank pieces, saffron, fried onions, and whole spices, sealed under pastry seal.',
        24.00,
        'Generous serving with Raita',
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Halal']),
        JSON.stringify(['Dairy']),
        620,
        1,
        7
      ],
      [
        'Saffron Persian Jeweled Rice',
        'saffron-persian-jeweled-rice',
        3,
        'Fluffy saffron rice accented with barberries, toasted pistachios, slivered almonds, candied orange peel, and pure butter.',
        14.00,
        'Per portion',
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Vegetarian', 'Gluten-Free', 'Halal']),
        JSON.stringify(['Nuts', 'Dairy']),
        340,
        0,
        8
      ],

      // BBQ & Grilled Food (cat_id: 4)
      [
        'Chargrilled Mediterranean Lamb Chops',
        'chargrilled-mediterranean-lamb-chops',
        4,
        'Tender pasture-raised lamb chops marinated in wild oregano, garlic, lemon, and olive oil, char-grilled over open coals.',
        32.00,
        '3 double chops per guest',
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Halal', 'Gluten-Free', 'Dairy-Free']),
        JSON.stringify([]),
        580,
        1,
        9
      ],
      [
        'Herb-Infused Grilled Chicken Brochettes',
        'herb-infused-grilled-chicken-brochettes',
        4,
        'Skewers of succulent chicken breast with bell peppers and red onion, basted with garlic butter and smoked paprika.',
        18.00,
        '2 skewers per guest',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Halal', 'Gluten-Free']),
        JSON.stringify(['Dairy']),
        420,
        0,
        10
      ],

      // Pasta & Italian Food (cat_id: 5)
      [
        'Wild Porcini & Black Truffle Tagliatelle',
        'wild-porcini-black-truffle-tagliatelle',
        5,
        'Hand-rolled egg tagliatelle tossed in rich Parmigiano-Reggiano fonduta, sauteed wild porcini mushrooms, and shaved Italian truffles.',
        25.00,
        'Plated course',
        'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Vegetarian']),
        JSON.stringify(['Gluten', 'Dairy', 'Eggs']),
        540,
        1,
        11
      ],

      // Salads (cat_id: 6)
      [
        'Burrata Caprese with Heirloom Tomatoes',
        'burrata-caprese-with-heirloom-tomatoes',
        6,
        'Creamy artisanal Puglia burrata, colorful vine-ripened heirloom tomatoes, fresh basil leaves, aged balsamic reduction, and extra virgin olive oil.',
        14.00,
        'Individual salad plate',
        'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Vegetarian', 'Gluten-Free']),
        JSON.stringify(['Dairy']),
        290,
        1,
        12
      ],

      // Desserts (cat_id: 7)
      [
        'Belgian Dark Chocolate Ganache Tart',
        'belgian-dark-chocolate-ganache-tart',
        7,
        '70% Valrhona dark chocolate silk ganache in crisp butter pastry, finished with sea salt crystals and raspberry coulis.',
        11.00,
        'Individual dessert',
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Vegetarian']),
        JSON.stringify(['Dairy', 'Gluten', 'Eggs']),
        380,
        1,
        13
      ],

      // Beverages (cat_id: 8)
      [
        'Cucumber Mint Elderflower Spritzer',
        'cucumber-mint-elderflower-spritzer',
        8,
        'Sparkling artisanal spritzer made with pressed English cucumbers, fresh garden mint, elderflower cordial, and Sicilian lemon twist.',
        6.50,
        'Cocktail glass',
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Vegan', 'Halal', 'Gluten-Free']),
        JSON.stringify([]),
        85,
        0,
        14
      ],

      // Vegetarian Options (cat_id: 9)
      [
        'Roasted Butternut Squash & Goat Cheese Ravioli',
        'roasted-butternut-squash-goat-cheese-ravioli',
        9,
        'Handmade ravioli filled with caramelized butternut squash and creamy chevre, in brown butter sage reduction with toasted pine nuts.',
        22.00,
        'Main course portion',
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Vegetarian']),
        JSON.stringify(['Dairy', 'Gluten', 'Nuts', 'Eggs']),
        490,
        1,
        15
      ],

      // Special Dietary Options (cat_id: 10)
      [
        'Miso Glazed Tofu & King Oyster Mushroom (Vegan & GF)',
        'miso-glazed-tofu-king-oyster-mushroom',
        10,
        'Organic braised tofu and pan-seared king oyster mushrooms glazed in sweet white miso, served over forbidden black rice and steamed bok choy.',
        23.00,
        'Main course portion',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        JSON.stringify(['Vegan', 'Vegetarian', 'Gluten-Free', 'Halal', 'Dairy-Free']),
        JSON.stringify(['Soy']),
        380,
        1,
        16
      ]
    ];

    for (const item of items) {
      await run(`
        INSERT INTO menu_items (
          name, slug, category_id, description, price, portion_size,
          image_url, dietary_tags, allergens, calories, is_featured, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, item);
    }
  }

  // 5. Check & Seed Packages
  const pkgCount = await get(`SELECT COUNT(*) as count FROM packages`);
  if (pkgCount.count === 0) {
    const packages = [
      [
        'Basic Catering Package',
        'basic-catering-package',
        28.00,
        25,
        250,
        3,
        'Perfect for office gatherings, informal birthdays, and community meetings. Wholesome, delicious, and easy to enjoy.',
        JSON.stringify([
          'Choice of 2 Signature Starters',
          'Choice of 1 Main Course (Poultry or Pasta)',
          '1 Organic Tossed Salad',
          'Fresh Bread & Butter Basket',
          'Mini Dessert Assortment',
          'Chilled Fruit Infused Water'
        ]),
        JSON.stringify([
          'Standard Buffet Chafing Dishes & Serving Utensils',
          'Eco-Friendly Bio-Degradable Plates & Cutlery',
          'Food Delivery & Setup on Time'
        ]),
        'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
        'Popular for Casual Events',
        0,
        1
      ],
      [
        'Standard Catering Package',
        'standard-catering-package',
        45.00,
        20,
        400,
        4,
        'Our most versatile package for corporate lunches, engagement parties, and milestone anniversaries. Elevated dining with full service.',
        JSON.stringify([
          'Choice of 3 Gourmet Passed Hors D\'oeuvres',
          'Choice of 2 Main Entrees (Meat, Fish, or Veg)',
          'Gourmet Side Dish & Rice / Roasted Potatoes',
          'Artisan Burrata or Mediterranean Salad',
          '2 Handcrafted Dessert Choices',
          'Specialty Mocktail & Beverage Station'
        ]),
        JSON.stringify([
          'Polished Stainless Chafing Dishes & Serving Sets',
          'China Plates, Stainless Cutlery & Linen Napkins',
          'On-Site Buffet Attendant (Up to 3 Hours)',
          'Complete Setup and Breakdown'
        ]),
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
        'Most Popular',
        1,
        2
      ],
      [
        'Premium Catering Package',
        'premium-catering-package',
        68.00,
        15,
        500,
        5,
        'An opulent culinary affair designed for VIP galas, luxury weddings, and executive banquets. Chef-crafted fine dining.',
        JSON.stringify([
          'Selection of 4 Luxury Canapés (Truffle, Caviar, Wagyu)',
          'First Course: Gourmet Seafood or Seasonal Soup',
          'Choice of 2 Prime Entrees (Chilean Sea Bass, Braised Short Ribs)',
          'Gourmet Saffron Pilaf & Charred Asparagus',
          'Artisan Plated Dessert Trio',
          'Specialty Espresso, Tea & Mocktail Bar'
        ]),
        JSON.stringify([
          'Full Silverware, Fine Porcelain & Glassware',
          'Uniformed Professional Waitstaff & Bartender',
          'Table Setup with Elegant Menu Cards',
          'Full Event Coordination & Kitchen Team'
        ]),
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
        'Luxury Choice',
        1,
        3
      ],
      [
        'Wedding Elegance Package',
        'wedding-elegance-package',
        85.00,
        50,
        600,
        5,
        'Comprehensive, stress-free wedding catering with tasting session, cocktail hour, plated or luxury buffet dinner, and midnight snack station.',
        JSON.stringify([
          '1-Hour Cocktail Reception with 5 Passed Canapés',
          'Artisan Grazing Table with Cheeses, Charcuterie & Fruits',
          'Dual-Entree Plated Dinner (Beef & Fish or Veg Option)',
          'Decadent Wedding Dessert Bar & Petit Fours',
          'Midnight Poutine or Sliders Snack Station',
          'Complimentary Menu Tasting for Bride & Groom'
        ]),
        JSON.stringify([
          'Dedicated Wedding Maitre D\' and Banquet Captain',
          '1 Waitstaff per 15 Guests for Flawless Plated Service',
          'Floor-Length Table Linens, Chargers & Crystal Glassware',
          'Full Clean-up & Trash Removal'
        ]),
        'https://images.unsplash.com/photo-1519225438858-a57962c640d2?auto=format&fit=crop&w=800&q=80',
        'All-Inclusive Wedding',
        1,
        4
      ],
      [
        'Executive Corporate Package',
        'executive-corporate-package',
        38.00,
        15,
        300,
        3,
        'Designed specifically for board meetings, conferences, product launches, and seminars with punctual delivery and spotless presentation.',
        JSON.stringify([
          'Individually Boxed Gourmet Meals or Hot Buffet Option',
          'Choice of Chicken, Salmon, or Vegan Bowls',
          'Fresh Cut Fruit Platters & Artisan Brownies',
          'Continuous Coffee & Tea Station with Condiments',
          'Assorted Sparkling & Still Waters'
        ]),
        JSON.stringify([
          'Express Delivery & Discreet Setup 30 Mins Before Start',
          'Executive Serving Display with Heating Equipment',
          'Complete Eco-Friendly Compostable Tableware'
        ]),
        'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
        'Corporate Favorite',
        0,
        5
      ],
      [
        'Custom Bespoke Package',
        'custom-bespoke-package',
        50.00,
        10,
        1000,
        0,
        'Total culinary freedom. Collaborate directly with our Executive Chef to craft a 100% custom menu reflecting your cultural traditions and theme.',
        JSON.stringify([
          'Fully Customizable Courses & Portions',
          'Interactive Live Cooking Stations (Pasta, BBQ, Carving, Paella)',
          'Themed Culinary Displays & Signature Cocktails',
          'Specialty Dietary Menus (Halal, Kosher-Style, Vegan, Keto)'
        ]),
        JSON.stringify([
          'Personalized Culinary Consultation & Menu Tasting',
          'Custom Equipment & Furniture Rental Coordination',
          'Flexible Staffing Levels Tailored to Event Scale'
        ]),
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
        'Tailored to You',
        0,
        6
      ]
    ];

    for (const pkg of packages) {
      await run(`
        INSERT INTO packages (
          name, slug, price_per_person, min_guests, max_guests, courses_count,
          description, included_items_json, included_services_json, image_url,
          badge, is_featured, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, pkg);
    }
  }

  // 6. Check & Seed Initial Inquiries & Sample Quotations
  const inqCount = await get(`SELECT COUNT(*) as count FROM inquiries`);
  if (inqCount.count === 0) {
    const sampleInquiries = [
      [
        'CAT-2026-1041',
        'Victoria Kensington',
        'victoria.k@kensingtongroup.ca',
        '+1 (416) 555-4921',
        '+1 (416) 555-4921',
        'Kensington Real Estate',
        'Corporate Gala & Awards Night',
        '2026-12-14',
        '18:30',
        'The Carlu, 444 Yonge St, Toronto',
        120,
        0,
        'Corporate Catering',
        2,
        'Standard Catering Package',
        JSON.stringify(['Truffle Wild Mushroom Arancini', 'Pan-Seared Chilean Sea Bass', 'Belgian Dark Chocolate Ganache Tart']),
        JSON.stringify(['Halal', 'Vegetarian']),
        '2 guests have severe peanut allergies.',
        'VIP table for executives with dedicated wine pouring.',
        JSON.stringify(['Waiter Service', 'Buffet Setup', 'Plates and Cutlery', 'Table Setup']),
        6500.00,
        'Bank Transfer',
        'Quotation Sent',
        'Chef George',
        'Client reviewed budget. Sent customized quote Q-2026-1001 with 10% holiday concession.'
      ],
      [
        'CAT-2026-1042',
        'Marcus & Elena Vance',
        'elena.vance@gmail.com',
        '+1 (647) 555-8930',
        '+1 (647) 555-8930',
        '',
        'Wedding Catering',
        '2026-12-28',
        '17:00',
        'Arlington Estate, Kleinburg, ON',
        150,
        0,
        'Wedding Catering',
        4,
        'Wedding Elegance Package',
        JSON.stringify(['Smoked Salmon Blinis with Caviar', 'Slow-Braised Prime Beef Short Ribs', 'Pan-Seared Chilean Sea Bass']),
        JSON.stringify(['Halal', 'Gluten-Free']),
        'Gluten-free entrees needed for 12 guests.',
        'Would like a live carving station during cocktail hour.',
        JSON.stringify(['Waiter Service', 'Buffet Setup', 'Table Setup', 'Food Decoration', 'Plates and Cutlery', 'Live Cooking Station']),
        14000.00,
        'Credit Card',
        'Confirmed',
        'Elena Vance',
        'Deposit paid ($4,200). Menu tasting completed on Nov 15th with 5/5 ratings.'
      ],
      [
        'CAT-2026-1043',
        'David Chen',
        'david.chen@nexustech.io',
        '+1 (416) 555-7123',
        '+1 (416) 555-7123',
        'Nexus Technologies',
        'Product Launch Reception',
        '2026-12-05',
        '12:00',
        'MaRS Discovery District, 101 College St, Toronto',
        75,
        0,
        'Buffet Catering',
        5,
        'Executive Corporate Package',
        JSON.stringify(['Rosemary Roasted Supreme of Chicken', 'Burrata Caprese with Heirloom Tomatoes']),
        JSON.stringify(['Vegan', 'Halal']),
        'No shellfish.',
        'Prompt delivery required at 11:30 sharp.',
        JSON.stringify(['Food Delivery', 'Buffet Setup', 'Plates and Cutlery']),
        3200.00,
        'Credit Card / Bank Transfer',
        'New Inquiry',
        '',
        'Awaiting initial review from event coordinator.'
      ]
    ];

    for (const inq of sampleInquiries) {
      await run(`
        INSERT INTO inquiries (
          reference_no, customer_name, customer_email, customer_phone, customer_whatsapp,
          company_name, event_type, event_date, event_time, venue_address,
          guest_count, is_outdoor, service_type, package_id, package_name,
          selected_items_json, dietary_requirements_json, allergies_notes,
          special_instructions, additional_services_json, estimated_budget,
          preferred_payment_method, status, assigned_to, internal_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, inq);
    }

    // Seed Sample Quotation for CAT-2026-1041
    const inq1 = await get(`SELECT id FROM inquiries WHERE reference_no = 'CAT-2026-1041'`);
    if (inq1) {
      const lineItems = [
        { name: 'Standard Catering Package (120 Guests)', qty: 120, unitPrice: 45.00, total: 5400.00 },
        { name: 'Professional Uniformed Waitstaff (4 Staff x 5 Hours)', qty: 4, unitPrice: 175.00, total: 700.00 },
        { name: 'Full Porcelain Dinnerware & Silverware Rental', qty: 120, unitPrice: 4.50, total: 540.00 },
        { name: 'Buffet Warming Equipment & Delivery Setup', qty: 1, unitPrice: 250.00, total: 250.00 }
      ];
      const subtotal = 6890.00;
      const discount = 390.00; // Special holiday discount
      const taxableSubtotal = subtotal - discount;
      const tax = taxableSubtotal * 0.13; // 845.00
      const grandTotal = taxableSubtotal + tax; // 7345.00
      const deposit = grandTotal * 0.30; // 2203.50

      await run(`
        INSERT INTO quotations (
          quotation_number, inquiry_id, customer_name, customer_email, customer_phone,
          event_date, guest_count, line_items_json, subtotal, delivery_fee, setup_fee,
          staffing_fee, discount_amount, tax_rate, tax_amount, grand_total, deposit_required,
          terms_conditions, valid_until, status, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        'Q-2026-1001',
        inq1.id,
        'Victoria Kensington',
        'victoria.k@kensingtongroup.ca',
        '+1 (416) 555-4921',
        '2026-12-14',
        120,
        JSON.stringify(lineItems),
        subtotal,
        150.00,
        100.00,
        700.00,
        discount,
        13.0,
        tax,
        grandTotal,
        deposit,
        'Quotation valid for 14 days from issue date. A 30% deposit secures the date. Balance due 7 days prior to event.',
        '2026-12-01',
        'Sent'
      ]);
    }
  }

  // 7. Check & Seed Testimonials
  const testCount = await get(`SELECT COUNT(*) as count FROM testimonials`);
  if (testCount.count === 0) {
    const testimonials = [
      [
        'Sarah & Michael Sterling',
        '',
        'Wedding Reception',
        5,
        'Grand Heritage Catering made our wedding reception magical! The slow-braised short ribs melted in your mouth, and the sea bass was cooked to perfection. Our 160 guests are still talking about the food three weeks later. The staff was impeccably dressed, courteous, and attentive.',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        'October 2026',
        1,
        1
      ],
      [
        'Arthur Pendelton',
        'Global Horizon Wealth',
        'Annual Shareholders Gala',
        5,
        'Flawless execution from initial inquiry to midnight teardown. Catering for 350 high-net-worth investors requires zero mistakes, and Grand Heritage delivered top-tier gastronomy. The truffle arancini and passed cocktails set an incredible tone.',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        'November 2026',
        1,
        1
      ],
      [
        'Claire Dubois',
        'Dubois Design Studio',
        '50th Milestone Birthday Celebration',
        5,
        'The bespoke Mediterranean menu created by Chef was a huge hit! They accommodated all our gluten-free and vegan guests without sacrificing flavor. Booking and quote approval online through the portal was effortless.',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        'September 2026',
        1,
        1
      ],
      [
        'Julian Morales',
        'Apex Tech Ventures',
        'Tech Conference & Executive Luncheon',
        5,
        'Punctual, professional, and delicious. Boxed corporate lunches were fresh, beautifully packaged, and clearly labeled with dietary allergens. We have made Grand Heritage our exclusive caterer for all corporate events.',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        'August 2026',
        1,
        0
      ]
    ];

    for (const test of testimonials) {
      await run(`
        INSERT INTO testimonials (
          customer_name, company, event_type, rating, review_text, photo_url, event_date, is_approved, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, test);
    }
  }

  // 8. Check & Seed Gallery Items
  const galCount = await get(`SELECT COUNT(*) as count FROM gallery_items`);
  if (galCount.count === 0) {
    const galleryItems = [
      ['Opulent Wedding Table Setting', 'wedding', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', 'Crystal glassware and golden charger plates for an intimate 120-guest wedding.', 1],
      ['Artisan Passed Canapés', 'presentation', 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=1200&q=80', 'Chef-crafted truffle arancini and smoked salmon appetizers.', 2],
      ['Corporate Executive Gala', 'corporate', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80', 'Seated multi-course banquet dinner at Toronto Metro Convention Centre.', 3],
      ['Charcuterie & Grazing Table', 'buffet', 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80', '16-foot artisan grazing display with imported cheeses, cured meats, and fresh figs.', 4],
      ['Outdoor Garden Celebration', 'outdoor', 'https://images.unsplash.com/photo-1519225438858-a57962c640d2?auto=format&fit=crop&w=1200&q=80', 'Sunlit garden marquee with family-style roasted skewers and seasonal salads.', 5],
      ['Chef Plating Masterpiece', 'presentation', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', 'Slow-braised short ribs receiving a velvety demi-glace drizzle.', 6],
      ['Handcrafted Dessert Buffet', 'desserts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80', 'Valrhona chocolate tarts, pistachio macarons, and fresh berry tartlets.', 7],
      ['Vibrant Birthday Soirée', 'birthday', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80', 'Festive banquet table adorned with floral centerpieces and personalized menus.', 8]
    ];

    for (const gal of galleryItems) {
      await run(`
        INSERT INTO gallery_items (title, category, image_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
      `, gal);
    }
  }

  // 9. Check & Seed FAQs
  const faqCount = await get(`SELECT COUNT(*) as count FROM faqs`);
  if (faqCount.count === 0) {
    const faqs = [
      [
        'How far in advance should we book catering for our event?',
        'For weddings and large galas (100+ guests), we recommend booking 3 to 9 months in advance to guarantee your preferred date. For corporate luncheons and private dinners, 1 to 2 weeks notice is generally sufficient, though we do accommodate last-minute requests when our schedule permits.',
        'General',
        1
      ],
      [
        'How does your quotation and booking process work?',
        'Simply complete our online quote request with your event details and preferred menu. Our catering directors review availability and send an itemized quotation within 24 hours. You can review and accept the quotation online through our Customer Portal. A 30% deposit secures your booking.',
        'Booking',
        2
      ],
      [
        'Can you accommodate dietary restrictions and allergies?',
        'Absolutely. We cater extensively for Halal, Kosher-style, Gluten-Free, Vegan, Vegetarian, Dairy-Free, and Nut-Free requirements. All dietary meals are prepped in dedicated sanitized stations and individually labeled to avoid cross-contamination.',
        'Menu',
        3
      ],
      [
        'Do you provide service staff, bartenders, and rental tableware?',
        'Yes! We are a full-service catering company. We provide certified professional waitstaff, banquet captains, bartenders, as well as full china tableware, silverware, wine glasses, linen napkins, chafing equipment, and bar setups.',
        'Services',
        4
      ],
      [
        'What is your cancellation and rescheduling policy?',
        'We understand event plans can change. Cancellations made 14 days or more before the event receive a full refund of deposit or complimentary date rescheduling. Cancellations within 7-13 days forfeit 50% of deposit to cover committed fresh ingredient sourcing.',
        'Policy',
        5
      ],
      [
        'Is menu tasting available before confirming our booking?',
        'Yes, for events with 50 or more guests or our Wedding Elegance package, we provide a private chef tasting session for up to 4 guests. Tasting fees are credited back upon confirmation of your catering contract.',
        'Menu',
        6
      ]
    ];

    for (const f of faqs) {
      await run(`
        INSERT INTO faqs (question, answer, category, display_order)
        VALUES (?, ?, ?, ?)
      `, f);
    }
  }

  // 10. Check & Seed Customers
  const custCount = await get(`SELECT COUNT(*) as count FROM customers`);
  if (custCount.count === 0) {
    const customers = [
      ['Victoria Kensington', 'victoria.k@kensingtongroup.ca', '+1 (416) 555-4921', '+1 (416) 555-4921', 'Kensington Real Estate', '444 Yonge St, Toronto', 'Frequent corporate client. Prefers premium seafood entrees.'],
      ['Marcus Vance', 'elena.vance@gmail.com', '+1 (647) 555-8930', '+1 (647) 555-8930', '', '128 Queen St W, Kleinburg', 'Bride & Groom for Dec 2026 wedding.'],
      ['David Chen', 'david.chen@nexustech.io', '+1 (416) 555-7123', '+1 (416) 555-7123', 'Nexus Technologies', '101 College St, Toronto', 'Quarterly board meeting organizer. Fast invoicing requested.']
    ];

    for (const c of customers) {
      await run(`
        INSERT INTO customers (name, email, phone, whatsapp, company, address, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, c);
    }
  }

  console.log('✅ Catering database tables initialized and pre-seeded successfully.');
}

module.exports = {
  db,
  query,
  get,
  run,
  exec,
  initDB
};
