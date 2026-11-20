/**
 * Grand Heritage Catering & Events - Core Server
 * Production Web Server & Backend API
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB } = require('./db');
const apiRoutes = require('./api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API
app.use('/api', apiRoutes);

// Determine static root directory (supports both root-level repo and public/ subfolder)
const publicDir = fs.existsSync(path.join(__dirname, '..', 'index.html'))
  ? path.join(__dirname, '..')
  : path.join(__dirname, '..', 'public');

// Direct Named HTML Routes
const cleanRoutes = {
  '/': 'index.html',
  '/about': 'about.html',
  '/services': 'services.html',
  '/services/wedding-catering': 'services/wedding-catering.html',
  '/services/corporate-catering': 'services/corporate-catering.html',
  '/services/birthday-catering': 'services/birthday-catering.html',
  '/services/private-party-catering': 'services/private-party-catering.html',
  '/services/outdoor-catering': 'services/outdoor-catering.html',
  '/services/buffet-catering': 'services/buffet-catering.html',
  '/menu': 'menu.html',
  '/packages': 'packages.html',
  '/quote': 'quote.html',
  '/booking': 'quote.html',
  '/gallery': 'gallery.html',
  '/testimonials': 'testimonials.html',
  '/contact': 'contact.html',
  '/portal': 'portal.html',
  '/quotation-view': 'quotation-view.html',
  '/privacy': 'privacy.html',
  '/terms': 'terms.html',
  '/admin/login': 'admin/login.html',
  '/admin': 'admin/index.html'
};

for (const [route, file] of Object.entries(cleanRoutes)) {
  app.get(route, (req, res) => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    res.status(404).send('Page not found');
  });
}

// Static Public Assets (CSS, JS, Images, etc.)
app.use(express.static(publicDir));

// Fallback for HTML without .html extension
app.get('/:page', (req, res, next) => {
  const filePath = path.join(publicDir, `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// Dynamic SEO Sitemap
app.get('/sitemap.xml', (req, res) => {
  const host = req.protocol + '://' + req.get('host');
  const urls = [
    '',
    '/about',
    '/services',
    '/services/wedding-catering',
    '/services/corporate-catering',
    '/services/birthday-catering',
    '/services/private-party-catering',
    '/services/outdoor-catering',
    '/services/buffet-catering',
    '/menu',
    '/packages',
    '/quote',
    '/gallery',
    '/testimonials',
    '/contact',
    '/portal'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  urls.forEach(u => {
    xml += `  <url>\n    <loc>${host}${u}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${u === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  });
  xml += `</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  const host = req.protocol + '://' + req.get('host');
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${host}/sitemap.xml\n`);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, 'index.html'));
});

// Start Server
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log('====================================================');
      console.log('🍷 Grand Heritage Catering & Events Live!');
      console.log(`🌐 Public Website:       http://localhost:${PORT}/`);
      console.log(`🍽️ Menu Catalog:         http://localhost:${PORT}/menu`);
      console.log(`📋 Request a Quote:      http://localhost:${PORT}/quote`);
      console.log(`💼 Customer Portal:      http://localhost:${PORT}/portal`);
      console.log(`🔐 Admin Dashboard:      http://localhost:${PORT}/admin`);
      console.log(`🔑 Admin Login:          admin / admin123`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
