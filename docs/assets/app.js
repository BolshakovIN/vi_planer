(function(){"use strict";const T={S:{min:1,max:2},M:{min:2,max:4},L:{min:4,max:8}};function mt(e){const t={S:{...T.S},M:{...T.M},L:{...T.L}};if(!e||typeof e!="object")return t;for(const n of J){const a=e[n];if(!a||typeof a!="object")continue;const r=a;let s=Math.round(Number(r.min)),o=Math.round(Number(r.max));Number.isFinite(s)||(s=t[n].min),Number.isFinite(o)||(o=t[n].max),s=Math.max(1,s),o=Math.max(s,o),t[n]={min:s,max:o}}if(t.S.max>12||t.M.max>12||t.L.max>12)for(const n of J)t[n]={min:Math.max(1,Math.round(t[n].min/7)),max:Math.max(1,Math.round(t[n].max/7))},t[n].max<t[n].min&&(t[n].max=t[n].min);return t}function K(e,t=T){const n=t[e];return Math.round((n.min+n.max)/2*10)/10}function jt(e,t=T){const n=t[e];return`${e} (${n.min}–${n.max} нед.)`}function pt(e){return J.map(t=>jt(t,e)).join(", ")}const J=["S","M","L"];function ft(e){const t=String(e??"").toUpperCase();return t==="S"||t==="M"||t==="L"?t:"M"}function qt(e,t=3){const n=e/Math.max(t,.5);return n<=2?"S":n<=4?"M":"L"}function N(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function H(e,t=T){return e.assignments.reduce((n,a)=>n+K(a.size,t),0)}function ne(e,t){return e.assignments.some(n=>n.teamId===t)}function vt(e,t){const n=new Date(e+"T12:00:00");return n.setDate(n.getDate()+t),n.toISOString().slice(0,10)}function B(e,t){return vt(e,t*7)}function ae(e){return e.reduce((t,n)=>n.endDate!==t.endDate?n.endDate>t.endDate?n:t:n.estimatePw!==t.estimatePw?n.estimatePw>t.estimatePw?n:t:n.durationWeeks>t.durationWeeks?n:t)}function $(e){const[t,n,a]=e.split("-");return`${a}.${n}.${t}`}function at(e=new Date){const t=new Date(e),n=t.getDay(),a=n===0?-6:1-n;return t.setDate(t.getDate()+a),t.toISOString().slice(0,10)}function U(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?at():at(new Date(e.slice(0,10)+"T12:00:00"))}function se(e,t){const n=new Date(U(e)+"T12:00:00").getTime(),a=new Date(U(t)+"T12:00:00").getTime();return Math.max(0,Math.round((a-n)/(168*3600*1e3)))}function Q(e,t=T){return[...e].sort((n,a)=>{const r=n.manualRank,s=a.manualRank;if(r!=null&&s!=null&&r!==s)return r-s;if(r!=null&&s==null)return-1;if(r==null&&s!=null)return 1;const o=N(a)-N(n);return o!==0?o:H(n,t)-H(a,t)})}function st(e,t,n){return e.find(a=>a.id!==n&&a.manualRank!=null&&a.manualRank===t)}function gt(e,t,n,a=T){const r=Q(e,a),s=r.findIndex(i=>i.id===t);if(s<0)return e;const o=[...r],[c]=o.splice(s,1),l=Math.max(0,Math.min(o.length,Math.round(n)-1));o.splice(l,0,c);const d=new Map(o.map((i,f)=>[i.id,f+1]));return e.map(i=>{const f=d.get(i.id);return f==null||i.manualRank===f?i:{...i,manualRank:f}})}function ie(e,t,n=T){if(t.length<2)return e;const a=Q(e,n),r=new Set(t),s=new Map(e.map(i=>[i.id,i])),o=t.map(i=>s.get(i)).filter(i=>!!i);let c=0;const l=[];for(const i of a)if(r.has(i.id)){const f=o[c++];f&&l.push(f)}else l.push(i);for(;c<o.length;)l.push(o[c++]);const d=new Map(l.map((i,f)=>[i.id,f+1]));return e.map(i=>{const f=d.get(i.id);return f==null||i.manualRank===f?i:{...i,manualRank:f}})}function Z(e){let t=0;for(const n of e)n.manualRank!=null&&n.manualRank>t&&(t=n.manualRank);return t+1}function G(e,t=T){const n=[...e].sort((c,l)=>{const d=N(l)-N(c);return d!==0?d:H(c,t)-H(l,t)}),a=new Set,r=new Map;for(const c of n){const l=c.manualRank;l!=null&&Number.isFinite(l)&&l>=1&&!a.has(l)&&(a.add(l),r.set(c.id,l))}let s=1;const o=()=>{for(;a.has(s);)s+=1;const c=s;return a.add(c),s+=1,c};return e.map(c=>{const l=r.get(c.id)??o();return c.manualRank===l?c:{...c,manualRank:l}})}function yt(e){const t=e.sizeRanges??T,n=e.items.filter(i=>i.status!=="done"),a=Q(n,t),r=new Map;for(const i of e.teams)r.set(i.id,[]);for(const i of a)for(const f of i.assignments){const g=r.get(f.teamId)??[];g.push({item:i,size:f.size,workStartDate:U(f.workStartDate||e.startDate)}),r.set(f.teamId,g)}const s=[],o={},c=52;for(const i of e.teams){const f=r.get(i.id)??[],g=Array.from({length:c},(k,y)=>({week:y,weekStart:B(e.startDate,y),usedPw:0,capacityPw:i.capacityPw,items:[]}));let b=0;f.forEach((k,y)=>{const w=K(k.size,t),R=se(e.startDate,k.workStartDate);let x=Math.max(b,R);for(;x<c&&g[x].usedPw>=i.capacityPw-.001;)x+=1;let E=w,I=x,M=B(e.startDate,x);const P=B(e.startDate,x);for(;E>.001&&I<c;){const q=g[I],_=Math.max(0,i.capacityPw-q.usedPw);if(_<=.001){I+=1;continue}const u=Math.min(_,E),v=B(e.startDate,I),h=u/i.capacityPw*7,D=q.usedPw/i.capacityPw*7;M=vt(v,D+h),q.usedPw+=u,q.items.includes(k.item.id)||q.items.push(k.item.id),E-=u,E>.001&&(I+=1)}const F=i.capacityPw>0?Math.round(w/i.capacityPw*100)/100:w;s.push({item:k.item,teamId:i.id,size:k.size,estimatePw:w,wsjf:N(k.item),effectiveRank:y+1,plannedStartDate:k.workStartDate,startWeek:x,endWeek:I,startDate:P,endDate:M,waitWeeks:x,delayedByQueue:x>R,durationWeeks:F}),b=I,g[b]&&g[b].usedPw>=i.capacityPw-.001?b=I+1:b=I}),o[i.id]=g}const l=new Map;for(const i of s){const f=l.get(i.item.id)??[];f.push(i),l.set(i.item.id,f)}const d=[];for(const i of a){const f=l.get(i.id)??[];if(!f.length)continue;const g=ae(f),b=f.reduce((k,y)=>y.startWeek<k.startWeek?y:k);d.push({item:i,slices:[...f].sort((k,y)=>k.endDate===y.endDate?y.estimatePw-k.estimatePw:k.endDate<y.endDate?1:-1),wsjf:N(i),totalEstimateWeeks:H(i,t),startWeek:b.startWeek,endWeek:g.endWeek,startDate:b.startDate,endDate:g.endDate,waitWeeks:b.waitWeeks,bottleneckTeamId:g.teamId})}return s.sort((i,f)=>i.startWeek!==f.startWeek?i.startWeek-f.startWeek:f.wsjf-i.wsjf),{slices:s,rollups:d,load:o}}function tt(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function bt(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const n=U(String(t.startDate??at())),a=t.teams.map(c=>{const l=c,d=Number(l.capacityPw),i=Number.isFinite(d)&&d>0?d:null,f=l.capacity!=null?{S:2,M:3.5,L:5}[ft(l.capacity)]:null;return{id:String(l.id??tt("team")),name:String(l.name??"Команда"),color:String(l.color??"#737373"),capacityPw:i??f??3}}),r=new Map(a.map(c=>[c.id,c.capacityPw])),s=t.items.map(c=>{const l=c;let d=[];return Array.isArray(l.assignments)&&l.assignments.length?d=l.assignments.filter(i=>i&&typeof i.teamId=="string").map(i=>{const f=String(i.teamId),g=r.get(f)??3,b=i.size!=null?ft(i.size):qt(Number(i.estimatePw)||1,g);return{teamId:f,size:b,workStartDate:U(String(i.workStartDate||l.workStartDate||n))}}):typeof l.teamId=="string"&&(d=[{teamId:l.teamId,size:qt(Number(l.estimatePw)||1,r.get(l.teamId)??3),workStartDate:n}]),!d.length&&a[0]&&(d=[{teamId:a[0].id,size:"M",workStartDate:n}]),{id:String(l.id??tt("item")),title:String(l.title??"Без названия"),type:l.type==="project"?"project":"product",backlog:String(l.backlog??"Backlog"),assignments:d,status:["idea","ready","in_progress","blocked","done"].includes(String(l.status))?l.status:"idea",owner:String(l.owner??"—"),businessValue:Number(l.businessValue)||5,timeCriticality:Number(l.timeCriticality)||5,riskReduction:Number(l.riskReduction)||5,jobSize:Number(l.jobSize)||5,notes:l.notes!=null?String(l.notes):void 0,manualRank:l.manualRank==null||l.manualRank===""?null:Number(l.manualRank)}}),o=mt(t.sizeRanges);return{version:3,startDate:n,teams:a,sizeRanges:o,items:G(s,o)}}const A=at(),kt=B(A,1),it=B(A,2),Ct=B(A,3),ht=B(A,4),wt=B(A,6),_t=B(A,8),Tt={version:3,startDate:A,sizeRanges:{S:{...T.S},M:{...T.M},L:{...T.L}},teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#d60000"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#455a64"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#737373"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#e65100"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"M",workStartDate:A}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",size:"S",workStartDate:kt}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"S",workStartDate:ht}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",size:"S",workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",size:"S",workStartDate:wt}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",size:"M",workStartDate:A},{teamId:"data",size:"M",workStartDate:Ct}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",size:"M",workStartDate:kt},{teamId:"crm",size:"S",workStartDate:ht}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",size:"M",workStartDate:it},{teamId:"platform",size:"S",workStartDate:it}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",size:"M",workStartDate:kt},{teamId:"platform",size:"S",workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",size:"M",workStartDate:A},{teamId:"platform",size:"S",workStartDate:it},{teamId:"mobile",size:"S",workStartDate:wt}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",size:"M",workStartDate:Ct},{teamId:"data",size:"S",workStartDate:ht},{teamId:"mobile",size:"S",workStartDate:_t}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",size:"L",workStartDate:it},{teamId:"platform",size:"S",workStartDate:wt},{teamId:"mobile",size:"S",workStartDate:_t}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},$t={...Tt,items:G(Tt.items)},Wt="vi-planer-v3";let Ft="idle",ot=[];function oe(){return null}function At(){return Ft}function re(e){return ot.push(e),()=>{ot=ot.filter(t=>t!==e)}}function et(e){Ft=e,ot.forEach(t=>t(e))}function ce(){try{const e=localStorage.getItem(Wt)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=bt(JSON.parse(e));return t?{...t,items:G(t.items,t.sizeRanges)}:null}catch{return null}}function Nt(e){localStorage.setItem(Wt,JSON.stringify(e))}async function le(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),n=bt(t.state);return n?{...n,items:G(n.items,n.sizeRanges)}:null}catch{return null}}async function de(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function ue(){return null}async function me(e){return!1}async function pe(){et("loading");const e=await le()??await ue()??ce()??structuredClone($t);return Nt(e),et((oe(),"saved")),e}let St=null,xt=null;function rt(e){Nt(e),xt=e,St&&clearTimeout(St),St=setTimeout(async()=>{const t=xt;if(xt=null,!t)return;et("loading");const n=await me(),a=n?!0:await de(t);if(n||a){et("saved");return}et("offline")},350)}function Bt(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function Ot(e){const t=document.querySelector(`script[data-pdf-lib="${e}"]`);return t?t.dataset.loaded==="1"?Promise.resolve():new Promise((n,a)=>{t.addEventListener("load",()=>n()),t.addEventListener("error",()=>a(new Error(`Failed to load ${e}`)))}):new Promise((n,a)=>{const r=document.createElement("script");r.src=e,r.async=!0,r.dataset.pdfLib=e,r.onload=()=>{r.dataset.loaded="1",n()},r.onerror=()=>a(new Error(`Failed to load ${e}`)),document.head.appendChild(r)})}async function fe(){var n,a;window.html2canvas||await Ot("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(n=window.jspdf)!=null&&n.jsPDF||await Ot("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const e=window.html2canvas,t=(a=window.jspdf)==null?void 0:a.jsPDF;if(!e||!t)throw new Error("PDF libraries failed to load");return{html2canvas:e,jsPDF:t}}async function ve(e,t,n){const{html2canvas:a,jsPDF:r}=await fe(),s=await a(e,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f4f4f4",logging:!1,windowWidth:Math.max(e.scrollWidth,e.clientWidth),windowHeight:Math.max(e.scrollHeight,e.clientHeight)}),o=s.toDataURL("image/png"),c=new r({orientation:"landscape",unit:"mm",format:"a4"}),l=c.internal.pageSize.getWidth(),d=c.internal.pageSize.getHeight(),i=8,f=8,g=l-i*2,b=d-i*2-f,k=g,y=s.height*k/s.width;let w=y,R=i+f,x=0;for(;w>0;){x>0&&c.addPage(),x===0&&(c.setFontSize(11),c.setTextColor(15,23,42),c.text(n,i,i+4)),c.addImage(o,"PNG",i,R,k,y);const E=x===0?b:d-i*2;if(w-=E,R-=E,x+=1,x>40)break}c.save(t)}const Dt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды",settings:"Настройки"},p={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let m=structuredClone($t);function W(){return m.sizeRanges}function V(e){return m.teams.find(t=>t.id===e)}function Lt(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function Ht(e){return new Map(e.map(t=>[t.item.id,t]))}function ge(e){return e.assignments.map(t=>t.size).join(" + ")}function ye(e,t){return e.filter(n=>n.teamId===t).reduce((n,a)=>n+a.estimatePw,0)}function be(e){return J.map(t=>`<option value="${t}" ${e===t?"selected":""}>${jt(t,W())}</option>`).join("")}function ke(e){return e.assignments.map(t=>{const n=V(t.teamId);return(n==null?void 0:n.name)??t.teamId}).join(", ")}function he(e){return`<div class="teams-stack">${e.assignments.map(n=>{const a=V(n.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(a==null?void 0:a.color)??"#94a3b8"}"></span>${L((a==null?void 0:a.name)??n.teamId)} <span class="size-badge mono">${n.size}</span> <span class="mono muted-inline">старт ${$(n.workStartDate)}</span></span>`}).join("")}</div>`}function we(e){const t=p.query.trim().toLowerCase(),n=Ht(e),a=m.items.filter(s=>p.typeFilter!=="all"&&s.type!==p.typeFilter||p.teamFilter!=="all"&&!ne(s,p.teamFilter)||p.statusFilter!=="all"&&s.status!==p.statusFilter?!1:t?s.title.toLowerCase().includes(t)||s.backlog.toLowerCase().includes(t)||s.owner.toLowerCase().includes(t)||ke(s).toLowerCase().includes(t):!0);if(p.sortKey==="priority"){const s=Q(a);return p.sortDir==="asc"?s:[...s].reverse()}const r=p.sortDir==="asc"?1:-1;return[...a].sort((s,o)=>{var l,d;let c=0;if(p.sortKey==="wsjf")c=N(s)-N(o);else if(p.sortKey==="estimate")c=H(s,W())-H(o,W());else{const i=((l=n.get(s.id))==null?void 0:l.endDate)??"9999-99-99",f=((d=n.get(o.id))==null?void 0:d.endDate)??"9999-99-99";c=i<f?-1:i>f?1:0}return c!==0?c*r:s.title.localeCompare(o.title,"ru")})}const Vt="vi-planer-col-widths",Ut={priority:"Приоритет",type:"Тип",title:"Инициатива / исходный бэклог",teams:"Команды (майка · старт)",status:"Статус",wsjf:"WSJF",estimate:"Оценка, майки",eta:"ETA"},$e={priority:96,type:88,title:260,teams:220,status:130,wsjf:72,estimate:120,eta:140};function Jt(){try{const e=localStorage.getItem(Vt);return e?JSON.parse(e):{}}catch{return{}}}function Se(e){localStorage.setItem(Vt,JSON.stringify(e))}const Rt={};function Kt(e,t){if(t&&Rt[t]!=null)return Rt[t];const n=document.createElement("span");n.textContent=e,n.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:IBM Plex Sans,system-ui,sans-serif;padding:0;",document.body.appendChild(n);const a=Math.ceil(n.getBoundingClientRect().width);n.remove();const r=Math.max(56,a+36);return t&&(Rt[t]=r),r}function xe(e){const t=Jt()[e],n=Kt(Ut[e],e);return`width:${Math.max(n,t??$e[e])}px;min-width:${n}px`}function nt(e,t,n="",a){const r=a!=null&&p.sortKey===a,s=!r||!a?"":p.sortDir==="asc"?" ↑":" ↓",o=a?`sortable ${r?"sorted":""}`:"",c=a?` data-sort="${a}"`:"";return`<th class="resizable-th ${o} ${n}" data-col="${t}"${c}${a?' title="Сортировать"':""} style="${xe(t)}"><span class="th-label">${e}${s}</span><span class="col-resize" data-col-resize="${t}" title="Изменить ширину"></span></th>`}function ct(e,t){const a={priority:"priority",wsjf:"wsjf",estimate:"estimate",eta:"eta"}[t];if(!a){const r=p.sortKey===t,s=r?p.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${r?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${s}</th>`}return nt(e,a,"",t)}function De(e){p.sortKey===e?p.sortDir=p.sortDir==="asc"?"desc":"asc":(p.sortKey=e,p.sortDir=e==="wsjf"?"desc":"asc"),C()}function Le(e,t){const n=m.items.filter(d=>d.status!=="done"),a=n.filter(d=>d.type==="product").length,r=n.filter(d=>d.type==="project").length,s=n.filter(d=>d.assignments.length>1).length,o=e.map(d=>d.endWeek),c=o.length?Math.max(...o)+1:0,l=m.teams.filter(d=>ye(t,d.id)>d.capacityPw*8).length;return`
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
        <div><span class="cols-help-k">Оценка</span> — майки S / M / L (недели в Настройках)</div>
        <div><span class="cols-help-k">ETA</span> — дата готовности (когда закончила последняя команда)</div>
      </div>
    </details>
  `}function Ee(e,t){const n=Ht(e),a=we(e),r=p.sortKey==="priority",s=a.map(o=>{const c=n.get(o.id),l=N(o),d=H(o,W()),i=o.manualRank??"—",f=c?`<div class="eta-teams">${c.slices.map(g=>{const b=V(g.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(b==null?void 0:b.color)??"#64748b"}">${L((b==null?void 0:b.name)??g.teamId)}</span>: ${$(g.startDate)}→${$(g.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${r?"row-draggable":""}" data-edit="${o.id}" data-row-id="${o.id}">
          <td class="prio-cell">
            <div class="prio-edit" data-stop-edit>
              ${r?'<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>':""}
              <input
                class="prio-input"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-prio-id="${o.id}"
                value="${i}"
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
            <div class="name">${L(o.title)}</div>
            <div class="meta">${L(o.backlog)} · ${L(o.owner)}</div>
          </td>
          <td>${he(o)}</td>
          <td><span class="badge badge-status-${o.status}">${Lt(o.status)}</span></td>
          <td class="mono metric-num">${l}</td>
          <td class="mono metric-num">
            <span class="size-badge">${ge(o)}</span>
            <div class="meta">~${d} чел·нед</div>
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
          <input id="q" placeholder="Поиск…" value="${X(p.query)}" />
          <select id="typeFilter">
            <option value="all" ${p.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${p.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${p.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${m.teams.map(o=>`<option value="${o.id}" ${p.teamFilter===o.id?"selected":""}>${L(o.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${p.statusFilter===o?"selected":""}>${Lt(o)}</option>`).join("")}
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
              ${ct("Приоритет","priority")}
              ${nt("Тип","type")}
              ${nt("Инициатива / исходный бэклог","title")}
              ${nt("Команды (оценка · старт)","teams")}
              ${nt("Статус","status")}
              ${ct("WSJF","wsjf")}
              ${ct("Оценка, майки","estimate")}
              ${ct("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${s||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function Pe(e){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${m.teams.map(n=>{const a=e.filter(c=>c.teamId===n.id).sort((c,l)=>c.effectiveRank-l.effectiveRank),r=a.reduce((c,l)=>c+l.estimatePw,0),s=n.capacityPw>0?r/n.capacityPw:0,o=Math.min(100,Math.round(a.filter(c=>c.startWeek<8).reduce((c,l)=>{const d=Math.min(l.endWeek+1,8)-l.startWeek;return c+Math.max(0,d)*(l.estimatePw/Math.max(1,l.endWeek-l.startWeek+1))},0)/(n.capacityPw*8)*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${n.color}"></span>${L(n.name)}</h3>
              <div class="meta">Ёмкость ${n.capacityPw} чел·нед/нед · спрос ${r.toFixed(1)} · ~${s.toFixed(1)} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${o}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,o)}%;background:${n.color}"></span></div>
          ${a.map(c=>{const l=c.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${c.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${c.item.type}">${c.item.type==="product"?"П":"Пр"}</span> ${L(c.item.title)}</div>
                <div class="meta">WSJF ${c.wsjf} · ${c.size} (${c.estimatePw} чел·нед) · план ${$(c.plannedStartDate)}${c.delayedByQueue?" → сдвиг":""}${l>0?` · ещё ${l} ком.`:""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${$(c.startDate)} →<br/>${$(c.endDate)}
              </div>
            </div>
          `}).join("")||'<div class="empty">Очередь пуста</div>'}
        </div>
      `}).join("")}
    </div>
  `}function Ie(e){const t=m.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда команда освобождается с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${m.teams.map(a=>{const r=e.filter(d=>d.teamId===a.id).sort((d,i)=>{const f=d.item.manualRank??9999,g=i.item.manualRank??9999;return f!==g?f-g:d.effectiveRank-i.effectiveRank}),s=r.reduce((d,i)=>d+i.estimatePw,0),o=a.capacityPw>0?s/a.capacityPw:0,c=r.length?r[r.length-1].endDate:t,l=r.map((d,i)=>{const f=d.item.manualRank??"—",g=i>0?r[i-1]:null;let b="может взять сразу (очередь свободна)",k="take-now";d.startDate>d.plannedStartDate?(b=g?`ждёт очередь: после #${g.item.manualRank??"?"} «${g.item.title}»`:"сдвиг из‑за загрузки очереди",k="take-queue"):d.startDate>t&&(b=`ждёт плановый старт ${$(d.plannedStartDate)}`,k="take-plan");const y=d.item.assignments.filter(w=>w.teamId!==a.id).map(w=>{var R;return((R=V(w.teamId))==null?void 0:R.name)??w.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${f}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${d.item.type}">${d.item.type==="product"?"П":"Пр"}</span>
                  ${L(d.item.title)}
                </div>
                <div class="take-line ${k}">
                  <strong>Может взять с ${$(d.startDate)}</strong>
                  <span class="meta"> · ${L(b)}</span>
                </div>
                <div class="meta">
                  ${d.size} (${d.estimatePw} чел·нед) · план ${$(d.plannedStartDate)} · до ${$(d.endDate)}
                  ${y.length?` · ещё: ${y.map(L).join(", ")}`:""}
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
              <div class="meta">Ёмкость ${a.capacityPw} чел·нед/нед · спрос ${s.toFixed(1)} · ~${o.toFixed(1)} нед. до очистки</div>
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
  `}function Me(e,t){const n=Math.max(4,...e.map(y=>y.endWeek+2),4),a=Math.max(4,Math.min(52,Math.round(p.ganttWeeks)||16));p.ganttWeeks=a;const r=Q(m.items.filter(y=>y.status!=="done")),s=new Map(r.map((y,w)=>[y.id,w])),o=100/a,c=`repeating-linear-gradient(90deg, #f5f5f5 0, #f5f5f5 calc(${o}% - 1px), #e0e0e0 calc(${o}% - 1px), #e0e0e0 ${o}%)`,l=[],d=[];m.teams.forEach((y,w)=>{const R=t.filter(E=>E.teamId===y.id).sort((E,I)=>E.effectiveRank-I.effectiveRank);if(R.length<2)return;const x=`arrow-${y.id}`;d.push(`
      <marker id="${x}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${y.color}" fill-opacity="0.85" />
      </marker>
    `);for(let E=1;E<R.length;E++){const I=R[E-1],M=R[E],P=(s.get(I.item.id)??0)+.5,F=(s.get(M.item.id)??0)+.5,q=Math.min(a-.05,I.endWeek+.92),_=Math.min(a-.05,Math.max(.08,M.startWeek+.02)),u=_-q,v=(w%4-1.5)*.08,h=Math.max(.35,Math.abs(u)*.45)+Math.abs(v),D=q+(u>=0?h:-h*.35)+v,S=_-(u>=0?h:-h*.35)+v,z=Math.abs(P-F)<.02?`M ${q} ${P} H ${_}`:`M ${q} ${P} C ${D} ${P}, ${S} ${F}, ${_} ${F}`;l.push(`<path d="${z}" fill="none" stroke="${y.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${x})" />`)}});const i=[],f=[];for(const y of r){const w=e.find(M=>M.item.id===y.id);if(!w)continue;const R=w.slices.map(M=>{const P=t.filter(u=>u.teamId===M.teamId).sort((u,v)=>u.effectiveRank-v.effectiveRank),F=P.findIndex(u=>u.item.id===y.id);if(F<=0)return null;const q=P[F-1],_=V(M.teamId);return`#${q.item.manualRank} (${(_==null?void 0:_.name)??M.teamId})`}).filter(Boolean),x=[...new Set(R)],E=x.length?`<div class="meta gantt-dep-meta">после ${x.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',I=w.slices.map(M=>{const P=V(M.teamId),F=M.startWeek/a*100,q=Math.max(1,M.endWeek-M.startWeek+1)/a*100;return`<div class="gantt-bar ${M.teamId===w.bottleneckTeamId?"gantt-bot":""}" style="left:${F}%;width:${Math.max(q,2.5)}%;background:${(P==null?void 0:P.color)??"#64748b"}" title="${X((P==null?void 0:P.name)??"")}: ${$(M.endDate)}">${L((P==null?void 0:P.name)??"")}</div>`}).join("");i.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${y.manualRank??"—"}</span> ${L(y.title)}</div>
        <div class="meta">${y.type==="product"?"Продукт":"Проект"} · ETA ${$(w.endDate)}</div>
        ${E}
      </div>
    `),f.push(`<div class="gantt-track gantt-track-multi" style="background:${c}">${I}</div>`)}const g=Math.max(1,r.length),b=a<=12?1:a<=24?2:a<=36?3:4,k=Array.from({length:a},(y,w)=>{if(!(w%b===0||w===a-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${o}%"></div>`;const x=B(m.startDate,w),[,E,I]=x.split("-");return`<div class="gantt-axis-tick" style="width:${o}%">
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
              <span class="meta">нед. с ${$(m.startDate)}</span>
            </div>
            ${i.join("")}
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
  `}const Et=["#d60000","#455a64","#737373","#c62828","#e65100","#1a1a1a","#8d6e63","#546e7a","#b71c1c","#f57c00"];function Gt(){const e=new Set(m.teams.map(t=>t.color));return Et.find(t=>!e.has(t))??Et[m.teams.length%Et.length]}function ze(e){const t=m.sizeRanges,n=m.items.filter(o=>o.status!=="done"),a=e.map(o=>o.endWeek),r=a.length?Math.max(...a)+1:0;return`
    <div class="callout">
      Диапазоны майок — <strong>сколько недель</strong> заложено в оценке проекта (S / M / L). Для плана берётся середина диапазона.
      Изменения сразу перестраивают ETA и Gantt.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Майки (S / M / L)</h2>
        <button type="button" class="btn" id="resetSizeRanges">Сбросить по умолчанию</button>
      </div>
      <div class="size-ranges-grid">${J.map(o=>`
    <div class="size-range-row">
      <div class="size-range-label"><span class="size-badge size-badge-lg">${o}</span></div>
      <label class="size-range-field">
        <span class="meta">от, нед.</span>
        <input
          type="number"
          id="set_${o}_min"
          class="set-range"
          data-size="${o}"
          data-bound="min"
          min="1"
          step="1"
          value="${t[o].min}"
        />
      </label>
      <label class="size-range-field">
        <span class="meta">до, нед.</span>
        <input
          type="number"
          id="set_${o}_max"
          class="set-range"
          data-size="${o}"
          data-bound="max"
          min="1"
          step="1"
          value="${t[o].max}"
        />
      </label>
      <div class="size-range-plan">
        <span class="meta">для плана</span>
        <strong class="mono" data-plan="${o}">${K(o,t)} нед.</strong>
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
  `}function je(){const e={};for(const t of J){const n=document.querySelector(`#set_${t}_min`),a=document.querySelector(`#set_${t}_max`);if(!n||!a)return null;e[t]={min:Math.round(Number(n.value)),max:Math.round(Number(a.value))}}return mt(e)}function qe(e){var o;const t=m.sizeRanges;for(const c of J)(o=document.querySelector(`[data-plan="${c}"]`))==null||o.replaceChildren(document.createTextNode(`${K(c,t)} нед.`));const n=e.map(c=>c.endWeek),a=n.length?Math.max(...n)+1:0,r=document.querySelector("#settingsHorizon");r&&(r.textContent=`${a} нед.`);const s=document.querySelector("#settingsSchedPreview #settingsRangesSummary");s&&(s.textContent=pt(t))}let Xt;function Ce(){const e=je();if(!e)return;m.sizeRanges=e,rt(m);const{rollups:t}=yt(m);qe(t);const n=document.activeElement,a=n!=null&&n.classList.contains("set-range")?n.id:null;clearTimeout(Xt),Xt=setTimeout(()=>{if(C(),a){const r=document.querySelector(`#${a}`);r==null||r.focus(),r==null||r.select()}},200)}function _e(){return`
    <div class="callout">
      <strong>Ёмкость</strong> — сколько человеко-недель команда может отдать за календарную неделю.
      Оценки инициатив задаются майками (недели — в <a href="#" data-tab-jump="settings">Настройках</a>).
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Команды</h2>
      </div>
      <div id="teamsManageList">
        ${m.teams.map(t=>`
      <div class="capacity-row" data-team-row="${t.id}">
        <span class="team-dot" style="background:${t.color}"></span>
        <input
          class="team-name-input"
          type="text"
          data-team-name="${t.id}"
          value="${X(t.name)}"
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
          ${m.teams.length<=1?"disabled":""}
        >Удалить</button>
      </div>
    `).join("")||'<div class="empty">Нет команд — добавьте первую ниже</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar">
        <span class="team-dot" id="newTeamDot" style="background:${Gt()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">+ Команда</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function Te(e){var d;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((d=m.teams[0])==null?void 0:d.id)??"",size:"M",workStartDate:m.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:Z(m.items)},n=N(t),a=new Set(t.assignments.map(i=>i.teamId)),r=new Map(t.assignments.map(i=>[i.teamId,i.size])),s=new Map(t.assignments.map(i=>[i.teamId,i.workStartDate])),o=Yt(t),c=o?Zt(o,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',l=m.teams.map(i=>{const f=a.has(i.id),g=r.get(i.id)??"M",b=s.get(i.id)??m.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${i.id}" ${f?"checked":""} />
            <span class="team-dot" style="background:${i.color}"></span>
            <span class="team-assign-name">${L(i.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Майка</span>
            <select class="f_team_size" data-team="${i.id}" ${f?"":"disabled"}>${be(g)}</select>
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${i.id}" value="${b}" ${f?"":"disabled"} />
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
            <input id="f_title" value="${X(t.title)}" />
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
              <input id="f_backlog" value="${X(t.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${["idea","ready","in_progress","blocked","done"].map(i=>`<option value="${i}" ${t.status===i?"selected":""}>${Lt(i)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${X(t.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: майка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${l}</div>
            <div class="meta" style="margin-top:6px">${pt(W())}. Итого ~<strong class="mono" id="liveTotalEst">${H(t,W())}</strong> чел·нед. Старт — не раньше указанной даты; если очередь занята, сдвинется позже.</div>
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
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??Z(m.items)}" />
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
  `}function Yt(e){const t=e.assignments.length?e.assignments:zt();if(!t.length)return null;const n=e.id||"__draft__",a={...e,id:n,assignments:t},r=m.items.some(o=>o.id===n)?m.items.map(o=>o.id===n?a:o):[...m.items,a],{rollups:s}=yt({...m,items:r});return s.find(o=>o.item.id===n)??null}function Qt(e){const t=V(e.teamId),n=(t==null?void 0:t.capacityPw)||1,a=K(e.size,W()),r=Math.round(a/n*100)/100,s=U(e.workStartDate||m.startDate),o=vt(s,r*7);return{start:s,end:o,weeks:r}}function Zt(e,t){const n=new Map(t.map(s=>[s.teamId,s])),a=e.slices.map(s=>{const o=V(s.teamId),c=n.get(s.teamId),l=c?U(c.workStartDate):s.plannedStartDate,d=c?Qt(c):null,i=s.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",f=s.startDate>l?` <span class="meta">(план ${$(l)}, очередь сдвинула на ${$(s.startDate)})</span>`:s.startDate<l?` <span class="meta">(ждём план ${$(l)})</span>`:"",g=d?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(d.start)} → <span class="mono">${$(d.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${L((o==null?void 0:o.name)??s.teamId)}</strong>: <span class="mono">${$(s.startDate)} → ${$(s.endDate)}</span> <span class="meta">(${s.size} · ${s.estimatePw} чел·нед ≈ ${s.durationWeeks} нед.)</span>${f}${i}${g}</div>`}).join(""),r=t.map(s=>Qt(s).end).reduce((s,o)=>s>o?s:o,"0000-00-00");return a+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(r)}</strong> — меняется сразу при смене даты</div>`}function L(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function X(e){return L(e).replaceAll("'","&#39;")}function lt(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),document.querySelectorAll(".confirm-ask").forEach(t=>{t.classList.remove("confirm-ask")}),(e=document.querySelector("#appConfirmPop"))==null||e.remove()}function Pt(){lt()}function We(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-confirm-no>Нет</button>
      <button type="button" class="btn btn-primary" data-confirm-yes>Да</button>
    </div>
  `}function It(e,t,n,a=()=>{},r){var g,b;lt(),e.classList.add((r==null?void 0:r.anchorClass)??"confirm-ask");const s=document.createElement("div");s.id="appConfirmPop",s.className=`prio-confirm prio-confirm-float${r!=null&&r.wide?" prio-confirm-wide":""}`,s.setAttribute("data-stop-edit",""),s.innerHTML=We(t),document.body.appendChild(s);const o=()=>{const k=e.getBoundingClientRect(),y=s.getBoundingClientRect();let w=k.right+8,R=k.top+k.height/2-y.height/2;w+y.width>window.innerWidth-8&&(w=Math.max(8,k.left-y.width-8)),R=Math.max(8,Math.min(R,window.innerHeight-y.height-8)),s.style.left=`${w}px`,s.style.top=`${R}px`};o();const c=()=>o();window.addEventListener("scroll",c,!0),window.addEventListener("resize",c);const l=()=>{window.removeEventListener("scroll",c,!0),window.removeEventListener("resize",c),document.removeEventListener("mousedown",f,!0)},d=()=>{l(),lt(),a()},i=()=>{l(),lt(),n()},f=k=>{const y=k.target;s.contains(y)||e.contains(y)||d()};document.addEventListener("mousedown",f,!0),(g=s.querySelector("[data-confirm-yes]"))==null||g.addEventListener("click",k=>{k.stopPropagation(),i()}),(b=s.querySelector("[data-confirm-no]"))==null||b.addEventListener("click",k=>{k.stopPropagation(),d()})}function Fe(e){return m.items.filter(t=>t.assignments.some(n=>n.teamId===e)).length}function Ae(e){m.teams=m.teams.filter(t=>t.id!==e),m.items=m.items.map(t=>({...t,assignments:t.assignments.filter(n=>n.teamId!==e)})).filter(t=>t.assignments.length>0),p.teamFilter===e&&(p.teamFilter="all"),O()}function Ne(e,t){const n=V(e);if(!n)return;if(m.teams.length<=1){It(t,"Нельзя удалить последнюю команду.",()=>{},()=>{},{wide:!0});return}const a=Fe(e),r=`${n.capacityPw} чел·нед/нед`,s=a>0?`Удалить «<strong>${L(n.name)}</strong>» (${r}/нед)?<br/>Снимется с <span class="accent">${a}</span> инициатив. Карточки без команд тоже удалятся.`:`Удалить «<strong>${L(n.name)}</strong>» (${r}/нед)?`;It(t,s,()=>Ae(e),()=>{},{wide:!0})}function Mt(e,t,n,a){It(e,t,n,a,{anchorClass:"prio-ask"})}function Be(){if(p.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,n=null;const a=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(s=>s.classList.remove("is-dragging","drag-over"))},r=(s,o)=>{if(s===o)return;const c=Array.from(e.querySelectorAll("tr[data-row-id]")).map(g=>g.dataset.rowId),l=c.indexOf(s),d=c.indexOf(o);if(l<0||d<0)return;const i=[...c];i.splice(l,1),i.splice(d,0,s);const f=p.sortDir==="asc"?i:[...i].reverse();m.items=ie(m.items,f,W()),p.sortKey="priority",O()};e.querySelectorAll("[data-drag-handle]").forEach(s=>{const o=s.closest("tr[data-row-id]");if(!o)return;s.addEventListener("pointerdown",l=>{l.button===0&&(l.preventDefault(),l.stopPropagation(),t=o.dataset.rowId??null,n=l.pointerId,s.setPointerCapture(l.pointerId),a(),o.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),s.addEventListener("pointermove",l=>{if(t==null||l.pointerId!==n)return;const d=document.elementFromPoint(l.clientX,l.clientY),i=d==null?void 0:d.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(f=>f.classList.remove("drag-over")),i&&i.dataset.rowId!==t&&i.classList.add("drag-over")});const c=l=>{if(t==null||l.pointerId!==n)return;const d=t,i=document.elementFromPoint(l.clientX,l.clientY),f=i==null?void 0:i.closest("tr[data-row-id]"),g=f==null?void 0:f.dataset.rowId;try{s.releasePointerCapture(l.pointerId)}catch{}a(),document.body.classList.remove("prio-dragging"),t=null,n=null,g&&r(d,g)};s.addEventListener("pointerup",c),s.addEventListener("pointercancel",c)})}function C(){Pt(),Y();const{slices:e,rollups:t}=yt(m),n=document.querySelector("#app");if(!n)return;const a=p.editingId!=null?m.items.find(r=>r.id===p.editingId)??null:null;n.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${At()}">${Bt(At())}</span>
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
        <h1>VI Planer — ${Dt[p.tab]}</h1>
        <p>Старт портфеля: ${m.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${Le(t,e)}
      <div class="tabs no-print">
        <button class="tab ${p.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${p.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${p.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${p.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${p.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
        <button class="tab ${p.tab==="settings"?"active":""}" data-tab="settings">Настройки</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${p.tab==="portfolio"?Ee(t):p.tab==="teams"?Pe(e):p.tab==="queuesTest"?Ie(e):p.tab==="timeline"?Me(t,e):p.tab==="settings"?ze(t):_e()}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${p.creating||a?Te(a):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,Oe()}function zt(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const n of e){if(!n.checked)continue;const a=n.dataset.team,r=document.querySelector(`.f_team_size[data-team="${a}"]`),s=document.querySelector(`.f_team_start[data-team="${a}"]`),o=ft(r==null?void 0:r.value),c=U((s==null?void 0:s.value)||m.startDate);t.push({teamId:a,size:o,workStartDate:c})}return t}function te(){var o,c,l,d,i,f,g;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),n=zt();if(e&&(e.textContent=String(n.reduce((b,k)=>b+K(k.size,W()),0)||0)),!t)return;if(!n.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const a=(p.editingId?m.items.find(b=>b.id===p.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:n,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},r={...a,id:p.editingId||"__draft__",assignments:n,title:((o=document.querySelector("#f_title"))==null?void 0:o.value.trim())||a.title,type:((c=document.querySelector("#f_type"))==null?void 0:c.value)||a.type,status:((l=document.querySelector("#f_status"))==null?void 0:l.value)||a.status,businessValue:Number((d=document.querySelector("#f_bv"))==null?void 0:d.value)||a.businessValue,timeCriticality:Number((i=document.querySelector("#f_tc"))==null?void 0:i.value)||a.timeCriticality,riskReduction:Number((f=document.querySelector("#f_rr"))==null?void 0:f.value)||a.riskReduction,jobSize:Number((g=document.querySelector("#f_js"))==null?void 0:g.value)||a.jobSize,manualRank:(()=>{var y;const b=(y=document.querySelector("#f_rank"))==null?void 0:y.value,k=Math.round(Number(b));return Number.isFinite(k)&&k>=1?k:a.manualRank??Z(m.items)})()},s=Yt(r);if(!s){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=Zt(s,n)}function ee(){const e=(s,o)=>{const c=document.querySelector(`#${s}`),l=Number(c==null?void 0:c.value);return Number.isFinite(l)?l:o},t=s=>{var o;return((o=document.querySelector(`#${s}`))==null?void 0:o.value)??""},n=zt();if(!n.length)return alert("Выберите хотя бы одну команду"),null;const a=t("f_rank").trim(),r=Math.max(1,Math.round(Number(a)||Z(m.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:n,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:dt(e("f_bv",5),1,10),timeCriticality:dt(e("f_tc",5),1,10),riskReduction:dt(e("f_rr",5),1,10),jobSize:dt(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:r}}function dt(e,t,n){return Math.min(n,Math.max(t,e))}function O(){rt(m),C()}function Oe(){var d,i,f,g,b,k,y,w,R,x,E,I,M,P,F,q,_;document.querySelectorAll("[data-tab]").forEach(u=>{u.addEventListener("click",()=>{p.tab=u.dataset.tab,C()})}),document.querySelectorAll(".set-range").forEach(u=>{u.addEventListener("input",()=>Ce())}),(d=document.querySelector("#resetSizeRanges"))==null||d.addEventListener("click",()=>{m.sizeRanges=mt(void 0),O()});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{p.query=e.value}),e==null||e.addEventListener("change",()=>C());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{p.typeFilter=t.value,C()});const n=document.querySelector("#teamFilter");n==null||n.addEventListener("change",()=>{p.teamFilter=n.value,C()});const a=document.querySelector("#statusFilter");a==null||a.addEventListener("change",()=>{p.statusFilter=a.value,C()}),(i=document.querySelector("#addItem"))==null||i.addEventListener("click",()=>{p.creating=!0,p.editingId=null,C()}),(f=document.querySelector("#resetFilters"))==null||f.addEventListener("click",()=>{p.typeFilter="all",p.teamFilter="all",p.statusFilter="all",p.query="",p.sortKey="priority",p.sortDir="asc",C()}),document.querySelectorAll("[data-edit]").forEach(u=>{u.addEventListener("click",v=>{v.target.closest("[data-stop-edit], .prio-input, .prio-edit, #appConfirmPop, .drag-handle")||(p.editingId=u.dataset.edit??null,p.creating=!1,C())})}),Be(),document.querySelectorAll(".prio-input").forEach(u=>{const v=u.dataset.prioId,h=()=>{const S=m.items.find(z=>z.id===v);u.value=String((S==null?void 0:S.manualRank)??1)},D=()=>{const S=m.items.find(Xe=>Xe.id===v);if(!S)return;const z=Number(u.value);if(!Number.isFinite(z)||z<1){h();return}const j=Math.round(z);if(u.value=String(j),j===S.manualRank)return;const ut=st(m.items,j,v),Ge=ut?`Сменить на <span class="accent">${j}</span>?<br/>«${L(ut.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${j}</span>?`;Mt(u,Ge,()=>{m.items=gt(m.items,v,j,W()),O()},h)};u.addEventListener("click",S=>S.stopPropagation()),u.addEventListener("mousedown",S=>S.stopPropagation()),u.addEventListener("keydown",S=>{S.key==="Enter"&&(S.preventDefault(),D()),S.key==="Escape"&&(Pt(),h(),u.blur())}),u.addEventListener("change",D)}),document.querySelectorAll("[data-sort]").forEach(u=>{u.addEventListener("click",v=>{if(v.target.closest("[data-col-resize]"))return;v.stopPropagation();const h=u.dataset.sort;(h==="wsjf"||h==="estimate"||h==="eta"||h==="priority")&&De(h)})}),Ve();const r=()=>{p.creating=!1,p.editingId=null,C()};(g=document.querySelector("#closeModal"))==null||g.addEventListener("click",r),(b=document.querySelector("#closeModal2"))==null||b.addEventListener("click",r),(k=document.querySelector("#modal"))==null||k.addEventListener("click",u=>{u.target.id==="modal"&&r()}),document.querySelectorAll(".f_team_check").forEach(u=>{u.addEventListener("change",()=>{const v=u.dataset.team,h=document.querySelector(`.f_team_size[data-team="${v}"]`),D=document.querySelector(`.f_team_start[data-team="${v}"]`);h&&(h.disabled=!u.checked),D&&(D.disabled=!u.checked),te()})});const s=document.querySelector("#teamAssignList"),o=u=>{const v=u.target;v&&(v.classList.contains("f_team_size")||v.classList.contains("f_team_start")||v.classList.contains("f_team_check"))&&te()};s==null||s.addEventListener("input",o),s==null||s.addEventListener("change",o),s==null||s.addEventListener("keyup",o),(y=document.querySelector("#saveItem"))==null||y.addEventListener("click",()=>{const u=ee();if(!u)return;const v=u.manualRank??Z(m.items),h=document.querySelector("#f_rank"),D=()=>{if(st(m.items,v,null)){const j=tt("item");m.items=[...m.items,{...u,id:j,manualRank:m.items.length+1}],m.items=gt(m.items,j,v,W())}else m.items.push({...u,id:tt("item"),manualRank:v}),m.items=G(m.items,W());p.creating=!1,p.editingId=null,O()},S=()=>{if(!p.editingId)return;const z=m.items.findIndex(ut=>ut.id===p.editingId);if(z<0)return;const j=m.items[z];v!==j.manualRank?(m.items[z]={...j,...u,manualRank:j.manualRank},m.items=gt(m.items,p.editingId,v,W())):m.items[z]={...j,...u},p.creating=!1,p.editingId=null,O()};if(p.creating){const z=st(m.items,v,null);if(z&&h){Mt(h,`Занять <span class="accent">${v}</span>?<br/>«${L(z.title)}» сдвинется вверх.`,D,()=>{});return}D();return}if(p.editingId){const z=m.items.find(j=>j.id===p.editingId);if(z&&v!==z.manualRank&&h){const j=st(m.items,v,p.editingId);Mt(h,j?`Сменить на <span class="accent">${v}</span>?<br/>«${L(j.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${v}</span>?`,S,()=>{});return}S()}}),(w=document.querySelector("#deleteItem"))==null||w.addEventListener("click",()=>{p.editingId&&(m.items=m.items.filter(u=>u.id!==p.editingId),p.editingId=null,O())}),["f_bv","f_tc","f_rr","f_js"].forEach(u=>{var v;(v=document.querySelector(`#${u}`))==null||v.addEventListener("input",()=>{const h=document.querySelector("#liveWsjf");if(!h)return;const D=ee();D&&(h.textContent=String(N({...D})))})});const c=document.querySelector("#ganttWeeks");c==null||c.addEventListener("input",()=>{const u=Math.max(4,Math.min(52,Number(c.value)||16));p.ganttWeeks=u;const v=document.querySelector("#ganttWeeksLabel");v&&(v.textContent=`${u} нед.`)}),c==null||c.addEventListener("change",()=>{p.ganttWeeks=Math.max(4,Math.min(52,Number(c.value)||16)),C()}),document.querySelectorAll("[data-team-name]").forEach(u=>{const v=()=>{const h=u.dataset.teamName,D=m.teams.find(z=>z.id===h);if(!D)return;const S=u.value.trim()||D.name;u.value=S,S!==D.name&&(D.name=S,O())};u.addEventListener("change",v),u.addEventListener("keydown",h=>{h.key==="Enter"&&(h.preventDefault(),u.blur())})}),document.querySelectorAll("[data-cap]").forEach(u=>{u.addEventListener("input",()=>{const v=u.dataset.cap,h=m.teams.find(S=>S.id===v);if(!h)return;h.capacityPw=Number(u.value),rt(m);const D=document.querySelector(`[data-cap-label="${v}"]`);D&&(D.textContent=String(h.capacityPw))}),u.addEventListener("change",()=>C())}),document.querySelectorAll("[data-tab-jump]").forEach(u=>{u.addEventListener("click",v=>{v.preventDefault(),p.tab=u.dataset.tabJump,C()})}),document.querySelectorAll("[data-team-delete]").forEach(u=>{u.addEventListener("click",v=>{v.stopPropagation();const h=u.dataset.teamDelete;Ne(h,u)})});const l=()=>{const u=document.querySelector("#newTeamName"),v=(u==null?void 0:u.value.trim())||"";if(!v){u==null||u.focus();return}m.teams.push({id:tt("team"),name:v,capacityPw:3,color:Gt()}),u&&(u.value=""),O()};(R=document.querySelector("#cancelNewTeam"))==null||R.addEventListener("click",()=>{const u=document.querySelector("#newTeamName");u&&(u.value=""),u==null||u.focus()}),(x=document.querySelector("#saveNewTeam"))==null||x.addEventListener("click",l),(E=document.querySelector("#newTeamName"))==null||E.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),l())}),(I=document.querySelector("#exportPdfBtn"))==null||I.addEventListener("click",()=>{Je()}),(M=document.querySelector("#downloadReqsBtn"))==null||M.addEventListener("click",()=>{Ue()}),(P=document.querySelector("#exportBtn"))==null||P.addEventListener("click",()=>{const u=new Blob([JSON.stringify(m,null,2)],{type:"application/json"}),v=URL.createObjectURL(u),h=document.createElement("a");h.href=v,h.download=`vi-planer-${m.startDate}.json`,h.click(),URL.revokeObjectURL(v)}),(F=document.querySelector("#importBtn"))==null||F.addEventListener("click",()=>{var u;(u=document.querySelector("#fileInput"))==null||u.click()}),(q=document.querySelector("#fileInput"))==null||q.addEventListener("change",async u=>{var h;const v=(h=u.target.files)==null?void 0:h[0];if(v)try{const D=await v.text(),S=bt(JSON.parse(D));if(!S){alert("Неверный формат файла");return}m=S,O()}catch{alert("Не удалось прочитать JSON")}}),(_=document.querySelector("#resetBtn"))==null||_.addEventListener("click",u=>{u.stopPropagation(),He(u.currentTarget)})}function Y(){var e,t;(e=document.querySelector("#resetPop"))==null||e.remove(),(t=document.querySelector("#resetBtn"))==null||t.classList.remove("reset-ask")}function He(e){var c,l;Y(),Pt(),e.classList.add("reset-ask");const t=document.createElement("div");t.id="resetPop",t.className="reset-confirm",t.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(t);const n=()=>{const d=e.getBoundingClientRect(),i=t.offsetWidth,f=t.offsetHeight;let g=d.right-i,b=d.bottom+6;g<8&&(g=8),g+i>window.innerWidth-8&&(g=window.innerWidth-i-8),b+f>window.innerHeight-8&&(b=d.top-f-6),t.style.left=`${Math.max(8,g)}px`,t.style.top=`${Math.max(8,b)}px`};n();const a=()=>n();window.addEventListener("scroll",a,!0),window.addEventListener("resize",a);const r=()=>{window.removeEventListener("scroll",a,!0),window.removeEventListener("resize",a),window.removeEventListener("keydown",s),document.removeEventListener("mousedown",o)},s=d=>{d.key==="Escape"&&(r(),Y())},o=d=>{const i=d.target;t.contains(i)||e.contains(i)||(r(),Y())};(c=t.querySelector("#resetCancelBtn"))==null||c.addEventListener("click",()=>{r(),Y()}),(l=t.querySelector("#resetConfirmBtn"))==null||l.addEventListener("click",()=>{r(),Y(),m=structuredClone($t),O()}),window.addEventListener("keydown",s),window.setTimeout(()=>document.addEventListener("mousedown",o),0)}function Ve(){const e=document.querySelector(".portfolio-table");e&&e.querySelectorAll("[data-col-resize]").forEach(t=>{t.addEventListener("pointerdown",n=>{n.preventDefault(),n.stopPropagation();const a=t.dataset.colResize;if(!a)return;const r=t.closest("th");if(!r)return;const s=Kt(Ut[a],a),o=n.clientX,c=r.getBoundingClientRect().width,l=n.pointerId;t.setPointerCapture(l),document.body.classList.add("col-resizing");const d=f=>{const g=Math.max(s,Math.round(c+(f.clientX-o)));r.style.width=`${g}px`,r.style.minWidth=`${s}px`},i=f=>{t.releasePointerCapture(l),t.removeEventListener("pointermove",d),t.removeEventListener("pointerup",i),t.removeEventListener("pointercancel",i),document.body.classList.remove("col-resizing");const g=Math.max(s,Math.round(r.getBoundingClientRect().width)),b=Jt();b[a]=g,Se(b),r.style.width=`${g}px`};t.addEventListener("pointermove",d),t.addEventListener("pointerup",i),t.addEventListener("pointercancel",i)})})}async function Ue(){const e="/vi_planer/",t=new URL("VI-Planer-requirements.md",new URL(e,window.location.href)).href;try{const n=await fetch(t);if(!n.ok)throw new Error(String(n.status));const a=await n.text(),r=new Blob([a],{type:"text/markdown;charset=utf-8"}),s=URL.createObjectURL(r),o=document.createElement("a");o.href=s,o.download="VI-Planer-requirements.md",o.click(),URL.revokeObjectURL(s)}catch(n){console.error(n),alert("Не удалось скачать файл требований")}}async function Je(){const e=document.querySelector("#exportPdfBtn"),t=document.querySelector("#pdfCapture");if(!t){alert("Не удалось найти содержимое для экспорта");return}const n=(e==null?void 0:e.textContent)??"Экспорт PDF";e&&(e.disabled=!0,e.textContent="PDF…");const a=new Date().toISOString().slice(0,10),r=`VI Planer — ${Dt[p.tab]} · ${a}`,s=`VI-Planer-${Dt[p.tab]}-${a}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await ve(t,s,r)}catch(o){console.error(o),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),e&&(e.disabled=!1,e.textContent=n)}}async function Ke(){m=await pe();const e=m.items.map(n=>n.manualRank).join(",");m={...m,items:G(m.items,W())};const t=m.items.map(n=>n.manualRank).join(",");e!==t&&rt(m),re(n=>{const a=document.querySelector("#syncStatus");a&&(a.dataset.status=n,a.textContent=Bt(n))}),C()}Ke()})();
