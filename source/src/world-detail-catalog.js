import distantAssets from './distant-assets.json' with {type:'json'};
import refinedAssets from './refined-detail-assets.json' with {type:'json'};
import unifiedAssets from './unified-assets.json' with {type:'json'};

const architecture = ['portal','column','shopfront','garden','wayfinder','arcade-repaired','fir-grove','winter-tree','winter-pavilion','roman-garden-bay','wisteria-garden-cluster'];
const original = [
 ...architecture.map(name => ({ source:'/assets/cohesion/'+name+'.glb', far:'/assets/cohesion/detail/'+name+'.glb' })),
 ...distantAssets.map(({source}) => ({ source:'/assets/'+source+'.glb', far:'/assets/detail/'+source.replaceAll('/','--')+'.glb' }))
].filter(entry => !unifiedAssets[entry.source]);

export const detailDefinitions = [
 ...original.map(entry => ({ ...entry, preferred:refinedAssets[entry.source] || entry.far })),
 ...Object.values(unifiedAssets).map(source => {
  const far = source.replace('/unified/', '/unified/detail/');
  return { source, far, preferred:far };
 })
];
