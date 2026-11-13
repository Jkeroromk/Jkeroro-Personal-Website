# Usage: python build_bin.py <out.bin> <dir with _pts.npy, _occd_v.npy, _occd_i.npy>
import numpy as np, struct, sys, os
src=sys.argv[2] if len(sys.argv)>2 else "."
pts=np.load(os.path.join(src,"_pts.npy")); OV=np.load(os.path.join(src,"_occd_v.npy")); OI=np.load(os.path.join(src,"_occd_i.npy"))
def conv(a): return np.stack([a[:,0],a[:,2],-a[:,1]],1)
P=conv(pts[:,:3]); N=conv(pts[:,3:6]); BR=pts[:,6]
OVt=conv(OV)
lo=np.minimum(P.min(0),OVt.min(0)); hi=np.maximum(P.max(0),OVt.max(0))
ctr=(lo+hi)/2; P-=ctr; OVt-=ctr; lo-=ctr; hi-=ctr
def q16(a): return np.round((a-lo)/(hi-lo)*65535-32768).clip(-32768,32767).astype('<i2')
qp=q16(P); qn=np.round(N*127).clip(-127,127).astype('i1'); qb=np.round(BR*255).astype('u1')
qo=q16(OVt); qi=OI.astype('<u2'); assert OV.shape[0]<65536
def pad(b): return b+b'\0'*((-len(b))%4)
hdr=struct.pack('<4sIIII3f3f',b'JKCR',1,len(P),len(OVt),len(OI),*lo,*hi)
out=pad(hdr)+pad(qp.tobytes())+pad(qn.tobytes())+pad(qb.tobytes())+pad(qo.tobytes())+pad(qi.tobytes())
open(sys.argv[1],'wb').write(out)
print(len(out)/1e6,"MB", len(P), len(OVt), len(OI), lo, hi)
