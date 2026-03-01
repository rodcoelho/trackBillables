// Click anywhere to open TrackBillables and close this window
document.body.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'open-app' });
  window.close();
});

// Countdown and auto-close
let remaining = 8;
const countdownEl = document.getElementById('countdown');
const tick = setInterval(() => {
  remaining--;
  countdownEl.textContent = remaining;
  if (remaining <= 0) {
    clearInterval(tick);
    window.close();
  }
}, 1000);
