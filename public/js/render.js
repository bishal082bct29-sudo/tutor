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
  if(data.groups.length === 0){ grid.innerHTML = '<p class="empty-note">No groups posted yet.</p>'; return; }
  grid.innerHTML = data.groups.map(g => `
    <div class="card group-card">
      <div class="top">
        <h3>${escapeHtml(g.name)}</h3>
        <span class="subject-chip">${escapeHtml(g.subject||'General')}</span>
      </div>
      <p class="desc">${escapeHtml(g.description||'')}</p>
      <div class="group-meta">
        <div class="item">📍 <b>${escapeHtml(g.level||'—')}</b></div>
        <div class="item">🗓️ <b>${escapeHtml(g.schedule||'—')}</b></div>
        ${g.fee ? `<div class="item">💳 <b>${escapeHtml(g.fee)}</b></div>` : ''}
      </div>
      <div class="student-count">
        <div class="avatar-stack">${avatarStack(g.students)}</div>
        <span style="font-size:13px;color:var(--text-dim);"><b style="color:var(--text);font-family:'Inter',sans-serif;">${g.students||0}</b> student${(g.students||0)===1?'':'s'} enrolled</span>
      </div>
    </div>
  `).join('');
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
  el.innerHTML = data.vacancies.map(v => `
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
      </div>
      <div class="vac-right">
        <span class="status-badge ${v.status==='filled'?'filled':'open'}">${v.status==='filled'?'Filled':'Open'}</span>
        ${v.status!=='filled' ? `<button class="mini-btn primary" onclick="openApply('${v.id}')">Apply</button>` : ''}
      </div>
    </div>
  `).join('');
}

function renderLogoMark(){
  const p = data.profile;
  const mark = document.getElementById('logoMark');
  const initials = (p.companyName||'HT').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  if(p.logoUrl){
    mark.innerHTML = `<img src="${escapeAttr(p.logoUrl)}" alt="${escapeAttr(p.companyName||'Logo')}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
  } else {
    mark.textContent = initials;
  }
  /* keep the opening splash-screen logo in sync with the saved profile logo */
  const badge = document.getElementById('introBadge');
  if(badge){
    if(p.logoUrl){
      badge.innerHTML = `<img src="${escapeAttr(p.logoUrl)}" alt="${escapeAttr(p.companyName||'Logo')}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      badge.innerHTML = `<svg viewBox="0 0 48 48" width="52" height="52" fill="none">
      <path d="M24 6 4 15l20 9 20-9-20-9Z" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      <path d="M12 20v10c0 3 5 6 12 6s12-3 12-6V20" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      <path d="M40 18v10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
    }
  }
  const introName = document.getElementById('introName');
  const introTag = document.getElementById('introTag');
  if(introName) introName.textContent = p.companyName || 'Home Tutors';
  if(introTag) introTag.textContent = p.tagline || 'Learning, one home at a time';
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

