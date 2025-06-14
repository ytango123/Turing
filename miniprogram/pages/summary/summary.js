const app = getApp()

Page({
  data: {
    correctRate: '8/10',
    pointsGained: 16,
    maxCombo: 3,
    percentile: 85,
    
    level: '业余探索者',
    totalPoints: 81,
    nextLevel: '资深鉴别师',
    pointsToNextLevel: 19,
    levelProgress: 85,
    hasLevelUp: true,
    
    // 技能分析
    skills: {
      good: ['识别通用回答', '发现逻辑矛盾'],
      average: ['情感表达判断'],
      weak: ['专业知识辨别']
    }
  },
  
  onLoad() {
    // 获取游戏数据
    let gameData = {
      correctCount: 8,
      points: 16,
      maxCombo: 3,
      level: '新手'
    };
    
    // 确保全局游戏数据存在
    if (app.globalData && app.globalData.gameData) {
      gameData = app.globalData.gameData;
    } else {
      // 如果全局游戏数据不存在，初始化它
      app.globalData = app.globalData || {};
      app.globalData.gameData = gameData;
    }
    
    // 计算正确率
    const correctCount = gameData.correctCount || 8;
    const totalCount = 10;
    const correctRate = `${correctCount}/${totalCount}`;
    
    // 计算获得的点数
    const pointsGained = gameData.points || 16;
    
    // 获取最大连击数
    const maxCombo = gameData.maxCombo || 3;
    
    // 随机生成超过的用户百分比
    const percentile = Math.floor(Math.random() * 20) + 75; // 75-95之间
    
    // 更新等级信息
    this.updateLevelInfo(pointsGained);
    
    this.setData({
      correctRate,
      pointsGained,
      maxCombo,
      percentile
    });
    
    // 更新游戏数据中的完成挑战次数
    if (app.globalData && app.globalData.gameData) {
      app.globalData.gameData.completedChallenges = (app.globalData.gameData.completedChallenges || 0) + 1;
      
      // 同步最终结果到云数据库
      this.syncGameDataToCloud();
    }
  },
  
  updateLevelInfo(points) {
    // 根据点数计算等级
    let level = '新手';
    let nextLevel = '业余探索者';
    let requiredPoints = 100;
    let hasLevelUp = false;
    
    if (points >= 500) {
      level = '超级鉴别者';
      nextLevel = '顶级大师';
      requiredPoints = 1000;
    } else if (points >= 300) {
      level = '图灵大师';
      nextLevel = '超级鉴别者';
      requiredPoints = 500;
    } else if (points >= 200) {
      level = '资深鉴别师';
      nextLevel = '图灵大师';
      requiredPoints = 300;
    } else if (points >= 100) {
      level = '业余探索者';
      nextLevel = '资深鉴别师';
      requiredPoints = 200;
    }
    
    // 判断是否升级
    let previousLevel = '新手';
    if (app.globalData && app.globalData.gameData && app.globalData.gameData.level) {
      previousLevel = app.globalData.gameData.level;
    }
    
    if (previousLevel !== level) {
      hasLevelUp = true;
      
      // 更新全局游戏数据
      if (app.globalData) {
        if (!app.globalData.gameData) {
          app.globalData.gameData = {};
        }
        app.globalData.gameData.level = level;
      }
    }
    
    // 计算等级进度
    const pointsToNextLevel = requiredPoints - points;
    const levelProgress = (points / requiredPoints) * 100;
    
    this.setData({
      level,
      totalPoints: points,
      nextLevel,
      pointsToNextLevel,
      levelProgress,
      hasLevelUp
    });
    
    // 更新全局游戏数据
    if (app.globalData) {
      if (!app.globalData.gameData) {
        app.globalData.gameData = {};
      }
      app.globalData.gameData.points = points;
    }
  },
  
  goBack() {
    wx.switchTab({
      url: '/pages/game-home/game-home'
    });
  },
  
  shareResults() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none'
    });
  },
  
  playAgain() {
    // 重置游戏数据
    if (app.globalData) {
      if (!app.globalData.gameData) {
        app.globalData.gameData = {};
      }
      // 重置当前对话ID为1
      app.globalData.gameData.currentDialogue = 1;
      // 保留点数和等级，但重置其他状态
      app.globalData.gameData.correctCount = 0;
      app.globalData.gameData.wrongCount = 0;
      app.globalData.gameData.currentCombo = 0;
      app.globalData.gameData.dialogues = [];
    }
    
    // 跳转到对话页面，从第一个对话开始
    wx.redirectTo({
      url: '/pages/conversation/conversation?dialogueId=1'
    });
  },
  
  onShareAppMessage() {
    return {
      title: `我在图灵挑战中获得了${this.data.correctRate}的正确率，成功晋升为${this.data.level}！`,
      path: '/pages/welcome/welcome',
      imageUrl: '/assets/images/share-image.png' // 需要准备一张分享图片
    };
  },
  
  // 同步游戏数据到云数据库
  syncGameDataToCloud() {
    // 检查是否已初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    
    // 检查用户是否已登录
    if (!app.globalData || !app.globalData.openid || !app.globalData.userInfo) {
      console.log('用户未登录，跳过同步');
      return;
    }
    
    // 调用app.js中的更新方法
    app.updateUserGameData()
      .then(() => {
        console.log('最终游戏数据同步成功');
      })
      .catch(err => {
        console.error('最终游戏数据同步失败', err);
      });
  }
}) 