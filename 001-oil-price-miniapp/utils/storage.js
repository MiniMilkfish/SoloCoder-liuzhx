const { getCurrentConfig, getCurrentProvider } = require('./config.js')

const STORAGE_KEYS = {
  OIL_PRICE_HISTORY: 'oil_price_history',
  API_USAGE_STATS: 'api_usage_stats',
  LAST_FETCH_DATE: 'last_fetch_date',
  LAST_PROVIDER: 'last_provider'
}

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function checkProviderChanged() {
  const currentProvider = getCurrentProvider()
  const lastProvider = wx.getStorageSync(STORAGE_KEYS.LAST_PROVIDER)
  
  if (lastProvider && lastProvider !== currentProvider) {
    console.log(`Provider从 ${lastProvider} 切换到 ${currentProvider}，清除旧缓存`)
    wx.removeStorageSync(STORAGE_KEYS.OIL_PRICE_HISTORY)
    wx.removeStorageSync(STORAGE_KEYS.LAST_FETCH_DATE)
    wx.removeStorageSync(STORAGE_KEYS.LAST_PROVIDER)
    wx.removeStorageSync(STORAGE_KEYS.API_USAGE_STATS)
    return true
  }
  
  wx.setStorageSync(STORAGE_KEYS.LAST_PROVIDER, currentProvider)
  return false
}

function saveOilPriceData(city, oilData, provider = null) {
  try {
    checkProviderChanged()
    
    const history = getOilPriceHistory()
    const today = getTodayString()
    const currentProvider = provider || getCurrentProvider()
    
    if (!history[city]) {
      history[city] = {}
    }
    
    if (!history[city][today]) {
      history[city][today] = []
    }
    
    const record = {
      ...oilData,
      timestamp: Date.now(),
      date: today,
      provider: currentProvider
    }
    
    history[city][today].push(record)
    
    wx.setStorageSync(STORAGE_KEYS.OIL_PRICE_HISTORY, history)
    return true
  } catch (e) {
    console.error('保存油价数据失败:', e)
    return false
  }
}

function getOilPriceHistory() {
  try {
    checkProviderChanged()
    
    const history = wx.getStorageSync(STORAGE_KEYS.OIL_PRICE_HISTORY)
    return history || {}
  } catch (e) {
    console.error('获取历史数据失败:', e)
    return {}
  }
}

function getCityHistory(city, days = 30) {
  const history = getOilPriceHistory()
  if (!history[city]) {
    return []
  }
  
  const currentProvider = getCurrentProvider()
  const cityData = history[city]
  const dates = Object.keys(cityData).sort().reverse()
  const result = []
  
  for (let i = 0; i < Math.min(days, dates.length); i++) {
    const date = dates[i]
    const records = cityData[date]
    if (records && records.length > 0) {
      const latestRecord = records[records.length - 1]
      
      if (latestRecord.provider === currentProvider) {
        result.push({
          date: date,
          ...latestRecord
        })
      }
    }
  }
  
  return result.reverse()
}

function getLatestOilPrice(city) {
  const history = getOilPriceHistory()
  if (!history[city]) {
    return null
  }
  
  const currentProvider = getCurrentProvider()
  const cityData = history[city]
  const dates = Object.keys(cityData).sort()
  
  if (dates.length === 0) {
    return null
  }
  
  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i]
    const records = cityData[date]
    
    if (records && records.length > 0) {
      const latestRecord = records[records.length - 1]
      
      if (latestRecord.provider === currentProvider) {
        return latestRecord
      }
    }
  }
  
  return null
}

function isTodayFetched(city) {
  const lastFetch = wx.getStorageSync(STORAGE_KEYS.LAST_FETCH_DATE + '_' + city)
  const today = getTodayString()
  return lastFetch === today
}

function markTodayFetched(city) {
  const today = getTodayString()
  wx.setStorageSync(STORAGE_KEYS.LAST_FETCH_DATE + '_' + city, today)
}

function clearAllCache() {
  try {
    wx.removeStorageSync(STORAGE_KEYS.OIL_PRICE_HISTORY)
    wx.removeStorageSync(STORAGE_KEYS.LAST_FETCH_DATE)
    wx.removeStorageSync(STORAGE_KEYS.LAST_PROVIDER)
    console.log('已清除所有油价缓存')
    return true
  } catch (e) {
    console.error('清除缓存失败:', e)
    return false
  }
}

function getApiUsageStats() {
  try {
    const stats = wx.getStorageSync(STORAGE_KEYS.API_USAGE_STATS)
    const today = getTodayString()
    
    if (!stats || stats.date !== today) {
      return {
        date: today,
        totalCalls: 0,
        providerCalls: {}
      }
    }
    
    return stats
  } catch (e) {
    console.error('获取API使用统计失败:', e)
    return {
      date: getTodayString(),
      totalCalls: 0,
      providerCalls: {}
    }
  }
}

function incrementApiUsage(provider) {
  try {
    const stats = getApiUsageStats()
    stats.totalCalls += 1
    
    if (!stats.providerCalls[provider]) {
      stats.providerCalls[provider] = 0
    }
    stats.providerCalls[provider] += 1
    
    wx.setStorageSync(STORAGE_KEYS.API_USAGE_STATS, stats)
    return stats
  } catch (e) {
    console.error('更新API使用统计失败:', e)
    return null
  }
}

function getRemainingCalls(provider) {
  const config = getCurrentConfig()
  const stats = getApiUsageStats()
  const used = stats.providerCalls[provider] || 0
  return Math.max(0, config.freeLimit - used)
}

function getUsagePercentage(provider) {
  const config = getCurrentConfig()
  const stats = getApiUsageStats()
  const used = stats.providerCalls[provider] || 0
  return Math.min(100, Math.round((used / config.freeLimit) * 100))
}

function isNearLimit(provider, threshold = 0.8) {
  const percentage = getUsagePercentage(provider)
  return percentage >= threshold * 100
}

function clearOldHistory(maxDays = 90) {
  try {
    const history = getOilPriceHistory()
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - maxDays * 24 * 60 * 60 * 1000)
    const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`
    
    let cleared = 0
    
    for (const city in history) {
      const cityData = history[city]
      for (const date in cityData) {
        if (date < cutoffStr) {
          delete cityData[date]
          cleared++
        }
      }
      if (Object.keys(cityData).length === 0) {
        delete history[city]
      }
    }
    
    wx.setStorageSync(STORAGE_KEYS.OIL_PRICE_HISTORY, history)
    return cleared
  } catch (e) {
    console.error('清理历史数据失败:', e)
    return 0
  }
}

module.exports = {
  getTodayString,
  saveOilPriceData,
  getOilPriceHistory,
  getCityHistory,
  getLatestOilPrice,
  isTodayFetched,
  markTodayFetched,
  getApiUsageStats,
  incrementApiUsage,
  getRemainingCalls,
  getUsagePercentage,
  isNearLimit,
  clearOldHistory,
  clearAllCache,
  checkProviderChanged,
  STORAGE_KEYS
}
