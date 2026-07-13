// animation.js — Text reveal animation, canvas fade transitions, image display
var RP = window.RP || {};

RP.fadeCanvas = function(ctx, canvas, cssW, cssH, duration) {
  duration = duration || 600;
  var snap = RP.snapshotCanvas(canvas);

  return new Promise(function(resolve) {
    var start = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - start) / duration);
      var alpha = 1 - p;
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
};

RP.animateText = async function(ctx, text, cssW, cssH, settings, inkBounds) {
  var fontFamily = settings.fontFamily;
  var fontSize = settings.fontSize;
  var charDrawTime = settings.charDrawTime || 200;

  var minDim = Math.min(cssW, cssH);
  if (fontSize > minDim * 0.15) fontSize = Math.floor(minDim * 0.15);
  if (fontSize > cssW / 10) fontSize = Math.floor(cssW / 10);

  ctx.font = fontSize + 'px ' + fontFamily;
  ctx.fillStyle = 'rgba(44, 24, 16, 0.7)';
  ctx.textBaseline = 'middle';

  var margin = 40;
  var maxWidth = cssW - margin * 2;
  var lineHeight = fontSize * 1.6;
  var chars = [...text];

  var lines = [], curLine = '';
  for (var i = 0; i < chars.length; i++) {
    var ch = chars[i];
    if (ch === '\n') { lines.push(curLine); curLine = ''; continue; }
    var testLine = curLine + ch;
    if (ctx.measureText(testLine).width > maxWidth && curLine.length > 0) {
      lines.push(curLine); curLine = ch;
    } else { curLine = testLine; }
  }
  if (curLine) lines.push(curLine);

  var textHeight = lines.length * lineHeight;
  var y;
  if (inkBounds) {
    var pad = fontSize * 0.8;
    var inkTop = inkBounds.minY - pad, inkBot = inkBounds.maxY + pad;
    var spaceAbove = inkTop - margin, spaceBelow = cssH - inkBot - margin;
    if (textHeight <= spaceAbove) y = Math.max(margin, inkTop - textHeight);
    else if (textHeight <= spaceBelow) y = inkBot;
    else if (spaceAbove >= spaceBelow) y = Math.max(margin, inkTop - textHeight);
    else y = inkBot;
  } else {
    y = Math.max(margin, (cssH - textHeight) / 2);
  }
  if (y < margin) y = margin;

  for (var li = 0; li < lines.length; li++) {
    var line = lines[li];
    var lineW = ctx.measureText(line).width;
    var x = Math.max(margin, (cssW - lineW) / 2);
    var drawY = y + lineHeight / 2;
    if (y + lineHeight > cssH) break;

    for (var ci = 0; ci < line.length; ci++) {
      var ch2 = line[ci];
      var chW = ctx.measureText(ch2).width;
      await RP._revealChar(ctx, ch2, x, drawY, chW, fontSize, charDrawTime);
      x += chW;
    }
    y += lineHeight;
  }
};

RP._revealChar = function(ctx, ch, x, y, chW, fH, charDrawTime) {
  return new Promise(function(resolve) {
    var start = performance.now(), top = y - fH / 2;
    function frame(now) {
      var p = Math.min(1, (now - start) / charDrawTime);
      var clipW = chW * (1 - Math.pow(1 - p, 3));
      ctx.clearRect(x, top, chW + 2, fH + 2);
      ctx.save();
      ctx.beginPath(); ctx.rect(x, top, clipW, fH); ctx.clip();
      ctx.fillText(ch, x, y);
      ctx.restore();
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
};

RP.revealImage = function(ctx, image, cssW, cssH) {
  var offscreen = document.createElement('canvas');
  offscreen.width = cssW; offscreen.height = cssH;
  var offCtx = offscreen.getContext('2d');

  var imgW = image.naturalWidth || image.width;
  var imgH = image.naturalHeight || image.height;
  var maxW = cssW * 0.85, maxH = cssH * 0.85;
  var scale = Math.min(maxW / imgW, maxH / imgH, 1);
  var w = imgW * scale, h = imgH * scale;
  var x = (cssW - w) / 2, y = (cssH - h) / 2;
  offCtx.drawImage(image, x, y, w, h);

  var duration = 1200, start = performance.now();
  return new Promise(function(resolve) {
    function frame(now) {
      var p = Math.min(1, (now - start) / duration);
      var alpha = Math.pow(p, 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(offscreen, 0, 0);
      ctx.globalAlpha = 1;
      ctx.restore();
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
};
