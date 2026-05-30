/* ================================================
   阿欽好房推推 — Listing Page (index.html)
   ================================================ */

const LINE_URL = 'https://lin.ee/UndYv1Z';

let allProjects = [];
let filteredProjects = [];

const state = {
  city: '',
  district: '',
  type: new Set(),        // '預售屋' | '新成屋'
  mrtMax: null,           // 5 | 10 | 20 | null
  sizeMin: '',
  sizeMax: '',
  rooms: new Set(),       // 1 2 3 4(=4+)
  bathrooms: new Set(),   // 1 1.5 2 3(=3+)
  sort: 'newest',
};

// ── Fetch data ──────────────────────────────────
async function init() {
  try {
    const res = await fetch('/data/projects.json');
    const data = await res.json();
    allProjects = data.projects || [];
    buildCityOptions();
    applyFilters();
  } catch (e) {
    console.error('載入建案資料失敗', e);
    document.getElementById('projectGrid').innerHTML =
      '<div class="no-results"><p>資料載入失敗，請重新整理頁面。</p></div>';
  }
}

// ── Build city dropdown from data ───────────────
function buildCityOptions() {
  const cities = [...new Set(allProjects.map(p => p.city))].sort();
  const sel = document.getElementById('filterCity');
  cities.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    sel.appendChild(o);
  });
}

function updateDistrictOptions() {
  const city = state.city;
  const sel = document.getElementById('filterDistrict');
  sel.innerHTML = '<option value="">全部行政區</option>';
  if (!city) return;
  const districts = [...new Set(
    allProjects.filter(p => p.city === city).map(p => p.district)
  )].sort();
  districts.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });
}

// ── Apply all filters + sort ─────────────────────
function applyFilters() {
  filteredProjects = allProjects.filter(p => {
    if (state.city && p.city !== state.city) return false;
    if (state.district && p.district !== state.district) return false;
    if (state.type.size && !state.type.has(p.type)) return false;
    if (state.mrtMax !== null) {
      if (p.mrtMinutes == null || p.mrtMinutes > state.mrtMax) return false;
    }
    if (state.sizeMin !== '' && p.sizeMax < Number(state.sizeMin)) return false;
    if (state.sizeMax !== '' && p.sizeMin > Number(state.sizeMax)) return false;
    if (state.rooms.size) {
      const match = p.roomsOptions.some(r => state.rooms.has(r >= 4 ? 4 : r));
      if (!match) return false;
    }
    if (state.bathrooms.size) {
      const match = p.bathroomsOptions.some(b => {
        const key = b >= 3 ? 3 : b;
        return state.bathrooms.has(key) || state.bathrooms.has(Number(key));
      });
      if (!match) return false;
    }
    return true;
  });

  // Sort
  filteredProjects.sort((a, b) => {
    switch (state.sort) {
      case 'newest':      return new Date(b.postedDate) - new Date(a.postedDate);
      case 'price_asc':   return a.totalPriceMin - b.totalPriceMin;
      case 'price_desc':  return b.totalPriceMin - a.totalPriceMin;
      case 'size_asc':    return a.sizeMin - b.sizeMin;
      case 'size_desc':   return b.sizeMin - a.sizeMin;
      default:            return 0;
    }
  });

  renderGrid();
  renderActiveFilters();
  document.getElementById('resultCount').textContent = filteredProjects.length;
}

// ── Render project cards ─────────────────────────
function renderGrid() {
  const grid = document.getElementById('projectGrid');
  if (filteredProjects.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p>沒有符合條件的建案，試著放寬篩選條件看看。</p>
      </div>`;
    return;
  }
  grid.innerHTML = filteredProjects.map(p => cardHTML(p)).join('');
}

function cardHTML(p) {
  const badgeClass = p.type === '預售屋' ? 'badge-presale' : p.type === '新成屋' ? 'badge-new' : 'badge-secondhand';
  const dateStr = p.postedDate ? formatDate(p.postedDate) : '';
  const imgContent = p.images && p.images.length
    ? `<img src="${p.images[0]}" alt="${p.name}">`
    : `<div class="card-image-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>暫無圖片</span>
      </div>`;

  const mrtText = p.mrtStation
    ? `<span>${p.mrtStation} 步行 ${p.mrtMinutes} 分鐘</span>` : '';

  // 自動從 description 抓生活圈標籤
  const allHighlights = [...(p.highlights || [])];
  const lifeCircleMatch = (p.description || '').match(/[一-鿿]{1,10}生活圈/);
  if (lifeCircleMatch && !allHighlights.some(h => h.includes('生活圈'))) {
    allHighlights.unshift(lifeCircleMatch[0]);
  }
  const tags = allHighlights.slice(0, 3).map(h => `<span class="tag">${h}</span>`).join('');

  return `
    <a class="project-card" href="/project.html?id=${p.id}">
      <div class="card-image">
        ${imgContent}
        <span class="card-badge ${badgeClass}">${p.type}</span>
        ${dateStr ? `<span class="card-date-badge">${dateStr}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-title">${p.name}</div>
        <div class="card-location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          ${p.city} ${p.district}
        </div>
        <div class="card-specs">
          <div class="spec-item">
            <span class="spec-label">總價起</span>
            <span class="spec-value price">${p.totalPriceMin ? p.totalPriceMin.toLocaleString() + '萬' : '—'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">單價</span>
            <span class="spec-value">${p.unitPriceMin && p.unitPriceMax ? `${p.unitPriceMin}~${p.unitPriceMax}萬/坪` : '洽詢'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">坪數</span>
            <span class="spec-value">${p.sizeMin}~${p.sizeMax}坪</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">房型</span>
            <span class="spec-value">${formatRooms(p.roomsOptions)}房</span>
          </div>
        </div>
        ${mrtText ? `<div class="card-mrt">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
          </svg>
          ${mrtText}
        </div>` : ''}
        <div class="card-tags">${tags}</div>
      </div>
    </a>`;
}

// ── Active filter chips ──────────────────────────
function renderActiveFilters() {
  const container = document.getElementById('activeFilters');
  const chips = [];

  if (state.city) chips.push({ label: state.city, clear: () => { state.city = ''; state.district = ''; document.getElementById('filterCity').value = ''; document.getElementById('filterDistrict').value = ''; updateDistrictOptions(); } });
  if (state.district) chips.push({ label: state.district, clear: () => { state.district = ''; document.getElementById('filterDistrict').value = ''; } });
  state.type.forEach(t => chips.push({ label: t, clear: () => { state.type.delete(t); syncChips('type', t, false); } }));
  if (state.mrtMax !== null) chips.push({ label: `捷運${state.mrtMax}分鐘內`, clear: () => { state.mrtMax = null; document.querySelector('input[name="mrt"][value=""]').checked = true; } });
  if (state.sizeMin !== '') chips.push({ label: `坪數≥${state.sizeMin}`, clear: () => { state.sizeMin = ''; document.getElementById('sizeMin').value = ''; } });
  if (state.sizeMax !== '') chips.push({ label: `坪數≤${state.sizeMax}`, clear: () => { state.sizeMax = ''; document.getElementById('sizeMax').value = ''; } });
  state.rooms.forEach(r => chips.push({ label: `${r === 4 ? '4+' : r}房`, clear: () => { state.rooms.delete(r); syncChips('rooms', String(r), false); } }));
  state.bathrooms.forEach(b => chips.push({ label: `${b === 3 ? '3+' : b}衛`, clear: () => { state.bathrooms.delete(b); syncChips('bathrooms', String(b), false); } }));

  container.innerHTML = chips.map((c, i) =>
    `<button class="active-chip" data-idx="${i}">
      ${c.label}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>`
  ).join('');

  container.querySelectorAll('.active-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      chips[Number(btn.dataset.idx)].clear();
      applyFilters();
    });
  });
}

function syncChips(group, value, active) {
  document.querySelectorAll(`.chip[data-group="${group}"][data-value="${value}"]`)
    .forEach(el => el.classList.toggle('active', active));
}

// ── Reset ────────────────────────────────────────
function resetFilters() {
  state.city = ''; state.district = '';
  state.type.clear(); state.mrtMax = null;
  state.sizeMin = ''; state.sizeMax = '';
  state.rooms.clear(); state.bathrooms.clear();

  document.getElementById('filterCity').value = '';
  document.getElementById('filterDistrict').value = '';
  updateDistrictOptions();
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('input[name="mrt"][value=""]').checked = true;
  ['sizeMin','sizeMax'].forEach(id => document.getElementById(id).value = '');
  applyFilters();
}

// ── Helpers ──────────────────────────────────────
function formatDate(str) {
  const d = new Date(str);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function formatRooms(arr) {
  if (!arr || arr.length === 0) return '—';
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted.length === 1 ? sorted[0] : `${sorted[0]}~${sorted[sorted.length - 1]}`;
}

// ── Event bindings ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init();

  // City
  document.getElementById('filterCity').addEventListener('change', e => {
    state.city = e.target.value;
    state.district = '';
    document.getElementById('filterDistrict').value = '';
    updateDistrictOptions();
    applyFilters();
  });

  // District
  document.getElementById('filterDistrict').addEventListener('change', e => {
    state.district = e.target.value;
    applyFilters();
  });

  // Type chips
  document.querySelectorAll('.chip[data-group="type"]').forEach(chip => {
    chip.addEventListener('click', () => {
      const v = chip.dataset.value;
      if (state.type.has(v)) { state.type.delete(v); chip.classList.remove('active'); }
      else { state.type.add(v); chip.classList.add('active'); }
      applyFilters();
    });
  });

  // MRT radio
  document.querySelectorAll('input[name="mrt"]').forEach(r => {
    r.addEventListener('change', e => {
      state.mrtMax = e.target.value === '' ? null : Number(e.target.value);
      applyFilters();
    });
  });

  // Size range
  ['sizeMin','sizeMax'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
      state[id] = e.target.value;
      applyFilters();
    });
  });

  // Rooms chips
  document.querySelectorAll('.chip[data-group="rooms"]').forEach(chip => {
    chip.addEventListener('click', () => {
      const v = Number(chip.dataset.value);
      if (state.rooms.has(v)) { state.rooms.delete(v); chip.classList.remove('active'); }
      else { state.rooms.add(v); chip.classList.add('active'); }
      applyFilters();
    });
  });

  // Bathrooms chips
  document.querySelectorAll('.chip[data-group="bathrooms"]').forEach(chip => {
    chip.addEventListener('click', () => {
      const v = Number(chip.dataset.value);
      if (state.bathrooms.has(v)) { state.bathrooms.delete(v); chip.classList.remove('active'); }
      else { state.bathrooms.add(v); chip.classList.add('active'); }
      applyFilters();
    });
  });

  // Sort
  document.getElementById('sortSelect').addEventListener('change', e => {
    state.sort = e.target.value;
    applyFilters();
  });

  // Reset
  document.getElementById('filterReset').addEventListener('click', resetFilters);

  // Mobile filter toggle
  document.getElementById('mobileFilterBtn').addEventListener('click', () => {
    document.getElementById('filterPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('filterClose').addEventListener('click', () => {
    document.getElementById('filterPanel').classList.remove('open');
    document.body.style.overflow = '';
  });
});
