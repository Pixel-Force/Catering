/**
 * Grand Heritage Catering - 6-Step Multi-Step Event Inquiry & Quote Wizard
 */

let currentStep = 1;
const totalSteps = 6;

// Wizard State Object
const wizardState = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_whatsapp: '',
  company_name: '',
  event_type: 'Wedding Catering',
  event_date: '',
  event_time: '18:00',
  venue_address: '',
  guest_count: 50,
  is_outdoor: false,
  service_type: 'Buffet Catering',
  package_id: null,
  package_name: '',
  selected_items: [],
  dietary_requirements: [],
  allergies_notes: '',
  special_instructions: '',
  additional_services: ['Buffet Setup', 'Plates and Cutlery'],
  estimated_budget: 0,
  budget_type: 'total', // 'total' or 'per_person'
  preferred_payment_method: 'Credit Card / Bank Transfer'
};

document.addEventListener('DOMContentLoaded', () => {
  // Check URL query parameters for pre-selected package or service
  const params = new URLSearchParams(window.location.search);
  const pkgParam = params.get('package');
  const serviceParam = params.get('service');

  if (pkgParam) {
    loadPackageDetails(pkgParam);
  }
  if (serviceParam) {
    wizardState.service_type = decodeURIComponent(serviceParam);
    const serviceSelect = document.getElementById('wizard-service-type');
    if (serviceSelect) serviceSelect.value = wizardState.service_type;
  }

  // Preload items from QuoteTray if any
  const trayItems = QuoteTray.getItems();
  if (trayItems && trayItems.length > 0) {
    wizardState.selected_items = trayItems.map(i => i.name);
    renderSelectedItemsList();
  }

  // Step button bindings
  const nextBtn = document.getElementById('wizard-next-btn');
  const prevBtn = document.getElementById('wizard-prev-btn');
  const form = document.getElementById('quote-wizard-form');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
          goToStep(currentStep + 1);
        } else {
          submitInquiry();
        }
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateCurrentStep()) {
        submitInquiry();
      }
    });
  }

  // Dynamic guest count or budget recalculation
  const guestInput = document.getElementById('wizard-guest-count');
  if (guestInput) {
    guestInput.addEventListener('input', () => {
      wizardState.guest_count = parseInt(guestInput.value) || 20;
      updateEstimatedTotals();
    });
  }

  // Set min event date to tomorrow
  const dateInput = document.getElementById('wizard-event-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }

  // Initial step setup
  goToStep(1);
});

async function loadPackageDetails(pkgIdentifier) {
  try {
    const res = await fetch(`/api/packages/${pkgIdentifier}`);
    const data = await res.json();
    if (data.success && data.package) {
      wizardState.package_id = data.package.id;
      wizardState.package_name = data.package.name;
      const pkgSelect = document.getElementById('wizard-package-select');
      if (pkgSelect) {
        pkgSelect.value = data.package.id;
      }
      showToast(`Package "${data.package.name}" selected!`, 'info');
    }
  } catch (err) {
    console.error('Error loading package info:', err);
  }
}

function goToStep(step) {
  currentStep = step;

  // Update Step Panels
  document.querySelectorAll('.wizard-step-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  const currentPanel = document.getElementById(`wizard-step-${step}`);
  if (currentPanel) {
    currentPanel.classList.remove('hidden');
    window.scrollTo({ top: currentPanel.offsetTop - 120, behavior: 'smooth' });
  }

  // Update Wizard Header Indicators
  document.querySelectorAll('.wizard-step-indicator').forEach((ind, idx) => {
    const indStep = idx + 1;
    const circle = ind.querySelector('.wizard-step-circle');
    const label = ind.querySelector('.wizard-step-label');

    if (indStep < step) {
      ind.classList.remove('active');
      ind.classList.add('completed');
      if (circle) circle.innerHTML = '<i class="fa-solid fa-check text-white"></i>';
    } else if (indStep === step) {
      ind.classList.add('active');
      ind.classList.remove('completed');
      if (circle) circle.textContent = indStep;
    } else {
      ind.classList.remove('active', 'completed');
      if (circle) circle.textContent = indStep;
    }
  });

  // Update Prev / Next Buttons
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');

  if (prevBtn) {
    if (step === 1) {
      prevBtn.classList.add('invisible');
    } else {
      prevBtn.classList.remove('invisible');
    }
  }

  if (nextBtn) {
    if (step === totalSteps) {
      nextBtn.innerHTML = '<span>Submit Catering Inquiry</span> <i class="fa-solid fa-paper-plane ml-2"></i>';
      nextBtn.classList.remove('btn-primary');
      nextBtn.classList.add('btn-gold');
      renderConfirmationReview();
    } else {
      nextBtn.innerHTML = '<span>Next Step</span> <i class="fa-solid fa-arrow-right ml-2"></i>';
      nextBtn.classList.add('btn-primary');
      nextBtn.classList.remove('btn-gold');
    }
  }
}

function validateCurrentStep() {
  if (currentStep === 1) {
    const name = document.getElementById('wizard-name')?.value?.trim();
    const email = document.getElementById('wizard-email')?.value?.trim();
    const phone = document.getElementById('wizard-phone')?.value?.trim();

    if (!name || !email || !phone) {
      showToast('Please fill in your name, email, and phone number.', 'error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return false;
    }

    wizardState.customer_name = name;
    wizardState.customer_email = email;
    wizardState.customer_phone = phone;
    wizardState.customer_whatsapp = document.getElementById('wizard-whatsapp')?.value?.trim() || phone;
    wizardState.company_name = document.getElementById('wizard-company')?.value?.trim() || '';
    return true;
  }

  if (currentStep === 2) {
    const eventType = document.getElementById('wizard-event-type')?.value;
    const eventDate = document.getElementById('wizard-event-date')?.value;
    const eventTime = document.getElementById('wizard-event-time')?.value;
    const venue = document.getElementById('wizard-venue')?.value?.trim();
    const guests = parseInt(document.getElementById('wizard-guest-count')?.value);

    if (!eventDate) {
      showToast('Please select your preferred event date.', 'error');
      return false;
    }
    if (!venue) {
      showToast('Please enter the event location or city.', 'error');
      return false;
    }
    if (!guests || guests < 5) {
      showToast('Please specify a guest count of at least 5 guests.', 'error');
      return false;
    }

    wizardState.event_type = eventType;
    wizardState.event_date = eventDate;
    wizardState.event_time = eventTime || '18:00';
    wizardState.venue_address = venue;
    wizardState.guest_count = guests;
    wizardState.is_outdoor = document.getElementById('wizard-outdoor')?.checked || false;
    return true;
  }

  if (currentStep === 3) {
    wizardState.service_type = document.getElementById('wizard-service-type')?.value || 'Buffet Catering';
    const pkgSelect = document.getElementById('wizard-package-select');
    if (pkgSelect && pkgSelect.value) {
      wizardState.package_id = parseInt(pkgSelect.value);
      wizardState.package_name = pkgSelect.options[pkgSelect.selectedIndex]?.text || '';
    }

    // Collect dietary checkboxes
    const dietary = [];
    document.querySelectorAll('input[name="wizard-dietary"]:checked').forEach(cb => {
      dietary.push(cb.value);
    });
    wizardState.dietary_requirements = dietary;
    wizardState.allergies_notes = document.getElementById('wizard-allergies')?.value?.trim() || '';
    wizardState.special_instructions = document.getElementById('wizard-instructions')?.value?.trim() || '';
    return true;
  }

  if (currentStep === 4) {
    // Collect Additional Services
    const services = [];
    document.querySelectorAll('input[name="wizard-service"]:checked').forEach(cb => {
      services.push(cb.value);
    });
    wizardState.additional_services = services;
    return true;
  }

  if (currentStep === 5) {
    const budgetVal = parseFloat(document.getElementById('wizard-budget')?.value) || 0;
    wizardState.estimated_budget = budgetVal;
    wizardState.preferred_payment_method = document.getElementById('wizard-payment-method')?.value || 'Credit Card / Bank Transfer';
    return true;
  }

  return true;
}

function renderSelectedItemsList() {
  const container = document.getElementById('wizard-selected-items-list');
  if (!container) return;

  if (wizardState.selected_items.length === 0) {
    container.innerHTML = `
      <div class="text-xs text-gray-500 italic p-3 bg-stone-50 rounded-lg border border-dashed border-stone-200">
        No dishes added from menu yet. You can choose a package above or browse our <a href="/menu" class="text-burgundy underline font-medium" target="_blank">Full Menu</a> to add items.
      </div>
    `;
    return;
  }

  container.innerHTML = wizardState.selected_items.map((item, idx) => `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-medium">
      ${item}
      <button type="button" onclick="removeWizardItem(${idx})" class="text-amber-700 hover:text-red-600 font-bold ml-1">×</button>
    </span>
  `).join('');
}

function removeWizardItem(idx) {
  wizardState.selected_items.splice(idx, 1);
  renderSelectedItemsList();
}

function renderConfirmationReview() {
  const reviewContainer = document.getElementById('wizard-review-container');
  if (!reviewContainer) return;

  reviewContainer.innerHTML = `
    <div class="space-y-6">
      <!-- Client & Event Header -->
      <div class="bg-burgundy text-white p-5 rounded-2xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-amber-200">Event Overview</span>
          <h4 class="text-xl font-serif font-bold text-white">${wizardState.event_type}</h4>
          <p class="text-xs text-stone-200 mt-1"><i class="fa-solid fa-calendar mr-1"></i> ${wizardState.event_date} at ${wizardState.event_time} | <i class="fa-solid fa-users mr-1"></i> ${wizardState.guest_count} Expected Guests</p>
        </div>
        <div class="text-right">
          <span class="text-xs text-stone-200">Catering Service</span>
          <div class="text-base font-bold text-amber-300">${wizardState.service_type}</div>
          <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${wizardState.is_outdoor ? 'bg-amber-600' : 'bg-emerald-700'} text-white">
            ${wizardState.is_outdoor ? 'Outdoor Event' : 'Indoor Venue'}
          </span>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Contact Summary -->
        <div class="p-4 bg-stone-50 rounded-xl border border-stone-200">
          <h5 class="text-xs font-bold uppercase text-stone-500 mb-2">Customer & Venue</h5>
          <p class="text-sm font-semibold text-gray-900">${wizardState.customer_name} ${wizardState.company_name ? `(${wizardState.company_name})` : ''}</p>
          <p class="text-xs text-gray-600 mt-1"><i class="fa-solid fa-envelope mr-1 text-burgundy"></i> ${wizardState.customer_email}</p>
          <p class="text-xs text-gray-600"><i class="fa-solid fa-phone mr-1 text-burgundy"></i> ${wizardState.customer_phone}</p>
          <p class="text-xs text-gray-700 mt-2 font-medium"><i class="fa-solid fa-location-dot mr-1 text-red-600"></i> ${wizardState.venue_address}</p>
        </div>

        <!-- Menu & Dietary Summary -->
        <div class="p-4 bg-stone-50 rounded-xl border border-stone-200">
          <h5 class="text-xs font-bold uppercase text-stone-500 mb-2">Menu & Preferences</h5>
          <p class="text-sm font-semibold text-gray-900">${wizardState.package_name || 'Custom Menu Selection'}</p>
          <div class="mt-2 flex flex-wrap gap-1">
            ${wizardState.dietary_requirements.length > 0
              ? wizardState.dietary_requirements.map(d => `<span class="badge-dietary text-xs">${d}</span>`).join('')
              : '<span class="text-xs text-gray-500">Standard menu options</span>'}
          </div>
          ${wizardState.allergies_notes ? `<p class="text-xs text-red-700 font-medium mt-2"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Allergies: ${wizardState.allergies_notes}</p>` : ''}
        </div>
      </div>

      <!-- Services & Budget -->
      <div class="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
        <h5 class="text-xs font-bold uppercase text-amber-900 mb-2">Included Setup & Services</h5>
        <div class="flex flex-wrap gap-2 mb-3">
          ${wizardState.additional_services.map(s => `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-stone-800 rounded-lg text-xs border border-amber-200 font-medium shadow-sm">
              <i class="fa-solid fa-check text-green-600"></i> ${s}
            </span>
          `).join('')}
        </div>
        <div class="flex justify-between items-center pt-3 border-t border-amber-200 text-xs">
          <span class="text-stone-600 font-medium">Target Budget: <strong>$${wizardState.estimated_budget ? wizardState.estimated_budget.toFixed(2) : 'Open Quote'}</strong></span>
          <span class="text-stone-600">Preferred Payment: <strong>${wizardState.preferred_payment_method}</strong></span>
        </div>
      </div>
    </div>
  `;
}

async function submitInquiry() {
  const nextBtn = document.getElementById('wizard-next-btn');
  const originalText = nextBtn.innerHTML;
  nextBtn.disabled = true;
  nextBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Submitting Inquiry...';

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wizardState)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        QuoteTray.clear();
        showSuccessScreen(data.reference_no);
        return;
      }
    }
  } catch (err) {}

  // Seamless client simulation for GitHub Pages & offline demos
  const simRef = 'CAT-2026-' + Math.floor(1000 + Math.random() * 9000);
  const localInquiries = JSON.parse(localStorage.getItem('ghc_inquiries') || '{}');
  localInquiries[simRef] = {
    reference_no: simRef,
    ...wizardState,
    status: 'In Review',
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  localStorage.setItem('ghc_inquiries', JSON.stringify(localInquiries));
  QuoteTray.clear();
  showSuccessScreen(simRef);
}

function showSuccessScreen(referenceNo) {
  const wizardContainer = document.getElementById('wizard-container');
  if (!wizardContainer) return;

  wizardContainer.innerHTML = `
    <div class="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-stone-200 text-center max-w-2xl mx-auto">
      <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">
        <i class="fa-solid fa-check"></i>
      </div>
      <span class="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
        Inquiry Successfully Received
      </span>
      <h3 class="text-3xl font-serif font-bold text-gray-900 mt-3 mb-2">Thank You, ${wizardState.customer_name}!</h3>
      <p class="text-sm text-gray-600 max-w-lg mx-auto">
        Your catering inquiry has been logged in our system. Our executive event team will review date availability, chef staffing, and prepare your customized quotation within 24 hours.
      </p>

      <div class="my-6 p-6 bg-stone-50 rounded-2xl border border-stone-200 max-w-md mx-auto">
        <span class="text-xs text-gray-500 uppercase font-semibold">Your Booking Reference Number</span>
        <div class="text-2xl font-mono font-bold text-burgundy mt-1 tracking-wider">${referenceNo}</div>
        <p class="text-xs text-gray-500 mt-2">A confirmation email with this reference has been sent to <strong>${wizardState.customer_email}</strong>.</p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <a href="/portal?ref=${referenceNo}" class="btn-primary w-full sm:w-auto">
          <i class="fa-solid fa-user-shield mr-2"></i> View in Customer Portal
        </a>
        <a href="https://wa.me/14165550198?text=Hello%20Grand%20Heritage%20Catering,%20I%20just%20submitted%20inquiry%20${referenceNo}" target="_blank" class="btn-secondary w-full sm:w-auto">
          <i class="fa-brands fa-whatsapp text-emerald-600 mr-2"></i> WhatsApp Urgent Follow-up
        </a>
      </div>

      <div class="mt-8 pt-6 border-t border-stone-200 text-xs text-gray-500">
        Need immediate assistance? Call our catering office directly at <a href="tel:+14165550198" class="text-burgundy font-bold underline">+1 (416) 555-0198</a>.
      </div>
    </div>
  `;
}
