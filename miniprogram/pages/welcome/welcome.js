// pages/welcome/welcome.js
const app = getApp()

Page({
  data: {
    currentLang: 'ZH', // 添加当前语言状态
    i18n: {
      ZH: {
        title: '图灵挑战',
        subtitle: '你能分辨出谁是AI吗？',
        description1: '「人机斗智」终极挑战',
        description2: '聆听对话，判断发言者是人类还是AI',
        description3: '你能让AI现出原形吗',
        startButton: '开始挑战',
        userCount: '已有超过10,000人参与挑战'
      },
      EN: {
        title1: 'TURING',
        title2: 'CHALLENGE',
        subtitle: 'Can you tell who is AI?',
        description1: 'Listen to conversations and',
        description2: 'determine whether the speaker is',
        description3: 'human or AI',
        startButton: 'START CHALLENGE',
        userCount: 'Over 10,000 people have participated'
      }
    }
  },
  onLoad() {
    // 读取全局/本地存储的语言，初始化页面语言
    const storedLang = wx.getStorageSync('language') || 'zh';
    const currentLang = storedLang === 'en' ? 'EN' : 'ZH';
    this.setData({ currentLang });

    console.log('欢迎页面加载完成，当前语言:', currentLang);
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
  switchLanguage() {
    // 切换页面本地语言状态（ZH/EN）
    const newLang = this.data.currentLang === 'ZH' ? 'EN' : 'ZH';
    this.setData({ currentLang: newLang });

    // 映射为全局使用的语言代码（小写 zh/en）
    const languageCode = newLang === 'ZH' ? 'zh' : 'en';

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
    
    console.log('切换语言为:', newLang, `(${languageCode})`);
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