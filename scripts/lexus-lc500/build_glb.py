"""Lexus LC 500 Wald (Sketchfab, vecarz, CC BY-NC 4.0) -> 网页用 GLB

- 顶点量化（KHR_mesh_quantization）：位置 int16、法线 int8，UV 保持 float
  位置用"每个 mesh 一个均匀缩放 + 平移"的子节点还原，均匀缩放不会让法线变形
- 贴图：有透明的保留 PNG，其他转 JPEG（q92）；超过 2048 的缩到 2048
- 车尾车牌（材质 "Material #13"）换成 JKERORO（正向存储，渲染出来是正的）
- 轮毂中心盖（材质 "Material #49"，原来是 MSW 的标）换成 JK；它的法线贴图换成平的
- 材质参数不在这里改，网页运行时按材质名调（components/media/carScene.js）
"""
import io, json, os, struct, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gl import load, accessor

# 用法：python3 scripts/lexus-lc500/build_glb.py [输出.glb] [Sketchfab 原版 .glb]
SRC = sys.argv[2] if len(sys.argv) > 2 else "source/Sketchfab_2026_11_14_14_55_43.glb"  # 原版不在 repo 里
OUT = sys.argv[1] if len(sys.argv) > 1 else "public/static/lexus-lc500.glb"
PLATE = os.path.join(HERE, "plate_jkeroro.png")
CAP = os.path.join(HERE, "cap_jk.png")
MAX_TEX = 2048

j, b = load(SRC)
out = bytearray()
views = []
accessors = []


def add_view(data, stride=None, target=None):
    while len(out) % 4:
        out.append(0)
    v = {"buffer": 0, "byteOffset": len(out), "byteLength": len(data)}
    if stride:
        v["byteStride"] = stride
    if target:
        v["target"] = target
    out.extend(data)
    views.append(v)
    return len(views) - 1


def add_accessor(view, ctype, count, typ, normalized=False, mn=None, mx=None):
    a = {"bufferView": view, "componentType": ctype, "count": count, "type": typ}
    if normalized:
        a["normalized"] = True
    if mn is not None:
        a["min"], a["max"] = mn, mx
    accessors.append(a)
    return len(accessors) - 1


# ---------------------------------------------------------------- geometry
mesh_users = {}
for i, n in enumerate(j["nodes"]):
    if "mesh" in n:
        mesh_users.setdefault(n["mesh"], []).append(i)

new_nodes = list(j["nodes"])
for mi, mesh in enumerate(j["meshes"]):
    prims = mesh["primitives"]
    allp = np.concatenate([accessor(j, b, p["attributes"]["POSITION"]).astype(np.float64) for p in prims])
    lo, hi = allp.min(0), allp.max(0)
    c = (lo + hi) / 2
    s = float(max((hi - lo).max() / 2, 1e-6))
    for p in prims:
        P = accessor(j, b, p["attributes"]["POSITION"]).astype(np.float64)
        q = np.clip(np.round((P - c) / s * 32767), -32767, 32767).astype(np.int16)
        buf = np.zeros((len(q), 4), np.int16)
        buf[:, :3] = q
        v = add_view(buf.tobytes(), stride=8, target=34962)
        pa = add_accessor(v, 5122, len(q), "VEC3", True, q.min(0).tolist(), q.max(0).tolist())

        N = accessor(j, b, p["attributes"]["NORMAL"]).astype(np.float64)
        N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
        nq = np.clip(np.round(N * 127), -127, 127).astype(np.int8)
        nb = np.zeros((len(nq), 4), np.int8)
        nb[:, :3] = nq
        v = add_view(nb.tobytes(), stride=4, target=34962)
        na = add_accessor(v, 5120, len(nq), "VEC3", True)

        UV = accessor(j, b, p["attributes"]["TEXCOORD_0"]).astype(np.float32)
        v = add_view(UV.tobytes(), target=34962)
        ua = add_accessor(v, 5126, len(UV), "VEC2")

        I = accessor(j, b, p["indices"])
        v = add_view(I.astype(I.dtype).tobytes(), target=34963)
        ia = add_accessor(v, j["accessors"][p["indices"]]["componentType"], I.size, "SCALAR")

        p["attributes"] = {"POSITION": pa, "NORMAL": na, "TEXCOORD_0": ua}
        p["indices"] = ia

    # 把 mesh 挪到一个带"还原量化"变换的子节点上
    for ni in mesh_users.get(mi, []):
        node = new_nodes[ni]
        child = {"name": (node.get("name") or "mesh") + "_q", "mesh": mi,
                 "translation": c.tolist(), "scale": [s, s, s]}
        new_nodes.append(child)
        node.setdefault("children", []).append(len(new_nodes) - 1)
        del node["mesh"]
j["nodes"] = new_nodes

# ---------------------------------------------------------------- images
alpha_mats = {i for i, m in enumerate(j["materials"]) if m.get("alphaMode") in ("BLEND", "MASK")}
alpha_images = set()
for mi in alpha_mats:
    t = j["materials"][mi].get("pbrMetallicRoughness", {}).get("baseColorTexture")
    if t:
        alpha_images.add(j["textures"][t["index"]]["source"])

def image_of(material_name, slot):
    for m in j["materials"]:
        if m["name"] == material_name:
            t = m["pbrMetallicRoughness"].get("baseColorTexture") if slot == "base" else m.get("normalTexture")
            return j["textures"][t["index"]]["source"]


plate_img = image_of("Material #13", "base")
cap_img = image_of("Material #49", "base")
cap_normal_img = image_of("Material #49", "normal")

src_views = j["bufferViews"]
report = []
for ii, img in enumerate(j["images"]):
    bv = src_views[img["bufferView"]]
    raw = b[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]]
    if ii == plate_img:
        im = Image.open(PLATE)
    elif ii == cap_img:
        # 贴图中心 (0.485, 0.44) 对着盖子中心；四个轮子上都是正向、不镜像
        im = Image.open(CAP)
    elif ii == cap_normal_img:
        im = Image.new("RGB", (8, 8), (128, 128, 255))
    else:
        im = Image.open(io.BytesIO(raw))
        im.load()
    if max(im.size) > MAX_TEX:
        k = MAX_TEX / max(im.size)
        im = im.resize((round(im.size[0] * k), round(im.size[1] * k)), Image.LANCZOS)
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    if has_alpha:
        rgba = im.convert("RGBA")
        if np.asarray(rgba)[..., 3].min() == 255:
            has_alpha = False
    keep_png = has_alpha and ii in alpha_images
    bio = io.BytesIO()
    if keep_png:
        im.convert("RGBA").save(bio, "PNG", optimize=True)
        mime = "image/png"
    else:
        im.convert("RGB").save(bio, "JPEG", quality=92, subsampling=0 if ii in (plate_img, cap_img) else 2, optimize=True)
        mime = "image/jpeg"
    data = bio.getvalue()
    img["bufferView"] = add_view(data)
    img["mimeType"] = mime
    report.append((img.get("name"), im.size, mime, len(data)))

j["bufferViews"] = views
j["accessors"] = accessors
j["buffers"] = [{"byteLength": len(out)}]
j["extensionsUsed"] = sorted(set(j.get("extensionsUsed", [])) | {"KHR_mesh_quantization"})
j["extensionsRequired"] = sorted(set(j.get("extensionsRequired", [])) | {"KHR_mesh_quantization"})
j.setdefault("asset", {})["generator"] = "jkeroro build_glb.py (from Sketchfab export)"

while len(out) % 4:
    out.append(0)
js = json.dumps(j, separators=(",", ":")).encode()
js += b" " * ((4 - len(js) % 4) % 4)
total = 12 + 8 + len(js) + 8 + len(out)
with open(OUT, "wb") as f:
    f.write(struct.pack("<III", 0x46546C67, 2, total))
    f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack("<II", len(out), 0x004E4942)); f.write(out)

img_total = sum(r[3] for r in report)
print("glb MB", round(total / 1e6, 2), "images MB", round(img_total / 1e6, 2))
for r in sorted(report, key=lambda r: -r[3])[:10]:
    print(r)
