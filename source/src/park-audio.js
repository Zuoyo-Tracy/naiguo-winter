// Original, synthesized music-box motif. No external recording or audio service.
const melody=[0,4,7,12,9,7,4,2,0,7,9,4,2,4,7,0];
const minor=[0,3,7,10,7,5,3,2,0,7,5,3,2,3,7,0];
export function createParkAudio(){
 let context=null,master=null,music=null,effects=null,wind=null,engine=null,engineGain=null,enabled=false,volume=.18,nextNote=0,note=0,lastJump=0,lastHits=0,lastStatus='',lastRailTap=0;
 function tone(frequency,when,duration,gain,bus=music){
  if(!context||context.state!=='running')return;
  for(const [ratio,strength]of [[1,1],[2,.16],[3.01,.035]]){const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency*ratio;envelope.gain.setValueAtTime(0,when);envelope.gain.linearRampToValueAtTime(gain*strength,when+.012);envelope.gain.exponentialRampToValueAtTime(.0001,when+duration);oscillator.connect(envelope).connect(bus);oscillator.start(when);oscillator.stop(when+duration+.04);oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};}
 }
 function setup(){
  if(context)return;const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
  context=new Audio();master=context.createGain();master.gain.value=volume;const compressor=context.createDynamicsCompressor();compressor.threshold.value=-14;compressor.ratio.value=3;master.connect(compressor).connect(context.destination);
  music=context.createGain();music.gain.value=.5;music.connect(master);effects=context.createGain();effects.gain.value=.65;effects.connect(master);
  const noise=context.createBuffer(1,context.sampleRate*3,context.sampleRate),data=noise.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown*2.5;}
  const source=context.createBufferSource(),filter=context.createBiquadFilter();source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=460;wind=context.createGain();wind.gain.value=.012;source.connect(filter).connect(wind).connect(master);source.start();
  engine=context.createOscillator();engine.type='triangle';engine.frequency.value=45;engineGain=context.createGain();engineGain.gain.value=0;engine.connect(engineGain).connect(master);engine.start();nextNote=context.currentTime+.25;
 }
 let audioTransition=Promise.resolve();
 function syncPlayback(){
  audioTransition=audioTransition.catch(()=>{}).then(async()=>{
   if(!context)return;
   if(enabled&&!document.hidden){await context.resume();nextNote=Math.max(context.currentTime+.1,nextNote);master.gain.setTargetAtTime(volume,context.currentTime,.2);}
   else {master.gain.setTargetAtTime(0,context.currentTime,.05);await context.suspend();}
  });return audioTransition;
 }
 async function configure(on,value=volume){enabled=!!on;volume=Math.max(0,Math.min(.6,value));if(enabled)setup();await syncPlayback();return !!context;}
 // Animation frames stop in a hidden tab; persistent engine/wind nodes do not.
 // Suspend them explicitly and only resume a sound setting enabled by the user.
 document.addEventListener('visibilitychange',()=>{syncPlayback().catch(()=>{});});
 function collect(){if(!enabled||!context||context.state!=='running')return;const t=context.currentTime;[523.25,659.25,783.99].forEach((f,i)=>tone(f,t+i*.09,.8,.055,effects));}
 window.addEventListener('winter-collect',collect);
 window.addEventListener('winter-mushroom-hit',({detail})=>{if(!enabled||!context||context.state!=='running'||document.hidden)return;const t=context.currentTime,miss=detail.result==='miss';tone(miss?130:detail.type==='gold'?880:detail.type==='clock'?660:detail.type==='king'?245:330,t,.12,.07,effects);if(!miss&&detail.points>=160)tone(990,t+.07,.22,.04,effects);});
 return {configure,get active(){return enabled&&context?.state==='running';},update(state,{ride=false,amusement=false,paused=false}={}){
  if(!enabled||!context||context.state!=='running')return;const t=context.currentTime,speed=Math.abs(state.speed||0),haunted=!!state.snow;
  const quiet=paused||document.hidden;master.gain.setTargetAtTime(quiet?volume*.45:volume,t,.4);
  wind.gain.setTargetAtTime(haunted?.009:ride?.008:.012,t,.5);engineGain.gain.setTargetAtTime(!quiet&&!ride&&!amusement&&state.status==='running'?Math.min(.025,speed*.001):0,t,.15);engine.frequency.setTargetAtTime(42+speed*1.8,t,.1);
  if(nextNote<t-1)nextNote=t+.2;
  if(t+.15>=nextNote){const scale=haunted?minor:melody,frequency=261.63*Math.pow(2,scale[note%scale.length]/12);tone(frequency,nextNote,haunted?2.8:2.1,haunted?.045:.075);if(note%4===0)tone(frequency/2,nextNote,3,.04);note++;nextNote+=haunted?1.35:.88;}
  if(!quiet&&state.jumpY>.04&&lastJump<=.04)tone(660,t,.45,.06,effects);
  if(!quiet&&(state.hits>lastHits||(state.status==='lost'&&lastStatus!=='lost')))tone(82.4,t,.3,.14,effects);
  if(ride&&!quiet&&t-lastRailTap>.45){lastRailTap=t;tone(160,t,.055,.022,effects);}
  lastJump=state.jumpY;lastHits=state.hits;lastStatus=state.status;
 }};
}
