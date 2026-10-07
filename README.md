# ASTRA 2027 · 星辰指引

十二星座年度主题、爱情、事业、财富、身心及月份指引，配合连续的 3D 玻璃作品廊、粒子场和动态星图。

网站地址：https://asiatopccs01-cmyk.github.io/lighter.mp3/

## 发布与维护

仓库已配置 GitHub Pages，从 `main` 分支的根目录发布。根目录的 `index.html` 是完整发布文件，样式、脚本、3D 库、星图和背景音乐都已内嵌。

可编辑源码位于 `src/`。修改后运行：

```sh
python3 scripts/build.py
```

将修改后的源码与生成的 `index.html` 一起提交到 `main`，等待 GitHub Pages 部署完成。保留 `.nojekyll` 和 `THREE-LICENSE.txt`。

站内使用哈希路由，不需要服务器路由重写。例如：

- 星空漫游：`/#/work`
- 年度总览：`/#/chapter/overview`
- 白羊座：`/#/zodiac/aries`
- 白羊座七月：`/#/zodiac/aries?month=7`

完整链接以网站地址为前缀：`https://asiatopccs01-cmyk.github.io/lighter.mp3/#/zodiac/aries?month=7`。

音乐点击开启；星座偏好仅保存在当前浏览器；可暂停动效，系统的减少动态效果设置也会生效。星图为主题视觉意象，月份内容围绕个人行动与生活规划展开。

发布前检查记录见 [检查报告](docs/检查报告.md)。Three.js 与 CSS3DRenderer 的 MIT 许可证同时保留在文件和网页源码中。
