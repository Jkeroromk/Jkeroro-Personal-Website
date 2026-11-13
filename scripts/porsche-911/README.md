# 3D 保时捷 911（`public/static/porsche-911.glb`）

首页头像上方的 3D 车由 `components/media/car.jsx` 和 `components/media/carScene.js` 渲染，用的就是这个模型。效果参考 TresJS / R3F 的 "Porsche 911 Car Showcase"（by 0xca0a）：动态灯带反射、车底接触阴影、镜头跟随鼠标轻微移动。

## 模型来源与授权

- 原始模型：[“(FREE) Porsche 911 Carrera 4S”](https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf)，作者 **Lionsharp Studios**
- 授权：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- 修改内容：在 Blender 里把车漆改成黑色、轮毂改成白色（材质 `rim_white`），前后车牌改成黑底，加了白色立体字 “JKERORO”（材质 `license`、`plate_text`），删除了内饰、背景、地面和多余的轮胎
- 根据 ShareAlike 条款，`porsche-911.glb` 这个衍生文件同样以 CC BY-SA 4.0 授权；网站上画布右下角有作者署名

## 重新导出

1. 打开改好的 `jkeroro-911.blend`（不在 repo 里，放在 Jason 本机的 Downloads/porsche-911 文件夹）
2. 选中所有 Mesh 和 Text 对象，File → Export → glTF 2.0，设置如下：
   - Format：GLB
   - Include：Selected Objects
   - Mesh：Apply Modifiers
   - Compression：Draco，level 10
3. 覆盖 `public/static/porsche-911.glb`

车漆、轮毂、玻璃等最终的网页材质参数，在 `carScene.js` 的 `tuneMaterials()` 里按材质名调整。

## Draco 解码器

`public/draco/` 是 three.js r172 自带的 Draco 解码器（`examples/jsm/libs/draco/gltf/`）。解码器跑在 blob worker 里，所以 CSP 里加了 `worker-src 'self' blob:`。GLB 里的贴图会通过 blob URL 加载，所以 `connect-src` 也加了 `blob:`。`next.config.ts` 和 `vercel.json` 两处的 CSP 都改了。
