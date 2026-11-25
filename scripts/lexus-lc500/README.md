# Showroom 里的 Lexus LC 500（WALD Sports Line）

首页卡片右上角的 **Enter Showroom** 会打开全屏展厅 `components/media/Showroom.jsx`，3D 场景在 `components/media/carScene.js`（纯 three.js，移植自 pmndrs 的 Building Live Env Maps 示例，见 `scripts/porsche-911/README.md`）。2026-11 起展厅里的车从保时捷 911 换成了这台 Lexus。

## 模型来源与授权

- 模型：[“Lexus LC 500 WALD Sports Line | www.vecarz.com”](https://sketchfab.com/3d-models/lexus-lc-500-wald-sports-line-wwwvecarzcom-120879ad2666438b86d080dcf26621fa)，作者 VeCarz（Sketchfab @heynic）
- 授权：[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)，只能非商业使用，必须署名 “VeCarz – www.vecarz.com”。展厅右下角有出处链接
- 修改内容：车尾车牌换成 JKERORO；顶点量化、贴图压缩；材质参数在网页运行时重新调过

## 文件

| 文件 | 说明 |
|---|---|
| `public/static/lexus-lc500.glb` | 网页用模型，约 14 MB（33 万面）。由 `build_glb.py` 从 Sketchfab 下载的原版 GLB（Original format，约 53 MB）生成 |
| `scripts/lexus-lc500/build_glb.py` | 生成脚本：位置 int16、法线 int8（`KHR_mesh_quantization`），贴图最大 2048，没有透明的转 JPEG，车牌换成 `plate_jkeroro.png` |
| `scripts/lexus-lc500/gl.py` | 读 GLB 的小工具 |
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
- 环境里那个漂浮的红色光圈在白车上反射很明显，强度从原示例的 1 降到了 0.2

## 已删除

- `public/static/porsche-911.glb`、`porsche-plate*.png`、`public/draco/`：只有 911 展厅用，换车后不再需要（Lexus 模型没有 Draco 压缩）
