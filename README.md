# Riddle++


[Riddle--](https://github.com/Offblink/Riddle--) 的进化版。与 Riddle-- 的单 HTML 文件不同，Riddle++ 采用**多文件架构**：JS 模块各司其职，CSS 独立，全局命名空间加载。零构建，双击即开。

## 与 riddle / Riddle-- 的差异

| | **riddle（原版）** | **Riddle--** | **Riddle++** |
|---|---|---|---|
| **平台** | reMarkable Paper Pro | 任何浏览器 | 任何浏览器 |
| **语言** | Rust + C/C++ | 单 HTML + JS | 多文件 JS，全局命名空间 |
| **显示** | e-ink 直驱 | Canvas | Canvas |
| **笔输入** | evdev，4096 级压感 | Pointer events | Pointer events |
| **手写识别** | Vision LLM 读整页 PNG | Google IME 笔画 API | Google IME → 失败则 Vision LLM |
| **识图** | 同上（Vision LLM） | 不支持 | Vision LLM（GPT-4o） |
| **AI 绘图** | 不支持 | 不支持 | LLM 触发 DALL·E 3 → Otsu 二值化 |
| **手写合成** | 字体 → Zhang-Suen 骨架 → 笔画追踪动画 | Canvas fillText + clip reveal | Canvas fillText + clip reveal |
| **记忆** | 设备本地文件 | 无 | 无 |
| **单次交互成本** | ~500–1000 vision tokens | ~50 text tokens | ~50（自动模式）/ ~500+（识图模式） |
| **设置面板** | oracle.env 文件 | ⚙ 侧边栏 | DevTools 式侧栏，画布自动缩窄 |

## 快速开始

```bash
cp config.example.js config.js   # 填入 API Key
# 双击 index.html
```

- **文字回复**：DeepSeek API Key（免费注册）
- **识图 + 生图**：OpenAI API Key（GPT-4o + DALL·E 3），或任何 OpenAI 兼容 Vision API

## 模式

| 模式 | 行为 |
|---|---|
| 🤖 自动 | Google IME 识别文字 → 成功：文字 LLM 回复 → 失败/无意义：截图 → Vision LLM → 文字回复 + 可选 AI 绘图 |
| 🎨 始终生图 | 跳过文字识别，直接截图 → Vision LLM → 文字回复 + AI 绘图 |

## 操作

| 操作 | 效果 |
|---|---|
| 写字/画画，停笔 2.8s | 自动识别并回复 |
| Ctrl+Z / ↩ | 撤销 |
| ⚙ | 设置面板（右侧滑出，画布自动缩窄） |
| ▷ | 调试日志 |

## 设置面板

两个 tab：**文字** / **图像**，DevTools 式右侧滑出。

### 文字 tab
手写语言、回复字体、字号、显示速度、文字 LLM（默认 DeepSeek，兼容 OpenAI 格式）。

### 图像 tab
模式切换、Vision LLM（`/v1/chat/completions`，默认 GPT-4o）、AI 绘图（`/v1/images/generations`，默认 DALL·E 3）、图像预览（选本地图 → Otsu 二值化 → 显示在画布上）。

> 💡 接口格式参考 OpenAI 文档设计，已通过 mock 测试。作者暂无 Key 实机验证，如有兼容性问题欢迎提 [Issue](https://github.com/Offblink/RiddlePlus/issues)。

## 二值化

AI 生图和图像预览均经过 **Otsu 自适应阈值** 二值化后显示：
亮像素 → 纸色 `#f0e6d3`，暗像素 → 墨色 `#2c1810`，与日记本质感一致。

## 项目结构

```
Riddle++/
├── index.html
├── css/style.css
├── js/
│   ├── main.js          # 状态机 + 指针事件 + 流程编排
│   ├── canvas.js        # Canvas 初始化、墨迹、截图
│   ├── recognition.js   # Google IME 手写识别
│   ├── api.js           # 文字 LLM / Vision LLM / DALL·E 客户端
│   ├── binarize.js      # Otsu 自适应二值化
│   ├── animation.js     # 文字逐字 reveal、渐隐过渡
│   └── settings.js      # 配置数据层 + 设置面板 DOM 绑定
├── config.example.js
├── config.js            # 用户配置（gitignore）
├── Monocraft.ttf
└── tests/               # 40 个测试用例
```

## 致谢
- [riddle](https://github.com/MaximeRivest/riddle) — 原版 e-ink 手写日记，Tom Riddle 的日记本
- [handwriting.js](https://github.com/ChenYuHo/handwriting.js) — Google IME 手写识别
- [Monocraft](https://github.com/IdreesInc/Monocraft) — UI 字体
## 许可证

MIT
