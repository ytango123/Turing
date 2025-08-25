const { createPage } = require('../../utils/basePage')

// 在最顶部添加工具函数
// 生成唯一音频键：session/name
function makeAudioKey(session, name) {
  return `${session}/${name}`;
}

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
    pageReady: false,
    /** 本次挑战选用的题库语言：'zh' | 'en' */
    selectedCorpus: 'zh',
    /** 题库选择按钮的 svg 路径 */
    selectBtnSrc: {
      zh: '',
      en: ''
    }
  },

  onLoad() {
    // 所有基础文本已由 basePage 注入，此时标记页面已准备好
    // 默认按照当前 UI 语言选择题库
    const defaultCorpus = this.data.currentLang === 'en' ? 'en' : 'zh';
    this.setData({ pageReady: true, selectedCorpus: defaultCorpus }, () => {
      this.updateSelectBtnSrc();
    });
  },

  /** 更新题库按钮 svg 路径 */
  updateSelectBtnSrc() {
    const uiLang = this.data.currentLang === 'en' ? 'en' : 'zh';
    const selected = this.data.selectedCorpus;
    const zhPrefix = selected === 'zh' ? 'zh_active' : 'zh';
    const enPrefix = selected === 'en' ? 'en_active' : 'en';
    const zhSrc = `/assets/images/quick-intro/${zhPrefix}_${uiLang}.svg`;
    const enSrc = `/assets/images/quick-intro/${enPrefix}_${uiLang}.svg`;
    this.setData({ selectBtnSrc: { zh: zhSrc, en: enSrc } });
  },

  /** 用户点击题库选择 */
  selectCorpus(e) {
    const corpus = e.currentTarget.dataset.corpus;
    if (!corpus || corpus === this.data.selectedCorpus) return;
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    this.setData({ selectedCorpus: corpus });
    this.updateSelectBtnSrc();
  },

  /** 开始挑战 */
  startChallenge() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const app = getApp();
    app.globalData = app.globalData || {};
    // 清空旧缓存，确保重新抽取
    app.globalData.gameDialogues = [];

    // 将题库语言记录到全局，供 conversation 页面使用
    app.globalData.selectedCorpus = this.data.selectedCorpus;

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

  /** 预加载对话（复制自 conversation 页面简化版，已适配新目录） */
  loadDialoguesFromCloud() {
    const app = getApp();
    app.globalData = app.globalData || {};

    // 已有缓存则直接返回
    if (Array.isArray(app.globalData.gameDialogues) && app.globalData.gameDialogues.length === 5) {
      return Promise.resolve();
    }

    const selectedLang = this.data.selectedCorpus;
    const identityDirs = ['HH', 'HM', 'MH', 'MM'];
    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';

    const jsonPromises = identityDirs.map(identity => {
      const testFolder = `${selectedLang}_test_${identity}`;
      const fileID = `${envPrefix}/${selectedLang}/${identity}/${testFolder}.json`;
      return wx.cloud.getTempFileURL({ fileList: [{ fileID, maxAge: 3600 }] })
        .then(res => {
          const tempURL = res.fileList[0] && res.fileList[0].tempFileURL;
          if (!tempURL) throw new Error('no url');
          return new Promise((resolve, reject) => {
            wx.request({
              url: tempURL,
              success: r => {
                let raw = r.data;
                if (typeof raw === 'string') {
                  try { raw = JSON.parse(raw); } catch(e) { raw = []; }
                }
                if (!Array.isArray(raw)) raw = [];
                const list = raw.map(d => ({
                  ...d,
                  lang: selectedLang,
                  identity,
                  testFolder,
                  session: `${selectedLang}/${identity}/${testFolder}`,
                  type: d.type || d.tag || identity
                }));
                resolve(list);
              },
              fail: reject
            });
          });
        });
    });

    return Promise.allSettled(jsonPromises).then(results => {
      const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      if (!fulfilled.length) throw new Error('fetch json failed');
      const allDialogues = [].concat(...fulfilled);
      const gameDialogues = this.selectRandomDialogues(allDialogues, 5);
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
    const audName = dlg.name || dlg.conversation_id;
    const key = makeAudioKey(dlg.session, audName);
    if (app.globalData.preloadAudios[key]) return Promise.resolve();

    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
    const fileID = `${envPrefix}/${dlg.session}/${audName}.m4a`;
    return wx.cloud.downloadFile({ fileID }).then(res => {
      app.globalData.preloadAudios[key] = res.tempFilePath;
    }).catch(() => {});
  },

  selectRandomDialogues(dialogues, count) {
    const valid = (dialogues || []).filter(d => d && d.type);
    const heard = (getApp().globalData.gameData && getApp().globalData.gameData.heardDialogues) || [];
    const heardSet = new Set(heard);
    const uniqueMap = new Map();
    valid.forEach(d => {
      const n = d.name || d.conversation_id;
      if (!n || heardSet.has(n)) return;
      const key = `${d.type}_${n}`;
      if (!uniqueMap.has(key) || Math.random() < 0.5) {
        uniqueMap.set(key, d);
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
  },

  /** 语言切换后刷新动态文本 */
  refreshLanguageDependentData(language) {
    this.setData({ currentLang: language });
    this.updateSelectBtnSrc();
  }
}) 