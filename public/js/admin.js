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
        ${v.imageUrl ? `<span style="color:var(--accent);font-size:11.5px;">📸 Poster image attached</span>` : ''}
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
  
  // Image Upload reset & state
  document.getElementById('vac_file').value = '';
  document.getElementById('vac_imageUrl').value = v ? (v.imageUrl||'') : '';
  const preview = document.getElementById('vac_preview');
  const previewImg = document.getElementById('vac_previewImg');
  if(v && v.imageUrl){
    previewImg.src = v.imageUrl;
    preview.style.display = 'block';
    document.getElementById('vac_previewFileName').textContent = 'Current flyer image';
  } else {
    previewImg.src = '';
    preview.style.display = 'none';
  }

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
function parseVacancyTextAndFillFields(raw){
  if(!raw) return;
  let title = '';
  let subject = '';
  let level = '';
  let type = 'Part-time';
  let location = 'Kathmandu Valley';
  let salary = '';
  let schedule = '';

  // Detect level/grade
  if(/class\s*(?:9|10)|grade\s*(?:9|10)|see\b/i.test(raw)){
    level = 'Class 9 & 10 (SEE)';
  } else if(/\+2|grade\s*(?:11|12)|class\s*(?:11|12)|neb\b/i.test(raw)){
    level = '+2 / NEB (Grade 11–12)';
  } else if(/class\s*8|grade\s*8|ble\b/i.test(raw)){
    level = 'Class 8 (BLE)';
  } else if(/primary|class\s*[1-5]|grade\s*[1-5]/i.test(raw)){
    level = 'Primary (Class 1–5)';
  } else if(/bachelor|bba|bbs|bim/i.test(raw)){
    level = 'Bachelor Level';
  } else if(/a-level|a\s*level|cambridge/i.test(raw)){
    level = 'A-Levels / CBSE';
  }

  // Detect subjects
  const foundSubjects = [];
  if(/opt(?:\.|\s*)math|comp(?:\.|\s*)math|math|mathematics|calculus|algebra/i.test(raw)) foundSubjects.push('Mathematics');
  if(/physics|science|chem|chemistry|biology/i.test(raw)) foundSubjects.push('Science');
  if(/account|economics|finance|business/i.test(raw)) foundSubjects.push('Accountancy & Economics');
  if(/english|spoken/i.test(raw)) foundSubjects.push('English');
  if(/nepali/i.test(raw)) foundSubjects.push('Nepali');
  if(/social/i.test(raw)) foundSubjects.push('Social Studies');
  subject = foundSubjects.join(', ') || 'All Subjects';

  // Detect location
  const locationsList = ['Baneshwor', 'Kumaripati', 'Pulchowk', 'Jawalakhel', 'Jhamsikhel', 'Kalanki', 'Koteshwor', 'Chabahil', 'Maharajgunj', 'Kirtipur', 'Lalitpur', 'Bhaktapur', 'Sanepa', 'Boudha', 'Sinamangal', 'Putalisadak', 'Kathmandu'];
  for(const loc of locationsList){
    if(new RegExp('\\b' + loc + '\\b', 'i').test(raw)){
      location = `${loc}, Kathmandu Valley`;
      break;
    }
  }

  // Detect Salary
  const salMatch = raw.match(/(?:npr|rs\.?|salary|pay|fee)?\s*(\d{1,2}[,\.]?\d{3}|\d+k)(?:\s*(?:to|-)\s*(\d{1,2}[,\.]?\d{3}|\d+k))?(?:\s*\/\s*(?:mo|month))?/i);
  if(salMatch){
    salary = `NPR ${salMatch[1]}${salMatch[2] ? ' – ' + salMatch[2] : ''} / month`;
  }

  // Detect timing/schedule
  const timeMatch = raw.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if(timeMatch){
    schedule = timeMatch[1];
  } else if(/morning/i.test(raw)){
    schedule = 'Morning Batch (6:30 AM – 8:00 AM)';
  } else if(/evening/i.test(raw)){
    schedule = 'Evening Batch (5:00 PM – 6:30 PM)';
  }

  // Detect Type
  if(/full\s*time/i.test(raw)) type = 'Full-time';
  else if(/weekend/i.test(raw)) type = 'Weekend only';
  else if(/online/i.test(raw)) type = 'Online';
  else if(/morning/i.test(raw)) type = 'Morning Batch';
  else if(/evening/i.test(raw)) type = 'Evening Batch';

  // Form title
  title = `${subject} Home Tutor (${level || 'Kathmandu Valley'})`;

  // Fill the inputs
  document.getElementById('vac_title').value = title;
  document.getElementById('vac_subject').value = subject;
  document.getElementById('vac_level').value = level || 'School / College';
  document.getElementById('vac_type').value = type;
  document.getElementById('vac_location').value = location;
  if(salary) document.getElementById('vac_salary').value = salary;
  if(schedule) document.getElementById('vac_schedule').value = schedule;
  document.getElementById('vac_desc').value = raw;
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
function quickScaleImageForOCR(fileOrUrl, maxDimension = 1000, quality = 0.82){
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
  const imageUrlInput = document.getElementById('vac_imageUrl');
  const statusBox = document.getElementById('vac_ocrStatus');
  const statusText = document.getElementById('vac_ocrStatusText');
  const textBox = document.getElementById('vac_extractedTextBox');
  const textArea = document.getElementById('vac_extractedText');
  const extractBtn = document.getElementById('vac_extractFromImgBtn');

  let rawSource = null;
  if(vac_pendingFile){
    rawSource = vac_pendingFile;
  } else if(imageUrlInput && imageUrlInput.value.trim()){
    rawSource = imageUrlInput.value.trim();
  }

  if(!rawSource){
    showToast('Please select an image file or enter an image URL first.');
    return;
  }

  if(statusBox){
    statusBox.style.display = 'block';
    statusBox.style.background = 'rgba(255,193,7,0.12)';
    statusBox.style.borderColor = 'rgba(255,193,7,0.35)';
    statusText.textContent = '⚡ Extracting text & details instantly...';
  }
  if(extractBtn){
    extractBtn.disabled = true;
    extractBtn.textContent = '⚡ Extracting...';
  }

  try{
    // Ultra-fast canvas compression before network call
    const imageSource = await quickScaleImageForOCR(rawSource, 1000, 0.82);

    const res = await fetch('/api/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageSource, mimeType: 'image/jpeg' })
    });

    const result = await res.json();

    if(res.ok && result && (result.extractedText || result.parsed)){
      const raw = result.extractedText || (result.parsed ? result.parsed.rawText : '') || '';
      
      if(textArea) textArea.value = raw;
      if(textBox) textBox.style.display = 'block';
      if(statusBox){
        statusBox.style.background = 'rgba(76, 175, 80, 0.15)';
        statusBox.style.borderColor = 'rgba(76, 175, 80, 0.4)';
        statusText.textContent = '✅ Extracted & autofilled!';
      }

      if(result.parsed){
        const p = result.parsed;
        if(p.title) document.getElementById('vac_title').value = p.title;
        if(p.subject) document.getElementById('vac_subject').value = p.subject;
        if(p.level) document.getElementById('vac_level').value = p.level;
        if(p.type) document.getElementById('vac_type').value = p.type;
        if(p.location) document.getElementById('vac_location').value = p.location;
        if(p.salary) document.getElementById('vac_salary').value = p.salary;
        if(p.schedule) document.getElementById('vac_schedule').value = p.schedule;
        const descEl = document.getElementById('vac_desc');
        if(descEl){
          if(p.description) descEl.value = p.description;
          else if(raw) descEl.value = raw;
        }
      } else if(raw){
        parseVacancyTextAndFillFields(raw);
      }

      showToast('✨ Form fields autofilled from image!');
    } else {
      // Fallback to client-side OCR
      await runClientSideOCR(imageSource);
    }
  }catch(err){
    console.warn('Server OCR failed, attempting client OCR fallback:', err);
    await runClientSideOCR(rawSource);
  }finally{
    if(extractBtn){
      extractBtn.disabled = false;
      extractBtn.textContent = '✨ Extract Text from Image';
    }
  }
}

async function runClientSideOCR(imgSrc){
  const statusBox = document.getElementById('vac_ocrStatus');
  const statusText = document.getElementById('vac_ocrStatusText');
  const textBox = document.getElementById('vac_extractedTextBox');
  const textArea = document.getElementById('vac_extractedText');

  if(statusText) statusText.textContent = '🔍 Running client-side image OCR engine...';

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

    const scaled = await quickScaleImageForOCR(imgSrc, 1000, 0.85);
    const { data: { text } } = await window.Tesseract.recognize(scaled, 'eng', {
      logger: m => {
        if(m.status === 'recognizing text' && statusText){
          statusText.textContent = `🔍 Recognizing text: ${Math.round((m.progress||0) * 100)}%`;
        }
      }
    });

    const cleaned = (text || '').trim();
    if(textArea) textArea.value = cleaned;
    if(textBox) textBox.style.display = 'block';
    if(statusBox){
      statusBox.style.background = 'rgba(76, 175, 80, 0.15)';
      statusBox.style.borderColor = 'rgba(76, 175, 80, 0.4)';
      statusText.textContent = '✅ Text extracted from image!';
    }

    parseVacancyTextAndFillFields(cleaned);
    showToast('✨ Text extracted from image!');
  }catch(e){
    if(statusBox){
      statusBox.style.background = 'rgba(244, 67, 54, 0.15)';
      statusBox.style.borderColor = 'rgba(244, 67, 54, 0.4)';
      statusText.textContent = '⚠️ Could not read image text. Please enter details manually.';
    }
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

// Image upload file input listener (Auto-extracts instantly)
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
    document.getElementById('vac_imageUrl').value = '';
    document.getElementById('vac_previewImg').src = URL.createObjectURL(file);
    document.getElementById('vac_previewFileName').textContent = `Selected: ${file.name}`;
    document.getElementById('vac_preview').style.display = 'block';
    
    // Auto-trigger ultra-fast extraction immediately
    extractTextFromVacancyImage();
  });
}

// Image URL input listener
const vacImageUrlInput = document.getElementById('vac_imageUrl');
if(vacImageUrlInput){
  vacImageUrlInput.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    const preview = document.getElementById('vac_preview');
    const previewImg = document.getElementById('vac_previewImg');
    if(val){
      vac_pendingFile = null;
      previewImg.src = val;
      document.getElementById('vac_previewFileName').textContent = 'Image URL linked';
      preview.style.display = 'block';
      extractTextFromVacancyImage();
    } else if(!vac_pendingFile){
      preview.style.display = 'none';
    }
  });
}

// Remove image button listener
const vacRemoveImgBtn = document.getElementById('vac_removeImgBtn');
if(vacRemoveImgBtn){
  vacRemoveImgBtn.addEventListener('click', () => {
    vac_pendingFile = null;
    document.getElementById('vac_file').value = '';
    document.getElementById('vac_imageUrl').value = '';
    document.getElementById('vac_previewImg').src = '';
    document.getElementById('vac_preview').style.display = 'none';
    showToast('Image removed');
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

  let imageUrl = document.getElementById('vac_imageUrl').value.trim();
  if(vac_pendingFile){
    btn.disabled = true; btn.textContent = 'Uploading image…';
    try {
      imageUrl = await uploadToCloudinaryOrStorage(vac_pendingFile, 'gurukul_vacancies', `vac_${Date.now()}`);
    } catch(err) {
      imageUrl = await new Promise(resolve => compressImageFile(vac_pendingFile, resolve));
    }
  }

  const existingVac = id ? data.vacancies.find(v=>v.id===id) : null;
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
    imageUrl: imageUrl || ''
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

