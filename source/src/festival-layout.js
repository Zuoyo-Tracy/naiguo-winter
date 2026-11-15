// Compact side courtyards keep story activities clear of the race and railway.
export const festivalHubs=[
 {id:'post',name:'星云驿站 · 奶家邮局',x:-328,z:28,y:0,r:9,station:0,arrival:{x:-340,z:28,groundY:0,yaw:Math.PI/2}},
 {id:'photos',name:'木马旁 · 原片小庭院',x:566,z:220,y:29,r:14,station:1,arrival:{x:557,z:220,groundY:29,yaw:Math.PI/2},link:{x:538,z:220}},
 {id:'music',name:'茶杯旁 · 笑声营业所',x:594,z:333,y:32,r:14,station:1,arrival:{x:585,z:333,groundY:32,yaw:Math.PI/2},link:{x:568,z:329}},
 {id:'finale',name:'摩天轮旁 · 星光合照庭',x:-516,z:697,y:32,r:18,station:2,arrival:{x:-503,z:697,groundY:32,yaw:-Math.PI/2},link:{x:-494,z:686}}
];
export const festivalExits={carousel:{angle:Math.PI/2,halfWidth:.23},teacups:{angle:Math.atan2(49,8),halfWidth:.32},ferris:{angle:Math.atan2(-56,27),halfWidth:.22}};
export const festivalSites=[
 {id:'postbox',hub:'post',asset:'postbox',dx:0,dz:3,height:3,radius:1.05,name:'读一封没有署名的来信'},
 {id:'photos',hub:'photos',asset:'photo-board',dx:0,dz:6,height:3.8,radius:2.4,name:'查看三张原片'},
 {id:'case',hub:'photos',asset:'lost-case',dx:6,dz:3,height:1.7,radius:1.5,name:'翻看失物箱'},
 {id:'rhythm',hub:'music',asset:'gramophone',dx:0,dz:6,height:2.1,radius:1.1,name:'听一段憋不住的笑声'},
 {id:'bakery',hub:'music',asset:'pastry-cart',dx:6,dz:0,height:3.4,radius:2.2,name:'帮点心师配一盒饼干'},
 {id:'bell0',hub:'music',asset:'bell',dx:-5,dz:-6,height:2.8,radius:.9,name:'摇响月亮铃'},
 {id:'bell1',hub:'music',asset:'bell',dx:0,dz:-9,height:2.8,radius:.9,name:'摇响雪花铃'},
 {id:'bell2',hub:'music',asset:'bell',dx:5,dz:-6,height:2.8,radius:.9,name:'摇响星星铃'},
 {id:'camera',hub:'finale',asset:'camera',dx:0,dz:-9,height:2.6,radius:.8,name:'拍下今晚的大合照'}
].map(s=>{const h=festivalHubs.find(h=>h.id===s.hub);return {...s,x:h.x+s.dx,z:h.z+s.dz,y:h.y,station:h.station};});
function inLink(x,z,h){if(!h.link)return false;const dx=h.x-h.link.x,dz=h.z-h.link.z,t=Math.max(0,Math.min(1,((x-h.link.x)*dx+(z-h.link.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-h.link.x-dx*t,z-h.link.z-dz*t)<5;}
export function festivalSurface(x,z){for(const h of festivalHubs){if(h.id==='post')continue;if(Math.hypot(x-h.x,z-h.z)<h.r||inLink(x,z,h))return h.y;}return undefined;}
export function festivalProtected(x,z,y){const g=festivalSurface(x,z);return g!==undefined&&Math.abs(y-g)<5;}
export const festivalAwards=[{id:'festival:letter',name:'一封没有署名的来信'},{id:'festival:photos',name:'半张照片以外的事'},{id:'festival:rhythm',name:'笑声也要喘口气'},{id:'festival:relay',name:'把快乐传给下一位'},{id:'festival:snack',name:'没有标准口味的礼物'},{id:'festival:finale',name:'奶家人，一个都不少'}];
