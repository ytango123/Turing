# 邀请码调试指南

## 问题描述
被邀请者B的openid被错误地添加到了B自己的 `invitedUsers` 数组中，而不是添加到邀请者A的 `invitedUsers` 数组中。

## 调试步骤

### 1. 检查邀请码验证过程
在 `verifyInviteCode` 方法中添加了调试日志：
```javascript
console.log('设置邀请人ID:', {
  inviterOpenid: inviter._openid,
  userInfo: this.data.userInfo
});
```

**预期结果**：
- `inviterOpenid` 应该是邀请者A的openid
- `userInfo.inviterID` 应该等于 `inviterOpenid`

### 2. 检查更新邀请人记录过程
在 `updateInviterRecord` 方法中添加了调试日志：
```javascript
console.log('准备更新邀请人记录:', {
  inviterID: inviterID,
  currentUserOpenid: currentUserOpenid,
  userInfo: this.data.userInfo
});
```

**预期结果**：
- `inviterID` 应该是邀请者A的openid
- `currentUserOpenid` 应该是被邀请者B的openid
- 两者不应该相同

### 3. 检查数据库查询结果
添加了查询邀请人记录的调试：
```javascript
console.log('查询邀请人记录结果:', res);
console.log('找到邀请人:', inviter);
```

**预期结果**：
- 应该找到邀请者A的记录
- 查询条件 `_openid: inviterID` 应该匹配到A的记录

## 可能的问题原因

### 1. inviterID 值错误
- 检查 `this.data.userInfo.inviterID` 是否真的等于邀请者A的openid
- 检查是否在某个地方被错误覆盖

### 2. 数据库查询条件错误
- 检查 `where({ _openid: inviterID })` 是否使用了正确的字段名
- 检查 `inviterID` 的值是否正确

### 3. 数据传递问题
- 检查从 `verifyInviteCode` 到 `updateInviterRecord` 的数据传递是否正确
- 检查 `app.globalData.userInfo` 是否正确设置

## 测试步骤

1. **用户A注册**（不填写邀请码）
   - 记录A的openid和邀请码

2. **用户B注册**，填写A的邀请码
   - 观察控制台日志
   - 检查 `inviterID` 是否等于A的openid
   - 检查 `currentUserOpenid` 是否等于B的openid

3. **检查数据库结果**
   - A的 `invitedUsers` 应该包含B的openid
   - B的 `invitedUsers` 应该为空数组
   - B的 `inviterID` 应该等于A的openid

## 关键检查点

1. **inviterID 设置**：
   ```javascript
   this.data.userInfo.inviterID = inviter._openid;
   ```

2. **数据库查询**：
   ```javascript
   db.collection('users').where({
     _openid: inviterID  // 这里应该是A的openid
   })
   ```

3. **数据更新**：
   ```javascript
   invitedUsers: _.addToSet(currentUserOpenid)  // 这里应该是B的openid
   ```

## 预期日志输出

正确的日志应该类似：
```
设置邀请人ID: {
  inviterOpenid: "oER8K7rXyRB_8UZNe3kjTi4AcoZA",  // A的openid
  userInfo: { inviterID: "oER8K7rXyRB_8UZNe3kjTi4AcoZA" }
}

准备更新邀请人记录: {
  inviterID: "oER8K7rXyRB_8UZNe3kjTi4AcoZA",     // A的openid
  currentUserOpenid: "oER8K7mSOtGNFOhC_b22mSsahSe0",  // B的openid
  userInfo: { inviterID: "oER8K7rXyRB_8UZNe3kjTi4AcoZA" }
}

查询邀请人记录结果: { data: [{ _openid: "oER8K7rXyRB_8UZNe3kjTi4AcoZA", ... }] }
找到邀请人: { _openid: "oER8K7rXyRB_8UZNe3kjTi4AcoZA", ... }
更新邀请人记录成功
``` 