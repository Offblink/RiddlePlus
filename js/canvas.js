// canvas.js — Canvas initialization, stroke drawing, snapshot, image rendering
var RP = window.RP || {};

RP.INK   = '#2c1810';
RP.PAPER = '#f0e6d3';

RP.initCanvas = function(wrapEl) {
  var canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.cursor = 'crosshair';
  wrapEl.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  return { canvas: canvas, ctx: ctx };
};

RP.resizeCanvas = function(canvas, ctx, wrapEl) {
  var dpr = window.devicePixelRatio || 1;
  var r = wrapEl.getBoundingClientRect();
  var cssW = r.width, cssH = r.height;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return { cssW: cssW, cssH: cssH, dpr: dpr };
};

RP.drawStroke = function(ctx, stroke, alpha) {
  if (stroke.xs.length === 0) return;
  alpha = alpha != null ? alpha : 1;
  ctx.save();
  ctx.strokeStyle = RP.INK;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(stroke.xs[0], stroke.ys[0]);
  for (var i = 1; i < stroke.xs.length; i++) {
    ctx.lineTo(stroke.xs[i], stroke.ys[i]);
  }
  ctx.stroke();
  ctx.restore();
};

RP.redrawAll = function(ctx, strokes, cssW, cssH) {
  RP.clearCanvas(ctx, cssW, cssH);
  for (var i = 0; i < strokes.length; i++) {
    RP.drawStroke(ctx, strokes[i], strokes[i].alpha);
  }
};

RP.clearCanvas = function(ctx, cssW, cssH) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
};

RP.snapshotCanvas = function(canvas) {
  var snap = document.createElement('canvas');
  snap.width = canvas.width;
  snap.height = canvas.height;
  snap.getContext('2d').drawImage(canvas, 0, 0);
  return snap;
};

RP.getInkBounds = function(strokes) {
  if (strokes.length === 0) return null;
  var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (var i = 0; i < strokes.length; i++) {
    var s = strokes[i];
    for (var j = 0; j < s.xs.length; j++) {
      if (s.xs[j] < minX) minX = s.xs[j];
      if (s.xs[j] > maxX) maxX = s.xs[j];
      if (s.ys[j] < minY) minY = s.ys[j];
      if (s.ys[j] > maxY) maxY = s.ys[j];
    }
  }
  if (minX === Infinity) return null;
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
};

RP.renderImage = function(ctx, image, cssW, cssH) {
  var imgW = image.naturalWidth || image.width;
  var imgH = image.naturalHeight || image.height;
  var maxW = cssW * 0.9;
  var maxH = cssH * 0.9;
  var scale = Math.min(maxW / imgW, maxH / imgH, 1);
  var w = imgW * scale;
  var h = imgH * scale;
  var x = (cssW - w) / 2;
  var y = (cssH - h) / 2;
  ctx.drawImage(image, x, y, w, h);
  return { x: x, y: y, w: w, h: h };
};
