/**
 * Grand Heritage Catering - Static Seed Data & GitHub Pages Offline Fallback Engine
 * Guarantees 100% interactive functionality on GitHub Pages, offline demos, and standalone hosting.
 */

const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Starters & Appetizers', slug: 'starters-appetizers', item_count: 3 },
  { id: 2, name: 'Main Courses', slug: 'main-courses', item_count: 3 },
  { id: 3, name: 'Rice & Biryani', slug: 'rice-biryani', item_count: 2 },
  { id: 4, name: 'BBQ & Grilled Food', slug: 'bbq-grilled-food', item_count: 2 },
  { id: 5, name: 'Pasta & Italian Food', slug: 'pasta-italian-food', item_count: 1 },
  { id: 6, name: 'Salads', slug: 'salads', item_count: 1 },
  { id: 7, name: 'Desserts', slug: 'desserts', item_count: 1 },
  { id: 8, name: 'Beverages', slug: 'beverages', item_count: 1 },
  { id: 9, name: 'Vegetarian Options', slug: 'vegetarian-options', item_count: 1 },
  { id: 10, name: 'Special Dietary Options', slug: 'special-dietary-options', item_count: 1 }
];

const FALLBACK_MENU = [
  {
    id: 1,
    name: 'Truffle Wild Mushroom Arancini',
    slug: 'truffle-wild-mushroom-arancini',
    category_id: 1,
    category_name: 'Starters & Appetizers',
    category_slug: 'starters-appetizers',
    description: 'Crispy golden risotto spheres infused with black truffle oil, wild forest mushrooms, and aged parmesan fondue dip.',
    price: 12.50,
    portion_size: '4 pieces per guest',
    image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegetarian'],
    allergens: ['Dairy', 'Gluten'],
    calories: 320,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 2,
    name: 'Smoked Salmon Blinis with Caviar',
    slug: 'smoked-salmon-blinis-with-caviar',
    category_id: 1,
    category_name: 'Starters & Appetizers',
    category_slug: 'starters-appetizers',
    description: 'House-cured Atlantic smoked salmon on warm buckwheat blinis with dill creme fraiche and lemon zest.',
    price: 15.00,
    portion_size: '3 pieces per guest',
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Pescatarian', 'Halal'],
    allergens: ['Fish', 'Dairy', 'Gluten'],
    calories: 240,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 3,
    name: 'Charred Wagyu Beef Crostini',
    slug: 'charred-wagyu-beef-crostini',
    category_id: 1,
    category_name: 'Starters & Appetizers',
    category_slug: 'starters-appetizers',
    description: 'Seared thinly sliced Wagyu beef on garlic sourdough crostini topped with horseradish emulsion and microgreens.',
    price: 16.50,
    portion_size: '3 pieces per guest',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Halal'],
    allergens: ['Gluten', 'Dairy'],
    calories: 280,
    is_featured: 0,
    is_available: 1
  },
  {
    id: 4,
    name: 'Slow-Braised Prime Beef Short Ribs',
    slug: 'slow-braised-prime-beef-short-ribs',
    category_id: 2,
    category_name: 'Main Courses',
    category_slug: 'main-courses',
    description: '12-hour braised bone-in beef short rib served with caramelized shallot jus, roasted root vegetables, and silky potato purée.',
    price: 34.00,
    portion_size: 'Generous entree plate',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Halal', 'Gluten-Free'],
    allergens: ['Dairy'],
    calories: 680,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 5,
    name: 'Pan-Seared Chilean Sea Bass',
    slug: 'pan-seared-chilean-sea-bass',
    category_id: 2,
    category_name: 'Main Courses',
    category_slug: 'main-courses',
    description: 'Crispy skin sea bass fillet glazed with saffron beurre blanc, served over sweet pea risotto and asparagus tips.',
    price: 38.00,
    portion_size: 'Generous entree plate',
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Pescatarian', 'Gluten-Free', 'Halal'],
    allergens: ['Fish', 'Dairy'],
    calories: 520,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 6,
    name: 'Rosemary Roasted Supreme of Chicken',
    slug: 'rosemary-roasted-supreme-of-chicken',
    category_id: 2,
    category_name: 'Main Courses',
    category_slug: 'main-courses',
    description: 'Free-range chicken supreme infused with fresh rosemary and garlic butter, accompanied by roasted baby carrots and thyme jus.',
    price: 26.00,
    portion_size: 'Generous entree plate',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Halal', 'Gluten-Free'],
    allergens: ['Dairy'],
    calories: 510,
    is_featured: 0,
    is_available: 1
  },
  {
    id: 7,
    name: 'Royal Awadhi Lamb Dum Biryani',
    slug: 'royal-awadhi-lamb-dum-biryani',
    category_id: 3,
    category_name: 'Rice & Biryani',
    category_slug: 'rice-biryani',
    description: 'Fragrant aged basmati rice layered with tender marinated lamb shank pieces, saffron, fried onions, and whole spices, sealed under pastry seal.',
    price: 24.00,
    portion_size: 'Generous serving with Raita',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Halal'],
    allergens: ['Dairy'],
    calories: 620,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 8,
    name: 'Saffron Persian Jeweled Rice',
    slug: 'saffron-persian-jeweled-rice',
    category_id: 3,
    category_name: 'Rice & Biryani',
    category_slug: 'rice-biryani',
    description: 'Fluffy saffron rice accented with barberries, toasted pistachios, slivered almonds, candied orange peel, and pure butter.',
    price: 14.00,
    portion_size: 'Per portion',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegetarian', 'Gluten-Free', 'Halal'],
    allergens: ['Nuts', 'Dairy'],
    calories: 340,
    is_featured: 0,
    is_available: 1
  },
  {
    id: 9,
    name: 'Chargrilled Mediterranean Lamb Chops',
    slug: 'chargrilled-mediterranean-lamb-chops',
    category_id: 4,
    category_name: 'BBQ & Grilled Food',
    category_slug: 'bbq-grilled-food',
    description: 'Tender pasture-raised lamb chops marinated in wild oregano, garlic, lemon, and olive oil, char-grilled over open coals.',
    price: 32.00,
    portion_size: '3 double chops per guest',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Halal', 'Gluten-Free', 'Dairy-Free'],
    allergens: [],
    calories: 580,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 10,
    name: 'Herb-Infused Grilled Chicken Brochettes',
    slug: 'herb-infused-grilled-chicken-brochettes',
    category_id: 4,
    category_name: 'BBQ & Grilled Food',
    category_slug: 'bbq-grilled-food',
    description: 'Skewers of succulent chicken breast with bell peppers and red onion, basted with garlic butter and smoked paprika.',
    price: 18.00,
    portion_size: '2 skewers per guest',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Halal', 'Gluten-Free'],
    allergens: ['Dairy'],
    calories: 420,
    is_featured: 0,
    is_available: 1
  },
  {
    id: 11,
    name: 'Wild Porcini & Black Truffle Tagliatelle',
    slug: 'wild-porcini-black-truffle-tagliatelle',
    category_id: 5,
    category_name: 'Pasta & Italian Food',
    category_slug: 'pasta-italian-food',
    description: 'Hand-rolled egg tagliatelle tossed in rich Parmigiano-Reggiano fonduta, sauteed wild porcini mushrooms, and shaved Italian truffles.',
    price: 25.00,
    portion_size: 'Plated course',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegetarian'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    calories: 540,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 12,
    name: 'Burrata Caprese with Heirloom Tomatoes',
    slug: 'burrata-caprese-with-heirloom-tomatoes',
    category_id: 6,
    category_name: 'Salads',
    category_slug: 'salads',
    description: 'Creamy artisanal Puglia burrata, colorful vine-ripened heirloom tomatoes, fresh basil leaves, aged balsamic reduction, and extra virgin olive oil.',
    price: 14.00,
    portion_size: 'Individual salad plate',
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegetarian', 'Gluten-Free'],
    allergens: ['Dairy'],
    calories: 290,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 13,
    name: 'Belgian Dark Chocolate Ganache Tart',
    slug: 'belgian-dark-chocolate-ganache-tart',
    category_id: 7,
    category_name: 'Desserts',
    category_slug: 'desserts',
    description: '70% Valrhona dark chocolate silk ganache in crisp butter pastry, finished with sea salt crystals and raspberry coulis.',
    price: 11.00,
    portion_size: 'Individual dessert',
    image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegetarian'],
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    calories: 380,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 14,
    name: 'Cucumber Mint Elderflower Spritzer',
    slug: 'cucumber-mint-elderflower-spritzer',
    category_id: 8,
    category_name: 'Beverages',
    category_slug: 'beverages',
    description: 'Sparkling artisanal spritzer made with pressed English cucumbers, fresh garden mint, elderflower cordial, and Sicilian lemon twist.',
    price: 6.50,
    portion_size: 'Cocktail glass',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegan', 'Halal', 'Gluten-Free'],
    allergens: [],
    calories: 85,
    is_featured: 0,
    is_available: 1
  },
  {
    id: 15,
    name: 'Roasted Butternut Squash & Goat Cheese Ravioli',
    slug: 'roasted-butternut-squash-goat-cheese-ravioli',
    category_id: 9,
    category_name: 'Vegetarian Options',
    category_slug: 'vegetarian-options',
    description: 'Handmade ravioli filled with caramelized butternut squash and creamy chevre, in brown butter sage reduction with toasted pine nuts.',
    price: 22.00,
    portion_size: 'Main course portion',
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegetarian'],
    allergens: ['Dairy', 'Gluten', 'Nuts', 'Eggs'],
    calories: 490,
    is_featured: 1,
    is_available: 1
  },
  {
    id: 16,
    name: 'Miso Glazed Tofu & King Oyster Mushroom (Vegan & GF)',
    slug: 'miso-glazed-tofu-king-oyster-mushroom',
    category_id: 10,
    category_name: 'Special Dietary Options',
    category_slug: 'special-dietary-options',
    description: 'Organic braised tofu and pan-seared king oyster mushrooms glazed in sweet white miso, served over forbidden black rice and steamed bok choy.',
    price: 23.00,
    portion_size: 'Main course portion',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    dietary_tags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Halal', 'Dairy-Free'],
    allergens: ['Soy'],
    calories: 380,
    is_featured: 1,
    is_available: 1
  }
];

const FALLBACK_PACKAGES = [
  {
    id: 1,
    name: 'Basic Catering Package',
    slug: 'basic-catering-package',
    price_per_person: 28.00,
    min_guests: 25,
    max_guests: 250,
    courses_count: 3,
    description: 'Perfect for office gatherings, informal birthdays, and community meetings. Wholesome, delicious, and easy to enjoy.',
    included_items: [
      'Choice of 2 Signature Starters',
      'Choice of 1 Main Course (Poultry or Pasta)',
      '1 Organic Tossed Salad',
      'Fresh Bread & Butter Basket',
      'Mini Dessert Assortment',
      'Chilled Fruit Infused Water'
    ],
    included_services: [
      'Standard Buffet Chafing Dishes & Serving Utensils',
      'Eco-Friendly Bio-Degradable Plates & Cutlery',
      'Food Delivery & Setup on Time'
    ],
    image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    badge: 'Popular for Casual Events',
    is_featured: 0
  },
  {
    id: 2,
    name: 'Standard Catering Package',
    slug: 'standard-catering-package',
    price_per_person: 45.00,
    min_guests: 20,
    max_guests: 400,
    courses_count: 4,
    description: 'Our most versatile package for corporate lunches, engagement parties, and milestone anniversaries. Elevated dining with full service.',
    included_items: [
      'Choice of 3 Gourmet Passed Hors D\'oeuvres',
      'Choice of 2 Main Entrees (Meat, Fish, or Veg)',
      'Gourmet Side Dish & Rice / Roasted Potatoes',
      'Artisan Burrata or Mediterranean Salad',
      '2 Handcrafted Dessert Choices',
      'Specialty Mocktail & Beverage Station'
    ],
    included_services: [
      'Polished Stainless Chafing Dishes & Serving Sets',
      'China Plates, Stainless Cutlery & Linen Napkins',
      'On-Site Buffet Attendant (Up to 3 Hours)',
      'Complete Setup and Breakdown'
    ],
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    badge: 'Most Popular',
    is_featured: 1
  },
  {
    id: 3,
    name: 'Premium Catering Package',
    slug: 'premium-catering-package',
    price_per_person: 68.00,
    min_guests: 15,
    max_guests: 500,
    courses_count: 5,
    description: 'An opulent culinary affair designed for VIP galas, luxury weddings, and executive banquets. Chef-crafted fine dining.',
    included_items: [
      'Selection of 4 Luxury Canapés (Truffle, Caviar, Wagyu)',
      'First Course: Gourmet Seafood or Seasonal Soup',
      'Choice of 2 Prime Entrees (Chilean Sea Bass, Braised Short Ribs)',
      'Gourmet Saffron Pilaf & Charred Asparagus',
      'Artisan Plated Dessert Trio',
      'Specialty Espresso, Tea & Mocktail Bar'
    ],
    included_services: [
      'Full Silverware, Fine Porcelain & Glassware',
      'Uniformed Professional Waitstaff & Bartender',
      'Table Setup with Elegant Menu Cards',
      'Full Event Coordination & Kitchen Team'
    ],
    image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    badge: 'Luxury Choice',
    is_featured: 1
  },
  {
    id: 4,
    name: 'Wedding Elegance Package',
    slug: 'wedding-elegance-package',
    price_per_person: 85.00,
    min_guests: 50,
    max_guests: 600,
    courses_count: 5,
    description: 'Comprehensive, stress-free wedding catering with tasting session, cocktail hour, plated or luxury buffet dinner, and midnight snack station.',
    included_items: [
      '1-Hour Cocktail Reception with 5 Passed Canapés',
      'Artisan Grazing Table with Cheeses, Charcuterie & Fruits',
      'Dual-Entree Plated Dinner (Beef & Fish or Veg Option)',
      'Decadent Wedding Dessert Bar & Petit Fours',
      'Midnight Poutine or Sliders Snack Station',
      'Complimentary Menu Tasting for Bride & Groom'
    ],
    included_services: [
      'Dedicated Wedding Maitre D\' and Banquet Captain',
      '1 Waitstaff per 15 Guests for Flawless Plated Service',
      'Floor-Length Table Linens, Chargers & Crystal Glassware',
      'Full Clean-up & Trash Removal'
    ],
    image_url: 'https://images.unsplash.com/photo-1519225438858-a57962c640d2?auto=format&fit=crop&w=800&q=80',
    badge: 'All-Inclusive Wedding',
    is_featured: 1
  },
  {
    id: 5,
    name: 'Executive Corporate Package',
    slug: 'executive-corporate-package',
    price_per_person: 38.00,
    min_guests: 15,
    max_guests: 300,
    courses_count: 3,
    description: 'Designed specifically for board meetings, conferences, product launches, and seminars with punctual delivery and spotless presentation.',
    included_items: [
      'Individually Boxed Gourmet Meals or Hot Buffet Option',
      'Choice of Chicken, Salmon, or Vegan Bowls',
      'Fresh Cut Fruit Platters & Artisan Brownies',
      'Continuous Coffee & Tea Station with Condiments',
      'Assorted Sparkling & Still Waters'
    ],
    included_services: [
      'Express Delivery & Discreet Setup 30 Mins Before Start',
      'Executive Serving Display with Heating Equipment',
      'Complete Eco-Friendly Compostable Tableware'
    ],
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    badge: 'Corporate Favorite',
    is_featured: 0
  },
  {
    id: 6,
    name: 'Custom Bespoke Package',
    slug: 'custom-bespoke-package',
    price_per_person: 50.00,
    min_guests: 10,
    max_guests: 1000,
    courses_count: 0,
    description: 'Total culinary freedom. Collaborate directly with our Executive Chef to craft a 100% custom menu reflecting your cultural traditions and theme.',
    included_items: [
      'Fully Customizable Courses & Portions',
      'Interactive Live Cooking Stations (Pasta, BBQ, Carving, Paella)',
      'Themed Culinary Displays & Signature Cocktails',
      'Specialty Dietary Menus (Halal, Kosher-Style, Vegan, Keto)'
    ],
    included_services: [
      'Personalized Culinary Consultation & Menu Tasting',
      'Custom Equipment & Furniture Rental Coordination',
      'Flexible Staffing Levels Tailored to Event Scale'
    ],
    image_url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    badge: 'Tailored to You',
    is_featured: 0
  }
];

const FALLBACK_TESTIMONIALS = [
  {
    customer_name: 'Sarah & Michael Sterling',
    company: '',
    event_type: 'Wedding Reception',
    rating: 5,
    review_text: 'Grand Heritage Catering made our wedding reception magical! The slow-braised short ribs melted in your mouth, and the sea bass was cooked to perfection. Our 160 guests are still talking about the food three weeks later.',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    customer_name: 'Arthur Pendelton',
    company: 'Global Horizon Wealth',
    event_type: 'Annual Shareholders Gala',
    rating: 5,
    review_text: 'Flawless execution from initial inquiry to midnight teardown. Catering for 350 high-net-worth investors requires zero mistakes, and Grand Heritage delivered top-tier gastronomy. The truffle arancini and passed cocktails set an incredible tone.',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    customer_name: 'Claire Dubois',
    company: 'Dubois Design Studio',
    event_type: '50th Milestone Birthday Celebration',
    rating: 5,
    review_text: 'The bespoke Mediterranean menu created by Chef was a huge hit! They accommodated all our gluten-free and vegan guests without sacrificing flavor. Booking and quote approval online through the portal was effortless.',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    customer_name: 'Julian Morales',
    company: 'Apex Tech Ventures',
    event_type: 'Tech Conference Luncheon',
    rating: 5,
    review_text: 'Punctual, professional, and delicious. Boxed corporate lunches were fresh, beautifully packaged, and clearly labeled with dietary allergens. We have made Grand Heritage our exclusive caterer.',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  }
];

const FALLBACK_GALLERY = [
  { title: 'Opulent Wedding Table Setting', category: 'wedding', image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80', caption: 'Crystal glassware and golden charger plates for an intimate 120-guest wedding.' },
  { title: 'Artisan Passed Canapés', category: 'presentation', image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=1200&q=80', caption: 'Chef-crafted truffle arancini and smoked salmon appetizers.' },
  { title: 'Corporate Executive Gala', category: 'corporate', image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80', caption: 'Seated multi-course banquet dinner at Toronto Metro Convention Centre.' },
  { title: 'Charcuterie & Grazing Table', category: 'buffet', image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80', caption: '16-foot artisan grazing display with imported cheeses, cured meats, and fresh figs.' },
  { title: 'Outdoor Garden Celebration', category: 'outdoor', image_url: 'https://images.unsplash.com/photo-1519225438858-a57962c640d2?auto=format&fit=crop&w=1200&q=80', caption: 'Sunlit garden marquee with family-style roasted skewers and seasonal salads.' },
  { title: 'Chef Plating Masterpiece', category: 'presentation', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', caption: 'Slow-braised short ribs receiving a velvety demi-glace drizzle.' },
  { title: 'Handcrafted Dessert Buffet', category: 'desserts', image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80', caption: 'Valrhona chocolate tarts, pistachio macarons, and fresh berry tartlets.' },
  { title: 'Vibrant Birthday Soirée', category: 'birthday', image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80', caption: 'Festive banquet table adorned with floral centerpieces and personalized menus.' }
];

const FALLBACK_INQUIRIES = {
  'CAT-2026-1041': {
    reference_no: 'CAT-2026-1041',
    customer_name: 'Victoria Kensington',
    customer_email: 'victoria.k@kensingtongroup.ca',
    customer_phone: '+1 (416) 555-4921',
    company_name: 'Kensington Real Estate',
    event_type: 'Corporate Gala & Awards Night',
    event_date: '2026-12-14',
    event_time: '18:30',
    venue_address: 'The Carlu, 444 Yonge St, Toronto',
    guest_count: 120,
    is_outdoor: 0,
    service_type: 'Corporate Catering',
    status: 'Quotation Sent',
    estimated_budget: 6500.00,
    quotation: {
      quotation_number: 'Q-2026-1001',
      valid_until: '2026-12-01',
      subtotal: 6890.00,
      tax_rate: 13.0,
      tax_amount: 845.00,
      grand_total: 7345.00,
      deposit_required: 2203.50,
      status: 'Sent',
      line_items: [
        { name: 'Standard Catering Package (120 Guests)', qty: 120, unitPrice: 45.00, total: 5400.00 },
        { name: 'Professional Uniformed Waitstaff (4 Staff x 5 Hours)', qty: 4, unitPrice: 175.00, total: 700.00 },
        { name: 'Full Porcelain Dinnerware & Silverware Rental', qty: 120, unitPrice: 4.50, total: 540.00 },
        { name: 'Buffet Warming Equipment & Delivery Setup', qty: 1, unitPrice: 250.00, total: 250.00 }
      ]
    }
  }
};


const FALLBACK_ADMIN = {
  stats: {
    total_inquiries: 28,
    new_inquiries: 6,
    confirmed_bookings: 17,
    total_pipeline_revenue: 78500.00,
    total_menu_items: 20,
    active_packages: 6,
    average_guest_count: 94
  },
  inquiries: [
    {
      id: 1,
      reference_no: 'CAT-2026-1041',
      customer_name: 'Victoria Kensington',
      customer_email: 'victoria.k@kensingtongroup.ca',
      customer_phone: '+1 (416) 555-4921',
      company_name: 'Kensington Real Estate',
      event_type: 'Corporate Gala & Awards Night',
      event_date: '2026-12-14',
      event_time: '18:30',
      venue_address: 'The Carlu, 444 Yonge St, Toronto',
      guest_count: 120,
      service_type: 'Corporate Catering',
      status: 'Quotation Sent',
      estimated_budget: 6500.00,
      created_at: '2026-11-18 14:20:00'
    },
    {
      id: 2,
      reference_no: 'CAT-2026-1042',
      customer_name: 'David & Amanda Vance',
      customer_email: 'a.vance@gmail.com',
      customer_phone: '+1 (647) 555-8832',
      company_name: '',
      event_type: 'Wedding Catering',
      event_date: '2027-01-22',
      event_time: '16:00',
      venue_address: 'Graydon Hall Manor, Toronto',
      guest_count: 150,
      service_type: 'Wedding Catering',
      status: 'Booking Confirmed',
      estimated_budget: 12800.00,
      created_at: '2026-11-17 10:15:00'
    },
    {
      id: 3,
      reference_no: 'CAT-2026-1043',
      customer_name: 'Elena Rostova',
      customer_email: 'elena.rostova@techsolutions.io',
      customer_phone: '+1 (416) 555-7109',
      company_name: 'TechSolutions Inc',
      event_type: 'Private Party Catering',
      event_date: '2026-12-05',
      event_time: '19:00',
      venue_address: 'Private Residence, Forest Hill',
      guest_count: 45,
      service_type: 'Private Event Catering',
      status: 'New Inquiry',
      estimated_budget: 3200.00,
      created_at: '2026-11-20 09:40:00'
    }
  ],
  quotations: [
    {
      id: 1,
      quotation_number: 'Q-2026-1001',
      inquiry_id: 1,
      customer_name: 'Victoria Kensington',
      customer_email: 'victoria.k@kensingtongroup.ca',
      event_date: '2026-12-14',
      grand_total: 7345.00,
      status: 'Sent',
      created_at: '2026-11-19 11:00:00'
    },
    {
      id: 2,
      quotation_number: 'Q-2026-1002',
      inquiry_id: 2,
      customer_name: 'David & Amanda Vance',
      customer_email: 'a.vance@gmail.com',
      event_date: '2027-01-22',
      grand_total: 12850.00,
      status: 'Accepted',
      created_at: '2026-11-18 16:30:00'
    }
  ],
  customers: [
    { id: 1, full_name: 'Victoria Kensington', email: 'victoria.k@kensingtongroup.ca', phone: '+1 (416) 555-4921', total_inquiries: 1, total_bookings: 0, total_spent: 0.00 },
    { id: 2, full_name: 'David Vance', email: 'a.vance@gmail.com', phone: '+1 (647) 555-8832', total_inquiries: 1, total_bookings: 1, total_spent: 12850.00 },
    { id: 3, full_name: 'Elena Rostova', email: 'elena.rostova@techsolutions.io', phone: '+1 (416) 555-7109', total_inquiries: 1, total_bookings: 0, total_spent: 0.00 }
  ],
  email_logs: [
    { id: 1, recipient_email: 'victoria.k@kensingtongroup.ca', subject: 'Your Catering Quotation Q-2026-1001', template_name: 'quotation_dispatched', status: 'Delivered', created_at: '2026-11-19 11:01:00' },
    { id: 2, recipient_email: 'a.vance@gmail.com', subject: 'Catering Booking Confirmation CAT-2026-1042', template_name: 'booking_confirmed', status: 'Delivered', created_at: '2026-11-18 17:15:00' }
  ]
};
