import sys,re; sys.path.insert(0,'.')
from gl import *
from collections import defaultdict
def components(I, n):
    parent=np.arange(n)
    def find(a):
        while parent[a]!=a:
            parent[a]=parent[parent[a]]; a=parent[a]
        return a
    for a,b_,c in I:
        ra,rb,rc=find(a),find(b_),find(c)
        parent[rb]=ra; parent[find(rc)]=ra
    roots=np.array([find(i) for i in range(n)])
    return roots
def door_tris(c, I, P_world=None, return_drop=False):
    """返回每个三角形是否属于车门（按连通块判断）；return_drop=True 时另外返回要删掉的三角形"""
    # 合并位置相同的顶点（UV 缝会把顶点拆开）
    key=np.round(c,4)
    _,inv=np.unique(key,axis=0,return_inverse=True)
    inv=inv.reshape(-1)
    Iw=inv[I]
    roots=components(Iw, inv.max()+1)
    tri_root=roots[Iw[:,0]]
    x=np.abs(c[:,0]); y=c[:,1]; z=c[:,2]
    # y 下限 0.37：门槛上的迎宾踏板（y 0.31~0.35）属于车身
    inside=(x>0.62)&(z>-0.66)&(z<0.76)&(y>0.37)&(y<1.0)
    vin=inside
    res=np.zeros(len(I),bool)
    drop=np.zeros(len(I),bool)
    for r in np.unique(tri_root):
        t=tri_root==r
        vs=np.unique(I[t])
        frac=vin[vs].mean()
        if frac>0.97 and len(vs)>=3:
            ctr=c[vs].mean(0)
            # 门内饰板在 |x| 0.62~0.74；再往外、车门后半段的小件（卡扣、锯齿件）藏在车门夹层里，
            # 关门时看不见，开门后会悬在半空，直接删掉
            if abs(ctr[0])>0.745 and ctr[2]<0.3:
                drop[t]=True
            else:
                res[t]=True
    return (res, drop) if return_drop else res
if __name__=='__main__':
    j,b=load('source/Sketchfab_2026_11_14_14_55_43.glb')
    W=worlds(j)
    for i,nd in enumerate(j['nodes']):
        if 'mesh' not in nd or re.match(r'^(L_Door|R_door|r_Door|Door)',nd.get('name','')): continue
        for p in j['meshes'][nd['mesh']]['primitives']:
            P=accessor(j,b,p['attributes']['POSITION']).astype(float); c=(W[i][:3,:3]@P.T).T+W[i][:3,3]
            I=accessor(j,b,p['indices']).reshape(-1,3).astype(np.int64)
            d=door_tris(c,I)
            if d.sum(): print(f"{nd['name']:24s} {j['materials'][p['material']]['name']:16s} door tris {d.sum():5d}/{len(I)}")
