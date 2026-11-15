export const carnivalAttractions=[
 {id:'pirate',name:'月牙海盗船',kind:'pirate',x:-380,z:820,r:32,duration:40,category:'刺激',description:'月牙船渐渐荡高，选择观光或座位视角。'},
 {id:'drop',name:'星钟升降塔',kind:'drop',x:-160,z:820,r:30,duration:36,category:'刺激',description:'沿星钟缓缓上升，稍作停顿后感受三次起落。'},
 {id:'balloon',name:'云端热气球',kind:'balloon',x:60,z:820,r:32,duration:50,category:'观光',description:'乘编织吊篮升空，慢慢看清整个冬日乐园。'},
 {id:'stargaze',name:'星图观测台',kind:'stargaze',x:280,z:820,r:28,duration:90,category:'探索',description:'从望远镜寻找星点，依次连出三幅星座图。'},
 {id:'ringtoss',name:'月亮套环',kind:'ringtoss',x:-380,z:970,r:28,duration:90,category:'技巧',description:'调方向、蓄力后松手，六只环挑战三个铜瓶。'},
 {id:'ducks',name:'星溪垂钓',kind:'ducks',x:-160,z:970,r:28,duration:0,category:'悠闲垂钓',description:'在大池塘的木栈台上陪奶龙钓鱼。抛竿后看红白浮漂，等它下沉、出现「收竿！」时再点一次。钓满三条完成一轮，没有倒计时；空格也能操作。'},
 {id:'mushrooms',name:'蘑菇敲敲乐',kind:'mushrooms',x:60,z:970,r:28,duration:45,category:'蘑菇派对',description:'六洞蘑菇派对！直接点冒头的蘑菇，金帽高分、蓝帽加时，连中 5 次触发双倍欢乐。最后挑战会换洞口的菇王。按 1–6 也能敲，准备好后再开场。'},
 {id:'bowling',name:'松果保龄球',kind:'bowling',x:280,z:970,r:30,duration:90,category:'技巧',description:'调整横向瞄准与力度，三球挑战十枚松果瓶。'}
].map(a=>({...a,y:32,station:2,expansion:true,anchor:{x:a.x,y:32,z:a.z===820?750:900}}));
export const carnivalWalkways=[{x1:-420,z1:750,x2:320,z2:750,width:14},{x1:-420,z1:900,x2:320,z2:900,width:14},{x1:-50,z1:750,x2:-50,z2:1010,width:14},{x1:90,z1:700,x2:90,z2:750,width:16}];
export function carnivalSurface(x,z){for(const w of carnivalWalkways){const dx=w.x2-w.x1,dz=w.z2-w.z1,t=Math.max(0,Math.min(1,((x-w.x1)*dx+(z-w.z1)*dz)/(dx*dx+dz*dz)));if(Math.hypot(x-w.x1-dx*t,z-w.z1-dz*t)<w.width/2)return 32;}return undefined;}
export const carnivalIds=new Set(carnivalAttractions.map(a=>a.id));
