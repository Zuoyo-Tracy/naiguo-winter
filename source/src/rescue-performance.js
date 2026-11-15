// Continuous, route-relative acting. Distances use haunted-route metres.
export function rescuePerformance(s){
 const q=s.rescueStory,done=q?.done||[],time=s.hauntTime||0;
 const rescued=!!s.mouseRescued,calm=time<(q?.calmUntil||0);
 const chapter=rescued?'escort':done.includes('lastDoor')?'reunion':done.includes('bargain')?'apology':done.includes('confession')?'argument':'chase';
 const phase=(time%8)/8,pulse=Math.sin(phase*Math.PI*2),lunge=Math.max(0,Math.sin(phase*Math.PI*2));
 const mode=calm?'intervene':chapter;
 let pink={ahead:18,lateral:-.65,lean:0,bounce:0,turn:0},mouse={ahead:22,lateral:.65,lean:0,bounce:0,turn:0};
 if(mode==='chase'){
 pink.ahead+=lunge*3;pink.lateral+=lunge*.38;pink.lean=-lunge*.16;pink.bounce=Math.abs(Math.sin(time*8))*.055;
 mouse.ahead+=lunge*4;mouse.lateral+=pulse*.12;mouse.lean=lunge*.2;mouse.bounce=Math.abs(Math.sin(time*10))*.085;
 }else if(mode==='argument'){
 pink.ahead=20;pink.turn=Math.PI/2;pink.lean=pulse*.1;mouse.ahead=20;mouse.turn=-Math.PI/2;mouse.lean=-pulse*.1;
 }else if(mode==='apology'||mode==='reunion'){
 pink.ahead=20;pink.turn=Math.PI/2;pink.lean=.12+.08*lunge;mouse.ahead=21;mouse.turn=-Math.PI/2;mouse.lean=-.04;
 }else if(mode==='intervene'){
 pink.ahead=24;pink.turn=Math.PI;pink.lean=.14;mouse.ahead=13;mouse.turn=Math.PI;mouse.bounce=Math.abs(Math.sin(time*5))*.025;
 }else{pink.ahead=23;mouse.ahead=18;pink.bounce=Math.abs(Math.sin(time*8))*.035;mouse.bounce=Math.abs(Math.sin(time*8+1))*.045;}
 return {mode,pink,mouse,phase};
}
const exchanges={
 chase:[['奶粉','跑这么慢，你还说自己不怕？'],['奶鼠','把铃铛还给我……不要再追了。'],['奶鼠','前面有人吗？帮我拦一下它！']],
 argument:[['奶粉','刚才那个声音，不是我说的。'],['奶鼠','可你以前就是这样吓我的。'],['奶粉','这一次，我会把门打开。']],
 apology:[['奶粉','你害怕的时候，我不该笑你。'],['奶鼠','先别靠过来。让我自己决定。'],['奶粉','好。我在这里等你。']],
 reunion:[['奶鼠','你终于来了！门外一直有我的声音。'],['奶粉','那不是你。我现在知道了。']],
 intervene:[['奶鼠','谢谢你挡在我前面。'],['奶粉','……我不追了。']],
 escort:[['奶鼠','慢一点，我们一起走。'],['奶粉','我在旁边，不会再拿你的东西了。']]
};
const roadsideLines=[
 '奶鼠：别把我的铃铛举那么高！',
 '奶粉：先追上我再说。',
 '奶鼠：你挡住路了……我不想玩这个。',
 '奶鼠：它又追过来了，你能叫它停下吗？',
 '奶粉：刚才后面，好像还有一个你。',
 '奶鼠：我的铃声怎么在门里面？',
 '奶粉：等一下，那不是我敲的门。',
 '奶鼠：别再抓我的铃绳。',
 '奶粉：你看地上，那串脚印没有尾痕。',
 '奶鼠：你终于肯听我说话了？',
 '奶粉：我以为你只是在装害怕。',
 '奶鼠：可我说了好多次不要。',
 '奶粉：刚才那句话，是谁学的？',
 '奶鼠的回声：别看脚印，快跟我来。',
 '奶粉：停！它的声音一直没换过气。',
 '奶鼠的回声：你不救我了吗？',
 '奶粉：这张纸……是我没敢给它的信。',
 '奶粉：我应该早点把铃铛还给它。',
 '奶鼠的回声：留一个人，就放一个人。',
 '奶粉：不，这回不能再让它一个人。',
 '奶粉：我不该把害怕当成笑话。',
 '奶粉：门上的字，是它以前对我说的。',
 '奶粉：我听见了。这次真的听见了。',
 '奶鼠：我在里面！别跟着外面的声音走。',
 '奶粉：我把路让开，你先救它。',
 '奶鼠：外面好冷，但我想出去。',
 '奶鼠：别再催我了，我们慢一点。',
 '奶鼠：出口就在前面了。'
];
export function performanceLine(s){const p=rescuePerformance(s),time=s.hauntTime||0;if(time%6>3)return '';if(p.mode!=='intervene'&&!s.mouseRescued)return roadsideLines[Math.min(roadsideLines.length-1,Math.floor((s.hauntS||0)/72))];const lines=exchanges[p.mode];const [speaker,text]=lines[Math.floor(time/6)%lines.length];return `${speaker}：${text}`;}
