(function(){"use strict";function F(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function N(e){return e.assignments.reduce((t,a)=>t+a.estimatePw,0)}function Ht(e,t){return e.assignments.some(a=>a.teamId===t)}function rt(e,t){const a=new Date(e+"T12:00:00");return a.setDate(a.getDate()+t),a.toISOString().slice(0,10)}function B(e,t){return rt(e,t*7)}function Vt(e){return e.reduce((t,a)=>a.endDate!==t.endDate?a.endDate>t.endDate?a:t:a.estimatePw!==t.estimatePw?a.estimatePw>t.estimatePw?a:t:a.durationWeeks>t.durationWeeks?a:t)}function $(e){const[t,a,n]=e.split("-");return`${n}.${a}.${t}`}function Z(e=new Date){const t=new Date(e),a=t.getDay(),n=a===0?-6:1-a;return t.setDate(t.getDate()+n),t.toISOString().slice(0,10)}function z(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?Z():Z(new Date(e.slice(0,10)+"T12:00:00"))}function Ut(e,t){const a=new Date(z(e)+"T12:00:00").getTime(),n=new Date(z(t)+"T12:00:00").getTime();return Math.max(0,Math.round((n-a)/(168*3600*1e3)))}function X(e){return[...e].sort((t,a)=>{const n=t.manualRank,c=a.manualRank;if(n!=null&&c!=null&&n!==c)return n-c;if(n!=null&&c==null)return-1;if(n==null&&c!=null)return 1;const s=F(a)-F(t);return s!==0?s:N(t)-N(a)})}function tt(e,t,a){return e.find(n=>n.id!==a&&n.manualRank!=null&&n.manualRank===t)}function ct(e,t,a){const n=X(e),c=n.findIndex(i=>i.id===t);if(c<0)return e;const s=[...n],[o]=s.splice(c,1),r=Math.max(0,Math.min(s.length,Math.round(a)-1));s.splice(r,0,o);const m=new Map(s.map((i,l)=>[i.id,l+1]));return e.map(i=>{const l=m.get(i.id);return l==null||i.manualRank===l?i:{...i,manualRank:l}})}function Jt(e,t){if(t.length<2)return e;const a=X(e),n=new Set(t),c=new Map(e.map(i=>[i.id,i])),s=t.map(i=>c.get(i)).filter(i=>!!i);let o=0;const r=[];for(const i of a)if(n.has(i.id)){const l=s[o++];l&&r.push(l)}else r.push(i);for(;o<s.length;)r.push(s[o++]);const m=new Map(r.map((i,l)=>[i.id,l+1]));return e.map(i=>{const l=m.get(i.id);return l==null||i.manualRank===l?i:{...i,manualRank:l}})}function Y(e){let t=0;for(const a of e)a.manualRank!=null&&a.manualRank>t&&(t=a.manualRank);return t+1}function V(e){const t=[...e].sort((o,r)=>{const m=F(r)-F(o);return m!==0?m:N(o)-N(r)}),a=new Set,n=new Map;for(const o of t){const r=o.manualRank;r!=null&&Number.isFinite(r)&&r>=1&&!a.has(r)&&(a.add(r),n.set(o.id,r))}let c=1;const s=()=>{for(;a.has(c);)c+=1;const o=c;return a.add(o),c+=1,o};return e.map(o=>{const r=n.get(o.id)??s();return o.manualRank===r?o:{...o,manualRank:r}})}function Pt(e){const t=e.items.filter(i=>i.status!=="done"),a=X(t),n=new Map;for(const i of e.teams)n.set(i.id,[]);for(const i of a)for(const l of i.assignments){const v=n.get(l.teamId)??[];v.push({item:i,estimatePw:l.estimatePw,workStartDate:z(l.workStartDate||e.startDate)}),n.set(l.teamId,v)}const c=[],s={},o=52;for(const i of e.teams){const l=n.get(i.id)??[],v=Array.from({length:o},(g,w)=>({week:w,weekStart:B(e.startDate,w),usedPw:0,capacityPw:i.capacityPw,items:[]}));let y=0;l.forEach((g,w)=>{const h=Ut(e.startDate,g.workStartDate);let k=Math.max(y,h);for(;k<o&&v[k].usedPw>=i.capacityPw-.001;)k+=1;let L=g.estimatePw,D=k,E=B(e.startDate,k);const W=B(e.startDate,k);for(;L>.001&&D<o;){const S=v[D],_=Math.max(0,S.capacityPw-S.usedPw);if(_<=.001){D+=1;continue}const M=Math.min(_,L),T=B(e.startDate,D),d=M/S.capacityPw*7,f=S.usedPw/S.capacityPw*7;E=rt(T,f+d),S.usedPw+=M,S.items.push(g.item.id),L-=M,L>.001&&(D+=1)}const j=i.capacityPw>0?Math.round(g.estimatePw/i.capacityPw*100)/100:g.estimatePw;c.push({item:g.item,teamId:i.id,estimatePw:g.estimatePw,wsjf:F(g.item),effectiveRank:w+1,plannedStartDate:g.workStartDate,startWeek:k,endWeek:D,startDate:W,endDate:E,waitWeeks:k,delayedByQueue:k>h,durationWeeks:j}),y=D,v[y]&&v[y].usedPw>=i.capacityPw-.001?y=D+1:y=D}),s[i.id]=v}const r=new Map;for(const i of c){const l=r.get(i.item.id)??[];l.push(i),r.set(i.item.id,l)}const m=[];for(const i of a){const l=r.get(i.id)??[];if(!l.length)continue;const v=Vt(l),y=l.reduce((g,w)=>w.startWeek<g.startWeek?w:g);m.push({item:i,slices:[...l].sort((g,w)=>g.endDate===w.endDate?w.estimatePw-g.estimatePw:g.endDate<w.endDate?1:-1),wsjf:F(i),totalEstimatePw:N(i),startWeek:y.startWeek,endWeek:v.endWeek,startDate:y.startDate,endDate:v.endDate,waitWeeks:y.waitWeeks,bottleneckTeamId:v.teamId})}return c.sort((i,l)=>i.startWeek!==l.startWeek?i.startWeek-l.startWeek:l.wsjf-i.wsjf),{slices:c,rollups:m,load:s}}function et(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function lt(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const a=z(String(t.startDate??Z())),n=t.items.map(c=>{const s=c;let o=[];return Array.isArray(s.assignments)&&s.assignments.length?o=s.assignments.filter(r=>r&&typeof r.teamId=="string").map(r=>({teamId:r.teamId,estimatePw:Math.max(.5,Number(r.estimatePw)||1),workStartDate:z(String(r.workStartDate||s.workStartDate||a))})):typeof s.teamId=="string"&&(o=[{teamId:s.teamId,estimatePw:Math.max(.5,Number(s.estimatePw)||1),workStartDate:a}]),!o.length&&Array.isArray(t.teams)&&t.teams[0]&&(o=[{teamId:t.teams[0].id,estimatePw:4,workStartDate:a}]),{id:String(s.id??et("item")),title:String(s.title??"Без названия"),type:s.type==="project"?"project":"product",backlog:String(s.backlog??"Backlog"),assignments:o,status:["idea","ready","in_progress","blocked","done"].includes(String(s.status))?s.status:"idea",owner:String(s.owner??"—"),businessValue:Number(s.businessValue)||5,timeCriticality:Number(s.timeCriticality)||5,riskReduction:Number(s.riskReduction)||5,jobSize:Number(s.jobSize)||5,notes:s.notes!=null?String(s.notes):void 0,manualRank:s.manualRank==null||s.manualRank===""?null:Number(s.manualRank)}});return{version:3,startDate:a,teams:t.teams,items:V(n)}}const A=Z(),dt=B(A,1),at=B(A,2),Dt=B(A,3),ut=B(A,4),mt=B(A,6),xt=B(A,8),It={version:3,startDate:A,teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#d60000"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#455a64"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#737373"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#e65100"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:8,workStartDate:A}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",estimatePw:3,workStartDate:dt}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:3,workStartDate:ut}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",estimatePw:2,workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",estimatePw:4,workStartDate:mt}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",estimatePw:10,workStartDate:A},{teamId:"data",estimatePw:4,workStartDate:Dt}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",estimatePw:6,workStartDate:dt},{teamId:"crm",estimatePw:3,workStartDate:ut}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",estimatePw:5,workStartDate:at},{teamId:"platform",estimatePw:3,workStartDate:at}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",estimatePw:7,workStartDate:dt},{teamId:"platform",estimatePw:2,workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",estimatePw:7,workStartDate:A},{teamId:"platform",estimatePw:4,workStartDate:at},{teamId:"mobile",estimatePw:3,workStartDate:mt}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",estimatePw:8,workStartDate:Dt},{teamId:"data",estimatePw:3,workStartDate:ut},{teamId:"mobile",estimatePw:2,workStartDate:xt}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",estimatePw:9,workStartDate:at},{teamId:"platform",estimatePw:3,workStartDate:mt},{teamId:"mobile",estimatePw:2,workStartDate:xt}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},pt={...It,items:V(It.items)},Lt="vi-planer-v3";let Et="idle",nt=[];function Kt(){return null}function Rt(){return Et}function Xt(e){return nt.push(e),()=>{nt=nt.filter(t=>t!==e)}}function G(e){Et=e,nt.forEach(t=>t(e))}function Yt(){try{const e=localStorage.getItem(Lt)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=lt(JSON.parse(e));return t?{...t,items:V(t.items)}:null}catch{return null}}function jt(e){localStorage.setItem(Lt,JSON.stringify(e))}async function Gt(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),a=lt(t.state);return a?{...a,items:V(a.items)}:null}catch{return null}}async function Qt(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function Zt(){return null}async function te(e){return!1}async function ee(){G("loading");const e=await Gt()??await Zt()??Yt()??structuredClone(pt);return jt(e),G((Kt(),"saved")),e}let ft=null,vt=null;function gt(e){jt(e),vt=e,ft&&clearTimeout(ft),ft=setTimeout(async()=>{const t=vt;if(vt=null,!t)return;G("loading");const a=await te(),n=a?!0:await Qt(t);if(a||n){G("saved");return}G("offline")},350)}function qt(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function Mt(e){const t=document.querySelector(`script[data-pdf-lib="${e}"]`);return t?t.dataset.loaded==="1"?Promise.resolve():new Promise((a,n)=>{t.addEventListener("load",()=>a()),t.addEventListener("error",()=>n(new Error(`Failed to load ${e}`)))}):new Promise((a,n)=>{const c=document.createElement("script");c.src=e,c.async=!0,c.dataset.pdfLib=e,c.onload=()=>{c.dataset.loaded="1",a()},c.onerror=()=>n(new Error(`Failed to load ${e}`)),document.head.appendChild(c)})}async function ae(){var a,n;window.html2canvas||await Mt("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(a=window.jspdf)!=null&&a.jsPDF||await Mt("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const e=window.html2canvas,t=(n=window.jspdf)==null?void 0:n.jsPDF;if(!e||!t)throw new Error("PDF libraries failed to load");return{html2canvas:e,jsPDF:t}}async function ne(e,t,a){const{html2canvas:n,jsPDF:c}=await ae(),s=await n(e,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f4f4f4",logging:!1,windowWidth:Math.max(e.scrollWidth,e.clientWidth),windowHeight:Math.max(e.scrollHeight,e.clientHeight)}),o=s.toDataURL("image/png"),r=new c({orientation:"landscape",unit:"mm",format:"a4"}),m=r.internal.pageSize.getWidth(),i=r.internal.pageSize.getHeight(),l=8,v=8,y=m-l*2,g=i-l*2-v,w=y,h=s.height*w/s.width;let k=h,L=l+v,D=0;for(;k>0;){D>0&&r.addPage(),D===0&&(r.setFontSize(11),r.setTextColor(15,23,42),r.text(a,l,l+4)),r.addImage(o,"PNG",l,L,w,h);const E=D===0?g:i-l*2;if(k-=E,L-=E,D+=1,D>40)break}r.save(t)}const yt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды"},u={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let p=structuredClone(pt);function H(e){return p.teams.find(t=>t.id===e)}function bt(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function Ct(e){return new Map(e.map(t=>[t.item.id,t]))}function se(e){return e.assignments.map(t=>{const a=H(t.teamId);return(a==null?void 0:a.name)??t.teamId}).join(", ")}function ie(e){return`<div class="teams-stack">${e.assignments.map(a=>{const n=H(a.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(n==null?void 0:n.color)??"#94a3b8"}"></span>${I((n==null?void 0:n.name)??a.teamId)} <span class="mono muted-inline">${a.estimatePw}чн · старт ${$(a.workStartDate)}</span></span>`}).join("")}</div>`}function oe(e){const t=u.query.trim().toLowerCase(),a=Ct(e),n=p.items.filter(s=>u.typeFilter!=="all"&&s.type!==u.typeFilter||u.teamFilter!=="all"&&!Ht(s,u.teamFilter)||u.statusFilter!=="all"&&s.status!==u.statusFilter?!1:t?s.title.toLowerCase().includes(t)||s.backlog.toLowerCase().includes(t)||s.owner.toLowerCase().includes(t)||se(s).toLowerCase().includes(t):!0);if(u.sortKey==="priority"){const s=X(n);return u.sortDir==="asc"?s:[...s].reverse()}const c=u.sortDir==="asc"?1:-1;return[...n].sort((s,o)=>{var m,i;let r=0;if(u.sortKey==="wsjf")r=F(s)-F(o);else if(u.sortKey==="estimate")r=N(s)-N(o);else{const l=((m=a.get(s.id))==null?void 0:m.endDate)??"9999-99-99",v=((i=a.get(o.id))==null?void 0:i.endDate)??"9999-99-99";r=l<v?-1:l>v?1:0}return r!==0?r*c:s.title.localeCompare(o.title,"ru")})}const _t="vi-planer-col-widths",Tt={priority:"Приоритет",type:"Тип",title:"Инициатива / исходный бэклог",teams:"Команды (оценка · старт)",status:"Статус",wsjf:"WSJF",estimate:"Оценка, чел·нед",eta:"ETA"},re={priority:96,type:88,title:260,teams:220,status:130,wsjf:72,estimate:120,eta:140};function Wt(){try{const e=localStorage.getItem(_t);return e?JSON.parse(e):{}}catch{return{}}}function ce(e){localStorage.setItem(_t,JSON.stringify(e))}const kt={};function At(e,t){if(t&&kt[t]!=null)return kt[t];const a=document.createElement("span");a.textContent=e,a.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:IBM Plex Sans,system-ui,sans-serif;padding:0;",document.body.appendChild(a);const n=Math.ceil(a.getBoundingClientRect().width);a.remove();const c=Math.max(56,n+36);return t&&(kt[t]=c),c}function le(e){const t=Wt()[e],a=At(Tt[e],e);return`width:${Math.max(a,t??re[e])}px;min-width:${a}px`}function Q(e,t,a="",n){const c=n!=null&&u.sortKey===n,s=!c||!n?"":u.sortDir==="asc"?" ↑":" ↓",o=n?`sortable ${c?"sorted":""}`:"",r=n?` data-sort="${n}"`:"";return`<th class="resizable-th ${o} ${a}" data-col="${t}"${r}${n?' title="Сортировать"':""} style="${le(t)}"><span class="th-label">${e}${s}</span><span class="col-resize" data-col-resize="${t}" title="Изменить ширину"></span></th>`}function st(e,t){const n={priority:"priority",wsjf:"wsjf",estimate:"estimate",eta:"eta"}[t];if(!n){const c=u.sortKey===t,s=c?u.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${c?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${s}</th>`}return Q(e,n,"",t)}function de(e){u.sortKey===e?u.sortDir=u.sortDir==="asc"?"desc":"asc":(u.sortKey=e,u.sortDir=e==="wsjf"?"desc":"asc"),C()}function ue(e,t){const a=p.items.filter(i=>i.status!=="done"),n=a.filter(i=>i.type==="product").length,c=a.filter(i=>i.type==="project").length,s=a.filter(i=>i.assignments.length>1).length,o=e.map(i=>i.endWeek),r=o.length?Math.max(...o)+1:0,m=p.teams.filter(i=>t.filter(v=>v.teamId===i.id).reduce((v,y)=>v+y.estimatePw,0)>i.capacityPw*8).length;return`
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${a.length}</div>
        <div class="hint">${n} продуктов · ${c} проектов · ${s} кросс-командных</div>
      </div>
      <div class="metric">
        <div class="label">Горизонт по текущей ёмкости</div>
        <div class="value">${r} нед.</div>
        <div class="hint">до закрытия (по bottleneck-команде)</div>
      </div>
      <div class="metric">
        <div class="label">Команд под риском</div>
        <div class="value">${m}</div>
        <div class="hint">спрос &gt; ёмкости на 8 недель</div>
      </div>
      <div class="metric">
        <div class="label">Старт планирования</div>
        <div class="value" style="font-size:18px">${$(p.startDate)}</div>
        <div class="hint">понедельник текущей недели</div>
      </div>
    </div>
  `}function me(){return`
    <details class="callout callout-cols agenda">
      <summary class="agenda-summary">Адженда</summary>
      <div class="cols-help">
        <div><span class="cols-help-k">Приоритет</span> — сквозной ранг (1 = выше); тяните строку за ⋮⋮, чтобы переставить. Сортировка других колонок приоритет не меняет</div>
        <div><span class="cols-help-k">Тип</span> — проект или продукт</div>
        <div><span class="cols-help-k">Инициатива</span> — название, исходный бэклог и владелец</div>
        <div><span class="cols-help-k">Команды</span> — кто делает, оценка (чел·нед) и план старта</div>
        <div><span class="cols-help-k">Статус</span> — стадия готовности</div>
        <div><span class="cols-help-k">WSJF</span> — (BV + TC + RR) / Job Size</div>
        <div><span class="cols-help-k">Оценка</span> — суммарный объём по всем командам</div>
        <div><span class="cols-help-k">ETA</span> — дата готовности (когда закончила последняя команда)</div>
      </div>
    </details>
  `}function pe(e,t){const a=Ct(e),n=oe(e),c=u.sortKey==="priority",s=n.map(o=>{const r=a.get(o.id),m=F(o),i=N(o),l=o.manualRank??"—",v=r?`<div class="eta-teams">${r.slices.map(y=>{const g=H(y.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(g==null?void 0:g.color)??"#64748b"}">${I((g==null?void 0:g.name)??y.teamId)}</span>: ${$(y.startDate)}→${$(y.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${c?"row-draggable":""}" data-edit="${o.id}" data-row-id="${o.id}">
          <td class="prio-cell">
            <div class="prio-edit" data-stop-edit>
              ${c?'<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>':""}
              <input
                class="prio-input"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-prio-id="${o.id}"
                value="${l}"
                title="Приоритет (1 = выше)"
                aria-label="Приоритет"
              />
            </div>
          </td>
          <td>
            <span class="badge badge-${o.type}">${o.type==="product"?"Продукт":"Проект"}</span>
            ${o.assignments.length>1?`<div class="meta" style="margin-top:4px">${o.assignments.length} команды</div>`:""}
          </td>
          <td class="title-cell">
            <div class="name">${I(o.title)}</div>
            <div class="meta">${I(o.backlog)} · ${I(o.owner)}</div>
          </td>
          <td>${ie(o)}</td>
          <td><span class="badge badge-status-${o.status}">${bt(o.status)}</span></td>
          <td class="mono metric-num">${m}</td>
          <td class="mono metric-num">
            ${i}
            ${o.assignments.length>1?`<div class="meta">${o.assignments.map(y=>y.estimatePw).join(" + ")}</div>`:""}
          </td>
          <td class="mono ${r&&r.waitWeeks>4?"eta-late":"eta-good"}">
            ${r?`<span class="eta-final">${$(r.endDate)}</span>`:"—"}
            ${v}
          </td>
        </tr>
      `}).join("");return`
    ${me()}
    <div class="panel">
      <div class="panel-header">
        <h2>Единый портфель (проекты + продукты)</h2>
        <div class="filters">
          <input id="q" placeholder="Поиск…" value="${U(u.query)}" />
          <select id="typeFilter">
            <option value="all" ${u.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${u.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${u.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${p.teams.map(o=>`<option value="${o.id}" ${u.teamFilter===o.id?"selected":""}>${I(o.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${u.statusFilter===o?"selected":""}>${bt(o)}</option>`).join("")}
          </select>
          <button class="btn" id="resetFilters" title="Сбросить фильтры и сортировку">Сбросить фильтры</button>
          <button class="btn btn-primary" id="addItem">+ Инициатива</button>
        </div>
      </div>
      ${c?"":'<p class="sort-prio-hint">Сейчас сортировка не по приоритету — перестановка строк отключена, приоритеты не меняются. Верните сортировку по «Приоритет», чтобы двигать строки.</p>'}
      <div class="table-scroll" style="overflow-x:auto">
        <table class="portfolio-table">
          <thead>
            <tr>
              ${st("Приоритет","priority")}
              ${Q("Тип","type")}
              ${Q("Инициатива / исходный бэклог","title")}
              ${Q("Команды (оценка · старт)","teams")}
              ${Q("Статус","status")}
              ${st("WSJF","wsjf")}
              ${st("Оценка, чел·нед","estimate")}
              ${st("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${s||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function fe(e){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${p.teams.map(a=>{const n=e.filter(r=>r.teamId===a.id).sort((r,m)=>r.effectiveRank-m.effectiveRank),c=n.reduce((r,m)=>r+m.estimatePw,0),s=a.capacityPw>0?c/a.capacityPw:0,o=Math.min(100,Math.round(n.filter(r=>r.startWeek<8).reduce((r,m)=>{const i=Math.min(m.endWeek+1,8)-m.startWeek;return r+Math.max(0,i)*(m.estimatePw/Math.max(1,m.endWeek-m.startWeek+1))},0)/(a.capacityPw*8)*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${I(a.name)}</h3>
              <div class="meta">Ёмкость ${a.capacityPw} чел·нед/нед · спрос ${c.toFixed(1)} · ~${s.toFixed(1)} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${o}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,o)}%;background:${a.color}"></span></div>
          ${n.map(r=>{const m=r.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${r.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${r.item.type}">${r.item.type==="product"?"П":"Пр"}</span> ${I(r.item.title)}</div>
                <div class="meta">WSJF ${r.wsjf} · ${r.estimatePw} чел·нед · план ${$(r.plannedStartDate)}${r.delayedByQueue?" → сдвиг":""}${m>0?` · ещё ${m} ком.`:""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${$(r.startDate)} →<br/>${$(r.endDate)}
              </div>
            </div>
          `}).join("")||'<div class="empty">Очередь пуста</div>'}
        </div>
      `}).join("")}
    </div>
  `}function ve(e){const t=p.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда у команды появляется ёмкость с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${p.teams.map(n=>{const c=e.filter(i=>i.teamId===n.id).sort((i,l)=>{const v=i.item.manualRank??9999,y=l.item.manualRank??9999;return v!==y?v-y:i.effectiveRank-l.effectiveRank}),s=c.reduce((i,l)=>i+l.estimatePw,0),o=n.capacityPw>0?s/n.capacityPw:0,r=c.length?c[c.length-1].endDate:t,m=c.map((i,l)=>{const v=i.item.manualRank??"—",y=l>0?c[l-1]:null;let g="может взять сразу (есть свободная ёмкость)",w="take-now";i.startDate>i.plannedStartDate?(g=y?`ждёт очередь: после #${y.item.manualRank??"?"} «${y.item.title}»`:"сдвиг из‑за загрузки очереди",w="take-queue"):i.startDate>t&&(g=`ждёт плановый старт ${$(i.plannedStartDate)}`,w="take-plan");const h=i.item.assignments.filter(k=>k.teamId!==n.id).map(k=>{var L;return((L=H(k.teamId))==null?void 0:L.name)??k.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${v}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${i.item.type}">${i.item.type==="product"?"П":"Пр"}</span>
                  ${I(i.item.title)}
                </div>
                <div class="take-line ${w}">
                  <strong>Может взять с ${$(i.startDate)}</strong>
                  <span class="meta"> · ${I(g)}</span>
                </div>
                <div class="meta">
                  ${i.estimatePw} чел·нед · план ${$(i.plannedStartDate)} · до ${$(i.endDate)}
                  ${h.length?` · ещё: ${h.map(I).join(", ")}`:""}
                </div>
                <div class="take-bar" title="Окно работы в горизонте 12 нед.">
                  <span class="take-bar-fill" style="left:${i.startWeek/12*100}%;width:${Math.max(3,(i.endWeek-i.startWeek+1)/12*100)}%;background:${n.color}"></span>
                </div>
              </div>
              <div class="mono queue-item-dates">
                <div class="meta">старт</div>
                <div>${$(i.startDate)}</div>
                <div class="meta" style="margin-top:6px">конец</div>
                <div>${$(i.endDate)}</div>
              </div>
            </div>
          `}).join("")||`<div class="empty">Очередь пуста — команда свободна с ${$(t)}</div>`;return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${n.color}"></span>${I(n.name)}</h3>
              <div class="meta">Ёмкость ${n.capacityPw} чел·нед/нед · спрос ${s.toFixed(1)} · ~${o.toFixed(1)} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${$(r)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          ${m}
        </div>
      `}).join("")}
    </div>
  `}function ge(e,t){const a=Math.max(4,...e.map(h=>h.endWeek+2),4),n=Math.max(4,Math.min(52,Math.round(u.ganttWeeks)||16));u.ganttWeeks=n;const c=X(p.items.filter(h=>h.status!=="done")),s=new Map(c.map((h,k)=>[h.id,k])),o=100/n,r=`repeating-linear-gradient(90deg, #f5f5f5 0, #f5f5f5 calc(${o}% - 1px), #e0e0e0 calc(${o}% - 1px), #e0e0e0 ${o}%)`,m=[],i=[];p.teams.forEach((h,k)=>{const L=t.filter(E=>E.teamId===h.id).sort((E,W)=>E.effectiveRank-W.effectiveRank);if(L.length<2)return;const D=`arrow-${h.id}`;i.push(`
      <marker id="${D}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${h.color}" fill-opacity="0.85" />
      </marker>
    `);for(let E=1;E<L.length;E++){const W=L[E-1],j=L[E],S=(s.get(W.item.id)??0)+.5,_=(s.get(j.item.id)??0)+.5,M=Math.min(n-.05,W.endWeek+.92),T=Math.min(n-.05,Math.max(.08,j.startWeek+.02)),d=T-M,f=(k%4-1.5)*.08,b=Math.max(.35,Math.abs(d)*.45)+Math.abs(f),x=M+(d>=0?b:-b*.35)+f,P=T-(d>=0?b:-b*.35)+f,R=Math.abs(S-_)<.02?`M ${M} ${S} H ${T}`:`M ${M} ${S} C ${x} ${S}, ${P} ${_}, ${T} ${_}`;m.push(`<path d="${R}" fill="none" stroke="${h.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${D})" />`)}});const l=[],v=[];for(const h of c){const k=e.find(j=>j.item.id===h.id);if(!k)continue;const L=k.slices.map(j=>{const S=t.filter(d=>d.teamId===j.teamId).sort((d,f)=>d.effectiveRank-f.effectiveRank),_=S.findIndex(d=>d.item.id===h.id);if(_<=0)return null;const M=S[_-1],T=H(j.teamId);return`#${M.item.manualRank} (${(T==null?void 0:T.name)??j.teamId})`}).filter(Boolean),D=[...new Set(L)],E=D.length?`<div class="meta gantt-dep-meta">после ${D.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',W=k.slices.map(j=>{const S=H(j.teamId),_=j.startWeek/n*100,M=Math.max(1,j.endWeek-j.startWeek+1)/n*100;return`<div class="gantt-bar ${j.teamId===k.bottleneckTeamId?"gantt-bot":""}" style="left:${_}%;width:${Math.max(M,2.5)}%;background:${(S==null?void 0:S.color)??"#64748b"}" title="${U((S==null?void 0:S.name)??"")}: ${$(j.endDate)}">${I((S==null?void 0:S.name)??"")}</div>`}).join("");l.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${h.manualRank??"—"}</span> ${I(h.title)}</div>
        <div class="meta">${h.type==="product"?"Продукт":"Проект"} · ETA ${$(k.endDate)}</div>
        ${E}
      </div>
    `),v.push(`<div class="gantt-track gantt-track-multi" style="background:${r}">${W}</div>`)}const y=Math.max(1,c.length),g=n<=12?1:n<=24?2:n<=36?3:4,w=Array.from({length:n},(h,k)=>{if(!(k%g===0||k===n-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${o}%"></div>`;const D=B(p.startDate,k),[,E,W]=D.split("-");return`<div class="gantt-axis-tick" style="width:${o}%">
      <span class="gantt-axis-w">Н${k+1}</span>
      <span class="gantt-axis-d">${W}.${E}</span>
    </div>`}).join("");return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сроки и зависимости по приоритету</h2>
        <div class="gantt-weeks-ctrl">
          <label for="ganttWeeks">Горизонт</label>
          <input id="ganttWeeks" type="range" min="4" max="52" step="1" value="${n}" />
          <span class="mono" id="ganttWeeksLabel">${n} нед.</span>
          ${a>n?`<span class="meta">часть работ за горизонтом (нужно ~${a})</span>`:""}
        </div>
      </div>
      <div class="timeline">
        ${c.length?`<div class="gantt-layout">
          <div class="gantt-labels-col">
            <div class="gantt-axis-spacer">
              <span class="meta">нед. с ${$(p.startDate)}</span>
            </div>
            ${l.join("")}
          </div>
          <div class="gantt-tracks-wrap">
            <div class="gantt-axis">${w}</div>
            <div class="gantt-tracks-col">
              <svg class="gantt-dep-layer" viewBox="0 0 ${n} ${y}" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  ${i.join("")}
                </defs>
                ${m.join("")}
              </svg>
              ${v.join("")}
            </div>
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.</p>
    </div>
  `}const wt=["#d60000","#455a64","#737373","#c62828","#e65100","#1a1a1a","#8d6e63","#546e7a","#b71c1c","#f57c00"];function ht(){const e=new Set(p.teams.map(t=>t.color));return wt.find(t=>!e.has(t))??wt[p.teams.length%wt.length]}function ye(){return`
    <div class="callout">
      Управляйте командами: название и ёмкость (чел·нед/нед). Изменение ёмкости пересчитывает очереди и ETA.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Команды</h2>
        <button class="btn btn-primary" id="addTeam">+ Команда</button>
      </div>
      <div id="teamsManageList">
        ${p.teams.map(t=>`
      <div class="capacity-row" data-team-row="${t.id}">
        <span class="team-dot" style="background:${t.color}"></span>
        <input
          class="team-name-input"
          type="text"
          data-team-name="${t.id}"
          value="${U(t.name)}"
          aria-label="Название команды"
        />
        <input type="range" min="1" max="8" step="0.5" value="${t.capacityPw}" data-cap="${t.id}" />
        <span class="mono capacity-label" data-cap-label="${t.id}">${t.capacityPw} чел·нед</span>
      </div>
    `).join("")||'<div class="empty">Нет команд — создайте первую</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar" hidden>
        <span class="team-dot" id="newTeamDot" style="background:${ht()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">Создать</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function be(e){var i;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((i=p.teams[0])==null?void 0:i.id)??"",estimatePw:4,workStartDate:p.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:Y(p.items)},a=F(t),n=new Set(t.assignments.map(l=>l.teamId)),c=new Map(t.assignments.map(l=>[l.teamId,l.estimatePw])),s=new Map(t.assignments.map(l=>[l.teamId,l.workStartDate])),o=Ft(t),r=o?Nt(o,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',m=p.teams.map(l=>{const v=n.has(l.id),y=c.get(l.id)??4,g=s.get(l.id)??p.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${l.id}" ${v?"checked":""} />
            <span class="team-dot" style="background:${l.color}"></span>
            <span class="team-assign-name">${I(l.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Оценка</span>
            <input type="number" class="f_team_est" data-team="${l.id}" min="0.5" step="0.5" value="${y}" ${v?"":"disabled"} />
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${l.id}" value="${g}" ${v?"":"disabled"} />
          </label>
        </div>
      `}).join("");return`
    <div class="modal-backdrop" id="modal">
      <div class="modal modal-wide">
        <div class="modal-head">
          <h3>${e?"Карточка инициативы":"Новая инициатива"}</h3>
          <div class="modal-head-actions">
            <button class="btn" id="closeModal2">Отмена</button>
            <button class="btn btn-ghost" id="closeModal">Закрыть</button>
            <button class="btn btn-primary" id="saveItem">Сохранить</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Название</label>
            <input id="f_title" value="${U(t.title)}" />
          </div>
          <div class="grid-2">
            <div class="field">
              <label>Тип</label>
              <select id="f_type">
                <option value="product" ${t.type==="product"?"selected":""}>Продукт</option>
                <option value="project" ${t.type==="project"?"selected":""}>Проект</option>
              </select>
            </div>
            <div class="field">
              <label>Исходный бэклог</label>
              <input id="f_backlog" value="${U(t.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${["idea","ready","in_progress","blocked","done"].map(l=>`<option value="${l}" ${t.status===l?"selected":""}>${bt(l)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${U(t.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: оценка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${m}</div>
            <div class="meta" style="margin-top:6px">Итого объём: <strong class="mono" id="liveTotalEst">${N(t)}</strong> чел·нед. Дата старта — не раньше этой; если очередь команды занята, старт сдвинется позже.</div>
          </div>
          <div class="callout" style="margin:0" id="liveEtaBox">
            <strong>Пересчёт ETA</strong> (с учётом очереди и стартов)
            <div id="liveEta" style="margin-top:8px;font-size:13px;color:var(--ink)">${r}</div>
          </div>
          <div class="score-grid">
            <div class="score-box"><div class="k">Business Value</div><div class="v"><input id="f_bv" type="number" min="1" max="10" value="${t.businessValue}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Time Criticality</div><div class="v"><input id="f_tc" type="number" min="1" max="10" value="${t.timeCriticality}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Risk / Opportunity</div><div class="v"><input id="f_rr" type="number" min="1" max="10" value="${t.riskReduction}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Job Size</div><div class="v"><input id="f_js" type="number" min="1" max="10" value="${t.jobSize}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
          </div>
          <div class="callout" style="margin:0">WSJF = (BV + TC + RR) / Job Size → <strong class="mono" id="liveWsjf">${a}</strong></div>
          <div class="grid-2">
            <div class="field">
              <label>Приоритет (уникальный, 1 = выше)</label>
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??Y(p.items)}" />
              <div class="meta" style="margin-top:6px">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
            </div>
            <div class="field">
              <label>Заметки</label>
              <textarea id="f_notes">${I(t.notes??"")}</textarea>
            </div>
          </div>
        </div>
        ${e?`<div class="modal-foot">
          <button class="btn" id="deleteItem" style="color:var(--bad)">Удалить</button>
        </div>`:""}
      </div>
    </div>
  `}function Ft(e){const t=e.assignments.length?e.assignments:St();if(!t.length)return null;const a=e.id||"__draft__",n={...e,id:a,assignments:t},c=p.items.some(o=>o.id===a)?p.items.map(o=>o.id===a?n:o):[...p.items,n],{rollups:s}=Pt({...p,items:c});return s.find(o=>o.item.id===a)??null}function Bt(e){const t=H(e.teamId),a=(t==null?void 0:t.capacityPw)||1,n=Math.round(e.estimatePw/a*100)/100,c=z(e.workStartDate||p.startDate),s=rt(c,n*7);return{start:c,end:s,weeks:n}}function Nt(e,t){const a=new Map(t.map(s=>[s.teamId,s])),n=e.slices.map(s=>{const o=H(s.teamId),r=a.get(s.teamId),m=r?z(r.workStartDate):s.plannedStartDate,i=r?Bt(r):null,l=s.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",v=s.startDate>m?` <span class="meta">(план ${$(m)}, очередь сдвинула на ${$(s.startDate)})</span>`:s.startDate<m?` <span class="meta">(ждём план ${$(m)})</span>`:"",y=i?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(i.start)} → <span class="mono">${$(i.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${I((o==null?void 0:o.name)??s.teamId)}</strong>: <span class="mono">${$(s.startDate)} → ${$(s.endDate)}</span> <span class="meta">(${s.estimatePw} чел·нед ≈ ${s.durationWeeks} нед.)</span>${v}${l}${y}</div>`}).join(""),c=t.map(s=>Bt(s).end).reduce((s,o)=>s>o?s:o,"0000-00-00");return n+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(c)}</strong> — меняется сразу при смене даты</div>`}function I(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function U(e){return I(e).replaceAll("'","&#39;")}function J(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),(e=document.querySelector("#prioPop"))==null||e.remove()}function ke(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-prio-no>Нет</button>
      <button type="button" class="btn btn-primary" data-prio-yes>Да</button>
    </div>
  `}function $t(e,t,a,n){var v,y;J(),e.classList.add("prio-ask");const c=document.createElement("div");c.id="prioPop",c.className="prio-confirm prio-confirm-float",c.setAttribute("data-stop-edit",""),c.innerHTML=ke(t),document.body.appendChild(c);const s=()=>{const g=e.getBoundingClientRect(),w=c.getBoundingClientRect();let h=g.right+8,k=g.top+g.height/2-w.height/2;h+w.width>window.innerWidth-8&&(h=Math.max(8,g.left-w.width-8)),k=Math.max(8,Math.min(k,window.innerHeight-w.height-8)),c.style.left=`${h}px`,c.style.top=`${k}px`};s();const o=()=>s();window.addEventListener("scroll",o,!0),window.addEventListener("resize",o);const r=()=>{window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",o),document.removeEventListener("mousedown",l,!0)},m=()=>{r(),J(),n()},i=()=>{r(),J(),a()},l=g=>{const w=g.target;c.contains(w)||e.contains(w)||m()};document.addEventListener("mousedown",l,!0),(v=c.querySelector("[data-prio-yes]"))==null||v.addEventListener("click",g=>{g.stopPropagation(),i()}),(y=c.querySelector("[data-prio-no]"))==null||y.addEventListener("click",g=>{g.stopPropagation(),m()})}function we(){if(u.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,a=null;const n=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(s=>s.classList.remove("is-dragging","drag-over"))},c=(s,o)=>{if(s===o)return;const r=Array.from(e.querySelectorAll("tr[data-row-id]")).map(y=>y.dataset.rowId),m=r.indexOf(s),i=r.indexOf(o);if(m<0||i<0)return;const l=[...r];l.splice(m,1),l.splice(i,0,s);const v=u.sortDir==="asc"?l:[...l].reverse();p.items=Jt(p.items,v),u.sortKey="priority",O()};e.querySelectorAll("[data-drag-handle]").forEach(s=>{const o=s.closest("tr[data-row-id]");if(!o)return;s.addEventListener("pointerdown",m=>{m.button===0&&(m.preventDefault(),m.stopPropagation(),t=o.dataset.rowId??null,a=m.pointerId,s.setPointerCapture(m.pointerId),n(),o.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),s.addEventListener("pointermove",m=>{if(t==null||m.pointerId!==a)return;const i=document.elementFromPoint(m.clientX,m.clientY),l=i==null?void 0:i.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(v=>v.classList.remove("drag-over")),l&&l.dataset.rowId!==t&&l.classList.add("drag-over")});const r=m=>{if(t==null||m.pointerId!==a)return;const i=t,l=document.elementFromPoint(m.clientX,m.clientY),v=l==null?void 0:l.closest("tr[data-row-id]"),y=v==null?void 0:v.dataset.rowId;try{s.releasePointerCapture(m.pointerId)}catch{}n(),document.body.classList.remove("prio-dragging"),t=null,a=null,y&&c(i,y)};s.addEventListener("pointerup",r),s.addEventListener("pointercancel",r)})}function C(){J(),K();const{slices:e,rollups:t}=Pt(p),a=document.querySelector("#app");if(!a)return;const n=u.editingId!=null?p.items.find(c=>c.id===u.editingId)??null:null;a.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${Rt()}">${qt(Rt())}</span>
          <button class="btn" id="exportPdfBtn">Экспорт PDF</button>
          <button class="btn" id="exportBtn">Экспорт JSON</button>
          <button class="btn" id="importBtn">Импорт JSON</button>
          <button class="btn" id="resetBtn">Сбросить демо</button>
        </div>
        <p class="subtitle">
          Единый портфель проектов и продуктов: сквозной WSJF, несколько команд на инициативу
          со своими оценками и ETA, bottleneck-срок готовности.
        </p>
      </div>
      <div id="pdfCapture">
      <div class="print-only print-doc-header" id="pdfDocHeader">
        <h1>VI Planer — ${yt[u.tab]}</h1>
        <p>Старт портфеля: ${p.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${ue(t,e)}
      <div class="tabs no-print">
        <button class="tab ${u.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${u.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${u.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${u.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${u.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${u.tab==="portfolio"?pe(t):u.tab==="teams"?fe(e):u.tab==="queuesTest"?ve(e):u.tab==="timeline"?ge(t,e):ye()}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${u.creating||n?be(n):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,he()}function St(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const a of e){if(!a.checked)continue;const n=a.dataset.team,c=document.querySelector(`.f_team_est[data-team="${n}"]`),s=document.querySelector(`.f_team_start[data-team="${n}"]`),o=Math.max(.5,Number(c==null?void 0:c.value)||1),r=z((s==null?void 0:s.value)||p.startDate);t.push({teamId:n,estimatePw:o,workStartDate:r})}return t}function Ot(){var o,r,m,i,l,v,y;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),a=St();if(e&&(e.textContent=String(a.reduce((g,w)=>g+w.estimatePw,0)||0)),!t)return;if(!a.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const n=(u.editingId?p.items.find(g=>g.id===u.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:a,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},c={...n,id:u.editingId||"__draft__",assignments:a,title:((o=document.querySelector("#f_title"))==null?void 0:o.value.trim())||n.title,type:((r=document.querySelector("#f_type"))==null?void 0:r.value)||n.type,status:((m=document.querySelector("#f_status"))==null?void 0:m.value)||n.status,businessValue:Number((i=document.querySelector("#f_bv"))==null?void 0:i.value)||n.businessValue,timeCriticality:Number((l=document.querySelector("#f_tc"))==null?void 0:l.value)||n.timeCriticality,riskReduction:Number((v=document.querySelector("#f_rr"))==null?void 0:v.value)||n.riskReduction,jobSize:Number((y=document.querySelector("#f_js"))==null?void 0:y.value)||n.jobSize,manualRank:(()=>{var h;const g=(h=document.querySelector("#f_rank"))==null?void 0:h.value,w=Math.round(Number(g));return Number.isFinite(w)&&w>=1?w:n.manualRank??Y(p.items)})()},s=Ft(c);if(!s){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=Nt(s,a)}function zt(){const e=(s,o)=>{const r=document.querySelector(`#${s}`),m=Number(r==null?void 0:r.value);return Number.isFinite(m)?m:o},t=s=>{var o;return((o=document.querySelector(`#${s}`))==null?void 0:o.value)??""},a=St();if(!a.length)return alert("Выберите хотя бы одну команду"),null;const n=t("f_rank").trim(),c=Math.max(1,Math.round(Number(n)||Y(p.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:a,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:it(e("f_bv",5),1,10),timeCriticality:it(e("f_tc",5),1,10),riskReduction:it(e("f_rr",5),1,10),jobSize:it(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:c}}function it(e,t,a){return Math.min(a,Math.max(t,e))}function O(){gt(p),C()}function he(){var i,l,v,y,g,w,h,k,L,D,E,W,j,S,_,M,T;document.querySelectorAll("[data-tab]").forEach(d=>{d.addEventListener("click",()=>{u.tab=d.dataset.tab,C()})});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{u.query=e.value}),e==null||e.addEventListener("change",()=>C());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{u.typeFilter=t.value,C()});const a=document.querySelector("#teamFilter");a==null||a.addEventListener("change",()=>{u.teamFilter=a.value,C()});const n=document.querySelector("#statusFilter");n==null||n.addEventListener("change",()=>{u.statusFilter=n.value,C()}),(i=document.querySelector("#addItem"))==null||i.addEventListener("click",()=>{u.creating=!0,u.editingId=null,C()}),(l=document.querySelector("#resetFilters"))==null||l.addEventListener("click",()=>{u.typeFilter="all",u.teamFilter="all",u.statusFilter="all",u.query="",u.sortKey="priority",u.sortDir="asc",C()}),document.querySelectorAll("[data-edit]").forEach(d=>{d.addEventListener("click",f=>{f.target.closest("[data-stop-edit], .prio-input, .prio-edit, #prioPop, .drag-handle")||(u.editingId=d.dataset.edit??null,u.creating=!1,C())})}),we(),document.querySelectorAll(".prio-input").forEach(d=>{const f=d.dataset.prioId,b=()=>{const P=p.items.find(R=>R.id===f);d.value=String((P==null?void 0:P.manualRank)??1)},x=()=>{const P=p.items.find(Le=>Le.id===f);if(!P)return;const R=Number(d.value);if(!Number.isFinite(R)||R<1){b();return}const q=Math.round(R);if(d.value=String(q),q===P.manualRank)return;const ot=tt(p.items,q,f),Ie=ot?`Сменить на <span class="accent">${q}</span>?<br/>«${I(ot.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${q}</span>?`;$t(d,Ie,()=>{p.items=ct(p.items,f,q),O()},b)};d.addEventListener("click",P=>P.stopPropagation()),d.addEventListener("mousedown",P=>P.stopPropagation()),d.addEventListener("keydown",P=>{P.key==="Enter"&&(P.preventDefault(),x()),P.key==="Escape"&&(J(),b(),d.blur())}),d.addEventListener("change",x)}),document.querySelectorAll("[data-sort]").forEach(d=>{d.addEventListener("click",f=>{if(f.target.closest("[data-col-resize]"))return;f.stopPropagation();const b=d.dataset.sort;(b==="wsjf"||b==="estimate"||b==="eta"||b==="priority")&&de(b)})}),Se();const c=()=>{u.creating=!1,u.editingId=null,C()};(v=document.querySelector("#closeModal"))==null||v.addEventListener("click",c),(y=document.querySelector("#closeModal2"))==null||y.addEventListener("click",c),(g=document.querySelector("#modal"))==null||g.addEventListener("click",d=>{d.target.id==="modal"&&c()}),document.querySelectorAll(".f_team_check").forEach(d=>{d.addEventListener("change",()=>{const f=d.dataset.team,b=document.querySelector(`.f_team_est[data-team="${f}"]`),x=document.querySelector(`.f_team_start[data-team="${f}"]`);b&&(b.disabled=!d.checked),x&&(x.disabled=!d.checked),Ot()})});const s=document.querySelector("#teamAssignList"),o=d=>{const f=d.target;f&&(f.classList.contains("f_team_est")||f.classList.contains("f_team_start")||f.classList.contains("f_team_check"))&&Ot()};s==null||s.addEventListener("input",o),s==null||s.addEventListener("change",o),s==null||s.addEventListener("keyup",o),(w=document.querySelector("#saveItem"))==null||w.addEventListener("click",()=>{const d=zt();if(!d)return;const f=d.manualRank??Y(p.items),b=document.querySelector("#f_rank"),x=()=>{if(tt(p.items,f,null)){const q=et("item");p.items=[...p.items,{...d,id:q,manualRank:p.items.length+1}],p.items=ct(p.items,q,f)}else p.items.push({...d,id:et("item"),manualRank:f}),p.items=V(p.items);u.creating=!1,u.editingId=null,O()},P=()=>{if(!u.editingId)return;const R=p.items.findIndex(ot=>ot.id===u.editingId);if(R<0)return;const q=p.items[R];f!==q.manualRank?(p.items[R]={...q,...d,manualRank:q.manualRank},p.items=ct(p.items,u.editingId,f)):p.items[R]={...q,...d},u.creating=!1,u.editingId=null,O()};if(u.creating){const R=tt(p.items,f,null);if(R&&b){$t(b,`Занять <span class="accent">${f}</span>?<br/>«${I(R.title)}» сдвинется вверх.`,x,()=>{});return}x();return}if(u.editingId){const R=p.items.find(q=>q.id===u.editingId);if(R&&f!==R.manualRank&&b){const q=tt(p.items,f,u.editingId);$t(b,q?`Сменить на <span class="accent">${f}</span>?<br/>«${I(q.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${f}</span>?`,P,()=>{});return}P()}}),(h=document.querySelector("#deleteItem"))==null||h.addEventListener("click",()=>{u.editingId&&(p.items=p.items.filter(d=>d.id!==u.editingId),u.editingId=null,O())}),["f_bv","f_tc","f_rr","f_js"].forEach(d=>{var f;(f=document.querySelector(`#${d}`))==null||f.addEventListener("input",()=>{const b=document.querySelector("#liveWsjf");if(!b)return;const x=zt();x&&(b.textContent=String(F({...x})))})}),document.querySelectorAll("[data-cap]").forEach(d=>{d.addEventListener("input",()=>{const f=d.dataset.cap,b=p.teams.find(P=>P.id===f);if(!b)return;b.capacityPw=Number(d.value),gt(p);const x=document.querySelector(`[data-cap-label="${f}"]`);x&&(x.textContent=`${b.capacityPw} чел·нед`)}),d.addEventListener("change",()=>C())});const r=document.querySelector("#ganttWeeks");r==null||r.addEventListener("input",()=>{const d=Math.max(4,Math.min(52,Number(r.value)||16));u.ganttWeeks=d;const f=document.querySelector("#ganttWeeksLabel");f&&(f.textContent=`${d} нед.`)}),r==null||r.addEventListener("change",()=>{u.ganttWeeks=Math.max(4,Math.min(52,Number(r.value)||16)),C()}),document.querySelectorAll("[data-team-name]").forEach(d=>{const f=()=>{const b=d.dataset.teamName,x=p.teams.find(R=>R.id===b);if(!x)return;const P=d.value.trim()||x.name;d.value=P,P!==x.name&&(x.name=P,O())};d.addEventListener("change",f),d.addEventListener("keydown",b=>{b.key==="Enter"&&(b.preventDefault(),d.blur())})}),(k=document.querySelector("#addTeam"))==null||k.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName"),b=document.querySelector("#newTeamDot");d&&(d.hidden=!1),b&&(b.style.background=ht()),f==null||f.focus()}),(L=document.querySelector("#cancelNewTeam"))==null||L.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName");d&&(d.hidden=!0),f&&(f.value="")});const m=()=>{const d=document.querySelector("#newTeamName"),f=(d==null?void 0:d.value.trim())||"";if(!f){d==null||d.focus();return}p.teams.push({id:et("team"),name:f,capacityPw:3,color:ht()}),O()};(D=document.querySelector("#saveNewTeam"))==null||D.addEventListener("click",m),(E=document.querySelector("#newTeamName"))==null||E.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),m())}),(W=document.querySelector("#exportPdfBtn"))==null||W.addEventListener("click",()=>{De()}),(j=document.querySelector("#downloadReqsBtn"))==null||j.addEventListener("click",()=>{Pe()}),(S=document.querySelector("#exportBtn"))==null||S.addEventListener("click",()=>{const d=new Blob([JSON.stringify(p,null,2)],{type:"application/json"}),f=URL.createObjectURL(d),b=document.createElement("a");b.href=f,b.download=`vi-planer-${p.startDate}.json`,b.click(),URL.revokeObjectURL(f)}),(_=document.querySelector("#importBtn"))==null||_.addEventListener("click",()=>{var d;(d=document.querySelector("#fileInput"))==null||d.click()}),(M=document.querySelector("#fileInput"))==null||M.addEventListener("change",async d=>{var b;const f=(b=d.target.files)==null?void 0:b[0];if(f)try{const x=await f.text(),P=lt(JSON.parse(x));if(!P){alert("Неверный формат файла");return}p=P,O()}catch{alert("Не удалось прочитать JSON")}}),(T=document.querySelector("#resetBtn"))==null||T.addEventListener("click",d=>{d.stopPropagation(),$e(d.currentTarget)})}function K(){var e,t;(e=document.querySelector("#resetPop"))==null||e.remove(),(t=document.querySelector("#resetBtn"))==null||t.classList.remove("reset-ask")}function $e(e){var r,m;K(),J(),e.classList.add("reset-ask");const t=document.createElement("div");t.id="resetPop",t.className="reset-confirm",t.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(t);const a=()=>{const i=e.getBoundingClientRect(),l=t.offsetWidth,v=t.offsetHeight;let y=i.right-l,g=i.bottom+6;y<8&&(y=8),y+l>window.innerWidth-8&&(y=window.innerWidth-l-8),g+v>window.innerHeight-8&&(g=i.top-v-6),t.style.left=`${Math.max(8,y)}px`,t.style.top=`${Math.max(8,g)}px`};a();const n=()=>a();window.addEventListener("scroll",n,!0),window.addEventListener("resize",n);const c=()=>{window.removeEventListener("scroll",n,!0),window.removeEventListener("resize",n),window.removeEventListener("keydown",s),document.removeEventListener("mousedown",o)},s=i=>{i.key==="Escape"&&(c(),K())},o=i=>{const l=i.target;t.contains(l)||e.contains(l)||(c(),K())};(r=t.querySelector("#resetCancelBtn"))==null||r.addEventListener("click",()=>{c(),K()}),(m=t.querySelector("#resetConfirmBtn"))==null||m.addEventListener("click",()=>{c(),K(),p=structuredClone(pt),O()}),window.addEventListener("keydown",s),window.setTimeout(()=>document.addEventListener("mousedown",o),0)}function Se(){const e=document.querySelector(".portfolio-table");e&&e.querySelectorAll("[data-col-resize]").forEach(t=>{t.addEventListener("pointerdown",a=>{a.preventDefault(),a.stopPropagation();const n=t.dataset.colResize;if(!n)return;const c=t.closest("th");if(!c)return;const s=At(Tt[n],n),o=a.clientX,r=c.getBoundingClientRect().width,m=a.pointerId;t.setPointerCapture(m),document.body.classList.add("col-resizing");const i=v=>{const y=Math.max(s,Math.round(r+(v.clientX-o)));c.style.width=`${y}px`,c.style.minWidth=`${s}px`},l=v=>{t.releasePointerCapture(m),t.removeEventListener("pointermove",i),t.removeEventListener("pointerup",l),t.removeEventListener("pointercancel",l),document.body.classList.remove("col-resizing");const y=Math.max(s,Math.round(c.getBoundingClientRect().width)),g=Wt();g[n]=y,ce(g),c.style.width=`${y}px`};t.addEventListener("pointermove",i),t.addEventListener("pointerup",l),t.addEventListener("pointercancel",l)})})}async function Pe(){const e="/vi_planer/",t=new URL("VI-Planer-requirements.md",new URL(e,window.location.href)).href;try{const a=await fetch(t);if(!a.ok)throw new Error(String(a.status));const n=await a.text(),c=new Blob([n],{type:"text/markdown;charset=utf-8"}),s=URL.createObjectURL(c),o=document.createElement("a");o.href=s,o.download="VI-Planer-requirements.md",o.click(),URL.revokeObjectURL(s)}catch(a){console.error(a),alert("Не удалось скачать файл требований")}}async function De(){const e=document.querySelector("#exportPdfBtn"),t=document.querySelector("#pdfCapture");if(!t){alert("Не удалось найти содержимое для экспорта");return}const a=(e==null?void 0:e.textContent)??"Экспорт PDF";e&&(e.disabled=!0,e.textContent="PDF…");const n=new Date().toISOString().slice(0,10),c=`VI Planer — ${yt[u.tab]} · ${n}`,s=`VI-Planer-${yt[u.tab]}-${n}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await ne(t,s,c)}catch(o){console.error(o),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),e&&(e.disabled=!1,e.textContent=a)}}async function xe(){p=await ee();const e=p.items.map(a=>a.manualRank).join(",");p={...p,items:V(p.items)};const t=p.items.map(a=>a.manualRank).join(",");e!==t&&gt(p),Xt(a=>{const n=document.querySelector("#syncStatus");n&&(n.dataset.status=a,n.textContent=qt(a))}),C()}xe()})();
