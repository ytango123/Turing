// 清理重复的对话统计记录，合并相同 name 的所有记录（不考虑用户）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('开始清理重复的对话统计记录...')
    
    // 分页获取所有对话统计记录（避免单次查询限制）
    let allStats = []
    let hasMore = true
    let skip = 0
    const limit = 100
    
    while (hasMore) {
      const { data } = await db.collection('dialogueStats')
        .skip(skip)
        .limit(limit)
        .get()
      
      allStats = allStats.concat(data)
      hasMore = data.length === limit
      skip += limit
    }
    
    console.log(`总共找到 ${allStats.length} 条记录`)
    
    // 按 name 分组，不考虑 _openid
    const nameGroups = {}
    allStats.forEach(stat => {
      const name = stat.name
      if (!name) {
        console.warn('发现没有 name 字段的记录:', stat._id)
        return
      }
      
      if (!nameGroups[name]) {
        nameGroups[name] = []
      }
      nameGroups[name].push(stat)
    })
    
    console.log(`按 name 分组后共有 ${Object.keys(nameGroups).length} 个不同的音频`)
    
    // 找出有重复记录的音频组
    const duplicateGroups = []
    const singleGroups = []
    
    Object.entries(nameGroups).forEach(([name, records]) => {
      if (records.length > 1) {
        duplicateGroups.push([name, records])
      } else {
        singleGroups.push([name, records])
      }
    })
    
    console.log(`发现 ${duplicateGroups.length} 个有重复记录的音频组`)
    console.log(`发现 ${singleGroups.length} 个单条记录的音频组`)
    
    const duplicateResults = []
    let processedCount = 0
    
    // 优先处理重复记录，使用批量操作
    for (const [name, records] of duplicateGroups) {
      console.log(`处理重复音频: ${name}, 共 ${records.length} 条记录`)
      
      // 计算合并后的总数
      let totalSum = 0
      let correctSum = 0
      
      records.forEach(record => {
        totalSum += (record.total || 0)
        correctSum += (record.correct || 0)
      })
      
      console.log(`  合并后: total=${totalSum}, correct=${correctSum}`)
      
      // 找到最早创建的记录作为保留记录
      const keepRecord = records.reduce((earliest, current) => {
        const earliestTime = new Date(earliest.createTime || 0).getTime()
        const currentTime = new Date(current.createTime || 0).getTime()
        return currentTime < earliestTime ? current : earliest
      })
      
      console.log(`  保留记录: ${keepRecord._id}`)
      
      // 更新保留记录
      await db.collection('dialogueStats')
        .doc(keepRecord._id)
        .update({
          data: {
            name: name,
            total: totalSum,
            correct: correctSum,
            updateTime: db.serverDate()
            // 不再包含 _openid，这是全局统计
          }
        })
      
      // 批量删除其他重复记录
      const recordsToDelete = records.filter(record => record._id !== keepRecord._id)
      
      if (recordsToDelete.length > 0) {
        console.log(`  批量删除 ${recordsToDelete.length} 条重复记录`)
        
        // 分批删除，每批最多20条，避免单次操作过大
        const batchSize = 20
        for (let i = 0; i < recordsToDelete.length; i += batchSize) {
          const batch = recordsToDelete.slice(i, i + batchSize)
          const deletePromises = batch.map(record => 
            db.collection('dialogueStats').doc(record._id).remove()
          )
          await Promise.all(deletePromises)
          console.log(`    已删除第 ${i + 1}-${Math.min(i + batchSize, recordsToDelete.length)} 条记录`)
        }
      }
      
      duplicateResults.push({
        name,
        originalCount: records.length,
        mergedTotal: totalSum,
        mergedCorrect: correctSum,
        deletedCount: recordsToDelete.length,
        keptRecordId: keepRecord._id
      })
      
      processedCount++
      
      // 每处理10个重复组就检查一下时间，避免超时
      if (processedCount % 10 === 0) {
        console.log(`已处理 ${processedCount}/${duplicateGroups.length} 个重复组`)
      }
    }
    
    console.log(`重复记录处理完成！已处理 ${duplicateGroups.length} 个重复组`)
    
    // 批量处理单条记录，移除 _openid 字段（如果还有时间的话）
    let singleProcessedCount = 0
    const maxSingleProcess = Math.min(50, singleGroups.length) // 最多处理50个单条记录
    
    console.log(`开始处理单条记录，计划处理 ${maxSingleProcess} 个`)
    
    for (let i = 0; i < maxSingleProcess; i++) {
      const [name, records] = singleGroups[i]
      const record = records[0]
      
      if (record._openid !== undefined) {
        await db.collection('dialogueStats')
          .doc(record._id)
          .update({
            data: {
              name: name,
              total: record.total || 0,
              correct: record.correct || 0,
              updateTime: db.serverDate()
              // 移除 _openid 字段
            }
          })
        singleProcessedCount++
      }
    }
    
    console.log(`单条记录处理完成！已处理 ${singleProcessedCount} 条`)
    
    console.log(`清理完成！`)
    console.log(`- 原始记录数: ${allStats.length}`)
    console.log(`- 不同音频数: ${Object.keys(nameGroups).length}`)
    console.log(`- 处理重复组: ${duplicateGroups.length}`)
    console.log(`- 处理单条记录: ${singleProcessedCount}`)
    
    return {
      success: true,
      message: '成功清理重复记录',
      totalRecordsBefore: allStats.length,
      uniqueAudioCount: Object.keys(nameGroups).length,
      duplicateGroupsProcessed: duplicateGroups.length,
      duplicateGroupsTotal: duplicateGroups.length,
      singleRecordsProcessed: singleProcessedCount,
      singleRecordsTotal: singleGroups.length,
      details: duplicateResults.slice(0, 10), // 只返回前10个详情，避免响应过大
      note: singleGroups.length > maxSingleProcess ? 
        `还有 ${singleGroups.length - maxSingleProcess} 个单条记录未处理，可再次运行处理` : 
        '所有记录处理完成'
    }
    
  } catch (error) {
    console.error('清理重复记录失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
} 