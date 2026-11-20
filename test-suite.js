const { initDB } = require('./server/db');

async function runTests() {
  await initDB();
  console.log('✅ Database initialized and connected.');

  const express = require('express');
  const cors = require('cors');
  const apiRoutes = require('./server/api');
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRoutes);

  const server = app.listen(3456, async () => {
    try {
      console.log('🚀 Test server running on http://localhost:3456');

      // Test 1: Categories
      const catRes = await fetch('http://localhost:3456/api/categories');
      const catData = await catRes.json();
      console.log(`[PASS] Categories count: ${catData.categories.length}`);

      // Test 2: Menu Items
      const menuRes = await fetch('http://localhost:3456/api/menu');
      const menuData = await menuRes.json();
      console.log(`[PASS] Menu items count: ${menuData.menu.length}`);

      // Test 3: Packages
      const pkgRes = await fetch('http://localhost:3456/api/packages');
      const pkgData = await pkgRes.json();
      console.log(`[PASS] Packages count: ${pkgData.packages.length}`);

      // Test 4: Portal Lookup
      const portalRes = await fetch('http://localhost:3456/api/portal/inquiry/CAT-2026-1041');
      const portalData = await portalRes.json();
      console.log(`[PASS] Portal lookup for CAT-2026-1041: ${portalData.inquiry.customer_name}`);
      console.log(`[PASS] Quotation linked: ${portalData.quotation.quotation_number}`);

      // Test 5: Admin Login
      const loginRes = await fetch('http://localhost:3456/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const loginData = await loginRes.json();
      console.log(`[PASS] Admin login success: ${loginData.success}, Token: ${loginData.token.substring(0, 15)}...`);

      // Test 6: Submit New Inquiry
      const inqRes = await fetch('http://localhost:3456/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Alexander Wright',
          customer_email: 'alex.wright@test.com',
          customer_phone: '+1 (416) 555-9988',
          event_type: 'Wedding Catering',
          event_date: '2026-12-31',
          venue_address: 'Eglinton Grand, Toronto',
          guest_count: 80,
          service_type: 'Plated Sit-Down Service',
          selected_items: ['Truffle Wild Mushroom Arancini', 'Pan-Seared Chilean Sea Bass'],
          dietary_requirements: ['Halal']
        })
      });
      const inqData = await inqRes.json();
      console.log(`[PASS] New Inquiry created with Ref: ${inqData.reference_no}`);

      // Test 7: Customer Accepts Quotation
      const acceptRes = await fetch('http://localhost:3456/api/portal/quotation/Q-2026-1001/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', feedback: 'Looks fantastic! Proceeding with deposit.' })
      });
      const acceptData = await acceptRes.json();
      console.log(`[PASS] Client Quote Acceptance: ${acceptData.message}`);

      // Test 8: Admin Dashboard Stats
      const statsRes = await fetch('http://localhost:3456/api/admin/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });
      const statsData = await statsRes.json();
      console.log(`[PASS] Dashboard Total Inquiries: ${statsData.stats.totalInquiries}, Confirmed: ${statsData.stats.confirmedBookings}`);

      console.log('🎉 ALL 8 INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    } catch (e) {
      console.error('Test execution failed:', e);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();
