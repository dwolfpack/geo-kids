import subprocess,os,sys
F=open('env.sh').read().split("=",1)[1].strip()
files=sorted([f for f in os.listdir('stills') if f.startswith('t') and f.endswith('.jpg')], key=lambda f: float(f[1:-4]))
for f in os.listdir('.'):
    if f.startswith('sheet') and f.endswith('.jpg'): os.remove(f)
for n,i in enumerate(range(0,len(files),4)):
    grp=files[i:i+4]
    while len(grp)<4: grp.append(grp[-1])
    args=[F,'-hide_banner','-loglevel','error','-y']
    for f in grp: args+=['-i','stills/'+f]
    filt=''.join(f'[{k}:v]scale=960:540[v{k}];' for k in range(4))+'[v0][v1][v2][v3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0'
    subprocess.run(args+['-filter_complex',filt,f'sheet{n}.jpg'],check=True)
    print(f'sheet{n}.jpg', grp)
