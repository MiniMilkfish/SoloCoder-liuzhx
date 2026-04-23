function formatTime(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${[year, month, day].map(formatNumber).join('-')}`
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

function getWeekDay(date) {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekDays[date.getDay()]
}

function getRelativeTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return formatDate(date)
  }
}

function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

function throttle(fn, delay = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title: title,
    icon: icon,
    duration: duration
  })
}

function showLoading(title = '加载中...') {
  wx.showLoading({
    title: title,
    mask: true
  })
}

function hideLoading() {
  wx.hideLoading()
}

function showModal(title, content, showCancel = true) {
  return new Promise((resolve) => {
    wx.showModal({
      title: title,
      content: content,
      showCancel: showCancel,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

function getStorageSync(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key)
    return value !== '' ? value : defaultValue
  } catch (e) {
    console.error('获取缓存失败:', e)
    return defaultValue
  }
}

function setStorageSync(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (e) {
    console.error('设置缓存失败:', e)
    return false
  }
}

function removeStorageSync(key) {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (e) {
    console.error('删除缓存失败:', e)
    return false
  }
}

module.exports = {
  formatTime,
  formatDate,
  formatNumber,
  getWeekDay,
  getRelativeTime,
  debounce,
  throttle,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  getStorageSync,
  setStorageSync,
  removeStorageSync
}
