export const resultStatuses=new Set(['finished','failed','abandoned']);
export function formatRaceTime(ms){
 if(!Number.isFinite(ms)||ms<0)return '—';
 const centiseconds=Math.round(ms/10),minutes=Math.floor(centiseconds/6000),seconds=Math.floor(centiseconds/100)%60,fraction=centiseconds%100;
 return (minutes?minutes+':'+String(seconds).padStart(2,'0'):String(seconds))+'.'+String(fraction).padStart(2,'0')+' 秒';
}
export function makeRaceResult(challenge,status,state={},stationDistances=[10,2160,3980]){
 if(!challenge||!resultStatuses.has(status)||!Number.isInteger(challenge.from)||!Number.isInteger(challenge.to)||challenge.from===challenge.to||stationDistances[challenge.from]===undefined||stationDistances[challenge.to]===undefined)throw Error('赛车路线或结束状态不正确');
 const total=Math.abs(stationDistances[challenge.to]-stationDistances[challenge.from]);
 const progress=Number.isFinite(state.progress)?Math.max(0,Math.min(total,(state.progress-stationDistances[challenge.from])*Math.sign(challenge.to-challenge.from))):0;
 return {from:challenge.from,to:challenge.to,elapsedMs:Math.max(0,Math.round((Number.isFinite(challenge.elapsed)?challenge.elapsed:0)*1000)),status,distance:Math.round((status==='finished'?total:progress)*10)/10,hits:Math.max(0,Math.min(100,Math.floor(Number.isFinite(state.hits)?state.hits:0)))};
}
export function createRaceRecorder({api,getUser,now=()=>new Date().toISOString(),stationDistances}){
 const runs=new WeakMap(),local=[];
 function begin(challenge){
  if(runs.has(challenge))return runs.get(challenge).started;
  const user=getUser(),entry={challenge,guest:!user||user.role==='trial',name:user?.name||'试玩玩家',result:null,submitted:false};runs.set(challenge,entry);
  entry.started=entry.guest?Promise.resolve():api('/api/races/start',{from:challenge.from,to:challenge.to}).then(data=>{if(!data?.runId)throw Error('联网计时未能开启，请重试');entry.runId=data.runId;});
  // Keep failure available to the caller and end(), without an unhandled promise
  // if a caller cancels its UI while the start request is in flight.
  entry.started.catch(()=>{});return entry.started;
 }
 async function submit(entry){
  await entry.started;
  if(entry.guest){entry.submitted=true;return entry.result;}
  if(entry.submitted)return entry.result;
  const {from,to,createdAt,name,...payload}=entry.result;
  await api('/api/races/finish',{runId:entry.runId,...payload});entry.submitted=true;return entry.result;
 }
 function end(challenge,status,state){
  const entry=runs.get(challenge);if(!entry)return Promise.reject(Error('这场赛车没有开启计时，无法上传成绩'));
  if(!entry.result){entry.result={...makeRaceResult(challenge,status,state,stationDistances),createdAt:now(),name:entry.name};local.unshift(entry);if(local.length>100)local.length=100;}
  if(!entry.sending)entry.sending=submit(entry).finally(()=>{entry.sending=null;});return entry.sending;
 }
 function retry(challenge){const entry=runs.get(challenge);if(!entry?.result)return Promise.reject(Error('没有待上传的成绩'));return end(challenge,entry.result.status,{});}
 return {begin,end,retry,pending:()=>local.filter(e=>!e.guest&&!e.submitted&&e.runId).map(e=>e.challenge),entry:challenge=>runs.get(challenge),rows:()=>local.map(e=>({...e.result,saved:e.submitted,guest:e.guest}))};
}
