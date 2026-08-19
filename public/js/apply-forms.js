/* ---------- APPLY (public — teachers applying to a vacancy) ---------- */
const applyOverlay = document.getElementById('applyOverlay');
const MAX_CV_FILE_MB = 5;
function openApply(vacId, isDirectLink = false){
  const v = data.vacancies.find(x=>x.id===vacId);
  if(v && isVacancyVerified(v)){
    showToast('This vacancy post is verified & filled. Applications are closed.');
    return;
  }
  document.getElementById('apply_vacId').value = vacId;
  document.getElementById('apply_vacTitle').textContent = v ? v.title : 'Position';

  // Show teacher applicant count banner
  const bannerEl = document.getElementById('apply_applicantBanner');
  if(bannerEl){
    const count = getVacancyApplicantCount(vacId);
    let bannerContent = count === 0 
      ? '👥 <b>Be the first teacher to apply!</b> No other teachers have applied for this post yet.' 
      : (count === 1 
          ? '👥 <b>1 other teacher</b> has applied for this vacancy post.' 
          : '👥 <b>' + count + ' other teachers</b> have applied for this vacancy post.');
    
    if(isDirectLink && v){
      bannerContent = `🎯 <b>Direct Apply for:</b> ${escapeHtml(v.title)} (${escapeHtml(v.location||'Kathmandu')})<br><span style="font-size:12px;opacity:0.85;">${bannerContent}</span>`;
    }
    bannerEl.innerHTML = bannerContent;
  }

  document.getElementById('apply_name').value = '';
  document.getElementById('apply_phone').value = '';
  document.getElementById('apply_cvFile').value = '';
  document.getElementById('apply_cvFileName').textContent = '';
  document.getElementById('apply_paymentFile').value = '';
  document.getElementById('apply_paymentFileName').textContent = '';
  const cvTextEl = document.getElementById('apply_cvText');
  if(cvTextEl) cvTextEl.value = '';
  const cvLinkEl = document.getElementById('apply_cvLink');
  if(cvLinkEl) cvLinkEl.value = '';
  document.getElementById('apply_agree').checked = false;
  document.getElementById('apply_err').classList.remove('show');
  document.getElementById('apply_ok').classList.remove('show');
  const waBox = document.getElementById('apply_wa_box');
  if(waBox){
    waBox.classList.add('hidden');
    waBox.innerHTML = '';
  }
  applyOverlay.classList.add('open');
}
document.getElementById('applyCloseBtn').addEventListener('click', () => applyOverlay.classList.remove('open'));
applyOverlay.addEventListener('click', e => { if(e.target === applyOverlay) applyOverlay.classList.remove('open'); });

// Helper to copy direct link for Facebook / WhatsApp / Social media
window.copyVacancyLink = function(vacId){
  const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
    ? window.location.origin 
    : 'https://gurukultuition.vercel.app';
  const url = `${baseUrl}/?apply=${vacId}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('📋 Direct Apply Link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this Direct Apply Link:', url);
    });
  } else {
    prompt('Copy this Direct Apply Link:', url);
  }
};

// Helper to generate full ready-to-post Facebook caption with direct apply link
window.copyFacebookPostTemplate = function(vacId){
  const v = (data.vacancies || []).find(x => x.id === vacId);
  if(!v){
    showToast('Vacancy not found');
    return;
  }
  const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
    ? window.location.origin 
    : 'https://gurukultuition.vercel.app';
  const directLink = `${baseUrl}/?apply=${vacId}`;
  
  const fbText = 
`🔥 URGENT HOME TUTOR VACANCY — KATHMANDU VALLEY 🔥

📚 Position / Subject: ${v.title || v.subject || 'Home Tutor'}
📍 Location: ${v.location || 'Kathmandu Valley'}
🎯 Class / Level: ${v.level || 'School / College'}
💰 Monthly Salary: ${v.salary || 'Negotiable'}
⏰ Schedule / Time: ${v.schedule || 'Flexible / 1-1.5 hrs per day'}
${v.description ? `📝 Details: ${v.description}\n` : ''}
👉 CLICK HERE TO APPLY DIRECTLY:
${directLink}

✨ 2-Day Free Demo Class Assurance
📞 Gurukul Home Tuitions · WhatsApp / Call: 9801775074
🌐 Website: ${baseUrl}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fbText).then(() => {
      showToast('📱 Ready Facebook post caption & direct link copied!');
    }).catch(() => {
      prompt('Copy Facebook Post Caption:', fbText);
    });
  } else {
    prompt('Copy Facebook Post Caption:', fbText);
  }
};

document.getElementById('apply_cvFile').addEventListener('change', () => {
  const file = document.getElementById('apply_cvFile').files[0];
  const nameEl = document.getElementById('apply_cvFileName');
  const errEl = document.getElementById('apply_err');
  errEl.classList.remove('show');
  if(!file){ nameEl.textContent = ''; return; }
  const isPdf = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  if(!isPdf && !isImage){
    errEl.textContent = 'Only PDF or image files are accepted for the CV upload.';
    errEl.classList.add('show');
    document.getElementById('apply_cvFile').value = '';
    nameEl.textContent = '';
    return;
  }
  if(file.size > MAX_CV_FILE_MB * 1024 * 1024){
    errEl.textContent = `That file is too large — please keep it under ${MAX_CV_FILE_MB}MB.`;
    errEl.classList.add('show');
    document.getElementById('apply_cvFile').value = '';
    nameEl.textContent = '';
    return;
  }
  nameEl.textContent = '📎 ' + file.name + ' (' + (file.size/1024/1024).toFixed(1) + 'MB)';
});

const MAX_PAYMENT_FILE_MB = 5;
document.getElementById('apply_paymentFile').addEventListener('change', () => {
  const file = document.getElementById('apply_paymentFile').files[0];
  const nameEl = document.getElementById('apply_paymentFileName');
  const errEl = document.getElementById('apply_err');
  errEl.classList.remove('show');
  if(!file){ nameEl.textContent = ''; return; }
  if(!file.type.startsWith('image/')){
    errEl.textContent = 'The payment screenshot must be an image file.';
    errEl.classList.add('show');
    document.getElementById('apply_paymentFile').value = '';
    nameEl.textContent = '';
    return;
  }
  if(file.size > MAX_PAYMENT_FILE_MB * 1024 * 1024){
    errEl.textContent = `That screenshot is too large — please keep it under ${MAX_PAYMENT_FILE_MB}MB.`;
    errEl.classList.add('show');
    document.getElementById('apply_paymentFile').value = '';
    nameEl.textContent = '';
    return;
  }
  nameEl.textContent = '🧾 ' + file.name + ' (' + (file.size/1024/1024).toFixed(1) + 'MB)';
});

document.getElementById('apply_submitBtn').addEventListener('click', async () => {
  const vacId = document.getElementById('apply_vacId').value;
  const name = document.getElementById('apply_name').value.trim();
  const phone = document.getElementById('apply_phone').value.trim();
  const cvFile = document.getElementById('apply_cvFile').files[0] || null;
  const cvText = document.getElementById('apply_cvText') ? document.getElementById('apply_cvText').value.trim() : '';
  const cvLink = document.getElementById('apply_cvLink') ? document.getElementById('apply_cvLink').value.trim() : '';
  const paymentFile = document.getElementById('apply_paymentFile').files[0] || null;
  const agreed = document.getElementById('apply_agree').checked;
  const errEl = document.getElementById('apply_err');
  errEl.classList.remove('show');
  if(!name || !phone){ errEl.textContent = 'Enter your name and phone number.'; errEl.classList.add('show'); return; }
  if(!cvFile && !cvText && !cvLink){ errEl.textContent = 'Please select and upload your CV (PDF or image).'; errEl.classList.add('show'); return; }
  if(!agreed){ errEl.textContent = "Please read and agree to the Teacher's Policy — Terms & Conditions above to continue."; errEl.classList.add('show'); return; }

  const btn = document.getElementById('apply_submitBtn');
  const originalLabel = btn.textContent;
  btn.disabled = true;

  let cvFileUrl = '', cvFileName = '';
  let paymentFileUrl = '', paymentFileName = '';
  let cvUploadFailed = false, paymentUploadFailed = false;
  const UPLOAD_TIMEOUT_MS = 15000;
  function readFileAsDataUrl(file){
    return new Promise((resolve, reject) => {
      if(file.type && file.type.startsWith('image/')){
        compressImageFile(file, (dataUrl) => resolve(dataUrl));
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    });
  }

  async function uploadWithTimeout(file, pathPrefix, ms){
    // Try Cloudinary / server-side upload first
    try {
      const serverUploadPromise = uploadToCloudinaryOrStorage(file, pathPrefix, file.name);
      const res = await Promise.race([
        serverUploadPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
      ]);
      if (res && typeof res === 'string' && (res.startsWith('http') || res.startsWith('data:'))) {
        return { url: res };
      }
    } catch(err) {
      console.warn('Cloudinary upload attempt note:', err);
    }

    const filename = pathPrefix + '/' + uid(pathPrefix) + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g,'_');
    return Promise.race([
      window.__vercelBlobUpload ? window.__vercelBlobUpload(filename, file, { access: 'public', handleUploadUrl: '/api/upload' }) : Promise.reject(new Error('Vercel Blob not initialized')),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), {code:'storage/timeout'})), ms))
    ]);
  }

  if(cvFile){
    try{
      btn.textContent = 'Uploading CV…';
      const blob = await uploadWithTimeout(cvFile, 'gurukul/resumes', UPLOAD_TIMEOUT_MS);
      cvFileUrl = blob.url;
      cvFileName = cvFile.name;
    }catch(e){
      console.warn('Upload for CV timed out or failed, saving fallback Data URL.', e);
      try {
        cvFileUrl = await readFileAsDataUrl(cvFile);
        cvFileName = cvFile.name;
      } catch(err) {
        console.error('CV reading failed', err);
        cvUploadFailed = true;
      }
    }
  }
  if(paymentFile){
    try{
      btn.textContent = 'Uploading payment screenshot…';
      const blob = await uploadWithTimeout(paymentFile, 'gurukul/payments', UPLOAD_TIMEOUT_MS);
      paymentFileUrl = blob.url;
      paymentFileName = paymentFile.name;
    }catch(e){
      console.warn('Upload for payment screenshot timed out or failed, saving fallback Data URL.', e);
      try {
        paymentFileUrl = await readFileAsDataUrl(paymentFile);
        paymentFileName = paymentFile.name;
      } catch(err) {
        console.error('Payment screenshot reading failed', err);
        paymentUploadFailed = true;
      }
    }
  }
  if((cvUploadFailed && !cvText && !cvLink) || paymentUploadFailed){
    const parts = [];
    if(cvUploadFailed) parts.push('CV file');
    if(paymentUploadFailed) parts.push('payment screenshot');
    errEl.textContent = "Heads up: the " + parts.join(' and ') + " could not be attached (file uploads aren't working on this site right now — likely a Blob storage setup issue on the admin's end). Your application is still being submitted" + (cvUploadFailed && !cvText && !cvLink ? ' — please also WhatsApp or call to send your CV directly.' : '.');
    errEl.classList.add('show');
  }

  btn.textContent = 'Sending…';
  const v = data.vacancies.find(x=>x.id===vacId);
  if(!data.applications) data.applications = [];
  const newApp = {
    id: uid('a'),
    vacancyId: vacId,
    vacancyTitle: v ? v.title : '',
    name, phone, cvText, cvLink, cvFileUrl, cvFileName,
    paymentFileUrl, paymentFileName,
    agreedTerms: true,
    signature: name,
    agreedAt: Date.now(),
    submittedAt: Date.now()
  };
  data.applications.push(newApp);
  saveData();
  renderVacancies();
  if(isAdmin) renderAdminApplications();
  btn.disabled = false; btn.textContent = originalLabel;
  document.getElementById('apply_ok').classList.add('show');
  showToast('Application sent!');

  // Build WhatsApp Application & CV statement
  const waStatement = buildWhatsAppCvStatement(newApp);
  const adminWaNum = getAdminWhatsAppNumber();
  const teacherCleanPhone = phone.replace(/[^0-9]/g, '');

  const waAdminUrl = `https://api.whatsapp.com/send?phone=${adminWaNum}&text=${encodeURIComponent(waStatement)}`;
  const waTeacherUrl = teacherCleanPhone.length >= 8 ? `https://api.whatsapp.com/send?phone=${teacherCleanPhone}&text=${encodeURIComponent(waStatement)}` : null;

  const waBox = document.getElementById('apply_wa_box');
  if(waBox){
    waBox.classList.remove('hidden');
    waBox.innerHTML = `
      <div style="font-size:14px;font-weight:700;color:var(--accent2);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38A9.94 9.94 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm5.85 14.2c-.25.7-1.45 1.34-2 1.42-.51.08-1.15.11-1.86-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.93-4.28-5.08-4.48-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.05-2.49.27-.3.6-.37.8-.37h.57c.18 0 .43-.03.66.5.25.6.85 2.07.92 2.22.07.15.12.33.02.53-.1.2-.15.32-.3.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.13 1.01 2.09 1.32 2.38 1.47.3.15.47.13.65-.07.18-.2.76-.87.96-1.17.2-.3.4-.25.67-.15.27.1 1.7.8 2 .95.3.15.5.22.57.35.08.13.08.72-.17 1.42Z"/></svg>
        WhatsApp CV Statement &amp; Application Details
      </div>
      <p style="font-size:12.5px;color:var(--text-dim);margin-bottom:10px;line-height:1.5;">
        Send your application and CV details directly to Gurukul Home Tuitions on WhatsApp for fast review and demo class assignment:
      </p>
      <div style="background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:10px;font-family:monospace;font-size:12px;color:var(--text);white-space:pre-wrap;max-height:130px;overflow-y:auto;margin-bottom:12px;" id="apply_wa_text_preview">${escapeHtml(waStatement)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="${escapeAttr(waAdminUrl)}" target="_blank" rel="noopener" class="pill-btn" style="background:#25D366;color:#fff;text-decoration:none;font-size:13px;padding:8px 16px;display:inline-flex;align-items:center;gap:6px;">
          📲 Send to Gurukul Tuition WhatsApp
        </a>
        ${waTeacherUrl ? `
        <a href="${escapeAttr(waTeacherUrl)}" target="_blank" rel="noopener" class="pill-btn" style="background:var(--bg);border:1px solid var(--accent2);color:var(--accent2);text-decoration:none;font-size:13px;padding:8px 16px;display:inline-flex;align-items:center;gap:6px;">
          📱 Send to My Phone (${escapeHtml(phone)})
        </a>` : ''}
        <button type="button" class="mini-btn" id="apply_copy_wa_btn" style="padding:8px 14px;font-size:13px;">
          📋 Copy Details
        </button>
      </div>
    `;

    document.getElementById('apply_copy_wa_btn').addEventListener('click', () => {
      navigator.clipboard.writeText(waStatement).then(() => {
        showToast('Application & CV details copied to clipboard!');
      }).catch(() => {
        showToast('Failed to copy text');
      });
    });
  }

  // Auto open Admin WhatsApp in new tab so pre-filled message launches immediately
  try {
    window.open(waAdminUrl, '_blank');
  } catch(e) {
    console.warn('WhatsApp auto-open popup blocked by browser, link provided in UI.', e);
  }
});

/* ---------- REGISTER CHILD (public — parents adding their child's details) ---------- */
const childOverlay = document.getElementById('childOverlay');
function openChildForm(){
  document.getElementById('child_parentName').value = '';
  document.getElementById('child_parentPhone').value = '';
  document.getElementById('child_parentEmail').value = '';
  document.getElementById('child_name').value = '';
  document.getElementById('child_age').value = '';
  document.getElementById('child_grade').value = '';
  document.getElementById('child_school').value = '';
  document.getElementById('child_notes').value = '';
  document.getElementById('child_err').classList.remove('show');
  document.getElementById('child_ok').classList.remove('show');
  childOverlay.classList.add('open');
}
document.getElementById('childOpenBtn').addEventListener('click', openChildForm);
document.getElementById('childCloseBtn').addEventListener('click', () => childOverlay.classList.remove('open'));
childOverlay.addEventListener('click', e => { if(e.target === childOverlay) childOverlay.classList.remove('open'); });

document.getElementById('child_submitBtn').addEventListener('click', async () => {
  const parentName = document.getElementById('child_parentName').value.trim();
  const parentPhone = document.getElementById('child_parentPhone').value.trim();
  const parentEmail = document.getElementById('child_parentEmail').value.trim();
  const childName = document.getElementById('child_name').value.trim();
  const age = document.getElementById('child_age').value.trim();
  const grade = document.getElementById('child_grade').value.trim();
  const school = document.getElementById('child_school').value.trim();
  const notes = document.getElementById('child_notes').value.trim();
  const errEl = document.getElementById('child_err');
  errEl.classList.remove('show');

  if(!parentName || !parentPhone){
    errEl.textContent = 'Please enter the parent/guardian name and phone number.';
    errEl.classList.add('show');
    return;
  }
  if(!childName){
    errEl.textContent = "Please enter the student / child's name.";
    errEl.classList.add('show');
    return;
  }

  const btn = document.getElementById('child_submitBtn');
  const originalLabel = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Saving & opening WhatsApp…';

  const newChildRecord = {
    id: uid('c'),
    parentName,
    parentPhone,
    parentEmail,
    childName,
    age,
    grade,
    school,
    notes,
    submittedAt: Date.now()
  };

  if(!data.children) data.children = [];
  data.children.push(newChildRecord);

  // Save to database
  try {
    if (typeof window.saveData === 'function') {
      await window.saveData();
    } else {
      await saveData();
    }
  } catch (e) {
    console.warn('Child record save notice:', e);
  }

  // Format WhatsApp recipient and message text
  let rawPhone = (data.profile && data.profile.phone ? data.profile.phone : '9801775074').replace(/[^0-9]/g, '');
  if (rawPhone.length === 10 && rawPhone.startsWith('98')) {
    rawPhone = '977' + rawPhone;
  } else if (!rawPhone.startsWith('977') && rawPhone.length === 10) {
    rawPhone = '977' + rawPhone;
  }
  if (!rawPhone) rawPhone = '9779801775074';

  const waText = 
`🎓 *New Home Tuition Request — Gurukul Home Tuitions*

👨‍👩‍👧 *Parent / Guardian Details:*
• Name: ${parentName}
• Phone: ${parentPhone}${parentEmail ? `\n• Email: ${parentEmail}` : ''}

📚 *Student / Child Information:*
• Student Name: ${childName}
• Grade / Level: ${grade || 'Not specified'}
• Age: ${age || 'Not specified'}
• School / College: ${school || 'Not specified'}

📝 *Requirements / Location / Subjects:*
${notes || 'Interested in 2 Days Free Demo Classes'}

✨ *Request:* 2 Days Free Demo Class Placement
📍 *Source:* Gurukul Home Tuitions (gurukultuition.vercel.app)`;

  const waUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(waText)}`;

  btn.disabled = false;
  btn.innerHTML = originalLabel;
  document.getElementById('child_ok').classList.add('show');
  showToast('✓ Child details saved! Opening WhatsApp…');

  // Open WhatsApp in new tab / app
  try {
    const newWindow = window.open(waUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // If popup blocker blocked _blank, fallback to location href
      window.location.href = waUrl;
    }
  } catch (err) {
    window.location.href = waUrl;
  }

  setTimeout(() => {
    childOverlay.classList.remove('open');
  }, 1200);
});

