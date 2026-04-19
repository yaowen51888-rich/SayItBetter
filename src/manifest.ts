import packageJson from '../package.json' with { type: 'json' }

const { version } = packageJson

const manifest = {
  manifest_version: 3,
  name: '__MSG_extensionName__',
  version,
  description: '__MSG_extensionDescription__',
  default_locale: 'en',
  permissions: [
    'storage',
    'activeTab',
    'clipboardWrite',
    'alarms',
  ],
  optional_host_permissions: [
    'https://api.openai.com/*',
    'https://api.anthropic.com/*',
    'https://dashscope.aliyuncs.com/*',
    'https://open.bigmodel.cn/*',
    'https://aip.baidubce.com/*',
    'https://api.moonshot.cn/*',
    'https://api.deepseek.com/*',
    'https://ark.cn-beijing.volces.com/*',
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com https://api.anthropic.com https://dashscope.aliyuncs.com https://open.bigmodel.cn https://aip.baidubce.com https://api.moonshot.cn https://api.deepseek.com https://ark.cn-beijing.volces.com;",
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      exclude_matches: [
        'https://chrome.google.com/*',
      ],
      js: ['src/content/index.ts'],
      css: ['src/content/styles.css'],
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
  },
  options_page: 'src/options/index.html',
  commands: {
    'generate-content': {
      suggested_key: {
        default: 'Ctrl+Shift+Q',
        mac: 'Command+Shift+Q',
      },
      description: '__MSG_commandGenerateContent__',
    },
  },
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
} as const satisfies import('@crxjs/vite-plugin').ManifestV3Export

export default manifest
