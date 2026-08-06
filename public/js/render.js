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

function renderVacancies(){
  const el = document.getElementById('vacList');
  if(data.vacancies.length === 0){ el.innerHTML = '<p class="empty-note">No vacancies posted right now — check back soon.</p>'; return; }
  el.innerHTML = data.vacancies.map(v => {
    const isVerified = isVacancyVerified(v);
    const isFilled = v.status === 'filled';
    const isClosed = isVerified || isFilled;
    const applicantCount = getVacancyApplicantCount(v.id);
    const statusClass = isVerified ? 'verified' : (isFilled ? 'filled' : 'open');
    const statusLabel = isVerified ? '✓ Verified / Filled' : (isFilled ? 'Filled' : 'Open');
    const applicantText = applicantCount === 0 ? 'No other teachers applied yet' : (applicantCount === 1 ? '1 other teacher applied' : applicantCount + ' other teachers applied');

    return `
    <div class="vac-item">
      <div class="vac-left">
        <h3>${escapeHtml(v.title)}</h3>
        <div class="meta">
          <span>${escapeHtml(v.subject||'')}</span>
          <span>·</span>
          <span>${escapeHtml(v.type||'')}</span>
          <span>·</span>
          <span>${escapeHtml(v.location||'')}</span>
          ${v.salary ? `<span>·</span><span>${escapeHtml(v.salary)}</span>` : ''}
        </div>
        ${v.description ? `<p class="desc">${escapeHtml(v.description)}</p>` : ''}
        <div class="vac-applicants-chip">
          <span>👥</span>
          <span>${applicantText}</span>
        </div>
      </div>
      <div class="vac-right">
        <span class="status-badge ${statusClass}">${statusLabel}</span>
        ${isClosed 
          ? `<button class="mini-btn disabled" disabled title="This post is verified/filled by admin. No other teacher can apply.">🔒 Closed (Verified)</button>` 
          : `<button class="mini-btn primary" onclick="openApply('${v.id}')">Apply</button>`
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

