(function(){"use strict";function A(t){const e=t.businessValue+t.timeCriticality+t.riskReduction;return Math.round(e/Math.max(t.jobSize,.5)*100)/100}function N(t){return t.assignments.reduce((e,a)=>e+a.estimatePw,0)}function Wt(t,e){return t.assignments.some(a=>a.teamId===e)}function it(t,e){const a=new Date(t+"T12:00:00");return a.setDate(a.getDate()+e),a.toISOString().slice(0,10)}function F(t,e){return it(t,e*7)}function At(t){return t.reduce((e,a)=>a.endDate!==e.endDate?a.endDate>e.endDate?a:e:a.estimatePw!==e.estimatePw?a.estimatePw>e.estimatePw?a:e:a.durationWeeks>e.durationWeeks?a:e)}function $(t){const[e,a,s]=t.split("-");return`${s}.${a}.${e}`}function Q(t=new Date){const e=new Date(t),a=e.getDay(),s=a===0?-6:1-a;return e.setDate(e.getDate()+s),e.toISOString().slice(0,10)}function O(t){return!t||!/^\d{4}-\d{2}-\d{2}/.test(t)?Q():Q(new Date(t.slice(0,10)+"T12:00:00"))}function Ft(t,e){const a=new Date(O(t)+"T12:00:00").getTime(),s=new Date(O(e)+"T12:00:00").getTime();return Math.max(0,Math.round((s-a)/(168*3600*1e3)))}function U(t){return[...t].sort((e,a)=>{const s=e.manualRank,l=a.manualRank;if(s!=null&&l!=null&&s!==l)return s-l;if(s!=null&&l==null)return-1;if(s==null&&l!=null)return 1;const n=A(a)-A(e);return n!==0?n:N(e)-N(a)})}function X(t,e,a){return t.find(s=>s.id!==a&&s.manualRank!=null&&s.manualRank===e)}function ot(t,e,a){const s=U(t),l=s.findIndex(i=>i.id===e);if(l<0)return t;const n=[...s],[o]=n.splice(l,1),r=Math.max(0,Math.min(n.length,Math.round(a)-1));n.splice(r,0,o);const p=new Map(n.map((i,c)=>[i.id,c+1]));return t.map(i=>{const c=p.get(i.id);return c==null||i.manualRank===c?i:{...i,manualRank:c}})}function Nt(t,e){if(e.length<2)return t;const a=U(t),s=new Set(e),l=new Map(t.map(i=>[i.id,i])),n=e.map(i=>l.get(i)).filter(i=>!!i);let o=0;const r=[];for(const i of a)if(s.has(i.id)){const c=n[o++];c&&r.push(c)}else r.push(i);for(;o<n.length;)r.push(n[o++]);const p=new Map(r.map((i,c)=>[i.id,c+1]));return t.map(i=>{const c=p.get(i.id);return c==null||i.manualRank===c?i:{...i,manualRank:c}})}function Y(t){let e=0;for(const a of t)a.manualRank!=null&&a.manualRank>e&&(e=a.manualRank);return e+1}function H(t){const e=[...t].sort((o,r)=>{const p=A(r)-A(o);return p!==0?p:N(o)-N(r)}),a=new Set,s=new Map;for(const o of e){const r=o.manualRank;r!=null&&Number.isFinite(r)&&r>=1&&!a.has(r)&&(a.add(r),s.set(o.id,r))}let l=1;const n=()=>{for(;a.has(l);)l+=1;const o=l;return a.add(o),l+=1,o};return t.map(o=>{const r=s.get(o.id)??n();return o.manualRank===r?o:{...o,manualRank:r}})}function ht(t){const e=t.items.filter(i=>i.status!=="done"),a=U(e),s=new Map;for(const i of t.teams)s.set(i.id,[]);for(const i of a)for(const c of i.assignments){const v=s.get(c.teamId)??[];v.push({item:i,estimatePw:c.estimatePw,workStartDate:O(c.workStartDate||t.startDate)}),s.set(c.teamId,v)}const l=[],n={},o=52;for(const i of t.teams){const c=s.get(i.id)??[],v=Array.from({length:o},(g,w)=>({week:w,weekStart:F(t.startDate,w),usedPw:0,capacityPw:i.capacityPw,items:[]}));let y=0;c.forEach((g,w)=>{const h=Ft(t.startDate,g.workStartDate);let k=Math.max(y,h);for(;k<o&&v[k].usedPw>=i.capacityPw-.001;)k+=1;let E=g.estimatePw,D=k,L=F(t.startDate,k);const T=F(t.startDate,k);for(;E>.001&&D<o;){const S=v[D],C=Math.max(0,S.capacityPw-S.usedPw);if(C<=.001){D+=1;continue}const M=Math.min(C,E),d=F(t.startDate,D),f=M/S.capacityPw*7,b=S.usedPw/S.capacityPw*7;L=it(d,b+f),S.usedPw+=M,S.items.push(g.item.id),E-=M,E>.001&&(D+=1)}const q=i.capacityPw>0?Math.round(g.estimatePw/i.capacityPw*100)/100:g.estimatePw;l.push({item:g.item,teamId:i.id,estimatePw:g.estimatePw,wsjf:A(g.item),effectiveRank:w+1,plannedStartDate:g.workStartDate,startWeek:k,endWeek:D,startDate:T,endDate:L,waitWeeks:k,delayedByQueue:k>h,durationWeeks:q}),y=D,v[y]&&v[y].usedPw>=i.capacityPw-.001?y=D+1:y=D}),n[i.id]=v}const r=new Map;for(const i of l){const c=r.get(i.item.id)??[];c.push(i),r.set(i.item.id,c)}const p=[];for(const i of a){const c=r.get(i.id)??[];if(!c.length)continue;const v=At(c),y=c.reduce((g,w)=>w.startWeek<g.startWeek?w:g);p.push({item:i,slices:[...c].sort((g,w)=>g.endDate===w.endDate?w.estimatePw-g.estimatePw:g.endDate<w.endDate?1:-1),wsjf:A(i),totalEstimatePw:N(i),startWeek:y.startWeek,endWeek:v.endWeek,startDate:y.startDate,endDate:v.endDate,waitWeeks:y.waitWeeks,bottleneckTeamId:v.teamId})}return l.sort((i,c)=>i.startWeek!==c.startWeek?i.startWeek-c.startWeek:c.wsjf-i.wsjf),{slices:l,rollups:p,load:n}}function Z(t){return`${t}_${Math.random().toString(36).slice(2,9)}`}function rt(t){if(!t||typeof t!="object")return null;const e=t;if(!Array.isArray(e.teams)||!Array.isArray(e.items))return null;const a=O(String(e.startDate??Q())),s=e.items.map(l=>{const n=l;let o=[];return Array.isArray(n.assignments)&&n.assignments.length?o=n.assignments.filter(r=>r&&typeof r.teamId=="string").map(r=>({teamId:r.teamId,estimatePw:Math.max(.5,Number(r.estimatePw)||1),workStartDate:O(String(r.workStartDate||n.workStartDate||a))})):typeof n.teamId=="string"&&(o=[{teamId:n.teamId,estimatePw:Math.max(.5,Number(n.estimatePw)||1),workStartDate:a}]),!o.length&&Array.isArray(e.teams)&&e.teams[0]&&(o=[{teamId:e.teams[0].id,estimatePw:4,workStartDate:a}]),{id:String(n.id??Z("item")),title:String(n.title??"Без названия"),type:n.type==="project"?"project":"product",backlog:String(n.backlog??"Backlog"),assignments:o,status:["idea","ready","in_progress","blocked","done"].includes(String(n.status))?n.status:"idea",owner:String(n.owner??"—"),businessValue:Number(n.businessValue)||5,timeCriticality:Number(n.timeCriticality)||5,riskReduction:Number(n.riskReduction)||5,jobSize:Number(n.jobSize)||5,notes:n.notes!=null?String(n.notes):void 0,manualRank:n.manualRank==null||n.manualRank===""?null:Number(n.manualRank)}});return{version:3,startDate:a,teams:e.teams,items:H(s)}}const W=Q(),ct=F(W,1),tt=F(W,2),$t=F(W,3),lt=F(W,4),dt=F(W,6),St=F(W,8),Pt={version:3,startDate:W,teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#2563eb"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#7c3aed"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#0d9488"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#c2410c"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:8,workStartDate:W}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",estimatePw:3,workStartDate:ct}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:3,workStartDate:lt}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",estimatePw:2,workStartDate:W}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",estimatePw:4,workStartDate:dt}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",estimatePw:10,workStartDate:W},{teamId:"data",estimatePw:4,workStartDate:$t}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",estimatePw:6,workStartDate:ct},{teamId:"crm",estimatePw:3,workStartDate:lt}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",estimatePw:5,workStartDate:tt},{teamId:"platform",estimatePw:3,workStartDate:tt}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",estimatePw:7,workStartDate:ct},{teamId:"platform",estimatePw:2,workStartDate:W}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",estimatePw:7,workStartDate:W},{teamId:"platform",estimatePw:4,workStartDate:tt},{teamId:"mobile",estimatePw:3,workStartDate:dt}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",estimatePw:8,workStartDate:$t},{teamId:"data",estimatePw:3,workStartDate:lt},{teamId:"mobile",estimatePw:2,workStartDate:St}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",estimatePw:9,workStartDate:tt},{teamId:"platform",estimatePw:3,workStartDate:dt},{teamId:"mobile",estimatePw:2,workStartDate:St}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},ut={...Pt,items:H(Pt.items)},Dt="vi-planer-v3";let It="idle",et=[];function Bt(){return null}function xt(){return It}function Ot(t){return et.push(t),()=>{et=et.filter(e=>e!==t)}}function G(t){It=t,et.forEach(e=>e(t))}function zt(){try{const t=localStorage.getItem(Dt)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!t)return null;const e=rt(JSON.parse(t));return e?{...e,items:H(e.items)}:null}catch{return null}}function Et(t){localStorage.setItem(Dt,JSON.stringify(t))}async function Ht(){try{const t=await fetch("/api/state",{cache:"no-store"});if(!t.ok)return null;const e=await t.json(),a=rt(e.state);return a?{...a,items:H(a.items)}:null}catch{return null}}async function Vt(t){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).ok}catch{return!1}}async function Jt(){return null}async function Kt(t){return!1}async function Ut(){G("loading");const t=await Ht()??await Jt()??zt()??structuredClone(ut);return Et(t),G((Bt(),"saved")),t}let mt=null,pt=null;function ft(t){Et(t),pt=t,mt&&clearTimeout(mt),mt=setTimeout(async()=>{const e=pt;if(pt=null,!e)return;G("loading");const a=await Kt(),s=a?!0:await Vt(e);if(a||s){G("saved");return}G("offline")},350)}function Lt(t){switch(t){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function Rt(t){const e=document.querySelector(`script[data-pdf-lib="${t}"]`);return e?e.dataset.loaded==="1"?Promise.resolve():new Promise((a,s)=>{e.addEventListener("load",()=>a()),e.addEventListener("error",()=>s(new Error(`Failed to load ${t}`)))}):new Promise((a,s)=>{const l=document.createElement("script");l.src=t,l.async=!0,l.dataset.pdfLib=t,l.onload=()=>{l.dataset.loaded="1",a()},l.onerror=()=>s(new Error(`Failed to load ${t}`)),document.head.appendChild(l)})}async function Yt(){var a,s;window.html2canvas||await Rt("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(a=window.jspdf)!=null&&a.jsPDF||await Rt("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const t=window.html2canvas,e=(s=window.jspdf)==null?void 0:s.jsPDF;if(!t||!e)throw new Error("PDF libraries failed to load");return{html2canvas:t,jsPDF:e}}async function Gt(t,e,a){const{html2canvas:s,jsPDF:l}=await Yt(),n=await s(t,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f3f5f8",logging:!1,windowWidth:Math.max(t.scrollWidth,t.clientWidth),windowHeight:Math.max(t.scrollHeight,t.clientHeight)}),o=n.toDataURL("image/png"),r=new l({orientation:"landscape",unit:"mm",format:"a4"}),p=r.internal.pageSize.getWidth(),i=r.internal.pageSize.getHeight(),c=8,v=8,y=p-c*2,g=i-c*2-v,w=y,h=n.height*w/n.width;let k=h,E=c+v,D=0;for(;k>0;){D>0&&r.addPage(),D===0&&(r.setFontSize(11),r.setTextColor(15,23,42),r.text(a,c,c+4)),r.addImage(o,"PNG",c,E,w,h);const L=D===0?g:i-c*2;if(k-=L,E-=L,D+=1,D>40)break}r.save(e)}const vt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды"},u={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let m=structuredClone(ut);function z(t){return m.teams.find(e=>e.id===t)}function gt(t){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[t]}function jt(t){return new Map(t.map(e=>[e.item.id,e]))}function Qt(t){return t.assignments.map(e=>{const a=z(e.teamId);return(a==null?void 0:a.name)??e.teamId}).join(", ")}function Xt(t){return`<div class="teams-stack">${t.assignments.map(a=>{const s=z(a.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(s==null?void 0:s.color)??"#94a3b8"}"></span>${x((s==null?void 0:s.name)??a.teamId)} <span class="mono muted-inline">${a.estimatePw}чн · старт ${$(a.workStartDate)}</span></span>`}).join("")}</div>`}function Zt(t){const e=u.query.trim().toLowerCase(),a=jt(t),s=m.items.filter(n=>u.typeFilter!=="all"&&n.type!==u.typeFilter||u.teamFilter!=="all"&&!Wt(n,u.teamFilter)||u.statusFilter!=="all"&&n.status!==u.statusFilter?!1:e?n.title.toLowerCase().includes(e)||n.backlog.toLowerCase().includes(e)||n.owner.toLowerCase().includes(e)||Qt(n).toLowerCase().includes(e):!0);if(u.sortKey==="priority"){const n=U(s);return u.sortDir==="asc"?n:[...n].reverse()}const l=u.sortDir==="asc"?1:-1;return[...s].sort((n,o)=>{var p,i;let r=0;if(u.sortKey==="wsjf")r=A(n)-A(o);else if(u.sortKey==="estimate")r=N(n)-N(o);else{const c=((p=a.get(n.id))==null?void 0:p.endDate)??"9999-99-99",v=((i=a.get(o.id))==null?void 0:i.endDate)??"9999-99-99";r=c<v?-1:c>v?1:0}return r!==0?r*l:n.title.localeCompare(o.title,"ru")})}function at(t,e){const a=u.sortKey===e,s=a?u.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${a?"sorted":""}" data-sort="${e}" title="Сортировать">${t}${s}</th>`}function te(t){u.sortKey===t?u.sortDir=u.sortDir==="asc"?"desc":"asc":(u.sortKey=t,u.sortDir=t==="wsjf"?"desc":"asc"),_()}function ee(t,e){const a=m.items.filter(i=>i.status!=="done"),s=a.filter(i=>i.type==="product").length,l=a.filter(i=>i.type==="project").length,n=a.filter(i=>i.assignments.length>1).length,o=t.map(i=>i.endWeek),r=o.length?Math.max(...o)+1:0,p=m.teams.filter(i=>e.filter(v=>v.teamId===i.id).reduce((v,y)=>v+y.estimatePw,0)>i.capacityPw*8).length;return`
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${a.length}</div>
        <div class="hint">${s} продуктов · ${l} проектов · ${n} кросс-командных</div>
      </div>
      <div class="metric">
        <div class="label">Горизонт по текущей ёмкости</div>
        <div class="value">${r} нед.</div>
        <div class="hint">до закрытия (по bottleneck-команде)</div>
      </div>
      <div class="metric">
        <div class="label">Команд под риском</div>
        <div class="value">${p}</div>
        <div class="hint">спрос &gt; ёмкости на 8 недель</div>
      </div>
      <div class="metric">
        <div class="label">Старт планирования</div>
        <div class="value" style="font-size:18px">${$(m.startDate)}</div>
        <div class="hint">понедельник текущей недели</div>
      </div>
    </div>
  `}function ae(){return`
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
  `}function ne(t,e){const a=jt(t),s=Zt(t),l=u.sortKey==="priority",n=s.map(o=>{const r=a.get(o.id),p=A(o),i=N(o),c=o.manualRank??"—",v=r?`<div class="eta-teams">${r.slices.map(y=>{const g=z(y.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(g==null?void 0:g.color)??"#64748b"}">${x((g==null?void 0:g.name)??y.teamId)}</span>: ${$(y.startDate)}→${$(y.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${l?"row-draggable":""}" data-edit="${o.id}" data-row-id="${o.id}">
          <td class="prio-cell">
            <div class="prio-edit" data-stop-edit>
              ${l?'<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>':""}
              <input
                class="prio-input"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-prio-id="${o.id}"
                value="${c}"
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
            <div class="name">${x(o.title)}</div>
            <div class="meta">${x(o.backlog)} · ${x(o.owner)}</div>
          </td>
          <td>${Xt(o)}</td>
          <td><span class="badge badge-status-${o.status}">${gt(o.status)}</span></td>
          <td class="mono wsjf">${p}</td>
          <td class="mono">
            ${i}
            ${o.assignments.length>1?`<div class="meta">${o.assignments.map(y=>y.estimatePw).join(" + ")}</div>`:""}
          </td>
          <td class="mono ${r&&r.waitWeeks>4?"eta-late":"eta-good"}">
            ${r?`<span class="eta-final">${$(r.endDate)}</span>`:"—"}
            ${v}
          </td>
        </tr>
      `}).join("");return`
    ${ae()}
    <div class="panel">
      <div class="panel-header">
        <h2>Единый портфель (проекты + продукты)</h2>
        <div class="filters">
          <input id="q" placeholder="Поиск…" value="${V(u.query)}" />
          <select id="typeFilter">
            <option value="all" ${u.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${u.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${u.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${m.teams.map(o=>`<option value="${o.id}" ${u.teamFilter===o.id?"selected":""}>${x(o.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${u.statusFilter===o?"selected":""}>${gt(o)}</option>`).join("")}
          </select>
          <button class="btn" id="resetFilters" title="Сбросить фильтры и сортировку">Сбросить фильтры</button>
          <button class="btn btn-primary" id="addItem">+ Инициатива</button>
        </div>
      </div>
      ${l?"":'<p class="sort-prio-hint">Сейчас сортировка не по приоритету — перестановка строк отключена, приоритеты не меняются. Верните сортировку по «Приоритет», чтобы двигать строки.</p>'}
      <div style="overflow-x:auto">
        <table class="portfolio-table">
          <thead>
            <tr>
              ${at("Приоритет","priority")}
              <th>Тип</th>
              <th>Инициатива / исходный бэклог</th>
              <th>Команды (оценка · старт)</th>
              <th>Статус</th>
              ${at("WSJF","wsjf")}
              ${at("Оценка, чел·нед","estimate")}
              ${at("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${n||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function se(t){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${m.teams.map(a=>{const s=t.filter(r=>r.teamId===a.id).sort((r,p)=>r.effectiveRank-p.effectiveRank),l=s.reduce((r,p)=>r+p.estimatePw,0),n=a.capacityPw>0?l/a.capacityPw:0,o=Math.min(100,Math.round(s.filter(r=>r.startWeek<8).reduce((r,p)=>{const i=Math.min(p.endWeek+1,8)-p.startWeek;return r+Math.max(0,i)*(p.estimatePw/Math.max(1,p.endWeek-p.startWeek+1))},0)/(a.capacityPw*8)*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${x(a.name)}</h3>
              <div class="meta">Ёмкость ${a.capacityPw} чел·нед/нед · спрос ${l.toFixed(1)} · ~${n.toFixed(1)} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${o}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,o)}%;background:${a.color}"></span></div>
          ${s.map(r=>{const p=r.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${r.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${r.item.type}">${r.item.type==="product"?"П":"Пр"}</span> ${x(r.item.title)}</div>
                <div class="meta">WSJF ${r.wsjf} · ${r.estimatePw} чел·нед · план ${$(r.plannedStartDate)}${r.delayedByQueue?" → сдвиг":""}${p>0?` · ещё ${p} ком.`:""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${$(r.startDate)} →<br/>${$(r.endDate)}
              </div>
            </div>
          `}).join("")||'<div class="empty">Очередь пуста</div>'}
        </div>
      `}).join("")}
    </div>
  `}function ie(t){const e=m.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда у команды появляется ёмкость с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${m.teams.map(s=>{const l=t.filter(i=>i.teamId===s.id).sort((i,c)=>{const v=i.item.manualRank??9999,y=c.item.manualRank??9999;return v!==y?v-y:i.effectiveRank-c.effectiveRank}),n=l.reduce((i,c)=>i+c.estimatePw,0),o=s.capacityPw>0?n/s.capacityPw:0,r=l.length?l[l.length-1].endDate:e,p=l.map((i,c)=>{const v=i.item.manualRank??"—",y=c>0?l[c-1]:null;let g="может взять сразу (есть свободная ёмкость)",w="take-now";i.startDate>i.plannedStartDate?(g=y?`ждёт очередь: после #${y.item.manualRank??"?"} «${y.item.title}»`:"сдвиг из‑за загрузки очереди",w="take-queue"):i.startDate>e&&(g=`ждёт плановый старт ${$(i.plannedStartDate)}`,w="take-plan");const h=i.item.assignments.filter(k=>k.teamId!==s.id).map(k=>{var E;return((E=z(k.teamId))==null?void 0:E.name)??k.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${v}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${i.item.type}">${i.item.type==="product"?"П":"Пр"}</span>
                  ${x(i.item.title)}
                </div>
                <div class="take-line ${w}">
                  <strong>Может взять с ${$(i.startDate)}</strong>
                  <span class="meta"> · ${x(g)}</span>
                </div>
                <div class="meta">
                  ${i.estimatePw} чел·нед · план ${$(i.plannedStartDate)} · до ${$(i.endDate)}
                  ${h.length?` · ещё: ${h.map(x).join(", ")}`:""}
                </div>
                <div class="take-bar" title="Окно работы в горизонте 12 нед.">
                  <span class="take-bar-fill" style="left:${i.startWeek/12*100}%;width:${Math.max(3,(i.endWeek-i.startWeek+1)/12*100)}%;background:${s.color}"></span>
                </div>
              </div>
              <div class="mono queue-item-dates">
                <div class="meta">старт</div>
                <div>${$(i.startDate)}</div>
                <div class="meta" style="margin-top:6px">конец</div>
                <div>${$(i.endDate)}</div>
              </div>
            </div>
          `}).join("")||`<div class="empty">Очередь пуста — команда свободна с ${$(e)}</div>`;return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${s.color}"></span>${x(s.name)}</h3>
              <div class="meta">Ёмкость ${s.capacityPw} чел·нед/нед · спрос ${n.toFixed(1)} · ~${o.toFixed(1)} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${$(r)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          ${p}
        </div>
      `}).join("")}
    </div>
  `}function oe(t,e){const a=Math.max(4,...t.map(h=>h.endWeek+2),4),s=Math.max(4,Math.min(52,Math.round(u.ganttWeeks)||16));u.ganttWeeks=s;const l=U(m.items.filter(h=>h.status!=="done")),n=new Map(l.map((h,k)=>[h.id,k])),o=100/s,r=`repeating-linear-gradient(90deg, #f8fafc 0, #f8fafc calc(${o}% - 1px), #e2e8f0 calc(${o}% - 1px), #e2e8f0 ${o}%)`,p=[],i=[];m.teams.forEach((h,k)=>{const E=e.filter(L=>L.teamId===h.id).sort((L,T)=>L.effectiveRank-T.effectiveRank);if(E.length<2)return;const D=`arrow-${h.id}`;i.push(`
      <marker id="${D}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${h.color}" fill-opacity="0.85" />
      </marker>
    `);for(let L=1;L<E.length;L++){const T=E[L-1],q=E[L],S=(n.get(T.item.id)??0)+.5,C=(n.get(q.item.id)??0)+.5,M=Math.min(s-.05,T.endWeek+.92),d=Math.min(s-.05,Math.max(.08,q.startWeek+.02)),f=d-M,b=(k%4-1.5)*.08,I=Math.max(.35,Math.abs(f)*.45)+Math.abs(b),P=M+(f>=0?I:-I*.35)+b,R=d-(f>=0?I:-I*.35)+b,j=Math.abs(S-C)<.02?`M ${M} ${S} H ${d}`:`M ${M} ${S} C ${P} ${S}, ${R} ${C}, ${d} ${C}`;p.push(`<path d="${j}" fill="none" stroke="${h.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${D})" />`)}});const c=[],v=[];for(const h of l){const k=t.find(q=>q.item.id===h.id);if(!k)continue;const E=k.slices.map(q=>{const S=e.filter(f=>f.teamId===q.teamId).sort((f,b)=>f.effectiveRank-b.effectiveRank),C=S.findIndex(f=>f.item.id===h.id);if(C<=0)return null;const M=S[C-1],d=z(q.teamId);return`#${M.item.manualRank} (${(d==null?void 0:d.name)??q.teamId})`}).filter(Boolean),D=[...new Set(E)],L=D.length?`<div class="meta gantt-dep-meta">после ${D.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',T=k.slices.map(q=>{const S=z(q.teamId),C=q.startWeek/s*100,M=Math.max(1,q.endWeek-q.startWeek+1)/s*100;return`<div class="gantt-bar ${q.teamId===k.bottleneckTeamId?"gantt-bot":""}" style="left:${C}%;width:${Math.max(M,2.5)}%;background:${(S==null?void 0:S.color)??"#64748b"}" title="${V((S==null?void 0:S.name)??"")}: ${$(q.endDate)}">${x((S==null?void 0:S.name)??"")}</div>`}).join("");c.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${h.manualRank??"—"}</span> ${x(h.title)}</div>
        <div class="meta">${h.type==="product"?"Продукт":"Проект"} · ETA ${$(k.endDate)}</div>
        ${L}
      </div>
    `),v.push(`<div class="gantt-track gantt-track-multi" style="background:${r}">${T}</div>`)}const y=Math.max(1,l.length),g=s<=12?1:s<=24?2:s<=36?3:4,w=Array.from({length:s},(h,k)=>{if(!(k%g===0||k===s-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${o}%"></div>`;const D=F(m.startDate,k),[,L,T]=D.split("-");return`<div class="gantt-axis-tick" style="width:${o}%">
      <span class="gantt-axis-w">Н${k+1}</span>
      <span class="gantt-axis-d">${T}.${L}</span>
    </div>`}).join("");return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сроки и зависимости по приоритету</h2>
        <div class="gantt-weeks-ctrl">
          <label for="ganttWeeks">Горизонт</label>
          <input id="ganttWeeks" type="range" min="4" max="52" step="1" value="${s}" />
          <span class="mono" id="ganttWeeksLabel">${s} нед.</span>
          ${a>s?`<span class="meta">часть работ за горизонтом (нужно ~${a})</span>`:""}
        </div>
      </div>
      <div class="timeline">
        ${l.length?`<div class="gantt-layout">
          <div class="gantt-labels-col">
            <div class="gantt-axis-spacer">
              <span class="meta">нед. с ${$(m.startDate)}</span>
            </div>
            ${c.join("")}
          </div>
          <div class="gantt-tracks-wrap">
            <div class="gantt-axis">${w}</div>
            <div class="gantt-tracks-col">
              <svg class="gantt-dep-layer" viewBox="0 0 ${s} ${y}" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  ${i.join("")}
                </defs>
                ${p.join("")}
              </svg>
              ${v.join("")}
            </div>
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.</p>
    </div>
  `}const yt=["#2563eb","#7c3aed","#0d9488","#c2410c","#db2777","#059669","#d97706","#4f46e5","#0891b2","#be123c"];function bt(){const t=new Set(m.teams.map(e=>e.color));return yt.find(e=>!t.has(e))??yt[m.teams.length%yt.length]}function re(){return`
    <div class="callout">
      Управляйте командами: название и ёмкость (чел·нед/нед). Изменение ёмкости пересчитывает очереди и ETA.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Команды</h2>
        <button class="btn btn-primary" id="addTeam">+ Команда</button>
      </div>
      <div id="teamsManageList">
        ${m.teams.map(e=>`
      <div class="capacity-row" data-team-row="${e.id}">
        <span class="team-dot" style="background:${e.color}"></span>
        <input
          class="team-name-input"
          type="text"
          data-team-name="${e.id}"
          value="${V(e.name)}"
          aria-label="Название команды"
        />
        <input type="range" min="1" max="8" step="0.5" value="${e.capacityPw}" data-cap="${e.id}" />
        <span class="mono capacity-label" data-cap-label="${e.id}">${e.capacityPw} чел·нед</span>
      </div>
    `).join("")||'<div class="empty">Нет команд — создайте первую</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar" hidden>
        <span class="team-dot" id="newTeamDot" style="background:${bt()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">Создать</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function ce(t){var i;const e=t??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((i=m.teams[0])==null?void 0:i.id)??"",estimatePw:4,workStartDate:m.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:Y(m.items)},a=A(e),s=new Set(e.assignments.map(c=>c.teamId)),l=new Map(e.assignments.map(c=>[c.teamId,c.estimatePw])),n=new Map(e.assignments.map(c=>[c.teamId,c.workStartDate])),o=qt(e),r=o?_t(o,e.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',p=m.teams.map(c=>{const v=s.has(c.id),y=l.get(c.id)??4,g=n.get(c.id)??m.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${c.id}" ${v?"checked":""} />
            <span class="team-dot" style="background:${c.color}"></span>
            <span class="team-assign-name">${x(c.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Оценка</span>
            <input type="number" class="f_team_est" data-team="${c.id}" min="0.5" step="0.5" value="${y}" ${v?"":"disabled"} />
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${c.id}" value="${g}" ${v?"":"disabled"} />
          </label>
        </div>
      `}).join("");return`
    <div class="modal-backdrop" id="modal">
      <div class="modal modal-wide">
        <div class="modal-head">
          <h3>${t?"Карточка инициативы":"Новая инициатива"}</h3>
          <div class="modal-head-actions">
            <button class="btn" id="closeModal2">Отмена</button>
            <button class="btn btn-ghost" id="closeModal">Закрыть</button>
            <button class="btn btn-primary" id="saveItem">Сохранить</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Название</label>
            <input id="f_title" value="${V(e.title)}" />
          </div>
          <div class="grid-2">
            <div class="field">
              <label>Тип</label>
              <select id="f_type">
                <option value="product" ${e.type==="product"?"selected":""}>Продукт</option>
                <option value="project" ${e.type==="project"?"selected":""}>Проект</option>
              </select>
            </div>
            <div class="field">
              <label>Исходный бэклог</label>
              <input id="f_backlog" value="${V(e.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${["idea","ready","in_progress","blocked","done"].map(c=>`<option value="${c}" ${e.status===c?"selected":""}>${gt(c)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${V(e.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: оценка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${p}</div>
            <div class="meta" style="margin-top:6px">Итого объём: <strong class="mono" id="liveTotalEst">${N(e)}</strong> чел·нед. Дата старта — не раньше этой; если очередь команды занята, старт сдвинется позже.</div>
          </div>
          <div class="callout" style="margin:0" id="liveEtaBox">
            <strong>Пересчёт ETA</strong> (с учётом очереди и стартов)
            <div id="liveEta" style="margin-top:8px;font-size:13px;color:var(--ink)">${r}</div>
          </div>
          <div class="score-grid">
            <div class="score-box"><div class="k">Business Value</div><div class="v"><input id="f_bv" type="number" min="1" max="10" value="${e.businessValue}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Time Criticality</div><div class="v"><input id="f_tc" type="number" min="1" max="10" value="${e.timeCriticality}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Risk / Opportunity</div><div class="v"><input id="f_rr" type="number" min="1" max="10" value="${e.riskReduction}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Job Size</div><div class="v"><input id="f_js" type="number" min="1" max="10" value="${e.jobSize}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
          </div>
          <div class="callout" style="margin:0">WSJF = (BV + TC + RR) / Job Size → <strong class="mono" id="liveWsjf">${a}</strong></div>
          <div class="grid-2">
            <div class="field">
              <label>Приоритет (уникальный, 1 = выше)</label>
              <input id="f_rank" type="number" min="1" step="1" value="${e.manualRank??Y(m.items)}" />
              <div class="meta" style="margin-top:6px">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
            </div>
            <div class="field">
              <label>Заметки</label>
              <textarea id="f_notes">${x(e.notes??"")}</textarea>
            </div>
          </div>
        </div>
        ${t?`<div class="modal-foot">
          <button class="btn" id="deleteItem" style="color:var(--bad)">Удалить</button>
        </div>`:""}
      </div>
    </div>
  `}function qt(t){const e=t.assignments.length?t.assignments:wt();if(!e.length)return null;const a=t.id||"__draft__",s={...t,id:a,assignments:e},l=m.items.some(o=>o.id===a)?m.items.map(o=>o.id===a?s:o):[...m.items,s],{rollups:n}=ht({...m,items:l});return n.find(o=>o.item.id===a)??null}function Mt(t){const e=z(t.teamId),a=(e==null?void 0:e.capacityPw)||1,s=Math.round(t.estimatePw/a*100)/100,l=O(t.workStartDate||m.startDate),n=it(l,s*7);return{start:l,end:n,weeks:s}}function _t(t,e){const a=new Map(e.map(n=>[n.teamId,n])),s=t.slices.map(n=>{const o=z(n.teamId),r=a.get(n.teamId),p=r?O(r.workStartDate):n.plannedStartDate,i=r?Mt(r):null,c=n.teamId===t.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",v=n.startDate>p?` <span class="meta">(план ${$(p)}, очередь сдвинула на ${$(n.startDate)})</span>`:n.startDate<p?` <span class="meta">(ждём план ${$(p)})</span>`:"",y=i?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(i.start)} → <span class="mono">${$(i.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${x((o==null?void 0:o.name)??n.teamId)}</strong>: <span class="mono">${$(n.startDate)} → ${$(n.endDate)}</span> <span class="meta">(${n.estimatePw} чел·нед ≈ ${n.durationWeeks} нед.)</span>${v}${c}${y}</div>`}).join(""),l=e.map(n=>Mt(n).end).reduce((n,o)=>n>o?n:o,"0000-00-00");return s+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(t.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(l)}</strong> — меняется сразу при смене даты</div>`}function x(t){return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function V(t){return x(t).replaceAll("'","&#39;")}function J(){var t;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(e=>{e.classList.remove("prio-ask")}),(t=document.querySelector("#prioPop"))==null||t.remove()}function le(t){return`
    <div class="prio-confirm-text">${t}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-prio-no>Нет</button>
      <button type="button" class="btn btn-primary" data-prio-yes>Да</button>
    </div>
  `}function kt(t,e,a,s){var v,y;J(),t.classList.add("prio-ask");const l=document.createElement("div");l.id="prioPop",l.className="prio-confirm prio-confirm-float",l.setAttribute("data-stop-edit",""),l.innerHTML=le(e),document.body.appendChild(l);const n=()=>{const g=t.getBoundingClientRect(),w=l.getBoundingClientRect();let h=g.right+8,k=g.top+g.height/2-w.height/2;h+w.width>window.innerWidth-8&&(h=Math.max(8,g.left-w.width-8)),k=Math.max(8,Math.min(k,window.innerHeight-w.height-8)),l.style.left=`${h}px`,l.style.top=`${k}px`};n();const o=()=>n();window.addEventListener("scroll",o,!0),window.addEventListener("resize",o);const r=()=>{window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",o),document.removeEventListener("mousedown",c,!0)},p=()=>{r(),J(),s()},i=()=>{r(),J(),a()},c=g=>{const w=g.target;l.contains(w)||t.contains(w)||p()};document.addEventListener("mousedown",c,!0),(v=l.querySelector("[data-prio-yes]"))==null||v.addEventListener("click",g=>{g.stopPropagation(),i()}),(y=l.querySelector("[data-prio-no]"))==null||y.addEventListener("click",g=>{g.stopPropagation(),p()})}function de(){if(u.sortKey!=="priority")return;const t=document.querySelector("#portfolioBody");if(!t)return;let e=null,a=null;const s=()=>{t.querySelectorAll(".is-dragging, .drag-over").forEach(n=>n.classList.remove("is-dragging","drag-over"))},l=(n,o)=>{if(n===o)return;const r=Array.from(t.querySelectorAll("tr[data-row-id]")).map(y=>y.dataset.rowId),p=r.indexOf(n),i=r.indexOf(o);if(p<0||i<0)return;const c=[...r];c.splice(p,1),c.splice(i,0,n);const v=u.sortDir==="asc"?c:[...c].reverse();m.items=Nt(m.items,v),u.sortKey="priority",B()};t.querySelectorAll("[data-drag-handle]").forEach(n=>{const o=n.closest("tr[data-row-id]");if(!o)return;n.addEventListener("pointerdown",p=>{p.button===0&&(p.preventDefault(),p.stopPropagation(),e=o.dataset.rowId??null,a=p.pointerId,n.setPointerCapture(p.pointerId),s(),o.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),n.addEventListener("pointermove",p=>{if(e==null||p.pointerId!==a)return;const i=document.elementFromPoint(p.clientX,p.clientY),c=i==null?void 0:i.closest("tr[data-row-id]");t.querySelectorAll(".drag-over").forEach(v=>v.classList.remove("drag-over")),c&&c.dataset.rowId!==e&&c.classList.add("drag-over")});const r=p=>{if(e==null||p.pointerId!==a)return;const i=e,c=document.elementFromPoint(p.clientX,p.clientY),v=c==null?void 0:c.closest("tr[data-row-id]"),y=v==null?void 0:v.dataset.rowId;try{n.releasePointerCapture(p.pointerId)}catch{}s(),document.body.classList.remove("prio-dragging"),e=null,a=null,y&&l(i,y)};n.addEventListener("pointerup",r),n.addEventListener("pointercancel",r)})}function _(){J(),K();const{slices:t,rollups:e}=ht(m),a=document.querySelector("#app");if(!a)return;const s=u.editingId!=null?m.items.find(l=>l.id===u.editingId)??null:null;a.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${xt()}">${Lt(xt())}</span>
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
        <h1>VI Planer — ${vt[u.tab]}</h1>
        <p>Старт портфеля: ${m.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${ee(e,t)}
      <div class="tabs no-print">
        <button class="tab ${u.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${u.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${u.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${u.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${u.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${u.tab==="portfolio"?ne(e):u.tab==="teams"?se(t):u.tab==="queuesTest"?ie(t):u.tab==="timeline"?oe(e,t):re()}
      </div>
      </div>
    </div>
    ${u.creating||s?ce(s):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,ue()}function wt(){const t=Array.from(document.querySelectorAll(".f_team_check")),e=[];for(const a of t){if(!a.checked)continue;const s=a.dataset.team,l=document.querySelector(`.f_team_est[data-team="${s}"]`),n=document.querySelector(`.f_team_start[data-team="${s}"]`),o=Math.max(.5,Number(l==null?void 0:l.value)||1),r=O((n==null?void 0:n.value)||m.startDate);e.push({teamId:s,estimatePw:o,workStartDate:r})}return e}function Ct(){var o,r,p,i,c,v,y;const t=document.querySelector("#liveTotalEst"),e=document.querySelector("#liveEta"),a=wt();if(t&&(t.textContent=String(a.reduce((g,w)=>g+w.estimatePw,0)||0)),!e)return;if(!a.length){e.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const s=(u.editingId?m.items.find(g=>g.id===u.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:a,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},l={...s,id:u.editingId||"__draft__",assignments:a,title:((o=document.querySelector("#f_title"))==null?void 0:o.value.trim())||s.title,type:((r=document.querySelector("#f_type"))==null?void 0:r.value)||s.type,status:((p=document.querySelector("#f_status"))==null?void 0:p.value)||s.status,businessValue:Number((i=document.querySelector("#f_bv"))==null?void 0:i.value)||s.businessValue,timeCriticality:Number((c=document.querySelector("#f_tc"))==null?void 0:c.value)||s.timeCriticality,riskReduction:Number((v=document.querySelector("#f_rr"))==null?void 0:v.value)||s.riskReduction,jobSize:Number((y=document.querySelector("#f_js"))==null?void 0:y.value)||s.jobSize,manualRank:(()=>{var h;const g=(h=document.querySelector("#f_rank"))==null?void 0:h.value,w=Math.round(Number(g));return Number.isFinite(w)&&w>=1?w:s.manualRank??Y(m.items)})()},n=qt(l);if(!n){e.innerHTML='<div class="meta">Нет расчёта</div>';return}e.innerHTML=_t(n,a)}function Tt(){const t=(n,o)=>{const r=document.querySelector(`#${n}`),p=Number(r==null?void 0:r.value);return Number.isFinite(p)?p:o},e=n=>{var o;return((o=document.querySelector(`#${n}`))==null?void 0:o.value)??""},a=wt();if(!a.length)return alert("Выберите хотя бы одну команду"),null;const s=e("f_rank").trim(),l=Math.max(1,Math.round(Number(s)||Y(m.items)));return{title:e("f_title").trim()||"Без названия",type:e("f_type"),backlog:e("f_backlog").trim()||"Backlog",assignments:a,status:e("f_status"),owner:e("f_owner").trim()||"—",businessValue:nt(t("f_bv",5),1,10),timeCriticality:nt(t("f_tc",5),1,10),riskReduction:nt(t("f_rr",5),1,10),jobSize:nt(t("f_js",5),1,10),notes:e("f_notes").trim(),manualRank:l}}function nt(t,e,a){return Math.min(a,Math.max(e,t))}function B(){ft(m),_()}function ue(){var i,c,v,y,g,w,h,k,E,D,L,T,q,S,C,M;document.querySelectorAll("[data-tab]").forEach(d=>{d.addEventListener("click",()=>{u.tab=d.dataset.tab,_()})});const t=document.querySelector("#q");t==null||t.addEventListener("input",()=>{u.query=t.value}),t==null||t.addEventListener("change",()=>_());const e=document.querySelector("#typeFilter");e==null||e.addEventListener("change",()=>{u.typeFilter=e.value,_()});const a=document.querySelector("#teamFilter");a==null||a.addEventListener("change",()=>{u.teamFilter=a.value,_()});const s=document.querySelector("#statusFilter");s==null||s.addEventListener("change",()=>{u.statusFilter=s.value,_()}),(i=document.querySelector("#addItem"))==null||i.addEventListener("click",()=>{u.creating=!0,u.editingId=null,_()}),(c=document.querySelector("#resetFilters"))==null||c.addEventListener("click",()=>{u.typeFilter="all",u.teamFilter="all",u.statusFilter="all",u.query="",u.sortKey="priority",u.sortDir="asc",_()}),document.querySelectorAll("[data-edit]").forEach(d=>{d.addEventListener("click",f=>{f.target.closest("[data-stop-edit], .prio-input, .prio-edit, #prioPop, .drag-handle")||(u.editingId=d.dataset.edit??null,u.creating=!1,_())})}),de(),document.querySelectorAll(".prio-input").forEach(d=>{const f=d.dataset.prioId,b=()=>{const P=m.items.find(R=>R.id===f);d.value=String((P==null?void 0:P.manualRank)??1)},I=()=>{const P=m.items.find(ge=>ge.id===f);if(!P)return;const R=Number(d.value);if(!Number.isFinite(R)||R<1){b();return}const j=Math.round(R);if(d.value=String(j),j===P.manualRank)return;const st=X(m.items,j,f),ve=st?`Сменить на <span class="accent">${j}</span>?<br/>«${x(st.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${j}</span>?`;kt(d,ve,()=>{m.items=ot(m.items,f,j),B()},b)};d.addEventListener("click",P=>P.stopPropagation()),d.addEventListener("mousedown",P=>P.stopPropagation()),d.addEventListener("keydown",P=>{P.key==="Enter"&&(P.preventDefault(),I()),P.key==="Escape"&&(J(),b(),d.blur())}),d.addEventListener("change",I)}),document.querySelectorAll("[data-sort]").forEach(d=>{d.addEventListener("click",f=>{f.stopPropagation();const b=d.dataset.sort;(b==="wsjf"||b==="estimate"||b==="eta"||b==="priority")&&te(b)})});const l=()=>{u.creating=!1,u.editingId=null,_()};(v=document.querySelector("#closeModal"))==null||v.addEventListener("click",l),(y=document.querySelector("#closeModal2"))==null||y.addEventListener("click",l),(g=document.querySelector("#modal"))==null||g.addEventListener("click",d=>{d.target.id==="modal"&&l()}),document.querySelectorAll(".f_team_check").forEach(d=>{d.addEventListener("change",()=>{const f=d.dataset.team,b=document.querySelector(`.f_team_est[data-team="${f}"]`),I=document.querySelector(`.f_team_start[data-team="${f}"]`);b&&(b.disabled=!d.checked),I&&(I.disabled=!d.checked),Ct()})});const n=document.querySelector("#teamAssignList"),o=d=>{const f=d.target;f&&(f.classList.contains("f_team_est")||f.classList.contains("f_team_start")||f.classList.contains("f_team_check"))&&Ct()};n==null||n.addEventListener("input",o),n==null||n.addEventListener("change",o),n==null||n.addEventListener("keyup",o),(w=document.querySelector("#saveItem"))==null||w.addEventListener("click",()=>{const d=Tt();if(!d)return;const f=d.manualRank??Y(m.items),b=document.querySelector("#f_rank"),I=()=>{if(X(m.items,f,null)){const j=Z("item");m.items=[...m.items,{...d,id:j,manualRank:m.items.length+1}],m.items=ot(m.items,j,f)}else m.items.push({...d,id:Z("item"),manualRank:f}),m.items=H(m.items);u.creating=!1,u.editingId=null,B()},P=()=>{if(!u.editingId)return;const R=m.items.findIndex(st=>st.id===u.editingId);if(R<0)return;const j=m.items[R];f!==j.manualRank?(m.items[R]={...j,...d,manualRank:j.manualRank},m.items=ot(m.items,u.editingId,f)):m.items[R]={...j,...d},u.creating=!1,u.editingId=null,B()};if(u.creating){const R=X(m.items,f,null);if(R&&b){kt(b,`Занять <span class="accent">${f}</span>?<br/>«${x(R.title)}» сдвинется вверх.`,I,()=>{});return}I();return}if(u.editingId){const R=m.items.find(j=>j.id===u.editingId);if(R&&f!==R.manualRank&&b){const j=X(m.items,f,u.editingId);kt(b,j?`Сменить на <span class="accent">${f}</span>?<br/>«${x(j.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${f}</span>?`,P,()=>{});return}P()}}),(h=document.querySelector("#deleteItem"))==null||h.addEventListener("click",()=>{u.editingId&&(m.items=m.items.filter(d=>d.id!==u.editingId),u.editingId=null,B())}),["f_bv","f_tc","f_rr","f_js"].forEach(d=>{var f;(f=document.querySelector(`#${d}`))==null||f.addEventListener("input",()=>{const b=document.querySelector("#liveWsjf");if(!b)return;const I=Tt();I&&(b.textContent=String(A({...I})))})}),document.querySelectorAll("[data-cap]").forEach(d=>{d.addEventListener("input",()=>{const f=d.dataset.cap,b=m.teams.find(P=>P.id===f);if(!b)return;b.capacityPw=Number(d.value),ft(m);const I=document.querySelector(`[data-cap-label="${f}"]`);I&&(I.textContent=`${b.capacityPw} чел·нед`)}),d.addEventListener("change",()=>_())});const r=document.querySelector("#ganttWeeks");r==null||r.addEventListener("input",()=>{const d=Math.max(4,Math.min(52,Number(r.value)||16));u.ganttWeeks=d;const f=document.querySelector("#ganttWeeksLabel");f&&(f.textContent=`${d} нед.`)}),r==null||r.addEventListener("change",()=>{u.ganttWeeks=Math.max(4,Math.min(52,Number(r.value)||16)),_()}),document.querySelectorAll("[data-team-name]").forEach(d=>{const f=()=>{const b=d.dataset.teamName,I=m.teams.find(R=>R.id===b);if(!I)return;const P=d.value.trim()||I.name;d.value=P,P!==I.name&&(I.name=P,B())};d.addEventListener("change",f),d.addEventListener("keydown",b=>{b.key==="Enter"&&(b.preventDefault(),d.blur())})}),(k=document.querySelector("#addTeam"))==null||k.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName"),b=document.querySelector("#newTeamDot");d&&(d.hidden=!1),b&&(b.style.background=bt()),f==null||f.focus()}),(E=document.querySelector("#cancelNewTeam"))==null||E.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName");d&&(d.hidden=!0),f&&(f.value="")});const p=()=>{const d=document.querySelector("#newTeamName"),f=(d==null?void 0:d.value.trim())||"";if(!f){d==null||d.focus();return}m.teams.push({id:Z("team"),name:f,capacityPw:3,color:bt()}),B()};(D=document.querySelector("#saveNewTeam"))==null||D.addEventListener("click",p),(L=document.querySelector("#newTeamName"))==null||L.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),p())}),(T=document.querySelector("#exportPdfBtn"))==null||T.addEventListener("click",()=>{pe()}),(q=document.querySelector("#exportBtn"))==null||q.addEventListener("click",()=>{const d=new Blob([JSON.stringify(m,null,2)],{type:"application/json"}),f=URL.createObjectURL(d),b=document.createElement("a");b.href=f,b.download=`vi-planer-${m.startDate}.json`,b.click(),URL.revokeObjectURL(f)}),(S=document.querySelector("#importBtn"))==null||S.addEventListener("click",()=>{var d;(d=document.querySelector("#fileInput"))==null||d.click()}),(C=document.querySelector("#fileInput"))==null||C.addEventListener("change",async d=>{var b;const f=(b=d.target.files)==null?void 0:b[0];if(f)try{const I=await f.text(),P=rt(JSON.parse(I));if(!P){alert("Неверный формат файла");return}m=P,B()}catch{alert("Не удалось прочитать JSON")}}),(M=document.querySelector("#resetBtn"))==null||M.addEventListener("click",d=>{d.stopPropagation(),me(d.currentTarget)})}function K(){var t,e;(t=document.querySelector("#resetPop"))==null||t.remove(),(e=document.querySelector("#resetBtn"))==null||e.classList.remove("reset-ask")}function me(t){var r,p;K(),J(),t.classList.add("reset-ask");const e=document.createElement("div");e.id="resetPop",e.className="reset-confirm",e.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(e);const a=()=>{const i=t.getBoundingClientRect(),c=e.offsetWidth,v=e.offsetHeight;let y=i.right-c,g=i.bottom+6;y<8&&(y=8),y+c>window.innerWidth-8&&(y=window.innerWidth-c-8),g+v>window.innerHeight-8&&(g=i.top-v-6),e.style.left=`${Math.max(8,y)}px`,e.style.top=`${Math.max(8,g)}px`};a();const s=()=>a();window.addEventListener("scroll",s,!0),window.addEventListener("resize",s);const l=()=>{window.removeEventListener("scroll",s,!0),window.removeEventListener("resize",s),window.removeEventListener("keydown",n),document.removeEventListener("mousedown",o)},n=i=>{i.key==="Escape"&&(l(),K())},o=i=>{const c=i.target;e.contains(c)||t.contains(c)||(l(),K())};(r=e.querySelector("#resetCancelBtn"))==null||r.addEventListener("click",()=>{l(),K()}),(p=e.querySelector("#resetConfirmBtn"))==null||p.addEventListener("click",()=>{l(),K(),m=structuredClone(ut),B()}),window.addEventListener("keydown",n),window.setTimeout(()=>document.addEventListener("mousedown",o),0)}async function pe(){const t=document.querySelector("#exportPdfBtn"),e=document.querySelector("#pdfCapture");if(!e){alert("Не удалось найти содержимое для экспорта");return}const a=(t==null?void 0:t.textContent)??"Экспорт PDF";t&&(t.disabled=!0,t.textContent="PDF…");const s=new Date().toISOString().slice(0,10),l=`VI Planer — ${vt[u.tab]} · ${s}`,n=`VI-Planer-${vt[u.tab]}-${s}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await Gt(e,n,l)}catch(o){console.error(o),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),t&&(t.disabled=!1,t.textContent=a)}}async function fe(){m=await Ut();const t=m.items.map(a=>a.manualRank).join(",");m={...m,items:H(m.items)};const e=m.items.map(a=>a.manualRank).join(",");t!==e&&ft(m),Ot(a=>{const s=document.querySelector("#syncStatus");s&&(s.dataset.status=a,s.textContent=Lt(a))}),_()}fe()})();
