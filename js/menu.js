/**
 * Grand Heritage Catering - Food Menu Interactive Engine
 * 10 Categories, Live Search, Dietary Filters, and Quote Tray Integration
 */

let allMenuItems = [];
let activeCategory = 'all';
let activeDietary = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
  fetchMenu();

  // Search input listener
  const searchInput = document.getElementById('menu-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterAndRenderMenu();
    });
  }

  // Dietary select listener
  const dietarySelect = document.getElementById('menu-dietary-filter');
  if (dietarySelect) {
    dietarySelect.addEventListener('change', (e) => {
      activeDietary = e.target.value;
      filterAndRenderMenu();
    });
  }
});

async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.categories) {
        renderCategoryPills(data.categories);
        return;
      }
    }
  } catch (err) {}
  if (typeof FALLBACK_CATEGORIES !== 'undefined') {
    renderCategoryPills(FALLBACK_CATEGORIES);
  }
}

function renderCategoryPills(categories) {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  let html = `
    <button onclick="setMenuCategory('all')" class="category-pill px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${activeCategory === 'all' ? 'bg-burgundy text-white shadow-md' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}">
      All Specialties (${allMenuItems.length})
    </button>
  `;

  categories.forEach(cat => {
    html += `
      <button onclick="setMenuCategory('${cat.slug}')" class="category-pill px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${activeCategory === cat.slug ? 'bg-burgundy text-white shadow-md' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}">
        ${cat.name} (${cat.item_count || 0})
      </button>
    `;
  });

  container.innerHTML = html;
}

function setMenuCategory(catSlug) {
  activeCategory = catSlug;
  document.querySelectorAll('.category-pill').forEach(btn => {
    btn.classList.remove('bg-burgundy', 'text-white', 'shadow-md');
    btn.classList.add('bg-stone-100', 'text-stone-700');
  });
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('bg-burgundy', 'text-white', 'shadow-md');
    event.currentTarget.classList.remove('bg-stone-100', 'text-stone-700');
  }
  filterAndRenderMenu();
}

async function fetchMenu() {
  const grid = document.getElementById('menu-items-grid');
  try {
    const res = await fetch('/api/menu');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.menu) {
        allMenuItems = data.menu;
        filterAndRenderMenu();
        fetchCategories();
        return;
      }
    }
  } catch (err) {}
  if (typeof FALLBACK_MENU !== 'undefined') {
    allMenuItems = FALLBACK_MENU;
    filterAndRenderMenu();
    fetchCategories();
  }
}

function filterAndRenderMenu() {
  const grid = document.getElementById('menu-items-grid');
  const countBadge = document.getElementById('menu-filtered-count');
  if (!grid) return;

  let filtered = allMenuItems.filter(item => {
    // Category check
    const matchesCat = activeCategory === 'all' || item.category_slug === activeCategory;

    // Search check
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery) ||
      (item.description && item.description.toLowerCase().includes(searchQuery));

    // Dietary check
    let matchesDietary = true;
    if (activeDietary !== 'all') {
      const tags = Array.isArray(item.dietary_tags) ? item.dietary_tags : [];
      matchesDietary = tags.some(t => t.toLowerCase() === activeDietary.toLowerCase());
    }

    return matchesCat && matchesSearch && matchesDietary;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Dishes Found`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16 bg-stone-50 rounded-3xl border border-dashed border-stone-300">
        <i class="fa-solid fa-utensils text-4xl text-stone-400 mb-3"></i>
        <h4 class="text-xl font-bold text-gray-800">No dishes match your filter</h4>
        <p class="text-sm text-gray-500 mt-1">Try resetting your search query or selecting another dietary preference.</p>
        <button onclick="resetMenuFilters()" class="btn-secondary mt-4 text-xs">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const dietaryBadges = (item.dietary_tags || []).map(tag =>
      `<span class="badge-dietary"><i class="fa-solid fa-leaf text-green-600 text-[10px]"></i> ${tag}</span>`
    ).join(' ');

    const allergenList = (item.allergens || []).length > 0
      ? `<div class="text-[11px] text-stone-400 mt-2"><i class="fa-solid fa-circle-exclamation text-amber-600 mr-1"></i> Allergens: ${item.allergens.join(', ')}</div>`
      : '';

    return `
      <div class="bg-white rounded-2xl overflow-hidden shadow-sm card-hover flex flex-col justify-between">
        <div>
          <!-- Food Image with Badges -->
          <div class="relative h-56 overflow-hidden">
            <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}"
                 alt="${item.name}"
                 class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                 loading="lazy">
            <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-burgundy shadow-sm">
              ${item.category_name || 'Chef Specialty'}
            </span>
            ${item.is_featured ? `
              <span class="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-md">
                <i class="fa-solid fa-star text-[10px]"></i> Signature
              </span>
            ` : ''}
          </div>

          <!-- Content Details -->
          <div class="p-5">
            <div class="flex justify-between items-baseline gap-2 mb-2">
              <h4 class="text-lg font-bold text-gray-900 leading-tight">${item.name}</h4>
              <span class="text-lg font-bold text-burgundy whitespace-nowrap">$${parseFloat(item.price).toFixed(2)}</span>
            </div>

            <p class="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-3">
              ${item.description || 'Prepared with fresh seasonal ingredients by our master chefs.'}
            </p>

            <div class="flex flex-wrap gap-1 mb-2">
              ${dietaryBadges}
            </div>

            ${allergenList}
          </div>
        </div>

        <!-- Add to Quote Tray Button -->
        <div class="p-5 pt-0">
          <button onclick="QuoteTray.addItem(${JSON.stringify(item).replace(/"/g, '&quot;')})"
                  class="w-full py-2.5 px-4 bg-stone-100 hover:bg-burgundy text-stone-800 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
            <i class="fa-solid fa-plus text-xs"></i> Add to Quote Request
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function resetMenuFilters() {
  activeCategory = 'all';
  activeDietary = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('menu-search-input');
  if (searchInput) searchInput.value = '';
  const dietarySelect = document.getElementById('menu-dietary-filter');
  if (dietarySelect) dietarySelect.value = 'all';
  fetchCategories();
  filterAndRenderMenu();
}
