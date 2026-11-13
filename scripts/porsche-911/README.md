# 3D 保时捷 911

首页头像上方的 3D 车由 `components/media/car.jsx` 和 `components/media/carScene.js` 渲染。

场景移植自 pmndrs 的 [Building Live Env Maps](https://github.com/pmndrs/examples/tree/main/examples/building-live-envmaps) 示例（Paul Henschel，[codesandbox.io/s/lwo219](https://codesandbox.io/s/lwo219)），原示例用 React Three Fiber + drei，这里改写成了纯 three.js：

- 实时环境贴图：顶棚、一排移动的灯带、两侧灯条、漂浮的红色点缀光，背景用 `#444` 底色加蓝色渐变。每隔一帧用 CubeCamera 和 PMREM 重新生成一次环境贴图，同时用作模糊背景
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
