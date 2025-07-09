// pages/user-info/user-info.js
const { createPage } = require('../../utils/basePage')

createPage({
  pageKey: 'userInfo',
  i18nKeys: {
    navTitle: 'navTitle',
    progressTitle: 'progressTitle',
    ageTitle: 'ageTitle',
    genderTitle: 'genderTitle',
    educationTitle: 'educationTitle',
    nextButton: 'nextButton',
    privacyNotice: 'privacyNotice',
    pleaseSelect: 'pleaseSelect',
    savingInfo: 'savingInfo',
    saveError: 'saveError'
  },

  data: {
    currentStep: 1,
    totalSteps: 3,
    selectedOption: null,
    
    // 存储用户信息
    userInfo: {
      age: '',
      gender: '',
      education: ''
    },
    
    // 各步骤的选项
    steps: [
      {
        key: 'age',
        options: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上']
      },
      {
        key: 'gender',
        options: ['男', '女', '其他']
      },
      {
        key: 'education',
        options: ['高中及以下', '大专', '本科', '硕士', '博士及以上']
      }
    ]
  },
  
  onLoad() {
    // 初始化第一步
    this.updateStepData();
  },

  updateStepData() {
    const currentStep = this.data.currentStep;
    const stepData = this.data.steps[currentStep - 1];
    // 根据语言选择不同的选项文案
    const language = wx.getStorageSync('language') || 'zh';

    // 定义中英选项映射
    const optionsMap = {
      age: language === 'en'
        ? ['Under 18', '18-25', '26-35', '36-45', '46+']
        : ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上'],
      gender: language === 'en'
        ? ['Male', 'Female', 'Other']
        : ['男', '女', '其他'],
      education: language === 'en'
        ? ['High school or below', 'Associate', 'Bachelor', 'Master', 'Doctorate or above']
        : ['高中及以下', '大专', '本科', '硕士', '博士及以上']
    };
    const dynamicOptions = optionsMap[stepData.key] || [];
 
    this.setData({
      options: dynamicOptions,
      formTitle: this.data.t[`${stepData.key}Title`]
    });
  },
  
  onBackTap() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    this.goBack();
  },
  
  goBack() {
    if (this.data.currentStep > 1) {
      // 返回上一步
      const prevStep = this.data.currentStep - 1;
      
      this.setData({
        currentStep: prevStep,
        selectedOption: null
      }, () => {
        this.updateStepData();
      });
    } else {
      // 返回欢迎页
      wx.navigateBack();
    }
  },
  
  selectOption(e) {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedOption: index
    });
  },
  
  nextStep() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    if (this.data.selectedOption === null) {
      wx.showToast({
        title: this.data.t.pleaseSelect,
        icon: 'none'
      });
      return;
    }
    
    // 保存当前步骤的选择
    const currentStepData = this.data.steps[this.data.currentStep - 1];
    const selectedValue = this.data.options[this.data.selectedOption];
    
    // 更新用户信息
    const userInfo = this.data.userInfo;
    userInfo[currentStepData.key] = selectedValue;
    
    if (this.data.currentStep < this.data.totalSteps) {
      // 进入下一步
      const nextStep = this.data.currentStep + 1;
      
      this.setData({
        currentStep: nextStep,
        selectedOption: null,
        userInfo
      }, () => {
        this.updateStepData();
      });
    } else {
      // 完成信息收集，保存用户信息
      wx.setStorageSync('userInfo', this.data.userInfo);
      
      // 显示加载提示
      wx.showLoading({
        title: this.data.t.savingInfo,
        mask: true
      });
      
      // 注册用户到云数据库
      this.registerUser();
    }
  },
  
  // 注册用户到云数据库
  registerUser() {
    // 检查是否已初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.navigateToHome();
      return;
    }
    
    // 调用app.js中的注册方法
    getApp().registerUser(this.data.userInfo)
      .then(() => {
        console.log('用户注册成功');
        wx.hideLoading();
        this.navigateToHome();
      })
      .catch(err => {
        console.error('用户注册失败', err);
        wx.hideLoading();
        wx.showToast({
          title: this.data.t.saveError,
          icon: 'none'
        });
        // 仍然跳转到首页，但不保证数据已保存
        setTimeout(() => {
          this.navigateToHome();
        }, 1500);
      });
  },
  
  // 导航到首页
  navigateToHome() {
    // 跳转到游戏主页
    wx.reLaunch({
      url: '/pages/game-home/game-home'
    });
  }
}) 