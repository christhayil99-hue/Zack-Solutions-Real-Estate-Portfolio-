// frontend/js/app.js
// This one file handles all the frontend JavaScript for every page.
// Each function is clearly labeled so you know what page it belongs to.

// ── API Helper ────────────────────────────────────────────────────────────────
// Instead of writing fetch() over and over, this helper function makes it easier

// Adds the admin login token (if there is one) to a request's headers
function authHeaders(extra = {}) {
  const token = localStorage.getItem('adminToken');
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

// Reads the server's reply. If the admin login has expired (401),
// clear it and send the admin back to the login page.
function handleResponse(r) {
  if (r.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.replace('/login.html');
  }
  // Some error replies aren't JSON; turn those into a normal error object
  return r.json().catch(() => ({ success: false, message: `Request failed (${r.status})` }));
}

const API = {
  // GET: retrieve data from the server
  get: (url) => fetch(url, { headers: authHeaders() }).then(handleResponse),

  // POST: send new data to the server
  post: (url, data) => fetch(url, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  }).then(handleResponse),

  // PUT: update existing data on the server
  put: (url, data) => fetch(url, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  }).then(handleResponse),

  // DELETE: remove data from the server
  delete: (url) => fetch(url, { method: 'DELETE', headers: authHeaders() }).then(handleResponse),
};

// ── Utility Helpers ───────────────────────────────────────────────────────────

// Formats a number as currency: 1250000 → "$1,250,000"
function formatPrice(price, type) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price);
  return type === 'rent' ? `${formatted}/mo` : formatted;
}

// Makes text safe to put inside HTML (so typed-in text can never run as code)
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Friendly names for the category codes
const CATEGORY_LABELS = {
  'office': 'Office Space', 'retail': 'Retail Space', 'industrial': 'Industrial',
  'home': 'Home Space', 'luxury': 'Luxury Homes', 'modern': 'Modern Living',
  'family': 'Family Communities', 'real-estate': 'Real Estate', 'vacant-land': 'Vacant Land',
  'construction-design': 'Construction & Interior Design', 'commercial-investment': 'Commercial Properties',
  'income-properties': 'Income Properties', 'multifamily': 'Multi-Family Properties',
  'development': 'Development Opportunities',
};

// All photos for a listing (the first one is the cover photo)
function listingPhotos(p) {
  if (p.images && p.images.length) return p.images;
  return p.image ? [p.image] : [];
}

// Shown when a listing has no photos yet
const NO_PHOTO_HTML = '<div class="no-photo">Photo coming soon</div>';

// Get a query param from the URL: ?id=abc123 → "abc123"
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Show a success or error message to the user
function showAlert(message, type = 'success') {
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.textContent = message;
  document.querySelector('.admin-main, .inquiry-card, main')?.prepend(div);
  setTimeout(() => div.remove(), 4000); // disappears after 4 seconds
}

// Build one property card HTML string
function buildCard(p) {
  const cover = listingPhotos(p)[0];
  const tags = [];
  if (p.bedrooms > 0)   tags.push(`${p.bedrooms} bd`);
  if (p.bathrooms > 0)  tags.push(`${p.bathrooms} ba`);
  if (p.squareFeet > 0) tags.push(`${p.squareFeet.toLocaleString()} sqft`);
  if (tags.length === 0 && CATEGORY_LABELS[p.category]) tags.push(CATEGORY_LABELS[p.category]);

  return `
    <div class="card">
      <div class="card-img" onclick="window.location.href='detail.html?id=${p._id}'">
        ${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(p.title)}" loading="lazy">` : NO_PHOTO_HTML}
        <span class="badge badge-${p.type} card-badge-overlay">${p.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
        <button type="button" class="fav-btn" title="Save" onclick="event.stopPropagation(); this.classList.toggle('active')">♥</button>
      </div>
      <div class="card-body" onclick="window.location.href='detail.html?id=${p._id}'">
        <p class="card-price">${formatPrice(p.price, p.type)}</p>
        <p class="card-title">${escapeHtml(p.title)}</p>
        <p class="card-address">${escapeHtml(p.address.street)}, ${escapeHtml(p.address.city)}, ${escapeHtml(p.address.state)}</p>
        <div class="card-tags">
          ${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <a class="card-view-link" href="detail.html?id=${p._id}" onclick="event.stopPropagation()">View Details →</a>
      </div>
    </div>`;
}

// ── PAGE: Homepage (index.html) ───────────────────────────────────────────────
// Loads 3 featured (most recent) listings for the homepage

async function loadFeatured() {
  const container = document.getElementById('featured-listings');
  if (!container) return; // only run on homepage

  container.innerHTML = '<p class="loading">Loading listings...</p>';

  const result = await API.get('/api/properties');

  if (!result.success || result.data.length === 0) {
    container.innerHTML = '<p class="empty-state">No listings found.</p>';
    return;
  }

  // Show only the first 3 listings on the homepage
  const featured = result.data.slice(0, 3);
  container.innerHTML = featured.map(buildCard).join('');
}

// ── PAGE: Listings Page (listings.html) ───────────────────────────────────────
// Loads all listings and handles search filtering

const PAGE_SIZE = 8;
let currentListings = [];
let currentPage = 1;

async function loadListings() {
  const container = document.getElementById('all-listings');
  if (!container) return; // only run on listings page

  container.innerHTML = '<p class="loading">Loading listings...</p>';
  const pager = document.getElementById('pagination');
  if (pager) pager.innerHTML = '';

  // If the page was opened with ?category=office (e.g. clicked from the
  // homepage category cards), pre-select that option in the dropdown
  // before we read the filter values below.
  const categoryFromUrl = getParam('category');
  const categorySelect = document.getElementById('filter-category');
  if (categoryFromUrl && categorySelect) {
    categorySelect.value = categoryFromUrl;
    // Clean the URL so this param doesn't override the dropdown on subsequent searches
    history.replaceState(null, '', window.location.pathname);
  }

  // Read filter values from the filter form
  const type      = document.getElementById('filter-type')?.value       || '';
  const minPrice  = document.getElementById('filter-min-price')?.value  || '';
  const maxPrice  = document.getElementById('filter-max-price')?.value  || '';
  const bedrooms  = document.getElementById('filter-bedrooms')?.value   || '';
  const category  = document.getElementById('filter-category')?.value  || '';

  // These three filters, plus sorting, aren't sent to the server yet —
  // they're applied below, in the browser, after the data comes back.
  const location  = document.getElementById('filter-location')?.value.trim().toLowerCase() || '';
  const bathrooms = document.getElementById('filter-bathrooms')?.value  || '';
  const minSqft   = document.getElementById('filter-min-sqft')?.value   || '';
  const sortBy    = document.getElementById('sort-by')?.value           || 'featured';

  // Build the query string to send to the API
  const params = new URLSearchParams();
  if (type)     params.set('type', type);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (bedrooms) params.set('bedrooms', bedrooms);
  if (category) params.set('category', category);

  const url = `/api/properties?${params.toString()}`;
  let result = await API.get(url);
  if (!result.success) {
    // The free server can take a few seconds to reconnect after waking up; try once more
    await new Promise(r => setTimeout(r, 3000));
    result = await API.get(url);
  }

  const count = document.getElementById('listing-count');
  if (count) count.textContent = '';

  const filtersActive = [type, minPrice, maxPrice, bedrooms, category, location, bathrooms, minSqft].some(Boolean);

  if (!result.success) {
    container.innerHTML = emptyStateHtml('unavailable');
    return;
  }
  if (result.data.length === 0) {
    container.innerHTML = emptyStateHtml(filtersActive ? 'no-match' : 'coming-soon');
    return;
  }

  // Apply the location / bathrooms / min sq ft filters ourselves,
  // since the server doesn't know about these yet
  let listings = result.data;

  if (location) {
    listings = listings.filter(p =>
      `${p.address.street} ${p.address.city} ${p.address.state} ${p.address.zip}`
        .toLowerCase()
        .includes(location)
    );
  }

  if (bathrooms) {
    listings = listings.filter(p => p.bathrooms >= Number(bathrooms));
  }

  if (minSqft) {
    listings = listings.filter(p => (p.squareFeet || 0) >= Number(minSqft));
  }

  // Sort (also done here in the browser)
  if (sortBy === 'price-low')  listings = [...listings].sort((a, b) => a.price - b.price);
  if (sortBy === 'price-high') listings = [...listings].sort((a, b) => b.price - a.price);
  if (sortBy === 'newest')     listings = [...listings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (listings.length === 0) {
    container.innerHTML = emptyStateHtml('no-match');
    return;
  }

  if (count) count.textContent = `${listings.length} ${listings.length === 1 ? 'PROPERTY' : 'PROPERTIES'} FOUND`;

  renderPage(listings, 1);
}

// Messages shown on the Listings page when there's nothing to show
function emptyStateHtml(kind) {
  if (kind === 'coming-soon') {
    return `
      <div class="empty-state empty-state-panel">
        <h3>New Listings Coming Soon</h3>
        <p>We're preparing our latest properties. Contact us to hear about opportunities before they're listed.</p>
        <a class="btn btn-dark" href="contact.html">Contact Us</a>
      </div>`;
  }
  if (kind === 'unavailable') {
    return `
      <div class="empty-state empty-state-panel">
        <h3>Listings are loading</h3>
        <p>We couldn't load the listings just now. Please refresh the page in a moment.</p>
        <button class="btn btn-dark" onclick="loadListings()">Try again</button>
      </div>`;
  }
  return `
    <div class="empty-state empty-state-panel">
      <h3>No listings match your search</h3>
      <p>Try different filters, or contact us and we'll help you find the right property.</p>
      <button class="btn btn-outline" onclick="clearFilters()">Clear filters</button>
      <a class="btn btn-dark" href="contact.html" style="margin-left:8px">Contact Us</a>
    </div>`;
}

// Show one page of results and build the pagination buttons below them
function renderPage(listings, page) {
  currentListings = listings;
  currentPage = page;

  const container = document.getElementById('all-listings');
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = listings.slice(start, start + PAGE_SIZE);

  container.innerHTML = pageItems.map(buildCard).join('');
  renderPagination(listings.length, page);
}

function renderPagination(totalItems, page) {
  const pager = document.getElementById('pagination');
  if (!pager) return;

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  if (totalPages <= 1) { pager.innerHTML = ''; return; }

  let buttons = '';
  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button type="button" class="page-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  buttons += `<button type="button" class="page-btn" ${page === totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">Next →</button>`;

  pager.innerHTML = buttons;
}

function goToPage(page) {
  renderPage(currentListings, page);
  document.getElementById('all-listings').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Toggle the "More Filters" panel (Bedrooms, Bathrooms, Min Sq Ft)
function toggleMoreFilters() {
  const panel = document.getElementById('more-filters');
  const btn   = document.getElementById('more-filters-btn');
  const isOpen = panel.classList.toggle('open');
  btn.textContent = isOpen ? '⌃ Fewer Filters' : '⌄ More Filters';
}

// Switch between List View and Map View
// (Map View is a placeholder for now — no real map is wired up yet)
function setView(view) {
  const listBtn = document.getElementById('view-list-btn');
  const mapBtn  = document.getElementById('view-map-btn');
  const grid    = document.getElementById('all-listings');
  const mapPane = document.getElementById('map-placeholder');

  if (view === 'map') {
    grid.style.display = 'none';
    mapPane.style.display = 'flex';
    listBtn.classList.remove('active');
    mapBtn.classList.add('active');
  } else {
    grid.style.display = 'grid';
    mapPane.style.display = 'none';
    mapBtn.classList.remove('active');
    listBtn.classList.add('active');
  }
}

function clearFilters() {
  document.getElementById('filter-min-price').value  = '';
  document.getElementById('filter-max-price').value  = '';
  document.getElementById('filter-bedrooms').value   = '';
  document.getElementById('filter-category').value   = '';
  document.getElementById('filter-type').value       = '';
  document.getElementById('filter-location').value   = '';
  document.getElementById('filter-bathrooms').value  = '';
  document.getElementById('filter-min-sqft').value   = '';
  document.getElementById('sort-by').value           = 'featured';
  loadListings();
}

// ── PAGE: Property Detail (detail.html) ───────────────────────────────────────
// Loads one property and handles the inquiry form submission

async function loadDetail() {
  const container = document.getElementById('property-detail');
  if (!container) return; // only run on detail page

  const id = getParam('id'); // get the ?id= from the URL
  if (!id) {
    container.innerHTML = '<p class="loading">No property selected.</p>';
    return;
  }

  const result = await API.get(`/api/properties/${id}`);

  if (!result.success) {
    container.innerHTML = '<p class="loading">Property not found.</p>';
    return;
  }

  const p = result.data;
  document.title = `${p.title} — Zack Real Estate Inc.`; // update page tab title

  const photos = listingPhotos(p);
  const gallery = photos.length ? `
    <div class="detail-photo"><img id="detail-main-photo" src="${escapeHtml(photos[0])}" alt="${escapeHtml(p.title)}"></div>
    ${photos.length > 1 ? `
    <div class="detail-thumbs">
      ${photos.map((u, i) => `
        <button type="button" class="detail-thumb ${i === 0 ? 'active' : ''}" data-src="${escapeHtml(u)}" onclick="showDetailPhoto(this)">
          <img src="${escapeHtml(u)}" alt="Photo ${i + 1}" loading="lazy">
        </button>`).join('')}
    </div>` : ''}`
    : `<div class="detail-photo">${NO_PHOTO_HTML}</div>`;

  const stats = [];
  if (p.bedrooms != null)  stats.push(['Bedrooms', p.bedrooms]);
  if (p.bathrooms != null) stats.push(['Bathrooms', p.bathrooms]);
  if (p.squareFeet)        stats.push(['Sq Ft', p.squareFeet.toLocaleString()]);
  if (p.yearBuilt)         stats.push(['Year Built', p.yearBuilt]);
  if (CATEGORY_LABELS[p.category]) stats.unshift(['Property Type', CATEGORY_LABELS[p.category]]);

  // Build the detail page HTML
  container.innerHTML = `
    ${gallery}
    <div class="badge badge-${p.type}" style="display:inline-block;margin:16px 0 12px">
      ${p.type === 'sale' ? 'For Sale' : 'For Rent'}
    </div>
    <h1 class="detail-title">${escapeHtml(p.title)}</h1>
    <p class="detail-price">${formatPrice(p.price, p.type)}</p>
    <p class="detail-address">${escapeHtml(p.address.street)}, ${escapeHtml(p.address.city)}, ${escapeHtml(p.address.state)} ${escapeHtml(p.address.zip)}</p>

    ${stats.length ? `
    <div class="stats-grid">
      ${stats.map(([label, value]) => `
      <div class="stat-card">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${escapeHtml(value)}</div>
      </div>`).join('')}
    </div>` : ''}

    <hr class="divider">
    <h3 style="font-size:16px;margin-bottom:10px">About this property</h3>
    <p style="color:#555;font-size:15px;white-space:pre-line">${escapeHtml(p.description)}</p>

    ${p.features && p.features.length > 0 ? `
    <hr class="divider">
    <h3 style="font-size:16px;margin-bottom:10px">Features & amenities</h3>
    <div class="features-list">
      ${p.features.map(f => `<span class="tag">${escapeHtml(f)}</span>`).join('')}
    </div>` : ''}
  `;

  // Store the property info for the inquiry form
  document.getElementById('inquiry-property-id').value    = p._id;
  document.getElementById('inquiry-property-title').value = p.title;
}

// Detail page: clicking a small photo shows it as the main photo
function showDetailPhoto(btn) {
  document.getElementById('detail-main-photo').src = btn.dataset.src;
  document.querySelectorAll('.detail-thumb').forEach(b => b.classList.toggle('active', b === btn));
}

// Submit inquiry form
async function submitInquiry(e) {
  e.preventDefault(); // stop the page from refreshing

  const form = e.target;
  const data = {
    propertyId:    document.getElementById('inquiry-property-id').value,
    propertyTitle: document.getElementById('inquiry-property-title').value,
    name:    form.name.value,
    email:   form.email.value,
    phone:   form.phone.value,
    message: form.message.value,
  };

  const btn = form.querySelector('button[type=submit]');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  const result = await API.post('/api/inquiries', data);

  if (result.success) {
    form.reset();
    showAlert('Your inquiry was sent! We will be in touch soon.', 'success');
  } else {
    showAlert('Something went wrong. Please try again.', 'error');
  }

  btn.textContent = 'Send Inquiry';
  btn.disabled = false;
}

// ── PAGE: Admin Dashboard (admin.html) ────────────────────────────────────────
// Show all listings in a table with edit/delete, and show inquiries

async function loadAdminListings() {
  const tbody = document.getElementById('admin-listings-body');
  if (!tbody) return;

  // ?all=1 includes sold and rented listings (admins only)
  const result = await API.get('/api/properties?all=1');
  if (!result.success) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#991b1b;">${escapeHtml(result.message || 'Could not load listings.')} <a href="#" onclick="loadAdminListings();return false">Try again</a></td></tr>`;
    return;
  }

  if (result.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">No listings yet. Use "Add new listing" to add your first property.</td></tr>';
    return;
  }

  tbody.innerHTML = result.data.map(p => {
    const cover = listingPhotos(p)[0];
    return `
    <tr>
      <td>
        <div class="admin-listing-title">
          ${cover ? `<img src="${escapeHtml(cover)}" alt="" class="admin-thumb">` : '<span class="admin-thumb admin-thumb-empty">No photo</span>'}
          <span>${escapeHtml(p.title)}</span>
        </div>
      </td>
      <td>${escapeHtml(p.address.city)}, ${escapeHtml(p.address.state)}</td>
      <td>${formatPrice(p.price, p.type)}</td>
      <td><span class="badge badge-${p.type}">${p.type}</span></td>
      <td><span class="badge">${escapeHtml(p.status)}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline" style="padding:6px 12px;font-size:12px"
          onclick="editProperty('${p._id}')">Edit</button>
        <button class="btn btn-danger" style="padding:6px 12px;font-size:12px;margin-left:6px"
          onclick="deleteProperty('${p._id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

async function loadAdminInquiries() {
  const tbody = document.getElementById('admin-inquiries-body');
  if (!tbody) return;

  const result = await API.get('/api/inquiries');
  if (!result.success) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#991b1b;">${escapeHtml(result.message || 'Could not load inquiries.')}</td></tr>`;
    return;
  }

  if (result.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;">No inquiries yet.</td></tr>';
    return;
  }

  tbody.innerHTML = result.data.map(inq => `
    <tr>
      <td>${escapeHtml(inq.name)}</td>
      <td><a href="mailto:${escapeHtml(inq.email)}">${escapeHtml(inq.email)}</a></td>
      <td>${escapeHtml(inq.phone || '—')}</td>
      <td>${escapeHtml(inq.propertyTitle || 'General Inquiry')}</td>
      <td class="inquiry-message">${escapeHtml(inq.message)}</td>
      <td>
        <select onchange="updateInquiry('${inq._id}', this.value)" style="padding:4px;border-radius:6px;border:1px solid #ddd;font-size:12px">
          <option ${inq.status==='new'       ? 'selected' : ''} value="new">New</option>
          <option ${inq.status==='contacted' ? 'selected' : ''} value="contacted">Contacted</option>
          <option ${inq.status==='closed'    ? 'selected' : ''} value="closed">Closed</option>
        </select>
      </td>
      <td style="color:#888;font-size:12px">${new Date(inq.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-danger" style="padding:6px 12px;font-size:12px"
          onclick="deleteInquiry('${inq._id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function deleteProperty(id) {
  if (!confirm('Are you sure you want to delete this listing?')) return;

  const result = await API.delete(`/api/properties/${id}`);
  if (result.success) {
    showAlert('Listing deleted.', 'success');
    loadAdminListings(); // reload the table
  } else {
    showAlert('Error deleting listing.', 'error');
  }
}

async function updateInquiry(id, status) {
  const result = await API.put(`/api/inquiries/${id}`, { status });
  if (!result.success) showAlert('Error updating inquiry.', 'error');
}

async function deleteInquiry(id) {
  if (!confirm('Are you sure you want to delete this inquiry?')) return;

  const result = await API.delete(`/api/inquiries/${id}`);
  if (result.success) {
    showAlert('Inquiry deleted.', 'success');
    loadAdminInquiries();
  } else {
    showAlert('Error deleting inquiry.', 'error');
  }
}

// ── Admin: add / edit listing form, with photo uploads ──────────────────────

const MAX_PHOTOS = 15;
let photoItems = [];   // each item is { url } (already uploaded) or { blob, preview } (new)
let editingId  = null; // id of the listing being edited, or null when adding a new one

// Shrinks a photo in the browser before upload (max 1600px, JPEG),
// so uploads are fast and the database doesn't fill up
function resizeImage(file, maxSize = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const scale  = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(src);
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('unreadable'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('unreadable')); };
    img.src = src;
  });
}

// Photos chosen with the file picker
function handlePhotoSelect(e) {
  const files = [...e.target.files];
  e.target.value = ''; // allows picking the same file again later
  addPhotoFiles(files);
}

// Lets admins drag photos from their computer onto the photo box
function setupPhotoDropZone() {
  const zone = document.querySelector('.photo-drop');
  if (!zone) return;

  // Stop the browser from opening a photo if it's dropped outside the box
  ['dragover', 'drop'].forEach(evt =>
    window.addEventListener(evt, e => e.preventDefault())
  );

  let depth = 0; // tracks entering/leaving child elements inside the box
  zone.addEventListener('dragenter', e => { e.preventDefault(); depth++; zone.classList.add('drag-over'); });
  zone.addEventListener('dragover',  e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  zone.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; zone.classList.remove('drag-over'); } });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    depth = 0;
    zone.classList.remove('drag-over');
    addPhotoFiles([...e.dataTransfer.files]);
  });
}

// Adds photo files (from the picker or drag-and-drop) to the listing
async function addPhotoFiles(files) {
  const status = document.getElementById('photo-status');
  for (const file of files) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      showAlert(`"${file.name}" isn't a JPG or PNG photo, so it was skipped.`, 'error');
      continue;
    }
    if (photoItems.length >= MAX_PHOTOS) {
      showAlert(`You can add up to ${MAX_PHOTOS} photos per listing.`, 'error');
      break;
    }
    if (status) status.textContent = `Preparing ${file.name}...`;
    try {
      const blob = await resizeImage(file);
      photoItems.push({ blob, preview: URL.createObjectURL(blob) });
    } catch {
      showAlert(`Couldn't read "${file.name}". Please use a JPG or PNG photo.`, 'error');
    }
  }
  if (status) status.textContent = '';
  renderPhotoPreviews();
}

function renderPhotoPreviews() {
  const box = document.getElementById('photo-previews');
  if (!box) return;
  box.innerHTML = photoItems.map((item, i) => `
    <div class="photo-thumb">
      <img src="${escapeHtml(item.preview || item.url)}" alt="Photo ${i + 1}">
      ${i === 0
        ? '<span class="photo-cover-label">Cover photo</span>'
        : `<button type="button" class="photo-make-cover" onclick="makeCoverPhoto(${i})">Make cover</button>`}
      <button type="button" class="photo-remove" title="Remove photo" onclick="removePhoto(${i})">✕</button>
    </div>`).join('');
  const count = document.getElementById('photo-count');
  if (count) count.textContent = photoItems.length ? `${photoItems.length} of ${MAX_PHOTOS} photos ·` : '';
}

function removePhoto(i) {
  const [item] = photoItems.splice(i, 1);
  if (item.preview) URL.revokeObjectURL(item.preview);
  renderPhotoPreviews();
}

function makeCoverPhoto(i) {
  const [item] = photoItems.splice(i, 1);
  photoItems.unshift(item);
  renderPhotoPreviews();
}

// Uploads any new photos and returns the full list of photo links, in order
async function uploadPendingPhotos(onProgress) {
  const pending = photoItems.filter(item => item.blob);
  let done = 0;
  for (const item of pending) {
    const result = await fetch('/api/photos', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': item.blob.type }),
      body: item.blob,
    }).then(handleResponse);
    if (!result.success) throw new Error(result.message || 'Photo upload failed');
    item.url = result.url;
    delete item.blob; // already uploaded, so a retry won't upload it twice
    onProgress?.(++done, pending.length);
  }
  return photoItems.map(item => item.url);
}

function resetPropertyForm() {
  const form = document.getElementById('add-property-form');
  if (!form) return;
  form.reset();
  photoItems.forEach(item => item.preview && URL.revokeObjectURL(item.preview));
  photoItems = [];
  editingId = null;
  document.getElementById('property-form-heading').textContent = 'Add new listing';
  form.querySelector('button[type=submit]').textContent = 'Add listing';
  document.getElementById('cancel-edit-btn').style.display = 'none';
  renderPhotoPreviews();
}

// Sidebar "Add new listing" link
function startNewListing() {
  resetPropertyForm();
  showTab('add');
}

// "Edit" button in the listings table: loads the listing into the form
async function editProperty(id) {
  const result = await API.get(`/api/properties/${id}`);
  if (!result.success) {
    showAlert('Could not load that listing.', 'error');
    return;
  }
  const p = result.data;
  const form = document.getElementById('add-property-form');
  const field = (name) => form.elements[name];

  resetPropertyForm();
  editingId = id;

  field('title').value       = p.title || '';
  field('street').value      = p.address?.street || '';
  field('city').value        = p.address?.city || '';
  // State dropdown: if an older listing has a state the list doesn't know, add it so it isn't lost
  const stateCode = (p.address?.state || '').toUpperCase();
  const stateSelect = field('state');
  if (stateCode && ![...stateSelect.options].some(o => o.value === stateCode)) {
    stateSelect.add(new Option(stateCode, stateCode));
  }
  stateSelect.value = stateCode;
  field('zip').value         = p.address?.zip || '';
  field('category').value    = p.category || '';
  field('price').value       = p.price ?? '';
  field('type').value        = p.type || 'sale';
  field('status').value      = p.status || 'active';
  field('bedrooms').value    = p.bedrooms ?? '';
  field('bathrooms').value   = p.bathrooms ?? '';
  field('squareFeet').value  = p.squareFeet ?? '';
  field('yearBuilt').value   = p.yearBuilt ?? '';
  field('description').value = p.description || '';
  field('features').value    = (p.features || []).join(', ');

  photoItems = (p.images || []).map(url => ({ url }));
  renderPhotoPreviews();

  document.getElementById('property-form-heading').textContent = 'Edit listing';
  form.querySelector('button[type=submit]').textContent = 'Save changes';
  document.getElementById('cancel-edit-btn').style.display = 'inline-block';
  showTab('add');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Admin: submit the add / edit form
async function submitAdminProperty(e) {
  e.preventDefault();
  const form = e.target;
  const field = (name) => form.elements[name].value;
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;

  try {
    btn.textContent = 'Uploading photos...';
    const images = await uploadPendingPhotos((done, total) => {
      btn.textContent = `Uploading photos (${done}/${total})...`;
    });

    btn.textContent = 'Saving...';
    const data = {
      title:    field('title'),
      category: field('category'),
      address: {
        street: field('street'),
        city:   field('city'),
        state:  field('state').toUpperCase(),
        zip:    field('zip'),
      },
      price:       field('price'),
      type:        field('type'),
      status:      field('status'),
      bedrooms:    field('bedrooms'),
      bathrooms:   field('bathrooms'),
      squareFeet:  field('squareFeet'),
      yearBuilt:   field('yearBuilt'),
      description: field('description'),
      // Features: split comma-separated text into an array
      features: field('features') ? field('features').split(',').map(f => f.trim()).filter(Boolean) : [],
      images,
    };

    const wasEditing = Boolean(editingId);
    const result = wasEditing
      ? await API.put(`/api/properties/${editingId}`, data)
      : await API.post('/api/properties', data);

    if (result.success) {
      resetPropertyForm();
      showTab('listings');
      showAlert(wasEditing ? 'Listing updated!' : 'Listing added successfully!', 'success');
      loadAdminListings();
    } else {
      showAlert(`Error: ${result.message}`, 'error');
    }
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editingId ? 'Save changes' : 'Add listing';
  }
}

// ── PAGE: About Us (about.html) — category detail modal ───────────────────────

const ABOUT_DETAILS = {
  'real-estate': {
    title: 'Real Estate',
    subtitle: 'Commercial Real Estate | Investment Real Estate',
    blocks: [
      { heading: 'Commercial Real Estate', text: `Explore properties designed for business operations, including office buildings, retail spaces, restaurants, mixed-use properties, and other commercial assets. We help clients evaluate acquisition, leasing, disposition, and investment opportunities based on location, property characteristics, and business objectives. U.S. commercial real estate commonly includes sales, leasing, property management, investment, and development activities.` },
      { heading: 'Investment Real Estate', text: `Identify income-producing and value-add real estate opportunities with a focus on rental income, property fundamentals, location, operating performance, and long-term potential.` },
      { heading: 'What We Provide', list: [
        'Property identification and acquisition support',
        'Investment opportunity analysis',
        'Market and location research',
        'Property comparison',
        'Acquisition and disposition support',
        'Commercial property strategy',
        'Development opportunity evaluation',
      ]},
    ]
  },
  'vacant-land': {
    title: 'Vacant Land',
    subtitle: 'Land Acquisition | Investment | Development',
    blocks: [
      { heading: 'Land Acquisition', text: `Identify vacant or underutilized land suitable for commercial, multifamily, mixed-use, or other development concepts. Each opportunity can be evaluated based on location, access, zoning, permitted use, utilities, site conditions, and development potential.` },
      { heading: 'Land Investment', text: `Vacant land can be considered as a longer-term investment when the surrounding market, planned infrastructure, zoning environment, and potential future use support the investment strategy.` },
      { heading: 'Land Development', text: `Evaluate development concepts from initial site selection through feasibility, planning, approvals, construction, and eventual sale or operation.` },
      { heading: 'What We Review', list: [
        'Location and accessibility',
        'Zoning and permitted uses',
        'Parcel size and configuration',
        'Road access',
        'Utilities and infrastructure',
        'Development potential',
        'Surrounding properties',
        'Market demand',
        'Potential development costs',
      ]},
    ]
  },
  'construction-design': {
    title: 'Construction & Interior Design',
    subtitle: 'Construction | Interior Design',
    blocks: [
      { heading: 'Construction', text: `Deliver commercial construction solutions from planning and pre-construction through project completion. Our approach can cover project coordination, construction execution, quality control, scheduling, and coordination with relevant professionals and contractors.` },
      { heading: 'Interior Design', text: `Create functional and visually distinctive commercial interiors designed around the property's purpose and the client's brand. Solutions can include space planning, material selection, finishes, lighting concepts, furniture layouts, and overall interior coordination.` },
      { heading: 'Project Types', list: [
        'Restaurants', 'Retail spaces', 'Office properties', 'Commercial buildings',
        'Mixed-use spaces', 'Investment properties', 'Renovation and improvement projects',
      ]},
      { heading: 'Our Process', list: [
        'Initial consultation', 'Site and project assessment', 'Concept and planning',
        'Budget development', 'Construction / implementation', 'Interior finishes',
        'Quality review', 'Project completion',
      ]},
    ]
  },
  'commercial-investment': {
    title: 'Commercial Properties',
    subtitle: 'Investment Options',
    blocks: [
      { text: `Invest in or acquire commercial properties that can support business operations and income generation. Opportunities may include office buildings, retail properties, restaurants, service businesses, and other commercial assets.` },
      { heading: 'Potential Opportunities', list: [
        'Office buildings', 'Retail properties', 'Restaurant properties',
        'Mixed-use commercial properties', 'Business-use buildings', 'Commercial redevelopment opportunities',
      ]},
      { heading: 'Investment Considerations', list: [
        'Purchase price', 'Location', 'Tenant profile', 'Lease terms', 'Operating expenses',
        'Existing or potential rental income', 'Property condition', 'Market demand', 'Future repositioning potential',
      ]},
    ]
  },
  'income-properties': {
    title: 'Income Properties',
    subtitle: 'Investment Options',
    blocks: [
      { text: `Income properties are real estate assets intended to generate recurring rental income. Opportunities may include apartment buildings, mixed-use properties, and other rental assets.` },
      { heading: 'What We Evaluate', list: [
        'Existing rental income', 'Occupancy', 'Rental rates', 'Operating expenses',
        'Property condition', 'Location and surrounding market', 'Potential for improving operations or property value',
      ]},
      { heading: 'Investment Approach', text: `The objective is to identify properties where the underlying income profile and property fundamentals align with the investor's strategy and risk considerations.` },
    ]
  },
  'multifamily': {
    title: 'Multifamily Properties',
    subtitle: 'Investment Options',
    blocks: [
      { text: `Explore multifamily properties such as apartment communities and other residential rental properties with multiple units. These properties can range from smaller apartment buildings to larger multifamily developments. HUD's multifamily programs cover rental properties with five or more units, including financing and programs related to construction, rehabilitation, refinancing, and acquisition.` },
      { heading: 'Potential Opportunities', list: [
        'Apartment buildings', 'Multifamily communities', 'Value-add properties',
        'Existing rental communities', 'Multifamily development sites', 'Acquisition and repositioning opportunities',
      ]},
      { heading: 'What We Evaluate', list: [
        'Number of units', 'Occupancy', 'Rental income', 'Operating expenses', 'Property condition',
        'Local rental market', 'Renovation potential', 'Long-term investment objectives',
      ]},
    ]
  },
  'development': {
    title: 'Development Opportunities',
    subtitle: 'Investment Options',
    blocks: [
      { text: `Identify properties and land with potential for future development, redevelopment, expansion, or repositioning.` },
      { heading: 'Potential Development Types', list: [
        'Commercial developments', 'Multifamily developments', 'Mixed-use projects',
        'Retail developments', 'Restaurant developments', 'Land subdivision opportunities', 'Redevelopment projects',
      ]},
      { heading: 'Development Evaluation', list: [
        'Site location', 'Land size', 'Zoning', 'Access and infrastructure', 'Permitted uses',
        'Market demand', 'Development costs', 'Construction considerations', 'Potential exit strategy',
      ]},
      { heading: 'Development Process', flow: 'Identify → Evaluate → Plan → Entitle → Develop → Build → Stabilize / Sell' },
      { note: `Because zoning, permits, and development requirements are largely jurisdiction-specific, each project should be evaluated according to the applicable local requirements.` },
    ]
  },
};

function openAboutModal(key) {
  const data = ABOUT_DETAILS[key];
  if (!data) return;

  document.getElementById('about-modal-title').textContent = data.title;
  document.getElementById('about-modal-subtitle').textContent = data.subtitle || '';

  const body = document.getElementById('about-modal-body');
  body.innerHTML = data.blocks.map(b => {
    if (b.flow) {
      return `${b.heading ? `<h4 class="about-modal-heading">${b.heading}</h4>` : ''}<div class="about-modal-flow">${b.flow}</div>`;
    }
    if (b.list) {
      return `${b.heading ? `<h4 class="about-modal-heading">${b.heading}</h4>` : ''}<ul class="about-modal-list">${b.list.map(i => `<li>${i}</li>`).join('')}</ul>`;
    }
    if (b.note) {
      return `<p class="about-modal-note">${b.note}</p>`;
    }
    return `${b.heading ? `<h4 class="about-modal-heading">${b.heading}</h4>` : ''}<p class="about-modal-text">${b.text}</p>`;
  }).join('');

  document.getElementById('about-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAboutModal() {
  document.getElementById('about-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAboutModal();
});

// ── Page Initialization ───────────────────────────────────────────────────────
// When the page loads, figure out which page we're on and run the right function

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname;

  if (page.includes('index') || page === '/')   loadFeatured();
  if (page.includes('listings'))                loadListings();
  if (page.includes('detail'))                  loadDetail();
  if (page.includes('admin')) {
    loadAdminListings();
    loadAdminInquiries();
  }

  // Attach event listeners
  document.getElementById('inquiry-form')
    ?.addEventListener('submit', submitInquiry);

  document.getElementById('add-property-form')
    ?.addEventListener('submit', submitAdminProperty);

  document.getElementById('photo-input')
    ?.addEventListener('change', handlePhotoSelect);
  setupPhotoDropZone();

  document.getElementById('filter-form')
    ?.addEventListener('submit', (e) => { e.preventDefault(); loadListings(); });
});
