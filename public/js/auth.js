/* ===================== LOGIN MODAL ===================== */
const loginOverlay = document.getElementById('loginOverlay');
const adminOverlay = document.getElementById('adminOverlay');
const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_ADMIN_PASS = 'tutor1234';

function updateDefaultCredsHint(){
  const hint = document.getElementById('defaultCredsHint');
  const stillDefault = data.profile.adminUsername === DEFAULT_ADMIN_USER && data.profile.adminPassword === DEFAULT_ADMIN_PASS;
  hint.style.display = stillDefault ? 'block' : 'none';
}

document.getElementById('adminOpenBtn').addEventListener('click', async () => {
  const btn = document.getElementById('adminOpenBtn');
  if(!data){
    const original = btn.textContent;
    btn.textContent = 'Loading…';
    btn.disabled = true;
    await dataReady;
    btn.textContent = original;
    btn.disabled = false;
  }
  if(isAdmin){ openAdminPanel(); } else {
    updateDefaultCredsHint();
    loginOverlay.classList.add('open'); document.getElementById('loginUser').focus();
  }
});
document.getElementById('navLogoutBtn').addEventListener('click', () => {
  isAdmin = false;
  adminOverlay.classList.remove('open');
  updateAdminNavUI();
  showToast('Logged out');
});
function updateAdminNavUI(){
  document.getElementById('adminOpenBtn').textContent = isAdmin ? 'Admin panel' : 'Admin';
  document.getElementById('navLogoutBtn').classList.toggle('hidden', !isAdmin);
}
document.getElementById('loginCloseBtn').addEventListener('click', () => loginOverlay.classList.remove('open'));
loginOverlay.addEventListener('click', e => { if(e.target === loginOverlay) loginOverlay.classList.remove('open'); });

/* ---------- date of birth (year/month/day selects) ---------- */
const DOB_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function buildDobSelects(prefix){
  const y = document.getElementById(prefix+'_year');
  const m = document.getElementById(prefix+'_month');
  const d = document.getElementById(prefix+'_day');
  if(!y || !m || !d) return;
  const curYear = new Date().getFullYear();
  let opts = '<option value="">Year</option>';
  for(let yr = curYear; yr >= curYear - 100; yr--){ opts += `<option value="${yr}">${yr}</option>`; }
  y.innerHTML = opts;
  m.innerHTML = '<option value="">Month</option>' + DOB_MONTHS.map((name,i) => `<option value="${String(i+1).padStart(2,'0')}">${name}</option>`).join('');
  d.innerHTML = '<option value="">Day</option>' + Array.from({length:31}, (_,i) => `<option value="${String(i+1).padStart(2,'0')}">${i+1}</option>`).join('');
}
function getDobValue(prefix){
  const y = document.getElementById(prefix+'_year').value;
  const m = document.getElementById(prefix+'_month').value;
  const d = document.getElementById(prefix+'_day').value;
  if(!y || !m || !d) return '';
  return `${y}-${m}-${d}`;
}
function setDobValue(prefix, iso){
  const parts = (iso || '').split('-');
  document.getElementById(prefix+'_year').value = parts[0] || '';
  document.getElementById(prefix+'_month').value = parts[1] || '';
  document.getElementById(prefix+'_day').value = parts[2] || '';
}

/* ---------- forgot password ---------- */
const forgotOverlay = document.getElementById('forgotOverlay');
function resetForgotFlow(){
  document.getElementById('forgot_step_phone').classList.remove('hidden');
  document.getElementById('forgot_step_reset').classList.add('hidden');
  document.getElementById('forgot_ok').classList.remove('show');
  document.getElementById('forgot_phone_err').classList.remove('show');
  document.getElementById('forgot_reset_err').classList.remove('show');
  document.getElementById('forgot_phone').value = '';
  setDobValue('forgot_dob', '');
  document.getElementById('forgot_newUser').value = '';
  document.getElementById('forgot_newPass').value = '';
  document.getElementById('forgot_newPass2').value = '';
}
document.getElementById('forgotPassLink').addEventListener('click', (e) => {
  e.preventDefault();
  loginOverlay.classList.remove('open');
  resetForgotFlow();
  forgotOverlay.classList.add('open');
});
document.getElementById('forgotCloseBtn').addEventListener('click', () => forgotOverlay.classList.remove('open'));
forgotOverlay.addEventListener('click', e => { if(e.target === forgotOverlay) forgotOverlay.classList.remove('open'); });

document.getElementById('forgot_verifyBtn').addEventListener('click', () => {
  const phone = document.getElementById('forgot_phone').value.trim();
  const dob = getDobValue('forgot_dob');
  const errEl = document.getElementById('forgot_phone_err');
  errEl.classList.remove('show');
  if(!data.profile.recoveryPhone || !data.profile.recoveryDob){
    errEl.textContent = 'No recovery phone/date of birth has been set up for this admin account yet — ask whoever set up the site to add these from Admin → Password.';
    errEl.classList.add('show');
    return;
  }
  if(!phone || phone !== data.profile.recoveryPhone || !dob || dob !== data.profile.recoveryDob){
    errEl.textContent = 'That phone number and date of birth do not match the ones on file.';
    errEl.classList.add('show');
    return;
  }
  document.getElementById('forgot_step_phone').classList.add('hidden');
  document.getElementById('forgot_step_reset').classList.remove('hidden');
});
document.getElementById('forgot_resetBtn').addEventListener('click', () => {
  const u = document.getElementById('forgot_newUser').value.trim();
  const pass = document.getElementById('forgot_newPass').value;
  const pass2 = document.getElementById('forgot_newPass2').value;
  const errEl = document.getElementById('forgot_reset_err');
  errEl.classList.remove('show');
  if(!u || !pass){ errEl.textContent = 'Enter a username and a new password.'; errEl.classList.add('show'); return; }
  if(pass.length < 4){ errEl.textContent = 'Password must be at least 4 characters.'; errEl.classList.add('show'); return; }
  if(pass !== pass2){ errEl.textContent = 'Passwords do not match.'; errEl.classList.add('show'); return; }
  data.profile.adminUsername = u;
  data.profile.adminPassword = pass;
  saveData();
  updateDefaultCredsHint();
  document.getElementById('forgot_step_reset').classList.add('hidden');
  document.getElementById('forgot_ok').classList.add('show');
  showToast('Admin login updated');
  setTimeout(() => {
    forgotOverlay.classList.remove('open');
    loginOverlay.classList.add('open');
  }, 1300);
});

document.getElementById('loginSubmitBtn').addEventListener('click', () => {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginErr');
  if(u === data.profile.adminUsername && p === data.profile.adminPassword){
    isAdmin = true;
    errEl.classList.remove('show');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    loginOverlay.classList.remove('open');
    updateAdminNavUI();
    openAdminPanel();
  } else {
    errEl.classList.add('show');
  }
});

document.getElementById('adminCloseBtn').addEventListener('click', () => adminOverlay.classList.remove('open'));
adminOverlay.addEventListener('click', e => { if(e.target === adminOverlay) adminOverlay.classList.remove('open'); });

function doLogout(){
  isAdmin = false;
  adminOverlay.classList.remove('open');
  updateAdminNavUI();
  showToast('Logged out');
}
document.getElementById('logoutBtn').addEventListener('click', doLogout);
document.getElementById('logoutBtnTop').addEventListener('click', doLogout);

