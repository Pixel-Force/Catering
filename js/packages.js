/**
 * Grand Heritage Catering - Packages Page Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  fetchPackages();
});

async function fetchPackages() {
  const container = document.getElementById('packages-grid-container');
  if (!container) return;
  try {
    const res = await fetch('/api/packages');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.packages) {
        renderPackages(data.packages, container);
        return;
      }
    }
  } catch (err) {}
  if (typeof FALLBACK_PACKAGES !== 'undefined') {
    renderPackages(FALLBACK_PACKAGES, container);
  }
}

function renderPackages(packages, container) {
  container.innerHTML = packages.map(pkg => {
    const isFeatured = pkg.is_featured === 1;
    const includedItems = pkg.included_items || [];
    const includedServices = pkg.included_services || [];

    return `
      <div class="relative bg-white rounded-3xl overflow-hidden border ${isFeatured ? 'border-2 border-burgundy shadow-xl' : 'border-stone-200 shadow-sm'} card-hover flex flex-col justify-between">
        ${isFeatured ? `
          <div class="bg-burgundy text-amber-300 text-xs font-bold uppercase tracking-wider text-center py-2">
            <i class="fa-solid fa-crown mr-1"></i> ${pkg.badge || 'Most Popular Choice'}
          </div>
        ` : ''}

        <!-- Image Banner -->
        <div class="h-48 relative overflow-hidden">
          <img src="${pkg.image_url || 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80'}"
               alt="${pkg.name}"
               class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div class="absolute bottom-4 left-5 right-5 flex justify-between items-end text-white">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-300">${pkg.courses_count ? `${pkg.courses_count}-Course Experience` : 'Full Service'}</span>
              <h3 class="text-xl font-bold font-serif leading-tight">${pkg.name}</h3>
            </div>
            <div class="text-right">
              <span class="text-xs text-stone-200">From</span>
              <div class="text-2xl font-bold font-serif text-amber-300">$${pkg.price_per_person.toFixed(2)}</div>
              <span class="text-[10px] text-stone-300">per guest</span>
            </div>
          </div>
        </div>

        <!-- Package Body -->
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <p class="text-xs text-stone-600 mb-4 leading-relaxed">${pkg.description}</p>

            <div class="flex items-center gap-4 text-xs font-semibold text-stone-700 pb-4 mb-4 border-b border-stone-100">
              <span><i class="fa-solid fa-users text-burgundy mr-1"></i> Min: ${pkg.min_guests} Guests</span>
              ${pkg.max_guests ? `<span><i class="fa-solid fa-user-group text-burgundy mr-1"></i> Max: ${pkg.max_guests} Guests</span>` : ''}
            </div>

            <!-- Inclusions -->
            <div class="mb-5">
              <h5 class="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Culinary Inclusions</h5>
              <ul class="space-y-1.5 text-xs text-stone-700">
                ${includedItems.map(item => `
                  <li class="flex items-start gap-2">
                    <i class="fa-solid fa-circle-check text-green-600 text-xs mt-0.5 shrink-0"></i>
                    <span>${item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Included Services -->
            <div class="mb-5">
              <h5 class="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hospitality & Setup</h5>
              <ul class="space-y-1.5 text-xs text-stone-700">
                ${includedServices.map(srv => `
                  <li class="flex items-start gap-2">
                    <i class="fa-solid fa-star text-amber-500 text-xs mt-0.5 shrink-0"></i>
                    <span>${srv}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Action Button -->
          <div class="pt-4 border-t border-stone-100 mt-4">
            <a href="/quote?package=${pkg.slug}" class="w-full ${isFeatured ? 'btn-primary' : 'btn-secondary'} text-xs font-bold text-center block">
              Request This Package <i class="fa-solid fa-arrow-right ml-1"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
