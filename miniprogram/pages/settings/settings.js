const app = getApp()
const { createPage } = require('../../utils/basePage')

createPage({
  pageKey: 'settings',
  i18nKeys: {
    navTitle: 'navTitle',
    languageText: 'language',
    themeText: 'theme',
    feedback: 'feedback'
  },
  
  data: {
    language: 'zh',  // 默认中文
    theme: 'light',   // 默认浅色主题
    showFeedbackModal: false,
    feedbackText: ''
  },
  
  onLoad() {
    // 从本地存储获取设置
    const language = wx.getStorageSync('language') || 'zh';
    const theme = wx.getStorageSync('theme') || 'light';
    
    this.setData({
      language,
      theme
    });
  },
  
  // 切换语言
  switchLanguage() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    wx.showActionSheet({
      itemList: ['中文', 'English'],
      success: (res) => {
        const language = res.tapIndex === 0 ? 'zh' : 'en';
        
        // 更新语言设置
        wx.setStorageSync('language', language);
        
        // 更新页面数据和文本
        this.setData({
          language
        });
        
        // 更新页面文本和导航栏
        this.updatePageLanguage(language);
        
        // 通知全局语言变化
        if (app.globalData) {
          app.globalData.language = language;
        }
        
        // 更新 TabBar 文本
        if (getApp().updateTabBarLabels) {
          getApp().updateTabBarLabels(language);
        }
        
        // 发送事件通知其他页面刷新语言
        wx.eventCenter = wx.eventCenter || {};
        wx.eventCenter.languageChanged = true;
        
        // 显示切换成功提示
        wx.showToast({
          title: language === 'zh' ? '已切换到中文' : 'Switched to English',
          icon: 'success'
        });
      }
    });
  },
  
  // 切换主题
  switchTheme(e) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const theme = e.detail.value ? 'dark' : 'light';
    this.setData({ theme });
    wx.setStorageSync('theme', theme);
    
    // 通知全局主题变化
    if (app.globalData) {
      app.globalData.theme = theme;
    }
    
    // 应用主题
    this.applyTheme(theme);
  },
  
  // 应用主题
  applyTheme(theme) {
    if (theme === 'dark') {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1f1f1f'
      });
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      });
    }
  },
  
  // 打开反馈弹窗
  openFeedback() {
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    this.setData({ showFeedbackModal: true, feedbackText: '' });
  },
  // 关闭反馈弹窗
  closeFeedback() {
    this.setData({ showFeedbackModal: false });
  },
  // 输入监听
  onInputFeedback(e) {
    this.setData({ feedbackText: e.detail.value });
  },
  // 提交反馈
  submitFeedback() {
    const text = (this.data.feedbackText || '').trim();
    if (!text) {
      wx.showToast({ title: this.data.language==='zh'?'请输入内容':'Please input', icon:'none' });
      return;
    }
    wx.showLoading({ title: this.data.language==='zh'?'提交中':'Submitting', mask:true });
    
    const db = wx.cloud.database();
    // 添加错误重试机制
    const trySubmit = (retryCount = 0) => {
      db.collection('feedback').add({
        data: {
          content: text,
          createTime: db.serverDate()
        }
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: this.data.language==='zh'?'感谢反馈':'Thanks', icon:'success' });
        this.setData({ showFeedbackModal:false, feedbackText:'' });
      }).catch(err => {
        console.error('提交反馈失败', err);
        wx.hideLoading();
        
        // 如果是集合不存在的错误，显示特定提示
        if (err.errCode === -502005) {
          wx.showToast({ 
            title: this.data.language==='zh'?'系统维护中，请稍后再试':'System maintaining, please try later', 
            icon:'none',
            duration: 2000
          });
        } else {
          wx.showToast({ 
            title: this.data.language==='zh'?'提交失败，请重试':'Failed, please retry', 
            icon:'none' 
          });
        }
      });
    };
    
    trySubmit();
  },
  
  onTabItemTap(item) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  }
}) 