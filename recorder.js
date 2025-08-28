let mediaRecorder = null;
let recordedChunks = [];
let stream = null;
let timerInterval = null;
let seconds = 0;

const StartBtn = document.getElementById("StartBtn");
const StopBtn  = document.getElementById("StopBtn");
const DownloadBtn = document.getElementById("DownloadBtn");
const preview = document.getElementById("preview");
const timer = document.getElementById("timer");

// initial state
StopBtn.disabled = true;
DownloadBtn.disabled = true;

StartBtn.onclick = async () => {
  // avoid double-start
  if (mediaRecorder && mediaRecorder.state === "recording") return;

  const Quality = document.getElementById("Quality").value;
  let videoConstraints = {};
  if (Quality === "Sd") videoConstraints = { width: 640, height: 360 };
  else if (Quality === "Hd") videoConstraints = { width: 1280, height: 720 };
  else if (Quality === "4k") videoConstraints = { width: 3840, height: 2160 };

  try {
    // make sure any previous timer is stopped and reset seconds
    stopTimer();
    seconds = 0;
    timer.textContent = '⏳ 00:00';

    const captureOptions = { video: videoConstraints, audio: true };
    stream = await navigator.mediaDevices.getDisplayMedia(captureOptions);
    preview.srcObject = stream;

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      // ensure timer is stopped when recorder stops
      stopTimer();
      DownloadBtn.disabled = false;
    };

    mediaRecorder.start();
    startTimer();

    StartBtn.disabled = true;
    StopBtn.disabled = false;
    DownloadBtn.disabled = true;
  } catch (err) {
    alert("Recording failed: " + err.message);
  }
};

StopBtn.onclick = () => {
  // stop recorder if running
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }

  // stop tracks (screen share)
  if (stream) stream.getTracks().forEach(t => t.stop());

  // also stop timer immediately (defensive)
  stopTimer();

  StopBtn.disabled = true;
  StartBtn.disabled = false;
};

DownloadBtn.onclick = () => {
  if (recordedChunks.length === 0) return;
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'YourScreenRecording.webm';
  a.click();
  URL.revokeObjectURL(url);
  DownloadBtn.disabled = true;
};

function startTimer() {
  // clear any leftover interval (prevents multiple intervals)
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    seconds++;
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    timer.textContent = `⏳ ${min}:${sec}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  // (optional) keep last shown time. If you want to reset to 00:00 on stop:
  // seconds = 0; timer.textContent = '⏳ 00:00';
}
