// pages/conversation/conversation.js
const app = getApp()
const { createPage } = require('../../utils/basePage')
const { t } = require('../../utils/i18n')

// 统一生成音频缓存 Key，避免同 id 跨 session 复用错误
function makeAudioKey(session, name) {
  return `${session}/${name}`
}

createPage({
  pageKey: 'conversation',
  i18nKeys: {
    loading: 'loading',
    dialogueTitle: 'dialogueTitle',
    progress: 'progress',
    expand: 'expand',
    collapse: 'collapse',
    hintText: 'hintText',
    judgeA: 'judgeA',
    judgeB: 'judgeB',
    relisten: 'relisten',
    relistenStop: 'relistenStop',
    
    // 描述文本已移除
    // 结果页面字段（映射到 result.*）
    correct: 'result.correct',
    wrong: 'result.wrong',
    correctDesc1: 'result.correctDesc1',
    wrongDesc1: 'result.wrongDesc1',
    pointsUnit: 'result.pointsUnit',
    rewardSuffix: 'result.rewardSuffix',
    aiAnalysis: 'result.aiAnalysis',
    nextButton: 'result.nextButton',
    combo: 'result.combo',
  },

  data: {
    currentLang: wx.getStorageSync('language') || 'zh',
    currentDialogue: 1,
    totalDialogues: 5,
    pageReady: false,  // 添加页面准备状态标记
    audioLoading: false,  // 音频加载状态
    
    // 当前对话内容
    messages: [],
    
    // 当前对话的答案
    currentAnswer: '', // A, B, or none
    
    // 当前音频文件ID及所属 Session
    currentAudioId: '',
    currentAudioSession: '',
    
    // 音频播放器
    audioContext: null,
    
    // 游戏数据
    gameData: {
      points: 0,
      correctCount: 0,
      wrongCount: 0,
      maxCombo: 0,
      dialogues: []
    },
    
    // 从云存储加载的对话数据
    cloudDialogues: [],
    
    // 本次游戏的10段随机对话
    gameDialogues: [],
    
    // 对话展开/折叠状态
    isExpanded: false,
    
    // 对话框最大显示行数（折叠状态）
    maxLines: 3,
    
    // 实际在界面上展示的对话（根据折叠状态）
    displayMessages: [],
    
    // 音频播放状态
    isPlaying: false,
    
    // 播放按钮按下状态
    isPressed: false,
    // 判断按钮锁（防止重复点击）
    isJudging: false,
    // 本地已下载音频路径
    localAudioPath: '',
    phase: 'loading',           // loading | dialogue | result | summary
    curIndex: 0,               // 当前对话下标 0-9
    preloadAudios: {},         // { audioKey: localPath }
    lastIsCorrect: false,
    lastPointsGained: 0,
    lastPointsLost: 0,
    aiRole: 'none',
    aiFeatures: [],
    comboCount: 0,
    showComboResult: false,
    replayMode: false,
    listeningAgain: false,
    progress: 0, // 音频播放进度百分比
    isSeeking: false, // 是否正在拖动滑块
    duration: 0, // 音频总时长
    
    // 新增：本轮得分变化记录
    roundPointsChange: 0,  // 本轮累计得分变化（正数表示得分，负数表示失分）
  },

  /** 滚动到页面顶部 */
  scrollToTop() {
    if (wx.pageScrollTo) {
      wx.pageScrollTo({ scrollTop: 0, duration: 0 });
    }
  },
  /** 停止并销毁音频，避免页面跳转后仍在后台播放 */
  stopAndDestroyAudio() {
    if (this.audioContext) {
      try { this.audioContext.stop(); } catch (e) {}
      try { this.audioContext.destroy(); } catch (e) {}
      this.audioContext = null;
      this.setData({ isPlaying: false, audioLoading: false });
    }
  },

  /** 清理 combo 提示相关定时器，避免跨题残留 */
  clearComboTimers() {
    if (this.comboShowTimer) {
      clearTimeout(this.comboShowTimer);
      this.comboShowTimer = null;
    }
    if (this.comboHideTimer) {
      clearTimeout(this.comboHideTimer);
      this.comboHideTimer = null;
    }
  },
  
  async onLoad(options) {
    console.log('页面加载，参数:', options);
    
    // 启用页面返回提示 (多语言)
    const language = this.data.currentLang;
    wx.enableAlertBeforeUnload({
      message: t('conversation.exitConfirm', language)
    });
    
    // 确保全局状态存在
    if (!app.globalData) {
      app.globalData = {};
    }
    
    // 若 quick-intro 已预下载音频，直接注入
    if (app.globalData && app.globalData.preloadAudios) {
      this.setData({ preloadAudios: app.globalData.preloadAudios });
    }
    
    // 先从云端获取最新的游戏数据，确保连击数等状态是最新的
    await this.fetchLatestGameDataFromCloud();
    
    // 初始化游戏数据
    this.initGameData();
    
    // 初始化音频播放器
    this.audioContext = wx.createInnerAudioContext();
    // iOS 默认遵循侧边静音开关，导致显示播放但无声；关闭该行为
    this.audioContext.obeyMuteSwitch = false;
    // 监听实际开始播放
    this.audioContext.onPlay(() => {
      this.setData({ 
        audioLoading: false,
        isPlaying: true 
      });
      clearTimeout(this.loadingTimer);
    });
    
    // 监听暂停
    this.audioContext.onPause(() => {
      this.setData({ isPlaying: false });
      clearTimeout(this.loadingTimer);
    });
    
    // 监听停止
    this.audioContext.onStop(() => {
      this.setData({ 
        isPlaying: false,
        audioLoading: false 
      });
      clearTimeout(this.loadingTimer);
    });

    // 监听音频播放进度更新
    this.audioContext.onTimeUpdate(() => {
      if (!this.data.isSeeking) {
        const duration = this.audioContext.duration;
        const progress = duration > 0 ? (this.audioContext.currentTime / duration) * 100 : 0;
        this.setData({
          progress: progress,
          duration: duration
        });
      }
    });

    this.audioContext.onWaiting(() => {
      // 仅在用户主动播放后（audioLoading 已标记）或音频正在播放时才显示加载状态，
      // 避免预加载阶段触发 onWaiting 导致按钮一直处于 loading
      if (this.data.audioLoading || this.data.isPlaying) {
      this.setData({ audioLoading: true });
      }
    });
    
    this.audioContext.onCanplay(() => {
      // 可以播放时不立即隐藏loading，等实际播放时再隐藏
    });
    
    // 监听音频播放失败
    this.audioContext.onError((res) => {
      console.error('音频播放错误:', res);
      // 无论预加载还是播放失败都重置状态
      this.setData({ 
        audioLoading: false,
        isPlaying: false
      });
      clearTimeout(this.loadingTimer);
      // 仅在用户触发播放动作后再提示错误，避免预加载阶段打扰
      if (this.data.audioLoadingPrev || this.data.isPlayingPrev || this.data.audioLoading || this.data.isPlaying) {
      wx.showToast({
        title: '音频播放失败',
        icon: 'none'
      });
      }
    });
    
    // 监听音频播放结束
    this.audioContext.onEnded(() => {
      this.setData({ 
        isPlaying: false,
        audioLoading: false,
        progress: 100 // 播放结束时将进度条设置为100%
      });
      clearTimeout(this.loadingTimer);
    });
    
    // 从云存储获取对话数据
    this.loadDialoguesFromCloud().then(async () => {
      // 进入第一题
      this.enterDialogue(0);
    }).catch(err => {
      console.error('加载对话数据失败:', err);
      wx.showToast({
        title: '加载对话数据失败',
        icon: 'none'
      });
    });
  },
  
  onUnload() {
    // 页面卸载时禁用返回提示
    wx.disableAlertBeforeUnload();
    // 页面卸载时停止音频播放
    this.stopAndDestroyAudio();
    // 清理 combo 定时器
    this.clearComboTimers();
    // 删除最后一段音频的本地文件
    if (this.data.localAudioPath) {
      const fs = wx.getFileSystemManager();
      try { fs.unlinkSync(this.data.localAudioPath); } catch (e) {}
    }
  },
  
  // 从云存储加载不同 Session 的对话数据（带缓存）
  loadDialoguesFromCloud() {
    // ---------- 缓存：若已加载过对话数据则直接返回 ----------
    if (app.globalData && Array.isArray(app.globalData.gameDialogues) && app.globalData.gameDialogues.length === 10) {
      // 同步 cloudDialogues（如有）
      if (Array.isArray(app.globalData.cloudDialogues)) {
        this.setData({
          cloudDialogues: app.globalData.cloudDialogues,
          gameDialogues: app.globalData.gameDialogues
        });
      } else {
        this.setData({
          gameDialogues: app.globalData.gameDialogues
        });
      }
      return Promise.resolve();
    }

    // ---------- 新实现：按语言(en/zh) + 身份文件夹(HH/HM/MH/MM) 动态加载 ----------
    const selectedLang = (app.globalData && app.globalData.selectedCorpus) ? app.globalData.selectedCorpus : (this.data.currentLang === 'en' ? 'en' : 'zh');
    const identityDirs = ['HH', 'HM', 'MH', 'MM']; // 如不存在会自动忽略
    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';

    // 针对每个身份目录取 <lang>_test_<identity>.json
    const jsonPromises = identityDirs.map(identity => {
      const testFolder = `${selectedLang}_test_${identity}`;
      const fileID = `${envPrefix}/${selectedLang}/${identity}/${testFolder}.json`;
      return wx.cloud.getTempFileURL({
        fileList: [{ fileID, maxAge: 3600 }]
      }).then(res => {
        const tempURL = res.fileList[0] && res.fileList[0].tempFileURL;
        if (!tempURL) throw new Error('no url');
        return new Promise((resolve, reject) => {
          wx.request({
            url: tempURL,
            success: r => {
              let raw = r.data;
              if (typeof raw === 'string') {
                try { raw = JSON.parse(raw); } catch(e) { raw = []; }
              }
              if (!Array.isArray(raw)) raw = [];
              const list = raw.map(d => ({
                ...d,
                lang: selectedLang,
                identity,
                testFolder,
                session: `${selectedLang}/${identity}/${testFolder}`,
                type: d.type || d.tag || identity
              }));
              resolve(list);
            },
            fail: reject
          });
        });
      });
    });

    // 全部加载后处理结果（使用 Promise.allSettled 容错）
    return Promise.allSettled(jsonPromises).then(results => {
      const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      if (!fulfilled.length) {
        throw new Error('所有对话 JSON 加载失败');
      }
      const allDialogues = [].concat(...fulfilled);
      console.log('已加载对话总数:', allDialogues.length);

      const gameDialogues = this.selectRandomDialogues(allDialogues, 5);
      this.setData({
        cloudDialogues: allDialogues,
        gameDialogues
      });
      if (app.globalData) {
        app.globalData.gameDialogues = gameDialogues;
        app.globalData.totalDialoguesCount = allDialogues.length;
        app.globalData.cloudDialogues = allDialogues;
      }
    });
  },
  
  /**
   * 从给定对话列表中抽取指定数量的不重复对话。
   * 规则：
   * 1. 过滤掉没有 type 的无效对话
   * 2. 剔除用户在以往挑战中听过的 conversation_id
   * 3. 跨 Session 存在同一 conversation_id 的只保留一条（随机保留）
   * 4. Fisher-Yates 洗牌后取前 count 条，确保一次挑战内部绝无重复
   */
  selectRandomDialogues(dialogues, count) {
    // 1) 有效对话
    const validDialogues = (dialogues || []).filter(d => d && d.type);
    
    // 2) 已听过的对话
    if (!app.globalData.gameData.heardDialogues) {
      app.globalData.gameData.heardDialogues = [];
    }
    const heardSet = new Set(app.globalData.gameData.heardDialogues);
    
    // 3) 去重 conversation_id（同时排除已听过）
    const uniqueMap = new Map(); // key = type + name -> dialogue
    validDialogues.forEach(d => {
      const audName = d.name;
      if (!audName || heardSet.has(audName)) return;

      const key = `${d.type}_${audName}`;
      if (!uniqueMap.has(key)) {
        // 直接存
        uniqueMap.set(key, d);
      } else {
        // 已存在相同 cid（跨 Session）。随机保留一个，增加多样性
        if (Math.random() < 0.5) {
          uniqueMap.set(key, d);
        }
      }
    });

    let candidates = Array.from(uniqueMap.values());
    
    // 如果候选数量不足，需要清空 heardDialogues 再重新选择
    if (candidates.length < count) {
      app.globalData.gameData.heardDialogues.length = 0; // 清空听过记录
      return this.selectRandomDialogues(dialogues, count);
    }
    
    // 4) Fisher-Yates 洗牌
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // 取前 count 条
    return candidates.slice(0, count);
  },
  
  initGameData() {
    // 如果全局状态中已有游戏数据，则使用该数据
    if (app.globalData && app.globalData.gameData) {
      // 记录本轮开始前的基础点数（只记录一次）
      if (typeof app.globalData.gameData.basePoints !== 'number') {
        app.globalData.gameData.basePoints = app.globalData.gameData.points || 0;
      }
      
      // 若 dialogues 已被清空，说明是新一局，重置计数数据
      if (Array.isArray(app.globalData.gameData.dialogues) && app.globalData.gameData.dialogues.length === 0) {
        app.globalData.gameData.correctCount = 0;
        app.globalData.gameData.wrongCount = 0;
        
        // 重要：保持云端同步的连击数状态
        // 如果用户中途退出过，云端数据中的 currentCombo 应该已经是 0
        // 这里不需要重置连击数，应该保持云端的最新状态
        console.log('新一局开始，使用云端同步的连击数:', app.globalData.gameData.currentCombo);
        
        // 更新basePoints为新一局的起始点数
        app.globalData.gameData.basePoints = app.globalData.gameData.points || 0;
      }
      
      this.setData({
        gameData: app.globalData.gameData,
        roundPointsChange: 0  // 重置本轮得分变化
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
      gameData: gameData,
      roundPointsChange: 0  // 重置本轮得分变化
    });
    
    // 为新游戏数据记录基础点数
    gameData.basePoints = 0;
    
    console.log('游戏数据已初始化:', gameData);
  },
  
  loadDialogue(dialogueIndex) {
    // 切换对话前终止并清空旧音频，防止等待占用网络
    if (this.audioContext) {
      try {
        this.audioContext.stop();
      } catch (e) {}
      this.audioContext.src = '';
    }
    // 删除上一题下载的本地音频，释放空间
    if (this.data.localAudioPath) {
      const fs = wx.getFileSystemManager();
      try { fs.unlinkSync(this.data.localAudioPath); } catch (e) {}
      this.setData({ localAudioPath: '' });
    }
    // 确保游戏对话数据已加载
    if (!this.data.gameDialogues || this.data.gameDialogues.length === 0) {
      console.error('游戏对话数据未加载');
      return;
    }
    
    // 获取当前对话（索引从0开始，而dialogueIndex从1开始）
    const dialogue = this.data.gameDialogues[dialogueIndex - 1];
    
    if (dialogue) {
      // -------- 修改：根据发言顺序映射角色 A / B --------
      const speakerMap = {}; // { 原始speaker : 'A' | 'B' }
      let nextRole = 'A';

      const messages = dialogue.utterances.map(u => {
        if (!speakerMap[u.speaker]) {
          // 首次出现的 speaker 依次赋值 A、B
          speakerMap[u.speaker] = nextRole;
          nextRole = nextRole === 'A' ? 'B' : 'A';
        }
        return {
          role: speakerMap[u.speaker],
          content: u.text
        };
      });
      
      // 直接使用 JSON 中的 type 作为正确答案 (HH/HM/MH/MM)
      const answer = dialogue.type;

      // 解析 AI 所属角色
      let aiRole = 'none';
      switch (dialogue.type) {
        case 'HM':
          aiRole = 'B';
          break;
        case 'MH':
          aiRole = 'A';
          break;
        case 'MM':
          aiRole = 'both';
          break;
        case 'HH':
        default:
          aiRole = 'none';
      }

      // 保存当前音频ID与所属 Session
      const currentAudioId = dialogue.name || dialogue.conversation_id;
      const currentAudioSession = dialogue.session; // 现为 lang/identity/testFolder
      
      this.setData({
        messages: messages,
        currentAnswer: answer,
        currentAudioId: currentAudioId,
        currentAudioSession: currentAudioSession,
        isExpanded: false, // 重置展开状态
        isPlaying: false, // 重置播放状态
        aiRole: aiRole
      });
      
      // 更新展示的对话
      this.updateDisplayMessages(messages, false);

      // 对话数据与 messages 均就绪后再显示页面
      this.setData({ pageReady: true });
      
      // 预加载音频
      this.preloadAudio(currentAudioId, currentAudioSession);
      
      console.log('加载对话:', currentAudioId, '答案:', answer);
      // 调试输出当前对话的正确答案
      console.debug('【DEBUG】当前对话正确答案:', answer);
    }
  },
  
  // 预加载音频
  preloadAudio(audioId, session) {
    if (!audioId) return;
    
    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
    const fileID = `${envPrefix}/${session}/${audioId}.m4a`;
    
    // 若已有本地缓存则直接使用
    if (this.data.localAudioPath) {
      this.audioContext.src = this.data.localAudioPath;
      return;
    }
    // 先下载到本地，再赋 src
    wx.cloud.downloadFile({ fileID }).then(res => {
      const localPath = res.tempFilePath;
      this.setData({ localAudioPath: localPath });
      this.audioContext.src = localPath;
    }).catch(err => {
      console.error('预下载音频失败', err && (err.errMsg || err.message || err), 'code:', err.errCode, 'fileID:', fileID);
    });
  },
  
  // 切换对话展开/折叠状态
  toggleExpand() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const newExpanded = !this.data.isExpanded;
    this.setData({
      isExpanded: newExpanded
    });
    this.updateDisplayMessages(this.data.messages, newExpanded);

    // 若收起对话，立即回到顶部
    if (!newExpanded) {
      this.scrollToTop();
    }
  },
  
  // 根据展开状态更新displayMessages
  updateDisplayMessages(messages, expanded) {
    const maxLines = this.data.maxLines;
    const displayMessages = (expanded || messages.length <= maxLines) ? messages : messages.slice(0, maxLines);
    this.setData({ displayMessages });
  },
  
  goBack(e) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const language = this.data.currentLang;
    const confirmMsg = t('conversation.exitConfirm', language);

    wx.showModal({
      title: '',
      content: confirmMsg,
      cancelText: language === 'en' ? 'Cancel' : '取消',
      confirmText: language === 'en' ? 'Exit' : '退出',
      success: async (res) => {
        if (!res.confirm) return; // 用户取消

        // 停止并销毁音频，避免后台播放
        this.stopAndDestroyAudio();
        
        // 退出挑战时恢复到挑战开始前的点数
        if (app.globalData && app.globalData.gameData && typeof app.globalData.gameData.basePoints === 'number') {
          app.globalData.gameData.points = app.globalData.gameData.basePoints;
          // 清空本轮对话记录，防止中途退出写入 summary
          app.globalData.gameData.dialogues = [];
          app.globalData.gameData.correctCount = 0;
          app.globalData.gameData.wrongCount = 0;
          
          // 中途退出时清零连击数，因为本轮挑战未完成
          app.globalData.gameData.currentCombo = 0;
          app.globalData.gameData.maxCombo = app.globalData.gameData.maxCombo || 0; // 保持历史最大连击
          
          // 同步更新页面数据，确保连击数显示正确
          this.setData({
            gameData: app.globalData.gameData
          });
          
          // 等待云端同步完成后再跳转，确保连击数清零状态被保存
          try {
            await this.syncGameDataToCloud();
            console.log('中途退出时数据同步成功');
          } catch (err) {
            console.error('中途退出时数据同步失败:', err);
            // 即使同步失败也继续跳转，避免用户卡住
          }
        }
        
        // 关闭系统 beforeUnload 提示，避免出现两次弹窗
        wx.disableAlertBeforeUnload();

        // 直接返回首页，避免 quick-intro 闪屏
        wx.switchTab({ url: '/pages/game-home/game-home' });
      }
    });
  },
  
  playAudio() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    // 没有音频ID直接返回
    if (!this.data.currentAudioId) {
      wx.showToast({ title: '没有可播放的音频', icon: 'none' });
      return;
    }

    // 如果正在加载，防止重复点击
    if (this.data.audioLoading) {
      return;
    }

    // 如果当前正在播放，则暂停
    if (this.data.isPlaying) {
      this.audioContext.pause();
      return;
    }

    // 如果当前是暂停状态，则直接继续播放
    if (this.audioContext.src && this.audioContext.currentTime > 0) {
      this.audioContext.play();
      return;
    }

    // 显示加载状态，等待实际播放
    this.setData({ audioLoading: true });
    // 设置 10 秒超时兜底，避免长时间 waiting
    clearTimeout(this.loadingTimer);
    this.loadingTimer = setTimeout(() => {
      if (this.data.audioLoading) {
        this.setData({ audioLoading: false, isPlaying: false });
        wx.showToast({ title: '网络不佳，音频加载超时', icon: 'none' });
        try { this.audioContext.stop(); } catch (e) {}
      }
    }, 10000);

    // 已缓存本地路径则直接播放
    const cacheKey = makeAudioKey(this.data.currentAudioSession, this.data.currentAudioId);
    const cachePath = this.data.preloadAudios[cacheKey];
    if (cachePath && (!this.audioContext.src || !this.audioContext.src.includes(this.data.currentAudioId))) {
      this.audioContext.src = cachePath;
      try { this.audioContext.seek(0); } catch(e){}
      this.audioContext.play();
      return;
    }

    // 否则重新加载音频URL并播放
    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
    const session = this.data.currentAudioSession; // 现在为 lang/identity/testFolder
    const audioFileID = `${envPrefix}/${session}/${this.data.currentAudioId}.m4a`;
    
    // 使用 downloadFile 下载后播放（避免再次 waiting）
    wx.cloud.downloadFile({ fileID: audioFileID }).then(res => {
      const localPath = res.tempFilePath;
      const cid = this.data.currentAudioId;
      const key = makeAudioKey(this.data.currentAudioSession, cid);
      const newMap = { ...this.data.preloadAudios, [key]: localPath };
      this.setData({ localAudioPath: localPath, preloadAudios: newMap });
      if (getApp().globalData) {
        getApp().globalData.preloadAudios = newMap;
      }
      this.audioContext.src = localPath;
      this.audioContext.play();
    }).catch(err => {
      console.error('下载并播放音频失败', err && (err.errMsg || err.message || err), 'code:', err.errCode, 'fileID:', audioFileID);
      this.setData({ audioLoading: false, isPlaying: false });
      wx.showToast({ title: '音频加载失败', icon: 'none' });
    });
    return;
  },
  
  // 播放按钮按下
  onPlayButtonPress() {
    this.setData({ isPressed: true });
  },
  
  // 播放按钮松开
  onPlayButtonRelease() {
    this.setData({ isPressed: false });
  },
  
  makeJudgment(e) {
    // 防止重复点击
    if (this.data.isJudging) return;

    // -------- 新增：开始判定前清理旧的 combo 定时器 --------
    this.clearComboTimers();
 
    this.setData({ isJudging: true });
    // 若页面尚未准备好，直接返回
    if (!this.data.pageReady) {
      wx.showToast({ title: '请等待对话加载完成', icon: 'none' });
      this.setData({ isJudging: false });
      return;
    }
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const judgment = e.currentTarget.dataset.judgment;
    // --- 修改：仅判断角色 B 是否为 AI ---
    // 正确答案中，若第二字符为 'M' 则说明 B 为 AI
    const correctBIsAI = this.data.currentAnswer && this.data.currentAnswer.charAt(1) === 'M';
    // 用户选择 HM，即认定 B 为 AI；HH 表示认定 B 不是 AI
    const userBIsAI = judgment === 'HM';
    const isCorrect = userBIsAI === correctBIsAI;
    
    // 更新游戏数据
    const gameData = this.data.gameData || {};
    
    // 确保gameData中的各个属性都存在
    gameData.points = gameData.points || 0;
    gameData.correctCount = gameData.correctCount || 0;
    gameData.wrongCount = gameData.wrongCount || 0;
    gameData.maxCombo = gameData.maxCombo || 0;
    gameData.currentCombo = gameData.currentCombo || 0;
    gameData.dialogues = gameData.dialogues || [];
    gameData.heardDialogues = gameData.heardDialogues || new Set();
    
    let pointsToAdd = 0;
    if (isCorrect) {
      // 判断正确
      gameData.correctCount++;
      gameData.currentCombo++;
      
      // 更新最大连击数
      if (gameData.currentCombo > gameData.maxCombo) {
        gameData.maxCombo = gameData.currentCombo;
      }
      
      // 计算得分：基础 +1，连击得分递增
      pointsToAdd = 1;
      if (gameData.currentCombo >= 3) {
        // 从第三连击开始，每两次递增1分
        // 第3连击：+2，第4连击：+2，第5连击：+3，第6连击：+3...
        const extraPoints = Math.floor((gameData.currentCombo - 1) / 2);
        pointsToAdd += extraPoints;
      }
      
      // 不直接修改全局总分，只记录本轮得分变化
      const newRoundPointsChange = this.data.roundPointsChange + pointsToAdd;
      this.setData({
        roundPointsChange: newRoundPointsChange
      });
    } else {
      // 判断错误
      gameData.wrongCount++;
      gameData.currentCombo = 0; // 重置连击
      
      // 扣分，但不低于0
      const currentRoundPoints = this.data.roundPointsChange;
      const pointsLost = Math.min(1, currentRoundPoints); // 最多扣1分，不能低于0
      const newRoundPointsChange = Math.max(0, currentRoundPoints - 1);
      
      // 记录本轮得分变化
      this.setData({
        roundPointsChange: newRoundPointsChange
      });
    }
    
    // 记录本次对话结果，包含正确答案及音频ID（conversationId）
    const correctLetter = (this.data.currentAnswer && this.data.currentAnswer.length >= 2) ? this.data.currentAnswer.charAt(1) : this.data.currentAnswer;
    const userLetter = (judgment === 'HM') ? 'M' : 'H'; // 目前仅存在 HH/HM 两个按钮
    gameData.dialogues.push({
      id: this.data.currentDialogue,            // 本地对话序号 1-10
      name: this.data.currentAudioId,           // 音频文件名
      correctAnswer: correctLetter,             // 仅记录角色B的身份字母
      userAnswer: userLetter,                   // 用户选择的角色B身份
      isCorrect: isCorrect                      // 判定是否正确
    });
    
    // 保存游戏数据到全局状态
    if (app.globalData) {
      app.globalData.gameData = gameData;
      // 记录本轮得分变化到全局状态，供summary页面使用
      app.globalData.gameData.roundPointsChange = this.data.roundPointsChange;
      // 不再在对话过程中同步云端，而是等总结页面统一结算
      /*
      if (app.globalData.openid && app.globalData.userInfo) {
        app.updateUserGameData().catch(err => {
          console.error('同步游戏数据到云数据库失败', err);
        });
      }
      */
    }
    
    this.setData({
      gameData: gameData
    });
    
    // 停止音频但不销毁，后续继续复用
    if (this.audioContext) {
      try { this.audioContext.stop(); } catch(e) {}
    }

    // 显示结果阶段，并重置进度条
    this.setData({
      phase: 'result',
      isExpanded: false,
      lastIsCorrect: isCorrect,
      lastPointsGained: pointsToAdd || 0,
      lastPointsLost: 1,
      comboCount: gameData.currentCombo,
      showComboResult: false, // 先隐藏，稍后触发动画
      listeningAgain: false,
      progress: 0, // 重置进度条
    }, () => { this.scrollToTop(); });

    // 收起对话展示
    this.updateDisplayMessages(this.data.messages, false);

    // 下一事件循环再显示，触发 CSS 过渡
    this.comboShowTimer = setTimeout(() => {
      this.setData({ showComboResult: true });

      // 3秒后淡出
      this.comboHideTimer = setTimeout(() => {
        this.setData({ showComboResult: false });
      }, 2000);
    }, 50);
    this.setData({ isJudging: false });
  },
  switchLanguage() { /* conversation page 无语言切换，若存在忽略 */ },
  /** 进入指定索引的对话 */
  enterDialogue(index) {
    // 切题前清理之前的 combo 动画定时器，重置显示状态
    this.clearComboTimers();
    this.setData({ showComboResult: false, replayMode: false, listeningAgain: false });

    const dlg = this.data.gameDialogues[index];
    if (!dlg) return;
    // 根据 speaker 动态映射 A/B
    const speakerMap = {};
    let nextRole = 'A';
    const messages = dlg.utterances.map(u => {
      if (!speakerMap[u.speaker]) {
        speakerMap[u.speaker] = nextRole;
        nextRole = nextRole === 'A' ? 'B' : 'A';
      }
      return { role: speakerMap[u.speaker], content: u.text };
    });

    // 直接使用 JSON 中的 type 作为正确答案 (HH/HM/MH/MM)
    const answer = dlg.type;

    // 解析 AI 所属角色
    let aiRole = 'none';
    switch (dlg.type) {
      case 'HM':
        aiRole = 'B';
        break;
      case 'MH':
        aiRole = 'A';
        break;
      case 'MM':
        aiRole = 'both';
        break;
      case 'HH':
      default:
        aiRole = 'none';
    }

    // 若无特征，提供默认示例
    let aiFeatures = dlg.aiFeatures || [];
    if (aiRole !== 'none' && (!aiFeatures || aiFeatures.length === 0)) {
      const zhPool = [
        '语调平滑，缺乏起伏变化',
        '情绪表达不够丰富或显得过度做作',
        '停顿节奏与语意脱节',
        '缺乏真实呼吸声或呼吸太规则',
        '重音放错，无法正确强调关键词',
        '连读、生理口音处理不自然',
        '发音过于标准，缺乏个体特征',
        '语气变化跳跃或突兀',
        '无法自然表达复杂情感转折',
        '笑声、叹息等人类非语言行为僵硬或缺失'
      ];
      const enPool = [
        'Monotone delivery with limited pitch variation, unlike natural human intonation.',
        'Emotional tone can feel flat, forced, or disconnected from context.',
        'Pauses may occur in odd places, disrupting the natural speech flow.',
        'Breathing sounds are either absent or too mechanical.',
        'Stress often lands on incorrect words, affecting meaning and emphasis.',
        'Lacks natural blending of sounds between words (e.g., linking, contractions).',
        'Over-enunciated pronunciation with little speaker individuality.',
        'Tone shifts feel abrupt or contextually inconsistent.',
        'Struggles to convey emotional nuance or gradual emotional shifts.',
        'Non-verbal sounds like laughter or sighs sound robotic or are missing.'
      ];
      const pool = (this.data.currentLang === 'en') ? enPool : zhPool;
      // 随机抽取3条
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      aiFeatures = pool.slice(0,3);
    }

    const localPath = this.data.preloadAudios[makeAudioKey(dlg.session, dlg.name || dlg.conversation_id)] || '';
    if (localPath) {
      this.audioContext.src = localPath;
    }

    this.setData({
      phase: 'dialogue',
      curIndex: index,
      messages,
      currentAnswer: answer,
      isExpanded: false,
      pageReady: true,
      currentAudioId: dlg.name || dlg.conversation_id,
      currentAudioSession: dlg.session, // 现在为 lang/identity/testFolder
      currentDialogue: index + 1,
      aiFeatures: aiFeatures,
      aiRole: aiRole,
      listeningAgain: false,
      progress: 0, // 重置进度条
    });
    this.updateDisplayMessages(messages, false);
    // 预拉下一题音频
    this.prefetchNextAudio(index + 1);

    // 调试输出当前对话信息
    console.log('【DEBUG】enterDialogue 当前对话: ', dlg.name || dlg.conversation_id, '类型:', dlg.type);
  },
  /** 预拉下一题音频 */
  prefetchNextAudio(nextIndex) {
    if (nextIndex >= 5) return;
    const nextDlg = this.data.gameDialogues[nextIndex];
    if (!nextDlg) return;
    const cid = nextDlg.name || nextDlg.conversation_id;
    const session = nextDlg.session;
    const key = makeAudioKey(session, cid);
    if (this.data.preloadAudios[key]) return; // 已缓存
    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
    const fileID = `${envPrefix}/${session}/${cid}.m4a`;
    wx.cloud.downloadFile({ fileID }).then(res => {
      const path = res.tempFilePath;
      const newKey = makeAudioKey(session, cid);
      const newMap = { ...this.data.preloadAudios, [newKey]: path };
      this.setData({ preloadAudios: newMap });
      if (getApp().globalData) {
        getApp().globalData.preloadAudios = newMap;
      }
    }).catch(() => {});
  },
  /** 结果页点击下一题 */
  nextFromResult() {
    // 防止重复点击
    if (this.data.phase === 'transition') return;
    
    // 清理 combo 动画定时器，避免影响下一题或总结页
    this.clearComboTimers();

    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    
    const nextIdx = this.data.curIndex + 1;
    if (nextIdx >= 5) {
      // TODO: 切换到 summary 阶段，保留原逻辑 or redirect
      wx.redirectTo({ url: '/pages/summary/summary' });
      return;
    }
    
    // 先将当前结果页设置为不可见，避免闪烁
    this.setData({ phase: 'transition' }, () => {
    // 若正在重听，先停止音频
    if (this.data.listeningAgain && this.audioContext) {
      try { this.audioContext.stop(); } catch(e){}
      this.setData({ listeningAgain: false, isPlaying: false });
    }
      
      // 滚动到顶部并进入下一题
      this.scrollToTop();
    this.enterDialogue(nextIdx);
    });
  },
  /** 结果页点击再听一次 */
  replayDialogue() {
    // 回到对话页面，但禁用判定按钮
    this.setData({ phase: 'dialogue', replayMode: true, isExpanded: false, progress: 0 }, () => { this.scrollToTop(); this.updateDisplayMessages(this.data.messages, false); });
  },
  /** 切换结果页重听状态 */
  toggleReplayAudio() {
    if (!this.audioContext) return;
    
    if (!this.data.listeningAgain) {
      // 开始重听
      // 确保音频已加载
      const dlg = this.data.gameDialogues[this.data.curIndex];
      if (!dlg) return;
      
      const cid = dlg.name || dlg.conversation_id;
      const session = dlg.session;
      const localPath = this.data.preloadAudios[makeAudioKey(session, cid)];
      
      // 设置加载状态
      this.setData({ audioLoading: true });
      
      // 如果有本地缓存路径，直接使用
      if (localPath) {
        console.log('使用缓存音频:', localPath);
        this.audioContext.src = localPath;
        try { 
          this.audioContext.seek(0);
      this.audioContext.play();
        } catch(e){
          console.error('播放缓存音频失败:', e);
        }
      this.setData({ listeningAgain: true, progress: 0 });
        return;
      }
      
      // 否则重新下载
      const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
      const fileID = `${envPrefix}/${session}/${cid}.m4a`;
      
      console.log('下载并播放音频:', fileID);
      wx.cloud.downloadFile({ fileID }).then(res => {
        const path = res.tempFilePath;
        // 更新缓存
        const newMap = { ...this.data.preloadAudios, [makeAudioKey(session, cid)]: path };
        this.setData({ 
          preloadAudios: newMap,
          localAudioPath: path
        });
        
        if (getApp().globalData) {
          getApp().globalData.preloadAudios = newMap;
        }
        
        // 播放音频
        this.audioContext.src = path;
        this.audioContext.play();
        this.setData({ listeningAgain: true, progress: 0 });
      }).catch(err => {
        console.error('下载音频失败:', err);
        this.setData({ audioLoading: false });
        wx.showToast({ title: '音频加载失败', icon: 'none' });
      });
    } else {
      // 停止重听
      try { this.audioContext.stop(); } catch(e){}
      this.setData({ listeningAgain: false, audioLoading: false });
    }
  },
  // 语言切换后刷新动态文本
  refreshLanguageDependentData(language) {
    const extra = {
      correct: t('result.correct', language),
      wrong: t('result.wrong', language),
      correctDesc1: t('result.correctDesc1', language),
      wrongDesc1: t('result.wrongDesc1', language),
      pointsUnit: t('result.pointsUnit', language),
      rewardSuffix: t('result.rewardSuffix', language),
      aiAnalysis: t('result.aiAnalysis', language),
      nextButton: t('result.nextButton', language),
      combo: t('result.combo', language)
    };
    this.setData({ t: { ...this.data.t, ...extra } });
  },

  // --- 音频进度条相关函数 ---
  
  /** 点击进度条 */
  onProgressBarTap(e) {
    if (!this.audioContext || this.data.duration === 0) return;
    
    // 添加震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }

    const position = e.detail.x;
    const query = wx.createSelectorQuery().in(this);
    query.select('.progress-bar-track').boundingClientRect(rect => {
      if(rect) {
        const progress = ((position - rect.left) / rect.width) * 100;
        this.seekAudio(progress);
      }
    }).exec();
  },

  /** 开始拖动滑块 */
  onSliderTouchStart(e) {
    if (!this.audioContext || this.data.duration === 0) return;
    this.setData({ isSeeking: true });
    // 添加震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  },

  /** 正在拖动滑块 */
  onSliderTouchMove(e) {
    if (!this.data.isSeeking || !this.audioContext || this.data.duration === 0) return;
    const position = e.touches[0].clientX;
    const query = wx.createSelectorQuery().in(this);
    query.select('.progress-bar-track').boundingClientRect(rect => {
      if(rect) {
        let progress = ((position - rect.left) / rect.width) * 100;
        progress = Math.max(0, Math.min(100, progress)); // 保证进度在 0-100 之间
        this.setData({ progress });
      }
    }).exec();
  },

  /** 结束拖动滑块 */
  onSliderTouchEnd(e) {
    if (!this.data.isSeeking) return;
    this.setData({ isSeeking: false });
    this.seekAudio(this.data.progress);
  },
  
  /** 跳转到指定音频位置并播放 */
  seekAudio(progress) {
    if (!this.audioContext || this.data.duration === 0) return;
    const position = (progress / 100) * this.data.duration;
    // 先暂停，seek之后再播放，避免音频播放出现问题
    this.audioContext.pause();
    this.audioContext.seek(position);
    this.audioContext.play();
  },

  noop() {},
  
  // 从云端获取最新的游戏数据
  async fetchLatestGameDataFromCloud() {
    // 检查是否已初始化云环境
    if (!wx.cloud) {
      console.log('云环境未初始化，跳过云端数据获取');
      return;
    }
    
    // 检查用户是否已登录
    if (!app.globalData || !app.globalData.openid) {
      try {
        // 尝试获取用户信息
        await app.getUserInfo();
      } catch (e) {
        console.log('获取用户信息失败，跳过云端数据获取', e);
        return;
      }
    }
    
    if (!app.globalData.openid) {
      console.log('用户未登录，跳过云端数据获取');
      return;
    }
    
    try {
      const db = wx.cloud.database();
      const res = await db.collection('users')
        .where({
          _openid: app.globalData.openid
        })
        .get();
      
      if (res.data && res.data.length > 0) {
        const userData = res.data[0];
        const cloudGameData = userData.gameData || {};
        
        // 更新全局游戏数据，保留云端的最新状态
        if (app.globalData) {
          if (!app.globalData.gameData) {
            app.globalData.gameData = {};
          }
          
          // 重要：云端数据优先级最高，特别是连击数
          // 如果云端连击数为0，说明用户中途退出过，必须清零
          if (cloudGameData.currentCombo === 0) {
            app.globalData.gameData.currentCombo = 0;
            console.log('检测到用户中途退出过，连击数已清零');
          }
          
          // 合并云端数据到全局状态，确保连击数等状态是最新的
          app.globalData.gameData = {
            ...app.globalData.gameData,
            ...cloudGameData,
            // 特别确保这些关键字段从云端获取，优先级最高
            currentCombo: cloudGameData.currentCombo !== undefined ? cloudGameData.currentCombo : (app.globalData.gameData.currentCombo || 0),
            maxCombo: cloudGameData.maxCombo !== undefined ? cloudGameData.maxCombo : (app.globalData.gameData.maxCombo || 0),
            points: cloudGameData.points !== undefined ? cloudGameData.points : (app.globalData.gameData.points || 0),
            basePoints: cloudGameData.basePoints !== undefined ? cloudGameData.basePoints : (app.globalData.gameData.basePoints || 0),
            heardDialogues: cloudGameData.heardDialogues || []
          };
          
          console.log('从云端获取到最新游戏数据:', app.globalData.gameData);
          console.log('云端连击数:', cloudGameData.currentCombo, '全局连击数:', app.globalData.gameData.currentCombo);
        }
      }
    } catch (err) {
      console.error('从云端获取游戏数据失败:', err);
      // 不显示错误提示，避免影响用户体验
    }
  },

  // 同步游戏数据到云数据库
  syncGameDataToCloud() {
    // 检查是否已初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return Promise.reject('云环境未初始化');
    }
    
    // 检查用户是否已登录
    if (!app.globalData || !app.globalData.openid) {
      console.log('用户未登录，无法同步数据');
      return Promise.reject('用户未登录');
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
        console.log('中途退出时游戏数据同步成功');
      })
      .catch(err => {
        console.error('中途退出时游戏数据同步失败', err);
        // 不显示错误提示，避免影响用户体验
        throw err; // 重新抛出错误，让调用者知道同步失败
      });
  }
}) 