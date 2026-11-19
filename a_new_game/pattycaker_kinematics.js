// Pure deterministic math for Pattycaker's six planted hand-feet.
// Deliberately independent of Three.js so joint reach and gait can be tested in Node.
const EPS = 1e-6;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const add = (a,b) => a.map((v,i)=>v+b[i]);
const sub = (a,b) => a.map((v,i)=>v-b[i]);
const mul = (a,s) => a.map(v=>v*s);
const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
const mag = a => Math.hypot(...a);
const unit = (a,fallback=[0,-1,0]) => mag(a)>EPS?mul(a,1/mag(a)):fallback.slice();

export function solveTwoBone(shoulder, target, upper, lower, pole) {
  if (![...shoulder,...target,...pole,upper,lower].every(Number.isFinite) ||
      upper<=0 || lower<=0 || shoulder.length!==3 || target.length!==3 || pole.length!==3) {
    throw new RangeError('Two-bone IK needs finite 3D points and positive bone lengths');
  }
  const raw = sub(target,shoulder), requestedDistance=mag(raw);
  const axis=unit(raw);
  const distance=clamp(requestedDistance,Math.abs(upper-lower)+EPS,upper+lower-EPS);
  const wrist=add(shoulder,mul(axis,distance));
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  const height=Math.sqrt(Math.max(0,upper*upper-along*along));
  let bend=sub(sub(pole,shoulder),mul(axis,dot(sub(pole,shoulder),axis)));
  if(mag(bend)<EPS) {
    const fallback=Math.abs(axis[1])<.85?[0,1,0]:[0,0,1];
    bend=sub(fallback,mul(axis,dot(fallback,axis)));
  }
  const elbow=add(add(shoulder,mul(axis,along)),mul(unit(bend),height));
  return {elbow,wrist,reachable:requestedDistance<=upper+lower && requestedDistance>=Math.abs(upper-lower)};
}

export function gaitPhase(seconds, level, side, hz=1.15) {
  if (![seconds,level,side,hz].every(Number.isFinite)||hz<=0) throw new RangeError('Invalid gait');
  return ((seconds*hz+level/3+(side>0?.5:0))%1+1)%1;
}

export function swingProgress(phase,stance=.62) {
  if(!Number.isFinite(phase)||!Number.isFinite(stance)||stance<=0||stance>=1) throw new RangeError('Invalid gait phase');
  const swing=phase>=stance;
  const u=clamp((phase-stance)/(1-stance),0,1);
  return {swing,progress:u*u*(3-2*u),lift:swing?Math.sin(Math.PI*u):0};
}
