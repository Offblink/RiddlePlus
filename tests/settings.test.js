// settings.test.js — tests for settings data layer
window.settingsRun = async function({ assert }) {
  var cases = [];

  cases.push({
    name: 'DEFAULTS has all required keys',
    pass: (function() {
      var required = ['language','apiKey','apiBase','model','systemPrompt','fontFamily','fontSize','charDrawTime','visionApiKey','visionApiBase','visionModel','imageGenApiKey','imageGenApiBase','imageGenModel','imageGenSize','drawMode','binarizeThreshold'];
      return required.every(function(k) { return k in RP.DEFAULTS; });
    })(),
    message: ''
  });

  cases.push({ name: 'DEFAULTS.drawMode is "auto"', pass: RP.DEFAULTS.drawMode === 'auto', message: RP.DEFAULTS.drawMode });
  cases.push({ name: 'DEFAULTS.binarizeThreshold is 0', pass: RP.DEFAULTS.binarizeThreshold === 0, message: String(RP.DEFAULTS.binarizeThreshold) });

  cases.push({
    name: 'loadSettings returns DEFAULTS when no overrides',
    pass: (function() {
      var saved = localStorage.getItem('riddle-plus-settings');
      localStorage.removeItem('riddle-plus-settings');
      var s = RP.loadSettings();
      if (saved !== null) localStorage.setItem('riddle-plus-settings', saved);
      return s.language === RP.DEFAULTS.language && s.fontSize === RP.DEFAULTS.fontSize && s.drawMode === 'auto';
    })(),
    message: ''
  });

  cases.push({
    name: 'saveSettings + loadSettings round-trip',
    pass: (function() {
      try {
        var s = RP.loadSettings(); s.language = 'ja'; s.drawMode = 'draw'; s.fontSize = 36;
        RP.saveSettings(s); var loaded = RP.loadSettings();
        var ok = loaded.language === 'ja' && loaded.drawMode === 'draw' && loaded.fontSize === 36;
        s.language = RP.DEFAULTS.language; s.drawMode = RP.DEFAULTS.drawMode; s.fontSize = RP.DEFAULTS.fontSize;
        RP.saveSettings(s); return ok;
      } catch(e) { return false; }
    })(), message: ''
  });

  cases.push({
    name: 'config.js overrides DEFAULTS',
    pass: (function() {
      var prevCfg = window.RIDDLE_PLUS_CONFIG, prevLS = localStorage.getItem('riddle-plus-settings');
      localStorage.removeItem('riddle-plus-settings');
      window.RIDDLE_PLUS_CONFIG = { language: 'en', fontSize: 24 };
      var s = RP.loadSettings(); window.RIDDLE_PLUS_CONFIG = prevCfg;
      if (prevLS !== null) localStorage.setItem('riddle-plus-settings', prevLS);
      return s.language === 'en' && s.fontSize === 24;
    })(), message: ''
  });

  cases.push({
    name: 'localStorage overrides config.js',
    pass: (function() {
      try {
        var prev = window.RIDDLE_PLUS_CONFIG; window.RIDDLE_PLUS_CONFIG = { language: 'en' };
        var s = RP.loadSettings(); s.language = 'fr'; RP.saveSettings(s);
        var loaded = RP.loadSettings(); window.RIDDLE_PLUS_CONFIG = prev;
        var ok = loaded.language === 'fr';
        s.language = RP.DEFAULTS.language; RP.saveSettings(s); return ok;
      } catch(e) { return false; }
    })(), message: ''
  });

  return cases;
};
