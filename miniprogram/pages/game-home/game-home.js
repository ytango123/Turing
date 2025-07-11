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
    superIdentifier: 'superIdentifier'
  },

  data: {
    avatarUrl: '',
    userInitial: 'T',
    username: '图灵测试者',
    level: '',
    levelClass: 'green',
    points: 0,
    nextLevel: '',
    pointsToNextLevel: 35,
    levelProgress: 65,
    progressText: '',
    
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
    
    rankings: [],
    displayRankings: [],
    showFullRankings: false
  },
  
  onLoad() {
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
          // 出错时暂时不跳转，尝试继续加载页面
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
    // 重新计算等级进度（内部已根据 language 读取本地存储）
    this.calculateLevelProgress();
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
    const display = this.data.showFullRankings ? rankList : rankList.slice(0, 3)
    this.setData({
      displayRankings: display
    })
  },
  
  fetchRankingsPreview() {
    const db = wx.cloud.database();
    const _ = db.command;
    const userPoints = app.globalData.gameData ? (app.globalData.gameData.points || 0) : 0;
    
    // 获取前20名用户数据
    db.collection('users')
      .orderBy('gameData.points', 'desc')
      .limit(20)
      .get()
      .then(resTop => {
        const topList = resTop.data.map((u, idx) => ({
          rank: idx + 1,
          name: u.nickname || '匿名',
          points: (u.gameData && u.gameData.points) || 0,
          avatarUrl: u.avatarUrl || '',
          userInitial: (u.nickname || '匿').charAt(0),
          isUser: u._openid === app.globalData.openid
        }));
        
        db.collection('users')
          .where({
            'gameData.points': _.gt(userPoints)
          })
          .count()
          .then(resCnt => {
            const userRankNum = resCnt.total + 1;
            let rankingList = topList;
            
            // 检查当前用户是否已经在列表中
            const isUserInList = topList.some(item => item.isUser);
            
            if (!isUserInList) {
              rankingList = [
                ...topList,
                {
                  rank: userRankNum,
                  name: (app.globalData.userInfo && app.globalData.userInfo.nickname) || `用户${(app.globalData.openid || '').slice(-4)}`,
                  points: userPoints,
                  avatarUrl: app.globalData.userInfo ? (app.globalData.userInfo.avatarUrl || '') : '',
                  userInitial: (app.globalData.userInfo && app.globalData.userInfo.nickname ? app.globalData.userInfo.nickname.charAt(0) : '你'),
                  isUser: true
                }
              ];
            }
            
            this.setData({
              rankings: rankingList
            }, () => {
              this.updateDisplayRankings(rankingList)
            });
          })
          .catch(err => {
            console.error('获取用户排名失败', err);
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