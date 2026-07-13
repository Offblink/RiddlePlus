// recognition.test.js — tests for Google IME recognition
window.recognitionRun = async function({ assert }) {
  var cases = [];

  function mockXHR(status, responseText) {
    var orig = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      var xhr = this;
      xhr.readyState=0; xhr.status=0; xhr.responseText=''; xhr._listeners={};
      xhr.open=function(){}; xhr.setRequestHeader=function(){};
      xhr.addEventListener=function(evt,fn) { if(!xhr._listeners[evt]) xhr._listeners[evt]=[]; xhr._listeners[evt].push(fn); };
      xhr.send=function(){ setTimeout(function(){ xhr.readyState=4;xhr.status=status;xhr.responseText=responseText;var fns=xhr._listeners['readystatechange']||[];for(var i=0;i<fns.length;i++)fns[i](); },0); };
    };
    return function() { window.XMLHttpRequest = orig; };
  }

  cases.push({
    name: 'returns text on 200',
    pass: await (async function(){ var r=mockXHR(200,JSON.stringify(['SUCCESS',[['zh_CN',['你好世界','你好'],[]]]]));try{var t=await RP.recognizeHandwriting([[[10,20,30],[50,60,70],[]]],'zh_CN',800,600);return t==='你好世界';}finally{r();} })(),
    message: ''
  });

  cases.push({
    name: 'returns null on empty',
    pass: await (async function(){ var r=mockXHR(200,JSON.stringify(['SUCCESS',[['zh_CN',[],[]]]]));try{var t=await RP.recognizeHandwriting([[[10],[50],[]]],'zh_CN',800,600);return t===null;}finally{r();} })(),
    message: ''
  });

  cases.push({
    name: 'throws on 403',
    pass: await (async function(){ var r=mockXHR(403,'');try{await RP.recognizeHandwriting([[[10],[50],[]]],'zh_CN',800,600);return false;}catch(e){return e.message.includes('拒绝');}finally{r();} })(),
    message: ''
  });

  cases.push({
    name: 'throws on 503',
    pass: await (async function(){ var r=mockXHR(503,'');try{await RP.recognizeHandwriting([[[10],[50],[]]],'zh_CN',800,600);return false;}catch(e){return e.message.includes('无法连接');}finally{r();} })(),
    message: ''
  });

  cases.push({
    name: 'throws on malformed JSON',
    pass: await (async function(){ var r=mockXHR(200,'not json');try{await RP.recognizeHandwriting([[[10],[50],[]]],'zh_CN',800,600);return false;}catch(e){return e.message.includes('解析');}finally{r();} })(),
    message: ''
  });

  return cases;
};
