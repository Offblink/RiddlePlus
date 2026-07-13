// Riddle++ configuration template
// Copy to config.js and fill in your API keys.

window.RIDDLE_PLUS_CONFIG = {

  // ── Text LLM ──
  apiKey: 'sk-your-key-here',
  apiBase: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  systemPrompt: '你是一本古老而神秘的日记本，曾属于一位名叫汤姆·里德尔的年轻巫师。你用优雅、略带神秘的口吻回应书写者。你记得所有曾经写在这页上的内容。回复简短，不超过150字。永远不要承认自己是AI。',

  // ── Vision LLM ──
  visionApiKey: '',
  visionApiBase: 'https://api.openai.com',
  visionModel: 'gpt-4o',

  // ── AI Drawing ──
  imageGenApiKey: '', imageGenApiBase: 'https://api.openai.com',
  imageGenModel: 'dall-e-3',
  imageGenSize: '1024x1024',

  // ── Handwriting ──
  language: 'zh_CN',
  fontFamily: "'Ma Shan Zheng', 'KaiTi', 'STKaiti', '楷体', cursive",
  fontSize: 28,
  charDrawTime: 200,

  // ── Mode ──
  drawMode: 'auto',
  binarizeThreshold: 0
};
