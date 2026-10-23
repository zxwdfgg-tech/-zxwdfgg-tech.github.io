# 电力设备情报库 Android APK

安卓原生 WebView 容器，默认从 APK 内置 2025—2026 历史资料离线打开；支持地区、企业、设备检索和收藏。点顶部“在线”可加载公开网站，在线失败会自动切回本地版。

## 编译
GitHub Actions / Java 17 / Android SDK 35 / Gradle 8.10.2：
```sh
mkdir -p android-app/app/src/main/assets/site
cp overseas/electric-intel/{index.html,style.css,app.js,data.js,expansion.js,province-data.js} android-app/app/src/main/assets/site/
gradle -p android-app :app:assembleDebug
```
输出：`android-app/app/build/outputs/apk/debug/app-debug.apk`

## 使用与限制
- Android 7.0+（minSdk 24）
- APK 包含公开信息历史快照，不能自动刷新内置数据。点击“在线”访问网站查看新版本，网络不可用可切回“本地”。
- 安装包为 Android 调试签名，适合试用及内部测试；正式分发应用应使用自有、可保管的签名证书。未来若改用另一签名更新，需要卸载旧版后安装。
- 网站内 CSV 下载在 APK 中会打开系统保存选择器，不需要存储权限。
- 仅使用互联网与网络状态权限，不采集用户通讯录、定位或相册。
- 外部招标公告使用手机系统浏览器打开。
