const app = getApp()
const { createPage } = require('../../utils/basePage')
const { t } = require('../../utils/i18n')

createPage({
  pageKey: 'summary',
  i18nKeys: {
    navTitle: 'navTitle',
    greatPerformance: 'greatPerformance',
    resultPrefix: 'resultPrefix',
    accuracySuffix: 'accuracySuffix',
    statPoints: 'statPoints',
    statCombo: 'statCombo',
    statPercentile: 'statPercentile',
    yourLevel: 'yourLevel',
    pointsUnit: 'pointsUnit',
    distanceTo: 'distanceTo',
    needPointsSuffix: 'needPointsSuffix',
    levelUpNotice1: 'levelUpNotice1',
    levelUpNotice2: 'levelUpNotice2',
    analysisTitle: 'analysisTitle',
    skillExcellent: 'skillExcellent',
    skillGood: 'skillGood',
    skillAverage: 'skillAverage',
    skillWeak: 'skillWeak',
    shareButton: 'shareButton',
    playAgain: 'playAgain',
    achievementUnlocked: 'achievementUnlocked',
    shareShort: 'shareShort'
  },

  data: {
    correctRate: '0/0',
    pointsGained: 0,
    maxCombo: 0,
    percentile: 0,
    correctRatePercent: 0,
    dialoguesSnapshot: [],
    
    level: '业余探索者',
    levelClass: 'blue',
    totalPoints: 0,
    nextLevel: '资深鉴别师',
    pointsToNextLevel: 0,
    levelProgress: 0,
    hasLevelUp: true,
    
    // 分析结果相关
    analysisResult: '',
    skillLevels: {
      excellent: [],
      good: [],
      average: [],
      weak: []
    },
    
    // 技能分析
    skills: {
      good: ['识别通用回答', '发现逻辑矛盾'],
      average: ['情感表达判断'],
      weak: ['专业知识辨别']
    },
    // --- 成就弹窗相关 ---
    showAchievementModal: false,      // 是否展示成就弹窗
    achievementDate: '',              // 成就获得日期，格式: YYYY.M.D
    achievementType: '',              // 成就类型：'firstTry' | 'comboMaster' | 'perfectJudge'
    achievementIcon: '',              // 成就图标路径
    achievementName: '',              // 成就名称
    achievementColor: '',              // 成就标题颜色
    newAchievements: [],              // 收集本次获得的所有成就
    currentAchievementIndex: 0        // 当前显示的成就索引
  },
  
  onLoad(options) {
    // Summary 页面无需返回提示，直接退出
    
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
    let totalCount = 10;
    let correctCount = gameData.correctCount || 0;

    // 若存在本轮对话记录，则以记录为准计算
    if (Array.isArray(gameData.dialogues) && gameData.dialogues.length > 0) {
      totalCount = gameData.dialogues.length;
      correctCount = gameData.dialogues.filter(d => d.isCorrect).length;
    }

    const correctRate = `${correctCount}/${totalCount}`;
    const language = wx.getStorageSync('language') || 'zh';
    const correctRatePercent = Math.round((correctCount / totalCount) * 100);
    
    // 生成分析结果
    this.generateAnalysisResult(correctRatePercent, gameData.dialogues || []);
    
    // 计算本次挑战获得的点数（总分 - 挑战开始前的基础分）
    let pointsGained = (gameData.points || 0) - (gameData.basePoints || 0);
    // 挑战最低得分为 0，如出现负数则归零，并恢复原始点数
    if (pointsGained < 0) {
      pointsGained = 0;
      gameData.points = gameData.basePoints || 0;
    }
    
    // 新增：计算正确率百分比，并保存至游戏数据
    gameData.correctRate = correctRatePercent;

    /** -------------- 挑战完成，更新 heardDialogues -------------- */
    // 确保 heardDialogues 为数组
    if (!Array.isArray(gameData.heardDialogues)) {
      gameData.heardDialogues = [];
    }

    // 将本轮 10 个对话的 conversationId 添加到 heardDialogues
    const currentRoundDialogues = Array.isArray(gameData.dialogues) ? gameData.dialogues : [];
    currentRoundDialogues.forEach(d => {
      if (d && d.conversationId && !gameData.heardDialogues.includes(d.conversationId)) {
        gameData.heardDialogues.push(d.conversationId);
      }
    });

    // 判断剩余可用对话数量，若不足 10 则清空 heardDialogues
    const totalDialoguesCount = app.globalData && app.globalData.totalDialoguesCount ? app.globalData.totalDialoguesCount : 0;
    if (totalDialoguesCount && (totalDialoguesCount - gameData.heardDialogues.length) < 10) {
      console.warn('剩余可用对话不足 10，已重置 heardDialogues');
      gameData.heardDialogues = [];
    }

    // 记录本次挑战到历史记录（仅保存 挑战编号、正确率、得分）
    if (!gameData.history) {
      gameData.history = [];
    }
    const challengeId = (gameData.completedChallenges || 0) + 1;
    gameData.history.unshift({
      id: challengeId,
      correctRate: correctRatePercent,
      pointsGained: pointsGained,
      dialogues: currentRoundDialogues.slice() // 深拷贝本轮对话详情
    });
    
    // 清空本轮对话记录，为下一轮做准备
    gameData.dialogues = [];
    
    // 获取最大连击数
    const maxCombo = gameData.maxCombo || 3;
    
    // 根据正确率映射超过的用户百分比（固定映射，确保结果可重复）
    const percentileMap = [0, 10, 20, 30, 45, 55, 65, 75, 85, 95, 99];
    // 取 correctRatePercent 所在 10 分区间作为索引
    const percentileIndex = Math.min(Math.floor(correctRatePercent / 10), percentileMap.length - 1);
    const percentile = percentileMap[percentileIndex];
 
    /** -------- 若发现 pointsGained 异常（如为 0 且有对话记录），则根据对话记录重新计算 -------- */
    if (pointsGained === 0 && currentRoundDialogues.length > 0) {
      let calcPoints = 0;
      let combo = 0;
      currentRoundDialogues.forEach(d => {
        if (d.isCorrect) {
          combo++;
          calcPoints += (combo >= 3 ? 3 : 1);
        } else {
          combo = 0;
          calcPoints = Math.max(0, calcPoints - 2);
        }
      });
      pointsGained = calcPoints;
      gameData.points = (gameData.basePoints || 0) + calcPoints;

      // --- 修复历史记录中 pointsGained 始终为 0 的问题 ---
      if (gameData.history && gameData.history.length > 0) {
        gameData.history[0].pointsGained = pointsGained;
      }
    }
    
    // 更新等级信息（使用总分而不是本次获得的分数）
    this.updateLevelInfo(gameData.points || 0, gameData.basePoints || 0);
    
    /**  -------- 成就达成检测 -------- */
    const isFirstChallenge = (gameData.completedChallenges || 0) === 0;
    const hasReachedFiveCombo = (gameData.maxCombo || 0) >= 5;
    const hasPerfectScore = correctCount === totalCount;

    // 确保成就字段存在
    if (!gameData.achievements) {
      gameData.achievements = {};
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
    // 收集本次获得的所有成就
    const newAchievements = [];

    // 若是首次完成挑战，且尚未记录成就，则触发弹窗
    if (isFirstChallenge && !gameData.achievements.firstTry) {
      newAchievements.push({
        type: 'firstTry',
        icon: '/assets/images/summary/first_try.svg',
        name: t('profile.achievements.firstTry.title', language),
        color: '#a6ccf7'
      });
      // 标记成就已解锁
      gameData.achievements.firstTry = true;
    }
    // 若达到5连击，且尚未记录成就，则触发弹窗
    if (hasReachedFiveCombo && !gameData.achievements.comboMaster) {
      newAchievements.push({
        type: 'comboMaster',
        icon: '/assets/images/summary/five.svg',
        name: t('profile.achievements.comboMaster.title', language),
        color: '#E4C196'
      });
      // 标记成就已解锁
      gameData.achievements.comboMaster = true;
    }
    // 若完美判断，且尚未记录成就，则触发弹窗
    if (hasPerfectScore && !gameData.achievements.perfectJudge) {
      newAchievements.push({
        type: 'perfectJudge',
        icon: '/assets/images/summary/perfect.svg',
        name: t('profile.achievements.perfectJudge.title', language),
        color: '#FFEBC3'
      });
      // 标记成就已解锁
      gameData.achievements.perfectJudge = true;
    }

    // 如果有新获得的成就，显示成就弹窗
    if (newAchievements.length > 0) {
      this.setData({
        showAchievementModal: true,
        achievementDate: dateStr,
        newAchievements: newAchievements,
        currentAchievementIndex: 0,
        achievementType: newAchievements[0].type,
        achievementIcon: newAchievements[0].icon,
        achievementName: newAchievements[0].name,
        achievementColor: newAchievements[0].color
      });
    }
    
    this.setData({
      correctRate,
      pointsGained,
      maxCombo,
      percentile,
      correctRatePercent,
      dialoguesSnapshot: currentRoundDialogues
    });
    
    // 更新游戏数据中的完成挑战次数
    if (app.globalData && app.globalData.gameData) {
      app.globalData.gameData.completedChallenges = (app.globalData.gameData.completedChallenges || 0) + 1;
      
      // 同步最终结果到云数据库
      this.syncGameDataToCloud();
    }
  },
  
  onUnload() {
    // 页面卸载时禁用返回提示
    wx.disableAlertBeforeUnload();
  },
  
  // 根据分数更新等级信息，并判断是否刚刚升级
  // @param {Number} points         当前最新总分
  // @param {Number} previousPoints 上一次挑战前的总分（可选）
  updateLevelInfo(points, previousPoints = undefined) {
    const language = wx.getStorageSync('language') || 'zh';

    // 根据点数计算等级
    let levelKey = 'newUser';
    let nextLevelKey = 'amateurExplorer';
    let requiredPoints = 100;
    let hasLevelUp = false;
    
    if (points >= 500) {
      levelKey = 'superIdentifier';
      nextLevelKey = 'superIdentifier';
      requiredPoints = 500;
    } else if (points >= 300) {
      levelKey = 'turingMaster';
      nextLevelKey = 'superIdentifier';
      requiredPoints = 500;
    } else if (points >= 200) {
      levelKey = 'seniorIdentifier';
      nextLevelKey = 'turingMaster';
      requiredPoints = 300;
    } else if (points >= 100) {
      levelKey = 'amateurExplorer';
      nextLevelKey = 'seniorIdentifier';
      requiredPoints = 200;
    }
    
    // 翻译等级文本
    const level = t(`gameHome.${levelKey}`, language);
    const nextLevel = t(`gameHome.${nextLevelKey}`, language);
    
    // ---------- 升级检测逻辑 ----------
    // 1. 若显式提供 previousPoints，则根据其计算旧等级；
    // 2. 否则继续兼容旧逻辑，从全局 gameData.level 读取上次等级文本。

    let previousLevelKey;
    if (typeof previousPoints === 'number') {
      // 通过分数区间反推上一次等级 key
      if (previousPoints >= 500) {
        previousLevelKey = 'superIdentifier';
      } else if (previousPoints >= 300) {
        previousLevelKey = 'turingMaster';
      } else if (previousPoints >= 200) {
        previousLevelKey = 'seniorIdentifier';
      } else if (previousPoints >= 100) {
        previousLevelKey = 'amateurExplorer';
      } else {
        previousLevelKey = 'newUser';
      }
    }

    // 若未传入 previousPoints，则退回到比较翻译文本的方法（保持兼容）
    if (!previousLevelKey) {
      let previousLevelText = level;
      if (app.globalData && app.globalData.gameData && app.globalData.gameData.level) {
        previousLevelText = app.globalData.gameData.level;
      }
      if (previousLevelText !== level) {
        hasLevelUp = true;
      }
    } else if (previousLevelKey !== levelKey) {
      hasLevelUp = true;
    }

    if (hasLevelUp) {
       
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
    // 进度条仅显示当前等级内的 0-100 点区间
    let levelProgress;
    if (points >= 500) {
      levelProgress = 100; // 最高等级满格
    } else {
      levelProgress = points % 100; // 0-99
    }
    
    // 根据等级键映射徽章颜色类
    let badgeClass = 'green';
    if (levelKey === 'amateurExplorer') {
      badgeClass = 'blue';
    } else if (levelKey === 'seniorIdentifier') {
      badgeClass = 'purple';
    } else if (levelKey === 'turingMaster') {
      badgeClass = 'orange';
    } else if (levelKey === 'superIdentifier') {
      badgeClass = 'platinum';
    }
    
    this.setData({
      level,
      totalPoints: points,
      nextLevel,
      pointsToNextLevel,
      levelProgress,
      hasLevelUp,
      levelClass: badgeClass
    });
    
    // 更新全局游戏数据
    if (app.globalData) {
      if (!app.globalData.gameData) {
        app.globalData.gameData = {};
      }
      app.globalData.gameData.points = points;
    }
  },

  // 语言切换后刷新动态文本
  refreshLanguageDependentData(language) {
    // 使用最新语言重新计算等级文本
    this.updateLevelInfo(this.data.totalPoints || 0, this.data.totalPoints || 0);

    // 重新生成分析结果与技能文本
    this.generateAnalysisResult(this.data.correctRatePercent || 0, this.data.dialoguesSnapshot || []);
  },
  
  goBack() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    // 触发系统返回行为，会自动调用返回确认
    wx.navigateBack({
      delta: 1
    });
  },
  
  shareResults() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
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
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
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
      // 更新 basePoints 为重新开始前的点数
      app.globalData.gameData.basePoints = app.globalData.gameData.points || 0;
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
    if (!app.globalData || !app.globalData.openid) {
      console.log('用户未登录，尝试重新获取用户信息');
      
      // 尝试重新获取用户信息
      app.getUserInfo().then(() => {
        // 重新获取成功后再次尝试同步
        if (app.globalData.openid) {
          return this.syncGameDataToCloud();
        } else {
          return Promise.reject('无法获取用户信息');
        }
      }).catch(err => {
        console.error('获取用户信息失败', err);
      });
      return;
    }
    
    const db = wx.cloud.database();
    const openid = app.globalData.openid;
    
    // 先查询用户是否存在
    return db.collection('users')
      .where({
        _openid: openid
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          // 用户存在，更新数据
          return db.collection('users')
            .where({
              _openid: openid
            })
            .update({
              data: {
                gameData: app.globalData.gameData,
                achievements: app.globalData.gameData.achievements || {},
                updateTime: db.serverDate()
              }
            });
        } else {
          // 用户不存在，创建新用户数据
          return db.collection('users')
            .add({
              data: {
                _openid: openid,
                nickname: app.globalData.userInfo ? app.globalData.userInfo.nickName : '图灵测试者',
                achievements: app.globalData.gameData.achievements || {},
                gameData: app.globalData.gameData,
                createTime: db.serverDate(),
                updateTime: db.serverDate()
              }
            });
        }
      })
      .then(() => {
        console.log('游戏数据同步成功');
      })
      .catch(err => {
        console.error('游戏数据同步失败', err);
        // 显示错误提示
        wx.showToast({
          title: '数据保存失败，请重试',
          icon: 'none'
        });
      });
  },
  
  /** 关闭成就弹窗 */
  closeAchievement() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const nextIndex = this.data.currentAchievementIndex + 1;
    if (nextIndex < this.data.newAchievements.length) {
      // 先隐藏当前成就
      this.setData({
        showAchievementModal: false
      });

      // 延迟500ms后显示下一个成就
      setTimeout(() => {
        this.setData({
          showAchievementModal: true,
          currentAchievementIndex: nextIndex,
          achievementType: this.data.newAchievements[nextIndex].type,
          achievementIcon: this.data.newAchievements[nextIndex].icon,
          achievementName: this.data.newAchievements[nextIndex].name,
          achievementColor: this.data.newAchievements[nextIndex].color
        });
      }, 500);
    } else {
      // 所有成就都显示完毕，关闭弹窗
      this.setData({ 
        showAchievementModal: false,
        newAchievements: [],
        currentAchievementIndex: 0
      });
    }
  },
  
  /** 分享成就 */
  shareAchievement() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    // 直接复用现有分享逻辑
    this.shareResults();
  },
  
  // 生成分析结果
  generateAnalysisResult(correctRatePercent, dialogues) {
    const language = wx.getStorageSync('language') || 'zh';
    let analysisResult = '';
    const skillLevels = {
      excellent: [],
      good: [],
      average: [],
      weak: []
    };
    
    // 分析对话记录中的表现
    if (dialogues.length > 0) {
      // 统计各类型题目的正确率
      const typeStats = {
        common: { total: 0, correct: 0 },    // 通用回答识别
        logic: { total: 0, correct: 0 },     // 逻辑矛盾
        emotion: { total: 0, correct: 0 },   // 情感表达
        professional: { total: 0, correct: 0 }// 专业知识
      };
      
      dialogues.forEach(d => {
        if (d.type) {
          typeStats[d.type].total++;
          if (d.isCorrect) {
            typeStats[d.type].correct++;
          }
        }
      });
      
      // 计算各类型的正确率并分配等级
      Object.entries(typeStats).forEach(([type, stats]) => {
        if (stats.total > 0) {
          const rate = (stats.correct / stats.total) * 100;
          const skillName = this.getSkillNameByType(type);
          
          if (rate >= 90) {
            skillLevels.excellent.push(skillName);
          } else if (rate >= 70) {
            skillLevels.good.push(skillName);
          } else if (rate >= 50) {
            skillLevels.average.push(skillName);
          } else {
            skillLevels.weak.push(skillName);
          }
        }
      });
    }
    
    // 根据总体正确率生成分析结果
    if (language === 'en') {
      if (correctRatePercent >= 90) {
        analysisResult = 'You demonstrated excellent AI-detection skills! You can easily catch subtle features in AI responses, especially their logical inconsistencies and unnatural expressions. Keep up your sharp observation — you\'re already an outstanding AI judge.';
      } else if (correctRatePercent >= 70) {
        analysisResult = 'You showed good sensitivity in spotting AI, especially noticing the lack of personal details in AI answers. Keep improving your observation; next time, pay attention to subtle emotional differences.';
      } else if (correctRatePercent >= 50) {
        analysisResult = 'You have a basic understanding of AI traits but need more practice to improve accuracy. Try focusing on logical coherence and natural emotional expressions in answers.';
      } else {
        analysisResult = 'This round was tough, but it\'s a good opportunity to learn. Start with fundamental traits such as specificity and personalization, and gradually build up your AI-detection skills.';
      }
    } else {
    if (correctRatePercent >= 90) {
      analysisResult = '你展现出了极强的AI识别能力！你能敏锐地捕捉到AI回答中的细微特征，尤其擅长发现逻辑矛盾和非自然的表达方式。继续保持这种敏锐的观察力，你已经是一位出色的AI鉴别专家了。';
    } else if (correctRatePercent >= 70) {
      analysisResult = '你在识别AI方面展现出了不错的敏锐度，尤其擅长发现AI回答中缺乏个人化细节的特征。继续提高你的观察力，下次可以尝试注意AI在情感表达上的微妙差异。';
    } else if (correctRatePercent >= 50) {
      analysisResult = '你对AI的基本特征有了初步的认识，但还需要更多练习来提高判断的准确性。建议多关注AI回答中的逻辑连贯性和情感表达的自然度，这些往往是重要的判断依据。';
    } else {
      analysisResult = '这次的挑战对你来说可能有些困难，但这正是学习和提高的好机会。建议从基础特征开始，比如关注回答的具体程度和个性化程度，慢慢培养对AI特征的识别能力。';
      }
    }
    
    this.setData({
      analysisResult,
      skillLevels
    });
  },
  
  // 获取技能名称
  getSkillNameByType(type) {
    const language = wx.getStorageSync('language') || 'zh';
    const mapZh = {
      common: '识别通用回答',
      logic: '发现逻辑矛盾',
      emotion: '情感表达判断',
      professional: '专业知识辨别'
    };
    const mapEn = {
      common: 'Generic response detection',
      logic: 'Detecting logical inconsistency',
      emotion: 'Judging emotional expression',
      professional: 'Expertise verification'
    };
    return (language === 'en' ? mapEn : mapZh)[type] || type;
  }
}) 