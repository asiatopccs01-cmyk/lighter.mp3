const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }
}, {threshold: 0.12});
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
const links = [...document.querySelectorAll('.nav-link')];
const sectionObserver = new IntersectionObserver(entries => {
  if (window.LighterRoutes || location.hash.startsWith('#/')) return;
  for (const entry of entries) if (entry.isIntersecting) {
    links.forEach(link => {
      const active = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, {rootMargin:'-15% 0px -55% 0px', threshold:0});
document.querySelectorAll('#home, #story, #visions').forEach(section => sectionObserver.observe(section));
const scenes = [
  {title:'黎明之前',label:'01 — FIRST LIGHT',description:'最深的夜色里，藏着第一束光。\n不必急着寻找答案，给新的开始一点时间。'},
  {title:'深蓝之间',label:'02 — STILL WATERS',description:'让思绪像潮水一样，慢慢退去。\n在安静的地方，听见内心的回响。'},
  {title:'旷野之上',label:'03 — THE WANDERER',description:'风会经过每一座沙丘，你也会找到自己的路。\n远方不只是一个地点，也是一种看世界的方式。'}
];
const dialog = document.querySelector('#scene-dialog');
const nextButton = document.querySelector('.dialog-next');
let currentScene = 0;
function showScene(index) {
  if (window.LighterRoutes) {
    window.LighterRoutes.openCollection(index);
    return;
  }
  currentScene = index;
  const scene = scenes[index];
  const art = document.querySelector('.dialog-art');
  const original = document.querySelectorAll('.card-art')[index];
  art.className = 'dialog-art ' + [...original.classList].filter(name => name.startsWith('art-')).join(' ');
  const clonedScene = original.querySelector('.art-scene').cloneNode(true);
  const clonedIds = new Map();
  clonedScene.querySelectorAll('[id]').forEach(element => {
    clonedIds.set(element.id, 'dialog-' + element.id);
    element.id = 'dialog-' + element.id;
  });
  clonedScene.querySelectorAll('*').forEach(element => {
    for (const attribute of [...element.attributes]) {
      const value = attribute.value.replace(/url\(#([^)]+)\)/g, (match, id) => clonedIds.has(id) ? 'url(#' + clonedIds.get(id) + ')' : match);
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
  });
  art.replaceChildren(clonedScene);
  document.querySelector('#dialog-label').textContent = scene.label;
  document.querySelector('#dialog-title').textContent = scene.title;
  document.querySelector('#dialog-description').textContent = scene.description;
  nextButton.hidden = false;
  if (!dialog.open) dialog.showModal();
}
document.querySelectorAll('[data-scene]').forEach(card => card.addEventListener('click', () => showScene(Number(card.dataset.scene))));
nextButton.addEventListener('click', () => showScene((currentScene + 1) % scenes.length));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {if(event.target === dialog){const rect = dialog.getBoundingClientRect();if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();}});
dialog.addEventListener('close', () => document.body.style.overflow = '');
new MutationObserver(() => {document.body.style.overflow = dialog.open ? 'hidden' : '';}).observe(dialog, {attributes:true,attributeFilter:['open']});
document.querySelector('.about-trigger').addEventListener('click', () => {
  if (window.LighterRoutes) {window.LighterRoutes.navigate('/about'); return;}
  document.querySelector('.dialog-art').className = 'dialog-art art-dawn';
  document.querySelector('.dialog-art').innerHTML = '<div class="art-sun"></div><div class="art-ridge ridge-one"></div><div class="art-ridge ridge-two"></div>';
  document.querySelector('#dialog-label').textContent = 'ABOUT LIGHTER';
  document.querySelector('#dialog-title').textContent = '留一点空间，给想象。';
  document.querySelector('#dialog-description').textContent = '一场关于光、时间与远方的视觉旅程。\n放慢脚步，感受此刻。每一次看见，都可以是新的开始。';
  nextButton.hidden = true;
  dialog.showModal();
});
document.querySelector('#year').textContent = new Date().getFullYear();

// Keep the atmosphere quiet when paused, out of view, or in a hidden tab.
const hero = document.querySelector('.hero');
const skyToggle = document.querySelector('.sky-toggle');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let skyPlaying = true;
let heroVisible = true;
function updateSkyMotion() {
  hero.classList.toggle('is-paused', !skyPlaying || !heroVisible || document.hidden || motionPreference.matches);
  skyToggle.setAttribute('aria-pressed', String(skyPlaying));
  skyToggle.setAttribute('aria-label', skyPlaying ? '暂停空间动效' : '播放空间动效');
  skyToggle.querySelector('.sky-toggle-icon').textContent = skyPlaying ? 'Ⅱ' : '▷';
  skyToggle.querySelector('.sky-toggle-text').textContent = skyPlaying ? '空间流动中' : '空间已暂停';
}
skyToggle.addEventListener('click', () => {skyPlaying = !skyPlaying; updateSkyMotion();});
new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting;
  updateSkyMotion();
}, {threshold:0}).observe(hero);
document.addEventListener('visibilitychange', updateSkyMotion);
motionPreference.addEventListener('change', updateSkyMotion);
updateSkyMotion();

const visionGrid = document.querySelector('.vision-grid');
const visionCards = [...document.querySelectorAll('.vision-card')];
document.querySelectorAll('.filter-button').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.filter-button').forEach(other => {
      const selected = other === button;
      other.classList.toggle('selected', selected);
      other.setAttribute('aria-pressed', String(selected));
    });
    let visibleCount = 0;
    visionCards.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      if (!card.hidden) {visibleCount++; card.classList.add('visible');}
    });
    visionGrid.classList.toggle('filtered', filter !== 'all');
    visionGrid.classList.toggle('single-result', visibleCount === 1);
    document.querySelector('.collection-count').textContent = String(visibleCount).padStart(2, '0') + ' / VISIONS';
  });
});

const ritualPanel = document.querySelector('.ritual-panel');
const ritualButton = document.querySelector('#ritual-start');
const ritualStatus = document.querySelector('.ritual-status');
let ritualStartedAt = 0;
let ritualTimer;
function stopRitual(completed = false) {
  clearInterval(ritualTimer);
  ritualTimer = undefined;
  ritualPanel.classList.remove('is-breathing');
  ritualButton.setAttribute('aria-pressed', 'false');
  ritualButton.querySelector('.ritual-button-label').textContent = completed ? '再留一分钟给自己' : '开始片刻静心';
  ritualStatus.textContent = completed ? '这一分钟属于你。带着平静，继续前行。' : '吸气，呼气。让此刻慢下来。';
}
function updateRitual() {
  const elapsed = (performance.now() - ritualStartedAt) / 1000;
  if (elapsed >= 60) {stopRitual(true); return;}
  const phase = elapsed % 10;
  const message = phase < 4 ? '轻轻吸气 · 让光靠近' : phase < 6 ? '停留片刻 · 感受此刻' : '缓缓呼气 · 放下思绪';
  if (ritualStatus.textContent !== message) ritualStatus.textContent = message;
}
ritualButton.addEventListener('click', () => {
  if (ritualTimer !== undefined) {stopRitual(); return;}
  ritualStartedAt = performance.now();
  ritualPanel.classList.add('is-breathing');
  ritualButton.setAttribute('aria-pressed', 'true');
  ritualButton.querySelector('.ritual-button-label').textContent = '结束片刻静心';
  updateRitual();
  ritualTimer = setInterval(updateRitual, 250);
});
// End the exercise when leaving the page instead of running a timer unseen.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ritualTimer !== undefined) stopRitual();
});

const ambientAudio = document.querySelector('#ambient-audio');
const musicDock = document.querySelector('.music-dock');
const musicPlay = document.querySelector('.music-play');
const musicState = document.querySelector('.music-state');
const musicAnnouncement = document.querySelector('.music-announcement');
const musicVolume = document.querySelector('#music-volume');
const volumeToggle = document.querySelector('.music-volume-toggle');
const volumePanel = document.querySelector('.music-volume-panel');
let musicLoading = false;
ambientAudio.volume = 0.28;
function updateMusicUI() {
  const playing = !ambientAudio.paused && !ambientAudio.error;
  musicDock.classList.toggle('is-playing', playing);
  musicPlay.setAttribute('aria-pressed', String(playing));
  musicPlay.setAttribute('aria-label', playing ? '暂停背景音乐：氛围音景' : '播放背景音乐：氛围音景');
  musicPlay.querySelector('.music-play-icon').textContent = playing ? 'Ⅱ' : '▶';
  musicState.textContent = playing ? '轻柔氛围 · 正在播放' : '轻柔氛围 · 点击播放';
}
function showMusicError() {
  updateMusicUI();
  musicState.textContent = '暂时无法播放 · 点击重试';
  musicAnnouncement.textContent = '音乐加载失败，请点击播放按钮重试。';
}
musicPlay.addEventListener('click', async () => {
  if (musicLoading) return;
  if (!ambientAudio.paused) {ambientAudio.pause(); updateMusicUI(); return;}
  musicLoading = true;
  musicPlay.disabled = true;
  musicState.textContent = '正在加载氛围音景…';
  try {
    if (ambientAudio.error) ambientAudio.load();
    await ambientAudio.play();
    musicAnnouncement.textContent = '氛围音景已开启。';
  } catch {
    showMusicError();
  } finally {
    musicLoading = false;
    musicPlay.disabled = false;
  }
});
ambientAudio.addEventListener('playing', updateMusicUI);
ambientAudio.addEventListener('pause', updateMusicUI);
ambientAudio.addEventListener('error', showMusicError);
musicVolume.addEventListener('input', () => {
  const volume = Number(musicVolume.value);
  ambientAudio.volume = volume / 100;
  musicVolume.setAttribute('aria-valuetext', volume + '%');
  document.querySelector('.music-volume-value').textContent = volume + '%';
});
function closeVolumePanel() {
  volumePanel.hidden = true;
  volumeToggle.setAttribute('aria-expanded', 'false');
}
volumeToggle.addEventListener('click', () => {
  const open = volumePanel.hidden;
  volumePanel.hidden = !open;
  volumeToggle.setAttribute('aria-expanded', String(open));
  if (open) musicVolume.focus();
});
document.addEventListener('click', event => {
  if (!musicDock.contains(event.target)) closeVolumePanel();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !volumePanel.hidden) {
    event.preventDefault();
    closeVolumePanel();
    volumeToggle.focus();
  }
});
updateMusicUI();

// Full-screen worlds can be explored with buttons, keyboard or a deliberate swipe.
const worldChoices = [...document.querySelectorAll('.world-choice')];
const worldNames = ['2027 年度总览','火象星座','土象星座','风象星座','水象星座','爱情与人际','事业与财富'];
const worldLabels = ['01 — 2027','02 — FIRE','03 — EARTH','04 — AIR','05 — WATER','06 — LOVE','07 — GROWTH'];
let currentWorld = 0;
function setWorld(index) {
  const destination = (index + worldNames.length) % worldNames.length;
  if (window.SpatialGallery) {const {start,finish}=window.SpatialGallery.getState();window.SpatialGallery.goTo(index<0?start:index>=worldNames.length?finish:index);return;}
  updateWorldUI(destination);
}
function updateWorldUI(index) {
  currentWorld = index;
  hero.dataset.world = String(currentWorld);
  worldChoices.forEach((button, i) => {
    button.classList.toggle('selected', i === currentWorld);
    button.setAttribute('aria-pressed', String(i === currentWorld));
  });
  document.querySelector('.world-number').innerHTML = String(currentWorld + 1).padStart(2, '0') + ' <small>/ ' + String(worldNames.length).padStart(2, '0') + '</small>';
  document.querySelector('.hero-topline>span:last-child').textContent = worldLabels[currentWorld];
  document.querySelector('.world-announcement').textContent = '当前场景：' + worldNames[currentWorld];
}
worldChoices.forEach(button => button.addEventListener('click', () => setWorld(Number(button.dataset.world))));
function navigationWorld() {return window.SpatialGallery?.getTargetIndex() ?? currentWorld;}
document.querySelector('.world-prev').addEventListener('click', () => setWorld(navigationWorld() - 1));
document.querySelector('.world-next').addEventListener('click', () => setWorld(navigationWorld() + 1));
document.addEventListener('keydown', event => {
  if (document.body.classList.contains('is-routed') || !heroVisible || dialog.open || volumePanel.hidden === false || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    setWorld(navigationWorld() + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let swipeStart;
let suppressDragClick = false;
hero.addEventListener('pointerdown', event => {
  if (event.button !== 0 || (event.target.closest('button,a,input,select,label') && !event.target.closest('.floating-screen'))) return;
  swipeStart = {x:event.clientX, y:event.clientY, id:event.pointerId, progress:window.SpatialGallery?.getState().targetProgress, dragged:false};
});
hero.addEventListener('pointermove', event => {
  if (!swipeStart || event.pointerId !== swipeStart.id) return;
  if (event.pointerType === 'mouse' && !event.buttons) {swipeStart = undefined;hero.classList.remove('is-dragging');return;}
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  if (Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    hero.classList.add('is-dragging');
    swipeStart.dragged=true;
    if(window.SpatialGallery)window.SpatialGallery.scrub(swipeStart.progress-dx/hero.clientWidth*1.7);
    if (event.pointerType === 'mouse' && !hero.hasPointerCapture(event.pointerId)) hero.setPointerCapture(event.pointerId);
  }
});
hero.addEventListener('pointerup', event => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  const dragged=swipeStart.dragged;
  swipeStart = undefined;
  hero.classList.remove('is-dragging');
  if (dragged || (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)) {
    if(!window.SpatialGallery)setWorld(currentWorld + (dx < 0 ? 1 : -1));
    suppressDragClick = true;
    setTimeout(() => suppressDragClick = false, 200);
  }
});
hero.addEventListener('click', event => {
  if (!suppressDragClick) return;
  suppressDragClick = false;
  event.preventDefault();event.stopImmediatePropagation();
}, true);
hero.addEventListener('pointercancel', () => {swipeStart = undefined;hero.classList.remove('is-dragging');});

const exploreCursor = document.querySelector('.explore-cursor');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let pointerFrame;
let pointerPosition = {x:0, y:0};
function drawPointer() {
  pointerFrame = undefined;
  exploreCursor.style.transform = `translate3d(${pointerPosition.x - 39}px,${pointerPosition.y - 39}px,0)`;
  if (heroVisible && skyPlaying && !motionPreference.matches) {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--parallax-x', ((pointerPosition.x / rect.width - .5) * -16).toFixed(2) + 'px');
    hero.style.setProperty('--parallax-y', (((pointerPosition.y - rect.top) / rect.height - .5) * -12).toFixed(2) + 'px');
  }
}
document.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || motionPreference.matches) return;
  document.documentElement.classList.add('has-mouse');
  pointerPosition = {x:event.clientX,y:event.clientY};
  exploreCursor.classList.toggle('is-visible', Boolean(event.target.closest('.vision-card')) && !dialog.open);
  if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
}, {passive:true});
document.addEventListener('pointerout', event => {if (!event.relatedTarget) exploreCursor.classList.remove('is-visible');});
document.addEventListener('scroll', () => exploreCursor.classList.remove('is-visible'), {passive:true});
function resetPointerMotion() {
  if (!skyPlaying || motionPreference.matches || !document.documentElement.classList.contains('has-mouse')) {
    hero.style.setProperty('--parallax-x', '0px');
    hero.style.setProperty('--parallax-y', '0px');
    exploreCursor.classList.remove('is-visible');
  }
}
skyToggle.addEventListener('click', resetPointerMotion);
motionPreference.addEventListener('change', resetPointerMotion);
finePointer.addEventListener('change', resetPointerMotion);

document.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch') {
    document.documentElement.classList.remove('has-mouse');
    exploreCursor.classList.remove('is-visible');
    hero.style.setProperty('--parallax-x', '0px');
    hero.style.setProperty('--parallax-y', '0px');
  }
}, {passive:true});
