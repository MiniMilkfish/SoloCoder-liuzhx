let envConfig = null

console.log(`[Config] 开始加载配置模块`)

try {
  console.log(`[Config] 尝试加载 env.js`)
  envConfig = require('./env.js')
  console.log(`[Config] env.js 加载成功: API_PROVIDER=${envConfig.API_PROVIDER}`)
  console.log(`[Config] env.js API_KEYS:`, Object.keys(envConfig.API_KEYS || {}))
} catch (e) {
  console.warn(`[Config] 未找到环境配置文件 env.js，使用默认配置. Error:`, e)
  envConfig = {
    API_PROVIDER: 'mock',
    API_KEYS: {
      juhe: '',
      istero: '',
      api52: ''
    }
  }
}

console.log(`[Config] 当前 envConfig:`, JSON.stringify({
  API_PROVIDER: envConfig.API_PROVIDER,
  hasJuheKey: !!(envConfig.API_KEYS?.juhe),
  hasIsteroKey: !!(envConfig.API_KEYS?.istero),
  hasApi52Key: !!(envConfig.API_KEYS?.api52)
}))

const API_CONFIG = {
  currentProvider: envConfig.API_PROVIDER || 'mock',
  
  providers: {
    juhe: {
      name: '聚合数据',
      baseUrl: 'https://apis.juhe.cn/gnyj/query',
      apiKey: envConfig.API_KEYS?.juhe || '',
      freeLimit: 50,
      description: '今日国内油价查询，支持20+省份'
    },
    
    istero: {
      name: '起零数据',
      baseUrl: 'https://api.istero.com/resource/v1/oilprice',
      apiKey: envConfig.API_KEYS?.istero || '',
      freeLimit: 300,
      description: '全国省份实时油价查询，免费300次/天'
    },
    
    api52: {
      name: '52API',
      baseUrl: 'https://www.52api.cn/api/oilPrice',
      apiKey: envConfig.API_KEYS?.api52 || '',
      freeLimit: 100,
      description: '免费全国今日油价查询接口'
    },
    
    mock: {
      name: '模拟数据',
      baseUrl: '',
      apiKey: '',
      freeLimit: 999999,
      description: '本地模拟数据，用于开发测试'
    }
  }
}

console.log(`[Config] API_CONFIG 初始化完成: currentProvider=${API_CONFIG.currentProvider}`)
console.log(`[Config] juhe apiKey: ${API_CONFIG.providers.juhe.apiKey ? '已配置' : '未配置'}`)

let isConfigInitialized = false

function initializeConfig() {
  if (isConfigInitialized) {
    console.log(`[Config] 配置已初始化，跳过`)
    return
  }
  
  console.log(`[Config] 开始初始化配置`)
  
  if (envConfig.API_PROVIDER && API_CONFIG.providers[envConfig.API_PROVIDER]) {
    API_CONFIG.currentProvider = envConfig.API_PROVIDER
    console.log(`[Config] 使用 env.js 中的 provider: ${API_CONFIG.currentProvider}`)
  } else {
    const savedProvider = wx.getStorageSync('apiProvider')
    if (savedProvider && API_CONFIG.providers[savedProvider]) {
      API_CONFIG.currentProvider = savedProvider
      console.log(`[Config] 使用本地存储中的 provider: ${API_CONFIG.currentProvider}`)
    }
  }
  
  if (envConfig.API_KEYS && envConfig.API_KEYS[API_CONFIG.currentProvider]) {
    API_CONFIG.providers[API_CONFIG.currentProvider].apiKey = envConfig.API_KEYS[API_CONFIG.currentProvider]
    console.log(`[Config] 使用 env.js 中的 API Key`)
  } else {
    const savedKey = wx.getStorageSync('apiKey_' + API_CONFIG.currentProvider)
    if (savedKey) {
      API_CONFIG.providers[API_CONFIG.currentProvider].apiKey = savedKey
      console.log(`[Config] 使用本地存储中的 API Key`)
    }
  }
  
  console.log(`[Config] 初始化完成: provider=${API_CONFIG.currentProvider}, apiKey=${API_CONFIG.providers[API_CONFIG.currentProvider].apiKey ? '已配置' : '未配置'}`)
  
  isConfigInitialized = true
}

function getApiConfig() {
  initializeConfig()
  return API_CONFIG
}

function setApiProvider(provider) {
  if (API_CONFIG.providers[provider]) {
    API_CONFIG.currentProvider = provider
    wx.setStorageSync('apiProvider', provider)
    return true
  }
  return false
}

function setApiKey(provider, key) {
  if (API_CONFIG.providers[provider]) {
    API_CONFIG.providers[provider].apiKey = key
    wx.setStorageSync('apiKey_' + provider, key)
    return true
  }
  return false
}

function getCurrentProvider() {
  initializeConfig()
  return API_CONFIG.currentProvider
}

function getCurrentConfig() {
  initializeConfig()
  return API_CONFIG.providers[API_CONFIG.currentProvider]
}

function getAvailableProviders() {
  return Object.keys(API_CONFIG.providers).map(key => ({
    key: key,
    ...API_CONFIG.providers[key]
  }))
}

module.exports = {
  getApiConfig,
  setApiProvider,
  setApiKey,
  getCurrentProvider,
  getCurrentConfig,
  getAvailableProviders,
  API_CONFIG,
  initializeConfig
}
