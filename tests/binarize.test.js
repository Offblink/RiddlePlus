// binarize.test.js — tests for Otsu binarization
window.binarizeRun = async function({ assert }) {
  var cases = [];

  function makeTestCanvas(w, h, r, g, b) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').fillStyle = 'rgb('+r+','+g+','+b+')';
    c.getContext('2d').fillRect(0,0,w,h);
    return c;
  }
  function countColors(canvas) {
    var data = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    var colors = new Set();
    for (var i = 0; i < data.length; i += 4) colors.add(data[i]+','+data[i+1]+','+data[i+2]);
    return { count: colors.size, colors: Array.from(colors) };
  }

  cases.push({
    name: 'pure white → all paper-color',
    pass: (function(){ var s=makeTestCanvas(10,10,255,255,255); var d=document.createElement('canvas'); RP.binarize(s,d); var c=countColors(d); return c.count===1&&c.colors[0]==='240,230,211'; })(),
    message: ''
  });

  cases.push({
    name: 'pure black → all ink-color',
    pass: (function(){ var s=makeTestCanvas(10,10,0,0,0); var d=document.createElement('canvas'); RP.binarize(s,d); var c=countColors(d); return c.count===1&&c.colors[0]==='44,24,16'; })(),
    message: ''
  });

  cases.push({
    name: 'mixed → exactly 2 colors',
    pass: (function(){ var s=document.createElement('canvas'); s.width=20;s.height=20;var c=s.getContext('2d');c.fillStyle='#000';c.fillRect(0,0,10,20);c.fillStyle='#fff';c.fillRect(10,0,10,20);var d=document.createElement('canvas');RP.binarize(s,d);return countColors(d).count===2; })(),
    message: ''
  });

  cases.push({
    name: 'Otsu invariant to pixel order',
    pass: (function(){ var s1=document.createElement('canvas');s1.width=16;s1.height=16;var c1=s1.getContext('2d');var s2=document.createElement('canvas');s2.width=16;s2.height=16;var c2=s2.getContext('2d');for(var y=0;y<16;y++)for(var x=0;x<16;x++){var g=(x+y*16)%256;c1.fillStyle='rgb('+g+','+g+','+g+')';c1.fillRect(x,y,1,1);c2.fillStyle='rgb('+(255-g)+','+(255-g)+','+(255-g)+')';c2.fillRect(x,y,1,1);}var d1=document.createElement('canvas'),d2=document.createElement('canvas');RP.binarize(s1,d1);RP.binarize(s2,d2);return countColors(d1).count===2&&countColors(d2).count===2; })(),
    message: ''
  });

  cases.push({
    name: 'fixed threshold mode',
    pass: (function(){ var s=document.createElement('canvas');s.width=1;s.height=1;s.getContext('2d').fillStyle='rgb(200,200,200)';s.getContext('2d').fillRect(0,0,1,1);var d=document.createElement('canvas');RP.binarize(s,d,{algorithm:'fixed',threshold:128});return countColors(d).colors[0]==='240,230,211'; })(),
    message: ''
  });

  cases.push({
    name: 'fixed threshold dark → ink',
    pass: (function(){ var s=document.createElement('canvas');s.width=1;s.height=1;s.getContext('2d').fillStyle='rgb(50,50,50)';s.getContext('2d').fillRect(0,0,1,1);var d=document.createElement('canvas');RP.binarize(s,d,{algorithm:'fixed',threshold:128});return countColors(d).colors[0]==='44,24,16'; })(),
    message: ''
  });

  cases.push({
    name: 'target canvas resized',
    pass: (function(){ var s=makeTestCanvas(30,20,128,128,128);var d=document.createElement('canvas');d.width=10;d.height=10;RP.binarize(s,d);return d.width===30&&d.height===20; })(),
    message: ''
  });

  cases.push({
    name: 'transparent → paper',
    pass: (function(){ var s=document.createElement('canvas');s.width=3;s.height=3;s.getContext('2d').clearRect(0,0,3,3);var d=document.createElement('canvas');RP.binarize(s,d);var c=countColors(d);return c.count===1&&c.colors[0]==='240,230,211'; })(),
    message: ''
  });

  return cases;
};
