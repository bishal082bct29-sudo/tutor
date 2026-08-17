/* ===================== TOAST ===================== */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ===================== RENDER: PUBLIC SITE ===================== */
function renderAll(){
  const p = data.profile;
  document.getElementById('brandName').textContent = p.companyName;
  document.getElementById('brandTag').textContent = p.tagline;
  renderLogoMark();
  document.getElementById('heroSub').textContent = p.heroSub;
  document.getElementById('aboutTitle').textContent = p.aboutTitle;
  document.getElementById('aboutText').textContent = p.aboutText;
  const footPhoneEl = document.getElementById('footPhone');
  if(footPhoneEl){ footPhoneEl.textContent = p.phone; footPhoneEl.href = 'tel:' + (p.phone||'').replace(/[^0-9+]/g,''); }
  const footEmailEl = document.getElementById('footEmail');
  if(footEmailEl){ footEmailEl.textContent = p.email; footEmailEl.href = 'mailto:' + p.email; }
  document.getElementById('footAddress').textContent = 'Address: ' + p.address;
  document.getElementById('footBrand').textContent = '© ' + new Date().getFullYear() + ' ' + p.companyName;
  const waLink = document.getElementById('waFloat');
  if(waLink){
    const digits = (p.phone || '').replace(/[^0-9]/g, '');
    if(digits) waLink.href = 'https://wa.me/' + digits;
  }

  const totalStudents = data.groups.reduce((s,g)=>s+(Number(g.students)||0),0);
  document.getElementById('statGroups').textContent = data.groups.length;
  document.getElementById('statStudents').textContent = p.studentsTaught || totalStudents;
  document.getElementById('statVac').textContent = data.vacancies.filter(v=>v.status==='open').length;

  renderGroups();
  renderVacancies();
  renderGallery();
  renderInfo();
}

function renderGroups(){
  const grid = document.getElementById('groupsGrid');
  if(!grid) return;
  if(!data.groups || data.groups.length === 0){ grid.innerHTML = '<p class="empty-note">No classes or fee packages posted yet.</p>'; return; }
  grid.innerHTML = data.groups.map(g => {
    const feeText = g.fee ? escapeHtml(g.fee) : 'Contact for Fee';
    const nameText = escapeHtml(g.name || 'Tuition Class');
    const levelText = escapeHtml(g.level || 'All Grades');
    const subjectText = escapeHtml(g.subject || 'All Core Subjects');
    const scheduleText = escapeHtml(g.schedule || 'Flexible Timings');
    const descText = escapeHtml(g.description || '');
    const studentsCount = Number(g.students) || 0;
    
    return `
      <div class="card group-card class-fee-card">
        <div class="fee-card-badge-row">
          <span class="level-badge">📍 ${levelText}</span>
          <span class="demo-chip">✨ 2 Days FREE Demo</span>
        </div>

        <div class="fee-card-header">
          <h3>${nameText}</h3>
          <span class="subject-chip">${subjectText}</span>
        </div>

        <div class="fee-highlight-box">
          <div class="fee-main">${feeText}</div>
          <div class="fee-sub">Monthly Tuition Fee • Kathmandu Valley</div>
        </div>

        <div class="fee-card-details">
          <div class="detail-item">
            <span class="icon">🗓️</span>
            <div><strong>Schedule:</strong> <span>${scheduleText}</span></div>
          </div>
          <div class="detail-item">
            <span class="icon">👨‍🏫</span>
            <div><strong>Mode:</strong> <span>1-on-1 Home Tuition &amp; Batches</span></div>
          </div>
          ${descText ? `
          <div class="detail-item desc-item">
            <span class="icon">💡</span>
            <div><strong>Focus:</strong> <span>${descText}</span></div>
          </div>
          ` : ''}
        </div>

        <div class="fee-card-footer">
          <div class="student-count">
            <div class="avatar-stack">${avatarStack(studentsCount)}</div>
            <span><b>${studentsCount}</b> enrolled</span>
          </div>
          <a href="https://wa.me/9779801775074?text=${encodeURIComponent('Hi Gurukul Tuition, I am interested in inquiring about: ' + (g.name || 'Tuition') + ' (' + (g.fee || '') + ')')}" target="_blank" rel="noopener" class="mini-btn fee-cta-btn">
            Book Demo Class
          </a>
        </div>
      </div>
    `;
  }).join('');
}
function avatarStack(count){
  const n = Math.min(Number(count)||0, 4);
  let html = '';
  for(let i=0;i<n;i++) html += `<span>●</span>`;
  if((Number(count)||0) > 4) html += `<span>+${count-4}</span>`;
  return html || '<span>0</span>';
}

let currentVacFilter = 'all';
let currentVacSearch = '';

function initVacFiltersOnce(){
  const chipsContainer = document.getElementById('vacFilterChips');
  if(chipsContainer && !chipsContainer.dataset.initialized){
    chipsContainer.dataset.initialized = 'true';
    chipsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.vac-chip');
      if(!btn) return;
      chipsContainer.querySelectorAll('.vac-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      currentVacFilter = btn.dataset.filter || 'all';
      renderVacancies();
    });
  }

  const searchInput = document.getElementById('vacSearchInput');
  if(searchInput && !searchInput.dataset.initialized){
    searchInput.dataset.initialized = 'true';
    searchInput.addEventListener('input', (e) => {
      currentVacSearch = (e.target.value || '').trim().toLowerCase();
      renderVacancies();
    });
  }
}

function renderVacancies(){
  initVacFiltersOnce();
  const el = document.getElementById('vacList');
  if(!el) return;

  if(!data.vacancies || data.vacancies.length === 0){
    el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;background:var(--card);border:1px dashed var(--line);border-radius:16px;"><p class="empty-note" style="font-size:16px;font-weight:600;">No vacancies posted right now — check back soon or register with us as a tutor!</p></div>';
    return;
  }

  let list = data.vacancies.slice();

  // Apply Category/Status filter
  if(currentVacFilter === 'open'){
    list = list.filter(v => !isVacancyVerified(v) && v.status !== 'filled');
  } else if(currentVacFilter === 'math'){
    list = list.filter(v => ((v.subject||'') + ' ' + (v.title||'')).toLowerCase().includes('math'));
  } else if(currentVacFilter === 'science'){
    list = list.filter(v => ((v.subject||'') + ' ' + (v.title||'')).toLowerCase().match(/science|physics|chem|bio/));
  } else if(currentVacFilter === 'primary'){
    list = list.filter(v => ((v.level||'') + ' ' + (v.title||'') + ' ' + (v.description||'')).toLowerCase().match(/primary|basic|class 1|class 2|class 3|class 4|class 5/));
  } else if(currentVacFilter === 'ktm'){
    list = list.filter(v => ((v.location||'')).toLowerCase().includes('kathmandu') || !((v.location||'')).toLowerCase().includes('lalitpur'));
  } else if(currentVacFilter === 'lalitpur'){
    list = list.filter(v => ((v.location||'')).toLowerCase().includes('lalitpur') || ((v.location||'')).toLowerCase().includes('patan'));
  }

  // Apply text search
  if(currentVacSearch){
    list = list.filter(v => {
      const haystack = `${v.title||''} ${v.subject||''} ${v.location||''} ${v.level||''} ${v.description||''} ${v.salary||''}`.toLowerCase();
      return haystack.includes(currentVacSearch);
    });
  }

  if(list.length === 0){
    el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;background:var(--card);border:1px dashed var(--line);border-radius:16px;"><p class="empty-note" style="font-size:15px;">No matching vacancies found for this filter. Try clearing your search.</p></div>';
    return;
  }

  el.innerHTML = list.map(v => {
    const isVerified = isVacancyVerified(v);
    const isFilled = v.status === 'filled';
    const isClosed = isVerified || isFilled;
    const applicantCount = getVacancyApplicantCount(v.id);
    const statusClass = isVerified ? 'verified' : (isFilled ? 'filled' : 'open');
    const statusLabel = isVerified ? '🔒 Verified & Closed' : (isFilled ? '🔒 Position Filled' : '🟢 Open & Urgent');
    const applicantText = applicantCount === 0 
      ? 'Be the first teacher to apply!' 
      : (applicantCount === 1 ? '1 teacher has applied' : `${applicantCount} teachers have applied`);

    const waText = encodeURIComponent(`Hi Gurukul Tuitions, I am interested in applying for the position: "${v.title}" (${v.location || 'Kathmandu'}). Is this vacancy still open?`);
    const waUrl = `https://wa.me/9779801775074?text=${waText}`;

    return `
    <div class="vac-card-large ${isClosed ? 'status-filled-card' : ''}">
      <div class="vac-card-inner-top">
        <!-- Top Title & Status -->
        <div class="vac-card-header-row">
          <h3 class="vac-card-title">${escapeHtml(v.title)}</h3>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>

        <!-- Subject Pill (Screenshot style) -->
        <div class="vac-subject-pill-wrap">
          <span class="vac-subject-pill">${escapeHtml(v.subject || 'Tuition')}</span>
          ${v.type ? `<span class="vac-type-pill">${escapeHtml(v.type)}</span>` : ''}
        </div>

        <!-- Meta Info List with Circular Icon Badges -->
        <div class="vac-meta-list">
          <div class="vac-meta-row">
            <div class="vac-meta-icon" title="Location">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
              </svg>
            </div>
            <span class="vac-meta-text">${escapeHtml(v.location || 'Kathmandu, Nepal')}</span>
          </div>

          <div class="vac-meta-row">
            <div class="vac-meta-icon" title="Class / Grade">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
              </svg>
            </div>
            <span class="vac-meta-text">Class: ${escapeHtml(v.level || 'School / College')}</span>
          </div>

          <div class="vac-meta-row">
            <div class="vac-meta-icon" title="Salary">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
            <span class="vac-meta-text">Salary: <b class="vac-salary-val">${escapeHtml(v.salary || 'Negotiable')}</b></span>
          </div>

          ${v.schedule ? `
          <div class="vac-meta-row">
            <div class="vac-meta-icon" title="Schedule">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <span class="vac-meta-text">${escapeHtml(v.schedule)}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Card Bottom Actions (Full Width Telegram/Airplane Apply Button) -->
      <div class="vac-card-footer">
        <div class="vac-footer-meta-row">
          <span class="vac-applicants-text">👥 ${applicantText}</span>
          <a href="${waUrl}" target="_blank" rel="noopener" class="vac-wa-inline-link" title="Chat on WhatsApp">
            💬 WhatsApp Inquiry
          </a>
        </div>

        ${isClosed 
          ? `<button class="vac-apply-btn-full disabled" disabled title="This position is filled">
              🔒 Position Filled
            </button>` 
          : `<button class="vac-apply-btn-full" onclick="openApply('${v.id}')">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
              <span>Apply Now</span>
            </button>`
        }
      </div>
    </div>
  `;
  }).join('');
}

function renderLogoMark(){
  const p = data.profile;
  const mark = document.getElementById('logoMark');
  const initials = (p.companyName||'HT').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  if(mark){
    if(p.logoUrl){
      mark.innerHTML = `<img src="${escapeAttr(p.logoUrl)}" alt="${escapeAttr(p.companyName||'Logo')}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
    } else {
      mark.textContent = initials;
    }
  }
  /* keep the opening splash-screen logo in sync with the saved profile logo */
  const badge = document.getElementById('introBadge');
  if(badge){
    if(p.logoUrl){
      badge.innerHTML = `<img src="${escapeAttr(p.logoUrl)}" alt="${escapeAttr(p.companyName||'Logo')}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      badge.innerHTML = `<svg viewBox="0 0 48 48" width="74" height="74" fill="none">
        <path d="M24 6 4 15l20 9 20-9-20-9Z" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M12 20v10c0 3 5 6 12 6s12-3 12-6V20" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M40 18v10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
    }
  }
  const introName = document.getElementById('introName');
  const introTag = document.getElementById('introTag');
  if(introName) introName.textContent = p.companyName || 'Gurukul Home Tuitions';
  if(introTag) introTag.textContent = p.tagline || 'Where learning meets clarity';
}

function renderGallery(){
  const el = document.getElementById('galleryGrid');
  if(data.gallery.length === 0){ el.innerHTML = '<p class="empty-note">No photos added yet.</p>'; return; }
  el.innerHTML = data.gallery.map(p => `
    <div class="gallery-item" onclick="openLightbox('${p.id}')">
      <img src="${escapeAttr(p.url)}" alt="${escapeAttr(p.caption||'')}" loading="lazy">
      <div class="cap">${escapeHtml(p.caption||'')}</div>
    </div>
  `).join('');
}
function openLightbox(id){
  const p = data.gallery.find(x=>x.id===id);
  if(!p) return;
  showLightbox(p.url, p.caption || '');
}
function showLightbox(url, caption){
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightboxCap').textContent = caption || '';
  document.getElementById('lightbox').classList.add('open');
}
document.getElementById('lightboxClose').addEventListener('click', ()=>document.getElementById('lightbox').classList.remove('open'));
document.getElementById('lightbox').addEventListener('click', (e)=>{ if(e.target.id==='lightbox') e.currentTarget.classList.remove('open'); });

function renderInfo(){
  const el = document.getElementById('infoGrid');
  if(data.extraInfo.length === 0){ el.innerHTML = '<p class="empty-note">No additional info added yet.</p>'; return; }
  el.innerHTML = data.extraInfo.map(i => `
    <div class="card info-card">
      <h3>${escapeHtml(i.title)}</h3>
      <p>${escapeHtml(i.content||'')}</p>
    </div>
  `).join('');
}

function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s){ return escapeHtml(s); }

