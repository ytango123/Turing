const app = getApp()

Page({
  data: {
    userInitial: 'T',
    username: '图灵测试者',
    level: '业余探索者',
    points: 81,
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
        unlocked: true
      },
      {
        id: 2,
        title: '连击大师',
        description: '在一轮挑战中获得5次连击',
        icon: 'star_line',
        iconType: 'iconfont',
        unlocked: true
      },
      {
        id: 3,
        title: '业余探索者',
        description: '累计获得80点以上',
        icon: 'medal_line',
        iconType: 'iconfont',
        unlocked: true
      },
      {
        id: 4,
        title: '完美判断',
        description: '在一轮挑战中获得10/10的正确率',
        icon: 'trophy_2_line',
        iconType: 'iconfont',
        unlocked: false
      }
    ],
    
    history: [
      {
        id: 12,
        date: '2023-06-15',
        correctRate: 80,
        pointsGained: 16
      },
      {
        id: 11,
        date: '2023-06-10',
        correctRate: 70,
        pointsGained: 12
      },
      {
        id: 10,
        date: '2023-06-05',
        correctRate: 60,
        pointsGained: 8
      }
    ],
    
    rankings: [
      { rank: 1, name: '王小明', points: 256, isUser: false },
      { rank: 2, name: '李华', points: 198, isUser: false },
      { rank: 3, name: '张三', points: 175, isUser: false },
      { rank: 8, name: '你', points: 81, isUser: true }
    ]
  },
  
  onLoad() {
    // 获取用户信息和游戏数据
    const userInfo = wx.getStorageSync('userInfo');
    const gameData = app.globalData.gameData;
    
    if (userInfo) {
      // 设置用户名首字母
      const username = userInfo.nickname || '图灵测试者';
      const userInitial = username.charAt(0).toUpperCase();
      
      this.setData({
        username,
        userInitial
      });
    }
    
    if (gameData) {
      // 更新游戏数据
      this.setData({
        level: gameData.level,
        points: gameData.points,
        completedChallenges: gameData.completedChallenges || 0,
        correctRate: gameData.correctRate || 0,
        maxCombo: gameData.maxCombo || 0
      });
      
      // 计算等级进度
      this.calculateLevelProgress();
      
      // 计算已解锁成就数量
      const unlockedAchievements = (gameData.achievements || []).length;
      this.setData({
        unlockedAchievements
      });
    }
  },
  
  calculateLevelProgress() {
    // 根据不同等级设置不同的下一等级和所需点数
    const levels = {
      '新手': { next: '业余探索者', required: 100 },
      '业余探索者': { next: '资深鉴别师', required: 200 },
      '资深鉴别师': { next: '图灵大师', required: 300 },
      '图灵大师': { next: '超级鉴别者', required: 500 }
    };
    
    const currentLevel = this.data.level;
    if (levels[currentLevel]) {
      const nextLevel = levels[currentLevel].next;
      const requiredPoints = levels[currentLevel].required;
      const pointsToNextLevel = requiredPoints - this.data.points;
      const progress = (this.data.points / requiredPoints) * 100;
      
      this.setData({
        nextLevel,
        pointsToNextLevel,
        levelProgress: progress
      });
    }
  },
  
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },
  
  openSettings() {
    wx.showToast({
      title: '设置功能即将上线',
      icon: 'none'
    });
  }
}) 