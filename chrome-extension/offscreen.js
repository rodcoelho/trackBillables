chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'play-bell') {
    const bell = document.getElementById('bell');
    bell.currentTime = 0;
    bell.play();
  }
});
