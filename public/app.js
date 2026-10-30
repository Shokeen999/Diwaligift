/**
 * THE ROYAL DIWALI BOX — 4K SCROLL EXPERIENCE ENGINE
 * 
 * Clean, immersive 60/120 FPS canvas renderer with lerp interpolation,
 * progressive frame streaming, ambient golden particles, and chapter transitions.
 */

(function () {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 239;
  const FRAME_BASE_URL = '/diwali_4k_frames/frame_';
  const LERP_FACTOR = 0.12;

  // Chapters definition (frame start, end, label)
  const CHAPTERS = [
    { id: 0, start: 0, end: 48, title: 'Chapter I: The Royal Unveiling', sectionId: 'section-0' },
    { id: 1, start: 49, end: 106, title: 'Chapter II: Gilded Craftsmanship', sectionId: 'section-1' },
    { id: 2, start: 107, end: 166, title: 'Chapter III: Radiance Unleashed', sectionId: 'section-2' },
    { id: 3, start: 167, end: 219, title: 'Chapter IV: Sacred Treasures', sectionId: 'section-3' },
    { id: 4, start: 220, end: 238, title: 'Chapter V: Shubh Deepavali Blessings', sectionId: 'section-4' }
  ];

  // --- State ---
  const state = {
    totalFrames: TOTAL_FRAMES,
    images: new Array(TOTAL_FRAMES),
    isLoaded: new Array(TOTAL_FRAMES).fill(false),
    loadedCount: 0,
    currentFrame: 0,
    targetFrame: 0,
    renderedFrame: -1,
    fitMode: 'cover', // 'cover' or 'contain'
    isPlaying: false,
    isAudioOn: false,
    activeChapterIndex: 0,
    autoPlayTimer: null
  };

  // --- DOM Elements ---
  const canvas = document.getElementById('scroll-canvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const particlesCanvas = document.getElementById('particles-canvas');
  const pCtx = particlesCanvas.getContext('2d');
  
  // Loader
  const loaderScreen = document.getElementById('loader-screen');
  const loaderBar = document.getElementById('loader-progress-bar');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderStatus = document.getElementById('loader-status-text');
  const loaderStartBtn = document.getElementById('loader-start-btn');

  // Story sections
  const storySections = document.querySelectorAll('.story-section');

  // Modals & Notifications
  const greetingModal = document.getElementById('greeting-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');

  // Greeting Card inputs & buttons
  const greetTo = document.getElementById('greet-to');
  const greetFrom = document.getElementById('greet-from');
  const greetMsg = document.getElementById('greet-message');
  const previewTo = document.getElementById('preview-to');
  const previewFrom = document.getElementById('preview-from');
  const previewMsg = document.getElementById('preview-msg');
  const btnCopyCard = document.getElementById('btn-copy-card');
  const btnSparkleCard = document.getElementById('btn-sparkle-card');
  const btnCreateCard = document.getElementById('btn-create-card');
  const btnReplay = document.getElementById('btn-replay');
  const btnFireworks = document.getElementById('btn-fireworks');

  // ==========================================================================
  // 1. FRAME PRELOADING SYSTEM
  // ==========================================================================

  function getFrameUrl(index) {
    const padded = String(index).padStart(4, '0');
    return `${FRAME_BASE_URL}${padded}.jpg`;
  }

  function preloadSingleFrame(index) {
    return new Promise((resolve) => {
      if (state.images[index]) {
        resolve(state.images[index]);
        return;
      }

      const img = new Image();
      img.decoding = 'async';
      img.src = getFrameUrl(index);

      img.onload = () => {
        state.images[index] = img;
        state.isLoaded[index] = true;
        state.loadedCount++;
        updateLoadingProgress();
        resolve(img);
      };

      img.onerror = () => {
        setTimeout(() => {
          const retry = new Image();
          retry.src = getFrameUrl(index);
          retry.onload = () => {
            state.images[index] = retry;
            state.isLoaded[index] = true;
            state.loadedCount++;
            updateLoadingProgress();
            resolve(retry);
          };
          retry.onerror = () => resolve(null);
        }, 200);
      };
    });
  }

  function updateLoadingProgress() {
    const pct = Math.floor((state.loadedCount / state.totalFrames) * 100);
    if (loaderBar) loaderBar.style.width = `${pct}%`;
    if (loaderPercent) loaderPercent.textContent = `${pct}%`;

    if (state.loadedCount >= 1 && state.renderedFrame === -1) {
      renderFrame(0);
    }

    if (pct >= 15 && loaderStartBtn && loaderStartBtn.classList.contains('hidden')) {
      if (loaderStatus) loaderStatus.textContent = '4K stream ready for playback!';
      loaderStartBtn.classList.remove('hidden');
    }

    if (pct >= 100) {
      if (loaderStatus) loaderStatus.textContent = 'All 239 frames cached!';
      setTimeout(() => {
        hideLoader();
      }, 400);
    }
  }

  function hideLoader() {
    if (!loaderScreen) return;
    loaderScreen.classList.add('fade-out');
    setTimeout(() => {
      loaderScreen.style.display = 'none';
    }, 800);
  }

  async function startProgressiveLoad() {
    // Phase 1: Load frame 0 immediately
    if (loaderStatus) loaderStatus.textContent = 'Loading master 4K frame...';
    await preloadSingleFrame(0);

    // Phase 2: Load keyframe milestones across the whole sequence
    if (loaderStatus) loaderStatus.textContent = 'Caching keyframe milestones...';
    const keyframes = [];
    for (let i = 0; i < state.totalFrames; i += 8) {
      if (i !== 0) keyframes.push(i);
    }
    keyframes.push(state.totalFrames - 1);
    await Promise.all(keyframes.map(k => preloadSingleFrame(k)));

    // Phase 3: Load remaining frames in batches of 6 concurrent downloads
    if (loaderStatus) loaderStatus.textContent = 'Streaming full 4K frame sequence...';
    const remaining = [];
    for (let i = 0; i < state.totalFrames; i++) {
      if (!state.isLoaded[i]) {
        remaining.push(i);
      }
    }

    const CONCURRENCY = 6;
    let poolIndex = 0;

    async function loadWorker() {
      while (poolIndex < remaining.length) {
        const nextIdx = remaining[poolIndex++];
        await preloadSingleFrame(nextIdx);
      }
    }

    const workers = [];
    for (let w = 0; w < CONCURRENCY; w++) {
      workers.push(loadWorker());
    }
    await Promise.all(workers);
  }

  function getNearestLoadedImage(targetIdx) {
    if (state.isLoaded[targetIdx] && state.images[targetIdx]) {
      return state.images[targetIdx];
    }
    for (let offset = 1; offset < state.totalFrames; offset++) {
      const up = targetIdx + offset;
      const down = targetIdx - offset;
      if (up < state.totalFrames && state.isLoaded[up] && state.images[up]) {
        return state.images[up];
      }
      if (down >= 0 && state.isLoaded[down] && state.images[down]) {
        return state.images[down];
      }
    }
    return state.images[0] || null;
  }

  // ==========================================================================
  // 2. CANVAS RENDERING ENGINE
  // ==========================================================================

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    particlesCanvas.width = width;
    particlesCanvas.height = height;

    state.renderedFrame = -1;
    renderFrame(Math.round(state.currentFrame));
  }

  function renderFrame(frameIdx) {
    const img = getNearestLoadedImage(frameIdx);
    if (!img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width || 3840;
    const ih = img.naturalHeight || img.height || 2160;

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);

    if (state.fitMode === 'cover') {
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      const scale = Math.min(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.fillStyle = '#050407';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    ctx.restore();
    state.renderedFrame = frameIdx;
  }

  function animationLoop() {
    state.currentFrame += (state.targetFrame - state.currentFrame) * LERP_FACTOR;
    const nextFrame = Math.round(state.currentFrame);

    if (nextFrame !== state.renderedFrame) {
      renderFrame(nextFrame);
      checkActiveChapter(nextFrame);
    }

    requestAnimationFrame(animationLoop);
  }

  // ==========================================================================
  // 3. SCROLL & CHAPTER SYNCHRONIZATION
  // ==========================================================================

  function onScroll() {
    if (state.isPlaying) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);

    state.targetFrame = Math.round(progress * (state.totalFrames - 1));
  }

  function checkActiveChapter(frameIdx) {
    let activeChapter = CHAPTERS[0];
    for (const chap of CHAPTERS) {
      if (frameIdx >= chap.start && frameIdx <= chap.end) {
        activeChapter = chap;
        break;
      }
    }

    if (activeChapter.id !== state.activeChapterIndex) {
      state.activeChapterIndex = activeChapter.id;

      // Update story section visibility
      storySections.forEach((sec, idx) => {
        if (idx === activeChapter.id) {
          sec.classList.add('active');
          sec.classList.remove('exit-up');
        } else if (idx < activeChapter.id) {
          sec.classList.remove('active');
          sec.classList.add('exit-up');
        } else {
          sec.classList.remove('active');
          sec.classList.remove('exit-up');
        }
      });

      if (state.isAudioOn) {
        playChapterChime(activeChapter.id);
      }
    }
  }

  function scrollToFrame(frameIdx, smooth = true) {
    const total = state.totalFrames - 1;
    const progress = frameIdx / total;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = progress * maxScroll;

    state.targetFrame = frameIdx;
    window.scrollTo({
      top: targetY,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  // ==========================================================================
  // 4. AUTO-PLAY & REPLAY
  // ==========================================================================

  function togglePlay() {
    if (state.isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }

  function startPlayback() {
    state.isPlaying = true;

    if (state.targetFrame >= state.totalFrames - 1) {
      state.targetFrame = 0;
      state.currentFrame = 0;
    }

    const intervalMs = 1000 / 24;

    state.autoPlayTimer = setInterval(() => {
      if (!state.isPlaying) return;

      if (state.targetFrame >= state.totalFrames - 1) {
        pausePlayback();
        return;
      }

      state.targetFrame += 1;
      state.currentFrame = state.targetFrame;

      const progress = state.targetFrame / (state.totalFrames - 1);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, progress * maxScroll);
    }, intervalMs);
  }

  function pausePlayback() {
    state.isPlaying = false;
    if (state.autoPlayTimer) {
      clearInterval(state.autoPlayTimer);
      state.autoPlayTimer = null;
    }
  }

  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      scrollToFrame(0, true);
      setTimeout(() => {
        startPlayback();
      }, 600);
    });
  }

  // ==========================================================================
  // 5. PROCEDURAL AMBIENT AUDIO SYNTHESIZER (Web Audio API)
  // ==========================================================================

  let audioCtx = null;
  let droneGain = null;
  let masterGain = null;

  function initAudio() {
    if (audioCtx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    droneGain = audioCtx.createGain();
    droneGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    droneGain.connect(masterGain);

    const frequencies = [155.56, 233.08, 311.13, 466.16];
    frequencies.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + idx * 80, audioCtx.currentTime);

      const lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.2 + idx * 0.05, audioCtx.currentTime);
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      lfo.connect(lfoGain.gain);

      osc.connect(filter);
      filter.connect(droneGain);

      osc.start();
      lfo.start();
    });
  }

  function toggleAudio() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    state.isAudioOn = !state.isAudioOn;

    if (state.isAudioOn) {
      droneGain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 1.2);
      showToast('🪔 Festive Ambient Soundscape Activated');
      playChapterChime(state.activeChapterIndex);
    } else {
      droneGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      showToast('Sound Muted');
    }
  }

  function playChapterChime(chapterIndex) {
    if (!audioCtx || !state.isAudioOn) return;

    const notes = [
      [311.13, 466.16],
      [349.23, 523.25],
      [392.00, 622.25, 783.99],
      [466.16, 698.46],
      [311.13, 392.00, 622.25]
    ];

    const currentNotes = notes[chapterIndex] || [311.13, 466.16];
    currentNotes.forEach((freq, i) => {
      setTimeout(() => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();
        osc.stop(audioCtx.currentTime + 2.6);
      }, i * 160);
    });
  }

  // ==========================================================================
  // 6. GOLDEN EMBER PARTICLES & SPARKLERS
  // ==========================================================================

  const particles = [];
  const MAX_PARTICLES = 40;

  class Particle {
    constructor(isBurst = false, x = 0, y = 0) {
      this.reset(isBurst, x, y);
    }

    reset(isBurst = false, x = 0, y = 0) {
      this.isBurst = isBurst;
      this.x = isBurst ? x : Math.random() * window.innerWidth;
      this.y = isBurst ? y : window.innerHeight + Math.random() * 20;
      this.size = isBurst ? (Math.random() * 4 + 2) : (Math.random() * 2.5 + 1);
      
      if (isBurst) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.025 + 0.015;
      } else {
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = -(Math.random() * 1.2 + 0.6);
        this.life = Math.random() * 0.6 + 0.4;
        this.decay = 0.004;
      }

      this.color = ['#ffd700', '#f5b041', '#ff9f43', '#ffffff', '#ff5722'][Math.floor(Math.random() * 5)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;

      if (this.isBurst) {
        this.vy += 0.12;
      }

      if (this.life <= 0) {
        if (this.isBurst) {
          return false;
        } else {
          this.reset();
        }
      }
      return true;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.size * 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = new Particle();
    p.y = Math.random() * window.innerHeight;
    particles.push(p);
  }

  function createSparklerBurst(x, y, count = 35) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(true, x, y));
    }
  }

  function loopParticles() {
    pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const alive = p.update();
      if (!alive) {
        particles.splice(i, 1);
      } else {
        p.draw(pCtx);
      }
    }

    requestAnimationFrame(loopParticles);
  }

  // Canvas mouse drag-scrubbing & click-burst
  let isDraggingCanvas = false;
  let dragStartX = 0;
  let dragStartFrame = 0;
  let dragMoved = false;

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDraggingCanvas = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartFrame = state.targetFrame;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingCanvas) return;
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 4) {
      dragMoved = true;
      pausePlayback();
      const frameDelta = Math.round(diff / 4);
      const newFrame = Math.min(Math.max(0, dragStartFrame + frameDelta), state.totalFrames - 1);
      scrollToFrame(newFrame, false);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (isDraggingCanvas && !dragMoved) {
      createSparklerBurst(e.clientX, e.clientY, 35);
    }
    isDraggingCanvas = false;
  });

  window.addEventListener('wheel', () => {
    if (state.loadedCount >= 10 && loaderScreen && !loaderScreen.classList.contains('fade-out')) {
      hideLoader();
    }
  }, { passive: true });

  if (btnFireworks) {
    btnFireworks.addEventListener('click', () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.4;
      createSparklerBurst(cx, cy, 60);
      createSparklerBurst(cx - 180, cy + 60, 45);
      createSparklerBurst(cx + 180, cy + 60, 45);
      showToast('🎆 Auspicious Festive Sparks Launched!');
    });
  }

  // ==========================================================================
  // 7. GREETING CARD MODAL & INTERACTION
  // ==========================================================================

  function updateCardPreview() {
    if (!previewTo || !greetTo) return;
    previewTo.textContent = `To: ${greetTo.value || 'Beloved Family'}`;
    previewFrom.textContent = `— ${greetFrom.value || 'With Love'}`;
    previewMsg.textContent = `“${greetMsg.value || 'Shubh Deepavali!'}”`;
  }

  [greetTo, greetFrom, greetMsg].forEach(input => {
    if (input) input.addEventListener('input', updateCardPreview);
  });

  function openGreetingModal() {
    if (greetingModal) {
      greetingModal.classList.remove('hidden');
      updateCardPreview();
    }
  }

  function closeGreetingModal() {
    if (greetingModal) greetingModal.classList.add('hidden');
  }

  if (btnCreateCard) btnCreateCard.addEventListener('click', openGreetingModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeGreetingModal);
  if (greetingModal) {
    greetingModal.addEventListener('click', (e) => {
      if (e.target === greetingModal) closeGreetingModal();
    });
  }

  if (btnCopyCard) {
    btnCopyCard.addEventListener('click', () => {
      const text = `🪔 *Shubh Deepavali 2026*\n\nTo: ${greetTo.value}\n\n"${greetMsg.value}"\n\n— ${greetFrom.value}\n✨ May the light illuminate your path with joy, peace, and abundance!`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('💌 Greeting copied to clipboard!');
      }).catch(() => {
        showToast('Text ready to copy!');
      });
    });
  }

  if (btnSparkleCard) {
    btnSparkleCard.addEventListener('click', () => {
      createSparklerBurst(window.innerWidth / 2, window.innerHeight / 2, 50);
      showToast('✨ Divine Sparkles Showered!');
    });
  }

  function showToast(msg) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  // ==========================================================================
  // 8. KEYBOARD SHORTCUTS
  // ==========================================================================

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        pausePlayback();
        scrollToFrame(Math.min(state.totalFrames - 1, state.targetFrame + (e.shiftKey ? 10 : 1)), false);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        pausePlayback();
        scrollToFrame(Math.max(0, state.targetFrame - (e.shiftKey ? 10 : 1)), false);
        break;
      case 'KeyM':
        toggleAudio();
        break;
      case 'KeyF':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        break;
      case 'Home':
        scrollToFrame(0, true);
        break;
      case 'End':
        scrollToFrame(state.totalFrames - 1, true);
        break;
      case 'Escape':
        closeGreetingModal();
        break;
    }
  });

  // ==========================================================================
  // 9. INITIALIZATION
  // ==========================================================================

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', onScroll, { passive: true });

  if (loaderStartBtn) {
    loaderStartBtn.addEventListener('click', () => {
      hideLoader();
    });
  }

  resizeCanvas();
  loopParticles();
  animationLoop();
  startProgressiveLoad();
  checkActiveChapter(0);

})();
