/**
 * Grand Heritage Catering - Testimonials & Review Submission
 */

document.addEventListener('DOMContentLoaded', () => {
  fetchTestimonials();

  // Review Form submission
  const reviewForm = document.getElementById('submit-review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      const payload = {
        customer_name: reviewForm.customer_name?.value?.trim(),
        company: reviewForm.company?.value?.trim(),
        event_type: reviewForm.event_type?.value,
        rating: parseInt(reviewForm.rating?.value) || 5,
        review_text: reviewForm.review_text?.value?.trim()
      };

      if (!payload.customer_name || !payload.review_text) {
        showToast('Please provide your name and your review.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Submitting...';

      try {
        const res = await fetch('/api/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          reviewForm.reset();
          toggleReviewModal(false);
        } else {
          showToast(data.error || 'Failed to submit review.', 'error');
        }
      } catch (err) {
        showToast('Network error while submitting review.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
});

async function fetchTestimonials() {
  const container = document.getElementById('testimonials-grid-container');
  if (!container) return;
  try {
    const res = await fetch('/api/testimonials');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.testimonials) {
        renderTestimonials(data.testimonials, container);
        return;
      }
    }
  } catch (err) {}
  if (typeof FALLBACK_TESTIMONIALS !== 'undefined') {
    renderTestimonials(FALLBACK_TESTIMONIALS, container);
  }
}

function renderTestimonials(testimonials, container) {
  if (testimonials.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-12 text-stone-500">No reviews published yet.</div>`;
    return;
  }

  container.innerHTML = testimonials.map(t => {
    const stars = Array(t.rating || 5).fill('<i class="fa-solid fa-star text-amber-500 text-sm"></i>').join('');

    return `
      <div class="bg-white p-7 rounded-3xl border border-stone-200 shadow-sm card-hover flex flex-col justify-between">
        <div>
          <!-- Stars & Event Type -->
          <div class="flex justify-between items-center mb-4">
            <div class="flex gap-1">${stars}</div>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cream text-burgundy border border-cream">
              ${t.event_type}
            </span>
          </div>

          <!-- Review Quote -->
          <p class="text-sm text-stone-700 leading-relaxed italic mb-6">
            "${t.review_text}"
          </p>
        </div>

        <!-- Reviewer Info -->
        <div class="flex items-center gap-3 pt-4 border-t border-stone-100">
          <img src="${t.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}"
               alt="${t.customer_name}"
               class="w-11 h-11 rounded-full object-cover border border-amber-300">
          <div>
            <h5 class="text-sm font-bold text-gray-900 leading-tight">${t.customer_name}</h5>
            <p class="text-xs text-stone-500">${t.company ? `${t.company} • ` : ''}Verified Event Client</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleReviewModal(open) {
  const modal = document.getElementById('review-modal');
  if (modal) {
    if (open) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
}
