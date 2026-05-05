let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
let ringingId = null;
let audioCtx = null;
let ringingNodes = [];

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playAlarmSound() {
  const ctx = getAudioCtx();
  const frequencies = [880, 1108, 1318, 1108];
  let time = ctx.currentTime;

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time + i * 0.18);
    gain.gain.setValueAtTime(0, time + i * 0.18);
    gain.gain.linearRampToValueAtTime(0.35, time + i * 0.18 + 0.05);
    gain.gain.linearRampToValueAtTime(0, time + i * 0.18 + 0.16);

    osc.start(time + i * 0.18);
    osc.stop(time + i * 0.18 + 0.18);
    ringingNodes.push(osc);
  });
}

function stopAlarmSound() {
  ringingNodes.forEach(n => { try { n.stop(); } catch (_) {} });
  ringingNodes = [];
}

function save() {
  localStorage.setItem('alarms', JSON.stringify(alarms));
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  return `${pad(h)}:${pad(m)}`;
}

function render() {
  const list = document.getElementById('alarmItems');
  const empty = document.getElementById('emptyMsg');
  list.innerHTML = '';

  if (alarms.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  alarms.forEach((alarm, i) => {
    const li = document.createElement('li');
    li.className = 'alarm-item' + (alarm.on ? '' : ' off');
    li.dataset.id = alarm.id;

    li.innerHTML = `
      <div class="alarm-time">${formatTime(alarm.time)}</div>
      <div class="alarm-info">
        <div class="alarm-label">${alarm.label ? escHtml(alarm.label) : '&nbsp;'}</div>
      </div>
      <label class="toggle" aria-label="アラームのオン/オフ">
        <input type="checkbox" ${alarm.on ? 'checked' : ''} onchange="toggleAlarm(${i})" />
        <span class="slider"></span>
      </label>
      <button class="del-btn" onclick="deleteAlarm(${i})" aria-label="削除">✕</button>
    `;
    list.appendChild(li);
  });
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function addAlarm() {
  const timeInput = document.getElementById('alarmTime');
  const labelInput = document.getElementById('alarmLabel');
  const time = timeInput.value;

  if (!time) {
    timeInput.focus();
    return;
  }

  alarms.push({ id: Date.now(), time, label: labelInput.value.trim(), on: true });
  alarms.sort((a, b) => a.time.localeCompare(b.time));
  labelInput.value = '';
  timeInput.value = '';
  save();
  render();
}

function toggleAlarm(i) {
  alarms[i].on = !alarms[i].on;
  save();
  render();
}

function deleteAlarm(i) {
  alarms.splice(i, 1);
  save();
  render();
}

function dismissAlarm() {
  stopAlarmSound();
  document.getElementById('ringModal').classList.add('hidden');
  if (ringingId !== null) {
    const alarm = alarms.find(a => a.id === ringingId);
    if (alarm) alarm.rungAt = new Date().toDateString();
    ringingId = null;
    save();
    render();
  }
}

function updateClock() {
  const now = new Date();
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  document.getElementById('clock').textContent = `${h}:${m}:${s}`;

  if (now.getSeconds() === 0) checkAlarms(now);
}

function checkAlarms(now) {
  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const today = now.toDateString();

  alarms.forEach(alarm => {
    if (alarm.on && alarm.time === hm && alarm.rungAt !== today && ringingId === null) {
      ringingId = alarm.id;
      document.getElementById('ringTime').textContent = formatTime(alarm.time);
      document.getElementById('ringLabel').textContent = alarm.label || '';
      document.getElementById('ringModal').classList.remove('hidden');
      playAlarmSound();

      const repeat = setInterval(() => {
        if (ringingId === null) { clearInterval(repeat); return; }
        playAlarmSound();
      }, 2500);
    }
  });
}

document.getElementById('alarmTime').addEventListener('keydown', e => {
  if (e.key === 'Enter') addAlarm();
});
document.getElementById('alarmLabel').addEventListener('keydown', e => {
  if (e.key === 'Enter') addAlarm();
});

render();
setInterval(updateClock, 1000);
updateClock();
