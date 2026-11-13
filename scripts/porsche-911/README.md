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

首页卡片放的是 `public/static/porsche-911-loop.mp4`，一段 10 秒、能无缝循环的「夜间隧道飞驰」短片，在 Blender（Cycles）里渲染。

- 工程文件：`tunnel-911.blend`，不在 repo 里，放在 Jason 本机的 Downloads/porsche-911。车模就是网站用的 `porsche-911.glb` 导入后修改的：
  - 清掉了 Draco 量化法线，改成按角度平滑，避免车漆上出现噪点
  - 黑色清漆车漆、白色轮辐、JKERORO 车牌
- 怎么做出速度感：车身不动，只有轮子在转（`WheelSpin000` / `WheelSpin001` 两个 empty 用 driver 驱动）；整条隧道（`TunnelMover`）用 driver 以每帧 1.2 m 的速度往后移动；再加 0.5 快门的运动模糊。车身有轻微颠簸，镜头有轻微抖动，都是 driver 里的 sin 叠加
- 镜头：4 台相机，用 timeline marker 切换，每台都有缓慢推拉：
  - 1–75 帧：低机位车头
  - 76–130 帧：轮毂特写
  - 131–205 帧：侧面平移
  - 206–300 帧：车尾 + JKERORO 车牌

  最后一个镜头直接切回第一个，所以循环看不出接缝
- 渲染参数：1200×600、30fps、64 samples、OptiX 降噪。在 RTX 5070 Ti 上约 6 分钟
- 压缩命令：`ffmpeg -i src.mp4 -an -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p -movflags +faststart porsche-911-loop.mp4`。封面图取第 1 秒那一帧
