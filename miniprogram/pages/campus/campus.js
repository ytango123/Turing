const { createPage } = require('../../utils/basePage');
const { t } = require('../../utils/i18n');

createPage({
  pageKey: 'campus',
  i18nKeys: {
    navTitle: 'navTitle'
  },

  data: {
    navTitle: ''
  },

  onLoad() {},

  /** 底部 TabBar 点击时震动反馈 */
  onTabItemTap(item) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  }
}); 