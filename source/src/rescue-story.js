import {rescuePerformance} from './rescue-performance.js';
export const clues=[
 {id:'bell',s:280,title:'断裂的铃绳',text:'铃绳挂在很高的门闩上，却留着奶粉的爪痕。地上有一张旧规矩：回声能学会人的话，却记不住声音的先后。'},
 {id:'tracks',s:590,title:'雪里的第二串脚印',text:'奶鼠的脚印旁还有一道细细的尾巴拖痕；但朝阁楼去的那一串，只有脚印，没有尾痕。有人在模仿它。'},
 {id:'letter',s:1180,title:'没有送出的道歉',text:'“奶鼠，我不该笑你胆小，更不该把你的铃铛扔进旧宅。你说有人叫你……我也听见了。等我来找你。”落款是奶粉。'},
 {id:'rule',s:1530,title:'阁楼旧账',text:'“宅中回声，以未说出口的话为锁。铃响引路，名字认人，认错偿债。两人同入，若只带走一人，影子便留下一人。”'}
];
export const storyBeats=[
 {id:'arrival',s:100,title:'一声求救，两个人影',speaker:'奶粉',text:'“别往前走！”它挡在路边。门后，奶鼠哭着说：“它把我的铃铛扔进来了，还笑我胆小！”奶粉没有否认，却一直盯着你身后的影子。旧宅会沿途重演它们的争执：你看到的奶鼠身影，并不等于已经找到被困的它。',options:[['ask','先问奶粉发生了什么'],['follow','先追上奶鼠的声音']]},
 {id:'firstDoor',s:430,title:'门后的约定',speaker:'奶鼠的声音',text:'“敲三下，我就给你开门。”可封符上写着：不要照回声的要求回答。门边的铃只能摇响两次。你要怎么做？',options:[['knock','照它说的，敲三下'],['bell','摇响门边的铃，再等一会儿']]},
 {id:'confession',s:780,title:'它没有追上来',speaker:'奶粉',text:'“是我拿走了它的铃铛。我总拿它害怕的样子取乐……可我没把它锁起来。”它手里攥着半截铃绳：“刚才门后的声音，连我说过的坏话都一模一样。”',options:[['listen','听它把话说完'],['doubt','先记下这番话，继续寻找证据']]},
 {id:'echo',s:1030,title:'不要相信第一声回答',speaker:'回魂廊',text:'左门：“快来救我！别再看地上了！”右门只有很轻的铃声。两扇门前都有脚印，只有右侧积雪里留着一道尾巴拖痕。',options:[['left','追向左边的求救声'],['right','沿着右侧尾痕，拨开封符']]},
 {id:'bargain',s:1390,title:'旧宅提出交易',speaker:'阁楼里的回声',text:'“把那个粉色的家伙留在这里，我就还你奶鼠。”奶粉低下头：“我确实欺负过它。但你不能信它。我把铃铛扔进去之后，那个声音就开始叫我们的名字。”',options:[['promise','答应奶鼠：我会找出真正的出口'],['accuse','质问奶粉：你准备怎样承担这件事']]},
 {id:'lastDoor',s:1630,title:'封符背面不是咒语',speaker:'主角',text:'你翻开封符，看见的却是奶鼠被嘲笑时说不出口的话：“我不想再被你吓唬了。”奶粉伸手，又缩了回去。',options:[['tear','直接撕掉封符'],['apology','让奶粉承认：这不是一个玩笑']]},
 {id:'rescue',s:1880,title:'终于找到奶鼠',speaker:'奶鼠',text:'“我一直在这里……外面那个声音不是我。”你解开门闩。它没有跑向奶粉：“我可以跟你走，但它得先学会不再欺负我。”旧宅又响起了铃声。',options:[['rescue','接住奶鼠，带它离开']]},
 {id:'decision',s:1940,title:'出口只亮起了一盏灯',speaker:'最后的选择',text:'奶鼠已经安全跟在你身后，奶粉的影子却被门槛拉住了。你可以先带奶鼠出去，也可以用沿途的证据反驳旧宅的交易。',options:[['leave','先带奶鼠离开，留下寻找奶粉的约定'],['both','拼合证据，带两个人一起离开']]}
];
export function ensureStory(s){return s.rescueStory??={done:[],evidence:[],journal:[],dialog:null,ending:null,scares:0};}
export function rescueObjective(s){const q=ensureStory(s);if(q.ending)return q.ending==='together'?'两个人都在身后 · 驶向 2 km 出口':'奶鼠已经获救 · 驶向出口';const next=storyBeats.find(b=>!q.done.includes(b.id));return next?`${next.title} · 前往 ${(next.s/1000).toFixed(2)} km`:'带奶鼠离开';}
function record(q,title,text){q.journal.push({title,text});}
export function chooseRescue(s,choice){const q=ensureStory(s),d=q.dialog;if(!d)return false;
 if(d.kind==='clue'){if(choice!=='continue')return false;if(!q.evidence.includes(d.id)){q.evidence.push(d.id);record(q,d.title,d.text);}q.dialog=null;return true;}
 if(d.kind==='response'){if(choice!=='continue')return false;q.shock=false;q.dialog=null;return true;}
 const beat=storyBeats.find(b=>b.id===d.id);if(!beat?.options.some(o=>o[0]===choice))return false;
 let reply='';let complete=true;
 if(beat.id==='arrival')reply=choice==='ask'?'奶粉：“它进去之前，我确实又吓了它。我想跟进去，可门后的东西开始学我说话。”你决定边找奶鼠，边核对它的话。':'求救声向走廊深处移动。奶粉留下一句：“看脚印，别只听声音。”';
 if(beat.id==='firstDoor'){if(choice==='knock'){q.scares++;reply='门后传来与你完全一样的敲击声，慢了半拍。灯光骤暗，门没有开。你意识到它在等你继续回应。试试铃声。';complete=false;}else{s.seal=Math.max(s.seal,1);reply='两声铃响后，门后的“奶鼠”又敲了三下。它只会复述旧声音。第一道封门松开了。';}}
 if(beat.id==='confession')reply=choice==='listen'?'它承认自己一直拿奶鼠的害怕取乐。这能解释铃铛为什么在这里，却解释不了第二个奶鼠。你把两件事分开记下。':'你没有原谅它，也没有把它的话全部当作谎言。回魂廊里，还有可以核对的痕迹。';
 if(beat.id==='echo'){if(choice==='left'){q.scares++;reply='左门后的声音突然用你的语气喊：“快来救我！”那串脚印到门前就消失了。你退回岔口，右侧的尾痕仍在。';complete=false;}else{s.seal=Math.max(s.seal,2);reply='沿尾痕拨开的封符后，一声铃响来自更深的阁楼。假的求救声停了。你找到了真正的方向。';}}
 if(beat.id==='bargain')reply=choice==='accuse'?'奶粉：“我得自己向它认错。不能再叫它胆小，也不能拿它的东西。我不该让它一个人来找铃铛。”':'奶鼠的声音很轻：“不要替我答应它的交易。”你决定先打开最后一道封门。';
 if(beat.id==='lastDoor'){if(choice==='tear'){q.scares++;reply='撕开的封符又长了回来。纸上重复着一句话：“它说这只是玩笑。”需要改变的不是这张纸。';complete=false;}else{s.seal=Math.max(s.seal,3);reply='奶粉：“我明知道你害怕，还故意吓你。这不是玩笑，是我做错了。”封符终于落下。认错打开了门，但原谅仍由奶鼠决定。';}}
 if(beat.id==='rescue'){s.mouseRescued=true;reply='奶鼠握住你的手，开始跟随。奶粉留在后面半步，没有再要求它立刻原谅自己。前方还有最后一道影子。';}
 if(beat.id==='decision'){if(choice==='both'&&q.evidence.length<3){q.returnForEvidence=true;reply=`你还缺少能连成事实的证据（当前 ${q.evidence.length}/3）。可沿原路返回调查发光的信物，也可选择先带奶鼠出去。已打开的封门不会重锁。`;complete=false;}else{q.ending=choice==='both'?'together':'promise';s.pinkRescued=choice==='both';reply=choice==='both'?'你把沿途找到的信物与文字放到灯下：欺负是真的，替身也是真的。奶粉自己拉断缠住影子的铃绳。奶鼠说：“我还没有原谅你，但我们可以先出去。”第二盏灯亮了。':'你先护住奶鼠走向出口。奶粉把铃铛抛了过来：“别让它再拿这个骗你。”你答应奶鼠，会带着证据回来寻找它。';}}
 if(complete){q.done.push(beat.id);record(q,beat.title,reply);}else record(q,beat.title+' · 新发现',reply);
 q.shock=!complete&&beat.id!=='decision';
 q.dialog={kind:'response',id:beat.id+'-'+choice,title:complete?'新的发现':'线索还没有对上',speaker:'雪夜手记',text:reply,options:[['continue','继续调查']]};return true;
}
export function stepRescue(s,input){const q=ensureStory(s);s.rescueObjective=rescueObjective(s);s.snowNear=false;if(q.dialog){s.speed=0;return;}
 const clue=clues.find(c=>!q.evidence.includes(c.id)&&Math.abs(s.hauntS-c.s)<16);
 if(clue){s.snowNear=true;s.hauntMessage=`发现「${clue.title}」· 按 E 调查`;if(input.interact){q.dialog={...clue,kind:'clue',speaker:'现场证据',options:[['continue','收入手记']]};s.speed=0;return;}}
 if(!q.ending&&s.hauntS>1960){s.hauntS=1960;s.speed=0;}if(q.returnForEvidence){if(s.hauntS>=1920){s.hauntMessage='按 S 返回调查信物；回到出口仍可重新选择';return;}q.returnForEvidence=false;}
 const next=storyBeats.find(b=>!q.done.includes(b.id));if(next&&(Math.abs(s.hauntS-next.s)<12||s.hauntS>next.s)){s.hauntS=Math.min(s.hauntS,next.s);s.speed=0;q.dialog={...next,kind:'beat'};}
 s.rescueObjective=rescueObjective(s);
 if(!q.dialog&&!clue&&rescuePerformance(s).mode==='chase'){
  s.snowNear=true;s.hauntMessage='奶粉正在追赶奶鼠 · 按 E 出声制止';
  if(input.interact){q.calmUntil=(s.hauntTime||0)+7;q.interventions=(q.interventions||0)+1;s.hauntMessage='你拦住了奶粉，奶鼠靠近了你';}
 }
}

