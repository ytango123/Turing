const { createPage } = require('../../utils/basePage');
const { t } = require('../../utils/i18n');

createPage({
  pageKey: 'campus',
  i18nKeys: {
    navTitle: 'navTitle',
    goComplete: 'goComplete',
    claimReward: 'claimReward',
    invitedCount: 'invitedCount',
    invitedText: 'invitedText',
    // 添加邀请弹窗相关i18n键
    inviteTitle: 'inviteTitle',
    inviteContent: 'inviteContent',
    copyButton: 'copyButton',
    codeCopied: 'codeCopied'
  },

  data: {
    navTitle: '',
    language: wx.getStorageSync('language') || 'zh',
    currentLang: wx.getStorageSync('language') || 'zh',
    inviteTask: {
      completed: false,
      claimed: false,
      inProgress: false,
      invitedCount: 0,
      invitedUsers: [] // 存储已邀请的用户ID
    },
    // 添加导航栏相关数据
    navBarHeight: 0,
    menuButtonInfo: null,
    statusBarHeight: 0,
    // 语言相关的SVG路径
    topCardSvg: '/assets/images/campus/top-card_zh.svg',
    friendsCardSvg: '/assets/images/campus/friends-card_zh.svg',
    signInCardSvg: '/assets/images/campus/check-in-card_zh.svg',
    drawCardSvg: '/assets/images/campus/draw-card_zh.svg',
    giftCardSvg: '/assets/images/campus/gift-card_zh.svg',
    // 添加语言相关文本
    invitedText: '已邀请',
    // 任务按钮文本
    goComplete: '去完成',
    claimReward: '领取奖励',
    // 邀请弹窗相关
    showInviteModal: false,
    inviteCode: '', // 用户唯一邀请码
    // 邀请弹窗文本
    inviteTitle: '邀请好友获得金币',
    inviteContent: '每位用户至多邀请五位好友，邀请越多，金币奖励越多！',
    copyButton: '复制邀请码并分享',
    codeCopied: '邀请码已复制',
    // 奖励金币数量（递增）
    inviteRewards: [30, 40, 50, 60, 70],
    // 是否显示邀请任务
    showInviteTask: true,
    // 邀请码相关字段
    inviteCodeFields: {
      inviteCode: '', // 用户自己的邀请码
      invitedUsers: [], // 被邀请用户的openid数组
      inviterID: '', // 邀请者的openid
      claimCount: 0 // 领奖次数
    }
  },

  onLoad() {
    const language = wx.getStorageSync('language') || 'zh';
    this.setData({ 
      language, 
      currentLang: language,
      // 初始化按钮文本
      goComplete: this.data.t.goComplete || (language === 'en' ? 'ACTION' : '去完成'),
      claimReward: this.data.t.claimReward || (language === 'en' ? 'CLAIM' : '领取奖励'),
      // 初始化邀请弹窗文本
      inviteTitle: this.data.t.inviteTitle || (language === 'en' ? 'Invite Friends for Coins' : '邀请好友获得金币'),
      inviteContent: this.data.t.inviteContent || (language === 'en' ? 'Each user can invite up to 5 friends. More invitations, more coin rewards!' : '每位用户至多邀请五位好友，邀请越多，金币奖励越多！'),
      copyButton: this.data.t.copyButton || (language === 'en' ? 'Copy Code and Share' : '复制邀请码并分享'),
      codeCopied: this.data.t.codeCopied || (language === 'en' ? 'Code copied!' : '邀请码已复制')
    });
    
    // 打印当前 t 对象，用于调试
    console.log('Campus page t object:', this.data.t);
    console.log('Campus page language:', language);
    
    this.loadTaskStatus();
    this.getNavBarInfo();
    this.refreshLanguageDependentData(language);
    
    // 检查用户登录状态，然后初始化邀请码字段
    this.checkUserAndInitInviteCode();
  },

  /** 检查用户登录状态并初始化邀请码字段 */
  checkUserAndInitInviteCode() {
    const app = getApp();
    
    // 如果用户已登录，直接初始化
    if (app && app.globalData && app.globalData.userInfo && app.globalData.userInfo._openid) {
      this.initInviteCodeFields();
      return;
    }
    
    // 如果用户未登录，等待登录完成
    if (app && app.globalData && app.globalData.openid) {
      // 等待用户信息加载完成
      const checkInterval = setInterval(() => {
        if (app.globalData.userInfo && app.globalData.userInfo._openid) {
          clearInterval(checkInterval);
          this.initInviteCodeFields();
        }
      }, 100);
      
      // 设置超时，避免无限等待
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('等待用户登录超时');
      }, 5000);
    } else {
      console.log('用户未登录，延迟初始化邀请码字段');
    }
  },

  onShow() {
    // 检查语言是否变化
    const language = wx.getStorageSync('language') || 'zh';
    if (this.data.language !== language) {
      this.setData({ language, currentLang: language });
      this.refreshLanguageDependentData(language);
    }
    
    // 重新加载任务状态和邀请码字段
    this.loadTaskStatus();
    
    // 如果用户已登录，重新初始化邀请码字段
    const app = getApp();
    if (app && app.globalData && app.globalData.userInfo && app.globalData.userInfo._openid) {
      this.initInviteCodeFields();
    }
  },

  /** 获取导航栏信息 */
  getNavBarInfo() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    
    // 导航栏高度 = 状态栏高度 + 胶囊高度 + (胶囊顶部距离状态栏底部的距离) * 2
    const navBarHeight = systemInfo.statusBarHeight + menuButtonInfo.height + (menuButtonInfo.top - systemInfo.statusBarHeight) * 2;
    
    this.setData({
      navBarHeight,
      menuButtonInfo,
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  /** 初始化邀请码字段并同步到云端 */
  initInviteCodeFields() {
    const app = getApp();
    if (!app || !app.globalData || !app.globalData.userInfo || !app.globalData.userInfo._openid) {
      console.log('用户未登录，延迟初始化邀请码字段');
      return;
    }

    const db = wx.cloud.database();
    const openid = app.globalData.userInfo._openid;

    // 查询用户数据，检查是否已有邀请码字段
    db.collection('users').where({
      _openid: openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        const userData = res.data[0];
        
        // 检查是否需要初始化邀请码字段
        const needsInit = !userData.inviteCode || 
                         userData.invitedUsers === undefined || 
                         userData.inviterID === undefined || 
                         userData.claimCount === undefined;

        if (needsInit) {
          // 初始化邀请码字段
          this.initializeInviteCodeFields(userData);
        } else {
          // 已有字段，直接使用
          this.setData({
            inviteCode: userData.inviteCode || '',
            'inviteCodeFields.inviteCode': userData.inviteCode || '',
            'inviteCodeFields.invitedUsers': userData.invitedUsers || [],
            'inviteCodeFields.inviterID': userData.inviterID || '',
            'inviteCodeFields.claimCount': userData.claimCount || 0
          });
          
          // 更新邀请任务状态
          this.updateInviteTaskStatus();
        }
      }
    }).catch(err => {
      console.error('查询用户邀请码字段失败', err);
    });
  },

  /** 初始化邀请码字段 */
  initializeInviteCodeFields(userData) {
    const app = getApp();
    const db = wx.cloud.database();
    const openid = app.globalData.userInfo._openid;

    // 生成邀请码
    const inviteCode = this.generateInviteCode();
    
    // 准备更新的字段
    const updateData = {
      inviteCode: inviteCode,
      invitedUsers: userData.invitedUsers || [],
      inviterID: userData.inviterID || '',
      claimCount: userData.claimCount || 0,
      updateTime: db.serverDate()
    };

    // 更新到云端
    db.collection('users').where({
      _openid: openid
    }).update({
      data: updateData
    }).then(() => {
      console.log('邀请码字段初始化成功');
      
      // 更新本地数据
      this.setData({
        inviteCode: inviteCode,
        'inviteCodeFields.inviteCode': inviteCode,
        'inviteCodeFields.invitedUsers': updateData.invitedUsers,
        'inviteCodeFields.inviterID': updateData.inviterID,
        'inviteCodeFields.claimCount': updateData.claimCount
      });
      
      // 更新邀请任务状态
      this.updateInviteTaskStatus();
    }).catch(err => {
      console.error('初始化邀请码字段失败', err);
    });
  },

  /** 更新邀请任务状态 */
  updateInviteTaskStatus() {
    const invitedCount = this.data.inviteCodeFields.invitedUsers.length;
    const claimCount = this.data.inviteCodeFields.claimCount;
    
    // 判断是否有可领取的奖励
    const hasUnclaimedRewards = invitedCount > claimCount;
    
    // 判断是否已完成（邀请5人且已领取所有奖励）
    const isCompleted = invitedCount >= 5 && claimCount >= 5;
    
    this.setData({
      'inviteTask.invitedCount': invitedCount,
      'inviteTask.invitedUsers': this.data.inviteCodeFields.invitedUsers,
      'inviteTask.completed': isCompleted,
      'inviteTask.claimed': !hasUnclaimedRewards,
      'inviteTask.inProgress': invitedCount > 0 && invitedCount < 5,
      'showInviteTask': !isCompleted
    });
  },

  /** 加载任务状态 */
  loadTaskStatus() {
    // 从云数据库加载任务状态
    const app = getApp();
    if (app && app.globalData && app.globalData.userInfo && app.globalData.userInfo._openid) {
      // 如果已经登录，从云数据库加载
      this.loadInviteTaskFromCloud();
    } else {
      // 否则从本地存储加载
      const inviteTask = wx.getStorageSync('inviteTask') || {
        completed: false,
        claimed: false,
        inProgress: false,
        invitedCount: 0,
        invitedUsers: []
      };
      
      // 检查是否应该显示邀请任务
      const showInviteTask = inviteTask.invitedCount < 5 || (inviteTask.completed && !inviteTask.claimed);
      
      this.setData({
        inviteTask,
        showInviteTask
      });
    }
  },

  /** 从云数据库加载邀请任务状态 */
  loadInviteTaskFromCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    
    const db = wx.cloud.database();
    const app = getApp();
    const openid = app.globalData.userInfo._openid;
    
    // 查询用户邀请数据
    db.collection('users').where({
      _openid: openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        const userData = res.data[0];
        
                  // 更新邀请码字段和金币数据
          const gameData = userData.gameData || {};
          const coins = gameData.coins || 0; // 只从gameData中读取金币数据
          
          this.setData({
            inviteCode: userData.inviteCode || '',
            'inviteCodeFields.inviteCode': userData.inviteCode || '',
            'inviteCodeFields.invitedUsers': userData.invitedUsers || [],
            'inviteCodeFields.inviterID': userData.inviterID || '',
            'inviteCodeFields.claimCount': userData.claimCount || 0,
            coins: coins // 设置金币数据
          });
        
        // 更新邀请任务状态
        this.updateInviteTaskStatus();
        
        // 同步到本地存储
        wx.setStorageSync('inviteTask', this.data.inviteTask);
      }
    }).catch(err => {
      console.error('加载邀请任务状态失败', err);
    });
  },

  /** 获取或生成用户唯一邀请码 */
  getUserInviteCode() {
    // 先尝试从本地存储获取
    let inviteCode = wx.getStorageSync('userInviteCode');
    
    if (inviteCode) {
      this.setData({ inviteCode });
      return;
    }
    
    // 如果没有本地存储，检查是否已登录
    const app = getApp();
    if (app && app.globalData && app.globalData.userInfo && app.globalData.userInfo._openid) {
      // 已登录，从云数据库获取或生成
      this.getInviteCodeFromCloud();
    } else {
      // 未登录，生成临时邀请码
      this.generateInviteCode();
    }
  },

  /** 从云数据库获取邀请码 */
  getInviteCodeFromCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.generateInviteCode();
      return;
    }
    
    const db = wx.cloud.database();
    const app = getApp();
    const openid = app.globalData.userInfo._openid;
    
    // 查询用户数据
    db.collection('users').where({
      _openid: openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        const userData = res.data[0];
        
        if (userData.inviteCode) {
          // 用户已有邀请码
          this.setData({ inviteCode: userData.inviteCode });
          wx.setStorageSync('userInviteCode', userData.inviteCode);
        } else {
          // 用户没有邀请码，生成并保存
          this.generateAndSaveInviteCode(openid);
        }
      } else {
        // 没有找到用户数据，生成临时邀请码
        this.generateInviteCode();
      }
    }).catch(err => {
      console.error('获取邀请码失败', err);
      this.generateInviteCode();
    });
  },

  /** 生成并保存邀请码到云数据库 */
  generateAndSaveInviteCode(openid) {
    // 生成邀请码
    this.generateInviteCode();
    
    // 保存到云数据库
    if (!wx.cloud) {
      return;
    }
    
    const db = wx.cloud.database();
    
    db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        inviteCode: this.data.inviteCode
      }
    }).then(() => {
      console.log('邀请码保存成功');
      wx.setStorageSync('userInviteCode', this.data.inviteCode);
    }).catch(err => {
      console.error('保存邀请码失败', err);
    });
  },

  /** 生成随机邀请码 */
  generateInviteCode() {
    // 生成6位随机字母数字组合的邀请码
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let inviteCode = '';
    for (let i = 0; i < 6; i++) {
      inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    this.setData({ inviteCode });
    // 保存到本地存储
    wx.setStorageSync('userInviteCode', inviteCode);
    return inviteCode; // <--- 返回生成结果
  },

  /** 首次生成并同步邀请码（在弹窗打开前调用） */
  createAndSyncInviteCode() {
    return new Promise((resolve, reject) => {
      const code = this.generateInviteCode();
      const app = getApp();
      // 若已登录且有云环境，写入云端
      if (wx.cloud && app && app.globalData && app.globalData.userInfo && app.globalData.userInfo._openid) {
        const db = wx.cloud.database();
        const openid = app.globalData.userInfo._openid;
        db.collection('users').where({ _openid: openid }).update({
          data: { inviteCode: code }
        }).then(() => {
          console.log('邀请码已同步至云端');
          resolve();
        }).catch(err => {
          console.error('同步邀请码至云端失败', err);
          // 失败也不阻塞 UI
          resolve();
        });
      } else {
        // 未登录或无云能力，直接完成
        resolve();
      }
    });
  },

  /** 邀请好友功能 */
  onInviteFriends() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    // 检查是否有可领取的奖励
    const invitedCount = this.data.inviteCodeFields.invitedUsers.length;
    const claimCount = this.data.inviteCodeFields.claimCount;
    
    if (invitedCount > claimCount) {
      // 有可领取的奖励，执行领奖逻辑
      this.claimReward();
      return;
    }
    
    // 若尚未生成邀请码，则先生成并同步后再显示弹窗
    if (!this.data.inviteCode) {
      this.createAndSyncInviteCode().then(() => {
        this.setData({ showInviteModal: true });
      });
    } else {
      // 直接显示邀请弹窗
      this.setData({ showInviteModal: true });
    }
  },

  /** 关闭邀请弹窗 */
  closeInviteModal() {
    this.setData({
      showInviteModal: false
    });
  },

  /** 防止冒泡 */
  preventBubble() {
    // 阻止事件冒泡
    return;
  },

  /** 复制邀请码并分享 */
  copyInviteCode() {
    // 震动反馈 - 立即在按钮点击时触发
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    const inviteCode = this.data.inviteCode;
    
    if (!inviteCode) {
      wx.showToast({
        title: this.data.language === 'en' ? 'No invite code' : '邀请码生成失败',
        icon: 'none'
      });
      return;
    }
    
    // 复制邀请码到剪贴板
    wx.setClipboardData({
      data: inviteCode,
      success: () => {
        // 显示复制成功提示
        wx.showToast({
          title: this.data.codeCopied,
          icon: 'success',
          duration: 1500
        });
        
        // 不立即关闭弹窗，而是等待提示显示完毕后再关闭
        // 延迟时间设置为 1500ms (与提示持续时间一致)，让用户能完整看到提示
        setTimeout(() => {
          // 关闭邀请弹窗
          this.setData({ showInviteModal: false });
          
                      // 再延迟一段时间后触发分享菜单
            setTimeout(() => {
              // 触发分享菜单
        wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline']
            });
          }, 500); // 关闭弹窗后再等待500ms触发分享
        }, 1500);
      },
      fail: () => {
        wx.showToast({
          title: this.data.language === 'en' ? 'Copy failed' : '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /** 领取奖励 */
  claimReward() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }

    wx.showLoading({
      title: this.data.language === 'en' ? 'Claiming...' : '领取中...'
    });

    // 计算总奖励金额
    const totalReward = this.calculateTotalReward();

    // 更新云数据库
    this.updateClaimStatusInCloud(totalReward);
  },

  /** 计算总奖励金额 */
  calculateTotalReward() {
    const invitedCount = this.data.inviteCodeFields.invitedUsers.length;
    const claimCount = this.data.inviteCodeFields.claimCount;
    let totalReward = 0;
    
    // 计算未领取的奖励
    for (let i = claimCount; i < Math.min(invitedCount, 5); i++) {
      totalReward += this.data.inviteRewards[i];
    }
    
    return totalReward;
  },

  /** 更新云数据库中的领取状态 */
  updateClaimStatusInCloud(totalReward) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.handleClaimSuccess(totalReward);
      return;
    }
    
    const db = wx.cloud.database();
    const app = getApp();
    
    if (!app || !app.globalData || !app.globalData.userInfo || !app.globalData.userInfo._openid) {
      console.error('用户未登录');
      this.handleClaimSuccess(totalReward);
      return;
    }
    
    const openid = app.globalData.userInfo._openid;
    const newClaimCount = this.data.inviteCodeFields.invitedUsers.length;
    
    // 更新用户数据
    db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        claimCount: newClaimCount,
        // 只更新gameData中的coins字段
        'gameData.coins': db.command.inc(totalReward)
      }
    }).then(() => {
      console.log('奖励领取成功');
      
      // 同步更新全局数据中的金币数量
      if (app.globalData && app.globalData.gameData) {
        const currentCoins = app.globalData.gameData.coins || 0;
        app.globalData.gameData.coins = currentCoins + totalReward;
        console.log('更新全局金币数据:', currentCoins, '+', totalReward, '=', app.globalData.gameData.coins);
      }
      
      this.handleClaimSuccess(totalReward);
    }).catch(err => {
      console.error('奖励领取失败', err);
      wx.hideLoading();
      wx.showToast({
        title: this.data.language === 'en' ? 'Failed to claim' : '领取失败',
        icon: 'none'
      });
    });
  },

  /** 处理领取成功 */
  handleClaimSuccess(totalReward) {
    wx.hideLoading();
    
    // 更新本地状态
    const newClaimCount = this.data.inviteCodeFields.invitedUsers.length;
    
    // 更新当前页面的金币显示
    const app = getApp();
    const currentCoins = app.globalData && app.globalData.gameData ? 
      (app.globalData.gameData.coins || 0) : 0;
    
    this.setData({
      'inviteCodeFields.claimCount': newClaimCount,
      // 更新当前页面显示的金币数量
      coins: currentCoins
    });
    
    // 更新邀请任务状态
    this.updateInviteTaskStatus();
    
    // 更新本地存储
    const inviteTask = this.data.inviteTask;
    wx.setStorageSync('inviteTask', inviteTask);
    
    // 显示成功提示
    wx.showToast({
      title: this.data.language === 'en' 
        ? `Success! +${totalReward} coins` 
        : `领取成功！+${totalReward}金币`,
      icon: 'success',
      duration: 2000
    });
  },

  /** 底部 TabBar 点击时震动反馈 */
  onTabItemTap(item) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
  },

  /** 分享配置 - 当用户点击分享按钮时自动调用 */
  onShareAppMessage() {
    const language = wx.getStorageSync('language') || 'zh';
    const inviteCode = this.data.inviteCode;
    
    console.log('触发分享，邀请码:', inviteCode);
    
    return {
      title: language === 'en' ? 
        `Join the Turing Dialogue Challenge! Use my code: ${inviteCode}` : 
        `别笑，你试你也分不清人类和AI！邀请码：${inviteCode}`,
      path: `/pages/game-home/game-home?inviteCode=${inviteCode}`,
      imageUrl: '/assets/figma/share2.png',
      success: () => {
        console.log('分享成功');
        this.onShareSuccess();
      },
      fail: () => {
        console.log('分享失败');
      }
    };
  },

  onShareTimeline() {
    const language = wx.getStorageSync('language') || 'zh';
    const inviteCode = this.data.inviteCode;
    
    return {
      title: language === 'en' ? 
        `Join the Turing Dialogue Challenge! Use my code: ${inviteCode}` : 
        `别笑，你试你也分不清人类和AI！邀请码：${inviteCode}`,
      query: `inviteCode=${inviteCode}`,
      imageUrl: '/assets/figma/share2.png'
    };
  },

  /** 分享成功处理 */
  onShareSuccess() {
    console.log('分享成功');
    
    // 更新任务状态
    this.setData({
      'inviteTask.inProgress': true
    });
    
    // 同步到本地存储
    wx.setStorageSync('inviteTask', this.data.inviteTask);
    
    // 显示成功提示
    wx.showToast({
      title: this.data.language === 'en' ? 'Shared successfully!' : '分享成功！',
      icon: 'success',
      duration: 2000
    });
    
    // 重新加载任务状态，确保数据同步
    this.loadTaskStatus();
  },

  /** 签到任务 */
  onSignInTask() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.showToast({
      title: '签到功能开发中',
      icon: 'none'
    });
  },

  /** 大转盘任务 */
  onDrawTask() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.showToast({
      title: '大转盘功能开发中',
      icon: 'none'
    });
  },

  /** 打卡好礼任务 */
  onGiftTask() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    wx.showToast({
      title: '打卡好礼功能开发中',
      icon: 'none'
    });
  },

  /** 语言切换后刷新动态文本和资源 */
  refreshLanguageDependentData(language) {
    const langCode = language === 'en' ? 'en' : 'zh';
    // 更新不同语言的 SVG 资源路径
    this.setData({
      topCardSvg: `/assets/images/campus/top-card_${langCode}.svg`,
      friendsCardSvg: `/assets/images/campus/friends-card_${langCode}.svg`,
      signInCardSvg: `/assets/images/campus/check-in-card_${langCode}.svg`,
      drawCardSvg: `/assets/images/campus/draw-card_${langCode}.svg`,
      giftCardSvg: `/assets/images/campus/gift-card_${langCode}.svg`,
      // 语言相关文本
      invitedText: language === 'en' ? 'Invited ' : '已邀请',
      // 邀请弹窗文本
      inviteTitle: this.data.t.inviteTitle || (language === 'en' ? 'Invite Friends for Coins' : '邀请好友获得金币'),
      inviteContent: this.data.t.inviteContent || (language === 'en' ? 'Each user can invite up to 5 friends. More invitations, more coin rewards!' : '每位用户至多邀请五位好友，邀请越多，金币奖励越多！'),
      copyButton: this.data.t.copyButton || (language === 'en' ? 'Copy Code and Share' : '复制邀请码并分享'),
      codeCopied: this.data.t.codeCopied || (language === 'en' ? 'Code copied!' : '邀请码已复制'),
      // 确保导航栏标题也被更新
      navTitle: this.data.t.navTitle || (language === 'en' ? 'Campus' : '校园'),
      // 更新任务按钮文本
      goComplete: this.data.t.goComplete || (language === 'en' ? 'ACTION' : '去完成'),
      claimReward: this.data.t.claimReward || (language === 'en' ? 'CLAIM' : '领取奖励')
    });
  }
}); 