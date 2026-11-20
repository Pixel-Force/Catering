/**
 * Grand Heritage Catering - Complete Admin Dashboard & CMS Controller
 * Modular SPA handling 11 Administrative Modules with REST APIs
 */

let authToken = localStorage.getItem('heritage_admin_token') || '';
let currentUser = null;
let currentTab = 'dashboard';

// Global cache
let adminInquiries = [];
let adminQuotations = [];
let adminMenuItems = [];
let adminPackages = [];
let adminCategories = [];
let activeDrawerInquiryId = null;

// Quotation builder line items state
let builderLineItems = [];

document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (!authToken) {
    if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
      window.location.href = 'login.html';
      return;
    }
  }

  // Load current user and initial stats
  verifyAdminAuth();
  setupNavigation();
});

async function verifyAdminAuth() {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        currentUser = data.user;
        const userDisplay = document.getElementById('admin-user-display');
        if (userDisplay) userDisplay.textContent = currentUser.full_name || currentUser.username;
        loadModule('dashboard');
        return;
      }
    }
  } catch (err) {}

  // Fallback demo mode for static GitHub Pages preview
  currentUser = { username: 'admin', full_name: 'Executive Chef / Admin (Demo Mode)' };
  const userDisplay = document.getElementById('admin-user-display');
  if (userDisplay) userDisplay.textContent = currentUser.full_name;
  loadModule('dashboard');
}

function logoutAdmin() {
  localStorage.removeItem('heritage_admin_token');
  window.location.href = 'login.html';
}

function setupNavigation() {
  document.querySelectorAll('.admin-nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-nav-item').forEach(l => l.classList.remove('active'));
  document.querySelector(`.admin-nav-item[data-tab="${tab}"]`)?.classList.add('active');

  // Hide all panels
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));

  const panel = document.getElementById(`panel-${tab}`);
  if (panel) panel.classList.remove('hidden');

  loadModule(tab);
}

function loadModule(tab) {
  switch (tab) {
    case 'dashboard': loadDashboard(); break;
    case 'inquiries': loadInquiries(); break;
    case 'quotations': loadQuotations(); break;
    case 'menu': loadMenu(); break;
    case 'packages': loadPackages(); break;
    case 'customers': loadCustomers(); break;
    case 'gallery': loadGallery(); break;
    case 'testimonials': loadTestimonials(); break;
    case 'content': loadContent(); break;
    case 'settings': loadSettings(); break;
    case 'emails': loadEmailLogs(); break;
  }
}

// --------------------------------------------------------------------------
// 1. DASHBOARD OVERVIEW
// --------------------------------------------------------------------------
async function loadDashboard() {
  try {
    const res = await fetch('/api/admin/dashboard-stats', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      const s = data.stats;
      document.getElementById('stat-total-inquiries').textContent = s.totalInquiries;
      document.getElementById('stat-new-inquiries').textContent = s.newInquiries;
      document.getElementById('stat-pending-quotes').textContent = s.pendingQuotes;
      document.getElementById('stat-confirmed-bookings').textContent = s.confirmedBookings;
      document.getElementById('stat-pipeline-revenue').textContent = `$${s.pipelineRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById('stat-total-customers').textContent = s.totalCustomers;

      // Render Recent Inquiries Table
      const recentTable = document.getElementById('dashboard-recent-table');
      if (recentTable) {
        recentTable.innerHTML = data.recentInquiries.map(i => `
          <tr class="border-b border-gray-100 hover:bg-stone-50 cursor-pointer" onclick="openInquiryDrawer(${i.id})">
            <td class="py-3 px-4 font-mono font-bold text-xs text-burgundy">${i.reference_no}</td>
            <td class="py-3 px-4 font-medium text-xs text-gray-900">${i.customer_name}</td>
            <td class="py-3 px-4 text-xs text-gray-600">${i.event_type}</td>
            <td class="py-3 px-4 text-xs text-gray-600">${i.event_date}</td>
            <td class="py-3 px-4 text-xs font-semibold">${i.guest_count}</td>
            <td class="py-3 px-4"><span class="status-badge ${getStatusBadgeClass(i.status)}">${i.status}</span></td>
          </tr>
        `).join('');
      }

      // Render Popular Packages
      const pkgList = document.getElementById('dashboard-popular-packages');
      if (pkgList) {
        pkgList.innerHTML = data.popularPackages.map(p => `
          <div class="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span class="text-xs font-semibold text-gray-800">${p.package_name}</span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-burgundy text-white">${p.booking_count} Bookings</span>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

// --------------------------------------------------------------------------
// 2. INQUIRIES & BOOKING MANAGEMENT
// --------------------------------------------------------------------------
async function loadInquiries() {
  const statusFilter = document.getElementById('inquiries-filter-status')?.value || 'all';
  const search = document.getElementById('inquiries-search-input')?.value || '';

  try {
    const res = await fetch(`/api/admin/inquiries?status=${statusFilter}&search=${encodeURIComponent(search)}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      adminInquiries = data.inquiries;
      renderInquiriesTable(adminInquiries);
    }
  } catch (err) {
    console.error('Error loading inquiries:', err);
  }
}

function renderInquiriesTable(inquiries) {
  const tbody = document.getElementById('inquiries-table-body');
  const countBadge = document.getElementById('inquiries-count-badge');
  if (countBadge) countBadge.textContent = `${inquiries.length} Inquiries`;

  if (!tbody) return;

  if (inquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No inquiries found.</td></tr>`;
    return;
  }

  tbody.innerHTML = inquiries.map(i => `
    <tr class="border-b border-gray-100 hover:bg-stone-50 transition-colors">
      <td class="py-3.5 px-4 font-mono font-bold text-xs text-burgundy">${i.reference_no}</td>
      <td class="py-3.5 px-4">
        <div class="font-bold text-xs text-gray-900">${i.customer_name}</div>
        <div class="text-[11px] text-gray-500">${i.customer_email} • ${i.customer_phone}</div>
      </td>
      <td class="py-3.5 px-4">
        <div class="text-xs font-medium text-gray-900">${i.event_type}</div>
        <div class="text-[11px] text-gray-500"><i class="fa-solid fa-calendar mr-1"></i> ${i.event_date} (${i.guest_count} guests)</div>
      </td>
      <td class="py-3.5 px-4 text-xs font-medium text-gray-700">${i.service_type}</td>
      <td class="py-3.5 px-4"><span class="status-badge ${getStatusBadgeClass(i.status)}">${i.status}</span></td>
      <td class="py-3.5 px-4 text-xs font-bold text-stone-800">$${i.estimated_budget ? parseFloat(i.estimated_budget).toFixed(2) : 'Open'}</td>
      <td class="py-3.5 px-4 text-right">
        <button onclick="openInquiryDrawer(${i.id})" class="px-2.5 py-1 bg-stone-100 hover:bg-burgundy text-stone-700 hover:text-white rounded-md text-xs font-semibold transition-all">
          <i class="fa-solid fa-eye mr-1"></i> Details
        </button>
      </td>
    </tr>
  `).join('');
}

async function openInquiryDrawer(id) {
  activeDrawerInquiryId = id;
  const drawer = document.getElementById('inquiry-details-drawer');
  const backdrop = document.getElementById('inquiry-drawer-backdrop');

  try {
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success && data.inquiry) {
      const inq = data.inquiry;
      const quote = data.quotation;

      document.getElementById('drawer-ref').textContent = inq.reference_no;
      document.getElementById('drawer-status-select').value = inq.status;
      document.getElementById('drawer-assigned').value = inq.assigned_to || '';
      document.getElementById('drawer-notes').value = inq.internal_notes || '';

      document.getElementById('drawer-customer-name').textContent = inq.customer_name;
      document.getElementById('drawer-company').textContent = inq.company_name || 'Individual';
      document.getElementById('drawer-email').textContent = inq.customer_email;
      document.getElementById('drawer-phone').textContent = inq.customer_phone;
      document.getElementById('drawer-event-type').textContent = inq.event_type;
      document.getElementById('drawer-event-date').textContent = `${inq.event_date} at ${inq.event_time}`;
      document.getElementById('drawer-venue').textContent = inq.venue_address;
      document.getElementById('drawer-guests').textContent = `${inq.guest_count} Guests (${inq.is_outdoor ? 'Outdoor' : 'Indoor'})`;
      document.getElementById('drawer-service').textContent = inq.service_type;
      document.getElementById('drawer-package').textContent = inq.package_name || 'Custom';
      document.getElementById('drawer-budget').textContent = `$${parseFloat(inq.estimated_budget || 0).toFixed(2)}`;

      // Selected items
      const itemsList = document.getElementById('drawer-items-list');
      if (itemsList) {
        itemsList.innerHTML = (inq.selected_items || []).map(it => `
          <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200">${it}</span>
        `).join('') || '<span class="text-xs text-gray-400">None selected</span>';
      }

      // Dietary
      const dietaryList = document.getElementById('drawer-dietary-list');
      if (dietaryList) {
        dietaryList.innerHTML = (inq.dietary_requirements || []).map(d => `
          <span class="badge-dietary">${d}</span>
        `).join('') || '<span class="text-xs text-gray-400">Standard</span>';
      }

      // Quotation action button
      const quoteActionBtn = document.getElementById('drawer-quote-action-btn');
      if (quoteActionBtn) {
        if (quote) {
          quoteActionBtn.textContent = `View Quote (${quote.quotation_number})`;
          quoteActionBtn.onclick = () => { closeInquiryDrawer(); switchTab('quotations'); };
        } else {
          quoteActionBtn.textContent = 'Create Official Quotation';
          quoteActionBtn.onclick = () => { closeInquiryDrawer(); openQuotationBuilder(inq); };
        }
      }

      drawer.classList.add('open');
      backdrop.classList.add('open');
    }
  } catch (err) {
    console.error('Failed to load inquiry drawer:', err);
  }
}

function closeInquiryDrawer() {
  document.getElementById('inquiry-details-drawer')?.classList.remove('open');
  document.getElementById('inquiry-drawer-backdrop')?.classList.remove('open');
}

async function saveInquiryStatus() {
  if (!activeDrawerInquiryId) return;

  const status = document.getElementById('drawer-status-select')?.value;
  const assigned_to = document.getElementById('drawer-assigned')?.value;
  const internal_notes = document.getElementById('drawer-notes')?.value;

  try {
    const res = await fetch(`/api/admin/inquiries/${activeDrawerInquiryId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status, assigned_to, internal_notes })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Inquiry updated successfully.', 'success');
      loadInquiries();
      closeInquiryDrawer();
    }
  } catch (err) {
    showToast('Failed to update inquiry status.', 'error');
  }
}

function exportInquiriesCSV() {
  window.open(`/api/admin/inquiries/export/csv?token=${authToken}`, '_blank');
}

// --------------------------------------------------------------------------
// 3. QUOTATION BUILDER & MANAGEMENT
// --------------------------------------------------------------------------
async function loadQuotations() {
  try {
    const res = await fetch('/api/admin/quotations', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      adminQuotations = data.quotations;
      renderQuotationsTable(adminQuotations);
    }
  } catch (err) {
    console.error('Error loading quotations:', err);
  }
}

function renderQuotationsTable(quotations) {
  const tbody = document.getElementById('quotations-table-body');
  if (!tbody) return;

  if (quotations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No quotations created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = quotations.map(q => `
    <tr class="border-b border-gray-100 hover:bg-stone-50">
      <td class="py-3 px-4 font-mono font-bold text-xs text-burgundy">${q.quotation_number}</td>
      <td class="py-3 px-4 font-bold text-xs text-gray-900">${q.customer_name}</td>
      <td class="py-3 px-4 text-xs text-gray-600">${q.event_date || 'N/A'}</td>
      <td class="py-3 px-4 text-xs font-bold text-gray-900">$${parseFloat(q.grand_total).toFixed(2)}</td>
      <td class="py-3 px-4 text-xs text-amber-800 font-semibold">$${parseFloat(q.deposit_required).toFixed(2)}</td>
      <td class="py-3 px-4"><span class="status-badge ${getQuoteStatusClass(q.status)}">${q.status}</span></td>
      <td class="py-3 px-4 text-right space-x-1">
        <a href="/quotation-view?ref=${q.inquiry_ref || q.quotation_number}" target="_blank" class="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-semibold">
          <i class="fa-solid fa-file-pdf"></i> PDF
        </a>
        <button onclick="sendQuotationEmail(${q.id})" class="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-semibold">
          <i class="fa-solid fa-paper-plane"></i> Send
        </button>
      </td>
    </tr>
  `).join('');
}

function openQuotationBuilder(inquiry = null) {
  builderLineItems = [];
  const modal = document.getElementById('quotation-builder-modal');
  if (!modal) return;

  if (inquiry) {
    document.getElementById('qb-inquiry-id').value = inquiry.id;
    document.getElementById('qb-customer-name').value = inquiry.customer_name;
    document.getElementById('qb-customer-email').value = inquiry.customer_email;
    document.getElementById('qb-customer-phone').value = inquiry.customer_phone;
    document.getElementById('qb-event-date').value = inquiry.event_date;
    document.getElementById('qb-guests').value = inquiry.guest_count;

    // Default line items from package or guests
    if (inquiry.package_name) {
      builderLineItems.push({
        name: `${inquiry.package_name} (${inquiry.guest_count} Guests)`,
        qty: inquiry.guest_count,
        unitPrice: 45.00,
        total: inquiry.guest_count * 45.00
      });
    } else {
      builderLineItems.push({
        name: `Catering Buffet Menu (${inquiry.guest_count} Guests)`,
        qty: inquiry.guest_count,
        unitPrice: 35.00,
        total: inquiry.guest_count * 35.00
      });
    }

    // Additional services lines
    if (inquiry.additional_services && inquiry.additional_services.includes('Waiter Service')) {
      builderLineItems.push({
        name: 'Professional Waitstaff Service (3 Attendants x 5 Hours)',
        qty: 3,
        unitPrice: 175.00,
        total: 525.00
      });
    }
  } else {
    // Blank quote
    document.getElementById('qb-inquiry-id').value = '';
    document.getElementById('qb-customer-name').value = '';
    document.getElementById('qb-customer-email').value = '';
    document.getElementById('qb-customer-phone').value = '';
    document.getElementById('qb-event-date').value = '';
    document.getElementById('qb-guests').value = 50;

    builderLineItems.push({
      name: 'Standard Catering Package',
      qty: 50,
      unitPrice: 45.00,
      total: 2250.00
    });
  }

  renderBuilderLines();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeQuotationBuilder() {
  const modal = document.getElementById('quotation-builder-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function addBuilderLineItem() {
  builderLineItems.push({
    name: 'Custom Catering Item',
    qty: 1,
    unitPrice: 50.00,
    total: 50.00
  });
  renderBuilderLines();
}

function removeBuilderLineItem(index) {
  builderLineItems.splice(index, 1);
  renderBuilderLines();
}

function renderBuilderLines() {
  const tbody = document.getElementById('qb-lines-tbody');
  if (!tbody) return;

  tbody.innerHTML = builderLineItems.map((item, idx) => `
    <tr class="border-b border-gray-100 text-xs">
      <td class="p-2">
        <input type="text" value="${item.name}" onchange="updateBuilderLine(${idx}, 'name', this.value)" class="w-full p-1.5 border border-gray-300 rounded text-xs">
      </td>
      <td class="p-2 w-20">
        <input type="number" value="${item.qty}" min="1" onchange="updateBuilderLine(${idx}, 'qty', this.value)" class="w-full p-1.5 border border-gray-300 rounded text-xs text-center">
      </td>
      <td class="p-2 w-28">
        <input type="number" step="0.5" value="${item.unitPrice}" onchange="updateBuilderLine(${idx}, 'unitPrice', this.value)" class="w-full p-1.5 border border-gray-300 rounded text-xs text-right">
      </td>
      <td class="p-2 w-28 font-bold text-right text-gray-900">$${(item.total || 0).toFixed(2)}</td>
      <td class="p-2 w-10 text-center">
        <button type="button" onclick="removeBuilderLineItem(${idx})" class="text-red-500 hover:text-red-700">
          <i class="fa-solid fa-trash text-xs"></i>
        </button>
      </td>
    </tr>
  `).join('');

  recalculateBuilderTotals();
}

function updateBuilderLine(idx, field, val) {
  if (field === 'qty') builderLineItems[idx].qty = parseFloat(val) || 1;
  else if (field === 'unitPrice') builderLineItems[idx].unitPrice = parseFloat(val) || 0;
  else builderLineItems[idx].name = val;

  builderLineItems[idx].total = builderLineItems[idx].qty * builderLineItems[idx].unitPrice;
  renderBuilderLines();
}

function recalculateBuilderTotals() {
  const itemsSubtotal = builderLineItems.reduce((acc, it) => acc + (it.total || 0), 0);
  const delivery = parseFloat(document.getElementById('qb-delivery-fee')?.value) || 0;
  const setup = parseFloat(document.getElementById('qb-setup-fee')?.value) || 0;
  const staffing = parseFloat(document.getElementById('qb-staffing-fee')?.value) || 0;
  const discount = parseFloat(document.getElementById('qb-discount')?.value) || 0;
  const taxRate = parseFloat(document.getElementById('qb-tax-rate')?.value) || 13.0;
  const depositPct = parseFloat(document.getElementById('qb-deposit-pct')?.value) || 30.0;

  const subtotal = itemsSubtotal + delivery + setup + staffing;
  const taxable = Math.max(0, subtotal - discount);
  const tax = (taxable * taxRate) / 100.0;
  const grandTotal = taxable + tax;
  const deposit = (grandTotal * depositPct) / 100.0;

  document.getElementById('qb-display-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('qb-display-tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('qb-display-grand-total').textContent = `$${grandTotal.toFixed(2)}`;
  document.getElementById('qb-display-deposit').textContent = `$${deposit.toFixed(2)}`;
}

async function saveQuotation() {
  const inquiryId = document.getElementById('qb-inquiry-id')?.value;
  const customerName = document.getElementById('qb-customer-name')?.value?.trim();
  const customerEmail = document.getElementById('qb-customer-email')?.value?.trim();
  const customerPhone = document.getElementById('qb-customer-phone')?.value?.trim();
  const eventDate = document.getElementById('qb-event-date')?.value;
  const guests = parseInt(document.getElementById('qb-guests')?.value) || 0;

  if (!customerName || !customerEmail) {
    showToast('Customer name and email are required.', 'error');
    return;
  }

  const payload = {
    inquiry_id: inquiryId ? parseInt(inquiryId) : null,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    event_date: eventDate,
    guest_count: guests,
    line_items: builderLineItems,
    delivery_fee: parseFloat(document.getElementById('qb-delivery-fee')?.value) || 0,
    setup_fee: parseFloat(document.getElementById('qb-setup-fee')?.value) || 0,
    staffing_fee: parseFloat(document.getElementById('qb-staffing-fee')?.value) || 0,
    discount_amount: parseFloat(document.getElementById('qb-discount')?.value) || 0,
    tax_rate: parseFloat(document.getElementById('qb-tax-rate')?.value) || 13.0,
    deposit_percent: parseFloat(document.getElementById('qb-deposit-pct')?.value) || 30.0,
    terms_conditions: document.getElementById('qb-terms')?.value
  };

  try {
    const res = await fetch('/api/admin/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Official quotation created successfully!', 'success');
      closeQuotationBuilder();
      loadQuotations();
    } else {
      showToast(data.error || 'Failed to create quotation', 'error');
    }
  } catch (err) {
    showToast('Network error creating quotation.', 'error');
  }
}

async function sendQuotationEmail(quoteId) {
  if (!confirm('Are you sure you want to send this official quotation to the customer email?')) return;

  try {
    const res = await fetch(`/api/admin/quotations/${quoteId}/send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadQuotations();
    } else {
      showToast(data.error || 'Failed to send quote', 'error');
    }
  } catch (err) {
    showToast('Network error sending quotation email.', 'error');
  }
}

// --------------------------------------------------------------------------
// 4. MENU & PACKAGES MANAGEMENT
// --------------------------------------------------------------------------
async function loadMenu() {
  try {
    const res = await fetch('/api/admin/menu', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      adminMenuItems = data.menu;
      renderAdminMenuTable(adminMenuItems);
    }
  } catch (err) {
    console.error('Error loading admin menu:', err);
  }
}

function renderAdminMenuTable(items) {
  const tbody = document.getElementById('admin-menu-tbody');
  if (!tbody) return;

  tbody.innerHTML = items.map(item => `
    <tr class="border-b border-gray-100 hover:bg-stone-50">
      <td class="py-3 px-4 flex items-center gap-3">
        <img src="${item.image_url}" class="w-10 h-10 object-cover rounded-lg">
        <div>
          <div class="font-bold text-xs text-gray-900">${item.name}</div>
          <div class="text-[11px] text-gray-500">${item.category_name}</div>
        </div>
      </td>
      <td class="py-3 px-4 font-bold text-xs text-gray-900">$${parseFloat(item.price).toFixed(2)}</td>
      <td class="py-3 px-4 text-xs">${item.portion_size || 'Per Guest'}</td>
      <td class="py-3 px-4">
        <button onclick="toggleItemStock(${item.id})" class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${item.is_available ? 'Available' : 'Sold Out'}
        </button>
      </td>
      <td class="py-3 px-4 text-right space-x-2">
        <button onclick="deleteMenuItem(${item.id})" class="text-red-500 hover:text-red-700 text-xs font-semibold">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleItemStock(id) {
  try {
    const res = await fetch(`/api/admin/menu/${id}/toggle-availability`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Stock availability toggled', 'success');
      loadMenu();
    }
  } catch (err) {
    showToast('Failed to toggle availability', 'error');
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Are you sure you want to delete this menu dish?')) return;
  try {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Item deleted', 'info');
      loadMenu();
    }
  } catch (err) {
    showToast('Failed to delete item', 'error');
  }
}

function openAddMenuItemModal() {
  document.getElementById('menu-item-modal')?.classList.remove('hidden');
  document.getElementById('menu-item-modal')?.classList.add('flex');
}

function closeAddMenuItemModal() {
  document.getElementById('menu-item-modal')?.classList.add('hidden');
  document.getElementById('menu-item-modal')?.classList.remove('flex');
}

async function saveNewMenuItem(e) {
  e.preventDefault();
  const form = document.getElementById('add-menu-form');
  const name = form.item_name?.value?.trim();
  const price = parseFloat(form.item_price?.value);
  const category_id = parseInt(form.item_category?.value) || 1;
  const description = form.item_desc?.value?.trim();
  const image_url = form.item_image?.value?.trim();

  if (!name || isNaN(price)) {
    showToast('Please provide a name and valid price.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ name, price, category_id, description, image_url, is_available: 1 })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Dish created successfully!', 'success');
      form.reset();
      closeAddMenuItemModal();
      loadMenu();
    }
  } catch (err) {
    showToast('Error saving menu item', 'error');
  }
}

// --------------------------------------------------------------------------
// 5. PACKAGES MANAGEMENT
// --------------------------------------------------------------------------
async function loadPackages() {
  try {
    const res = await fetch('/api/admin/packages', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      adminPackages = data.packages;
      renderAdminPackagesTable(adminPackages);
    }
  } catch (err) {
    console.error('Error loading admin packages:', err);
  }
}

function renderAdminPackagesTable(packages) {
  const tbody = document.getElementById('admin-packages-tbody');
  if (!tbody) return;

  tbody.innerHTML = packages.map(pkg => `
    <tr class="border-b border-gray-100 hover:bg-stone-50">
      <td class="py-3 px-4 font-bold text-xs text-gray-900">${pkg.name}</td>
      <td class="py-3 px-4 font-bold text-xs text-burgundy">$${parseFloat(pkg.price_per_person).toFixed(2)} / guest</td>
      <td class="py-3 px-4 text-xs text-gray-600">${pkg.min_guests} - ${pkg.max_guests || 'Any'} guests</td>
      <td class="py-3 px-4 text-xs font-semibold">${pkg.courses_count} Courses</td>
      <td class="py-3 px-4 text-xs">${pkg.badge || 'Standard'}</td>
      <td class="py-3 px-4 text-right">
        <button onclick="deletePackage(${pkg.id})" class="text-red-500 hover:text-red-700 text-xs font-semibold">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `).join('');
}

async function deletePackage(id) {
  if (!confirm('Are you sure you want to delete this catering package?')) return;
  try {
    const res = await fetch(`/api/admin/packages/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Package deleted', 'info');
      loadPackages();
    }
  } catch (err) {
    showToast('Error deleting package', 'error');
  }
}

// --------------------------------------------------------------------------
// 6. CUSTOMERS DIRECTORY
// --------------------------------------------------------------------------
async function loadCustomers() {
  try {
    const res = await fetch('/api/admin/customers', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      const tbody = document.getElementById('admin-customers-tbody');
      if (tbody) {
        tbody.innerHTML = data.customers.map(c => `
          <tr class="border-b border-gray-100 hover:bg-stone-50">
            <td class="py-3 px-4 font-bold text-xs text-gray-900">${c.name}</td>
            <td class="py-3 px-4 text-xs text-gray-600">${c.email}</td>
            <td class="py-3 px-4 text-xs text-gray-600">${c.phone || 'N/A'}</td>
            <td class="py-3 px-4 text-xs text-gray-700">${c.company || 'Private'}</td>
            <td class="py-3 px-4 font-bold text-xs text-burgundy">${c.inquiries_count} Inquiries</td>
            <td class="py-3 px-4 text-xs text-gray-500">${c.notes || ''}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading customers:', err);
  }
}

// --------------------------------------------------------------------------
// 7. TESTIMONIALS MODERATION
// --------------------------------------------------------------------------
async function loadTestimonials() {
  try {
    const res = await fetch('/api/admin/testimonials', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      const tbody = document.getElementById('admin-testimonials-tbody');
      if (tbody) {
        tbody.innerHTML = data.testimonials.map(t => `
          <tr class="border-b border-gray-100 hover:bg-stone-50">
            <td class="py-3 px-4 font-bold text-xs text-gray-900">${t.customer_name}</td>
            <td class="py-3 px-4 text-xs text-amber-500">${'★'.repeat(t.rating)}</td>
            <td class="py-3 px-4 text-xs text-gray-700 max-w-xs truncate">${t.review_text}</td>
            <td class="py-3 px-4 text-xs">${t.event_type}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${t.is_approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}">
                ${t.is_approved ? 'Approved' : 'Pending Moderation'}
              </span>
            </td>
            <td class="py-3 px-4 text-right space-x-1">
              ${!t.is_approved ? `
                <button onclick="updateTestimonialStatus(${t.id}, 1, ${t.is_featured})" class="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs font-semibold">
                  Approve
                </button>
              ` : `
                <button onclick="updateTestimonialStatus(${t.id}, 0, 0)" class="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-semibold">
                  Unpublish
                </button>
              `}
              <button onclick="deleteTestimonial(${t.id})" class="text-red-500 hover:text-red-700 text-xs font-semibold ml-2">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading testimonials:', err);
  }
}

async function updateTestimonialStatus(id, isApproved, isFeatured) {
  try {
    const res = await fetch(`/api/admin/testimonials/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ is_approved: isApproved, is_featured: isFeatured })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Review status updated.', 'success');
      loadTestimonials();
    }
  } catch (err) {
    showToast('Failed to update review status', 'error');
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Are you sure you want to delete this review?')) return;
  try {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Review deleted', 'info');
      loadTestimonials();
    }
  } catch (err) {
    showToast('Error deleting review', 'error');
  }
}

// --------------------------------------------------------------------------
// 8. GALLERY MANAGEMENT
// --------------------------------------------------------------------------
async function loadGallery() {
  try {
    const res = await fetch('/api/admin/gallery', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      const grid = document.getElementById('admin-gallery-grid');
      if (grid) {
        grid.innerHTML = data.gallery.map(g => `
          <div class="relative group rounded-xl overflow-hidden border border-gray-200 bg-white">
            <img src="${g.image_url}" class="w-full h-36 object-cover">
            <div class="p-3">
              <span class="text-[10px] font-bold uppercase tracking-wider text-burgundy">${g.category}</span>
              <h5 class="text-xs font-bold text-gray-900 truncate">${g.title}</h5>
              <p class="text-[11px] text-gray-500 truncate mt-0.5">${g.caption || ''}</p>
            </div>
            <button onclick="deleteGalleryItem(${g.id})" class="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading gallery:', err);
  }
}

async function deleteGalleryItem(id) {
  if (!confirm('Remove image from gallery?')) return;
  try {
    const res = await fetch(`/api/admin/gallery/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Image removed', 'info');
      loadGallery();
    }
  } catch (err) {
    showToast('Failed to remove image', 'error');
  }
}

async function saveNewGalleryImage(e) {
  e.preventDefault();
  const form = document.getElementById('add-gallery-form');
  const title = form.image_title?.value?.trim();
  const image_url = form.image_url?.value?.trim();
  const category = form.image_category?.value;
  const caption = form.image_caption?.value?.trim();

  if (!title || !image_url) {
    showToast('Title and Image URL are required.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ title, image_url, category, caption })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Image added to gallery!', 'success');
      form.reset();
      loadGallery();
    }
  } catch (err) {
    showToast('Failed to add image', 'error');
  }
}

// --------------------------------------------------------------------------
// 9. WEBSITE CONTENT & SETTINGS
// --------------------------------------------------------------------------
async function loadContent() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      if (document.getElementById('edit-hero-headline')) document.getElementById('edit-hero-headline').value = s.hero_headline || '';
      if (document.getElementById('edit-hero-subtext')) document.getElementById('edit-hero-subtext').value = s.hero_subtext || '';
      if (document.getElementById('edit-about-story')) document.getElementById('edit-about-story').value = s.about_story || '';
    }
  } catch (err) {
    console.error('Error loading content:', err);
  }
}

async function saveWebsiteContent(e) {
  e.preventDefault();
  const payload = {
    hero_headline: document.getElementById('edit-hero-headline')?.value?.trim(),
    hero_subtext: document.getElementById('edit-hero-subtext')?.value?.trim(),
    about_story: document.getElementById('edit-about-story')?.value?.trim()
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Website content updated successfully!', 'success');
    }
  } catch (err) {
    showToast('Error saving content', 'error');
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      if (document.getElementById('setting-business-name')) document.getElementById('setting-business-name').value = s.business_name || '';
      if (document.getElementById('setting-business-tagline')) document.getElementById('setting-business-tagline').value = s.business_tagline || '';
      if (document.getElementById('setting-phone')) document.getElementById('setting-phone').value = s.business_phone || '';
      if (document.getElementById('setting-whatsapp')) document.getElementById('setting-whatsapp').value = s.business_whatsapp || '';
      if (document.getElementById('setting-email')) document.getElementById('setting-email').value = s.business_email || '';
      if (document.getElementById('setting-address')) document.getElementById('setting-address').value = s.business_address || '';
      if (document.getElementById('setting-hours')) document.getElementById('setting-hours').value = s.business_hours || '';
      if (document.getElementById('setting-tax-rate')) document.getElementById('setting-tax-rate').value = s.default_tax_rate || '13.0';
      if (document.getElementById('setting-deposit-pct')) document.getElementById('setting-deposit-pct').value = s.default_deposit_percent || '30.0';
      if (document.getElementById('setting-policy')) document.getElementById('setting-policy').value = s.booking_policy || '';
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

async function saveGeneralSettings(e) {
  e.preventDefault();
  const payload = {
    business_name: document.getElementById('setting-business-name')?.value?.trim(),
    business_tagline: document.getElementById('setting-business-tagline')?.value?.trim(),
    business_phone: document.getElementById('setting-phone')?.value?.trim(),
    business_whatsapp: document.getElementById('setting-whatsapp')?.value?.trim(),
    business_email: document.getElementById('setting-email')?.value?.trim(),
    business_address: document.getElementById('setting-address')?.value?.trim(),
    business_hours: document.getElementById('setting-hours')?.value?.trim(),
    default_tax_rate: document.getElementById('setting-tax-rate')?.value?.trim(),
    default_deposit_percent: document.getElementById('setting-deposit-pct')?.value?.trim(),
    booking_policy: document.getElementById('setting-policy')?.value?.trim()
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Business settings saved successfully!', 'success');
    }
  } catch (err) {
    showToast('Failed to save settings', 'error');
  }
}

async function changeAdminPassword(e) {
  e.preventDefault();
  const current_password = document.getElementById('pw-current')?.value;
  const new_password = document.getElementById('pw-new')?.value;

  try {
    const res = await fetch('/api/admin/settings/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ current_password, new_password })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Admin password changed successfully!', 'success');
      document.getElementById('change-password-form')?.reset();
    } else {
      showToast(data.error || 'Failed to change password', 'error');
    }
  } catch (err) {
    showToast('Error changing password', 'error');
  }
}

// --------------------------------------------------------------------------
// 10. EMAIL NOTIFICATIONS AUDIT LOG
// --------------------------------------------------------------------------
async function loadEmailLogs() {
  try {
    const res = await fetch('/api/admin/email-logs', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      const tbody = document.getElementById('admin-email-logs-tbody');
      if (tbody) {
        tbody.innerHTML = data.logs.map(l => `
          <tr class="border-b border-gray-100 hover:bg-stone-50">
            <td class="py-3 px-4 font-bold text-xs text-gray-900">${l.recipient_email}</td>
            <td class="py-3 px-4 text-xs font-medium text-gray-800">${l.subject}</td>
            <td class="py-3 px-4 text-xs text-gray-500 font-mono">${l.template_name}</td>
            <td class="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">${l.content_preview}</td>
            <td class="py-3 px-4 text-xs text-green-700 font-semibold"><i class="fa-solid fa-check mr-1"></i> Dispatched</td>
            <td class="py-3 px-4 text-xs text-gray-400">${l.created_at}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading email logs:', err);
  }
}

// Helper status classes
function getStatusBadgeClass(status) {
  switch (status) {
    case 'New Inquiry': return 'status-new-inquiry';
    case 'Under Review': return 'status-under-review';
    case 'Quotation Sent': return 'status-quotation-sent';
    case 'Awaiting Customer Approval': return 'status-awaiting-customer-approval';
    case 'Confirmed': return 'status-confirmed';
    case 'In Progress': return 'status-in-progress';
    case 'Completed': return 'status-completed';
    case 'Cancelled': return 'status-cancelled';
    default: return 'status-under-review';
  }
}

function getQuoteStatusClass(status) {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-800 border border-gray-300';
    case 'Sent': return 'bg-sky-100 text-sky-800 border border-sky-300';
    case 'Accepted': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    case 'Declined': return 'bg-rose-100 text-rose-800 border border-rose-300';
    default: return 'bg-gray-100 text-gray-800';
  }
}
