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
    aiFamiliarityTitle: 'aiFamiliarityTitle',
    inviteCodeTitle: 'inviteCodeTitle', // 新增邀请码标题
    nextButton: 'nextButton',
    privacyNotice: 'privacyNotice',
    pleaseSelect: 'pleaseSelect',
    savingInfo: 'savingInfo',
    saveError: 'saveError',
    skipButton: 'skipButton', // 新增跳过按钮文本
    inviteCodeInvalid: 'inviteCodeInvalid', // 新增邀请码无效提示
    inviteCodeValid: 'inviteCodeValid' // 新增邀请码有效提示
  },

  data: {
    currentStep: 1,
    totalSteps: 5, // 增加到5步，包括邀请码
    selectedOption: null,
    currentLang: 'zh',
    // 存储用户信息
    userInfo: {
      aiFamiliarity: '',
      age: '',
      gender: '',
      education: '',
      inviteCode: '' // 新增邀请码字段
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
      },
      {
        key: 'aiFamiliarity',
        options: ['从未使用过', '偶尔接触（如看别人用）', '使用过几次，了解基本功能', '经常使用，有一定操作经验', '非常熟悉，深入使用过多个 AI 工具']
      },
      {
        key: 'inviteCode',
        options: [] // 邀请码没有预设选项
      }
    ],
    // 邀请码相关（单输入法）
    codeLength: 6,
    inputValue: '',
    computedCodeValue: [],
    isFocus: true,
    isInviteCodeValid: null, // 邀请码验证状态：null=未验证，true=有效，false=无效
    isVerifyingCode: false // 是否正在验证邀请码
  },
  
  onLoad() {
    const language = wx.getStorageSync('language') || 'zh';
    this.setData({ currentLang: language });
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
      aiFamiliarity: language === 'en'
        ? ['Never used', 'Occasionally encountered (e.g., saw others use)', 'Used a few times, understand basic functions', 'Use frequently, have some operational experience', 'Very familiar, have extensively used multiple AI tools']
        : ['从未使用过', '偶尔接触（如看别人用）', '使用过几次，了解基本功能', '经常使用，有一定操作经验', '非常熟悉，深入使用过多个 AI 工具'],
      age: language === 'en'
        ? ['Under 18', '18-25', '26-35', '36-45', '46+']
        : ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上'],
      gender: language === 'en'
        ? ['Male', 'Female', 'Other']
        : ['男', '女', '其他'],
      education: language === 'en'
        ? ['High school or below', 'Associate', 'Bachelor', 'Master', 'Doctorate or above']
        : ['高中及以下', '大专', '本科', '硕士', '博士及以上'],
      inviteCode: [] // 邀请码没有预设选项
    };
    const dynamicOptions = optionsMap[stepData.key] || [];
 
    // 如果是邀请码步骤，显示跳过按钮并初始化输入框焦点
    const showSkipButton = stepData.key === 'inviteCode';
    
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
        selectedOption: null,
        // 邀请码相关状态重置
        inputValue: this.data.currentStep === 5 ? '' : this.data.inputValue,
        computedCodeValue: this.data.currentStep === 5 ? [] : this.data.computedCodeValue,
        isInviteCodeValid: this.data.currentStep === 5 ? null : this.data.isInviteCodeValid
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
  
  // 单输入验证码方案：焦点与输入处理
  inputFocus() {
    this.setData({ isFocus: true });
  },
  inputBlur() {
    this.setData({ isFocus: false });
  },
  codeInput(e) {
    const clean = (e.detail.value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const sliced = clean.slice(0, this.data.codeLength);
    this.setData({
      inputValue: sliced,
      computedCodeValue: sliced.split(''),
      isInviteCodeValid: null
    });
    // 自动触发校验
    if (sliced.length === this.data.codeLength) {
      this.verifyInviteCode(sliced);
    }
  },

  // 验证邀请码
  verifyInviteCode(code) {
    // 如果邀请码不足6位，不进行验证
    if (code.length !== 6) {
      return;
    }
    
    this.setData({ isVerifyingCode: true });
    
    console.log('开始验证邀请码:', code);
    
    // 检查是否初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.setData({ 
        isInviteCodeValid: false,
        isVerifyingCode: false
      });
      
      wx.showToast({
        title: '验证失败，请重试',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: this.data.currentLang === 'en' ? 'Verifying...' : '验证中...',
      mask: true
    });
    
    // 使用云函数验证邀请码
    wx.cloud.callFunction({
      name: 'handleInvite',
      data: {
        action: 'validateCode',
      inviteCode: code
      }
    }).then(res => {
      wx.hideLoading();
      
      console.log('云函数验证结果:', res);
      
      if (res.result.success) {
        // 邀请码有效
        const { inviterID, inviterNickname } = res.result.data;
        
        // 保存邀请人信息
        this.data.userInfo.inviterID = inviterID;
        
        console.log('设置邀请人ID:', {
          inviterID: inviterID,
          inviterNickname: inviterNickname,
          userInfo: this.data.userInfo
        });
        
        this.setData({ 
          isInviteCodeValid: true,
          isVerifyingCode: false,
          userInfo: this.data.userInfo
        });
        
        // 显示成功提示
        wx.showToast({
          title: this.data.t.inviteCodeValid || '邀请码有效',
          icon: 'success'
        });
      } else {
        // 邀请码无效
        this.setData({ 
          isInviteCodeValid: false,
          isVerifyingCode: false
        });
        
        // 显示错误提示
        wx.showToast({
          title: res.result.error || (this.data.t.inviteCodeInvalid || '邀请码无效'),
          icon: 'error'
        });
        
        console.log('邀请码验证失败:', res.result.error);
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('验证邀请码失败', err);
      this.setData({ 
        isInviteCodeValid: false,
        isVerifyingCode: false
      });
      
      // 显示错误提示
      wx.showToast({
        title: this.data.currentLang === 'en' ? 'Verification failed' : '验证失败，请重试',
        icon: 'none'
      });
    });
  },
  
  
  
  nextStep() {
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: 'light' });
    }
    
    // 特殊处理邀请码步骤
    if (this.data.currentStep === 5) {
      // 如果有输入但无效
      if (this.data.inputValue && this.data.inputValue.length > 0 && this.data.isInviteCodeValid === false) {
        wx.showToast({
          title: this.data.t.inviteCodeInvalid || '邀请码无效',
          icon: 'error'
        });
        return;
      }
      // 正在验证
      if (this.data.isVerifyingCode) {
        return;
      }
      const code = (this.data.inputValue || '').toUpperCase();
      // 空视为跳过
      if (!code) {
        this.data.userInfo.inviterID = '';
        wx.setStorageSync('userInfo', this.data.userInfo);
        wx.showLoading({ title: this.data.t.savingInfo, mask: true });
        this.registerUser();
        return;
      }
      // 长度不足
      if (code.length !== this.data.codeLength) {
        wx.showToast({
          title: this.data.t.inviteCodeInvalid || '邀请码无效',
          icon: 'error'
        });
        return;
      }
      // 验证通过则注册
      if (this.data.isInviteCodeValid) {
        wx.setStorageSync('userInfo', this.data.userInfo);
        wx.showLoading({ title: this.data.t.savingInfo, mask: true });
        this.registerUser();
        return;
      }
      // 未验证则尝试验证
      this.verifyInviteCode(code);
      return;
    }
    
    // 非邀请码步骤的常规处理
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
    
    // 调用app.js中的注册方法，传递邀请码信息
    getApp().registerUser(this.data.userInfo)
      .then(() => {
        console.log('用户注册成功');
        
        // 如果有有效邀请码，更新邀请人的邀请记录
        if (this.data.userInfo.inviterID) {
          this.updateInviterRecord();
        } else {
        wx.hideLoading();
        this.navigateToHome();
        }
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
  
  // 更新邀请人的邀请记录
  updateInviterRecord() {
    if (!wx.cloud) {
      this.navigateToHome();
      return;
    }
    
    const inviterID = this.data.userInfo.inviterID;
    
    if (!inviterID) {
      console.error('没有邀请人ID');
      wx.hideLoading();
      this.navigateToHome();
      return;
    }
    
    console.log('准备更新邀请人记录:', {
      inviterID: inviterID
    });
    
    // 使用云函数更新邀请人记录
    wx.cloud.callFunction({
      name: 'handleInvite',
      data: {
        action: 'processInvite',
        inviterID: inviterID
      }
    }).then(res => {
      console.log('云函数处理邀请结果:', res);
      
      if (res.result.success) {
        console.log('更新邀请人记录成功:', res.result.data);
      wx.hideLoading();
      this.navigateToHome();
      } else {
        console.error('更新邀请人记录失败:', res.result.error);
        wx.hideLoading();
        // 即使失败也跳转到首页，避免用户卡住
        this.navigateToHome();
      }
    }).catch(err => {
      console.error('云函数调用失败', err);
      wx.hideLoading();
      // 即使失败也跳转到首页，避免用户卡住
      this.navigateToHome();
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