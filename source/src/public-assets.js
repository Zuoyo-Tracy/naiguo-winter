// Runtime strings are not rewritten by Vite's base option (unlike HTML imports).
export function resolvePublicAsset(url,base='/'){
 if(!/^\/(assets|ui)\//.test(url))return url;
 return base.replace(/\/$/,'')+url;
}
export const publicAsset=url=>resolvePublicAsset(url,import.meta.env?.BASE_URL||'/');
