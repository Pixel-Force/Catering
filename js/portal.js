/**
 * Grand Heritage Catering - Customer Portal Interactive Controller
 * Inquiry Status Tracker & Quotation Acceptance / Decline Flow
 */

let activeInquiry = null;
let activeQuotation = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check for ?ref= parameter in URL
  const params = new URLSearchParams(window.location.search);
  const refParam = params.get('ref');

  if (refParam) {
    const input = document.getElementById('portal-ref-input');
    if (input) input.value = refParam;
    lookupInquiry(refParam);
  }

  // Search form
  const searchForm = document.getElementById('portal-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ref = document.getElementById('portal-ref-input')?.value?.trim();
      if (!ref) {
        showToast('Please enter your reference number (e.g. CAT-2026-1041)', 'error');
        return;
      }
      lookupInquiry(ref);
    });
  }
});

async function lookupInquiry(ref) {
  const cleanRef = (ref || '').toUpperCase().trim();
  const notFoundBox = document.getElementById('portal-not-found');
  const detailsCard = document.getElementById('portal-details-card');

  try {
    const res = await fetch('/api/portal/inquiry/' + cleanRef);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.inquiry) {
        renderInquiryPortal(data.inquiry, data.quotation);
        return;
      }
    }
  } catch (err) {}

  // Check LocalStorage and Fallback
  const localInquiries = JSON.parse(localStorage.getItem('ghc_inquiries') || '{}');
  const fallbackMatch = (typeof FALLBACK_INQUIRIES !== 'undefined' && FALLBACK_INQUIRIES[cleanRef]) || localInquiries[cleanRef];

  if (fallbackMatch) {
    renderInquiryPortal(fallbackMatch, fallbackMatch.quotation || null);
  } else {
    if (detailsCard) detailsCard.classList.add('hidden');
    if (notFoundBox) {
      document.getElementById('portal-search-ref-text').textContent = cleanRef;
      notFoundBox.classList.remove('hidden');
    }
  }
}
}

function renderPortalDetails(inquiry, quotation) {
  // Reference & Status
  document.getElementById('portal-display-ref').textContent = inquiry.reference_no;
  const statusEl = document.getElementById('portal-display-status');
  statusEl.textContent = inquiry.status;

  // Status badge styling
  statusEl.className = 'status-badge ' + getStatusClass(inquiry.status);

  // Event info
  document.getElementById('portal-display-customer').textContent = inquiry.customer_name;
  document.getElementById('portal-display-event').textContent = inquiry.event_type;
  document.getElementById('portal-display-date').textContent = `${inquiry.event_date} at ${inquiry.event_time || '18:00'}`;
  document.getElementById('portal-display-venue').textContent = inquiry.venue_address;
  document.getElementById('portal-display-guests').textContent = `${inquiry.guest_count} Guests (${inquiry.is_outdoor ? 'Outdoor' : 'Indoor'})`;
  document.getElementById('portal-display-service').textContent = inquiry.service_type;

  // Quotation Section
  const quoteSection = document.getElementById('portal-quotation-section');
  const quotePendingBanner = document.getElementById('portal-quotation-pending-banner');

  if (quotation) {
    quotePendingBanner.classList.add('hidden');
    quoteSection.classList.remove('hidden');

    document.getElementById('portal-quote-number').textContent = quotation.quotation_number;
    document.getElementById('portal-quote-date').textContent = quotation.valid_until ? `Valid Until: ${quotation.valid_until}` : '';
    document.getElementById('portal-quote-subtotal').textContent = `$${quotation.subtotal.toFixed(2)}`;
    document.getElementById('portal-quote-tax').textContent = `$${quotation.tax_amount.toFixed(2)} (${quotation.tax_rate}%)`;
    document.getElementById('portal-quote-total').textContent = `$${quotation.grand_total.toFixed(2)}`;
    document.getElementById('portal-quote-deposit').textContent = `$${quotation.deposit_required.toFixed(2)}`;

    // Line items table
    const lineItemsContainer = document.getElementById('portal-quote-lines');
    const items = quotation.line_items || [];
    lineItemsContainer.innerHTML = items.map(it => `
      <tr class="border-b border-stone-100 text-xs text-stone-700">
        <td class="py-2.5 font-medium">${it.name}</td>
        <td class="py-2.5 text-center">${it.qty}</td>
        <td class="py-2.5 text-right">$${parseFloat(it.unitPrice).toFixed(2)}</td>
        <td class="py-2.5 text-right font-bold">$${parseFloat(it.total).toFixed(2)}</td>
      </tr>
    `).join('');

    // Actions depending on quotation status
    const actionContainer = document.getElementById('portal-quote-actions');
    if (quotation.status === 'Sent' || quotation.status === 'Draft') {
      actionContainer.innerHTML = `
        <button onclick="openQuotationResponseModal('accept')" class="btn-primary text-xs flex-1">
          <i class="fa-solid fa-check-circle mr-1"></i> Accept Quotation
        </button>
        <button onclick="openQuotationResponseModal('decline')" class="btn-secondary text-xs flex-1">
          <i class="fa-solid fa-pen-to-square mr-1"></i> Request Changes / Decline
        </button>
        <a href="/quotation-view?ref=${inquiry.reference_no}" target="_blank" class="btn-gold text-xs">
          <i class="fa-solid fa-file-pdf mr-1"></i> Print / Download PDF
        </a>
      `;
    } else if (quotation.status === 'Accepted') {
      actionContainer.innerHTML = `
        <div class="w-full p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span><i class="fa-solid fa-circle-check text-emerald-600 text-sm mr-2"></i> You have accepted this quotation. Your event date is secured!</span>
          <a href="/quotation-view?ref=${inquiry.reference_no}" target="_blank" class="btn-primary text-xs py-1.5 px-3">
            <i class="fa-solid fa-download mr-1"></i> Official PDF
          </a>
        </div>
      `;
    } else {
      actionContainer.innerHTML = `
        <div class="w-full p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs font-semibold">
          Quotation Status: <strong>${quotation.status}</strong>. Our team has received your feedback and will contact you with an updated proposal.
        </div>
      `;
    }
  } else {
    quoteSection.classList.add('hidden');
    quotePendingBanner.classList.remove('hidden');
  }
}

function getStatusClass(status) {
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

function openQuotationResponseModal(action) {
  const modal = document.getElementById('portal-response-modal');
  const title = document.getElementById('portal-modal-title');
  const btn = document.getElementById('portal-modal-submit-btn');

  if (!modal || !activeQuotation) return;

  modal.setAttribute('data-action', action);
  if (action === 'accept') {
    title.textContent = 'Confirm Acceptance of Quotation';
    btn.textContent = 'Confirm & Accept';
    btn.className = 'btn-primary text-xs w-full';
  } else {
    title.textContent = 'Request Changes or Decline Quotation';
    btn.textContent = 'Submit Revision Request';
    btn.className = 'btn-secondary text-xs w-full';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeQuotationResponseModal() {
  const modal = document.getElementById('portal-response-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function submitQuotationResponse() {
  const modal = document.getElementById('portal-response-modal');
  const action = modal.getAttribute('data-action');
  const feedback = document.getElementById('portal-response-feedback')?.value?.trim();

  if (!activeQuotation) return;

  const btn = document.getElementById('portal-modal-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Processing...';

  try {
    const res = await fetch(`/api/portal/quotation/${activeQuotation.quotation_number}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, feedback })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeQuotationResponseModal();
      lookupInquiry(activeInquiry.reference_no);
    } else {
      showToast(data.error || 'Failed to submit response', 'error');
    }
  } catch (err) {
    showToast('Network error submitting quotation response.', 'error');
  } finally {
    btn.disabled = false;
  }
}
