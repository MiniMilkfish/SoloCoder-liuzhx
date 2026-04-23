const app = getApp()
const { getCities, getOilTypes } = require('../../utils/data.js')
const { getCurrentOilPrice, getLocation, reverseGeocode, getApiUsageInfo } = require('../../utils/api.js')
const { showToast, showLoading, hideLoading, getStorageSync, setStorageSync } = require('../../utils/util.js')

Page({
  data: {
    city: '北京市',
    oilType: '92#',
    oilTypeCode: '92',
    price: null,
    trend: null,
    change: 0,
    updateTime: null,
    loading: false,
    cityList: [],
    oilTypeList: [],
    showCityPicker: false,
    showOilTypePicker: false,
    cityPickerColumns: [],
    cityPickerIndex: 0,
    oilTypePickerColumns: [],
    oilTypePickerIndex: 0,
    apiUsageInfo: null
  },

  onLoad() {
    this.initData()
  },

  onShow() {
    this.loadApiUsageInfo()
    this.loadPriceData()
  },

  loadApiUsageInfo() {
    const usageInfo = getApiUsageInfo()
    this.setData({ apiUsageInfo: usageInfo })
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
      cityList: cityList,
      oilTypeList: oilTypeList,
      city: cityList[cityIndex].name,
      oilType: oilTypeList[oilTypeIndex].name,
      oilTypeCode: oilTypeList[oilTypeIndex].code,
      cityPickerColumns: cityList.map(c => c.name),
      cityPickerIndex: cityIndex,
      oilTypePickerColumns: oilTypeList.map(t => t.name),
      oilTypePickerIndex: oilTypeIndex
    })

    this.checkLocationAndLoad()
  },

  checkLocationAndLoad() {
    if (!getStorageSync('hasManualLocation', false)) {
      this.autoLocation()
    } else {
      this.loadPriceData()
    }
  },

  autoLocation() {
    showLoading('定位中...')
    getLocation()
      .then((res) => {
        return reverseGeocode(res.latitude, res.longitude)
      })
      .then((res) => {
        hideLoading()
        const cityName = res.city
        const cityList = this.data.cityList
        const cityIndex = cityList.findIndex(c => c.name === cityName || c.name.includes(cityName))
        
        if (cityIndex !== -1) {
          this.setData({
            city: cityList[cityIndex].name,
            cityPickerIndex: cityIndex
          })
          app.globalData.currentCity = cityList[cityIndex].name
          setStorageSync('currentCity', cityList[cityIndex].name)
        }
        this.loadPriceData()
      })
      .catch((err) => {
        hideLoading()
        console.log('定位失败，使用默认城市:', err)
        this.loadPriceData()
      })
  },

  loadPriceData(forceRefresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    getCurrentOilPrice(this.data.city, this.data.oilTypeCode, forceRefresh)
      .then((res) => {
        console.log(`[Index] loadPriceData 成功, fromCache=${res.fromCache}, price=${res.price}`)
        
        this.setData({
          price: res.price,
          trend: res.trend,
          change: res.change,
          updateTime: res.updateTime,
          loading: false
        })
        
        this.loadApiUsageInfo()
      })
      .catch((err) => {
        this.setData({ loading: false })
        showToast('获取油价失败')
        console.error('获取油价失败:', err)
        
        this.loadApiUsageInfo()
      })
  },

  onRefresh() {
    console.log('[Index] 用户下拉刷新，强制获取新数据')
    this.loadPriceData(true)
  },

  showCityPicker() {
    this.setData({ showCityPicker: true })
  },

  hideCityPicker() {
    this.setData({ showCityPicker: false })
  },

  onCityPickerChange(e) {
    const index = e.detail.value
    const city = this.data.cityList[index]
    
    this.setData({
      city: city.name,
      cityPickerIndex: index,
      showCityPicker: false
    })

    app.globalData.currentCity = city.name
    setStorageSync('currentCity', city.name)
    setStorageSync('hasManualLocation', true)

    this.loadPriceData()
  },

  showOilTypePicker() {
    this.setData({ showOilTypePicker: true })
  },

  hideOilTypePicker() {
    this.setData({ showOilTypePicker: false })
  },

  onOilTypePickerChange(e) {
    const index = e.detail.value
    const oilType = this.data.oilTypeList[index]
    
    this.setData({
      oilType: oilType.name,
      oilTypeCode: oilType.code,
      oilTypePickerIndex: index,
      showOilTypePicker: false
    })

    app.globalData.currentOilType = oilType.code
    setStorageSync('currentOilType', oilType.code)

    this.loadPriceData()
  },

  onNavigateToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  onShareAppMessage() {
    return {
      title: `${this.data.city}${this.data.oilType}油价: ${this.data.price}元/升`,
      path: '/pages/index/index'
    }
  }
})
