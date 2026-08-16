/* ---------- GALLERY (admin) ---------- */
const galEditOverlay = document.getElementById('galEditOverlay');
let gal_pendingFile = null;
function renderAdminGallery(){
  const el = document.getElementById('gal_list');
  el.innerHTML = data.gallery.map(p => `
    <div class="admin-list-item">
      <div class="info"><b>${escapeHtml(p.caption || 'Untitled photo')}</b><span>${escapeHtml((p.url||'').slice(0,40))}...</span></div>
      <div class="row-actions">
        <button class="mini-btn" onclick="editGallery('${p.id}')">Edit</button>
        <button class="mini-btn danger" onclick="deleteGallery('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('') || '<p class="empty-note">No photos yet.</p>';
  renderLogoAdmin();
}

/* ---------- SITE LOGO (admin, lives in Gallery pane) ---------- */
function renderLogoAdmin(){
  const p = data.profile;
  const preview = document.getElementById('logoPreview');
  const initials = (p.companyName||'HT').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  if(p.logoUrl){
    preview.innerHTML = `<img src="${escapeAttr(p.logoUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
  } else {
    preview.textContent = initials;
  }
  const grid = document.getElementById('logo_pickGrid');
  if(data.gallery.length === 0){
    grid.innerHTML = '<p class="empty-note" style="grid-column:1/-1;">Add photos below to be able to pick one as your logo.</p>';
    return;
  }
  grid.innerHTML = data.gallery.map(ph => `
    <div class="gallery-item logo-pick-item ${p.logoUrl === ph.url ? 'selected' : ''}" onclick="chooseLogoFromGallery('${ph.id}')">
      <img src="${escapeAttr(ph.url)}" alt="${escapeAttr(ph.caption||'')}" loading="lazy">
      <span class="check">✓</span>
    </div>
  `).join('');
}
window.chooseLogoFromGallery = (id) => {
  const ph = data.gallery.find(x=>x.id===id);
  if(!ph) return;
  data.profile.logoUrl = ph.url;
  saveData();
  renderLogoAdmin();
  renderLogoMark();
  const ok = document.getElementById('logo_ok');
  ok.classList.add('show');
  setTimeout(()=>ok.classList.remove('show'), 1500);
  showToast('Logo updated');
};
document.getElementById('logo_file').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('Please choose an image file'); e.target.value = ''; return; }
  showToast('Uploading logo to Cloudinary/storage…');
  try {
    const uploadedUrl = await uploadToCloudinaryOrStorage(file, 'gurukul_logo', 'site_logo');
    data.profile.logoUrl = uploadedUrl;
    await saveData();
    renderLogoAdmin();
    renderLogoMark();
    const ok = document.getElementById('logo_ok');
    if (ok) ok.classList.add('show');
    setTimeout(()=> ok && ok.classList.remove('show'), 1500);
    showToast('Logo updated');
  } catch (err) {
    showToast('Error uploading logo');
  }
  e.target.value = '';
});
document.getElementById('logo_removeBtn').addEventListener('click', () => {
  const oldLogo = data.profile.logoUrl;
  data.profile.logoUrl = '';
  saveData();
  renderLogoAdmin();
  renderLogoMark();
  showToast('Logo reset to initials');
  if (oldLogo && (oldLogo.includes('cloudinary.com') || oldLogo.includes('blob.vercel-storage.com'))) {
    deleteBlob(oldLogo);
  }
});

document.getElementById('gal_bulkUpload').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
  if(files.length === 0) return;
  const progressEl = document.getElementById('gal_bulkProgress');
  progressEl.style.display = 'block';
  progressEl.textContent = `Uploading ${files.length} photo${files.length===1?'':'s'}…`;
  let done = 0;
  const results = await Promise.all(files.map(async (file, idx) => {
    const uploadedUrl = await uploadToCloudinaryOrStorage(file, 'gurukul/gallery', `gal_${Date.now()}_${idx}`);
    done++;
    progressEl.textContent = `Uploaded ${done} of ${files.length}…`;
    return uploadedUrl;
  }));
  results.forEach(uploadedUrl => data.gallery.push({ id: uid('p'), url: uploadedUrl, caption: '' }));
  await saveData();
  renderAdminGallery();
  renderAll();
  progressEl.style.display = 'none';
  e.target.value = '';
  showToast(`${results.length} photo${results.length===1?'':'s'} saved`);
});


document.getElementById('gal_addBtn').addEventListener('click', () => openGalleryEdit(null));
document.getElementById('galEditCloseBtn').addEventListener('click', () => galEditOverlay.classList.remove('open'));
galEditOverlay.addEventListener('click', e => { if(e.target === galEditOverlay) galEditOverlay.classList.remove('open'); });

function openGalleryEdit(id){
  const p = id ? data.gallery.find(x=>x.id===id) : null;
  gal_pendingFile = null;
  document.getElementById('gal_id').value = p ? p.id : '';
  document.getElementById('gal_url').value = p ? p.url : '';
  document.getElementById('gal_caption').value = p ? p.caption : '';
  document.getElementById('gal_file').value = '';
  const preview = document.getElementById('gal_preview');
  const previewImg = document.getElementById('gal_previewImg');
  if(p && p.url){ previewImg.src = p.url; preview.style.display = 'block'; }
  else { previewImg.src = ''; preview.style.display = 'none'; }
  document.getElementById('gal_err').classList.remove('show');
  galEditOverlay.classList.add('open');
}
document.getElementById('gal_file').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('Please choose an image file'); e.target.value = ''; return; }
  gal_pendingFile = file;
  document.getElementById('gal_url').value = ''; // uploaded file takes priority over a pasted link
  document.getElementById('gal_previewImg').src = URL.createObjectURL(file);
  document.getElementById('gal_preview').style.display = 'block';
});
document.getElementById('gal_url').addEventListener('input', (e) => {
  gal_pendingFile = null; // typing a link overrides a previously chosen file
  const val = e.target.value.trim();
  const preview = document.getElementById('gal_preview');
  const previewImg = document.getElementById('gal_previewImg');
  if(val){ previewImg.src = val; preview.style.display = 'block'; }
  else { preview.style.display = 'none'; }
});
window.editGallery = (id) => openGalleryEdit(id);
window.deleteGallery = (id) => {
  if(!confirm('Delete this photo?')) return;
  const removed = data.gallery.find(p=>p.id===id);
  data.gallery = data.gallery.filter(p=>p.id!==id);
  if(removed && data.profile.logoUrl === removed.url){ data.profile.logoUrl = ''; }
  saveData(); renderAdminGallery(); renderAll();
  showToast('Photo deleted');
  if(removed && removed.url && (removed.url.includes('cloudinary.com') || removed.url.includes('blob.vercel-storage.com'))){
    deleteBlob(removed.url);
  }
};
document.getElementById('gal_saveBtn').addEventListener('click', async () => {
  const linkUrl = document.getElementById('gal_url').value.trim();
  const errEl = document.getElementById('gal_err');
  errEl.classList.remove('show');
  if(!gal_pendingFile && !linkUrl){
    errEl.textContent = 'Please add a photo file or an image link.';
    errEl.classList.add('show');
    return;
  }
  const btn = document.getElementById('gal_saveBtn');
  const originalLabel = btn.textContent;
  const id = document.getElementById('gal_id').value;
  let url = linkUrl;
  if(gal_pendingFile){
    btn.disabled = true; btn.textContent = 'Uploading photo…';
    try {
      url = await uploadToCloudinaryOrStorage(gal_pendingFile, 'gurukul_gallery', `gal_${Date.now()}`);
    } catch (err) {
      url = await new Promise(resolve => compressImageFile(gal_pendingFile, resolve));
    }
  }
  const obj = { id: id || uid('p'), url, caption: document.getElementById('gal_caption').value.trim() };
  if(id){
    const idx = data.gallery.findIndex(p=>p.id===id);
    data.gallery[idx] = obj;
  } else {
    data.gallery.push(obj);
  }
  btn.textContent = 'Saving…';
  await saveData();
  btn.disabled = false; btn.textContent = originalLabel;
  gal_pendingFile = null;
  renderAdminGallery(); renderAll();
  galEditOverlay.classList.remove('open');
  showToast('Photo saved');
});


/* ---------- EXTRA INFO (admin) ---------- */
const infoEditOverlay = document.getElementById('infoEditOverlay');
function renderAdminInfo(){
  const el = document.getElementById('info_list');
  el.innerHTML = data.extraInfo.map(i => `
    <div class="admin-list-item">
      <div class="info"><b>${escapeHtml(i.title)}</b><span>${escapeHtml((i.content||'').slice(0,50))}</span></div>
      <div class="row-actions">
        <button class="mini-btn" onclick="editInfo('${i.id}')">Edit</button>
        <button class="mini-btn danger" onclick="deleteInfo('${i.id}')">Delete</button>
      </div>
    </div>
  `).join('') || '<p class="empty-note">No info blocks yet.</p>';
}
document.getElementById('info_addBtn').addEventListener('click', () => openInfoEdit(null));
document.getElementById('infoEditCloseBtn').addEventListener('click', () => infoEditOverlay.classList.remove('open'));
infoEditOverlay.addEventListener('click', e => { if(e.target === infoEditOverlay) infoEditOverlay.classList.remove('open'); });

function openInfoEdit(id){
  const i = id ? data.extraInfo.find(x=>x.id===id) : null;
  document.getElementById('info_id').value = i ? i.id : '';
  document.getElementById('info_title').value = i ? i.title : '';
  document.getElementById('info_content').value = i ? i.content : '';
  document.getElementById('info_err').classList.remove('show');
  infoEditOverlay.classList.add('open');
}
window.editInfo = (id) => openInfoEdit(id);
window.deleteInfo = (id) => {
  if(!confirm('Delete this info block?')) return;
  data.extraInfo = data.extraInfo.filter(i=>i.id!==id);
  saveData(); renderAdminInfo(); renderAll();
  showToast('Info block deleted');
};
document.getElementById('info_saveBtn').addEventListener('click', () => {
  const title = document.getElementById('info_title').value.trim();
  if(!title){ document.getElementById('info_err').classList.add('show'); return; }
  const id = document.getElementById('info_id').value;
  const obj = { id: id || uid('i'), title, content: document.getElementById('info_content').value.trim() };
  if(id){
    const idx = data.extraInfo.findIndex(i=>i.id===id);
    data.extraInfo[idx] = obj;
  } else {
    data.extraInfo.push(obj);
  }
  saveData(); renderAdminInfo(); renderAll();
  infoEditOverlay.classList.remove('open');
  showToast('Info block saved');
});

