# Run inside Blender (Scripting tab) with jkeroro-911.blend open.
# Samples particles from the car surfaces and dumps a decimated occluder mesh,
# then run build_bin.py to pack them into public/static/porsche-911.bin.
import bpy, numpy as np, os

OUT = os.path.join(os.path.dirname(bpy.data.filepath))
NPTS = 120000
OCCLUDER_TRIS = 24000

# material -> (base brightness, sampling density multiplier)
MAT = {"paint": (0.08, 1.0), "rim_white": (1.0, 1.7), "silver": (0.55, 1.0), "rubber": (0.05, 0.6),
       "plastic": (0.10, 0.8), "full_black": (0.04, 0.5), "window": (0.16, 0.9), "glass": (0.30, 1.2),
       "lights": (0.85, 1.5), "tex_shiny": (0.55, 1.0), "logo": (0.9, 3.0), "license": (0.04, 2.5),
       "plate_text": (1.0, 30.0), "Material.001": (0.45, 1.2), "Material": (0.1, 1.0)}
SKIP_POINTS = {"underbody", "boot"}  # floor pan: in occluder only

dg = bpy.context.evaluated_depsgraph_get()
tris_all, norms_all, bright, dens, occ_v, occ_i, voff = [], [], [], [], [], [], 0
for o in bpy.data.objects:
    if o.type not in ('MESH', 'FONT') or o.name == "Occluder":
        continue
    e = o.evaluated_get(dg); m = e.to_mesh(); m.calc_loop_triangles()
    mw = np.array(e.matrix_world); R = mw[:3, :3]; nR = np.linalg.inv(R).T
    co = np.empty(len(m.vertices) * 3, np.float32); m.vertices.foreach_get("co", co); co = co.reshape(-1, 3) @ R.T + mw[:3, 3]
    nt = len(m.loop_triangles)
    if nt == 0:
        e.to_mesh_clear(); continue
    lv = np.empty(nt * 3, np.int32); m.loop_triangles.foreach_get("vertices", lv); lv = lv.reshape(-1, 3)
    ll = np.empty(nt * 3, np.int32); m.loop_triangles.foreach_get("loops", ll); ll = ll.reshape(-1, 3)
    mi = np.empty(nt, np.int32); m.loop_triangles.foreach_get("material_index", mi)
    cn = np.empty(len(m.loops) * 3, np.float32); m.corner_normals.foreach_get("vector", cn)
    cn = cn.reshape(-1, 3) @ nR.T; cn /= np.linalg.norm(cn, axis=1, keepdims=True) + 1e-9
    names = [(s.material.name if s.material else "Material") for s in o.material_slots] or ["Material"]
    occ_v.append(co); occ_i.append(lv + voff); voff += len(co)
    if o.name not in SKIP_POINTS:
        look = [MAT.get(names[min(i, len(names) - 1)], (0.1, 1.0)) for i in mi]
        tris_all.append(co[lv]); norms_all.append(cn[ll])
        bright.append(np.array([l[0] for l in look], np.float32)); dens.append(np.array([l[1] for l in look], np.float32))
    e.to_mesh_clear()

T = np.concatenate(tris_all); Nn = np.concatenate(norms_all); B = np.concatenate(bright); D = np.concatenate(dens)
area = 0.5 * np.linalg.norm(np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]), axis=1)
w = area * D; w /= w.sum()
rng = np.random.default_rng(7)
idx = rng.choice(len(T), NPTS, p=w)  # random order -> any prefix is a valid subset (mobile)
r1 = np.sqrt(rng.random(NPTS)); r2 = rng.random(NPTS)
a = (1 - r1)[:, None]; b = (r1 * (1 - r2))[:, None]; c = (r1 * r2)[:, None]
P = a * T[idx, 0] + b * T[idx, 1] + c * T[idx, 2]
N = a * Nn[idx, 0] + b * Nn[idx, 1] + c * Nn[idx, 2]; N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
np.save(os.path.join(OUT, "_pts.npy"), np.hstack([P, N, B[idx][:, None]]).astype(np.float32))

# occluder: merge, weld, decimate, shrink slightly so it never covers real surface particles
OV = np.concatenate(occ_v); OI = np.concatenate(occ_i)
me = bpy.data.meshes.new("occ"); me.from_pydata(OV.tolist(), [], OI.tolist()); me.update()
ob = bpy.data.objects.new("Occluder", me); bpy.context.scene.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob
for s in bpy.context.selected_objects: s.select_set(False)
ob.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=0.002); bpy.ops.object.mode_set(mode='OBJECT')
ob.modifiers.new("dec", 'DECIMATE').ratio = OCCLUDER_TRIS / len(me.polygons)
sh = ob.modifiers.new("shrink", 'DISPLACE'); sh.strength = -0.025; sh.direction = 'NORMAL'
dg = bpy.context.evaluated_depsgraph_get(); e = ob.evaluated_get(dg); m = e.to_mesh(); m.calc_loop_triangles()
v = np.empty(len(m.vertices) * 3, np.float32); m.vertices.foreach_get("co", v)
t = np.empty(len(m.loop_triangles) * 3, np.int32); m.loop_triangles.foreach_get("vertices", t)
np.save(os.path.join(OUT, "_occd_v.npy"), v.reshape(-1, 3)); np.save(os.path.join(OUT, "_occd_i.npy"), t.reshape(-1, 3))
e.to_mesh_clear(); bpy.data.objects.remove(ob, do_unlink=True)
