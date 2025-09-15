const { t } = require('./i18n.js')

// 基础页面类
const basePage = {
  // 获取当前页面的i18n数据
  getPageI18n(language, pageKey) {
    const i18nData = {}
    // 遍历i18n配置，获取当前页面需要的文本
    Object.keys(this.i18nKeys || {}).forEach(key => {
      i18nData[key] = t(`${pageKey}.${this.i18nKeys[key]}`, language)
    })
    return i18nData
  },

  // 更新页面文本和导航栏
  updatePageLanguage(language) {
    const i18nData = this.getPageI18n(language, this.pageKey)
    
    // 更新页面文本，并同步 currentLang 方便模板里根据语言切换显示/隐藏
    this.setData({
      t: i18nData,
      currentLang: language
    })

    // 记录当前语言
    this.currentLanguage = language

    // 若页面实现了 refreshLanguageDependentData，则在语言切换后调用它
    if (typeof this.refreshLanguageDependentData === 'function') {
      this.refreshLanguageDependentData(language)
    }

    // 如果页面配置了导航栏标题的key，则更新导航栏
    if (this.i18nKeys && this.i18nKeys.navTitle) {
      wx.setNavigationBarTitle({
        title: i18nData.navTitle
      })
    }

    // 同步底部 TabBar 文字语言
    const app = getApp();
    if (app && typeof app.updateTabBarLabels === 'function') {
      app.updateTabBarLabels(language);
    }
  },

  // 监听语言变化
  onShow() {
    const language = wx.getStorageSync('language') || 'zh'

    // 若全局事件标记语言已变更，或页面记录的 currentLanguage 与存储不一致，则刷新文本
    if ((wx.eventCenter && wx.eventCenter.languageChanged) || this.currentLanguage !== language) {
      this.updatePageLanguage(language)

      // 重置全局事件标记
      if (wx.eventCenter) {
        wx.eventCenter.languageChanged = false
      }
    }
  }
}

// 创建页面
const createPage = (pageConfig) => {
  // 合并基础页面方法
  const methods = { ...basePage, ...pageConfig }
  
  // 保存原始的onLoad方法
  const originalOnLoad = methods.onLoad
  
  // 重写onLoad方法
  methods.onLoad = function(options) {
    const language = wx.getStorageSync('language') || 'zh'
    // 初始化页面文本和导航栏
    this.updatePageLanguage(language)

    // ---------- 开启右上角分享菜单（好友 & 朋友圈） ----------
    if (wx.showShareMenu) {
      wx.showShareMenu({
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }

    // 调用原始onLoad
    if (originalOnLoad) {
      originalOnLoad.call(this, options)
    }
  }
  
  // 保存原始的onShow方法
  const originalOnShow = methods.onShow
  
  // 重写onShow方法
  methods.onShow = function() {
    // 调用基类的onShow
    basePage.onShow.call(this)
    
    // 调用原始onShow
    if (originalOnShow) {
      originalOnShow.call(this)
    }
  }

  // -------- 默认分享实现：若页面未自定义 onShareAppMessage / onShareTimeline --------
  if (!methods.onShareAppMessage) {
    methods.onShareAppMessage = function() {
      const language = wx.getStorageSync('language') || 'zh'
      // 页面可自定义 getShareData(language, scene) 返回更丰富的分享数据
      if (typeof this.getShareData === 'function') {
        const data = this.getShareData(language, 'appMessage')
        if (data) return data
      }
      return {
        title: language === 'en' ? 'Think you can tell human from AI? Try and see!' : '别笑，你试你也分不清人类和AI！',
        path: '/pages/game-home/game-home',
        imageUrl: '/assets/figma/share2.png'
      }
    }
  }

  if (!methods.onShareTimeline) {
    methods.onShareTimeline = function() {
      const language = wx.getStorageSync('language') || 'zh'
      if (typeof this.getShareData === 'function') {
        const data = this.getShareData(language, 'timeline')
        if (data) return data
      }
      return {
        title: language === 'en' ? 'Think you can tell human from AI? Try and see!' : '别笑，你试你也分不清人类和AI！',
        query: '',
        imageUrl: '/assets/figma/share2.png'
      }
    }
  }

  return Page(methods)
}

module.exports = {
  createPage
} 