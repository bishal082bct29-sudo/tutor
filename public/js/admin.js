/* ===================== ADMIN TABS ===================== */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.admin-pane').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    const pane = document.getElementById(tab.dataset.pane);
    if (pane) pane.classList.add('active');
    if (tab.dataset.pane === 'videoAdPane' && typeof renderAdminVideoAd === 'function') {
      renderAdminVideoAd();
    }
  });
});

function openAdminPanel(){
  fillProfileForm();
  if (typeof renderAdminVideoAd === 'function') renderAdminVideoAd();
  renderAdminGroups();
  renderAdminVacancies();
  renderAdminApplications();
  renderAdminChildren();
  renderAdminGallery();
  renderAdminInfo();
  document.getElementById('pw_recoveryPhone').value = data.profile.recoveryPhone || '';
  setDobValue('pw_recoveryDob', data.profile.recoveryDob || '');
  resetPwChangeFlow();
  updateAdminBackendStatus();
  adminOverlay.classList.add('open');
}

async function updateAdminBackendStatus() {
  const dbEl = document.getElementById('status_db');
  const mediaEl = document.getElementById('status_media');
  if (!dbEl || !mediaEl) return;
  try {
    const status = await getBackendIntegrationStatus();
    if (status.neonDatabase) {
      dbEl.innerHTML = '<span style="color:#10b981;">🟢 Neon Postgres Active</span>';
    } else {
      dbEl.innerHTML = '<span style="color:#f59e0b;">🟠 Local/Fallback (set DATABASE_URL)</span>';
    }

    if (status.cloudinary) {
      mediaEl.innerHTML = '<span style="color:#10b981;">🟢 Cloudinary Active</span>';
    } else if (status.vercelBlob) {
      mediaEl.innerHTML = '<span style="color:#3b82f6;">🔵 Vercel Blob Active</span>';
    } else {
      mediaEl.innerHTML = '<span style="color:#f59e0b;">🟠 Local/Data-URL (set CLOUDINARY_URL)</span>';
    }
  } catch (err) {
    if (dbEl) dbEl.textContent = 'Active';
    if (mediaEl) mediaEl.textContent = 'Active';
  }
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
let vac_pendingFile = null;

const VACANCY_PRESETS = {
  see_math: {
    title: 'SEE Comp. & Opt. Mathematics Tutor (Grade 9–10)',
    subject: 'Comp. Mathematics, Opt. Mathematics',
    level: 'Class 9 & 10 (SEE Board Preparation)',
    type: 'Part-time',
    location: 'Baneshwor, Kathmandu',
    salary: 'NPR 12,000 – 15,000 / mo',
    schedule: '5:00 PM – 6:30 PM (6 Days/Wk)',
    desc: 'Experienced SEE mathematics home tutor needed for intensive revision, past paper practice, and formula clarity. 2-day free demo classes required before starting regular sessions.'
  },
  plus2_science: {
    title: '+2 Science (Physics & Chemistry) Home Tutor (Grade 11–12)',
    subject: 'Physics, Chemistry, Basic Math',
    level: '+2 Science / NEB Board',
    type: 'Part-time',
    location: 'Kumaripati / Pulchowk, Lalitpur',
    salary: 'NPR 15,000 – 18,000 / mo',
    schedule: '6:30 AM – 8:00 AM or 5:30 PM – 7:00 PM',
    desc: 'NEB board examination specialist needed for Physics numericals and Chemistry reaction mechanisms. 1-on-1 home tuition with regular mock tests and past paper drilling.'
  },
  plus2_mgmt: {
    title: '+2 Management (Accountancy & Economics) Tutor (Grade 11–12)',
    subject: 'Principles of Accounting, Economics, Business Math',
    level: '+2 Management / NEB',
    type: 'Evening Batch',
    location: 'Kalanki / Kirtipur, Kathmandu',
    salary: 'NPR 12,000 – 15,000 / mo',
    schedule: '5:00 PM – 6:30 PM (Mon–Fri)',
    desc: 'Concept-focused home tutor for financial accounting, journal entries, ledger posting, and microeconomics for Class 11 and 12 students.'
  },
  primary_all: {
    title: 'Primary All-Subjects Home Tutor (Class 1–5)',
    subject: 'English, Nepali, Math, Science, Social Studies',
    level: 'Class 1 to 5 (Primary Level)',
    type: 'Part-time',
    location: 'Old Baneshwor / Sinamangal, Kathmandu',
    salary: 'NPR 10,000 – 12,000 / mo',
    schedule: '4:30 PM – 6:00 PM (Mon–Fri)',
    desc: 'Patient and caring female/male tutor for daily school homework guidance, handwriting improvement, and foundational reading and arithmetic.'
  },
  ble_grade8: {
    title: 'Class 8 BLE Board Preparation (Math & Science)',
    subject: 'Mathematics, Science & Technology, English',
    level: 'Class 8 (BLE / Basic Level Examination)',
    type: 'Part-time',
    location: 'Koteshwor / Jadibuti, Kathmandu',
    salary: 'NPR 12,000 – 14,000 / mo',
    schedule: '5:30 PM – 7:00 PM',
    desc: 'BLE municipal board exam preparation batch. Requires strong clarity in science diagrams, experiments, and mathematics word problems.'
  },
  bachelor_bba: {
    title: 'Bachelor Level (BBA / BBS / BIM) Finance & Stats Tutor',
    subject: 'Financial Accounting, Business Statistics, Cost Accounting',
    level: 'Bachelor (TU / PU / KU)',
    type: 'Weekend only',
    location: 'Putalisadak / Bagbazar, Kathmandu',
    salary: 'NPR 18,000 – 22,000 / mo',
    schedule: 'Morning 7:00 AM – 8:30 AM or Weekends',
    desc: 'Specialist tutor for semester exam preparation in managerial accounting, capital budgeting, and business analytics.'
  },
  a_levels: {
    title: 'Cambridge A-Levels / CBSE Board Specialist Tutor',
    subject: 'Pure Mathematics (P1/P3), Mechanics, Physics 9702',
    level: 'Cambridge AS & A Level / CBSE Grade 11-12',
    type: 'Part-time',
    location: 'Jhamsikhel / Sanepa, Lalitpur',
    salary: 'NPR 20,000 – 25,000 / mo',
    schedule: '5:00 PM – 6:30 PM',
    desc: 'Experienced in Cambridge past paper series 9709/9702 with strong focus on marking scheme criteria and past year variants.'
  },
  spoken_eng: {
    title: 'Spoken English & Communication Coach',
    subject: 'Spoken English, Accent, Daily Conversation, Vocabulary',
    level: 'Beginner to Advanced (All Ages)',
    type: 'Online',
    location: 'Kathmandu Valley / Online Live',
    salary: 'NPR 10,000 – 14,000 / mo',
    schedule: 'Flexible (1 hour/day)',
    desc: 'Interactive speaking sessions, accent neutralization, interview prep, and everyday professional conversation practice.'
  }
};

function renderAdminVacancies(){
  const el = document.getElementById('vac_list');
  if(!el) return;
  el.innerHTML = data.vacancies.map(v => {
    const isVer = isVacancyVerified(v);
    const statusLabel = isVer ? 'Verified (Closed)' : (v.status==='filled' ? 'Filled (Closed)' : 'Open');
    const appsCount = getVacancyApplicantCount(v.id);
    return `
    <div class="admin-list-item">
      <div class="info">
        <b>${escapeHtml(v.title)}</b>
        <span>${escapeHtml(v.subject||'')} · Location: ${escapeHtml(v.location||'N/A')} · Pay: ${escapeHtml(v.salary||'N/A')} · Status: ${statusLabel} · ${appsCount} applicant(s)</span>
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
  vac_pendingFile = null;
  document.getElementById('vacEditTitle').textContent = v ? 'Edit Vacancy' : 'Post Vacancy';
  document.getElementById('vac_id').value = v ? v.id : '';
  document.getElementById('vac_title').value = v ? v.title : '';
  document.getElementById('vac_subject').value = v ? (v.subject||'') : '';
  document.getElementById('vac_level').value = v ? (v.level||'') : '';
  document.getElementById('vac_type').value = v ? (v.type||'Part-time') : 'Part-time';
  document.getElementById('vac_location').value = v ? (v.location||'') : '';
  document.getElementById('vac_salary').value = v ? (v.salary||'') : '';
  document.getElementById('vac_schedule').value = v ? (v.schedule||'') : '';
  const descEl = document.getElementById('vac_desc');
  if(descEl) descEl.value = v ? (v.description||'') : '';
  const statusEl = document.getElementById('vac_status');
  if(statusEl) statusEl.value = v ? (v.status||'open') : 'open';
  
  // Reset temporary image scanner (in-memory only, never saved to storage)
  const vacFileInput = document.getElementById('vac_file');
  if(vacFileInput) vacFileInput.value = '';
  const preview = document.getElementById('vac_preview');
  if(preview) preview.style.display = 'none';
  const previewImg = document.getElementById('vac_previewImg');
  if(previewImg) previewImg.src = '';
  const statusBox = document.getElementById('vac_ocrStatus');
  if(statusBox) statusBox.style.display = 'none';
  const textBox = document.getElementById('vac_extractedTextBox');
  if(textBox) textBox.style.display = 'none';

  // Quick inputs
  const presetSelect = document.getElementById('vac_presetSelect');
  if(presetSelect) presetSelect.value = '';
  const quickText = document.getElementById('vac_quickText');
  if(quickText) quickText.value = '';

  document.getElementById('vac_err').classList.remove('show');
  vacEditOverlay.classList.add('open');
}

// Preset template apply button
const applyPresetBtn = document.getElementById('vac_applyPresetBtn');
if(applyPresetBtn){
  applyPresetBtn.addEventListener('click', () => {
    const key = document.getElementById('vac_presetSelect').value;
    if(!key || !VACANCY_PRESETS[key]){
      showToast('Please choose a template from the dropdown first');
      return;
    }
    const p = VACANCY_PRESETS[key];
    document.getElementById('vac_title').value = p.title;
    document.getElementById('vac_subject').value = p.subject;
    document.getElementById('vac_level').value = p.level;
    document.getElementById('vac_type').value = p.type;
    document.getElementById('vac_location').value = p.location;
    document.getElementById('vac_salary').value = p.salary;
    document.getElementById('vac_schedule').value = p.schedule;
    document.getElementById('vac_desc').value = p.desc;
    showToast('Template fields autofilled! You can still edit any text below.');
  });
}

// Reusable text parser for vacancy fields
function parseVacancyTextData(raw){
  if(!raw) return {};
  let title = '';
  let subject = '';
  let level = '';
  let type = 'Part-time';
  let location = '';
  let salary = '';
  let schedule = '';

  const cleanRaw = raw.replace(/\r\n/g, '\n');

  // 1. Detect Level / Grade / Class
  // Check explicit label first: e.g. "Class: 10", "Grade: 9 & 10", "Level: SEE", "Class - 7"
  const classLabelMatch = cleanRaw.match(/(?:class|grade|level|std|standard)\s*[:=-]\s*([^\n\r,;•|]+)/i);
  if(classLabelMatch && classLabelMatch[1]){
    const val = classLabelMatch[1].trim();
    if(/\b10\b|see/i.test(val)) level = 'Class 10 (SEE)';
    else if(/\b9\b/i.test(val) && /\b10\b/i.test(val)) level = 'Class 9 & 10 (SEE)';
    else if(/\b8\b|ble/i.test(val)) level = 'Class 8 (BLE)';
    else if(/\+2|11|12|neb/i.test(val)) level = '+2 / NEB (Grade 11–12)';
    else if(/\b(?:bba|bbs|bim|bca|bsc|bachelor)\b/i.test(val)) level = 'Bachelor Level';
    else if(/\b(?:nursery|lkg|ukg|kg|playgroup|montessori)\b/i.test(val)) level = 'Pre-Primary (Nursery/KG)';
    else if(/\b[1-5]\b/.test(val)) level = val.length < 15 ? `Class ${val.replace(/class|grade/ig,'').trim()}` : 'Primary (Class 1–5)';
    else if(/\b[6-9]\b/.test(val)) level = val.length < 15 ? `Class ${val.replace(/class|grade/ig,'').trim()}` : 'Lower Secondary';
    else if(val.length > 1 && val.length < 30) level = val;
  }

  // Fallback regex detection for Level
  if(!level){
    if(/(?:class|grade|std)\s*([0-9]{1,2})\s*(?:to|-|&|and)\s*([0-9]{1,2})/i.test(cleanRaw)){
      const m = cleanRaw.match(/(?:class|grade|std)\s*([0-9]{1,2})\s*(?:to|-|&|and)\s*([0-9]{1,2})/i);
      level = `Class ${m[1]}–${m[2]}`;
    } else if(/(?:class|grade|std)\s*10\b|\bsee\b|\bs\.e\.e\.?\b/i.test(cleanRaw)){
      level = 'Class 10 (SEE)';
    } else if(/(?:class|grade|std)\s*9\b/i.test(cleanRaw)){
      level = 'Class 9';
    } else if(/(?:class|grade|std)\s*8\b|\bble\b|\bb\.l\.e\.?\b/i.test(cleanRaw)){
      level = 'Class 8 (BLE)';
    } else if(/(?:class|grade|std)\s*7\b/i.test(cleanRaw)){
      level = 'Class 7';
    } else if(/(?:class|grade|std)\s*6\b/i.test(cleanRaw)){
      level = 'Class 6';
    } else if(/(?:class|grade|std)\s*5\b/i.test(cleanRaw)){
      level = 'Class 5';
    } else if(/(?:class|grade|std)\s*4\b/i.test(cleanRaw)){
      level = 'Class 4';
    } else if(/(?:class|grade|std)\s*3\b/i.test(cleanRaw)){
      level = 'Class 3';
    } else if(/(?:class|grade|std)\s*2\b/i.test(cleanRaw)){
      level = 'Class 2';
    } else if(/(?:class|grade|std)\s*1\b/i.test(cleanRaw)){
      level = 'Class 1';
    } else if(/\+2\s*(?:science|mgmt|management|commerce|humanities|arts)?|grade\s*1[12]|class\s*1[12]|\bneb\b/i.test(cleanRaw)){
      level = '+2 / NEB (Grade 11–12)';
    } else if(/\bbachelor\b|\bbba\b|\bbbs\b|\bbim\b|\bbca\b|\bbsc\b|\bb\.sc\b|\bb\.tech\b|\bbit\b/i.test(cleanRaw)){
      level = 'Bachelor Level';
    } else if(/\ba[\s-]?levels?\b|\bas[\s-]?levels?\b|\ba2[\s-]?levels?\b|\bcambridge\b|\bcbse\b|\bicse\b/i.test(cleanRaw)){
      level = 'A-Levels / CBSE';
    } else if(/\bnursery\b|\blkg\b|\bukg\b|\bkindergarten\b|\bmontessori\b|\bplaygroup\b|\bpre[\s-]?primary\b/i.test(cleanRaw)){
      level = 'Pre-Primary (Nursery/KG)';
    } else if(/\bprimary\b|class\s*[1-5]|grade\s*[1-5]/i.test(cleanRaw)){
      level = 'Primary (Class 1–5)';
    } else if(/middle\s*school|lower\s*secondary|class\s*[6-8]|grade\s*[6-8]/i.test(cleanRaw)){
      level = 'Class 6–8 (Lower Secondary)';
    }
  }

  // 2. Detect Location (Kathmandu Valley Areas)
  // Check explicit label first: e.g. "Location: Baneshwor", "Address: Kumaripati", "Loc: Kalanki"
  const locLabelMatch = cleanRaw.match(/(?:location|address|loc|area|place|zone|locality)\s*[:=-]\s*([^\n\r,;•|]+(?:,\s*[^\n\r,;•|]+)?)/i);
  if(locLabelMatch && locLabelMatch[1]){
    let explicitLoc = locLabelMatch[1].trim().replace(/\s+(?:time|timing|salary|pay|phone|contact|subject|class|grade|fee)\b.*$/i, '').trim();
    if(explicitLoc && explicitLoc.length > 2 && explicitLoc.length < 45 && !/^(?:kathmandu|nepal|valley)$/i.test(explicitLoc)){
      if(!/kathmandu|lalitpur|bhaktapur/i.test(explicitLoc)){
        explicitLoc = `${explicitLoc}, Kathmandu Valley`;
      }
      location = explicitLoc;
    }
  }

  // Check comprehensive Kathmandu Valley area dictionary
  if(!location){
    const ktmAreas = [
      // Specific landmark / sub-areas first
      { name: 'New Baneshwor, Kathmandu', pattern: /\b(?:new\s+)?baneshwor\b/i },
      { name: 'Old Baneshwor, Kathmandu', pattern: /\bold\s+baneshwor\b/i },
      { name: 'Shankhamul, Kathmandu', pattern: /\bshankhamul\b/i },
      { name: 'Minbhawan, Kathmandu', pattern: /\bminbhawan\b/i },
      { name: 'Thapagaon, Kathmandu', pattern: /\bthapagaon\b/i },
      { name: 'Koteshwor, Kathmandu', pattern: /\bkoteshwor\b/i },
      { name: 'Tinkune, Kathmandu', pattern: /\btinkune\b/i },
      { name: 'Sinamangal, Kathmandu', pattern: /\bsinamangal\b/i },
      { name: 'Jadibuti, Kathmandu', pattern: /\bjadibuti\b/i },
      { name: 'Chabahil, Kathmandu', pattern: /\bchabahil|chabehil\b/i },
      { name: 'Mitrapark, Kathmandu', pattern: /\bmitrapark\b/i },
      { name: 'Gaushala, Kathmandu', pattern: /\bgaushala\b/i },
      { name: 'Battisputali, Kathmandu', pattern: /\bbattisputali\b/i },
      { name: 'Boudha, Kathmandu', pattern: /\bboudha|bouddha\b/i },
      { name: 'Jorpati, Kathmandu', pattern: /\bjorpati\b/i },
      { name: 'Mulpani, Kathmandu', pattern: /\bmulpani\b/i },
      { name: 'Kapan, Kathmandu', pattern: /\bkapan\b/i },
      { name: 'Mandikhatar, Kathmandu', pattern: /\bmandikhatar\b/i },
      { name: 'Golfutar, Kathmandu', pattern: /\bgolfutar\b/i },
      { name: 'Budhanilkantha, Kathmandu', pattern: /\bbudhanilkantha\b/i },
      { name: 'Tokha, Kathmandu', pattern: /\btokha\b/i },
      { name: 'Dhapasi, Kathmandu', pattern: /\bdhapasi\b/i },
      { name: 'Basundhara, Kathmandu', pattern: /\bbasundhara\b/i },
      { name: 'Samakhusi, Kathmandu', pattern: /\bsamakhusi|samakhushi\b/i },
      { name: 'Gongabu, Kathmandu', pattern: /\bgongabu\b/i },
      { name: 'Baniyatar, Kathmandu', pattern: /\bbaniyatar\b/i },
      { name: 'Balaju, Kathmandu', pattern: /\bbalaju\b/i },
      { name: 'Machhapokhari, Kathmandu', pattern: /\bmachhapokhari\b/i },
      { name: 'Sorakhutte, Kathmandu', pattern: /\bsorakhutte\b/i },
      { name: 'Thamel, Kathmandu', pattern: /\bthamel\b/i },
      { name: 'Lazimpat, Kathmandu', pattern: /\blazimpat\b/i },
      { name: 'Naxal, Kathmandu', pattern: /\bnaxal\b/i },
      { name: 'Bhatbhateni, Kathmandu', pattern: /\bbhatbhateni\b/i },
      { name: 'Baluwatar, Kathmandu', pattern: /\bbaluwatar\b/i },
      { name: 'Maharajgunj, Kathmandu', pattern: /\bmaharajgunj|maharajganj\b/i },
      { name: 'Dhumbarahi, Kathmandu', pattern: /\bdhumbarahi\b/i },
      { name: 'Sukedhara, Kathmandu', pattern: /\bsukedhara\b/i },
      { name: 'Putalisadak, Kathmandu', pattern: /\bputalisadak\b/i },
      { name: 'Bagbazar, Kathmandu', pattern: /\bbagbazar\b/i },
      { name: 'Dillibazar, Kathmandu', pattern: /\bdillibazar\b/i },
      { name: 'Maitighar, Kathmandu', pattern: /\bmaitighar\b/i },
      { name: 'Anamnagar, Kathmandu', pattern: /\banamnagar\b/i },
      { name: 'Tripureshwor, Kathmandu', pattern: /\btripureshwor\b/i },
      { name: 'Teku, Kathmandu', pattern: /\bteku\b/i },
      { name: 'Kalimati, Kathmandu', pattern: /\bkalimati\b/i },
      { name: 'Kuleshwor, Kathmandu', pattern: /\bkuleshwor\b/i },
      { name: 'Balkhu, Kathmandu', pattern: /\bbalkhu\b/i },
      { name: 'Kalanki, Kathmandu', pattern: /\bkalanki\b/i },
      { name: 'Sitapaila, Kathmandu', pattern: /\bsitapaila\b/i },
      { name: 'Syuchatar, Kathmandu', pattern: /\bsyuchatar\b/i },
      { name: 'Swayambhu, Kathmandu', pattern: /\bswayambhu|swoyambhu\b/i },
      { name: 'Chhauni, Kathmandu', pattern: /\bchhauni\b/i },
      { name: 'Tahachal, Kathmandu', pattern: /\btahachal\b/i },
      { name: 'Kirtipur, Kathmandu', pattern: /\bkirtipur\b/i },
      { name: 'Panga, Kathmandu', pattern: /\bpanga\b/i },
      { name: 'Chobhar, Kathmandu', pattern: /\bchobhar\b/i },
      { name: 'Thankot, Kathmandu', pattern: /\bthankot\b/i },
      { name: 'Naikap, Kathmandu', pattern: /\bnaikap\b/i },
      { name: 'Pepacola, Kathmandu', pattern: /\bpepacola|pepsicola\b/i },
      { name: 'Kadaghari, Kathmandu', pattern: /\bkadaghari\b/i },
      { name: 'Manohara, Kathmandu', pattern: /\bmanohara\b/i },
      { name: 'Sankhu, Kathmandu', pattern: /\bsankhu\b/i },
      // Lalitpur
      { name: 'Kumaripati, Lalitpur', pattern: /\bkumaripati\b/i },
      { name: 'Jawalakhel, Lalitpur', pattern: /\bjawalakhel\b/i },
      { name: 'Lagankhel, Lalitpur', pattern: /\blagankhel\b/i },
      { name: 'Pulchowk, Lalitpur', pattern: /\bpulchowk|pulchok\b/i },
      { name: 'Jhamsikhel, Lalitpur', pattern: /\bjhamsikhel\b/i },
      { name: 'Sanepa, Lalitpur', pattern: /\bsanepa\b/i },
      { name: 'Kupondole, Lalitpur', pattern: /\bkupondole|kupondol\b/i },
      { name: 'Patan, Lalitpur', pattern: /\bpatan|mangalbazar\b/i },
      { name: 'Bhaisepati, Lalitpur', pattern: /\bbhaisepati|bhaisepatti\b/i },
      { name: 'Nakkhu, Lalitpur', pattern: /\bnakkhu|nakhu\b/i },
      { name: 'Ekantakuna, Lalitpur', pattern: /\bekantakuna\b/i },
      { name: 'Balkumari, Lalitpur', pattern: /\bbalkumari\b/i },
      { name: 'Gwarko, Lalitpur', pattern: /\bgwarko\b/i },
      { name: 'Satdobato, Lalitpur', pattern: /\bsatdobato\b/i },
      { name: 'Dhapakhel, Lalitpur', pattern: /\bdhapakhel\b/i },
      { name: 'Harisiddhi, Lalitpur', pattern: /\bharisiddhi\b/i },
      { name: 'Sunakothi, Lalitpur', pattern: /\bsunakothi\b/i },
      { name: 'Thecho, Lalitpur', pattern: /\bthecho\b/i },
      { name: 'Tikathali, Lalitpur', pattern: /\btikathali\b/i },
      { name: 'Imadol, Lalitpur', pattern: /\bimadol\b/i },
      { name: 'Lubhu, Lalitpur', pattern: /\blubhu\b/i },
      { name: 'Godawari, Lalitpur', pattern: /\bgodawari\b/i },
      { name: 'Sanagaon, Lalitpur', pattern: /\bsanagaon\b/i },
      { name: 'Kusunti, Lalitpur', pattern: /\bkusunti\b/i },
      { name: 'Mahalaxmisthan, Lalitpur', pattern: /\bmahalaxmisthan\b/i },
      { name: 'Talchikhel, Lalitpur', pattern: /\btalchikhel\b/i },
      { name: 'Nakhipot, Lalitpur', pattern: /\bnakhipot\b/i },
      { name: 'Sainbu, Lalitpur', pattern: /\bsainbu\b/i },
      // Bhaktapur
      { name: 'Thimi, Bhaktapur', pattern: /\b(?:sano\s+)?thimi\b/i },
      { name: 'Radhe Radhe, Bhaktapur', pattern: /\bradhe\s+radhe\b/i },
      { name: 'Sallaghari, Bhaktapur', pattern: /\bsallaghari\b/i },
      { name: 'Suryabinayak, Bhaktapur', pattern: /\bsuryabinayak\b/i },
      { name: 'Kamalbinayak, Bhaktapur', pattern: /\bkamalbinayak\b/i },
      { name: 'Gatthaghar, Bhaktapur', pattern: /\bgatthaghar|gattaghar\b/i },
      { name: 'Lokanthali, Bhaktapur', pattern: /\blokanthali\b/i },
      { name: 'Kaushaltar, Bhaktapur', pattern: /\bkaushaltar\b/i },
      { name: 'Balkot, Bhaktapur', pattern: /\bbalkot\b/i },
      { name: 'Dadhikot, Bhaktapur', pattern: /\bdadhikot\b/i },
      { name: 'Sirutar, Bhaktapur', pattern: /\bsirutar\b/i },
      { name: 'Duwakot, Bhaktapur', pattern: /\bduwakot\b/i },
      { name: 'Jagati, Bhaktapur', pattern: /\bjagati\b/i },
      { name: 'Bhaktapur', pattern: /\bbhaktapur\b/i },
      { name: 'Lalitpur', pattern: /\blalitpur\b/i },
      { name: 'Kathmandu', pattern: /\bkathmandu\b/i }
    ];

    for(const item of ktmAreas){
      if(item.pattern.test(cleanRaw)){
        location = item.name;
        break;
      }
    }
  }

  if(!location) location = 'Kathmandu Valley';

  // 3. Detect subjects
  const foundSubjects = [];
  if(/opt(?:\.|\s*)math|comp(?:\.|\s*)math|optional\s*math|compulsory\s*math|calculus|algebra/i.test(cleanRaw)){
    if(/opt/i.test(cleanRaw) && /comp/i.test(cleanRaw)) foundSubjects.push('Comp. & Opt. Mathematics');
    else if(/opt/i.test(cleanRaw)) foundSubjects.push('Optional Mathematics');
    else foundSubjects.push('Mathematics');
  } else if(/\bmath\b|\bmathematics\b/i.test(cleanRaw)){
    foundSubjects.push('Mathematics');
  }

  if(/\bphysics\b/i.test(cleanRaw)) foundSubjects.push('Physics');
  if(/\bchemistry\b|\bchem\b/i.test(cleanRaw)) foundSubjects.push('Chemistry');
  if(/\bbiology\b|\bbio\b/i.test(cleanRaw)) foundSubjects.push('Biology');
  if(/\bscience\b/i.test(cleanRaw) && !foundSubjects.includes('Physics') && !foundSubjects.includes('Chemistry')) foundSubjects.push('Science');
  if(/\baccount\b|\baccountancy\b|\bfinance\b/i.test(cleanRaw)) foundSubjects.push('Accountancy');
  if(/\beconomics\b|\becon\b/i.test(cleanRaw)) foundSubjects.push('Economics');
  if(/\benglish\b|\bgrammar\b/i.test(cleanRaw)) foundSubjects.push('English');
  if(/\bnepali\b/i.test(cleanRaw)) foundSubjects.push('Nepali');
  if(/\bsocial\b|\bsocial\s*studies\b/i.test(cleanRaw)) foundSubjects.push('Social Studies');
  if(/\bcomputer\b|\bcoding\b|\bprogramming\b/i.test(cleanRaw)) foundSubjects.push('Computer Science');

  subject = foundSubjects.join(', ') || 'All Subjects';

  // 4. Detect Salary / Fee
  const salMatch = cleanRaw.match(/(?:npr|rs\.?|salary|pay|fee)?\s*(\d{1,2}[,\.]?\d{3}|\d+k)(?:\s*(?:to|-)\s*(\d{1,2}[,\.]?\d{3}|\d+k))?(?:\s*\/\s*(?:mo|month))?/i);
  if(salMatch && salMatch[1]){
    salary = `NPR ${salMatch[1]}${salMatch[2] ? ' – ' + salMatch[2] : ''} / month`;
  }

  // 5. Detect timing/schedule
  const timeMatch = cleanRaw.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if(timeMatch){
    schedule = timeMatch[1];
  } else if(/morning/i.test(cleanRaw)){
    schedule = 'Morning Batch (6:30 AM – 8:00 AM)';
  } else if(/evening/i.test(cleanRaw)){
    schedule = 'Evening Batch (5:00 PM – 6:30 PM)';
  }

  // 6. Detect Type
  if(/full\s*time/i.test(cleanRaw)) type = 'Full-time';
  else if(/weekend/i.test(cleanRaw)) type = 'Weekend only';
  else if(/online/i.test(cleanRaw)) type = 'Online';
  else if(/morning/i.test(cleanRaw)) type = 'Morning Batch';
  else if(/evening/i.test(cleanRaw)) type = 'Evening Batch';

  // 7. Form title
  const locShort = location.split(',')[0].trim();
  title = `${level || 'Home'} ${subject} Tutor – ${locShort}`;

  return { title, subject, level: level || 'Class 1–10', type, location, salary, schedule, raw };
}

function parseVacancyTextAndFillFields(raw){
  if(!raw) return;
  const p = parseVacancyTextData(raw);

  if(p.title) document.getElementById('vac_title').value = p.title;
  if(p.subject) document.getElementById('vac_subject').value = p.subject;
  if(p.level) document.getElementById('vac_level').value = p.level;
  if(p.type) document.getElementById('vac_type').value = p.type;
  if(p.location) document.getElementById('vac_location').value = p.location;
  if(p.salary) document.getElementById('vac_salary').value = p.salary;
  if(p.schedule) document.getElementById('vac_schedule').value = p.schedule;
  const descEl = document.getElementById('vac_desc');
  if(descEl) descEl.value = raw;
}

// Smart text parser button
const quickParseBtn = document.getElementById('vac_quickParseBtn');
if(quickParseBtn){
  quickParseBtn.addEventListener('click', () => {
    const raw = (document.getElementById('vac_quickText').value || '').trim();
    if(!raw){
      showToast('Please paste or write some vacancy requirement text first');
      return;
    }
    parseVacancyTextAndFillFields(raw);
    showToast('✨ Text parsed and autofilled into all fields below!');
  });
}

/* ==================== EXTRACT TEXT FROM IMAGE (OCR) ==================== */
function updateOcrProgress(percent, msg, isSuccess = false, isError = false){
  const statusBox = document.getElementById('vac_ocrStatus');
  const statusText = document.getElementById('vac_ocrStatusText');
  const statusPercent = document.getElementById('vac_ocrPercent');
  const progressBar = document.getElementById('vac_ocrProgressBar');

  if(statusBox) statusBox.style.display = 'block';
  if(statusText && msg) statusText.textContent = msg;
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  if(statusPercent) statusPercent.textContent = `${p}%`;
  if(progressBar) progressBar.style.width = `${p}%`;

  if(statusBox){
    if(isSuccess){
      statusBox.style.background = 'rgba(76, 175, 80, 0.15)';
      statusBox.style.borderColor = 'rgba(76, 175, 80, 0.4)';
      if(progressBar) progressBar.style.background = '#4CAF50';
      if(statusPercent) statusPercent.style.color = '#4CAF50';
    } else if(isError){
      statusBox.style.background = 'rgba(244, 67, 54, 0.15)';
      statusBox.style.borderColor = 'rgba(244, 67, 54, 0.4)';
      if(progressBar) progressBar.style.background = '#F44336';
      if(statusPercent) statusPercent.style.color = '#F44336';
    } else {
      statusBox.style.background = 'rgba(244, 201, 93, 0.12)';
      statusBox.style.borderColor = 'rgba(244, 201, 93, 0.35)';
      if(progressBar) progressBar.style.background = 'var(--accent)';
      if(statusPercent) statusPercent.style.color = 'var(--accent)';
    }
  }
}

function quickScaleImageForOCR(fileOrUrl, maxDimension = 1200, quality = 0.82){
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if(w > maxDimension || h > maxDimension){
        if(w > h){
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      if(typeof fileOrUrl === 'string') resolve(fileOrUrl);
      else {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(fileOrUrl);
      }
    };
    if(typeof fileOrUrl === 'string'){
      img.src = fileOrUrl;
    } else {
      img.src = URL.createObjectURL(fileOrUrl);
    }
  });
}

async function extractTextFromVacancyImage(){
  const textBox = document.getElementById('vac_extractedTextBox');
  const textArea = document.getElementById('vac_extractedText');
  const extractBtn = document.getElementById('vac_extractFromImgBtn');

  let rawSource = vac_pendingFile;
  const vacFileInput = document.getElementById('vac_file');
  if(!rawSource && vacFileInput && vacFileInput.files && vacFileInput.files[0]){
    rawSource = vacFileInput.files[0];
  }

  if(!rawSource){
    showToast('Please select a flyer image file first.');
    return;
  }

  if(extractBtn){
    extractBtn.disabled = true;
    extractBtn.textContent = '⚡ Extracting...';
  }

  updateOcrProgress(15, '⚡ Preparing & scaling flyer image (15%)...');

  let progressInterval = null;
  let currentPct = 15;

  try{
    // Fast-scale image (1200px max, ~100KB payload) for sub-second network transfer
    const imageSource = await quickScaleImageForOCR(rawSource, 1200, 0.82);
    updateOcrProgress(30, '⚡ Uploading scan to AI OCR engine (30%)...');

    // Simulate steady progress during network call up to 88%
    progressInterval = setInterval(() => {
      if(currentPct < 88){
        currentPct += Math.floor(Math.random() * 8) + 4;
        if(currentPct > 88) currentPct = 88;
        if(currentPct < 55){
          updateOcrProgress(currentPct, `⚡ AI reading text & flyer structure (${currentPct}%)...`);
        } else {
          updateOcrProgress(currentPct, `⚡ Parsing Title, Class, Location & Pay (${currentPct}%)...`);
        }
      }
    }, 120);

    const res = await fetch('/api/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageSource, mimeType: 'image/jpeg' })
    });

    if(progressInterval) clearInterval(progressInterval);
    updateOcrProgress(92, '⚡ Processing extracted fields (92%)...');

    const result = await res.json();

    if(res.ok && result && (result.extractedText || result.parsed)){
      const raw = result.extractedText || (result.parsed ? result.parsed.rawText : '') || '';
      
      if(textArea) textArea.value = raw;
      if(textBox) textBox.style.display = 'block';

      if(result.parsed){
        const p = result.parsed;
        // Priority 1: Use exact extracted values from the AI engine
        let exactTitle = p.title ? p.title.trim() : '';
        let exactSubject = p.subject ? p.subject.trim() : '';
        let exactLevel = p.level ? p.level.trim() : '';
        let exactLocation = p.location ? p.location.trim() : '';
        let exactSalary = p.salary ? p.salary.trim() : '';
        let exactSchedule = p.schedule ? p.schedule.trim() : '';
        let exactType = p.type ? p.type.trim() : 'Part-time';

        // Priority 2: Fallback to heuristic parser only for fields that are missing
        const fallback = parseVacancyTextData(raw);
        if(!exactLevel && fallback.level) exactLevel = fallback.level;
        if(!exactLocation && fallback.location) exactLocation = fallback.location;
        if(!exactSubject && fallback.subject) exactSubject = fallback.subject;
        if(!exactSalary && fallback.salary) exactSalary = fallback.salary;
        if(!exactSchedule && fallback.schedule) exactSchedule = fallback.schedule;
        if(!exactType && fallback.type) exactType = fallback.type;

        if(!exactTitle || exactTitle === 'Home Tutor' || exactTitle.includes('undefined')){
          const locPart = (exactLocation || 'Kathmandu').split(',')[0].trim();
          exactTitle = `${exactLevel || 'Home'} ${exactSubject || 'Tuition'} Tutor – ${locPart}`;
        }

        // Fill all form inputs exactly
        if(exactTitle) document.getElementById('vac_title').value = exactTitle;
        if(exactSubject) document.getElementById('vac_subject').value = exactSubject;
        if(exactLevel) document.getElementById('vac_level').value = exactLevel;
        if(exactType) document.getElementById('vac_type').value = exactType;
        if(exactLocation) document.getElementById('vac_location').value = exactLocation;
        if(exactSalary) document.getElementById('vac_salary').value = exactSalary;
        if(exactSchedule) document.getElementById('vac_schedule').value = exactSchedule;
        
        const descEl = document.getElementById('vac_desc');
        if(descEl){
          descEl.value = p.description || raw;
        }
      } else if(raw){
        parseVacancyTextAndFillFields(raw);
      }

      // Automatically discard in-memory image scan to keep storage clean
      vac_pendingFile = null;
      const vacFileInput = document.getElementById('vac_file');
      if(vacFileInput) vacFileInput.value = '';

      updateOcrProgress(100, '✅ 100% Extracted & Form Filled!', true);
      showToast('✨ Form fields filled (100% Complete)!');
    } else {
      // Fallback to client-side OCR
      await runClientSideOCR(imageSource);
    }
  }catch(err){
    if(progressInterval) clearInterval(progressInterval);
    console.warn('Server OCR failed, attempting client OCR fallback:', err);
    await runClientSideOCR(rawSource);
  }finally{
    if(progressInterval) clearInterval(progressInterval);
    if(extractBtn){
      extractBtn.disabled = false;
      extractBtn.textContent = '✨ Re-Scan Image';
    }
  }
}

async function runClientSideOCR(imgSrc){
  const textBox = document.getElementById('vac_extractedTextBox');
  const textArea = document.getElementById('vac_extractedText');

  updateOcrProgress(20, '🔍 Loading client-side OCR engine (20%)...');

  try{
    if(!window.Tesseract){
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load OCR script'));
        document.head.appendChild(script);
      });
    }

    updateOcrProgress(35, '🔍 Pre-processing image (35%)...');
    const scaled = await quickScaleImageForOCR(imgSrc, 1000, 0.85);

    const { data: { text } } = await window.Tesseract.recognize(scaled, 'eng', {
      logger: m => {
        if(m.status === 'recognizing text'){
          const pct = Math.min(95, Math.round(35 + (m.progress || 0) * 60));
          updateOcrProgress(pct, `🔍 Recognizing text (${pct}%)...`);
        }
      }
    });

    const cleaned = (text || '').trim();
    if(textArea) textArea.value = cleaned;
    if(textBox) textBox.style.display = 'block';

    parseVacancyTextAndFillFields(cleaned);
    vac_pendingFile = null;
    const vacFileInput = document.getElementById('vac_file');
    if(vacFileInput) vacFileInput.value = '';

    updateOcrProgress(100, '✅ 100% Extracted & Form Filled!', true);
    showToast('✨ Text extracted (100% Complete)!');
  }catch(e){
    updateOcrProgress(0, '⚠️ Could not read image text. Please enter details manually.', false, true);
    showToast('Could not process image OCR');
  }
}

const extractFromImgBtn = document.getElementById('vac_extractFromImgBtn');
if(extractFromImgBtn){
  extractFromImgBtn.addEventListener('click', extractTextFromVacancyImage);
}

const copyExtractedBtn = document.getElementById('vac_copyExtractedTextBtn');
if(copyExtractedBtn){
  copyExtractedBtn.addEventListener('click', () => {
    const text = (document.getElementById('vac_extractedText').value || '').trim();
    if(!text){ showToast('No extracted text to copy'); return; }
    navigator.clipboard.writeText(text).then(() => {
      showToast('Extracted text copied to clipboard!');
    }).catch(() => {
      showToast('Failed to copy text');
    });
  });
}

// Image upload file input listener (Auto-extracts instantly and discards image)
const vacFileInput = document.getElementById('vac_file');
if(vacFileInput){
  vacFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    if(!file.type.startsWith('image/')){
      showToast('Please choose an image file (PNG, JPG, WebP)');
      e.target.value = '';
      return;
    }
    vac_pendingFile = file;
    document.getElementById('vac_previewImg').src = URL.createObjectURL(file);
    document.getElementById('vac_previewFileName').textContent = `Scanning: ${file.name} (temporary)`;
    document.getElementById('vac_preview').style.display = 'block';
    
    // Auto-trigger ultra-fast extraction immediately
    extractTextFromVacancyImage();
  });
}

// Remove image scan button listener
const vacRemoveImgBtn = document.getElementById('vac_removeImgBtn');
if(vacRemoveImgBtn){
  vacRemoveImgBtn.addEventListener('click', () => {
    vac_pendingFile = null;
    const fi = document.getElementById('vac_file');
    if(fi) fi.value = '';
    const pi = document.getElementById('vac_previewImg');
    if(pi) pi.src = '';
    const pr = document.getElementById('vac_preview');
    if(pr) pr.style.display = 'none';
    const sb = document.getElementById('vac_ocrStatus');
    if(sb) sb.style.display = 'none';
    showToast('Flyer scan cleared');
  });
}

window.editVacancy = (id) => openVacancyEdit(id);
window.deleteVacancy = (id) => {
  if(!confirm('Delete this vacancy?')) return;
  const removed = data.vacancies.find(v=>v.id===id);
  data.vacancies = data.vacancies.filter(v=>v.id!==id);
  if(removed && removed.imageUrl && (removed.imageUrl.includes('cloudinary.com') || removed.imageUrl.includes('blob.vercel-storage.com'))){
    deleteBlob(removed.imageUrl);
  }
  saveData(); renderAdminVacancies(); renderAll();
  showToast('Vacancy deleted');
};

document.getElementById('vac_saveBtn').addEventListener('click', async () => {
  const title = document.getElementById('vac_title').value.trim();
  if(!title){ document.getElementById('vac_err').classList.add('show'); return; }
  const btn = document.getElementById('vac_saveBtn');
  const originalLabel = btn.textContent;
  const id = document.getElementById('vac_id').value;

  const existingVac = id ? data.vacancies.find(v=>v.id===id) : null;
  // If an existing vacancy had an old legacy image, clean it up from storage
  if(existingVac && existingVac.imageUrl && (existingVac.imageUrl.includes('cloudinary.com') || existingVac.imageUrl.includes('blob.vercel-storage.com'))){
    deleteBlob(existingVac.imageUrl);
  }

  const descEl = document.getElementById('vac_desc');
  const statusEl = document.getElementById('vac_status');

  const obj = {
    id: id || uid('v'),
    title,
    subject: document.getElementById('vac_subject').value.trim(),
    level: document.getElementById('vac_level').value.trim(),
    type: document.getElementById('vac_type').value,
    location: document.getElementById('vac_location').value.trim(),
    salary: document.getElementById('vac_salary').value.trim(),
    schedule: document.getElementById('vac_schedule').value.trim(),
    description: descEl ? descEl.value.trim() : (existingVac ? (existingVac.description || '') : ''),
    status: statusEl ? statusEl.value : (existingVac ? (existingVac.status || 'open') : 'open'),
    imageUrl: '' // Clean storage: no flyer images stored
  };

  btn.textContent = 'Saving…';
  if(id){
    const idx = data.vacancies.findIndex(v=>v.id===id);
    data.vacancies[idx] = obj;
  } else {
    data.vacancies.push(obj);
  }

  await saveData();
  btn.disabled = false; btn.textContent = originalLabel;
  vac_pendingFile = null;
  renderAdminVacancies(); renderAll();
  vacEditOverlay.classList.remove('open');
  showToast('Vacancy saved successfully!');
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

