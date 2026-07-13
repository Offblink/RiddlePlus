// main.js — State machine, idle timer, pointer events, flow orchestration
var RP = window.RP || {};

(function() {
var wrap      = document.getElementById('wrap');
var statusDot = document.getElementById('statusDot');
var statusText = document.getElementById('statusText');
var undoHint  = document.getElementById('undoHint');
var logPanel  = document.getElementById('logPanel');

// logging
function log(msg, cls) {
  var t = new Date().toLocaleTimeString();
  var el = document.createElement('div');
  el.className = 'entry' + (cls ? ' ' + cls : '');
  el.innerHTML = '<span class="ts">' + t + '</span>' + msg;
  logPanel.appendChild(el);
  logPanel.scrollTop = logPanel.scrollHeight;
}

var _logOpen = false;
function toggleLog() {
  _logOpen = !_logOpen;
  logPanel.classList.toggle('show', _logOpen);
  document.getElementById('btnLog').textContent = _logOpen ? '\u25B7' : '\u25B7';
}
document.getElementById('btnLog').addEventListener('click', toggleLog);

var IDLE_TIMEOUT = 2800, FADE_DURATION = 1500;

var S = {
  IDLE:'idle', WRITING:'writing', PENDING:'pending',
  RECOGNIZING:'recognizing', THINKING:'thinking', ANIMATING:'animating',
  VISION_ANALYZING:'vision_analyzing', GENERATING_IMAGE:'generating_image'
};
var state = S.IDLE;
var strokes = [], activeStrokes = {}, idleTimer = null, undoCount = 0;
var canvas, ctx, cssW, cssH, dpr;

function setupCanvas() {
  var result = RP.initCanvas(wrap);
  canvas = result.canvas; ctx = result.ctx;
  var size = RP.resizeCanvas(canvas, ctx, wrap);
  cssW = size.cssW; cssH = size.cssH; dpr = size.dpr;
}
setupCanvas();
window.addEventListener('resize', function() {
  var size = RP.resizeCanvas(canvas, ctx, wrap);
  cssW = size.cssW; cssH = size.cssH; dpr = size.dpr;
  RP.redrawAll(ctx, strokes, cssW, cssH);
});

// settings
var settings = RP.loadSettings();
RP.bindSettingsUI(settings, {
  onPreview: previewOnCanvas,
  onLoadExternalImage: loadExternalImage,
  onSettingsClose: function() { fadeCanvasOut(600); },
  onModeChange: function(mode) { log('模式切换: ' + mode); }
});
function fadeCanvasOut(dur) { RP.fadeCanvas(ctx, canvas, cssW, cssH, dur || 600); }

var _previewPlaying = false;
function previewOnCanvas() {
  if (_previewPlaying) return;
  _previewPlaying = true;
  var snap = RP.snapshotCanvas(canvas);
  RP.clearCanvas(ctx, cssW, cssH);
  RP.animateText(ctx, '\u6B22\u8FCE\u4F7F\u7528Riddle++\nWelcome to Riddle++', cssW, cssH, settings, null).then(function() {
    _previewPlaying = false;
  });
}

function loadExternalImage(dataUrl) {
  var img = new Image();
  img.onload = function() {
    RP.clearCanvas(ctx, cssW, cssH);
    var binCanvas = document.createElement('canvas');
    RP.binarize(img, binCanvas, { threshold: settings.binarizeThreshold || 0 });
    var scale = Math.min(cssW / binCanvas.width, cssH / binCanvas.height) * 0.9;
    var w = binCanvas.width * scale, h = binCanvas.height * scale;
    var x = (cssW - w) / 2, y = (cssH - h) / 2;
    ctx.drawImage(binCanvas, x, y, w, h);
  };
  img.onerror = function() { log('无法加载所选图片', 'err'); };
  img.src = dataUrl;
}

function setState(ns) {
  state = ns;
  log('\u2192 ' + ns);
  statusDot.className = 'status-dot'; statusText.className = 'status-text';
  switch (ns) {
    case S.IDLE:             statusText.textContent = '写点什么吧…'; break;
    case S.WRITING:          statusText.textContent = '书写中…'; break;
    case S.PENDING:          statusText.textContent = '等待中…'; statusText.classList.add('active'); break;
    case S.RECOGNIZING:      statusText.textContent = '辨认笔迹…'; statusText.classList.add('active'); statusDot.classList.add('thinking'); break;
    case S.THINKING:         statusText.textContent = '日记正在思考…'; statusText.classList.add('active'); statusDot.classList.add('thinking'); break;
    case S.ANIMATING:        statusText.textContent = '日记正在书写…'; statusText.classList.add('active'); statusDot.classList.add('thinking'); break;
    case S.VISION_ANALYZING: statusText.textContent = '正在识图…'; statusText.classList.add('active'); statusDot.classList.add('thinking'); break;
    case S.GENERATING_IMAGE: statusText.textContent = '正在生成绘画…'; statusText.classList.add('active'); statusDot.classList.add('thinking'); break;
  }
}

// pointer events
function getPos(e) {
  var r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top, t: Date.now() };
}

canvas.addEventListener('pointerdown', function(e) {
  if (state === S.RECOGNIZING || state === S.ANIMATING || state === S.THINKING || state === S.VISION_ANALYZING || state === S.GENERATING_IMAGE) return;
  e.preventDefault();
  var p = getPos(e);
  activeStrokes[e.pointerId] = { xs: [p.x], ys: [p.y], ts: [p.t], lastPoint: p };
  clearIdleTimer();
  setState(S.WRITING);
  ctx.fillStyle = RP.INK;
  ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2); ctx.fill();
});

canvas.addEventListener('pointermove', function(e) {
  var s = activeStrokes[e.pointerId];
  if (!s) return;
  e.preventDefault();
  var p = getPos(e);
  s.xs.push(p.x); s.ys.push(p.y); s.ts.push(p.t);
  var speed = Math.hypot(p.x-s.lastPoint.x, p.y-s.lastPoint.y) / Math.max(1, p.t-s.lastPoint.t);
  var w = Math.max(1.5, 4 - speed*0.3);
  ctx.strokeStyle = RP.INK; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(s.lastPoint.x, s.lastPoint.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  s.lastPoint = p;
});

function endStroke(e) {
  if (!e) return;
  var s = activeStrokes[e.pointerId];
  if (!s) return;
  e.preventDefault();
  delete activeStrokes[e.pointerId];
  if (s.xs.length > 0) strokes.push(s);
  if (Object.keys(activeStrokes).length === 0) startIdleTimer();
}
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointerleave', endStroke);

function startIdleTimer() {
  clearIdleTimer();
  if (strokes.length === 0) { setState(S.IDLE); return; }
  setState(S.PENDING);
  idleTimer = setTimeout(onIdle, IDLE_TIMEOUT);
}
function clearIdleTimer() { if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; } }

// undo
document.getElementById('btnUndo').addEventListener('click', function() {
  if (strokes.length === 0) return;
  strokes.pop();
  RP.redrawAll(ctx, strokes, cssW, cssH);
  undoCount++;
  undoHint.textContent = undoCount > 1 ? '已撤销 ' + undoCount + ' 笔' : '已撤销';
  undoHint.classList.add('show');
  clearTimeout(undoHint._t);
  undoHint._t = setTimeout(function() { undoHint.classList.remove('show'); undoCount = 0; }, 1500);
  if (strokes.length === 0) setState(S.IDLE);
});
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); document.getElementById('btnUndo').click(); }
});

// flow
async function onIdle() {
  if (state !== S.PENDING) return;
  clearIdleTimer();
  var mode = settings.drawMode;

  if (mode === 'gen') {
    await submitViaVision(true);
    return;
  }

  // auto
  var text = await tryRecognize();
  if (isMeaningful(text)) { await finishTextFlow(text); }
  else {
    log('自动模式: 文字识别无效, 切换到识图+生图', 'warn');
    await submitViaVision(true);
  }
}

function isMeaningful(text) {
  if (!text || text.length === 0) return false;
  var trimmed = text.trim();
  if (trimmed.length === 0) return false;
  return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afa-zA-Z]/.test(trimmed);
}

async function tryRecognize() {
  setState(S.RECOGNIZING);
  try {
    var trace = strokes.map(function(s) { return [s.xs, s.ys, []]; });
    var text = await RP.recognizeHandwriting(trace, settings.language, cssW, cssH);
    log('识别结果: "' + text + '"');
    return text;
  } catch (err) { log('识别失败: ' + err.message, 'err'); return null; }
}

async function submitViaText() {
  var text = await tryRecognize();
  if (text) await finishTextFlow(text);
  else showError('没认出来，再写一次？');
}

async function finishTextFlow(text) {
  var inkBounds = RP.getInkBounds(strokes);
  await fadeInk();

  setState(S.THINKING);
  RP.clearCanvas(ctx, cssW, cssH);
  var reply;
  try {
    reply = await RP.callLLM(text, settings);
    log('LLM 回复 (' + reply.length + '字): "' + reply.slice(0, 80) + '…"');
  } catch (err) {
    log('LLM 错误: ' + err.message, 'err');
    showError('日记无法回应: ' + err.message);
    RP.redrawAll(ctx, strokes, cssW, cssH);
    return;
  }
  setState(S.ANIMATING);
  strokes = [];
  await RP.animateText(ctx, reply, cssW, cssH, settings, inkBounds);
  setState(S.IDLE);
}

async function submitViaVision(forceGen) {
  var inkBounds = RP.getInkBounds(strokes);
  await fadeInk();
  setState(S.VISION_ANALYZING);
  RP.clearCanvas(ctx, cssW, cssH);

  var imageBase64;
  try {
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width; tempCanvas.height = canvas.height;
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tempCtx.fillStyle = RP.PAPER;
    tempCtx.fillRect(0, 0, cssW, cssH);
    for (var i = 0; i < strokes.length; i++) {
      RP.drawStroke(tempCtx, strokes[i], 1);
    }
    imageBase64 = tempCanvas.toDataURL('image/png');
    RP.clearCanvas(ctx, cssW, cssH);
  } catch (err) { log('截图失败: ' + err.message, 'err'); showError('截图失败'); return; }

  var result;
  try {
    result = await RP.callVisionLLM(imageBase64, settings);
    log('Vision LLM 回复: "' + result.text.slice(0, 80) + '…"');
    if (result.drawPrompt) log('检测到绘图请求: "' + result.drawPrompt.slice(0, 80) + '…"');
  } catch (err) {
    log('Vision LLM 错误: ' + err.message, 'err');
    showError('日记无法回应: ' + err.message);
    RP.redrawAll(ctx, strokes, cssW, cssH);
    return;
  }

  setState(S.ANIMATING);
  strokes = [];
  await RP.animateText(ctx, result.text, cssW, cssH, settings, inkBounds);

  var drawPrompt = result.drawPrompt || (forceGen ? result.text : null);
  if (drawPrompt) {
    setState(S.GENERATING_IMAGE);
    try {
      var genImg = await RP.generateImage(drawPrompt, settings);
      log('生成图片成功 (' + genImg.width + 'x' + genImg.height + ')');
      var binCanvas = document.createElement('canvas');
      RP.binarize(genImg, binCanvas, { threshold: settings.binarizeThreshold || 0 });
      await RP.revealImage(ctx, binCanvas, cssW, cssH);
      log('二值化绘画已显示');
    } catch (err) {
      log('生成绘画失败: ' + err.message, 'err');
      showError('绘画生成失败: ' + err.message);
    }
  }
  setState(S.IDLE);
}

function fadeInk() {
  var snap = RP.snapshotCanvas(canvas);
  return new Promise(function(resolve) {
    var start = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - start) / FADE_DURATION);
      var alpha = 1 - p*p;
      RP.clearCanvas(ctx, cssW, cssH);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(snap, 0, 0, cssW, cssH);
      ctx.globalAlpha = 1;
      ctx.restore();
      if (p < 1) requestAnimationFrame(frame);
      else { RP.clearCanvas(ctx, cssW, cssH); resolve(); }
    }
    requestAnimationFrame(frame);
  });
}

function showError(msg) {
  setState(S.IDLE);
  statusText.textContent = msg;
  statusText.classList.add('error');
  setTimeout(function() { statusText.classList.remove('error'); setState(S.IDLE); }, 3000);
}

setState(S.IDLE);
log('Riddle++ 已就绪');
log('点击右下角 ▷ 查看日志');
})();
