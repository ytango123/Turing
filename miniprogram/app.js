// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res)
      }
    })
  },
  globalData: {
    userInfo: null,
    // 用户游戏数据
    gameData: {
      points: 0,
      level: '新手',
      maxCombo: 0,
      correctRate: 0,
      completedChallenges: 0,
      achievements: []
    }
  }
}) 