import json,struct,numpy as np
def load(p):
    f=open(p,'rb').read()
    L=struct.unpack('<I',f[12:16])[0]; j=json.loads(f[20:20+L])
    off=20+L; BL=struct.unpack('<I',f[off:off+4])[0]; bin_=f[off+8:off+8+BL]
    return j,bin_
def qmat(q):
    x,y,z,w=q
    return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def local(n):
    M=np.eye(4)
    if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
    S=np.diag(n.get('scale',[1,1,1])+[1]); R=np.eye(4); R[:3,:3]=qmat(n.get('rotation',[0,0,0,1])); T=np.eye(4); T[:3,3]=n.get('translation',[0,0,0])
    return T@R@S
def worlds(j):
    W={}
    def rec(i,P):
        M=P@local(j['nodes'][i]); W[i]=M
        for c in j['nodes'][i].get('children',[]): rec(c,M)
    for r in j['scenes'][0]['nodes']: rec(r,np.eye(4))
    return W
def accessor(j,b,ai):
    a=j['accessors'][ai]; bv=j['bufferViews'][a['bufferView']]
    if '_bytes' in bv:  # build_glb.py 里新加的、还没写进 buffer 的数据
        b=bv['_bytes']; bv={'byteOffset':0}
    comp={5126:np.float32,5123:np.uint16,5125:np.uint32,5121:np.uint8,5122:np.int16,5120:np.int8}[a['componentType']]
    n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    o=bv.get('byteOffset',0)+a.get('byteOffset',0); st=bv.get('byteStride',0)
    isz=np.dtype(comp).itemsize*n
    if st and st!=isz:
        raw=np.frombuffer(b,np.uint8,count=st*a['count'],offset=o).reshape(a['count'],st)[:,:isz].copy()
        return raw.view(comp).reshape(a['count'],n)
    return np.frombuffer(b,comp,count=a['count']*n,offset=o).reshape(a['count'],n)
