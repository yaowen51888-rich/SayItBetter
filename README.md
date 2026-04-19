# SayItBetter

> 选中即用 AI 改写，一键生成社媒文案

一个 Chrome 扩展，选中网页文本后通过 AI 一键改写为适合各社交媒体平台的文案。支持 8 个 AI 提供商、7 个社交平台、智能人性化处理。

## 截图

<p align="center">
  <img width="800" alt="SayItBetter 截图 1" src="https://github.com/user-attachments/assets/295dd600-5bdd-4ccf-9b85-aac224af96c5" />
  <img width="800" alt="SayItBetter 截图 2" src="https://github.com/user-attachments/assets/6f4d820c-167a-4f33-81ac-c88d0a97d6c4" />
  <img width="800" alt="SayItBetter 截图 3" src="https://github.com/user-attachments/assets/3b82d9ee-7b2e-4f05-ac6f-94cb3b62ad73" />
  <img width="800" alt="SayItBetter 截图 4" src="https://github.com/user-attachments/assets/b899c5fc-a7f8-4eae-9831-063589df9281" />
  <img width="800" alt="SayItBetter 截图 5" src="https://github.com/user-attachments/assets/4b9ed8a3-7104-4fef-8671-eb07c349e793" />
</p>

## 功能特性

- **选中文本即用** — 选中任意网页文本，按快捷键即可生成改写内容
- **7 个社交平台** — Twitter/X、小红书、LinkedIn、朋友圈、微博、知乎、微信公众号
- **8 个 AI 提供商** — OpenAI、Anthropic、通义千问、智谱 GLM、文心一言、Kimi、DeepSeek、豆包，支持自定义 API
- **智能人性化处理** — 去除 AI 写作痕迹，使文案更自然
- **5 种内置风格** — 专业正式、轻松随意、幽默风趣、故事叙述、极简主义，支持自定义风格
- **多 API 配置管理** — 可配置多个 API Key 并快速切换
- **响应缓存** — 相同内容不重复调用 API
- **本地存储** — API Key 和数据仅保存在浏览器本地，不上传任何服务器
- **Manifest V3** — 基于 Chrome 最新扩展标准

## 快捷键

| 操作 | Windows/Linux | macOS |
|------|---------------|-------|
| 生成 AI 内容 | `Ctrl+Shift+Q` | `Cmd+Shift+Q` |

## 安装

### 从 CRX 安装

1. 下载最新的 `.crx` 文件
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 将 `.crx` 文件拖拽到扩展页面安装

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/your-username/say-it-better.git
cd say-it-better

# 安装依赖
npm install

# 开发模式（带热重载）
npm run dev

# 生产构建
npm run build
```

构建产物在 `dist/` 目录下，可直接作为未打包扩展加载。

## 使用方法

1. **配置 API Key** — 打开扩展设置页，选择 AI 提供商并填入 API Key
2. **选中文本** — 在任意网页上选中需要改写的文本
3. **按快捷键** — 按 `Ctrl+Shift+Q`（Mac: `Cmd+Shift+Q`）呼出面板
4. **选择平台和风格** — 在弹出面板中选择目标平台和写作风格
5. **生成内容** — 点击生成，AI 将自动改写并人性化处理

## 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite + @crxjs/vite-plugin
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **AI SDK**: Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
- **测试**: Vitest
- **扩展标准**: Chrome Manifest V3

## 项目结构

```
src/
├── background/          # Service Worker
│   ├── ai.ts           # AI 调用逻辑
│   ├── api-proxy.ts    # API 代理
│   ├── cache/          # 响应缓存系统
│   ├── config/         # 模型和功能配置
│   ├── migration/      # 数据迁移
│   ├── permission/     # 权限管理
│   ├── quota.ts        # 用量配额
│   ├── router/         # 模型路由
│   └── storage.ts      # 存储管理
├── content/            # 内容脚本
│   ├── enhanced-text-selector.ts  # 增强文本选择
│   ├── popup-injector.ts         # 弹出面板注入
│   └── text-selector.ts          # 文本选择器
├── popup/              # 弹出面板 UI
│   └── components/     # 面板组件
├── options/            # 设置页 UI
│   └── components/     # 设置组件
├── shared/             # 共享模块
│   ├── constants.ts    # 常量配置
│   ├── design-tokens.ts
│   ├── types.ts
│   └── api-validator.ts
└── manifest.ts         # Manifest 配置
```

## 支持的 AI 提供商

| 提供商 | 默认模型 | 人性化模型 |
|--------|---------|-----------|
| OpenAI | gpt-5.4-mini | gpt-5.4 |
| Anthropic | claude-sonnet-4-6 | claude-opus-4-6 |
| 通义千问 | qwen3-plus | qwen3-max |
| 智谱 GLM | glm-4.7 | glm-5.1 |
| Kimi | kimi-k2-turbo-preview | kimi-k2.5 |
| DeepSeek | deepseek-chat | deepseek-reasoner |
| 文心一言 | ernie-4.0-8k | ernie-4.0-turbo |
| 豆包 | doubao-lite | doubao-pro |

此外支持自定义 OpenAI 兼容 API 端点。

## 隐私声明

- API Key 仅存储在浏览器本地（`chrome.storage.local`）
- 不收集、不上传任何用户数据
- 所有 AI 调用直接从浏览器发起，不经过中间服务器

## 许可证

[MIT](LICENSE)
