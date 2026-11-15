import {stations} from './station-layout.js';
import {sampleAt} from './track.js';
import {attractions} from './park-rules.js';
export const npcKinds=['welcome','chef','photographer','reader','traveler','santa','thinker','laugher','cheerer'];
export const npcProfiles={
 "welcome": {
  "name": "阿迎",
  "title": "把路记在心里的迎宾员",
  "talent": "只见过一次，也记得你的来路",
  "wish": "让第一次来奶国的人不慌张",
  "action": "请他指一条路",
  "reply": "先沿棕色大道走。累了就到驿站，迷路了按 M，我在卷轴上留了每个入口。",
  "gesture": "bow"
 },
 "chef": {
  "name": "酥酥",
  "title": "会听心事的点心师",
  "talent": "把朋友的喜好记进配方",
  "wish": "做出让人慢慢吃、慢慢笑的点心",
  "action": "尝一块试验饼干",
  "reply": "这块没有照“标准快乐配方”做。你喜欢甜一点还是脆一点？下次我记着。",
  "gesture": "bounce"
 },
 "photographer": {
  "name": "咔咔",
  "title": "专拍别人闪光时刻的摄影师",
  "talent": "总能发现画面外值得被看见的人",
  "wish": "让每位朋友都拥有一张喜欢的合照",
  "action": "和咔咔留一张合照",
  "reply": "不用摆出最大的笑脸。你刚刚回头的样子，就很好。三、二、一——咔嚓！",
  "gesture": "flash"
 },
 "reader": {
  "name": "书签",
  "title": "为小声音留白的读书人",
  "talent": "从容易忽略的细节里发现线索",
  "wish": "把奶鼠勇敢走出来的故事写进书",
  "action": "听他读一小段",
  "reply": "“勇敢有时没有声音。它只是害怕之后，又往前挪了一点。”这一页，我想读给你听。",
  "gesture": "nod"
 },
 "traveler": {
  "name": "远山",
  "title": "会等同伴的旅人",
  "talent": "辨认真脚印，也愿意听迟到的解释",
  "wish": "下一段旅程，没有谁被落在原地",
  "action": "交换一句旅行建议",
  "reply": "先看路，再听回声；先问对方，再替对方决定。路走得慢一点，不妨碍走得远。",
  "gesture": "bow"
 },
 "santa": {
  "name": "绒绒",
  "title": "收集小小好事的送礼人",
  "talent": "把普通的一天变成值得记住的礼物",
  "wish": "把九位朋友的好事装满礼物袋",
  "action": "交换一件今天的好事",
  "reply": "你特意停下来和我说话，这就是一件。礼物不一定有包装纸，也可以是认真听完一句话。",
  "gesture": "bounce"
 },
 "thinker": {
  "name": "小问",
  "title": "愿意把疑惑说出口的思考家",
  "talent": "不急着下结论，愿意翻到照片背面",
  "wish": "学会把“是不是我不好”换成“能告诉我吗”",
  "action": "陪他换个角度想",
  "reply": "如果只看见中间一张，我可能真的猜错了。谢谢你没有直接说“别想太多”，而是陪我找证据。",
  "gesture": "nod"
 },
 "laugher": {
  "name": "哈哈",
  "title": "懂得停下来听的开心果",
  "talent": "用笑声接住尴尬，也能认真道歉",
  "wish": "让开心传过去，而不是把别人淹没",
  "action": "和他打一段节拍",
  "reply": "低、中、中、高——哈哈！我也会留一拍安静，听你接下去。",
  "gesture": "rhythm"
 },
 "cheerer": {
  "name": "比比",
  "title": "总给别人留位置的鼓劲手",
  "talent": "最先注意到人群边缘的朋友",
  "wish": "每次合照，都有人记得说“一起呀”",
  "action": "一起给朋友加油",
  "reply": "你的手放这里，我的手往旁边一点。看，两个胜利手势，也可以留出一个人的位置！",
  "gesture": "cheer"
 }
};
export const npcNames=Object.fromEntries(Object.entries(npcProfiles).map(([id,p])=>[id,p.name+" · "+p.title]));
const atStation=(id,kind,dx,dz)=>{const p=sampleAt(stations[id].s);return {id:`${kind}-station-${id}`,kind,x:p.x+dx,z:p.z+dz,y:p.y,yaw:Math.PI,area:stations[id].label};};
const atRide=(id,kind,dx,dz)=>{const p=attractions.find(a=>a.id===id);return {id:`${kind}-${id}`,kind,x:p.x+dx,z:p.z+dz,y:p.y,yaw:Math.PI,area:p.name};};
export const npcPocket={x:255,z:467,y:12,r:9};
export const npcPlacements=[
 atStation(0,'welcome',16,16),atRide('teacups','chef',-21,-12),atRide('ferris','photographer',27,-10),atStation(1,'reader',18,27),
 {id:'traveler-globe',kind:'traveler',x:255,z:469,y:12,yaw:Math.PI,area:'水晶球外 · 访客小径'},atRide('swings','santa',-18,18),
 {id:'thinker-photos',kind:'thinker',x:561,z:224,y:29,yaw:0,area:'原片小庭院'},
 {id:'laugher-music',kind:'laugher',x:591,z:337,y:32,yaw:0,area:'笑声营业所'},
 {id:'cheerer-finale',kind:'cheerer',x:-525,z:694,y:32,yaw:0,area:'星光合照庭'}
];
export function residentKind(id){const value=String(id||'').replace(/^friend:/,'');return npcKinds.find(k=>value===k||value.startsWith(k+'-'))??null;}
export function npcSurface(x,z){return Math.hypot(x-npcPocket.x,z-npcPocket.z)<npcPocket.r?npcPocket.y:undefined;}
export function npcBlocksTravel(people,ox,oz,x,z,y){return people.some(n=>{if(Math.abs(y-n.y)>3)return false;const before=Math.hypot(ox-n.x,oz-n.z),after=Math.hypot(x-n.x,z-n.z);return after<(n.radius||1.1)+.9&&after<=before+1e-7;});}
export function npcLines(kind,state,area){const rescued=!!(state.snowDone||state.mouseRescued||state.parkRescued);return ({
 thinker:['你看到那张照片了吗？大家都在笑，我却站在画面外。','也许我漏看了什么。愿意陪我把前后找回来吗？'],
 laugher:['哈哈……先让我喘一口气。','笑得停不下来，也不代表每一刻都要笑。'],
 cheerer:['我练习了一个晚上，比胜手势终于没有比反。','合照时我给旁边的人留一点位置，手就不会挡到别人的脸。'],
 welcome:[`欢迎到${area}！我一直在等新的奶家人。`,`按 M 可以查看驿站和乐园项目。刚到奶国也不用急着比赛，先挑个喜欢的方向逛逛。`,`路上看到别的奶蛙，停稳后按 F 打招呼。我们各有各的故事。`],
 chef:[`锅里的甜香飘得比云还远！你刚才是在追着它跑吗？`,`今天研究的是雪花糖。第一锅太硬，第二锅太软——第三锅先让我自己尝尝。`,`玩完茶杯记得歇一会儿。带着头晕去开三轮车，我的点心可帮不上忙。`],
 photographer:[`别急着走！这里刚好能拍到奶国最好看的侧脸。`,`看向摩天轮那边，等座舱转到星空前……对，就是这一刻！`,`我记住你啦。下次经过，我还会举着相机等你。`],
 reader:[`嘘……这一页说，云上住着一群把陌生人当朋友的奶蛙。`,`我每次读到这里，都想看看旁边是不是又多了一位。`,`${rescued?'你带奶鼠回来了？那我得在书里添上一页：有人真的听见了小小的求救。':'旧宅里的声音未必都可信。与其追着声音跑，不如留意脚印、铃绳和那些没说出口的话。'}`],
 traveler:rescued?[`我看见你从水晶球里回来了。一路辛苦了。`,`愿意承认伤害，只是改变的开始。奶鼠有权慢慢决定要不要原谅。`,`天亮以后再来看看吧。现在，去碰碰车场听听真正开心的笑声。`]:[`你也听到水晶球里的声音了吗？我在入口等了很久。`,`旧宅喜欢学人说话。留意铃声的先后，也看看雪里的脚印有没有尾巴拖过的痕迹。`,`先别急着相信谁。把见到的证据拼起来，再决定下一扇门怎么开。`],
 santa:[`哈哈哈，终于等到你来！我笑起来的时候，帽子总往下滑。`,`我收集的不是礼物，是大家在奶国遇到的开心事。`,`按 I 打开冬日图鉴。九位奶蛙各有自己的闪光点；每个人，只收录一次。`]
 })[kind]||[];}
