/* ===================== THEME ===================== */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  try{ localStorage.setItem('tutor_theme', theme); }catch(e){}
  document.getElementById('themeSwitchInput').checked = (theme === 'light');
  document.getElementById('themeColorMeta').setAttribute('content', theme==='dark' ? '#000000' : '#eef4fc');
}
document.getElementById('themeSwitchInput').addEventListener('change', e => applyTheme(e.target.checked ? 'light' : 'dark'));

