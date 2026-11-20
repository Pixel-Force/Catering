/**
 * Grand Heritage Catering - Comprehensive Backend API
 * Full RESTful API supporting Public Website, Multi-step Quote Engine,
 * Customer Portal, and Complete Admin CMS Modules
 */

const express = require('express');
const router = express.Router();
const { query, get, run, exec } = require('./db');
const { hashPassword, verifyPassword, generateToken, authenticateAdmin } = require('./auth');

// =========================================================================
// 1. PUBLIC WEBSITE APIS
// =========================================================================

// Public Settings & Business Info
router.get('/settings', async (req, res) => {
  try {
    const rows = await query(`SELECT setting_key, setting_value, category FROM settings`);
    const settings = {};
    rows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Menu Categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(`
      SELECT c.*, COUNT(m.id) as item_count
      FROM categories c
      LEFT JOIN menu_items m ON c.id = m.category_id AND m.is_available = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.display_order ASC
    `);
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Menu Items with filters
router.get('/menu', async (req, res) => {
  try {
    const { category, search, dietary, featured } = req.query;
    let sql = `
      SELECT m.*, c.name as category_name, c.slug as category_slug
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.is_available = 1
    `;
    const params = [];

    if (category && category !== 'all') {
      sql += ` AND (c.slug = ? OR m.category_id = ?)`;
      params.push(category, category);
    }
    if (search) {
      sql += ` AND (LOWER(m.name) LIKE ? OR LOWER(m.description) LIKE ?)`;
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }
    if (dietary && dietary !== 'all') {
      sql += ` AND m.dietary_tags LIKE ?`;
      params.push(`%${dietary}%`);
    }
    if (featured === '1' || featured === 'true') {
      sql += ` AND m.is_featured = 1`;
    }

    sql += ` ORDER BY m.display_order ASC, m.id ASC`;
    const items = await query(sql, params);

    // Parse JSON tags
    const formatted = items.map(item => ({
      ...item,
      dietary_tags: typeof item.dietary_tags === 'string' ? JSON.parse(item.dietary_tags || '[]') : item.dietary_tags,
      allergens: typeof item.allergens === 'string' ? JSON.parse(item.allergens || '[]') : item.allergens
    }));

    res.json({ success: true, count: formatted.length, menu: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catering Packages
router.get('/packages', async (req, res) => {
  try {
    const packages = await query(`
      SELECT * FROM packages
      WHERE is_active = 1
      ORDER BY display_order ASC
    `);
    const formatted = packages.map(pkg => ({
      ...pkg,
      included_items: JSON.parse(pkg.included_items_json || '[]'),
      included_services: JSON.parse(pkg.included_services_json || '[]')
    }));
    res.json({ success: true, packages: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Package Details
router.get('/packages/:slug', async (req, res) => {
  try {
    const pkg = await get(`SELECT * FROM packages WHERE slug = ? OR id = ?`, [req.params.slug, req.params.slug]);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({
      success: true,
      package: {
        ...pkg,
        included_items: JSON.parse(pkg.included_items_json || '[]'),
        included_services: JSON.parse(pkg.included_services_json || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery Items
router.get('/gallery', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = `SELECT * FROM gallery_items`;
    const params = [];
    if (category && category !== 'all') {
      sql += ` WHERE category = ?`;
      params.push(category);
    }
    sql += ` ORDER BY display_order ASC, id ASC`;
    const items = await query(sql, params);
    res.json({ success: true, gallery: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const { featured } = req.query;
    let sql = `SELECT * FROM testimonials WHERE is_approved = 1`;
    if (featured === '1') {
      sql += ` AND is_featured = 1`;
    }
    sql += ` ORDER BY is_featured DESC, id DESC`;
    const testimonials = await query(sql);
    res.json({ success: true, testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Testimonial / Review
router.post('/testimonials', async (req, res) => {
  try {
    const { customer_name, company, event_type, rating, review_text, photo_url } = req.body;
    if (!customer_name || !review_text) {
      return res.status(400).json({ error: 'Name and review text are required.' });
    }

    const result = await run(`
      INSERT INTO testimonials (customer_name, company, event_type, rating, review_text, photo_url, event_date, is_approved, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, 0)
    `, [customer_name, company || '', event_type || 'Private Event', parseInt(rating) || 5, review_text, photo_url || '']);

    res.json({
      success: true,
      id: result.id,
      message: 'Thank you for your review! It has been submitted and will appear after moderation.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FAQs
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await query(`SELECT * FROM faqs ORDER BY display_order ASC, id ASC`);
    res.json({ success: true, faqs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Event Booking / Request a Quote (6-step Wizard)
router.post('/inquiries', async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_whatsapp,
      company_name,
      event_type,
      event_date,
      event_time,
      venue_address,
      guest_count,
      is_outdoor,
      service_type,
      package_id,
      package_name,
      selected_items,
      dietary_requirements,
      allergies_notes,
      special_instructions,
      additional_services,
      estimated_budget,
      preferred_payment_method
    } = req.body;

    // Validation
    if (!customer_name || !customer_email || !customer_phone) {
      return res.status(400).json({ error: 'Please provide full name, email address, and phone number.' });
    }
    if (!event_date || !guest_count || !service_type) {
      return res.status(400).json({ error: 'Please provide event date, expected guest count, and service type.' });
    }

    // Generate unique reference number: CAT-YYYY-XXXX
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const reference_no = `CAT-${year}-${randomNum}`;

    const selectedItemsJson = JSON.stringify(selected_items || []);
    const dietaryJson = JSON.stringify(dietary_requirements || []);
    const servicesJson = JSON.stringify(additional_services || []);

    const result = await run(`
      INSERT INTO inquiries (
        reference_no, customer_name, customer_email, customer_phone, customer_whatsapp,
        company_name, event_type, event_date, event_time, venue_address,
        guest_count, is_outdoor, service_type, package_id, package_name,
        selected_items_json, dietary_requirements_json, allergies_notes,
        special_instructions, additional_services_json, estimated_budget,
        preferred_payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Inquiry')
    `, [
      reference_no,
      customer_name,
      customer_email,
      customer_phone,
      customer_whatsapp || customer_phone,
      company_name || '',
      event_type || 'Special Event',
      event_date,
      event_time || '18:00',
      venue_address || 'TBD',
      parseInt(guest_count) || 20,
      is_outdoor ? 1 : 0,
      service_type,
      package_id || null,
      package_name || '',
      selectedItemsJson,
      dietaryJson,
      allergies_notes || '',
      special_instructions || '',
      servicesJson,
      parseFloat(estimated_budget) || 0,
      preferred_payment_method || 'Credit Card / Bank Transfer'
    ]);

    // Upsert Customer in Customer Directory
    const existingCustomer = await get(`SELECT id FROM customers WHERE email = ?`, [customer_email]);
    if (!existingCustomer) {
      await run(`
        INSERT INTO customers (name, email, phone, whatsapp, company, address, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        customer_name,
        customer_email,
        customer_phone,
        customer_whatsapp || customer_phone,
        company_name || '',
        venue_address || '',
        `Inquiry ${reference_no} created on ${new Date().toLocaleDateString()}`
      ]);
    }

    // Log Simulated Confirmation Email to Customer
    await run(`
      INSERT INTO email_logs (recipient_email, recipient_name, subject, template_name, content_preview, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      customer_email,
      customer_name,
      `Catering Inquiry Received - Reference: ${reference_no}`,
      'customer_inquiry_confirmation',
      `Dear ${customer_name}, thank you for your catering inquiry for your ${event_type} on ${event_date}. Our culinary team is reviewing your requirements and will generate a customized quotation within 24 hours.`,
      'simulated_sent'
    ]);

    // Log Simulated Notification Email to Admin
    await run(`
      INSERT INTO email_logs (recipient_email, recipient_name, subject, template_name, content_preview, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'events@heritagecatering.com',
      'Event Operations Team',
      `🚨 New Catering Inquiry: ${reference_no} - ${customer_name} (${guest_count} Guests)`,
      'admin_new_inquiry_alert',
      `New inquiry received from ${customer_name} (${customer_email}) for ${event_type} on ${event_date} at ${venue_address}. Estimated budget: $${estimated_budget || 'N/A'}.`,
      'simulated_sent'
    ]);

    res.json({
      success: true,
      inquiry_id: result.id,
      reference_no,
      message: 'Your catering inquiry has been successfully submitted! A confirmation has been sent to your email.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contact Form Submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Please provide your name, email, and message.' });
    }

    const result = await run(`
      INSERT INTO contact_messages (name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `, [name, email, phone || '', subject || 'General Inquiry', message]);

    // Log notification
    await run(`
      INSERT INTO email_logs (recipient_email, recipient_name, subject, template_name, content_preview)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'events@heritagecatering.com',
      'Operations Team',
      `New Contact Message from ${name}: ${subject}`,
      'contact_form_notification',
      message.substring(0, 150)
    ]);

    res.json({
      success: true,
      id: result.id,
      message: 'Thank you! Your message has been received. Our team will contact you shortly.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 2. CUSTOMER PORTAL APIS
// =========================================================================

// Lookup inquiry & quote by Reference Number and optional email
router.get('/portal/inquiry/:ref', async (req, res) => {
  try {
    const { ref } = req.params;
    const inquiry = await get(`SELECT * FROM inquiries WHERE reference_no = ?`, [ref.toUpperCase().trim()]);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry reference not found. Please verify your reference number.' });
    }

    // Check for associated quotation
    const quotation = await get(`SELECT * FROM quotations WHERE inquiry_id = ? ORDER BY id DESC LIMIT 1`, [inquiry.id]);

    res.json({
      success: true,
      inquiry: {
        ...inquiry,
        selected_items: JSON.parse(inquiry.selected_items_json || '[]'),
        dietary_requirements: JSON.parse(inquiry.dietary_requirements_json || '[]'),
        additional_services: JSON.parse(inquiry.additional_services_json || '[]')
      },
      quotation: quotation ? {
        ...quotation,
        line_items: JSON.parse(quotation.line_items_json || '[]')
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Accepts or Declines Quotation
router.post('/portal/quotation/:quoteNum/respond', async (req, res) => {
  try {
    const { quoteNum } = req.params;
    const { action, feedback } = req.body; // action: 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be accept or decline.' });
    }

    const quotation = await get(`SELECT * FROM quotations WHERE quotation_number = ?`, [quoteNum]);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found.' });
    }

    const newStatus = action === 'accept' ? 'Accepted' : 'Declined';
    const newInquiryStatus = action === 'accept' ? 'Confirmed' : 'Awaiting Customer Approval';

    await run(`
      UPDATE quotations
      SET status = ?, client_feedback = ?, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, feedback || '', quotation.id]);

    await run(`
      UPDATE inquiries
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newInquiryStatus, quotation.inquiry_id]);

    // Log notification
    await run(`
      INSERT INTO email_logs (recipient_email, recipient_name, subject, template_name, content_preview)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'events@heritagecatering.com',
      'Catering Director',
      `Client Response: Quotation ${quoteNum} has been ${newStatus.toUpperCase()}`,
      'quotation_response_alert',
      `Customer ${quotation.customer_name} has ${newStatus.toLowerCase()} quotation ${quoteNum}. Client Feedback: ${feedback || 'None'}`
    ]);

    res.json({
      success: true,
      message: action === 'accept'
        ? 'Thank you! You have accepted the quotation. Our executive coordinator will reach out to finalize payment and schedule your menu tasting.'
        : 'Thank you for your feedback. Our catering team has been notified and will prepare a revised proposal.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 3. ADMIN AUTHENTICATION
// =========================================================================

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required.' });
    }

    const user = await get(`SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)`, [username, username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', authenticateAdmin, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// =========================================================================
// 4. ADMIN DASHBOARD & CMS MODULES (PROTECTED)
// =========================================================================

// Dashboard Overview KPIs
router.get('/admin/dashboard-stats', authenticateAdmin, async (req, res) => {
  try {
    const totalInquiries = (await get(`SELECT COUNT(*) as count FROM inquiries`)).count;
    const newInquiries = (await get(`SELECT COUNT(*) as count FROM inquiries WHERE status = 'New Inquiry'`)).count;
    const underReview = (await get(`SELECT COUNT(*) as count FROM inquiries WHERE status = 'Under Review'`)).count;
    const pendingQuotes = (await get(`SELECT COUNT(*) as count FROM inquiries WHERE status IN ('Quotation Sent', 'Awaiting Customer Approval')`)).count;
    const confirmedBookings = (await get(`SELECT COUNT(*) as count FROM inquiries WHERE status = 'Confirmed'`)).count;
    const completedEvents = (await get(`SELECT COUNT(*) as count FROM inquiries WHERE status = 'Completed'`)).count;
    const cancelled = (await get(`SELECT COUNT(*) as count FROM inquiries WHERE status = 'Cancelled'`)).count;
    const totalCustomers = (await get(`SELECT COUNT(*) as count FROM customers`)).count;
    const totalMenuItems = (await get(`SELECT COUNT(*) as count FROM menu_items`)).count;
    const totalPackages = (await get(`SELECT COUNT(*) as count FROM packages`)).count;

    // Pipeline Revenue from Confirmed and Sent Quotations
    const pipelineRev = (await get(`
      SELECT SUM(grand_total) as sum FROM quotations WHERE status IN ('Sent', 'Accepted')
    `)).sum || 0;

    // Confirmed Bookings Revenue
    const confirmedRev = (await get(`
      SELECT SUM(grand_total) as sum FROM quotations WHERE status = 'Accepted'
    `)).sum || 0;

    // Recent 5 Inquiries
    const recentInquiries = await query(`
      SELECT id, reference_no, customer_name, event_type, event_date, guest_count, status, estimated_budget, created_at
      FROM inquiries
      ORDER BY id DESC
      LIMIT 6
    `);

    // Popular Catering Packages
    const popularPackages = await query(`
      SELECT package_name, COUNT(*) as booking_count
      FROM inquiries
      WHERE package_name IS NOT NULL AND package_name != ''
      GROUP BY package_name
      ORDER BY booking_count DESC
      LIMIT 4
    `);

    res.json({
      success: true,
      stats: {
        totalInquiries,
        newInquiries,
        underReview,
        pendingQuotes,
        confirmedBookings,
        completedEvents,
        cancelled,
        totalCustomers,
        totalMenuItems,
        totalPackages,
        pipelineRevenue: pipelineRev,
        confirmedRevenue: confirmedRev
      },
      recentInquiries,
      popularPackages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inquiries Management - List
router.get('/admin/inquiries', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `SELECT * FROM inquiries WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (
        LOWER(reference_no) LIKE ? OR
        LOWER(customer_name) LIKE ? OR
        LOWER(customer_email) LIKE ? OR
        LOWER(company_name) LIKE ? OR
        LOWER(event_type) LIKE ?
      )`;
      const s = `%${search.toLowerCase()}%`;
      params.push(s, s, s, s, s);
    }

    sql += ` ORDER BY id DESC`;
    const inquiries = await query(sql, params);

    const formatted = inquiries.map(inq => ({
      ...inq,
      selected_items: JSON.parse(inq.selected_items_json || '[]'),
      dietary_requirements: JSON.parse(inq.dietary_requirements_json || '[]'),
      additional_services: JSON.parse(inq.additional_services_json || '[]')
    }));

    res.json({ success: true, count: formatted.length, inquiries: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Inquiry Details
router.get('/admin/inquiries/:id', authenticateAdmin, async (req, res) => {
  try {
    const inq = await get(`SELECT * FROM inquiries WHERE id = ?`, [req.params.id]);
    if (!inq) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const quotation = await get(`SELECT * FROM quotations WHERE inquiry_id = ? ORDER BY id DESC LIMIT 1`, [inq.id]);

    res.json({
      success: true,
      inquiry: {
        ...inq,
        selected_items: JSON.parse(inq.selected_items_json || '[]'),
        dietary_requirements: JSON.parse(inq.dietary_requirements_json || '[]'),
        additional_services: JSON.parse(inq.additional_services_json || '[]')
      },
      quotation: quotation ? {
        ...quotation,
        line_items: JSON.parse(quotation.line_items_json || '[]')
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Inquiry Status & Notes
router.put('/admin/inquiries/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, assigned_to, internal_notes } = req.body;
    const validStatuses = [
      'New Inquiry',
      'Under Review',
      'Quotation Sent',
      'Awaiting Customer Approval',
      'Confirmed',
      'In Progress',
      'Completed',
      'Cancelled'
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid inquiry status.' });
    }

    let sql = `UPDATE inquiries SET updated_at = CURRENT_TIMESTAMP`;
    const params = [];

    if (status) {
      sql += `, status = ?`;
      params.push(status);
    }
    if (assigned_to !== undefined) {
      sql += `, assigned_to = ?`;
      params.push(assigned_to);
    }
    if (internal_notes !== undefined) {
      sql += `, internal_notes = ?`;
      params.push(internal_notes);
    }

    sql += ` WHERE id = ?`;
    params.push(req.params.id);

    await run(sql, params);
    res.json({ success: true, message: 'Inquiry updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Internal Note to Inquiry
router.post('/admin/inquiries/:id/notes', authenticateAdmin, async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ error: 'Note text required' });

    const inq = await get(`SELECT internal_notes FROM inquiries WHERE id = ?`, [req.params.id]);
    if (!inq) return res.status(404).json({ error: 'Inquiry not found' });

    const timestamp = new Date().toLocaleString();
    const author = req.user.full_name || req.user.username;
    const appended = inq.internal_notes
      ? `${inq.internal_notes}\n[${timestamp} - ${author}]: ${note}`
      : `[${timestamp} - ${author}]: ${note}`;

    await run(`UPDATE inquiries SET internal_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [appended, req.params.id]);
    res.json({ success: true, internal_notes: appended });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Inquiries as CSV
router.get('/admin/inquiries/export/csv', authenticateAdmin, async (req, res) => {
  try {
    const inquiries = await query(`SELECT * FROM inquiries ORDER BY id DESC`);
    let csv = 'Reference No,Customer Name,Email,Phone,Event Type,Event Date,Guests,Service Type,Package,Status,Budget,Created At\n';
    inquiries.forEach(i => {
      csv += `"${i.reference_no}","${i.customer_name}","${i.customer_email}","${i.customer_phone}","${i.event_type}","${i.event_date}",${i.guest_count},"${i.service_type}","${i.package_name || ''}","${i.status}",${i.estimated_budget},"${i.created_at}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`inquiries-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 5. QUOTATION GENERATION & MANAGEMENT
// =========================================================================

// List Quotations
router.get('/admin/quotations', authenticateAdmin, async (req, res) => {
  try {
    const quotations = await query(`
      SELECT q.*, i.reference_no as inquiry_ref, i.event_type
      FROM quotations q
      LEFT JOIN inquiries i ON q.inquiry_id = i.id
      ORDER BY q.id DESC
    `);
    const formatted = quotations.map(q => ({
      ...q,
      line_items: JSON.parse(q.line_items_json || '[]')
    }));
    res.json({ success: true, quotations: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create / Generate Quotation
router.post('/admin/quotations', authenticateAdmin, async (req, res) => {
  try {
    const {
      inquiry_id,
      customer_name,
      customer_email,
      customer_phone,
      event_date,
      guest_count,
      line_items,
      delivery_fee,
      setup_fee,
      staffing_fee,
      discount_amount,
      tax_rate,
      deposit_percent,
      terms_conditions,
      valid_until
    } = req.body;

    if (!customer_name || !customer_email) {
      return res.status(400).json({ error: 'Customer name and email are required.' });
    }

    // Generate quotation number: Q-YYYY-XXXX
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const quotation_number = `Q-${new Date().getFullYear()}-${randomNum}`;

    // Calculate Subtotal from line items
    const items = line_items || [];
    let itemsSubtotal = 0;
    items.forEach(it => {
      it.total = (parseFloat(it.qty) || 1) * (parseFloat(it.unitPrice) || 0);
      itemsSubtotal += it.total;
    });

    const dFee = parseFloat(delivery_fee) || 0;
    const sFee = parseFloat(setup_fee) || 0;
    const staffFee = parseFloat(staffing_fee) || 0;
    const discount = parseFloat(discount_amount) || 0;
    const taxR = parseFloat(tax_rate) !== undefined ? parseFloat(tax_rate) : 13.0;

    const subtotal = itemsSubtotal + dFee + sFee + staffFee;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxAmount = (taxableAmount * taxR) / 100.0;
    const grandTotal = taxableAmount + taxAmount;

    const depPercent = parseFloat(deposit_percent) || 30.0;
    const depositRequired = (grandTotal * depPercent) / 100.0;

    const defaultTerms = 'Quotation is valid for 14 days from issue date. A 30% initial deposit confirms booking. Full balance due 7 business days prior to the event.';

    const result = await run(`
      INSERT INTO quotations (
        quotation_number, inquiry_id, customer_name, customer_email, customer_phone,
        event_date, guest_count, line_items_json, subtotal, delivery_fee, setup_fee,
        staffing_fee, discount_amount, tax_rate, tax_amount, grand_total, deposit_required,
        terms_conditions, valid_until, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')
    `, [
      quotation_number,
      inquiry_id || null,
      customer_name,
      customer_email,
      customer_phone || '',
      event_date || '',
      parseInt(guest_count) || 0,
      JSON.stringify(items),
      subtotal,
      dFee,
      sFee,
      staffFee,
      discount,
      taxR,
      taxAmount,
      grandTotal,
      depositRequired,
      terms_conditions || defaultTerms,
      valid_until || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    ]);

    // If tied to an inquiry, update inquiry status
    if (inquiry_id) {
      await run(`UPDATE inquiries SET status = 'Under Review' WHERE id = ?`, [inquiry_id]);
    }

    res.json({
      success: true,
      quotation_id: result.id,
      quotation_number,
      grand_total: grandTotal,
      message: 'Quotation created successfully.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Quotation
router.put('/admin/quotations/:id', authenticateAdmin, async (req, res) => {
  try {
    const {
      line_items,
      delivery_fee,
      setup_fee,
      staffing_fee,
      discount_amount,
      tax_rate,
      deposit_percent,
      terms_conditions,
      valid_until,
      status
    } = req.body;

    const quote = await get(`SELECT * FROM quotations WHERE id = ?`, [req.params.id]);
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });

    const items = line_items || JSON.parse(quote.line_items_json || '[]');
    let itemsSubtotal = 0;
    items.forEach(it => {
      it.total = (parseFloat(it.qty) || 1) * (parseFloat(it.unitPrice) || 0);
      itemsSubtotal += it.total;
    });

    const dFee = delivery_fee !== undefined ? parseFloat(delivery_fee) : quote.delivery_fee;
    const sFee = setup_fee !== undefined ? parseFloat(setup_fee) : quote.setup_fee;
    const staffFee = staffing_fee !== undefined ? parseFloat(staffing_fee) : quote.staffing_fee;
    const discount = discount_amount !== undefined ? parseFloat(discount_amount) : quote.discount_amount;
    const taxR = tax_rate !== undefined ? parseFloat(tax_rate) : quote.tax_rate;

    const subtotal = itemsSubtotal + dFee + sFee + staffFee;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxAmount = (taxableAmount * taxR) / 100.0;
    const grandTotal = taxableAmount + taxAmount;

    const depPercent = deposit_percent !== undefined ? parseFloat(deposit_percent) : 30.0;
    const depositRequired = (grandTotal * depPercent) / 100.0;

    await run(`
      UPDATE quotations
      SET line_items_json = ?, subtotal = ?, delivery_fee = ?, setup_fee = ?,
          staffing_fee = ?, discount_amount = ?, tax_rate = ?, tax_amount = ?,
          grand_total = ?, deposit_required = ?, terms_conditions = ?, valid_until = ?,
          status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      JSON.stringify(items),
      subtotal,
      dFee,
      sFee,
      staffFee,
      discount,
      taxR,
      taxAmount,
      grandTotal,
      depositRequired,
      terms_conditions || quote.terms_conditions,
      valid_until || quote.valid_until,
      status || quote.status,
      req.params.id
    ]);

    res.json({ success: true, message: 'Quotation updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send Quotation to Customer (Email Dispatch Simulation)
router.post('/admin/quotations/:id/send', authenticateAdmin, async (req, res) => {
  try {
    const quote = await get(`SELECT * FROM quotations WHERE id = ?`, [req.params.id]);
    if (!quote) return res.status(404).json({ error: 'Quotation not found' });

    // Mark as Sent
    await run(`
      UPDATE quotations
      SET status = 'Sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.params.id]);

    // Update parent inquiry status
    if (quote.inquiry_id) {
      await run(`UPDATE inquiries SET status = 'Quotation Sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [quote.inquiry_id]);
    }

    // Log email notification
    await run(`
      INSERT INTO email_logs (recipient_email, recipient_name, subject, template_name, content_preview, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      quote.customer_email,
      quote.customer_name,
      `Official Catering Quotation ${quote.quotation_number} - Grand Heritage Catering`,
      'quotation_dispatch',
      `Dear ${quote.customer_name}, please find attached your official quotation ${quote.quotation_number} for your upcoming event on ${quote.event_date}. Total: $${quote.grand_total.toFixed(2)}. You can review and accept online directly.`,
      'simulated_sent'
    ]);

    res.json({
      success: true,
      message: `Quotation ${quote.quotation_number} successfully dispatched to ${quote.customer_email}.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 6. MENU & PACKAGES MANAGEMENT
// =========================================================================

// Admin Menu List (Includes inactive)
router.get('/admin/menu', authenticateAdmin, async (req, res) => {
  try {
    const items = await query(`
      SELECT m.*, c.name as category_name
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.category_id ASC, m.display_order ASC
    `);
    const formatted = items.map(i => ({
      ...i,
      dietary_tags: JSON.parse(i.dietary_tags || '[]'),
      allergens: JSON.parse(i.allergens || '[]')
    }));
    res.json({ success: true, menu: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Menu Item
router.post('/admin/menu', authenticateAdmin, async (req, res) => {
  try {
    const { name, category_id, description, price, portion_size, image_url, dietary_tags, allergens, calories, is_featured, is_available } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await run(`
      INSERT INTO menu_items (
        name, slug, category_id, description, price, portion_size, image_url,
        dietary_tags, allergens, calories, is_featured, is_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      slug,
      category_id || 1,
      description || '',
      parseFloat(price) || 0,
      portion_size || 'Per Guest',
      image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      JSON.stringify(dietary_tags || []),
      JSON.stringify(allergens || []),
      parseInt(calories) || 0,
      is_featured ? 1 : 0,
      is_available !== undefined ? (is_available ? 1 : 0) : 1
    ]);

    res.json({ success: true, id: result.id, message: 'Menu item created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Menu Item
router.put('/admin/menu/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, category_id, description, price, portion_size, image_url, dietary_tags, allergens, calories, is_featured, is_available } = req.body;
    await run(`
      UPDATE menu_items
      SET name = ?, category_id = ?, description = ?, price = ?, portion_size = ?,
          image_url = ?, dietary_tags = ?, allergens = ?, calories = ?,
          is_featured = ?, is_available = ?
      WHERE id = ?
    `, [
      name,
      category_id,
      description,
      parseFloat(price),
      portion_size,
      image_url,
      JSON.stringify(dietary_tags || []),
      JSON.stringify(allergens || []),
      parseInt(calories) || 0,
      is_featured ? 1 : 0,
      is_available ? 1 : 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Menu item updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Menu Item Availability
router.patch('/admin/menu/:id/toggle-availability', authenticateAdmin, async (req, res) => {
  try {
    const item = await get(`SELECT is_available FROM menu_items WHERE id = ?`, [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const newStatus = item.is_available === 1 ? 0 : 1;
    await run(`UPDATE menu_items SET is_available = ? WHERE id = ?`, [newStatus, req.params.id]);
    res.json({ success: true, is_available: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Menu Item
router.delete('/admin/menu/:id', authenticateAdmin, async (req, res) => {
  try {
    await run(`DELETE FROM menu_items WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Menu item deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Packages Management - Admin List
router.get('/admin/packages', authenticateAdmin, async (req, res) => {
  try {
    const packages = await query(`SELECT * FROM packages ORDER BY display_order ASC, id ASC`);
    const formatted = packages.map(pkg => ({
      ...pkg,
      included_items: JSON.parse(pkg.included_items_json || '[]'),
      included_services: JSON.parse(pkg.included_services_json || '[]')
    }));
    res.json({ success: true, packages: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Package
router.post('/admin/packages', authenticateAdmin, async (req, res) => {
  try {
    const { name, price_per_person, min_guests, max_guests, courses_count, description, included_items, included_services, image_url, badge, is_featured, is_active } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await run(`
      INSERT INTO packages (
        name, slug, price_per_person, min_guests, max_guests, courses_count,
        description, included_items_json, included_services_json, image_url, badge,
        is_featured, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      slug,
      parseFloat(price_per_person) || 0,
      parseInt(min_guests) || 10,
      max_guests ? parseInt(max_guests) : null,
      parseInt(courses_count) || 3,
      description || '',
      JSON.stringify(included_items || []),
      JSON.stringify(included_services || []),
      image_url || 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
      badge || '',
      is_featured ? 1 : 0,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    ]);

    res.json({ success: true, id: result.id, message: 'Package created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Package
router.put('/admin/packages/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, price_per_person, min_guests, max_guests, courses_count, description, included_items, included_services, image_url, badge, is_featured, is_active } = req.body;
    await run(`
      UPDATE packages
      SET name = ?, price_per_person = ?, min_guests = ?, max_guests = ?,
          courses_count = ?, description = ?, included_items_json = ?,
          included_services_json = ?, image_url = ?, badge = ?,
          is_featured = ?, is_active = ?
      WHERE id = ?
    `, [
      name,
      parseFloat(price_per_person),
      parseInt(min_guests),
      max_guests ? parseInt(max_guests) : null,
      parseInt(courses_count),
      description,
      JSON.stringify(included_items || []),
      JSON.stringify(included_services || []),
      image_url,
      badge,
      is_featured ? 1 : 0,
      is_active ? 1 : 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Package updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Package
router.delete('/admin/packages/:id', authenticateAdmin, async (req, res) => {
  try {
    await run(`DELETE FROM packages WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Package deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 7. CUSTOMER DIRECTORY & TESTIMONIALS & GALLERY
// =========================================================================

// Customers Directory
router.get('/admin/customers', authenticateAdmin, async (req, res) => {
  try {
    const customers = await query(`
      SELECT c.*, COUNT(i.id) as inquiries_count
      FROM customers c
      LEFT JOIN inquiries i ON c.email = i.customer_email
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Testimonials Admin List (All)
router.get('/admin/testimonials', authenticateAdmin, async (req, res) => {
  try {
    const testimonials = await query(`SELECT * FROM testimonials ORDER BY id DESC`);
    res.json({ success: true, testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Testimonial Status (Approve / Reject / Feature)
router.put('/admin/testimonials/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { is_approved, is_featured } = req.body;
    await run(`
      UPDATE testimonials
      SET is_approved = ?, is_featured = ?
      WHERE id = ?
    `, [is_approved ? 1 : 0, is_featured ? 1 : 0, req.params.id]);
    res.json({ success: true, message: 'Testimonial status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Testimonial
router.delete('/admin/testimonials/:id', authenticateAdmin, async (req, res) => {
  try {
    await run(`DELETE FROM testimonials WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Testimonial removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery Admin List
router.get('/admin/gallery', authenticateAdmin, async (req, res) => {
  try {
    const items = await query(`SELECT * FROM gallery_items ORDER BY display_order ASC, id ASC`);
    res.json({ success: true, gallery: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Gallery Image
router.post('/admin/gallery', authenticateAdmin, async (req, res) => {
  try {
    const { title, category, image_url, caption, display_order } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Title and image URL required' });
    }

    const result = await run(`
      INSERT INTO gallery_items (title, category, image_url, caption, display_order)
      VALUES (?, ?, ?, ?, ?)
    `, [title, category || 'presentation', image_url, caption || '', parseInt(display_order) || 0]);

    res.json({ success: true, id: result.id, message: 'Image added to gallery.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Gallery Image
router.delete('/admin/gallery/:id', authenticateAdmin, async (req, res) => {
  try {
    await run(`DELETE FROM gallery_items WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Gallery item deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 8. SETTINGS & CONTENT MANAGEMENT
// =========================================================================

// Bulk Update Settings
router.put('/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const settings = req.body; // Key-value object
    for (const [key, value] of Object.entries(settings)) {
      const existing = await get(`SELECT id FROM settings WHERE setting_key = ?`, [key]);
      if (existing) {
        await run(`UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?`, [String(value), key]);
      } else {
        await run(`INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)`, [key, String(value)]);
      }
    }
    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Admin Password
router.post('/admin/settings/password', authenticateAdmin, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const user = await get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    const valid = await verifyPassword(current_password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = await require('bcryptjs').genSalt(10);
    const newHash = await require('bcryptjs').hash(new_password, salt);
    await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, req.user.id]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Email Logs
router.get('/admin/email-logs', authenticateAdmin, async (req, res) => {
  try {
    const logs = await query(`SELECT * FROM email_logs ORDER BY id DESC LIMIT 50`);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
