const { createPage } = require('../../utils/basePage');
const { t } = require('../../utils/i18n');

createPage({
  pageKey: 'campus',
  i18nKeys: {
    navTitle: 'navTitle'
  },

  data: {
    navTitle: '',
    inviteTask: {
      completed: false,
      claimed: false
    },
    // 添加导航栏相关数据
    navBarHeight: 0,
    menuButtonInfo: null,
    statusBarHeight: 0,
    // 语言相关的SVG路径
    topCardSvg: '/assets/images/campus/top-card_zh.svg',
    friendsCardSvg: '/assets/images/campus/friends-card_zh.svg',
    signInCardSvg: '/assets/images/campus/check-in-card_zh.svg',
    drawCardSvg: '/assets/images/campus/draw-card_zh.svg',
    giftCardSvg: '/assets/images/campus/gift-card_zh.svg',
    goCompleteSvg: '/assets/images/campus/go-complete_zh.svg',
    claimSvg: '/assets/images/campus/claim_zh.svg'
  },

  onLoad() {
    this.loadTaskStatus();
    this.getNavBarInfo();
  },

  onShow() {
    this.loadTaskStatus();
  },

  /** 获取导航栏信息 */
  getNavBarInfo() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    
    // 导航栏高度 = 状态栏高度 + 胶囊高度 + (胶囊顶部距离状态栏底部的距离) * 2
    const navBarHeight = systemInfo.statusBarHeight + menuButtonInfo.height + (menuButtonInfo.top - systemInfo.statusBarHeight) * 2;
    
    this.setData({
      navBarHeight,
      menuButtonInfo,
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  /** 加载任务状态 */
  loadTaskStatus() {
    // 从本地存储或云数据库加载任务状态
    const inviteTask = wx.getStorageSync('inviteTask') || {
      completed: false,
      claimed: false
    };
    
    this.setData({
      inviteTask
    });
  },

  /** 语言切换后刷新动态文本和资源 */
  refreshLanguageDependentData(language) {
    const langCode = language === 'en' ? 'en' : 'zh';
    
    // 更新SVG路径
    this.setData({
      topCardSvg: `/assets/images/campus/top-card_${langCode}.svg`,
      friendsCardSvg: `/assets/images/campus/friends-card_${langCode}.svg`,
      signInCardSvg: `/assets/images/campus/check-in-card_${langCode}.svg`,
      drawCardSvg: `/assets/images/campus/draw-card_${langCode}.svg`,
      giftCardSvg: `/assets/images/campus/gift-card_${langCode}.svg`,
      goCompleteSvg: `/assets/images/campus/go-complete_${langCode}.svg`,
      claimSvg: `/assets/images/campus/claim_${langCode}.svg`
    });
  },

  /** 邀请好友功能 */
  onInviteFriends() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.showToast({
      title: '邀请好友功能开发中',
      icon: 'none'
    });
  },

  /** 领取奖励 */
  claimReward() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }

    wx.showLoading({
      title: '领取中...'
    });

    // 模拟领取奖励的API调用
    setTimeout(() => {
      wx.hideLoading();
      
      this.setData({
        'inviteTask.claimed': true
      });
      
      wx.setStorageSync('inviteTask', this.data.inviteTask);
      
      wx.showToast({
        title: '领取成功！+200金币',
        icon: 'success',
        duration: 2000
      });
    }, 1500);
  },

  /** 底部 TabBar 点击时震动反馈 */
  onTabItemTap(item) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  },

  /** 分享配置 - 参考basePage.js */
  onShareAppMessage() {
    const language = wx.getStorageSync('language') || 'zh';
    return {
      title: language === 'en' ? 'Join the Turing Dialogue Challenge!' : '别笑，你试你也分不清人类和AI！',
      path: '/pages/game-home/game-home',
      imageUrl: '/assets/figma/share2.png'
    };
  },

  onShareTimeline() {
    const language = wx.getStorageSync('language') || 'zh';
    return {
      title: language === 'en' ? 'Join the Turing Dialogue Challenge!' : '别笑，你试你也分不清人类和AI！',
      query: '',
      imageUrl: '/assets/figma/share2.png'
    };
  },

  /** 分享成功处理 */
  onShareSuccess() {
    // 更新任务状态
    this.setData({
      'inviteTask.completed': true
    });
    
    wx.setStorageSync('inviteTask', this.data.inviteTask);
    
    wx.showToast({
      title: '分享成功！任务完成',
      icon: 'success',
      duration: 2000
    });
  },

  /** 签到任务 */
  onSignInTask() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.showToast({
      title: '签到功能开发中',
      icon: 'none'
    });
  },

  /** 大转盘任务 */
  onDrawTask() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.showToast({
      title: '大转盘功能开发中',
      icon: 'none'
    });
  },

  /** 打卡好礼任务 */
  onGiftTask() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.showToast({
      title: '打卡好礼功能开发中',
      icon: 'none'
    });
  }
}); 