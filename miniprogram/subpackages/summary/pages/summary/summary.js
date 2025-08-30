const app = getApp()
const { createPage } = require('../../../../utils/basePage')
const { t } = require('../../../../utils/i18n')

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
    levelProgress: 'levelProgress',
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
    closeLabel: 'close',
    // 新增：金币相关
    coinsLabel: 'coinsLabel',
    coinsUnit: 'coinsUnit'
  },

  data: {
    currentLang: wx.getStorageSync('language') || 'zh',
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
    progressText: '',
    hasLevelUp: true,
    
    // 新增：金币相关
    coinsGained: 0,
    
    // 新增：机器人图标路径
    robotIconSrc: '',
    
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
    achievementType: '',              // 成就类型：'firstTry' | 'perfectJudge'
    achievementIcon: '',              // 成就图标路径
    achievementName: '',              // 成就名称
    newAchievements: [],              // 收集本次获得的所有成就
    currentAchievementIndex: 0,       // 当前显示的成就索引
    achievementDescription: '',        // 成就描述文本
    performanceText: '',
  },
  
  async onLoad(options) {
    // currentLang 已在 data 初始化
    // 确保已登录并拿到 openid，避免同步数据失败
    if (!app.globalData.openid) {
      try {
        wx.showLoading({ title: '加载中', mask: true });
        await app.getUserInfo();
      } catch (e) {
        console.warn('获取 openid 失败，稍后重试同步', e);
      } finally {
        wx.hideLoading();
      }
    }

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
    let totalCount = 5;
    let correctCount = gameData.correctCount || 0;

    // 若存在本轮对话记录，则以记录为准计算
    if (Array.isArray(gameData.dialogues) && gameData.dialogues.length > 0) {
      totalCount = gameData.dialogues.length;
      correctCount = gameData.dialogues.filter(d => d.isCorrect).length;
    }

    const correctRate = `${correctCount}/${totalCount}`;
    const language = wx.getStorageSync('language') || 'zh';
    const correctRatePercent = Math.round((correctCount / totalCount) * 100);

    let performanceKey;
    if (correctRatePercent >= 90) performanceKey = 'summary.performanceExcellent';
    else if (correctRatePercent >= 70) performanceKey = 'summary.performanceGood';
    else if (correctRatePercent >= 50) performanceKey = 'summary.performanceAverage';
    else performanceKey = 'summary.performancePoor';
    const performanceText = t(performanceKey, language);

    // 根据表现设置对应的机器人图标
    let robotIconSrc;
    if (correctRatePercent >= 90) {
      robotIconSrc = '/subpackages/summary/assets/figma/robot_excellent.png';
    } else if (correctRatePercent >= 70) {
      robotIconSrc = '/subpackages/summary/assets/figma/robot_good.png';
    } else if (correctRatePercent >= 50) {
      robotIconSrc = '/subpackages/summary/assets/figma/robot_average.png';
    } else {
      robotIconSrc = '/subpackages/summary/assets/figma/robot_poor.png';
    }

    /* ------ 更新累计正确率 totalCorrectRate ------ */
    const prevChallenges = gameData.completedChallenges || 0; // 本轮之前的完成次数
    const prevTotalRate = gameData.totalCorrectRate || 0;     // 已保存的累计平均
    const newTotalRate = Math.round(((prevTotalRate * prevChallenges) + correctRatePercent) / (prevChallenges + 1));
    gameData.totalCorrectRate = newTotalRate;
    
    // 生成分析结果
    this.generateAnalysisResult(correctRatePercent, gameData.dialogues || []);
    
    // 计算本次挑战获得的点数：直接使用conversation页面记录的得分变化
    let pointsGained = gameData.roundPointsChange || 0;
    
    // 确保得分不为负数
    if (pointsGained < 0) {
      pointsGained = 0;
    }
    
    // 新增：计算金币获得数量（按答对数*2）
    let coinsGained = 0;
    if (Array.isArray(gameData.dialogues) && gameData.dialogues.length > 0) {
      const correctCount = gameData.dialogues.filter(d => d.isCorrect).length;
      coinsGained = correctCount * 2;
    }
    
    // 更新用户金币数，确保只更新gameData.coins
    if (app.globalData && app.globalData.gameData) {
      const currentCoins = app.globalData.gameData.coins || 0;
      app.globalData.gameData.coins = currentCoins + coinsGained;
      console.log('更新用户金币数:', currentCoins, '+', coinsGained, '=', app.globalData.gameData.coins);
    }
    
    // 重要：更新全局总分 = 基础分 + 本轮得分
    if (typeof gameData.basePoints === 'number' && typeof pointsGained === 'number') {
      gameData.points = gameData.basePoints + pointsGained;
      console.log('更新全局总分:', gameData.basePoints, '+', pointsGained, '=', gameData.points);
    }
    
    // 新增：计算正确率百分比，并保存至游戏数据
    gameData.correctRate = correctRatePercent;

    // 计算本轮最大连击数（仅限本轮）
    let roundMaxCombo = 0;
    if (Array.isArray(gameData.dialogues) && gameData.dialogues.length > 0) {
      let currentCombo = 0;
      gameData.dialogues.forEach(d => {
        if (d.isCorrect) {
          currentCombo++;
          if (currentCombo > roundMaxCombo) {
            roundMaxCombo = currentCombo;
          }
        } else {
          currentCombo = 0;
        }
      });
    }

    /** -------------- 挑战完成，更新 heardDialogues -------------- */
    // 确保 heardDialogues 为数组
    if (!Array.isArray(gameData.heardDialogues)) {
      gameData.heardDialogues = [];
    }

    // 本轮对话数组
    const currentRoundDialogues = Array.isArray(gameData.dialogues) ? gameData.dialogues : [];

    // 统计每道题的答题情况
    this.updateDialogueStats(currentRoundDialogues);

    // 将本轮 5 个对话的 name 添加到 heardDialogues
    currentRoundDialogues.forEach(d => {
      if (d && d.name && !gameData.heardDialogues.includes(d.name)) {
        gameData.heardDialogues.push(d.name);
      }
    });

    // 判断剩余可用对话数量，若不足 10 则清空 heardDialogues
    const totalDialoguesCount = app.globalData && app.globalData.totalDialoguesCount ? app.globalData.totalDialoguesCount : 0;
    if (totalDialoguesCount && (totalDialoguesCount - gameData.heardDialogues.length) < 5) {
      console.warn('剩余可用对话不足 5，已重置 heardDialogues');
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
    
    // 重要：保持跨轮次连击数，不清零
    // 连击数在 conversation 页面已经正确维护，这里不需要重置
    console.log('挑战完成，保持连击数:', gameData.currentCombo);
    
    // 获取最大连击数（跨轮次连击）
    const maxCombo = gameData.maxCombo || 0;
    
    // 根据正确率映射超过的用户百分比（固定映射，确保结果可重复）
    const percentileMap = [0, 10, 20, 30, 45, 55, 65, 75, 85, 95, 99];
    // 取 correctRatePercent 所在 10 分区间作为索引
    const percentileIndex = Math.min(Math.floor(correctRatePercent / 10), percentileMap.length - 1);
    const percentile = percentileMap[percentileIndex];
 
    /** -------- 若发现 pointsGained 异常（如为 0 且有对话记录），且没有roundPointsChange，则根据对话记录重新计算 -------- */
    if (pointsGained === 0 && currentRoundDialogues.length > 0 && !gameData.roundPointsChange) {
      // 重新计算得分
      let calcPoints = 0;
      let combo = gameData.currentCombo || 0; // 使用跨轮次连击数
      currentRoundDialogues.forEach(d => {
        if (d.isCorrect) {
          combo++;
          // 使用新的统一连击得分逻辑
          let pointsToAdd = 1;
          if (combo >= 3) {
            // 从第三连击开始，每两次递增1分
            // 第3连击：+2，第4连击：+2，第5连击：+3，第6连击：+3...
            const extraPoints = Math.floor((combo - 1) / 2);
            pointsToAdd += extraPoints;
          }
          calcPoints += pointsToAdd;
        } else {
          combo = 0; // 答错重置连击
          calcPoints = Math.max(0, calcPoints - 1);
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
    const hasComboMaster = (gameData.maxCombo || 0) >= 10;
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
        icon: '/assets/images/component/first_try.svg',
        name: t('profile.achievements.firstTry.title', language),
        description: t('profile.achievements.firstTry.description', language)
      });
      // 标记成就已解锁
      gameData.achievements.firstTry = true;
    }
    // --------- Combo Master 成就 ---------
    if (hasComboMaster && !gameData.achievements.comboMaster) {
      newAchievements.push({
        type: 'comboMaster',
        icon: '/assets/images/component/combo.svg',
        name: t('profile.achievements.comboMaster.title', language),
        description: t('profile.achievements.comboMaster.description', language)
      });
      gameData.achievements.comboMaster = true;
    }

    // --------- Perfect 判断成就 ---------
    if (hasPerfectScore && !gameData.achievements.perfectJudge) {
      newAchievements.push({
        type: 'perfectJudge',
        icon: '/assets/images/component/perfect.svg',
        name: t('profile.achievements.perfectJudge.title', language),
        description: t('profile.achievements.perfectJudge.description', language)
      });
      // 标记成就已解锁
      gameData.achievements.perfectJudge = true;
    }

    // --------- Flawless Streak 成就（全局连击>=15） ---------
    const hasFlawless = (gameData.maxCombo || 0) >= 15;

    if (hasFlawless && !gameData.achievements.flawlessStreak) {
      newAchievements.push({
        type: 'flawlessStreak',
        icon: '/assets/images/component/flawless.svg',
        name: t('profile.achievements.flawlessStreak.title', language),
        description: t('profile.achievements.flawlessStreak.description', language)
      });
      gameData.achievements.flawlessStreak = true;
    }

    // 如果有新获得的成就，延时 800ms 后显示第一个成就弹窗
    if (newAchievements.length > 0) {
      // 先保存成就列表
      this.setData({
        newAchievements,
        currentAchievementIndex: 0
      });

      setTimeout(() => {
        const first = newAchievements[0];
        this.setData({
          showAchievementModal: true,
          achievementType: first.type,
          achievementIcon: first.icon,
          achievementName: first.name,
          achievementDescription: first.description
      });
      }, 800);
    }
    
    this.setData({
      performanceText,
      correctRate,
      pointsGained,
      maxCombo: roundMaxCombo, // 使用本轮最大连击数
      percentile,
      correctRatePercent,
      dialoguesSnapshot: currentRoundDialogues,
      coinsGained, // 新增：设置金币获得数量
      robotIconSrc // 新增：设置机器人图标
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
    
    // 获取进度文本模板并替换变量
    const progressTemplate = t('gameHome.levelProgress', language);
    let progressText = progressTemplate
      .replace('{nextLevel}', nextLevel)
      .replace('{points}', pointsToNextLevel);
    
    // 最高等级（superIdentifier）时不显示进度文本
    if (levelKey === 'superIdentifier') {
      progressText = '';
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
      progressText, // 添加进度文本
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
    // 直接返回首页，避免 quick-intro 闪屏
    wx.disableAlertBeforeUnload();
    wx.switchTab({ url: '/pages/game-home/game-home' });
  },
  
  shareResults() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const inviter = app.globalData.openid || '';
    const shareOptions = {
      title: `别笑，你试你也分不清人类和AI！`,
      path: `/pages/welcome/welcome?inviter=${inviter}`,
      imageUrl: '/assets/figma/share2.png'
    };

    // 微信要求必须由用户触发才能分享，image 点击已满足条件
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    if (wx.shareAppMessage) {
      wx.shareAppMessage(shareOptions);
    }
  },
  
  playAgain() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    // 显示加载提示
    const lang = wx.getStorageSync('language') || 'zh';
    wx.showLoading({ title: lang==='en' ? 'Loading...' : '加载中...', mask: true });
    // 重置游戏数据
    if (app.globalData) {
      if (!app.globalData.gameData) {
        app.globalData.gameData = {};
      }
      // 重置当前对话ID为1
      app.globalData.gameData.currentDialogue = 1;
      // 保留点数、等级和跨轮次连击数，但重置其他状态
      app.globalData.gameData.correctCount = 0;
      app.globalData.gameData.wrongCount = 0;
      // 保持跨轮次连击数，不清零
      // app.globalData.gameData.currentCombo = 0; // 注释掉，保持连击
      app.globalData.gameData.dialogues = [];
      
      // 重要：确保连击数状态正确
      console.log('重新开始挑战，保持连击数:', app.globalData.gameData.currentCombo);
      // 更新 basePoints 为重新开始前的点数
      app.globalData.gameData.basePoints = app.globalData.gameData.points || 0;
      // 清空缓存的对话，确保下次重新抽取
      app.globalData.gameDialogues = [];
    }
    // 跳转到对话页面，从第一个对话开始
    wx.redirectTo({
      url: '/subpackages/conversation/pages/conversation/conversation?dialogueId=1'
    });
  },
  
  onShareAppMessage() {
    const inviter = app.globalData.openid || '';
    return {
      title: `别笑，你试你也分不清人类和AI！`,
      path: `/pages/welcome/welcome?inviter=${inviter}`,
      imageUrl: '/assets/figma/share2.png'
    };
  },

  onShareTimeline() {
    const inviter = app.globalData.openid || '';
    return {
      title: '别笑，你试你也分不清人类和AI！',
      query: `inviter=${inviter}`,
      imageUrl: '/assets/figma/share2.png'
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
  
  /** 统计每道题的答题情况（只记录 name / total / correct） */
  updateDialogueStats(dialogues) {
    if (!Array.isArray(dialogues) || dialogues.length === 0) return;
    if (!wx.cloud) { console.error('未初始化云环境'); return; }

    const db = wx.cloud.database();
    const _  = db.command;

    dialogues.forEach(d => {
      if (!d || !d.name) return;
      const name = d.name;

      db.collection('dialogueStats')
        .where({ name })
        .update({
          data: {
            total:   _.inc(1),
            correct: _.inc(d.isCorrect ? 1 : 0),
            updateTime: db.serverDate()
          }
        })
        .then(res => {
          // 若不存在则新增一条（total / correct 从 0 开始）
          if (res.stats.updated === 0) {
            db.collection('dialogueStats').add({
              data: {
                name,
                total: 1,
                correct: d.isCorrect ? 1 : 0,
                createTime: db.serverDate(),
                updateTime: db.serverDate()
              }
            }).catch(console.error);
          }
        })
        .catch(console.error);
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
        const next = this.data.newAchievements[nextIndex];
        this.setData({
          showAchievementModal: true,
          currentAchievementIndex: nextIndex,
          achievementType: next.type,
          achievementIcon: next.icon,
          achievementName: next.name,
          achievementDescription: next.description
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