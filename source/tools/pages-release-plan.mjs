// Prune only unchanged files from our own recorded prior release. Remote additions
// or edits are preserved, and every removed blob remains in Git history.
export function staleReleaseFiles(previous,files,remote){
 const next=new Set(files.map(f=>f.path)),existing=new Map(remote.map(f=>[f.path,f]));
 return previous.filter(f=>/^(assets|ui)\//.test(f.path)&&!next.has(f.path)&&existing.get(f.path)?.sha===f.sha).map(f=>f.path);
}
