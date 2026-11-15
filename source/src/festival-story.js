export const FESTIVAL_KEY='winter-letters-v1';
export const photoOrder=['wind','catch','return'];
export const rhythmPattern=[0,1,1,2];
export const relayPattern=[0,1,2];
const initial=()=>({version:1,letter:false,photos:false,rhythm:false,relay:false,snack:false,finale:false,clues:[],relayStep:0,choice:null});
export function createFestivalStory(storage){
 let s=initial(),saved=true;try{const v=JSON.parse(storage.getItem(FESTIVAL_KEY)||'null');if(v&&v.version===1){for(const key of ['letter','photos','rhythm','relay','snack','finale'])s[key]=v[key]===true;s.clues=Array.isArray(v.clues)?v.clues.filter(x=>['wind','catch','return','case'].includes(x)):[];s.relayStep=Number.isInteger(v.relayStep)?Math.max(0,Math.min(3,v.relayStep)):0;s.choice=['invite','wait'].includes(v.choice)?v.choice:null;}}catch{}
 // Later flags cannot bypass the causal prerequisites, including malformed saves.
 s.photos&&=s.letter;s.rhythm&&=s.photos;s.relay&&=s.rhythm;s.finale&&=s.relay;
 let revision=0;function save(){revision++;try{storage.setItem(FESTIVAL_KEY,JSON.stringify(s));saved=true;}catch{saved=false;}}
 function dispatch(action,value){let ok=false,award=null,message='';
  if(action==='letter'){if(!s.letter){s.letter=true;award='letter';}ok=true;message='来信收好了。去木马旁的原片庭院，找一找照片没有拍到的事。';}
  else if(action==='clue'){if(s.letter&&['wind','catch','return','case'].includes(value)){if(!s.clues.includes(value))s.clues.push(value);ok=true;}}
  else if(action==='photos'){if(!s.letter)message='先到星云驿站读那封来信。';else if(photoOrder.some(id=>!s.clues.includes(id)))message='先翻开每张原片，看看背面的时间和说明。';else if(JSON.stringify(value)!==JSON.stringify(photoOrder))message='风先吹走帽子，大家才伸手。再看一遍背面的时间。';else{ok=true;if(!s.photos){s.photos=true;award='photos';}message='大家笑的是接帽子的狼狈，不是在笑托腮蛙。它只是还没看到完整的照片。';}}
  else if(action==='rhythm'){if(!s.photos)message='先把原片的来龙去脉弄清楚。';else if(JSON.stringify(value)!==JSON.stringify(rhythmPattern))message='差一点！第一声低，两声中，最后一声高。可以再听，不会扣生命。';else{ok=true;if(!s.rhythm){s.rhythm=true;award='rhythm';}message='原来那声停顿，是笑得需要喘口气。铜铃现在可以传递邀请了。';}}
  else if(action==='bell'){if(!s.rhythm)message='留声机还没有调好，先听完笑声。';else if(value===relayPattern[s.relayStep]){s.relayStep++;ok=true;if(s.relayStep===3){s.relay=true;award='relay';message='月亮、雪花、星星，邀请传到最后一位啦。去摩天轮旁完成合照。';}else message=`第 ${s.relayStep} 声已传出，下一只奶蛙接到了邀请。`;}else if(s.relay){ok=true;message='邀请已经传出，可以再摇一次庆祝。';}else{s.relayStep=0;message='铃声抢跑了。月亮 → 雪花 → 星星，慢慢来，再试一遍。';}}
  else if(action==='snack'){if(['snow','heart','moon'].includes(value)){ok=true;if(!s.snack){s.snack=true;award='snack';}message={snow:'点心师把雪花饼干装好：给怕冷的朋友，包装纸要多裹一层。',heart:'点心师把爱心饼干装好：道歉不能只靠甜食，但可以从认真听开始。',moon:'点心师把月亮饼干装好：半块也可以分享，笑声不按克出售。'}[value];}}
  else if(action==='finale'){if(!s.relay)message='邀请还没有传到所有人；先完成原片、笑声和铜铃。';else if(['invite','wait'].includes(value)){ok=true;s.choice=value;if(!s.finale){s.finale=true;award='finale';}message=value==='wait'?'大家留出一个位置，等它自己走过来。快门没有催促任何人。':'你伸出手，托腮蛙点点头。大家先等它站稳，才一起笑起来。';}}
  if(ok||action==='bell')save();return {ok,award:award?'festival:'+award:null,message};
 }
 return {dispatch,get state(){return structuredClone(s);},get revision(){return revision;},get saved(){return saved;}};
}
export function festivalObjective(s){return !s.letter?'到星云驿站邮筒读信':!s.photos?'木马旁：翻看三张原片，排回真实顺序':!s.rhythm?'茶杯旁：听笑声，复现四个音':!s.relay?`茶杯旁：铜铃接力 ${s.relayStep}/3` :!s.finale?'摩天轮旁：给犹豫的朋友留个位置':'合照已完成 · 可以重听笑声、再拍一张';}
export function festivalNpcLines(kind,s){if(!s.letter)return null;const map={
 thinker:[s.photos?'你找到了前后两张？原来那阵笑声，是帽子被接住以后。':'我只看到了中间那张，越想越觉得自己不该来。',s.finale?'谢谢你没有要求我一定要笑。那张照片里，我看起来就是我。':'等我想好了，可以给我留一个位置吗？'],
 laugher:[s.rhythm?'你跟上啦！中间停一下，是因为笑声也需要呼吸。':'大家都把停顿听成了不高兴。来听听留声机里的完整一段吧。','如果朋友没有一起笑，我可以先停下来听它说话。'],
 cheerer:['我收到了邀请，练了一晚上的手势终于能用上啦。',s.finale?'照片收到！这回边上的朋友也在镜头里。':'月亮、雪花、星星，下一声铃会响在哪里？'],
 welcome:[s.finale?'那张大合照我收到了。每个人站得不一样，笑得也不一样。':'邮筒里的信没有署名。写信的人说，照片里大家都在笑，只有它站在画面外。','我给每位奶家人都留了位置。愿意来就来，晚一点也没关系。'],
 photographer:[s.photos?'原片已经按顺序放回去了。裁掉前后两张，误会就长出来了。':'原片在木马旁的小庭院。请翻看背面的时间，别只盯着笑得最大声的那一张。','一张笑脸告诉不了你前一秒发生了什么。'],
 reader:['书里写着：先记下看到的，再想它意味着什么。',s.photos?'你把“他们在笑我”拆成了三张照片。证据有时候比安慰更管用。':'托腮未必是难过，捧腹也未必是在嘲笑。去问问那顶被风吹走的帽子。'],
 chef:['茶杯旁的新推车开张啦。我们只卖点心，不卖“标准快乐”。',s.snack?'那盒饼干我已经替你装好了，留给想慢慢说话的朋友。':'雪花、爱心、月亮，挑一种送朋友。口味没有唯一正确答案。'],
 santa:[s.rhythm?'哈哈——停一下，我真的是在换气！':'留声机里那段笑声总被听漏一拍。低、中、中、高，跟着听就会啦。','摇铃也别抢跑，等前一位回应，下一位才听得清。'],
 traveler:[s.relay?'邀请传到我这里啦。原来最远的路，有时候只差一个愿意回应的人。':'距离近不代表能听见。让月亮铃先响，再到雪花和星星。','旧宅的事仍然要认真面对；这一晚，我们给愿意回来的人留盏灯。']};return map[kind]||null;}
