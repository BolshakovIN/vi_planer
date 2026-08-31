(function(){"use strict";const _={S:{min:5,max:10},M:{min:10,max:20},L:{min:20,max:40}};function ft(e){const t={S:{..._.S},M:{..._.M},L:{..._.L}};if(!e||typeof e!="object")return t;for(const n of G){const a=e[n];if(!a||typeof a!="object")continue;const r=a;let s=Math.round(Number(r.min)),i=Math.round(Number(r.max));Number.isFinite(s)||(s=t[n].min),Number.isFinite(i)||(i=t[n].max),s=Math.max(1,s),i=Math.max(s,i),t[n]={min:s,max:i}}return t}function K(e,t=_){const n=t[e];return Math.round((n.min+n.max)/2)}function vt(e,t=_){const n=t[e];return`${e} (${n.min}–${n.max} дн.)`}function st(e){return G.map(t=>vt(t,e)).join(", ")}const G=["S","M","L"];function it(e){const t=String(e??"").toUpperCase();return t==="S"||t==="M"||t==="L"?t:"M"}function _t(e,t=3){const n=e/Math.max(t,.5)*7;return n<=10?"S":n<=20?"M":"L"}function se(e){return e<=2.5?"S":e<=4?"M":"L"}function O(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function V(e,t=_){return e.assignments.reduce((n,a)=>n+K(a.size,t),0)}function ie(e,t){return e.assignments.some(n=>n.teamId===t)}function gt(e,t){const n=new Date(e+"T12:00:00");return n.setDate(n.getDate()+t),n.toISOString().slice(0,10)}function H(e,t){return gt(e,t*7)}function oe(e){return e.reduce((t,n)=>n.endDate!==t.endDate?n.endDate>t.endDate?n:t:n.durationDays!==t.durationDays?n.durationDays>t.durationDays?n:t:n.durationWeeks>t.durationWeeks?n:t)}function w(e){const[t,n,a]=e.split("-");return`${a}.${n}.${t}`}function ot(e=new Date){const t=new Date(e),n=t.getDay(),a=n===0?-6:1-n;return t.setDate(t.getDate()+a),t.toISOString().slice(0,10)}function U(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?ot():ot(new Date(e.slice(0,10)+"T12:00:00"))}function re(e,t){const n=new Date(U(e)+"T12:00:00").getTime(),a=new Date(U(t)+"T12:00:00").getTime();return Math.max(0,Math.round((a-n)/(168*3600*1e3)))}function Z(e,t=_){return[...e].sort((n,a)=>{const r=n.manualRank,s=a.manualRank;if(r!=null&&s!=null&&r!==s)return r-s;if(r!=null&&s==null)return-1;if(r==null&&s!=null)return 1;const i=O(a)-O(n);return i!==0?i:V(n,t)-V(a,t)})}function rt(e,t,n){return e.find(a=>a.id!==n&&a.manualRank!=null&&a.manualRank===t)}function yt(e,t,n,a=_){const r=Z(e,a),s=r.findIndex(o=>o.id===t);if(s<0)return e;const i=[...r],[c]=i.splice(s,1),l=Math.max(0,Math.min(i.length,Math.round(n)-1));i.splice(l,0,c);const d=new Map(i.map((o,f)=>[o.id,f+1]));return e.map(o=>{const f=d.get(o.id);return f==null||o.manualRank===f?o:{...o,manualRank:f}})}function ce(e,t,n=_){if(t.length<2)return e;const a=Z(e,n),r=new Set(t),s=new Map(e.map(o=>[o.id,o])),i=t.map(o=>s.get(o)).filter(o=>!!o);let c=0;const l=[];for(const o of a)if(r.has(o.id)){const f=i[c++];f&&l.push(f)}else l.push(o);for(;c<i.length;)l.push(i[c++]);const d=new Map(l.map((o,f)=>[o.id,f+1]));return e.map(o=>{const f=d.get(o.id);return f==null||o.manualRank===f?o:{...o,manualRank:f}})}function tt(e){let t=0;for(const n of e)n.manualRank!=null&&n.manualRank>t&&(t=n.manualRank);return t+1}function X(e,t=_){const n=[...e].sort((c,l)=>{const d=O(l)-O(c);return d!==0?d:V(c,t)-V(l,t)}),a=new Set,r=new Map;for(const c of n){const l=c.manualRank;l!=null&&Number.isFinite(l)&&l>=1&&!a.has(l)&&(a.add(l),r.set(c.id,l))}let s=1;const i=()=>{for(;a.has(s);)s+=1;const c=s;return a.add(c),s+=1,c};return e.map(c=>{const l=r.get(c.id)??i();return c.manualRank===l?c:{...c,manualRank:l}})}function bt(e){const t=e.sizeRanges??_,n=e.items.filter(o=>o.status!=="done"),a=Z(n,t),r=new Map;for(const o of e.teams)r.set(o.id,[]);for(const o of a)for(const f of o.assignments){const g=r.get(f.teamId)??[];g.push({item:o,size:f.size,workStartDate:U(f.workStartDate||e.startDate)}),r.set(f.teamId,g)}const s=[],i={},c=52;for(const o of e.teams){const f=r.get(o.id)??[],g=K(o.capacity,t),b=Array.from({length:c},(y,$)=>({week:$,weekStart:H(e.startDate,$),usedDays:0,capacityDays:g,items:[]}));let h=0;f.forEach((y,$)=>{const E=K(y.size,t),M=re(e.startDate,y.workStartDate);let S=Math.max(h,M);for(;S<c&&b[S].usedDays>=g-.001;)S+=1;let P=E,D=S,I=H(e.startDate,S);const F=H(e.startDate,S);for(;P>.001&&D<c;){const q=b[D],u=Math.max(0,g-q.usedDays);if(u<=.001){D+=1;continue}const v=Math.min(u,P),k=H(e.startDate,D),L=v/g*7,x=q.usedDays/g*7;I=gt(k,x+L),q.usedDays+=v,q.items.includes(y.item.id)||q.items.push(y.item.id),P-=v,P>.001&&(D+=1)}const A=E,W=Math.round(A/7*100)/100;s.push({item:y.item,teamId:o.id,size:y.size,wsjf:O(y.item),effectiveRank:$+1,plannedStartDate:y.workStartDate,startWeek:S,endWeek:D,startDate:F,endDate:I,waitWeeks:S,delayedByQueue:S>M,durationDays:A,durationWeeks:W}),h=D,b[h]&&b[h].usedDays>=g-.001?h=D+1:h=D}),i[o.id]=b}const l=new Map;for(const o of s){const f=l.get(o.item.id)??[];f.push(o),l.set(o.item.id,f)}const d=[];for(const o of a){const f=l.get(o.id)??[];if(!f.length)continue;const g=oe(f),b=f.reduce((h,y)=>y.startWeek<h.startWeek?y:h);d.push({item:o,slices:[...f].sort((h,y)=>h.endDate===y.endDate?y.durationDays-h.durationDays:h.endDate<y.endDate?1:-1),wsjf:O(o),totalEstimateDays:V(o,t),startWeek:b.startWeek,endWeek:g.endWeek,startDate:b.startDate,endDate:g.endDate,waitWeeks:b.waitWeeks,bottleneckTeamId:g.teamId})}return s.sort((o,f)=>o.startWeek!==f.startWeek?o.startWeek-f.startWeek:f.wsjf-o.wsjf),{slices:s,rollups:d,load:i}}function et(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function kt(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const n=U(String(t.startDate??ot())),a=t.teams.map(c=>{const l=c;return{id:String(l.id??et("team")),name:String(l.name??"Команда"),color:String(l.color??"#737373"),capacity:l.capacity!=null?it(l.capacity):se(Number(l.capacityPw)||3)}}),r=new Map(a.map(c=>[c.id,c.capacity])),s=t.items.map(c=>{const l=c;let d=[];return Array.isArray(l.assignments)&&l.assignments.length?d=l.assignments.filter(o=>o&&typeof o.teamId=="string").map(o=>{const f=String(o.teamId),g=r.get(f)??"M",b=o.size!=null?it(o.size):_t(Number(o.estimatePw)||1,g==="S"?2:g==="M"?3.5:5);return{teamId:f,size:b,workStartDate:U(String(o.workStartDate||l.workStartDate||n))}}):typeof l.teamId=="string"&&(d=[{teamId:l.teamId,size:_t(Number(l.estimatePw)||1,r.get(l.teamId)==="S"?2:r.get(l.teamId)==="L"?5:3.5),workStartDate:n}]),!d.length&&a[0]&&(d=[{teamId:a[0].id,size:"M",workStartDate:n}]),{id:String(l.id??et("item")),title:String(l.title??"Без названия"),type:l.type==="project"?"project":"product",backlog:String(l.backlog??"Backlog"),assignments:d,status:["idea","ready","in_progress","blocked","done"].includes(String(l.status))?l.status:"idea",owner:String(l.owner??"—"),businessValue:Number(l.businessValue)||5,timeCriticality:Number(l.timeCriticality)||5,riskReduction:Number(l.riskReduction)||5,jobSize:Number(l.jobSize)||5,notes:l.notes!=null?String(l.notes):void 0,manualRank:l.manualRank==null||l.manualRank===""?null:Number(l.manualRank)}}),i=ft(t.sizeRanges);return{version:3,startDate:n,teams:a,sizeRanges:i,items:X(s,i)}}const N=ot(),ht=H(N,1),ct=H(N,2),Tt=H(N,3),$t=H(N,4),wt=H(N,6),At=H(N,8),Wt={version:3,startDate:N,sizeRanges:{S:{..._.S},M:{..._.M},L:{..._.L}},teams:[{id:"platform",name:"Platform",capacity:"M",color:"#d60000"},{id:"mobile",name:"Mobile",capacity:"S",color:"#455a64"},{id:"data",name:"Data & Analytics",capacity:"S",color:"#737373"},{id:"crm",name:"CRM / Sales Tech",capacity:"M",color:"#e65100"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"M",workStartDate:N}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",size:"S",workStartDate:ht}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"S",workStartDate:$t}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",size:"S",workStartDate:N}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",size:"S",workStartDate:wt}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",size:"M",workStartDate:N},{teamId:"data",size:"M",workStartDate:Tt}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",size:"M",workStartDate:ht},{teamId:"crm",size:"S",workStartDate:$t}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",size:"M",workStartDate:ct},{teamId:"platform",size:"S",workStartDate:ct}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",size:"M",workStartDate:ht},{teamId:"platform",size:"S",workStartDate:N}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",size:"M",workStartDate:N},{teamId:"platform",size:"S",workStartDate:ct},{teamId:"mobile",size:"S",workStartDate:wt}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",size:"M",workStartDate:Tt},{teamId:"data",size:"S",workStartDate:$t},{teamId:"mobile",size:"S",workStartDate:At}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",size:"L",workStartDate:ct},{teamId:"platform",size:"S",workStartDate:wt},{teamId:"mobile",size:"S",workStartDate:At}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},St={...Wt,items:X(Wt.items)},Ft="vi-planer-v3";let Nt="idle",lt=[];function le(){return null}function Bt(){return Nt}function de(e){return lt.push(e),()=>{lt=lt.filter(t=>t!==e)}}function nt(e){Nt=e,lt.forEach(t=>t(e))}function ue(){try{const e=localStorage.getItem(Ft)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=kt(JSON.parse(e));return t?{...t,items:X(t.items,t.sizeRanges)}:null}catch{return null}}function Ot(e){localStorage.setItem(Ft,JSON.stringify(e))}async function me(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),n=kt(t.state);return n?{...n,items:X(n.items,n.sizeRanges)}:null}catch{return null}}async function pe(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function fe(){return null}async function ve(e){return!1}async function ge(){nt("loading");const e=await me()??await fe()??ue()??structuredClone(St);return Ot(e),nt((le(),"saved")),e}let Dt=null,xt=null;function Lt(e){Ot(e),xt=e,Dt&&clearTimeout(Dt),Dt=setTimeout(async()=>{const t=xt;if(xt=null,!t)return;nt("loading");const n=await ve(),a=n?!0:await pe(t);if(n||a){nt("saved");return}nt("offline")},350)}function Ht(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function Vt(e){const t=document.querySelector(`script[data-pdf-lib="${e}"]`);return t?t.dataset.loaded==="1"?Promise.resolve():new Promise((n,a)=>{t.addEventListener("load",()=>n()),t.addEventListener("error",()=>a(new Error(`Failed to load ${e}`)))}):new Promise((n,a)=>{const r=document.createElement("script");r.src=e,r.async=!0,r.dataset.pdfLib=e,r.onload=()=>{r.dataset.loaded="1",n()},r.onerror=()=>a(new Error(`Failed to load ${e}`)),document.head.appendChild(r)})}async function ye(){var n,a;window.html2canvas||await Vt("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(n=window.jspdf)!=null&&n.jsPDF||await Vt("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const e=window.html2canvas,t=(a=window.jspdf)==null?void 0:a.jsPDF;if(!e||!t)throw new Error("PDF libraries failed to load");return{html2canvas:e,jsPDF:t}}async function be(e,t,n){const{html2canvas:a,jsPDF:r}=await ye(),s=await a(e,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f4f4f4",logging:!1,windowWidth:Math.max(e.scrollWidth,e.clientWidth),windowHeight:Math.max(e.scrollHeight,e.clientHeight)}),i=s.toDataURL("image/png"),c=new r({orientation:"landscape",unit:"mm",format:"a4"}),l=c.internal.pageSize.getWidth(),d=c.internal.pageSize.getHeight(),o=8,f=8,g=l-o*2,b=d-o*2-f,h=g,y=s.height*h/s.width;let $=y,E=o+f,M=0;for(;$>0;){M>0&&c.addPage(),M===0&&(c.setFontSize(11),c.setTextColor(15,23,42),c.text(n,o,o+4)),c.addImage(i,"PNG",o,E,h,y);const S=M===0?b:d-o*2;if($-=S,E-=S,M+=1,M>40)break}c.save(t)}const Rt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды",settings:"Настройки"},p={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let m=structuredClone(St);function C(){return m.sizeRanges}function J(e){return m.teams.find(t=>t.id===e)}function Et(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function Ut(e){return new Map(e.map(t=>[t.item.id,t]))}function ke(e){return e.assignments.map(t=>t.size).join(" + ")}function he(e,t){return e.filter(n=>n.teamId===t).reduce((n,a)=>n+a.durationDays,0)}function Jt(e){return G.map(t=>`<option value="${t}" ${e===t?"selected":""}>${vt(t,C())}</option>`).join("")}function $e(e){return e.assignments.map(t=>{const n=J(t.teamId);return(n==null?void 0:n.name)??t.teamId}).join(", ")}function we(e){return`<div class="teams-stack">${e.assignments.map(n=>{const a=J(n.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(a==null?void 0:a.color)??"#94a3b8"}"></span>${R((a==null?void 0:a.name)??n.teamId)} <span class="size-badge mono">${n.size}</span> <span class="mono muted-inline">старт ${w(n.workStartDate)}</span></span>`}).join("")}</div>`}function Se(e){const t=p.query.trim().toLowerCase(),n=Ut(e),a=m.items.filter(s=>p.typeFilter!=="all"&&s.type!==p.typeFilter||p.teamFilter!=="all"&&!ie(s,p.teamFilter)||p.statusFilter!=="all"&&s.status!==p.statusFilter?!1:t?s.title.toLowerCase().includes(t)||s.backlog.toLowerCase().includes(t)||s.owner.toLowerCase().includes(t)||$e(s).toLowerCase().includes(t):!0);if(p.sortKey==="priority"){const s=Z(a);return p.sortDir==="asc"?s:[...s].reverse()}const r=p.sortDir==="asc"?1:-1;return[...a].sort((s,i)=>{var l,d;let c=0;if(p.sortKey==="wsjf")c=O(s)-O(i);else if(p.sortKey==="estimate")c=V(s,C())-V(i,C());else{const o=((l=n.get(s.id))==null?void 0:l.endDate)??"9999-99-99",f=((d=n.get(i.id))==null?void 0:d.endDate)??"9999-99-99";c=o<f?-1:o>f?1:0}return c!==0?c*r:s.title.localeCompare(i.title,"ru")})}const Kt="vi-planer-col-widths",Gt={priority:"Приоритет",type:"Тип",title:"Инициатива / исходный бэклог",teams:"Команды (майка · старт)",status:"Статус",wsjf:"WSJF",estimate:"Оценка, майки",eta:"ETA"},De={priority:96,type:88,title:260,teams:220,status:130,wsjf:72,estimate:120,eta:140};function Xt(){try{const e=localStorage.getItem(Kt);return e?JSON.parse(e):{}}catch{return{}}}function xe(e){localStorage.setItem(Kt,JSON.stringify(e))}const It={};function Yt(e,t){if(t&&It[t]!=null)return It[t];const n=document.createElement("span");n.textContent=e,n.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:IBM Plex Sans,system-ui,sans-serif;padding:0;",document.body.appendChild(n);const a=Math.ceil(n.getBoundingClientRect().width);n.remove();const r=Math.max(56,a+36);return t&&(It[t]=r),r}function Le(e){const t=Xt()[e],n=Yt(Gt[e],e);return`width:${Math.max(n,t??De[e])}px;min-width:${n}px`}function at(e,t,n="",a){const r=a!=null&&p.sortKey===a,s=!r||!a?"":p.sortDir==="asc"?" ↑":" ↓",i=a?`sortable ${r?"sorted":""}`:"",c=a?` data-sort="${a}"`:"";return`<th class="resizable-th ${i} ${n}" data-col="${t}"${c}${a?' title="Сортировать"':""} style="${Le(t)}"><span class="th-label">${e}${s}</span><span class="col-resize" data-col-resize="${t}" title="Изменить ширину"></span></th>`}function dt(e,t){const a={priority:"priority",wsjf:"wsjf",estimate:"estimate",eta:"eta"}[t];if(!a){const r=p.sortKey===t,s=r?p.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${r?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${s}</th>`}return at(e,a,"",t)}function Re(e){p.sortKey===e?p.sortDir=p.sortDir==="asc"?"desc":"asc":(p.sortKey=e,p.sortDir=e==="wsjf"?"desc":"asc"),T()}function Ee(e,t){const n=m.items.filter(d=>d.status!=="done"),a=n.filter(d=>d.type==="product").length,r=n.filter(d=>d.type==="project").length,s=n.filter(d=>d.assignments.length>1).length,i=e.map(d=>d.endWeek),c=i.length?Math.max(...i)+1:0,l=m.teams.filter(d=>he(t,d.id)>56).length;return`
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
        <div class="value" style="font-size:18px">${w(m.startDate)}</div>
        <div class="hint">понедельник текущей недели</div>
      </div>
    </div>
  `}function Ie(){return`
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
  `}function Me(e,t){const n=Ut(e),a=Se(e),r=p.sortKey==="priority",s=a.map(i=>{const c=n.get(i.id),l=O(i),d=V(i,C()),o=i.manualRank??"—",f=c?`<div class="eta-teams">${c.slices.map(g=>{const b=J(g.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(b==null?void 0:b.color)??"#64748b"}">${R((b==null?void 0:b.name)??g.teamId)}</span>: ${w(g.startDate)}→${w(g.endDate)}</div>`}).join("")}</div>`:"";return`
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
            <div class="name">${R(i.title)}</div>
            <div class="meta">${R(i.backlog)} · ${R(i.owner)}</div>
          </td>
          <td>${we(i)}</td>
          <td><span class="badge badge-status-${i.status}">${Et(i.status)}</span></td>
          <td class="mono metric-num">${l}</td>
          <td class="mono metric-num">
            <span class="size-badge">${ke(i)}</span>
            <div class="meta">~${d} дн.</div>
          </td>
          <td class="mono ${c&&c.waitWeeks>4?"eta-late":"eta-good"}">
            ${c?`<span class="eta-final">${w(c.endDate)}</span>`:"—"}
            ${f}
          </td>
        </tr>
      `}).join("");return`
    ${Ie()}
    <div class="panel">
      <div class="panel-header">
        <h2>Единый портфель (проекты + продукты)</h2>
        <div class="filters">
          <input id="q" placeholder="Поиск…" value="${Y(p.query)}" />
          <select id="typeFilter">
            <option value="all" ${p.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${p.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${p.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${m.teams.map(i=>`<option value="${i.id}" ${p.teamFilter===i.id?"selected":""}>${R(i.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(i=>`<option value="${i}" ${p.statusFilter===i?"selected":""}>${Et(i)}</option>`).join("")}
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
              ${dt("Приоритет","priority")}
              ${at("Тип","type")}
              ${at("Инициатива / исходный бэклог","title")}
              ${at("Команды (оценка · старт)","teams")}
              ${at("Статус","status")}
              ${dt("WSJF","wsjf")}
              ${dt("Оценка, майки","estimate")}
              ${dt("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${s||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function ze(e){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${m.teams.map(n=>{const a=e.filter(c=>c.teamId===n.id).sort((c,l)=>c.effectiveRank-l.effectiveRank),r=a.reduce((c,l)=>c+l.durationDays,0),s=Math.round(r/7*10)/10,i=Math.min(100,Math.round(r/56*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${n.color}"></span>${R(n.name)}</h3>
              <div class="meta">${a.length} задач · ~${r} дн. · ёмк. ${n.capacity}/нед · ~${s} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${i}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,i)}%;background:${n.color}"></span></div>
          ${a.map(c=>{const l=c.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${c.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${c.item.type}">${c.item.type==="product"?"П":"Пр"}</span> ${R(c.item.title)}</div>
                <div class="meta">WSJF ${c.wsjf} · ${c.size} (${c.durationDays} дн.) · план ${w(c.plannedStartDate)}${c.delayedByQueue?" → сдвиг":""}${l>0?` · ещё ${l} ком.`:""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${w(c.startDate)} →<br/>${w(c.endDate)}
              </div>
            </div>
          `}).join("")||'<div class="empty">Очередь пуста</div>'}
        </div>
      `}).join("")}
    </div>
  `}function je(e){const t=m.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда команда освобождается с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${m.teams.map(a=>{const r=e.filter(d=>d.teamId===a.id).sort((d,o)=>{const f=d.item.manualRank??9999,g=o.item.manualRank??9999;return f!==g?f-g:d.effectiveRank-o.effectiveRank}),s=r.reduce((d,o)=>d+o.durationDays,0),i=Math.round(s/7*10)/10,c=r.length?r[r.length-1].endDate:t,l=r.map((d,o)=>{const f=d.item.manualRank??"—",g=o>0?r[o-1]:null;let b="может взять сразу (очередь свободна)",h="take-now";d.startDate>d.plannedStartDate?(b=g?`ждёт очередь: после #${g.item.manualRank??"?"} «${g.item.title}»`:"сдвиг из‑за загрузки очереди",h="take-queue"):d.startDate>t&&(b=`ждёт плановый старт ${w(d.plannedStartDate)}`,h="take-plan");const y=d.item.assignments.filter($=>$.teamId!==a.id).map($=>{var E;return((E=J($.teamId))==null?void 0:E.name)??$.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${f}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${d.item.type}">${d.item.type==="product"?"П":"Пр"}</span>
                  ${R(d.item.title)}
                </div>
                <div class="take-line ${h}">
                  <strong>Может взять с ${w(d.startDate)}</strong>
                  <span class="meta"> · ${R(b)}</span>
                </div>
                <div class="meta">
                  ${d.size} (${d.durationDays} дн.) · план ${w(d.plannedStartDate)} · до ${w(d.endDate)}
                  ${y.length?` · ещё: ${y.map(R).join(", ")}`:""}
                </div>
                <div class="take-bar" title="Окно работы в горизонте 12 нед.">
                  <span class="take-bar-fill" style="left:${d.startWeek/12*100}%;width:${Math.max(3,(d.endWeek-d.startWeek+1)/12*100)}%;background:${a.color}"></span>
                </div>
              </div>
              <div class="mono queue-item-dates">
                <div class="meta">старт</div>
                <div>${w(d.startDate)}</div>
                <div class="meta" style="margin-top:6px">конец</div>
                <div>${w(d.endDate)}</div>
              </div>
            </div>
          `}).join("")||`<div class="empty">Очередь пуста — команда свободна с ${w(t)}</div>`;return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${R(a.name)}</h3>
              <div class="meta">${r.length} задач · ~${s} дн. · ёмк. ${a.capacity}/нед · ~${i} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${w(c)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          ${l}
        </div>
      `}).join("")}
    </div>
  `}function qe(e,t){const n=Math.max(4,...e.map(y=>y.endWeek+2),4),a=Math.max(4,Math.min(52,Math.round(p.ganttWeeks)||16));p.ganttWeeks=a;const r=Z(m.items.filter(y=>y.status!=="done")),s=new Map(r.map((y,$)=>[y.id,$])),i=100/a,c=`repeating-linear-gradient(90deg, #f5f5f5 0, #f5f5f5 calc(${i}% - 1px), #e0e0e0 calc(${i}% - 1px), #e0e0e0 ${i}%)`,l=[],d=[];m.teams.forEach((y,$)=>{const E=t.filter(S=>S.teamId===y.id).sort((S,P)=>S.effectiveRank-P.effectiveRank);if(E.length<2)return;const M=`arrow-${y.id}`;d.push(`
      <marker id="${M}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${y.color}" fill-opacity="0.85" />
      </marker>
    `);for(let S=1;S<E.length;S++){const P=E[S-1],D=E[S],I=(s.get(P.item.id)??0)+.5,F=(s.get(D.item.id)??0)+.5,A=Math.min(a-.05,P.endWeek+.92),W=Math.min(a-.05,Math.max(.08,D.startWeek+.02)),q=W-A,u=($%4-1.5)*.08,v=Math.max(.35,Math.abs(q)*.45)+Math.abs(u),k=A+(q>=0?v:-v*.35)+u,L=W-(q>=0?v:-v*.35)+u,x=Math.abs(I-F)<.02?`M ${A} ${I} H ${W}`:`M ${A} ${I} C ${k} ${I}, ${L} ${F}, ${W} ${F}`;l.push(`<path d="${x}" fill="none" stroke="${y.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${M})" />`)}});const o=[],f=[];for(const y of r){const $=e.find(D=>D.item.id===y.id);if(!$)continue;const E=$.slices.map(D=>{const I=t.filter(q=>q.teamId===D.teamId).sort((q,u)=>q.effectiveRank-u.effectiveRank),F=I.findIndex(q=>q.item.id===y.id);if(F<=0)return null;const A=I[F-1],W=J(D.teamId);return`#${A.item.manualRank} (${(W==null?void 0:W.name)??D.teamId})`}).filter(Boolean),M=[...new Set(E)],S=M.length?`<div class="meta gantt-dep-meta">после ${M.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',P=$.slices.map(D=>{const I=J(D.teamId),F=D.startWeek/a*100,A=Math.max(1,D.endWeek-D.startWeek+1)/a*100;return`<div class="gantt-bar ${D.teamId===$.bottleneckTeamId?"gantt-bot":""}" style="left:${F}%;width:${Math.max(A,2.5)}%;background:${(I==null?void 0:I.color)??"#64748b"}" title="${Y((I==null?void 0:I.name)??"")}: ${w(D.endDate)}">${R((I==null?void 0:I.name)??"")}</div>`}).join("");o.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${y.manualRank??"—"}</span> ${R(y.title)}</div>
        <div class="meta">${y.type==="product"?"Продукт":"Проект"} · ETA ${w($.endDate)}</div>
        ${S}
      </div>
    `),f.push(`<div class="gantt-track gantt-track-multi" style="background:${c}">${P}</div>`)}const g=Math.max(1,r.length),b=a<=12?1:a<=24?2:a<=36?3:4,h=Array.from({length:a},(y,$)=>{if(!($%b===0||$===a-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${i}%"></div>`;const M=H(m.startDate,$),[,S,P]=M.split("-");return`<div class="gantt-axis-tick" style="width:${i}%">
      <span class="gantt-axis-w">Н${$+1}</span>
      <span class="gantt-axis-d">${P}.${S}</span>
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
              <span class="meta">нед. с ${w(m.startDate)}</span>
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
                ${l.join("")}
              </svg>
              ${f.join("")}
            </div>
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.</p>
    </div>
  `}const Mt=["#d60000","#455a64","#737373","#c62828","#e65100","#1a1a1a","#8d6e63","#546e7a","#b71c1c","#f57c00"];function zt(){const e=new Set(m.teams.map(t=>t.color));return Mt.find(t=>!e.has(t))??Mt[m.teams.length%Mt.length]}function Ce(e){const t=m.sizeRanges,n=m.items.filter(i=>i.status!=="done"),a=e.map(i=>i.endWeek),r=a.length?Math.max(...a)+1:0;return`
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
          <strong id="settingsRangesSummary">${st(t)}</strong>
        </div>
      </div>
    </div>
  `}function Pe(){const e={};for(const t of G){const n=document.querySelector(`#set_${t}_min`),a=document.querySelector(`#set_${t}_max`);if(!n||!a)return null;e[t]={min:Math.round(Number(n.value)),max:Math.round(Number(a.value))}}return ft(e)}function _e(e){var i;const t=m.sizeRanges;for(const c of G)(i=document.querySelector(`[data-plan="${c}"]`))==null||i.replaceChildren(document.createTextNode(`${K(c,t)} дн.`));const n=e.map(c=>c.endWeek),a=n.length?Math.max(...n)+1:0,r=document.querySelector("#settingsHorizon");r&&(r.textContent=`${a} нед.`);const s=document.querySelector("#settingsSchedPreview #settingsRangesSummary");s&&(s.textContent=st(t))}let Qt;function Te(){const e=Pe();if(!e)return;m.sizeRanges=e,Lt(m);const{rollups:t}=bt(m);_e(t);const n=document.activeElement,a=n!=null&&n.classList.contains("set-range")?n.id:null;clearTimeout(Qt),Qt=setTimeout(()=>{if(T(),a){const r=document.querySelector(`#${a}`);r==null||r.focus(),r==null||r.select()}},200)}function Ae(){const e=m.teams.map(t=>`
      <div class="capacity-row" data-team-row="${t.id}">
        <span class="team-dot" style="background:${t.color}"></span>
        <input
          class="team-name-input"
          type="text"
          data-team-name="${t.id}"
          value="${Y(t.name)}"
          aria-label="Название команды"
        />
        <label class="team-capacity-field">
          <span class="meta">Ёмкость / нед.</span>
          <select class="team-capacity-select" data-team-capacity="${t.id}" aria-label="Ёмкость команды">
            ${Jt(t.capacity)}
          </select>
        </label>
        <button
          type="button"
          class="btn btn-ghost team-delete-btn"
          data-team-delete="${t.id}"
          title="Удалить команду"
          ${m.teams.length<=1?"disabled":""}
        >Удалить</button>
      </div>
    `).join("");return`
    <div class="callout">
      <strong>Ёмкость</strong> — сколько работы команда тянет в неделю, в майках (${st(C())}).
      Чем крупнее майка, тем быстрее закрывается очередь. Оценки инициатив задаются отдельно по каждой команде.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Команды</h2>
        <button class="btn btn-primary" id="addTeam">+ Команда</button>
      </div>
      <div id="teamsManageList">
        ${e||'<div class="empty">Нет команд — создайте первую</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar" hidden>
        <span class="team-dot" id="newTeamDot" style="background:${zt()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">Создать</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function We(e){var d;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((d=m.teams[0])==null?void 0:d.id)??"",size:"M",workStartDate:m.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:tt(m.items)},n=O(t),a=new Set(t.assignments.map(o=>o.teamId)),r=new Map(t.assignments.map(o=>[o.teamId,o.size])),s=new Map(t.assignments.map(o=>[o.teamId,o.workStartDate])),i=Zt(t),c=i?ee(i,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',l=m.teams.map(o=>{const f=a.has(o.id),g=r.get(o.id)??"M",b=s.get(o.id)??m.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${o.id}" ${f?"checked":""} />
            <span class="team-dot" style="background:${o.color}"></span>
            <span class="team-assign-name">${R(o.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Майка</span>
            <select class="f_team_size" data-team="${o.id}" ${f?"":"disabled"}>${Jt(g)}</select>
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
                ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${t.status===o?"selected":""}>${Et(o)}</option>`).join("")}
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
            <div class="meta" style="margin-top:6px">${st(C())}. Итого ~<strong class="mono" id="liveTotalEst">${V(t,C())}</strong> дн. Старт — не раньше указанной даты; если очередь занята, сдвинется позже.</div>
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
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??tt(m.items)}" />
              <div class="meta" style="margin-top:6px">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
            </div>
            <div class="field">
              <label>Заметки</label>
              <textarea id="f_notes">${R(t.notes??"")}</textarea>
            </div>
          </div>
        </div>
        ${e?`<div class="modal-foot">
          <button class="btn" id="deleteItem" style="color:var(--bad)">Удалить</button>
        </div>`:""}
      </div>
    </div>
  `}function Zt(e){const t=e.assignments.length?e.assignments:Pt();if(!t.length)return null;const n=e.id||"__draft__",a={...e,id:n,assignments:t},r=m.items.some(i=>i.id===n)?m.items.map(i=>i.id===n?a:i):[...m.items,a],{rollups:s}=bt({...m,items:r});return s.find(i=>i.item.id===n)??null}function te(e){const t=K(e.size,C()),n=U(e.workStartDate||m.startDate),a=gt(n,t);return{start:n,end:a,days:t}}function ee(e,t){const n=new Map(t.map(s=>[s.teamId,s])),a=e.slices.map(s=>{const i=J(s.teamId),c=n.get(s.teamId),l=c?U(c.workStartDate):s.plannedStartDate,d=c?te(c):null,o=s.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",f=s.startDate>l?` <span class="meta">(план ${w(l)}, очередь сдвинула на ${w(s.startDate)})</span>`:s.startDate<l?` <span class="meta">(ждём план ${w(l)})</span>`:"",g=d?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${w(d.start)} → <span class="mono">${w(d.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${R((i==null?void 0:i.name)??s.teamId)}</strong>: <span class="mono">${w(s.startDate)} → ${w(s.endDate)}</span> <span class="meta">(${s.size} · ~${s.durationDays} дн.)</span>${f}${o}${g}</div>`}).join(""),r=t.map(s=>te(s).end).reduce((s,i)=>s>i?s:i,"0000-00-00");return a+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${w(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${w(r)}</strong> — меняется сразу при смене даты</div>`}function R(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function Y(e){return R(e).replaceAll("'","&#39;")}function ut(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),document.querySelectorAll(".confirm-ask").forEach(t=>{t.classList.remove("confirm-ask")}),(e=document.querySelector("#appConfirmPop"))==null||e.remove()}function jt(){ut()}function Fe(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-confirm-no>Нет</button>
      <button type="button" class="btn btn-primary" data-confirm-yes>Да</button>
    </div>
  `}function qt(e,t,n,a=()=>{},r){var g,b;ut(),e.classList.add((r==null?void 0:r.anchorClass)??"confirm-ask");const s=document.createElement("div");s.id="appConfirmPop",s.className=`prio-confirm prio-confirm-float${r!=null&&r.wide?" prio-confirm-wide":""}`,s.setAttribute("data-stop-edit",""),s.innerHTML=Fe(t),document.body.appendChild(s);const i=()=>{const h=e.getBoundingClientRect(),y=s.getBoundingClientRect();let $=h.right+8,E=h.top+h.height/2-y.height/2;$+y.width>window.innerWidth-8&&($=Math.max(8,h.left-y.width-8)),E=Math.max(8,Math.min(E,window.innerHeight-y.height-8)),s.style.left=`${$}px`,s.style.top=`${E}px`};i();const c=()=>i();window.addEventListener("scroll",c,!0),window.addEventListener("resize",c);const l=()=>{window.removeEventListener("scroll",c,!0),window.removeEventListener("resize",c),document.removeEventListener("mousedown",f,!0)},d=()=>{l(),ut(),a()},o=()=>{l(),ut(),n()},f=h=>{const y=h.target;s.contains(y)||e.contains(y)||d()};document.addEventListener("mousedown",f,!0),(g=s.querySelector("[data-confirm-yes]"))==null||g.addEventListener("click",h=>{h.stopPropagation(),o()}),(b=s.querySelector("[data-confirm-no]"))==null||b.addEventListener("click",h=>{h.stopPropagation(),d()})}function Ne(e){return m.items.filter(t=>t.assignments.some(n=>n.teamId===e)).length}function Be(e){m.teams=m.teams.filter(t=>t.id!==e),m.items=m.items.map(t=>({...t,assignments:t.assignments.filter(n=>n.teamId!==e)})).filter(t=>t.assignments.length>0),p.teamFilter===e&&(p.teamFilter="all"),B()}function Oe(e,t){const n=J(e);if(!n)return;if(m.teams.length<=1){qt(t,"Нельзя удалить последнюю команду.",()=>{},()=>{},{wide:!0});return}const a=Ne(e),r=vt(n.capacity,C()),s=a>0?`Удалить «<strong>${R(n.name)}</strong>» (${r}/нед)?<br/>Снимется с <span class="accent">${a}</span> инициатив. Карточки без команд тоже удалятся.`:`Удалить «<strong>${R(n.name)}</strong>» (${r}/нед)?`;qt(t,s,()=>Be(e),()=>{},{wide:!0})}function Ct(e,t,n,a){qt(e,t,n,a,{anchorClass:"prio-ask"})}function He(){if(p.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,n=null;const a=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(s=>s.classList.remove("is-dragging","drag-over"))},r=(s,i)=>{if(s===i)return;const c=Array.from(e.querySelectorAll("tr[data-row-id]")).map(g=>g.dataset.rowId),l=c.indexOf(s),d=c.indexOf(i);if(l<0||d<0)return;const o=[...c];o.splice(l,1),o.splice(d,0,s);const f=p.sortDir==="asc"?o:[...o].reverse();m.items=ce(m.items,f,C()),p.sortKey="priority",B()};e.querySelectorAll("[data-drag-handle]").forEach(s=>{const i=s.closest("tr[data-row-id]");if(!i)return;s.addEventListener("pointerdown",l=>{l.button===0&&(l.preventDefault(),l.stopPropagation(),t=i.dataset.rowId??null,n=l.pointerId,s.setPointerCapture(l.pointerId),a(),i.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),s.addEventListener("pointermove",l=>{if(t==null||l.pointerId!==n)return;const d=document.elementFromPoint(l.clientX,l.clientY),o=d==null?void 0:d.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(f=>f.classList.remove("drag-over")),o&&o.dataset.rowId!==t&&o.classList.add("drag-over")});const c=l=>{if(t==null||l.pointerId!==n)return;const d=t,o=document.elementFromPoint(l.clientX,l.clientY),f=o==null?void 0:o.closest("tr[data-row-id]"),g=f==null?void 0:f.dataset.rowId;try{s.releasePointerCapture(l.pointerId)}catch{}a(),document.body.classList.remove("prio-dragging"),t=null,n=null,g&&r(d,g)};s.addEventListener("pointerup",c),s.addEventListener("pointercancel",c)})}function T(){jt(),Q();const{slices:e,rollups:t}=bt(m),n=document.querySelector("#app");if(!n)return;const a=p.editingId!=null?m.items.find(r=>r.id===p.editingId)??null:null;n.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${Bt()}">${Ht(Bt())}</span>
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
        <h1>VI Planer — ${Rt[p.tab]}</h1>
        <p>Старт портфеля: ${m.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${Ee(t,e)}
      <div class="tabs no-print">
        <button class="tab ${p.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${p.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${p.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${p.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${p.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
        <button class="tab ${p.tab==="settings"?"active":""}" data-tab="settings">Настройки</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${p.tab==="portfolio"?Me(t):p.tab==="teams"?ze(e):p.tab==="queuesTest"?je(e):p.tab==="timeline"?qe(t,e):p.tab==="settings"?Ce(t):Ae()}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${p.creating||a?We(a):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,Ve()}function Pt(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const n of e){if(!n.checked)continue;const a=n.dataset.team,r=document.querySelector(`.f_team_size[data-team="${a}"]`),s=document.querySelector(`.f_team_start[data-team="${a}"]`),i=it(r==null?void 0:r.value),c=U((s==null?void 0:s.value)||m.startDate);t.push({teamId:a,size:i,workStartDate:c})}return t}function ne(){var i,c,l,d,o,f,g;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),n=Pt();if(e&&(e.textContent=String(n.reduce((b,h)=>b+K(h.size,C()),0)||0)),!t)return;if(!n.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const a=(p.editingId?m.items.find(b=>b.id===p.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:n,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},r={...a,id:p.editingId||"__draft__",assignments:n,title:((i=document.querySelector("#f_title"))==null?void 0:i.value.trim())||a.title,type:((c=document.querySelector("#f_type"))==null?void 0:c.value)||a.type,status:((l=document.querySelector("#f_status"))==null?void 0:l.value)||a.status,businessValue:Number((d=document.querySelector("#f_bv"))==null?void 0:d.value)||a.businessValue,timeCriticality:Number((o=document.querySelector("#f_tc"))==null?void 0:o.value)||a.timeCriticality,riskReduction:Number((f=document.querySelector("#f_rr"))==null?void 0:f.value)||a.riskReduction,jobSize:Number((g=document.querySelector("#f_js"))==null?void 0:g.value)||a.jobSize,manualRank:(()=>{var y;const b=(y=document.querySelector("#f_rank"))==null?void 0:y.value,h=Math.round(Number(b));return Number.isFinite(h)&&h>=1?h:a.manualRank??tt(m.items)})()},s=Zt(r);if(!s){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=ee(s,n)}function ae(){const e=(s,i)=>{const c=document.querySelector(`#${s}`),l=Number(c==null?void 0:c.value);return Number.isFinite(l)?l:i},t=s=>{var i;return((i=document.querySelector(`#${s}`))==null?void 0:i.value)??""},n=Pt();if(!n.length)return alert("Выберите хотя бы одну команду"),null;const a=t("f_rank").trim(),r=Math.max(1,Math.round(Number(a)||tt(m.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:n,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:mt(e("f_bv",5),1,10),timeCriticality:mt(e("f_tc",5),1,10),riskReduction:mt(e("f_rr",5),1,10),jobSize:mt(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:r}}function mt(e,t,n){return Math.min(n,Math.max(t,e))}function B(){Lt(m),T()}function Ve(){var d,o,f,g,b,h,y,$,E,M,S,P,D,I,F,A,W,q;document.querySelectorAll("[data-tab]").forEach(u=>{u.addEventListener("click",()=>{p.tab=u.dataset.tab,T()})}),document.querySelectorAll(".set-range").forEach(u=>{u.addEventListener("input",()=>Te())}),(d=document.querySelector("#resetSizeRanges"))==null||d.addEventListener("click",()=>{m.sizeRanges=ft(void 0),B()});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{p.query=e.value}),e==null||e.addEventListener("change",()=>T());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{p.typeFilter=t.value,T()});const n=document.querySelector("#teamFilter");n==null||n.addEventListener("change",()=>{p.teamFilter=n.value,T()});const a=document.querySelector("#statusFilter");a==null||a.addEventListener("change",()=>{p.statusFilter=a.value,T()}),(o=document.querySelector("#addItem"))==null||o.addEventListener("click",()=>{p.creating=!0,p.editingId=null,T()}),(f=document.querySelector("#resetFilters"))==null||f.addEventListener("click",()=>{p.typeFilter="all",p.teamFilter="all",p.statusFilter="all",p.query="",p.sortKey="priority",p.sortDir="asc",T()}),document.querySelectorAll("[data-edit]").forEach(u=>{u.addEventListener("click",v=>{v.target.closest("[data-stop-edit], .prio-input, .prio-edit, #appConfirmPop, .drag-handle")||(p.editingId=u.dataset.edit??null,p.creating=!1,T())})}),He(),document.querySelectorAll(".prio-input").forEach(u=>{const v=u.dataset.prioId,k=()=>{const x=m.items.find(z=>z.id===v);u.value=String((x==null?void 0:x.manualRank)??1)},L=()=>{const x=m.items.find(Qe=>Qe.id===v);if(!x)return;const z=Number(u.value);if(!Number.isFinite(z)||z<1){k();return}const j=Math.round(z);if(u.value=String(j),j===x.manualRank)return;const pt=rt(m.items,j,v),Ye=pt?`Сменить на <span class="accent">${j}</span>?<br/>«${R(pt.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${j}</span>?`;Ct(u,Ye,()=>{m.items=yt(m.items,v,j,C()),B()},k)};u.addEventListener("click",x=>x.stopPropagation()),u.addEventListener("mousedown",x=>x.stopPropagation()),u.addEventListener("keydown",x=>{x.key==="Enter"&&(x.preventDefault(),L()),x.key==="Escape"&&(jt(),k(),u.blur())}),u.addEventListener("change",L)}),document.querySelectorAll("[data-sort]").forEach(u=>{u.addEventListener("click",v=>{if(v.target.closest("[data-col-resize]"))return;v.stopPropagation();const k=u.dataset.sort;(k==="wsjf"||k==="estimate"||k==="eta"||k==="priority")&&Re(k)})}),Je();const r=()=>{p.creating=!1,p.editingId=null,T()};(g=document.querySelector("#closeModal"))==null||g.addEventListener("click",r),(b=document.querySelector("#closeModal2"))==null||b.addEventListener("click",r),(h=document.querySelector("#modal"))==null||h.addEventListener("click",u=>{u.target.id==="modal"&&r()}),document.querySelectorAll(".f_team_check").forEach(u=>{u.addEventListener("change",()=>{const v=u.dataset.team,k=document.querySelector(`.f_team_size[data-team="${v}"]`),L=document.querySelector(`.f_team_start[data-team="${v}"]`);k&&(k.disabled=!u.checked),L&&(L.disabled=!u.checked),ne()})});const s=document.querySelector("#teamAssignList"),i=u=>{const v=u.target;v&&(v.classList.contains("f_team_size")||v.classList.contains("f_team_start")||v.classList.contains("f_team_check"))&&ne()};s==null||s.addEventListener("input",i),s==null||s.addEventListener("change",i),s==null||s.addEventListener("keyup",i),(y=document.querySelector("#saveItem"))==null||y.addEventListener("click",()=>{const u=ae();if(!u)return;const v=u.manualRank??tt(m.items),k=document.querySelector("#f_rank"),L=()=>{if(rt(m.items,v,null)){const j=et("item");m.items=[...m.items,{...u,id:j,manualRank:m.items.length+1}],m.items=yt(m.items,j,v,C())}else m.items.push({...u,id:et("item"),manualRank:v}),m.items=X(m.items,C());p.creating=!1,p.editingId=null,B()},x=()=>{if(!p.editingId)return;const z=m.items.findIndex(pt=>pt.id===p.editingId);if(z<0)return;const j=m.items[z];v!==j.manualRank?(m.items[z]={...j,...u,manualRank:j.manualRank},m.items=yt(m.items,p.editingId,v,C())):m.items[z]={...j,...u},p.creating=!1,p.editingId=null,B()};if(p.creating){const z=rt(m.items,v,null);if(z&&k){Ct(k,`Занять <span class="accent">${v}</span>?<br/>«${R(z.title)}» сдвинется вверх.`,L,()=>{});return}L();return}if(p.editingId){const z=m.items.find(j=>j.id===p.editingId);if(z&&v!==z.manualRank&&k){const j=rt(m.items,v,p.editingId);Ct(k,j?`Сменить на <span class="accent">${v}</span>?<br/>«${R(j.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${v}</span>?`,x,()=>{});return}x()}}),($=document.querySelector("#deleteItem"))==null||$.addEventListener("click",()=>{p.editingId&&(m.items=m.items.filter(u=>u.id!==p.editingId),p.editingId=null,B())}),["f_bv","f_tc","f_rr","f_js"].forEach(u=>{var v;(v=document.querySelector(`#${u}`))==null||v.addEventListener("input",()=>{const k=document.querySelector("#liveWsjf");if(!k)return;const L=ae();L&&(k.textContent=String(O({...L})))})});const c=document.querySelector("#ganttWeeks");c==null||c.addEventListener("input",()=>{const u=Math.max(4,Math.min(52,Number(c.value)||16));p.ganttWeeks=u;const v=document.querySelector("#ganttWeeksLabel");v&&(v.textContent=`${u} нед.`)}),c==null||c.addEventListener("change",()=>{p.ganttWeeks=Math.max(4,Math.min(52,Number(c.value)||16)),T()}),document.querySelectorAll("[data-team-name]").forEach(u=>{const v=()=>{const k=u.dataset.teamName,L=m.teams.find(z=>z.id===k);if(!L)return;const x=u.value.trim()||L.name;u.value=x,x!==L.name&&(L.name=x,B())};u.addEventListener("change",v),u.addEventListener("keydown",k=>{k.key==="Enter"&&(k.preventDefault(),u.blur())})}),document.querySelectorAll("[data-team-capacity]").forEach(u=>{u.addEventListener("change",()=>{const v=u.dataset.teamCapacity,k=m.teams.find(L=>L.id===v);k&&(k.capacity=it(u.value),B())})}),document.querySelectorAll("[data-team-delete]").forEach(u=>{u.addEventListener("click",v=>{v.stopPropagation();const k=u.dataset.teamDelete;Oe(k,u)})}),(E=document.querySelector("#addTeam"))==null||E.addEventListener("click",()=>{const u=document.querySelector("#teamAddBar"),v=document.querySelector("#newTeamName"),k=document.querySelector("#newTeamDot");u&&(u.hidden=!1),k&&(k.style.background=zt()),v==null||v.focus()}),(M=document.querySelector("#cancelNewTeam"))==null||M.addEventListener("click",()=>{const u=document.querySelector("#teamAddBar"),v=document.querySelector("#newTeamName");u&&(u.hidden=!0),v&&(v.value="")});const l=()=>{const u=document.querySelector("#newTeamName"),v=(u==null?void 0:u.value.trim())||"";if(!v){u==null||u.focus();return}m.teams.push({id:et("team"),name:v,capacity:"M",color:zt()}),B()};(S=document.querySelector("#saveNewTeam"))==null||S.addEventListener("click",l),(P=document.querySelector("#newTeamName"))==null||P.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),l())}),(D=document.querySelector("#exportPdfBtn"))==null||D.addEventListener("click",()=>{Ge()}),(I=document.querySelector("#downloadReqsBtn"))==null||I.addEventListener("click",()=>{Ke()}),(F=document.querySelector("#exportBtn"))==null||F.addEventListener("click",()=>{const u=new Blob([JSON.stringify(m,null,2)],{type:"application/json"}),v=URL.createObjectURL(u),k=document.createElement("a");k.href=v,k.download=`vi-planer-${m.startDate}.json`,k.click(),URL.revokeObjectURL(v)}),(A=document.querySelector("#importBtn"))==null||A.addEventListener("click",()=>{var u;(u=document.querySelector("#fileInput"))==null||u.click()}),(W=document.querySelector("#fileInput"))==null||W.addEventListener("change",async u=>{var k;const v=(k=u.target.files)==null?void 0:k[0];if(v)try{const L=await v.text(),x=kt(JSON.parse(L));if(!x){alert("Неверный формат файла");return}m=x,B()}catch{alert("Не удалось прочитать JSON")}}),(q=document.querySelector("#resetBtn"))==null||q.addEventListener("click",u=>{u.stopPropagation(),Ue(u.currentTarget)})}function Q(){var e,t;(e=document.querySelector("#resetPop"))==null||e.remove(),(t=document.querySelector("#resetBtn"))==null||t.classList.remove("reset-ask")}function Ue(e){var c,l;Q(),jt(),e.classList.add("reset-ask");const t=document.createElement("div");t.id="resetPop",t.className="reset-confirm",t.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(t);const n=()=>{const d=e.getBoundingClientRect(),o=t.offsetWidth,f=t.offsetHeight;let g=d.right-o,b=d.bottom+6;g<8&&(g=8),g+o>window.innerWidth-8&&(g=window.innerWidth-o-8),b+f>window.innerHeight-8&&(b=d.top-f-6),t.style.left=`${Math.max(8,g)}px`,t.style.top=`${Math.max(8,b)}px`};n();const a=()=>n();window.addEventListener("scroll",a,!0),window.addEventListener("resize",a);const r=()=>{window.removeEventListener("scroll",a,!0),window.removeEventListener("resize",a),window.removeEventListener("keydown",s),document.removeEventListener("mousedown",i)},s=d=>{d.key==="Escape"&&(r(),Q())},i=d=>{const o=d.target;t.contains(o)||e.contains(o)||(r(),Q())};(c=t.querySelector("#resetCancelBtn"))==null||c.addEventListener("click",()=>{r(),Q()}),(l=t.querySelector("#resetConfirmBtn"))==null||l.addEventListener("click",()=>{r(),Q(),m=structuredClone(St),B()}),window.addEventListener("keydown",s),window.setTimeout(()=>document.addEventListener("mousedown",i),0)}function Je(){const e=document.querySelector(".portfolio-table");e&&e.querySelectorAll("[data-col-resize]").forEach(t=>{t.addEventListener("pointerdown",n=>{n.preventDefault(),n.stopPropagation();const a=t.dataset.colResize;if(!a)return;const r=t.closest("th");if(!r)return;const s=Yt(Gt[a],a),i=n.clientX,c=r.getBoundingClientRect().width,l=n.pointerId;t.setPointerCapture(l),document.body.classList.add("col-resizing");const d=f=>{const g=Math.max(s,Math.round(c+(f.clientX-i)));r.style.width=`${g}px`,r.style.minWidth=`${s}px`},o=f=>{t.releasePointerCapture(l),t.removeEventListener("pointermove",d),t.removeEventListener("pointerup",o),t.removeEventListener("pointercancel",o),document.body.classList.remove("col-resizing");const g=Math.max(s,Math.round(r.getBoundingClientRect().width)),b=Xt();b[a]=g,xe(b),r.style.width=`${g}px`};t.addEventListener("pointermove",d),t.addEventListener("pointerup",o),t.addEventListener("pointercancel",o)})})}async function Ke(){const e="/vi_planer/",t=new URL("VI-Planer-requirements.md",new URL(e,window.location.href)).href;try{const n=await fetch(t);if(!n.ok)throw new Error(String(n.status));const a=await n.text(),r=new Blob([a],{type:"text/markdown;charset=utf-8"}),s=URL.createObjectURL(r),i=document.createElement("a");i.href=s,i.download="VI-Planer-requirements.md",i.click(),URL.revokeObjectURL(s)}catch(n){console.error(n),alert("Не удалось скачать файл требований")}}async function Ge(){const e=document.querySelector("#exportPdfBtn"),t=document.querySelector("#pdfCapture");if(!t){alert("Не удалось найти содержимое для экспорта");return}const n=(e==null?void 0:e.textContent)??"Экспорт PDF";e&&(e.disabled=!0,e.textContent="PDF…");const a=new Date().toISOString().slice(0,10),r=`VI Planer — ${Rt[p.tab]} · ${a}`,s=`VI-Planer-${Rt[p.tab]}-${a}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await be(t,s,r)}catch(i){console.error(i),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),e&&(e.disabled=!1,e.textContent=n)}}async function Xe(){m=await ge();const e=m.items.map(n=>n.manualRank).join(",");m={...m,items:X(m.items,C())};const t=m.items.map(n=>n.manualRank).join(",");e!==t&&Lt(m),de(n=>{const a=document.querySelector("#syncStatus");a&&(a.dataset.status=n,a.textContent=Ht(n))}),T()}Xe()})();
