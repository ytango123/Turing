// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-8gbjshfgf7c95b79', // 云环境ID
        traceUser: true, // 是否将用户访问记录到用户管理中，在控制台可见
      })
      console.log('云环境初始化成功')
      
      // 获取用户openid并检查是否已注册
      this.getUserInfo()
    }
    
    // 从本地存储获取设置
    let language = wx.getStorageSync('language');
    if (!language) {
      language = 'zh';
      wx.setStorageSync('language', language); // 首次写入默认语言
    }
    const theme = wx.getStorageSync('theme') || 'light';
    
    // 更新全局设置
    this.globalData.language = language;
    this.globalData.theme = theme;
    
    // 应用主题
    this.applyTheme(theme);
    
    // 根据语言更新底部 TabBar 文字
    this.updateTabBarLabels(language);
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  
  // 应用主题
  applyTheme(theme) {
    if (theme === 'dark') {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1f1f1f'
      });
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      });
    }
  },
  // 获取用户信息并检查是否已注册
  getUserInfo() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login',
        success: res => {
          this.globalData.openid = res.result.openid
          console.log('获取openid成功:', res.result.openid)
          
          // 检查用户是否已注册
          this.checkUserRegistered()
            .then(() => resolve(true))
            .catch(err => reject(err))
        },
        fail: err => {
          console.error('获取openid失败', err)
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          })
          reject(err)
        }
      })
    })
  },
  
  // 检查用户是否已注册
  checkUserRegistered() {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      
      db.collection('users').where({
        _openid: this.globalData.openid
      }).get({
        success: res => {
          if (res.data.length > 0) {
            // 用户已注册，获取用户数据
            console.log('用户已注册:', res.data[0])
            this.globalData.userInfo = res.data[0]
            
            // 如果有游戏数据，同步到全局状态
            if (res.data[0].gameData) {
              this.globalData.gameData = res.data[0].gameData
            }
            
            // 标记用户已注册
            this.globalData.isNewUser = false
            resolve(true)
          } else {
            // 用户未注册，记录状态但不立即创建用户
            // 将在用户填写信息后创建用户记录
            console.log('用户未注册')
            this.globalData.isNewUser = true
            resolve(false)
          }
        },
        fail: err => {
          console.error('查询用户失败', err)
          reject(err)
        }
      })
    })
  },
  
  // 检查用户是否已注册（供页面调用）
  isUserRegistered() {
    return new Promise((resolve, reject) => {
      // 如果已经有用户信息，直接返回已注册状态
      if (this.globalData.userInfo) {
        resolve(true)
        return
      }
      
      // 如果已经确认是新用户，直接返回未注册状态
      if (this.globalData.isNewUser === true) {
        resolve(false)
        return
      }
      
      // 如果没有openid，先获取openid
      if (!this.globalData.openid) {
        this.getUserInfo()
          .then(() => {
            // getUserInfo会自动调用checkUserRegistered
            // 所以这里直接根据globalData.isNewUser判断
            resolve(!this.globalData.isNewUser)
          })
          .catch(err => {
            console.error('获取用户信息失败', err)
            reject(err)
          })
      } else {
        // 已有openid但未确定注册状态，检查注册状态
        this.checkUserRegistered()
          .then(isRegistered => {
            resolve(isRegistered)
          })
          .catch(err => {
            reject(err)
          })
      }
    })
  },
  
  // 注册新用户
  registerUser(userInfo) {
    if (!this.globalData.openid) {
      console.error('未获取到openid，无法注册用户')
      return Promise.reject('未获取到openid')
    }
    
    const db = wx.cloud.database()
    
    // 若未提供昵称，则基于 openid 生成唯一默认昵称
    const defaultNickname = `用户${this.globalData.openid.slice(-4)}`

    // 生成邀请码
    const inviteCode = this.generateInviteCode()

    const userData = {
      nickname: userInfo.nickname || defaultNickname,
      ...userInfo,
      gameData: this.globalData.gameData,
      // 邀请码相关字段
      inviteCode: inviteCode,
      invitedUsers: userInfo.invitedUsers || [], // 保留原有的invitedUsers，如果没有则初始化为空数组
      inviterID: userInfo.inviterID || '', // 从userInfo中获取邀请者ID
      claimCount: 0,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
    
    return db.collection('users').add({
      data: userData
    }).then(res => {
      console.log('用户注册成功', res)
      // 确保userInfo包含_openid字段
      this.globalData.userInfo = {
        ...userData,
        _openid: this.globalData.openid,
        _id: res._id
      }
      this.globalData.isNewUser = false
      return res
    }).catch(err => {
      console.error('用户注册失败', err)
      return Promise.reject(err)
    })
  },

  // 生成随机邀请码
  generateInviteCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let inviteCode = '';
    for (let i = 0; i < 6; i++) {
      inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return inviteCode;
  },
  
  // 更新用户游戏数据
  updateUserGameData() {
    if (!this.globalData.openid || !this.globalData.userInfo) {
      console.error('未获取到用户信息，无法更新游戏数据')
      return Promise.reject('未获取到用户信息')
    }
    
    const db = wx.cloud.database()
    
    return db.collection('users').doc(this.globalData.userInfo._id).update({
      data: {
        gameData: this.globalData.gameData,
        updateTime: db.serverDate()
      }
    }).then(res => {
      console.log('游戏数据更新成功', res)
      return res
    }).catch(err => {
      console.error('游戏数据更新失败', err)
      return Promise.reject(err)
    })
  },
  
  // 根据语言更新底部 TabBar 文本
  updateTabBarLabels(language) {
    // 默认中文文案
    const textsZh = ['首页', '校园', '我的'];
    const textsEn = ['Home', 'Campus', 'Profile'];
    const texts = language === 'en' ? textsEn : textsZh;

    texts.forEach((text, idx) => {
      wx.setTabBarItem({
        index: idx,
        text
      });
    });
  },
  
  globalData: {
    openid: null,
    userInfo: null,
    isNewUser: false,
    // 用户游戏数据
    gameData: {
      points: 0,
      level: '新手',
      maxCombo: 0,
      correctCount: 0,
      wrongCount: 0,
      currentCombo: 0,
      dialogues: [],
      completedChallenges: 0,
      achievements: {},
      heardDialogues: [], // 存储用户听过的对话ID
      coins: 0 // 初始化金币字段
    },
    totalDialoguesCount: 0,
    language: 'zh',    // 默认中文
    theme: 'light'     // 默认浅色主题
  }
}) 