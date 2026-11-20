/**
 * Grand Heritage Catering - Gallery Page Interactive Lightbox
 */

let galleryItems = [];
let currentLightboxIndex = 0;
let currentGalleryFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  fetchGallery();

  // Close lightbox on backdrop click or ESC key
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close-btn')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
    });
  }
});

async function fetchGallery() {
  const grid = document.getElementById('gallery-grid-container');
  if (!grid) return;
  try {
    const res = await fetch('/api/gallery');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.gallery) {
        galleryItems = data.gallery;
        renderGallery();
        return;
      }
    }
  } catch (err) {}
  if (typeof FALLBACK_GALLERY !== 'undefined') {
    galleryItems = FALLBACK_GALLERY;
    renderGallery();
  }
}

function filterGallery(category) {
  currentGalleryFilter = category;
  document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
    btn.classList.remove('bg-burgundy', 'text-white', 'shadow-md');
    btn.classList.add('bg-stone-100', 'text-stone-700');
  });
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('bg-burgundy', 'text-white', 'shadow-md');
    event.currentTarget.classList.remove('bg-stone-100', 'text-stone-700');
  }
  renderGallery();
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid-container');
  if (!grid) return;

  const filtered = galleryItems.filter(item => {
    return currentGalleryFilter === 'all' || item.category === currentGalleryFilter;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16 text-gray-500">
        No photos found in this category.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((item, idx) => `
    <div class="group relative rounded-2xl overflow-hidden shadow-sm aspect-square bg-stone-100 cursor-pointer card-hover"
         onclick="openLightbox(${idx})">
      <img src="${item.image_url}"
           alt="${item.title}"
           class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
           loading="lazy">
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
        <span class="text-[10px] uppercase font-bold tracking-widest text-amber-300 mb-1">${item.category}</span>
        <h4 class="text-base font-bold font-serif leading-tight">${item.title}</h4>
        <p class="text-xs text-stone-200 mt-1 line-clamp-2">${item.caption || ''}</p>
        <span class="mt-3 inline-flex items-center text-xs font-semibold text-amber-300 gap-1">
          <i class="fa-solid fa-expand text-[10px]"></i> View Photo
        </span>
      </div>
    </div>
  `).join('');
}

function openLightbox(index) {
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;

  const filtered = galleryItems.filter(item => {
    return currentGalleryFilter === 'all' || item.category === currentGalleryFilter;
  });

  if (!filtered[index]) return;
  currentLightboxIndex = index;

  updateLightboxContent(filtered[index]);
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function nextLightbox() {
  const filtered = galleryItems.filter(item => {
    return currentGalleryFilter === 'all' || item.category === currentGalleryFilter;
  });
  currentLightboxIndex = (currentLightboxIndex + 1) % filtered.length;
  updateLightboxContent(filtered[currentLightboxIndex]);
}

function prevLightbox() {
  const filtered = galleryItems.filter(item => {
    return currentGalleryFilter === 'all' || item.category === currentGalleryFilter;
  });
  currentLightboxIndex = (currentLightboxIndex - 1 + filtered.length) % filtered.length;
  updateLightboxContent(filtered[currentLightboxIndex]);
}

function updateLightboxContent(item) {
  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const caption = document.getElementById('lightbox-caption');
  const category = document.getElementById('lightbox-category');

  if (img) img.src = item.image_url;
  if (title) title.textContent = item.title;
  if (caption) caption.textContent = item.caption || '';
  if (category) category.textContent = item.category?.toUpperCase() || '';
}
