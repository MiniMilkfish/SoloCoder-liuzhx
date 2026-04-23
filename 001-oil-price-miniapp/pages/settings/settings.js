const app = getApp()
const { getOilTypes } = require('../../utils/data.js')
const { getStorageSync, setStorageSync, showToast, showModal } = require('../../utils/util.js')

Page({
  data: {
    reminderEnabled: false,
    reminderType: 'price_change',
    reminderTime: '08:00',
    selectedOilTypes: ['92'],
    reminderDays: [],
    priceThreshold: 0.1,
    notifyBeforeAdjustment: true,
    adjustmentNotifyDays: 1,
    oilTypeList: [],
    showTimePicker: false,
    showOilTypePicker: false,
    showDayPicker: false,
    timePickerValue: [8, 0],
    dayPickerColumns: [
      { values: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'], defaultIndex: 1 }
    ],
    selectedDays: []
  },

  onLoad() {
    this.initData()
    this.loadSettings()
  },

  initData() {
    const oilTypeList = getOilTypes()
    this.setData({ oilTypeList })
  },

  loadSettings() {
    const settings = getStorageSync('reminderSettings', {})
    
    this.setData({
      reminderEnabled: settings.reminderEnabled || false,
      reminderType: settings.reminderType || 'price_change',
      reminderTime: settings.reminderTime || '08:00',
      selectedOilTypes: settings.selectedOilTypes || ['92'],
      reminderDays: settings.reminderDays || [1, 2, 3, 4, 5],
      priceThreshold: settings.priceThreshold || 0.1,
      notifyBeforeAdjustment: settings.notifyBeforeAdjustment !== false,
      adjustmentNotifyDays: settings.adjustmentNotifyDays || 1
    })

    this.updateSelectedDaysDisplay()
  },

  saveSettings() {
    const {
      reminderEnabled,
      reminderType,
      reminderTime,
      selectedOilTypes,
      reminderDays,
      priceThreshold,
      notifyBeforeAdjustment,
      adjustmentNotifyDays
    } = this.data

    const settings = {
      reminderEnabled,
      reminderType,
      reminderTime,
      selectedOilTypes,
      reminderDays,
      priceThreshold,
      notifyBeforeAdjustment,
      adjustmentNotifyDays
    }

    setStorageSync('reminderSettings', settings)
    
    if (reminderEnabled) {
      this.subscribeMessage()
    }
  },

  subscribeMessage() {
    const tmplIds = ['YOUR_TEMPLATE_ID_1', 'YOUR_TEMPLATE_ID_2']
    
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: (res) => {
        console.log('订阅消息成功:', res)
        showToast('提醒设置已保存')
      },
      fail: (err) => {
        console.log('订阅消息失败:', err)
        if (err.errMsg.includes('user cancel')) {
          showToast('已取消订阅，部分提醒功能可能无法使用')
        } else {
          showToast('设置已保存，如需消息提醒请在设置中开启')
        }
      }
    })
  },

  onReminderSwitchChange(e) {
    const enabled = e.detail.value
    this.setData({ reminderEnabled: enabled })
    this.saveSettings()
  },

  onReminderTypeChange(e) {
    const type = e.detail.value
    this.setData({ reminderType: type })
    this.saveSettings()
  },

  showTimePicker() {
    const [hour, minute] = this.data.reminderTime.split(':').map(Number)
    this.setData({
      showTimePicker: true,
      timePickerValue: [hour, minute]
    })
  },

  hideTimePicker() {
    this.setData({ showTimePicker: false })
  },

  onTimePickerChange(e) {
    const [hour, minute] = e.detail.value
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    this.setData({
      reminderTime: time,
      showTimePicker: false
    })
    this.saveSettings()
  },

  onOilTypeChange(e) {
    const index = e.currentTarget.dataset.index
    const oilType = this.data.oilTypeList[index]
    const selectedOilTypes = [...this.data.selectedOilTypes]
    const typeIndex = selectedOilTypes.indexOf(oilType.code)

    if (typeIndex > -1) {
      selectedOilTypes.splice(typeIndex, 1)
    } else {
      selectedOilTypes.push(oilType.code)
    }

    if (selectedOilTypes.length === 0) {
      showToast('至少选择一种油号')
      return
    }

    this.setData({ selectedOilTypes })
    this.saveSettings()
  },

  updateSelectedDaysDisplay() {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const selectedDays = this.data.reminderDays.map(day => dayNames[day])
    this.setData({ selectedDays })
  },

  showDayPicker() {
    this.setData({ showDayPicker: true })
  },

  hideDayPicker() {
    this.setData({ showDayPicker: false })
  },

  onDayPickerChange(e) {
    const index = e.detail.value[0]
    const reminderDays = [...this.data.reminderDays]
    
    const dayIndex = reminderDays.indexOf(index)
    if (dayIndex > -1) {
      if (reminderDays.length > 1) {
        reminderDays.splice(dayIndex, 1)
      }
    } else {
      reminderDays.push(index)
    }

    reminderDays.sort((a, b) => a - b)
    
    this.setData({ reminderDays })
    this.updateSelectedDaysDisplay()
    this.saveSettings()
  },

  onThresholdInput(e) {
    const value = parseFloat(e.detail.value) || 0
    this.setData({ priceThreshold: value })
  },

  onThresholdBlur() {
    this.saveSettings()
  },

  onNotifyBeforeAdjustmentChange(e) {
    const enabled = e.detail.value
    this.setData({ notifyBeforeAdjustment: enabled })
    this.saveSettings()
  },

  onAdjustmentDaysChange(e) {
    const days = parseInt(e.detail.value) + 1
    this.setData({ adjustmentNotifyDays: days })
    this.saveSettings()
  },

  async onClearAllSettings() {
    const confirmed = await showModal(
      '确认清除',
      '确定要清除所有提醒设置吗？'
    )
    
    if (confirmed) {
      this.setData({
        reminderEnabled: false,
        reminderType: 'price_change',
        reminderTime: '08:00',
        selectedOilTypes: ['92'],
        reminderDays: [1, 2, 3, 4, 5],
        priceThreshold: 0.1,
        notifyBeforeAdjustment: true,
        adjustmentNotifyDays: 1
      })
      this.updateSelectedDaysDisplay()
      this.saveSettings()
      showToast('已清除所有设置')
    }
  },

  onTestReminder() {
    showToast('测试提醒已发送', 'success')
  },

  onShareAppMessage() {
    return {
      title: '油价提醒设置',
      path: '/pages/settings/settings'
    }
  }
})
