// Click anywhere to open TrackBillables and close this window
document.body.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'open-app' });
  window.close();
});

// Progress bar + countdown + auto-close
const DURATION = 8;
let remaining = DURATION;
const countdownEl = document.getElementById('countdown');
const progressEl = document.getElementById('progress');
const hintEl = document.querySelector('.hint');

const tick = setInterval(() => {
  remaining--;
  countdownEl.textContent = remaining;

  // Shrink bar and shift color: green → yellow → red
  const pct = (remaining / DURATION) * 100;
  progressEl.style.width = pct + '%';
  if (remaining <= 3) {
    progressEl.style.backgroundColor = '#ef4444';
    hintEl.style.color = '#ef4444';
  } else if (remaining <= 5) {
    progressEl.style.backgroundColor = '#eab308';
    hintEl.style.color = '#eab308';
  }

  if (remaining <= 0) {
    clearInterval(tick);
    window.close();
  }
}, 1000);
