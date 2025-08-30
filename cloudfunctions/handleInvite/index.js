// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, inviteCode, inviterID } = event

  try {
    switch (action) {
      case 'validateCode':
        return await validateInviteCode(inviteCode, wxContext.OPENID)
      case 'processInvite':
        return await processInvite(inviterID, wxContext.OPENID)
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { success: false, error: error.message }
  }
}

// 验证邀请码
async function validateInviteCode(inviteCode, currentUserOpenid) {
  if (!inviteCode || inviteCode.length !== 6) {
    return { success: false, error: '邀请码格式错误' }
  }

  // 查询邀请码是否存在
  const result = await db.collection('users').where({
    inviteCode: inviteCode
  }).get()

  if (!result.data || result.data.length === 0) {
    return { success: false, error: '邀请码不存在' }
  }

  const inviter = result.data[0]

  // 检查是否是自己的邀请码
  if (inviter._openid === currentUserOpenid) {
    return { success: false, error: '不能使用自己的邀请码' }
  }

  // 检查邀请人是否已达到邀请上限
  const invitedUsers = inviter.invitedUsers || []
  if (invitedUsers.length >= 5) {
    return { success: false, error: '该邀请码已达上限' }
  }

  // 检查当前用户是否已经被这个邀请人邀请过
  if (invitedUsers.includes(currentUserOpenid)) {
    return { success: false, error: '您已经使用过该邀请码' }
  }

  return {
    success: true,
    data: {
      inviterID: inviter._openid,
      inviterNickname: inviter.nickname || `用户${inviter._openid.slice(-4)}`
    }
  }
}

// 处理邀请逻辑
async function processInvite(inviterID, currentUserOpenid) {
  if (!inviterID || !currentUserOpenid) {
    return { success: false, error: '参数错误' }
  }

  // 再次验证邀请人存在且未达上限
  const inviterResult = await db.collection('users').where({
    _openid: inviterID
  }).get()

  if (!inviterResult.data || inviterResult.data.length === 0) {
    return { success: false, error: '邀请人不存在' }
  }

  const inviter = inviterResult.data[0]
  const invitedUsers = inviter.invitedUsers || []

  if (invitedUsers.length >= 5) {
    return { success: false, error: '邀请人已达邀请上限' }
  }

  if (invitedUsers.includes(currentUserOpenid)) {
    return { success: false, error: '用户已在邀请列表中' }
  }

  // 更新邀请人的邀请记录
  const updateResult = await db.collection('users').where({
    _openid: inviterID
  }).update({
    data: {
      invitedUsers: _.addToSet(currentUserOpenid)
    }
  })

  console.log('更新邀请人记录结果:', updateResult)

  // 验证更新是否成功
  const verifyResult = await db.collection('users').where({
    _openid: inviterID
  }).get()

  const updatedInviter = verifyResult.data[0]
  console.log('验证更新结果:', {
    inviterID: inviterID,
    oldInvitedUsers: invitedUsers,
    newInvitedUsers: updatedInviter.invitedUsers
  })

  return {
    success: true,
    data: {
      inviterID: inviterID,
      invitedCount: (updatedInviter.invitedUsers || []).length
    }
  }
} 