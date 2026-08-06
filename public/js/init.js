/* ===================== INIT ===================== */
applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
buildDobSelects('forgot_dob');
buildDobSelects('pw_recoveryDob');
buildDobSelects('pw_verifyDob');
(async function init(){
  await loadData();
  renderAll();
  dataReadyResolve();
  initReveal();
})();
