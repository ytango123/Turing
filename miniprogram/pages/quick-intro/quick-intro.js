const { createPage } = require('../../utils/basePage')

createPage({
  pageKey: 'quickIntro',
  i18nKeys: {
    navTitle: 'navTitle'
  },

  data: { 
    /** 标记是否已进入挑战，避免回到 quick-intro */
    challengeStarted: false,
    currentLang: wx.getStorageSync('language') || 'zh', // 添加当前语言状态
    loadingDialogues: false, // 对话加载状态
    // 页面准备状态，控制初始渲染
    pageReady: false
  },

  onLoad() {
    // 所有基础文本已由 basePage 注入，此时标记页面已准备好
    this.setData({ pageReady: true });
  },

  /** 开始挑战 */
  startChallenge() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const app = getApp();
    app.globalData = app.globalData || {};
    // 清空缓存，确保重新抽取
    app.globalData.gameDialogues = [];

    // loading 文案
    const lang = this.data.currentLang;
    wx.showLoading({ title: lang==='en' ? 'Loading...' : '加载中...', mask: true });
    this.setData({ loadingDialogues: true });

    // 1) 取对话 JSON → 2) 预下载音频 → 3) 跳 conversation
    this.loadDialoguesFromCloud()
      .then(() => this.downloadFirstAudio())
      .then(() => {
        wx.hideLoading();
        this.setData({ challengeStarted: true, loadingDialogues: false });
        wx.redirectTo({ url: '/pages/conversation/conversation?dialogueId=1' });
      })
      .catch(err => {
        console.error('预加载失败', err);
        wx.hideLoading();
        this.setData({ loadingDialogues: false });
        wx.showToast({ title: lang==='en' ? 'Failed to load' : '加载失败', icon: 'none' });
      });
  },

  /** @deprecated 滚动预下载方案已启用，此函数保留备查 */
  batchPreloadAudios() { return Promise.resolve(); },

  /** 预加载对话（复制自 conversation 页面简化版） */
  loadDialoguesFromCloud() {
    const app = getApp();
    app.globalData = app.globalData || {};

    // 已有缓存则直接返回
    if (Array.isArray(app.globalData.gameDialogues) && app.globalData.gameDialogues.length === 10) {
      return Promise.resolve();
    }

    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
    const sessions = ['Session1', 'Session2'];

    const sessionPromises = sessions.map(session => {
      const fileID = `${envPrefix}/${session}/content.json`;
      return wx.cloud.getTempFileURL({ fileList: [{ fileID, maxAge: 3600 }] })
        .then(res => {
          const tempURL = res.fileList[0].tempFileURL;
          return new Promise((resolve, reject) => {
            wx.request({
              url: tempURL,
              success: r => resolve((r.data || []).map(d => ({ ...d, session }))),
              fail: reject
            });
          });
        });
    });

    return Promise.allSettled(sessionPromises).then(results => {
      const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      if (!fulfilled.length) throw new Error('fetch sessions failed');
      const allDialogues = [].concat(...fulfilled);

      const gameDialogues = this.selectRandomDialogues(allDialogues, 10);
      app.globalData.gameDialogues = gameDialogues;
      app.globalData.totalDialoguesCount = allDialogues.length;
    });
  },

  /** 仅预下载第一题音频，存入 globalData.preloadAudios */
  downloadFirstAudio() {
    const app = getApp();
    const dlg = (app.globalData.gameDialogues || [])[0];
    if (!dlg) return Promise.resolve();
    app.globalData.preloadAudios = app.globalData.preloadAudios || {};
    const cid = dlg.conversation_id;
    if (app.globalData.preloadAudios[cid]) return Promise.resolve();
    const session = dlg.session || 'Session2';
    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
    const fileID = `${envPrefix}/${session}/${cid}.wav`;
    return wx.cloud.downloadFile({ fileID }).then(res => {
      app.globalData.preloadAudios[cid] = res.tempFilePath;
    }).catch(()=>{});
  },

  selectRandomDialogues(dialogues, count) {
    const valid = (dialogues || []).filter(d => d && d.type);
    const heard = (getApp().globalData.gameData && getApp().globalData.gameData.heardDialogues) || [];
    const heardSet = new Set(heard);
    const uniqueMap = new Map();
    valid.forEach(d => {
      const cid = d.conversation_id;
      if (!cid || heardSet.has(cid)) return;
      if (!uniqueMap.has(cid) || Math.random() < 0.5) {
        uniqueMap.set(cid, d);
      }
    });
    let candidates = Array.from(uniqueMap.values());
    if (candidates.length < count) candidates = valid;
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates.slice(0, count);
  },

  /** 回到页面时若已开始挑战，则跳转至首页 */
  onShow() {
    if (this.data.challengeStarted) {
      wx.switchTab({
        url: '/pages/game-home/game-home'
      });
    }
  }
}) 