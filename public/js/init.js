/* ===================== INIT ===================== */
applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
buildDobSelects('forgot_dob');
buildDobSelects('pw_recoveryDob');
buildDobSelects('pw_verifyDob');

// Immediately render using synchronous cached data so profile logo appears at 0ms
renderAll();

function handleUrlDeepLinks(){
  try {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';

    // 1. Explicit Direct Vacancy Apply (e.g. ?apply=v_123 or ?vacancy=v_123 or #apply-v_123)
    const applyId = params.get('apply') || params.get('vacancy') || 
                    (hash.startsWith('#apply-') ? hash.replace('#apply-', '') : null);

    if (applyId && window.data && Array.isArray(window.data.vacancies) && applyId.trim().length >= 3) {
      const cleanId = applyId.trim();
      const v = window.data.vacancies.find(x => x.id === cleanId);

      if (v) {
        setTimeout(() => {
          // Scroll to vacancy card
          const cardEl = document.getElementById(`vac-card-${v.id}`) || document.getElementById('vacancies');
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardEl.classList.add('pulse-highlight-card');
          }

          // Automatically open the apply modal for this vacancy
          if (typeof openApply === 'function') {
            openApply(v.id, true);
            showToast(`🎯 Applying for: ${v.title}. Enter your details below!`);
            setTimeout(() => {
              const nameInput = document.getElementById('apply_name');
              if (nameInput) nameInput.focus();
            }, 350);
          }

          // Clean up address bar query param so normal browser reloads later don't re-open
          try {
            if (window.history && window.history.replaceState) {
              const cleanUrl = window.location.pathname + (window.location.hash.startsWith('#apply-') ? '' : window.location.hash);
              window.history.replaceState({}, document.title, cleanUrl);
            }
          } catch(e) {}
        }, 500);
        return;
      }
    }

    // 2. Direct Parent / Student Registration (from Facebook parent tuition ads)
    const isParentRef = params.get('register') === 'parent' || params.get('register') === 'child' || 
                        params.get('parent') === '1' || params.get('child') === '1' ||
                        hash === '#parents-form' || hash === '#register-child';

    if (isParentRef) {
      setTimeout(() => {
        const parentsSec = document.getElementById('parents');
        if (parentsSec) {
          parentsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (typeof openChildForm === 'function') {
          openChildForm();
          showToast('👋 Welcome! Please enter your child & tuition requirements below.');
          setTimeout(() => {
            const parentInput = document.getElementById('child_parentName');
            if (parentInput) parentInput.focus();
          }, 350);
        }

        try {
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch(e) {}
      }, 500);
      return;
    }

    // 3. Direct Tuition Group / Batch
    const groupId = params.get('group') || params.get('batch');
    if (groupId) {
      setTimeout(() => {
        const grpSec = document.getElementById('groups');
        if (grpSec) grpSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
      return;
    }

    // 4. Direct Admin Login
    const isAdminRef = params.get('admin') === '1' || params.get('login') === 'admin' || hash === '#admin';
    if (isAdminRef && typeof openAdmin === 'function') {
      setTimeout(() => {
        openAdmin();
      }, 500);
    }
  } catch (err) {
    console.warn('Deep link handler notice:', err);
  }
}

(async function init(){
  await loadData();
  renderAll();
  dataReadyResolve();
  initReveal();
  if (typeof initVideoAd === 'function') {
    initVideoAd();
  }
  handleUrlDeepLinks();
})();
