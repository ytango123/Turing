// pages/user-info/user-info.js
Page({
  data: {
    currentStep: 1,
    totalSteps: 3,
    formTitle: '年龄段',
    selectedOption: null,
    options: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上'],
    
    // 存储用户信息
    userInfo: {
      age: '',
      gender: '',
      education: ''
    },
    
    // 各步骤的选项
    steps: [
      {
        title: '年龄段',
        options: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46岁以上'],
        key: 'age'
      },
      {
        title: '性别',
        options: ['男', '女', '其他'],
        key: 'gender'
      },
      {
        title: '学历',
        options: ['高中及以下', '大专', '本科', '硕士', '博士及以上'],
        key: 'education'
      }
    ]
  },
  
  onLoad() {
    // 初始化第一步
    this.setData({
      formTitle: this.data.steps[0].title,
      options: this.data.steps[0].options
    });
  },
  
  goBack() {
    if (this.data.currentStep > 1) {
      // 返回上一步
      const prevStep = this.data.currentStep - 1;
      const stepData = this.data.steps[prevStep - 1];
      
      this.setData({
        currentStep: prevStep,
        formTitle: stepData.title,
        options: stepData.options,
        selectedOption: null
      });
    } else {
      // 返回欢迎页
      wx.navigateBack();
    }
  },
  
  selectOption(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedOption: index
    });
  },
  
  nextStep() {
    if (this.data.selectedOption === null) {
      wx.showToast({
        title: '请选择一个选项',
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
      const stepData = this.data.steps[nextStep - 1];
      
      this.setData({
        currentStep: nextStep,
        formTitle: stepData.title,
        options: stepData.options,
        selectedOption: null,
        userInfo
      });
    } else {
      // 完成信息收集，保存用户信息
      wx.setStorageSync('userInfo', this.data.userInfo);
      
      // 跳转到游戏主页
      wx.reLaunch({
        url: '/pages/game-home/game-home'
      });
    }
  }
}) 