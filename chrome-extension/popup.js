// TrackBillables Popup Script

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Elements
const tabs = $$('.tab');
const panels = {
  reminder: $('#panel-reminder'),
  stopwatch: $('#panel-stopwatch'),
  off: $('#panel-off')
};
const reminderDisplay = $('#reminder-display');
const stopwatchDisplay = $('#stopwatch-display');
const reminderStartBtn = $('#reminder-start');
const reminderStopBtn = $('#reminder-stop');
const stopwatchStartBtn = $('#stopwatch-start');
const stopwatchStopBtn = $('#stopwatch-stop');
const stopwatchResetBtn = $('#stopwatch-reset');
const intervalBtns = $$('.interval-btn');
const customMinutesInput = $('#custom-minutes');
const openAppLink = $('#open-app');

// Alert style elements
const alertStyleBtns = $$('#alert-style .seg-btn');

// Schedule elements
const scheduleEnabled = $('#schedule-enabled');
const scheduleConfig = $('#schedule-config');
const scheduleStart = $('#schedule-start');
const scheduleEnd = $('#schedule-end');
const scheduleTz = $('#schedule-timezone');
const dayBtns = $$('.day-btn');
const scheduleStatus = $('#schedule-status');
const reminderControls = $('#reminder-controls');
const intervalSelector = $('#interval-selector');

let tickInterval = null;
let currentState = null;

// --- Send message to background ---

function sendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Message error:', chrome.runtime.lastError.message);
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

// --- Format time ---

function formatCountdown(remainingMs) {
  if (remainingMs <= 0) return '0:00';
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatStopwatch(elapsedMs) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// --- Timezone population ---

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland'
];

function populateTimezones() {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const allZones = [...COMMON_TIMEZONES];
  if (!allZones.includes(detected)) {
    allZones.unshift(detected);
  }
  scheduleTz.innerHTML = '';
  allZones.forEach((tz) => {
    const opt = document.createElement('option');
    opt.value = tz;
    opt.textContent = tz.replace(/_/g, ' ');
    if (tz === detected) opt.selected = true;
    scheduleTz.appendChild(opt);
  });
}

function getScheduleFromUI() {
  const days = [];
  dayBtns.forEach((btn) => {
    if (btn.classList.contains('active')) {
      days.push(parseInt(btn.dataset.day));
    }
  });
  return {
    enabled: scheduleEnabled.checked,
    startTime: scheduleStart.value || '09:00',
    endTime: scheduleEnd.value || '17:00',
    timezone: scheduleTz.value,
    days
  };
}

async function sendScheduleUpdate() {
  const schedule = getScheduleFromUI();
  const state = await sendMessage({ type: 'schedule-update', schedule });
  if (state) updateUI(state);
}

// --- UI Update ---

function updateUI(state) {
  currentState = state;

  // Update active tab
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === state.mode);
  });

  // Show correct panel
  Object.keys(panels).forEach((key) => {
    panels[key].classList.toggle('hidden', key !== state.mode);
  });

  // Reminder
  if (state.mode === 'reminder') {
    updateReminderUI(state);
  }

  // Stopwatch
  if (state.mode === 'stopwatch') {
    updateStopwatchUI(state);
  }

  // Start/stop tick interval
  clearInterval(tickInterval);
  if ((state.mode === 'reminder' && state.reminder.running) ||
      (state.mode === 'stopwatch' && state.stopwatch.running)) {
    tickInterval = setInterval(() => tick(), 1000);
  }
}

function updateReminderUI(state) {
  const rem = state.reminder;
  const schedule = rem.schedule || {};
  const scheduleOn = schedule.enabled;

  // Sync alert style buttons
  const notifyType = rem.notifyType || 'sound';
  alertStyleBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.notify === notifyType);
  });

  // Sync schedule toggle + config UI
  scheduleEnabled.checked = scheduleOn;
  scheduleConfig.classList.toggle('hidden', !scheduleOn);

  if (scheduleOn) {
    scheduleStart.value = schedule.startTime || '09:00';
    scheduleEnd.value = schedule.endTime || '17:00';
    if (schedule.timezone) {
      scheduleTz.value = schedule.timezone;
    }
    dayBtns.forEach((btn) => {
      const day = parseInt(btn.dataset.day);
      btn.classList.toggle('active', (schedule.days || []).includes(day));
    });
  }

  // Interval buttons (always visible for setting interval)
  intervalBtns.forEach((btn) => {
    const mins = parseInt(btn.dataset.minutes);
    btn.classList.toggle('active', mins === rem.intervalMinutes);
  });

  // Custom input
  const presetValues = [15, 30];
  if (!presetValues.includes(rem.intervalMinutes)) {
    customMinutesInput.value = rem.intervalMinutes;
    intervalBtns.forEach((btn) => btn.classList.remove('active'));
  } else {
    customMinutesInput.value = '';
  }

  if (scheduleOn) {
    // Hide manual controls, show timer + schedule status
    reminderControls.classList.add('hidden');
    reminderDisplay.classList.remove('hidden');

    // Disable interval changes while schedule-running
    intervalBtns.forEach((btn) => btn.disabled = rem.running);
    customMinutesInput.disabled = rem.running;

    // Timer countdown
    if (rem.running && rem.startedAt) {
      const elapsed = Date.now() - rem.startedAt;
      const total = rem.intervalMinutes * 60 * 1000;
      const remaining = Math.max(0, total - elapsed);
      reminderDisplay.textContent = formatCountdown(remaining);
    } else {
      reminderDisplay.textContent = formatCountdown(rem.intervalMinutes * 60 * 1000);
    }

    // Show status
    scheduleStatus.classList.remove('hidden');
    scheduleStatus.classList.remove('status-active', 'status-inactive');
    if (rem.running) {
      scheduleStatus.classList.add('status-active');
      scheduleStatus.textContent = `Active \u2014 reminding every ${rem.intervalMinutes}m`;
    } else {
      scheduleStatus.classList.add('status-inactive');
      scheduleStatus.textContent = 'Inactive \u2014 outside work hours';
    }
  } else {
    // Normal manual mode
    reminderDisplay.classList.remove('hidden');
    reminderControls.classList.remove('hidden');
    scheduleStatus.classList.add('hidden');

    // Start/stop buttons
    reminderStartBtn.classList.toggle('hidden', rem.running);
    reminderStopBtn.classList.toggle('hidden', !rem.running);

    // Disable interval changes while running
    intervalBtns.forEach((btn) => btn.disabled = rem.running);
    customMinutesInput.disabled = rem.running;

    // Timer display
    if (rem.running && rem.startedAt) {
      const elapsed = Date.now() - rem.startedAt;
      const total = rem.intervalMinutes * 60 * 1000;
      const remaining = Math.max(0, total - elapsed);
      reminderDisplay.textContent = formatCountdown(remaining);
    } else {
      reminderDisplay.textContent = formatCountdown(rem.intervalMinutes * 60 * 1000);
    }
  }
}

function updateStopwatchUI(state) {
  const sw = state.stopwatch;

  stopwatchStartBtn.classList.toggle('hidden', sw.running);
  stopwatchStopBtn.classList.toggle('hidden', !sw.running);
  stopwatchResetBtn.classList.toggle('hidden', sw.running || sw.accumulatedMs === 0);

  if (sw.running && sw.startedAt) {
    const elapsed = sw.accumulatedMs + (Date.now() - sw.startedAt);
    stopwatchDisplay.textContent = formatStopwatch(elapsed);
  } else {
    stopwatchDisplay.textContent = formatStopwatch(sw.accumulatedMs);
  }
}

// --- Live tick (local interval, no background messages) ---

function tick() {
  if (!currentState) return;

  if (currentState.mode === 'reminder' && currentState.reminder.running) {
    const elapsed = Date.now() - currentState.reminder.startedAt;
    const total = currentState.reminder.intervalMinutes * 60 * 1000;
    const remaining = Math.max(0, total - elapsed);
    reminderDisplay.textContent = formatCountdown(remaining);

    if (remaining <= 0) {
      // Timer might have fired; refresh state from background
      sendMessage({ type: 'get-state' }).then((state) => {
        if (state) updateUI(state);
      });
    }
  }

  if (currentState.mode === 'stopwatch' && currentState.stopwatch.running) {
    const elapsed = currentState.stopwatch.accumulatedMs +
      (Date.now() - currentState.stopwatch.startedAt);
    stopwatchDisplay.textContent = formatStopwatch(elapsed);
  }
}

// --- Event Listeners ---

// Tab clicks
tabs.forEach((tab) => {
  tab.addEventListener('click', async () => {
    const mode = tab.dataset.mode;
    const state = await sendMessage({ type: 'set-mode', mode });
    if (state) updateUI(state);
  });
});

// Interval buttons
intervalBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    const minutes = parseInt(btn.dataset.minutes);
    customMinutesInput.value = '';
    const state = await sendMessage({ type: 'reminder-set-interval', intervalMinutes: minutes });
    if (state) updateUI(state);
  });
});

// Custom interval
customMinutesInput.addEventListener('change', async () => {
  const val = parseInt(customMinutesInput.value);
  if (val >= 1 && val <= 480) {
    const state = await sendMessage({ type: 'reminder-set-interval', intervalMinutes: val });
    if (state) updateUI(state);
  }
});

// Reminder start
reminderStartBtn.addEventListener('click', async () => {
  const state = await sendMessage({ type: 'reminder-start' });
  if (state) updateUI(state);
});

// Reminder stop
reminderStopBtn.addEventListener('click', async () => {
  const state = await sendMessage({ type: 'reminder-stop' });
  if (state) updateUI(state);
});

// Stopwatch start
stopwatchStartBtn.addEventListener('click', async () => {
  const state = await sendMessage({ type: 'stopwatch-start' });
  if (state) updateUI(state);
});

// Stopwatch stop
stopwatchStopBtn.addEventListener('click', async () => {
  const state = await sendMessage({ type: 'stopwatch-stop' });
  if (state) updateUI(state);
});

// Stopwatch reset
stopwatchResetBtn.addEventListener('click', async () => {
  const state = await sendMessage({ type: 'stopwatch-reset' });
  if (state) updateUI(state);
});

// Alert style segmented control
alertStyleBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const state = await sendMessage({ type: 'set-notify-type', notifyType: btn.dataset.notify });
    if (state) updateUI(state);
  });
});

// Schedule toggle
scheduleEnabled.addEventListener('change', () => {
  scheduleConfig.classList.toggle('hidden', !scheduleEnabled.checked);
  sendScheduleUpdate();
});

// Schedule time/timezone changes
scheduleStart.addEventListener('change', sendScheduleUpdate);
scheduleEnd.addEventListener('change', sendScheduleUpdate);
scheduleTz.addEventListener('change', sendScheduleUpdate);

// Day picker buttons
dayBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    sendScheduleUpdate();
  });
});

// Open app
openAppLink.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://trackbillables.com' });
});

// --- Initialize ---

async function init() {
  populateTimezones();
  const state = await sendMessage({ type: 'get-state' });
  if (state) updateUI(state);
}

init();
