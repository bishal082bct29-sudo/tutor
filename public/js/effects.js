/* ===================== ENHANCEMENT LAYER JS ===================== */

/* loading screen — logo opening scene */
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loadScreen').classList.add('hide'), 1200);
});

/* mobile hamburger menu (FB-style dropdown) */
const menuToggleBtn = document.getElementById('menuToggleBtn');
const mobileMenu = document.getElementById('mobileMenu');
if(menuToggleBtn && mobileMenu){
  menuToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.addEventListener('click', (e) => {
    if(e.target.tagName === 'A') mobileMenu.classList.remove('open');
  });
  document.addEventListener('click', (e) => {
    if(mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && e.target !== menuToggleBtn){
      mobileMenu.classList.remove('open');
    }
  });
}

/* scroll progress + back to top */
const scrollProgressEl = document.getElementById('scrollProgress');
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const scrolled = h.scrollTop;
  const max = h.scrollHeight - h.clientHeight;
  scrollProgressEl.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
  backToTopBtn.classList.toggle('show', scrolled > 400);
}, { passive: true });
backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* reveal-on-scroll (re-run whenever new content is rendered) */
let revealObserver;
function initReveal(){
  if(revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in-view'); revealObserver.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => revealObserver.observe(el));
}
document.addEventListener('DOMContentLoaded', initReveal);
initReveal();

/* animated counters for hero stats */
let countersPlayed = false;
function animateCounter(el, target){
  target = Number(target) || 0;
  if(target <= 0){ el.textContent = target; return; }
  const dur = 1100, start = performance.now();
  function tick(now){
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function playHeroCounters(){
  if(countersPlayed) return;
  countersPlayed = true;
  ['statGroups','statStudents','statVac'].forEach(id => {
    const el = document.getElementById(id);
    animateCounter(el, el.textContent);
  });
}
const heroStatsEl = document.querySelector('.hero-stats');
if(heroStatsEl){
  new IntersectionObserver((entries, obs) => {
    if(entries[0].isIntersecting){ playHeroCounters(); obs.disconnect(); }
  }, { threshold: 0.4 }).observe(heroStatsEl);
}

/* subtle hero parallax */
window.addEventListener('scroll', () => {
  const hv = document.getElementById('heroVisual');
  if(!hv) return;
  const y = Math.min(window.scrollY, 400);
  hv.style.transform = `translateY(${y * 0.08}px)`;
}, { passive: true });

/* ripple effect on pill buttons */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.pill-btn');
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
});

/* FAQ accordion */
document.querySelectorAll('.faq-item .faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
  });
});

/* testimonials carousel */
(function(){
  const slides = document.querySelectorAll('.testi-slide');
  const nav = document.getElementById('testiNav');
  if(!slides.length || !nav) return;
  let idx = 0, timer;
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Show testimonial ' + (i+1));
    dot.addEventListener('click', () => go(i));
    nav.appendChild(dot);
  });
  function go(i){
    slides[idx].classList.remove('active');
    nav.children[idx].classList.remove('active');
    idx = i;
    slides[idx].classList.add('active');
    nav.children[idx].classList.add('active');
  }
  function next(){ go((idx + 1) % slides.length); }
  function startAuto(){ timer = setInterval(next, 5000); }
  startAuto();
  nav.addEventListener('click', () => { clearInterval(timer); startAuto(); });
})();

