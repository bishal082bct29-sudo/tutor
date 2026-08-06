/* ===================== INIT ===================== */
applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
buildDobSelects('forgot_dob');
buildDobSelects('pw_recoveryDob');
buildDobSelects('pw_verifyDob');

// Immediately render using synchronous cached data so profile logo appears at 0ms
renderAll();

(async function init(){
  await loadData();
  renderAll();
  dataReadyResolve();
  initReveal();
})();
