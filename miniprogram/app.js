// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'turing-0gnrkrhx98fccb50', // 云环境ID
        traceUser: true, // 是否将用户访问记录到用户管理中，在控制台可见
      })
      console.log('云环境初始化成功')
      
      // 获取用户openid并检查是否已注册
      this.getUserInfo()
    }
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
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
    
    // 构建用户数据
    const userData = {
      ...userInfo,
      gameData: this.globalData.gameData,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
    
    return db.collection('users').add({
      data: userData
    }).then(res => {
      console.log('用户注册成功', res)
      this.globalData.userInfo = userData
      this.globalData.isNewUser = false
      return res
    }).catch(err => {
      console.error('用户注册失败', err)
      return Promise.reject(err)
    })
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
      achievements: []
    }
  }
}) 