// canvas.test.js — tests for canvas module
window.canvasRun = async function({ assert }) {
  var cases = [];

  cases.push({ name: 'INK is #2c1810', pass: RP.INK === '#2c1810', message: RP.INK });
  cases.push({ name: 'PAPER is #f0e6d3', pass: RP.PAPER === '#f0e6d3', message: RP.PAPER });

  cases.push({
    name: 'initCanvas returns canvas and ctx',
    pass: (function(){ var wrap=document.createElement('div');wrap.style.width='400px';wrap.style.height='300px';document.body.appendChild(wrap);var r=RP.initCanvas(wrap);var ok=r.canvas instanceof HTMLCanvasElement&&r.ctx!==null;document.body.removeChild(wrap);return ok; })(),
    message: ''
  });

  cases.push({
    name: 'clearCanvas clears area',
    pass: (function(){ var c=document.createElement('canvas');c.width=100;c.height=100;var ctx=c.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,100,100);RP.clearCanvas(ctx,100,100);return ctx.getImageData(50,50,1,1).data[3]===0; })(),
    message: ''
  });

  cases.push({
    name: 'drawStroke draws line',
    pass: (function(){ var c=document.createElement('canvas');c.width=100;c.height=100;var ctx=c.getContext('2d');RP.drawStroke(ctx,{xs:[10,90],ys:[50,50]},1);return ctx.getImageData(50,50,1,1).data[3]>0; })(),
    message: ''
  });

  cases.push({
    name: 'drawStroke alpha 0.5',
    pass: (function(){ var c=document.createElement('canvas');c.width=100;c.height=100;var ctx=c.getContext('2d');RP.drawStroke(ctx,{xs:[10,90],ys:[50,50]},0.5);var a=ctx.getImageData(50,50,1,1).data[3];return a>0&&a<255; })(),
    message: ''
  });

  cases.push({
    name: 'redrawAll redraws all',
    pass: (function(){ var c=document.createElement('canvas');c.width=100;c.height=100;var ctx=c.getContext('2d');RP.redrawAll(ctx,[{xs:[10,90],ys:[30,30]},{xs:[10,90],ys:[70,70]}],100,100);return ctx.getImageData(50,30,1,1).data[3]>0&&ctx.getImageData(50,70,1,1).data[3]>0; })(),
    message: ''
  });

  cases.push({
    name: 'redrawAll empty does not throw',
    pass: (function(){ try { RP.redrawAll(document.createElement('canvas').getContext('2d'),[],10,10); return true; } catch(e){ return false; } })(),
    message: ''
  });

  cases.push({
    name: 'snapshotCanvas copy',
    pass: (function(){ var c=document.createElement('canvas');c.width=10;c.height=10;var ctx=c.getContext('2d');ctx.fillStyle='#f00';ctx.fillRect(2,2,6,6);var snap=RP.snapshotCanvas(c);var o=ctx.getImageData(5,5,1,1).data;var s=snap.getContext('2d').getImageData(5,5,1,1).data;return o[0]===s[0]&&o[1]===s[1]&&o[2]===s[2]; })(),
    message: ''
  });

  cases.push({
    name: 'getInkBounds returns bounds',
    pass: (function(){ var b=RP.getInkBounds([{xs:[10,90],ys:[20,20]},{xs:[50,50],ys:[10,80]}]);return b.minX===10&&b.maxX===90&&b.minY===10&&b.maxY===80; })(),
    message: ''
  });

  cases.push({
    name: 'getInkBounds null for empty',
    pass: RP.getInkBounds([]) === null,
    message: ''
  });

  cases.push({
    name: 'renderImage centers',
    pass: (function(){ var c=document.createElement('canvas');c.width=200;c.height=100;var ctx=c.getContext('2d');var src=document.createElement('canvas');src.width=50;src.height=50;src.getContext('2d').fillStyle='#f00';src.getContext('2d').fillRect(0,0,50,50);var img=new Image();img.src=src.toDataURL();var r=RP.renderImage(ctx,img,200,100);return r.w<=100&&r.h<=100&&r.x>=0&&r.y>=0; })(),
    message: ''
  });

  return cases;
};
