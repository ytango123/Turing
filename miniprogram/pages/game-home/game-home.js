const app = getApp()
const { createPage } = require('../../utils/basePage')
const { t } = require('../../utils/i18n')

createPage({
  pageKey: 'gameHome',
  i18nKeys: {
    navTitle: 'navTitle',
    challengeModes: 'challengeModes',
    rankings: 'rankings',
    viewAll: 'viewAll',
    collapse: 'collapse',
    points: 'points',
    quickChallengeTitle: 'quickChallenge.title',
    quickChallengeDesc: 'quickChallenge.description',
    hardModeTitle: 'hardMode.title',
    hardModeDesc: 'hardMode.description',
    hardModeComingSoon: 'hardMode.comingSoon',
    levelProgress: 'levelProgress',
    newUser: 'newUser',
    amateurExplorer: 'amateurExplorer',
    seniorIdentifier: 'seniorIdentifier',
    turingMaster: 'turingMaster',
    superIdentifier: 'superIdentifier',
    rankingsTip: 'rankingsTip',
    voiceCloneModes: 'voiceCloneModes',
    voiceMovieTitle: 'voiceMovie.title',
    voiceMovieDesc: 'voiceMovie.description',
    voiceMusicTitle: 'voiceMusic.title',
    voiceMusicDesc: 'voiceMusic.description'       
  },

  data: {
    navTitle: '',
    avatarUrl: '',
    userInitial: 'T',
    username: '图灵测试者',
    level: '',
    levelClass: 'green',
    points: 0,
    nextLevel: '',
    pointsToNextLevel: 0,
    levelProgress: 0,
    progressText: '',
    /** 页面是否就绪，用于首屏加载判断 */
    pageReady: false,

    // 根据语言切换的模式卡片SVG
    quickChallengeSvg: '/assets/images/game-home/quick-challenge-zh.svg',
    hardModeSvg: '/assets/images/game-home/hard-mode-zh.svg',
    voiceMovieSvg: '/assets/images/game-home/movie-zh.svg',
    voiceMusicSvg: '/assets/images/game-home/music-zh.svg',

    gameModes: [
      {
        id: 'quick',
        icon: 'flash_line',
        iconType: 'iconfont',
        color: '#2ba471',
        bgColor: '#e3f9e9',
        locked: false
      },
      {
        id: 'hard',
        icon: 'lock_line',
        iconType: 'iconfont',
        color: '#7E22CE',
        bgColor: '#F3E8FF',
        locked: true
      }
    ],

    voiceModes: [
      { id: 'movie', titleKey: 'voiceMovieTitle', descKey: 'voiceMovieDesc', svgField: 'voiceMovieSvg', new: true },
      { id: 'music', titleKey: 'voiceMusicTitle', descKey: 'voiceMusicDesc', svgField: 'voiceMusicSvg', new: true }
    ],

    rankings: [],
    displayRankings: [],
    showFullRankings: false,
    // 新增：前三名与后续排名分离及卡片高度
    topRankings: [],
    restRankings: [],
    rankCardHeight: 0,
    // 标记排行榜数据是否已准备完毕，用于避免初始渲染闪屏
    rankDataReady: false
  },

  onLoad() {
    // -------- 路由前置判断：若已知是新用户，直接去 welcome --------
    if (app.globalData && app.globalData.isNewUser) {
      wx.reLaunch({ url: '/pages/welcome/welcome' });
      return;
    }

    // 若 openid 尚未获取，主动拉取，获取后再根据 isNewUser 状态决定
    if (!app.globalData.openid) {
      app.getUserInfo().finally(() => {
        if (app.globalData.isNewUser) {
          wx.reLaunch({ url: '/pages/welcome/welcome' });
        } else {
          this.updatePageData();
        }
      });
      // 先不继续执行，等待回调
      return;
    }
    const language = wx.getStorageSync('language') || 'zh';
    this.setData({ navTitle: t('gameHome.navTitle', language) || (language==='en'?'Home':'首页') });
    // 如果全局缓存有用户信息，先快速渲染头像等基础信息
    if (app.globalData.userInfo) {
      const info = app.globalData.userInfo;
      const nickname = info.nickname || `用户${(app.globalData.openid || '').slice(-4)}`;
      this.setData({
        avatarUrl: info.avatarUrl || '',
        username: nickname,
        userInitial: nickname.charAt(0)
      });
    }

    // 检查是否已有用户信息（从全局状态获取）
    if (!app.globalData.userInfo) {
      // 如果全局状态中没有用户信息，尝试检查用户注册状态
      app.isUserRegistered()
        .then(isRegistered => {
          if (!isRegistered) {
            // 用户未注册，跳转到欢迎页
            wx.reLaunch({
              url: '/pages/welcome/welcome'
            });
          } else {
            // 用户已注册，更新页面数据
            this.updatePageData();
          }
        })
        .catch(err => {
          console.error('检查用户注册状态失败', err);
          // 出错时尝试继续加载页面
          this.updatePageData();
        });
    } else {
      // 已有用户信息，直接更新页面数据
      this.updatePageData();
    }
  },

  // 新增：页面每次显示时都刷新数据，确保点数及时更新
  onShow() {
    this.updatePageData();
  },

  // 更新页面数据
  updatePageData() {
    // 从云端获取最新游戏数据
    const db = wx.cloud.database();
    db.collection('users')
      .where({
        _openid: app.globalData.openid
      })
      .get()
      .then(res => {
        if (res.data && res.data[0]) {
          const userData = res.data[0];
          const gameData = userData.gameData || {};

          // 更新全局数据
          app.globalData.gameData = gameData;

          // 生成默认昵称（若数据库中无昵称）
          const nickname = userData.nickname || `用户${(app.globalData.openid || '').slice(-4)}`;
          const userInitial = nickname.charAt(0);
          const avatarUrl = userData.avatarUrl || '';

          // 更新页面数据
      this.setData({
        points: gameData.points || 0,
            level: t('gameHome.newUser'),  // 直接使用多语言文本
            username: nickname,
            userInitial: userInitial,
            avatarUrl: avatarUrl
      });

      // 计算等级进度
      this.calculateLevelProgress();
      // 数据加载完毕，显示页面
      this.setData({ pageReady: true });
    }
      })
      .catch(err => {
        console.error('获取用户数据失败', err);
      });

    // 获取排行榜预览
    this.fetchRankingsPreview();
  },

  calculateLevelProgress() {
    const currentPoints = this.data.points;
    let currentLevel = 'newUser';
    let nextLevel = 'amateurExplorer';
    let requiredPoints = 100;

    // 根据点数确定当前等级和下一等级
    if (currentPoints >= 500) {
      currentLevel = 'superIdentifier';
      nextLevel = 'superIdentifier';
      requiredPoints = 500;
    } else if (currentPoints >= 300) {
      currentLevel = 'turingMaster';
      nextLevel = 'superIdentifier';
      requiredPoints = 500;
    } else if (currentPoints >= 200) {
      currentLevel = 'seniorIdentifier';
      nextLevel = 'turingMaster';
      requiredPoints = 300;
    } else if (currentPoints >= 100) {
      currentLevel = 'amateurExplorer';
      nextLevel = 'seniorIdentifier';
      requiredPoints = 200;
    }

    // Map level to badge class
    let badgeClass = 'green';
    if (currentLevel === 'amateurExplorer') {
      badgeClass = 'blue';
    } else if (currentLevel === 'seniorIdentifier') {
      badgeClass = 'purple';
    } else if (currentLevel === 'turingMaster') {
      badgeClass = 'orange';
    } else if (currentLevel === 'superIdentifier') {
      badgeClass = 'platinum';
    }

    // 计算还需要的点数
    const pointsToNextLevel = requiredPoints - currentPoints;
    // 进度条仅显示当前等级区间内 0-100 点
    let progress;
    if (currentPoints >= 500) {
      progress = 100;
    } else {
      progress = currentPoints % 100;
    }

    // 获取当前语言环境
    const language = wx.getStorageSync('language') || 'zh';

    // 设置当前等级和下一等级的显示文本
    const currentLevelText = t(`gameHome.${currentLevel}`, language);
    const nextLevelText = t(`gameHome.${nextLevel}`, language);

    // 获取进度文本模板并替换变量
    const progressTemplate = t('gameHome.levelProgress', language);
    let progressText = progressTemplate
      .replace('{nextLevel}', nextLevelText)
      .replace('{points}', pointsToNextLevel);

    // 最高等级（superIdentifier）时不显示进度文本
    if (currentLevel === 'superIdentifier') {
      progressText = '';
    }

      this.setData({
      level: currentLevelText,
      nextLevel: nextLevelText,
        pointsToNextLevel,
      levelProgress: progress,
      progressText,
      levelClass: badgeClass
      });
  },

  // 语言切换后刷新动态文本
  refreshLanguageDependentData(language) {
    this.setData({ navTitle: t('gameHome.navTitle', language) || (language==='en'?'Home':'首页') });
    // 重新计算等级进度（内部已根据 language 读取本地存储）
    this.calculateLevelProgress();

    // 更新模式卡片 SVG 路径
    const langCode = (language === 'en') ? 'en' : 'zh'
    this.setData({
      quickChallengeSvg: `/assets/images/game-home/quick-challenge-${langCode}.svg`,
      hardModeSvg: `/assets/images/game-home/hard-mode-${langCode}.svg`,
      voiceMovieSvg: `/assets/images/game-home/movie-${langCode}.svg`,
      voiceMusicSvg: `/assets/images/game-home/music-${langCode}.svg`
    })
  },

  startQuickChallenge() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    wx.navigateTo({
      url: '/pages/quick-intro/quick-intro'
    });
  },

  // 根据是否展开设置显示的排行榜数据
  updateDisplayRankings(rankList = this.data.rankings) {
    const top = rankList.slice(0, 3)
    const rest = rankList.slice(3)
    // 估算每条记录高度（含间距）
    const ITEM_HEIGHT = 230 // rpx，包括卡片本身+间距
    const cardHeight = rest.length * ITEM_HEIGHT ; // 顶部+底部留白

    this.setData({
      topRankings: top,
      restRankings: rest,
      rankCardHeight: cardHeight,
      displayRankings: rankList, // 兼容旧字段，避免报错
      rankDataReady: true // 数据就绪，可安全显示排行榜卡片
    })
  },

  // 只取前十名排行榜
  fetchRankingsPreview() {
    const db = wx.cloud.database();

    // 获取前 10 名
    db.collection('users')
      .orderBy('gameData.points', 'desc')
      .limit(10)                        // ← 20 ➜ 10
      .get()
      .then(resTop => {
        const rankingList = resTop.data.map((u, idx) => ({
          rank: idx + 1,
          name: u.nickname || '匿名',
          points: (u.gameData && u.gameData.points) || 0,
          avatarUrl: u.avatarUrl || '',
          userInitial: (u.nickname || '匿').charAt(0),
          isUser: u._openid === app.globalData.openid
        }));

        // 直接使用前十名数据
        this.setData({
          rankings: rankingList
        }, () => {
          this.updateDisplayRankings(rankingList);
        });
      })
      .catch(err => {
        console.error('获取排行榜失败', err);
      });
  },

  toggleRankings() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    this.setData({
      showFullRankings: !this.data.showFullRankings
    }, () => {
      this.updateDisplayRankings()
    });
  },

  /** 点击语音克隆卡片震动反馈并占位页面跳转 */
  onVoiceCardTap(e) {
    // 轻微震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' })
    }

    // 根据 data-id 判断目标卡片
    const { currentTarget } = e
    const id = currentTarget.dataset && currentTarget.dataset.id

    if (id === 'movie') {
      // TODO: 跳转至语音克隆-电影台词页面
      wx.showToast({ title: '该功能开发中', icon: 'none' })
    } else if (id === 'music') {
      // TODO: 跳转至语音克隆-歌手演唱页面
      wx.showToast({ title: '该功能开发中', icon: 'none' })
    }
  },

  editProfile() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    });
  },

  onTabItemTap(item) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  }
}) 