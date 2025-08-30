# 邀请码字段修复测试

## 修复内容

### 1. 统一字段命名
- 将所有 `inviterId` 改为 `inviterID`
- 确保云端数据库字段统一

### 2. 修复邀请人记录更新
- 修复 `updateInviterRecord` 方法中获取当前用户openid的逻辑
- 确保 `app.globalData.userInfo` 包含正确的 `_openid` 字段

## 测试步骤

### 步骤1：验证字段统一
1. 检查云端数据库，确认只有 `inviterID` 字段，没有 `inviterId` 字段
2. 检查代码中所有引用都已更新为 `inviterID`

### 步骤2：测试邀请流程
1. 用户A注册（不填写邀请码）
   - 验证A的 `inviterID` 为空字符串
   - 验证A的 `invitedUsers` 为空数组

2. 用户B注册，填写A的邀请码
   - 验证B的 `inviterID` 设置为A的openid
   - 验证A的 `invitedUsers` 数组包含B的openid

### 步骤3：验证campus页面显示
1. 用户A进入campus页面
   - 验证邀请好友卡片显示"已邀请1/5人"
   - 验证按钮为绿色"领取奖励"

2. 用户A点击领取奖励
   - 验证获得30金币
   - 验证按钮变回黄色"已邀请1/5人"

## 关键修复点

### 1. app.js registerUser方法
```javascript
// 修复前
this.globalData.userInfo = userData

// 修复后
this.globalData.userInfo = {
  ...userData,
  _openid: this.globalData.openid,
  _id: res._id
}
```

### 2. user-info.js updateInviterRecord方法
```javascript
// 修复前
const currentUserOpenid = app.globalData.userInfo._openid;

// 修复后
const currentUserOpenid = app.globalData.userInfo ? app.globalData.userInfo._openid : app.globalData.openid;
```

### 3. 字段命名统一
- 所有 `inviterId` 改为 `inviterID`
- 确保云端和本地字段名一致

## 预期结果
1. 邀请码字段命名统一，避免混乱
2. 邀请人记录正确更新，`invitedUsers` 数组包含被邀请人的openid
3. Campus页面正确显示邀请状态和奖励按钮 