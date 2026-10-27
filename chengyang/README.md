# 城阳电工 · 故障案例图书馆

这是用于学习的**非官方公开视频链接索引**，不是视频搬运网站，不代表原作者授权或合作。

- 网站入口（需 GitHub Pages 部署成功）：https://zxwdfgg-tech.github.io/-zxwdfgg-tech.github.io/chengyang/
- 作者原视频列表：https://space.bilibili.com/1985127693/video
- 当前已收录 32 条公开作品的索引与原始视频链接；并非全部视频。
- 自动同步脚本：`sync_bilibili.py`。可尝试读取公开平台视频元数据，按标题分类，保留人工核对条目。平台可能因风控、登录要求或接口变更拒绝访问。成功抓取也不能保证覆盖所有隐藏/已下架视频。
- GitHub Actions：`.github/workflows/chengyang-sync.yml`，周一、周四 UTC 04:18 尝试同步；运行异常不覆盖原始文件。
- GitHub Pages：`.github/workflows/publish-pages.yml`，页面修改后自动尝试部署；若失败，需要在 Settings → Pages 选择 GitHub Actions 并检查 Actions 执行结果。

## 功能

按跳闸、漏电触电、零线接地、电压异常、插座照明、电机设备、仪表测量等类别浏览；按关键词检索；记录收藏、观看完成情况和个人笔记；本机 JSON 导入/导出（不自动共享）。

## 数据格式

```json
{
  "items": [
    {
      "id": "BVxxxxxxxxxx",
      "title": "公开视频的真实标题",
      "category": "跳闸保护",
      "equipment": "家庭线路",
      "date": "2026-01-01",
      "tags": ["漏保"],
      "url": "https://www.bilibili.com/video/BVxxxxxxxxxx/",
      "status": "原始标题与视频链接已核对"
    }
  ]
}
```

## 严格的内容边界

目前并未逐条看完原视频，因此本索引不能提供视频作者的确切故障结论。学习卡片中的排查问题是通用学习提示，不是作者原话、视频摘要或检修指令。任何危险电气作业都应遵守本地法规、操作规程、资质和隔离/验电程序。

原作者视频不得未经授权下载、复制或再上传到 GitHub。对归属、链接或索引有异议，请在仓库 Issue 中联系维护者进行更正或移除。
