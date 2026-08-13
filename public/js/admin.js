/* ===================== ADMIN TABS ===================== */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.admin-pane').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.pane).classList.add('active');
  });
});

function openAdminPanel(){
  fillProfileForm();
  renderAdminGroups();
  renderAdminVacancies();
  renderAdminApplications();
  renderAdminChildren();
  renderAdminGallery();
  renderAdminInfo();
  document.getElementById('pw_recoveryPhone').value = data.profile.recoveryPhone || '';
  setDobValue('pw_recoveryDob', data.profile.recoveryDob || '');
  resetPwChangeFlow();
  adminOverlay.classList.add('open');
}

/* ---------- PROFILE ---------- */
function fillProfileForm(){
  const p = data.profile;
  document.getElementById('pf_companyName').value = p.companyName;
  document.getElementById('pf_tagline').value = p.tagline;
  document.getElementById('pf_heroSub').value = p.heroSub;
  document.getElementById('pf_aboutTitle').value = p.aboutTitle;
  document.getElementById('pf_aboutText').value = p.aboutText;
  document.getElementById('pf_phone').value = p.phone;
  document.getElementById('pf_email').value = p.email;
  document.getElementById('pf_address').value = p.address;
  document.getElementById('pf_studentsTaught').value = p.studentsTaught || 0;
}
document.getElementById('pf_saveBtn').addEventListener('click', () => {
  const p = data.profile;
  p.companyName = document.getElementById('pf_companyName').value.trim() || p.companyName;
  p.tagline = document.getElementById('pf_tagline').value.trim();
  p.heroSub = document.getElementById('pf_heroSub').value.trim();
  p.aboutTitle = document.getElementById('pf_aboutTitle').value.trim();
  p.aboutText = document.getElementById('pf_aboutText').value.trim();
  p.phone = document.getElementById('pf_phone').value.trim();
  p.email = document.getElementById('pf_email').value.trim();
  p.address = document.getElementById('pf_address').value.trim();
  p.studentsTaught = Number(document.getElementById('pf_studentsTaught').value) || 0;
  saveData(); renderAll();
  const ok = document.getElementById('pf_ok');
  ok.classList.add('show');
  setTimeout(()=>ok.classList.remove('show'), 1500);
  showToast('Profile saved');
});

/* ---------- PASSWORD (recovery phone + date of birth gated change) ---------- */
document.getElementById('pw_savePhoneBtn').addEventListener('click', () => {
  const phone = document.getElementById('pw_recoveryPhone').value.trim();
  const dob = getDobValue('pw_recoveryDob');
  if(phone && !/^[0-9]{8,15}$/.test(phone)){
    showToast('Enter digits only, with country code, no + or spaces (8–15 digits)');
    return;
  }
  data.profile.recoveryPhone = phone;
  data.profile.recoveryDob = dob;
  saveData();
  const ok = document.getElementById('pw_phone_ok');
  ok.classList.add('show');
  setTimeout(()=>ok.classList.remove('show'), 1500);
  showToast(phone ? 'Recovery info saved' : 'Recovery info cleared');
});

function resetPwChangeFlow(){
  document.getElementById('pw_step_verify').classList.remove('hidden');
  document.getElementById('pw_step_change').classList.add('hidden');
  document.getElementById('pw_verifyPhone').value = '';
  setDobValue('pw_verifyDob', '');
  document.getElementById('pw_user').value = '';
  document.getElementById('pw_pass').value = '';
  document.getElementById('pw_pass2').value = '';
  document.getElementById('pw_verify_err').classList.remove('show');
  document.getElementById('pw_err').classList.remove('show');
}

document.getElementById('pw_verifyBtn').addEventListener('click', () => {
  const phone = document.getElementById('pw_verifyPhone').value.trim();
  const dob = getDobValue('pw_verifyDob');
  const errEl = document.getElementById('pw_verify_err');
  errEl.classList.remove('show');
  if(!data.profile.recoveryPhone || !data.profile.recoveryDob){
    errEl.textContent = 'Save a recovery phone number and date of birth above first.';
    errEl.classList.add('show');
    return;
  }
  if(!phone || phone !== data.profile.recoveryPhone || !dob || dob !== data.profile.recoveryDob){
    errEl.textContent = 'That phone number and date of birth do not match the ones on file.';
    errEl.classList.add('show');
    return;
  }
  document.getElementById('pw_step_verify').classList.add('hidden');
  document.getElementById('pw_step_change').classList.remove('hidden');
});

document.getElementById('pw_saveBtn').addEventListener('click', () => {
  const u = document.getElementById('pw_user').value.trim();
  const pass = document.getElementById('pw_pass').value;
  const pass2 = document.getElementById('pw_pass2').value;
  const errEl = document.getElementById('pw_err');
  errEl.classList.remove('show');
  if(!u && !pass){ errEl.textContent = 'Enter a new username and/or password.'; errEl.classList.add('show'); return; }
  if(pass && pass.length < 4){ errEl.textContent = 'Password must be at least 4 characters.'; errEl.classList.add('show'); return; }
  if(pass !== pass2){ errEl.textContent = 'Passwords do not match.'; errEl.classList.add('show'); return; }
  if(u) data.profile.adminUsername = u;
  if(pass) data.profile.adminPassword = pass;
  saveData();
  updateDefaultCredsHint();
  const ok = document.getElementById('pw_ok');
  ok.classList.add('show');
  setTimeout(()=>ok.classList.remove('show'), 1500);
  showToast('Login details updated');
  resetPwChangeFlow();
});

/* ---------- GROUPS (admin) ---------- */
const grpEditOverlay = document.getElementById('grpEditOverlay');
function renderAdminGroups(){
  const el = document.getElementById('grp_list');
  el.innerHTML = data.groups.map(g => `
    <div class="admin-list-item">
      <div class="info"><b>${escapeHtml(g.name)}</b><span>${escapeHtml(g.subject||'')} · ${g.students||0} students · ${escapeHtml(g.schedule||'')}</span></div>
      <div class="row-actions">
        <button class="mini-btn" onclick="editGroup('${g.id}')">Edit</button>
        <button class="mini-btn danger" onclick="deleteGroup('${g.id}')">Delete</button>
      </div>
    </div>
  `).join('') || '<p class="empty-note">No groups yet.</p>';
}
document.getElementById('grp_addBtn').addEventListener('click', () => openGroupEdit(null));
document.getElementById('grpEditCloseBtn').addEventListener('click', () => grpEditOverlay.classList.remove('open'));
grpEditOverlay.addEventListener('click', e => { if(e.target === grpEditOverlay) grpEditOverlay.classList.remove('open'); });

function openGroupEdit(id){
  const g = id ? data.groups.find(x=>x.id===id) : null;
  document.getElementById('grpEditTitle').textContent = g ? 'Edit group' : 'Add group';
  document.getElementById('grp_id').value = g ? g.id : '';
  document.getElementById('grp_name').value = g ? g.name : '';
  document.getElementById('grp_subject').value = g ? g.subject : '';
  document.getElementById('grp_level').value = g ? g.level : '';
  document.getElementById('grp_students').value = g ? g.students : 0;
  document.getElementById('grp_schedule').value = g ? g.schedule : '';
  document.getElementById('grp_fee').value = g ? g.fee : '';
  document.getElementById('grp_desc').value = g ? g.description : '';
  document.getElementById('grp_err').classList.remove('show');
  grpEditOverlay.classList.add('open');
}
window.editGroup = (id) => openGroupEdit(id);
window.deleteGroup = (id) => {
  if(!confirm('Delete this group?')) return;
  data.groups = data.groups.filter(g=>g.id!==id);
  saveData(); renderAdminGroups(); renderAll();
  showToast('Group deleted');
};
document.getElementById('grp_saveBtn').addEventListener('click', () => {
  const name = document.getElementById('grp_name').value.trim();
  if(!name){ document.getElementById('grp_err').classList.add('show'); return; }
  const id = document.getElementById('grp_id').value;
  const obj = {
    id: id || uid('g'),
    name,
    subject: document.getElementById('grp_subject').value.trim(),
    level: document.getElementById('grp_level').value.trim(),
    students: Number(document.getElementById('grp_students').value) || 0,
    schedule: document.getElementById('grp_schedule').value.trim(),
    fee: document.getElementById('grp_fee').value.trim(),
    description: document.getElementById('grp_desc').value.trim()
  };
  if(id){
    const idx = data.groups.findIndex(g=>g.id===id);
    data.groups[idx] = obj;
  } else {
    data.groups.push(obj);
  }
  saveData(); renderAdminGroups(); renderAll();
  grpEditOverlay.classList.remove('open');
  showToast('Group saved');
});

/* ---------- VACANCIES (admin) ---------- */
const vacEditOverlay = document.getElementById('vacEditOverlay');
function renderAdminVacancies(){
  const el = document.getElementById('vac_list');
  el.innerHTML = data.vacancies.map(v => {
    const isVer = isVacancyVerified(v);
    const statusLabel = isVer ? 'Verified (Closed)' : (v.status==='filled' ? 'Filled (Closed)' : 'Open');
    const appsCount = getVacancyApplicantCount(v.id);
    return `
    <div class="admin-list-item">
      <div class="info">
        <b>${escapeHtml(v.title)}</b>
        <span>${escapeHtml(v.subject||'')} · Status: ${statusLabel} · ${appsCount} applicant(s)</span>
      </div>
      <div class="row-actions">
        <button class="mini-btn" onclick="editVacancy('${v.id}')">Edit</button>
        <button class="mini-btn danger" onclick="deleteVacancy('${v.id}')">Delete</button>
      </div>
    </div>
  `;
  }).join('') || '<p class="empty-note">No vacancies yet.</p>';
}
document.getElementById('vac_addBtn').addEventListener('click', () => openVacancyEdit(null));
document.getElementById('vacEditCloseBtn').addEventListener('click', () => vacEditOverlay.classList.remove('open'));
vacEditOverlay.addEventListener('click', e => { if(e.target === vacEditOverlay) vacEditOverlay.classList.remove('open'); });

function openVacancyEdit(id){
  const v = id ? data.vacancies.find(x=>x.id===id) : null;
  document.getElementById('vacEditTitle').textContent = v ? 'Edit vacancy' : 'Post vacancy';
  document.getElementById('vac_id').value = v ? v.id : '';
  document.getElementById('vac_title').value = v ? v.title : '';
  document.getElementById('vac_subject').value = v ? v.subject : '';
  document.getElementById('vac_type').value = v ? v.type : 'Part-time';
  document.getElementById('vac_location').value = v ? v.location : '';
  document.getElementById('vac_salary').value = v ? v.salary : '';
  document.getElementById('vac_desc').value = v ? v.description : '';
  document.getElementById('vac_status').value = v ? v.status : 'open';
  document.getElementById('vac_err').classList.remove('show');
  vacEditOverlay.classList.add('open');
}
window.editVacancy = (id) => openVacancyEdit(id);
window.deleteVacancy = (id) => {
  if(!confirm('Delete this vacancy?')) return;
  data.vacancies = data.vacancies.filter(v=>v.id!==id);
  saveData(); renderAdminVacancies(); renderAll();
  showToast('Vacancy deleted');
};
document.getElementById('vac_saveBtn').addEventListener('click', () => {
  const title = document.getElementById('vac_title').value.trim();
  if(!title){ document.getElementById('vac_err').classList.add('show'); return; }
  const id = document.getElementById('vac_id').value;
  const obj = {
    id: id || uid('v'),
    title,
    subject: document.getElementById('vac_subject').value.trim(),
    type: document.getElementById('vac_type').value,
    location: document.getElementById('vac_location').value.trim(),
    salary: document.getElementById('vac_salary').value.trim(),
    description: document.getElementById('vac_desc').value.trim(),
    status: document.getElementById('vac_status').value
  };
  if(id){
    const idx = data.vacancies.findIndex(v=>v.id===id);
    data.vacancies[idx] = obj;
  } else {
    data.vacancies.push(obj);
  }
  saveData(); renderAdminVacancies(); renderAll();
  vacEditOverlay.classList.remove('open');
  showToast('Vacancy saved');
});

/* ---------- APPLICATIONS (teacher applications for vacancies) ---------- */
let appsFilter = 'all';
function setAppsFilter(filter){
  appsFilter = filter;
  ['all','pending','verified'].forEach(f => {
    document.getElementById('apps_filter' + f[0].toUpperCase() + f.slice(1)).classList.toggle('active', f === filter);
  });
  renderAdminApplications();
}
/* An application only counts as "fully verified" once every attachment it
   actually has has been checked off — one with no payment screenshot only
   needs its CV verified, for example. */
function isAppFullyVerified(a){
  const needsCv = !!a.cvFileUrl;
  const needsPayment = !!a.paymentFileUrl;
  if(!needsCv && !needsPayment) return false; // nothing to verify yet
  if(needsCv && !a.cvVerified) return false;
  if(needsPayment && !a.paymentVerified) return false;
  return true;
}
function renderAdminApplications(){
  const el = document.getElementById('apps_list');
  let apps = (data.applications||[]).slice().sort((a,b)=>(b.submittedAt||0)-(a.submittedAt||0));
  if(appsFilter === 'pending') apps = apps.filter(a => !isAppFullyVerified(a));
  if(appsFilter === 'verified') apps = apps.filter(a => isAppFullyVerified(a));
  if(apps.length === 0){
    const msg = appsFilter === 'pending' ? 'No applications waiting on verification.'
              : appsFilter === 'verified' ? 'No fully verified applications yet.'
              : 'No applications yet.';
    el.innerHTML = `<p class="empty-note">${msg}</p>`;
    return;
  }
  el.innerHTML = apps.map(a => `
    <div class="admin-list-item" style="flex-direction:column;align-items:stretch;gap:8px;">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div class="info">
          <b>${escapeHtml(a.name||'—')}</b>
          <span>Applied for: ${escapeHtml(a.vacancyTitle||'—')}${a.submittedAt ? ' · ' + new Date(a.submittedAt).toLocaleDateString() : ''}</span>
        </div>
        <div class="row-actions" style="display:flex;gap:6px;flex-wrap:wrap;">
          ${a.phone ? `<a class="mini-btn" href="https://api.whatsapp.com/send?phone=${escapeAttr(a.phone.replace(/[^0-9]/g,''))}&text=${encodeURIComponent(buildWhatsAppCvStatement(a))}" target="_blank" rel="noopener" style="background:#25D366;color:#fff;border:none;">📲 Send WhatsApp</a>` : ''}
          <button class="mini-btn" onclick="copyAppCvStatement('${a.id}')">📋 Copy CV</button>
          <button class="mini-btn danger" onclick="deleteApplication('${a.id}')">Delete</button>
        </div>
      </div>
      ${a.phone ? `<div style="font-size:13px;color:var(--text-dim);">📞 ${escapeHtml(a.phone)}</div>` : ''}
      ${a.agreedTerms ? `<div style="font-size:12.5px;color:var(--accent2);">✓ Agreed to Terms &amp; Conditions${a.agreedAt ? ' on ' + new Date(a.agreedAt).toLocaleDateString() : ''} — signed as "${escapeHtml(a.signature||a.name||'')}"</div>` : `<div style="font-size:12.5px;color:var(--text-dim);">⚠ Did not confirm agreement to terms (older application)</div>`}
      ${a.cvFileUrl ? `<div style="font-size:13px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <a href="${escapeAttr(a.cvFileUrl)}" target="_blank" rel="noopener" style="color:var(--accent2);">📄 Download CV${a.cvFileName ? ' — ' + escapeHtml(a.cvFileName) : ''} ↗</a>
        ${a.cvVerified
          ? `<span class="verify-badge">✓ CV verified</span><button class="mini-btn" onclick="toggleAppVerified('${a.id}','cvVerified')">Undo</button>`
          : `<button class="mini-btn verify" onclick="toggleAppVerified('${a.id}','cvVerified')">Mark CV verified</button>`}
      </div>` : ''}
      ${a.cvText ? `<div style="font-size:13px;color:var(--text-dim);white-space:pre-wrap;">${escapeHtml(a.cvText)}</div>` : ''}
      ${a.cvLink ? `<div style="font-size:13px;"><a href="${escapeAttr(a.cvLink)}" target="_blank" rel="noopener" style="color:var(--accent2);">View CV link ↗</a></div>` : ''}
      ${a.paymentFileUrl ? `<div style="font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <img src="${escapeAttr(a.paymentFileUrl)}" alt="Payment screenshot" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--line);cursor:pointer;" onclick="showLightbox('${escapeAttr(a.paymentFileUrl)}', 'Payment screenshot — ${escapeAttr(a.name||'')}')">
        <a href="${escapeAttr(a.paymentFileUrl)}" target="_blank" rel="noopener" style="color:var(--accent2);">🧾 View payment screenshot${a.paymentFileName ? ' — ' + escapeHtml(a.paymentFileName) : ''} ↗</a>
        ${a.paymentVerified
          ? `<span class="verify-badge">✓ Payment verified</span><button class="mini-btn" onclick="toggleAppVerified('${a.id}','paymentVerified')">Undo</button>`
          : `<button class="mini-btn verify" onclick="toggleAppVerified('${a.id}','paymentVerified')">Mark payment verified</button>`}
      </div>` : `<div style="font-size:12.5px;color:var(--text-dim);">⚠ No payment screenshot attached yet</div>`}
      <div style="margin-top:8px;padding:10px 12px;background:var(--bg);border:1px solid var(--line);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <span style="font-size:12.5px;font-weight:700;color:${a.verified?'var(--accent2)':'var(--text)'};">
          ${a.verified ? '✓ Verified Candidate (Vacancy post closed to others)' : 'Post Lock Action:'}
        </span>
        ${a.verified 
          ? `<button class="mini-btn" onclick="toggleCandidateVerified('${a.id}')">🔓 Re-open Vacancy Post</button>`
          : `<button class="mini-btn verify" onclick="toggleCandidateVerified('${a.id}')">🔒 Verify Candidate & Close Post</button>`
        }
      </div>
    </div>
  `).join('');
}
function toggleCandidateVerified(id){
  const app = (data.applications||[]).find(a=>a.id===id);
  if(!app) return;
  const vac = (data.vacancies||[]).find(v=>v.id===app.vacancyId);
  app.verified = !app.verified;
  if(app.verified){
    app.cvVerified = true;
    app.paymentVerified = true;
    if(vac){ vac.status = 'verified'; vac.verified = true; }
    showToast('Candidate verified! Vacancy post is now closed to other applicants.');
  } else {
    app.cvVerified = false;
    app.paymentVerified = false;
    if(vac){ vac.status = 'open'; vac.verified = false; }
    showToast('Candidate verification reset — Vacancy post re-opened.');
  }
  saveData();
  renderAdminApplications();
  renderAdminVacancies();
  renderAll();
}
function toggleAppVerified(id, field){
  const app = (data.applications||[]).find(a=>a.id===id);
  if(!app) return;
  app[field] = !app[field];
  if(app[field]) app[field.replace('Verified','VerifiedAt')] = Date.now();
  saveData(); renderAdminApplications();
  showToast(app[field] ? 'Marked as verified' : 'Verification removed');
}
function deleteApplication(id){
  const app = (data.applications||[]).find(a=>a.id===id);
  data.applications = (data.applications||[]).filter(a=>a.id!==id);
  saveData(); renderAdminApplications();
  showToast('Application deleted');
  if(app && app.cvFileUrl){
    deleteBlob(app.cvFileUrl);
  }
  if(app && app.paymentFileUrl){
    deleteBlob(app.paymentFileUrl);
  }
}
window.copyAppCvStatement = function(id){
  const app = (data.applications||[]).find(a=>a.id===id);
  if(!app) return;
  const stmt = buildWhatsAppCvStatement(app);
  navigator.clipboard.writeText(stmt).then(() => {
    showToast('CV statement copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy text');
  });
};

/* ---------- CHILDREN (admin — parent submissions) ---------- */
function renderAdminChildren(){
  const el = document.getElementById('children_list');
  if(!el) return;
  const kids = (data.children||[]).slice().sort((a,b)=>(b.submittedAt||0)-(a.submittedAt||0));
  if(kids.length === 0){ el.innerHTML = '<p class="empty-note">No child details submitted yet.</p>'; return; }
  el.innerHTML = kids.map(c => `
    <div class="admin-list-item" style="flex-direction:column;align-items:stretch;gap:8px;">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div class="info">
          <b>${escapeHtml(c.childName||'—')}</b>
          <span>${escapeHtml(c.grade||'—')}${c.school ? ' · ' + escapeHtml(c.school) : ''}${c.submittedAt ? ' · ' + new Date(c.submittedAt).toLocaleDateString() : ''}</span>
        </div>
        <div class="row-actions">
          ${c.parentPhone ? `<a class="mini-btn" href="https://wa.me/${escapeAttr(c.parentPhone.replace(/[^0-9]/g,''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          <button class="mini-btn danger" onclick="deleteChild('${c.id}')">Delete</button>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-dim);">👪 Parent: ${escapeHtml(c.parentName||'—')}${c.parentPhone ? ' · 📞 ' + escapeHtml(c.parentPhone) : ''}${c.parentEmail ? ' · ✉️ ' + escapeHtml(c.parentEmail) : ''}</div>
      ${c.age ? `<div style="font-size:13px;color:var(--text-dim);">🎂 Age: ${escapeHtml(String(c.age))}</div>` : ''}
      ${c.notes ? `<div style="font-size:13px;color:var(--text-dim);white-space:pre-wrap;">📝 ${escapeHtml(c.notes)}</div>` : ''}
    </div>
  `).join('');
}
window.deleteChild = (id) => {
  if(!confirm('Delete this child record?')) return;
  data.children = (data.children||[]).filter(c=>c.id!==id);
  saveData(); renderAdminChildren();
  showToast('Child record deleted');
};

