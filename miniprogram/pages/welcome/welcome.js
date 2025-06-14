// pages/welcome/welcome.js
const app = getApp()

Page({
  data: {
    
  },
  onLoad() {
    // 页面加载时不做任何处理，保持welcome页面的简洁展示
  },
  startChallenge() {
    // 显示加载中
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 使用app.isUserRegistered方法检查用户是否已注册
    app.isUserRegistered()
      .then(isRegistered => {
        wx.hideLoading();
        if (isRegistered) {
          // 用户已注册，直接跳转到首页
          wx.switchTab({
            url: '/pages/game-home/game-home'
          });
        } else {
          // 新用户，跳转到信息收集页面
          wx.navigateTo({
            url: '/pages/user-info/user-info'
          });
        }
      })
      .catch(err => {
        console.error('检查用户注册状态失败', err);
        wx.hideLoading();
        // 出错时默认跳转到信息收集页面
        wx.navigateTo({
          url: '/pages/user-info/user-info'
        });
      });
  }
}) 