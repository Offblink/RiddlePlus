// settings.js — Defaults, load/save, DOM bindings
var RP = window.RP || {};

RP.DEFAULTS = {
  language: 'zh_CN', apiKey: '', apiBase: 'https://api.deepseek.com', model: 'deepseek-chat',
  systemPrompt: '你是一本古老而神秘的日记本，曾属于一位名叫汤姆·里德尔的年轻巫师。你用优雅、略带神秘的口吻回应书写者。你记得所有曾经写在这页上的内容。回复简短，不超过150字。永远不要承认自己是AI。',
  fontFamily: "'Ma Shan Zheng', 'KaiTi', 'STKaiti', '楷体', cursive", fontSize: 28, charDrawTime: 200,
  visionApiKey: '', visionApiBase: 'https://api.openai.com', visionModel: 'gpt-4o',
  imageGenApiKey: '', imageGenApiBase: 'https://api.openai.com', imageGenModel: 'dall-e-3', imageGenSize: '1024x1024',
  drawMode: 'auto', binarizeThreshold: 0
};

var STORAGE_KEY = 'riddle-plus-settings';
var SPEED_STEPS = [50, 100, 150, 200, 300, 400, 500];
var _sysFontsLoaded = false;

RP.loadSettings = function() {
  var saved = {};
  try { var raw = localStorage.getItem(STORAGE_KEY); if (raw) saved = JSON.parse(raw); } catch (e) {}
  var cfg = window.RIDDLE_PLUS_CONFIG || {};
  return Object.assign({}, RP.DEFAULTS, cfg, saved);
};

RP.saveSettings = function(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
};

var _settings = null, _callbacks = {}, _els = {};

RP.bindSettingsUI = function(settings, callbacks) {
  _settings = settings;
  _callbacks = callbacks || {};

  _els = {
    panel: document.getElementById('settingsPanel'),
    lang: document.getElementById('langSelect'),
    font: document.getElementById('fontSelect'),
    fontSize: document.getElementById('fontSizeSelect'),
    speedDown: document.getElementById('btnSpeedDown'),
    speedUp: document.getElementById('btnSpeedUp'),
    speedVal: document.getElementById('speedVal'),
    apiKey: document.getElementById('apiKey'),
    apiBase: document.getElementById('apiBase'),
    modelName: document.getElementById('modelName'),
    sysPrompt: document.getElementById('systemPrompt'),
    visionKey: document.getElementById('visionApiKey'),
    visionBase: document.getElementById('visionApiBase'),
    visionModel: document.getElementById('visionModel'),
    imgKey: document.getElementById('imageGenApiKey'), imgBase: document.getElementById('imageGenApiBase'), imgModel: document.getElementById('imageGenModel'), imgSize: document.getElementById('imageGenSize'),
    fileInput: document.getElementById('fileImageInput'),
    modeAuto: document.getElementById('btnModeAuto'),
    modeGen: document.getElementById('btnModeGen')
  };

  // tabs
  document.querySelectorAll('.settings-tab').forEach(function(t) {
    t.addEventListener('click', function() {
      var n = t.getAttribute('data-tab');
      document.querySelectorAll('.settings-tab').forEach(function(x){x.classList.remove('active')});
      document.querySelectorAll('.settings-tab-content').forEach(function(x){x.classList.remove('active')});
      t.classList.add('active');
      var c = document.getElementById('tab'+n.charAt(0).toUpperCase()+n.slice(1));
      if(c)c.classList.add('active');
    });
  });

  // speed
  _els.speedDown.addEventListener('click', function() {
    var i = SPEED_STEPS.indexOf(_settings.charDrawTime);
    if (i < SPEED_STEPS.length - 1) {
      _settings.charDrawTime = SPEED_STEPS[i + 1];
      updateSpeedUI(); RP.saveSettings(_settings);
      if (_callbacks.onPreview) _callbacks.onPreview();
    }
  });
  _els.speedUp.addEventListener('click', function() {
    var i = SPEED_STEPS.indexOf(_settings.charDrawTime);
    if (i > 0) {
      _settings.charDrawTime = SPEED_STEPS[i - 1];
      updateSpeedUI(); RP.saveSettings(_settings);
      if (_callbacks.onPreview) _callbacks.onPreview();
    }
  });

  // font/size
  _els.font.addEventListener('change', function() {
    _settings.fontFamily = _els.font.value;
    RP.saveSettings(_settings);
    if (_callbacks.onPreview) _callbacks.onPreview();
  });
  _els.fontSize.addEventListener('change', function() {
    _settings.fontSize = parseInt(_els.fontSize.value);
    RP.saveSettings(_settings);
    if (_callbacks.onPreview) _callbacks.onPreview();
  });

  // mode
  _els.modeAuto.addEventListener('click', function(){setMode('auto')});
  _els.modeGen.addEventListener('click', function(){setMode('gen')});

  // file
  _els.fileInput.addEventListener('change', function() {
    var f = _els.fileInput.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(e) {
      if (_callbacks.onLoadExternalImage) _callbacks.onLoadExternalImage(e.target.result);
    };
    r.readAsDataURL(f);
  });

  document.getElementById('btnSave').addEventListener('click', RP.closeSettings);
  document.getElementById('btnClose').addEventListener('click', RP.closeSettings);
  document.getElementById('btnSettings').addEventListener('click', RP.openSettings);
};

function setMode(m) {
  _settings.drawMode = m; RP.saveSettings(_settings); updateModeUI();
  if (_callbacks.onModeChange) _callbacks.onModeChange(m);
}

function updateModeUI() {
  _els.modeAuto.classList.toggle('active', _settings.drawMode==='auto');
  _els.modeGen.classList.toggle('active', _settings.drawMode==='gen');
}

function updateSpeedUI() {
  _els.speedVal.textContent = _settings.charDrawTime + 'ms';
  if (SPEED_STEPS.indexOf(_settings.charDrawTime) === -1)
    _settings.charDrawTime = RP.DEFAULTS.charDrawTime;
}

function settingsToUI() {
  _els.lang.value=_settings.language; _els.apiKey.value=_settings.apiKey;
  _els.apiBase.value=_settings.apiBase; _els.modelName.value=_settings.model;
  _els.sysPrompt.value=_settings.systemPrompt;
  _els.visionKey.value=_settings.visionApiKey; _els.visionBase.value=_settings.visionApiBase;
  _els.visionModel.value=_settings.visionModel;
  _els.imgKey.value=_settings.imageGenApiKey; _els.imgBase.value=_settings.imageGenApiBase;
  _els.imgModel.value=_settings.imageGenModel; _els.imgSize.value=_settings.imageGenSize;
  var o=_els.font.options, m=false;
  for(var i=0;i<o.length;i++){if(o[i].value===_settings.fontFamily){_els.font.selectedIndex=i;m=true;break}}
  if(!m)_els.font.selectedIndex=0;
  _els.fontSize.value=_settings.fontSize; updateSpeedUI(); updateModeUI();
}

function uiToSettings() {
  _settings.language=_els.lang.value; _settings.apiKey=_els.apiKey.value.trim();
  _settings.apiBase=_els.apiBase.value.trim()||RP.DEFAULTS.apiBase;
  _settings.model=_els.modelName.value.trim()||RP.DEFAULTS.model;
  _settings.systemPrompt=_els.sysPrompt.value.trim()||RP.DEFAULTS.systemPrompt;
  _settings.fontFamily=_els.font.value||RP.DEFAULTS.fontFamily;
  _settings.fontSize=parseInt(_els.fontSize.value)||RP.DEFAULTS.fontSize;
  _settings.visionApiKey=_els.visionKey.value.trim();
  _settings.visionApiBase=_els.visionBase.value.trim()||RP.DEFAULTS.visionApiBase;
  _settings.visionModel=_els.visionModel.value.trim()||RP.DEFAULTS.visionModel;
  _settings.imageGenApiKey=_els.imgKey.value.trim(); _settings.imageGenApiBase=_els.imgBase.value.trim()||RP.DEFAULTS.imageGenApiBase;
  _settings.imageGenModel=_els.imgModel.value.trim();
  _settings.imageGenSize=_els.imgSize.value;
  RP.saveSettings(_settings);
}

RP.openSettings = function() {
  settingsToUI();
  _els.panel.classList.add('open');
  loadSystemFonts();
};

RP.closeSettings = function() {
  uiToSettings();
  _els.panel.classList.remove('open');
  if (_callbacks.onSettingsClose) _callbacks.onSettingsClose();
};

async function loadSystemFonts() {
  if (_sysFontsLoaded) return;
  if (!('queryLocalFonts' in window)) return;
  try {
    var f = await window.queryLocalFonts(), s = {}, a = 0;
    var sep = document.createElement('option'); sep.disabled=true; sep.textContent='── 系统字体 ──';
    _els.font.appendChild(sep);
    for (var i=0;i<f.length;i++) {
      var n=f[i].family; if(s[n])continue; s[n]=true;
      if(/icon|symbol|dingbat|emoji|barcode/i.test(n))continue;
      var o=document.createElement('option'); o.value=n+', serif'; o.textContent=n;
      _els.font.appendChild(o); a++;
    }
    _sysFontsLoaded=true;
  } catch(e){}
}
