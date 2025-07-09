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
    tabAchievements: 'tabs.achievements',
    tabHistory: 'tabs.history',
    historyEmpty: 'history.empty',
    historyChallenge: 'history.challenge',
    historyCorrectRate: 'history.correctRate',
    historyPointsGained: 'history.pointsGained'
  },

  data: {
    avatarUrl: '',
    userInitial: 'T',
    username: '图灵测试者',
    level: '业余探索者',
    levelClass: 'blue',
    points: 0,
    completedChallenges: 12,
    nextLevel: '资深鉴别师',
    pointsToNextLevel: 19,
    levelProgress: 85,
    hasFrame: true,
    
    correctRate: 76,
    maxCombo: 5,
    unlockedAchievements: 3,
    
    currentTab: 'achievements',
    
    achievements: [
      {
        id: 1,
        title: '初次尝试',
        description: '完成第一轮图灵挑战',
        icon: 'check_circle_line',
        iconType: 'iconfont',
        unlocked: false,
        key: 'firstTry'
      },
      {
        id: 2,
        title: '连击大师',
        description: '在一轮挑战中获得5次连击',
        icon: 'star_line',
        iconType: 'iconfont',
        unlocked: false,
        key: 'comboMaster'
      },
      {
        id: 3,
        title: '完美判断',
        description: '在一轮挑战中获得10/10的正确率',
        icon: 'trophy_2_line',
        iconType: 'iconfont',
        unlocked: false,
        key: 'perfectJudge'
      }
    ],
    
    history: [],
    progressText: ''
  },
  
  onLoad() {
    this.fetchLatestUserData();
  },
  
  // 从云端获取最新用户数据
  fetchLatestUserData() {
    const db = wx.cloud.database();
    
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
            const language = wx.getStorageSync('language') || 'zh';
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

          // 计算总正确率（历史平均）
          const historyArr = gameData.history || [];
    let totalCorrectRate = 0;
          if (historyArr.length > 0) {
            const sum = historyArr.reduce((acc, item) => acc + (item.correctRate || 0), 0);
            totalCorrectRate = Math.round(sum / historyArr.length);
          } else if (gameData.correctRate !== undefined) {
            totalCorrectRate = gameData.correctRate;
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
  }
}) 