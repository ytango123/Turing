const { createPage } = require('../../utils/basePage')

createPage({
  pageKey: 'rankings',
  i18nKeys: {
    navTitle: 'navTitle',
    loading: 'loading',
    noMore: 'noMore',
    points: 'points'
  },

  data: {
    rankings: [],        // 排行榜数据
    loading: false,      // 是否正在加载
    pageSize: 20,        // 每次加载条数
    pageNo: 0,          // 当前页码（从 0 开始）
    hasMore: true        // 是否还有更多数据
  },

  onLoad() {
    this.loadRankings()
  },

  // 分页加载排行榜
  loadRankings() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    const db = wx.cloud.database()
    const _ = db.command
    const { pageSize, pageNo } = this.data

    db.collection('users')
      .orderBy('gameData.points', 'desc')
      .skip(pageNo * pageSize)
      .limit(pageSize)
      .get()
      .then(res => {
        const list = res.data.map((u, idx) => {
          const globalIdx = pageNo * pageSize + idx + 1 // 计算全局排名
          return {
            rank: globalIdx,
            name: u.nickname || (u.userInfo && u.userInfo.nickname) || `用户${u._openid.slice(-4)}`,
            points: (u.gameData && u.gameData.points) || 0,
            avatarUrl: u.avatarUrl || '',
            userInitial: (u.nickname || '匿').charAt(0),
            isUser: u._openid === getApp().globalData.openid
          }
        })

        this.setData({
          rankings: this.data.rankings.concat(list),
          pageNo: pageNo + 1,
          hasMore: res.data.length === pageSize
        })
      })
      .catch(err => {
        console.error('加载排行榜失败', err)
        wx.showToast({
          title: '加载失败，请稍后重试',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  // 监听滚动到底部加载更多
  onReachBottom() {
    this.loadRankings()
  }
}) 