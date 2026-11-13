# 3D 粒子保时捷（`public/static/porsche-911.bin`）

首页头像上方的 3D 粒子 911（`components/media/car.jsx`）用的就是这个文件。

## 模型来源与授权

- 原始模型：[“(FREE) Porsche 911 Carrera 4S”](https://sketchfab.com/3d-models/free-porsche-911-carrera-4s-d01b254483794de3819786d93e0e1ebf)，作者 **Lionsharp Studios**
- 授权：[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- 修改内容：车漆改成黑色、轮毂改成白色、前后车牌改为 “JKERORO”，删除了内饰、背景和地面，然后从车身表面采样成粒子点云，并附带一个减面后的遮挡网格
- 根据 ShareAlike 条款，`porsche-911.bin` 这个衍生文件同样以 CC BY-SA 4.0 授权；网站上画布右下角有作者署名

## 重新生成

1. 在 Blender 里打开改好的 `jkeroro-911.blend`，在 Scripting 里运行 `sample_in_blender.py`。它会在 .blend 所在的文件夹里输出 `_pts.npy`、`_occd_v.npy` 和 `_occd_i.npy`
2. 运行 `python build_bin.py public/static/porsche-911.bin <上一步的输出文件夹>`

想调粒子数量、各材质的亮度和采样密度，改 `sample_in_blender.py` 顶部的 `NPTS` 和 `MAT`。

## 文件格式（小端序，每段按 4 字节对齐）

| 段 | 类型 | 说明 |
|---|---|---|
| header | `"JKCR"`, u32 version, u32 pointCount, u32 occVertCount, u32 occTriCount, f32[3] min, f32[3] max | 44 bytes |
| positions | int16 × 3 × pointCount | 按 min/max 量化到 [-32768, 32767] |
| normals | int8 × 3 × pointCount | normalized |
| base | uint8 × pointCount | 材质基础亮度（0–255） |
| occluder positions | int16 × 3 × occVertCount | 同上量化 |
| occluder indices | uint16 × 3 × occTriCount | |

坐标系是 Three.js 的 Y-up，车头朝 +Z。粒子的顺序是随机的，取任意前 N 个都是一个均匀的子集，手机端只用前 70k 个。
