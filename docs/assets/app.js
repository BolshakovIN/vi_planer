(function(){"use strict";const Dt={S:{min:5,max:10},M:{min:10,max:20},L:{min:20,max:40}},Xt=["S","M","L"];function Z(e){const t=Dt[e];return Math.round((t.min+t.max)/2)}function Yt(e){const t=Dt[e];return`${e} (${t.min}–${t.max} дн.)`}function Lt(e){const t=String(e??"").toUpperCase();return t==="S"||t==="M"||t==="L"?t:"M"}function It(e,t=3){const n=e/Math.max(t,.5)*7;return n<=10?"S":n<=20?"M":"L"}function W(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function F(e){return e.assignments.reduce((t,n)=>t+Z(n.size),0)}function Gt(e,t){return e.assignments.some(n=>n.teamId===t)}function ct(e,t){const n=new Date(e+"T12:00:00");return n.setDate(n.getDate()+t),n.toISOString().slice(0,10)}function O(e,t){return ct(e,t*7)}function Qt(e){return e.reduce((t,n)=>n.endDate!==t.endDate?n.endDate>t.endDate?n:t:n.durationDays!==t.durationDays?n.durationDays>t.durationDays?n:t:n.durationWeeks>t.durationWeeks?n:t)}function $(e){const[t,n,a]=e.split("-");return`${a}.${n}.${t}`}function tt(e=new Date){const t=new Date(e),n=t.getDay(),a=n===0?-6:1-n;return t.setDate(t.getDate()+a),t.toISOString().slice(0,10)}function N(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?tt():tt(new Date(e.slice(0,10)+"T12:00:00"))}function xt(e,t){const n=new Date(N(e)+"T12:00:00").getTime(),a=new Date(N(t)+"T12:00:00").getTime();return Math.max(0,Math.round((a-n)/(168*3600*1e3)))}function X(e){return[...e].sort((t,n)=>{const a=t.manualRank,c=n.manualRank;if(a!=null&&c!=null&&a!==c)return a-c;if(a!=null&&c==null)return-1;if(a==null&&c!=null)return 1;const o=W(n)-W(t);return o!==0?o:F(t)-F(n)})}function et(e,t,n){return e.find(a=>a.id!==n&&a.manualRank!=null&&a.manualRank===t)}function lt(e,t,n){const a=X(e),c=a.findIndex(s=>s.id===t);if(c<0)return e;const o=[...a],[r]=o.splice(c,1),i=Math.max(0,Math.min(o.length,Math.round(n)-1));o.splice(i,0,r);const m=new Map(o.map((s,l)=>[s.id,l+1]));return e.map(s=>{const l=m.get(s.id);return l==null||s.manualRank===l?s:{...s,manualRank:l}})}function Zt(e,t){if(t.length<2)return e;const n=X(e),a=new Set(t),c=new Map(e.map(s=>[s.id,s])),o=t.map(s=>c.get(s)).filter(s=>!!s);let r=0;const i=[];for(const s of n)if(a.has(s.id)){const l=o[r++];l&&i.push(l)}else i.push(s);for(;r<o.length;)i.push(o[r++]);const m=new Map(i.map((s,l)=>[s.id,l+1]));return e.map(s=>{const l=m.get(s.id);return l==null||s.manualRank===l?s:{...s,manualRank:l}})}function Y(e){let t=0;for(const n of e)n.manualRank!=null&&n.manualRank>t&&(t=n.manualRank);return t+1}function V(e){const t=[...e].sort((r,i)=>{const m=W(i)-W(r);return m!==0?m:F(r)-F(i)}),n=new Set,a=new Map;for(const r of t){const i=r.manualRank;i!=null&&Number.isFinite(i)&&i>=1&&!n.has(i)&&(n.add(i),a.set(r.id,i))}let c=1;const o=()=>{for(;n.has(c);)c+=1;const r=c;return n.add(r),c+=1,r};return e.map(r=>{const i=a.get(r.id)??o();return r.manualRank===i?r:{...r,manualRank:i}})}function te(e,t){return e>=t?e:t}function Et(e){const t=e.items.filter(s=>s.status!=="done"),n=X(t),a=new Map;for(const s of e.teams)a.set(s.id,[]);for(const s of n)for(const l of s.assignments){const g=a.get(l.teamId)??[];g.push({item:s,size:l.size,workStartDate:N(l.workStartDate||e.startDate)}),a.set(l.teamId,g)}const c=[],o={},r=52;for(const s of e.teams){const l=a.get(s.id)??[],g=Array.from({length:r},(f,k)=>({week:k,weekStart:O(e.startDate,k),usedPw:0,capacityPw:s.capacityPw,items:[]}));let y=e.startDate;l.forEach((f,k)=>{const h=Z(f.size),w=f.workStartDate,x=te(y,w),R=ct(x,h),L=xt(e.startDate,x),z=xt(e.startDate,R),M=Math.round(h/7*100)/100;for(let D=L;D<=Math.min(z,r-1);D++){const P=g[D];P&&!P.items.includes(f.item.id)&&P.items.push(f.item.id)}c.push({item:f.item,teamId:s.id,size:f.size,wsjf:W(f.item),effectiveRank:k+1,plannedStartDate:w,startWeek:L,endWeek:z,startDate:x,endDate:R,waitWeeks:L,delayedByQueue:x>w,durationDays:h,durationWeeks:M}),y=R}),o[s.id]=g}const i=new Map;for(const s of c){const l=i.get(s.item.id)??[];l.push(s),i.set(s.item.id,l)}const m=[];for(const s of n){const l=i.get(s.id)??[];if(!l.length)continue;const g=Qt(l),y=l.reduce((f,k)=>k.startWeek<f.startWeek?k:f);m.push({item:s,slices:[...l].sort((f,k)=>f.endDate===k.endDate?k.durationDays-f.durationDays:f.endDate<k.endDate?1:-1),wsjf:W(s),totalEstimateDays:F(s),startWeek:y.startWeek,endWeek:g.endWeek,startDate:y.startDate,endDate:g.endDate,waitWeeks:y.waitWeeks,bottleneckTeamId:g.teamId})}return c.sort((s,l)=>s.startWeek!==l.startWeek?s.startWeek-l.startWeek:l.wsjf-s.wsjf),{slices:c,rollups:m,load:o}}function nt(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function dt(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const n=N(String(t.startDate??tt())),a=t.teams,c=new Map(a.map(r=>[r.id,r.capacityPw])),o=t.items.map(r=>{const i=r;let m=[];return Array.isArray(i.assignments)&&i.assignments.length?m=i.assignments.filter(s=>s&&typeof s.teamId=="string").map(s=>{const l=String(s.teamId),g=c.get(l)??3,y=s.size!=null?Lt(s.size):It(Number(s.estimatePw)||1,g);return{teamId:l,size:y,workStartDate:N(String(s.workStartDate||i.workStartDate||n))}}):typeof i.teamId=="string"&&(m=[{teamId:i.teamId,size:It(Number(i.estimatePw)||1,c.get(i.teamId)??3),workStartDate:n}]),!m.length&&a[0]&&(m=[{teamId:a[0].id,size:"M",workStartDate:n}]),{id:String(i.id??nt("item")),title:String(i.title??"Без названия"),type:i.type==="project"?"project":"product",backlog:String(i.backlog??"Backlog"),assignments:m,status:["idea","ready","in_progress","blocked","done"].includes(String(i.status))?i.status:"idea",owner:String(i.owner??"—"),businessValue:Number(i.businessValue)||5,timeCriticality:Number(i.timeCriticality)||5,riskReduction:Number(i.riskReduction)||5,jobSize:Number(i.jobSize)||5,notes:i.notes!=null?String(i.notes):void 0,manualRank:i.manualRank==null||i.manualRank===""?null:Number(i.manualRank)}});return{version:3,startDate:n,teams:a,items:V(o)}}const _=tt(),ut=O(_,1),at=O(_,2),Rt=O(_,3),mt=O(_,4),pt=O(_,6),Mt=O(_,8),jt={version:3,startDate:_,teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#d60000"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#455a64"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#737373"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#e65100"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"M",workStartDate:_}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",size:"S",workStartDate:ut}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"S",workStartDate:mt}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",size:"S",workStartDate:_}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",size:"S",workStartDate:pt}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",size:"M",workStartDate:_},{teamId:"data",size:"M",workStartDate:Rt}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",size:"M",workStartDate:ut},{teamId:"crm",size:"S",workStartDate:mt}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",size:"M",workStartDate:at},{teamId:"platform",size:"S",workStartDate:at}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",size:"M",workStartDate:ut},{teamId:"platform",size:"S",workStartDate:_}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",size:"M",workStartDate:_},{teamId:"platform",size:"S",workStartDate:at},{teamId:"mobile",size:"S",workStartDate:pt}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",size:"M",workStartDate:Rt},{teamId:"data",size:"S",workStartDate:mt},{teamId:"mobile",size:"S",workStartDate:Mt}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",size:"L",workStartDate:at},{teamId:"platform",size:"S",workStartDate:pt},{teamId:"mobile",size:"S",workStartDate:Mt}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},ft={...jt,items:V(jt.items)},qt="vi-planer-v3";let Pt="idle",st=[];function ee(){return null}function zt(){return Pt}function ne(e){return st.push(e),()=>{st=st.filter(t=>t!==e)}}function G(e){Pt=e,st.forEach(t=>t(e))}function ae(){try{const e=localStorage.getItem(qt)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=dt(JSON.parse(e));return t?{...t,items:V(t.items)}:null}catch{return null}}function Ct(e){localStorage.setItem(qt,JSON.stringify(e))}async function se(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),n=dt(t.state);return n?{...n,items:V(n.items)}:null}catch{return null}}async function ie(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function oe(){return null}async function re(e){return!1}async function ce(){G("loading");const e=await se()??await oe()??ae()??structuredClone(ft);return Ct(e),G((ee(),"saved")),e}let vt=null,gt=null;function _t(e){Ct(e),gt=e,vt&&clearTimeout(vt),vt=setTimeout(async()=>{const t=gt;if(gt=null,!t)return;G("loading");const n=await re(),a=n?!0:await ie(t);if(n||a){G("saved");return}G("offline")},350)}function Tt(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function Wt(e){const t=document.querySelector(`script[data-pdf-lib="${e}"]`);return t?t.dataset.loaded==="1"?Promise.resolve():new Promise((n,a)=>{t.addEventListener("load",()=>n()),t.addEventListener("error",()=>a(new Error(`Failed to load ${e}`)))}):new Promise((n,a)=>{const c=document.createElement("script");c.src=e,c.async=!0,c.dataset.pdfLib=e,c.onload=()=>{c.dataset.loaded="1",n()},c.onerror=()=>a(new Error(`Failed to load ${e}`)),document.head.appendChild(c)})}async function le(){var n,a;window.html2canvas||await Wt("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(n=window.jspdf)!=null&&n.jsPDF||await Wt("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const e=window.html2canvas,t=(a=window.jspdf)==null?void 0:a.jsPDF;if(!e||!t)throw new Error("PDF libraries failed to load");return{html2canvas:e,jsPDF:t}}async function de(e,t,n){const{html2canvas:a,jsPDF:c}=await le(),o=await a(e,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f4f4f4",logging:!1,windowWidth:Math.max(e.scrollWidth,e.clientWidth),windowHeight:Math.max(e.scrollHeight,e.clientHeight)}),r=o.toDataURL("image/png"),i=new c({orientation:"landscape",unit:"mm",format:"a4"}),m=i.internal.pageSize.getWidth(),s=i.internal.pageSize.getHeight(),l=8,g=8,y=m-l*2,f=s-l*2-g,k=y,h=o.height*k/o.width;let w=h,x=l+g,R=0;for(;w>0;){R>0&&i.addPage(),R===0&&(i.setFontSize(11),i.setTextColor(15,23,42),i.text(n,l,l+4)),i.addImage(r,"PNG",l,x,k,h);const L=R===0?f:s-l*2;if(w-=L,x-=L,R+=1,R>40)break}i.save(t)}const yt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды"},u={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let p=structuredClone(ft);function H(e){return p.teams.find(t=>t.id===e)}function bt(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function At(e){return new Map(e.map(t=>[t.item.id,t]))}function ue(e){return e.assignments.map(t=>t.size).join(" + ")}function me(e,t){return e.filter(n=>n.teamId===t).reduce((n,a)=>n+a.durationDays,0)}function pe(e){return Xt.map(t=>`<option value="${t}" ${e===t?"selected":""}>${Yt(t)}</option>`).join("")}function fe(e){return e.assignments.map(t=>{const n=H(t.teamId);return(n==null?void 0:n.name)??t.teamId}).join(", ")}function ve(e){return`<div class="teams-stack">${e.assignments.map(n=>{const a=H(n.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(a==null?void 0:a.color)??"#94a3b8"}"></span>${I((a==null?void 0:a.name)??n.teamId)} <span class="size-badge mono">${n.size}</span> <span class="mono muted-inline">старт ${$(n.workStartDate)}</span></span>`}).join("")}</div>`}function ge(e){const t=u.query.trim().toLowerCase(),n=At(e),a=p.items.filter(o=>u.typeFilter!=="all"&&o.type!==u.typeFilter||u.teamFilter!=="all"&&!Gt(o,u.teamFilter)||u.statusFilter!=="all"&&o.status!==u.statusFilter?!1:t?o.title.toLowerCase().includes(t)||o.backlog.toLowerCase().includes(t)||o.owner.toLowerCase().includes(t)||fe(o).toLowerCase().includes(t):!0);if(u.sortKey==="priority"){const o=X(a);return u.sortDir==="asc"?o:[...o].reverse()}const c=u.sortDir==="asc"?1:-1;return[...a].sort((o,r)=>{var m,s;let i=0;if(u.sortKey==="wsjf")i=W(o)-W(r);else if(u.sortKey==="estimate")i=F(o)-F(r);else{const l=((m=n.get(o.id))==null?void 0:m.endDate)??"9999-99-99",g=((s=n.get(r.id))==null?void 0:s.endDate)??"9999-99-99";i=l<g?-1:l>g?1:0}return i!==0?i*c:o.title.localeCompare(r.title,"ru")})}const Ft="vi-planer-col-widths",Bt={priority:"Приоритет",type:"Тип",title:"Инициатива / исходный бэклог",teams:"Команды (майка · старт)",status:"Статус",wsjf:"WSJF",estimate:"Оценка, майки",eta:"ETA"},ye={priority:96,type:88,title:260,teams:220,status:130,wsjf:72,estimate:120,eta:140};function Ot(){try{const e=localStorage.getItem(Ft);return e?JSON.parse(e):{}}catch{return{}}}function be(e){localStorage.setItem(Ft,JSON.stringify(e))}const kt={};function Nt(e,t){if(t&&kt[t]!=null)return kt[t];const n=document.createElement("span");n.textContent=e,n.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:IBM Plex Sans,system-ui,sans-serif;padding:0;",document.body.appendChild(n);const a=Math.ceil(n.getBoundingClientRect().width);n.remove();const c=Math.max(56,a+36);return t&&(kt[t]=c),c}function ke(e){const t=Ot()[e],n=Nt(Bt[e],e);return`width:${Math.max(n,t??ye[e])}px;min-width:${n}px`}function Q(e,t,n="",a){const c=a!=null&&u.sortKey===a,o=!c||!a?"":u.sortDir==="asc"?" ↑":" ↓",r=a?`sortable ${c?"sorted":""}`:"",i=a?` data-sort="${a}"`:"";return`<th class="resizable-th ${r} ${n}" data-col="${t}"${i}${a?' title="Сортировать"':""} style="${ke(t)}"><span class="th-label">${e}${o}</span><span class="col-resize" data-col-resize="${t}" title="Изменить ширину"></span></th>`}function it(e,t){const a={priority:"priority",wsjf:"wsjf",estimate:"estimate",eta:"eta"}[t];if(!a){const c=u.sortKey===t,o=c?u.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${c?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${o}</th>`}return Q(e,a,"",t)}function he(e){u.sortKey===e?u.sortDir=u.sortDir==="asc"?"desc":"asc":(u.sortKey=e,u.sortDir=e==="wsjf"?"desc":"asc"),C()}function we(e,t){const n=p.items.filter(s=>s.status!=="done"),a=n.filter(s=>s.type==="product").length,c=n.filter(s=>s.type==="project").length,o=n.filter(s=>s.assignments.length>1).length,r=e.map(s=>s.endWeek),i=r.length?Math.max(...r)+1:0,m=p.teams.filter(s=>me(t,s.id)>56).length;return`
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${n.length}</div>
        <div class="hint">${a} продуктов · ${c} проектов · ${o} кросс-командных</div>
      </div>
      <div class="metric">
        <div class="label">Горизонт портфеля</div>
        <div class="value">${i} нед.</div>
        <div class="hint">до закрытия (по bottleneck-команде)</div>
      </div>
      <div class="metric">
        <div class="label">Команд под риском</div>
        <div class="value">${m}</div>
        <div class="hint">очередь длиннее 8 недель</div>
      </div>
      <div class="metric">
        <div class="label">Старт планирования</div>
        <div class="value" style="font-size:18px">${$(p.startDate)}</div>
        <div class="hint">понедельник текущей недели</div>
      </div>
    </div>
  `}function $e(){return`
    <details class="callout callout-cols agenda">
      <summary class="agenda-summary">Адженда</summary>
      <div class="cols-help">
        <div><span class="cols-help-k">Приоритет</span> — сквозной ранг (1 = выше); тяните строку за ⋮⋮, чтобы переставить. Сортировка других колонок приоритет не меняет</div>
        <div><span class="cols-help-k">Тип</span> — проект или продукт</div>
        <div><span class="cols-help-k">Инициатива</span> — название, исходный бэклог и владелец</div>
        <div><span class="cols-help-k">Команды</span> — кто делает, майка (S/M/L) и план старта</div>
        <div><span class="cols-help-k">Статус</span> — стадия готовности</div>
        <div><span class="cols-help-k">WSJF</span> — (BV + TC + RR) / Job Size</div>
        <div><span class="cols-help-k">Оценка</span> — майки S (5–10 дн.), M (10–20 дн.), L (20–40 дн.) по командам</div>
        <div><span class="cols-help-k">ETA</span> — дата готовности (когда закончила последняя команда)</div>
      </div>
    </details>
  `}function Se(e,t){const n=At(e),a=ge(e),c=u.sortKey==="priority",o=a.map(r=>{const i=n.get(r.id),m=W(r),s=F(r),l=r.manualRank??"—",g=i?`<div class="eta-teams">${i.slices.map(y=>{const f=H(y.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(f==null?void 0:f.color)??"#64748b"}">${I((f==null?void 0:f.name)??y.teamId)}</span>: ${$(y.startDate)}→${$(y.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${c?"row-draggable":""}" data-edit="${r.id}" data-row-id="${r.id}">
          <td class="prio-cell">
            <div class="prio-edit" data-stop-edit>
              ${c?'<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>':""}
              <input
                class="prio-input"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-prio-id="${r.id}"
                value="${l}"
                title="Приоритет (1 = выше)"
                aria-label="Приоритет"
              />
            </div>
          </td>
          <td>
            <span class="badge badge-${r.type}">${r.type==="product"?"Продукт":"Проект"}</span>
            ${r.assignments.length>1?`<div class="meta" style="margin-top:4px">${r.assignments.length} команды</div>`:""}
          </td>
          <td class="title-cell">
            <div class="name">${I(r.title)}</div>
            <div class="meta">${I(r.backlog)} · ${I(r.owner)}</div>
          </td>
          <td>${ve(r)}</td>
          <td><span class="badge badge-status-${r.status}">${bt(r.status)}</span></td>
          <td class="mono metric-num">${m}</td>
          <td class="mono metric-num">
            <span class="size-badge">${ue(r)}</span>
            <div class="meta">~${s} дн.</div>
          </td>
          <td class="mono ${i&&i.waitWeeks>4?"eta-late":"eta-good"}">
            ${i?`<span class="eta-final">${$(i.endDate)}</span>`:"—"}
            ${g}
          </td>
        </tr>
      `}).join("");return`
    ${$e()}
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
            ${p.teams.map(r=>`<option value="${r.id}" ${u.teamFilter===r.id?"selected":""}>${I(r.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(r=>`<option value="${r}" ${u.statusFilter===r?"selected":""}>${bt(r)}</option>`).join("")}
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
              ${it("Приоритет","priority")}
              ${Q("Тип","type")}
              ${Q("Инициатива / исходный бэклог","title")}
              ${Q("Команды (оценка · старт)","teams")}
              ${Q("Статус","status")}
              ${it("WSJF","wsjf")}
              ${it("Оценка, майки","estimate")}
              ${it("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${o||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function De(e){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${p.teams.map(n=>{const a=e.filter(i=>i.teamId===n.id).sort((i,m)=>i.effectiveRank-m.effectiveRank),c=a.reduce((i,m)=>i+m.durationDays,0),o=Math.round(c/7*10)/10,r=Math.min(100,Math.round(c/56*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${n.color}"></span>${I(n.name)}</h3>
              <div class="meta">${a.length} задач · ~${c} дн. · ~${o} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${r}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,r)}%;background:${n.color}"></span></div>
          ${a.map(i=>{const m=i.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${i.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${i.item.type}">${i.item.type==="product"?"П":"Пр"}</span> ${I(i.item.title)}</div>
                <div class="meta">WSJF ${i.wsjf} · ${i.size} (${i.durationDays} дн.) · план ${$(i.plannedStartDate)}${i.delayedByQueue?" → сдвиг":""}${m>0?` · ещё ${m} ком.`:""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${$(i.startDate)} →<br/>${$(i.endDate)}
              </div>
            </div>
          `}).join("")||'<div class="empty">Очередь пуста</div>'}
        </div>
      `}).join("")}
    </div>
  `}function Le(e){const t=p.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда команда освобождается с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${p.teams.map(a=>{const c=e.filter(s=>s.teamId===a.id).sort((s,l)=>{const g=s.item.manualRank??9999,y=l.item.manualRank??9999;return g!==y?g-y:s.effectiveRank-l.effectiveRank}),o=c.reduce((s,l)=>s+l.durationDays,0),r=Math.round(o/7*10)/10,i=c.length?c[c.length-1].endDate:t,m=c.map((s,l)=>{const g=s.item.manualRank??"—",y=l>0?c[l-1]:null;let f="может взять сразу (очередь свободна)",k="take-now";s.startDate>s.plannedStartDate?(f=y?`ждёт очередь: после #${y.item.manualRank??"?"} «${y.item.title}»`:"сдвиг из‑за загрузки очереди",k="take-queue"):s.startDate>t&&(f=`ждёт плановый старт ${$(s.plannedStartDate)}`,k="take-plan");const h=s.item.assignments.filter(w=>w.teamId!==a.id).map(w=>{var x;return((x=H(w.teamId))==null?void 0:x.name)??w.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${g}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${s.item.type}">${s.item.type==="product"?"П":"Пр"}</span>
                  ${I(s.item.title)}
                </div>
                <div class="take-line ${k}">
                  <strong>Может взять с ${$(s.startDate)}</strong>
                  <span class="meta"> · ${I(f)}</span>
                </div>
                <div class="meta">
                  ${s.size} (${s.durationDays} дн.) · план ${$(s.plannedStartDate)} · до ${$(s.endDate)}
                  ${h.length?` · ещё: ${h.map(I).join(", ")}`:""}
                </div>
                <div class="take-bar" title="Окно работы в горизонте 12 нед.">
                  <span class="take-bar-fill" style="left:${s.startWeek/12*100}%;width:${Math.max(3,(s.endWeek-s.startWeek+1)/12*100)}%;background:${a.color}"></span>
                </div>
              </div>
              <div class="mono queue-item-dates">
                <div class="meta">старт</div>
                <div>${$(s.startDate)}</div>
                <div class="meta" style="margin-top:6px">конец</div>
                <div>${$(s.endDate)}</div>
              </div>
            </div>
          `}).join("")||`<div class="empty">Очередь пуста — команда свободна с ${$(t)}</div>`;return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${I(a.name)}</h3>
              <div class="meta">${c.length} задач · ~${o} дн. · ~${r} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${$(i)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          ${m}
        </div>
      `}).join("")}
    </div>
  `}function Ie(e,t){const n=Math.max(4,...e.map(h=>h.endWeek+2),4),a=Math.max(4,Math.min(52,Math.round(u.ganttWeeks)||16));u.ganttWeeks=a;const c=X(p.items.filter(h=>h.status!=="done")),o=new Map(c.map((h,w)=>[h.id,w])),r=100/a,i=`repeating-linear-gradient(90deg, #f5f5f5 0, #f5f5f5 calc(${r}% - 1px), #e0e0e0 calc(${r}% - 1px), #e0e0e0 ${r}%)`,m=[],s=[];p.teams.forEach((h,w)=>{const x=t.filter(L=>L.teamId===h.id).sort((L,z)=>L.effectiveRank-z.effectiveRank);if(x.length<2)return;const R=`arrow-${h.id}`;s.push(`
      <marker id="${R}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${h.color}" fill-opacity="0.85" />
      </marker>
    `);for(let L=1;L<x.length;L++){const z=x[L-1],M=x[L],D=(o.get(z.item.id)??0)+.5,P=(o.get(M.item.id)??0)+.5,A=Math.min(a-.05,z.endWeek+.92),T=Math.min(a-.05,Math.max(.08,M.startWeek+.02)),d=T-A,v=(w%4-1.5)*.08,b=Math.max(.35,Math.abs(d)*.45)+Math.abs(v),j=A+(d>=0?b:-b*.35)+v,S=T-(d>=0?b:-b*.35)+v,E=Math.abs(D-P)<.02?`M ${A} ${D} H ${T}`:`M ${A} ${D} C ${j} ${D}, ${S} ${P}, ${T} ${P}`;m.push(`<path d="${E}" fill="none" stroke="${h.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${R})" />`)}});const l=[],g=[];for(const h of c){const w=e.find(M=>M.item.id===h.id);if(!w)continue;const x=w.slices.map(M=>{const D=t.filter(d=>d.teamId===M.teamId).sort((d,v)=>d.effectiveRank-v.effectiveRank),P=D.findIndex(d=>d.item.id===h.id);if(P<=0)return null;const A=D[P-1],T=H(M.teamId);return`#${A.item.manualRank} (${(T==null?void 0:T.name)??M.teamId})`}).filter(Boolean),R=[...new Set(x)],L=R.length?`<div class="meta gantt-dep-meta">после ${R.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',z=w.slices.map(M=>{const D=H(M.teamId),P=M.startWeek/a*100,A=Math.max(1,M.endWeek-M.startWeek+1)/a*100;return`<div class="gantt-bar ${M.teamId===w.bottleneckTeamId?"gantt-bot":""}" style="left:${P}%;width:${Math.max(A,2.5)}%;background:${(D==null?void 0:D.color)??"#64748b"}" title="${U((D==null?void 0:D.name)??"")}: ${$(M.endDate)}">${I((D==null?void 0:D.name)??"")}</div>`}).join("");l.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${h.manualRank??"—"}</span> ${I(h.title)}</div>
        <div class="meta">${h.type==="product"?"Продукт":"Проект"} · ETA ${$(w.endDate)}</div>
        ${L}
      </div>
    `),g.push(`<div class="gantt-track gantt-track-multi" style="background:${i}">${z}</div>`)}const y=Math.max(1,c.length),f=a<=12?1:a<=24?2:a<=36?3:4,k=Array.from({length:a},(h,w)=>{if(!(w%f===0||w===a-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${r}%"></div>`;const R=O(p.startDate,w),[,L,z]=R.split("-");return`<div class="gantt-axis-tick" style="width:${r}%">
      <span class="gantt-axis-w">Н${w+1}</span>
      <span class="gantt-axis-d">${z}.${L}</span>
    </div>`}).join("");return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сроки и зависимости по приоритету</h2>
        <div class="gantt-weeks-ctrl">
          <label for="ganttWeeks">Горизонт</label>
          <input id="ganttWeeks" type="range" min="4" max="52" step="1" value="${a}" />
          <span class="mono" id="ganttWeeksLabel">${a} нед.</span>
          ${n>a?`<span class="meta">часть работ за горизонтом (нужно ~${n})</span>`:""}
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
            <div class="gantt-axis">${k}</div>
            <div class="gantt-tracks-col">
              <svg class="gantt-dep-layer" viewBox="0 0 ${a} ${y}" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  ${s.join("")}
                </defs>
                ${m.join("")}
              </svg>
              ${g.join("")}
            </div>
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.</p>
    </div>
  `}const ht=["#d60000","#455a64","#737373","#c62828","#e65100","#1a1a1a","#8d6e63","#546e7a","#b71c1c","#f57c00"];function wt(){const e=new Set(p.teams.map(t=>t.color));return ht.find(t=>!e.has(t))??ht[p.teams.length%ht.length]}function xe(){return`
    <div class="callout">
      Управляйте командами: название и цвет. Оценки задаются майками S / M / L (5–10 / 10–20 / 20–40 календарных дней).
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
      </div>
    `).join("")||'<div class="empty">Нет команд — создайте первую</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar" hidden>
        <span class="team-dot" id="newTeamDot" style="background:${wt()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">Создать</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function Ee(e){var s;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((s=p.teams[0])==null?void 0:s.id)??"",size:"M",workStartDate:p.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:Y(p.items)},n=W(t),a=new Set(t.assignments.map(l=>l.teamId)),c=new Map(t.assignments.map(l=>[l.teamId,l.size])),o=new Map(t.assignments.map(l=>[l.teamId,l.workStartDate])),r=Ht(t),i=r?Ut(r,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',m=p.teams.map(l=>{const g=a.has(l.id),y=c.get(l.id)??"M",f=o.get(l.id)??p.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${l.id}" ${g?"checked":""} />
            <span class="team-dot" style="background:${l.color}"></span>
            <span class="team-assign-name">${I(l.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Майка</span>
            <select class="f_team_size" data-team="${l.id}" ${g?"":"disabled"}>${pe(y)}</select>
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${l.id}" value="${f}" ${g?"":"disabled"} />
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
            <label>Команды: майка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${m}</div>
            <div class="meta" style="margin-top:6px">S — 5–10 дн., M — 10–20 дн., L — 20–40 дн. Итого ~<strong class="mono" id="liveTotalEst">${F(t)}</strong> дн. Старт — не раньше указанной даты; если очередь занята, сдвинется позже.</div>
          </div>
          <div class="callout" style="margin:0" id="liveEtaBox">
            <strong>Пересчёт ETA</strong> (с учётом очереди и стартов)
            <div id="liveEta" style="margin-top:8px;font-size:13px;color:var(--ink)">${i}</div>
          </div>
          <div class="score-grid">
            <div class="score-box"><div class="k">Business Value</div><div class="v"><input id="f_bv" type="number" min="1" max="10" value="${t.businessValue}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Time Criticality</div><div class="v"><input id="f_tc" type="number" min="1" max="10" value="${t.timeCriticality}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Risk / Opportunity</div><div class="v"><input id="f_rr" type="number" min="1" max="10" value="${t.riskReduction}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Job Size</div><div class="v"><input id="f_js" type="number" min="1" max="10" value="${t.jobSize}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
          </div>
          <div class="callout" style="margin:0">WSJF = (BV + TC + RR) / Job Size → <strong class="mono" id="liveWsjf">${n}</strong></div>
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
  `}function Ht(e){const t=e.assignments.length?e.assignments:St();if(!t.length)return null;const n=e.id||"__draft__",a={...e,id:n,assignments:t},c=p.items.some(r=>r.id===n)?p.items.map(r=>r.id===n?a:r):[...p.items,a],{rollups:o}=Et({...p,items:c});return o.find(r=>r.item.id===n)??null}function Vt(e){const t=Z(e.size),n=N(e.workStartDate||p.startDate),a=ct(n,t);return{start:n,end:a,days:t}}function Ut(e,t){const n=new Map(t.map(o=>[o.teamId,o])),a=e.slices.map(o=>{const r=H(o.teamId),i=n.get(o.teamId),m=i?N(i.workStartDate):o.plannedStartDate,s=i?Vt(i):null,l=o.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",g=o.startDate>m?` <span class="meta">(план ${$(m)}, очередь сдвинула на ${$(o.startDate)})</span>`:o.startDate<m?` <span class="meta">(ждём план ${$(m)})</span>`:"",y=s?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(s.start)} → <span class="mono">${$(s.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${I((r==null?void 0:r.name)??o.teamId)}</strong>: <span class="mono">${$(o.startDate)} → ${$(o.endDate)}</span> <span class="meta">(${o.size} · ~${o.durationDays} дн.)</span>${g}${l}${y}</div>`}).join(""),c=t.map(o=>Vt(o).end).reduce((o,r)=>o>r?o:r,"0000-00-00");return a+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(c)}</strong> — меняется сразу при смене даты</div>`}function I(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function U(e){return I(e).replaceAll("'","&#39;")}function J(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),(e=document.querySelector("#prioPop"))==null||e.remove()}function Re(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-prio-no>Нет</button>
      <button type="button" class="btn btn-primary" data-prio-yes>Да</button>
    </div>
  `}function $t(e,t,n,a){var g,y;J(),e.classList.add("prio-ask");const c=document.createElement("div");c.id="prioPop",c.className="prio-confirm prio-confirm-float",c.setAttribute("data-stop-edit",""),c.innerHTML=Re(t),document.body.appendChild(c);const o=()=>{const f=e.getBoundingClientRect(),k=c.getBoundingClientRect();let h=f.right+8,w=f.top+f.height/2-k.height/2;h+k.width>window.innerWidth-8&&(h=Math.max(8,f.left-k.width-8)),w=Math.max(8,Math.min(w,window.innerHeight-k.height-8)),c.style.left=`${h}px`,c.style.top=`${w}px`};o();const r=()=>o();window.addEventListener("scroll",r,!0),window.addEventListener("resize",r);const i=()=>{window.removeEventListener("scroll",r,!0),window.removeEventListener("resize",r),document.removeEventListener("mousedown",l,!0)},m=()=>{i(),J(),a()},s=()=>{i(),J(),n()},l=f=>{const k=f.target;c.contains(k)||e.contains(k)||m()};document.addEventListener("mousedown",l,!0),(g=c.querySelector("[data-prio-yes]"))==null||g.addEventListener("click",f=>{f.stopPropagation(),s()}),(y=c.querySelector("[data-prio-no]"))==null||y.addEventListener("click",f=>{f.stopPropagation(),m()})}function Me(){if(u.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,n=null;const a=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(o=>o.classList.remove("is-dragging","drag-over"))},c=(o,r)=>{if(o===r)return;const i=Array.from(e.querySelectorAll("tr[data-row-id]")).map(y=>y.dataset.rowId),m=i.indexOf(o),s=i.indexOf(r);if(m<0||s<0)return;const l=[...i];l.splice(m,1),l.splice(s,0,o);const g=u.sortDir==="asc"?l:[...l].reverse();p.items=Zt(p.items,g),u.sortKey="priority",B()};e.querySelectorAll("[data-drag-handle]").forEach(o=>{const r=o.closest("tr[data-row-id]");if(!r)return;o.addEventListener("pointerdown",m=>{m.button===0&&(m.preventDefault(),m.stopPropagation(),t=r.dataset.rowId??null,n=m.pointerId,o.setPointerCapture(m.pointerId),a(),r.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),o.addEventListener("pointermove",m=>{if(t==null||m.pointerId!==n)return;const s=document.elementFromPoint(m.clientX,m.clientY),l=s==null?void 0:s.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(g=>g.classList.remove("drag-over")),l&&l.dataset.rowId!==t&&l.classList.add("drag-over")});const i=m=>{if(t==null||m.pointerId!==n)return;const s=t,l=document.elementFromPoint(m.clientX,m.clientY),g=l==null?void 0:l.closest("tr[data-row-id]"),y=g==null?void 0:g.dataset.rowId;try{o.releasePointerCapture(m.pointerId)}catch{}a(),document.body.classList.remove("prio-dragging"),t=null,n=null,y&&c(s,y)};o.addEventListener("pointerup",i),o.addEventListener("pointercancel",i)})}function C(){J(),K();const{slices:e,rollups:t}=Et(p),n=document.querySelector("#app");if(!n)return;const a=u.editingId!=null?p.items.find(c=>c.id===u.editingId)??null:null;n.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${zt()}">${Tt(zt())}</span>
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
      ${we(t,e)}
      <div class="tabs no-print">
        <button class="tab ${u.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${u.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${u.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${u.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${u.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${u.tab==="portfolio"?Se(t):u.tab==="teams"?De(e):u.tab==="queuesTest"?Le(e):u.tab==="timeline"?Ie(t,e):xe()}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${u.creating||a?Ee(a):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,je()}function St(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const n of e){if(!n.checked)continue;const a=n.dataset.team,c=document.querySelector(`.f_team_size[data-team="${a}"]`),o=document.querySelector(`.f_team_start[data-team="${a}"]`),r=Lt(c==null?void 0:c.value),i=N((o==null?void 0:o.value)||p.startDate);t.push({teamId:a,size:r,workStartDate:i})}return t}function Jt(){var r,i,m,s,l,g,y;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),n=St();if(e&&(e.textContent=String(n.reduce((f,k)=>f+Z(k.size),0)||0)),!t)return;if(!n.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const a=(u.editingId?p.items.find(f=>f.id===u.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:n,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},c={...a,id:u.editingId||"__draft__",assignments:n,title:((r=document.querySelector("#f_title"))==null?void 0:r.value.trim())||a.title,type:((i=document.querySelector("#f_type"))==null?void 0:i.value)||a.type,status:((m=document.querySelector("#f_status"))==null?void 0:m.value)||a.status,businessValue:Number((s=document.querySelector("#f_bv"))==null?void 0:s.value)||a.businessValue,timeCriticality:Number((l=document.querySelector("#f_tc"))==null?void 0:l.value)||a.timeCriticality,riskReduction:Number((g=document.querySelector("#f_rr"))==null?void 0:g.value)||a.riskReduction,jobSize:Number((y=document.querySelector("#f_js"))==null?void 0:y.value)||a.jobSize,manualRank:(()=>{var h;const f=(h=document.querySelector("#f_rank"))==null?void 0:h.value,k=Math.round(Number(f));return Number.isFinite(k)&&k>=1?k:a.manualRank??Y(p.items)})()},o=Ht(c);if(!o){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=Ut(o,n)}function Kt(){const e=(o,r)=>{const i=document.querySelector(`#${o}`),m=Number(i==null?void 0:i.value);return Number.isFinite(m)?m:r},t=o=>{var r;return((r=document.querySelector(`#${o}`))==null?void 0:r.value)??""},n=St();if(!n.length)return alert("Выберите хотя бы одну команду"),null;const a=t("f_rank").trim(),c=Math.max(1,Math.round(Number(a)||Y(p.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:n,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:ot(e("f_bv",5),1,10),timeCriticality:ot(e("f_tc",5),1,10),riskReduction:ot(e("f_rr",5),1,10),jobSize:ot(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:c}}function ot(e,t,n){return Math.min(n,Math.max(t,e))}function B(){_t(p),C()}function je(){var s,l,g,y,f,k,h,w,x,R,L,z,M,D,P,A,T;document.querySelectorAll("[data-tab]").forEach(d=>{d.addEventListener("click",()=>{u.tab=d.dataset.tab,C()})});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{u.query=e.value}),e==null||e.addEventListener("change",()=>C());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{u.typeFilter=t.value,C()});const n=document.querySelector("#teamFilter");n==null||n.addEventListener("change",()=>{u.teamFilter=n.value,C()});const a=document.querySelector("#statusFilter");a==null||a.addEventListener("change",()=>{u.statusFilter=a.value,C()}),(s=document.querySelector("#addItem"))==null||s.addEventListener("click",()=>{u.creating=!0,u.editingId=null,C()}),(l=document.querySelector("#resetFilters"))==null||l.addEventListener("click",()=>{u.typeFilter="all",u.teamFilter="all",u.statusFilter="all",u.query="",u.sortKey="priority",u.sortDir="asc",C()}),document.querySelectorAll("[data-edit]").forEach(d=>{d.addEventListener("click",v=>{v.target.closest("[data-stop-edit], .prio-input, .prio-edit, #prioPop, .drag-handle")||(u.editingId=d.dataset.edit??null,u.creating=!1,C())})}),Me(),document.querySelectorAll(".prio-input").forEach(d=>{const v=d.dataset.prioId,b=()=>{const S=p.items.find(E=>E.id===v);d.value=String((S==null?void 0:S.manualRank)??1)},j=()=>{const S=p.items.find(We=>We.id===v);if(!S)return;const E=Number(d.value);if(!Number.isFinite(E)||E<1){b();return}const q=Math.round(E);if(d.value=String(q),q===S.manualRank)return;const rt=et(p.items,q,v),Te=rt?`Сменить на <span class="accent">${q}</span>?<br/>«${I(rt.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${q}</span>?`;$t(d,Te,()=>{p.items=lt(p.items,v,q),B()},b)};d.addEventListener("click",S=>S.stopPropagation()),d.addEventListener("mousedown",S=>S.stopPropagation()),d.addEventListener("keydown",S=>{S.key==="Enter"&&(S.preventDefault(),j()),S.key==="Escape"&&(J(),b(),d.blur())}),d.addEventListener("change",j)}),document.querySelectorAll("[data-sort]").forEach(d=>{d.addEventListener("click",v=>{if(v.target.closest("[data-col-resize]"))return;v.stopPropagation();const b=d.dataset.sort;(b==="wsjf"||b==="estimate"||b==="eta"||b==="priority")&&he(b)})}),Pe();const c=()=>{u.creating=!1,u.editingId=null,C()};(g=document.querySelector("#closeModal"))==null||g.addEventListener("click",c),(y=document.querySelector("#closeModal2"))==null||y.addEventListener("click",c),(f=document.querySelector("#modal"))==null||f.addEventListener("click",d=>{d.target.id==="modal"&&c()}),document.querySelectorAll(".f_team_check").forEach(d=>{d.addEventListener("change",()=>{const v=d.dataset.team,b=document.querySelector(`.f_team_size[data-team="${v}"]`),j=document.querySelector(`.f_team_start[data-team="${v}"]`);b&&(b.disabled=!d.checked),j&&(j.disabled=!d.checked),Jt()})});const o=document.querySelector("#teamAssignList"),r=d=>{const v=d.target;v&&(v.classList.contains("f_team_size")||v.classList.contains("f_team_start")||v.classList.contains("f_team_check"))&&Jt()};o==null||o.addEventListener("input",r),o==null||o.addEventListener("change",r),o==null||o.addEventListener("keyup",r),(k=document.querySelector("#saveItem"))==null||k.addEventListener("click",()=>{const d=Kt();if(!d)return;const v=d.manualRank??Y(p.items),b=document.querySelector("#f_rank"),j=()=>{if(et(p.items,v,null)){const q=nt("item");p.items=[...p.items,{...d,id:q,manualRank:p.items.length+1}],p.items=lt(p.items,q,v)}else p.items.push({...d,id:nt("item"),manualRank:v}),p.items=V(p.items);u.creating=!1,u.editingId=null,B()},S=()=>{if(!u.editingId)return;const E=p.items.findIndex(rt=>rt.id===u.editingId);if(E<0)return;const q=p.items[E];v!==q.manualRank?(p.items[E]={...q,...d,manualRank:q.manualRank},p.items=lt(p.items,u.editingId,v)):p.items[E]={...q,...d},u.creating=!1,u.editingId=null,B()};if(u.creating){const E=et(p.items,v,null);if(E&&b){$t(b,`Занять <span class="accent">${v}</span>?<br/>«${I(E.title)}» сдвинется вверх.`,j,()=>{});return}j();return}if(u.editingId){const E=p.items.find(q=>q.id===u.editingId);if(E&&v!==E.manualRank&&b){const q=et(p.items,v,u.editingId);$t(b,q?`Сменить на <span class="accent">${v}</span>?<br/>«${I(q.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${v}</span>?`,S,()=>{});return}S()}}),(h=document.querySelector("#deleteItem"))==null||h.addEventListener("click",()=>{u.editingId&&(p.items=p.items.filter(d=>d.id!==u.editingId),u.editingId=null,B())}),["f_bv","f_tc","f_rr","f_js"].forEach(d=>{var v;(v=document.querySelector(`#${d}`))==null||v.addEventListener("input",()=>{const b=document.querySelector("#liveWsjf");if(!b)return;const j=Kt();j&&(b.textContent=String(W({...j})))})});const i=document.querySelector("#ganttWeeks");i==null||i.addEventListener("input",()=>{const d=Math.max(4,Math.min(52,Number(i.value)||16));u.ganttWeeks=d;const v=document.querySelector("#ganttWeeksLabel");v&&(v.textContent=`${d} нед.`)}),i==null||i.addEventListener("change",()=>{u.ganttWeeks=Math.max(4,Math.min(52,Number(i.value)||16)),C()}),document.querySelectorAll("[data-team-name]").forEach(d=>{const v=()=>{const b=d.dataset.teamName,j=p.teams.find(E=>E.id===b);if(!j)return;const S=d.value.trim()||j.name;d.value=S,S!==j.name&&(j.name=S,B())};d.addEventListener("change",v),d.addEventListener("keydown",b=>{b.key==="Enter"&&(b.preventDefault(),d.blur())})}),(w=document.querySelector("#addTeam"))==null||w.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),v=document.querySelector("#newTeamName"),b=document.querySelector("#newTeamDot");d&&(d.hidden=!1),b&&(b.style.background=wt()),v==null||v.focus()}),(x=document.querySelector("#cancelNewTeam"))==null||x.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),v=document.querySelector("#newTeamName");d&&(d.hidden=!0),v&&(v.value="")});const m=()=>{const d=document.querySelector("#newTeamName"),v=(d==null?void 0:d.value.trim())||"";if(!v){d==null||d.focus();return}p.teams.push({id:nt("team"),name:v,capacityPw:3,color:wt()}),B()};(R=document.querySelector("#saveNewTeam"))==null||R.addEventListener("click",m),(L=document.querySelector("#newTeamName"))==null||L.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),m())}),(z=document.querySelector("#exportPdfBtn"))==null||z.addEventListener("click",()=>{Ce()}),(M=document.querySelector("#downloadReqsBtn"))==null||M.addEventListener("click",()=>{ze()}),(D=document.querySelector("#exportBtn"))==null||D.addEventListener("click",()=>{const d=new Blob([JSON.stringify(p,null,2)],{type:"application/json"}),v=URL.createObjectURL(d),b=document.createElement("a");b.href=v,b.download=`vi-planer-${p.startDate}.json`,b.click(),URL.revokeObjectURL(v)}),(P=document.querySelector("#importBtn"))==null||P.addEventListener("click",()=>{var d;(d=document.querySelector("#fileInput"))==null||d.click()}),(A=document.querySelector("#fileInput"))==null||A.addEventListener("change",async d=>{var b;const v=(b=d.target.files)==null?void 0:b[0];if(v)try{const j=await v.text(),S=dt(JSON.parse(j));if(!S){alert("Неверный формат файла");return}p=S,B()}catch{alert("Не удалось прочитать JSON")}}),(T=document.querySelector("#resetBtn"))==null||T.addEventListener("click",d=>{d.stopPropagation(),qe(d.currentTarget)})}function K(){var e,t;(e=document.querySelector("#resetPop"))==null||e.remove(),(t=document.querySelector("#resetBtn"))==null||t.classList.remove("reset-ask")}function qe(e){var i,m;K(),J(),e.classList.add("reset-ask");const t=document.createElement("div");t.id="resetPop",t.className="reset-confirm",t.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(t);const n=()=>{const s=e.getBoundingClientRect(),l=t.offsetWidth,g=t.offsetHeight;let y=s.right-l,f=s.bottom+6;y<8&&(y=8),y+l>window.innerWidth-8&&(y=window.innerWidth-l-8),f+g>window.innerHeight-8&&(f=s.top-g-6),t.style.left=`${Math.max(8,y)}px`,t.style.top=`${Math.max(8,f)}px`};n();const a=()=>n();window.addEventListener("scroll",a,!0),window.addEventListener("resize",a);const c=()=>{window.removeEventListener("scroll",a,!0),window.removeEventListener("resize",a),window.removeEventListener("keydown",o),document.removeEventListener("mousedown",r)},o=s=>{s.key==="Escape"&&(c(),K())},r=s=>{const l=s.target;t.contains(l)||e.contains(l)||(c(),K())};(i=t.querySelector("#resetCancelBtn"))==null||i.addEventListener("click",()=>{c(),K()}),(m=t.querySelector("#resetConfirmBtn"))==null||m.addEventListener("click",()=>{c(),K(),p=structuredClone(ft),B()}),window.addEventListener("keydown",o),window.setTimeout(()=>document.addEventListener("mousedown",r),0)}function Pe(){const e=document.querySelector(".portfolio-table");e&&e.querySelectorAll("[data-col-resize]").forEach(t=>{t.addEventListener("pointerdown",n=>{n.preventDefault(),n.stopPropagation();const a=t.dataset.colResize;if(!a)return;const c=t.closest("th");if(!c)return;const o=Nt(Bt[a],a),r=n.clientX,i=c.getBoundingClientRect().width,m=n.pointerId;t.setPointerCapture(m),document.body.classList.add("col-resizing");const s=g=>{const y=Math.max(o,Math.round(i+(g.clientX-r)));c.style.width=`${y}px`,c.style.minWidth=`${o}px`},l=g=>{t.releasePointerCapture(m),t.removeEventListener("pointermove",s),t.removeEventListener("pointerup",l),t.removeEventListener("pointercancel",l),document.body.classList.remove("col-resizing");const y=Math.max(o,Math.round(c.getBoundingClientRect().width)),f=Ot();f[a]=y,be(f),c.style.width=`${y}px`};t.addEventListener("pointermove",s),t.addEventListener("pointerup",l),t.addEventListener("pointercancel",l)})})}async function ze(){const e="/vi_planer/",t=new URL("VI-Planer-requirements.md",new URL(e,window.location.href)).href;try{const n=await fetch(t);if(!n.ok)throw new Error(String(n.status));const a=await n.text(),c=new Blob([a],{type:"text/markdown;charset=utf-8"}),o=URL.createObjectURL(c),r=document.createElement("a");r.href=o,r.download="VI-Planer-requirements.md",r.click(),URL.revokeObjectURL(o)}catch(n){console.error(n),alert("Не удалось скачать файл требований")}}async function Ce(){const e=document.querySelector("#exportPdfBtn"),t=document.querySelector("#pdfCapture");if(!t){alert("Не удалось найти содержимое для экспорта");return}const n=(e==null?void 0:e.textContent)??"Экспорт PDF";e&&(e.disabled=!0,e.textContent="PDF…");const a=new Date().toISOString().slice(0,10),c=`VI Planer — ${yt[u.tab]} · ${a}`,o=`VI-Planer-${yt[u.tab]}-${a}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await de(t,o,c)}catch(r){console.error(r),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),e&&(e.disabled=!1,e.textContent=n)}}async function _e(){p=await ce();const e=p.items.map(n=>n.manualRank).join(",");p={...p,items:V(p.items)};const t=p.items.map(n=>n.manualRank).join(",");e!==t&&_t(p),ne(n=>{const a=document.querySelector("#syncStatus");a&&(a.dataset.status=n,a.textContent=Tt(n))}),C()}_e()})();
