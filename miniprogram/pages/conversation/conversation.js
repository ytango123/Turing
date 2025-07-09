// pages/conversation/conversation.js
const app = getApp()
const { createPage } = require('../../utils/basePage')
const { t } = require('../../utils/i18n')

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
    judgeNone: 'judgeNone',
    descA: 'descA',
    descB: 'descB',
    descNone: 'descNone'
  },

  data: {
    currentDialogue: 1,
    totalDialogues: 10,
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
    localAudioPath: ''
  },
  
  onLoad(options) {
    console.log('页面加载，参数:', options);
    
    // 启用页面返回提示 (多语言)
    const language = wx.getStorageSync('language') || 'zh';
    wx.enableAlertBeforeUnload({
      message: t('conversation.exitConfirm', language)
    });
    
    // 确保全局状态存在
    if (!app.globalData) {
      app.globalData = {};
    }
    
    // 初始化游戏数据
    this.initGameData();
    
    // 初始化音频播放器
    this.audioContext = wx.createInnerAudioContext();
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

    this.audioContext.onWaiting(() => {
      this.setData({ audioLoading: true });
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
        audioLoading: false 
      });
      clearTimeout(this.loadingTimer);
    });
    
    // 从云存储获取对话数据
    this.loadDialoguesFromCloud().then(() => {
      // 从URL参数或全局状态获取当前对话ID
      let dialogueId = this.data.currentDialogue;
      
      // 如果URL中有对话ID参数，则使用该参数
      if (options && options.reset) {
        // 重置为第一段对话
        dialogueId = 1;
        if (app.globalData && app.globalData.gameData) {
          app.globalData.gameData.currentDialogue = 1;
          app.globalData.gameData.dialogues = [];
          // 清零上一局留下的统计数据
          app.globalData.gameData.correctCount = 0;
          app.globalData.gameData.wrongCount = 0;
          app.globalData.gameData.currentCombo = 0;
          app.globalData.gameData.maxCombo = 0;
          // 记录本轮开始前的点数，用于中途退出时还原
          app.globalData.gameData.basePoints = app.globalData.gameData.points || 0;
        }
      } else if (options && options.dialogueId) {
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
        currentDialogue: dialogueId,
        pageReady: true  // 标记页面已准备好
      });
      
      // 更新全局状态中的当前对话ID
      if (app.globalData && app.globalData.gameData) {
        app.globalData.gameData.currentDialogue = dialogueId;
      }
      
      // 加载对话
      this.loadDialogue(dialogueId);
      
      console.log('当前对话ID:', dialogueId);
      console.log('游戏数据:', this.data.gameData);
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
    if (this.audioContext) {
      this.audioContext.stop();
    }
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

    return new Promise((resolve, reject) => {
      const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
      // 若后续新增 Session，只需在此数组中补充即可
      const sessions = ['Session1', 'Session2'];

      // 针对每个 Session 取 content.json
      const sessionPromises = sessions.map(session => {
        const fileID = `${envPrefix}/${session}/content.json`;
        return wx.cloud.getTempFileURL({
          fileList: [{ fileID, maxAge: 60 * 60 }]
      }).then(res => {
          console.log('【getTempFileURL-content.json】', session, res);
          const tempURL = res.fileList[0].tempFileURL;
          // 再请求 JSON 内容
          return new Promise((resolveInner, rejectInner) => {
        wx.request({
              url: tempURL,
              success: r => {
                // 给每条对话打上所属 Session 标记，方便之后拼音频路径
                const dialoguesWithSession = (r.data || []).map(d => ({ ...d, session }));
                resolveInner(dialoguesWithSession);
              },
              fail: err => {
                console.error(`获取 ${session} content.json 失败`, err);
                // ---------- 新增：尝试使用 downloadFile 备用方案（不受 request 域名限制） ----------
                wx.cloud.downloadFile({ fileID }).then(dlRes => {
                  const tempFilePath = dlRes.tempFilePath;
                  if (!tempFilePath) {
                    rejectInner(err);
                    return;
                  }
                  const fs = wx.getFileSystemManager();
                  fs.readFile({
                    filePath: tempFilePath,
                    encoding: 'utf8',
                    success: readRes => {
                      try {
                        const jsonData = JSON.parse(readRes.data || '[]');
                        const dialoguesWithSession = (jsonData || []).map(d => ({ ...d, session }));
                        resolveInner(dialoguesWithSession);
                      } catch (parseErr) {
                        console.error(`解析 ${session} content.json 失败`, parseErr);
                        rejectInner(parseErr);
                      }
                    },
                    fail: readErr => {
                      console.error(`读取 ${session} content.json 失败`, readErr);
                      rejectInner(readErr);
                    }
                  });
                }).catch(dlErr => {
                  console.error(`downloadFile ${session} content.json 失败`, dlErr);
                  rejectInner(dlErr);
                });
              }
            });
          });
        });
      });
      
      // 全部 Session 加载完毕后合并对话并随机抽取 (改为 Promise.allSettled 容错)
      Promise.allSettled(sessionPromises).then(results => {
        const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        if (!fulfilled.length) {
          throw new Error('所有 Session 均加载失败');
        }
        const allDialogues = [].concat(...fulfilled);
        console.log('已加载 Session 对话总数:', allDialogues.length);

        const gameDialogues = this.selectRandomDialogues(allDialogues, 10);
        this.setData({
          cloudDialogues: allDialogues,
          gameDialogues
        });
        if (app.globalData) {
          app.globalData.gameDialogues = gameDialogues;
          app.globalData.totalDialoguesCount = allDialogues.length; // 记录总对话数量
        }
        resolve();
      }).catch(err => {
        console.error('加载多 Session 对话失败', err && (err.errMsg || err.message || err));
        reject(err);
      });
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
    const uniqueMap = new Map(); // conversation_id -> dialogue
    validDialogues.forEach(d => {
      const cid = d.conversation_id;
      if (!cid || heardSet.has(cid)) return; // 无效或已听过

      if (!uniqueMap.has(cid)) {
        // 直接存
        uniqueMap.set(cid, d);
      } else {
        // 已存在相同 cid（跨 Session）。随机保留一个，增加多样性
        if (Math.random() < 0.5) {
          uniqueMap.set(cid, d);
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
      // 若 dialogues 已被清空，说明是新一局，重置连击及计数数据
      if (Array.isArray(app.globalData.gameData.dialogues) && app.globalData.gameData.dialogues.length === 0) {
        app.globalData.gameData.correctCount = 0;
        app.globalData.gameData.wrongCount = 0;
        app.globalData.gameData.currentCombo = 0;
        app.globalData.gameData.maxCombo = 0;
        // 更新basePoints为新一局的起始点数
        app.globalData.gameData.basePoints = app.globalData.gameData.points || 0;
      }
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
      
      // 直接使用对话类型作为正确答案(HH/HM/MH)
      const answer = dialogue.type;
      
      // 保存当前音频ID与所属 Session
      const currentAudioId = dialogue.conversation_id;
      const currentAudioSession = dialogue.session || 'Session2'; // 兼容旧数据
      
      this.setData({
        messages: messages,
        currentAnswer: answer,
        currentAudioId: currentAudioId,
        currentAudioSession: currentAudioSession,
        isExpanded: false, // 重置展开状态
        isPlaying: false // 重置播放状态
      });
      
      // 更新展示的对话
      this.updateDisplayMessages(messages, false);
      
      // 预加载音频
      this.preloadAudio(currentAudioId, currentAudioSession);
      
      console.log('加载对话:', dialogue.conversation_id, '答案:', answer);
      // 调试输出当前对话的正确答案
      console.debug('【DEBUG】当前对话正确答案:', answer);
    }
  },
  
  // 预加载音频
  preloadAudio(audioId, session) {
    if (!audioId) return;
    
    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
    const fileID = `${envPrefix}/${session}/${audioId}.wav`;

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
          // 退出挑战时恢复到挑战开始前的点数
          if (app.globalData && app.globalData.gameData && typeof app.globalData.gameData.basePoints === 'number') {
            app.globalData.gameData.points = app.globalData.gameData.basePoints;
            // 清空本轮对话记录，防止中途退出写入 summary
            app.globalData.gameData.dialogues = [];
            app.globalData.gameData.correctCount = 0;
            app.globalData.gameData.wrongCount = 0;
            app.globalData.gameData.currentCombo = 0;
            app.globalData.gameData.maxCombo = app.globalData.gameData.maxCombo || 0; // 保持历史最大连击
          }
    // 触发系统返回行为，会自动调用返回确认
    wx.navigateBack({
      delta: 1
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

    // 如果已经加载过当前音频，直接播放
    if (this.audioContext.src && (this.audioContext.src.includes(this.data.currentAudioId) || this.audioContext.src.startsWith('wxfile://'))) {
      this.audioContext.play();
      return;
    }

    // 否则重新加载音频URL并播放
    const envPrefix = 'cloud://cloud1-8gbjshfgf7c95b79.636c-cloud1-8gbjshfgf7c95b79-1367575007/Audio';
    const session = this.data.currentAudioSession || 'Session2';
    const audioFileID = `${envPrefix}/${session}/${this.data.currentAudioId}.wav`;

    // 使用 downloadFile 下载后播放（避免再次 waiting）
    wx.cloud.downloadFile({ fileID: audioFileID }).then(res => {
      const localPath = res.tempFilePath;
      this.setData({ localAudioPath: localPath });
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
    gameData.heardDialogues = gameData.heardDialogues || new Set();
    
    if (isCorrect) {
      // 判断正确
      gameData.correctCount++;
      gameData.currentCombo++;
      
      // 更新最大连击数
      if (gameData.currentCombo > gameData.maxCombo) {
        gameData.maxCombo = gameData.currentCombo;
      }
      
      // 计算得分：基础 +1，若当前连击 ≥3 再额外 +2（共计3分）
      let pointsToAdd = 1;
      if (gameData.currentCombo >= 3) {
        pointsToAdd += 2;
      }
      gameData.points += pointsToAdd;
    } else {
      // 判断错误
      gameData.wrongCount++;
      gameData.currentCombo = 0; // 重置连击
      
      // 扣分，但不低于0
      gameData.points = Math.max(0, gameData.points - 2);
    }
    
    // 记录本次对话结果，包含正确答案及音频ID（conversationId）
    gameData.dialogues.push({
      id: this.data.currentDialogue,              // 本地对话序号 1-10
      conversationId: this.data.currentAudioId,  // 云端 conversation_id / 音频ID
      correctAnswer: this.data.currentAnswer,    // HH / HM / MH
      userAnswer: judgment,                      // 用户选择
      isCorrect: isCorrect                       // 是否判定正确
    });
    
    // 保存游戏数据到全局状态
    if (app.globalData) {
      app.globalData.gameData = gameData;
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
    
    // 停止音频播放
    if (this.audioContext) {
      this.audioContext.stop();
      this.setData({ isPlaying: false });
    }
    
    // 跳转到结果页
    wx.redirectTo({
      url: `/pages/result/result?dialogueId=${this.data.currentDialogue}&judgment=${judgment}&isCorrect=${isCorrect}&combo=${gameData.currentCombo}`
    });
  }
}) 