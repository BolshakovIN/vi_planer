(function(){"use strict";const W={S:{min:1,max:2},M:{min:2,max:4},L:{min:4,max:8}};function yt(e){const t={S:{...W.S},M:{...W.M},L:{...W.L}};if(!e||typeof e!="object")return t;for(const n of Y){const a=e[n];if(!a||typeof a!="object")continue;const r=a;let s=Math.round(Number(r.min)),i=Math.round(Number(r.max));Number.isFinite(s)||(s=t[n].min),Number.isFinite(i)||(i=t[n].max),s=Math.max(1,s),i=Math.max(s,i),t[n]={min:s,max:i}}if(t.S.max>12||t.M.max>12||t.L.max>12)for(const n of Y)t[n]={min:Math.max(1,Math.round(t[n].min/7)),max:Math.max(1,Math.round(t[n].max/7))},t[n].max<t[n].min&&(t[n].max=t[n].min);return t}function X(e,t=W){const n=t[e];return Math.round((n.min+n.max)/2*10)/10}function Ft(e,t=W){const n=t[e];return`${e} (${n.min}–${n.max} нед.)`}function bt(e){return Y.map(t=>Ft(t,e)).join(", ")}const Y=["S","M","L"];function ht(e){const t=String(e??"").toUpperCase();return t==="S"||t==="M"||t==="L"?t:"M"}function Ot(e,t=3){const n=e/Math.max(t,.5);return n<=2?"S":n<=4?"M":"L"}function N(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function V(e,t=W){return e.assignments.reduce((n,a)=>n+X(a.size,t),0)}function ue(e,t){return e.assignments.some(n=>n.teamId===t)}function kt(e,t){const n=new Date(e+"T12:00:00");return n.setDate(n.getDate()+t),n.toISOString().slice(0,10)}function B(e,t){return kt(e,t*7)}function me(e){return e.reduce((t,n)=>n.endDate!==t.endDate?n.endDate>t.endDate?n:t:n.estimatePw!==t.estimatePw?n.estimatePw>t.estimatePw?n:t:n.durationWeeks>t.durationWeeks?n:t)}function $(e){const[t,n,a]=e.split("-");return`${a}.${n}.${t}`}function ot(e=new Date){const t=new Date(e),n=t.getDay(),a=n===0?-6:1-n;return t.setDate(t.getDate()+a),t.toISOString().slice(0,10)}function J(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?ot():ot(new Date(e.slice(0,10)+"T12:00:00"))}function pe(e,t){const n=new Date(J(e)+"T12:00:00").getTime(),a=new Date(J(t)+"T12:00:00").getTime();return Math.max(0,Math.round((a-n)/(168*3600*1e3)))}function tt(e,t=W){return[...e].sort((n,a)=>{const r=n.manualRank,s=a.manualRank;if(r!=null&&s!=null&&r!==s)return r-s;if(r!=null&&s==null)return-1;if(r==null&&s!=null)return 1;const i=N(a)-N(n);return i!==0?i:V(n,t)-V(a,t)})}function rt(e,t,n){return e.find(a=>a.id!==n&&a.manualRank!=null&&a.manualRank===t)}function wt(e,t,n,a=W){const r=tt(e,a),s=r.findIndex(o=>o.id===t);if(s<0)return e;const i=[...r],[l]=i.splice(s,1),c=Math.max(0,Math.min(i.length,Math.round(n)-1));i.splice(c,0,l);const d=new Map(i.map((o,f)=>[o.id,f+1]));return e.map(o=>{const f=d.get(o.id);return f==null||o.manualRank===f?o:{...o,manualRank:f}})}function fe(e,t,n=W){if(t.length<2)return e;const a=tt(e,n),r=new Set(t),s=new Map(e.map(o=>[o.id,o])),i=t.map(o=>s.get(o)).filter(o=>!!o);let l=0;const c=[];for(const o of a)if(r.has(o.id)){const f=i[l++];f&&c.push(f)}else c.push(o);for(;l<i.length;)c.push(i[l++]);const d=new Map(c.map((o,f)=>[o.id,f+1]));return e.map(o=>{const f=d.get(o.id);return f==null||o.manualRank===f?o:{...o,manualRank:f}})}function et(e){let t=0;for(const n of e)n.manualRank!=null&&n.manualRank>t&&(t=n.manualRank);return t+1}function Q(e,t=W){const n=[...e].sort((l,c)=>{const d=N(c)-N(l);return d!==0?d:V(l,t)-V(c,t)}),a=new Set,r=new Map;for(const l of n){const c=l.manualRank;c!=null&&Number.isFinite(c)&&c>=1&&!a.has(c)&&(a.add(c),r.set(l.id,c))}let s=1;const i=()=>{for(;a.has(s);)s+=1;const l=s;return a.add(l),s+=1,l};return e.map(l=>{const c=r.get(l.id)??i();return l.manualRank===c?l:{...l,manualRank:c}})}function $t(e){const t=e.sizeRanges??W,n=e.items.filter(o=>o.status!=="done"),a=tt(n,t),r=new Map;for(const o of e.teams)r.set(o.id,[]);for(const o of a)for(const f of o.assignments){const g=r.get(f.teamId)??[];g.push({item:o,size:f.size,workStartDate:J(f.workStartDate||e.startDate)}),r.set(f.teamId,g)}const s=[],i={},l=52;for(const o of e.teams){const f=r.get(o.id)??[],g=Array.from({length:l},(h,y)=>({week:y,weekStart:B(e.startDate,y),usedPw:0,capacityPw:o.capacityPw,items:[]}));let b=0;f.forEach((h,y)=>{const w=X(h.size,t),D=pe(e.startDate,h.workStartDate);let L=Math.max(b,D);for(;L<l&&g[L].usedPw>=o.capacityPw-.001;)L+=1;let E=w,I=L,M=B(e.startDate,L);const R=B(e.startDate,L);for(;E>.001&&I<l;){const q=g[I],T=Math.max(0,o.capacityPw-q.usedPw);if(T<=.001){I+=1;continue}const _=Math.min(T,E),u=B(e.startDate,I),v=_/o.capacityPw*7,k=q.usedPw/o.capacityPw*7;M=kt(u,k+v),q.usedPw+=_,q.items.includes(h.item.id)||q.items.push(h.item.id),E-=_,E>.001&&(I+=1)}const F=o.capacityPw>0?Math.round(w/o.capacityPw*100)/100:w;s.push({item:h.item,teamId:o.id,size:h.size,estimatePw:w,wsjf:N(h.item),effectiveRank:y+1,plannedStartDate:h.workStartDate,startWeek:L,endWeek:I,startDate:R,endDate:M,waitWeeks:L,delayedByQueue:L>D,durationWeeks:F}),b=I,g[b]&&g[b].usedPw>=o.capacityPw-.001?b=I+1:b=I}),i[o.id]=g}const c=new Map;for(const o of s){const f=c.get(o.item.id)??[];f.push(o),c.set(o.item.id,f)}const d=[];for(const o of a){const f=c.get(o.id)??[];if(!f.length)continue;const g=me(f),b=f.reduce((h,y)=>y.startWeek<h.startWeek?y:h);d.push({item:o,slices:[...f].sort((h,y)=>h.endDate===y.endDate?y.estimatePw-h.estimatePw:h.endDate<y.endDate?1:-1),wsjf:N(o),totalEstimateWeeks:V(o,t),startWeek:b.startWeek,endWeek:g.endWeek,startDate:b.startDate,endDate:g.endDate,waitWeeks:b.waitWeeks,bottleneckTeamId:g.teamId})}return s.sort((o,f)=>o.startWeek!==f.startWeek?o.startWeek-f.startWeek:f.wsjf-o.wsjf),{slices:s,rollups:d,load:i}}function nt(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function St(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const n=J(String(t.startDate??ot())),a=t.teams.map(l=>{const c=l,d=Number(c.capacityPw),o=Number.isFinite(d)&&d>0?d:null,f=c.capacity!=null?{S:2,M:3.5,L:5}[ht(c.capacity)]:null;return{id:String(c.id??nt("team")),name:String(c.name??"Команда"),color:String(c.color??"#737373"),capacityPw:o??f??3}}),r=new Map(a.map(l=>[l.id,l.capacityPw])),s=t.items.map(l=>{const c=l;let d=[];return Array.isArray(c.assignments)&&c.assignments.length?d=c.assignments.filter(o=>o&&typeof o.teamId=="string").map(o=>{const f=String(o.teamId),g=r.get(f)??3,b=o.size!=null?ht(o.size):Ot(Number(o.estimatePw)||1,g);return{teamId:f,size:b,workStartDate:J(String(o.workStartDate||c.workStartDate||n))}}):typeof c.teamId=="string"&&(d=[{teamId:c.teamId,size:Ot(Number(c.estimatePw)||1,r.get(c.teamId)??3),workStartDate:n}]),!d.length&&a[0]&&(d=[{teamId:a[0].id,size:"M",workStartDate:n}]),{id:String(c.id??nt("item")),title:String(c.title??"Без названия"),type:c.type==="project"?"project":"product",backlog:String(c.backlog??"Backlog"),assignments:d,status:["idea","ready","in_progress","blocked","done"].includes(String(c.status))?c.status:"idea",owner:String(c.owner??"—"),businessValue:Number(c.businessValue)||5,timeCriticality:Number(c.timeCriticality)||5,riskReduction:Number(c.riskReduction)||5,jobSize:Number(c.jobSize)||5,notes:c.notes!=null?String(c.notes):void 0,manualRank:c.manualRank==null||c.manualRank===""?null:Number(c.manualRank)}}),i=yt(t.sizeRanges);return{version:3,startDate:n,teams:a,sizeRanges:i,items:Q(s,i)}}const O=ot(),Lt=B(O,1),ct=B(O,2),Nt=B(O,3),xt=B(O,4),Dt=B(O,6),Bt=B(O,8),Ht={version:3,startDate:O,sizeRanges:{S:{...W.S},M:{...W.M},L:{...W.L}},teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#d60000"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#455a64"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#737373"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#e65100"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"M",workStartDate:O}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",size:"S",workStartDate:Lt}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"S",workStartDate:xt}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",size:"S",workStartDate:O}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",size:"S",workStartDate:Dt}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",size:"M",workStartDate:O},{teamId:"data",size:"M",workStartDate:Nt}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",size:"M",workStartDate:Lt},{teamId:"crm",size:"S",workStartDate:xt}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",size:"M",workStartDate:ct},{teamId:"platform",size:"S",workStartDate:ct}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",size:"M",workStartDate:Lt},{teamId:"platform",size:"S",workStartDate:O}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",size:"M",workStartDate:O},{teamId:"platform",size:"S",workStartDate:ct},{teamId:"mobile",size:"S",workStartDate:Dt}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",size:"M",workStartDate:Nt},{teamId:"data",size:"S",workStartDate:xt},{teamId:"mobile",size:"S",workStartDate:Bt}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",size:"L",workStartDate:ct},{teamId:"platform",size:"S",workStartDate:Dt},{teamId:"mobile",size:"S",workStartDate:Bt}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},Et={...Ht,items:Q(Ht.items)},Vt="vi-planer-v3";let Ut="idle",lt=[];function ve(){return null}function Jt(){return Ut}function ge(e){return lt.push(e),()=>{lt=lt.filter(t=>t!==e)}}function at(e){Ut=e,lt.forEach(t=>t(e))}function ye(){try{const e=localStorage.getItem(Vt)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=St(JSON.parse(e));return t?{...t,items:Q(t.items,t.sizeRanges)}:null}catch{return null}}function Kt(e){localStorage.setItem(Vt,JSON.stringify(e))}async function be(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),n=St(t.state);return n?{...n,items:Q(n.items,n.sizeRanges)}:null}catch{return null}}async function he(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function ke(){return null}async function we(e){return!1}async function $e(){at("loading");const e=await be()??await ke()??ye()??structuredClone(Et);return Kt(e),at((ve(),"saved")),e}let Pt=null,Rt=null;function dt(e){Kt(e),Rt=e,Pt&&clearTimeout(Pt),Pt=setTimeout(async()=>{const t=Rt;if(Rt=null,!t)return;at("loading");const n=await we(),a=n?!0:await he(t);if(n||a){at("saved");return}at("offline")},350)}function Yt(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function Gt(e){const t=document.querySelector(`script[data-pdf-lib="${e}"]`);return t?t.dataset.loaded==="1"?Promise.resolve():new Promise((n,a)=>{t.addEventListener("load",()=>n()),t.addEventListener("error",()=>a(new Error(`Failed to load ${e}`)))}):new Promise((n,a)=>{const r=document.createElement("script");r.src=e,r.async=!0,r.dataset.pdfLib=e,r.onload=()=>{r.dataset.loaded="1",n()},r.onerror=()=>a(new Error(`Failed to load ${e}`)),document.head.appendChild(r)})}async function Se(){var n,a;window.html2canvas||await Gt("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(n=window.jspdf)!=null&&n.jsPDF||await Gt("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const e=window.html2canvas,t=(a=window.jspdf)==null?void 0:a.jsPDF;if(!e||!t)throw new Error("PDF libraries failed to load");return{html2canvas:e,jsPDF:t}}async function Le(e,t,n){const{html2canvas:a,jsPDF:r}=await Se(),s=await a(e,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f4f4f4",logging:!1,windowWidth:Math.max(e.scrollWidth,e.clientWidth),windowHeight:Math.max(e.scrollHeight,e.clientHeight)}),i=s.toDataURL("image/png"),l=new r({orientation:"landscape",unit:"mm",format:"a4"}),c=l.internal.pageSize.getWidth(),d=l.internal.pageSize.getHeight(),o=8,f=8,g=c-o*2,b=d-o*2-f,h=g,y=s.height*h/s.width;let w=y,D=o+f,L=0;for(;w>0;){L>0&&l.addPage(),L===0&&(l.setFontSize(11),l.setTextColor(15,23,42),l.text(n,o,o+4)),l.addImage(i,"PNG",o,D,h,y);const E=L===0?b:d-o*2;if(w-=E,D-=E,L+=1,L>40)break}l.save(t)}const It={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды",settings:"Настройки"},m={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16,hiddenCols:[],colPickerOpen:!1};let p=structuredClone(Et);function A(){return p.sizeRanges}function U(e){return p.teams.find(t=>t.id===e)}function Mt(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function Xt(e){return new Map(e.map(t=>[t.item.id,t]))}function xe(e){return e.assignments.map(t=>t.size).join(" + ")}function De(e,t){return e.filter(n=>n.teamId===t).reduce((n,a)=>n+a.estimatePw,0)}function Ee(e){return Y.map(t=>`<option value="${t}" ${e===t?"selected":""}>${Ft(t,A())}</option>`).join("")}function Pe(e){return e.assignments.map(t=>{const n=U(t.teamId);return(n==null?void 0:n.name)??t.teamId}).join(", ")}function Re(e){return`<div class="teams-stack">${e.assignments.map(n=>{const a=U(n.teamId),r=(a==null?void 0:a.name)??n.teamId,s=`${r} ${n.size} · старт ${$(n.workStartDate)}`;return`<span class="team-chip" title="${G(s)}"><span class="team-chip-name"><span class="team-dot" style="background:${(a==null?void 0:a.color)??"#94a3b8"}"></span><span class="team-chip-text">${x(r)}</span></span><span class="team-chip-estimate"><span class="size-badge mono">${n.size}</span><span class="mono muted-inline">старт ${$(n.workStartDate)}</span></span></span>`}).join("")}</div>`}function Ie(e){const t=m.query.trim().toLowerCase(),n=Xt(e),a=p.items.filter(s=>m.typeFilter!=="all"&&s.type!==m.typeFilter||m.teamFilter!=="all"&&!ue(s,m.teamFilter)||m.statusFilter!=="all"&&s.status!==m.statusFilter?!1:t?s.title.toLowerCase().includes(t)||s.backlog.toLowerCase().includes(t)||s.owner.toLowerCase().includes(t)||Pe(s).toLowerCase().includes(t):!0);if(m.sortKey==="priority"){const s=tt(a);return m.sortDir==="asc"?s:[...s].reverse()}const r=m.sortDir==="asc"?1:-1;return[...a].sort((s,i)=>{var c,d;let l=0;if(m.sortKey==="wsjf")l=N(s)-N(i);else if(m.sortKey==="estimate")l=V(s,A())-V(i,A());else{const o=((c=n.get(s.id))==null?void 0:c.endDate)??"9999-99-99",f=((d=n.get(i.id))==null?void 0:d.endDate)??"9999-99-99";l=o<f?-1:o>f?1:0}return l!==0?l*r:s.title.localeCompare(i.title,"ru")})}const zt="vi-planer-col-widths",Qt="vi-planer-col-hidden",Zt=["type","teams","status","wsjf","estimate","eta"],Me=["priority","type","title","teams","status","wsjf","estimate","eta"],jt={priority:"Приоритет",type:"Тип",title:"Инициатива / исходный бэклог",teams:"Команды (майка · старт)",status:"Статус",wsjf:"WSJF",estimate:"Оценка, майки",eta:"ETA"},ze={priority:96,type:88,title:260,teams:220,status:130,wsjf:72,estimate:120,eta:140};function te(){try{const e=localStorage.getItem(zt);return e?JSON.parse(e):{}}catch{return{}}}function je(e){localStorage.setItem(zt,JSON.stringify(e))}function Ce(){localStorage.removeItem(zt)}function qe(){try{const e=localStorage.getItem(Qt);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(n=>Zt.includes(n)):[]}catch{return[]}}function ee(e){localStorage.setItem(Qt,JSON.stringify(e))}function ut(e){return e==="priority"||e==="title"?!0:!m.hiddenCols.includes(e)}function _e(){return Me.filter(ut).length}function Te(e,t){const n=t?m.hiddenCols.filter(a=>a!==e):m.hiddenCols.includes(e)?m.hiddenCols:[...m.hiddenCols,e];m.hiddenCols=n,ee(n),C()}const Ct={};function ne(e,t){if(t&&Ct[t]!=null)return Ct[t];const n=document.createElement("span");n.textContent=e,n.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:IBM Plex Sans,system-ui,sans-serif;padding:0;",document.body.appendChild(n);const a=Math.ceil(n.getBoundingClientRect().width);n.remove();const r=Math.max(56,a+36);return t&&(Ct[t]=r),r}function We(e){const t=te()[e],n=ne(jt[e],e);return`width:${Math.max(n,t??ze[e])}px;min-width:${n}px`}function st(e,t,n="",a){const r=a!=null&&m.sortKey===a,s=!r||!a?"":m.sortDir==="asc"?" ↑":" ↓",i=a?`sortable ${r?"sorted":""}`:"",l=ut(t)?"":" col-hidden",c=a?` data-sort="${a}"`:"";return`<th class="resizable-th ${i}${l} ${n}" data-col="${t}"${c}${a?' title="Сортировать"':""} style="${We(t)}"><span class="th-label">${e}${s}</span><span class="col-resize" data-col-resize="${t}" title="Изменить ширину"></span></th>`}function mt(e,t,n=""){const r={priority:"priority",wsjf:"wsjf",estimate:"estimate",eta:"eta"}[t];if(!r){const s=m.sortKey===t,i=s?m.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${s?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${i}</th>`}return st(e,r,n,t)}function Ae(){return`
    <details class="col-picker" ${m.colPickerOpen?"open":""}>
      <summary class="btn col-picker-toggle">Колонки</summary>
      <div class="col-picker-menu">
        ${Zt.map(e=>`
          <label class="col-picker-item">
            <input
              type="checkbox"
              class="col-visibility"
              data-col="${e}"
              ${ut(e)?"checked":""}
            />
            ${x(jt[e])}
          </label>`).join("")}
      </div>
    </details>
  `}let it=null;function pt(){it==null||it()}function ae(e){pt();const t=a=>{const r=a.target;e.contains(r)||(pt(),m.colPickerOpen=!1,C())};it=()=>{document.removeEventListener("mousedown",t),it=null},window.setTimeout(()=>document.addEventListener("mousedown",t),0)}function K(e,t=""){const n=[t,ut(e)?"":"col-hidden"].filter(Boolean).join(" ");return` data-col="${e}"${n?` class="${n}"`:""}`}function Fe(e){m.sortKey===e?m.sortDir=m.sortDir==="asc"?"desc":"asc":(m.sortKey=e,m.sortDir=e==="wsjf"?"desc":"asc"),C()}function Oe(e,t){const n=p.items.filter(d=>d.status!=="done"),a=n.filter(d=>d.type==="product").length,r=n.filter(d=>d.type==="project").length,s=n.filter(d=>d.assignments.length>1).length,i=e.map(d=>d.endWeek),l=i.length?Math.max(...i)+1:0,c=p.teams.filter(d=>De(t,d.id)>d.capacityPw*8).length;return`
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${n.length}</div>
        <div class="hint">${a} продуктов · ${r} проектов · ${s} кросс-командных</div>
      </div>
      <div class="metric">
        <div class="label">Горизонт портфеля</div>
        <div class="value">${l} нед.</div>
        <div class="hint">до закрытия (по bottleneck-команде)</div>
      </div>
      <div class="metric">
        <div class="label">Команд под риском</div>
        <div class="value">${c}</div>
        <div class="hint">очередь длиннее 8 недель</div>
      </div>
      <div class="metric">
        <div class="label">Старт планирования</div>
        <div class="value" style="font-size:18px">${$(p.startDate)}</div>
        <div class="hint">понедельник текущей недели</div>
      </div>
    </div>
  `}function Ne(){return`
    <details class="callout callout-cols agenda">
      <summary class="agenda-summary">Адженда</summary>
      <div class="cols-help">
        <div><span class="cols-help-k">Приоритет</span> — сквозной ранг (1 = выше); тяните строку за ⋮⋮, чтобы переставить. Сортировка других колонок приоритет не меняет</div>
        <div><span class="cols-help-k">Тип</span> — проект или продукт</div>
        <div><span class="cols-help-k">Инициатива</span> — название, исходный бэклог и владелец</div>
        <div><span class="cols-help-k">Команды</span> — кто делает, майка (S/M/L) и план старта</div>
        <div><span class="cols-help-k">Статус</span> — стадия готовности</div>
        <div><span class="cols-help-k">WSJF</span> — (BV + TC + RR) / Job Size</div>
        <div><span class="cols-help-k">Оценка</span> — майки S / M / L (недели в Настройках)</div>
        <div><span class="cols-help-k">ETA</span> — дата готовности (когда закончила последняя команда)</div>
      </div>
    </details>
  `}function Be(e,t){const n=Xt(e),a=Ie(e),r=m.sortKey==="priority",s=a.map(i=>{const l=n.get(i.id),c=N(i),d=V(i,A()),o=i.manualRank??"—",f=l?`<div class="eta-teams">${l.slices.map(g=>{const b=U(g.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(b==null?void 0:b.color)??"#64748b"}">${x((b==null?void 0:b.name)??g.teamId)}</span>: ${$(g.startDate)}→${$(g.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${r?"row-draggable":""}" data-edit="${i.id}" data-row-id="${i.id}">
          <td${K("priority","prio-cell")}>
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
          <td${K("type","type-cell")}>
            <span class="badge badge-${i.type}">${i.type==="product"?"Продукт":"Проект"}</span>
            ${i.assignments.length>1?`<div class="type-team-count">${i.assignments.length} команды</div>`:""}
          </td>
          <td${K("title","title-cell")}>
            <div class="name">${x(i.title)}</div>
            <div class="meta">${x(i.backlog)} · ${x(i.owner)}</div>
          </td>
          <td${K("teams","teams-cell")}>${Re(i)}</td>
          <td${K("status","status-cell")}><span class="badge badge-status-${i.status}">${Mt(i.status)}</span></td>
          <td${K("wsjf","wsjf-cell mono metric-num")}>${c}</td>
          <td${K("estimate","estimate-cell mono metric-num")}>
            <span class="size-badge">${xe(i)}</span>
            <div class="meta">~${d} чел·нед</div>
          </td>
          <td${K("eta",`mono eta-cell ${l&&l.waitWeeks>4?"eta-late":"eta-good"}`)}>
            ${l?`<span class="eta-final">${$(l.endDate)}</span>`:"—"}
            ${f}
          </td>
        </tr>
      `}).join("");return`
    ${Ne()}
    <div class="panel">
      <div class="panel-header">
        <h2>Единый портфель (проекты + продукты)</h2>
        <div class="filters">
          <input id="q" placeholder="Поиск…" value="${G(m.query)}" />
          <select id="typeFilter">
            <option value="all" ${m.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${m.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${m.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${p.teams.map(i=>`<option value="${i.id}" ${m.teamFilter===i.id?"selected":""}>${x(i.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(i=>`<option value="${i}" ${m.statusFilter===i?"selected":""}>${Mt(i)}</option>`).join("")}
          </select>
          ${Ae()}
          <button class="btn" id="resetFilters" title="Сбросить фильтры, сортировку и колонки">Сбросить фильтры</button>
          <button class="btn btn-primary" id="addItem">+ Инициатива</button>
        </div>
      </div>
      ${r?"":'<p class="sort-prio-hint">Сейчас сортировка не по приоритету — перестановка строк отключена, приоритеты не меняются. Верните сортировку по «Приоритет», чтобы двигать строки.</p>'}
      <div class="table-scroll-wrap">
        <div class="table-scroll-top" aria-hidden="true"><div class="table-scroll-top-inner"></div></div>
        <div class="table-scroll">
          <table class="portfolio-table">
            <thead>
              <tr>
                ${mt("Приоритет","priority")}
                ${st("Тип","type","type-cell")}
                ${st("Инициатива / исходный бэклог","title","title-cell")}
                ${st("Команды (оценка · старт)","teams")}
                ${st("Статус","status","status-cell")}
                ${mt("WSJF","wsjf","wsjf-cell")}
                ${mt("Оценка, майки","estimate","estimate-cell")}
                ${mt("ETA","eta")}
              </tr>
            </thead>
            <tbody id="portfolioBody">
              ${s||`<tr><td colspan="${_e()}" class="empty">Нет элементов по фильтру</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `}function He(e){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${p.teams.map(n=>{const a=e.filter(l=>l.teamId===n.id).sort((l,c)=>l.effectiveRank-c.effectiveRank),r=a.reduce((l,c)=>l+c.estimatePw,0),s=n.capacityPw>0?r/n.capacityPw:0,i=Math.min(100,Math.round(a.filter(l=>l.startWeek<8).reduce((l,c)=>{const d=Math.min(c.endWeek+1,8)-c.startWeek;return l+Math.max(0,d)*(c.estimatePw/Math.max(1,c.endWeek-c.startWeek+1))},0)/(n.capacityPw*8)*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${n.color}"></span>${x(n.name)}</h3>
              <div class="meta">Ёмкость ${n.capacityPw} чел·нед/нед · спрос ${r.toFixed(1)} · ~${s.toFixed(1)} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${i}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,i)}%;background:${n.color}"></span></div>
          ${a.map(l=>{const c=l.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${l.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${l.item.type}">${l.item.type==="product"?"П":"Пр"}</span> ${x(l.item.title)}</div>
                <div class="meta">WSJF ${l.wsjf} · ${l.size} (${l.estimatePw} чел·нед) · план ${$(l.plannedStartDate)}${l.delayedByQueue?" → сдвиг":""}${c>0?` · ещё ${c} ком.`:""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${$(l.startDate)} →<br/>${$(l.endDate)}
              </div>
            </div>
          `}).join("")||'<div class="empty">Очередь пуста</div>'}
        </div>
      `}).join("")}
    </div>
  `}function Ve(e){const t=p.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда команда освобождается с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${p.teams.map(a=>{const r=e.filter(d=>d.teamId===a.id).sort((d,o)=>{const f=d.item.manualRank??9999,g=o.item.manualRank??9999;return f!==g?f-g:d.effectiveRank-o.effectiveRank}),s=r.reduce((d,o)=>d+o.estimatePw,0),i=a.capacityPw>0?s/a.capacityPw:0,l=r.length?r[r.length-1].endDate:t,c=r.map((d,o)=>{const f=d.item.manualRank??"—",g=o>0?r[o-1]:null;let b="может взять сразу (очередь свободна)",h="take-now";d.startDate>d.plannedStartDate?(b=g?`ждёт очередь: после #${g.item.manualRank??"?"} «${g.item.title}»`:"сдвиг из‑за загрузки очереди",h="take-queue"):d.startDate>t&&(b=`ждёт плановый старт ${$(d.plannedStartDate)}`,h="take-plan");const y=d.item.assignments.filter(w=>w.teamId!==a.id).map(w=>{var D;return((D=U(w.teamId))==null?void 0:D.name)??w.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${f}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${d.item.type}">${d.item.type==="product"?"П":"Пр"}</span>
                  ${x(d.item.title)}
                </div>
                <div class="take-line ${h}">
                  <strong>Может взять с ${$(d.startDate)}</strong>
                  <span class="meta"> · ${x(b)}</span>
                </div>
                <div class="meta">
                  ${d.size} (${d.estimatePw} чел·нед) · план ${$(d.plannedStartDate)} · до ${$(d.endDate)}
                  ${y.length?` · ещё: ${y.map(x).join(", ")}`:""}
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
              <h3><span class="team-dot" style="background:${a.color}"></span>${x(a.name)}</h3>
              <div class="meta">Ёмкость ${a.capacityPw} чел·нед/нед · спрос ${s.toFixed(1)} · ~${i.toFixed(1)} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${$(l)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          ${c}
        </div>
      `}).join("")}
    </div>
  `}function Ue(e,t){const n=Math.max(4,...e.map(y=>y.endWeek+2),4),a=Math.max(4,Math.min(52,Math.round(m.ganttWeeks)||16));m.ganttWeeks=a;const r=tt(p.items.filter(y=>y.status!=="done")),s=new Map(r.map((y,w)=>[y.id,w])),i=100/a,l=`repeating-linear-gradient(90deg, #f5f5f5 0, #f5f5f5 calc(${i}% - 1px), #e0e0e0 calc(${i}% - 1px), #e0e0e0 ${i}%)`,c=[],d=[];p.teams.forEach((y,w)=>{const D=t.filter(E=>E.teamId===y.id).sort((E,I)=>E.effectiveRank-I.effectiveRank);if(D.length<2)return;const L=`arrow-${y.id}`;d.push(`
      <marker id="${L}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${y.color}" fill-opacity="0.85" />
      </marker>
    `);for(let E=1;E<D.length;E++){const I=D[E-1],M=D[E],R=(s.get(I.item.id)??0)+.5,F=(s.get(M.item.id)??0)+.5,q=Math.min(a-.05,I.endWeek+.92),T=Math.min(a-.05,Math.max(.08,M.startWeek+.02)),_=T-q,u=(w%4-1.5)*.08,v=Math.max(.35,Math.abs(_)*.45)+Math.abs(u),k=q+(_>=0?v:-v*.35)+u,P=T-(_>=0?v:-v*.35)+u,S=Math.abs(R-F)<.02?`M ${q} ${R} H ${T}`:`M ${q} ${R} C ${k} ${R}, ${P} ${F}, ${T} ${F}`;c.push(`<path d="${S}" fill="none" stroke="${y.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${L})" />`)}});const o=[],f=[];for(const y of r){const w=e.find(M=>M.item.id===y.id);if(!w)continue;const D=w.slices.map(M=>{const R=t.filter(_=>_.teamId===M.teamId).sort((_,u)=>_.effectiveRank-u.effectiveRank),F=R.findIndex(_=>_.item.id===y.id);if(F<=0)return null;const q=R[F-1],T=U(M.teamId);return`#${q.item.manualRank} (${(T==null?void 0:T.name)??M.teamId})`}).filter(Boolean),L=[...new Set(D)],E=L.length?`<div class="meta gantt-dep-meta">после ${L.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',I=w.slices.map(M=>{const R=U(M.teamId),F=M.startWeek/a*100,q=Math.max(1,M.endWeek-M.startWeek+1)/a*100;return`<div class="gantt-bar ${M.teamId===w.bottleneckTeamId?"gantt-bot":""}" style="left:${F}%;width:${Math.max(q,2.5)}%;background:${(R==null?void 0:R.color)??"#64748b"}" title="${G((R==null?void 0:R.name)??"")}: ${$(M.endDate)}">${x((R==null?void 0:R.name)??"")}</div>`}).join("");o.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${y.manualRank??"—"}</span> ${x(y.title)}</div>
        <div class="meta">${y.type==="product"?"Продукт":"Проект"} · ETA ${$(w.endDate)}</div>
        ${E}
      </div>
    `),f.push(`<div class="gantt-track gantt-track-multi" style="background:${l}">${I}</div>`)}const g=Math.max(1,r.length),b=a<=12?1:a<=24?2:a<=36?3:4,h=Array.from({length:a},(y,w)=>{if(!(w%b===0||w===a-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${i}%"></div>`;const L=B(p.startDate,w),[,E,I]=L.split("-");return`<div class="gantt-axis-tick" style="width:${i}%">
      <span class="gantt-axis-w">Н${w+1}</span>
      <span class="gantt-axis-d">${I}.${E}</span>
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
              <span class="meta">нед. с ${$(p.startDate)}</span>
            </div>
            ${o.join("")}
          </div>
          <div class="gantt-tracks-wrap">
            <div class="gantt-axis">${h}</div>
            <div class="gantt-tracks-col">
              <svg class="gantt-dep-layer" viewBox="0 0 ${a} ${g}" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  ${d.join("")}
                </defs>
                ${c.join("")}
              </svg>
              ${f.join("")}
            </div>
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.</p>
    </div>
  `}const qt=["#d60000","#455a64","#737373","#c62828","#e65100","#1a1a1a","#8d6e63","#546e7a","#b71c1c","#f57c00"];function se(){const e=new Set(p.teams.map(t=>t.color));return qt.find(t=>!e.has(t))??qt[p.teams.length%qt.length]}function Je(e){const t=p.sizeRanges,n=p.items.filter(i=>i.status!=="done"),a=e.map(i=>i.endWeek),r=a.length?Math.max(...a)+1:0;return`
    <div class="callout">
      Диапазоны майок — <strong>сколько недель</strong> заложено в оценке проекта (S / M / L). Для плана берётся середина диапазона.
      Изменения сразу перестраивают ETA и Gantt.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Майки (S / M / L)</h2>
        <button type="button" class="btn" id="resetSizeRanges">Сбросить по умолчанию</button>
      </div>
      <div class="size-ranges-grid">${Y.map(i=>`
    <div class="size-range-row">
      <div class="size-range-label"><span class="size-badge size-badge-lg">${i}</span></div>
      <label class="size-range-field">
        <span class="meta">от, нед.</span>
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
        <span class="meta">до, нед.</span>
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
        <strong class="mono" data-plan="${i}">${X(i,t)} нед.</strong>
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
          <strong id="settingsRangesSummary">${bt(t)}</strong>
        </div>
      </div>
    </div>
  `}function Ke(){const e={};for(const t of Y){const n=document.querySelector(`#set_${t}_min`),a=document.querySelector(`#set_${t}_max`);if(!n||!a)return null;e[t]={min:Math.round(Number(n.value)),max:Math.round(Number(a.value))}}return yt(e)}function Ye(e){var i;const t=p.sizeRanges;for(const l of Y)(i=document.querySelector(`[data-plan="${l}"]`))==null||i.replaceChildren(document.createTextNode(`${X(l,t)} нед.`));const n=e.map(l=>l.endWeek),a=n.length?Math.max(...n)+1:0,r=document.querySelector("#settingsHorizon");r&&(r.textContent=`${a} нед.`);const s=document.querySelector("#settingsSchedPreview #settingsRangesSummary");s&&(s.textContent=bt(t))}let ie;function Ge(){const e=Ke();if(!e)return;p.sizeRanges=e,dt(p);const{rollups:t}=$t(p);Ye(t);const n=document.activeElement,a=n!=null&&n.classList.contains("set-range")?n.id:null;clearTimeout(ie),ie=setTimeout(()=>{if(C(),a){const r=document.querySelector(`#${a}`);r==null||r.focus(),r==null||r.select()}},200)}function Xe(){return`
    <div class="callout">
      <strong>Ёмкость</strong> — сколько человеко-недель команда может отдать за календарную неделю.
      Оценки инициатив задаются майками (недели — в <a href="#" data-tab-jump="settings">Настройках</a>).
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Команды</h2>
      </div>
      <div id="teamsManageList">
        ${p.teams.map(t=>`
      <div class="capacity-row" data-team-row="${t.id}">
        <span class="team-dot" style="background:${t.color}"></span>
        <input
          class="team-name-input"
          type="text"
          data-team-name="${t.id}"
          value="${G(t.name)}"
          aria-label="Название команды"
        />
        <label class="team-capacity-field">
          <span class="meta">Ёмкость, чел·нед/нед</span>
          <div class="team-capacity-slider">
            <input type="range" min="1" max="8" step="0.5" value="${t.capacityPw}" data-cap="${t.id}" />
            <span class="mono capacity-label" data-cap-label="${t.id}">${t.capacityPw}</span>
          </div>
        </label>
        <button
          type="button"
          class="btn btn-ghost team-delete-btn"
          data-team-delete="${t.id}"
          title="Удалить команду"
          ${p.teams.length<=1?"disabled":""}
        >Удалить</button>
      </div>
    `).join("")||'<div class="empty">Нет команд — добавьте первую ниже</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar">
        <span class="team-dot" id="newTeamDot" style="background:${se()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">+ Команда</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function Qe(e){var d;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((d=p.teams[0])==null?void 0:d.id)??"",size:"M",workStartDate:p.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:et(p.items)},n=N(t),a=new Set(t.assignments.map(o=>o.teamId)),r=new Map(t.assignments.map(o=>[o.teamId,o.size])),s=new Map(t.assignments.map(o=>[o.teamId,o.workStartDate])),i=oe(t),l=i?ce(i,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',c=p.teams.map(o=>{const f=a.has(o.id),g=r.get(o.id)??"M",b=s.get(o.id)??p.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${o.id}" ${f?"checked":""} />
            <span class="team-dot" style="background:${o.color}"></span>
            <span class="team-assign-name">${x(o.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Майка</span>
            <select class="f_team_size" data-team="${o.id}" ${f?"":"disabled"}>${Ee(g)}</select>
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${o.id}" value="${b}" ${f?"":"disabled"} />
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
            <input id="f_title" value="${G(t.title)}" />
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
              <input id="f_backlog" value="${G(t.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${t.status===o?"selected":""}>${Mt(o)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${G(t.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: майка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${c}</div>
            <div class="meta" style="margin-top:6px">${bt(A())}. Итого ~<strong class="mono" id="liveTotalEst">${V(t,A())}</strong> чел·нед. Старт — не раньше указанной даты; если очередь занята, сдвинется позже.</div>
          </div>
          <div class="callout" style="margin:0" id="liveEtaBox">
            <strong>Пересчёт ETA</strong> (с учётом очереди и стартов)
            <div id="liveEta" style="margin-top:8px;font-size:13px;color:var(--ink)">${l}</div>
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
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??et(p.items)}" />
              <div class="meta" style="margin-top:6px">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
            </div>
            <div class="field">
              <label>Заметки</label>
              <textarea id="f_notes">${x(t.notes??"")}</textarea>
            </div>
          </div>
        </div>
        ${e?`<div class="modal-foot">
          <button class="btn" id="deleteItem" style="color:var(--bad)">Удалить</button>
        </div>`:""}
      </div>
    </div>
  `}function oe(e){const t=e.assignments.length?e.assignments:At();if(!t.length)return null;const n=e.id||"__draft__",a={...e,id:n,assignments:t},r=p.items.some(i=>i.id===n)?p.items.map(i=>i.id===n?a:i):[...p.items,a],{rollups:s}=$t({...p,items:r});return s.find(i=>i.item.id===n)??null}function re(e){const t=U(e.teamId),n=(t==null?void 0:t.capacityPw)||1,a=X(e.size,A()),r=Math.round(a/n*100)/100,s=J(e.workStartDate||p.startDate),i=kt(s,r*7);return{start:s,end:i,weeks:r}}function ce(e,t){const n=new Map(t.map(s=>[s.teamId,s])),a=e.slices.map(s=>{const i=U(s.teamId),l=n.get(s.teamId),c=l?J(l.workStartDate):s.plannedStartDate,d=l?re(l):null,o=s.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",f=s.startDate>c?` <span class="meta">(план ${$(c)}, очередь сдвинула на ${$(s.startDate)})</span>`:s.startDate<c?` <span class="meta">(ждём план ${$(c)})</span>`:"",g=d?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(d.start)} → <span class="mono">${$(d.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${x((i==null?void 0:i.name)??s.teamId)}</strong>: <span class="mono">${$(s.startDate)} → ${$(s.endDate)}</span> <span class="meta">(${s.size} · ${s.estimatePw} чел·нед ≈ ${s.durationWeeks} нед.)</span>${f}${o}${g}</div>`}).join(""),r=t.map(s=>re(s).end).reduce((s,i)=>s>i?s:i,"0000-00-00");return a+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(r)}</strong> — меняется сразу при смене даты</div>`}function x(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function G(e){return x(e).replaceAll("'","&#39;")}function ft(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),document.querySelectorAll(".confirm-ask").forEach(t=>{t.classList.remove("confirm-ask")}),(e=document.querySelector("#appConfirmPop"))==null||e.remove()}function _t(){ft()}function Ze(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-confirm-no>Нет</button>
      <button type="button" class="btn btn-primary" data-confirm-yes>Да</button>
    </div>
  `}function Tt(e,t,n,a=()=>{},r){var g,b;ft(),e.classList.add((r==null?void 0:r.anchorClass)??"confirm-ask");const s=document.createElement("div");s.id="appConfirmPop",s.className=`prio-confirm prio-confirm-float${r!=null&&r.wide?" prio-confirm-wide":""}`,s.setAttribute("data-stop-edit",""),s.innerHTML=Ze(t),document.body.appendChild(s);const i=()=>{const h=e.getBoundingClientRect(),y=s.getBoundingClientRect();let w=h.right+8,D=h.top+h.height/2-y.height/2;w+y.width>window.innerWidth-8&&(w=Math.max(8,h.left-y.width-8)),D=Math.max(8,Math.min(D,window.innerHeight-y.height-8)),s.style.left=`${w}px`,s.style.top=`${D}px`};i();const l=()=>i();window.addEventListener("scroll",l,!0),window.addEventListener("resize",l);const c=()=>{window.removeEventListener("scroll",l,!0),window.removeEventListener("resize",l),document.removeEventListener("mousedown",f,!0)},d=()=>{c(),ft(),a()},o=()=>{c(),ft(),n()},f=h=>{const y=h.target;s.contains(y)||e.contains(y)||d()};document.addEventListener("mousedown",f,!0),(g=s.querySelector("[data-confirm-yes]"))==null||g.addEventListener("click",h=>{h.stopPropagation(),o()}),(b=s.querySelector("[data-confirm-no]"))==null||b.addEventListener("click",h=>{h.stopPropagation(),d()})}function tn(e){return p.items.filter(t=>t.assignments.some(n=>n.teamId===e)).length}function en(e){p.teams=p.teams.filter(t=>t.id!==e),p.items=p.items.map(t=>({...t,assignments:t.assignments.filter(n=>n.teamId!==e)})).filter(t=>t.assignments.length>0),m.teamFilter===e&&(m.teamFilter="all"),H()}function nn(e,t){const n=U(e);if(!n)return;if(p.teams.length<=1){Tt(t,"Нельзя удалить последнюю команду.",()=>{},()=>{},{wide:!0});return}const a=tn(e),r=`${n.capacityPw} чел·нед/нед`,s=a>0?`Удалить «<strong>${x(n.name)}</strong>» (${r}/нед)?<br/>Снимется с <span class="accent">${a}</span> инициатив. Карточки без команд тоже удалятся.`:`Удалить «<strong>${x(n.name)}</strong>» (${r}/нед)?`;Tt(t,s,()=>en(e),()=>{},{wide:!0})}function Wt(e,t,n,a){Tt(e,t,n,a,{anchorClass:"prio-ask"})}function an(){if(m.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,n=null;const a=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(s=>s.classList.remove("is-dragging","drag-over"))},r=(s,i)=>{if(s===i)return;const l=Array.from(e.querySelectorAll("tr[data-row-id]")).map(g=>g.dataset.rowId),c=l.indexOf(s),d=l.indexOf(i);if(c<0||d<0)return;const o=[...l];o.splice(c,1),o.splice(d,0,s);const f=m.sortDir==="asc"?o:[...o].reverse();p.items=fe(p.items,f,A()),m.sortKey="priority",H()};e.querySelectorAll("[data-drag-handle]").forEach(s=>{const i=s.closest("tr[data-row-id]");if(!i)return;s.addEventListener("pointerdown",c=>{c.button===0&&(c.preventDefault(),c.stopPropagation(),t=i.dataset.rowId??null,n=c.pointerId,s.setPointerCapture(c.pointerId),a(),i.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),s.addEventListener("pointermove",c=>{if(t==null||c.pointerId!==n)return;const d=document.elementFromPoint(c.clientX,c.clientY),o=d==null?void 0:d.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(f=>f.classList.remove("drag-over")),o&&o.dataset.rowId!==t&&o.classList.add("drag-over")});const l=c=>{if(t==null||c.pointerId!==n)return;const d=t,o=document.elementFromPoint(c.clientX,c.clientY),f=o==null?void 0:o.closest("tr[data-row-id]"),g=f==null?void 0:f.dataset.rowId;try{s.releasePointerCapture(c.pointerId)}catch{}a(),document.body.classList.remove("prio-dragging"),t=null,n=null,g&&r(d,g)};s.addEventListener("pointerup",l),s.addEventListener("pointercancel",l)})}function C(){_t(),Z(),pt();const{slices:e,rollups:t}=$t(p),n=document.querySelector("#app");if(!n)return;const a=m.editingId!=null?p.items.find(r=>r.id===m.editingId)??null:null;n.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${Jt()}">${Yt(Jt())}</span>
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
        <h1>VI Planer — ${It[m.tab]}</h1>
        <p>Старт портфеля: ${p.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${Oe(t,e)}
      <div class="tabs no-print">
        <button class="tab ${m.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${m.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${m.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${m.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${m.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
        <button class="tab ${m.tab==="settings"?"active":""}" data-tab="settings">Настройки</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${m.tab==="portfolio"?Be(t):m.tab==="teams"?He(e):m.tab==="queuesTest"?Ve(e):m.tab==="timeline"?Ue(t,e):m.tab==="settings"?Je(t):Xe()}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${m.creating||a?Qe(a):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,sn()}function At(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const n of e){if(!n.checked)continue;const a=n.dataset.team,r=document.querySelector(`.f_team_size[data-team="${a}"]`),s=document.querySelector(`.f_team_start[data-team="${a}"]`),i=ht(r==null?void 0:r.value),l=J((s==null?void 0:s.value)||p.startDate);t.push({teamId:a,size:i,workStartDate:l})}return t}function le(){var i,l,c,d,o,f,g;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),n=At();if(e&&(e.textContent=String(n.reduce((b,h)=>b+X(h.size,A()),0)||0)),!t)return;if(!n.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const a=(m.editingId?p.items.find(b=>b.id===m.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:n,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},r={...a,id:m.editingId||"__draft__",assignments:n,title:((i=document.querySelector("#f_title"))==null?void 0:i.value.trim())||a.title,type:((l=document.querySelector("#f_type"))==null?void 0:l.value)||a.type,status:((c=document.querySelector("#f_status"))==null?void 0:c.value)||a.status,businessValue:Number((d=document.querySelector("#f_bv"))==null?void 0:d.value)||a.businessValue,timeCriticality:Number((o=document.querySelector("#f_tc"))==null?void 0:o.value)||a.timeCriticality,riskReduction:Number((f=document.querySelector("#f_rr"))==null?void 0:f.value)||a.riskReduction,jobSize:Number((g=document.querySelector("#f_js"))==null?void 0:g.value)||a.jobSize,manualRank:(()=>{var y;const b=(y=document.querySelector("#f_rank"))==null?void 0:y.value,h=Math.round(Number(b));return Number.isFinite(h)&&h>=1?h:a.manualRank??et(p.items)})()},s=oe(r);if(!s){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=ce(s,n)}function de(){const e=(s,i)=>{const l=document.querySelector(`#${s}`),c=Number(l==null?void 0:l.value);return Number.isFinite(c)?c:i},t=s=>{var i;return((i=document.querySelector(`#${s}`))==null?void 0:i.value)??""},n=At();if(!n.length)return alert("Выберите хотя бы одну команду"),null;const a=t("f_rank").trim(),r=Math.max(1,Math.round(Number(a)||et(p.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:n,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:vt(e("f_bv",5),1,10),timeCriticality:vt(e("f_tc",5),1,10),riskReduction:vt(e("f_rr",5),1,10),jobSize:vt(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:r}}function vt(e,t,n){return Math.min(n,Math.max(t,e))}function H(){dt(p),C()}function sn(){var o,f,g,b,h,y,w,D,L,E,I,M,R,F,q,T,_;document.querySelectorAll("[data-tab]").forEach(u=>{u.addEventListener("click",()=>{m.tab=u.dataset.tab,C()})}),document.querySelectorAll(".set-range").forEach(u=>{u.addEventListener("input",()=>Ge())}),(o=document.querySelector("#resetSizeRanges"))==null||o.addEventListener("click",()=>{p.sizeRanges=yt(void 0),H()});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{m.query=e.value}),e==null||e.addEventListener("change",()=>C());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{m.typeFilter=t.value,C()});const n=document.querySelector("#teamFilter");n==null||n.addEventListener("change",()=>{m.teamFilter=n.value,C()});const a=document.querySelector("#statusFilter");a==null||a.addEventListener("change",()=>{m.statusFilter=a.value,C()}),(f=document.querySelector("#addItem"))==null||f.addEventListener("click",()=>{m.creating=!0,m.editingId=null,C()}),(g=document.querySelector("#resetFilters"))==null||g.addEventListener("click",()=>{m.typeFilter="all",m.teamFilter="all",m.statusFilter="all",m.query="",m.sortKey="priority",m.sortDir="asc",m.hiddenCols=[],ee([]),Ce(),C()});const r=document.querySelector(".col-picker");r==null||r.addEventListener("toggle",()=>{m.colPickerOpen=r.open,r.open?ae(r):pt()}),m.colPickerOpen&&r&&ae(r),document.querySelectorAll(".col-visibility").forEach(u=>{u.addEventListener("change",()=>{const v=u.dataset.col;v&&Te(v,u.checked)})}),document.querySelectorAll("[data-edit]").forEach(u=>{u.addEventListener("click",v=>{v.target.closest("[data-stop-edit], .prio-input, .prio-edit, #appConfirmPop, .drag-handle")||(m.editingId=u.dataset.edit??null,m.creating=!1,C())})}),an(),document.querySelectorAll(".prio-input").forEach(u=>{const v=u.dataset.prioId,k=()=>{const S=p.items.find(z=>z.id===v);u.value=String((S==null?void 0:S.manualRank)??1)},P=()=>{const S=p.items.find(pn=>pn.id===v);if(!S)return;const z=Number(u.value);if(!Number.isFinite(z)||z<1){k();return}const j=Math.round(z);if(u.value=String(j),j===S.manualRank)return;const gt=rt(p.items,j,v),mn=gt?`Сменить на <span class="accent">${j}</span>?<br/>«${x(gt.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${j}</span>?`;Wt(u,mn,()=>{p.items=wt(p.items,v,j,A()),H()},k)};u.addEventListener("click",S=>S.stopPropagation()),u.addEventListener("mousedown",S=>S.stopPropagation()),u.addEventListener("keydown",S=>{S.key==="Enter"&&(S.preventDefault(),P()),S.key==="Escape"&&(_t(),k(),u.blur())}),u.addEventListener("change",P)}),document.querySelectorAll("[data-sort]").forEach(u=>{u.addEventListener("click",v=>{if(v.target.closest("[data-col-resize]"))return;v.stopPropagation();const k=u.dataset.sort;(k==="wsjf"||k==="estimate"||k==="eta"||k==="priority")&&Fe(k)})}),cn(),rn();const s=()=>{m.creating=!1,m.editingId=null,C()};(b=document.querySelector("#closeModal"))==null||b.addEventListener("click",s),(h=document.querySelector("#closeModal2"))==null||h.addEventListener("click",s),(y=document.querySelector("#modal"))==null||y.addEventListener("click",u=>{u.target.id==="modal"&&s()}),document.querySelectorAll(".f_team_check").forEach(u=>{u.addEventListener("change",()=>{const v=u.dataset.team,k=document.querySelector(`.f_team_size[data-team="${v}"]`),P=document.querySelector(`.f_team_start[data-team="${v}"]`);k&&(k.disabled=!u.checked),P&&(P.disabled=!u.checked),le()})});const i=document.querySelector("#teamAssignList"),l=u=>{const v=u.target;v&&(v.classList.contains("f_team_size")||v.classList.contains("f_team_start")||v.classList.contains("f_team_check"))&&le()};i==null||i.addEventListener("input",l),i==null||i.addEventListener("change",l),i==null||i.addEventListener("keyup",l),(w=document.querySelector("#saveItem"))==null||w.addEventListener("click",()=>{const u=de();if(!u)return;const v=u.manualRank??et(p.items),k=document.querySelector("#f_rank"),P=()=>{if(rt(p.items,v,null)){const j=nt("item");p.items=[...p.items,{...u,id:j,manualRank:p.items.length+1}],p.items=wt(p.items,j,v,A())}else p.items.push({...u,id:nt("item"),manualRank:v}),p.items=Q(p.items,A());m.creating=!1,m.editingId=null,H()},S=()=>{if(!m.editingId)return;const z=p.items.findIndex(gt=>gt.id===m.editingId);if(z<0)return;const j=p.items[z];v!==j.manualRank?(p.items[z]={...j,...u,manualRank:j.manualRank},p.items=wt(p.items,m.editingId,v,A())):p.items[z]={...j,...u},m.creating=!1,m.editingId=null,H()};if(m.creating){const z=rt(p.items,v,null);if(z&&k){Wt(k,`Занять <span class="accent">${v}</span>?<br/>«${x(z.title)}» сдвинется вверх.`,P,()=>{});return}P();return}if(m.editingId){const z=p.items.find(j=>j.id===m.editingId);if(z&&v!==z.manualRank&&k){const j=rt(p.items,v,m.editingId);Wt(k,j?`Сменить на <span class="accent">${v}</span>?<br/>«${x(j.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${v}</span>?`,S,()=>{});return}S()}}),(D=document.querySelector("#deleteItem"))==null||D.addEventListener("click",()=>{m.editingId&&(p.items=p.items.filter(u=>u.id!==m.editingId),m.editingId=null,H())}),["f_bv","f_tc","f_rr","f_js"].forEach(u=>{var v;(v=document.querySelector(`#${u}`))==null||v.addEventListener("input",()=>{const k=document.querySelector("#liveWsjf");if(!k)return;const P=de();P&&(k.textContent=String(N({...P})))})});const c=document.querySelector("#ganttWeeks");c==null||c.addEventListener("input",()=>{const u=Math.max(4,Math.min(52,Number(c.value)||16));m.ganttWeeks=u;const v=document.querySelector("#ganttWeeksLabel");v&&(v.textContent=`${u} нед.`)}),c==null||c.addEventListener("change",()=>{m.ganttWeeks=Math.max(4,Math.min(52,Number(c.value)||16)),C()}),document.querySelectorAll("[data-team-name]").forEach(u=>{const v=()=>{const k=u.dataset.teamName,P=p.teams.find(z=>z.id===k);if(!P)return;const S=u.value.trim()||P.name;u.value=S,S!==P.name&&(P.name=S,H())};u.addEventListener("change",v),u.addEventListener("keydown",k=>{k.key==="Enter"&&(k.preventDefault(),u.blur())})}),document.querySelectorAll("[data-cap]").forEach(u=>{u.addEventListener("input",()=>{const v=u.dataset.cap,k=p.teams.find(S=>S.id===v);if(!k)return;k.capacityPw=Number(u.value),dt(p);const P=document.querySelector(`[data-cap-label="${v}"]`);P&&(P.textContent=String(k.capacityPw))}),u.addEventListener("change",()=>C())}),document.querySelectorAll("[data-tab-jump]").forEach(u=>{u.addEventListener("click",v=>{v.preventDefault(),m.tab=u.dataset.tabJump,C()})}),document.querySelectorAll("[data-team-delete]").forEach(u=>{u.addEventListener("click",v=>{v.stopPropagation();const k=u.dataset.teamDelete;nn(k,u)})});const d=()=>{const u=document.querySelector("#newTeamName"),v=(u==null?void 0:u.value.trim())||"";if(!v){u==null||u.focus();return}p.teams.push({id:nt("team"),name:v,capacityPw:3,color:se()}),u&&(u.value=""),H()};(L=document.querySelector("#cancelNewTeam"))==null||L.addEventListener("click",()=>{const u=document.querySelector("#newTeamName");u&&(u.value=""),u==null||u.focus()}),(E=document.querySelector("#saveNewTeam"))==null||E.addEventListener("click",d),(I=document.querySelector("#newTeamName"))==null||I.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),d())}),(M=document.querySelector("#exportPdfBtn"))==null||M.addEventListener("click",()=>{dn()}),(R=document.querySelector("#downloadReqsBtn"))==null||R.addEventListener("click",()=>{ln()}),(F=document.querySelector("#exportBtn"))==null||F.addEventListener("click",()=>{const u=new Blob([JSON.stringify(p,null,2)],{type:"application/json"}),v=URL.createObjectURL(u),k=document.createElement("a");k.href=v,k.download=`vi-planer-${p.startDate}.json`,k.click(),URL.revokeObjectURL(v)}),(q=document.querySelector("#importBtn"))==null||q.addEventListener("click",()=>{var u;(u=document.querySelector("#fileInput"))==null||u.click()}),(T=document.querySelector("#fileInput"))==null||T.addEventListener("change",async u=>{var k;const v=(k=u.target.files)==null?void 0:k[0];if(v)try{const P=await v.text(),S=St(JSON.parse(P));if(!S){alert("Неверный формат файла");return}p=S,H()}catch{alert("Не удалось прочитать JSON")}}),(_=document.querySelector("#resetBtn"))==null||_.addEventListener("click",u=>{u.stopPropagation(),on(u.currentTarget)})}function Z(){var e,t;(e=document.querySelector("#resetPop"))==null||e.remove(),(t=document.querySelector("#resetBtn"))==null||t.classList.remove("reset-ask")}function on(e){var l,c;Z(),_t(),e.classList.add("reset-ask");const t=document.createElement("div");t.id="resetPop",t.className="reset-confirm",t.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(t);const n=()=>{const d=e.getBoundingClientRect(),o=t.offsetWidth,f=t.offsetHeight;let g=d.right-o,b=d.bottom+6;g<8&&(g=8),g+o>window.innerWidth-8&&(g=window.innerWidth-o-8),b+f>window.innerHeight-8&&(b=d.top-f-6),t.style.left=`${Math.max(8,g)}px`,t.style.top=`${Math.max(8,b)}px`};n();const a=()=>n();window.addEventListener("scroll",a,!0),window.addEventListener("resize",a);const r=()=>{window.removeEventListener("scroll",a,!0),window.removeEventListener("resize",a),window.removeEventListener("keydown",s),document.removeEventListener("mousedown",i)},s=d=>{d.key==="Escape"&&(r(),Z())},i=d=>{const o=d.target;t.contains(o)||e.contains(o)||(r(),Z())};(l=t.querySelector("#resetCancelBtn"))==null||l.addEventListener("click",()=>{r(),Z()}),(c=t.querySelector("#resetConfirmBtn"))==null||c.addEventListener("click",()=>{r(),Z(),p=structuredClone(Et),H()}),window.addEventListener("keydown",s),window.setTimeout(()=>document.addEventListener("mousedown",i),0)}function rn(){const e=document.querySelector(".table-scroll-wrap");if(!e)return;const t=e.querySelector(".table-scroll-top"),n=e.querySelector(".table-scroll"),a=e.querySelector(".table-scroll-top-inner"),r=e.querySelector(".portfolio-table");if(!t||!n||!a||!r)return;let s=!1;const i=()=>{a.style.width=`${r.offsetWidth}px`;const o=r.offsetWidth>n.clientWidth+1;t.style.display=o?"":"none",o&&!s&&(s=!0,t.scrollLeft=n.scrollLeft,s=!1)},l=()=>{s||(s=!0,t.scrollLeft=n.scrollLeft,s=!1)},c=()=>{s||(s=!0,n.scrollLeft=t.scrollLeft,s=!1)};i(),n.addEventListener("scroll",l),t.addEventListener("scroll",c);const d=new ResizeObserver(i);d.observe(r),d.observe(n),window.addEventListener("resize",i)}function cn(){const e=document.querySelector(".portfolio-table");e&&e.querySelectorAll("[data-col-resize]").forEach(t=>{t.addEventListener("pointerdown",n=>{n.preventDefault(),n.stopPropagation();const a=t.dataset.colResize;if(!a)return;const r=t.closest("th");if(!r)return;const s=ne(jt[a],a),i=n.clientX,l=r.getBoundingClientRect().width,c=n.pointerId;t.setPointerCapture(c),document.body.classList.add("col-resizing");const d=f=>{const g=Math.max(s,Math.round(l+(f.clientX-i)));r.style.width=`${g}px`,r.style.minWidth=`${s}px`},o=f=>{t.releasePointerCapture(c),t.removeEventListener("pointermove",d),t.removeEventListener("pointerup",o),t.removeEventListener("pointercancel",o),document.body.classList.remove("col-resizing");const g=Math.max(s,Math.round(r.getBoundingClientRect().width)),b=te();b[a]=g,je(b),r.style.width=`${g}px`};t.addEventListener("pointermove",d),t.addEventListener("pointerup",o),t.addEventListener("pointercancel",o)})})}async function ln(){const e="/vi_planer/",t=new URL("VI-Planer-requirements.md",new URL(e,window.location.href)).href;try{const n=await fetch(t);if(!n.ok)throw new Error(String(n.status));const a=await n.text(),r=new Blob([a],{type:"text/markdown;charset=utf-8"}),s=URL.createObjectURL(r),i=document.createElement("a");i.href=s,i.download="VI-Planer-requirements.md",i.click(),URL.revokeObjectURL(s)}catch(n){console.error(n),alert("Не удалось скачать файл требований")}}async function dn(){const e=document.querySelector("#exportPdfBtn"),t=document.querySelector("#pdfCapture");if(!t){alert("Не удалось найти содержимое для экспорта");return}const n=(e==null?void 0:e.textContent)??"Экспорт PDF";e&&(e.disabled=!0,e.textContent="PDF…");const a=new Date().toISOString().slice(0,10),r=`VI Planer — ${It[m.tab]} · ${a}`,s=`VI-Planer-${It[m.tab]}-${a}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await Le(t,s,r)}catch(i){console.error(i),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),e&&(e.disabled=!1,e.textContent=n)}}async function un(){p=await $e(),m.hiddenCols=qe();const e=p.items.map(n=>n.manualRank).join(",");p={...p,items:Q(p.items,A())};const t=p.items.map(n=>n.manualRank).join(",");e!==t&&dt(p),ge(n=>{const a=document.querySelector("#syncStatus");a&&(a.dataset.status=n,a.textContent=Yt(n))}),C()}un()})();
