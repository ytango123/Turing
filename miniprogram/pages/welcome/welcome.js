// pages/welcome/welcome.js
const app = getApp()

Page({
  data: {
    // 统一使用小写 zh / en
    currentLang: wx.getStorageSync('language') || 'zh',
    pageReady: false
    // 移除动态定位数据
  },
  onLoad() {
    // 读取全局/本地存储的语言，初始化页面语言
    const storedLang = wx.getStorageSync('language') || 'zh';
    this.setData({ currentLang: storedLang });

    console.log('欢迎页面加载完成，当前语言:', this.data.currentLang);

    // 下一事件循环标记页面可见，触发淡入
    setTimeout(() => {
      this.setData({ pageReady: true });
    }, 50);
  },
  onShow() {
    console.log('欢迎页面显示');
    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        console.log('系统信息:', res);
      }
    });
  },
  // 添加语言切换功能
  switchLanguage(e) {
    // 根据 dataset 指定语言或切换
    let languageCode = e && e.currentTarget.dataset.lang;
    if (!languageCode) {
      languageCode = this.data.currentLang === 'zh' ? 'en' : 'zh';
    }
    this.setData({ currentLang: languageCode });

    // 更新本地存储
    wx.setStorageSync('language', languageCode);

    // 更新全局数据
    if (app.globalData) {
      app.globalData.language = languageCode;
    }

    // 触发语言变更事件，供其他页面检测
    wx.eventCenter = wx.eventCenter || {};
    wx.eventCenter.languageChanged = true;

    // 同步更新 TabBar 文本
    if (typeof getApp().updateTabBarLabels === 'function') {
      getApp().updateTabBarLabels(languageCode);
    }

    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    console.log('切换语言为:', languageCode, `(${languageCode})`);
  },
  startChallenge() {
    // 添加轻微振动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({
        type: 'light' // 轻微震动
      });
    }
    
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