const { createPage } = require('../../utils/basePage')
const { t } = require('../../utils/i18n')

createPage({
  pageKey: 'editProfile',
  i18nKeys: {
    navTitle: 'navTitle',
    avatarHint: 'avatarHint',
    nickLabel: 'nickLabel',
    nickPlaceholder: 'nickPlaceholder',
    ageLabel: 'ageLabel',
    genderLabel: 'genderLabel',
    educationLabel: 'educationLabel',
    saveButton: 'saveButton',
    pleaseFillNick: 'pleaseFillNick',
    uploading: 'uploading',
    uploadFailed: 'uploadFailed',
    saveSuccess: 'saveSuccess',
    saveFailed: 'saveFailed'
  },

  data: {
    avatarUrl: '',
    nickname: '',
    userInitial: 'T',
    ages: [],
    ageIndex: 0,
    genders: [],
    genderIndex: 0,
    educations: [],
    educationIndex: 0,
    isSubmitting: false
  },

  onLoad() {
    // 设置多语言下拉选项
    this.updatePickerOptions()

    // 预填充数据
    const userDoc = getApp().globalData.userInfo || {}
    const avatarUrl = userDoc.avatarUrl || ''
    const nickname = userDoc.nickname || `用户${(getApp().globalData.openid || '').slice(-4)}`

    const ageIdx = this.data.ages.indexOf(userDoc.age)
    const genderIdx = this.data.genders.indexOf(userDoc.gender)
    const eduIdx = this.data.educations.indexOf(userDoc.education)

    this.setData({
      avatarUrl,
      nickname,
      userInitial: nickname ? nickname.charAt(0) : 'T',
      ageIndex: ageIdx >= 0 ? ageIdx : 0,
      genderIndex: genderIdx >= 0 ? genderIdx : 0,
      educationIndex: eduIdx >= 0 ? eduIdx : 0
    })
  },

  // 在语言变化时更新下拉选项
  onShow() {
    this.updatePickerOptions()
  },

  updatePickerOptions() {
    const language = wx.getStorageSync('language') || 'zh'
    this.setData({
      ages: t('editProfile.ages', language),
      genders: t('editProfile.genders', language),
      educations: t('editProfile.educations', language)
    })
  },

  onBackTap() {
    wx.navigateBack()
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempPath = res.tempFilePaths[0]
        wx.showLoading({ title: this.data.t.uploading, mask: true })
        const cloudPath = `userAvatars/${getApp().globalData.openid}_${Date.now()}.png`
        wx.cloud.uploadFile({ cloudPath, filePath: tempPath })
          .then(uploadRes => {
            this.setData({ avatarUrl: uploadRes.fileID })
            wx.hideLoading()
          })
          .catch(err => {
            console.error('头像上传失败', err)
            wx.hideLoading()
            wx.showToast({ title: this.data.t.uploadFailed, icon: 'none' })
          })
      }
    })
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },
  onAgeChange(e) {
    this.setData({ ageIndex: e.detail.value })
  },
  onGenderChange(e) {
    this.setData({ genderIndex: e.detail.value })
  },
  onEducationChange(e) {
    this.setData({ educationIndex: e.detail.value })
  },

  saveProfile() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const { avatarUrl, nickname, ages, ageIndex, genders, genderIndex, educations, educationIndex } = this.data
    if (!nickname) {
      wx.showToast({ title: this.data.t.pleaseFillNick, icon: 'none' })
      return
    }

    // 更新本地全局数据
    if (!getApp().globalData.userInfo) {
      getApp().globalData.userInfo = {}
    }
    Object.assign(getApp().globalData.userInfo, {
      avatarUrl,
      nickname,
      age: ages[ageIndex],
      gender: genders[genderIndex],
      education: educations[educationIndex]
    })

    const db = wx.cloud.database()
    if (!getApp().globalData.openid) {
      wx.showToast({ title: '未登录', icon: 'none' })
      return
    }

    db.collection('users').where({ _openid: getApp().globalData.openid }).update({
      data: {
        avatarUrl,
        nickname,
        age: ages[ageIndex],
        gender: genders[genderIndex],
        education: educations[educationIndex],
        updateTime: db.serverDate()
      }
    }).then(() => {
      wx.showToast({ title: this.data.t.saveSuccess, icon: 'success' })
      setTimeout(() => { wx.navigateBack() }, 800)
    }).catch(err => {
      console.error('保存用户信息失败', err)
      wx.showToast({ title: this.data.t.saveFailed, icon: 'none' })
    })
  }
}) 