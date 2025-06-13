// pages/conversation/conversation.js
const app = getApp()

Page({
  data: {
    currentDialogue: 1,
    totalDialogues: 10,
    
    // 当前对话内容
    messages: [],
    
    // 当前对话的答案
    currentAnswer: '', // A, B, or none
    
    // 游戏数据
    gameData: {
      points: 0,
      correctCount: 0,
      wrongCount: 0,
      maxCombo: 0,
      dialogues: []
    },
    
    // 模拟对话数据库
    dialoguesDB: [
      {
        id: 1,
        messages: [
          { role: 'A', content: '你最近看了什么好看的电影吗？' },
          { role: 'B', content: '我上周看了《盗梦空间》的重映版，虽然是老片子了，但每次看都有新发现。你呢？' },
          { role: 'A', content: '我最近看了《沙丘》，视觉效果很震撼，故事也很吸引人，值得一看。' }
        ],
        answer: 'none', // 两个都是人类
        aiFeatures: []
      },
      {
        id: 2,
        messages: [
          { role: 'A', content: '你喜欢什么类型的音乐？' },
          { role: 'B', content: '我喜欢各种类型的音乐，包括古典音乐、流行音乐、摇滚乐和爵士乐。音乐是一种能够跨越文化和语言障碍的通用语言，能够触动人心并引发情感共鸣。' },
          { role: 'A', content: '我主要听民谣和indie，最近迷上了一个小众乐队，他们的现场超棒，上周还去看了他们的演出。' }
        ],
        answer: 'B', // B是AI
        aiFeatures: [
          '回答过于全面和完美，缺乏个人偏好的表达',
          '使用过于正式和抽象的语言描述音乐',
          '缺乏具体的音乐人或乐队名称'
        ]
      },
      {
        id: 3,
        messages: [
          { role: 'A', content: '今天天气真不错，你有什么计划吗？' },
          { role: 'B', content: '我打算去公园散步，也许再读一会书。你呢？' },
          { role: 'A', content: '我要去见朋友，我们计划一起去看电影。最近有部新上映的科幻片很受欢迎。' },
          { role: 'B', content: '听起来不错！希望你们玩得开心。什么电影？我也对科幻片很感兴趣。' }
        ],
        answer: 'B', // B是AI
        aiFeatures: [
          '回答过于通用，缺乏个人偏好和具体细节',
          '语言表达过于完美，缺乏口语中常见的停顿和重复',
          '对科幻片的兴趣表达缺乏具体的电影名称或偏好'
        ]
      },
      {
        id: 4,
        messages: [
          { role: 'A', content: '你觉得人工智能会在未来取代人类的工作吗？' },
          { role: 'B', content: '这个问题很复杂，我认为AI会改变很多行业，但不会完全取代人类。创造力、情感理解和道德判断这些方面，人类仍然具有优势。' },
          { role: 'A', content: '我认为人工智能是一种工具，最终还是由人类决定如何使用它。不过确实需要思考如何应对可能的就业变化。' }
        ],
        answer: 'none', // 两个都是人类
        aiFeatures: []
      },
      {
        id: 5,
        messages: [
          { role: 'A', content: '你最喜欢的季节是什么？为什么？' },
          { role: 'B', content: '我最喜欢秋天，因为天气凉爽，树叶变色很美，而且可以穿各种舒适的衣服。夏天太热，冬天太冷，春天虽然美但花粉过敏让人难受。你呢？' },
          { role: 'A', content: '我喜欢春天，尽管像你说的可能会有过敏问题，但看到万物复苏、花开的感觉很治愈。特别是在经历了漫长的冬天之后，那种生机勃勃的感觉让人心情愉悦。' }
        ],
        answer: 'none', // 两个都是人类
        aiFeatures: []
      },
      {
        id: 6,
        messages: [
          { role: 'A', content: '你认为社交媒体对现代人际关系的影响是正面还是负面的？' },
          { role: 'B', content: '社交媒体对人际关系既有正面也有负面影响。一方面，它帮助人们跨越地理限制保持联系，分享生活，扩大社交圈；另一方面，过度使用可能导致表面化的关系，减少面对面交流，甚至引发社交焦虑和比较心理。关键在于如何平衡使用，将其作为增强而非替代真实互动的工具。' },
          { role: 'A', content: '我同意需要平衡。我发现自己有时会陷入无意识刷社交媒体的状态，感觉很浪费时间。不过确实也通过社交平台重新联系上了一些老朋友，这点还是挺好的。' }
        ],
        answer: 'B', // B是AI
        aiFeatures: [
          '回答过于全面和系统化，像是一篇小论文',
          '语言表达过于正式和完美，缺乏口语中的随意性',
          '同时强调多个方面并给出平衡的结论，过于理性'
        ]
      },
      {
        id: 7,
        messages: [
          { role: 'A', content: '你昨天晚上吃了什么？' },
          { role: 'B', content: '昨晚我做了意大利面，用了些西红柿、蘑菇和香肠，还撒了点帕玛森奶酪。不过面煮得有点过了，下次得注意时间。你呢？' },
          { role: 'A', content: '我昨晚点了外卖，是一家新开的泰国餐厅的咖喱。说实话味道一般，感觉有点太甜了，不够辣，可能不会再点了。' }
        ],
        answer: 'none', // 两个都是人类
        aiFeatures: []
      },
      {
        id: 8,
        messages: [
          { role: 'A', content: '你有养宠物吗？' },
          { role: 'B', content: '是的，我养了一只橘猫，叫胖橘。它已经三岁了，超级粘人，每天早上都要踩我肚子叫我起床。虽然有时候很烦人，但看到它蜷在沙发上睡觉的样子又觉得很可爱。你养宠物吗？' },
          { role: 'A', content: '我养了一只狗，是只金毛，叫阳阳。它很活泼，每天都要出去散步两次。最近天气好，周末经常带它去公园玩，它特别喜欢追飞盘。' }
        ],
        answer: 'none', // 两个都是人类
        aiFeatures: []
      },
      {
        id: 9,
        messages: [
          { role: 'A', content: '你平时喜欢做什么运动？' },
          { role: 'B', content: '我喜欢多种运动形式，包括跑步、游泳、瑜伽和健身。运动不仅能保持身体健康，还能减轻压力，提高睡眠质量。我尽量每周保持3-4次不同类型的运动，以锻炼不同的肌肉群和提高心肺功能。' },
          { role: 'A', content: '我主要打篮球，一般周末和朋友约在小区的球场。平时工作太忙，只能偶尔跑跑步。上个月扭伤了脚踝，休息了两周，现在刚开始恢复训练。' }
        ],
        answer: 'B', // B是AI
        aiFeatures: [
          '回答过于全面，提及多种运动而非个人真正偏好',
          '使用过于正式的语言描述运动益处',
          '提到精确的运动频率和目的，过于系统化'
        ]
      },
      {
        id: 10,
        messages: [
          { role: 'A', content: '你最近在读什么书？' },
          { role: 'B', content: '我最近在读村上春树的《挪威的森林》，是第二次读了，感觉每次读都有不同的体会。你呢？' },
          { role: 'A', content: '我在读一本关于人工智能的书，叫《生命3.0》，作者是Max Tegmark。讨论了AI发展可能带来的各种社会和哲学问题，挺发人深思的。不过有些部分有点艰深，读得比较慢。' }
        ],
        answer: 'B', // B是AI
        aiFeatures: [
          '回答过于简短和通用，缺乏具体的阅读感受',
          '没有提及书中具体情节或引起共鸣的部分',
          '表达"每次读都有不同体会"这样的陈词滥调'
        ]
      }
    ]
  },
  
  onLoad(options) {
    console.log('页面加载，参数:', options);
    
    // 确保全局状态存在
    if (!app.globalData) {
      app.globalData = {};
    }
    
    // 初始化游戏数据
    this.initGameData();
    
    // 从URL参数或全局状态获取当前对话ID
    let dialogueId = this.data.currentDialogue;
    
    // 如果URL中有对话ID参数，则使用该参数
    if (options && options.dialogueId) {
      dialogueId = parseInt(options.dialogueId);
    } 
    // 如果全局状态中有当前对话ID，则使用该ID
    else if (app.globalData && app.globalData.gameData && app.globalData.gameData.currentDialogue) {
      dialogueId = app.globalData.gameData.currentDialogue;
    }
    
    // 确保对话ID在有效范围内
    if (dialogueId < 1) dialogueId = 1;
    if (dialogueId > this.data.totalDialogues) dialogueId = 1;
    
    // 更新当前对话ID
    this.setData({
      currentDialogue: dialogueId
    });
    
    // 更新全局状态中的当前对话ID
    if (app.globalData && app.globalData.gameData) {
      app.globalData.gameData.currentDialogue = dialogueId;
    }
    
    // 加载对话
    this.loadDialogue(dialogueId);
    
    console.log('当前对话ID:', dialogueId);
    console.log('游戏数据:', this.data.gameData);
  },
  
  initGameData() {
    // 如果全局状态中已有游戏数据，则使用该数据
    if (app.globalData && app.globalData.gameData) {
      this.setData({
        gameData: app.globalData.gameData
      });
      return;
    }
    
    // 否则创建新的游戏数据
    const gameData = {
      points: 0,
      correctCount: 0,
      wrongCount: 0,
      maxCombo: 0,
      currentCombo: 0,
      dialogues: []
    };
    
    // 保存到全局状态
    if (app.globalData) {
      app.globalData.gameData = gameData;
    }
    
    this.setData({
      gameData: gameData
    });
    
    console.log('游戏数据已初始化:', gameData);
  },
  
  loadDialogue(dialogueIndex) {
    // 在实际应用中，这里应该从服务器获取对话数据
    // 这里使用模拟数据
    const dialogue = this.data.dialoguesDB.find(d => d.id === dialogueIndex);
    
    if (dialogue) {
      this.setData({
        messages: dialogue.messages,
        currentAnswer: dialogue.answer
      });
    }
  },
  
  goBack(e) {
    wx.showModal({
      title: '提示',
      content: '确定要退出当前挑战吗？',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/game-home/game-home'
          });
        }
      }
    });
  },
  
  playAudio() {
    // 在实际应用中，这里应该播放对应的音频
    wx.showToast({
      title: '播放音频中...',
      icon: 'none',
      duration: 2000
    });
  },
  
  makeJudgment(e) {
    const judgment = e.currentTarget.dataset.judgment;
    const isCorrect = judgment === this.data.currentAnswer;
    
    // 更新游戏数据
    const gameData = this.data.gameData || {};
    
    // 确保gameData中的各个属性都存在
    gameData.points = gameData.points || 0;
    gameData.correctCount = gameData.correctCount || 0;
    gameData.wrongCount = gameData.wrongCount || 0;
    gameData.maxCombo = gameData.maxCombo || 0;
    gameData.currentCombo = gameData.currentCombo || 0;
    gameData.dialogues = gameData.dialogues || [];
    
    if (isCorrect) {
      // 判断正确
      gameData.correctCount++;
      gameData.currentCombo++;
      
      // 更新最大连击数
      if (gameData.currentCombo > gameData.maxCombo) {
        gameData.maxCombo = gameData.currentCombo;
      }
      
      // 计算得分
      if (gameData.currentCombo >= 3) {
        gameData.points += 2; // 连击3次及以上，每次+2分
      } else {
        gameData.points += 1; // 正常+1分
      }
    } else {
      // 判断错误
      gameData.wrongCount++;
      gameData.currentCombo = 0; // 重置连击
      
      // 扣分，但不低于0
      gameData.points = Math.max(0, gameData.points - 2);
    }
    
    // 记录本次对话结果
    gameData.dialogues.push({
      id: this.data.currentDialogue,
      judgment: judgment,
      isCorrect: isCorrect
    });
    
    // 保存游戏数据到全局状态
    if (app.globalData) {
      app.globalData.gameData = gameData;
    }
    
    this.setData({
      gameData: gameData
    });
    
    // 跳转到结果页
    wx.redirectTo({
      url: `/pages/result/result?dialogueId=${this.data.currentDialogue}&judgment=${judgment}&isCorrect=${isCorrect}&combo=${gameData.currentCombo}`
    });
  }
}) 