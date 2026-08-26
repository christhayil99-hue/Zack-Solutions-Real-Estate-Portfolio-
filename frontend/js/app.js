// frontend/js/app.js
// This one file handles all the frontend JavaScript for every page.
// Each function is clearly labeled so you know what page it belongs to.

// ── API Helper ────────────────────────────────────────────────────────────────
// Instead of writing fetch() over and over, this helper function makes it easier

const API = {
  // GET: retrieve data from the server
  get: (url) => fetch(url).then(r => r.json()),

  // POST: send new data to the server
  post: (url, data) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // PUT: update existing data on the server
  put: (url, data) => fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // DELETE: remove data from the server
  delete: (url) => fetch(url, { method: 'DELETE' }).then(r => r.json()),
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
  return `
    <div class="card">
      <div class="card-img" onclick="window.location.href='detail.html?id=${p._id}'">
        ${p.image ? `<img src="${p.image}" alt="${p.title}">` : '🏢'}
        <span class="badge badge-${p.type} card-badge-overlay">${p.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
        <button type="button" class="fav-btn" title="Save" onclick="event.stopPropagation(); this.classList.toggle('active')">♥</button>
      </div>
      <div class="card-body" onclick="window.location.href='detail.html?id=${p._id}'">
        <p class="card-price">${formatPrice(p.price, p.type)}</p>
        <p class="card-address">${p.address.street}, ${p.address.city}, ${p.address.state}</p>
        <div class="card-tags">
          <span class="tag">${p.bedrooms} bd</span>
          <span class="tag">${p.bathrooms} ba</span>
          ${p.squareFeet ? `<span class="tag">${p.squareFeet.toLocaleString()} sqft</span>` : ''}
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
  const result = await API.get(url);

  if (!result.success || result.data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No listings match your search.</p>
        <button class="btn btn-outline" onclick="clearFilters()">Clear filters</button>
      </div>`;
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
    container.innerHTML = `
      <div class="empty-state">
        <p>No listings match your search.</p>
        <button class="btn btn-outline" onclick="clearFilters()">Clear filters</button>
      </div>`;
    return;
  }

  const count = document.getElementById('listing-count');
  if (count) count.textContent = `${listings.length} PROPERTIES FOUND`;

  renderPage(listings, 1);
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
  document.title = `${p.title} — ZSG Realty`; // update page tab title

  // Build the detail page HTML
  container.innerHTML = `
    <div class="detail-photo">${p.image ? `<img src="${p.image}" alt="${p.title}">` : '🏢'}</div>
    <div class="badge badge-${p.type}" style="display:inline-block;margin-bottom:12px">
      ${p.type === 'sale' ? 'For Sale' : 'For Rent'}
    </div>
    <p class="detail-price">${formatPrice(p.price, p.type)}</p>
    <p class="detail-address">${p.address.street}, ${p.address.city}, ${p.address.state} ${p.address.zip}</p>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Bedrooms</div>
        <div class="stat-value">${p.bedrooms}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bathrooms</div>
        <div class="stat-value">${p.bathrooms}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sq Ft</div>
        <div class="stat-value">${p.squareFeet ? p.squareFeet.toLocaleString() : '—'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Year Built</div>
        <div class="stat-value">${p.yearBuilt || '—'}</div>
      </div>
    </div>

    <hr class="divider">
    <h3 style="font-size:16px;margin-bottom:10px">About this property</h3>
    <p style="color:#555;font-size:15px">${p.description}</p>

    ${p.features && p.features.length > 0 ? `
    <hr class="divider">
    <h3 style="font-size:16px;margin-bottom:10px">Features & amenities</h3>
    <div class="features-list">
      ${p.features.map(f => `<span class="tag">${f}</span>`).join('')}
    </div>` : ''}
  `;

  // Store the property info for the inquiry form
  document.getElementById('inquiry-property-id').value    = p._id;
  document.getElementById('inquiry-property-title').value = p.title;
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

  const result = await API.get('/api/properties');
  if (!result.success) return;

  if (result.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">No listings yet.</td></tr>';
    return;
  }

  tbody.innerHTML = result.data.map(p => `
    <tr>
      <td>${p.title}</td>
      <td>${p.address.city}, ${p.address.state}</td>
      <td>${formatPrice(p.price, p.type)}</td>
      <td><span class="badge badge-${p.type}">${p.type}</span></td>
      <td><span class="badge">${p.status}</span></td>
      <td>
        <button class="btn btn-outline" style="padding:6px 12px;font-size:12px"
          onclick="editProperty('${p._id}')">Edit</button>
        <button class="btn btn-danger" style="padding:6px 12px;font-size:12px;margin-left:6px"
          onclick="deleteProperty('${p._id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function loadAdminInquiries() {
  const tbody = document.getElementById('admin-inquiries-body');
  if (!tbody) return;

  const result = await API.get('/api/inquiries');
  if (!result.success) return;

  if (result.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No inquiries yet.</td></tr>';
    return;
  }

  tbody.innerHTML = result.data.map(inq => `
    <tr>
      <td>${inq.name}</td>
      <td>${inq.email}</td>
      <td>${inq.phone || '—'}</td>
      <td>${inq.propertyTitle || 'General Inquiry'}</td>
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

// Admin: submit the "Add Property" form
async function submitAdminProperty(e) {
  e.preventDefault();
  const form = e.target;

  const data = {
    title:       form.title.value,
    category:    form.category.value,
    address: {
      street: form.street.value,
      city:   form.city.value,
      state:  form.state.value,
      zip:    form.zip.value,
    },
    price:       Number(form.price.value),
    type:        form.type.value,
    bedrooms:    Number(form.bedrooms.value),
    bathrooms:   Number(form.bathrooms.value),
    squareFeet:  form.squareFeet.value ? Number(form.squareFeet.value) : undefined,
    yearBuilt:   form.yearBuilt.value  ? Number(form.yearBuilt.value)  : undefined,
    description: form.description.value,
    // Features: split comma-separated text into an array
    features: form.features.value ? form.features.value.split(',').map(f => f.trim()) : [],
  };

  const result = await API.post('/api/properties', data);

  if (result.success) {
    form.reset();
    showAlert('Listing added successfully!', 'success');
    loadAdminListings();
  } else {
    showAlert(`Error: ${result.message}`, 'error');
  }
}

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

  document.getElementById('filter-form')
    ?.addEventListener('submit', (e) => { e.preventDefault(); loadListings(); });
});
