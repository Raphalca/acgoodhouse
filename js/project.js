/* ================================================
   阿欽好房推推 — Project Detail Page (project.html)
   ================================================ */

const LINE_URL = 'https://lin.ee/UndYv1Z';

async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) { showError('找不到建案 ID'); return; }

  try {
    const res = await fetch('/data/projects.json');
    const data = await res.json();
    const project = (data.projects || []).find(p => p.id === id);
    if (!project) { showError('找不到此建案'); return; }
    render(project);
    document.title = `${project.name}｜阿欽好房推推`;
  } catch (e) {
    showError('資料載入失敗，請重新整理頁面。');
  }
}

function render(p) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');

  // Hero image / gallery
  renderGallery(document.getElementById('heroImage'), p.images, p.name);

  // Hero body
  document.getElementById('projectName').textContent = p.name;

  const pill = document.getElementById('statusPill');
  pill.textContent = p.type;
  if (p.type === '預售屋') { pill.className = 'status-pill badge-presale'; }
  else if (p.type === '新成屋') { pill.className = 'status-pill badge-new'; }
  else { pill.className = 'status-pill badge-secondhand'; }

  document.getElementById('projectAddr').textContent = p.address;

  // Key specs
  document.getElementById('ksTotalPrice').textContent = p.totalPriceMin ? p.totalPriceMin.toLocaleString() + '萬起' : '—';
  document.getElementById('ksUnitPrice').textContent = p.unitPriceMin && p.unitPriceMax ? `${p.unitPriceMin}~${p.unitPriceMax}` : '—';
  document.getElementById('ksSize').textContent = `${p.sizeMin}~${p.sizeMax}`;
  document.getElementById('ksMrt').textContent = p.mrtStation ? `${p.mrtMinutes}分鐘` : '—';
  document.getElementById('ksMrtLabel').textContent = p.mrtStation || '捷運';

  // Highlights
  const hl = document.getElementById('highlights');
  hl.innerHTML = (p.highlights || []).map(h => `<span class="highlight-tag">${h}</span>`).join('');

  // Description
  if (p.description) document.getElementById('description').textContent = p.description;

  // Sale info
  const saleRows = [];
  if (p.openSaleDate) saleRows.push(['開賣日期', formatDate(p.openSaleDate)]);
  if (p.viewingDate) saleRows.push(['開放賞屋', formatDate(p.viewingDate)]);
  if (p.earlyBirdNote) saleRows.push(['優惠說明', p.earlyBirdNote]);
  renderRows('saleInfo', saleRows);

  // Site info
  const siteRows = [];
  if (p.address) siteRows.push(['位置', p.address]);
  if (p.siteArea) siteRows.push(['基地坪數', `約 ${p.siteArea} 坪`]);
  if (p.publicRatio) siteRows.push(['公設比', `${p.publicRatio}%`]);
  renderRows('siteInfo', siteRows);

  // Building info
  const buildRows = [];
  buildRows.push(['樓層規劃', `${p.floors}樓${p.basementFloors ? '/B' + p.basementFloors : ''}`]);
  buildRows.push(['總戶數', `${p.totalUnits} 戶`]);
  if (p.floorPlan) buildRows.push(['梯戶比', p.floorPlan + `，總梯戶比約1:${p.totalUnits}`]);
  if (p.parkingSpots) buildRows.push(['車位', `${p.parkingType || ''}共 ${p.parkingSpots} 個，${p.parkingPrice ? p.parkingPrice + '萬' : ''}`]);
  buildRows.push(['有無店面', p.hasStorefront ? '有店面' : '無店面']);
  if (p.earthquake) buildRows.push(['耐震', p.earthquake]);
  if (p.damper) buildRows.push(['制震', p.damper]);
  renderRows('buildInfo', buildRows);

  // Layouts
  const tbody = document.getElementById('layoutsBody');
  if (p.layouts && p.layouts.length) {
    tbody.innerHTML = p.layouts.map(l =>
      `<tr>
        <td>${l.size} 坪</td>
        <td>${l.rooms} 房</td>
        <td>${l.bathrooms} 衛</td>
        <td style="color:var(--text-muted)">${l.note || ''}</td>
      </tr>`
    ).join('');
  } else {
    document.getElementById('layoutsCard').classList.add('hidden');
  }

  // Payment
  const payFlow = document.getElementById('paymentFlow');
  if (p.payment) {
    const steps = [];
    if (p.payment.deposit) steps.push({ label: '訂簽款', pct: p.payment.deposit, estimate: '' });
    (p.payment.stages || []).forEach(s => steps.push({ label: s.label, pct: s.percentage, estimate: s.estimate }));
    if (p.payment.loan) steps.push({ label: '貸款', pct: p.payment.loan, estimate: p.payment.loanEstimate || '' });
    if (p.payment.delivery) steps.push({ label: '交屋款', pct: p.payment.delivery, estimate: '' });
    payFlow.innerHTML = steps.map(s => `
      <div class="payment-step">
        <div class="ps-pct">${s.pct}%</div>
        <div class="ps-info">
          <div class="ps-label">${s.label}</div>
          ${s.estimate ? `<div class="ps-estimate">${s.estimate}</div>` : ''}
        </div>
      </div>`).join('');
  } else {
    document.getElementById('paymentCard').classList.add('hidden');
  }

  // Materials
  const mat = p.materials;
  if (mat && (mat.kitchen || mat.bathroom || mat.other)) {
    const matRows = [];
    if (mat.kitchen) matRows.push(['廚具', mat.kitchen]);
    if (mat.bathroom) matRows.push(['衛浴', mat.bathroom]);
    if (mat.other) matRows.push(['其他', mat.other]);
    renderRows('materialsInfo', matRows);
  } else {
    document.getElementById('materialsCard').classList.add('hidden');
  }

  // CTA project name
  document.getElementById('ctaProjectName').textContent = p.name;

  // Line links
  document.querySelectorAll('.line-link').forEach(a => a.href = LINE_URL);
}

function renderRows(containerId, rows) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (rows.length === 0) { el.closest('.info-card').classList.add('hidden'); return; }
  el.innerHTML = rows.map(([label, value]) =>
    `<div class="info-row">
      <span class="ir-label">${label}</span>
      <span class="ir-value">${value}</span>
    </div>`
  ).join('');
}

function renderGallery(container, images, name) {
  if (!images || images.length === 0) {
    container.innerHTML = `
      <div class="project-hero-img-placeholder">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`;
    return;
  }

  const total = images.length;

  if (total === 1) {
    container.innerHTML = `<div class="img-gallery"><div class="gallery-track"><div class="gallery-slide"><img src="${images[0]}" alt="${name}"></div></div></div>`;
    return;
  }

  const slides = images.map((src, i) =>
    `<div class="gallery-slide"><img src="${src}" alt="${name} 圖片${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}"></div>`
  ).join('');

  const dots = images.map((_, i) =>
    `<button class="gallery-dot ${i === 0 ? 'active' : ''}" data-i="${i}" aria-label="第${i+1}張"></button>`
  ).join('');

  container.innerHTML = `
    <div class="img-gallery" id="gallery">
      <div class="gallery-track" id="galleryTrack">${slides}</div>
      <button class="gallery-btn prev" id="galleryPrev" aria-label="上一張">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button class="gallery-btn next" id="galleryNext" aria-label="下一張">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <div class="gallery-dots">${dots}</div>
      <div class="gallery-counter"><span id="galleryCurrent">1</span> / ${total}</div>
    </div>`;

  let current = 0;
  const track = document.getElementById('galleryTrack');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  const dotBtns = container.querySelectorAll('.gallery-dot');
  const currentLabel = document.getElementById('galleryCurrent');

  function goTo(idx) {
    current = (idx + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotBtns.forEach((d, i) => d.classList.toggle('active', i === current));
    currentLabel.textContent = current + 1;
    prevBtn.style.opacity = current === 0 ? '.4' : '1';
    nextBtn.style.opacity = current === total - 1 ? '.4' : '1';
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  dotBtns.forEach(d => d.addEventListener('click', () => goTo(Number(d.dataset.i))));

  // Touch swipe
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  });

  goTo(0);
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function showError(msg) {
  document.getElementById('loading').innerHTML =
    `<div class="no-results" style="padding:80px 20px"><p>${msg}</p><br><a href="/" style="color:var(--primary)">← 回到建案列表</a></div>`;
}

document.addEventListener('DOMContentLoaded', init);
