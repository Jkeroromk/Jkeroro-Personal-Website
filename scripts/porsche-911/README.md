# 3D 保时捷 911

首页头像上方的卡片放的是一段 6 秒循环视频（`public/static/porsche-911-loop.mp4`），是同一台车在 Blender（Cycles）里渲染出来的。卡片右上角的 **Enter Showroom** 才会加载 three.js 和 3D 模型（`components/media/carScene.js`）。卡片右上角的 **Enter Showroom** 按钮会打开全屏展厅 `components/media/Showroom.jsx`，参考的是 3DVista 的汽车展示页。展厅里有这些功能：

- 分区导航：Overview / Specifications / Wheels / Lights / Rear，点了镜头会飞到对应机位，车后面显示大号水印标题
- 换车漆（5 种）和轮毂（3 种）、开关车灯
- 白天 / 夜晚切换、隐藏界面、自动旋转
- 鼠标拖拽环绕、滚轮缩放，有角度和距离限制；按 Esc 关闭

展厅打开时首页视频会暂停。

场景移植自 pmndrs 的 [Building Live Env Maps](https://github.com/pmndrs/examples/tree/main/examples/building-live-envmaps) 示例（Paul Henschel，[codesandbox.io/s/lwo219](https://codesandbox.io/s/lwo219)），原示例用 React Three Fiber + drei，这里改写成了纯 three.js：

- 实时环境贴图：顶棚、一排移动的灯带、两侧灯条、漂浮的红色点缀光，背景改成了中性灰（原示例是 `#444` 加蓝色渐变，偏紫）。每隔一帧用 CubeCamera 和 PMREM 重新生成一次环境贴图，同时用作模糊背景
- 带阴影的顶部 SpotLight 和 AmbientLight，数值与原示例一致
- 原示例的 drei `AccumulativeShadows` 换成了一次性烘焙的软接触阴影，挂在车的转动节点上，车转阴影也跟着转
- 原示例的镜头会缓慢漂移，这里保留了；但镜头不跟随鼠标。车自己会小幅左右转动，只有在画布里按住才能拖动，最多偏离约 35°

## 文件

| 文件 | 说明 |
|---|---|
| `public/static/porsche-911.glb` | 原示例里的 `911-transformed.glb`（gltfjsx 转换过的版本，Draco 压缩），未作修改 |
| `public/static/porsche-plate.png` | JKERORO 车牌贴图，由原车牌贴图修改而来，字体用的是 Bahnschrift（DIN 风格） |
| `public/static/porsche-plate-normal.png` | 车牌法线贴图，按新字母重新生成了凸起 |
| `public/draco/` | three.js r172 自带的 Draco 解码器 |

车漆、外层清漆（coat）、白色轮毂这些修改都在 `carScene.js` 的 `tuneMaterials()` 里，加载模型后在运行时完成，所以 GLB 本身没有改。轮毂的做法是把两组轮子上的 `silver` 材质单独复制一份改成白色，车身其它 silver 饰条不受影响。

注意：车牌贴图和 glTF 贴图一样是上下翻转存储的（`flipY = false`）。修改时先上下翻转图片，改完再翻回去。

## 模型来源与授权

- 模型：[“(FREE) Porsche 911 Carrera 4S”](https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf)（Sketchfab）
- 授权：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- 修改内容：车漆改成黑色、轮毂改成白色、车牌改成 JKERORO
- 根据 ShareAlike 条款，上面这些衍生文件同样以 CC BY-SA 4.0 授权；网站上画布右下角有出处链接

## CSP

Draco 解码器跑在 blob worker 里，GLB 内嵌的贴图通过 blob URL 加载，所以 `next.config.ts` 和 `vercel.json` 的 CSP 里加了 `worker-src 'self' blob:`，`connect-src` 也加了 `blob:`。

## 首页视频

首页卡片放的是 `public/static/porsche-911-loop.mp4`：一段 18 秒、可以无缝循环的「雨夜赛博城市」短片，1200×600、30fps，用 Blender（Cycles）渲染。工程文件 `city-911.blend` 不在 repo 里，在 Jason 本机的 Downloads/porsche-911。

### 场景

- 车沿着一条解析路径真实行驶：直道 → 十字路口左转漂移 → 横街，城市本身不动。整条路线的车速、距离、偏航、漂移角、前轮转角、车身俯仰和侧倾都由文本块 `car_drivers.py` 里的驱动函数算出来，所以后台渲染必须加 `-y`
- 车速约 95–122 km/h。轮子转速 = 行驶距离 ÷ 轮胎半径（0.328 m），配合 0.6 快门的运动模糊，避免车轮倒转的频闪
- 漂移：约 9.1–11 秒，甩尾约 20°，前轮反打约 9°。刹车时尾灯变亮、车头下沉，后轮有水花和烟雾
- 两次氮气（6.6 秒、10.4 秒），是排气管口的白芯蓝焰短喷。13.3 秒车切入被超车前方的车道
- 黑色车身靠 5 盏只照车的面光灯（light linking）勾出狭长的轮廓高光
- 湿路面带积水倒影，Geometry Nodes 做的雨（世界坐标，跟着车走），体积雾，中日文霓虹招牌，全息广告牌，程序化楼体窗户
- 行人：Mixamo 的 8 个角色，都是原地走路动画，每个角色做了 3 个相位不同的版本，避免步伐同步
- 车流：地面有被超车、慢车、对向车，横街也有车流；空中有飞行器在楼与楼之间穿梭

### 镜头（540 帧）

| 帧 | 镜头 |
|---|---|
| 1–84 | 车头追拍，20mm，镜头跟随带惯性 |
| 85–132 | 贴地广角，放在前轮旁边顺着车身往前拍 |
| 133–228 | 侧面跟拍，被超车从前景擦过，带冲击晃动 |
| 229–378 | 车尾追拍：刹车、漂移、出弯氮气 |
| 379–414 | 俯拍，车切入另一条车道 |
| 415–540 | 车迎面冲过低机位，车身擦满画面后切回开头，形成循环 |

### 渲染与压缩

- 1200×600、64 samples、OptiX 降噪、AgX Medium High Contrast，输出 PNG 序列。在 RTX 5070 Ti 上全片约 1 小时 40 分钟（漂移段有体积烟雾，比较慢）
- 先在 Blender 里把序列编码成无损 H.264，再压成网页版：`ffmpeg -i src.mp4 -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart porsche-911-loop.mp4`，约 7 MB
- 封面图取第 1 帧

### 素材署名

下面这些都来自 Sketchfab，除非另外注明，授权都是 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)：

- [Cyberpunk car](https://sketchfab.com/3d-models/cyberpunk-car-b4301ff99d214d16a7a43708a5866bf0)，作者 4d_Bob
- [Dirty car](https://sketchfab.com/3d-models/dirty-car-da77a8c75ddd4d7a8391912ba35735b8)，作者 3D Error 404
- [Cyberpunk Bike Concept Design](https://sketchfab.com/3d-models/cyberpunk-bike-concept-design-99290272e69d4cd8a56af2d2e1274e0d)，作者 Berk Gedik
- [(FREE) Cyberpunk Hovercar](https://sketchfab.com/3d-models/free-cyberpunk-hovercar-3205b1075bb44ffc826bce0c2a04d74c)，作者 Lionsharp Studios，授权 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- [Sky Cab](https://sketchfab.com/3d-models/sky-cab-2322696582de46e2ba816352ff243337)，作者 Helsingr
- [Delivery Hover MP-1](https://sketchfab.com/3d-models/delivery-hover-mp-1-7de03ad0759f45f0a3795520d2513e1f)，作者 Alt
- [Cyberpunk_taxi](https://sketchfab.com/3d-models/cyberpunk-taxi-922c7a92bfd047d9bf9b6da22a3421cb)，作者 maosichinchilla
- 行人角色和走路动画来自 [Mixamo](https://www.mixamo.com)（Adobe），免费使用
