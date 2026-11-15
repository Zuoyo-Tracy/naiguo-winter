export const POSTCARD_KEY='winter-postcard-v1';
function valid(p){return p?.version===1&&typeof p.image==='string'&&p.image.length<600000&&/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(p.image)&&typeof p.caption==='string'&&p.caption.length<=100&&Number.isFinite(Date.parse(p.date));}
export function createPostcardStore(storage){
 let photo=null,saved=true;
 try{const p=JSON.parse(storage.getItem(POSTCARD_KEY)||'null');if(valid(p))photo=p;}catch{}
 return {get photo(){return photo;},get saved(){return saved;},save(p){if(!valid(p))return false;photo={...p};try{storage.setItem(POSTCARD_KEY,JSON.stringify(photo));saved=true;}catch{saved=false;}return true;}};
}
