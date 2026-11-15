// Passenger morphs are baked from the original character in Blender with soft
// shoulder weights. The vehicle model remains in its original driving pose.
const names=['leftRest','rightRest','lookLeft','lookRight','breath'];
const profiles={
 ducks:{name:'fishing',arms:[.55,.08],look:.12},
 ski:{name:'skiTuck',arms:[.3,.3],look:.08},
 ferris:{name:'relaxed',arms:[.92,.98],look:.75},
 train:{name:'relaxed',arms:[.94,.94],look:.5},
 balloon:{name:'sightseeing',arms:[.78,.96],look:1},
 teacups:{name:'cupWheel',arms:[.25,.25],look:.3},
 swings:{name:'secure',arms:[.48,.48],look:.25},
 pirate:{name:'secure',arms:[.43,.43],look:.2},
 drop:{name:'secure',arms:[.5,.5],look:.15},
 carousel:{name:'reins',arms:[.12,.12],look:.35},
 bumper:{name:'driving',arms:[0,0],look:.08},
};
export function passengerPoseProfile(kind){return profiles[kind]||profiles.ferris;}
export function createPassengerPoseController(passenger,initialKind='ferris'){
 const bindings=[];passenger.traverse(o=>{if(!o.morphTargetDictionary)return;for(const [i,name] of names.entries()){const index=o.morphTargetDictionary[name];if(index!==undefined)bindings.push({mesh:o,index,weight:i});}});
 const current=[...passengerPoseProfile(initialKind).arms,0,0,.5];let kind=initialKind;
 const report={kind,profile:passengerPoseProfile(kind).name,weights:current};passenger.userData.passengerPose=report;
 function apply(){for(const b of bindings)b.mesh.morphTargetInfluences[b.index]=current[b.weight];report.kind=kind;report.profile=passengerPoseProfile(kind).name;}
 apply();
 return {
  set(kindNext){kind=kindNext;const p=passengerPoseProfile(kind);current[0]=p.arms[0];current[1]=p.arms[1];current[2]=current[3]=0;apply();},
  update(kindNext,time,dt){kind=kindNext;const p=passengerPoseProfile(kind),look=Math.sin(time*.32)*p.look,breath=.5+.5*Math.sin(time*1.8),target=[...p.arms,Math.max(0,look),Math.max(0,-look),breath],alpha=1-Math.exp(-7*Math.min(.1,Math.max(0,dt)));for(let i=0;i<current.length;i++)current[i]+=(target[i]-current[i])*alpha;apply();}
 };
}
