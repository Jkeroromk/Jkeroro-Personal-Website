# Showroom 里的 Lexus LC 500（WALD Sports Line）

首页卡片右上角的 **Enter Showroom** 会打开全屏展厅 `components/media/Showroom.jsx`，3D 场景在 `components/media/carScene.js`（纯 three.js，移植自 pmndrs 的 Building Live Env Maps 示例，见 `scripts/porsche-911/README.md`）。2026-11 起展厅里的车从保时捷 911 换成了这台 Lexus。

## 模型来源与授权

- 模型：[“Lexus LC 500 WALD Sports Line | www.vecarz.com”](https://sketchfab.com/3d-models/lexus-lc-500-wald-sports-line-wwwvecarzcom-120879ad2666438b86d080dcf26621fa)，作者 VeCarz（Sketchfab @heynic）
- 授权：[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)，只能非商业使用，必须署名 “VeCarz – www.vecarz.com”。展厅右下角有出处链接
- 修改内容：车尾车牌换成 JKERORO；轮毂中心盖的 MSW 标换成 JK；顶点量化、贴图压缩；材质参数在网页运行时重新调过

## 文件

| 文件 | 说明 |
|---|---|
| `public/static/lexus-lc500.glb` | 网页用模型，约 14 MB（33 万面）。由 `build_glb.py` 从 Sketchfab 下载的原版 GLB（Original format，约 53 MB）生成 |
| `scripts/lexus-lc500/build_glb.py` | 生成脚本：位置 int16、法线 int8（`KHR_mesh_quantization`），贴图最大 2048，没有透明的转 JPEG，车牌换成 `plate_jkeroro.png` |
| `scripts/lexus-lc500/gl.py` | 读 GLB 的小工具 |
| `scripts/lexus-lc500/doorparts.py` | 找出整车内饰网格里属于车门的连通块（门内饰板、扶手、把手、皮面），`build_glb.py` 把它们拆成 `Door_` 开头的单独网格 |
| `scripts/lexus-lc500/cap_jk.png` | 轮毂中心盖贴图（1024×1024，黑底白字 JK + 细银圈）。贴图中心 (0.485, 0.44) 对着盖子中心，四个轮子上都是正向、不镜像 |
| `scripts/lexus-lc500/plate_jkeroro.png` | JKERORO 车牌贴图（1024×512，深色底白字，沿用原车 WALD 牌照的配色），正向存储 |

重新生成：

```bash
python3 scripts/lexus-lc500/build_glb.py public/static/lexus-lc500.glb <Sketchfab 原版 .glb>
```

原版 zip 在 Jason 本机 `Downloads/lexus-lc-500-wald-sports-line-wwwvecarzcom.zip`。

## 模型结构（写代码时要知道的）

- 单位是米，车长 4.88 m，车头朝 +Z，车底在 y = 0 附近。`carScene.js` 加载后按包围盒把车底放到地面、前后左右居中
- 这是从游戏模组转出来的车，51 个材质原来全是同一组参数（metalness 0、roughness 0.45），颜色都在贴图里（烘焙了 AO）。`carScene.js` 的 `GROUPS` 按材质名分组，`tuneMaterial()` 分别调成车漆、亮黑饰件、碳纤维、镀铬、轮毂、轮胎、车灯、玻璃等
- 车漆：`CSR2_CarPaint`，贴图是白色加 AO，换色就是把颜色乘到贴图上，所以默认的 “Wald White” 就是原色
- 轮毂：`Rim_1` / `Rim_2` / `Rim_black`，原色是深灰。换成银色/白色时去掉贴图底色
- 车灯：车头灯和尾灯共用材质 `CSR2_Light`，而且 `Kit1_Light` 这个网格同时包含车头灯和尾灯。所以按三角形位置（z 正负）拆成两组：开灯时车头白光、车尾红光
- 车尾车牌：材质 `Material #13`（只有车尾一块，车头没有车牌）
- 轮毂中心盖：材质 `Material #49`，原来的浮雕法线贴图换成了平的
- Showroom 默认不自动旋转（左下角按钮可以打开）
- 车门：节点名以 `L_Door` / `R_door` / `r_Door` / `Door` 开头的零件是门（门板、车窗、后视镜、门内饰），按 x 正负分左右，挂到门前上缘的铰链节点上绕 Y 轴转 62°。门内饰大多和整车内饰在同一个网格里，`build_glb.py` 按连通块拆出来（整块都在车门范围里的才算，安全带除外）。车身漆面是双面材质，开门会看到门板背面，所以车漆 shader 把背面画成深色内衬色。车顶是固定的碳纤维顶，没有能开的天窗
- 环境里那个漂浮的红色光圈在白车上反射很明显，强度从原示例的 1 降到了 0.2

## 已删除

- `public/static/porsche-911.glb`、`porsche-plate*.png`、`public/draco/`：只有 911 展厅用，换车后不再需要（Lexus 模型没有 Draco 压缩）

## 内饰和键盘

- 内饰换色：`Leather`（座椅中间、门板皮面）和 `Leather_2`（座椅包边、中控台、门板）两种材质。黑色是原贴图；其他颜色先把贴图转成只有明暗的灰度图（`luminanceTexture()`，95% 分位数当白），再乘上颜色，缝线和褶皱都保留
- 键盘（只在 Showroom 打开时生效）：A / D 打方向，最大 30°，松手回正，内侧轮多转一点（阿克曼）；S 刹车，刹车灯比尾灯更亮，车身往前点头约 0.7°。W 暂时不做
- 转向：轮胎、三层轮毂、中心盖、刹车盘、卡钳按材质组和位置（车头一侧）挑出来，挂到车轮中心的转向节点上

## 车灯"穿雾"效果

开灯时（`createHeadlightBeams()`）：

- 两道体积光锥：开口圆锥（灯口 6 cm，4.6 m 外半径 1.05 m），自定义 shader，越正对中心越亮、往前衰减，里面有两层缓慢飘动的 3D 噪声当雾气。画布是透明的，所以颜色和 alpha 都直接累加，页面显示 = rgb + 背景 × (1 − alpha)
- 灯头光晕：加法混合的径向渐变 sprite
- 两盏不投影的 SpotLight 照亮车前地面。聚光灯一直挂在场景里只改强度，因为灯的数量一变所有材质都要重新编译
- 白天模式下三者都调弱。烘焙地面阴影时先把光锥藏起来；量车的包围盒时也不算光锥

## 首页视频

首页卡片放的是一段 60 秒的雨夜赛博城市短片：从监控画面开始，经过大灯醒来、无人机追车、路口漂移、隧道，最后停在 Showroom 转台上。

- 制作：Blender 5.2（Cycles）渲染，2048×1024、512 采样，在 RunPod 上用 8 台 GPU 分帧渲染。
- 调色：用 numpy 做，风格是黑金（低饱和、偏暖，暗部略提亮）。尾灯和 Showroom 红圈单独压亮度、加饱和，否则 AgX 会把高亮的红推成粉白。
- 工程文件 `city-lexus-60s.blend` 不在 repo 里，在 Jason 本机的 `E:\3D素材\项目\porsche-911`。

### 文件（`public/static/`，都是 30 fps、无声、faststart）

| 文件 | 分辨率 | 编码 | 大小 |
|---|---|---|---|
| `lexus-lc500-2k.av1.mp4` | 2048×1024 | AV1（SVT-AV1，约 1.9 Mbps） | 14 MB |
| `lexus-lc500-2k.h264.mp4` | 2048×1024 | H.264 High 5.1 | 21 MB |
| `lexus-lc500-1200.av1.mp4` | 1200×600 | AV1（约 0.85 Mbps） | 6 MB |
| `lexus-lc500-1200.h264.mp4` | 1200×600 | H.264 High 5.0 | 11 MB |
| `lexus-lc500-poster-v4.webp` | 2048×1024 | 第 1380 帧（车外后视镜机位，Jason 选的） | 100 KB |

### 加载策略（`components/media/car.jsx`）

- **封面图垫底**：封面图用 `<img>` 一直垫在下面，视频准备好之后再淡入盖住，所以加载期间看到的是封面，不是黑块。
- **视频延后加载**：`preload="none"`，卡片进入视口附近（300px）才开始加载；而且要等页面 `load` 事件和空闲之后才开始拉，不和首屏资源抢带宽。
- **选清晰度**：卡片实际像素（CSS 宽 × devicePixelRatio）≥ 1100 时用 2K，例如 Retina 屏上 600px 宽的卡片；手机、普通屏、Save-Data 或 2G/3G 网络用 1200。
- **选编码**：先用 `canPlayType` 试 AV1（体积大约是 H.264 的 2/3，画质更好），不支持就退回 H.264。
- **暂停**：离开视口、打开 Showroom、或者系统开了「减少动态效果」时暂停。开了「减少动态效果」时完全不下载视频。
- **改文件名**：`vercel.json` 给 mp4 和 webp 设了一年的 immutable 缓存，所以换片子时必须换文件名，否则老访客看到的还是旧视频。

### 授权

- 车：Lexus LC 500 WALD Sports Line，作者 VeCarz，CC BY-NC 4.0，改了车漆和车牌
- 监控摄像头：Marcel Schanz，CC BY 4.0
- 城市：KitBash3D Neo City

以前的 911 循环视频已经从 repo 删掉。
