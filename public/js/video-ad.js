/* =========================================================
   GOOGLE VIDEO AD OVERLAY & AUTHENTIC GURUKUL VIDEO ENGINE
   Matches the Official Gurukul Home Tuitions Ad Video
   ========================================================= */

(function(){
  'use strict';

  let gAdTimerInterval = null;
  let gAdCountdownRemaining = 5;
  let gAdVideoEl = null;
  let gAdCanvasEl = null;
  let gAdModalOverlay = null;
  let isVideoAdActive = false;
  let isUsingCanvasEngine = false;
  let canvasAnimationId = null;
  let engineCurrentTime = 0;
  const engineDuration = 40; // 40 seconds duration matching full ad
  let engineLastTimestamp = 0;
  let isAudioMuted = true;
  let audioCtx = null;
  let masterGain = null;
  let nextChordTime = 0;
  let chordIndex = 0;
  let activeSpeech = null;

  // Particle background for default video engine
  const particles = [];
  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      radius: Math.random() * 2.5 + 1,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.5 + 0.2,
      color: i % 3 === 0 ? '#38bdf8' : (i % 3 === 1 ? '#818cf8' : '#fbbf24')
    });
  }

  // Initialize and check if video ad should display on page load
  function initVideoAd() {
    gAdModalOverlay = document.getElementById('googleVideoAdModal');
    gAdVideoEl = document.getElementById('gAdVideo');
    gAdCanvasEl = document.getElementById('gAdCanvas');

    if (!gAdModalOverlay || (!gAdVideoEl && !gAdCanvasEl)) {
      return;
    }

    // Bind interaction buttons
    const skipBtn = document.getElementById('gAdSkipBtn');
    if (skipBtn) skipBtn.addEventListener('click', skipVideoAd);

    const closeBtn = document.getElementById('gAdCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', skipVideoAd);

    const unmuteBtn = document.getElementById('gAdUnmuteBtn');
    if (unmuteBtn) unmuteBtn.addEventListener('click', toggleVideoAdMute);

    const infoBtn = document.getElementById('gAdInfoBtn');
    if (infoBtn) infoBtn.addEventListener('click', toggleAboutAdPopup);

    const ctaBtn = document.getElementById('gAdCtaPrimary');
    if (ctaBtn) ctaBtn.addEventListener('click', handleCtaClick);

    const ctaWaBtn = document.getElementById('gAdCtaWhatsApp');
    if (ctaWaBtn) ctaWaBtn.addEventListener('click', handleWhatsAppCta);

    // Keyboard support: Escape to skip ad
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isVideoAdActive) {
        skipVideoAd();
      }
    });

    // Check frequency settings
    const config = (window.data && window.data.videoAd) || { enabled: true, frequency: 'always' };
    if (config.enabled === false) {
      return;
    }

    const freq = config.frequency || 'always';
    if (freq === 'session') {
      if (sessionStorage.getItem('gurukul_video_ad_shown')) {
        return;
      }
    } else if (freq === 'once_daily') {
      const lastShown = localStorage.getItem('gurukul_video_ad_last_shown');
      if (lastShown) {
        const timeDiff = Date.now() - parseInt(lastShown, 10);
        if (timeDiff < 24 * 60 * 60 * 1000) {
          return;
        }
      }
    }

    // Schedule playback after the splash intro screen
    const splashScreen = document.getElementById('loadScreen');
    if (splashScreen && !splashScreen.classList.contains('hide')) {
      const checkSplashInterval = setInterval(() => {
        if (!splashScreen || splashScreen.classList.contains('hide') || splashScreen.style.display === 'none') {
          clearInterval(checkSplashInterval);
          setTimeout(() => {
            showVideoAd();
          }, 350);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkSplashInterval);
        if (!isVideoAdActive) showVideoAd();
      }, 4000);
    } else {
      setTimeout(() => {
        showVideoAd();
      }, 500);
    }
  }

  // Open and play the Video Ad modal
  function showVideoAd(forcePreview) {
    if (!gAdModalOverlay || (!gAdVideoEl && !gAdCanvasEl)) {
      gAdModalOverlay = document.getElementById('googleVideoAdModal');
      gAdVideoEl = document.getElementById('gAdVideo');
      gAdCanvasEl = document.getElementById('gAdCanvas');
    }
    if (!gAdModalOverlay) return;

    const adData = (window.data && window.data.videoAd) || {};
    const profile = (window.data && window.data.profile) || {};

    if (!forcePreview && adData.enabled === false) {
      return;
    }

    isVideoAdActive = true;

    // Update advertiser text and links
    const titleEl = document.getElementById('gAdBrandTitle');
    if (titleEl) titleEl.innerHTML = escapeHtml(adData.title || profile.companyName || 'Gurukul Home Tuitions') + ' <span class="g-ad-verified-badge" title="Google Verified Tuition Provider">✓</span>';

    const taglineEl = document.getElementById('gAdBrandTagline');
    if (taglineEl) taglineEl.textContent = adData.tagline || profile.tagline || 'Kathmandu Valley Top Home Tuitions · 2 Days Free Trial';

    const ctaBtn = document.getElementById('gAdCtaPrimary');
    if (ctaBtn) {
      ctaBtn.innerHTML = `<span>${escapeHtml(adData.ctaText || 'Book 2 Days Free Demo')}</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }

    // Set logo preview
    const logoEl = document.getElementById('gAdBrandLogo');
    if (logoEl) {
      if (profile.logoUrl) {
        logoEl.innerHTML = `<img src="${escapeAttr(profile.logoUrl)}" alt="Logo">`;
      } else {
        const initials = (profile.companyName || 'HT').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        logoEl.textContent = initials;
      }
    }

    // Reset countdown and skip button
    gAdCountdownRemaining = parseInt(adData.skipSeconds, 10) || 5;
    const skipCounter = document.getElementById('gAdSkipCounter');
    const skipBtn = document.getElementById('gAdSkipBtn');
    const countdownNum = document.getElementById('gAdCountdown');

    if (skipCounter) skipCounter.style.display = 'block';
    if (skipBtn) skipBtn.style.display = 'none';
    if (countdownNum) countdownNum.textContent = gAdCountdownRemaining;

    // Reset progress track
    const progressFill = document.getElementById('gAdProgressFill');
    if (progressFill) progressFill.style.width = '0%';

    // Reset mute state
    isAudioMuted = true;
    updateUnmuteButtonState(true);

    // Determine playback source
    const videoUrl = (adData.videoUrl || '').trim();
    const isCustomVideo = videoUrl && !videoUrl.includes('gurukul_tuition_promo.mp4') && videoUrl !== 'default';

    if (isCustomVideo && gAdVideoEl) {
      playCustomVideo(videoUrl);
    } else {
      playCanvasDefaultVideo();
    }

    // Show overlay
    gAdModalOverlay.classList.add('active');

    // Start skip countdown interval
    if (gAdTimerInterval) clearInterval(gAdTimerInterval);
    gAdTimerInterval = setInterval(() => {
      gAdCountdownRemaining--;
      if (countdownNum) countdownNum.textContent = Math.max(0, gAdCountdownRemaining);

      if (gAdCountdownRemaining <= 0) {
        clearInterval(gAdTimerInterval);
        if (skipCounter) skipCounter.style.display = 'none';
        if (skipBtn) {
          skipBtn.style.display = 'inline-flex';
          skipBtn.focus();
        }
      }
    }, 1000);

    // Track frequency
    sessionStorage.setItem('gurukul_video_ad_shown', 'true');
    localStorage.setItem('gurukul_video_ad_last_shown', Date.now().toString());
  }

  // Play an uploaded / external MP4/WebM video
  function playCustomVideo(url) {
    isUsingCanvasEngine = false;
    if (canvasAnimationId) cancelAnimationFrame(canvasAnimationId);

    if (gAdCanvasEl) gAdCanvasEl.classList.remove('active');
    if (gAdVideoEl) {
      gAdVideoEl.style.display = 'block';
      gAdVideoEl.muted = true;
      if (gAdVideoEl.src !== url && !gAdVideoEl.currentSrc.includes(url)) {
        gAdVideoEl.src = url;
      }

      gAdVideoEl.ontimeupdate = function() {
        if (gAdVideoEl.duration) {
          const pct = (gAdVideoEl.currentTime / gAdVideoEl.duration) * 100;
          const progressFill = document.getElementById('gAdProgressFill');
          if (progressFill) progressFill.style.width = pct + '%';

          const timerText = document.getElementById('gAdTimerText');
          if (timerText) {
            timerText.textContent = formatVideoTime(gAdVideoEl.currentTime) + ' / ' + formatVideoTime(gAdVideoEl.duration);
          }
        }
      };

      gAdVideoEl.onerror = function() {
        console.warn('Video failed to load, falling back to Gurukul Motion Graphics Engine');
        playCanvasDefaultVideo();
      };

      gAdVideoEl.onended = function() {
        setTimeout(() => skipVideoAd(), 800);
      };

      const playPromise = gAdVideoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Custom video autoplay delayed:', err);
        });
      }
    }
  }

  // Play the built-in Gurukul Motion Graphics Video Engine on Canvas
  function playCanvasDefaultVideo() {
    isUsingCanvasEngine = true;
    if (gAdVideoEl) {
      try { gAdVideoEl.pause(); } catch(e){}
      gAdVideoEl.style.display = 'none';
    }

    if (!gAdCanvasEl) return;
    gAdCanvasEl.classList.add('active');

    gAdCanvasEl.width = 1280;
    gAdCanvasEl.height = 720;

    engineCurrentTime = 0;
    engineLastTimestamp = performance.now();

    if (canvasAnimationId) cancelAnimationFrame(canvasAnimationId);
    canvasAnimationId = requestAnimationFrame(renderCanvasFrame);
  }

  // Main Canvas Render Loop
  function renderCanvasFrame(timestamp) {
    if (!isVideoAdActive || !isUsingCanvasEngine || !gAdCanvasEl) return;

    const dt = (timestamp - engineLastTimestamp) / 1000;
    engineLastTimestamp = timestamp;

    if (dt > 0 && dt < 1) {
      engineCurrentTime += dt;
    }

    if (engineCurrentTime >= engineDuration) {
      setTimeout(() => {
        if (isVideoAdActive) skipVideoAd();
      }, 500);
      return;
    }

    const ctx = gAdCanvasEl.getContext('2d');
    if (ctx) {
      drawDefaultVideoScene(ctx, engineCurrentTime, engineDuration);
    }

    if (!isAudioMuted) {
      playSynthesizedAudioTick(engineCurrentTime);
    }

    const pct = (engineCurrentTime / engineDuration) * 100;
    const progressFill = document.getElementById('gAdProgressFill');
    if (progressFill) progressFill.style.width = pct + '%';

    const timerText = document.getElementById('gAdTimerText');
    if (timerText) {
      timerText.textContent = formatVideoTime(engineCurrentTime) + ' / ' + formatVideoTime(engineDuration);
    }

    canvasAnimationId = requestAnimationFrame(renderCanvasFrame);
  }

  // Draw the authentic Gurukul Video Ad Motion Graphics
  function drawDefaultVideoScene(ctx, t, dur) {
    const W = 1280;
    const H = 720;
    const profile = (window.data && window.data.profile) || {};
    const company = profile.companyName || 'GURUKUL HOME TUITIONS';
    const phone = profile.phone || '9801775074';

    // 1. Background: Deep rich cosmic navy gradient
    const bgGrad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, 700);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#090d16');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Floating ambient particles
    ctx.save();
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(t * 2 + p.x));
      ctx.fill();
    });
    ctx.restore();

    // =========================================================
    // STATIC TOP HEADER BAR (Exact format from Gurukul Video)
    // =========================================================
    ctx.save();
    // Header Bar Background
    const topBarGrad = ctx.createLinearGradient(0, 0, W, 0);
    topBarGrad.addColorStop(0, '#0c4a6e');
    topBarGrad.addColorStop(0.5, '#075985');
    topBarGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(0, 0, W, 86);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 86);
    ctx.lineTo(W, 86);
    ctx.stroke();

    // Logo Emblem Circle on Left
    ctx.beginPath();
    ctx.arc(60, 43, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '700 24px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎓', 60, 43);

    // Title: GURUKUL HOME TUITIONS
    ctx.textAlign = 'left';
    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('GURUKUL HOME TUITIONS', 104, 45);

    // Target A+ Badge
    ctx.fillStyle = '#fbbf24';
    if (ctx.roundRect) ctx.roundRect(620, 20, 160, 46, 8);
    else ctx.rect(620, 20, 160, 46);
    ctx.fill();
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Target A+ 🌟', 700, 45);

    // WhatsApp Contact Badge
    ctx.fillStyle = '#22c55e';
    if (ctx.roundRect) ctx.roundRect(796, 20, 240, 46, 8);
    else ctx.rect(796, 20, 240, 46);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 21px system-ui, -apple-system, sans-serif';
    ctx.fillText('💬 WhatsApp: ' + phone, 916, 45);

    // Verified badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 13px system-ui';
    ctx.fillText('✓ VERIFIED', 1130, 45);

    ctx.restore();

    // =========================================================
    // STATIC BOTTOM BLUE BANNER (Exact format from Gurukul Video)
    // =========================================================
    ctx.save();
    const botBarGrad = ctx.createLinearGradient(0, H - 90, W, H);
    botBarGrad.addColorStop(0, '#0369a1');
    botBarGrad.addColorStop(0.5, '#0284c7');
    botBarGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = botBarGrad;
    ctx.fillRect(0, H - 90, W, 90);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, H - 90);
    ctx.lineTo(W, H - 90);
    ctx.stroke();

    // Left Point 1: -> Class 1 to 12 All Subjects
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '800 26px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('-> Class 1 to 12 All Subjects', 48, H - 62);

    // Left Point 2: -> 2 Days FREE Demo Class
    ctx.fillStyle = '#fde047';
    ctx.fillText('-> 2 Days FREE Demo Class', 48, H - 28);

    // Right side A+ Guarantee Ribbon
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(W - 80, H - 45, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('A+', W - 80, H - 49);
    ctx.font = '800 10px system-ui';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('GUARANTEED', W - 80, H - 32);

    ctx.restore();

    // =========================================================
    // DYNAMIC MIDDLE STAGE SCENES (0s - 40s)
    // =========================================================

    if (t < 7.0) {
      // SCENE 1: The Problem (0s - 7s)
      const st = t;
      const enterAlpha = Math.min(1, st * 2);

      ctx.save();
      ctx.globalAlpha = enterAlpha;

      // Student Studying Silhouette / Card
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      if (ctx.roundRect) ctx.roundRect(140, 120, 1000, 450, 20);
      else ctx.rect(140, 120, 1000, 450);
      ctx.fill();
      ctx.stroke();

      // Big Emoticon / Icon
      ctx.font = '64px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('📖 📏 🙇‍♂️', W/2, 220);

      // Nepali Question Text
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('तपाईंको बच्चाले धेरै मेहनत गर्दा पनि', W/2, 310);
      ctx.fillStyle = '#f87171';
      ctx.fillText('राम्रो नतिजा ल्याउन सकिरहेको छैन?', W/2, 360);

      // English Subtitle
      ctx.font = '600 20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Is your child working hard but still not getting desired results & grades?', W/2, 420);

      // Bottom pulse badge
      ctx.font = '800 18px system-ui';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('⚡ Don\'t worry — The right 1-on-1 guidance makes all the difference! ⚡', W/2, 490);

      ctx.restore();

    } else if (t >= 7.0 && t < 17.0) {
      // SCENE 2: The Core Reason (7s - 17s)
      const st = t - 7.0;
      const enterAlpha = Math.min(1, st * 2);

      ctx.save();
      ctx.globalAlpha = enterAlpha;

      // Card Container
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.35)';
      ctx.lineWidth = 2;
      if (ctx.roundRect) ctx.roundRect(100, 115, 1080, 460, 20);
      else ctx.rect(100, 115, 1080, 460);
      ctx.fill();
      ctx.stroke();

      // Heading Tag
      ctx.fillStyle = '#ef4444';
      if (ctx.roundRect) ctx.roundRect(W/2 - 200, 135, 400, 36, 8);
      else ctx.rect(W/2 - 200, 135, 400, 36);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ THE CLASSROOM DILEMMA', W/2, 155);

      // 3 Pain Points
      const painPoints = [
        { icon: '🏫', title: 'ठूलो भीड (Crowded Class)', desc: 'कक्षा कोठाको ठूलो भीडमा हरेक विद्यार्थीले समय पाउँदैनन्' },
        { icon: '⏳', title: 'व्यक्तिगत ध्यानको अभाव', desc: 'पर्याप्त १-अन-१ व्यक्तिगत ध्यान र परामर्श नपाउनु' },
        { icon: '🧭', title: 'सही मार्गदर्शनको कमी', desc: 'सही दिशा र अवधारणा (concept) स्पष्ट नहुनु' }
      ];

      painPoints.forEach((p, idx) => {
        const cx = 130 + idx * 350;
        const cy = 200;
        const pAlpha = Math.min(1, Math.max(0, (st - idx * 0.3) * 2));

        ctx.save();
        ctx.globalAlpha = pAlpha;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        if (ctx.roundRect) ctx.roundRect(cx, cy, 320, 200, 14);
        else ctx.rect(cx, cy, 320, 200);
        ctx.fill();
        ctx.stroke();

        ctx.font = '40px system-ui';
        ctx.fillText(p.icon, cx + 160, cy + 55);

        ctx.font = '800 18px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#f87171';
        ctx.fillText(p.title, cx + 160, cy + 110);

        ctx.font = '500 13.5px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(p.desc, cx + 160, cy + 150);

        ctx.restore();
      });

      // Nepali Narrative Quote
      ctx.font = '700 20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('"सही मार्गदर्शनको अभावले बच्चाले आफ्नो वास्तविक क्षमता देखाउन सक्दैन।"', W/2, 480);
      ctx.font = '500 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Without personal attention, true potential remains undiscovered.', W/2, 515);

      ctx.restore();

    } else if (t >= 17.0 && t < 29.0) {
      // SCENE 3: The Solution - Gurukul Home Tuitions (17s - 29s)
      const st = t - 17.0;
      const enterAlpha = Math.min(1, st * 2);

      ctx.save();
      ctx.globalAlpha = enterAlpha;

      // Card Container
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      if (ctx.roundRect) ctx.roundRect(100, 115, 1080, 460, 20);
      else ctx.rect(100, 115, 1080, 460);
      ctx.fill();
      ctx.stroke();

      // Top Tag
      ctx.fillStyle = '#0284c7';
      if (ctx.roundRect) ctx.roundRect(W/2 - 240, 135, 480, 40, 10);
      else ctx.rect(W/2 - 240, 135, 480, 40);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌟 अब सही निर्णय गर्ने समय आएको छ! 🌟', W/2, 158);

      // 4 Core Perks Cards
      const solutions = [
        { icon: '👨‍🏫', title: 'अनुभवी तथा जिम्मेवार शिक्षक', desc: '100+ Verified & Dedicated Top Tutors' },
        { icon: '🎯', title: 'व्यक्तिगत रुपमा अध्ययन', desc: '1-on-1 Customized In-Home Teaching' },
        { icon: '📐', title: 'Concept-Based Learning', desc: 'Math, Science, Account, English & All Subjects' },
        { icon: '📈', title: 'साप्ताहिक प्रगति ट्र्याकिङ', desc: 'Weekly Tests & Continuous Parent Reports' }
      ];

      solutions.forEach((s, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = 130 + col * 520;
        const cy = 200 + row * 135;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.5;
        if (ctx.roundRect) ctx.roundRect(cx, cy, 490, 115, 14);
        else ctx.rect(cx, cy, 490, 115);
        ctx.fill();
        ctx.stroke();

        ctx.font = '38px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(s.icon, cx + 55, cy + 65);

        ctx.textAlign = 'left';
        ctx.font = '800 20px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(s.title, cx + 105, cy + 45);

        ctx.font = '600 14.5px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(s.desc, cx + 105, cy + 78);
      });

      // Bottom Banner
      ctx.textAlign = 'center';
      ctx.font = '800 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('✨ बच्चाको आवश्यकता अनुसार घरमै पढाइने उत्कृष्ट ट्युसन ✨', W/2, 515);

      ctx.restore();

    } else {
      // SCENE 4: The Official Gurukul Guarantee Card & Offer (29s - 40s)
      const st = t - 29.0;
      const enterAlpha = Math.min(1, st * 2);
      const pulse = 1 + 0.02 * Math.sin(st * 5);

      ctx.save();
      ctx.globalAlpha = enterAlpha;

      // Card Container
      ctx.translate(W/2, 345);
      ctx.scale(pulse, pulse);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      if (ctx.roundRect) ctx.roundRect(-520, -220, 1040, 440, 20);
      else ctx.rect(-520, -220, 1040, 440);
      ctx.fill();
      ctx.stroke();

      // Top Golden Tag
      ctx.fillStyle = '#fbbf24';
      if (ctx.roundRect) ctx.roundRect(-280, -245, 560, 44, 22);
      else ctx.rect(-280, -245, 560, 44);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('के तपाईं Home Tuition Teacher को खोजीमा हुनुहुन्छ?', 0, -218);

      // Main Offer Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px system-ui, -apple-system, sans-serif';
      ctx.fillText('घरमै अनुभवी Tutors बोलाउनुहोस्!', 0, -155);

      ctx.font = '800 22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Class 1 to 12 · All Subjects · Guaranteed A+ 🏆', 0, -115);

      // Checklist (Left & Right Column)
      const pointsLeft = [
        '✓ Covering All Academic Levels',
        '✓ Personalized 1-on-1 Learning',
        '✓ Regular Progress Assessment'
      ];
      const pointsRight = [
        '✓ Offering Guidance in All Subjects',
        '✓ 2 Days FREE Demo Classes',
        '✓ Top-Notch Quality & Verified Tutors'
      ];

      ctx.font = '700 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'left';

      pointsLeft.forEach((p, i) => {
        ctx.fillText(p, -440, -45 + i * 40);
      });
      pointsRight.forEach((p, i) => {
        if (p.includes('2 Days FREE')) ctx.fillStyle = '#fde047';
        else ctx.fillStyle = '#e2e8f0';
        ctx.fillText(p, 60, -45 + i * 40);
      });

      // Bottom Phone Callout
      ctx.fillStyle = '#059669';
      if (ctx.roundRect) ctx.roundRect(-350, 90, 700, 65, 14);
      else ctx.rect(-350, 90, 700, 65);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '900 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('📞 Call / WhatsApp: ' + phone, 0, 130);

      // Service area
      ctx.font = '600 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('📍 Service Areas: Kathmandu · Lalitpur · Bhaktapur', 0, 185);

      ctx.restore();
    }
  }

  // Web Audio Synthesizer for smooth pleasant background chord progression
  function playSynthesizedAudioTick(t) {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const chords = [
        [261.63, 329.63, 392.00, 523.25],
        [196.00, 246.94, 293.66, 392.00],
        [220.00, 261.63, 329.63, 440.00],
        [174.61, 220.00, 261.63, 349.23]
      ];

      if (t >= nextChordTime) {
        nextChordTime = t + 2.2;
        const currentChord = chords[chordIndex % chords.length];
        chordIndex++;

        currentChord.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();

          osc.type = i === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

          const startGain = 0.08 / (i + 1);
          noteGain.gain.setValueAtTime(startGain, audioCtx.currentTime);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.0);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start();
          osc.stop(audioCtx.currentTime + 2.0);
        });
      }
    } catch (e) {}
  }

  function formatVideoTime(sec) {
    if (isNaN(sec) || sec === Infinity) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function skipVideoAd() {
    if (gAdTimerInterval) clearInterval(gAdTimerInterval);
    if (canvasAnimationId) cancelAnimationFrame(canvasAnimationId);
    isVideoAdActive = false;

    if (gAdVideoEl) {
      try { gAdVideoEl.pause(); } catch (e) {}
    }

    if (audioCtx && audioCtx.state !== 'closed') {
      try { audioCtx.suspend(); } catch (e) {}
    }

    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch(e){}
    }

    if (gAdModalOverlay) {
      gAdModalOverlay.classList.remove('active');
    }

    const popup = document.getElementById('gAdAboutPopup');
    if (popup) popup.classList.remove('show');
  }

  function toggleVideoAdMute() {
    isAudioMuted = !isAudioMuted;

    if (gAdVideoEl) {
      gAdVideoEl.muted = isAudioMuted;
    }

    if (!isAudioMuted && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    updateUnmuteButtonState(isAudioMuted);
  }

  function updateUnmuteButtonState(isMuted) {
    const unmuteBtn = document.getElementById('gAdUnmuteBtn');
    if (!unmuteBtn) return;
    if (isMuted) {
      unmuteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
        <span>Tap to Unmute</span>
      `;
      unmuteBtn.style.background = 'rgba(15, 23, 42, 0.88)';
    } else {
      unmuteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span>Sound On</span>
      `;
      unmuteBtn.style.background = 'rgba(37, 99, 235, 0.9)';
    }
  }

  function toggleAboutAdPopup(e) {
    if (e) e.stopPropagation();
    const popup = document.getElementById('gAdAboutPopup');
    if (popup) {
      popup.classList.toggle('show');
    }
  }

  function handleCtaClick() {
    const adData = (window.data && window.data.videoAd) || {};
    const action = adData.ctaAction || 'whatsapp';

    skipVideoAd();

    if (action === 'whatsapp') {
      handleWhatsAppCta();
    } else if (action === 'call') {
      const phone = (window.data && window.data.profile && window.data.profile.phone) || '9801775074';
      window.location.href = 'tel:' + phone.replace(/[^0-9+]/g, '');
    } else if (action === 'groups') {
      const groupsSec = document.getElementById('groups');
      if (groupsSec) groupsSec.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'parents') {
      const parentsSec = document.getElementById('parents');
      if (parentsSec) parentsSec.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'vacancies') {
      const vacSec = document.getElementById('vacancies');
      if (vacSec) vacSec.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleWhatsAppCta() {
    skipVideoAd();
    const phone = getAdminWhatsAppNumber();
    const company = (window.data && window.data.profile && window.data.profile.companyName) || 'Gurukul Home Tuitions';
    const text = encodeURIComponent(`Hello ${company}! I saw your Google Video Ad on the website and I would like to book 2 Days of FREE demo classes for my child.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  /* =========================================================
     ADMIN PANEL CONTROLS & NON-BLOCKING UPLOAD TOOLS
     ========================================================= */

  function renderAdminVideoAd() {
    const adData = (window.data && window.data.videoAd) || {
      enabled: true,
      videoUrl: '',
      title: 'Gurukul Home Tuitions',
      tagline: 'Best Home Tutors in Kathmandu · Target A+ · Nursery to Bachelor',
      ctaText: 'Book 2 Days Free Demo Class',
      ctaAction: 'whatsapp',
      skipSeconds: 5,
      frequency: 'always'
    };

    const enableCheck = document.getElementById('ad_enabled');
    if (enableCheck) enableCheck.checked = adData.enabled !== false;

    const urlInput = document.getElementById('ad_videoUrl');
    if (urlInput) urlInput.value = adData.videoUrl || '';

    const titleInput = document.getElementById('ad_title');
    if (titleInput) titleInput.value = adData.title || '';

    const taglineInput = document.getElementById('ad_tagline');
    if (taglineInput) taglineInput.value = adData.tagline || '';

    const ctaTextInput = document.getElementById('ad_ctaText');
    if (ctaTextInput) ctaTextInput.value = adData.ctaText || 'Book 2 Days Free Demo Class';

    const ctaActionSelect = document.getElementById('ad_ctaAction');
    if (ctaActionSelect) ctaActionSelect.value = adData.ctaAction || 'whatsapp';

    const skipInput = document.getElementById('ad_skipSeconds');
    if (skipInput) skipInput.value = adData.skipSeconds || 5;

    const freqSelect = document.getElementById('ad_frequency');
    if (freqSelect) freqSelect.value = adData.frequency || 'always';

    const previewVideo = document.getElementById('ad_adminPreviewVideo');
    if (previewVideo) {
      const src = adData.videoUrl || '';
      if (src && previewVideo.src !== src) {
        previewVideo.src = src;
      }
    }
  }

  async function saveAdminVideoAd() {
    const rootData = window.data || (typeof data !== 'undefined' ? data : null);
    if (!rootData) {
      showToast('Error: Site data not loaded yet. Please wait a moment.');
      return;
    }
    if (!rootData.videoAd) rootData.videoAd = {};

    const enableCheck = document.getElementById('ad_enabled');
    const urlInput = document.getElementById('ad_videoUrl');
    const titleInput = document.getElementById('ad_title');
    const taglineInput = document.getElementById('ad_tagline');
    const ctaTextInput = document.getElementById('ad_ctaText');
    const ctaActionSelect = document.getElementById('ad_ctaAction');
    const skipInput = document.getElementById('ad_skipSeconds');
    const freqSelect = document.getElementById('ad_frequency');

    rootData.videoAd.enabled = enableCheck ? enableCheck.checked : true;
    rootData.videoAd.videoUrl = urlInput ? urlInput.value.trim() : '';
    rootData.videoAd.title = titleInput ? titleInput.value.trim() : '';
    rootData.videoAd.tagline = taglineInput ? taglineInput.value.trim() : '';
    rootData.videoAd.ctaText = ctaTextInput ? ctaTextInput.value.trim() : 'Book 2 Days Free Demo Class';
    rootData.videoAd.ctaAction = ctaActionSelect ? ctaActionSelect.value : 'whatsapp';
    rootData.videoAd.skipSeconds = parseInt(skipInput ? skipInput.value : 5, 10) || 5;
    rootData.videoAd.frequency = freqSelect ? freqSelect.value : 'always';

    // Update video preview element
    const previewVideo = document.getElementById('ad_adminPreviewVideo');
    if (previewVideo && rootData.videoAd.videoUrl) {
      previewVideo.src = rootData.videoAd.videoUrl;
    }

    const saveBtn = document.getElementById('ad_saveBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
    }

    try {
      if (typeof window.saveData === 'function') {
        await window.saveData();
      } else if (typeof saveData === 'function') {
        await saveData();
      }
      const ok = document.getElementById('ad_ok');
      if (ok) {
        ok.classList.add('show');
        setTimeout(() => ok.classList.remove('show'), 2000);
      }
      showToast('Video ad settings saved successfully!');
    } catch (e) {
      console.error('Error saving video ad settings:', e);
      showToast('Error saving video ad settings: ' + (e.message || 'Check connection'));
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Video Ad Settings';
      }
    }
  }

  // Non-blocking video file upload handler
  async function handleVideoFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('Please select a valid video file (MP4, WebM, MOV, etc.)');
      e.target.value = '';
      return;
    }

    if (file.size > 80 * 1024 * 1024) {
      showToast('File is larger than 80MB. Please choose a smaller video for fast streaming.');
      e.target.value = '';
      return;
    }

    const progressEl = document.getElementById('ad_uploadProgress');
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    if (progressEl) {
      progressEl.style.display = 'block';
      progressEl.textContent = `⏳ Uploading video "${file.name}" (${sizeMb} MB)… Please wait.`;
    }

    showToast(`Uploading video (${sizeMb} MB)…`);

    try {
      const uploadedUrl = await uploadToCloudinaryOrStorage(file, 'gurukul_video_ads', 'video_ad_' + Date.now());
      if (uploadedUrl) {
        const urlInput = document.getElementById('ad_videoUrl');
        if (urlInput) urlInput.value = uploadedUrl;

        const previewVideo = document.getElementById('ad_adminPreviewVideo');
        if (previewVideo) {
          previewVideo.src = uploadedUrl;
          previewVideo.load();
        }

        const rootData = window.data || (typeof data !== 'undefined' ? data : null);
        if (rootData) {
          if (!rootData.videoAd) rootData.videoAd = {};
          rootData.videoAd.videoUrl = uploadedUrl;
          if (typeof window.saveData === 'function') await window.saveData();
          else if (typeof saveData === 'function') await saveData();
        }

        if (progressEl) {
          progressEl.textContent = `✓ Video uploaded & saved successfully!`;
          setTimeout(() => { progressEl.style.display = 'none'; }, 4000);
        }
        showToast('Video uploaded and saved successfully!');
      }
    } catch (err) {
      console.error('Video upload error:', err);
      if (progressEl) {
        progressEl.textContent = 'Upload failed: ' + (err.message || 'Error occurred');
      }
      showToast('Video upload failed: ' + (err.message || 'Check connection'));
    }

    e.target.value = '';
  }

  function useBuiltInDefaultVideo() {
    const urlInput = document.getElementById('ad_videoUrl');
    if (urlInput) urlInput.value = '';

    const rootData = window.data || (typeof data !== 'undefined' ? data : null);
    if (rootData) {
      if (!rootData.videoAd) rootData.videoAd = {};
      rootData.videoAd.videoUrl = '';
      if (typeof window.saveData === 'function') window.saveData();
      else if (typeof saveData === 'function') saveData();
    }
    showToast('Switched to authentic Gurukul Promo Video Ad!');
  }

  // Smooth, non-hanging video renderer
  async function recordAndUploadDefaultVideo() {
    const progressEl = document.getElementById('ad_uploadProgress');
    const genBtn = document.getElementById('ad_generateAndUploadBtn');
    if (genBtn) genBtn.disabled = true;

    if (progressEl) {
      progressEl.style.display = 'block';
      progressEl.textContent = '⏳ Rendering Gurukul Promo Video (0%)…';
    }

    try {
      const videoBlob = await renderDefaultVideoBlob((pct) => {
        if (progressEl) progressEl.textContent = `⏳ Rendering Gurukul Promo Video (${pct}%)…`;
      });

      if (!videoBlob) throw new Error('Video recording failed');

      if (progressEl) progressEl.textContent = '☁️ Saving video to storage…';
      const videoFile = new File([videoBlob], `gurukul_ad_${Date.now()}.webm`, { type: 'video/webm' });

      const uploadedUrl = await uploadToCloudinaryOrStorage(videoFile, 'gurukul_video_ads', 'gurukul_default_ad_' + Date.now());

      if (uploadedUrl) {
        const urlInput = document.getElementById('ad_videoUrl');
        if (urlInput) urlInput.value = uploadedUrl;

        const rootData = window.data || (typeof data !== 'undefined' ? data : null);
        if (rootData) {
          if (!rootData.videoAd) rootData.videoAd = {};
          rootData.videoAd.videoUrl = uploadedUrl;
          if (typeof window.saveData === 'function') await window.saveData();
          else if (typeof saveData === 'function') await saveData();
        }

        if (progressEl) {
          progressEl.textContent = '✓ Default video recorded & saved successfully!';
          setTimeout(() => { progressEl.style.display = 'none'; }, 4000);
        }
        showToast('Video recorded & saved!');
      }
    } catch (err) {
      console.error('Record error:', err);
      if (progressEl) progressEl.textContent = 'Error: ' + err.message;
      showToast('Error recording video ad: ' + err.message);
    } finally {
      if (genBtn) genBtn.disabled = false;
    }
  }

  async function downloadDefaultVideo() {
    showToast('Rendering video file for download…');
    try {
      const videoBlob = await renderDefaultVideoBlob();
      if (!videoBlob) throw new Error('Could not record video');

      const a = document.createElement('a');
      a.href = URL.createObjectURL(videoBlob);
      a.download = 'gurukul_home_tuition_ad.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Video download started!');
    } catch (err) {
      showToast('Download error: ' + err.message);
    }
  }

  function renderDefaultVideoBlob(onProgress) {
    return new Promise((resolve, reject) => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 1280;
      offCanvas.height = 720;
      const offCtx = offCanvas.getContext('2d');

      const stream = offCanvas.captureStream(30);
      let recorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      const chunks = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      recorder.start();

      let t = 0;
      const totalDur = 15; // 15 seconds for fast export
      const fps = 30;
      const dt = 1 / fps;

      function step() {
        t += dt;
        drawDefaultVideoScene(offCtx, t, totalDur);

        if (typeof onProgress === 'function') {
          onProgress(Math.min(100, Math.round((t / totalDur) * 100)));
        }

        if (t >= totalDur) {
          recorder.stop();
        } else {
          setTimeout(step, 1000 / fps);
        }
      }

      step();
    });
  }

  function setupAdminEventListeners() {
    const saveBtn = document.getElementById('ad_saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveAdminVideoAd);

    const videoFileInput = document.getElementById('ad_videoFileInput');
    if (videoFileInput) videoFileInput.addEventListener('change', handleVideoFileUpload);

    const dropZone = document.getElementById('ad_dropZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = '#fbbf24';
        dropZone.style.background = 'rgba(251, 191, 36, 0.12)';
      });
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = 'var(--accent)';
        dropZone.style.background = 'rgba(56,189,248,0.04)';
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = 'var(--accent)';
        dropZone.style.background = 'rgba(56,189,248,0.04)';
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleVideoFileUpload({ target: { files: e.dataTransfer.files, value: '' } });
        }
      });
    }

    const useDefaultBtn = document.getElementById('ad_useDefaultVideoBtn');
    if (useDefaultBtn) useDefaultBtn.addEventListener('click', useBuiltInDefaultVideo);

    const genUploadBtn = document.getElementById('ad_generateAndUploadBtn');
    if (genUploadBtn) genUploadBtn.addEventListener('click', recordAndUploadDefaultVideo);

    const downloadBtn = document.getElementById('ad_downloadDefaultVideoBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadDefaultVideo);

    const urlInput = document.getElementById('ad_videoUrl');
    if (urlInput) {
      urlInput.addEventListener('input', function() {
        const previewVideo = document.getElementById('ad_adminPreviewVideo');
        if (previewVideo && this.value.trim()) {
          previewVideo.src = this.value.trim();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupAdminEventListeners();
    });
  } else {
    setupAdminEventListeners();
  }

  // Global exports
  window.initVideoAd = initVideoAd;
  window.showVideoAd = showVideoAd;
  window.skipVideoAd = skipVideoAd;
  window.renderAdminVideoAd = renderAdminVideoAd;
  window.saveAdminVideoAd = saveAdminVideoAd;
  window.handleVideoFileUpload = handleVideoFileUpload;
  window.useBuiltInDefaultVideo = useBuiltInDefaultVideo;
  window.recordAndUploadDefaultVideo = recordAndUploadDefaultVideo;
  window.downloadDefaultVideo = downloadDefaultVideo;

})();
