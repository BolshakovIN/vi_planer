(function(){"use strict";const C={S:{min:5,max:10},M:{min:10,max:20},L:{min:20,max:40}};function mt(e){const t={S:{...C.S},M:{...C.M},L:{...C.L}};if(!e||typeof e!="object")return t;for(const n of G){const a=e[n];if(!a||typeof a!="object")continue;const r=a;let s=Math.round(Number(r.min)),i=Math.round(Number(r.max));Number.isFinite(s)||(s=t[n].min),Number.isFinite(i)||(i=t[n].max),s=Math.max(1,s),i=Math.max(s,i),t[n]={min:s,max:i}}return t}function K(e,t=C){const n=t[e];return Math.round((n.min+n.max)/2)}function jt(e,t=C){const n=t[e];return`${e} (${n.min}–${n.max} дн.)`}function pt(e){return G.map(t=>jt(t,e)).join(", ")}const G=["S","M","L"];function qt(e){const t=String(e??"").toUpperCase();return t==="S"||t==="M"||t==="L"?t:"M"}function Pt(e,t=3){const n=e/Math.max(t,.5)*7;return n<=10?"S":n<=20?"M":"L"}function B(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function H(e,t=C){return e.assignments.reduce((n,a)=>n+K(a.size,t),0)}function ne(e,t){return e.assignments.some(n=>n.teamId===t)}function ft(e,t){const n=new Date(e+"T12:00:00");return n.setDate(n.getDate()+t),n.toISOString().slice(0,10)}function V(e,t){return ft(e,t*7)}function ae(e){return e.reduce((t,n)=>n.endDate!==t.endDate?n.endDate>t.endDate?n:t:n.durationDays!==t.durationDays?n.durationDays>t.durationDays?n:t:n.durationWeeks>t.durationWeeks?n:t)}function $(e){const[t,n,a]=e.split("-");return`${a}.${n}.${t}`}function st(e=new Date){const t=new Date(e),n=t.getDay(),a=n===0?-6:1-n;return t.setDate(t.getDate()+a),t.toISOString().slice(0,10)}function U(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?st():st(new Date(e.slice(0,10)+"T12:00:00"))}function _t(e,t){const n=new Date(U(e)+"T12:00:00").getTime(),a=new Date(U(t)+"T12:00:00").getTime();return Math.max(0,Math.round((a-n)/(168*3600*1e3)))}function tt(e,t=C){return[...e].sort((n,a)=>{const r=n.manualRank,s=a.manualRank;if(r!=null&&s!=null&&r!==s)return r-s;if(r!=null&&s==null)return-1;if(r==null&&s!=null)return 1;const i=B(a)-B(n);return i!==0?i:H(n,t)-H(a,t)})}function it(e,t,n){return e.find(a=>a.id!==n&&a.manualRank!=null&&a.manualRank===t)}function vt(e,t,n,a=C){const r=tt(e,a),s=r.findIndex(o=>o.id===t);if(s<0)return e;const i=[...r],[c]=i.splice(s,1),l=Math.max(0,Math.min(i.length,Math.round(n)-1));i.splice(l,0,c);const d=new Map(i.map((o,f)=>[o.id,f+1]));return e.map(o=>{const f=d.get(o.id);return f==null||o.manualRank===f?o:{...o,manualRank:f}})}function se(e,t,n=C){if(t.length<2)return e;const a=tt(e,n),r=new Set(t),s=new Map(e.map(o=>[o.id,o])),i=t.map(o=>s.get(o)).filter(o=>!!o);let c=0;const l=[];for(const o of a)if(r.has(o.id)){const f=i[c++];f&&l.push(f)}else l.push(o);for(;c<i.length;)l.push(i[c++]);const d=new Map(l.map((o,f)=>[o.id,f+1]));return e.map(o=>{const f=d.get(o.id);return f==null||o.manualRank===f?o:{...o,manualRank:f}})}function et(e){let t=0;for(const n of e)n.manualRank!=null&&n.manualRank>t&&(t=n.manualRank);return t+1}function X(e,t=C){const n=[...e].sort((c,l)=>{const d=B(l)-B(c);return d!==0?d:H(c,t)-H(l,t)}),a=new Set,r=new Map;for(const c of n){const l=c.manualRank;l!=null&&Number.isFinite(l)&&l>=1&&!a.has(l)&&(a.add(l),r.set(c.id,l))}let s=1;const i=()=>{for(;a.has(s);)s+=1;const c=s;return a.add(c),s+=1,c};return e.map(c=>{const l=r.get(c.id)??i();return c.manualRank===l?c:{...c,manualRank:l}})}function ie(e,t){return e>=t?e:t}function gt(e){const t=e.sizeRanges??C,n=e.items.filter(o=>o.status!=="done"),a=tt(n,t),r=new Map;for(const o of e.teams)r.set(o.id,[]);for(const o of a)for(const f of o.assignments){const g=r.get(f.teamId)??[];g.push({item:o,size:f.size,workStartDate:U(f.workStartDate||e.startDate)}),r.set(f.teamId,g)}const s=[],i={},c=52;for(const o of e.teams){const f=r.get(o.id)??[],g=Array.from({length:c},(k,b)=>({week:b,weekStart:V(e.startDate,b),usedPw:0,capacityPw:o.capacityPw,items:[]}));let y=e.startDate;f.forEach((k,b)=>{const w=K(k.size,t),I=k.workStartDate,R=ie(y,I),D=ft(R,w),q=_t(e.startDate,R),E=_t(e.startDate,D),x=Math.round(w/7*100)/100;for(let P=q;P<=Math.min(E,c-1);P++){const _=g[P];_&&!_.items.includes(k.item.id)&&_.items.push(k.item.id)}s.push({item:k.item,teamId:o.id,size:k.size,wsjf:B(k.item),effectiveRank:b+1,plannedStartDate:I,startWeek:q,endWeek:E,startDate:R,endDate:D,waitWeeks:q,delayedByQueue:R>I,durationDays:w,durationWeeks:x}),y=D}),i[o.id]=g}const l=new Map;for(const o of s){const f=l.get(o.item.id)??[];f.push(o),l.set(o.item.id,f)}const d=[];for(const o of a){const f=l.get(o.id)??[];if(!f.length)continue;const g=ae(f),y=f.reduce((k,b)=>b.startWeek<k.startWeek?b:k);d.push({item:o,slices:[...f].sort((k,b)=>k.endDate===b.endDate?b.durationDays-k.durationDays:k.endDate<b.endDate?1:-1),wsjf:B(o),totalEstimateDays:H(o,t),startWeek:y.startWeek,endWeek:g.endWeek,startDate:y.startDate,endDate:g.endDate,waitWeeks:y.waitWeeks,bottleneckTeamId:g.teamId})}return s.sort((o,f)=>o.startWeek!==f.startWeek?o.startWeek-f.startWeek:f.wsjf-o.wsjf),{slices:s,rollups:d,load:i}}function ot(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function yt(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const n=U(String(t.startDate??st())),a=t.teams,r=new Map(a.map(c=>[c.id,c.capacityPw])),s=t.items.map(c=>{const l=c;let d=[];return Array.isArray(l.assignments)&&l.assignments.length?d=l.assignments.filter(o=>o&&typeof o.teamId=="string").map(o=>{const f=String(o.teamId),g=r.get(f)??3,y=o.size!=null?qt(o.size):Pt(Number(o.estimatePw)||1,g);return{teamId:f,size:y,workStartDate:U(String(o.workStartDate||l.workStartDate||n))}}):typeof l.teamId=="string"&&(d=[{teamId:l.teamId,size:Pt(Number(l.estimatePw)||1,r.get(l.teamId)??3),workStartDate:n}]),!d.length&&a[0]&&(d=[{teamId:a[0].id,size:"M",workStartDate:n}]),{id:String(l.id??ot("item")),title:String(l.title??"Без названия"),type:l.type==="project"?"project":"product",backlog:String(l.backlog??"Backlog"),assignments:d,status:["idea","ready","in_progress","blocked","done"].includes(String(l.status))?l.status:"idea",owner:String(l.owner??"—"),businessValue:Number(l.businessValue)||5,timeCriticality:Number(l.timeCriticality)||5,riskReduction:Number(l.riskReduction)||5,jobSize:Number(l.jobSize)||5,notes:l.notes!=null?String(l.notes):void 0,manualRank:l.manualRank==null||l.manualRank===""?null:Number(l.manualRank)}}),i=mt(t.sizeRanges);return{version:3,startDate:n,teams:a,sizeRanges:i,items:X(s,i)}}const A=st(),bt=V(A,1),rt=V(A,2),Ct=V(A,3),kt=V(A,4),ht=V(A,6),Tt=V(A,8),Wt={version:3,startDate:A,sizeRanges:{S:{...C.S},M:{...C.M},L:{...C.L}},teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#d60000"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#455a64"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#737373"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#e65100"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"M",workStartDate:A}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",size:"S",workStartDate:bt}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"S",workStartDate:kt}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",size:"S",workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",size:"S",workStartDate:ht}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",size:"M",workStartDate:A},{teamId:"data",size:"M",workStartDate:Ct}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",size:"M",workStartDate:bt},{teamId:"crm",size:"S",workStartDate:kt}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",size:"M",workStartDate:rt},{teamId:"platform",size:"S",workStartDate:rt}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",size:"M",workStartDate:bt},{teamId:"platform",size:"S",workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",size:"M",workStartDate:A},{teamId:"platform",size:"S",workStartDate:rt},{teamId:"mobile",size:"S",workStartDate:ht}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",size:"M",workStartDate:Ct},{teamId:"data",size:"S",workStartDate:kt},{teamId:"mobile",size:"S",workStartDate:Tt}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",size:"L",workStartDate:rt},{teamId:"platform",size:"S",workStartDate:ht},{teamId:"mobile",size:"S",workStartDate:Tt}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},wt={...Wt,items:X(Wt.items)},At="vi-planer-v3";let Ft="idle",ct=[];function oe(){return null}function Nt(){return Ft}function re(e){return ct.push(e),()=>{ct=ct.filter(t=>t!==e)}}function nt(e){Ft=e,ct.forEach(t=>t(e))}function ce(){try{const e=localStorage.getItem(At)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=yt(JSON.parse(e));return t?{...t,items:X(t.items,t.sizeRanges)}:null}catch{return null}}function Bt(e){localStorage.setItem(At,JSON.stringify(e))}async function le(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),n=yt(t.state);return n?{...n,items:X(n.items,n.sizeRanges)}:null}catch{return null}}async function de(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function ue(){return null}async function me(e){return!1}async function pe(){nt("loading");const e=await le()??await ue()??ce()??structuredClone(wt);return Bt(e),nt((oe(),"saved")),e}let $t=null,St=null;function Dt(e){Bt(e),St=e,$t&&clearTimeout($t),$t=setTimeout(async()=>{const t=St;if(St=null,!t)return;nt("loading");const n=await me(),a=n?!0:await de(t);if(n||a){nt("saved");return}nt("offline")},350)}function Ot(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function Ht(e){const t=document.querySelector(`script[data-pdf-lib="${e}"]`);return t?t.dataset.loaded==="1"?Promise.resolve():new Promise((n,a)=>{t.addEventListener("load",()=>n()),t.addEventListener("error",()=>a(new Error(`Failed to load ${e}`)))}):new Promise((n,a)=>{const r=document.createElement("script");r.src=e,r.async=!0,r.dataset.pdfLib=e,r.onload=()=>{r.dataset.loaded="1",n()},r.onerror=()=>a(new Error(`Failed to load ${e}`)),document.head.appendChild(r)})}async function fe(){var n,a;window.html2canvas||await Ht("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(n=window.jspdf)!=null&&n.jsPDF||await Ht("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const e=window.html2canvas,t=(a=window.jspdf)==null?void 0:a.jsPDF;if(!e||!t)throw new Error("PDF libraries failed to load");return{html2canvas:e,jsPDF:t}}async function ve(e,t,n){const{html2canvas:a,jsPDF:r}=await fe(),s=await a(e,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f4f4f4",logging:!1,windowWidth:Math.max(e.scrollWidth,e.clientWidth),windowHeight:Math.max(e.scrollHeight,e.clientHeight)}),i=s.toDataURL("image/png"),c=new r({orientation:"landscape",unit:"mm",format:"a4"}),l=c.internal.pageSize.getWidth(),d=c.internal.pageSize.getHeight(),o=8,f=8,g=l-o*2,y=d-o*2-f,k=g,b=s.height*k/s.width;let w=b,I=o+f,R=0;for(;w>0;){R>0&&c.addPage(),R===0&&(c.setFontSize(11),c.setTextColor(15,23,42),c.text(n,o,o+4)),c.addImage(i,"PNG",o,I,k,b);const D=R===0?y:d-o*2;if(w-=D,I-=D,R+=1,R>40)break}c.save(t)}const xt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды",settings:"Настройки"},u={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let m=structuredClone(wt);function T(){return m.sizeRanges}function J(e){return m.teams.find(t=>t.id===e)}function Lt(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function Vt(e){return new Map(e.map(t=>[t.item.id,t]))}function ge(e){return e.assignments.map(t=>t.size).join(" + ")}function ye(e,t){return e.filter(n=>n.teamId===t).reduce((n,a)=>n+a.durationDays,0)}function be(e){return G.map(t=>`<option value="${t}" ${e===t?"selected":""}>${jt(t,T())}</option>`).join("")}function ke(e){return e.assignments.map(t=>{const n=J(t.teamId);return(n==null?void 0:n.name)??t.teamId}).join(", ")}function he(e){return`<div class="teams-stack">${e.assignments.map(n=>{const a=J(n.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(a==null?void 0:a.color)??"#94a3b8"}"></span>${L((a==null?void 0:a.name)??n.teamId)} <span class="size-badge mono">${n.size}</span> <span class="mono muted-inline">старт ${$(n.workStartDate)}</span></span>`}).join("")}</div>`}function we(e){const t=u.query.trim().toLowerCase(),n=Vt(e),a=m.items.filter(s=>u.typeFilter!=="all"&&s.type!==u.typeFilter||u.teamFilter!=="all"&&!ne(s,u.teamFilter)||u.statusFilter!=="all"&&s.status!==u.statusFilter?!1:t?s.title.toLowerCase().includes(t)||s.backlog.toLowerCase().includes(t)||s.owner.toLowerCase().includes(t)||ke(s).toLowerCase().includes(t):!0);if(u.sortKey==="priority"){const s=tt(a);return u.sortDir==="asc"?s:[...s].reverse()}const r=u.sortDir==="asc"?1:-1;return[...a].sort((s,i)=>{var l,d;let c=0;if(u.sortKey==="wsjf")c=B(s)-B(i);else if(u.sortKey==="estimate")c=H(s,T())-H(i,T());else{const o=((l=n.get(s.id))==null?void 0:l.endDate)??"9999-99-99",f=((d=n.get(i.id))==null?void 0:d.endDate)??"9999-99-99";c=o<f?-1:o>f?1:0}return c!==0?c*r:s.title.localeCompare(i.title,"ru")})}const Ut="vi-planer-col-widths",Jt={priority:"Приоритет",type:"Тип",title:"Инициатива / исходный бэклог",teams:"Команды (майка · старт)",status:"Статус",wsjf:"WSJF",estimate:"Оценка, майки",eta:"ETA"},$e={priority:96,type:88,title:260,teams:220,status:130,wsjf:72,estimate:120,eta:140};function Kt(){try{const e=localStorage.getItem(Ut);return e?JSON.parse(e):{}}catch{return{}}}function Se(e){localStorage.setItem(Ut,JSON.stringify(e))}const Rt={};function Gt(e,t){if(t&&Rt[t]!=null)return Rt[t];const n=document.createElement("span");n.textContent=e,n.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:IBM Plex Sans,system-ui,sans-serif;padding:0;",document.body.appendChild(n);const a=Math.ceil(n.getBoundingClientRect().width);n.remove();const r=Math.max(56,a+36);return t&&(Rt[t]=r),r}function De(e){const t=Kt()[e],n=Gt(Jt[e],e);return`width:${Math.max(n,t??$e[e])}px;min-width:${n}px`}function at(e,t,n="",a){const r=a!=null&&u.sortKey===a,s=!r||!a?"":u.sortDir==="asc"?" ↑":" ↓",i=a?`sortable ${r?"sorted":""}`:"",c=a?` data-sort="${a}"`:"";return`<th class="resizable-th ${i} ${n}" data-col="${t}"${c}${a?' title="Сортировать"':""} style="${De(t)}"><span class="th-label">${e}${s}</span><span class="col-resize" data-col-resize="${t}" title="Изменить ширину"></span></th>`}function lt(e,t){const a={priority:"priority",wsjf:"wsjf",estimate:"estimate",eta:"eta"}[t];if(!a){const r=u.sortKey===t,s=r?u.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${r?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${s}</th>`}return at(e,a,"",t)}function xe(e){u.sortKey===e?u.sortDir=u.sortDir==="asc"?"desc":"asc":(u.sortKey=e,u.sortDir=e==="wsjf"?"desc":"asc"),W()}function Le(e,t){const n=m.items.filter(d=>d.status!=="done"),a=n.filter(d=>d.type==="product").length,r=n.filter(d=>d.type==="project").length,s=n.filter(d=>d.assignments.length>1).length,i=e.map(d=>d.endWeek),c=i.length?Math.max(...i)+1:0,l=m.teams.filter(d=>ye(t,d.id)>56).length;return`
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${n.length}</div>
        <div class="hint">${a} продуктов · ${r} проектов · ${s} кросс-командных</div>
      </div>
      <div class="metric">
        <div class="label">Горизонт портфеля</div>
        <div class="value">${c} нед.</div>
        <div class="hint">до закрытия (по bottleneck-команде)</div>
      </div>
      <div class="metric">
        <div class="label">Команд под риском</div>
        <div class="value">${l}</div>
        <div class="hint">очередь длиннее 8 недель</div>
      </div>
      <div class="metric">
        <div class="label">Старт планирования</div>
        <div class="value" style="font-size:18px">${$(m.startDate)}</div>
        <div class="hint">понедельник текущей недели</div>
      </div>
    </div>
  `}function Re(){return`
    <details class="callout callout-cols agenda">
      <summary class="agenda-summary">Адженда</summary>
      <div class="cols-help">
        <div><span class="cols-help-k">Приоритет</span> — сквозной ранг (1 = выше); тяните строку за ⋮⋮, чтобы переставить. Сортировка других колонок приоритет не меняет</div>
        <div><span class="cols-help-k">Тип</span> — проект или продукт</div>
        <div><span class="cols-help-k">Инициатива</span> — название, исходный бэклог и владелец</div>
        <div><span class="cols-help-k">Команды</span> — кто делает, майка (S/M/L) и план старта</div>
        <div><span class="cols-help-k">Статус</span> — стадия готовности</div>
        <div><span class="cols-help-k">WSJF</span> — (BV + TC + RR) / Job Size</div>
        <div><span class="cols-help-k">Оценка</span> — майки S / M / L (диапазоны в Настройках)</div>
        <div><span class="cols-help-k">ETA</span> — дата готовности (когда закончила последняя команда)</div>
      </div>
    </details>
  `}function Ee(e,t){const n=Vt(e),a=we(e),r=u.sortKey==="priority",s=a.map(i=>{const c=n.get(i.id),l=B(i),d=H(i,T()),o=i.manualRank??"—",f=c?`<div class="eta-teams">${c.slices.map(g=>{const y=J(g.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(y==null?void 0:y.color)??"#64748b"}">${L((y==null?void 0:y.name)??g.teamId)}</span>: ${$(g.startDate)}→${$(g.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${r?"row-draggable":""}" data-edit="${i.id}" data-row-id="${i.id}">
          <td class="prio-cell">
            <div class="prio-edit" data-stop-edit>
              ${r?'<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>':""}
              <input
                class="prio-input"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-prio-id="${i.id}"
                value="${o}"
                title="Приоритет (1 = выше)"
                aria-label="Приоритет"
              />
            </div>
          </td>
          <td>
            <span class="badge badge-${i.type}">${i.type==="product"?"Продукт":"Проект"}</span>
            ${i.assignments.length>1?`<div class="meta" style="margin-top:4px">${i.assignments.length} команды</div>`:""}
          </td>
          <td class="title-cell">
            <div class="name">${L(i.title)}</div>
            <div class="meta">${L(i.backlog)} · ${L(i.owner)}</div>
          </td>
          <td>${he(i)}</td>
          <td><span class="badge badge-status-${i.status}">${Lt(i.status)}</span></td>
          <td class="mono metric-num">${l}</td>
          <td class="mono metric-num">
            <span class="size-badge">${ge(i)}</span>
            <div class="meta">~${d} дн.</div>
          </td>
          <td class="mono ${c&&c.waitWeeks>4?"eta-late":"eta-good"}">
            ${c?`<span class="eta-final">${$(c.endDate)}</span>`:"—"}
            ${f}
          </td>
        </tr>
      `}).join("");return`
    ${Re()}
    <div class="panel">
      <div class="panel-header">
        <h2>Единый портфель (проекты + продукты)</h2>
        <div class="filters">
          <input id="q" placeholder="Поиск…" value="${Y(u.query)}" />
          <select id="typeFilter">
            <option value="all" ${u.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${u.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${u.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${m.teams.map(i=>`<option value="${i.id}" ${u.teamFilter===i.id?"selected":""}>${L(i.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(i=>`<option value="${i}" ${u.statusFilter===i?"selected":""}>${Lt(i)}</option>`).join("")}
          </select>
          <button class="btn" id="resetFilters" title="Сбросить фильтры и сортировку">Сбросить фильтры</button>
          <button class="btn btn-primary" id="addItem">+ Инициатива</button>
        </div>
      </div>
      ${r?"":'<p class="sort-prio-hint">Сейчас сортировка не по приоритету — перестановка строк отключена, приоритеты не меняются. Верните сортировку по «Приоритет», чтобы двигать строки.</p>'}
      <div class="table-scroll" style="overflow-x:auto">
        <table class="portfolio-table">
          <thead>
            <tr>
              ${lt("Приоритет","priority")}
              ${at("Тип","type")}
              ${at("Инициатива / исходный бэклог","title")}
              ${at("Команды (оценка · старт)","teams")}
              ${at("Статус","status")}
              ${lt("WSJF","wsjf")}
              ${lt("Оценка, майки","estimate")}
              ${lt("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${s||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function Ie(e){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${m.teams.map(n=>{const a=e.filter(c=>c.teamId===n.id).sort((c,l)=>c.effectiveRank-l.effectiveRank),r=a.reduce((c,l)=>c+l.durationDays,0),s=Math.round(r/7*10)/10,i=Math.min(100,Math.round(r/56*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${n.color}"></span>${L(n.name)}</h3>
              <div class="meta">${a.length} задач · ~${r} дн. · ~${s} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${i}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,i)}%;background:${n.color}"></span></div>
          ${a.map(c=>{const l=c.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${c.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${c.item.type}">${c.item.type==="product"?"П":"Пр"}</span> ${L(c.item.title)}</div>
                <div class="meta">WSJF ${c.wsjf} · ${c.size} (${c.durationDays} дн.) · план ${$(c.plannedStartDate)}${c.delayedByQueue?" → сдвиг":""}${l>0?` · ещё ${l} ком.`:""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${$(c.startDate)} →<br/>${$(c.endDate)}
              </div>
            </div>
          `}).join("")||'<div class="empty">Очередь пуста</div>'}
        </div>
      `}).join("")}
    </div>
  `}function Me(e){const t=m.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда команда освобождается с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${m.teams.map(a=>{const r=e.filter(d=>d.teamId===a.id).sort((d,o)=>{const f=d.item.manualRank??9999,g=o.item.manualRank??9999;return f!==g?f-g:d.effectiveRank-o.effectiveRank}),s=r.reduce((d,o)=>d+o.durationDays,0),i=Math.round(s/7*10)/10,c=r.length?r[r.length-1].endDate:t,l=r.map((d,o)=>{const f=d.item.manualRank??"—",g=o>0?r[o-1]:null;let y="может взять сразу (очередь свободна)",k="take-now";d.startDate>d.plannedStartDate?(y=g?`ждёт очередь: после #${g.item.manualRank??"?"} «${g.item.title}»`:"сдвиг из‑за загрузки очереди",k="take-queue"):d.startDate>t&&(y=`ждёт плановый старт ${$(d.plannedStartDate)}`,k="take-plan");const b=d.item.assignments.filter(w=>w.teamId!==a.id).map(w=>{var I;return((I=J(w.teamId))==null?void 0:I.name)??w.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${f}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${d.item.type}">${d.item.type==="product"?"П":"Пр"}</span>
                  ${L(d.item.title)}
                </div>
                <div class="take-line ${k}">
                  <strong>Может взять с ${$(d.startDate)}</strong>
                  <span class="meta"> · ${L(y)}</span>
                </div>
                <div class="meta">
                  ${d.size} (${d.durationDays} дн.) · план ${$(d.plannedStartDate)} · до ${$(d.endDate)}
                  ${b.length?` · ещё: ${b.map(L).join(", ")}`:""}
                </div>
                <div class="take-bar" title="Окно работы в горизонте 12 нед.">
                  <span class="take-bar-fill" style="left:${d.startWeek/12*100}%;width:${Math.max(3,(d.endWeek-d.startWeek+1)/12*100)}%;background:${a.color}"></span>
                </div>
              </div>
              <div class="mono queue-item-dates">
                <div class="meta">старт</div>
                <div>${$(d.startDate)}</div>
                <div class="meta" style="margin-top:6px">конец</div>
                <div>${$(d.endDate)}</div>
              </div>
            </div>
          `}).join("")||`<div class="empty">Очередь пуста — команда свободна с ${$(t)}</div>`;return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${L(a.name)}</h3>
              <div class="meta">${r.length} задач · ~${s} дн. · ~${i} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${$(c)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          ${l}
        </div>
      `}).join("")}
    </div>
  `}function ze(e,t){const n=Math.max(4,...e.map(b=>b.endWeek+2),4),a=Math.max(4,Math.min(52,Math.round(u.ganttWeeks)||16));u.ganttWeeks=a;const r=tt(m.items.filter(b=>b.status!=="done")),s=new Map(r.map((b,w)=>[b.id,w])),i=100/a,c=`repeating-linear-gradient(90deg, #f5f5f5 0, #f5f5f5 calc(${i}% - 1px), #e0e0e0 calc(${i}% - 1px), #e0e0e0 ${i}%)`,l=[],d=[];m.teams.forEach((b,w)=>{const I=t.filter(D=>D.teamId===b.id).sort((D,q)=>D.effectiveRank-q.effectiveRank);if(I.length<2)return;const R=`arrow-${b.id}`;d.push(`
      <marker id="${R}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${b.color}" fill-opacity="0.85" />
      </marker>
    `);for(let D=1;D<I.length;D++){const q=I[D-1],E=I[D],x=(s.get(q.item.id)??0)+.5,P=(s.get(E.item.id)??0)+.5,_=Math.min(a-.05,q.endWeek+.92),F=Math.min(a-.05,Math.max(.08,E.startWeek+.02)),N=F-_,p=(w%4-1.5)*.08,v=Math.max(.35,Math.abs(N)*.45)+Math.abs(p),h=_+(N>=0?v:-v*.35)+p,M=F-(N>=0?v:-v*.35)+p,S=Math.abs(x-P)<.02?`M ${_} ${x} H ${F}`:`M ${_} ${x} C ${h} ${x}, ${M} ${P}, ${F} ${P}`;l.push(`<path d="${S}" fill="none" stroke="${b.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${R})" />`)}});const o=[],f=[];for(const b of r){const w=e.find(E=>E.item.id===b.id);if(!w)continue;const I=w.slices.map(E=>{const x=t.filter(N=>N.teamId===E.teamId).sort((N,p)=>N.effectiveRank-p.effectiveRank),P=x.findIndex(N=>N.item.id===b.id);if(P<=0)return null;const _=x[P-1],F=J(E.teamId);return`#${_.item.manualRank} (${(F==null?void 0:F.name)??E.teamId})`}).filter(Boolean),R=[...new Set(I)],D=R.length?`<div class="meta gantt-dep-meta">после ${R.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',q=w.slices.map(E=>{const x=J(E.teamId),P=E.startWeek/a*100,_=Math.max(1,E.endWeek-E.startWeek+1)/a*100;return`<div class="gantt-bar ${E.teamId===w.bottleneckTeamId?"gantt-bot":""}" style="left:${P}%;width:${Math.max(_,2.5)}%;background:${(x==null?void 0:x.color)??"#64748b"}" title="${Y((x==null?void 0:x.name)??"")}: ${$(E.endDate)}">${L((x==null?void 0:x.name)??"")}</div>`}).join("");o.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${b.manualRank??"—"}</span> ${L(b.title)}</div>
        <div class="meta">${b.type==="product"?"Продукт":"Проект"} · ETA ${$(w.endDate)}</div>
        ${D}
      </div>
    `),f.push(`<div class="gantt-track gantt-track-multi" style="background:${c}">${q}</div>`)}const g=Math.max(1,r.length),y=a<=12?1:a<=24?2:a<=36?3:4,k=Array.from({length:a},(b,w)=>{if(!(w%y===0||w===a-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${i}%"></div>`;const R=V(m.startDate,w),[,D,q]=R.split("-");return`<div class="gantt-axis-tick" style="width:${i}%">
      <span class="gantt-axis-w">Н${w+1}</span>
      <span class="gantt-axis-d">${q}.${D}</span>
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
        ${r.length?`<div class="gantt-layout">
          <div class="gantt-labels-col">
            <div class="gantt-axis-spacer">
              <span class="meta">нед. с ${$(m.startDate)}</span>
            </div>
            ${o.join("")}
          </div>
          <div class="gantt-tracks-wrap">
            <div class="gantt-axis">${k}</div>
            <div class="gantt-tracks-col">
              <svg class="gantt-dep-layer" viewBox="0 0 ${a} ${g}" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  ${d.join("")}
                </defs>
                ${l.join("")}
              </svg>
              ${f.join("")}
            </div>
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.</p>
    </div>
  `}const Et=["#d60000","#455a64","#737373","#c62828","#e65100","#1a1a1a","#8d6e63","#546e7a","#b71c1c","#f57c00"];function It(){const e=new Set(m.teams.map(t=>t.color));return Et.find(t=>!e.has(t))??Et[m.teams.length%Et.length]}function je(e){const t=m.sizeRanges,n=m.items.filter(i=>i.status!=="done"),a=e.map(i=>i.endWeek),r=a.length?Math.max(...a)+1:0;return`
    <div class="callout">
      Диапазоны майок задают длительность работ в календарных днях. Для ETA и Gantt берётся <strong>середина</strong> диапазона.
      Изменения применяются сразу и перестраивают все расчёты.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Майки (S / M / L)</h2>
        <button type="button" class="btn" id="resetSizeRanges">Сбросить по умолчанию</button>
      </div>
      <div class="size-ranges-grid">${G.map(i=>`
    <div class="size-range-row">
      <div class="size-range-label"><span class="size-badge size-badge-lg">${i}</span></div>
      <label class="size-range-field">
        <span class="meta">от, дн.</span>
        <input
          type="number"
          id="set_${i}_min"
          class="set-range"
          data-size="${i}"
          data-bound="min"
          min="1"
          step="1"
          value="${t[i].min}"
        />
      </label>
      <label class="size-range-field">
        <span class="meta">до, дн.</span>
        <input
          type="number"
          id="set_${i}_max"
          class="set-range"
          data-size="${i}"
          data-bound="max"
          min="1"
          step="1"
          value="${t[i].max}"
        />
      </label>
      <div class="size-range-plan">
        <span class="meta">для плана</span>
        <strong class="mono" data-plan="${i}">${K(i,t)} дн.</strong>
      </div>
    </div>
  `).join("")}</div>
      <div class="settings-preview" id="settingsSchedPreview">
        <div><span class="meta">Сейчас в плане</span></div>
        <div class="settings-preview-row">
          <span>Горизонт портфеля</span>
          <strong class="mono" id="settingsHorizon">${r} нед.</strong>
        </div>
        <div class="settings-preview-row">
          <span>Активных инициатив</span>
          <strong class="mono">${n.length}</strong>
        </div>
        <div class="settings-preview-row">
          <span>Шкала майок</span>
          <strong id="settingsRangesSummary">${pt(t)}</strong>
        </div>
      </div>
    </div>
  `}function qe(){const e={};for(const t of G){const n=document.querySelector(`#set_${t}_min`),a=document.querySelector(`#set_${t}_max`);if(!n||!a)return null;e[t]={min:Math.round(Number(n.value)),max:Math.round(Number(a.value))}}return mt(e)}function Pe(e){var i;const t=m.sizeRanges;for(const c of G)(i=document.querySelector(`[data-plan="${c}"]`))==null||i.replaceChildren(document.createTextNode(`${K(c,t)} дн.`));const n=e.map(c=>c.endWeek),a=n.length?Math.max(...n)+1:0,r=document.querySelector("#settingsHorizon");r&&(r.textContent=`${a} нед.`);const s=document.querySelector("#settingsSchedPreview #settingsRangesSummary");s&&(s.textContent=pt(t))}let Xt;function _e(){const e=qe();if(!e)return;m.sizeRanges=e,Dt(m);const{rollups:t}=gt(m);Pe(t);const n=document.activeElement,a=n!=null&&n.classList.contains("set-range")?n.id:null;clearTimeout(Xt),Xt=setTimeout(()=>{if(W(),a){const r=document.querySelector(`#${a}`);r==null||r.focus(),r==null||r.select()}},200)}function Ce(){return`
    <div class="callout">
      Управляйте командами: название и цвет. Оценки задаются майками S / M / L (5–10 / 10–20 / 20–40 календарных дней).
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Команды</h2>
        <button class="btn btn-primary" id="addTeam">+ Команда</button>
      </div>
      <div id="teamsManageList">
        ${m.teams.map(t=>`
      <div class="capacity-row" data-team-row="${t.id}">
        <span class="team-dot" style="background:${t.color}"></span>
        <input
          class="team-name-input"
          type="text"
          data-team-name="${t.id}"
          value="${Y(t.name)}"
          aria-label="Название команды"
        />
      </div>
    `).join("")||'<div class="empty">Нет команд — создайте первую</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar" hidden>
        <span class="team-dot" id="newTeamDot" style="background:${It()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">Создать</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function Te(e){var d;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((d=m.teams[0])==null?void 0:d.id)??"",size:"M",workStartDate:m.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:et(m.items)},n=B(t),a=new Set(t.assignments.map(o=>o.teamId)),r=new Map(t.assignments.map(o=>[o.teamId,o.size])),s=new Map(t.assignments.map(o=>[o.teamId,o.workStartDate])),i=Yt(t),c=i?Zt(i,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',l=m.teams.map(o=>{const f=a.has(o.id),g=r.get(o.id)??"M",y=s.get(o.id)??m.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${o.id}" ${f?"checked":""} />
            <span class="team-dot" style="background:${o.color}"></span>
            <span class="team-assign-name">${L(o.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Майка</span>
            <select class="f_team_size" data-team="${o.id}" ${f?"":"disabled"}>${be(g)}</select>
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${o.id}" value="${y}" ${f?"":"disabled"} />
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
            <input id="f_title" value="${Y(t.title)}" />
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
              <input id="f_backlog" value="${Y(t.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${t.status===o?"selected":""}>${Lt(o)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${Y(t.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: майка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${l}</div>
            <div class="meta" style="margin-top:6px">${pt(T())}. Итого ~<strong class="mono" id="liveTotalEst">${H(t,T())}</strong> дн. Старт — не раньше указанной даты; если очередь занята, сдвинется позже.</div>
          </div>
          <div class="callout" style="margin:0" id="liveEtaBox">
            <strong>Пересчёт ETA</strong> (с учётом очереди и стартов)
            <div id="liveEta" style="margin-top:8px;font-size:13px;color:var(--ink)">${c}</div>
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
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??et(m.items)}" />
              <div class="meta" style="margin-top:6px">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
            </div>
            <div class="field">
              <label>Заметки</label>
              <textarea id="f_notes">${L(t.notes??"")}</textarea>
            </div>
          </div>
        </div>
        ${e?`<div class="modal-foot">
          <button class="btn" id="deleteItem" style="color:var(--bad)">Удалить</button>
        </div>`:""}
      </div>
    </div>
  `}function Yt(e){const t=e.assignments.length?e.assignments:zt();if(!t.length)return null;const n=e.id||"__draft__",a={...e,id:n,assignments:t},r=m.items.some(i=>i.id===n)?m.items.map(i=>i.id===n?a:i):[...m.items,a],{rollups:s}=gt({...m,items:r});return s.find(i=>i.item.id===n)??null}function Qt(e){const t=K(e.size,T()),n=U(e.workStartDate||m.startDate),a=ft(n,t);return{start:n,end:a,days:t}}function Zt(e,t){const n=new Map(t.map(s=>[s.teamId,s])),a=e.slices.map(s=>{const i=J(s.teamId),c=n.get(s.teamId),l=c?U(c.workStartDate):s.plannedStartDate,d=c?Qt(c):null,o=s.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",f=s.startDate>l?` <span class="meta">(план ${$(l)}, очередь сдвинула на ${$(s.startDate)})</span>`:s.startDate<l?` <span class="meta">(ждём план ${$(l)})</span>`:"",g=d?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(d.start)} → <span class="mono">${$(d.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${L((i==null?void 0:i.name)??s.teamId)}</strong>: <span class="mono">${$(s.startDate)} → ${$(s.endDate)}</span> <span class="meta">(${s.size} · ~${s.durationDays} дн.)</span>${f}${o}${g}</div>`}).join(""),r=t.map(s=>Qt(s).end).reduce((s,i)=>s>i?s:i,"0000-00-00");return a+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(r)}</strong> — меняется сразу при смене даты</div>`}function L(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function Y(e){return L(e).replaceAll("'","&#39;")}function Q(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),(e=document.querySelector("#prioPop"))==null||e.remove()}function We(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-prio-no>Нет</button>
      <button type="button" class="btn btn-primary" data-prio-yes>Да</button>
    </div>
  `}function Mt(e,t,n,a){var f,g;Q(),e.classList.add("prio-ask");const r=document.createElement("div");r.id="prioPop",r.className="prio-confirm prio-confirm-float",r.setAttribute("data-stop-edit",""),r.innerHTML=We(t),document.body.appendChild(r);const s=()=>{const y=e.getBoundingClientRect(),k=r.getBoundingClientRect();let b=y.right+8,w=y.top+y.height/2-k.height/2;b+k.width>window.innerWidth-8&&(b=Math.max(8,y.left-k.width-8)),w=Math.max(8,Math.min(w,window.innerHeight-k.height-8)),r.style.left=`${b}px`,r.style.top=`${w}px`};s();const i=()=>s();window.addEventListener("scroll",i,!0),window.addEventListener("resize",i);const c=()=>{window.removeEventListener("scroll",i,!0),window.removeEventListener("resize",i),document.removeEventListener("mousedown",o,!0)},l=()=>{c(),Q(),a()},d=()=>{c(),Q(),n()},o=y=>{const k=y.target;r.contains(k)||e.contains(k)||l()};document.addEventListener("mousedown",o,!0),(f=r.querySelector("[data-prio-yes]"))==null||f.addEventListener("click",y=>{y.stopPropagation(),d()}),(g=r.querySelector("[data-prio-no]"))==null||g.addEventListener("click",y=>{y.stopPropagation(),l()})}function Ae(){if(u.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,n=null;const a=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(s=>s.classList.remove("is-dragging","drag-over"))},r=(s,i)=>{if(s===i)return;const c=Array.from(e.querySelectorAll("tr[data-row-id]")).map(g=>g.dataset.rowId),l=c.indexOf(s),d=c.indexOf(i);if(l<0||d<0)return;const o=[...c];o.splice(l,1),o.splice(d,0,s);const f=u.sortDir==="asc"?o:[...o].reverse();m.items=se(m.items,f,T()),u.sortKey="priority",O()};e.querySelectorAll("[data-drag-handle]").forEach(s=>{const i=s.closest("tr[data-row-id]");if(!i)return;s.addEventListener("pointerdown",l=>{l.button===0&&(l.preventDefault(),l.stopPropagation(),t=i.dataset.rowId??null,n=l.pointerId,s.setPointerCapture(l.pointerId),a(),i.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),s.addEventListener("pointermove",l=>{if(t==null||l.pointerId!==n)return;const d=document.elementFromPoint(l.clientX,l.clientY),o=d==null?void 0:d.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(f=>f.classList.remove("drag-over")),o&&o.dataset.rowId!==t&&o.classList.add("drag-over")});const c=l=>{if(t==null||l.pointerId!==n)return;const d=t,o=document.elementFromPoint(l.clientX,l.clientY),f=o==null?void 0:o.closest("tr[data-row-id]"),g=f==null?void 0:f.dataset.rowId;try{s.releasePointerCapture(l.pointerId)}catch{}a(),document.body.classList.remove("prio-dragging"),t=null,n=null,g&&r(d,g)};s.addEventListener("pointerup",c),s.addEventListener("pointercancel",c)})}function W(){Q(),Z();const{slices:e,rollups:t}=gt(m),n=document.querySelector("#app");if(!n)return;const a=u.editingId!=null?m.items.find(r=>r.id===u.editingId)??null:null;n.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${Nt()}">${Ot(Nt())}</span>
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
        <h1>VI Planer — ${xt[u.tab]}</h1>
        <p>Старт портфеля: ${m.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${Le(t,e)}
      <div class="tabs no-print">
        <button class="tab ${u.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${u.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${u.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${u.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${u.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
        <button class="tab ${u.tab==="settings"?"active":""}" data-tab="settings">Настройки</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${u.tab==="portfolio"?Ee(t):u.tab==="teams"?Ie(e):u.tab==="queuesTest"?Me(e):u.tab==="timeline"?ze(t,e):u.tab==="settings"?je(t):Ce()}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${u.creating||a?Te(a):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,Fe()}function zt(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const n of e){if(!n.checked)continue;const a=n.dataset.team,r=document.querySelector(`.f_team_size[data-team="${a}"]`),s=document.querySelector(`.f_team_start[data-team="${a}"]`),i=qt(r==null?void 0:r.value),c=U((s==null?void 0:s.value)||m.startDate);t.push({teamId:a,size:i,workStartDate:c})}return t}function te(){var i,c,l,d,o,f,g;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),n=zt();if(e&&(e.textContent=String(n.reduce((y,k)=>y+K(k.size,T()),0)||0)),!t)return;if(!n.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const a=(u.editingId?m.items.find(y=>y.id===u.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:n,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},r={...a,id:u.editingId||"__draft__",assignments:n,title:((i=document.querySelector("#f_title"))==null?void 0:i.value.trim())||a.title,type:((c=document.querySelector("#f_type"))==null?void 0:c.value)||a.type,status:((l=document.querySelector("#f_status"))==null?void 0:l.value)||a.status,businessValue:Number((d=document.querySelector("#f_bv"))==null?void 0:d.value)||a.businessValue,timeCriticality:Number((o=document.querySelector("#f_tc"))==null?void 0:o.value)||a.timeCriticality,riskReduction:Number((f=document.querySelector("#f_rr"))==null?void 0:f.value)||a.riskReduction,jobSize:Number((g=document.querySelector("#f_js"))==null?void 0:g.value)||a.jobSize,manualRank:(()=>{var b;const y=(b=document.querySelector("#f_rank"))==null?void 0:b.value,k=Math.round(Number(y));return Number.isFinite(k)&&k>=1?k:a.manualRank??et(m.items)})()},s=Yt(r);if(!s){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=Zt(s,n)}function ee(){const e=(s,i)=>{const c=document.querySelector(`#${s}`),l=Number(c==null?void 0:c.value);return Number.isFinite(l)?l:i},t=s=>{var i;return((i=document.querySelector(`#${s}`))==null?void 0:i.value)??""},n=zt();if(!n.length)return alert("Выберите хотя бы одну команду"),null;const a=t("f_rank").trim(),r=Math.max(1,Math.round(Number(a)||et(m.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:n,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:dt(e("f_bv",5),1,10),timeCriticality:dt(e("f_tc",5),1,10),riskReduction:dt(e("f_rr",5),1,10),jobSize:dt(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:r}}function dt(e,t,n){return Math.min(n,Math.max(t,e))}function O(){Dt(m),W()}function Fe(){var d,o,f,g,y,k,b,w,I,R,D,q,E,x,P,_,F,N;document.querySelectorAll("[data-tab]").forEach(p=>{p.addEventListener("click",()=>{u.tab=p.dataset.tab,W()})}),document.querySelectorAll(".set-range").forEach(p=>{p.addEventListener("input",()=>_e())}),(d=document.querySelector("#resetSizeRanges"))==null||d.addEventListener("click",()=>{m.sizeRanges=mt(void 0),O()});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{u.query=e.value}),e==null||e.addEventListener("change",()=>W());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{u.typeFilter=t.value,W()});const n=document.querySelector("#teamFilter");n==null||n.addEventListener("change",()=>{u.teamFilter=n.value,W()});const a=document.querySelector("#statusFilter");a==null||a.addEventListener("change",()=>{u.statusFilter=a.value,W()}),(o=document.querySelector("#addItem"))==null||o.addEventListener("click",()=>{u.creating=!0,u.editingId=null,W()}),(f=document.querySelector("#resetFilters"))==null||f.addEventListener("click",()=>{u.typeFilter="all",u.teamFilter="all",u.statusFilter="all",u.query="",u.sortKey="priority",u.sortDir="asc",W()}),document.querySelectorAll("[data-edit]").forEach(p=>{p.addEventListener("click",v=>{v.target.closest("[data-stop-edit], .prio-input, .prio-edit, #prioPop, .drag-handle")||(u.editingId=p.dataset.edit??null,u.creating=!1,W())})}),Ae(),document.querySelectorAll(".prio-input").forEach(p=>{const v=p.dataset.prioId,h=()=>{const S=m.items.find(z=>z.id===v);p.value=String((S==null?void 0:S.manualRank)??1)},M=()=>{const S=m.items.find(Je=>Je.id===v);if(!S)return;const z=Number(p.value);if(!Number.isFinite(z)||z<1){h();return}const j=Math.round(z);if(p.value=String(j),j===S.manualRank)return;const ut=it(m.items,j,v),Ue=ut?`Сменить на <span class="accent">${j}</span>?<br/>«${L(ut.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${j}</span>?`;Mt(p,Ue,()=>{m.items=vt(m.items,v,j,T()),O()},h)};p.addEventListener("click",S=>S.stopPropagation()),p.addEventListener("mousedown",S=>S.stopPropagation()),p.addEventListener("keydown",S=>{S.key==="Enter"&&(S.preventDefault(),M()),S.key==="Escape"&&(Q(),h(),p.blur())}),p.addEventListener("change",M)}),document.querySelectorAll("[data-sort]").forEach(p=>{p.addEventListener("click",v=>{if(v.target.closest("[data-col-resize]"))return;v.stopPropagation();const h=p.dataset.sort;(h==="wsjf"||h==="estimate"||h==="eta"||h==="priority")&&xe(h)})}),Be();const r=()=>{u.creating=!1,u.editingId=null,W()};(g=document.querySelector("#closeModal"))==null||g.addEventListener("click",r),(y=document.querySelector("#closeModal2"))==null||y.addEventListener("click",r),(k=document.querySelector("#modal"))==null||k.addEventListener("click",p=>{p.target.id==="modal"&&r()}),document.querySelectorAll(".f_team_check").forEach(p=>{p.addEventListener("change",()=>{const v=p.dataset.team,h=document.querySelector(`.f_team_size[data-team="${v}"]`),M=document.querySelector(`.f_team_start[data-team="${v}"]`);h&&(h.disabled=!p.checked),M&&(M.disabled=!p.checked),te()})});const s=document.querySelector("#teamAssignList"),i=p=>{const v=p.target;v&&(v.classList.contains("f_team_size")||v.classList.contains("f_team_start")||v.classList.contains("f_team_check"))&&te()};s==null||s.addEventListener("input",i),s==null||s.addEventListener("change",i),s==null||s.addEventListener("keyup",i),(b=document.querySelector("#saveItem"))==null||b.addEventListener("click",()=>{const p=ee();if(!p)return;const v=p.manualRank??et(m.items),h=document.querySelector("#f_rank"),M=()=>{if(it(m.items,v,null)){const j=ot("item");m.items=[...m.items,{...p,id:j,manualRank:m.items.length+1}],m.items=vt(m.items,j,v,T())}else m.items.push({...p,id:ot("item"),manualRank:v}),m.items=X(m.items,T());u.creating=!1,u.editingId=null,O()},S=()=>{if(!u.editingId)return;const z=m.items.findIndex(ut=>ut.id===u.editingId);if(z<0)return;const j=m.items[z];v!==j.manualRank?(m.items[z]={...j,...p,manualRank:j.manualRank},m.items=vt(m.items,u.editingId,v,T())):m.items[z]={...j,...p},u.creating=!1,u.editingId=null,O()};if(u.creating){const z=it(m.items,v,null);if(z&&h){Mt(h,`Занять <span class="accent">${v}</span>?<br/>«${L(z.title)}» сдвинется вверх.`,M,()=>{});return}M();return}if(u.editingId){const z=m.items.find(j=>j.id===u.editingId);if(z&&v!==z.manualRank&&h){const j=it(m.items,v,u.editingId);Mt(h,j?`Сменить на <span class="accent">${v}</span>?<br/>«${L(j.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${v}</span>?`,S,()=>{});return}S()}}),(w=document.querySelector("#deleteItem"))==null||w.addEventListener("click",()=>{u.editingId&&(m.items=m.items.filter(p=>p.id!==u.editingId),u.editingId=null,O())}),["f_bv","f_tc","f_rr","f_js"].forEach(p=>{var v;(v=document.querySelector(`#${p}`))==null||v.addEventListener("input",()=>{const h=document.querySelector("#liveWsjf");if(!h)return;const M=ee();M&&(h.textContent=String(B({...M})))})});const c=document.querySelector("#ganttWeeks");c==null||c.addEventListener("input",()=>{const p=Math.max(4,Math.min(52,Number(c.value)||16));u.ganttWeeks=p;const v=document.querySelector("#ganttWeeksLabel");v&&(v.textContent=`${p} нед.`)}),c==null||c.addEventListener("change",()=>{u.ganttWeeks=Math.max(4,Math.min(52,Number(c.value)||16)),W()}),document.querySelectorAll("[data-team-name]").forEach(p=>{const v=()=>{const h=p.dataset.teamName,M=m.teams.find(z=>z.id===h);if(!M)return;const S=p.value.trim()||M.name;p.value=S,S!==M.name&&(M.name=S,O())};p.addEventListener("change",v),p.addEventListener("keydown",h=>{h.key==="Enter"&&(h.preventDefault(),p.blur())})}),(I=document.querySelector("#addTeam"))==null||I.addEventListener("click",()=>{const p=document.querySelector("#teamAddBar"),v=document.querySelector("#newTeamName"),h=document.querySelector("#newTeamDot");p&&(p.hidden=!1),h&&(h.style.background=It()),v==null||v.focus()}),(R=document.querySelector("#cancelNewTeam"))==null||R.addEventListener("click",()=>{const p=document.querySelector("#teamAddBar"),v=document.querySelector("#newTeamName");p&&(p.hidden=!0),v&&(v.value="")});const l=()=>{const p=document.querySelector("#newTeamName"),v=(p==null?void 0:p.value.trim())||"";if(!v){p==null||p.focus();return}m.teams.push({id:ot("team"),name:v,capacityPw:3,color:It()}),O()};(D=document.querySelector("#saveNewTeam"))==null||D.addEventListener("click",l),(q=document.querySelector("#newTeamName"))==null||q.addEventListener("keydown",p=>{p.key==="Enter"&&(p.preventDefault(),l())}),(E=document.querySelector("#exportPdfBtn"))==null||E.addEventListener("click",()=>{He()}),(x=document.querySelector("#downloadReqsBtn"))==null||x.addEventListener("click",()=>{Oe()}),(P=document.querySelector("#exportBtn"))==null||P.addEventListener("click",()=>{const p=new Blob([JSON.stringify(m,null,2)],{type:"application/json"}),v=URL.createObjectURL(p),h=document.createElement("a");h.href=v,h.download=`vi-planer-${m.startDate}.json`,h.click(),URL.revokeObjectURL(v)}),(_=document.querySelector("#importBtn"))==null||_.addEventListener("click",()=>{var p;(p=document.querySelector("#fileInput"))==null||p.click()}),(F=document.querySelector("#fileInput"))==null||F.addEventListener("change",async p=>{var h;const v=(h=p.target.files)==null?void 0:h[0];if(v)try{const M=await v.text(),S=yt(JSON.parse(M));if(!S){alert("Неверный формат файла");return}m=S,O()}catch{alert("Не удалось прочитать JSON")}}),(N=document.querySelector("#resetBtn"))==null||N.addEventListener("click",p=>{p.stopPropagation(),Ne(p.currentTarget)})}function Z(){var e,t;(e=document.querySelector("#resetPop"))==null||e.remove(),(t=document.querySelector("#resetBtn"))==null||t.classList.remove("reset-ask")}function Ne(e){var c,l;Z(),Q(),e.classList.add("reset-ask");const t=document.createElement("div");t.id="resetPop",t.className="reset-confirm",t.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(t);const n=()=>{const d=e.getBoundingClientRect(),o=t.offsetWidth,f=t.offsetHeight;let g=d.right-o,y=d.bottom+6;g<8&&(g=8),g+o>window.innerWidth-8&&(g=window.innerWidth-o-8),y+f>window.innerHeight-8&&(y=d.top-f-6),t.style.left=`${Math.max(8,g)}px`,t.style.top=`${Math.max(8,y)}px`};n();const a=()=>n();window.addEventListener("scroll",a,!0),window.addEventListener("resize",a);const r=()=>{window.removeEventListener("scroll",a,!0),window.removeEventListener("resize",a),window.removeEventListener("keydown",s),document.removeEventListener("mousedown",i)},s=d=>{d.key==="Escape"&&(r(),Z())},i=d=>{const o=d.target;t.contains(o)||e.contains(o)||(r(),Z())};(c=t.querySelector("#resetCancelBtn"))==null||c.addEventListener("click",()=>{r(),Z()}),(l=t.querySelector("#resetConfirmBtn"))==null||l.addEventListener("click",()=>{r(),Z(),m=structuredClone(wt),O()}),window.addEventListener("keydown",s),window.setTimeout(()=>document.addEventListener("mousedown",i),0)}function Be(){const e=document.querySelector(".portfolio-table");e&&e.querySelectorAll("[data-col-resize]").forEach(t=>{t.addEventListener("pointerdown",n=>{n.preventDefault(),n.stopPropagation();const a=t.dataset.colResize;if(!a)return;const r=t.closest("th");if(!r)return;const s=Gt(Jt[a],a),i=n.clientX,c=r.getBoundingClientRect().width,l=n.pointerId;t.setPointerCapture(l),document.body.classList.add("col-resizing");const d=f=>{const g=Math.max(s,Math.round(c+(f.clientX-i)));r.style.width=`${g}px`,r.style.minWidth=`${s}px`},o=f=>{t.releasePointerCapture(l),t.removeEventListener("pointermove",d),t.removeEventListener("pointerup",o),t.removeEventListener("pointercancel",o),document.body.classList.remove("col-resizing");const g=Math.max(s,Math.round(r.getBoundingClientRect().width)),y=Kt();y[a]=g,Se(y),r.style.width=`${g}px`};t.addEventListener("pointermove",d),t.addEventListener("pointerup",o),t.addEventListener("pointercancel",o)})})}async function Oe(){const e="/vi_planer/",t=new URL("VI-Planer-requirements.md",new URL(e,window.location.href)).href;try{const n=await fetch(t);if(!n.ok)throw new Error(String(n.status));const a=await n.text(),r=new Blob([a],{type:"text/markdown;charset=utf-8"}),s=URL.createObjectURL(r),i=document.createElement("a");i.href=s,i.download="VI-Planer-requirements.md",i.click(),URL.revokeObjectURL(s)}catch(n){console.error(n),alert("Не удалось скачать файл требований")}}async function He(){const e=document.querySelector("#exportPdfBtn"),t=document.querySelector("#pdfCapture");if(!t){alert("Не удалось найти содержимое для экспорта");return}const n=(e==null?void 0:e.textContent)??"Экспорт PDF";e&&(e.disabled=!0,e.textContent="PDF…");const a=new Date().toISOString().slice(0,10),r=`VI Planer — ${xt[u.tab]} · ${a}`,s=`VI-Planer-${xt[u.tab]}-${a}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await ve(t,s,r)}catch(i){console.error(i),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),e&&(e.disabled=!1,e.textContent=n)}}async function Ve(){m=await pe();const e=m.items.map(n=>n.manualRank).join(",");m={...m,items:X(m.items,T())};const t=m.items.map(n=>n.manualRank).join(",");e!==t&&Dt(m),re(n=>{const a=document.querySelector("#syncStatus");a&&(a.dataset.status=n,a.textContent=Ot(n))}),W()}Ve()})();
