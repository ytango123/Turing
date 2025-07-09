const app = getApp()
const { createPage } = require('../../utils/basePage')
const { t } = require('../../utils/i18n')

createPage({
  pageKey: 'result',
  i18nKeys: {
    navTitle: 'navTitle',
    correct: 'correct',
    wrong: 'wrong',
    correctDesc1: 'correctDesc1',
    wrongDesc1: 'wrongDesc1',
    pointsUnit: 'pointsUnit',
    rewardSuffix: 'rewardSuffix',
    expand: 'expand',
    collapse: 'collapse',
    aiAnalysis: 'aiAnalysis',
    nextButton: 'nextButton',
    combo: 'combo'
  },

  data: {
    currentDialogue: 1,
    totalDialogues: 10,
    comboCount: 2,
    isCorrect: true,
    pointsGained: 2,
    pointsLost: 2,
    aiRole: 'B', // 'A', 'B', or 'none'
    showComboNotification: false, // 控制连击提示的显示
    
    // 当前对话内容
    messages: [],
    displayMessages: [],
    isExpanded: false,
    maxLines: 3,
    
    // AI特征解析
    aiFeatures: [],
    },
  
  onLoad(options) {
    console.log('结果页面加载，参数:', options);
    
    // 启用页面返回提示 (多语言)
    const language = wx.getStorageSync('language') || 'zh';
    wx.enableAlertBeforeUnload({
      message: t('conversation.exitConfirm', language)
    });
    
    // 确保全局状态存在
    if (!app.globalData) {
      app.globalData = {};
    }
    
    if (!app.globalData.gameData) {
      app.globalData.gameData = {
        points: 0,
        correctCount: 0,
        wrongCount: 0,
        maxCombo: 0,
        currentCombo: 0,
        dialogues: []
      };
    }
    
    // 从URL参数获取对话ID、判断结果和连击数
    const dialogueId = parseInt(options.dialogueId) || 1;
    const judgment = options.judgment || 'B';
    const isCorrect = options.isCorrect === 'true';
    const comboCount = parseInt(options.combo) || 0;
    
    // 更新全局状态中的当前对话ID
    app.globalData.gameData.currentDialogue = dialogueId;
    
    // 加载对话数据
    this.loadDialogueResult(dialogueId, judgment, isCorrect, comboCount);
    
    // 如果有连击，显示连击提示
    if (comboCount > 1 && isCorrect) {
      this.showComboNotification();
    }
    
    console.log('当前对话ID:', dialogueId);
    console.log('游戏数据:', app.globalData.gameData);
  },
  
  loadDialogueResult(dialogueId, judgment, isCorrect, comboCount) {
    let dialogue;
    if (getApp().globalData && getApp().globalData.gameDialogues) {
      dialogue = getApp().globalData.gameDialogues[dialogueId - 1];
    }
    if (!dialogue) {
      dialogue = this.data.dialoguesDB.find(d => d.id === dialogueId);
    }
    
    if (dialogue) {
      // 设置AI角色
      const answerType = dialogue.type || dialogue.answer;
      let aiRole = 'none';
      if(answerType==='HM') aiRole='B';
      else if(answerType==='MH') aiRole='A';
      
      // 设置获得/失去的点数（基础1分，连击≥3额外+2）
      const pointsGained = comboCount >= 3 ? 3 : 1;
      const pointsLost = 2;
      
      this.setData({
        currentDialogue: dialogueId,
        messages: dialogue.utterances ? this.mapUtterancesToMessages(dialogue.utterances) : dialogue.messages,
        aiRole: aiRole,
        isCorrect: isCorrect,
        pointsGained: pointsGained,
        pointsLost: pointsLost,
        comboCount: comboCount,
        aiFeatures: dialogue.aiFeatures || [],
        isExpanded: false
      });

      this.updateDisplayMessages();
    }
  },
  
  showComboNotification() {
    this.setData({
      showComboNotification: true
    });
    
    // 3秒后隐藏连击提示
    setTimeout(() => {
      this.setData({
        showComboNotification: false
      });
    }, 3000);
  },
  
  goBack(e) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
          // 退出挑战时恢复到挑战开始前的点数
          if (app.globalData && app.globalData.gameData && typeof app.globalData.gameData.basePoints === 'number') {
            app.globalData.gameData.points = app.globalData.gameData.basePoints;
          }
    // 触发系统返回行为，会自动调用返回确认
    wx.navigateBack({
      delta: 1
    });
  },
  
  
  nextDialogue() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    // 计算下一个对话的ID
    const nextDialogueId = this.data.currentDialogue + 1;
    
    // 确保全局游戏数据存在
    if (!app.globalData) {
      app.globalData = {};
    }
    if (!app.globalData.gameData) {
      app.globalData.gameData = {
        points: 0,
        correctCount: 0,
        wrongCount: 0,
        maxCombo: 0,
        currentCombo: 0,
        dialogues: []
      };
    }
    
    // 如果是最后一个对话，则跳转到总结页面
    if (nextDialogueId > this.data.totalDialogues) {
      wx.redirectTo({
        url: '/pages/summary/summary'
      });
    } else {
      // 更新全局游戏数据中的当前对话ID
      app.globalData.gameData.currentDialogue = nextDialogueId;
      
      // 跳转到对话页面
      wx.redirectTo({
        url: `/pages/conversation/conversation?dialogueId=${nextDialogueId}`
      });
    }
  },

  // 更新displayMessages
  updateDisplayMessages() {
    const msgs = this.data.messages;
    const display = (this.data.isExpanded || msgs.length<=this.data.maxLines)? msgs : msgs.slice(0,this.data.maxLines);
    this.setData({ displayMessages: display });
  },

  toggleExpand() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    this.setData({ isExpanded: !this.data.isExpanded });
    this.updateDisplayMessages();
  },

  // 根据发言顺序映射角色
  mapUtterancesToMessages(utterances) {
    const speakerMap = {};
    let nextRole = 'A';
    return utterances.map(u => {
      if (!speakerMap[u.speaker]) {
        speakerMap[u.speaker] = nextRole;
        nextRole = nextRole === 'A' ? 'B' : 'A';
      }
      return {
        role: speakerMap[u.speaker],
        content: u.text
      };
    });
  }
}) 