const app = getApp()
const { getCities, getOilTypes } = require('../../utils/data.js')
const { getOilPriceHistory, getOilPricePrediction } = require('../../utils/api.js')
const { showToast, getStorageSync, setStorageSync } = require('../../utils/util.js')

Page({
  data: {
    city: '北京市',
    oilType: '92#',
    oilTypeCode: '92',
    historyData: null,
    predictionData: null,
    loading: false,
    showCityPicker: false,
    showOilTypePicker: false,
    cityPickerColumns: [],
    cityPickerIndex: 0,
    oilTypePickerColumns: [],
    oilTypePickerIndex: 0,
    chartWidth: 0,
    chartHeight: 0,
    activeTab: 'history'
  },

  onLoad() {
    this.initData()
    this.initCanvasSize()
  },

  onShow() {
    this.loadData()
  },

  initData() {
    const cityList = getCities()
    const oilTypeList = getOilTypes()

    const savedCity = getStorageSync('currentCity') || app.globalData.currentCity
    const savedOilType = getStorageSync('currentOilType') || app.globalData.currentOilType

    let cityIndex = cityList.findIndex(c => c.name === savedCity)
    if (cityIndex === -1) cityIndex = 0

    let oilTypeIndex = oilTypeList.findIndex(t => t.code === savedOilType)
    if (oilTypeIndex === -1) oilTypeIndex = 0

    this.setData({
      city: cityList[cityIndex].name,
      oilType: oilTypeList[oilTypeIndex].name,
      oilTypeCode: oilTypeList[oilTypeIndex].code,
      cityPickerColumns: cityList.map(c => c.name),
      cityPickerIndex: cityIndex,
      oilTypePickerColumns: oilTypeList.map(t => t.name),
      oilTypePickerIndex: oilTypeIndex
    })
  },

  initCanvasSize() {
    const systemInfo = wx.getSystemInfoSync()
    const screenWidth = systemInfo.screenWidth
    const chartWidth = screenWidth - 80
    const chartHeight = chartWidth * 0.6

    this.setData({
      chartWidth: chartWidth,
      chartHeight: chartHeight
    })
  },

  loadData() {
    if (this.data.loading) return

    this.setData({ loading: true })

    Promise.all([
      getOilPriceHistory(this.data.city, this.data.oilTypeCode, 30),
      getOilPricePrediction(this.data.city, this.data.oilTypeCode, 14)
    ]).then(([historyData, predictionData]) => {
      this.setData({
        historyData: historyData,
        predictionData: predictionData,
        loading: false
      })
      
      this.drawChart()
    }).catch((err) => {
      this.setData({ loading: false })
      showToast('获取数据失败')
      console.error('获取数据失败:', err)
    })
  },

  drawChart() {
    const { historyData, predictionData, chartWidth, chartHeight } = this.data
    if (!historyData || !chartWidth || !chartHeight) return

    const query = wx.createSelectorQuery().in(this)
    query.select('#historyChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) {
          console.error('无法获取Canvas节点')
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio

        canvas.width = chartWidth * dpr
        canvas.height = chartHeight * dpr
        ctx.scale(dpr, dpr)

        const padding = { top: 40, right: 40, bottom: 60, left: 60 }
        const plotWidth = chartWidth - padding.left - padding.right
        const plotHeight = chartHeight - padding.top - padding.bottom

        const allPrices = [
          ...historyData.history.map(h => h.price),
          ...predictionData.predictions.map(p => p.price)
        ]
        const minPrice = Math.min(...allPrices) - 0.5
        const maxPrice = Math.max(...allPrices) + 0.5
        const priceRange = maxPrice - minPrice

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, chartWidth, chartHeight)

        this.drawGrid(ctx, padding, plotWidth, plotHeight, minPrice, maxPrice)

        this.drawHistoryLine(ctx, historyData, padding, plotWidth, plotHeight, minPrice, priceRange)

        this.drawPredictionLine(ctx, predictionData, historyData.history.length, padding, plotWidth, plotHeight, minPrice, priceRange)

        this.drawMarkers(ctx, historyData, padding, plotWidth, plotHeight, minPrice, priceRange)

        this.drawLegend(ctx, padding, plotHeight)
      })
  },

  drawGrid(ctx, padding, plotWidth, plotHeight, minPrice, maxPrice) {
    const priceRange = maxPrice - minPrice
    
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    if (ctx.setLineDash) {
      ctx.setLineDash([5, 5])
    }

    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (plotHeight / gridLines) * i
      const price = maxPrice - (priceRange / gridLines) * i

      ctx.fillStyle = '#999999'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(price.toFixed(2), padding.left - 10, y + 6)

      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + plotWidth, y)
      ctx.stroke()
    }

    if (ctx.setLineDash) {
      ctx.setLineDash([])
    }
    ctx.strokeStyle = '#999999'
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, padding.top + plotHeight)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top + plotHeight)
    ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight)
    ctx.stroke()
  },

  drawHistoryLine(ctx, historyData, padding, plotWidth, plotHeight, minPrice, priceRange) {
    const history = historyData.history
    const totalPoints = history.length

    ctx.strokeStyle = '#1976d2'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    history.forEach((item, index) => {
      const x = padding.left + (plotWidth / (totalPoints - 1)) * index
      const y = padding.top + plotHeight - ((item.price - minPrice) / priceRange) * plotHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    ctx.fillStyle = '#1976d2'
    history.forEach((item, index) => {
      if (item.isAdjustmentDay) {
        const x = padding.left + (plotWidth / (totalPoints - 1)) * index
        const y = padding.top + plotHeight - ((item.price - minPrice) / priceRange) * plotHeight
        
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
  },

  drawPredictionLine(ctx, predictionData, historyLength, padding, plotWidth, plotHeight, minPrice, priceRange) {
    const predictions = predictionData.predictions
    const totalPoints = historyLength + predictions.length

    ctx.strokeStyle = '#ff9800'
    ctx.lineWidth = 2
    if (ctx.setLineDash) {
      ctx.setLineDash([8, 4])
    }

    ctx.beginPath()
    predictions.forEach((item, index) => {
      const x = padding.left + (plotWidth / (totalPoints - 1)) * (historyLength - 1 + index)
      const y = padding.top + plotHeight - ((item.price - minPrice) / priceRange) * plotHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    if (ctx.setLineDash) {
      ctx.setLineDash([])
    }

    ctx.fillStyle = '#ff9800'
    predictions.forEach((item, index) => {
      if (item.isAdjustmentDay) {
        const x = padding.left + (plotWidth / (totalPoints - 1)) * (historyLength - 1 + index)
        const y = padding.top + plotHeight - ((item.price - minPrice) / priceRange) * plotHeight
        
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('预', x, y + 3)
        ctx.fillStyle = '#ff9800'
      }
    })
  },

  drawMarkers(ctx, historyData, padding, plotWidth, plotHeight, chartMinPrice, chartPriceRange) {
    const history = historyData.history
    const totalPoints = history.length

    const dataMaxPrice = historyData.maxPrice
    const dataMinPrice = historyData.minPrice
    const dataAvgPrice = historyData.avgPrice

    const maxIndex = history.findIndex(h => h.price === dataMaxPrice)
    const minIndex = history.findIndex(h => h.price === dataMinPrice)

    if (maxIndex !== -1) {
      const x = padding.left + (plotWidth / (totalPoints - 1)) * maxIndex
      const y = padding.top + plotHeight - ((dataMaxPrice - chartMinPrice) / chartPriceRange) * plotHeight

      ctx.fillStyle = '#f44336'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fill()

      ctx.fillStyle = '#f44336'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('最高: ' + dataMaxPrice.toFixed(2), x, y - 15)
    }

    if (minIndex !== -1) {
      const x = padding.left + (plotWidth / (totalPoints - 1)) * minIndex
      const y = padding.top + plotHeight - ((dataMinPrice - chartMinPrice) / chartPriceRange) * plotHeight

      ctx.fillStyle = '#4caf50'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, 2 * Math.PI)
      ctx.fill()

      ctx.fillStyle = '#4caf50'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('最低: ' + dataMinPrice.toFixed(2), x, y + 35)
    }

    ctx.strokeStyle = '#9c27b0'
    ctx.lineWidth = 1.5
    if (ctx.setLineDash) {
      ctx.setLineDash([4, 4])
    }

    const avgY = padding.top + plotHeight - ((dataAvgPrice - chartMinPrice) / chartPriceRange) * plotHeight
    ctx.beginPath()
    ctx.moveTo(padding.left, avgY)
    ctx.lineTo(padding.left + plotWidth, avgY)
    ctx.stroke()
    if (ctx.setLineDash) {
      ctx.setLineDash([])
    }

    ctx.fillStyle = '#9c27b0'
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('平均: ' + dataAvgPrice.toFixed(2), padding.left + 10, avgY - 8)
  },

  drawLegend(ctx, padding, plotHeight) {
    const legendX = padding.left + 20
    const legendY = padding.top + plotHeight + 30

    ctx.fillStyle = '#1976d2'
    ctx.fillRect(legendX, legendY - 8, 30, 4)
    ctx.fillStyle = '#333333'
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('历史价格', legendX + 40, legendY)

    ctx.strokeStyle = '#ff9800'
    ctx.lineWidth = 2
    if (ctx.setLineDash) {
      ctx.setLineDash([6, 3])
    }
    ctx.beginPath()
    ctx.moveTo(legendX + 120, legendY - 6)
    ctx.lineTo(legendX + 150, legendY - 6)
    ctx.stroke()
    if (ctx.setLineDash) {
      ctx.setLineDash([])
    }
    ctx.fillStyle = '#333333'
    ctx.fillText('预测价格', legendX + 160, legendY)
  },

  showCityPicker() {
    this.setData({ showCityPicker: true })
  },

  hideCityPicker() {
    this.setData({ showCityPicker: false })
  },

  onCityPickerChange(e) {
    const index = e.detail.value
    const cityList = getCities()
    const city = cityList[index]
    
    this.setData({
      city: city.name,
      cityPickerIndex: index,
      showCityPicker: false
    })

    app.globalData.currentCity = city.name
    setStorageSync('currentCity', city.name)

    this.loadData()
  },

  showOilTypePicker() {
    this.setData({ showOilTypePicker: true })
  },

  hideOilTypePicker() {
    this.setData({ showOilTypePicker: false })
  },

  onOilTypePickerChange(e) {
    const index = e.detail.value
    const oilTypeList = getOilTypes()
    const oilType = oilTypeList[index]
    
    this.setData({
      oilType: oilType.name,
      oilTypeCode: oilType.code,
      oilTypePickerIndex: index,
      showOilTypePicker: false
    })

    app.globalData.currentOilType = oilType.code
    setStorageSync('currentOilType', oilType.code)

    this.loadData()
  },

  onRefresh() {
    this.loadData()
  },

  onShareAppMessage() {
    return {
      title: `${this.data.city}${this.data.oilType}历史油价走势`,
      path: '/pages/history/history'
    }
  }
})
