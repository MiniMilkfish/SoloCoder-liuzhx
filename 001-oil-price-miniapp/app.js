App({
  globalData: {
    userInfo: null,
    currentCity: '北京市',
    currentOilType: '92#',
    hasLocationPermission: false
  },

  onLaunch() {
    this.checkLocationPermission()
    this.loadUserSettings()
  },

  checkLocationPermission() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          this.globalData.hasLocationPermission = true
        }
      }
    })
  },

  loadUserSettings() {
    try {
      const city = wx.getStorageSync('currentCity')
      const oilType = wx.getStorageSync('currentOilType')
      if (city) {
        this.globalData.currentCity = city
      }
      if (oilType) {
        this.globalData.currentOilType = oilType
      }
    } catch (e) {
      console.error('加载用户设置失败:', e)
    }
  },

  saveUserSettings() {
    try {
      wx.setStorageSync('currentCity', this.globalData.currentCity)
      wx.setStorageSync('currentOilType', this.globalData.currentOilType)
    } catch (e) {
      console.error('保存用户设置失败:', e)
    }
  }
})
