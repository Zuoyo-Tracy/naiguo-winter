import {skyLegs} from './sky-journey.js';
export const SKY_ACTIVITY_KEY='milk-sky-outings-v1';
export const activityKinds={
 sort:{name:'云端分信所',resident:'阿笺',model:'reader',hint:'读信封上的地址，选对收件箱；连续送好三封。'},
 garden:{name:'会开花的愿望',resident:'点心师奶蛙',model:'chef',hint:'按住浇水，水量进入金色区域时松开，照料三盆云花。'},
 bells:{name:'回声风铃台',resident:'沉思奶蛙',model:'thinker',hint:'记住展示的铃声顺序，再依次敲响；可以随时重听。'},
 kite:{name:'纸鸢回收站',resident:'咔咔',model:'photographer',hint:'纸鸢飘入金色区域时点击接住，找回三只。'},
 circuit:{name:'云桥灯火',resident:'阿笺',model:'reader',hint:'每个开关会改变自己和相邻的灯，把三盏灯全部点亮。'},
 balance:{name:'气流平衡台',resident:'沉思奶蛙',model:'thinker',hint:'按住左或右抵消气流，让小云团在中央金区累计稳定 6 秒。'},
 ballast:{name:'热气球配重场',resident:'圣诞奶蛙',model:'santa',hint:'选择沙袋，使总重量等于目标，再确认升空；完成三次配重。'},
 cups:{name:'云朵藏信',resident:'咔咔',model:'photographer',hint:'先看信藏在哪朵云，再跟着三次换位，选择藏信的云朵。'},
 grid:{name:'风向棋盘',resident:'点心师奶蛙',model:'chef',hint:'用方向按钮沿棋盘送信，绕开强风格，到达右下角的邮局。'},
 stars:{name:'极光观星台',resident:'圣诞奶蛙',model:'santa',hint:'左右微调望远镜，让指针靠近星光并稳定 1.2 秒，找到三颗星。'}
};
const titles=['没有门牌的来信','给冬天留一口甜','不愿重复的回答','飞走的不是作业','谁把北极星搬走了','收件人是昨天的我','别把花催得太急','钟楼也会听错','不必永远飞第一','一颗不参加排名的星','写给不敢敲门的人','借你一小片晴天','这回由你先说','补好的翅膀不丢人','给地面的奶家人'];
const openings=[
 '阿笺把退信摊开：“这封写着‘最高的地方’，那封写着‘有人等我的地方’。地址怎么能用身高排序呢？”帮它先把认得出的三封送对。',
 '点心师把糖罐改成花盆：“我以为多浇一点就会快点开，结果它说想休息。”这次听听云花自己的节奏。',
 '沉思奶蛙发现钟楼只会复述最大声的人。它把三只风铃调小声：“试试看，小声说的愿望是不是也算数。”',
 '咔咔没追着纸鸢拍照。它先收起相机：“纸上写的可能是别人不想公开的秘密，我们先把它接回来。”',
 '圣诞奶蛙的星图上下颠倒了。它认真宣布：“不是星星迟到，是我的眼镜戴反了。”帮它把星图重新校准。',
 '又是一封退信。信封上不是姓名，是“去年那个总装作没关系的我”。阿笺决定给它留一个位置。',
 '三盆花开得不一样快。点心师把“优胜盆栽”牌子翻过来，背面写上“今天也有好好长大”。',
 '钟楼说第三声最重要，沉思奶蛙摇头：“没听见第一声，就不知道谁一直在等。”请把它们都听完。',
 '纸鸢上的比赛名次被擦掉了，只留下“我想慢慢看云”。咔咔说，这张照片不需要谁站在最前面。',
 '望远镜里有一颗暗一点的星。圣诞奶蛙坚持：“它也在值班，不能因为不够亮就漏记。”',
 '阿笺找到几封从没投递过的信，上面统一盖着“收件人太胆小”。它第一次把自己的旧章收了起来。',
 '点心师想把花送给奶鼠，却怕又替别人作了主。它决定先写“你愿意收吗”，留出拒绝的地方。',
 '风铃台不再让最大的铃先响。沉思奶蛙问：“如果奶鼠说还不想原谅，我们能不能先听见这一句？”',
 '最后一只纸鸢缝着三块补丁。咔咔没有把补丁藏起来：“这说明有人认真接住过它三次。”',
 '圣诞奶蛙递来空白星图：“地上的每个人，都能留一个位置。连那个今天什么都没完成的人，也算。”'
];
const endings=['信终于按地址出发，不再按谁的愿望更体面排序。','云花舒展开了。愿望不必被催着长大。','小小的铃声也被完整听见了。','纸鸢回到手里，里面的话留给收信的人看。','星图上，多了三个原本容易被忽略的位置。'];
const kinds=['sort','garden','bells','kite','stars','circuit','balance','ballast','cups','grid'];
titles.splice(5,5,'断电的回信桥','风也有急性子','气球不需要逞强','躲进云里的信','风向不等于方向');
openings.splice(5,5,'阿笺的留声信箱响了：“我总以为催一催灯就会亮。现在才发现，每盏灯都和旁边连着。你能帮我把回信桥点亮吗？”','沉思奶蛙留下纸条：“风一着急就往两边乱吹。别跟它吵，轻轻把云团扶回中间。”这次比赛没有倒计时，稳住就好。','圣诞奶蛙把行李堆上热气球：“我以为拿得越多就越勇敢。”气球摇摇头。按需要选沙袋，不多背，也不硬撑。','咔咔把一封不愿被偷看的信藏在云朵下面：“我只考你的眼力，不看信里的秘密。”看清它怎样换位，再把信交还。','点心师奶蛙的导航说“顺风一定没错”。可顺风的格子全是乱流。它在邮局画了个小笑脸：“试试自己选路，绕一点也能到。”');
export const skyActivities=skyLegs.flat().map((leg,i)=>{const kind=kinds[i%10],p=leg.gates[Math.floor(leg.gates.length/2)]||leg.end,dx=leg.end[0]-leg.start[0],dz=leg.end[2]-leg.start[2],n=Math.hypot(dx,dz),side=i%2?1:-1;return {id:'sky-outing:'+i,index:i,chapter:leg.chapter,node:leg.node,kind,title:titles[i],opening:openings[i],ending:i%10<5?endings[i%5]:['三盏灯一起亮了。回信桥等来了第一位不着急的客人。','风还在吹，你已经知道怎样把自己稳住。','刚刚好的重量，带来了稳稳的升空。','你找回了信，也替收信人保留了秘密。','信到了。绕开强风，并不代表走错方向。'][i%10-5],x:p[0]+dz/n*side*48,y:p[1],z:p[2]-dx/n*side*48,resident:i<5, ...{label:activityKinds[kind].name}};});
export function readActivities(storage){try{const raw=JSON.parse(storage.getItem(SKY_ACTIVITY_KEY));return {done:[...new Set((Array.isArray(raw?.done)?raw.done:[]).filter(id=>skyActivities.some(a=>a.id===id)))]};}catch{return {done:[]};}}
export function newActivity(event){return {id:event.id,kind:event.kind,seed:event.index,round:0,mistakes:0,time:0,fill:0,pouring:false,aim:.5,lock:0,done:false,revealUntil:3,switches:[false,true,false],selected:[false,false,false,false],balance:.2,velocity:0,control:0,cell:0,message:""};}
export const bellLabels=['月亮','雪花','星星'];
export const mailLabels=['钟楼','花园','邮局'];
export function activitySequence(a){return Array.from({length:3+a.seed%2},(_,i)=>(a.seed+i*2)%3);}
export function activityCursor(a){return (Math.sin(a.time*1.65+a.seed+(a.round||0)*1.7)+1)/2;}
export function starTarget(a){return [.22,.72,.46][a.round%3];}
export const ballastWeights=[2,3,5,7];
export const windCells=[7,8,12,16,18];
export function ballastTarget(a){return [5,7,10][a.round%3];}
export function cupOrder(a){const slots=[0,1,2],count=Math.min(3,Math.max(0,Math.floor(a.time-1)));for(let n=0;n<count;n++){const j=(a.seed+a.round+n)%2;[slots[j],slots[j+1]]=[slots[j+1],slots[j]];}return slots;}
export function cupAnswer(a){return cupOrder({...a,time:5}).indexOf((a.seed+a.round)%3);}
function advance(a){a.round++;a.fill=0;a.lock=0;a.selected=[false,false,false,false];if(a.kind==='cups')a.time=0;a.message='做到了！再帮下一个。';if(a.round>=(a.kind==='bells'?activitySequence(a).length:3)){a.done=true;a.pouring=false;a.message='完成 · 获得云游邮戳';}}
export function activityAction(a,key){if(a.done)return false;const before=a.round;
 if(a.kind==='sort'){if(+key===(a.seed+a.round)%3)advance(a);else{a.mistakes++;a.message='这封信的地址不在这里，再读一遍信封就好。';}}
 if(a.kind==='bells'){if(key==='listen'){a.revealUntil=a.time+3;a.message='再听一次，不扣分。';return false;}if(+key===activitySequence(a)[a.round])advance(a);else{a.round=0;a.mistakes++;a.revealUntil=a.time+3;a.message='回声学错了，从第一声再来。';}}
 if(a.kind==='garden'){if(key==='pour')a.pouring=true;if(key==='release'){a.pouring=false;if(a.fill>=.55&&a.fill<=.8)advance(a);else{a.fill=0;a.mistakes++;a.message='水量还没刚刚好，已换上干爽花盆，再试一次。';}}}
 if(a.kind==='kite'&&key==='catch'){if(Math.abs(activityCursor(a)-.5)<=.18)advance(a);else{a.mistakes++;a.message='它又绕了一圈，等它飘回金色区域再接。';}}
 if(a.kind==='stars'&&['left','right'].includes(key))a.aim=Math.max(0,Math.min(1,a.aim+(key==='left'?-.05:.05)));
 if(a.kind==='circuit'&&['0','1','2'].includes(key)){const n=+key;a.switches=a.switches.map((v,i)=>Math.abs(i-n)<=1?!v:v);if(a.switches.every(Boolean)){a.done=true;a.message='云桥的灯全部亮了！';}}
 if(a.kind==='balance')a.control=key==='left'?-1:key==='right'?1:0;
 if(a.kind==='ballast'){if(['0','1','2','3'].includes(key))a.selected[+key]=!a.selected[+key];if(key==='confirm'){if(a.selected.reduce((n,v,i)=>n+(v?ballastWeights[i]:0),0)===ballastTarget(a))advance(a);else{a.mistakes++;a.message='重量还没刚刚好，换几个沙袋试试。';}}}
 if(a.kind==='cups'){if(key==='watch'){a.time=0;return false;}if(a.time>=4.8&&['0','1','2'].includes(key)){if(+key===cupAnswer(a))advance(a);else{a.mistakes++;a.time=0;a.message='它躲过了你的眼睛，再看一次换位。';}}}
 if(a.kind==='grid'){const x=a.cell%5,y=Math.floor(a.cell/5),nx=x+(key==='right'?1:key==='left'?-1:0),ny=y+(key==='down'?1:key==='up'?-1:0),next=ny*5+nx;if(nx>=0&&nx<5&&ny>=0&&ny<5&&!windCells.includes(next))a.cell=next;else a.message='前面有强风，换一个方向就好。';if(a.cell===24){a.done=true;a.message='信已经送到云上邮局！';}}
 return a.round!==before;
}
export function tickActivity(a,dt){if(a.done)return;dt=Math.max(0,Math.min(.1,dt));a.time+=dt;if(a.kind==='garden'&&a.pouring)a.fill=Math.min(1,a.fill+dt*.25);if(a.kind==='balance'){a.velocity+=(Math.sin(a.time*1.3+a.seed)*.35+a.control*.9-a.balance*.25)*dt;a.velocity*=Math.exp(-.8*dt);a.balance=Math.max(-.95,Math.min(.95,a.balance+a.velocity*dt));a.lock=Math.abs(a.balance)<.32?a.lock+dt:Math.max(0,a.lock-dt*.5);if(a.lock>=6){a.done=true;a.control=0;a.message='小云团稳稳停下来了！';}}if(a.kind==='stars'){a.lock=Math.abs(a.aim-starTarget(a))<.065?a.lock+dt:0;if(a.lock>=1.2)advance(a);}}

// An overhead approach avoids clipping the back of a tower when visiting from another island.
export function outingApproach(s,target){const y=Math.min(692,Math.max(s.y,target.y)+42);return [{x:s.x,y,z:s.z},{x:target.x,y,z:target.z},{x:target.x,y:target.y,z:target.z}];}
export function advanceApproach(path,s){if(path.length&&Math.hypot(s.x-path[0].x,s.y-path[0].y,s.z-path[0].z)<8)path.shift();}
