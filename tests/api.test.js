// api.test.js — tests for API clients
window.apiRun = async function({ assert }) {
  var cases = [];

  function makeSettings(o) {
    return Object.assign({
      language:'zh_CN',apiKey:'sk-test',apiBase:'https://api.test.com',model:'test-model',
      systemPrompt:'You are a test.',
      visionApiKey:'sk-vision',visionApiBase:'https://vision.test.com',visionModel:'vision-model',
      imageGenApiKey:'sk-img',imageGenModel:'dall-e-3',imageGenSize:'1024x1024',
      charDrawTime:200,fontFamily:'serif',fontSize:28
    }, o||{});
  }

  function mockFetch(response, status) {
    status = status || 200;
    var o = window.fetch;
    window.fetch = function(u,p) { return Promise.resolve({ ok:status>=200&&status<300, status:status, json:function(){return Promise.resolve(response);}, text:function(){return Promise.resolve(JSON.stringify(response));} }); };
    return function() { window.fetch = o; };
  }

  function mockImage() {
    var O = window.Image;
    window.Image = function(){ var i=new O(); Object.defineProperty(i,'src',{set:function(v){this._src=v;setTimeout(function(){if(i.onload)i.onload();},0);},get:function(){return this._src;}}); return i; };
    return function() { window.Image = O; };
  }

  cases.push({ name:'callLLM returns text', pass: await (async function(){ var r=mockFetch({choices:[{message:{content:'你好'}}]});try{return await RP.callLLM('测试',makeSettings())==='你好';}finally{r();} })(), message:'' });
  cases.push({ name:'callLLM throws when no key', pass: await (async function(){ try{await RP.callLLM('t',makeSettings({apiKey:''}));return false;}catch(e){return e.message.includes('API Key');} })(), message:'' });
  cases.push({ name:'callLLM throws on HTTP error', pass: await (async function(){ var r=mockFetch({error:'unauthorized'},401);try{await RP.callLLM('t',makeSettings());return false;}catch(e){return e.message.includes('401');}finally{r();} })(), message:'' });

  cases.push({ name:'callVisionLLM returns text without draw', pass: await (async function(){ var r=mockFetch({choices:[{message:{content:'我看到一幅画。'}}]});try{var result=await RP.callVisionLLM('data:image/png;base64,abc',makeSettings());return result.text==='我看到一幅画。'&&result.drawPrompt===null;}finally{r();} })(), message:'' });
  cases.push({ name:'callVisionLLM parses ---DRAW---', pass: await (async function(){ var r=mockFetch({choices:[{message:{content:'蛇…\n\n---DRAW---\nA snake eating elephant'}}]});try{var result=await RP.callVisionLLM('data:image/png;base64,abc',makeSettings());return result.text==='蛇…'&&result.drawPrompt==='A snake eating elephant';}finally{r();} })(), message:'' });
  cases.push({ name:'callVisionLLM handles empty', pass: await (async function(){ var r=mockFetch({choices:[{message:{content:''}}]});try{var result=await RP.callVisionLLM('data:image/png;base64,abc',makeSettings());return result.text!==null&&result.drawPrompt===null;}finally{r();} })(), message:'' });

  cases.push({ name:'generateImage DALL-E', pass: await (async function(){ var rf=mockFetch({data:[{url:'https://x.com/img.png'}]}),ri=mockImage();try{var img=await RP.generateImage('cat',makeSettings());return img instanceof HTMLImageElement&&img.src==='https://x.com/img.png';}finally{rf();ri();} })(), message:'' });
  cases.push({ name:'generateImage throws on error', pass: await (async function(){ var r=mockFetch({error:{message:'filtered'}},400);try{await RP.generateImage('t',makeSettings());return false;}catch(e){return e.message.includes('400')||e.message.includes('filtered');}finally{r();} })(), message:'' });

  return cases;
};
