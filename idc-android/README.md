# 智维实训 Android APK 构建

Android WebView 离线包，封装来自 `idc-lab/index.html` 的原创中文 24 关交互训练系统。无需联网即可操作。

项目要求：JDK 17、Android SDK 35、Gradle 8.10.2。

在仓库根目录执行：

```bash
cd idc-android
gradle assembleDebug
```

产物：`app/build/outputs/apk/debug/app-debug.apk`

仓库内 GitHub Actions 的 `构建智维实训APK` 工作流会自动构建 APK，产物见 Actions 工作流 Artifacts。如果 Releases 权限可用，还会建立一个带 APK 附件的 release。

注意：初版 APK 采用 Android Debug 签名，仅适合先行试用，不代表已通过Google Play发布审核。公开分发正式更新需要稳定的私有签名密钥、应用测试及完整的隐私/安全评估。
