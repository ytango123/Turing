const { createPage } = require('../../utils/basePage')

createPage({
  pageKey: 'quickIntro',
  i18nKeys: {
    navTitle: 'navTitle',
    title: 'title',
    descLine1: 'description.line1',
    descLine2: 'description.line2',
    descLine3: 'description.line3',
    startButton: 'startButton'
  },

  data: { 
    pressed: false,
    /** 标记是否已进入挑战，避免回到 quick-intro */
    challengeStarted: false 
  },

  /** 开始挑战 */
  startChallenge() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    this.setData({ challengeStarted: true });
    wx.navigateTo({
      url: '/pages/conversation/conversation?reset=1'
    })
  },

  /** 回到页面时若已开始挑战，则跳转至首页 */
  onShow() {
    if (this.data.challengeStarted) {
      wx.switchTab({
        url: '/pages/game-home/game-home'
      });
    }
  },

  onPress() { 
    this.setData({ pressed: true }) 
  },

  onRelease() { 
    this.setData({ pressed: false }) 
  }
}) 