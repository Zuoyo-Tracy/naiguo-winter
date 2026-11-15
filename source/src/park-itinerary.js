// Suggestions only select a map destination. Unlocks and travel remain the map's responsibility.
export function parkItinerary(entries,{has=()=>false,festival={},position={x:0,z:0}}={}){
 const nextLetter=!festival.letter?'post':!festival.photos?'photos':!festival.rhythm||!festival.relay?'music':!festival.finale?'finale':null;
 const storyId=nextLetter?'story:'+nextLetter:!has('journey:rescue')?'journey:rescue':null;
 const story=entries.find(e=>e.id===storyId),result=[];
 if(story)result.push({entry:story,label:'故事还在继续',note:nextLetter==='post'?'有封信，还没有署名。':nextLetter==='photos'?'同一阵笑声，也许还有另一面。':nextLetter==='music'?(!festival.rhythm?'先听完整的一段，再回应。':`邀请已传出 ${festival.relayStep||0}/3 声。`):nextLetter==='finale'?'合照里，还给一位朋友留着位置。':'水晶球里，有人还在等你。'});
 const nearest=category=>entries.filter(e=>e.category===category&&e.unlocked&&!has(e.id)).sort((a,b)=>Math.hypot(a.p.x-position.x,a.p.z-position.z)-Math.hypot(b.p.x-position.x,b.p.z-position.z))[0];
 const friend=nearest('friend'),ride=nearest('ride');
 if(friend)result.push({entry:friend,label:'认识一位新朋友',note:friend.subtitle+' · 停稳后打个招呼。'});
 if(ride)result.push({entry:ride,label:'添一页游园记忆',note:'开始体验，就会在图鉴留下印记。'});
 return result;
}

// The greeter points to something the visitor can actually do now. The atlas
// may still show future chapters, but a personal recommendation must be open.
export function welcomeDirection(entries,options={}){
 const suggestions=parkItinerary(entries,options);
 const next=suggestions.find(s=>s.entry.unlocked&&s.entry.id!=='friend:welcome');
 if(next)return {...next,note:'阿迎：'+next.note};
 const position=options.position||{x:0,z:0};
 const scenic=entries.filter(e=>e.category==='scenic'&&e.unlocked)
  .sort((a,b)=>Math.hypot(a.p.x-position.x,a.p.z-position.z)-Math.hypot(b.p.x-position.x,b.p.z-position.z))[0];
 return scenic?{entry:scenic,label:'阿迎给你留的一段闲逛时光',note:'阿迎：没有非做不可的事。去这里看看，慢慢走也很好。'}:null;
}
