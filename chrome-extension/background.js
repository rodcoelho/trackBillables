// TrackBillables Background Service Worker
// Manages reminder timer, stopwatch, badge updates, and offscreen audio

const DEFAULT_STATE = {
  mode: 'off',
  reminder: {
    running: false,
    intervalMinutes: 30,
    startedAt: null,
    notifyType: 'sound',
    schedule: {
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
      timezone: ''
    }
  },
  stopwatch: {
    running: false,
    startedAt: null,
    accumulatedMs: 0,
    lastFlashColor: 'green'
  }
};

// --- State helpers ---

async function getState() {
  const result = await chrome.storage.local.get('timerState');
  const state = result.timerState || { ...DEFAULT_STATE };
  // Migrate: rename pomodoro → reminder
  if (state.pomodoro && !state.reminder) {
    state.reminder = state.pomodoro;
    delete state.pomodoro;
    if (state.mode === 'pomodoro') state.mode = 'reminder';
    await setState(state);
  }
  // Ensure reminder object always exists
  if (!state.reminder) {
    state.reminder = { ...DEFAULT_STATE.reminder, schedule: { ...DEFAULT_STATE.reminder.schedule } };
    await setState(state);
  }
  if (!state.reminder.schedule) {
    state.reminder.schedule = { ...DEFAULT_STATE.reminder.schedule };
    await setState(state);
  }
  return state;
}

async function setState(state) {
  await chrome.storage.local.set({ timerState: state });
}

// --- Offscreen document for audio ---

async function ensureOffscreen() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  if (existingContexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play notification sound when timer fires'
  });
}

async function playChime() {
  try {
    await ensureOffscreen();
    chrome.runtime.sendMessage({ type: 'play-bell' });
  } catch (e) {
    console.warn('Could not play chime:', e);
  }
}

// --- Alarm handlers ---

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const state = await getState();

  if (alarm.name === 'reminder-tick') {
    await handleReminderFire(state);
  } else if (alarm.name === 'stopwatch-badge') {
    await updateStopwatchBadge(state);
  } else if (alarm.name === 'stopwatch-flash') {
    await flashStopwatchBadge(state);
  } else if (alarm.name === 'schedule-check') {
    await handleScheduleCheck(state);
  }
});

async function handleReminderFire(state) {
  const notifyType = state.reminder.notifyType || 'sound';

  if (notifyType === 'sound' || notifyType === 'both') {
    await playChime();
  }
  if (notifyType === 'popup' || notifyType === 'both') {
    chrome.tabs.create({ url: 'https://trackbillables.com' });
  }

  // Reschedule for next interval
  state.reminder.startedAt = Date.now();
  await setState(state);

  chrome.alarms.create('reminder-tick', {
    delayInMinutes: state.reminder.intervalMinutes
  });
}

async function updateStopwatchBadge(state) {
  if (state.mode !== 'stopwatch' || !state.stopwatch.running) return;

  const elapsed = state.stopwatch.accumulatedMs + (Date.now() - state.stopwatch.startedAt);
  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let text;
  if (hours > 0) {
    text = `${hours}:${String(minutes).padStart(2, '0')}`;
  } else {
    text = `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  chrome.action.setBadgeText({ text });
}

async function flashStopwatchBadge(state) {
  if (state.mode !== 'stopwatch' || !state.stopwatch.running) return;

  const newColor = state.stopwatch.lastFlashColor === 'green' ? 'orange' : 'green';
  const colorHex = newColor === 'green' ? '#4CAF50' : '#FF5722';

  state.stopwatch.lastFlashColor = newColor;
  await setState(state);

  chrome.action.setBadgeBackgroundColor({ color: colorHex });

  // Also play chime as a reminder
  await playChime();
}

// --- Schedule check ---

function isWithinWorkHours(schedule) {
  const tz = schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour').value);
  const minute = parseInt(parts.find(p => p.type === 'minute').value);

  const currentMinutes = hour * 60 + minute;
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function updateScheduleBadge(active) {
  chrome.action.setBadgeText({ text: ' ' });
  chrome.action.setBadgeBackgroundColor({ color: active ? '#22c55e' : '#9ca3af' });
}

async function handleScheduleCheck(state) {
  const schedule = state.reminder.schedule;
  if (!schedule || !schedule.enabled) return;

  const inWorkHours = isWithinWorkHours(schedule);

  updateScheduleBadge(inWorkHours);

  if (inWorkHours && !state.reminder.running) {
    // Auto-start reminder
    state.mode = 'reminder';
    state.reminder.running = true;
    state.reminder.startedAt = Date.now();

    await chrome.alarms.clear('reminder-tick');
    chrome.alarms.create('reminder-tick', {
      delayInMinutes: state.reminder.intervalMinutes
    });

    await setState(state);
  } else if (!inWorkHours && state.reminder.running) {
    // Auto-stop reminder
    state.reminder.running = false;
    state.reminder.startedAt = null;

    await chrome.alarms.clear('reminder-tick');
    await setState(state);
  }
}

// --- Clear all alarms for a mode ---

async function clearReminderAlarms() {
  await chrome.alarms.clear('reminder-tick');
  await chrome.alarms.clear('schedule-check');
}

async function clearStopwatchAlarms() {
  await chrome.alarms.clear('stopwatch-badge');
  await chrome.alarms.clear('stopwatch-flash');
}

async function clearAllAlarms() {
  await clearReminderAlarms();
  await clearStopwatchAlarms();
}

// --- Message handlers from popup ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'play-bell') return; // Ignore, for offscreen only

  handleMessage(msg).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(msg) {
  const state = await getState();

  switch (msg.type) {
    case 'get-state':
      return state;

    case 'set-mode':
      return await handleSetMode(state, msg.mode);

    case 'reminder-start':
      return await handleReminderStart(state, msg.intervalMinutes);

    case 'reminder-stop':
      return await handleReminderStop(state);

    case 'reminder-set-interval':
      state.reminder.intervalMinutes = msg.intervalMinutes;
      await setState(state);
      return state;

    case 'set-notify-type':
      state.reminder.notifyType = msg.notifyType;
      await setState(state);
      return state;

    case 'schedule-update':
      return await handleScheduleUpdate(state, msg.schedule);

    case 'stopwatch-start':
      return await handleStopwatchStart(state);

    case 'stopwatch-stop':
      return await handleStopwatchStop(state);

    case 'stopwatch-reset':
      return await handleStopwatchReset(state);

    default:
      return { error: 'Unknown message type' };
  }
}

async function handleSetMode(state, mode) {
  await clearAllAlarms();
  chrome.action.setBadgeText({ text: '' });

  // Stop any running timers and disable schedule
  if (state.reminder.running) {
    state.reminder.running = false;
    state.reminder.startedAt = null;
  }
  if (state.reminder.schedule) {
    state.reminder.schedule.enabled = false;
  }
  if (state.stopwatch.running) {
    state.stopwatch.accumulatedMs += Date.now() - state.stopwatch.startedAt;
    state.stopwatch.running = false;
    state.stopwatch.startedAt = null;
  }

  state.mode = mode;
  await setState(state);
  return state;
}

async function handleReminderStart(state, intervalMinutes) {
  if (intervalMinutes) {
    state.reminder.intervalMinutes = intervalMinutes;
  }

  state.mode = 'reminder';
  state.reminder.running = true;
  state.reminder.startedAt = Date.now();

  await clearAllAlarms();
  chrome.alarms.create('reminder-tick', {
    delayInMinutes: state.reminder.intervalMinutes
  });

  await setState(state);
  return state;
}

async function handleReminderStop(state) {
  state.reminder.running = false;
  state.reminder.startedAt = null;

  await clearReminderAlarms();
  await setState(state);
  return state;
}

async function handleScheduleUpdate(state, schedule) {
  if (!state.reminder.schedule) {
    state.reminder.schedule = { ...DEFAULT_STATE.reminder.schedule };
  }

  state.reminder.schedule.enabled = schedule.enabled;
  state.reminder.schedule.startTime = schedule.startTime || '09:00';
  state.reminder.schedule.endTime = schedule.endTime || '17:00';
  state.reminder.schedule.timezone = schedule.timezone || '';

  await chrome.alarms.clear('schedule-check');

  if (schedule.enabled) {
    // Switch to reminder mode
    state.mode = 'reminder';

    // Immediately check if within work hours and auto-start
    const inWorkHours = isWithinWorkHours(state.reminder.schedule);
    updateScheduleBadge(inWorkHours);
    if (inWorkHours && !state.reminder.running) {
      state.reminder.running = true;
      state.reminder.startedAt = Date.now();

      await chrome.alarms.clear('reminder-tick');
      chrome.alarms.create('reminder-tick', {
        delayInMinutes: state.reminder.intervalMinutes
      });
    } else if (!inWorkHours && state.reminder.running) {
      state.reminder.running = false;
      state.reminder.startedAt = null;
      await chrome.alarms.clear('reminder-tick');
    }

    // Create schedule-check alarm for ongoing checks every minute
    chrome.alarms.create('schedule-check', {
      periodInMinutes: 1
    });
  } else {
    // Stop reminder if it was auto-running
    if (state.reminder.running) {
      state.reminder.running = false;
      state.reminder.startedAt = null;
      await chrome.alarms.clear('reminder-tick');
    }
    chrome.action.setBadgeText({ text: '' });
  }

  await setState(state);
  return state;
}

async function handleStopwatchStart(state) {
  state.mode = 'stopwatch';
  state.stopwatch.running = true;
  state.stopwatch.startedAt = Date.now();
  state.stopwatch.lastFlashColor = 'green';

  await clearAllAlarms();

  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  chrome.action.setBadgeText({ text: '0:00' });

  // Update badge every 30 seconds
  chrome.alarms.create('stopwatch-badge', {
    delayInMinutes: 0.5,
    periodInMinutes: 0.5
  });

  // Flash badge color every 15 minutes
  chrome.alarms.create('stopwatch-flash', {
    delayInMinutes: 15,
    periodInMinutes: 15
  });

  await setState(state);
  return state;
}

async function handleStopwatchStop(state) {
  if (state.stopwatch.running && state.stopwatch.startedAt) {
    state.stopwatch.accumulatedMs += Date.now() - state.stopwatch.startedAt;
  }
  state.stopwatch.running = false;
  state.stopwatch.startedAt = null;

  await clearStopwatchAlarms();
  // Badge stays frozen at current value
  await setState(state);
  return state;
}

async function handleStopwatchReset(state) {
  state.stopwatch.running = false;
  state.stopwatch.startedAt = null;
  state.stopwatch.accumulatedMs = 0;
  state.stopwatch.lastFlashColor = 'green';

  await clearStopwatchAlarms();
  chrome.action.setBadgeText({ text: '' });

  await setState(state);
  return state;
}

// --- On install: initialize state ---

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  if (!state.mode) {
    await setState({ ...DEFAULT_STATE });
  } else {
    // Migrate: add schedule if missing
    if (!state.reminder.schedule) {
      state.reminder.schedule = { ...DEFAULT_STATE.reminder.schedule };
      await setState(state);
    }
  }
});

// Re-establish schedule-check alarm and badge on service worker startup
(async () => {
  const state = await getState();
  if (state.reminder.schedule && state.reminder.schedule.enabled) {
    updateScheduleBadge(isWithinWorkHours(state.reminder.schedule));
    const existing = await chrome.alarms.get('schedule-check');
    if (!existing) {
      chrome.alarms.create('schedule-check', {
        delayInMinutes: 0.1,
        periodInMinutes: 1
      });
    }
  }
})();
