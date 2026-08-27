(function(){"use strict";function W(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function N(e){return e.assignments.reduce((t,a)=>t+a.estimatePw,0)}function Tt(e,t){return e.assignments.some(a=>a.teamId===t)}function st(e,t){const a=new Date(e+"T12:00:00");return a.setDate(a.getDate()+t),a.toISOString().slice(0,10)}function F(e,t){return st(e,t*7)}function At(e){return e.reduce((t,a)=>a.endDate!==t.endDate?a.endDate>t.endDate?a:t:a.estimatePw!==t.estimatePw?a.estimatePw>t.estimatePw?a:t:a.durationWeeks>t.durationWeeks?a:t)}function $(e){const[t,a,i]=e.split("-");return`${i}.${a}.${t}`}function G(e=new Date){const t=new Date(e),a=t.getDay(),i=a===0?-6:1-a;return t.setDate(t.getDate()+i),t.toISOString().slice(0,10)}function O(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?G():G(new Date(e.slice(0,10)+"T12:00:00"))}function Ct(e,t){const a=new Date(O(e)+"T12:00:00").getTime(),i=new Date(O(t)+"T12:00:00").getTime();return Math.max(0,Math.round((i-a)/(168*3600*1e3)))}function J(e){return[...e].sort((t,a)=>{const i=t.manualRank,d=a.manualRank;if(i!=null&&d!=null&&i!==d)return i-d;if(i!=null&&d==null)return-1;if(i==null&&d!=null)return 1;const n=W(a)-W(t);return n!==0?n:N(t)-N(a)})}function Q(e,t,a){return e.find(i=>i.id!==a&&i.manualRank!=null&&i.manualRank===t)}function it(e,t,a){const i=J(e),d=i.findIndex(s=>s.id===t);if(d<0)return e;const n=[...i],[o]=n.splice(d,1),r=Math.max(0,Math.min(n.length,Math.round(a)-1));n.splice(r,0,o);const p=new Map(n.map((s,l)=>[s.id,l+1]));return e.map(s=>{const l=p.get(s.id);return l==null||s.manualRank===l?s:{...s,manualRank:l}})}function Wt(e,t){if(t.length<2)return e;const a=J(e),i=new Set(t),d=new Map(e.map(s=>[s.id,s])),n=t.map(s=>d.get(s)).filter(s=>!!s);let o=0;const r=[];for(const s of a)if(i.has(s.id)){const l=n[o++];l&&r.push(l)}else r.push(s);for(;o<n.length;)r.push(n[o++]);const p=new Map(r.map((s,l)=>[s.id,l+1]));return e.map(s=>{const l=p.get(s.id);return l==null||s.manualRank===l?s:{...s,manualRank:l}})}function K(e){let t=0;for(const a of e)a.manualRank!=null&&a.manualRank>t&&(t=a.manualRank);return t+1}function V(e){const t=[...e].sort((o,r)=>{const p=W(r)-W(o);return p!==0?p:N(o)-N(r)}),a=new Set,i=new Map;for(const o of t){const r=o.manualRank;r!=null&&Number.isFinite(r)&&r>=1&&!a.has(r)&&(a.add(r),i.set(o.id,r))}let d=1;const n=()=>{for(;a.has(d);)d+=1;const o=d;return a.add(o),d+=1,o};return e.map(o=>{const r=i.get(o.id)??n();return o.manualRank===r?o:{...o,manualRank:r}})}function bt(e){const t=e.items.filter(s=>s.status!=="done"),a=J(t),i=new Map;for(const s of e.teams)i.set(s.id,[]);for(const s of a)for(const l of s.assignments){const v=i.get(l.teamId)??[];v.push({item:s,estimatePw:l.estimatePw,workStartDate:O(l.workStartDate||e.startDate)}),i.set(l.teamId,v)}const d=[],n={},o=52;for(const s of e.teams){const l=i.get(s.id)??[],v=Array.from({length:o},(g,w)=>({week:w,weekStart:F(e.startDate,w),usedPw:0,capacityPw:s.capacityPw,items:[]}));let k=0;l.forEach((g,w)=>{const h=Ct(e.startDate,g.workStartDate);let b=Math.max(k,h);for(;b<o&&v[b].usedPw>=s.capacityPw-.001;)b+=1;let j=g.estimatePw,E=b,q=F(e.startDate,b);const A=F(e.startDate,b);for(;j>.001&&E<o;){const S=v[E],T=Math.max(0,S.capacityPw-S.usedPw);if(T<=.001){E+=1;continue}const M=Math.min(T,j),c=F(e.startDate,E),f=M/S.capacityPw*7,y=S.usedPw/S.capacityPw*7;q=st(c,y+f),S.usedPw+=M,S.items.push(g.item.id),j-=M,j>.001&&(E+=1)}const L=s.capacityPw>0?Math.round(g.estimatePw/s.capacityPw*100)/100:g.estimatePw;d.push({item:g.item,teamId:s.id,estimatePw:g.estimatePw,wsjf:W(g.item),effectiveRank:w+1,plannedStartDate:g.workStartDate,startWeek:b,endWeek:E,startDate:A,endDate:q,waitWeeks:b,delayedByQueue:b>h,durationWeeks:L}),k=E,v[k]&&v[k].usedPw>=s.capacityPw-.001?k=E+1:k=E}),n[s.id]=v}const r=new Map;for(const s of d){const l=r.get(s.item.id)??[];l.push(s),r.set(s.item.id,l)}const p=[];for(const s of a){const l=r.get(s.id)??[];if(!l.length)continue;const v=At(l),k=l.reduce((g,w)=>w.startWeek<g.startWeek?w:g);p.push({item:s,slices:[...l].sort((g,w)=>g.endDate===w.endDate?w.estimatePw-g.estimatePw:g.endDate<w.endDate?1:-1),wsjf:W(s),totalEstimatePw:N(s),startWeek:k.startWeek,endWeek:v.endWeek,startDate:k.startDate,endDate:v.endDate,waitWeeks:k.waitWeeks,bottleneckTeamId:v.teamId})}return d.sort((s,l)=>s.startWeek!==l.startWeek?s.startWeek-l.startWeek:l.wsjf-s.wsjf),{slices:d,rollups:p,load:n}}function X(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function ot(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const a=O(String(t.startDate??G())),i=t.items.map(d=>{const n=d;let o=[];return Array.isArray(n.assignments)&&n.assignments.length?o=n.assignments.filter(r=>r&&typeof r.teamId=="string").map(r=>({teamId:r.teamId,estimatePw:Math.max(.5,Number(r.estimatePw)||1),workStartDate:O(String(r.workStartDate||n.workStartDate||a))})):typeof n.teamId=="string"&&(o=[{teamId:n.teamId,estimatePw:Math.max(.5,Number(n.estimatePw)||1),workStartDate:a}]),!o.length&&Array.isArray(t.teams)&&t.teams[0]&&(o=[{teamId:t.teams[0].id,estimatePw:4,workStartDate:a}]),{id:String(n.id??X("item")),title:String(n.title??"Без названия"),type:n.type==="project"?"project":"product",backlog:String(n.backlog??"Backlog"),assignments:o,status:["idea","ready","in_progress","blocked","done"].includes(String(n.status))?n.status:"idea",owner:String(n.owner??"—"),businessValue:Number(n.businessValue)||5,timeCriticality:Number(n.timeCriticality)||5,riskReduction:Number(n.riskReduction)||5,jobSize:Number(n.jobSize)||5,notes:n.notes!=null?String(n.notes):void 0,manualRank:n.manualRank==null||n.manualRank===""?null:Number(n.manualRank)}});return{version:3,startDate:a,teams:t.teams,items:V(i)}}const C=G(),rt=F(C,1),Z=F(C,2),wt=F(C,3),lt=F(C,4),ct=F(C,6),ht=F(C,8),$t={version:3,startDate:C,teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#2563eb"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#7c3aed"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#0d9488"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#c2410c"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:8,workStartDate:C}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",estimatePw:3,workStartDate:rt}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:3,workStartDate:lt}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",estimatePw:2,workStartDate:C}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",estimatePw:4,workStartDate:ct}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",estimatePw:10,workStartDate:C},{teamId:"data",estimatePw:4,workStartDate:wt}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",estimatePw:6,workStartDate:rt},{teamId:"crm",estimatePw:3,workStartDate:lt}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",estimatePw:5,workStartDate:Z},{teamId:"platform",estimatePw:3,workStartDate:Z}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",estimatePw:7,workStartDate:rt},{teamId:"platform",estimatePw:2,workStartDate:C}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",estimatePw:7,workStartDate:C},{teamId:"platform",estimatePw:4,workStartDate:Z},{teamId:"mobile",estimatePw:3,workStartDate:ct}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",estimatePw:8,workStartDate:wt},{teamId:"data",estimatePw:3,workStartDate:lt},{teamId:"mobile",estimatePw:2,workStartDate:ht}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",estimatePw:9,workStartDate:Z},{teamId:"platform",estimatePw:3,workStartDate:ct},{teamId:"mobile",estimatePw:2,workStartDate:ht}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},dt={...$t,items:V($t.items)},St="vi-planer-v3";let Pt="idle",tt=[];function Ft(){return null}function Dt(){return Pt}function Nt(e){return tt.push(e),()=>{tt=tt.filter(t=>t!==e)}}function U(e){Pt=e,tt.forEach(t=>t(e))}function Bt(){try{const e=localStorage.getItem(St)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=ot(JSON.parse(e));return t?{...t,items:V(t.items)}:null}catch{return null}}function It(e){localStorage.setItem(St,JSON.stringify(e))}async function Ot(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),a=ot(t.state);return a?{...a,items:V(a.items)}:null}catch{return null}}async function zt(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function Vt(){return null}async function Ht(e){return!1}async function Jt(){U("loading");const e=await Ot()??await Vt()??Bt()??structuredClone(dt);return It(e),U((Ft(),"saved")),e}let ut=null,mt=null;function pt(e){It(e),mt=e,ut&&clearTimeout(ut),ut=setTimeout(async()=>{const t=mt;if(mt=null,!t)return;U("loading");const a=await Ht(),i=a?!0:await zt(t);if(a||i){U("saved");return}U("offline")},350)}function xt(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}const Rt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды"},u={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let m=structuredClone(dt);function z(e){return m.teams.find(t=>t.id===e)}function ft(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function Et(e){return new Map(e.map(t=>[t.item.id,t]))}function Kt(e){return e.assignments.map(t=>{const a=z(t.teamId);return(a==null?void 0:a.name)??t.teamId}).join(", ")}function Ut(e){return`<div class="teams-stack">${e.assignments.map(a=>{const i=z(a.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(i==null?void 0:i.color)??"#94a3b8"}"></span>${I((i==null?void 0:i.name)??a.teamId)} <span class="mono muted-inline">${a.estimatePw}чн · старт ${$(a.workStartDate)}</span></span>`}).join("")}</div>`}function Yt(e){const t=u.query.trim().toLowerCase(),a=Et(e),i=m.items.filter(n=>u.typeFilter!=="all"&&n.type!==u.typeFilter||u.teamFilter!=="all"&&!Tt(n,u.teamFilter)||u.statusFilter!=="all"&&n.status!==u.statusFilter?!1:t?n.title.toLowerCase().includes(t)||n.backlog.toLowerCase().includes(t)||n.owner.toLowerCase().includes(t)||Kt(n).toLowerCase().includes(t):!0);if(u.sortKey==="priority"){const n=J(i);return u.sortDir==="asc"?n:[...n].reverse()}const d=u.sortDir==="asc"?1:-1;return[...i].sort((n,o)=>{var p,s;let r=0;if(u.sortKey==="wsjf")r=W(n)-W(o);else if(u.sortKey==="estimate")r=N(n)-N(o);else{const l=((p=a.get(n.id))==null?void 0:p.endDate)??"9999-99-99",v=((s=a.get(o.id))==null?void 0:s.endDate)??"9999-99-99";r=l<v?-1:l>v?1:0}return r!==0?r*d:n.title.localeCompare(o.title,"ru")})}function et(e,t){const a=u.sortKey===t,i=a?u.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${a?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${i}</th>`}function Gt(e){u.sortKey===e?u.sortDir=u.sortDir==="asc"?"desc":"asc":(u.sortKey=e,u.sortDir=e==="wsjf"?"desc":"asc"),_()}function Qt(e,t){const a=m.items.filter(s=>s.status!=="done"),i=a.filter(s=>s.type==="product").length,d=a.filter(s=>s.type==="project").length,n=a.filter(s=>s.assignments.length>1).length,o=e.map(s=>s.endWeek),r=o.length?Math.max(...o)+1:0,p=m.teams.filter(s=>t.filter(v=>v.teamId===s.id).reduce((v,k)=>v+k.estimatePw,0)>s.capacityPw*8).length;return`
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${a.length}</div>
        <div class="hint">${i} продуктов · ${d} проектов · ${n} кросс-командных</div>
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
  `}function Xt(){return`
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
  `}function Zt(e,t){const a=Et(e),i=Yt(e),d=u.sortKey==="priority",n=i.map(o=>{const r=a.get(o.id),p=W(o),s=N(o),l=o.manualRank??"—",v=r?`<div class="eta-teams">${r.slices.map(k=>{const g=z(k.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(g==null?void 0:g.color)??"#64748b"}">${I((g==null?void 0:g.name)??k.teamId)}</span>: ${$(k.startDate)}→${$(k.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${d?"row-draggable":""}" data-edit="${o.id}" data-row-id="${o.id}">
          <td class="prio-cell">
            <div class="prio-edit" data-stop-edit>
              ${d?'<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>':""}
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
          <td>${Ut(o)}</td>
          <td><span class="badge badge-status-${o.status}">${ft(o.status)}</span></td>
          <td class="mono wsjf">${p}</td>
          <td class="mono">
            ${s}
            ${o.assignments.length>1?`<div class="meta">${o.assignments.map(k=>k.estimatePw).join(" + ")}</div>`:""}
          </td>
          <td class="mono ${r&&r.waitWeeks>4?"eta-late":"eta-good"}">
            ${r?`<span class="eta-final">${$(r.endDate)}</span>`:"—"}
            ${v}
          </td>
        </tr>
      `}).join("");return`
    ${Xt()}
    <div class="panel">
      <div class="panel-header">
        <h2>Единый портфель (проекты + продукты)</h2>
        <div class="filters">
          <input id="q" placeholder="Поиск…" value="${H(u.query)}" />
          <select id="typeFilter">
            <option value="all" ${u.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${u.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${u.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${m.teams.map(o=>`<option value="${o.id}" ${u.teamFilter===o.id?"selected":""}>${I(o.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${u.statusFilter===o?"selected":""}>${ft(o)}</option>`).join("")}
          </select>
          <button class="btn" id="resetFilters" title="Сбросить фильтры и сортировку">Сбросить фильтры</button>
          <button class="btn btn-primary" id="addItem">+ Инициатива</button>
        </div>
      </div>
      ${d?"":'<p class="sort-prio-hint">Сейчас сортировка не по приоритету — перестановка строк отключена, приоритеты не меняются. Верните сортировку по «Приоритет», чтобы двигать строки.</p>'}
      <div style="overflow-x:auto">
        <table class="portfolio-table">
          <thead>
            <tr>
              ${et("Приоритет","priority")}
              <th>Тип</th>
              <th>Инициатива / исходный бэклог</th>
              <th>Команды (оценка · старт)</th>
              <th>Статус</th>
              ${et("WSJF","wsjf")}
              ${et("Оценка, чел·нед","estimate")}
              ${et("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${n||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function te(e){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${m.teams.map(a=>{const i=e.filter(r=>r.teamId===a.id).sort((r,p)=>r.effectiveRank-p.effectiveRank),d=i.reduce((r,p)=>r+p.estimatePw,0),n=a.capacityPw>0?d/a.capacityPw:0,o=Math.min(100,Math.round(i.filter(r=>r.startWeek<8).reduce((r,p)=>{const s=Math.min(p.endWeek+1,8)-p.startWeek;return r+Math.max(0,s)*(p.estimatePw/Math.max(1,p.endWeek-p.startWeek+1))},0)/(a.capacityPw*8)*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${I(a.name)}</h3>
              <div class="meta">Ёмкость ${a.capacityPw} чел·нед/нед · спрос ${d.toFixed(1)} · ~${n.toFixed(1)} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${o}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,o)}%;background:${a.color}"></span></div>
          ${i.map(r=>{const p=r.item.assignments.length-1;return`
            <div class="queue-item">
              <div class="rank">${r.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${r.item.type}">${r.item.type==="product"?"П":"Пр"}</span> ${I(r.item.title)}</div>
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
  `}function ee(e){const t=m.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда у команды появляется ёмкость с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${m.teams.map(i=>{const d=e.filter(s=>s.teamId===i.id).sort((s,l)=>{const v=s.item.manualRank??9999,k=l.item.manualRank??9999;return v!==k?v-k:s.effectiveRank-l.effectiveRank}),n=d.reduce((s,l)=>s+l.estimatePw,0),o=i.capacityPw>0?n/i.capacityPw:0,r=d.length?d[d.length-1].endDate:t,p=d.map((s,l)=>{const v=s.item.manualRank??"—",k=l>0?d[l-1]:null;let g="может взять сразу (есть свободная ёмкость)",w="take-now";s.startDate>s.plannedStartDate?(g=k?`ждёт очередь: после #${k.item.manualRank??"?"} «${k.item.title}»`:"сдвиг из‑за загрузки очереди",w="take-queue"):s.startDate>t&&(g=`ждёт плановый старт ${$(s.plannedStartDate)}`,w="take-plan");const h=s.item.assignments.filter(b=>b.teamId!==i.id).map(b=>{var j;return((j=z(b.teamId))==null?void 0:j.name)??b.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${v}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${s.item.type}">${s.item.type==="product"?"П":"Пр"}</span>
                  ${I(s.item.title)}
                </div>
                <div class="take-line ${w}">
                  <strong>Может взять с ${$(s.startDate)}</strong>
                  <span class="meta"> · ${I(g)}</span>
                </div>
                <div class="meta">
                  ${s.estimatePw} чел·нед · план ${$(s.plannedStartDate)} · до ${$(s.endDate)}
                  ${h.length?` · ещё: ${h.map(I).join(", ")}`:""}
                </div>
                <div class="take-bar" title="Окно работы в горизонте 12 нед.">
                  <span class="take-bar-fill" style="left:${s.startWeek/12*100}%;width:${Math.max(3,(s.endWeek-s.startWeek+1)/12*100)}%;background:${i.color}"></span>
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
              <h3><span class="team-dot" style="background:${i.color}"></span>${I(i.name)}</h3>
              <div class="meta">Ёмкость ${i.capacityPw} чел·нед/нед · спрос ${n.toFixed(1)} · ~${o.toFixed(1)} нед. до очистки</div>
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
  `}function ae(e,t){const a=Math.max(4,...e.map(h=>h.endWeek+2),4),i=Math.max(4,Math.min(52,Math.round(u.ganttWeeks)||16));u.ganttWeeks=i;const d=J(m.items.filter(h=>h.status!=="done")),n=new Map(d.map((h,b)=>[h.id,b])),o=100/i,r=`repeating-linear-gradient(90deg, #f8fafc 0, #f8fafc calc(${o}% - 1px), #e2e8f0 calc(${o}% - 1px), #e2e8f0 ${o}%)`,p=[],s=[];m.teams.forEach((h,b)=>{const j=t.filter(q=>q.teamId===h.id).sort((q,A)=>q.effectiveRank-A.effectiveRank);if(j.length<2)return;const E=`arrow-${h.id}`;s.push(`
      <marker id="${E}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${h.color}" fill-opacity="0.85" />
      </marker>
    `);for(let q=1;q<j.length;q++){const A=j[q-1],L=j[q],S=(n.get(A.item.id)??0)+.5,T=(n.get(L.item.id)??0)+.5,M=Math.min(i-.05,A.endWeek+.92),c=Math.min(i-.05,Math.max(.08,L.startWeek+.02)),f=c-M,y=(b%4-1.5)*.08,D=Math.max(.35,Math.abs(f)*.45)+Math.abs(y),P=M+(f>=0?D:-D*.35)+y,x=c-(f>=0?D:-D*.35)+y,R=Math.abs(S-T)<.02?`M ${M} ${S} H ${c}`:`M ${M} ${S} C ${P} ${S}, ${x} ${T}, ${c} ${T}`;p.push(`<path d="${R}" fill="none" stroke="${h.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${E})" />`)}});const l=[],v=[];for(const h of d){const b=e.find(L=>L.item.id===h.id);if(!b)continue;const j=b.slices.map(L=>{const S=t.filter(f=>f.teamId===L.teamId).sort((f,y)=>f.effectiveRank-y.effectiveRank),T=S.findIndex(f=>f.item.id===h.id);if(T<=0)return null;const M=S[T-1],c=z(L.teamId);return`#${M.item.manualRank} (${(c==null?void 0:c.name)??L.teamId})`}).filter(Boolean),E=[...new Set(j)],q=E.length?`<div class="meta gantt-dep-meta">после ${E.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',A=b.slices.map(L=>{const S=z(L.teamId),T=L.startWeek/i*100,M=Math.max(1,L.endWeek-L.startWeek+1)/i*100;return`<div class="gantt-bar ${L.teamId===b.bottleneckTeamId?"gantt-bot":""}" style="left:${T}%;width:${Math.max(M,2.5)}%;background:${(S==null?void 0:S.color)??"#64748b"}" title="${H((S==null?void 0:S.name)??"")}: ${$(L.endDate)}">${I((S==null?void 0:S.name)??"")}</div>`}).join("");l.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${h.manualRank??"—"}</span> ${I(h.title)}</div>
        <div class="meta">${h.type==="product"?"Продукт":"Проект"} · ETA ${$(b.endDate)}</div>
        ${q}
      </div>
    `),v.push(`<div class="gantt-track gantt-track-multi" style="background:${r}">${A}</div>`)}const k=Math.max(1,d.length),g=i<=12?1:i<=24?2:i<=36?3:4,w=Array.from({length:i},(h,b)=>{if(!(b%g===0||b===i-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${o}%"></div>`;const E=F(m.startDate,b),[,q,A]=E.split("-");return`<div class="gantt-axis-tick" style="width:${o}%">
      <span class="gantt-axis-w">Н${b+1}</span>
      <span class="gantt-axis-d">${A}.${q}</span>
    </div>`}).join("");return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сроки и зависимости по приоритету</h2>
        <div class="gantt-weeks-ctrl">
          <label for="ganttWeeks">Горизонт</label>
          <input id="ganttWeeks" type="range" min="4" max="52" step="1" value="${i}" />
          <span class="mono" id="ganttWeeksLabel">${i} нед.</span>
          ${a>i?`<span class="meta">часть работ за горизонтом (нужно ~${a})</span>`:""}
        </div>
      </div>
      <div class="timeline">
        ${d.length?`<div class="gantt-layout">
          <div class="gantt-labels-col">
            <div class="gantt-axis-spacer">
              <span class="meta">нед. с ${$(m.startDate)}</span>
            </div>
            ${l.join("")}
          </div>
          <div class="gantt-tracks-wrap">
            <div class="gantt-axis">${w}</div>
            <div class="gantt-tracks-col">
              <svg class="gantt-dep-layer" viewBox="0 0 ${i} ${k}" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  ${s.join("")}
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
  `}const vt=["#2563eb","#7c3aed","#0d9488","#c2410c","#db2777","#059669","#d97706","#4f46e5","#0891b2","#be123c"];function gt(){const e=new Set(m.teams.map(t=>t.color));return vt.find(t=>!e.has(t))??vt[m.teams.length%vt.length]}function ne(){return`
    <div class="callout">
      Управляйте командами: название и ёмкость (чел·нед/нед). Изменение ёмкости пересчитывает очереди и ETA.
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
          value="${H(t.name)}"
          aria-label="Название команды"
        />
        <input type="range" min="1" max="8" step="0.5" value="${t.capacityPw}" data-cap="${t.id}" />
        <span class="mono capacity-label" data-cap-label="${t.id}">${t.capacityPw} чел·нед</span>
      </div>
    `).join("")||'<div class="empty">Нет команд — создайте первую</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar" hidden>
        <span class="team-dot" id="newTeamDot" style="background:${gt()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">Создать</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function se(e){var s;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((s=m.teams[0])==null?void 0:s.id)??"",estimatePw:4,workStartDate:m.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:K(m.items)},a=W(t),i=new Set(t.assignments.map(l=>l.teamId)),d=new Map(t.assignments.map(l=>[l.teamId,l.estimatePw])),n=new Map(t.assignments.map(l=>[l.teamId,l.workStartDate])),o=Lt(t),r=o?qt(o,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',p=m.teams.map(l=>{const v=i.has(l.id),k=d.get(l.id)??4,g=n.get(l.id)??m.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${l.id}" ${v?"checked":""} />
            <span class="team-dot" style="background:${l.color}"></span>
            <span class="team-assign-name">${I(l.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Оценка</span>
            <input type="number" class="f_team_est" data-team="${l.id}" min="0.5" step="0.5" value="${k}" ${v?"":"disabled"} />
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
            <input id="f_title" value="${H(t.title)}" />
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
              <input id="f_backlog" value="${H(t.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${["idea","ready","in_progress","blocked","done"].map(l=>`<option value="${l}" ${t.status===l?"selected":""}>${ft(l)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${H(t.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: оценка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${p}</div>
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
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??K(m.items)}" />
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
  `}function Lt(e){const t=e.assignments.length?e.assignments:kt();if(!t.length)return null;const a=e.id||"__draft__",i={...e,id:a,assignments:t},d=m.items.some(o=>o.id===a)?m.items.map(o=>o.id===a?i:o):[...m.items,i],{rollups:n}=bt({...m,items:d});return n.find(o=>o.item.id===a)??null}function jt(e){const t=z(e.teamId),a=(t==null?void 0:t.capacityPw)||1,i=Math.round(e.estimatePw/a*100)/100,d=O(e.workStartDate||m.startDate),n=st(d,i*7);return{start:d,end:n,weeks:i}}function qt(e,t){const a=new Map(t.map(n=>[n.teamId,n])),i=e.slices.map(n=>{const o=z(n.teamId),r=a.get(n.teamId),p=r?O(r.workStartDate):n.plannedStartDate,s=r?jt(r):null,l=n.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",v=n.startDate>p?` <span class="meta">(план ${$(p)}, очередь сдвинула на ${$(n.startDate)})</span>`:n.startDate<p?` <span class="meta">(ждём план ${$(p)})</span>`:"",k=s?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(s.start)} → <span class="mono">${$(s.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${I((o==null?void 0:o.name)??n.teamId)}</strong>: <span class="mono">${$(n.startDate)} → ${$(n.endDate)}</span> <span class="meta">(${n.estimatePw} чел·нед ≈ ${n.durationWeeks} нед.)</span>${v}${l}${k}</div>`}).join(""),d=t.map(n=>jt(n).end).reduce((n,o)=>n>o?n:o,"0000-00-00");return i+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(d)}</strong> — меняется сразу при смене даты</div>`}function I(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function H(e){return I(e).replaceAll("'","&#39;")}function Y(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),(e=document.querySelector("#prioPop"))==null||e.remove()}function ie(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-prio-no>Нет</button>
      <button type="button" class="btn btn-primary" data-prio-yes>Да</button>
    </div>
  `}function yt(e,t,a,i){var v,k;Y(),e.classList.add("prio-ask");const d=document.createElement("div");d.id="prioPop",d.className="prio-confirm prio-confirm-float",d.setAttribute("data-stop-edit",""),d.innerHTML=ie(t),document.body.appendChild(d);const n=()=>{const g=e.getBoundingClientRect(),w=d.getBoundingClientRect();let h=g.right+8,b=g.top+g.height/2-w.height/2;h+w.width>window.innerWidth-8&&(h=Math.max(8,g.left-w.width-8)),b=Math.max(8,Math.min(b,window.innerHeight-w.height-8)),d.style.left=`${h}px`,d.style.top=`${b}px`};n();const o=()=>n();window.addEventListener("scroll",o,!0),window.addEventListener("resize",o);const r=()=>{window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",o),document.removeEventListener("mousedown",l,!0)},p=()=>{r(),Y(),i()},s=()=>{r(),Y(),a()},l=g=>{const w=g.target;d.contains(w)||e.contains(w)||p()};document.addEventListener("mousedown",l,!0),(v=d.querySelector("[data-prio-yes]"))==null||v.addEventListener("click",g=>{g.stopPropagation(),s()}),(k=d.querySelector("[data-prio-no]"))==null||k.addEventListener("click",g=>{g.stopPropagation(),p()})}function oe(){if(u.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,a=null;const i=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(n=>n.classList.remove("is-dragging","drag-over"))},d=(n,o)=>{if(n===o)return;const r=Array.from(e.querySelectorAll("tr[data-row-id]")).map(k=>k.dataset.rowId),p=r.indexOf(n),s=r.indexOf(o);if(p<0||s<0)return;const l=[...r];l.splice(p,1),l.splice(s,0,n);const v=u.sortDir==="asc"?l:[...l].reverse();m.items=Wt(m.items,v),u.sortKey="priority",B()};e.querySelectorAll("[data-drag-handle]").forEach(n=>{const o=n.closest("tr[data-row-id]");if(!o)return;n.addEventListener("pointerdown",p=>{p.button===0&&(p.preventDefault(),p.stopPropagation(),t=o.dataset.rowId??null,a=p.pointerId,n.setPointerCapture(p.pointerId),i(),o.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),n.addEventListener("pointermove",p=>{if(t==null||p.pointerId!==a)return;const s=document.elementFromPoint(p.clientX,p.clientY),l=s==null?void 0:s.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(v=>v.classList.remove("drag-over")),l&&l.dataset.rowId!==t&&l.classList.add("drag-over")});const r=p=>{if(t==null||p.pointerId!==a)return;const s=t,l=document.elementFromPoint(p.clientX,p.clientY),v=l==null?void 0:l.closest("tr[data-row-id]"),k=v==null?void 0:v.dataset.rowId;try{n.releasePointerCapture(p.pointerId)}catch{}i(),document.body.classList.remove("prio-dragging"),t=null,a=null,k&&d(s,k)};n.addEventListener("pointerup",r),n.addEventListener("pointercancel",r)})}function _(){Y();const{slices:e,rollups:t}=bt(m),a=document.querySelector("#app");if(!a)return;const i=u.editingId!=null?m.items.find(d=>d.id===u.editingId)??null:null;a.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div>
          <h1>VI Planer</h1>
          <p class="subtitle">
            Единый портфель проектов и продуктов: сквозной WSJF, несколько команд на инициативу
            со своими оценками и ETA, bottleneck-срок готовности.
          </p>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${Dt()}">${xt(Dt())}</span>
          <button class="btn" id="exportPdfBtn">Экспорт PDF</button>
          <button class="btn" id="exportBtn">Экспорт JSON</button>
          <button class="btn" id="importBtn">Импорт JSON</button>
          <button class="btn" id="resetBtn">Сбросить демо</button>
        </div>
      </div>
      <div class="print-only print-doc-header">
        <h1>VI Planer — ${Rt[u.tab]}</h1>
        <p>Старт портфеля: ${m.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${Qt(t,e)}
      <div class="tabs no-print">
        <button class="tab ${u.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${u.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${u.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${u.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${u.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${u.tab==="portfolio"?Zt(t):u.tab==="teams"?te(e):u.tab==="queuesTest"?ee(e):u.tab==="timeline"?ae(t,e):ne()}
      </div>
    </div>
    ${u.creating||i?se(i):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,re()}function kt(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const a of e){if(!a.checked)continue;const i=a.dataset.team,d=document.querySelector(`.f_team_est[data-team="${i}"]`),n=document.querySelector(`.f_team_start[data-team="${i}"]`),o=Math.max(.5,Number(d==null?void 0:d.value)||1),r=O((n==null?void 0:n.value)||m.startDate);t.push({teamId:i,estimatePw:o,workStartDate:r})}return t}function Mt(){var o,r,p,s,l,v,k;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),a=kt();if(e&&(e.textContent=String(a.reduce((g,w)=>g+w.estimatePw,0)||0)),!t)return;if(!a.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const i=(u.editingId?m.items.find(g=>g.id===u.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:a,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},d={...i,id:u.editingId||"__draft__",assignments:a,title:((o=document.querySelector("#f_title"))==null?void 0:o.value.trim())||i.title,type:((r=document.querySelector("#f_type"))==null?void 0:r.value)||i.type,status:((p=document.querySelector("#f_status"))==null?void 0:p.value)||i.status,businessValue:Number((s=document.querySelector("#f_bv"))==null?void 0:s.value)||i.businessValue,timeCriticality:Number((l=document.querySelector("#f_tc"))==null?void 0:l.value)||i.timeCriticality,riskReduction:Number((v=document.querySelector("#f_rr"))==null?void 0:v.value)||i.riskReduction,jobSize:Number((k=document.querySelector("#f_js"))==null?void 0:k.value)||i.jobSize,manualRank:(()=>{var h;const g=(h=document.querySelector("#f_rank"))==null?void 0:h.value,w=Math.round(Number(g));return Number.isFinite(w)&&w>=1?w:i.manualRank??K(m.items)})()},n=Lt(d);if(!n){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=qt(n,a)}function _t(){const e=(n,o)=>{const r=document.querySelector(`#${n}`),p=Number(r==null?void 0:r.value);return Number.isFinite(p)?p:o},t=n=>{var o;return((o=document.querySelector(`#${n}`))==null?void 0:o.value)??""},a=kt();if(!a.length)return alert("Выберите хотя бы одну команду"),null;const i=t("f_rank").trim(),d=Math.max(1,Math.round(Number(i)||K(m.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:a,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:at(e("f_bv",5),1,10),timeCriticality:at(e("f_tc",5),1,10),riskReduction:at(e("f_rr",5),1,10),jobSize:at(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:d}}function at(e,t,a){return Math.min(a,Math.max(t,e))}function B(){pt(m),_()}function re(){var s,l,v,k,g,w,h,b,j,E,q,A,L,S,T,M;document.querySelectorAll("[data-tab]").forEach(c=>{c.addEventListener("click",()=>{u.tab=c.dataset.tab,_()})});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{u.query=e.value}),e==null||e.addEventListener("change",()=>_());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{u.typeFilter=t.value,_()});const a=document.querySelector("#teamFilter");a==null||a.addEventListener("change",()=>{u.teamFilter=a.value,_()});const i=document.querySelector("#statusFilter");i==null||i.addEventListener("change",()=>{u.statusFilter=i.value,_()}),(s=document.querySelector("#addItem"))==null||s.addEventListener("click",()=>{u.creating=!0,u.editingId=null,_()}),(l=document.querySelector("#resetFilters"))==null||l.addEventListener("click",()=>{u.typeFilter="all",u.teamFilter="all",u.statusFilter="all",u.query="",u.sortKey="priority",u.sortDir="asc",_()}),document.querySelectorAll("[data-edit]").forEach(c=>{c.addEventListener("click",f=>{f.target.closest("[data-stop-edit], .prio-input, .prio-edit, #prioPop, .drag-handle")||(u.editingId=c.dataset.edit??null,u.creating=!1,_())})}),oe(),document.querySelectorAll(".prio-input").forEach(c=>{const f=c.dataset.prioId,y=()=>{const P=m.items.find(x=>x.id===f);c.value=String((P==null?void 0:P.manualRank)??1)},D=()=>{const P=m.items.find(ue=>ue.id===f);if(!P)return;const x=Number(c.value);if(!Number.isFinite(x)||x<1){y();return}const R=Math.round(x);if(c.value=String(R),R===P.manualRank)return;const nt=Q(m.items,R,f),de=nt?`Сменить на <span class="accent">${R}</span>?<br/>«${I(nt.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${R}</span>?`;yt(c,de,()=>{m.items=it(m.items,f,R),B()},y)};c.addEventListener("click",P=>P.stopPropagation()),c.addEventListener("mousedown",P=>P.stopPropagation()),c.addEventListener("keydown",P=>{P.key==="Enter"&&(P.preventDefault(),D()),P.key==="Escape"&&(Y(),y(),c.blur())}),c.addEventListener("change",D)}),document.querySelectorAll("[data-sort]").forEach(c=>{c.addEventListener("click",f=>{f.stopPropagation();const y=c.dataset.sort;(y==="wsjf"||y==="estimate"||y==="eta"||y==="priority")&&Gt(y)})});const d=()=>{u.creating=!1,u.editingId=null,_()};(v=document.querySelector("#closeModal"))==null||v.addEventListener("click",d),(k=document.querySelector("#closeModal2"))==null||k.addEventListener("click",d),(g=document.querySelector("#modal"))==null||g.addEventListener("click",c=>{c.target.id==="modal"&&d()}),document.querySelectorAll(".f_team_check").forEach(c=>{c.addEventListener("change",()=>{const f=c.dataset.team,y=document.querySelector(`.f_team_est[data-team="${f}"]`),D=document.querySelector(`.f_team_start[data-team="${f}"]`);y&&(y.disabled=!c.checked),D&&(D.disabled=!c.checked),Mt()})});const n=document.querySelector("#teamAssignList"),o=c=>{const f=c.target;f&&(f.classList.contains("f_team_est")||f.classList.contains("f_team_start")||f.classList.contains("f_team_check"))&&Mt()};n==null||n.addEventListener("input",o),n==null||n.addEventListener("change",o),n==null||n.addEventListener("keyup",o),(w=document.querySelector("#saveItem"))==null||w.addEventListener("click",()=>{const c=_t();if(!c)return;const f=c.manualRank??K(m.items),y=document.querySelector("#f_rank"),D=()=>{if(Q(m.items,f,null)){const R=X("item");m.items=[...m.items,{...c,id:R,manualRank:m.items.length+1}],m.items=it(m.items,R,f)}else m.items.push({...c,id:X("item"),manualRank:f}),m.items=V(m.items);u.creating=!1,u.editingId=null,B()},P=()=>{if(!u.editingId)return;const x=m.items.findIndex(nt=>nt.id===u.editingId);if(x<0)return;const R=m.items[x];f!==R.manualRank?(m.items[x]={...R,...c,manualRank:R.manualRank},m.items=it(m.items,u.editingId,f)):m.items[x]={...R,...c},u.creating=!1,u.editingId=null,B()};if(u.creating){const x=Q(m.items,f,null);if(x&&y){yt(y,`Занять <span class="accent">${f}</span>?<br/>«${I(x.title)}» сдвинется вверх.`,D,()=>{});return}D();return}if(u.editingId){const x=m.items.find(R=>R.id===u.editingId);if(x&&f!==x.manualRank&&y){const R=Q(m.items,f,u.editingId);yt(y,R?`Сменить на <span class="accent">${f}</span>?<br/>«${I(R.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${f}</span>?`,P,()=>{});return}P()}}),(h=document.querySelector("#deleteItem"))==null||h.addEventListener("click",()=>{u.editingId&&(m.items=m.items.filter(c=>c.id!==u.editingId),u.editingId=null,B())}),["f_bv","f_tc","f_rr","f_js"].forEach(c=>{var f;(f=document.querySelector(`#${c}`))==null||f.addEventListener("input",()=>{const y=document.querySelector("#liveWsjf");if(!y)return;const D=_t();D&&(y.textContent=String(W({...D})))})}),document.querySelectorAll("[data-cap]").forEach(c=>{c.addEventListener("input",()=>{const f=c.dataset.cap,y=m.teams.find(P=>P.id===f);if(!y)return;y.capacityPw=Number(c.value),pt(m);const D=document.querySelector(`[data-cap-label="${f}"]`);D&&(D.textContent=`${y.capacityPw} чел·нед`)}),c.addEventListener("change",()=>_())});const r=document.querySelector("#ganttWeeks");r==null||r.addEventListener("input",()=>{const c=Math.max(4,Math.min(52,Number(r.value)||16));u.ganttWeeks=c;const f=document.querySelector("#ganttWeeksLabel");f&&(f.textContent=`${c} нед.`)}),r==null||r.addEventListener("change",()=>{u.ganttWeeks=Math.max(4,Math.min(52,Number(r.value)||16)),_()}),document.querySelectorAll("[data-team-name]").forEach(c=>{const f=()=>{const y=c.dataset.teamName,D=m.teams.find(x=>x.id===y);if(!D)return;const P=c.value.trim()||D.name;c.value=P,P!==D.name&&(D.name=P,B())};c.addEventListener("change",f),c.addEventListener("keydown",y=>{y.key==="Enter"&&(y.preventDefault(),c.blur())})}),(b=document.querySelector("#addTeam"))==null||b.addEventListener("click",()=>{const c=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName"),y=document.querySelector("#newTeamDot");c&&(c.hidden=!1),y&&(y.style.background=gt()),f==null||f.focus()}),(j=document.querySelector("#cancelNewTeam"))==null||j.addEventListener("click",()=>{const c=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName");c&&(c.hidden=!0),f&&(f.value="")});const p=()=>{const c=document.querySelector("#newTeamName"),f=(c==null?void 0:c.value.trim())||"";if(!f){c==null||c.focus();return}m.teams.push({id:X("team"),name:f,capacityPw:3,color:gt()}),B()};(E=document.querySelector("#saveNewTeam"))==null||E.addEventListener("click",p),(q=document.querySelector("#newTeamName"))==null||q.addEventListener("keydown",c=>{c.key==="Enter"&&(c.preventDefault(),p())}),(A=document.querySelector("#exportPdfBtn"))==null||A.addEventListener("click",()=>{le()}),(L=document.querySelector("#exportBtn"))==null||L.addEventListener("click",()=>{const c=new Blob([JSON.stringify(m,null,2)],{type:"application/json"}),f=URL.createObjectURL(c),y=document.createElement("a");y.href=f,y.download=`vi-planer-${m.startDate}.json`,y.click(),URL.revokeObjectURL(f)}),(S=document.querySelector("#importBtn"))==null||S.addEventListener("click",()=>{var c;(c=document.querySelector("#fileInput"))==null||c.click()}),(T=document.querySelector("#fileInput"))==null||T.addEventListener("change",async c=>{var y;const f=(y=c.target.files)==null?void 0:y[0];if(f)try{const D=await f.text(),P=ot(JSON.parse(D));if(!P){alert("Неверный формат файла");return}m=P,B()}catch{alert("Не удалось прочитать JSON")}}),(M=document.querySelector("#resetBtn"))==null||M.addEventListener("click",()=>{confirm("Сбросить к демо-данным?")&&(m=structuredClone(dt),B())})}function le(){const e=document.title,t=new Date().toISOString().slice(0,10);document.title=`VI-Planer-${Rt[u.tab]}-${t}`,document.body.classList.add("printing-tab");const a=()=>{document.body.classList.remove("printing-tab"),document.title=e,window.removeEventListener("afterprint",a)};window.addEventListener("afterprint",a),window.setTimeout(()=>window.print(),50)}async function ce(){m=await Jt();const e=m.items.map(a=>a.manualRank).join(",");m={...m,items:V(m.items)};const t=m.items.map(a=>a.manualRank).join(",");e!==t&&pt(m),Nt(a=>{const i=document.querySelector("#syncStatus");i&&(i.dataset.status=a,i.textContent=xt(a))}),_()}ce()})();
