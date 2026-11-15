import './account.css';
import {publicAsset} from './public-assets.js';
import {accountApi,clearOnlineSession} from './online-client.js';
export {accountApi};
export let account=null;
export const allContentUnlocked=()=>account?.role==='tester'||account?.role==='trial';
const storagePrefix=()=>account?.role==='trial'?'winter-trial:v1:':`winter:${account.name}:`;
export const accountStorage={getItem:key=>localStorage.getItem(storagePrefix()+key),setItem:(key,value)=>localStorage.setItem(storagePrefix()+key,value)};
async function enter(user){if(account)return;account=user;
 try{await import('./main.js');}
 catch(cause){
  account=null;
  // A rejected module import may remain cached for the lifetime of this document.
  const recovery=gate.querySelector('#entry-recovery');
  recovery.hidden=false;
  gate.querySelector('.trial-entry').hidden=true;
  gate.querySelector('.account-tabs').hidden=true;
  form.hidden=true;
  recovery.querySelector('button').focus();
  throw cause;
 }
 document.querySelector('#account-gate')?.remove();document.body.classList.remove('account-locked');const button=document.createElement('button');button.id='account-exit';button.textContent=user.role==='trial'?'免登录试玩 · 全部开放 · 退出试玩':`${user.name}${user.role==='tester'?' · 内测全站通行':''} · 退出`;button.onclick=async()=>{if(user.role==='trial'){const url=new URL(location.href);url.searchParams.delete('trial');location.replace(url.href);}else{try{await accountApi('/api/account/logout',{});}finally{clearOnlineSession();location.reload();}}};document.querySelector('#station-panel').append(button);}
const gate=document.createElement('div');gate.id='account-gate';document.body.classList.add('account-locked');
gate.innerHTML=`
 <div class="account-shell">
  <header class="account-masthead"><a class="account-brand" href="#account-heading"><span class="account-seal" aria-hidden="true">奶</span><span>奶国之冬<small>奶家人集合！</small></span></a><span class="account-edition">奶蛙学 · 冬日实践册</span></header>
  <main class="account-book">
   <section class="account-chapter" aria-labelledby="chapter-heading">
    <div class="chapter-kicker"><span>课外实践</span><span>快乐这门课，不点名。</span></div>
    <h1 id="chapter-heading">本节重点：<br><em>玩得开心。</em></h1>
    <p class="chapter-intro">把书合上。<br>奶国的冬天，等你亲自研究。</p>
    <figure class="account-specimen">
     <span class="specimen-note" aria-hidden="true">观察结果<br><b>笑得很有道理。</b></span>
     <button type="button" class="specimen-button" aria-label="戳戳大笑奶蛙，换一条观察笔记"><img src="${publicAsset('/ui/auth/laughing-naifrog.webp')}" width="667" height="1000" alt="扶着脑袋、仰头大笑的黄色奶蛙" fetchpriority="high" draggable="false"></button>
     <figcaption>图 1　典型的「准备开玩」状态 <span>戳它一下 ↗</span></figcaption>
    </figure>
    <div class="observation-note"><span>观察笔记</span><p id="frog-observation" role="status">实验尚未开始，奶蛙已经笑了。</p></div>
   </section>
   <section class="account-entry" aria-labelledby="account-heading">
    <div class="entry-running-head"><span>奶国 · 入园登记处</span><span class="entry-mark">随到随玩</span></div>
    <div class="account-tabs" role="group" aria-label="选择登录或注册"><button type="button" id="tab-login" aria-pressed="true">老奶家人 · 登录</button><button type="button" id="tab-register" aria-pressed="false">新奶家人 · 注册</button></div>
    <h2 id="account-heading">这位奶家人，<br>你可算来了。</h2>
    <p id="account-description">登录账号。书上的奶蛙，已经在园里等你了。</p>
    <div class="trial-entry"><button type="button" id="account-trial"><span>免费试玩 · 无需登录</span><span aria-hidden="true">↗</span></button><p>先逛再决定。试玩开放全部节点；登录后记录成绩、参与全服排名。</p></div>
    <div id="entry-recovery" class="trial-entry" hidden><p role="alert">游戏没有载入完成，请检查网络后重试。</p><button type="button">重新打开入园页</button></div>
    <form id="account-form">
     <label class="account-field"><span class="field-heading">账号 <small>在奶国怎么称呼你？</small></span><input name="name" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]+" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="例如 naijia_001" aria-describedby="account-name-hint"><small id="account-name-hint" class="field-hint">3–24 位字母、数字或下划线</small></label>
     <label class="account-field"><span class="field-heading">密码 <small>入园暗号，奶蛙不偷看。</small></span><span class="password-field"><input name="password" type="password" required minlength="8" maxlength="128" autocomplete="current-password" placeholder="8–128 位字符"><button type="button" class="password-toggle" data-field="password" aria-label="显示密码" aria-pressed="false">显示</button></span></label>
     <label class="account-field" id="confirm-label" hidden><span class="field-heading">确认密码 <small>严谨一点，再记一遍。</small></span><span class="password-field"><input name="confirm" type="password" minlength="8" maxlength="128" autocomplete="new-password" placeholder="再输入一次相同的密码" disabled><button type="button" class="password-toggle" data-field="confirm" aria-label="显示确认密码" aria-pressed="false">显示</button></span></label>
     <p id="account-error" role="alert"></p>
     <button class="account-submit" type="submit"><span id="account-submit-label">登录，进园开玩</span><span aria-hidden="true">↗</span></button>
    </form>
    <div class="entry-footnote"><span aria-hidden="true">＊</span><p>本次实践没有标准答案。<br><span>账号与赛车成绩联网保存；游园进度保存在当前浏览器。</span></p></div>
   </section>
  </main>
  <footer class="account-colophon"><span>奶国之冬：奶家人集合！</span><span>本册使用方法：登录，然后亲自去玩。</span></footer>
 </div>`;
document.body.append(gate);
let register=false,busy=false;const form=gate.querySelector('form'),error=gate.querySelector('#account-error'),submit=gate.querySelector('.account-submit'),submitLabel=gate.querySelector('#account-submit-label');
function resetPasswordVisibility(){for(const toggle of gate.querySelectorAll('.password-toggle')){form.elements[toggle.dataset.field].type='password';toggle.textContent='显示';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label',toggle.dataset.field==='confirm'?'显示确认密码':'显示密码');}}
for(const kind of ['login','register'])gate.querySelector('#tab-'+kind).onclick=()=>{if(busy)return;register=kind==='register';gate.dataset.mode=kind;gate.querySelector('#confirm-label').hidden=!register;form.elements.confirm.disabled=!register;form.elements.confirm.required=register;form.elements.password.autocomplete=register?'new-password':'current-password';gate.querySelector('#account-heading').innerHTML=register?'欢迎加入，<br>这届奶家人。':'这位奶家人，<br>你可算来了。';gate.querySelector('#account-description').textContent=register?'填好账号和暗号，从星云驿站开始你的冬日实践。':'登录账号。书上的奶蛙，已经在园里等你了。';submitLabel.textContent=register?'注册，加入奶家人':'登录，进园开玩';error.textContent='';form.elements.confirm.removeAttribute('aria-invalid');resetPasswordVisibility();for(const t of ['login','register'])gate.querySelector('#tab-'+t).setAttribute('aria-pressed',String(t===kind));};
for(const toggle of gate.querySelectorAll('.password-toggle'))toggle.onclick=()=>{const input=form.elements[toggle.dataset.field],show=input.type==='password';input.type=show?'text':'password';toggle.textContent=show?'隐藏':'显示';toggle.setAttribute('aria-pressed',String(show));toggle.setAttribute('aria-label',(show?'隐藏':'显示')+(toggle.dataset.field==='confirm'?'确认密码':'密码'));};
form.elements.confirm.addEventListener('input',()=>form.elements.confirm.removeAttribute('aria-invalid'));
form.onsubmit=async e=>{e.preventDefault();if(busy)return;error.textContent='';const data=Object.fromEntries(new FormData(form));if(register&&data.password!==data.confirm){error.textContent='两次输入的密码不一致，请重新确认。';form.elements.confirm.setAttribute('aria-invalid','true');form.elements.confirm.focus();return;}busy=true;submit.disabled=true;form.setAttribute('aria-busy','true');submitLabel.textContent=register?'正在登记奶家人…':'正在打开奶国大门…';try{const {user}=await accountApi('/api/account/'+(register?'register':'login'),data);await enter(user);}catch(e){error.textContent=e.message||'连接失败，请稍后重试';}finally{busy=false;submit.disabled=false;form.removeAttribute('aria-busy');submitLabel.textContent=register?'注册，加入奶家人':'登录，进园开玩';}};
const frog=gate.querySelector('.specimen-button'),observations=['实验尚未开始，奶蛙已经笑了。','观察记录：它比你先进入了放假状态。','思考与讨论：先坐火车，还是先开三轮？','阶段结论：奶家人，集合！'];let observation=0;
frog.onclick=()=>{observation=(observation+1)%observations.length;gate.querySelector('#frog-observation').textContent=observations[observation];if(!matchMedia('(prefers-reduced-motion: reduce)').matches)frog.animate([{transform:'rotate(0deg)'},{transform:'rotate(-5deg)'},{transform:'rotate(4deg)'},{transform:'rotate(-3deg)'},{transform:'rotate(0deg)'}],{duration:420,easing:'ease-out'});};
gate.querySelector('#entry-recovery button').onclick=()=>location.reload();
const trialButton=gate.querySelector('#account-trial');
async function startTrial(){if(busy||account)return;busy=true;trialButton.disabled=true;submit.disabled=true;trialButton.querySelector('span').textContent='正在进入试玩…';const url=new URL(location.href);url.searchParams.set('trial','1');history.replaceState(null,'',url);try{clearOnlineSession();await enter({name:'trial-guest',role:'trial'});}catch(e){trialButton.querySelector('span').textContent='免登录试玩全部节点';busy=false;trialButton.disabled=false;submit.disabled=false;}}
trialButton.onclick=startTrial;
// Keep the entry page visible until a login, registration, or trial button is activated.
// Neither a URL parameter nor an existing account session starts the game automatically.
