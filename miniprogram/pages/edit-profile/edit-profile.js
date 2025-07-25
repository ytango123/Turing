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
    aiFamiliarityLabel: 'aiFamiliarityLabel',
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
    aiFamiliarityIndex: 0,
    aiFamiliarities: [],
    isSubmitting: false
  },

  onLoad() {
    // 获取语言环境
    const language = wx.getStorageSync('language') || 'zh';
    
    // 初始化选项数据
    this.setData({
      ages: t('editProfile.ages', language),
      genders: t('editProfile.genders', language),
      educations: t('editProfile.educations', language),
      aiFamiliarities: t('editProfile.aiFamiliarities', language)
    });
    
    // 获取用户信息
    if (getApp().globalData && getApp().globalData.userInfo) {
      const userInfo = getApp().globalData.userInfo;
      
      this.setData({
        nickname: userInfo.nickname || '',
        avatarUrl: userInfo.avatarUrl || '',
        ageIndex: this.getIndexByValue(this.data.ages, userInfo.age, 'ages'),
        genderIndex: this.getIndexByValue(this.data.genders, userInfo.gender, 'genders'),
        educationIndex: this.getIndexByValue(this.data.educations, userInfo.education, 'educations'),
        aiFamiliarityIndex: this.getIndexByValue(this.data.aiFamiliarities, userInfo.aiFamiliarity, 'aiFamiliarities')
      });
    }
  },

  // 获取选项在数组中的索引（支持跨语言对照）
  getIndexByValue(array, value, category) {
    // 1) 在当前语言选项里查找
    let idx = array.indexOf(value);
    if (idx !== -1) return idx;

    // 2) 若未找到，分别在中英两套文案里查找同一位置
    //    保证同一物理索引在不同语言下含义一致
    const zhArr = t(`editProfile.${category}`, 'zh');
    const enArr = t(`editProfile.${category}`, 'en');
    idx = zhArr.indexOf(value);
    if (idx !== -1) return idx;
    idx = enArr.indexOf(value);
    if (idx !== -1) return idx;
    return 0;
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

  onChooseAvatar(e) {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) return;
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
  onAiFamiliarityChange(e) {
    this.setData({
      aiFamiliarityIndex: e.detail.value
    });
  },

  saveProfile() {
    // 震动反馈
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const { avatarUrl, nickname, ages, ageIndex, genders, genderIndex, educations, educationIndex, aiFamiliarities, aiFamiliarityIndex } = this.data
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
      education: educations[educationIndex],
      aiFamiliarity: aiFamiliarities[aiFamiliarityIndex]
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
        aiFamiliarity: aiFamiliarities[aiFamiliarityIndex],
        updateTime: db.serverDate()
      }
    }).then(() => {
      wx.showToast({ title: this.data.t.saveSuccess })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(err => {
      console.error('保存失败：', err)
      wx.showToast({ title: this.data.t.saveFailed, icon: 'none' })
    })
  }
}) 