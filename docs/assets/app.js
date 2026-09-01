(function(){"use strict";const W={S:{min:1,max:2},M:{min:2,max:4},L:{min:4,max:8}};function bt(e){const t={S:{...W.S},M:{...W.M},L:{...W.L}};if(!e||typeof e!="object")return t;for(const n of Q){const o=e[n];if(!o||typeof o!="object")continue;const r=o;let a=Math.round(Number(r.min)),i=Math.round(Number(r.max));Number.isFinite(a)||(a=t[n].min),Number.isFinite(i)||(i=t[n].max),a=Math.max(1,a),i=Math.max(a,i),t[n]={min:a,max:i}}if(t.S.max>12||t.M.max>12||t.L.max>12)for(const n of Q)t[n]={min:Math.max(1,Math.round(t[n].min/7)),max:Math.max(1,Math.round(t[n].max/7))},t[n].max<t[n].min&&(t[n].max=t[n].min);return t}function X(e,t=W){const n=t[e];return Math.round((n.min+n.max)/2*10)/10}function Bt(e,t=W){const n=t[e];return`${e} (${n.min}–${n.max} нед.)`}function ht(e){return Q.map(t=>Bt(t,e)).join(", ")}const Q=["S","M","L"];function wt(e){const t=String(e??"").toUpperCase();return t==="S"||t==="M"||t==="L"?t:"M"}function Ht(e,t=3){const n=e/Math.max(t,.5);return n<=2?"S":n<=4?"M":"L"}function ge(e){return e.usedPw>e.capacityPw+.001}function ye(e,t){return t<=0?e>0?100:0:Math.round(e/t*100)}function be(e,t=52){const n=e.sizeRanges??W,o={};for(const r of e.teams){const a=Array.from({length:t},()=>0);for(const l of e.items)if(l.status!=="done")for(const c of l.assignments){if(c.teamId!==r.id)continue;let s=X(c.size,n),m=Vt(e.startDate,c.workStartDate);for(;s>.001&&m<t;){const v=Math.min(r.capacityPw,s);a[m]+=v,s-=v,m+=1}}const i=new Set;a.forEach((l,c)=>{l>r.capacityPw+.001&&i.add(c)}),o[r.id]=i}return o}function B(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function U(e,t=W){return e.assignments.reduce((n,o)=>n+X(o.size,t),0)}function he(e,t){return e.assignments.some(n=>n.teamId===t)}function kt(e,t){const n=new Date(e+"T12:00:00");return n.setDate(n.getDate()+t),n.toISOString().slice(0,10)}function H(e,t){return kt(e,t*7)}function we(e){return e.reduce((t,n)=>n.endDate!==t.endDate?n.endDate>t.endDate?n:t:n.estimatePw!==t.estimatePw?n.estimatePw>t.estimatePw?n:t:n.durationWeeks>t.durationWeeks?n:t)}function L(e){const[t,n,o]=e.split("-");return`${o}.${n}.${t}`}function ct(e=new Date){const t=new Date(e),n=t.getDay(),o=n===0?-6:1-n;return t.setDate(t.getDate()+o),t.toISOString().slice(0,10)}function K(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?ct():ct(new Date(e.slice(0,10)+"T12:00:00"))}function Vt(e,t){const n=new Date(K(e)+"T12:00:00").getTime(),o=new Date(K(t)+"T12:00:00").getTime();return Math.max(0,Math.round((o-n)/(168*3600*1e3)))}function nt(e,t=W){return[...e].sort((n,o)=>{const r=n.manualRank,a=o.manualRank;if(r!=null&&a!=null&&r!==a)return r-a;if(r!=null&&a==null)return-1;if(r==null&&a!=null)return 1;const i=B(o)-B(n);return i!==0?i:U(n,t)-U(o,t)})}function lt(e,t,n){return e.find(o=>o.id!==n&&o.manualRank!=null&&o.manualRank===t)}function $t(e,t,n,o=W){const r=nt(e,o),a=r.findIndex(s=>s.id===t);if(a<0)return e;const i=[...r],[l]=i.splice(a,1),c=Math.max(0,Math.min(i.length,Math.round(n)-1));i.splice(c,0,l);const f=new Map(i.map((s,m)=>[s.id,m+1]));return e.map(s=>{const m=f.get(s.id);return m==null||s.manualRank===m?s:{...s,manualRank:m}})}function ke(e,t,n=W){if(t.length<2)return e;const o=nt(e,n),r=new Set(t),a=new Map(e.map(s=>[s.id,s])),i=t.map(s=>a.get(s)).filter(s=>!!s);let l=0;const c=[];for(const s of o)if(r.has(s.id)){const m=i[l++];m&&c.push(m)}else c.push(s);for(;l<i.length;)c.push(i[l++]);const f=new Map(c.map((s,m)=>[s.id,m+1]));return e.map(s=>{const m=f.get(s.id);return m==null||s.manualRank===m?s:{...s,manualRank:m}})}function at(e){let t=0;for(const n of e)n.manualRank!=null&&n.manualRank>t&&(t=n.manualRank);return t+1}function Z(e,t=W){const n=[...e].sort((l,c)=>{const f=B(c)-B(l);return f!==0?f:U(l,t)-U(c,t)}),o=new Set,r=new Map;for(const l of n){const c=l.manualRank;c!=null&&Number.isFinite(c)&&c>=1&&!o.has(c)&&(o.add(c),r.set(l.id,c))}let a=1;const i=()=>{for(;o.has(a);)a+=1;const l=a;return o.add(l),a+=1,l};return e.map(l=>{const c=r.get(l.id)??i();return l.manualRank===c?l:{...l,manualRank:c}})}function St(e){const t=e.sizeRanges??W,n=e.items.filter(s=>s.status!=="done"),o=nt(n,t),r=new Map;for(const s of e.teams)r.set(s.id,[]);for(const s of o)for(const m of s.assignments){const v=r.get(m.teamId)??[];v.push({item:s,size:m.size,workStartDate:K(m.workStartDate||e.startDate)}),r.set(m.teamId,v)}const a=[],i={},l=52;for(const s of e.teams){const m=r.get(s.id)??[],v=Array.from({length:l},(b,k)=>({week:k,weekStart:H(e.startDate,k),usedPw:0,capacityPw:s.capacityPw,items:[]}));let y=0;m.forEach((b,k)=>{const z=X(b.size,t),q=Vt(e.startDate,b.workStartDate);let D=Math.max(y,q);for(;D<l&&v[D].usedPw>=s.capacityPw-.001;)D+=1;let w=z,$=D,C=H(e.startDate,D);const A=H(e.startDate,D);for(;w>.001&&$<l;){const T=v[$],R=Math.max(0,s.capacityPw-T.usedPw);if(R<=.001){$+=1;continue}const E=Math.min(R,w),O=H(e.startDate,$),u=E/s.capacityPw*7,g=T.usedPw/s.capacityPw*7;C=kt(O,g+u),T.usedPw+=E,T.items.includes(b.item.id)||T.items.push(b.item.id),w-=E,w>.001&&($+=1)}const _=s.capacityPw>0?Math.round(z/s.capacityPw*100)/100:z;a.push({item:b.item,teamId:s.id,size:b.size,estimatePw:z,wsjf:B(b.item),effectiveRank:k+1,plannedStartDate:b.workStartDate,startWeek:D,endWeek:$,startDate:A,endDate:C,waitWeeks:D,delayedByQueue:D>q,durationWeeks:_}),y=$,v[y]&&v[y].usedPw>=s.capacityPw-.001?y=$+1:y=$}),i[s.id]=v}const c=new Map;for(const s of a){const m=c.get(s.item.id)??[];m.push(s),c.set(s.item.id,m)}const f=[];for(const s of o){const m=c.get(s.id)??[];if(!m.length)continue;const v=we(m),y=m.reduce((b,k)=>k.startWeek<b.startWeek?k:b);f.push({item:s,slices:[...m].sort((b,k)=>b.endDate===k.endDate?k.estimatePw-b.estimatePw:b.endDate<k.endDate?1:-1),wsjf:B(s),totalEstimateWeeks:U(s,t),startWeek:y.startWeek,endWeek:v.endWeek,startDate:y.startDate,endDate:v.endDate,waitWeeks:y.waitWeeks,bottleneckTeamId:v.teamId})}return a.sort((s,m)=>s.startWeek!==m.startWeek?s.startWeek-m.startWeek:m.wsjf-s.wsjf),{slices:a,rollups:f,load:i}}function st(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function Lt(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const n=K(String(t.startDate??ct())),o=t.teams.map(l=>{const c=l,f=Number(c.capacityPw),s=Number.isFinite(f)&&f>0?f:null,m=c.capacity!=null?{S:2,M:3.5,L:5}[wt(c.capacity)]:null;return{id:String(c.id??st("team")),name:String(c.name??"Команда"),color:String(c.color??"#737373"),capacityPw:s??m??3}}),r=new Map(o.map(l=>[l.id,l.capacityPw])),a=t.items.map(l=>{const c=l;let f=[];return Array.isArray(c.assignments)&&c.assignments.length?f=c.assignments.filter(s=>s&&typeof s.teamId=="string").map(s=>{const m=String(s.teamId),v=r.get(m)??3,y=s.size!=null?wt(s.size):Ht(Number(s.estimatePw)||1,v);return{teamId:m,size:y,workStartDate:K(String(s.workStartDate||c.workStartDate||n))}}):typeof c.teamId=="string"&&(f=[{teamId:c.teamId,size:Ht(Number(c.estimatePw)||1,r.get(c.teamId)??3),workStartDate:n}]),!f.length&&o[0]&&(f=[{teamId:o[0].id,size:"M",workStartDate:n}]),{id:String(c.id??st("item")),title:String(c.title??"Без названия"),type:c.type==="project"?"project":"product",backlog:String(c.backlog??"Backlog"),assignments:f,status:["idea","ready","in_progress","blocked","done"].includes(String(c.status))?c.status:"idea",owner:String(c.owner??"—"),businessValue:Number(c.businessValue)||5,timeCriticality:Number(c.timeCriticality)||5,riskReduction:Number(c.riskReduction)||5,jobSize:Number(c.jobSize)||5,notes:c.notes!=null?String(c.notes):void 0,manualRank:c.manualRank==null||c.manualRank===""?null:Number(c.manualRank)}}),i=bt(t.sizeRanges);return{version:3,startDate:n,teams:o,sizeRanges:i,items:Z(a,i)}}const N=ct(),xt=H(N,1),dt=H(N,2),Ut=H(N,3),Pt=H(N,4),Et=H(N,6),Jt=H(N,8),Kt={version:3,startDate:N,sizeRanges:{S:{...W.S},M:{...W.M},L:{...W.L}},teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#d60000"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#455a64"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#737373"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#e65100"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"M",workStartDate:N}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",size:"S",workStartDate:xt}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",size:"S",workStartDate:Pt}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",size:"S",workStartDate:N}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",size:"S",workStartDate:Et}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",size:"M",workStartDate:N},{teamId:"data",size:"M",workStartDate:Ut}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",size:"M",workStartDate:xt},{teamId:"crm",size:"S",workStartDate:Pt}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",size:"M",workStartDate:dt},{teamId:"platform",size:"S",workStartDate:dt}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",size:"M",workStartDate:xt},{teamId:"platform",size:"S",workStartDate:N}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",size:"M",workStartDate:N},{teamId:"platform",size:"S",workStartDate:dt},{teamId:"mobile",size:"S",workStartDate:Et}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",size:"M",workStartDate:Ut},{teamId:"data",size:"S",workStartDate:Pt},{teamId:"mobile",size:"S",workStartDate:Jt}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",size:"L",workStartDate:dt},{teamId:"platform",size:"S",workStartDate:Et},{teamId:"mobile",size:"S",workStartDate:Jt}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},Dt={...Kt,items:Z(Kt.items)},Yt="vi-planer-v3";let Gt="idle",ut=[];function $e(){return null}function Xt(){return Gt}function Se(e){return ut.push(e),()=>{ut=ut.filter(t=>t!==e)}}function it(e){Gt=e,ut.forEach(t=>t(e))}function Le(){try{const e=localStorage.getItem(Yt)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=Lt(JSON.parse(e));return t?{...t,items:Z(t.items,t.sizeRanges)}:null}catch{return null}}function Qt(e){localStorage.setItem(Yt,JSON.stringify(e))}async function xe(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),n=Lt(t.state);return n?{...n,items:Z(n.items,n.sizeRanges)}:null}catch{return null}}async function Pe(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function Ee(){return null}async function De(e){return!1}async function Re(){it("loading");const e=await xe()??await Ee()??Le()??structuredClone(Dt);return Qt(e),it(($e(),"saved")),e}let Rt=null,It=null;function mt(e){Qt(e),It=e,Rt&&clearTimeout(Rt),Rt=setTimeout(async()=>{const t=It;if(It=null,!t)return;it("loading");const n=await De(),o=n?!0:await Pe(t);if(n||o){it("saved");return}it("offline")},350)}function Zt(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function te(e){const t=document.querySelector(`script[data-pdf-lib="${e}"]`);return t?t.dataset.loaded==="1"?Promise.resolve():new Promise((n,o)=>{t.addEventListener("load",()=>n()),t.addEventListener("error",()=>o(new Error(`Failed to load ${e}`)))}):new Promise((n,o)=>{const r=document.createElement("script");r.src=e,r.async=!0,r.dataset.pdfLib=e,r.onload=()=>{r.dataset.loaded="1",n()},r.onerror=()=>o(new Error(`Failed to load ${e}`)),document.head.appendChild(r)})}async function Ie(){var n,o;window.html2canvas||await te("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(n=window.jspdf)!=null&&n.jsPDF||await te("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const e=window.html2canvas,t=(o=window.jspdf)==null?void 0:o.jsPDF;if(!e||!t)throw new Error("PDF libraries failed to load");return{html2canvas:e,jsPDF:t}}async function Me(e,t,n){const{html2canvas:o,jsPDF:r}=await Ie(),a=await o(e,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f4f4f4",logging:!1,windowWidth:Math.max(e.scrollWidth,e.clientWidth),windowHeight:Math.max(e.scrollHeight,e.clientHeight)}),i=a.toDataURL("image/png"),l=new r({orientation:"landscape",unit:"mm",format:"a4"}),c=l.internal.pageSize.getWidth(),f=l.internal.pageSize.getHeight(),s=8,m=8,v=c-s*2,y=f-s*2-m,b=v,k=a.height*b/a.width;let z=k,q=s+m,D=0;for(;z>0;){D>0&&l.addPage(),D===0&&(l.setFontSize(11),l.setTextColor(15,23,42),l.text(n,s,s+4)),l.addImage(i,"PNG",s,q,b,k);const w=D===0?y:f-s*2;if(z-=w,q-=w,D+=1,D>40)break}l.save(t)}const Mt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды",settings:"Настройки"},d={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16,showTeamLoad:!1,hiddenCols:[],colPickerOpen:!1};let p=structuredClone(Dt);function F(){return p.sizeRanges}function J(e){return p.teams.find(t=>t.id===e)}function zt(e,t,n,o){const r=100/o,a=Array.from({length:o},(i,l)=>{const c=t[l],f=(c==null?void 0:c.usedPw)??0,s=e.capacityPw,m=ye(f,s),v=n.has(l)||c!=null&&ge(c),y=["cap-cell",v?"cap-cell-overflow":m>=99?"cap-cell-full":""].filter(Boolean).join(" "),b=`Н${l+1}: ${f.toFixed(1)}/${s} чел·нед${v?" · превышение":""}`;return`<div class="${y}" style="width:${r}%" title="${G(b)}"><span style="height:${Math.min(100,m)}%"></span></div>`}).join("");return`<div class="cap-strip" style="--team-color:${e.color}">${a}</div>`}function jt(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function ee(e){return new Map(e.map(t=>[t.item.id,t]))}function ze(e){return e.assignments.map(t=>t.size).join(" + ")}function je(e,t){return e.filter(n=>n.teamId===t).reduce((n,o)=>n+o.estimatePw,0)}function Ce(e){return Q.map(t=>`<option value="${t}" ${e===t?"selected":""}>${Bt(t,F())}</option>`).join("")}function qe(e){return e.assignments.map(t=>{const n=J(t.teamId);return(n==null?void 0:n.name)??t.teamId}).join(", ")}function _e(e){return`<div class="teams-stack">${e.assignments.map(n=>{const o=J(n.teamId),r=(o==null?void 0:o.name)??n.teamId,a=`${r} ${n.size} · старт ${L(n.workStartDate)}`;return`<span class="team-chip" title="${G(a)}"><span class="team-chip-name"><span class="team-dot" style="background:${(o==null?void 0:o.color)??"#94a3b8"}"></span><span class="team-chip-text">${P(r)}</span></span><span class="team-chip-estimate"><span class="size-badge mono">${n.size}</span><span class="mono muted-inline">старт ${L(n.workStartDate)}</span></span></span>`}).join("")}</div>`}function Te(e){const t=d.query.trim().toLowerCase(),n=ee(e),o=p.items.filter(a=>d.typeFilter!=="all"&&a.type!==d.typeFilter||d.teamFilter!=="all"&&!he(a,d.teamFilter)||d.statusFilter!=="all"&&a.status!==d.statusFilter?!1:t?a.title.toLowerCase().includes(t)||a.backlog.toLowerCase().includes(t)||a.owner.toLowerCase().includes(t)||qe(a).toLowerCase().includes(t):!0);if(d.sortKey==="priority"){const a=nt(o);return d.sortDir==="asc"?a:[...a].reverse()}const r=d.sortDir==="asc"?1:-1;return[...o].sort((a,i)=>{var c,f;let l=0;if(d.sortKey==="wsjf")l=B(a)-B(i);else if(d.sortKey==="estimate")l=U(a,F())-U(i,F());else{const s=((c=n.get(a.id))==null?void 0:c.endDate)??"9999-99-99",m=((f=n.get(i.id))==null?void 0:f.endDate)??"9999-99-99";l=s<m?-1:s>m?1:0}return l!==0?l*r:a.title.localeCompare(i.title,"ru")})}const Ct="vi-planer-col-widths",ne="vi-planer-col-hidden",ae="vi-planer-show-team-load",se=["type","teams","status","wsjf","estimate","eta"],We=["priority","type","title","teams","status","wsjf","estimate","eta"],qt={priority:"Приоритет",type:"Тип",title:"Инициатива / исходный бэклог",teams:"Команды (майка · старт)",status:"Статус",wsjf:"WSJF",estimate:"Оценка, майки",eta:"ETA"},Ae={priority:96,type:88,title:260,teams:220,status:130,wsjf:72,estimate:120,eta:140};function ie(){try{const e=localStorage.getItem(Ct);return e?JSON.parse(e):{}}catch{return{}}}function Fe(e){localStorage.setItem(Ct,JSON.stringify(e))}function Oe(){localStorage.removeItem(Ct)}function Ne(){try{const e=localStorage.getItem(ne);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t.filter(n=>se.includes(n)):[]}catch{return[]}}function oe(e){localStorage.setItem(ne,JSON.stringify(e))}function Be(){try{return localStorage.getItem(ae)==="1"}catch{return!1}}function He(e){localStorage.setItem(ae,e?"1":"0")}function _t(){return`
    <label class="team-load-toggle">
      <input type="checkbox" id="showTeamLoad" ${d.showTeamLoad?"checked":""} />
      Показать загрузку команд
    </label>`}function pt(e){return e==="priority"||e==="title"?!0:!d.hiddenCols.includes(e)}function Ve(){return We.filter(pt).length}function Ue(e,t){const n=t?d.hiddenCols.filter(o=>o!==e):d.hiddenCols.includes(e)?d.hiddenCols:[...d.hiddenCols,e];d.hiddenCols=n,oe(n),j()}const Tt={};function re(e,t){if(t&&Tt[t]!=null)return Tt[t];const n=document.createElement("span");n.textContent=e,n.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:IBM Plex Sans,system-ui,sans-serif;padding:0;",document.body.appendChild(n);const o=Math.ceil(n.getBoundingClientRect().width);n.remove();const r=Math.max(56,o+36);return t&&(Tt[t]=r),r}function Je(e){const t=ie()[e],n=re(qt[e],e);return`width:${Math.max(n,t??Ae[e])}px;min-width:${n}px`}function ot(e,t,n="",o){const r=o!=null&&d.sortKey===o,a=!r||!o?"":d.sortDir==="asc"?" ↑":" ↓",i=o?`sortable ${r?"sorted":""}`:"",l=pt(t)?"":" col-hidden",c=o?` data-sort="${o}"`:"";return`<th class="resizable-th ${i}${l} ${n}" data-col="${t}"${c}${o?' title="Сортировать"':""} style="${Je(t)}"><span class="th-label">${e}${a}</span><span class="col-resize" data-col-resize="${t}" title="Изменить ширину"></span></th>`}function ft(e,t,n=""){const r={priority:"priority",wsjf:"wsjf",estimate:"estimate",eta:"eta"}[t];if(!r){const a=d.sortKey===t,i=a?d.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${a?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${i}</th>`}return ot(e,r,n,t)}function Ke(){return`
    <details class="col-picker" ${d.colPickerOpen?"open":""}>
      <summary class="btn col-picker-toggle">Колонки</summary>
      <div class="col-picker-menu">
        ${se.map(e=>`
          <label class="col-picker-item">
            <input
              type="checkbox"
              class="col-visibility"
              data-col="${e}"
              ${pt(e)?"checked":""}
            />
            ${P(qt[e])}
          </label>`).join("")}
      </div>
    </details>
  `}let rt=null;function vt(){rt==null||rt()}function ce(e){vt();const t=o=>{const r=o.target;e.contains(r)||(vt(),d.colPickerOpen=!1,j())};rt=()=>{document.removeEventListener("mousedown",t),rt=null},window.setTimeout(()=>document.addEventListener("mousedown",t),0)}function Y(e,t=""){const n=[t,pt(e)?"":"col-hidden"].filter(Boolean).join(" ");return` data-col="${e}"${n?` class="${n}"`:""}`}function Ye(e){d.sortKey===e?d.sortDir=d.sortDir==="asc"?"desc":"asc":(d.sortKey=e,d.sortDir=e==="wsjf"?"desc":"asc"),j()}function Ge(e,t){const n=p.items.filter(f=>f.status!=="done"),o=n.filter(f=>f.type==="product").length,r=n.filter(f=>f.type==="project").length,a=n.filter(f=>f.assignments.length>1).length,i=e.map(f=>f.endWeek),l=i.length?Math.max(...i)+1:0,c=p.teams.filter(f=>je(t,f.id)>f.capacityPw*8).length;return`
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${n.length}</div>
        <div class="hint">${o} продуктов · ${r} проектов · ${a} кросс-командных</div>
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
        <div class="value" style="font-size:18px">${L(p.startDate)}</div>
        <div class="hint">понедельник текущей недели</div>
      </div>
    </div>
  `}function Xe(){return`
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
  `}function Qe(e,t){const n=ee(e),o=Te(e),r=d.sortKey==="priority",a=o.map(i=>{const l=n.get(i.id),c=B(i),f=U(i,F()),s=i.manualRank??"—",m=l?`<div class="eta-teams">${l.slices.map(v=>{const y=J(v.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(y==null?void 0:y.color)??"#64748b"}">${P((y==null?void 0:y.name)??v.teamId)}</span>: ${L(v.startDate)}→${L(v.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${r?"row-draggable":""}" data-edit="${i.id}" data-row-id="${i.id}">
          <td${Y("priority","prio-cell")}>
            <div class="prio-edit" data-stop-edit>
              ${r?'<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>':""}
              <input
                class="prio-input"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-prio-id="${i.id}"
                value="${s}"
                title="Приоритет (1 = выше)"
                aria-label="Приоритет"
              />
            </div>
          </td>
          <td${Y("type","type-cell")}>
            <span class="badge badge-${i.type}">${i.type==="product"?"Продукт":"Проект"}</span>
            ${i.assignments.length>1?`<div class="type-team-count">${i.assignments.length} команды</div>`:""}
          </td>
          <td${Y("title","title-cell")}>
            <div class="name">${P(i.title)}</div>
            <div class="meta">${P(i.backlog)} · ${P(i.owner)}</div>
          </td>
          <td${Y("teams","teams-cell")}>${_e(i)}</td>
          <td${Y("status","status-cell")}><span class="badge badge-status-${i.status}">${jt(i.status)}</span></td>
          <td${Y("wsjf","wsjf-cell mono metric-num")}>${c}</td>
          <td${Y("estimate","estimate-cell mono metric-num")}>
            <span class="size-badge">${ze(i)}</span>
            <div class="meta">~${f} чел·нед</div>
          </td>
          <td${Y("eta",`mono eta-cell ${l&&l.waitWeeks>4?"eta-late":"eta-good"}`)}>
            ${l?`<span class="eta-final">${L(l.endDate)}</span>`:"—"}
            ${m}
          </td>
        </tr>
      `}).join("");return`
    ${Xe()}
    <div class="panel">
      <div class="panel-header">
        <h2>Единый портфель (проекты + продукты)</h2>
        <div class="filters">
          <input id="q" placeholder="Поиск…" value="${G(d.query)}" />
          <select id="typeFilter">
            <option value="all" ${d.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${d.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${d.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${p.teams.map(i=>`<option value="${i.id}" ${d.teamFilter===i.id?"selected":""}>${P(i.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(i=>`<option value="${i}" ${d.statusFilter===i?"selected":""}>${jt(i)}</option>`).join("")}
          </select>
          ${Ke()}
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
                ${ft("Приоритет","priority")}
                ${ot("Тип","type","type-cell")}
                ${ot("Инициатива / исходный бэклог","title","title-cell")}
                ${ot("Команды (оценка · старт)","teams")}
                ${ot("Статус","status","status-cell")}
                ${ft("WSJF","wsjf","wsjf-cell")}
                ${ft("Оценка, майки","estimate","estimate-cell")}
                ${ft("ETA","eta")}
              </tr>
            </thead>
            <tbody id="portfolioBody">
              ${a||`<tr><td colspan="${Ve()}" class="empty">Нет элементов по фильтру</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `}function Ze(e,t,n){const r=p.teams.map(a=>{const i=e.filter(s=>s.teamId===a.id).sort((s,m)=>s.effectiveRank-m.effectiveRank),l=i.reduce((s,m)=>s+m.estimatePw,0),c=a.capacityPw>0?l/a.capacityPw:0,f=Math.min(100,Math.round(i.filter(s=>s.startWeek<8).reduce((s,m)=>{const v=Math.min(m.endWeek+1,8)-m.startWeek;return s+Math.max(0,v)*(m.estimatePw/Math.max(1,m.endWeek-m.startWeek+1))},0)/(a.capacityPw*8)*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${P(a.name)}</h3>
              <div class="meta">Ёмкость ${a.capacityPw} чел·нед/нед · спрос ${l.toFixed(1)} · ~${c.toFixed(1)} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${f}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,f)}%;background:${a.color}"></span></div>
          ${d.showTeamLoad?`<div class="cap-strip-wrap">
            <div class="cap-strip-label meta">Загрузка по неделям (эксп.)</div>
            ${zt(a,t[a.id]??[],n[a.id]??new Set,12)}
          </div>`:""}
          ${i.map(s=>{const m=s.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${s.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${s.item.type}">${s.item.type==="product"?"П":"Пр"}</span> ${P(s.item.title)}</div>
                <div class="meta">WSJF ${s.wsjf} · ${s.size} (${s.estimatePw} чел·нед) · план ${L(s.plannedStartDate)}${s.delayedByQueue?" → сдвиг":""}${m>0?` · ещё ${m} ком.`:""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${L(s.startDate)} →<br/>${L(s.endDate)}
              </div>
            </div>
          `}).join("")||'<div class="empty">Очередь пуста</div>'}
        </div>
      `}).join("");return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
        ${_t()}
      </div>
      ${r}
    </div>
  `}function tn(e,t,n){const o=p.startDate,r=12,a=p.teams.map(i=>{const l=e.filter(v=>v.teamId===i.id).sort((v,y)=>{const b=v.item.manualRank??9999,k=y.item.manualRank??9999;return b!==k?b-k:v.effectiveRank-y.effectiveRank}),c=l.reduce((v,y)=>v+y.estimatePw,0),f=i.capacityPw>0?c/i.capacityPw:0,s=l.length?l[l.length-1].endDate:o,m=l.map((v,y)=>{const b=v.item.manualRank??"—",k=y>0?l[y-1]:null;let z="может взять сразу (очередь свободна)",q="take-now";v.startDate>v.plannedStartDate?(z=k?`ждёт очередь: после #${k.item.manualRank??"?"} «${k.item.title}»`:"сдвиг из‑за загрузки очереди",q="take-queue"):v.startDate>o&&(z=`ждёт плановый старт ${L(v.plannedStartDate)}`,q="take-plan");const D=v.item.assignments.filter(w=>w.teamId!==i.id).map(w=>{var $;return(($=J(w.teamId))==null?void 0:$.name)??w.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${b}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${v.item.type}">${v.item.type==="product"?"П":"Пр"}</span>
                  ${P(v.item.title)}
                </div>
                <div class="take-line ${q}">
                  <strong>Может взять с ${L(v.startDate)}</strong>
                  <span class="meta"> · ${P(z)}</span>
                </div>
                <div class="meta">
                  ${v.size} (${v.estimatePw} чел·нед) · план ${L(v.plannedStartDate)} · до ${L(v.endDate)}
                  ${D.length?` · ещё: ${D.map(P).join(", ")}`:""}
                </div>
                <div class="take-bar" title="Окно работы в горизонте 12 нед.">
                  <span class="take-bar-fill" style="left:${v.startWeek/12*100}%;width:${Math.max(3,(v.endWeek-v.startWeek+1)/12*100)}%;background:${i.color}"></span>
                </div>
              </div>
              <div class="mono queue-item-dates">
                <div class="meta">старт</div>
                <div>${L(v.startDate)}</div>
                <div class="meta" style="margin-top:6px">конец</div>
                <div>${L(v.endDate)}</div>
              </div>
            </div>
          `}).join("")||`<div class="empty">Очередь пуста — команда свободна с ${L(o)}</div>`;return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${i.color}"></span>${P(i.name)}</h3>
              <div class="meta">Ёмкость ${i.capacityPw} чел·нед/нед · спрос ${c.toFixed(1)} · ~${f.toFixed(1)} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${L(s)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          ${d.showTeamLoad?`<div class="cap-strip-wrap">
            <div class="cap-strip-label meta">Загрузка по неделям (эксп.)</div>
            ${zt(i,t[i.id]??[],n[i.id]??new Set,r)}
          </div>`:""}
          ${m}
        </div>
      `}).join("");return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда команда освобождается с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
        ${_t()}
      </div>
      ${a}
    </div>
  `}function en(e,t,n,o){const r=Math.max(4,...e.map(w=>w.endWeek+2),4),a=Math.max(4,Math.min(52,Math.round(d.ganttWeeks)||16));d.ganttWeeks=a;const i=nt(p.items.filter(w=>w.status!=="done")),l=new Map(i.map((w,$)=>[w.id,$])),c=100/a,f=`repeating-linear-gradient(90deg, #f5f5f5 0, #f5f5f5 calc(${c}% - 1px), #e0e0e0 calc(${c}% - 1px), #e0e0e0 ${c}%)`,s=[],m=[];p.teams.forEach((w,$)=>{const C=t.filter(_=>_.teamId===w.id).sort((_,T)=>_.effectiveRank-T.effectiveRank);if(C.length<2)return;const A=`arrow-${w.id}`;m.push(`
      <marker id="${A}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${w.color}" fill-opacity="0.85" />
      </marker>
    `);for(let _=1;_<C.length;_++){const T=C[_-1],R=C[_],E=(l.get(T.item.id)??0)+.5,O=(l.get(R.item.id)??0)+.5,u=Math.min(a-.05,T.endWeek+.92),g=Math.min(a-.05,Math.max(.08,R.startWeek+.02)),h=g-u,x=($%4-1.5)*.08,S=Math.max(.35,Math.abs(h)*.45)+Math.abs(x),I=u+(h>=0?S:-S*.35)+x,M=g-(h>=0?S:-S*.35)+x,et=Math.abs(E-O)<.02?`M ${u} ${E} H ${g}`:`M ${u} ${E} C ${I} ${E}, ${M} ${O}, ${g} ${O}`;s.push(`<path d="${et}" fill="none" stroke="${w.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${A})" />`)}});const v=[],y=[];for(const w of i){const $=e.find(R=>R.item.id===w.id);if(!$)continue;const C=$.slices.map(R=>{const E=t.filter(h=>h.teamId===R.teamId).sort((h,x)=>h.effectiveRank-x.effectiveRank),O=E.findIndex(h=>h.item.id===w.id);if(O<=0)return null;const u=E[O-1],g=J(R.teamId);return`#${u.item.manualRank} (${(g==null?void 0:g.name)??R.teamId})`}).filter(Boolean),A=[...new Set(C)],_=A.length?`<div class="meta gantt-dep-meta">после ${A.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',T=$.slices.map(R=>{const E=J(R.teamId),O=R.startWeek/a*100,u=Math.max(1,R.endWeek-R.startWeek+1)/a*100;return`<div class="gantt-bar ${R.teamId===$.bottleneckTeamId?"gantt-bot":""}" style="left:${O}%;width:${Math.max(u,2.5)}%;background:${(E==null?void 0:E.color)??"#64748b"}" title="${G((E==null?void 0:E.name)??"")}: ${L(R.endDate)}">${P((E==null?void 0:E.name)??"")}</div>`}).join("");v.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${w.manualRank??"—"}</span> ${P(w.title)}</div>
        <div class="meta">${w.type==="product"?"Продукт":"Проект"} · ETA ${L($.endDate)}</div>
        ${_}
      </div>
    `),y.push(`<div class="gantt-track gantt-track-multi" style="background:${f}">${T}</div>`)}const b=Math.max(1,i.length),k=a<=12?1:a<=24?2:a<=36?3:4,z=w=>p.teams.some($=>{var C;return(C=o[$.id])==null?void 0:C.has(w)}),q=Array.from({length:a},(w,$)=>{const C=$%k===0||$===a-1,A=d.showTeamLoad&&z($)?" gantt-axis-tick-overflow":"";if(!C)return`<div class="gantt-axis-tick gantt-axis-tick-empty${A}" style="width:${c}%"></div>`;const _=H(p.startDate,$),[,T,R]=_.split("-");return`<div class="gantt-axis-tick${A}" style="width:${c}%">
      <span class="gantt-axis-w">Н${$+1}</span>
      <span class="gantt-axis-d">${R}.${T}</span>
    </div>`}).join(""),D=p.teams.map(w=>{const $=o[w.id]??new Set,C=[...$].some(A=>A<a);return`
        <div class="gantt-cap-row">
          <div class="gantt-cap-label">
            <span class="team-dot" style="background:${w.color}"></span>
            ${P(w.name)}
            ${C?'<span class="cap-overflow-badge">перегруз</span>':""}
          </div>
          ${zt(w,n[w.id]??[],$,a)}
        </div>`}).join("");return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сроки и зависимости по приоритету</h2>
        <div class="gantt-weeks-ctrl">
          ${_t()}
          <div class="gantt-weeks-ctrl-right">
            <label for="ganttWeeks">Горизонт</label>
            <input id="ganttWeeks" type="range" min="4" max="52" step="1" value="${a}" />
            <span class="mono" id="ganttWeeksLabel">${a} нед.</span>
            ${r>a?`<span class="meta">часть работ за горизонтом (нужно ~${r})</span>`:""}
          </div>
        </div>
      </div>
      <div class="timeline">
        ${i.length?`<div class="gantt-layout">
          <div class="gantt-labels-col">
            <div class="gantt-axis-spacer">
              <span class="meta">нед. с ${L(p.startDate)}</span>
            </div>
            ${v.join("")}
          </div>
          <div class="gantt-tracks-wrap">
            <div class="gantt-axis">${q}</div>
            <div class="gantt-tracks-col">
              <svg class="gantt-dep-layer" viewBox="0 0 ${a} ${b}" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  ${m.join("")}
                </defs>
                ${s.join("")}
              </svg>
              ${y.join("")}
            </div>
            ${d.showTeamLoad?`<div class="gantt-capacity-block">
              <div class="gantt-capacity-head meta">Загрузка команд (эксперимент) — оранжевый/красный = перегруз по плановым стартам</div>
              <div class="gantt-capacity-rows">${D}</div>
            </div>`:""}
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.${d.showTeamLoad?" Красная подсветка — плановый спрос команды в неделю выше ёмкости (очередь сдвигает старт).":""}</p>
    </div>
  `}const Wt=["#d60000","#455a64","#737373","#c62828","#e65100","#1a1a1a","#8d6e63","#546e7a","#b71c1c","#f57c00"];function le(){const e=new Set(p.teams.map(t=>t.color));return Wt.find(t=>!e.has(t))??Wt[p.teams.length%Wt.length]}function nn(e){const t=p.sizeRanges,n=p.items.filter(i=>i.status!=="done"),o=e.map(i=>i.endWeek),r=o.length?Math.max(...o)+1:0;return`
    <div class="callout">
      Диапазоны майок — <strong>сколько недель</strong> заложено в оценке проекта (S / M / L). Для плана берётся середина диапазона.
      Изменения сразу перестраивают ETA и Gantt.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Майки (S / M / L)</h2>
        <button type="button" class="btn" id="resetSizeRanges">Сбросить по умолчанию</button>
      </div>
      <div class="size-ranges-grid">${Q.map(i=>`
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
          <strong id="settingsRangesSummary">${ht(t)}</strong>
        </div>
      </div>
    </div>
  `}function an(){const e={};for(const t of Q){const n=document.querySelector(`#set_${t}_min`),o=document.querySelector(`#set_${t}_max`);if(!n||!o)return null;e[t]={min:Math.round(Number(n.value)),max:Math.round(Number(o.value))}}return bt(e)}function sn(e){var i;const t=p.sizeRanges;for(const l of Q)(i=document.querySelector(`[data-plan="${l}"]`))==null||i.replaceChildren(document.createTextNode(`${X(l,t)} нед.`));const n=e.map(l=>l.endWeek),o=n.length?Math.max(...n)+1:0,r=document.querySelector("#settingsHorizon");r&&(r.textContent=`${o} нед.`);const a=document.querySelector("#settingsSchedPreview #settingsRangesSummary");a&&(a.textContent=ht(t))}let de;function on(){const e=an();if(!e)return;p.sizeRanges=e,mt(p);const{rollups:t}=St(p);sn(t);const n=document.activeElement,o=n!=null&&n.classList.contains("set-range")?n.id:null;clearTimeout(de),de=setTimeout(()=>{if(j(),o){const r=document.querySelector(`#${o}`);r==null||r.focus(),r==null||r.select()}},200)}function rn(){return`
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
        <span class="team-dot" id="newTeamDot" style="background:${le()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">+ Команда</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function cn(e){var f;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((f=p.teams[0])==null?void 0:f.id)??"",size:"M",workStartDate:p.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:at(p.items)},n=B(t),o=new Set(t.assignments.map(s=>s.teamId)),r=new Map(t.assignments.map(s=>[s.teamId,s.size])),a=new Map(t.assignments.map(s=>[s.teamId,s.workStartDate])),i=ue(t),l=i?pe(i,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',c=p.teams.map(s=>{const m=o.has(s.id),v=r.get(s.id)??"M",y=a.get(s.id)??p.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${s.id}" ${m?"checked":""} />
            <span class="team-dot" style="background:${s.color}"></span>
            <span class="team-assign-name">${P(s.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Майка</span>
            <select class="f_team_size" data-team="${s.id}" ${m?"":"disabled"}>${Ce(v)}</select>
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${s.id}" value="${y}" ${m?"":"disabled"} />
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
                ${["idea","ready","in_progress","blocked","done"].map(s=>`<option value="${s}" ${t.status===s?"selected":""}>${jt(s)}</option>`).join("")}
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
            <div class="meta" style="margin-top:6px">${ht(F())}. Итого ~<strong class="mono" id="liveTotalEst">${U(t,F())}</strong> чел·нед. Старт — не раньше указанной даты; если очередь занята, сдвинется позже.</div>
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
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??at(p.items)}" />
              <div class="meta" style="margin-top:6px">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
            </div>
            <div class="field">
              <label>Заметки</label>
              <textarea id="f_notes">${P(t.notes??"")}</textarea>
            </div>
          </div>
        </div>
        ${e?`<div class="modal-foot">
          <button class="btn" id="deleteItem" style="color:var(--bad)">Удалить</button>
        </div>`:""}
      </div>
    </div>
  `}function ue(e){const t=e.assignments.length?e.assignments:Nt();if(!t.length)return null;const n=e.id||"__draft__",o={...e,id:n,assignments:t},r=p.items.some(i=>i.id===n)?p.items.map(i=>i.id===n?o:i):[...p.items,o],{rollups:a}=St({...p,items:r});return a.find(i=>i.item.id===n)??null}function me(e){const t=J(e.teamId),n=(t==null?void 0:t.capacityPw)||1,o=X(e.size,F()),r=Math.round(o/n*100)/100,a=K(e.workStartDate||p.startDate),i=kt(a,r*7);return{start:a,end:i,weeks:r}}function pe(e,t){const n=new Map(t.map(a=>[a.teamId,a])),o=e.slices.map(a=>{const i=J(a.teamId),l=n.get(a.teamId),c=l?K(l.workStartDate):a.plannedStartDate,f=l?me(l):null,s=a.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",m=a.startDate>c?` <span class="meta">(план ${L(c)}, очередь сдвинула на ${L(a.startDate)})</span>`:a.startDate<c?` <span class="meta">(ждём план ${L(c)})</span>`:"",v=f?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${L(f.start)} → <span class="mono">${L(f.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${P((i==null?void 0:i.name)??a.teamId)}</strong>: <span class="mono">${L(a.startDate)} → ${L(a.endDate)}</span> <span class="meta">(${a.size} · ${a.estimatePw} чел·нед ≈ ${a.durationWeeks} нед.)</span>${m}${s}${v}</div>`}).join(""),r=t.map(a=>me(a).end).reduce((a,i)=>a>i?a:i,"0000-00-00");return o+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${L(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${L(r)}</strong> — меняется сразу при смене даты</div>`}function P(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function G(e){return P(e).replaceAll("'","&#39;")}function gt(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),document.querySelectorAll(".confirm-ask").forEach(t=>{t.classList.remove("confirm-ask")}),(e=document.querySelector("#appConfirmPop"))==null||e.remove()}function At(){gt()}function ln(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-confirm-no>Нет</button>
      <button type="button" class="btn btn-primary" data-confirm-yes>Да</button>
    </div>
  `}function Ft(e,t,n,o=()=>{},r){var v,y;gt(),e.classList.add((r==null?void 0:r.anchorClass)??"confirm-ask");const a=document.createElement("div");a.id="appConfirmPop",a.className=`prio-confirm prio-confirm-float${r!=null&&r.wide?" prio-confirm-wide":""}`,a.setAttribute("data-stop-edit",""),a.innerHTML=ln(t),document.body.appendChild(a);const i=()=>{const b=e.getBoundingClientRect(),k=a.getBoundingClientRect();let z=b.right+8,q=b.top+b.height/2-k.height/2;z+k.width>window.innerWidth-8&&(z=Math.max(8,b.left-k.width-8)),q=Math.max(8,Math.min(q,window.innerHeight-k.height-8)),a.style.left=`${z}px`,a.style.top=`${q}px`};i();const l=()=>i();window.addEventListener("scroll",l,!0),window.addEventListener("resize",l);const c=()=>{window.removeEventListener("scroll",l,!0),window.removeEventListener("resize",l),document.removeEventListener("mousedown",m,!0)},f=()=>{c(),gt(),o()},s=()=>{c(),gt(),n()},m=b=>{const k=b.target;a.contains(k)||e.contains(k)||f()};document.addEventListener("mousedown",m,!0),(v=a.querySelector("[data-confirm-yes]"))==null||v.addEventListener("click",b=>{b.stopPropagation(),s()}),(y=a.querySelector("[data-confirm-no]"))==null||y.addEventListener("click",b=>{b.stopPropagation(),f()})}function dn(e){return p.items.filter(t=>t.assignments.some(n=>n.teamId===e)).length}function un(e){p.teams=p.teams.filter(t=>t.id!==e),p.items=p.items.map(t=>({...t,assignments:t.assignments.filter(n=>n.teamId!==e)})).filter(t=>t.assignments.length>0),d.teamFilter===e&&(d.teamFilter="all"),V()}function mn(e,t){const n=J(e);if(!n)return;if(p.teams.length<=1){Ft(t,"Нельзя удалить последнюю команду.",()=>{},()=>{},{wide:!0});return}const o=dn(e),r=`${n.capacityPw} чел·нед/нед`,a=o>0?`Удалить «<strong>${P(n.name)}</strong>» (${r}/нед)?<br/>Снимется с <span class="accent">${o}</span> инициатив. Карточки без команд тоже удалятся.`:`Удалить «<strong>${P(n.name)}</strong>» (${r}/нед)?`;Ft(t,a,()=>un(e),()=>{},{wide:!0})}function Ot(e,t,n,o){Ft(e,t,n,o,{anchorClass:"prio-ask"})}function pn(){if(d.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,n=null;const o=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(a=>a.classList.remove("is-dragging","drag-over"))},r=(a,i)=>{if(a===i)return;const l=Array.from(e.querySelectorAll("tr[data-row-id]")).map(v=>v.dataset.rowId),c=l.indexOf(a),f=l.indexOf(i);if(c<0||f<0)return;const s=[...l];s.splice(c,1),s.splice(f,0,a);const m=d.sortDir==="asc"?s:[...s].reverse();p.items=ke(p.items,m,F()),d.sortKey="priority",V()};e.querySelectorAll("[data-drag-handle]").forEach(a=>{const i=a.closest("tr[data-row-id]");if(!i)return;a.addEventListener("pointerdown",c=>{c.button===0&&(c.preventDefault(),c.stopPropagation(),t=i.dataset.rowId??null,n=c.pointerId,a.setPointerCapture(c.pointerId),o(),i.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),a.addEventListener("pointermove",c=>{if(t==null||c.pointerId!==n)return;const f=document.elementFromPoint(c.clientX,c.clientY),s=f==null?void 0:f.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(m=>m.classList.remove("drag-over")),s&&s.dataset.rowId!==t&&s.classList.add("drag-over")});const l=c=>{if(t==null||c.pointerId!==n)return;const f=t,s=document.elementFromPoint(c.clientX,c.clientY),m=s==null?void 0:s.closest("tr[data-row-id]"),v=m==null?void 0:m.dataset.rowId;try{a.releasePointerCapture(c.pointerId)}catch{}o(),document.body.classList.remove("prio-dragging"),t=null,n=null,v&&r(f,v)};a.addEventListener("pointerup",l),a.addEventListener("pointercancel",l)})}function j(){At(),tt(),vt();const{slices:e,rollups:t,load:n}=St(p),o=be(p),r=document.querySelector("#app");if(!r)return;const a=d.editingId!=null?p.items.find(i=>i.id===d.editingId)??null:null;r.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${Xt()}">${Zt(Xt())}</span>
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
        <h1>VI Planer — ${Mt[d.tab]}</h1>
        <p>Старт портфеля: ${p.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${Ge(t,e)}
      <div class="tabs no-print">
        <button class="tab ${d.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${d.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${d.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${d.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${d.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
        <button class="tab tab-settings ${d.tab==="settings"?"active":""}" data-tab="settings">Настройки</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${d.tab==="portfolio"?Qe(t):d.tab==="teams"?Ze(e,n,o):d.tab==="queuesTest"?tn(e,n,o):d.tab==="timeline"?en(t,e,n,o):d.tab==="settings"?nn(t):rn()}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${d.creating||a?cn(a):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,fn()}function Nt(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const n of e){if(!n.checked)continue;const o=n.dataset.team,r=document.querySelector(`.f_team_size[data-team="${o}"]`),a=document.querySelector(`.f_team_start[data-team="${o}"]`),i=wt(r==null?void 0:r.value),l=K((a==null?void 0:a.value)||p.startDate);t.push({teamId:o,size:i,workStartDate:l})}return t}function fe(){var i,l,c,f,s,m,v;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),n=Nt();if(e&&(e.textContent=String(n.reduce((y,b)=>y+X(b.size,F()),0)||0)),!t)return;if(!n.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const o=(d.editingId?p.items.find(y=>y.id===d.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:n,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},r={...o,id:d.editingId||"__draft__",assignments:n,title:((i=document.querySelector("#f_title"))==null?void 0:i.value.trim())||o.title,type:((l=document.querySelector("#f_type"))==null?void 0:l.value)||o.type,status:((c=document.querySelector("#f_status"))==null?void 0:c.value)||o.status,businessValue:Number((f=document.querySelector("#f_bv"))==null?void 0:f.value)||o.businessValue,timeCriticality:Number((s=document.querySelector("#f_tc"))==null?void 0:s.value)||o.timeCriticality,riskReduction:Number((m=document.querySelector("#f_rr"))==null?void 0:m.value)||o.riskReduction,jobSize:Number((v=document.querySelector("#f_js"))==null?void 0:v.value)||o.jobSize,manualRank:(()=>{var k;const y=(k=document.querySelector("#f_rank"))==null?void 0:k.value,b=Math.round(Number(y));return Number.isFinite(b)&&b>=1?b:o.manualRank??at(p.items)})()},a=ue(r);if(!a){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=pe(a,n)}function ve(){const e=(a,i)=>{const l=document.querySelector(`#${a}`),c=Number(l==null?void 0:l.value);return Number.isFinite(c)?c:i},t=a=>{var i;return((i=document.querySelector(`#${a}`))==null?void 0:i.value)??""},n=Nt();if(!n.length)return alert("Выберите хотя бы одну команду"),null;const o=t("f_rank").trim(),r=Math.max(1,Math.round(Number(o)||at(p.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:n,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:yt(e("f_bv",5),1,10),timeCriticality:yt(e("f_tc",5),1,10),riskReduction:yt(e("f_rr",5),1,10),jobSize:yt(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:r}}function yt(e,t,n){return Math.min(n,Math.max(t,e))}function V(){mt(p),j()}function fn(){var s,m,v,y,b,k,z,q,D,w,$,C,A,_,T,R,E,O;document.querySelectorAll("[data-tab]").forEach(u=>{u.addEventListener("click",()=>{d.tab=u.dataset.tab,j()})}),document.querySelectorAll(".set-range").forEach(u=>{u.addEventListener("input",()=>on())}),(s=document.querySelector("#resetSizeRanges"))==null||s.addEventListener("click",()=>{p.sizeRanges=bt(void 0),V()});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{d.query=e.value}),e==null||e.addEventListener("change",()=>j());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{d.typeFilter=t.value,j()});const n=document.querySelector("#teamFilter");n==null||n.addEventListener("change",()=>{d.teamFilter=n.value,j()});const o=document.querySelector("#statusFilter");o==null||o.addEventListener("change",()=>{d.statusFilter=o.value,j()}),(m=document.querySelector("#showTeamLoad"))==null||m.addEventListener("change",u=>{d.showTeamLoad=u.target.checked,He(d.showTeamLoad),j()}),(v=document.querySelector("#addItem"))==null||v.addEventListener("click",()=>{d.creating=!0,d.editingId=null,j()}),(y=document.querySelector("#resetFilters"))==null||y.addEventListener("click",()=>{d.typeFilter="all",d.teamFilter="all",d.statusFilter="all",d.query="",d.sortKey="priority",d.sortDir="asc",d.hiddenCols=[],oe([]),Oe(),j()});const r=document.querySelector(".col-picker");r==null||r.addEventListener("toggle",()=>{d.colPickerOpen=r.open,r.open?ce(r):vt()}),d.colPickerOpen&&r&&ce(r),document.querySelectorAll(".col-visibility").forEach(u=>{u.addEventListener("change",()=>{const g=u.dataset.col;g&&Ue(g,u.checked)})}),document.querySelectorAll("[data-edit]").forEach(u=>{u.addEventListener("click",g=>{g.target.closest("[data-stop-edit], .prio-input, .prio-edit, #appConfirmPop, .drag-handle")||(d.editingId=u.dataset.edit??null,d.creating=!1,j())})}),pn(),document.querySelectorAll(".prio-input").forEach(u=>{const g=u.dataset.prioId,h=()=>{const S=p.items.find(I=>I.id===g);u.value=String((S==null?void 0:S.manualRank)??1)},x=()=>{const S=p.items.find($n=>$n.id===g);if(!S)return;const I=Number(u.value);if(!Number.isFinite(I)||I<1){h();return}const M=Math.round(I);if(u.value=String(M),M===S.manualRank)return;const et=lt(p.items,M,g),kn=et?`Сменить на <span class="accent">${M}</span>?<br/>«${P(et.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${M}</span>?`;Ot(u,kn,()=>{p.items=$t(p.items,g,M,F()),V()},h)};u.addEventListener("click",S=>S.stopPropagation()),u.addEventListener("mousedown",S=>S.stopPropagation()),u.addEventListener("keydown",S=>{S.key==="Enter"&&(S.preventDefault(),x()),S.key==="Escape"&&(At(),h(),u.blur())}),u.addEventListener("change",x)}),document.querySelectorAll("[data-sort]").forEach(u=>{u.addEventListener("click",g=>{if(g.target.closest("[data-col-resize]"))return;g.stopPropagation();const h=u.dataset.sort;(h==="wsjf"||h==="estimate"||h==="eta"||h==="priority")&&Ye(h)})}),yn(),gn();const a=()=>{d.creating=!1,d.editingId=null,j()};(b=document.querySelector("#closeModal"))==null||b.addEventListener("click",a),(k=document.querySelector("#closeModal2"))==null||k.addEventListener("click",a),(z=document.querySelector("#modal"))==null||z.addEventListener("click",u=>{u.target.id==="modal"&&a()}),document.querySelectorAll(".f_team_check").forEach(u=>{u.addEventListener("change",()=>{const g=u.dataset.team,h=document.querySelector(`.f_team_size[data-team="${g}"]`),x=document.querySelector(`.f_team_start[data-team="${g}"]`);h&&(h.disabled=!u.checked),x&&(x.disabled=!u.checked),fe()})});const i=document.querySelector("#teamAssignList"),l=u=>{const g=u.target;g&&(g.classList.contains("f_team_size")||g.classList.contains("f_team_start")||g.classList.contains("f_team_check"))&&fe()};i==null||i.addEventListener("input",l),i==null||i.addEventListener("change",l),i==null||i.addEventListener("keyup",l),(q=document.querySelector("#saveItem"))==null||q.addEventListener("click",()=>{const u=ve();if(!u)return;const g=u.manualRank??at(p.items),h=document.querySelector("#f_rank"),x=()=>{if(lt(p.items,g,null)){const M=st("item");p.items=[...p.items,{...u,id:M,manualRank:p.items.length+1}],p.items=$t(p.items,M,g,F())}else p.items.push({...u,id:st("item"),manualRank:g}),p.items=Z(p.items,F());d.creating=!1,d.editingId=null,V()},S=()=>{if(!d.editingId)return;const I=p.items.findIndex(et=>et.id===d.editingId);if(I<0)return;const M=p.items[I];g!==M.manualRank?(p.items[I]={...M,...u,manualRank:M.manualRank},p.items=$t(p.items,d.editingId,g,F())):p.items[I]={...M,...u},d.creating=!1,d.editingId=null,V()};if(d.creating){const I=lt(p.items,g,null);if(I&&h){Ot(h,`Занять <span class="accent">${g}</span>?<br/>«${P(I.title)}» сдвинется вверх.`,x,()=>{});return}x();return}if(d.editingId){const I=p.items.find(M=>M.id===d.editingId);if(I&&g!==I.manualRank&&h){const M=lt(p.items,g,d.editingId);Ot(h,M?`Сменить на <span class="accent">${g}</span>?<br/>«${P(M.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${g}</span>?`,S,()=>{});return}S()}}),(D=document.querySelector("#deleteItem"))==null||D.addEventListener("click",()=>{d.editingId&&(p.items=p.items.filter(u=>u.id!==d.editingId),d.editingId=null,V())}),["f_bv","f_tc","f_rr","f_js"].forEach(u=>{var g;(g=document.querySelector(`#${u}`))==null||g.addEventListener("input",()=>{const h=document.querySelector("#liveWsjf");if(!h)return;const x=ve();x&&(h.textContent=String(B({...x})))})});const c=document.querySelector("#ganttWeeks");c==null||c.addEventListener("input",()=>{const u=Math.max(4,Math.min(52,Number(c.value)||16));d.ganttWeeks=u;const g=document.querySelector("#ganttWeeksLabel");g&&(g.textContent=`${u} нед.`)}),c==null||c.addEventListener("change",()=>{d.ganttWeeks=Math.max(4,Math.min(52,Number(c.value)||16)),j()}),document.querySelectorAll("[data-team-name]").forEach(u=>{const g=()=>{const h=u.dataset.teamName,x=p.teams.find(I=>I.id===h);if(!x)return;const S=u.value.trim()||x.name;u.value=S,S!==x.name&&(x.name=S,V())};u.addEventListener("change",g),u.addEventListener("keydown",h=>{h.key==="Enter"&&(h.preventDefault(),u.blur())})}),document.querySelectorAll("[data-cap]").forEach(u=>{u.addEventListener("input",()=>{const g=u.dataset.cap,h=p.teams.find(S=>S.id===g);if(!h)return;h.capacityPw=Number(u.value),mt(p);const x=document.querySelector(`[data-cap-label="${g}"]`);x&&(x.textContent=String(h.capacityPw))}),u.addEventListener("change",()=>j())}),document.querySelectorAll("[data-tab-jump]").forEach(u=>{u.addEventListener("click",g=>{g.preventDefault(),d.tab=u.dataset.tabJump,j()})}),document.querySelectorAll("[data-team-delete]").forEach(u=>{u.addEventListener("click",g=>{g.stopPropagation();const h=u.dataset.teamDelete;mn(h,u)})});const f=()=>{const u=document.querySelector("#newTeamName"),g=(u==null?void 0:u.value.trim())||"";if(!g){u==null||u.focus();return}p.teams.push({id:st("team"),name:g,capacityPw:3,color:le()}),u&&(u.value=""),V()};(w=document.querySelector("#cancelNewTeam"))==null||w.addEventListener("click",()=>{const u=document.querySelector("#newTeamName");u&&(u.value=""),u==null||u.focus()}),($=document.querySelector("#saveNewTeam"))==null||$.addEventListener("click",f),(C=document.querySelector("#newTeamName"))==null||C.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),f())}),(A=document.querySelector("#exportPdfBtn"))==null||A.addEventListener("click",()=>{hn()}),(_=document.querySelector("#downloadReqsBtn"))==null||_.addEventListener("click",()=>{bn()}),(T=document.querySelector("#exportBtn"))==null||T.addEventListener("click",()=>{const u=new Blob([JSON.stringify(p,null,2)],{type:"application/json"}),g=URL.createObjectURL(u),h=document.createElement("a");h.href=g,h.download=`vi-planer-${p.startDate}.json`,h.click(),URL.revokeObjectURL(g)}),(R=document.querySelector("#importBtn"))==null||R.addEventListener("click",()=>{var u;(u=document.querySelector("#fileInput"))==null||u.click()}),(E=document.querySelector("#fileInput"))==null||E.addEventListener("change",async u=>{var h;const g=(h=u.target.files)==null?void 0:h[0];if(g)try{const x=await g.text(),S=Lt(JSON.parse(x));if(!S){alert("Неверный формат файла");return}p=S,V()}catch{alert("Не удалось прочитать JSON")}}),(O=document.querySelector("#resetBtn"))==null||O.addEventListener("click",u=>{u.stopPropagation(),vn(u.currentTarget)})}function tt(){var e,t;(e=document.querySelector("#resetPop"))==null||e.remove(),(t=document.querySelector("#resetBtn"))==null||t.classList.remove("reset-ask")}function vn(e){var l,c;tt(),At(),e.classList.add("reset-ask");const t=document.createElement("div");t.id="resetPop",t.className="reset-confirm",t.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(t);const n=()=>{const f=e.getBoundingClientRect(),s=t.offsetWidth,m=t.offsetHeight;let v=f.right-s,y=f.bottom+6;v<8&&(v=8),v+s>window.innerWidth-8&&(v=window.innerWidth-s-8),y+m>window.innerHeight-8&&(y=f.top-m-6),t.style.left=`${Math.max(8,v)}px`,t.style.top=`${Math.max(8,y)}px`};n();const o=()=>n();window.addEventListener("scroll",o,!0),window.addEventListener("resize",o);const r=()=>{window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",o),window.removeEventListener("keydown",a),document.removeEventListener("mousedown",i)},a=f=>{f.key==="Escape"&&(r(),tt())},i=f=>{const s=f.target;t.contains(s)||e.contains(s)||(r(),tt())};(l=t.querySelector("#resetCancelBtn"))==null||l.addEventListener("click",()=>{r(),tt()}),(c=t.querySelector("#resetConfirmBtn"))==null||c.addEventListener("click",()=>{r(),tt(),p=structuredClone(Dt),V()}),window.addEventListener("keydown",a),window.setTimeout(()=>document.addEventListener("mousedown",i),0)}function gn(){const e=document.querySelector(".table-scroll-wrap");if(!e)return;const t=e.querySelector(".table-scroll-top"),n=e.querySelector(".table-scroll"),o=e.querySelector(".table-scroll-top-inner"),r=e.querySelector(".portfolio-table");if(!t||!n||!o||!r)return;let a=!1;const i=()=>{o.style.width=`${r.offsetWidth}px`;const s=r.offsetWidth>n.clientWidth+1;t.style.display=s?"":"none",s&&!a&&(a=!0,t.scrollLeft=n.scrollLeft,a=!1)},l=()=>{a||(a=!0,t.scrollLeft=n.scrollLeft,a=!1)},c=()=>{a||(a=!0,n.scrollLeft=t.scrollLeft,a=!1)};i(),n.addEventListener("scroll",l),t.addEventListener("scroll",c);const f=new ResizeObserver(i);f.observe(r),f.observe(n),window.addEventListener("resize",i)}function yn(){const e=document.querySelector(".portfolio-table");e&&e.querySelectorAll("[data-col-resize]").forEach(t=>{t.addEventListener("pointerdown",n=>{n.preventDefault(),n.stopPropagation();const o=t.dataset.colResize;if(!o)return;const r=t.closest("th");if(!r)return;const a=re(qt[o],o),i=n.clientX,l=r.getBoundingClientRect().width,c=n.pointerId;t.setPointerCapture(c),document.body.classList.add("col-resizing");const f=m=>{const v=Math.max(a,Math.round(l+(m.clientX-i)));r.style.width=`${v}px`,r.style.minWidth=`${a}px`},s=m=>{t.releasePointerCapture(c),t.removeEventListener("pointermove",f),t.removeEventListener("pointerup",s),t.removeEventListener("pointercancel",s),document.body.classList.remove("col-resizing");const v=Math.max(a,Math.round(r.getBoundingClientRect().width)),y=ie();y[o]=v,Fe(y),r.style.width=`${v}px`};t.addEventListener("pointermove",f),t.addEventListener("pointerup",s),t.addEventListener("pointercancel",s)})})}async function bn(){const e="/vi_planer/",t=new URL("VI-Planer-requirements.md",new URL(e,window.location.href)).href;try{const n=await fetch(t);if(!n.ok)throw new Error(String(n.status));const o=await n.text(),r=new Blob([o],{type:"text/markdown;charset=utf-8"}),a=URL.createObjectURL(r),i=document.createElement("a");i.href=a,i.download="VI-Planer-requirements.md",i.click(),URL.revokeObjectURL(a)}catch(n){console.error(n),alert("Не удалось скачать файл требований")}}async function hn(){const e=document.querySelector("#exportPdfBtn"),t=document.querySelector("#pdfCapture");if(!t){alert("Не удалось найти содержимое для экспорта");return}const n=(e==null?void 0:e.textContent)??"Экспорт PDF";e&&(e.disabled=!0,e.textContent="PDF…");const o=new Date().toISOString().slice(0,10),r=`VI Planer — ${Mt[d.tab]} · ${o}`,a=`VI-Planer-${Mt[d.tab]}-${o}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await Me(t,a,r)}catch(i){console.error(i),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),e&&(e.disabled=!1,e.textContent=n)}}async function wn(){p=await Re(),d.hiddenCols=Ne(),d.showTeamLoad=Be();const e=p.items.map(n=>n.manualRank).join(",");p={...p,items:Z(p.items,F())};const t=p.items.map(n=>n.manualRank).join(",");e!==t&&mt(p),Se(n=>{const o=document.querySelector("#syncStatus");o&&(o.dataset.status=n,o.textContent=Zt(n))}),j()}wn()})();
