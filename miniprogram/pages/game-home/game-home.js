const app = getApp()

Page({
  data: {
    userInitial: 'T',
    username: '图灵测试者',
    level: '新手',
    points: 65,
    nextLevel: '业余探索者',
    pointsToNextLevel: 35,
    levelProgress: 65,
    
    gameModes: [
      {
        id: 'quick',
        title: '快速挑战',
        description: '10段对话，5分钟内完成',
        icon: 'flash_line',
        iconType: 'iconfont',
        color: '#6366F1',
        bgColor: '#EEF2FF',
        locked: false
      },
      {
        id: 'hard',
        title: '高难模式',
        description: '更具挑战性的对话判断',
        icon: 'lock_line',
        iconType: 'iconfont',
        color: '#7E22CE',
        bgColor: '#F3E8FF',
        locked: true
      }
    ],
    
    rankings: [
      { rank: '1', name: '王小明', points: 256 },
      { rank: '2', name: '李华', points: 198 },
      { rank: '3', name: '张三', points: 175 },
      { rank: 'you', name: '你', points: 65 }
    ]
  },
  
  onLoad() {
    // 检查是否已有用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      // 如果没有用户信息，跳转到欢迎页
      wx.reLaunch({
        url: '/pages/welcome/welcome'
      });
      return;
    }
    
    // 获取游戏数据
    const gameData = app.globalData.gameData;
    if (gameData) {
      this.setData({
        points: gameData.points,
        level: gameData.level
      });
      
      // 计算等级进度
      this.calculateLevelProgress();
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
  
  startQuickChallenge() {
    wx.navigateTo({
      url: '/pages/conversation/conversation'
    });
  },
  
  viewAllRankings() {
    wx.showToast({
      title: '排行榜功能即将上线',
      icon: 'none'
    });
  }
}) 