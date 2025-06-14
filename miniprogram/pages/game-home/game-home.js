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
  
  // 更新页面数据
  updatePageData() {
    // 获取游戏数据
    const gameData = app.globalData.gameData;
    if (gameData) {
      this.setData({
        points: gameData.points || 0,
        level: gameData.level || '新手'
      });
      
      // 计算等级进度
      this.calculateLevelProgress();
    }
    
    // 如果有用户信息，更新用户名和头像
    if (app.globalData.userInfo) {
      // 这里可以根据用户信息更新用户名和头像
      // 例如：从用户年龄、性别等信息生成一个友好的用户名
      const userInfo = app.globalData.userInfo;
      let username = '图灵测试者';
      
      // 如果有性别信息，可以加入到用户名中
      
      
      this.setData({
        username: username
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