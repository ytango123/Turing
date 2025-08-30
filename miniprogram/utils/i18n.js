const i18nMessages = {
  zh: {
    gameHome: {
      navTitle: '首页',
      challengeModes: '挑战模式',
      quickChallenge: {
        title: '快速挑战',
        description: '10段对话，5分钟内完成'
      },
      hardMode: {
        title: '高难模式',
        description: '更具挑战性的对话判断',
        comingSoon: '即将推出'
      },
      rankings: '排行榜',
      viewAll: '查看全部',
      collapse: '收起',
      points: '点',
      levelProgress: '距离"{nextLevel}"还需{points}点',
      newUser: '新手',
      amateurExplorer: '业余探索者',
      seniorIdentifier: '资深鉴别师',
      turingMaster: '图灵大师',
      superIdentifier: '超级鉴别者',
      rankingsTip:'注：排行榜仅展示前十名用户',
      voiceCloneModes: '语音克隆模式',
      voiceMovie: {
        title: '经典影视台词',
        description: '参与即可获得额外奖励'
      },
      voiceMusic: {
        title: '歌手歌曲挑战',
        description: '歌词接龙，人机还是原声'
      }
    },
    common: {
      close: '关闭'
    },
    quickIntro: {
      navTitle: '快速挑战',
      title: '快速挑战',
      description: {
        line1: '5 段随机对话音频，判断对话中的 AI 身份。',
        line2: '正确 +1 分，错误 -2 分（不低于 0），连续 3 次正确开始连击加分！',
        line3: '点击音频按钮可反复播放。'
      },
      startButton: '马上开始'
    },
    game: {
      navTitle: '图灵测试',
      start: '开始游戏',
      score: '得分',
      combo: '连击',
      correct: '判断正确',
      wrong: '判断错误',
      replay: '重新播放',
      next: '下一题',
      finish: '完成'
    },
    profile: {
      navTitle: '个人中心',
      close: '关闭',
      challengesCompleted: '已参与挑战：',
      points: '点',
      pointsToNext: '距离"',
      stats: {
        correctRate: '总正确率',
        maxCombo: '最大连击',
        achievements: '已解锁成就',
        rank: '排名'
      },
      tabs: {
        achievements: '成就',
        history: '历史',
        settings: '设置'
      },
      achievements: {
        firstTry: {
          title: '初次尝试',
          description: '完成第一轮图灵挑战'
        },
        comboMaster: {
          title: '连击大师',
          description: '最大连击达到10次'
        },
        perfectJudge: {
          title: '完美判断',
          description: '在一轮挑战中获得5/5的正确率'
        },
        flawlessStreak: {
          title: '完美连胜',
          description: '最大连击达到15次'
        }
      },
      history: {
        empty: '暂无历史记录',
        challenge: '挑战',
        correctRate: '正确率',
        pointsGained: '获得'
      },
      language: '语言',
      theme: '深色模式',
      feedback: '意见反馈',
      editProfile: {
        navTitle: '编辑资料',
        avatarHint: '点击更换头像',
        nickLabel: '昵称',
        nickPlaceholder: '输入昵称',
        ageLabel: '年龄',
        genderLabel: '性别',
        educationLabel: '学历',
        aiFamiliarityLabel: 'AI 工具熟悉度',
        saveButton: '保存',
        pleaseFillNick: '请填写昵称',
        uploading: '上传中...',
        uploadFailed: '上传失败',
        saveSuccess: '保存成功',
        saveFailed: '保存失败',
        ages: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上'],
        genders: ['男', '女', '其他'],
        educations: ['高中及以下', '大专', '本科', '硕士', '博士及以上'],
        aiFamiliarities: ['从未使用过', '偶尔接触（如看别人用）', '使用过几次，了解基本功能', '经常使用，有一定操作经验', '非常熟悉，深入使用过多个 AI 工具']
      }
    },
    conversation: {
      loading: '加载中...',
      dialogueTitle: '对话',
      progress: '挑战进度',
      expand: '展开全部对话',
      collapse: '收起对话',
      hintText: '请仔细聆听对话，判断回应者（B）的身份',
      judgeA: 'B是人类',
      judgeB: 'B是AI',
      judgeNone: '（已移除）',
      descA: '选择此项若你认为B是真人',
      descB: '选择此项若你认为B是AI',
      descNone: '',
      exitConfirm: '确定要退出吗？退出后将不会保存进度，连击也将中断！',
      relisten: '再听一次？',
      relistenStop: '点击结束'
    },
    result: {
      navTitle: '结果',
      correct: '判断正确！',
      wrong: '判断错误！',
      correctDesc1: '你成功识别出了AI，获得',
      wrongDesc1: '很遗憾，判断错误，扣除',
      pointsUnit: '点',
      rewardSuffix: '奖励',
      expand: '展开全部对话',
      collapse: '收起对话',
      aiAnalysis: 'AI鉴别小贴士',
      nextButton: '下一题',
      combo: '连击'
    },
    summary: {
      navTitle: '挑战完成',
      close: '关闭',
      greatPerformance: '优秀的表现！',
      resultPrefix: '你在本轮挑战中获得了',
      accuracySuffix: '的正确率',
      statPoints: '获得点数',
      statCombo: '本轮最大连击',
      statPercentile: '超过用户',
      yourLevel: '你的等级',
      pointsUnit: '点',
      distanceTo: '距离"',
      needPointsSuffix: '还需',
      levelUpNotice1: '恭喜！你已晋升为"',
      levelUpNotice2: '，解锁了新的头像框！',
      analysisTitle: '分析结果',
      skillExcellent: '优秀',
      skillGood: '擅长',
      skillAverage: '一般',
      skillWeak: '需提高',
      shareButton: '分享我的成绩',
      playAgain: '再来一轮',
      achievementUnlocked: '达成成就',
      shareShort: '分享',
      performanceExcellent: '优秀的表现！',
      performanceGood: '不错的表现！',
      performanceAverage: '还有提升空间！',
      performancePoor: '完蛋了！',
      // 新增：金币相关
      coinsLabel: '金币',
      coinsUnit: '个'
    },
    index: {
      navTitle: '首页',
      welcome: '欢迎参与图灵测试',
      startTest: '开始测试',
      viewProfile: '查看资料'
    },
    rankings: {
      navTitle: '排行榜',
      loading: '加载中...',
      noMore: '已经到底啦',
      points: '点'
    },
    userInfo: {
      navTitle: '个人信息',
      progressTitle: '完成基本信息',
      ageTitle: '请选择您的年龄段',
      genderTitle: '请选择您的性别',
      educationTitle: '请选择您的学历',
      aiFamiliarityTitle: '请选择您对 AI 工具熟悉程度',
      inviteCodeTitle: '邀请码（选填）', // 新增邀请码标题
      nextButton: '下一步',
      privacyNotice: '信息仅用于研究目的，我们将严格保护您的隐私',
      pleaseSelect: '请选择一个选项',
      savingInfo: '保存信息中...',
      saveError: '保存信息失败，请重试',
      skipButton: '跳过', // 新增跳过按钮文本
      inviteCodeInvalid: '邀请码无效', // 新增邀请码无效提示
      inviteCodeValid: '邀请码有效' // 新增邀请码有效提示
    },
    levels: {
      newUser: '图灵萌新',
      amateurExplorer: '业余探索者',
      seniorIdentifier: '资深鉴别师',
      turingMaster: '图灵大师',
      superIdentifier: '超级鉴别者'
    },
    editProfile: {
      navTitle: '编辑资料',
      avatarHint: '点击更换头像',
      nickLabel: '昵称',
      nickPlaceholder: '输入昵称',
      ageLabel: '年龄',
      genderLabel: '性别',
      educationLabel: '学历',
      aiFamiliarityLabel: 'AI 工具熟悉度',
      saveButton: '保存',
      pleaseFillNick: '请填写昵称',
      uploading: '上传中...',
      uploadFailed: '上传失败',
      saveSuccess: '保存成功',
      saveFailed: '保存失败',
      ages: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上'],
      genders: ['男', '女', '其他'],
      educations: ['高中及以下', '大专', '本科', '硕士', '博士及以上'],
      aiFamiliarities: ['从未使用过', '偶尔接触（如看别人用）', '使用过几次，了解基本功能', '经常使用，有一定操作经验', '非常熟悉，深入使用过多个 AI 工具']
    },
    campus: {
      navTitle: '校园',
      goComplete: '去完成',
      claimReward: '领取奖励',
      invitedCount: '已邀请_/5人',
      invitedText: '已邀请',
      // 添加邀请弹窗相关翻译
      inviteTitle: '邀请好友获得金币',
      inviteContent: '每位用户至多邀请五位好友，邀请越多，金币奖励越多！',
      copyButton: '复制邀请码并分享',
      codeCopied: '邀请码已复制'
    }
  },
  en: {
    settings: {
      navTitle: 'Settings',
      title: 'Settings',
      language: 'Language',
      theme: 'Dark Mode',
      feedback: 'Feedback',
      chinese: 'Chinese',
      english: 'English'
    },
    gameHome: {
      navTitle: 'Home',
      challengeModes: 'Challenge Modes',
      quickChallenge: {
        title: 'Quick Challenge',
        description: '10 dialogues in 5 minutes'
      },
      hardMode: {
        title: 'Hard Mode',
        description: 'More challenging dialogues',
        comingSoon: 'Coming'
      },
      rankings: 'Rankings',
      viewAll: 'View All',
      collapse: 'Collapse',
      points: 'pts',
      levelProgress: '{points} points to "{nextLevel}"',
      newUser: 'BEGINNER',
      amateurExplorer: 'EXPLORER',
      seniorIdentifier: 'IDENTIFIER',
      turingMaster: 'MASTER',
      superIdentifier: 'SUPERIOR',
      rankingsTip:'Note: The leaderboard displays only the top 10 users',
      voiceCloneModes: 'Voice Clone Modes',
      voiceMovie: {
        title: 'Classic Movie Lines',
        description: 'Participate to earn extra reward'
      },
      voiceMusic: {
        title: 'Singer Lyrics Challenge',
        description: 'Lyrics relay, human or original voice?'
      }
    },
    common: {
      close: 'Close'
    },
    quickIntro: {
      navTitle: 'Quick Challenge',
      title: 'Quick Challenge',
      description: {
        line1: 'Judge AI identities in 5 random dialogue audios.',
        line2: 'Correct: +1 point, Wrong: -2 points (min 0), 3x combo for bonus points!',
        line3: 'Click audio button to replay.'
      },
      startButton: 'Start Now'
    },
    game: {
      navTitle: 'Turing Test',
      start: 'Start Game',
      score: 'Score',
      combo: 'Combo',
      correct: 'Correct',
      wrong: 'Wrong',
      replay: 'Replay',
      next: 'Next',
      finish: 'Finish'
    },
    profile: {
      navTitle: 'Profile',
      close: 'Close',
      challengesCompleted: 'Completed: ',
      points: ' pts',
      pointsToNext: 'Need ',
      stats: {
        correctRate: 'Accuracy',
        maxCombo: 'Max Combo',
        achievements: 'Badges',
        rank: 'Rank'
      },
      tabs: {
        achievements: 'Badges',
        history: 'History',
        settings: 'Settings'
      },
      achievements: {
        firstTry: {
          title: 'First Try',
          description: 'Complete your first Turing challenge'
        },
        comboMaster: {
          title: 'Combo Master',
          description: 'Max Combo reached 10x'
        },
        perfectJudge: {
          title: 'Perfect Judge',
          description: 'Get 5/5 correct in one challenge'
        },
        flawlessStreak: {
          title: 'Flawless Streak',
          description: 'Max Combo reached 15x'
        }
      },
      history: {
        empty: 'No history yet',
        challenge: 'Challenge',
        correctRate: 'Accuracy',
        pointsGained: 'Earned'
      },
      language: 'Language',
      theme: 'Dark Mode', 
      feedback: 'Feedback',
      editProfile: {
        navTitle: 'Edit Profile',
        avatarHint: 'Tap to change avatar',
        nickLabel: 'Nickname',
        nickPlaceholder: 'Enter nickname',
        ageLabel: 'Age',
        genderLabel: 'Gender',
        educationLabel: 'Education',
        aiFamiliarityLabel: 'AI Tools Familiarity',
        saveButton: 'Save',
        pleaseFillNick: 'Please enter a nickname',
        uploading: 'Uploading...',
        uploadFailed: 'Upload failed',
        saveSuccess: 'Saved',
        saveFailed: 'Save failed',
        ages: ['Under 18', '18-25', '26-35', '36-45', '46+'],
        genders: ['Male', 'Female', 'Other'],
        educations: ['High school or below', 'Associate', 'Bachelor', 'Master', 'PhD+'],
        aiFamiliarities: ['Never used', 'Occasionally encountered (e.g., saw others use)', 'Used a few times, understand basic functions', 'Use frequently, have some operational experience', 'Very familiar, have extensively used multiple AI tools']
      }
    },
    conversation: {
      loading: 'Loading...',
      dialogueTitle: 'Dialogue',
      progress: 'Progress',
      expand: 'Show full dialogue',
      collapse: 'Collapse dialogue',
      hintText: 'Listen carefully and decide if the responder (B) is human or AI',
      judgeA: 'B is Human',
      judgeB: 'B is AI',
      judgeNone: '(removed)',
      descA: 'Select if you think B is human',
      descB: 'Select if you think B is AI',
      descNone: '',
      exitConfirm: 'Are you sure you want to quit? Your progress will not be saved and combo will terminate!',
      relisten: 'Listen again?',
      relistenStop: 'Stop'
    },
    result: {
      navTitle: 'Result',
      correct: 'Correct!',
      wrong: 'Wrong!',
      correctDesc1: 'You identified AI correctly and earned ',
      wrongDesc1: 'Sorry, wrong judgment, deduct ',
      pointsUnit: ' pts',
      rewardSuffix: '',
      expand: 'Show full dialogue',
      collapse: 'Collapse dialogue',
      aiAnalysis: 'AI Detection Tips',
      nextButton: 'Next',
      combo: 'Combo'
    },
    summary: {
      navTitle: 'Summary',
      close: 'Close',
      greatPerformance: 'Great job!',
      resultPrefix: 'You achieved ',
      accuracySuffix: ' accuracy this round',
      statPoints: 'Points',
      statCombo: 'Round Max Combo',
      statPercentile: 'Beat users',
      yourLevel: 'Your Level',
      pointsUnit: ' pts',
      distanceTo: 'Need "',
      needPointsSuffix: ' more',
      levelUpNotice1: 'Congrats! You advanced to "',
      levelUpNotice2: '" and unlocked a new avatar frame!',
      analysisTitle: 'Analysis',
      skillExcellent: 'Excellent',
      skillGood: 'Good',
      skillAverage: 'Average',
      skillWeak: 'Poor',
      shareButton: 'Share my score',
      playAgain: 'Play again',
      achievementUnlocked: 'Achievement Unlocked',
      shareShort: 'Share',
      performanceExcellent: 'Excellent Performance!',
      performanceGood: 'Great Job!',
      performanceAverage: 'Room for Improvement!',
      performancePoor: 'Keep Practicing!',
      // 新增：金币相关
      coinsLabel: 'Coins',
      coinsUnit: ''
    },
    index: {
      navTitle: 'Home',
      welcome: 'Welcome to Turing Test',
      startTest: 'Start Test',
      viewProfile: 'View Profile'
    },
    rankings: {
      navTitle: 'Rankings',
      loading: 'Loading...',
      noMore: 'No more data',
      points: ' pts'
    },
    userInfo: {
      navTitle: 'Personal Info',
      progressTitle: 'Complete Basic Info',
      ageTitle: 'Please select your age range',
      genderTitle: 'Please select your gender',
      educationTitle: 'Please select your education',
      aiFamiliarityTitle: 'Please select your familiarity with AI tools',
      inviteCodeTitle: 'Invitation Code (Optional)', // 新增邀请码标题
      nextButton: 'Next',
      privacyNotice: 'Information is for research purposes only, we will protect your privacy',
      pleaseSelect: 'Please select an option',
      savingInfo: 'Saving information...',
      saveError: 'Failed to save info, please try again',
      skipButton: 'Skip', // 新增跳过按钮文本
      inviteCodeInvalid: 'Invalid invitation code', // 新增邀请码无效提示
      inviteCodeValid: 'Valid invitation code' // 新增邀请码有效提示
    },
    levels: {
      newUser: 'BEGINNER',
      amateurExplorer: 'EXPLORER',
      seniorIdentifier: 'IDENTIFIER',
      turingMaster: 'MASTER',
      superIdentifier: 'SUPERIOR'
    },
    editProfile: {
      navTitle: 'Edit Profile',
      avatarHint: 'Tap to change avatar',
      nickLabel: 'Nickname',
      nickPlaceholder: 'Enter nickname',
      ageLabel: 'Age',
      genderLabel: 'Gender',
      educationLabel: 'Education',
      aiFamiliarityLabel: 'AI Tools Familiarity',
      saveButton: 'Save',
      pleaseFillNick: 'Please enter a nickname',
      uploading: 'Uploading...',
      uploadFailed: 'Upload failed',
      saveSuccess: 'Saved',
      saveFailed: 'Save failed',
      ages: ['Under 18', '18-25', '26-35', '36-45', '46+'],
      genders: ['Male', 'Female', 'Other'],
      educations: ['High school or below', 'Associate', 'Bachelor', 'Master', 'PhD+'],
      aiFamiliarities: ['Never used', 'Occasionally encountered (e.g., saw others use)', 'Used a few times, understand basic functions', 'Use frequently, have some operational experience', 'Very familiar, have extensively used multiple AI tools']
    },
    campus: {
      navTitle: 'Campus',
      goComplete: 'Action',
      claimReward: 'Claim',
      invitedCount: 'Invited _/5',
      invitedText: 'Invited ',
      // Add invitation modal translations
      inviteTitle: 'Invite Friends for Coins',
      inviteContent: 'Each user can invite up to 5 friends. More invitations, more coin rewards!',
      copyButton: 'Copy Code and Share',
      codeCopied: 'Code copied!'
    }
  }
}

// 获取当前语言环境的文本
const t = (key, language = 'zh') => {
  const keys = key.split('.')
  let value = i18nMessages[language]
  
  for (const k of keys) {
    if (value && Object.prototype.hasOwnProperty.call(value, k)) {
      value = value[k]
    } else {
      return key
    }
  }
  
  return value
}

module.exports = {
  t,
  i18nMessages
} 