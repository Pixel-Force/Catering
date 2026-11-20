/**
 * Grand Heritage Catering - Main Shared Client Scripts
 * Header, Mobile Nav, Quote Tray Storage & Drawer, Toast Notifications,
 * and Dynamic Business Info Synchronization
 */

// Toast notification helper
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-check-circle text-green-600' : (type === 'error' ? 'fa-exclamation-circle text-red-600' : 'fa-info-circle text-amber-600');
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-lg"></i>
    <div class="flex-1 text-sm font-medium text-gray-800">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Quote Tray Manager
const QuoteTray = {
  getItems() {
    try {
      return JSON.parse(localStorage.getItem('heritage_quote_tray') || '[]');
    } catch (e) {
      return [];
    }
  },

  addItem(item) {
    const items = this.getItems();
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        category: item.category_name || item.category || 'Dishes',
        quantity: 1
      });
    }
    localStorage.setItem('heritage_quote_tray', JSON.stringify(items));
    this.updateUI();
    showToast(`Added "${item.name}" to your quote tray!`, 'success');
  },

  removeItem(id) {
    let items = this.getItems();
    items = items.filter(i => i.id !== id);
    localStorage.setItem('heritage_quote_tray', JSON.stringify(items));
    this.updateUI();
    showToast('Item removed from quote tray.', 'info');
  },

  clear() {
    localStorage.removeItem('heritage_quote_tray');
    this.updateUI();
  },

  updateUI() {
    const items = this.getItems();
    const count = items.reduce((acc, i) => acc + (i.quantity || 1), 0);

    // Update badge counts
    document.querySelectorAll('.quote-tray-count').forEach(el => {
      el.textContent = count;
      if (count > 0) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // Update Floating Tray Button
    const floatBtn = document.getElementById('floating-quote-tray-btn');
    if (floatBtn) {
      if (count > 0) {
        floatBtn.classList.remove('hidden');
      } else {
        floatBtn.classList.add('hidden');
      }
    }

    // Render Drawer items if drawer is present
    const drawerList = document.getElementById('tray-drawer-items');
    const drawerEmpty = document.getElementById('tray-drawer-empty');
    const drawerFooter = document.getElementById('tray-drawer-footer');

    if (drawerList && drawerEmpty && drawerFooter) {
      if (items.length === 0) {
        drawerList.innerHTML = '';
        drawerEmpty.classList.remove('hidden');
        drawerFooter.classList.add('hidden');
      } else {
        drawerEmpty.classList.add('hidden');
        drawerFooter.classList.remove('hidden');
        drawerList.innerHTML = items.map(item => `
          <div class="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}" class="w-14 h-14 object-cover rounded-lg" alt="${item.name}">
            <div class="flex-1 min-w-0">
              <h5 class="text-sm font-semibold text-gray-900 truncate">${item.name}</h5>
              <p class="text-xs text-amber-700 font-medium">${item.category}</p>
              <p class="text-xs text-gray-600 font-bold">$${parseFloat(item.price).toFixed(2)}</p>
            </div>
            <button onclick="QuoteTray.removeItem(${item.id})" class="text-gray-400 hover:text-red-600 p-2">
              <i class="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        `).join('');
      }
    }
  }
};

// Open / Close Tray Drawer
function toggleTrayDrawer(open) {
  const drawer = document.getElementById('tray-drawer');
  const backdrop = document.getElementById('tray-backdrop');
  if (!drawer || !backdrop) return;

  if (open) {
    QuoteTray.updateUI();
    drawer.classList.add('open');
    backdrop.classList.add('open');
  } else {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  }
}

// Proceed from tray to Quote Wizard
function proceedToQuoteFromTray() {
  window.location.href = '/quote';
}

// Load dynamic business settings into DOM
async function loadBusinessSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      // Populate elements with data-setting
      document.querySelectorAll('[data-setting]').forEach(el => {
        const key = el.getAttribute('data-setting');
        if (s[key]) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = s[key];
          } else if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').startsWith('tel:')) {
            el.setAttribute('href', `tel:${s[key]}`);
            el.textContent = s[key];
          } else if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').startsWith('mailto:')) {
            el.setAttribute('href', `mailto:${s[key]}`);
            el.textContent = s[key];
          } else if (el.tagName === 'A' && el.classList.contains('whatsapp-link')) {
            const cleanNum = s[key].replace(/[^0-9]/g, '');
            el.setAttribute('href', `https://wa.me/${cleanNum}?text=Hello%20Grand%20Heritage%20Catering,%20I%20would%20like%20to%20inquire%20about%20catering%20services.`);
          } else {
            el.textContent = s[key];
          }
        }
      });
    }
  } catch (err) {
    console.warn('Could not load dynamic settings:', err);
  }
}

// Global Document Initialization
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
  const mobileMenuClose = document.getElementById('mobile-menu-close');

  if (mobileMenuBtn && mobileMenuDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuDrawer.classList.toggle('hidden');
      if (mobileMenuBackdrop) mobileMenuBackdrop.classList.toggle('hidden');
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', () => {
        mobileMenuDrawer.classList.add('hidden');
        if (mobileMenuBackdrop) mobileMenuBackdrop.classList.add('hidden');
      });
    }

    if (mobileMenuBackdrop) {
      mobileMenuBackdrop.addEventListener('click', () => {
        mobileMenuDrawer.classList.add('hidden');
        mobileMenuBackdrop.classList.add('hidden');
      });
    }
  }

  // 2. Sticky Header Scroll Effect
  const mainHeader = document.getElementById('main-header');
  if (mainHeader) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        mainHeader.classList.add('scrolled', 'shadow-md');
      } else {
        mainHeader.classList.remove('scrolled', 'shadow-md');
      }
    });
  }

  // 3. FAQ Accordion Interaction
  document.querySelectorAll('.faq-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.faq-icon');
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Close all other FAQs in same group
      btn.closest('.faq-container')?.querySelectorAll('.faq-toggle-btn').forEach(otherBtn => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherBtn.nextElementSibling?.classList.add('hidden');
          otherBtn.querySelector('.faq-icon')?.classList.remove('rotate-180');
        }
      });

      if (isExpanded) {
        btn.setAttribute('aria-expanded', 'false');
        content.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
      } else {
        btn.setAttribute('aria-expanded', 'true');
        content.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      }
    });
  });

  // 4. Contact Form Handler (if present)
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      const formData = {
        name: contactForm.name?.value?.trim(),
        email: contactForm.email?.value?.trim(),
        phone: contactForm.phone?.value?.trim(),
        subject: contactForm.subject?.value?.trim() || 'General Inquiry',
        message: contactForm.message?.value?.trim()
      };

      if (!formData.name || !formData.email || !formData.message) {
        showToast('Please fill out all required fields.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Sending...';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Message sent successfully!', 'success');
          contactForm.reset();
        } else {
          showToast(data.error || 'Failed to send message.', 'error');
        }
      } catch (err) {
        showToast('Network error while sending message. Please call us directly.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // 5. Initialize Tray UI & load settings
  QuoteTray.updateUI();
  loadBusinessSettings();
});
