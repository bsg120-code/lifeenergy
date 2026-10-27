// app.js - Life Energy Cloud Full Application Logic

// ==========================================
// 1. SOUND SYNTHESIS ENGINE (Web Audio API)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTap() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  playToggle(on = true) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const f1 = on ? 440 : 660;
      const f2 = on ? 880 : 330;
      osc.frequency.setValueAtTime(f1, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playUnlock() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch (e) {}
  }

  playComplete() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.2, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.4);
      });
    } catch (e) {}
  }
}

const sounds = new SoundEngine();

// ==========================================
// 1.2 ENERGY CARRIER & BACKGROUND ENGINE
// (유선 챔버 • 유선/무선 헤드셋 • 무선 이어폰 전송 및 백그라운드 수신 유지)
// ==========================================
class EnergyCarrierEngine {
  constructor() {
    this.ctx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.lfo = null;
    this.masterGain = null;
    this.lfoGain = null;
    this.isPlaying = false;
    this.wakeLock = null;
    this.silentAudio = null;
    this.frequency = 528;
    this.volume = 0.0; // [사용자 요청] 수신음 완전 소거 (무음 전송 모드)
    this.activeItemName = '';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.silentAudio) {
      // 1초 완전 무음 WAV base64 데이터로 OS 백그라운드 스레드 지속 유지
      const silentBase64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      this.silentAudio = new Audio(silentBase64);
      this.silentAudio.loop = true;
      this.silentAudio.volume = 0.0001;
    }
  }

  async acquireWakeLock() {
    try {
      if ('wakeLock' in navigator && !this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
    } catch (e) {}
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      try { this.wakeLock.release(); } catch (e) {}
      this.wakeLock = null;
    }
  }

  updateMediaSession(itemName = '양자 에너지') {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `Life Energy Cloud - ${itemName} 수신 중`,
          artist: '유선 챔버 • 유선/무선 헤드셋 • 무선 이어폰 무음 전송',
          album: '양자 에너지 자율 관리 시스템'
        });
        navigator.mediaSession.playbackState = 'playing';
        navigator.mediaSession.setActionHandler('play', () => controlActiveTimer('toggle'));
        navigator.mediaSession.setActionHandler('pause', () => controlActiveTimer('toggle'));
        navigator.mediaSession.setActionHandler('stop', () => controlActiveTimer('stop'));
      } catch (e) {}
    }
  }

  start(itemName = '양자 에너지') {
    this.activeItemName = itemName;
    this.init();
    if (!this.ctx) return;

    if (this.isPlaying) {
      this.updateMediaSession(itemName);
      this.updateHubUI(true);
      return;
    }

    try {
      const now = this.ctx.currentTime;
      this.masterGain = this.ctx.createGain();
      // [수신음 소거] 마스터 게인을 0으로 설정하여 사용자 귀에는 완전 무음이면서
      // 오디오 신호 라우팅 및 하드웨어(챔버/헤드셋/이어폰) 파이프라인은 100% 지속
      this.masterGain.gain.setValueAtTime(0, now);

      // 주 반송파 (528Hz 솔페지오 등)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(this.frequency, now);

      // 화음 보조파 (오버톤 하모닉스)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(this.frequency * 0.5, now);
      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0, now);
      this.osc2.connect(osc2Gain);
      osc2Gain.connect(this.masterGain);

      // 7.83Hz 슈만 공명 진폭 모듈레이션
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(7.83, now);
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(0, now);
      this.lfo.connect(this.lfoGain.gain);

      this.osc1.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.osc1.start(now);
      this.osc2.start(now);
      this.lfo.start(now);

      this.isPlaying = true;

      // OS 백그라운드 프로세스 고정 (완전 무음 루프 오디오)
      if (this.silentAudio) {
        this.silentAudio.play().catch(() => {});
      }

      this.acquireWakeLock();
      this.updateMediaSession(itemName);
      this.updateHubUI(true);
    } catch (e) {
      console.warn('EnergyCarrier start error:', e);
    }
  }

  stop() {
    if (!this.isPlaying) {
      this.updateHubUI(false);
      return;
    }

    try {
      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
        setTimeout(() => {
          try {
            if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); }
            if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); }
            if (this.lfo) { this.lfo.stop(); this.lfo.disconnect(); }
            if (this.masterGain) { this.masterGain.disconnect(); }
          } catch (e) {}
          this.osc1 = null;
          this.osc2 = null;
          this.lfo = null;
          this.masterGain = null;
          this.isPlaying = false;
          this.updateHubUI(false);
        }, 260);
      } else {
        this.isPlaying = false;
        this.updateHubUI(false);
      }

      if (this.silentAudio) {
        this.silentAudio.pause();
      }
      this.releaseWakeLock();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    } catch (e) {
      this.isPlaying = false;
      this.updateHubUI(false);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && this.isPlaying) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.volume * 0.22), now);
    }
  }

  setFrequency(freq) {
    this.frequency = Number(freq);
    if (this.ctx && this.isPlaying) {
      const now = this.ctx.currentTime;
      if (this.osc1) this.osc1.frequency.setValueAtTime(this.frequency, now);
      if (this.osc2) this.osc2.frequency.setValueAtTime(this.frequency * 0.5, now);
    }
  }

  updateHubUI(transmitting) {
    const hub = document.getElementById('receptionDeviceHub');
    const badge = document.getElementById('hubStatusBadge');
    const statusText = document.getElementById('hubStatusText');
    const healthBg = document.getElementById('healthBackgroundText');
    const healthDev = document.getElementById('healthDevicesSummary');

    if (hub) {
      if (transmitting) {
        hub.classList.add('transmitting');
      } else {
        hub.classList.remove('transmitting');
      }
    }

    if (badge && statusText) {
      if (transmitting) {
        badge.className = 'hub-status-badge transmitting';
        statusText.textContent = '⚡ 4개 장치 동시 송출';
      } else {
        badge.className = 'hub-status-badge standby';
        statusText.textContent = '전 장치 대기';
      }
    }

    // 각 기기 카드 뱃지 업데이트
    ['devCardChamber', 'devCardWiredHeadset', 'devCardBtHeadset', 'devCardEarbuds'].forEach(id => {
      const card = document.getElementById(id);
      if (card) {
        const badgeSpan = card.querySelector('.device-badge');
        if (badgeSpan) {
          badgeSpan.textContent = transmitting ? '수신 중 ⚡' : '수신 가능';
        }
      }
    });

    if (healthBg) {
      healthBg.textContent = transmitting 
        ? '백그라운드 지속 수신: 가동 중 (타 앱 전환 시 100% 유지)'
        : '백그라운드 지속 수신: 켜짐 (타 앱 전환 시 유지)';
    }

    if (healthDev) {
      healthDev.textContent = transmitting ? '전 수신 장치 무음 전송 중' : '전 수신 장치 무음 연결됨';
    }
  }
}

const energyCarrier = new EnergyCarrierEngine();


// ==========================================
// 2. STATE MANAGEMENT & DATA MODELS
// ==========================================
// 타이머 구성:
// 1) 기본 충전 (30분)
// 2) 돼지고기 (22분)
// 3) 소고기 (41분)
// 4) 빠른 휴식 (15분)
// 5) 고객설정 타이머 (1~180분 자유 조절, 직접입력)
// 6) 고형체 (8시간)
// 7) 액상 (72시간)
// 8) 생체에너지충전 (연속 공급, 종료버튼)
const DEFAULT_SOURCES = [
  {
    id: 'basic',
    name: '기본 충전 (Basic Charge)',
    sub: '1x 일상 활력 • 30분 기본 밸런스 회복',
    icon: '⚡',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    initialMinutes: 30,
    remainingSeconds: 30 * 60,
    isActive: false,
    rate: 1.0,
    totalSupplied: 1200,
    isContinuous: false,
    unit: 'minutes',
    minVal: 1,
    maxVal: 120,
    stepVal: 1,
    quickDeltas: [
      { label: '-1분', sec: -60 },
      { label: '+1분', sec: 60 },
      { label: '+5분', sec: 300 }
    ]
  },
  {
    id: 'pork',
    name: '돼지고기 (Pork Precision)',
    sub: '22분 정밀 타이머 • 최적 심부 조리 및 활력 보충',
    icon: '🥓',
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    initialMinutes: 22,
    remainingSeconds: 22 * 60,
    isActive: false,
    rate: 1.2,
    totalSupplied: 1320,
    isContinuous: false,
    unit: 'minutes',
    minVal: 1,
    maxVal: 120,
    stepVal: 1,
    quickDeltas: [
      { label: '-1분', sec: -60 },
      { label: '+1분', sec: 60 },
      { label: '+5분', sec: 300 }
    ]
  },
  {
    id: 'beef',
    name: '소고기 (Beef Master)',
    sub: '41분 정밀 타이머 • 프리미엄 숙성 & 균일 열순환',
    icon: '🥩',
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)',
    initialMinutes: 41,
    remainingSeconds: 41 * 60,
    isActive: false,
    rate: 1.5,
    totalSupplied: 2460,
    isContinuous: false,
    unit: 'minutes',
    minVal: 1,
    maxVal: 120,
    stepVal: 1,
    quickDeltas: [
      { label: '-1분', sec: -60 },
      { label: '+1분', sec: 60 },
      { label: '+5분', sec: 300 }
    ]
  },
  {
    id: 'rest',
    name: '빠른 휴식 (Quick Rest)',
    sub: '1.5x 파워 냅 • 15분 급속 생체 리셋',
    icon: '🌙',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    initialMinutes: 15,
    remainingSeconds: 15 * 60,
    isActive: false,
    rate: 1.5,
    totalSupplied: 900,
    isContinuous: false,
    unit: 'minutes',
    minVal: 1,
    maxVal: 120,
    stepVal: 1,
    quickDeltas: [
      { label: '-1분', sec: -60 },
      { label: '+1분', sec: 60 },
      { label: '+5분', sec: 300 }
    ]
  },
  {
    id: 'custom',
    name: '고객설정 타이머 (Custom Preset)',
    sub: '사용자 맞춤 시간 설정 • 1분~180분 자유 조절 및 정밀 수신',
    icon: '⏱️',
    color: '#ffb703',
    glow: 'rgba(255, 183, 3, 0.45)',
    initialMinutes: 20,
    remainingSeconds: 20 * 60,
    isActive: false,
    rate: 1.0,
    totalSupplied: 1200,
    isContinuous: false,
    unit: 'minutes',
    minVal: 1,
    maxVal: 180,
    stepVal: 1,
    quickDeltas: [
      { label: '-5분', sec: -300 },
      { label: '-1분', sec: -60 },
      { label: '+1분', sec: 60 },
      { label: '+5분', sec: 300 },
      { label: '+10분', sec: 600 }
    ]
  },
  {
    id: 'solid',
    name: '고형체 (Solid Body Timer)',
    sub: '8시간 정밀 안정화 • 고밀도 바이오 고형체 숙성 및 충전',
    icon: '💎',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.4)',
    initialMinutes: 8 * 60,
    remainingSeconds: 8 * 3600,
    isActive: false,
    rate: 1.0,
    totalSupplied: 28800,
    isContinuous: false,
    unit: 'hours',
    minVal: 1,
    maxVal: 24,
    stepVal: 1,
    quickDeltas: [
      { label: '-30분', sec: -1800 },
      { label: '+1시간', sec: 3600 },
      { label: '+2시간', sec: 7200 }
    ]
  },
  {
    id: 'liquid',
    name: '액상 (Liquid Phase Timer)',
    sub: '72시간 초장기 안정화 • 액상 추출 및 고농도 용해 반응',
    icon: '💧',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.4)',
    initialMinutes: 72 * 60,
    remainingSeconds: 72 * 3600,
    isActive: false,
    rate: 1.0,
    totalSupplied: 86400,
    isContinuous: false,
    unit: 'hours',
    minVal: 1,
    maxVal: 120,
    stepVal: 1,
    quickDeltas: [
      { label: '-1시간', sec: -3600 },
      { label: '+1시간', sec: 3600 },
      { label: '+6시간', sec: 21600 }
    ]
  },
  {
    id: 'bio_continuous',
    name: '생체에너지충전 (Bio Energy Stream)',
    sub: '연속 공급 모드 • 정지 전까지 무제한 실시간 스트림',
    icon: '🧬',
    color: '#00f2fe',
    glow: 'rgba(0, 242, 254, 0.45)',
    initialMinutes: 0,
    remainingSeconds: 0,
    elapsedSeconds: 0,
    isActive: false,
    rate: 2.0,
    totalSupplied: 1800,
    isContinuous: true
  }
];

class AppState {
  constructor() {
    this.sources = JSON.parse(JSON.stringify(DEFAULT_SOURCES));
    this.currentScreen = 'timer';
    this.isLocked = false;
    const savedPin = localStorage.getItem('life_energy_pin');
    this.pinCode = (!savedPin || savedPin === '1234') ? '5098' : savedPin;
    localStorage.setItem('life_energy_pin', this.pinCode);
    this.pinInput = '';
    this.lastTickTime = Date.now();
    this.receivingActive = true;
    this.receivingPackets = 1420;
    this.hourlyStats = [35, 45, 20, 65, 80, 55, 90, 75, 40, 85, 95, 110];
  }

  savePin(pin) {
    this.pinCode = pin;
    localStorage.setItem('life_energy_pin', pin);
  }

  resetAllData() {
    this.sources = JSON.parse(JSON.stringify(DEFAULT_SOURCES));
    this.hourlyStats = [10, 20, 15, 30, 25, 40, 35, 50, 45, 60, 55, 70];
  }
}

const state = new AppState();

// ==========================================
// 3. BACKGROUND WORKER & PRECISION TIMER
// ==========================================
let timerWorker = null;

function setupTimerWorker() {
  const workerBlob = new Blob([
    `let timer = null;
    self.onmessage = function(e) {
      if (e.data === 'start') {
        if (!timer) timer = setInterval(() => self.postMessage('tick'), 1000);
      } else if (e.data === 'stop') {
        if (timer) { clearInterval(timer); timer = null; }
      }
    };`
  ], { type: 'application/javascript' });

  try {
    timerWorker = new Worker(URL.createObjectURL(workerBlob));
    timerWorker.onmessage = () => onTimerTick();
  } catch (err) {
    console.warn('Worker initialization fallback to setInterval:', err);
    setInterval(onTimerTick, 1000);
  }
}

function updateWorkerState() {
  const activeItem = state.sources.find(s => s.isActive);
  const anyActive = !!activeItem;

  if (timerWorker) {
    timerWorker.postMessage(anyActive ? 'start' : 'stop');
  }

  if (anyActive) {
    energyCarrier.start(activeItem.name);
  } else {
    energyCarrier.stop();
  }
}

// 수신 장치 허브 슬라이더 및 선택 변경 헬퍼
function changeEnergyVolume(val) {
  const num = Number(val);
  const display = document.getElementById('energyVolumeVal');
  if (display) display.textContent = `${num}%`;
  energyCarrier.setVolume(num / 100);
}

function changeEnergyFrequency(freq) {
  energyCarrier.setFrequency(Number(freq));
}

// 백그라운드 전환 및 다른 앱 복귀 시 실시간 동기화
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const now = Date.now();
    const deltaSec = Math.max(0, Math.round((now - state.lastTickTime) / 1000));
    if (deltaSec >= 1 && state.sources.some(s => s.isActive)) {
      onTimerTick();
    }
    if (energyCarrier.isPlaying && energyCarrier.ctx && energyCarrier.ctx.state === 'suspended') {
      energyCarrier.ctx.resume().catch(() => {});
    }
    if (state.sources.some(s => s.isActive)) {
      energyCarrier.acquireWakeLock();
    }
  }
});

// 외부 오디오 장치 (유선 챔버/헤드셋, 무선 블루투스 이어폰 등) 연결 감지
if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
  navigator.mediaDevices.ondevicechange = () => {
    console.log('[Life Energy Cloud] 오디오 출력 수신 장치 변경 감지됨');
    if (energyCarrier.isPlaying) {
      energyCarrier.init();
    }
  };
}


function onTimerTick() {
  const now = Date.now();
  const deltaSec = Math.round((now - state.lastTickTime) / 1000) || 1;
  state.lastTickTime = now;

  state.sources.forEach(src => {
    if (src.isActive) {
      if (src.isContinuous) {
        // 연속 모드: 경과 시간 카운트업
        src.elapsedSeconds = (src.elapsedSeconds || 0) + deltaSec;
        src.totalSupplied += deltaSec;
      } else {
        // 일반 타이머: 카운트다운
        if (src.remainingSeconds > 0) {
          src.remainingSeconds = Math.max(0, src.remainingSeconds - deltaSec);
          src.totalSupplied += deltaSec;
          if (src.remainingSeconds === 0) {
            src.isActive = false;
            sounds.playComplete();
            showNotification(`[Life Energy Cloud] ${src.name} 완료!`);
            updateWorkerState();
          }
        }
      }
    }
  });

  if (state.receivingActive) {
    state.receivingPackets += Math.floor(Math.random() * 3) + 1;
    const rxCount = document.getElementById('rxPacketCount');
    if (rxCount) rxCount.textContent = state.receivingPackets.toLocaleString();
  }

  renderTimerUI();
  updatePersistentBar();
  updateIslandNotch();
  if (state.currentScreen === 'dashboard') renderDashboardUI();
}

function showNotification(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Life Energy Cloud', { body: msg, icon: '⚡' });
  }
}

// ==========================================
// 4. UI FORMATTERS & HELPERS
// ==========================================
// 초를 MM:SS 또는 HH:MM:SS 로 포맷팅
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatHoursMinutesSeconds(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatHoursMinutes(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

// ==========================================
// 5. SCREEN RENDERING LOGIC
// ==========================================
function switchScreen(screenName) {
  sounds.playTap();
  state.currentScreen = screenName;

  document.querySelectorAll('.screen-view').forEach(view => {
    view.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${screenName}`);
  if (activeView) activeView.classList.add('active');

  document.querySelectorAll('.nav-tab-item').forEach(tab => {
    if (tab.dataset.screen === screenName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  if (screenName === 'dashboard') {
    renderDashboardUI();
    renderChart();
  }
  if (screenName === 'receiving') {
    setTimeout(resizeQuantumCanvases, 50);
  }
}

function renderTimerUI() {
  const sourcesContainer = document.getElementById('sourcesGrid');
  if (!sourcesContainer) return;

  let activeCount = 0;
  let totalRemainingSec = 0;

  state.sources.forEach(src => {
    if (src.isActive) {
      activeCount++;
      if (!src.isContinuous) {
        totalRemainingSec += src.remainingSeconds;
      }
    }

    const card = document.getElementById(`source-card-${src.id}`);
    if (card) {
      card.classList.toggle('is-active', src.isActive);
      card.classList.toggle('is-active-running', src.isActive);

      if (src.isContinuous) {
        const counterEl = card.querySelector('.continuous-timer-display');
        if (counterEl) {
          counterEl.textContent = formatHoursMinutesSeconds(src.elapsedSeconds || 0);
        }
        const stopBtn = card.querySelector('.btn-bio-stop');
        if (stopBtn) {
          stopBtn.style.opacity = src.isActive ? '1' : '0.6';
        }
      } else {
        const counterEl = card.querySelector('.time-counter');
        if (counterEl) counterEl.textContent = formatTime(src.remainingSeconds);

        const rangeInput = card.querySelector('.time-range-input');
        if (rangeInput && !src.isActive) {
          if (src.unit === 'hours') {
            rangeInput.value = (src.remainingSeconds / 3600).toFixed(1);
          } else {
            rangeInput.value = Math.ceil(src.remainingSeconds / 60);
          }
        }
      }

      const toggleInput = card.querySelector('.toggle-switch input');
      if (toggleInput && toggleInput.checked !== src.isActive) {
        toggleInput.checked = src.isActive;
      }
    }
  });

  const activeTag = document.getElementById('activeSourcesCount');
  if (activeTag) {
    activeTag.textContent = activeCount > 0 ? '⚡ 수신 파형 활성' : '⏸️ 타이머 미연결 (멈춤)';
    activeTag.style.background = activeCount > 0 ? 'rgba(0, 245, 212, 0.2)' : 'rgba(100, 116, 139, 0.2)';
    activeTag.style.borderColor = activeCount > 0 ? 'rgba(0, 245, 212, 0.5)' : 'rgba(100, 116, 139, 0.35)';
    activeTag.style.color = activeCount > 0 ? '#00f5d4' : '#94a3b8';
  }

  // Update Waveform Pulse Dot & Card Status
  const waveCard = document.querySelector('.dual-waveforms-card');
  const wavePulseDot = waveCard ? waveCard.querySelector('.pulse-dot') : null;
  if (waveCard) waveCard.classList.toggle('wave-active', activeCount > 0);
  if (wavePulseDot) {
    if (activeCount > 0) {
      wavePulseDot.style.background = 'var(--accent-emerald)';
      wavePulseDot.style.boxShadow = '0 0 10px var(--accent-emerald)';
      wavePulseDot.style.animation = 'pulse-ring 1.5s infinite';
    } else {
      wavePulseDot.style.background = '#64748b';
      wavePulseDot.style.boxShadow = 'none';
      wavePulseDot.style.animation = 'none';
    }
  }

  const totalTimeEl = document.getElementById('totalActiveTimeDisplay');
  if (totalTimeEl) {
    const hasContinuous = state.sources.some(s => s.id === 'bio_continuous' && s.isActive);
    if (hasContinuous && totalRemainingSec === 0) {
      totalTimeEl.textContent = '연속 가동';
    } else {
      totalTimeEl.textContent = formatTime(totalRemainingSec);
    }
  }

  // Update Waveform Labels & Status Badges
  const labelCore = document.getElementById('labelCoreWave');
  const labelCoreStatus = document.getElementById('labelCoreStatus');
  const labelOsc = document.getElementById('labelOscWave');
  const labelOscStatus = document.getElementById('labelOscStatus');
  if (labelCore) {
    labelCore.textContent = '01. 코어 전송 빔';
  }
  if (labelCoreStatus) {
    labelCoreStatus.innerHTML = activeCount > 0 
      ? '<span style="color:#00f5d4; background:rgba(0,245,212,0.18); padding:1px 6px; border-radius:4px; border:1px solid rgba(0,245,212,0.5); font-weight:700;">⚡ 전송 펄스 활성</span>' 
      : '<span style="color:#94a3b8; background:rgba(148,163,184,0.12); padding:1px 6px; border-radius:4px; border:1px solid rgba(148,163,184,0.25);">⏸️ 동작 정지 (대기)</span>';
  }
  if (labelOsc) {
    labelOsc.textContent = '02. 고주파 간섭계';
  }
  if (labelOscStatus) {
    labelOscStatus.innerHTML = activeCount > 0 
      ? '<span style="color:#f72585; background:rgba(247,37,133,0.18); padding:1px 6px; border-radius:4px; border:1px solid rgba(247,37,133,0.5); font-weight:700;">🌊 간섭 파형 동기화</span>' 
      : '<span style="color:#94a3b8; background:rgba(148,163,184,0.12); padding:1px 6px; border-radius:4px; border:1px solid rgba(148,163,184,0.25);">⏸️ 파형 종료 (FLATLINE)</span>';
  }

  // Update Single Timer Action Toggle Button
  const btnActiveToggle = document.getElementById('btnActiveToggle');
  if (btnActiveToggle) {
    if (activeCount > 0) {
      btnActiveToggle.textContent = '⏸ 일시정지 (가동 중)';
      btnActiveToggle.style.background = 'rgba(239, 68, 68, 0.2)';
      btnActiveToggle.style.borderColor = 'rgba(239, 68, 68, 0.6)';
    } else {
      btnActiveToggle.textContent = '▶ 타이머 시작';
      btnActiveToggle.style.background = '';
      btnActiveToggle.style.borderColor = '';
    }
  }

  // Update Telemetry on Top Waveform
  const fluxRateEl = document.getElementById('timerFluxRate');
  if (fluxRateEl) {
    fluxRateEl.textContent = activeCount > 0 ? `4.59 PFLOPS [실시간 전송]` : '3.84 PFLOPS';
  }

  // Update Active Timers Spotlight Panel (파형 바로 아래 활성화된 항목 화면)
  const spotlightContainer = document.getElementById('activeTimersSpotlight');
  const standbyMsg = document.getElementById('spotlightStandbyMsg');
  const activeContent = document.getElementById('spotlightActiveContent');
  const itemsList = document.getElementById('spotlightItemsList');
  const countBadge = document.getElementById('spotlightCountBadge');

  if (spotlightContainer && standbyMsg && activeContent && itemsList) {
    const activeList = state.sources.filter(s => s.isActive);
    if (activeList.length > 0) {
      spotlightContainer.classList.remove('standby');
      spotlightContainer.classList.add('active');
      standbyMsg.classList.add('hidden');
      activeContent.classList.remove('hidden');
      if (countBadge) countBadge.textContent = '단독 가동 중';

      const activeItem = activeList[0];
      const timeDisplay = activeItem.isContinuous 
        ? formatHoursMinutesSeconds(activeItem.elapsedSeconds || 0)
        : formatTime(activeItem.remainingSeconds);

      // [깜빡임 완전 방지] 기존 카드가 동일 항목이면 시간 텍스트만 업데이트하여 DOM 재구성 깜빡임 제거
      const existingCard = itemsList.querySelector(`[data-spotlight-id="${activeItem.id}"]`);
      if (existingCard) {
        const timeEl = existingCard.querySelector('.spotlight-item-time');
        if (timeEl && timeEl.textContent !== timeDisplay) {
          timeEl.textContent = timeDisplay;
        }
      } else {
        itemsList.innerHTML = `
          <div class="spotlight-item-card" data-spotlight-id="${activeItem.id}" style="--item-color: ${activeItem.color};">
            <div class="spotlight-item-left">
              <span class="spotlight-item-icon">${activeItem.icon}</span>
              <div>
                <div class="spotlight-item-title">${activeItem.name}</div>
                <div class="spotlight-item-desc">${activeItem.sub}</div>
              </div>
            </div>
            <div class="spotlight-item-right">
              <span class="spotlight-item-time">${timeDisplay}</span>
              <button class="spotlight-stop-btn" onclick="${activeItem.isContinuous ? `stopContinuousSource('${activeItem.id}')` : `toggleSource('${activeItem.id}', false)`}">정지</button>
            </div>
          </div>
        `;
      }
    } else {
      spotlightContainer.classList.add('standby');
      spotlightContainer.classList.remove('active');
      standbyMsg.classList.remove('hidden');
      activeContent.classList.add('hidden');
      itemsList.innerHTML = '';
    }
  }
}

function initSourcesCards() {
  const container = document.getElementById('sourcesGrid');
  if (!container) return;

  container.innerHTML = state.sources.map(src => {
    if (src.isContinuous) {
      // 생체에너지충전 (연속 공급 모드 + 전용 종료 버튼)
      return `
        <div id="source-card-${src.id}" class="source-card" style="--card-accent: ${src.color}; --card-glow: ${src.glow};">
          <div class="source-header-row">
            <div class="source-meta">
              <div class="source-icon">${src.icon}</div>
              <div class="source-name">
                <div style="display:flex; align-items:center; gap:6px;">
                  <h3>${src.name}</h3>
                  <span class="continuous-badge">♾️ 연속 공급</span>
                </div>
                <p>${src.sub}</p>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" data-id="${src.id}" ${src.isActive ? 'checked' : ''}>
              <span class="slider-knob"></span>
            </label>
          </div>

          <div class="continuous-status-row">
            <div>
              <span style="font-size:0.7rem; color:var(--text-muted); display:block;">연속 가동 시간</span>
              <span class="continuous-timer-display" style="font-family:var(--font-mono); font-size:1.35rem; font-weight:700; color:var(--accent-cyan);">
                ${formatHoursMinutesSeconds(src.elapsedSeconds || 0)}
              </span>
            </div>
            <button class="btn-bio-stop" onclick="stopContinuousSource('${src.id}')" title="생체에너지 연속 충전 종료">
              <span>⏹️ 충전 종료</span>
            </button>
          </div>
        </div>
      `;
    }

    // 일반 및 장기 정밀 타이머 카드: 슬라이더 + 퀵 조정 버튼
    const sliderValue = src.unit === 'hours' 
      ? (src.remainingSeconds / 3600).toFixed(1) 
      : Math.ceil(src.remainingSeconds / 60);

    const quickButtonsHtml = (src.quickDeltas || []).map(btn => `
      <button class="adj-btn" onclick="adjustSourceTime('${src.id}', ${btn.sec})">${btn.label}</button>
    `).join('');

    return `
      <div id="source-card-${src.id}" class="source-card" style="--card-accent: ${src.color}; --card-glow: ${src.glow};">
        <div class="source-header-row">
          <div class="source-meta">
            <div class="source-icon">${src.icon}</div>
            <div class="source-name">
              <h3>${src.name}</h3>
              <p>${src.sub}</p>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" data-id="${src.id}" ${src.isActive ? 'checked' : ''}>
            <span class="slider-knob"></span>
          </label>
        </div>

        <div class="timer-slider-row">
          <input type="range" class="time-range-input" data-id="${src.id}" min="${src.minVal}" max="${src.maxVal}" step="${src.stepVal}" value="${sliderValue}">
        </div>

        <div class="timer-details-row">
          <span class="time-counter" ${src.id === 'custom' ? `onclick="promptCustomMinutes('${src.id}')" title="클릭하여 분 단위 직접 입력" style="cursor:pointer;"` : ''}>${formatTime(src.remainingSeconds)}</span>
          <div class="quick-adj-buttons">
            ${quickButtonsHtml}
            ${src.id === 'custom' ? `<button class="adj-btn" style="border-color:#ffb703; color:#ffb703; font-weight:700;" onclick="promptCustomMinutes('${src.id}')">✏️ 직접입력</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach toggle listeners
  container.querySelectorAll('.toggle-switch input').forEach(input => {
    input.addEventListener('change', (e) => {
      const srcId = e.target.dataset.id;
      toggleSource(srcId, e.target.checked);
    });
  });

  // Attach slider input listeners
  container.querySelectorAll('.time-range-input').forEach(range => {
    range.addEventListener('input', (e) => {
      const srcId = e.target.dataset.id;
      const val = parseFloat(e.target.value);
      setSourceValue(srcId, val);
    });
  });
}

function toggleSource(id, active) {
  const target = state.sources.find(s => s.id === id);
  if (!target) return;
  sounds.playToggle(active);

  if (active) {
    // [단일 타이머 독점 가동] 선정된 타이머 가동 시 다른 모든 타이머 즉시 비활성화 (동시 활성화 원천 차단)
    state.sources.forEach(s => {
      if (s.id !== id) {
        s.isActive = false;
      }
    });
    target.isActive = true;
  } else {
    target.isActive = false;
  }

  state.lastTickTime = Date.now();
  updateWorkerState();
  renderTimerUI();
  updatePersistentBar();
  updateIslandNotch();
}

function stopContinuousSource(id) {
  const src = state.sources.find(s => s.id === id);
  if (!src) return;
  sounds.playTap();
  src.isActive = false;
  sounds.playComplete();
  alert(`⏹️ [${src.name}] 충전이 안전하게 종료되었습니다.\n총 연속 충전 시간: ${formatHoursMinutesSeconds(src.elapsedSeconds || 0)}`);
  updateWorkerState();
  renderTimerUI();
  updatePersistentBar();
  updateIslandNotch();
}

function setSourceValue(id, val) {
  const src = state.sources.find(s => s.id === id);
  if (!src) return;
  if (src.unit === 'hours') {
    src.remainingSeconds = Math.round(val * 3600);
    src.initialMinutes = Math.round(val * 60);
  } else {
    src.remainingSeconds = Math.round(val * 60);
    src.initialMinutes = Math.round(val);
  }
  renderTimerUI();
}

function adjustSourceTime(id, secondsDelta) {
  sounds.playTap();
  const src = state.sources.find(s => s.id === id);
  if (!src) return;
  src.remainingSeconds = Math.max(0, src.remainingSeconds + secondsDelta);
  renderTimerUI();
}

function promptCustomMinutes(id) {
  sounds.playTap();
  const src = state.sources.find(s => s.id === id);
  if (!src) return;
  const currentMin = Math.round(src.remainingSeconds / 60);
  const input = prompt(`⏱️ [고객설정 타이머 시간 직접 설정]\n원하시는 시간을 분(minute) 단위로 입력하세요 (1 ~ 300분):`, currentMin);
  if (input !== null && input.trim() !== '') {
    const num = parseInt(input.trim(), 10);
    if (!isNaN(num) && num > 0) {
      src.remainingSeconds = num * 60;
      src.initialMinutes = num;
      if (num > src.maxVal) src.maxVal = num;
      renderTimerUI();
      const card = document.getElementById(`source-card-${src.id}`);
      if (card) {
        const rangeInput = card.querySelector('.time-range-input');
        if (rangeInput) {
          rangeInput.max = src.maxVal;
          rangeInput.value = num;
        }
      }
      sounds.playComplete();
    } else {
      alert('⚠️ 1 이상의 올바른 숫자를 입력해 주세요 (예: 25, 45, 60)');
    }
  }
}

// [단일 타이머 제어 함수] 1개 타이머만 일시정지/재개/정지/리셋
function controlActiveTimer(action) {
  sounds.playTap();
  const runningItem = state.sources.find(s => s.isActive);

  if (action === 'toggle') {
    if (runningItem) {
      // 현재 가동 중인 타이머 일시정지
      runningItem.isActive = false;
    } else {
      // 가동 중인 타이머가 없으면 후보 1개만 단독 시작
      const candidate = state.sources.find(s => !s.isContinuous && s.remainingSeconds > 0) || state.sources[0];
      if (candidate) {
        state.sources.forEach(s => { s.isActive = false; });
        candidate.isActive = true;
      }
    }
  } else if (action === 'stop') {
    // 모든 타이머 정지 (가동 중인 단일 타이머 중단)
    state.sources.forEach(s => s.isActive = false);
  } else if (action === 'reset') {
    // 전체 정지 및 타이머 기본 시간 리셋
    state.sources.forEach(s => {
      s.isActive = false;
      if (s.isContinuous) {
        s.elapsedSeconds = 0;
      } else {
        s.remainingSeconds = s.initialMinutes * 60;
      }
    });
  }

  state.lastTickTime = Date.now();
  updateWorkerState();
  renderTimerUI();
  updatePersistentBar();
  updateIslandNotch();
}

// 구버전 및 HTML 호환용 별칭
function controlAllSources(action) {
  controlActiveTimer(action);
}

// ==========================================
// 6. PERSISTENT BAR & DYNAMIC ISLAND
// ==========================================
function updatePersistentBar() {
  const bar = document.getElementById('persistentEnergyBar');
  if (!bar) return;

  const activeSources = state.sources.filter(s => s.isActive);
  if (activeSources.length > 0 && state.currentScreen !== 'timer') {
    bar.classList.add('visible');
    const totalSec = activeSources.filter(s => !s.isContinuous).reduce((acc, s) => acc + s.remainingSeconds, 0);
    const hasContinuous = activeSources.some(s => s.isContinuous);
    
    document.getElementById('barActiveText').textContent = `${activeSources.length}개 공급원 가동 중`;
    if (totalSec > 0) {
      document.getElementById('barTimeRemaining').textContent = formatTime(totalSec);
    } else if (hasContinuous) {
      document.getElementById('barTimeRemaining').textContent = '연속 공급 중';
    } else {
      document.getElementById('barTimeRemaining').textContent = '00:00';
    }
  } else {
    bar.classList.remove('visible');
  }
}

function updateIslandNotch() {
  const island = document.getElementById('dynamicIsland');
  if (!island) return;
  const anyActive = state.sources.some(s => s.isActive);
  island.classList.toggle('active-pulse', anyActive);
}

// ==========================================
// 7. REAL-TIME CANVAS VISUALIZERS (ECG & CHART)
// ==========================================
let ecgCanvas, ecgCtx;
let ecgOffset = 0;

function initECG() {
  ecgCanvas = document.getElementById('ecgCanvas');
  if (!ecgCanvas) return;
  ecgCtx = ecgCanvas.getContext('2d');
  
  function resize() {
    ecgCanvas.width = ecgCanvas.parentElement.clientWidth;
    ecgCanvas.height = ecgCanvas.parentElement.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    if (!ecgCtx) return;
    const w = ecgCanvas.width;
    const h = ecgCanvas.height;
    const anyActive = state.sources.some(s => s.isActive);

    ecgCtx.clearRect(0, 0, w, h);

    // Grid lines
    ecgCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ecgCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ecgCtx.beginPath(); ecgCtx.moveTo(x, 0); ecgCtx.lineTo(x, h); ecgCtx.stroke();
    }
    for (let y = 0; y < h; y += 15) {
      ecgCtx.beginPath(); ecgCtx.moveTo(0, y); ecgCtx.lineTo(w, y); ecgCtx.stroke();
    }

    // Waveform
    ecgCtx.beginPath();
    ecgCtx.strokeStyle = anyActive ? '#00f2fe' : 'rgba(0, 242, 254, 0.4)';
    ecgCtx.lineWidth = anyActive ? 2.2 : 1.2;
    ecgCtx.shadowColor = anyActive ? 'rgba(0, 242, 254, 0.8)' : 'transparent';
    ecgCtx.shadowBlur = anyActive ? 8 : 0;

    const mid = h / 2;
    const speed = anyActive ? 2.5 : 1.0;
    ecgOffset += speed;

    for (let x = 0; x < w; x++) {
      const pos = (x + ecgOffset) % 180;
      let y = mid;

      if (pos > 80 && pos < 100) {
        // QRS complex spike
        const p = (pos - 80) / 20;
        if (p < 0.2) y = mid + 6;
        else if (p < 0.5) y = mid - (anyActive ? 24 : 12);
        else if (p < 0.7) y = mid + (anyActive ? 18 : 8);
        else y = mid - 4;
      } else if (pos > 120 && pos < 145) {
        // T-wave
        y = mid - Math.sin(((pos - 120) / 25) * Math.PI) * (anyActive ? 8 : 4);
      } else {
        y = mid + Math.sin((x + ecgOffset) * 0.05) * 2;
      }

      if (x === 0) ecgCtx.moveTo(x, y);
      else ecgCtx.lineTo(x, y);
    }
    ecgCtx.stroke();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

function renderChart() {
  const canvas = document.getElementById('dashboardChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.parentElement.clientWidth;
  const h = 140;
  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);

  const data = state.hourlyStats;
  const maxVal = Math.max(...data, 120);
  const stepX = (w - 30) / (data.length - 1);

  // Gradient area
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
  grad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

  ctx.beginPath();
  data.forEach((val, i) => {
    const x = 15 + i * stepX;
    const y = h - 20 - (val / maxVal) * (h - 40);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(15 + (data.length - 1) * stepX, h - 20);
  ctx.lineTo(15, h - 20);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 2.5;
  data.forEach((val, i) => {
    const x = 15 + i * stepX;
    const y = h - 20 - (val / maxVal) * (h - 40);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  data.forEach((val, i) => {
    const x = 15 + i * stepX;
    const y = h - 20 - (val / maxVal) * (h - 40);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function renderDashboardUI() {
  const totalSuppliedSec = state.sources.reduce((acc, s) => acc + s.totalSupplied, 0);
  const activeCount = state.sources.filter(s => s.isActive).length;

  const kwh = (totalSuppliedSec * 0.00028).toFixed(3);

  document.getElementById('dashTotalSupplied').textContent = `${kwh} kWh`;
  document.getElementById('dashActiveCount').textContent = `${activeCount} 개`;
  document.getElementById('dashEfficiencyScore').textContent = `${Math.min(99, 85 + activeCount * 2)}%`;

  // Render Category distribution
  const distContainer = document.getElementById('categoryDistribution');
  if (distContainer) {
    distContainer.innerHTML = state.sources.map(s => {
      const pct = totalSuppliedSec > 0 ? Math.round((s.totalSupplied / totalSuppliedSec) * 100) : 14;
      return `
        <div class="dist-item">
          <div style="display:flex; align-items:center; gap:8px;">
            <span>${s.icon}</span>
            <span style="font-size:0.8rem; font-weight:600;">${s.name.split(' ')[0]}</span>
          </div>
          <div style="display:flex; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-secondary);">${formatHoursMinutes(s.totalSupplied)} (${pct}%)</span>
            <div class="dist-bar-bg">
              <div class="dist-bar-fill" style="width: ${pct}%; background: ${s.color};"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ==========================================
// 8. QUANTUM ENERGY CORE & WAVEFORM DYNAMICS
// ==========================================
const quantumState = {
  mode: 'superconducting', // superconducting, resonance, burst
  frequency: 2.4,
  amplitude: 45,
  speed: 1.25,
  harmonics: 3,
  pointer: {
    x: null,
    y: null,
    active: false,
    energyPulse: 0
  },
  time: 0,
  audioEnabled: false
};

// Web Audio API Synthesizer for futuristic quantum hum
let qAudioCtx = null;
let qOscPrimary = null;
let qOscHarmonic = null;
let qGainNode = null;

function initQuantumAudio() {
  if (qAudioCtx) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    qAudioCtx = new AudioContext();

    qGainNode = qAudioCtx.createGain();
    qGainNode.gain.setValueAtTime(0.001, qAudioCtx.currentTime);

    qOscPrimary = qAudioCtx.createOscillator();
    qOscPrimary.type = 'sine';
    qOscPrimary.frequency.setValueAtTime(140, qAudioCtx.currentTime);

    qOscHarmonic = qAudioCtx.createOscillator();
    qOscHarmonic.type = 'triangle';
    qOscHarmonic.frequency.setValueAtTime(280, qAudioCtx.currentTime);

    const biquadFilter = qAudioCtx.createBiquadFilter();
    biquadFilter.type = 'lowpass';
    biquadFilter.frequency.setValueAtTime(450, qAudioCtx.currentTime);

    qOscPrimary.connect(qGainNode);
    qOscHarmonic.connect(qGainNode);
    qGainNode.connect(biquadFilter);
    biquadFilter.connect(qAudioCtx.destination);

    qOscPrimary.start();
    qOscHarmonic.start();
  } catch (e) {
    console.warn('AudioContext not supported or restricted');
  }
}

function updateQuantumAudioParams() {
  if (!qAudioCtx || !quantumState.audioEnabled) return;
  const baseFreq = 80 + quantumState.frequency * 40;
  qOscPrimary.frequency.setTargetAtTime(baseFreq, qAudioCtx.currentTime, 0.05);
  qOscHarmonic.frequency.setTargetAtTime(baseFreq * (quantumState.harmonics * 0.75), qAudioCtx.currentTime, 0.05);
}

let coreCanvas = null, waveCanvas = null;
let ctxCore = null, ctxWave = null;
let cwCore = 0, chCore = 0;
let cwWave = 0, chWave = 0;

let timerCoreCanvas = null, timerWaveCanvas = null;
let ctxTimerCore = null, ctxTimerWave = null;
let cwTimerCore = 0, chTimerCore = 0;
let cwTimerWave = 0, chTimerWave = 0;

function resizeQuantumCanvases() {
  const dpr = window.devicePixelRatio || 1;
  
  if (coreCanvas && ctxCore) {
    const rectCore = coreCanvas.parentElement.getBoundingClientRect();
    cwCore = rectCore.width || 360;
    chCore = rectCore.height || 260;
    coreCanvas.width = cwCore * dpr;
    coreCanvas.height = chCore * dpr;
    ctxCore.resetTransform();
    ctxCore.scale(dpr, dpr);
  }

  if (waveCanvas && ctxWave) {
    const rectWave = waveCanvas.parentElement.getBoundingClientRect();
    cwWave = rectWave.width || 360;
    chWave = rectWave.height || 170;
    waveCanvas.width = cwWave * dpr;
    waveCanvas.height = chWave * dpr;
    ctxWave.resetTransform();
    ctxWave.scale(dpr, dpr);
  }

  if (timerCoreCanvas && ctxTimerCore) {
    const rectTC = timerCoreCanvas.parentElement.getBoundingClientRect();
    cwTimerCore = rectTC.width || 360;
    chTimerCore = rectTC.height || 120;
    timerCoreCanvas.width = cwTimerCore * dpr;
    timerCoreCanvas.height = chTimerCore * dpr;
    ctxTimerCore.resetTransform();
    ctxTimerCore.scale(dpr, dpr);
  }

  if (timerWaveCanvas && ctxTimerWave) {
    const rectTW = timerWaveCanvas.parentElement.getBoundingClientRect();
    cwTimerWave = rectTW.width || 360;
    chTimerWave = rectTW.height || 85;
    timerWaveCanvas.width = cwTimerWave * dpr;
    timerWaveCanvas.height = chTimerWave * dpr;
    ctxTimerWave.resetTransform();
    ctxTimerWave.scale(dpr, dpr);
  }
}

class EnergyParticle {
  constructor() {
    this.reset(true);
  }

  reset(init = false) {
    this.angle = Math.random() * Math.PI * 2;
    this.radius = init ? Math.random() * 260 : Math.random() * 20;
    this.speed = 1.8 + Math.random() * 2.8;
    this.angularSpeed = (Math.random() - 0.5) * 0.04;
    this.size = 1.2 + Math.random() * 2.4;
    this.alpha = 0.2 + Math.random() * 0.8;
    this.decay = 0.003 + Math.random() * 0.007;
    
    this.streamX = 0;
    this.streamY = 0;
    this.type = Math.random() > 0.4 ? 'flux' : 'qubit';
    this.color = Math.random() > 0.5 ? '#00f5d4' : (Math.random() > 0.5 ? '#00bbf9' : '#f72585');
  }

  update(coreX, coreY, destX, destY, factor) {
    this.radius += this.speed * factor * 1.4;
    this.angle += this.angularSpeed * (1 + factor);
    this.alpha -= this.decay * (0.8 + factor * 0.4);

    if (this.alpha <= 0 || this.radius > Math.max(380, 260)) {
      this.reset();
    }
  }
}

const PARTICLES_COUNT = 240;
let quantumParticles = [];

function drawCoreSectionOn(ctx, cw, ch, t, dynamicMult, isCompact = false, isFrozen = false) {
  if (!ctx || cw === 0 || ch === 0) return;
  ctx.clearRect(0, 0, cw, ch);

  const coreX = cw * (isCompact ? 0.20 : 0.28);
  const coreY = ch * 0.5;
  const destX = cw * (isCompact ? 0.80 : 0.82);
  const destY = ch * 0.5;

  // 1. Conduit Beam
  ctx.save();
  const gradBeam = ctx.createLinearGradient(coreX, coreY, destX, destY);
  gradBeam.addColorStop(0, 'rgba(0, 245, 212, 0.85)');
  gradBeam.addColorStop(0.35, 'rgba(0, 187, 249, 0.45)');
  gradBeam.addColorStop(0.7, 'rgba(114, 9, 183, 0.65)');
  gradBeam.addColorStop(1, 'rgba(247, 37, 133, 0.9)');

  const streamCount = isCompact ? 3 : 5;
  for (let s = 0; s < streamCount; s++) {
    ctx.beginPath();
    const offsetPhase = t * 3.5 * quantumState.speed + (s * Math.PI / 2.5);
    const waveAmp = (isCompact ? (6 + s * 3) : (10 + s * 5)) * (quantumState.amplitude / 45);

    for (let x = coreX; x <= destX; x += (isCompact ? 8 : 10)) {
      const progress = (x - coreX) / (destX - coreX);
      const envelope = Math.sin(progress * Math.PI);
      const y = coreY + Math.sin(progress * 14 * (quantumState.frequency * 0.5) - offsetPhase) * (waveAmp * envelope);
      if (x === coreX) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = gradBeam;
    ctx.lineWidth = s === 0 ? (isCompact ? 2.5 : 3.2) : (isCompact ? 1.0 : 1.5);
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = isCompact ? 6 : 8;
    ctx.globalAlpha = 0.55 + (s === 0 ? 0.4 : 0.2);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Quantum Particles Stream Transfer (정지화면일 경우 파티클 위치 고정)
  quantumParticles.forEach(p => {
    if (!isFrozen) {
      p.update(coreX, coreY, destX, destY, dynamicMult);
    }

    const px = coreX + Math.cos(p.angle) * p.radius * (isCompact ? 0.7 : 0.85);
    const py = coreY + Math.sin(p.angle) * p.radius * (isCompact ? 0.45 : 0.55);

    const progressX = (px - coreX) / (destX - coreX);
    let renderX = px;
    let renderY = py;

    if (px > coreX && px < destX) {
      const streamCenterY = coreY + Math.sin(progressX * 6 - t * 3) * (isCompact ? 8 : 12);
      renderY = py * 0.4 + streamCenterY * 0.6;
    }

    ctx.beginPath();
    ctx.arc(renderX, renderY, isCompact ? Math.max(0.8, p.size * 0.7) : p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = isCompact ? 6 : 10;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
  });

  // 3. User interaction ripple effect (정지 시 비활성)
  if (!isFrozen && quantumState.pointer.active && quantumState.pointer.x !== null) {
    ctx.beginPath();
    ctx.arc(quantumState.pointer.x, quantumState.pointer.y, 30 + Math.sin(t * 8) * 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(quantumState.pointer.x, quantumState.pointer.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // 4. Draw Core Emitter (Left)
  drawCoreOrb(ctx, coreX, coreY, isCompact ? 20 : 36, '#00f5d4', '#00bbf9', t, isCompact ? '송신' : 'EMITTER');

  // 5. Draw Receiving Resonance Hub (Right)
  drawCoreOrb(ctx, destX, destY, isCompact ? 18 : 32, '#f72585', '#7209b7', -t * 1.2, isCompact ? '수신' : 'RECEIVER');
}

function drawCoreOrb(ctx, x, y, baseRadius, color1, color2, time, label) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, baseRadius + 10, 0, Math.PI * 2);
  ctx.strokeStyle = color1;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 8]);
  ctx.stroke();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 0.8);
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius + 5, 0, Math.PI * 1.5);
  ctx.strokeStyle = color2;
  ctx.lineWidth = 2.0;
  ctx.setLineDash([14, 7]);
  ctx.shadowColor = color2;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();

  const radial = ctx.createRadialGradient(x, y, 2, x, y, baseRadius);
  radial.addColorStop(0, '#ffffff');
  radial.addColorStop(0.3, color1);
  radial.addColorStop(0.7, color2);
  radial.addColorStop(1, 'transparent');

  ctx.beginPath();
  ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
  ctx.fillStyle = radial;
  ctx.shadowColor = color1;
  ctx.shadowBlur = 20;
  ctx.fill();

  const pulseSize = (baseRadius * 0.3) + Math.sin(time * 6) * 3;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(pulseSize, 2), 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.font = '600 9px Rajdhani, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + baseRadius + 18);

  ctx.restore();
}

function drawWaveSectionOn(ctx, cw, ch, t, isCompact = false, isFrozen = false) {
  if (!ctx || cw === 0 || ch === 0) return;
  ctx.clearRect(0, 0, cw, ch);

  const midY = ch * 0.5;
  const freq = quantumState.frequency;
  const amp = (quantumState.amplitude / 100) * (ch * (isCompact ? 0.34 : 0.38));
  const speed = quantumState.speed;
  const harmonics = quantumState.harmonics;

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 245, 212, 0.08)';
  ctx.lineWidth = 1;
  const gridGap = isCompact ? 24 : 30;
  for (let x = 0; x < cw; x += gridGap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ch);
    ctx.stroke();
  }
  for (let y = 0; y < ch; y += gridGap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(cw, midY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.restore();

  // 1. ψ₁ Primary Waveform (Cyan)
  ctx.save();
  ctx.beginPath();
  for (let x = 0; x <= cw; x += 3) {
    const theta = (x / cw) * Math.PI * 2 * freq - (t * 4 * speed);
    const y = midY + Math.sin(theta) * (amp * 0.7);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#00f5d4';
  ctx.lineWidth = isCompact ? 1.6 : 2;
  ctx.shadowColor = '#00f5d4';
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.8;
  ctx.stroke();
  ctx.restore();

  // 2. ψ₂ Secondary Harmonic Wave (Magenta)
  ctx.save();
  ctx.beginPath();
  for (let x = 0; x <= cw; x += 3) {
    const theta2 = (x / cw) * Math.PI * 2 * (freq * 1.6) + (t * 3 * speed);
    const y2 = midY + Math.cos(theta2 * (harmonics * 0.5)) * (amp * 0.45);
    if (x === 0) ctx.moveTo(x, y2);
    else ctx.lineTo(x, y2);
  }
  ctx.strokeStyle = '#f72585';
  ctx.lineWidth = isCompact ? 1.4 : 1.8;
  ctx.shadowColor = '#f72585';
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.75;
  ctx.stroke();
  ctx.restore();

  // 3. Superposition & Probability Density Envelope
  ctx.save();
  ctx.beginPath();
  const points = [];
  for (let x = 0; x <= cw; x += 4) {
    const theta1 = (x / cw) * Math.PI * 2 * freq - (t * 4 * speed);
    const theta2 = (x / cw) * Math.PI * 2 * (freq * 1.6) + (t * 3 * speed);
    
    let waveY = Math.sin(theta1) * (amp * 0.6) + Math.cos(theta2 * (harmonics * 0.5)) * (amp * 0.35);

    if (!isFrozen && quantumState.pointer.active && quantumState.pointer.x !== null) {
      const dist = Math.abs(x - quantumState.pointer.x);
      const ripple = Math.exp(-dist * 0.02) * Math.sin(dist * 0.15 - t * 10) * 14;
      waveY += ripple;
    }

    const finalY = midY + waveY;
    points.push({ x, y: finalY });
    if (x === 0) ctx.moveTo(x, finalY);
    else ctx.lineTo(x, finalY);
  }

  ctx.strokeStyle = '#00bbf9';
  ctx.lineWidth = isCompact ? 2.4 : 3.0;
  ctx.shadowColor = '#00bbf9';
  ctx.shadowBlur = isCompact ? 10 : 14;
  ctx.stroke();

  if (points.length > 0) {
    ctx.lineTo(cw, midY);
    ctx.lineTo(0, midY);
    ctx.closePath();

    const gradFill = ctx.createLinearGradient(0, midY - amp, 0, midY + amp);
    gradFill.addColorStop(0, 'rgba(0, 187, 249, 0.25)');
    gradFill.addColorStop(0.5, 'rgba(114, 9, 183, 0.15)');
    gradFill.addColorStop(1, 'rgba(0, 245, 212, 0)');

    ctx.fillStyle = gradFill;
    ctx.fill();
  }
  ctx.restore();
}

function handleQuantumPointer(e, canvas) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  quantumState.pointer.x = clientX - rect.left;
  quantumState.pointer.y = clientY - rect.top;
  quantumState.pointer.active = true;
}

let lastQuantumTime = performance.now();
const FROZEN_PULSE_TIME = 1.85;

// [사용자 요청] 타이머 미연결 / 정지 / 종료 시 파형 완전 정지 렌더러
function drawCoreSectionStopped(ctx, cw, ch, isCompact = false) {
  if (!ctx || cw === 0 || ch === 0) return;
  ctx.clearRect(0, 0, cw, ch);

  const coreX = cw * (isCompact ? 0.20 : 0.28);
  const coreY = ch * 0.5;
  const destX = cw * (isCompact ? 0.80 : 0.82);
  const destY = ch * 0.5;

  // 1. 대기 기준 점선 (빔 비활성/정지 상태)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(coreX, coreY);
  ctx.lineTo(destX, destY);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.restore();

  // 2. 정지된 대기 상태 Emitter & Receiver 오르브 (회전 멈춤)
  drawCoreOrb(ctx, coreX, coreY, isCompact ? 18 : 30, 'rgba(100, 116, 139, 0.5)', 'rgba(71, 85, 105, 0.3)', 0, isCompact ? '송신 (대기)' : 'EMITTER (STANDBY)');
  drawCoreOrb(ctx, destX, destY, isCompact ? 16 : 26, 'rgba(100, 116, 139, 0.5)', 'rgba(71, 85, 105, 0.3)', 0, isCompact ? '수신 (대기)' : 'RECEIVER (STANDBY)');

  // 3. 중앙 상태 배지 (정지 명시)
  ctx.save();
  const midX = (coreX + destX) * 0.5;
  const badgeW = isCompact ? 190 : 240;
  const badgeH = isCompact ? 22 : 26;
  ctx.fillStyle = 'rgba(11, 16, 38, 0.88)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(midX - badgeW / 2, coreY - badgeH / 2, badgeW, badgeH, 6);
  } else {
    ctx.rect(midX - badgeW / 2, coreY - badgeH / 2, badgeW, badgeH);
  }
  ctx.fill();
  ctx.stroke();

  ctx.font = isCompact ? '600 10px Rajdhani, sans-serif' : '600 12px Rajdhani, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('⏸️ 타이머 미연결 • 코어 빔 정지 중', midX, coreY);
  ctx.restore();
}

function drawWaveSectionStopped(ctx, cw, ch, isCompact = false) {
  if (!ctx || cw === 0 || ch === 0) return;
  ctx.clearRect(0, 0, cw, ch);

  const midY = ch * 0.5;

  // 1. 오실로스코프 정밀 그리드
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridGap = isCompact ? 24 : 30;
  for (let x = 0; x < cw; x += gridGap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ch);
    ctx.stroke();
  }
  for (let y = 0; y < ch; y += gridGap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }

  // 2. 무신호 플랫라인 (오실로스코프 Flatline) - 완벽히 멈춘 상태
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(cw, midY);
  ctx.strokeStyle = 'rgba(0, 245, 212, 0.45)';
  ctx.lineWidth = 2.0;
  ctx.shadowColor = '#00f5d4';
  ctx.shadowBlur = 6;
  ctx.stroke();

  // 중앙 정지 포인트
  ctx.fillStyle = '#00f5d4';
  ctx.beginPath();
  ctx.arc(cw * 0.5, midY, 3, 0, Math.PI * 2);
  ctx.fill();

  // 3. 우측 하단 정지 라벨
  ctx.font = isCompact ? '600 9px Rajdhani, monospace' : '600 11px Rajdhani, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
  ctx.fillText('FLATLINE • 파형 정지 (타이머 시작 대기)', cw - 12, ch - 6);
  ctx.restore();
}

function animateQuantum(currentTime) {
  const delta = (currentTime - lastQuantumTime) * 0.001;
  lastQuantumTime = currentTime;

  const anyActive = state.sources.some(s => s.isActive);

  // [핵심] 타이머가 가동 중일 때만 파형 시간 진행 (타이머가 멈추거나 종료되면 시간 정지)
  if (anyActive) {
    quantumState.time += delta;
  }

  if (state.currentScreen === 'timer') {
    if (anyActive) {
      // 타이머 시작 시: 실시간 양자 코어 전송 빔 & 고주파 간섭계 활성 가동
      if (ctxTimerCore && cwTimerCore > 0) {
        drawCoreSectionOn(ctxTimerCore, cwTimerCore, chTimerCore, quantumState.time * 1.35, 1.6, true, false);
      }
      if (ctxTimerWave && cwTimerWave > 0) {
        drawWaveSectionOn(ctxTimerWave, cwTimerWave, chTimerWave, quantumState.time * 1.1, true, false);
      }
    } else {
      // [사용자 요청] 타이머가 연결되지 않거나 종료되면: 동작하지 않고 완전히 멈춤
      if (ctxTimerCore && cwTimerCore > 0) {
        drawCoreSectionStopped(ctxTimerCore, cwTimerCore, chTimerCore, true);
      }
      if (ctxTimerWave && cwTimerWave > 0) {
        drawWaveSectionStopped(ctxTimerWave, cwTimerWave, chTimerWave, true);
      }
    }
  } else if (state.currentScreen === 'receiving') {
    if (anyActive) {
      if (ctxCore && cwCore > 0) {
        drawCoreSectionOn(ctxCore, cwCore, chCore, quantumState.time, 1.6, false, false);
      }
      if (ctxWave && cwWave > 0) {
        drawWaveSectionOn(ctxWave, cwWave, chWave, quantumState.time, false, false);
      }
    } else {
      if (ctxCore && cwCore > 0) {
        drawCoreSectionStopped(ctxCore, cwCore, chCore, false);
      }
      if (ctxWave && cwWave > 0) {
        drawWaveSectionStopped(ctxWave, cwWave, chWave, false);
      }
    }
  }

  requestAnimationFrame(animateQuantum);
}

function initQuantumVisualizer() {
  coreCanvas = document.getElementById('core-canvas');
  waveCanvas = document.getElementById('wave-canvas');
  if (coreCanvas) ctxCore = coreCanvas.getContext('2d');
  if (waveCanvas) ctxWave = waveCanvas.getContext('2d');

  timerCoreCanvas = document.getElementById('timerCoreCanvas');
  timerWaveCanvas = document.getElementById('timerWaveCanvas');
  if (timerCoreCanvas) ctxTimerCore = timerCoreCanvas.getContext('2d');
  if (timerWaveCanvas) ctxTimerWave = timerWaveCanvas.getContext('2d');

  quantumParticles = Array.from({ length: PARTICLES_COUNT }, () => new EnergyParticle());

  resizeQuantumCanvases();
  window.addEventListener('resize', resizeQuantumCanvases);

  // Audio button
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const audioLabel = document.getElementById('audio-label');

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      initQuantumAudio();
      if (!qAudioCtx) return;

      if (qAudioCtx.state === 'suspended') {
        qAudioCtx.resume();
      }

      quantumState.audioEnabled = !quantumState.audioEnabled;
      if (quantumState.audioEnabled) {
        qGainNode.gain.setTargetAtTime(0.04, qAudioCtx.currentTime, 0.1);
        audioIcon.className = 'fa-solid fa-volume-high text-qcyan';
        audioLabel.textContent = 'AUDIO ON';
        audioToggleBtn.classList.add('border-qcyan', 'text-qcyan');
      } else {
        qGainNode.gain.setTargetAtTime(0.0001, qAudioCtx.currentTime, 0.1);
        audioIcon.className = 'fa-solid fa-volume-xmark';
        audioLabel.textContent = 'AUDIO OFF';
        audioToggleBtn.classList.remove('border-qcyan', 'text-qcyan');
      }
      updateQuantumAudioParams();
    });
  }

  // Pointer listeners for all canvases
  [coreCanvas, waveCanvas, timerCoreCanvas, timerWaveCanvas].forEach(cnv => {
    if (!cnv) return;
    cnv.addEventListener('mousemove', (e) => handleQuantumPointer(e, cnv));
    cnv.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleQuantumPointer(e, cnv);
    }, { passive: false });
    cnv.addEventListener('mouseleave', () => { quantumState.pointer.active = false; });
    cnv.addEventListener('touchend', () => { quantumState.pointer.active = false; });
  });

  // Mode buttons
  const modeBtns = document.querySelectorAll('.quantum-mode-btn');
  const waveModeBadge = document.getElementById('wave-mode-badge');
  const telemetryRate = document.getElementById('telemetry-rate');
  const telemetryCoherence = document.getElementById('telemetry-coherence');
  const coreDensityVal = document.getElementById('core-density-val');
  const coreEfficiencyVal = document.getElementById('core-efficiency-val');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playTap();
      modeBtns.forEach(b => {
        b.classList.remove('active', 'border-qcyan', 'bg-cyan-500/20', 'text-qcyan');
        b.classList.add('border-slate-700', 'bg-slate-900/50', 'text-slate-400');
      });
      btn.classList.add('active', 'border-qcyan', 'bg-cyan-500/20', 'text-qcyan');
      btn.classList.remove('border-slate-700', 'bg-slate-900/50', 'text-slate-400');

      quantumState.mode = btn.getAttribute('data-mode');

      if (quantumState.mode === 'superconducting') {
        if (waveModeBadge) waveModeBadge.textContent = 'COHERENT SUPERCONDUCTIVITY';
        if (telemetryRate) telemetryRate.textContent = '4.912 PFLOPS/e';
        if (telemetryCoherence) telemetryCoherence.textContent = '99.98 %';
        if (coreDensityVal) coreDensityVal.textContent = '5.42 × 10¹⁴ eV';
        if (coreEfficiencyVal) coreEfficiencyVal.textContent = '99.4 %';
      } else if (quantumState.mode === 'resonance') {
        if (waveModeBadge) waveModeBadge.textContent = 'HARMONIC ENTANGLEMENT';
        if (telemetryRate) telemetryRate.textContent = '3.120 PFLOPS/e';
        if (telemetryCoherence) telemetryCoherence.textContent = '97.45 %';
        if (coreDensityVal) coreDensityVal.textContent = '3.80 × 10¹⁴ eV';
        if (coreEfficiencyVal) coreEfficiencyVal.textContent = '95.8 %';
      } else {
        if (waveModeBadge) waveModeBadge.textContent = 'HIGH-ENERGY PULSED BURST';
        if (telemetryRate) telemetryRate.textContent = '8.730 PFLOPS/e';
        if (telemetryCoherence) telemetryCoherence.textContent = '94.10 %';
        if (coreDensityVal) coreDensityVal.textContent = '7.65 × 10¹⁴ eV';
        if (coreEfficiencyVal) coreEfficiencyVal.textContent = '93.2 %';
      }
    });
  });

  // Slider inputs
  const sliderFreq = document.getElementById('slider-freq');
  const valFreq = document.getElementById('val-freq');
  if (sliderFreq && valFreq) {
    sliderFreq.addEventListener('input', (e) => {
      quantumState.frequency = parseFloat(e.target.value);
      valFreq.textContent = `${quantumState.frequency.toFixed(2)} Hz`;
      updateQuantumAudioParams();
    });
  }

  const sliderAmp = document.getElementById('slider-amp');
  const valAmp = document.getElementById('val-amp');
  if (sliderAmp && valAmp) {
    sliderAmp.addEventListener('input', (e) => {
      quantumState.amplitude = parseFloat(e.target.value);
      valAmp.textContent = `${quantumState.amplitude.toFixed(1)} %`;
    });
  }

  const sliderSpeed = document.getElementById('slider-speed');
  const valSpeed = document.getElementById('val-speed');
  if (sliderSpeed && valSpeed) {
    sliderSpeed.addEventListener('input', (e) => {
      quantumState.speed = parseFloat(e.target.value);
      valSpeed.textContent = `${quantumState.speed.toFixed(2)} c`;
    });
  }

  const sliderHarmonics = document.getElementById('slider-harmonics');
  const valHarmonics = document.getElementById('val-harmonics');
  if (sliderHarmonics && valHarmonics) {
    sliderHarmonics.addEventListener('input', (e) => {
      quantumState.harmonics = parseInt(e.target.value);
      valHarmonics.textContent = `${quantumState.harmonics}차 양자 간섭`;
      updateQuantumAudioParams();
    });
  }

  requestAnimationFrame(animateQuantum);
}

// ==========================================
// 9. GIFT & NETWORK FUNCTIONS
// ==========================================
function selectGiftAmount(amount, btn) {
  sounds.playTap();
  document.querySelectorAll('.amount-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('giftAmountVal').value = amount;
}

function sendGiftEnergy() {
  const target = document.getElementById('giftRecipient').value.trim();
  const amount = document.getElementById('giftAmountVal').value;
  const msg = document.getElementById('giftMessage').value.trim();

  if (!target) {
    alert('수신자 ID나 이름을 입력해주세요.');
    return;
  }

  sounds.playUnlock();
  alert(`🎁 [에너지 전송 완료]\n\n받는 분: ${target}\n전송 에너지: ${amount} kWh\n메시지: "${msg || '오늘도 활력 가득한 하루 되세요!'}"`);
  document.getElementById('giftRecipient').value = '';
  document.getElementById('giftMessage').value = '';
}

function toggleDeviceNode(btn) {
  const card = btn.closest('.device-node-card');
  const isDesktop = card && card.textContent.includes('에너지 디바이스 연결 PC');
  const isSync = btn.textContent.includes('연동 중');

  if (isSync) {
    sounds.playTap();
    btn.textContent = '연동 해제됨';
    btn.classList.remove('active');
    btn.style.color = 'var(--text-muted)';
    btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  } else {
    sounds.playUnlock();
    btn.textContent = isDesktop ? '연동 중 • 100%' : '연동 중 • 99%';
    btn.classList.add('active');
    btn.style.color = isDesktop ? 'var(--accent-cyan)' : 'var(--accent-emerald)';
    btn.style.borderColor = isDesktop ? 'rgba(0, 242, 254, 0.4)' : 'rgba(16, 185, 129, 0.4)';
    
    if (isDesktop) {
      setTimeout(() => {
        alert('🖥️ [에너지 디바이스 연결 PC]\n\n• 제어 포트: COM3 고속 직결\n• 전송 대역폭: LAN 1Gbps 초저지연 (지연 2ms)\n• 하드웨어 상태: 정상 가동 (동기화 완료 100%)');
      }, 50);
    }
  }

  // Update total online tag
  const allBtns = document.querySelectorAll('.device-sync-btn');
  const activeCount = Array.from(allBtns).filter(b => b.textContent.includes('연동 중')).length;
  const countTag = document.getElementById('deviceOnlineCountTag');
  if (countTag) {
    countTag.textContent = `${activeCount}대 온라인`;
  }
}

// ==========================================
// 10. VIEWPORT MODE TOGGLE (MOCKUP / FULL)
// ==========================================
function toggleViewportMode() {
  sounds.playTap();
  const container = document.getElementById('phoneContainer');
  const btnText = document.getElementById('viewportBtnText');
  
  if (container.classList.contains('mockup-mode')) {
    container.classList.remove('mockup-mode');
    container.classList.add('fullscreen-mode');
    btnText.textContent = '📱 모바일 목업 모드';
  } else {
    container.classList.remove('fullscreen-mode');
    container.classList.add('mockup-mode');
    btnText.textContent = '🖥️ 와이드 풀스크린 모드';
  }
  setTimeout(() => {
    if (state.currentScreen === 'dashboard') renderChart();
    if (state.currentScreen === 'receiving') resizeQuantumCanvases();
  }, 300);
}

// ==========================================
// 11. INITIALIZATION ON DOM LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupTimerWorker();
  initSourcesCards();
  renderTimerUI();
  initECG();
  initPinSecurity();
  initQuantumVisualizer();

  // Navigation tab click handlers
  document.querySelectorAll('.nav-tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      const screen = tab.dataset.screen;
      if (screen) switchScreen(screen);
    });
  });

  // Persistent bar click -> return to timer screen
  const persistentBar = document.getElementById('persistentEnergyBar');
  if (persistentBar) {
    persistentBar.addEventListener('click', () => switchScreen('timer'));
  }

  // Request Notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

// ==========================================
// 12. PIN SECURITY SYSTEM (DEFAULT: 5098)
// ==========================================
let currentEnteredPin = '';

function getStoredPin() {
  // 프리뷰 평가판 보안 정책: 비밀번호는 5098로 강제 고정 (유료화 전환 전 변경 불가)
  const FIXED_PIN = '5098';
  localStorage.setItem('life_energy_pin', FIXED_PIN);
  return FIXED_PIN;
}

function initPinSecurity() {
  const currentPin = getStoredPin(); // '5098'
  const hintEl = document.getElementById('pinHintText');
  if (hintEl) {
    hintEl.innerHTML = '🔒 허가된 4자리 보안 비밀번호를 입력하세요';
    hintEl.style.color = 'var(--text-secondary)';
  }
  updatePinDots();
  lockApp(); // [보안 필수] 앱 최초 접속 시 반드시 잠금 화면으로 시작!

  // Physical keyboard support for desktop PC
  window.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('pinLockOverlay');
    if (!overlay || overlay.classList.contains('hidden')) return;

    if (e.key >= '0' && e.key <= '9') {
      pressPinKey(e.key);
    } else if (e.key === 'Backspace') {
      clearPinDigit();
    } else if (e.key === 'Enter') {
      unlockApp();
    }
  });
}

function updatePinDots() {
  const dots = document.querySelectorAll('.pin-dots .pin-dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('filled', idx < currentEnteredPin.length);
  });
}

function pressPinKey(digit) {
  if (currentEnteredPin.length >= 4) return;
  sounds.playTap();
  currentEnteredPin += digit;
  updatePinDots();

  if (currentEnteredPin.length === 4) {
    setTimeout(verifyPinCode, 150);
  }
}

function clearPinDigit() {
  sounds.playTap();
  if (currentEnteredPin.length > 0) {
    currentEnteredPin = currentEnteredPin.slice(0, -1);
    updatePinDots();
  }
}

function verifyPinCode() {
  const targetPin = getStoredPin(); // '5098'
  const overlay = document.getElementById('pinLockOverlay');
  const hintEl = document.getElementById('pinHintText');

  if (currentEnteredPin === targetPin) {
    sounds.playUnlock();
    state.isLocked = false;
    if (overlay) {
      overlay.classList.add('hidden');
    }
    if (hintEl) {
      hintEl.innerHTML = '✅ 인증 성공';
      hintEl.style.color = '#00f5d4';
    }
    currentEnteredPin = '';
    updatePinDots();
  } else {
    sounds.playToggle(false);
    if (hintEl) {
      hintEl.innerHTML = '❌ 비밀번호가 올바르지 않습니다';
      hintEl.style.color = '#ef4444';
    }
    if (overlay) {
      overlay.classList.add('shake');
      setTimeout(() => {
        overlay.classList.remove('shake');
        if (hintEl) {
          hintEl.innerHTML = '🔒 허가된 4자리 보안 비밀번호를 입력하세요';
          hintEl.style.color = 'var(--text-secondary)';
        }
      }, 900);
    }
    currentEnteredPin = '';
    updatePinDots();
  }
}

function unlockApp() {
  if (currentEnteredPin.length > 0) {
    verifyPinCode();
  }
}

function lockApp() {
  sounds.playTap();
  currentEnteredPin = '';
  updatePinDots();
  const overlay = document.getElementById('pinLockOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function openPinSettingsModal() {
  sounds.playTap();
  const modal = document.getElementById('pinSettingsModal');
  if (modal) {
    modal.classList.add('open');
  }
}

function closePinSettingsModal() {
  sounds.playTap();
  const modal = document.getElementById('pinSettingsModal');
  if (modal) {
    modal.classList.remove('open');
  }
}

function saveNewPin() {
  sounds.playToggle(false);
  alert('🔒 [보안 정책 안내]\n\n현재 버전은 관리자 고정 보안 비밀번호(5098)로 운영됩니다.\n비밀번호 개별 변경 기능은 유료화 정식 버전 출시 후 지원됩니다.');
  closePinSettingsModal();
}

function openInstallGuideModal() {
  sounds.playTap();
  const modal = document.getElementById('installGuideModal');
  if (modal) modal.classList.add('open');
}

function closeInstallGuideModal() {
  sounds.playTap();
  const modal = document.getElementById('installGuideModal');
  if (modal) modal.classList.remove('open');
}

function downloadAppFile() {
  sounds.playTap();
  // 현재 완성된 단일 HTML 파일 내용을 Blob으로 다운로드 생성
  const htmlContent = document.documentElement.outerHTML;
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'LifeEnergyCloud.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert('📥 [Life Energy Cloud 다운로드 완료]\n\nLifeEnergyCloud.html 파일이 기기에 다운로드되었습니다.\n인터넷이 연결되지 않은 환경에서도 언제든 파일을 열어 사용하실 수 있습니다.');
}

