// timerWorker.js - Background Precision Timer Worker for Life Energy Cloud
let timerId = null;

self.onmessage = function (e) {
  const { action, interval = 1000 } = e.data;

  if (action === 'start') {
    if (timerId !== null) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: 'tick', timestamp: Date.now() });
    }, interval);
  } else if (action === 'stop') {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
