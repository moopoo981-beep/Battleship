"""Optional native GLSL validation (Linux EGL/Mesa); not a browser test."""
from pathlib import Path
import ctypes as C
import os
import re

os.environ.setdefault('EGL_PLATFORM', 'surfaceless')
egl = C.CDLL('libEGL.so.1')
I, P = C.c_int, C.c_void_p
specs = [
 ('eglGetDisplay',P,[P]), ('eglInitialize',I,[P,C.POINTER(I),C.POINTER(I)]),
 ('eglBindAPI',I,[I]), ('eglChooseConfig',I,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)]),
 ('eglCreatePbufferSurface',P,[P,P,C.POINTER(I)]),
 ('eglCreateContext',P,[P,P,P,C.POINTER(I)]),
 ('eglMakeCurrent',I,[P,P,P,P]), ('eglGetProcAddress',P,[C.c_char_p])]
for name, ret, args in specs:
    f = getattr(egl, name); f.restype = ret; f.argtypes = args
display = egl.eglGetDisplay(None)
major, minor = I(), I()
assert egl.eglInitialize(display, C.byref(major), C.byref(minor))
assert egl.eglBindAPI(0x30A0)
attrs = (I*11)(0x3033,1,0x3040,4,0x3024,8,0x3023,8,0x3022,8,0x3038)
config, count = P(), I()
assert egl.eglChooseConfig(display, attrs, C.byref(config),1,C.byref(count)) and count.value
surface = egl.eglCreatePbufferSurface(display,config,(I*5)(0x3057,8,0x3056,8,0x3038))
context = egl.eglCreateContext(display,config,None,(I*3)(0x3098,2,0x3038))
assert egl.eglMakeCurrent(display,surface,surface,context)
def gl(name,ret,args):
    return C.CFUNCTYPE(ret,*args)(egl.eglGetProcAddress(name.encode()))
create=gl('glCreateShader',C.c_uint,[C.c_uint])
source=gl('glShaderSource',None,[C.c_uint,I,C.POINTER(C.c_char_p),C.POINTER(I)])
compile_=gl('glCompileShader',None,[C.c_uint])
get=gl('glGetShaderiv',None,[C.c_uint,C.c_uint,C.POINTER(I)])
sinfo=gl('glGetShaderInfoLog',None,[C.c_uint,I,C.POINTER(I),C.c_char_p])
cp=gl('glCreateProgram',C.c_uint,[])
attach=gl('glAttachShader',None,[C.c_uint,C.c_uint])
link=gl('glLinkProgram',None,[C.c_uint])
gp=gl('glGetProgramiv',None,[C.c_uint,C.c_uint,C.POINTER(I)])
pi=gl('glGetProgramInfoLog',None,[C.c_uint,I,C.POINTER(I),C.c_char_p])
text=(Path(__file__).resolve().parents[1]/'dist/js/renderer.js').read_text()
ids=[]
for name,kind in [('meshVS',35633),('meshFS',35632),('oceanVS',35633),('oceanFS',35632)]:
    code=re.search(r"const "+name+r"='([^\n]*)';",text).group(1)
    sid=create(kind); src=C.c_char_p(code.encode())
    source(sid,1,C.byref(src),None); compile_(sid)
    ok=I();get(sid,0x8B81,C.byref(ok))
    log=C.create_string_buffer(4096);sinfo(sid,4096,None,log)
    assert ok.value,(name,log.value.decode())
    ids.append(sid)
for offset in [0,2]:
    program=cp();attach(program,ids[offset]);attach(program,ids[offset+1]);link(program)
    ok=I();gp(program,0x8B82,C.byref(ok))
    log=C.create_string_buffer(4096);pi(program,4096,None,log)
    assert ok.value,log.value.decode()
print('PASS: four shaders compile and both graphics programs link.')
