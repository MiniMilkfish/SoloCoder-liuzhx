const { getCurrentConfig, getCurrentProvider } = require('./config.js')
const { getMockOilPrice } = require('./data.js')
const {
  saveOilPriceData,
  getCityHistory,
  getLatestOilPrice,
  isTodayFetched,
  markTodayFetched,
  incrementApiUsage,
  getRemainingCalls,
  getUsagePercentage,
  isNearLimit
} = require('./storage.js')

function request(options) {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })

    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          })
          reject(new Error('网络错误'))
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

function fetchFromJuhe(city) {
  const config = getCurrentConfig()
  const provider = getCurrentProvider()
  
  console.log(`[API] 调用聚合数据API, provider=${provider}, apiKey=${config.apiKey ? '已配置' : '未配置'}`)
  console.log(`[API] 请求URL: ${config.baseUrl}?key=***`)
  
  const url = `${config.baseUrl}?key=${config.apiKey}`
  
  return request({
    url: url,
    method: 'GET'
  }).then((res) => {
    console.log(`[API] 聚合数据API响应:`, JSON.stringify(res).substring(0, 500))
    
    if (res.error_code === 0 && res.result) {
      const cityData = res.result.find(item => 
        item.city === city || 
        item.city.includes(city) || 
        city.includes(item.city)
      )
      
      if (cityData) {
        console.log(`[API] 找到城市数据: ${JSON.stringify(cityData)}`)
        return {
          city: cityData.city,
          '92': parseFloat(cityData['92h']),
          '95': parseFloat(cityData['95h']),
          '98': parseFloat(cityData['98h']),
          '0': parseFloat(cityData['0h'])
        }
      }
      
      console.log(`[API] 未找到城市 ${city} 的数据，可用城市:`, res.result.map(item => item.city))
      return null
    }
    
    console.error(`[API] 聚合数据API错误: error_code=${res.error_code}, reason=${res.reason}`)
    throw new Error(res.reason || '获取数据失败')
  })
}

function fetchFromIstero(city) {
  const config = getCurrentConfig()
  const url = config.baseUrl
  
  return request({
    url: url,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${config.apiKey}`
    }
  }).then((res) => {
    if (res.code === 0 || res.success) {
      const data = res.data || res
      
      if (data.list || data.data) {
        const list = data.list || data.data
        const cityData = list.find(item => 
          item.province === city || 
          item.city === city ||
          (item.name && (item.name === city || city.includes(item.name)))
        )
        
        if (cityData) {
          return {
            city: cityData.province || cityData.city || cityData.name || city,
            '92': parseFloat(cityData['92'] || cityData.oil92 || cityData.price92),
            '95': parseFloat(cityData['95'] || cityData.oil95 || cityData.price95),
            '98': parseFloat(cityData['98'] || cityData.oil98 || cityData.price98),
            '0': parseFloat(cityData['0'] || cityData.oil0 || cityData.price0 || cityData.diesel0)
          }
        }
      }
      
      return null
    }
    
    throw new Error(res.message || '获取数据失败')
  })
}

function fetchFromApi52(city) {
  const config = getCurrentConfig()
  const url = `${config.baseUrl}?apikey=${config.apiKey}`
  
  return request({
    url: url,
    method: 'GET'
  }).then((res) => {
    if (res.code === 0 || res.success || res.error_code === 0) {
      const data = res.data || res.result || res
      
      if (data.list || Array.isArray(data)) {
        const list = data.list || data
        const cityData = list.find(item => 
          item.provinceName === city || 
          item.city === city ||
          item.province === city
        )
        
        if (cityData) {
          return {
            city: cityData.provinceName || cityData.city || cityData.province || city,
            '92': parseFloat(cityData.oilPrice92 || cityData['92h'] || cityData.price92),
            '95': parseFloat(cityData.oilPrice95 || cityData['95h'] || cityData.price95),
            '98': parseFloat(cityData.oilPrice98 || cityData['98h'] || cityData.price98),
            '0': parseFloat(cityData.oilPrice0 || cityData['0h'] || cityData.price0)
          }
        }
      }
      
      return null
    }
    
    throw new Error(res.msg || res.message || '获取数据失败')
  })
}

function fetchFromMock(city) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        city: city,
        '92': getMockOilPrice(city, '92'),
        '95': getMockOilPrice(city, '95'),
        '98': getMockOilPrice(city, '98'),
        '0': getMockOilPrice(city, '0'),
        '-10': getMockOilPrice(city, '-10')
      })
    }, 300)
  })
}

function fetchOilPriceFromApi(city) {
  const provider = getCurrentProvider()
  const config = getCurrentConfig()
  
  console.log(`[API] fetchOilPriceFromApi 开始, provider=${provider}, city=${city}`)
  console.log(`[API] 当前配置: apiKey=${config.apiKey ? '已配置' : '未配置'}, baseUrl=${config.baseUrl}`)
  
  if (provider !== 'mock' && !config.apiKey) {
    console.warn(`[API] API提供商 ${provider} 未配置API Key，使用模拟数据`)
    wx.showToast({
      title: '未配置API Key',
      icon: 'none'
    })
    return fetchFromMock(city)
  }
  
  let fetchPromise
  
  switch (provider) {
    case 'juhe':
      fetchPromise = fetchFromJuhe(city)
      break
    case 'istero':
      fetchPromise = fetchFromIstero(city)
      break
    case 'api52':
      fetchPromise = fetchFromApi52(city)
      break
    case 'mock':
    default:
      console.log(`[API] 使用mock数据模式`)
      fetchPromise = fetchFromMock(city)
      break
  }
  
  return fetchPromise.then((data) => {
    console.log(`[API] fetchOilPriceFromApi 成功, data=`, data)
    
    if (provider !== 'mock' && data) {
      incrementApiUsage(provider)
      console.log(`[API] API调用次数已更新`)
    }
    
    return data
  }).catch((err) => {
    console.error(`[API] 从 ${provider} 获取数据失败:`, err)
    console.log(`[API] 降级使用模拟数据`)
    
    wx.showToast({
      title: `API调用失败: ${err.message}`,
      icon: 'none',
      duration: 3000
    })
    
    return fetchFromMock(city)
  })
}

function getCurrentOilPrice(city, oilTypeCode, forceRefresh = false) {
  return new Promise((resolve, reject) => {
    const provider = getCurrentProvider()
    console.log(`[API] getCurrentOilPrice 开始, provider=${provider}, city=${city}, oilTypeCode=${oilTypeCode}, forceRefresh=${forceRefresh}`)
    
    const todayFetched = isTodayFetched(city)
    const latestData = getLatestOilPrice(city)
    
    console.log(`[API] 缓存检查: todayFetched=${todayFetched}, latestData=${latestData ? '有数据' : '无数据'}`)
    if (latestData) {
      console.log(`[API] 缓存数据:`, JSON.stringify(latestData).substring(0, 200))
      console.log(`[API] 缓存数据provider: ${latestData.provider}, 当前provider: ${provider}`)
    }
    
    if (!forceRefresh && latestData) {
      const price = latestData[oilTypeCode]
      if (price) {
        console.log(`[API] 使用缓存数据, price=${price}`)
        
        const previousData = getCityHistory(city, 2)
        let trend = 'unchanged'
        let change = 0
        
        if (previousData.length >= 2) {
          const prevPrice = previousData[previousData.length - 2][oilTypeCode]
          if (prevPrice && prevPrice !== price) {
            trend = price > prevPrice ? 'up' : 'down'
            change = parseFloat((price - prevPrice).toFixed(2))
          }
        }
        
        resolve({
          city: latestData.city || city,
          oilType: oilTypeCode,
          price: price,
          updateTime: new Date(latestData.timestamp).toISOString(),
          trend: trend,
          change: change,
          fromCache: true
        })
        return
      }
    }
    
    console.log(`[API] 调用API获取新数据`)
    
    fetchOilPriceFromApi(city).then((data) => {
      console.log(`[API] API返回数据:`, data)
      
      if (!data) {
        reject(new Error('未找到该城市的油价数据'))
        return
      }
      
      saveOilPriceData(city, data)
      markTodayFetched(city)
      console.log(`[API] 数据已保存到本地`)
      
      const price = data[oilTypeCode]
      if (price === undefined) {
        reject(new Error(`未找到${oilTypeCode}号油的价格数据`))
        return
      }
      
      const previousData = getCityHistory(city, 2)
      let trend = 'unchanged'
      let change = 0
      
      if (previousData.length >= 2) {
        const prevPrice = previousData[previousData.length - 2][oilTypeCode]
        if (prevPrice && prevPrice !== price) {
          trend = price > prevPrice ? 'up' : 'down'
          change = parseFloat((price - prevPrice).toFixed(2))
        }
      }
      
      resolve({
        city: data.city || city,
        oilType: oilTypeCode,
        price: price,
        updateTime: new Date().toISOString(),
        trend: trend,
        change: change,
        fromCache: false
      })
    }).catch(reject)
  })
}

function getOilPriceHistory(city, oilTypeCode, days = 30) {
  return new Promise((resolve) => {
    const localHistory = getCityHistory(city, days)
    
    if (localHistory.length > 0) {
      const history = localHistory.map(item => ({
        date: item.date,
        price: item[oilTypeCode] || 0,
        isAdjustmentDay: isAdjustmentDay(item.date)
      })).filter(item => item.price > 0)
      
      if (history.length > 0) {
        const prices = history.map(h => h.price)
        const maxPrice = Math.max(...prices)
        const minPrice = Math.min(...prices)
        const avgPrice = parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2))
        
        resolve({
          city: city,
          oilType: oilTypeCode,
          history: history,
          maxPrice: maxPrice,
          minPrice: minPrice,
          avgPrice: avgPrice,
          fromCache: true
        })
        return
      }
    }
    
    generateMockHistory(city, oilTypeCode, days).then(resolve)
  })
}

function generateMockHistory(city, oilTypeCode, days = 30) {
  return new Promise((resolve) => {
    const history = []
    const today = new Date()
    let basePrice = getMockOilPrice(city, oilTypeCode)
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const variation = (Math.random() - 0.5) * 0.2
      basePrice = parseFloat((basePrice + variation).toFixed(2))
      basePrice = Math.max(basePrice, 6.00)
      basePrice = Math.min(basePrice, 10.00)
      
      const dateStr = formatDate(date)
      const record = {
        date: dateStr,
        price: basePrice,
        isAdjustmentDay: isAdjustmentDay(dateStr)
      }
      
      history.push(record)
      
      const saveData = {
        city: city,
        [oilTypeCode]: basePrice
      }
      saveOilPriceData(city, saveData)
    }
    
    const prices = history.map(h => h.price)
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const avgPrice = parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2))
    
    resolve({
      city: city,
      oilType: oilTypeCode,
      history: history,
      maxPrice: maxPrice,
      minPrice: minPrice,
      avgPrice: avgPrice,
      fromCache: false
    })
  })
}

function isAdjustmentDay(dateStr) {
  const date = new Date(dateStr)
  const day = date.getDate()
  return day === 10 || day === 25
}

function getOilPricePrediction(city, oilTypeCode, days = 14) {
  return new Promise((resolve) => {
    const predictions = []
    const today = new Date()
    
    const history = getCityHistory(city, 10)
    let basePrice = 7.85
    
    if (history.length > 0) {
      const latest = history[history.length - 1]
      basePrice = latest[oilTypeCode] || 7.85
    } else {
      basePrice = getMockOilPrice(city, oilTypeCode)
    }
    
    const nextAdjustmentDate = getNextAdjustmentDate(today)
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const variation = (Math.random() - 0.5) * 0.15
      basePrice = parseFloat((basePrice + variation).toFixed(2))
      basePrice = Math.max(basePrice, 6.00)
      basePrice = Math.min(basePrice, 10.00)
      
      const isAdjustmentDay = date.toDateString() === nextAdjustmentDate.toDateString()
      
      predictions.push({
        date: formatDate(date),
        price: basePrice,
        isAdjustmentDay: isAdjustmentDay,
        confidence: Math.floor(Math.random() * 30) + 70
      })
    }
    
    resolve({
      city: city,
      oilType: oilTypeCode,
      predictions: predictions,
      nextAdjustmentDate: formatDate(nextAdjustmentDate),
      nextAdjustmentDays: Math.ceil((nextAdjustmentDate - today) / (1000 * 60 * 60 * 24))
    })
  })
}

function getNextAdjustmentDate(fromDate) {
  const date = new Date(fromDate)
  const day = date.getDate()
  
  if (day <= 10) {
    date.setDate(10)
  } else if (day <= 25) {
    date.setDate(25)
  } else {
    date.setMonth(date.getMonth() + 1)
    date.setDate(10)
  }
  
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1)
  }
  
  return date
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要获取位置权限才能自动定位，请在设置中开启',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        }
        reject(err)
      }
    })
  })
}

function reverseGeocode(latitude, longitude) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://api.map.baidu.com/reverse_geocoding/v3/',
      data: {
        ak: 'YOUR_BAIDU_MAP_AK',
        output: 'json',
        coordtype: 'gcj02ll',
        location: `${latitude},${longitude}`
      },
      success: (res) => {
        if (res.data.status === 0) {
          const city = res.data.result.addressComponent.city
          resolve({
            city: city.replace('市', ''),
            district: res.data.result.addressComponent.district,
            address: res.data.result.formatted_address
          })
        } else {
          reject(new Error('逆地理编码失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

function getApiUsageInfo() {
  const provider = getCurrentProvider()
  const config = getCurrentConfig()
  
  return {
    provider: provider,
    providerName: config.name,
    remaining: getRemainingCalls(provider),
    total: config.freeLimit,
    percentage: getUsagePercentage(provider),
    isNearLimit: isNearLimit(provider),
    isMock: provider === 'mock'
  }
}

module.exports = {
  request,
  getCurrentOilPrice,
  getOilPriceHistory,
  getOilPricePrediction,
  getLocation,
  reverseGeocode,
  formatDate,
  getApiUsageInfo,
  fetchOilPriceFromApi
}
