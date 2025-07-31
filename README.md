# 图灵测试小程序

这是一个基于微信小程序的图灵测试应用，用户可以通过判断对话中哪一方是AI来挑战自己的辨别能力。

小程序Appid（更新）：wx0aa6c0af7848b725
云环境id：cloud1-8gbjshfgf7c95b79

## 云开发配置

本项目使用微信云开发，需要进行以下配置：

### 1. 云环境配置

- 云环境ID: `cloud1-8gbjshfgf7c95b79`
- 确保在微信开发者工具中已开通云开发功能

### 2. 数据库集合创建

需要创建以下集合：

- `users`: 存储用户信息和游戏数据
  - 字段结构:
    - _id: 自动生成
    - _openid: 用户openid
    - age: 用户年龄段
    - gender: 用户性别
    - education: 用户学历
    - gameData: 游戏数据对象
      - points: 累计得分
      - level: 用户等级
      - maxCombo: 最大连击数
      - correctCount: 正确判断次数
      - wrongCount: 错误判断次数
      - dialogues: 对话判断记录数组
      - completedChallenges: 完成挑战次数
    - createTime: 创建时间
    - updateTime: 更新时间

### 3. 云函数部署

本项目使用了以下云函数：

- `login`: 获取用户openid

部署步骤：
1. 在微信开发者工具中，右键点击 `cloudfunctions/login` 目录
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

### 4. 小程序端配置

确保app.js中的云环境ID与你创建的云环境一致：

```javascript
wx.cloud.init({
  env: 'cloud1-8gbjshfgf7c95b79', // 云环境ID
  traceUser: true,
})
```

## 功能说明

1. 用户首次进入小程序时，会自动根据微信账户创建用户记录
2. 用户填写的基本信息（年龄、性别、学历）会保存到云数据库
3. 用户的游戏数据（得分、正确率等）会实时同步到云数据库
4. 完成所有对话后，最终结果会保存到云数据库

## 开发说明

- 小程序使用TDesign组件库
- 使用云开发实现用户数据的存储和同步
- 无需搭建服务器，直接使用微信提供的云服务 