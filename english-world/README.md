# Little Lens 小小视界

面向亲子与青少年英语学习的免费静态网站。真实照片搭配英文、中文、音标与原创双语例句，覆盖 7 个阶段、15 个主题、93 张词汇卡。高阶段加入原创短文理解和写作练习。年龄仅供参考；这些是各阶段的起步练习，不是从幼儿到雅思的完整教学大纲，不保证成绩。

## 本地运行

无需 npm 安装、后台、账户或 API 密钥：

```sh
cd /workspace/-zxwdfgg-tech.github.io
python3 -m http.server 8000 --bind 127.0.0.1
```

打开服务中的 `/english-world/` 路径。页面需 JavaScript；发音使用设备的 Web Speech API，选择可用的英语声音，支持正常与慢速朗读。没有英语语音时会提示，卡片和练习仍可使用。不录音，也不进行自动发音评分。

## 公开访问

现有 `.github/workflows/deploy-pages.yml` 已加入 `english-world/` 目录，成功发布后地址为：

`https://zxwdfgg-tech.github.io/-zxwdfgg-tech.github.io/english-world/`

现有工作流也会从其他站点下载绘本、日报素材；这些上游步骤失败会阻止整个 Pages 发布。不能以本地验证或一次推送代替公开地址验证。也可以将本目录整体上传至任意支持静态文件的 HTTPS 主机，不需构建。部署时要保留相对路径和所有文件。

## 功能

- 七阶段与十五主题切换，可用 URL 查询参数分享当前主题。
- 点击真实照片学习单词、例句、字形与发音提示。
- 看图选词小练习；初级内容不设置强制达标。
- 从小学起增加短文阅读理解，从初中起增加写作与自查清单。
- 收藏、认识标记、复习与学习足迹在本机浏览器保存，可导出 JSON 备份；不提供云同步或备份导入。
- 复习采用简化的 1、3、7、14 天安排，同一天重复点击不会提升复习级别。
- 手机三列照片卡片、大屏布局、键盘焦点、阶段标签方向键和对话框支持。

## 真实摄影与外部来源

摄影来自 Unsplash，由 `images.unsplash.com` 的固定照片地址获取后随网站一并提供，不使用随机图像端点、AI 图像或卡通替代。`curriculum.js` 的 `photos` 字段列出照片 ID、本地地址、原始来源与描述。照片列表也可在网站页脚的“关于与照片来源”查看。抽象词用实际生活场景辅助联想，并非图中人物的身份或观点背书。

图片使用遵循 [Unsplash License](https://unsplash.com/license)。照片使用原始摄影内容，经 CDN 裁切与压缩以适应卡片；所有照片已经下载并验证图像格式，页面运行时从本站加载，无需连接外部图库。增加照片时应检查内容、链接和许可。页面不使用外部字体或广告、分析 SDK。

课程和界面为本项目原创。方法与组织参考以下开源项目，未复制其代码或课程，亦无关联背书：

- [Anki](https://github.com/ankitects/anki)：间隔重复。
- [LibreLingo](https://github.com/LibreLingo/LibreLingo)：主题化的开放语言练习。
- [British Council LearnEnglish Kids](https://learnenglishkids.britishcouncil.org/)：儿童延伸资源。
- [IELTS 官方备考资源](https://ielts.org/take-a-test/preparation-resources)：正式备考与考试说明。

## 隐私与适龄使用

无需登录，不主动收集个人资料或录音。学习、收藏、练笔仅保存在 localStorage；清理浏览器数据会删除。本地照片随页面加载；查看原始来源会访问 Unsplash。设备朗读可能使用设备供应商的语音服务。2 岁以下优先真实互动、实物与书本，避免常规屏幕学习；低龄使用应由照护者陪伴。详见页面“家长怎么陪伴”。

## 基本校验

```sh
node --check english-world/app.js
node --check english-world/curriculum.js
```

浏览器验证应检查七阶段全部主题、学习对话框、选词正误反馈、阅读判断、练笔保存、收藏与复习、手机布局，以及所有真实照片加载。Web Speech 的实际声音还需要在目标设备上试听。
