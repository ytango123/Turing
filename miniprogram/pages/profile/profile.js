const { createPage } = require('../../utils/basePage')
const { t } = require('../../utils/i18n')

createPage({
  pageKey: 'profile',
  i18nKeys: {
    navTitle: 'navTitle',
    challengesCompleted: 'challengesCompleted',
    pointsLabel: 'points',
    statsCorrectRate: 'stats.correctRate',
    statsMaxCombo: 'stats.maxCombo',
    statsAchievements: 'stats.achievements',
    statsRank: 'stats.rank',
    tabAchievements: 'tabs.achievements',
    tabHistory: 'tabs.history',
    historyEmpty: 'history.empty',
    historyChallenge: 'history.challenge',
    historyCorrectRate: 'history.correctRate',
    historyPointsGained: 'history.pointsGained',
    closeLabel: 'close'
  },

  data: {
    navTitle: '',
    currentLang: wx.getStorageSync('language') || 'zh',
    avatarUrl: '',
    userInitial: 'T',
    username: '图灵测试者',
    level: '业余探索者',
    levelClass: 'blue',
    points: 0,
    completedChallenges: 0,
    nextLevel: '',
    pointsToNextLevel: 0,
    levelProgress: 0,
    hasFrame: true,
    
    correctRate: 0,
    maxCombo: 0,
    unlockedAchievements: 0,
    userRank: '--',
    showBadgeModal: false,
    selectedBadge: null,
    
    currentTab: 'achievements',
    
    achievements: [
      {
        id: 1,
        title: '初次尝试',
        description: '完成第一轮图灵挑战',
        icon: 'check_circle_line',
        iconType: 'iconfont',
        unlocked: false,
        key: 'firstTry',
        image: '/assets/images/summary/first_try.svg',
        size: 210
      },
      {
        id: 3,
        title: '完美判断',
        description: '在一轮挑战中获得10/10的正确率',
        icon: 'trophy_2_line',
        iconType: 'iconfont',
        unlocked: false,
        key: 'perfectJudge',
        image: '/assets/images/summary/perfect.svg',
        size: 210
      },
      {
        id: 4,
        title: '完美连胜',
        description: '连续三轮挑战都达到 100% 正确率',
        icon: 'flash_line',
        iconType: 'iconfont',
        unlocked: false,
        key: 'flawlessStreak',
        image: '/assets/images/summary/flawless.svg',
        size: 210
      }
    ],
    
    history: [],
    progressText: ''
  },
  
  onLoad() {
    const lang = wx.getStorageSync('language') || 'zh';
    this.setData({ navTitle: t('profile.navTitle', lang) || (lang==='en'?'Profile':'资料') });
    this.fetchLatestUserData();
  },
  
  // 从云端获取最新用户数据
  fetchLatestUserData() {
    const db = wx.cloud.database();
    const _ = db.command;
    
    // 确保有openid
    if (!getApp().globalData || !getApp().globalData.openid) {
      return;
    }
    
    db.collection('users')
      .where({
        _openid: getApp().globalData.openid
      })
      .get()
      .then(res => {
        if (res.data && res.data[0]) {
          const userData = res.data[0];
          const gameData = userData.gameData || {};
          
          // 更新全局数据
          getApp().globalData.gameData = gameData;
          
          // 获取用户排名
          const userPoints = gameData.points || 0;
          db.collection('users')
            .where({
              'gameData.points': _.gt(userPoints)
            })
            .count()
            .then(resCnt => {
              const userRankNum = resCnt.total + 1;
              this.setData({
                userRank: userRankNum
              });
            })
            .catch(err => {
              console.error('获取用户排名失败', err);
            });

          // 生成默认昵称（若数据库中无昵称）
          const nickname = userData.nickname || `用户${(getApp().globalData.openid || '').slice(-4)}`;
          const userInitial = nickname.charAt(0);
          const avatarUrl = userData.avatarUrl || '';
          
          // 更新页面数据
      this.setData({
        level: gameData.level,
        points: gameData.points,
            username: nickname,
            userInitial: userInitial,
            avatarUrl: avatarUrl,
        completedChallenges: gameData.completedChallenges || 0,
            maxCombo: gameData.maxCombo || 0,
            history: gameData.history || []
      });
      
      // 计算等级进度
      this.calculateLevelProgress();
          
          // 更新成就解锁状态
          if (gameData.achievements) {
            const language = this.currentLanguage || wx.getStorageSync('language') || 'zh';
            const achievements = this.data.achievements.map(achievement => {
              return {
              ...achievement,
                title: t(`profile.achievements.${achievement.key}.title`, language),
                description: t(`profile.achievements.${achievement.key}.description`, language),
              unlocked: !!gameData.achievements[achievement.key]
              };
            });
      
      // 计算已解锁成就数量
            const unlockedAchievements = Object.keys(gameData.achievements).length;
            
      this.setData({
              achievements,
        unlockedAchievements
      });
    }

          /* 计算总正确率：优先使用累计字段 totalCorrectRate；
             若不存在则回退到历史平均或最后一轮 */
          let totalCorrectRate = 0;
          if (gameData.totalCorrectRate !== undefined) {
            totalCorrectRate = gameData.totalCorrectRate;
          } else {
            const historyArr = gameData.history || [];
            if (historyArr.length > 0) {
              const sum = historyArr.reduce((acc, item) => acc + (item.correctRate || 0), 0);
              totalCorrectRate = Math.round(sum / historyArr.length);
            } else if (gameData.correctRate !== undefined) {
              totalCorrectRate = gameData.correctRate;
            }
          }
          
    this.setData({
      correctRate: totalCorrectRate
          });
        }
      })
      .catch(err => {
        console.error('获取用户数据失败', err);
    });
  },
  
  calculateLevelProgress() {
    const currentPoints = this.data.points;
    let currentLevelKey = 'newUser';
    let nextLevelKey = 'amateurExplorer';
    let requiredPoints = 100;

    if (currentPoints >= 500) {
      currentLevelKey = 'superIdentifier';
      nextLevelKey = 'superIdentifier';
      requiredPoints = 500;
    } else if (currentPoints >= 300) {
      currentLevelKey = 'turingMaster';
      nextLevelKey = 'superIdentifier';
      requiredPoints = 500;
    } else if (currentPoints >= 200) {
      currentLevelKey = 'seniorIdentifier';
      nextLevelKey = 'turingMaster';
      requiredPoints = 300;
    } else if (currentPoints >= 100) {
      currentLevelKey = 'amateurExplorer';
      nextLevelKey = 'seniorIdentifier';
      requiredPoints = 200;
    }

    const pointsToNextLevel = requiredPoints - currentPoints;
    // 进度条仅显示当前等级区间内 0-100 点
    let progress;
    if (currentPoints >= 500) {
      progress = 100;
    } else {
      progress = currentPoints % 100;
    }

    const language = wx.getStorageSync('language') || 'zh';
    const currentLevelText = t(`gameHome.${currentLevelKey}`, language);
    const nextLevelText = t(`gameHome.${nextLevelKey}`, language);
    const progressTemplate = t('gameHome.levelProgress', language);
    let progressText = progressTemplate
      .replace('{nextLevel}', nextLevelText)
      .replace('{points}', pointsToNextLevel);
      
      // 最高等级时隐藏进度文本
      if (currentLevelKey === 'superIdentifier') {
        progressText = '';
      }
      
      // 根据等级键映射徽章颜色类
      let badgeClass = 'green';
      if (currentLevelKey === 'amateurExplorer') {
        badgeClass = 'blue';
      } else if (currentLevelKey === 'seniorIdentifier') {
        badgeClass = 'purple';
      } else if (currentLevelKey === 'turingMaster') {
        badgeClass = 'orange';
      } else if (currentLevelKey === 'superIdentifier') {
        badgeClass = 'platinum';
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
    this.setData({ navTitle: t('profile.navTitle', language) || (language==='en'?'Profile':'资料') });
    // 更新等级进度相关文本
    this.calculateLevelProgress();

    // 更新成就标题与描述
    const updatedAchievements = this.data.achievements.map(item => ({
      ...item,
      title: t(`profile.achievements.${item.key}.title`, language),
      description: t(`profile.achievements.${item.key}.description`, language)
    }));

    this.setData({ achievements: updatedAchievements });
  },
  
  switchTab(e) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  // 打开徽章弹窗
  openBadgeModal(e) {
    const idx = e.currentTarget.dataset.idx;
    const badge = this.data.achievements[idx];
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    this.setData({
      showBadgeModal: true,
      selectedBadge: badge
    });
  },

  // 关闭弹窗
  closeBadgeModal() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    this.setData({ showBadgeModal: false });
  },
  
  openSettings() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    wx.navigateTo({
      url: '/pages/settings/settings'
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
  },

  onShow() {
    this.fetchLatestUserData();
  },

  onReady() {
    // 页面初次渲染完成后绘制一次环形进度条
  },

  // 绘制正确率环形进度条
  drawCorrectRateRing() {
    const rate = this.data.correctRate || 0;
    const ctx = wx.createCanvasContext('rateRing', this);
    const size = 320; // 画布尺寸（px），需与样式匹配
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);
    ctx.setLineWidth(12);
    ctx.setLineCap('round');

    // 背景圆
    ctx.setStrokeStyle('#F3F4F6');
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // 进度圆
    ctx.setStrokeStyle('#10B981');
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + 2 * Math.PI * rate / 100;
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.stroke();

    ctx.draw();
  }
}) 