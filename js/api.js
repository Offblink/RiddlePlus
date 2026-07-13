// api.js — Text LLM, Vision LLM, Image Generation clients
var RP = window.RP || {};

function throwIfNoKey(key, name) {
  if (!key) throw new Error('请先在设置中填入 ' + name);
}

async function fetchJson(url, opts, timeoutMs) {
  timeoutMs = timeoutMs || 30000;
  var controller = new AbortController();
  var timer = setTimeout(function() {
    controller.abort();
  }, timeoutMs);

  try {
    var resp = await fetch(url, Object.assign({}, opts, { signal: controller.signal }));
    clearTimeout(timer);
    var text = await resp.text();
    var data;
    try { data = JSON.parse(text); } catch (e) { data = { _raw: text }; }
    if (!resp.ok) {
      var errMsg = data.error
        ? (typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error)))
        : text.slice(0, 200);
      throw new Error('API 错误 (' + resp.status + '): ' + errMsg);
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('请求超时 (' + timeoutMs + 'ms)，请检查网络或 API 服务');
    }
    throw err;
  }
}

// Text LLM
RP.callLLM = async function(text, settings) {
  throwIfNoKey(settings.apiKey, 'LLM API Key');
  var body = {
    model: settings.model || 'deepseek-chat',
    messages: [
      { role: 'system', content: settings.systemPrompt },
      { role: 'user', content: text }
    ],
    max_tokens: 500,
    temperature: 0.8
  };
  var data = await fetchJson((settings.apiBase || 'https://api.deepseek.com') + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.apiKey },
    body: JSON.stringify(body)
  });
  return data.choices?.[0]?.message?.content || '(日记沉默了…)';
};

// Vision LLM
RP.callVisionLLM = async function(imageBase64, settings) {
  throwIfNoKey(settings.visionApiKey, 'Vision API Key');
  var body = {
    model: settings.visionModel || 'gpt-4o',
    messages: [
      { role: 'system', content: settings.systemPrompt },
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: imageBase64 } },
        { type: 'text', text: '请描述这幅画并回应。如果你想画一幅画来回应，请在回复末尾另起一行写上 ---DRAW---，然后下一行用英文描述你想画的画面。不要使用这个格式除非你真的想画图。' }
      ]}
    ],
    max_tokens: 800,
    temperature: 0.8
  };
  var data = await fetchJson((settings.visionApiBase || 'https://api.openai.com') + '/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.visionApiKey },
    body: JSON.stringify(body)
  });
  return RP._parseVisionResponse(data.choices?.[0]?.message?.content || '');
};

RP._parseVisionResponse = function(raw) {
  var drawPrompt = null, text = raw;
  var drawIdx = raw.indexOf('---DRAW---');
  if (drawIdx !== -1) {
    text = raw.substring(0, drawIdx).trim();
    var after = raw.substring(drawIdx + '---DRAW---'.length).trim();
    var endIdx = after.search(/---\w+---/);
    if (endIdx !== -1) after = after.substring(0, endIdx).trim();
    drawPrompt = after || null;
  }
  return { text: text || raw, drawPrompt: drawPrompt };
};

// Image Generation
RP.generateImage = async function(prompt, settings) {
  throwIfNoKey(settings.imageGenApiKey, 'Image Gen API Key');
  var size = settings.imageGenSize || '1024x1024';
  var body = { model: settings.imageGenModel || 'dall-e-3', prompt: prompt, n: 1, size: size, response_format: 'url' };
  var data = await fetchJson((settings.imageGenApiBase || 'https://api.openai.com') + '/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.imageGenApiKey },
    body: JSON.stringify(body)
  });
  var imageUrl = data.data?.[0]?.url;
  if (!imageUrl) throw new Error('图像生成 API 未返回图片 URL');
  return RP._loadImage(imageUrl);
};

RP._loadImage = function(src) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() { resolve(img); };
    img.onerror = function() { reject(new Error('无法加载生成的图片')); };
    img.src = src;
  });
};
