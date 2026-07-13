// binarize.js — Otsu adaptive threshold binarization
var RP = window.RP || {};

var PAPER_R = 240, PAPER_G = 230, PAPER_B = 211;
var INK_R   = 44,  INK_G   = 24,  INK_B   = 16;

RP.binarize = function(source, targetCanvas, options) {
  options = options || {};
  var algo = options.algorithm || 'otsu';
  var fixedT = options.threshold || 128;

  var w, h;
  if (source instanceof HTMLImageElement) {
    w = source.naturalWidth || source.width;
    h = source.naturalHeight || source.height;
  } else {
    w = source.width;
    h = source.height;
  }

  targetCanvas.width = w;
  targetCanvas.height = h;
  var ctx = targetCanvas.getContext('2d');
  ctx.drawImage(source, 0, 0);

  var imageData = ctx.getImageData(0, 0, w, h);
  var data = imageData.data;
  var len = data.length;

  var threshold;
  if (algo === 'fixed') {
    threshold = fixedT;
  } else {
    var histogram = new Array(256);
    for (var i = 0; i < 256; i++) histogram[i] = 0;
    for (var i = 0; i < len; i += 4) {
      var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) { histogram[255]++; continue; }
      var gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      histogram[gray]++;
    }

    var total = w * h;
    var sum = 0;
    for (var t = 0; t < 256; t++) sum += t * histogram[t];
    var sumB = 0, wB = 0, maxVariance = 0;
    threshold = 128;
    for (var t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      var wF = total - wB;
      if (wF === 0) break;
      sumB += t * histogram[t];
      var mB = sumB / wB;
      var mF = (sum - sumB) / wF;
      var variance = wB * wF * (mB - mF) * (mB - mF);
      if (variance > maxVariance) { maxVariance = variance; threshold = t; }
    }
  }

  for (var i = 0; i < len; i += 4) {
    var a = data[i + 3];
    if (a < 128) {
      data[i] = PAPER_R; data[i + 1] = PAPER_G; data[i + 2] = PAPER_B; data[i + 3] = 255;
      continue;
    }
    var gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    if (gray > threshold) {
      data[i] = PAPER_R; data[i + 1] = PAPER_G; data[i + 2] = PAPER_B;
    } else {
      data[i] = INK_R; data[i + 1] = INK_G; data[i + 2] = INK_B;
    }
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
};
