import numpy as np, wave
sr=32000; beat=60/120; duration=15.; mix=np.zeros((int(sr*duration),2)); rng=np.random.default_rng(42)
def note(m,start,length,kind,amp=.18,pan=0):
 t=np.arange(int(sr*length))/sr; f=440*2**((m-69)/12)
 if kind=='brass':
  v=sum(np.sin(2*np.pi*f*k*t+0.003*np.sin(2*np.pi*5*t)*k)/(k**1.25) for k in range(1,10)); env=np.minimum(t/.018,1)*np.minimum((length-t)/.08,1)*np.exp(-t*.9)
 elif kind=='bass': v=np.sin(2*np.pi*f*t)+.28*np.sin(4*np.pi*f*t); env=np.minimum(t/.008,1)*np.exp(-t*6)
 elif kind=='chord': v=sum(np.sin(2*np.pi*f*k*t)/(k*k) for k in range(1,6)); env=np.minimum(t/.006,1)*np.exp(-t*7)
 elif kind=='kick': v=np.sin(2*np.pi*(48*t+9*(1-np.exp(-t*30)))); env=np.exp(-t*20)
 else: v=rng.normal(0,1,len(t)); v=np.concatenate(([0],np.diff(v))); env=np.exp(-t*(45 if kind=='hat' else 22))
 v=v*env*amp; i=int(start*sr); n=min(len(v),len(mix)-i)
 if n>0: mix[i:i+n,0]+=v[:n]*(1-pan*.4); mix[i:i+n,1]+=v[:n]*(1+pan*.4)
# Original 12-bar cabaret cue: new melody and arrangement, no sampled recordings.
chords=[(48,[60,64,67,69]),(45,[60,64,67,71]),(50,[60,65,69,74]),(43,[59,62,65,69]),(48,[60,64,67,72]),(52,[59,64,68,74]),(45,[60,64,67,71]),(50,[60,65,69,72]),(53,[60,65,69,74]),(43,[59,62,65,69]),(48,[60,64,67,69]),(48,[60,64,67,72])]
melody=[[76,79,81,79,74,76],[79,76,72,71,76,74],[77,81,84,81,79,77],[74,71,69,67,74,79],[84,83,79,76,79,81],[80,76,74,71,68,76],[81,79,76,72,71,74],[77,74,72,69,74,77],[81,84,86,84,81,77],[79,77,74,71,74,79],[84,79,76,74,76,79],[84,79,76,72,72,72]]
for bar,(root,voicing) in enumerate(chords[:7]):
 start=bar*4*beat
 for b in range(4):
  note(root+(0 if b%2==0 else 7),start+b*beat,.36,'bass',.23,-.3)
  for p in voicing: note(p,start+(b+.52)*beat,.21,'chord',.065,.4)
  note(36,start+b*beat,.18,'kick',.19)
  note(42,start+(b+.65)*beat,.09,'hat',.045,.5)
  if b%2: note(38,start+b*beat,.14,'snare',.065,-.4)
 for p,offset in zip(melody[bar],[0,.66,1,1.66,2.5,3.25]):
  note(p,start+offset*beat,(.65 if offset==3.25 else .42)*beat,'brass',.15,-.15)
for p in [48,60,64,67,72,84]: note(p,14, .85,'brass',.13)
delay=int(.09*sr); mix[delay:,1]+=mix[:-delay,0]*.13
mix=np.tanh(mix*1.1); mix*=.9/max(1,np.abs(mix).max()); mix[-int(sr*.15):]*=np.linspace(1,0,int(sr*.15))[:,None]
with wave.open('glitter-strut.wav','wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((mix*32767).astype('<i2').tobytes())
