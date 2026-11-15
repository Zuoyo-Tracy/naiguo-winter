import {skiPose,SKI_LENGTH,SKI_HALF_WIDTH,skiGates,skiObstacles} from './ski-layout.js';
export function newSkiRun(){return {phase:'ready',s:0,lateral:0,lateralSpeed:0,speed:0,time:0,score:0,gates:[],missed:[],contacts:[],recover:0,jump:0,vy:0,jumpHeld:false,finished:false,message:'奶龙：这回真的是下坡了，奶茶等我回来再喝！'};}
export function stepSki(r,input,dt){
 if(r.finished)return;dt=Math.max(0,Math.min(.05,dt));
 if(r.phase==='ready'){if(!input.start)return;r.phase='skiing';r.speed=3;r.message='顺着雪道出发 · 穿旗门收集雪花';}
 r.time+=dt;r.recover=Math.max(0,r.recover-dt);const p=skiPose(r.s),braking=!!input.brake,steer=Math.max(-1,Math.min(1,input.steer||0));
 const acceleration=9.81*Math.sin(p.pitch)+(input.push?1.5:0)-.0038*r.speed*r.speed-(braking?9:0)-Math.abs(steer)*1.8;
 r.speed=Math.max(0,Math.min(26,r.speed+acceleration*dt));
 if(!braking&&r.speed<2&&r.s<SKI_LENGTH-25)r.speed=Math.min(2,r.speed+2*dt);
 r.lateralSpeed+=(steer*Math.min(12,2+r.speed*.42)-r.lateralSpeed)*(1-Math.exp(-4*dt));
 const old=r.s;r.s=Math.min(SKI_LENGTH,r.s+r.speed*dt);r.lateral+=r.lateralSpeed*dt;
 if(Math.abs(r.lateral)>SKI_HALF_WIDTH-1.5){r.lateral=Math.sign(r.lateral)*(SKI_HALF_WIDTH-1.5);r.lateralSpeed=0;r.speed*=Math.exp(-6*dt);r.message='雪堤帮你缓了一下 · 转回雪道继续滑';}
 if(input.jump&&!r.jumpHeld&&r.jump===0&&r.recover===0){r.vy=4.5;r.jump=.01;}r.jumpHeld=!!input.jump;
 if(r.jump>0){r.vy-=12*dt;r.jump=Math.max(0,r.jump+r.vy*dt);if(r.jump===0)r.vy=0;}
 for(const [i,o] of skiObstacles.entries()){if(r.contacts.includes(i)||r.jump>1.6)continue;const nearest=Math.max(old,Math.min(r.s,o.s));if(Math.hypot(nearest-o.s,r.lateral-o.lateral)<o.r+.65){r.contacts.push(i);r.speed*=.28;r.recover=.85;r.score=Math.max(0,r.score-25);r.lateralSpeed=-Math.sign(o.lateral)*4;r.message='扑进松软的雪里了 · 站稳后继续，不扣赛车生命';}}
 for(const [i,g] of skiGates.entries()){if(old<g.s&&r.s>=g.s){if(Math.abs(r.lateral-g.lateral)<=g.width/2){r.gates.push(i);r.score+=100;r.message='雪花旗门 +100 · '+r.gates.length+'/'+skiGates.length;}else{r.missed.push(i);r.message='这一道没赶上，下一道再来';}}}
 if(r.s>=SKI_LENGTH){r.finished=true;r.phase='finished';r.speed=0;r.lateralSpeed=0;r.score+=200;r.message='抵达山脚！奶龙：我先声明，刚才的尖叫是风声。';}
}
