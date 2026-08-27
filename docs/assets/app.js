(function(){"use strict";function W(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function B(e){return e.assignments.reduce((t,a)=>t+a.estimatePw,0)}function Ct(e,t){return e.assignments.some(a=>a.teamId===t)}function it(e,t){const a=new Date(e+"T12:00:00");return a.setDate(a.getDate()+t),a.toISOString().slice(0,10)}function F(e,t){return it(e,t*7)}function At(e){return e.reduce((t,a)=>a.endDate!==t.endDate?a.endDate>t.endDate?a:t:a.estimatePw!==t.estimatePw?a.estimatePw>t.estimatePw?a:t:a.durationWeeks>t.durationWeeks?a:t)}function $(e){const[t,a,i]=e.split("-");return`${i}.${a}.${t}`}function Q(e=new Date){const t=new Date(e),a=t.getDay(),i=a===0?-6:1-a;return t.setDate(t.getDate()+i),t.toISOString().slice(0,10)}function O(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?Q():Q(new Date(e.slice(0,10)+"T12:00:00"))}function Wt(e,t){const a=new Date(O(e)+"T12:00:00").getTime(),i=new Date(O(t)+"T12:00:00").getTime();return Math.max(0,Math.round((i-a)/(168*3600*1e3)))}function U(e){return[...e].sort((t,a)=>{const i=t.manualRank,d=a.manualRank;if(i!=null&&d!=null&&i!==d)return i-d;if(i!=null&&d==null)return-1;if(i==null&&d!=null)return 1;const n=W(a)-W(t);return n!==0?n:B(t)-B(a)})}function X(e,t,a){return e.find(i=>i.id!==a&&i.manualRank!=null&&i.manualRank===t)}function ot(e,t,a){const i=U(e),d=i.findIndex(s=>s.id===t);if(d<0)return e;const n=[...i],[o]=n.splice(d,1),r=Math.max(0,Math.min(n.length,Math.round(a)-1));n.splice(r,0,o);const p=new Map(n.map((s,c)=>[s.id,c+1]));return e.map(s=>{const c=p.get(s.id);return c==null||s.manualRank===c?s:{...s,manualRank:c}})}function Ft(e,t){if(t.length<2)return e;const a=U(e),i=new Set(t),d=new Map(e.map(s=>[s.id,s])),n=t.map(s=>d.get(s)).filter(s=>!!s);let o=0;const r=[];for(const s of a)if(i.has(s.id)){const c=n[o++];c&&r.push(c)}else r.push(s);for(;o<n.length;)r.push(n[o++]);const p=new Map(r.map((s,c)=>[s.id,c+1]));return e.map(s=>{const c=p.get(s.id);return c==null||s.manualRank===c?s:{...s,manualRank:c}})}function Y(e){let t=0;for(const a of e)a.manualRank!=null&&a.manualRank>t&&(t=a.manualRank);return t+1}function H(e){const t=[...e].sort((o,r)=>{const p=W(r)-W(o);return p!==0?p:B(o)-B(r)}),a=new Set,i=new Map;for(const o of t){const r=o.manualRank;r!=null&&Number.isFinite(r)&&r>=1&&!a.has(r)&&(a.add(r),i.set(o.id,r))}let d=1;const n=()=>{for(;a.has(d);)d+=1;const o=d;return a.add(o),d+=1,o};return e.map(o=>{const r=i.get(o.id)??n();return o.manualRank===r?o:{...o,manualRank:r}})}function wt(e){const t=e.items.filter(s=>s.status!=="done"),a=U(t),i=new Map;for(const s of e.teams)i.set(s.id,[]);for(const s of a)for(const c of s.assignments){const g=i.get(c.teamId)??[];g.push({item:s,estimatePw:c.estimatePw,workStartDate:O(c.workStartDate||e.startDate)}),i.set(c.teamId,g)}const d=[],n={},o=52;for(const s of e.teams){const c=i.get(s.id)??[],g=Array.from({length:o},(f,w)=>({week:w,weekStart:F(e.startDate,w),usedPw:0,capacityPw:s.capacityPw,items:[]}));let y=0;c.forEach((f,w)=>{const h=Wt(e.startDate,f.workStartDate);let k=Math.max(y,h);for(;k<o&&g[k].usedPw>=s.capacityPw-.001;)k+=1;let j=f.estimatePw,L=k,q=F(e.startDate,k);const C=F(e.startDate,k);for(;j>.001&&L<o;){const S=g[L],T=Math.max(0,S.capacityPw-S.usedPw);if(T<=.001){L+=1;continue}const M=Math.min(T,j),l=F(e.startDate,L),v=M/S.capacityPw*7,b=S.usedPw/S.capacityPw*7;q=it(l,b+v),S.usedPw+=M,S.items.push(f.item.id),j-=M,j>.001&&(L+=1)}const R=s.capacityPw>0?Math.round(f.estimatePw/s.capacityPw*100)/100:f.estimatePw;d.push({item:f.item,teamId:s.id,estimatePw:f.estimatePw,wsjf:W(f.item),effectiveRank:w+1,plannedStartDate:f.workStartDate,startWeek:k,endWeek:L,startDate:C,endDate:q,waitWeeks:k,delayedByQueue:k>h,durationWeeks:R}),y=L,g[y]&&g[y].usedPw>=s.capacityPw-.001?y=L+1:y=L}),n[s.id]=g}const r=new Map;for(const s of d){const c=r.get(s.item.id)??[];c.push(s),r.set(s.item.id,c)}const p=[];for(const s of a){const c=r.get(s.id)??[];if(!c.length)continue;const g=At(c),y=c.reduce((f,w)=>w.startWeek<f.startWeek?w:f);p.push({item:s,slices:[...c].sort((f,w)=>f.endDate===w.endDate?w.estimatePw-f.estimatePw:f.endDate<w.endDate?1:-1),wsjf:W(s),totalEstimatePw:B(s),startWeek:y.startWeek,endWeek:g.endWeek,startDate:y.startDate,endDate:g.endDate,waitWeeks:y.waitWeeks,bottleneckTeamId:g.teamId})}return d.sort((s,c)=>s.startWeek!==c.startWeek?s.startWeek-c.startWeek:c.wsjf-s.wsjf),{slices:d,rollups:p,load:n}}function Z(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function rt(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const a=O(String(t.startDate??Q())),i=t.items.map(d=>{const n=d;let o=[];return Array.isArray(n.assignments)&&n.assignments.length?o=n.assignments.filter(r=>r&&typeof r.teamId=="string").map(r=>({teamId:r.teamId,estimatePw:Math.max(.5,Number(r.estimatePw)||1),workStartDate:O(String(r.workStartDate||n.workStartDate||a))})):typeof n.teamId=="string"&&(o=[{teamId:n.teamId,estimatePw:Math.max(.5,Number(n.estimatePw)||1),workStartDate:a}]),!o.length&&Array.isArray(t.teams)&&t.teams[0]&&(o=[{teamId:t.teams[0].id,estimatePw:4,workStartDate:a}]),{id:String(n.id??Z("item")),title:String(n.title??"Без названия"),type:n.type==="project"?"project":"product",backlog:String(n.backlog??"Backlog"),assignments:o,status:["idea","ready","in_progress","blocked","done"].includes(String(n.status))?n.status:"idea",owner:String(n.owner??"—"),businessValue:Number(n.businessValue)||5,timeCriticality:Number(n.timeCriticality)||5,riskReduction:Number(n.riskReduction)||5,jobSize:Number(n.jobSize)||5,notes:n.notes!=null?String(n.notes):void 0,manualRank:n.manualRank==null||n.manualRank===""?null:Number(n.manualRank)}});return{version:3,startDate:a,teams:t.teams,items:H(i)}}const A=Q(),ct=F(A,1),tt=F(A,2),ht=F(A,3),lt=F(A,4),dt=F(A,6),$t=F(A,8),St={version:3,startDate:A,teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#2563eb"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#7c3aed"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#0d9488"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#c2410c"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:8,workStartDate:A}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",estimatePw:3,workStartDate:ct}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:3,workStartDate:lt}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",estimatePw:2,workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",estimatePw:4,workStartDate:dt}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",estimatePw:10,workStartDate:A},{teamId:"data",estimatePw:4,workStartDate:ht}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",estimatePw:6,workStartDate:ct},{teamId:"crm",estimatePw:3,workStartDate:lt}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",estimatePw:5,workStartDate:tt},{teamId:"platform",estimatePw:3,workStartDate:tt}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",estimatePw:7,workStartDate:ct},{teamId:"platform",estimatePw:2,workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",estimatePw:7,workStartDate:A},{teamId:"platform",estimatePw:4,workStartDate:tt},{teamId:"mobile",estimatePw:3,workStartDate:dt}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",estimatePw:8,workStartDate:ht},{teamId:"data",estimatePw:3,workStartDate:lt},{teamId:"mobile",estimatePw:2,workStartDate:$t}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",estimatePw:9,workStartDate:tt},{teamId:"platform",estimatePw:3,workStartDate:dt},{teamId:"mobile",estimatePw:2,workStartDate:$t}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},ut={...St,items:H(St.items)},Pt="vi-planer-v3";let Dt="idle",et=[];function Bt(){return null}function It(){return Dt}function Nt(e){return et.push(e),()=>{et=et.filter(t=>t!==e)}}function G(e){Dt=e,et.forEach(t=>t(e))}function Ot(){try{const e=localStorage.getItem(Pt)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=rt(JSON.parse(e));return t?{...t,items:H(t.items)}:null}catch{return null}}function xt(e){localStorage.setItem(Pt,JSON.stringify(e))}async function zt(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),a=rt(t.state);return a?{...a,items:H(a.items)}:null}catch{return null}}async function Ht(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function Vt(){return null}async function Jt(e){return!1}async function Kt(){G("loading");const e=await zt()??await Vt()??Ot()??structuredClone(ut);return xt(e),G((Bt(),"saved")),e}let mt=null,pt=null;function vt(e){xt(e),pt=e,mt&&clearTimeout(mt),mt=setTimeout(async()=>{const t=pt;if(pt=null,!t)return;G("loading");const a=await Jt(),i=a?!0:await Ht(t);if(a||i){G("saved");return}G("offline")},350)}function Et(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}const Lt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды"},u={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let m=structuredClone(ut);function z(e){return m.teams.find(t=>t.id===e)}function ft(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function Rt(e){return new Map(e.map(t=>[t.item.id,t]))}function Ut(e){return e.assignments.map(t=>{const a=z(t.teamId);return(a==null?void 0:a.name)??t.teamId}).join(", ")}function Yt(e){return`<div class="teams-stack">${e.assignments.map(a=>{const i=z(a.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(i==null?void 0:i.color)??"#94a3b8"}"></span>${I((i==null?void 0:i.name)??a.teamId)} <span class="mono muted-inline">${a.estimatePw}чн · старт ${$(a.workStartDate)}</span></span>`}).join("")}</div>`}function Gt(e){const t=u.query.trim().toLowerCase(),a=Rt(e),i=m.items.filter(n=>u.typeFilter!=="all"&&n.type!==u.typeFilter||u.teamFilter!=="all"&&!Ct(n,u.teamFilter)||u.statusFilter!=="all"&&n.status!==u.statusFilter?!1:t?n.title.toLowerCase().includes(t)||n.backlog.toLowerCase().includes(t)||n.owner.toLowerCase().includes(t)||Ut(n).toLowerCase().includes(t):!0);if(u.sortKey==="priority"){const n=U(i);return u.sortDir==="asc"?n:[...n].reverse()}const d=u.sortDir==="asc"?1:-1;return[...i].sort((n,o)=>{var p,s;let r=0;if(u.sortKey==="wsjf")r=W(n)-W(o);else if(u.sortKey==="estimate")r=B(n)-B(o);else{const c=((p=a.get(n.id))==null?void 0:p.endDate)??"9999-99-99",g=((s=a.get(o.id))==null?void 0:s.endDate)??"9999-99-99";r=c<g?-1:c>g?1:0}return r!==0?r*d:n.title.localeCompare(o.title,"ru")})}function at(e,t){const a=u.sortKey===t,i=a?u.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${a?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${i}</th>`}function Qt(e){u.sortKey===e?u.sortDir=u.sortDir==="asc"?"desc":"asc":(u.sortKey=e,u.sortDir=e==="wsjf"?"desc":"asc"),_()}function Xt(e,t){const a=m.items.filter(s=>s.status!=="done"),i=a.filter(s=>s.type==="product").length,d=a.filter(s=>s.type==="project").length,n=a.filter(s=>s.assignments.length>1).length,o=e.map(s=>s.endWeek),r=o.length?Math.max(...o)+1:0,p=m.teams.filter(s=>t.filter(g=>g.teamId===s.id).reduce((g,y)=>g+y.estimatePw,0)>s.capacityPw*8).length;return`
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
  `}function Zt(){return`
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
  `}function te(e,t){const a=Rt(e),i=Gt(e),d=u.sortKey==="priority",n=i.map(o=>{const r=a.get(o.id),p=W(o),s=B(o),c=o.manualRank??"—",g=r?`<div class="eta-teams">${r.slices.map(y=>{const f=z(y.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(f==null?void 0:f.color)??"#64748b"}">${I((f==null?void 0:f.name)??y.teamId)}</span>: ${$(y.startDate)}→${$(y.endDate)}</div>`}).join("")}</div>`:"";return`
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
            <div class="name">${I(o.title)}</div>
            <div class="meta">${I(o.backlog)} · ${I(o.owner)}</div>
          </td>
          <td>${Yt(o)}</td>
          <td><span class="badge badge-status-${o.status}">${ft(o.status)}</span></td>
          <td class="mono wsjf">${p}</td>
          <td class="mono">
            ${s}
            ${o.assignments.length>1?`<div class="meta">${o.assignments.map(y=>y.estimatePw).join(" + ")}</div>`:""}
          </td>
          <td class="mono ${r&&r.waitWeeks>4?"eta-late":"eta-good"}">
            ${r?`<span class="eta-final">${$(r.endDate)}</span>`:"—"}
            ${g}
          </td>
        </tr>
      `}).join("");return`
    ${Zt()}
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
  `}function ee(e){return`
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
  `}function ae(e){const t=m.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда у команды появляется ёмкость с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${m.teams.map(i=>{const d=e.filter(s=>s.teamId===i.id).sort((s,c)=>{const g=s.item.manualRank??9999,y=c.item.manualRank??9999;return g!==y?g-y:s.effectiveRank-c.effectiveRank}),n=d.reduce((s,c)=>s+c.estimatePw,0),o=i.capacityPw>0?n/i.capacityPw:0,r=d.length?d[d.length-1].endDate:t,p=d.map((s,c)=>{const g=s.item.manualRank??"—",y=c>0?d[c-1]:null;let f="может взять сразу (есть свободная ёмкость)",w="take-now";s.startDate>s.plannedStartDate?(f=y?`ждёт очередь: после #${y.item.manualRank??"?"} «${y.item.title}»`:"сдвиг из‑за загрузки очереди",w="take-queue"):s.startDate>t&&(f=`ждёт плановый старт ${$(s.plannedStartDate)}`,w="take-plan");const h=s.item.assignments.filter(k=>k.teamId!==i.id).map(k=>{var j;return((j=z(k.teamId))==null?void 0:j.name)??k.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${g}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${s.item.type}">${s.item.type==="product"?"П":"Пр"}</span>
                  ${I(s.item.title)}
                </div>
                <div class="take-line ${w}">
                  <strong>Может взять с ${$(s.startDate)}</strong>
                  <span class="meta"> · ${I(f)}</span>
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
  `}function ne(e,t){const a=Math.max(4,...e.map(h=>h.endWeek+2),4),i=Math.max(4,Math.min(52,Math.round(u.ganttWeeks)||16));u.ganttWeeks=i;const d=U(m.items.filter(h=>h.status!=="done")),n=new Map(d.map((h,k)=>[h.id,k])),o=100/i,r=`repeating-linear-gradient(90deg, #f8fafc 0, #f8fafc calc(${o}% - 1px), #e2e8f0 calc(${o}% - 1px), #e2e8f0 ${o}%)`,p=[],s=[];m.teams.forEach((h,k)=>{const j=t.filter(q=>q.teamId===h.id).sort((q,C)=>q.effectiveRank-C.effectiveRank);if(j.length<2)return;const L=`arrow-${h.id}`;s.push(`
      <marker id="${L}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${h.color}" fill-opacity="0.85" />
      </marker>
    `);for(let q=1;q<j.length;q++){const C=j[q-1],R=j[q],S=(n.get(C.item.id)??0)+.5,T=(n.get(R.item.id)??0)+.5,M=Math.min(i-.05,C.endWeek+.92),l=Math.min(i-.05,Math.max(.08,R.startWeek+.02)),v=l-M,b=(k%4-1.5)*.08,D=Math.max(.35,Math.abs(v)*.45)+Math.abs(b),P=M+(v>=0?D:-D*.35)+b,x=l-(v>=0?D:-D*.35)+b,E=Math.abs(S-T)<.02?`M ${M} ${S} H ${l}`:`M ${M} ${S} C ${P} ${S}, ${x} ${T}, ${l} ${T}`;p.push(`<path d="${E}" fill="none" stroke="${h.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${L})" />`)}});const c=[],g=[];for(const h of d){const k=e.find(R=>R.item.id===h.id);if(!k)continue;const j=k.slices.map(R=>{const S=t.filter(v=>v.teamId===R.teamId).sort((v,b)=>v.effectiveRank-b.effectiveRank),T=S.findIndex(v=>v.item.id===h.id);if(T<=0)return null;const M=S[T-1],l=z(R.teamId);return`#${M.item.manualRank} (${(l==null?void 0:l.name)??R.teamId})`}).filter(Boolean),L=[...new Set(j)],q=L.length?`<div class="meta gantt-dep-meta">после ${L.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',C=k.slices.map(R=>{const S=z(R.teamId),T=R.startWeek/i*100,M=Math.max(1,R.endWeek-R.startWeek+1)/i*100;return`<div class="gantt-bar ${R.teamId===k.bottleneckTeamId?"gantt-bot":""}" style="left:${T}%;width:${Math.max(M,2.5)}%;background:${(S==null?void 0:S.color)??"#64748b"}" title="${V((S==null?void 0:S.name)??"")}: ${$(R.endDate)}">${I((S==null?void 0:S.name)??"")}</div>`}).join("");c.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${h.manualRank??"—"}</span> ${I(h.title)}</div>
        <div class="meta">${h.type==="product"?"Продукт":"Проект"} · ETA ${$(k.endDate)}</div>
        ${q}
      </div>
    `),g.push(`<div class="gantt-track gantt-track-multi" style="background:${r}">${C}</div>`)}const y=Math.max(1,d.length),f=i<=12?1:i<=24?2:i<=36?3:4,w=Array.from({length:i},(h,k)=>{if(!(k%f===0||k===i-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${o}%"></div>`;const L=F(m.startDate,k),[,q,C]=L.split("-");return`<div class="gantt-axis-tick" style="width:${o}%">
      <span class="gantt-axis-w">Н${k+1}</span>
      <span class="gantt-axis-d">${C}.${q}</span>
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
            ${c.join("")}
          </div>
          <div class="gantt-tracks-wrap">
            <div class="gantt-axis">${w}</div>
            <div class="gantt-tracks-col">
              <svg class="gantt-dep-layer" viewBox="0 0 ${i} ${y}" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  ${s.join("")}
                </defs>
                ${p.join("")}
              </svg>
              ${g.join("")}
            </div>
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.</p>
    </div>
  `}const gt=["#2563eb","#7c3aed","#0d9488","#c2410c","#db2777","#059669","#d97706","#4f46e5","#0891b2","#be123c"];function yt(){const e=new Set(m.teams.map(t=>t.color));return gt.find(t=>!e.has(t))??gt[m.teams.length%gt.length]}function se(){return`
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
          value="${V(t.name)}"
          aria-label="Название команды"
        />
        <input type="range" min="1" max="8" step="0.5" value="${t.capacityPw}" data-cap="${t.id}" />
        <span class="mono capacity-label" data-cap-label="${t.id}">${t.capacityPw} чел·нед</span>
      </div>
    `).join("")||'<div class="empty">Нет команд — создайте первую</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar" hidden>
        <span class="team-dot" id="newTeamDot" style="background:${yt()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">Создать</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function ie(e){var s;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((s=m.teams[0])==null?void 0:s.id)??"",estimatePw:4,workStartDate:m.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:Y(m.items)},a=W(t),i=new Set(t.assignments.map(c=>c.teamId)),d=new Map(t.assignments.map(c=>[c.teamId,c.estimatePw])),n=new Map(t.assignments.map(c=>[c.teamId,c.workStartDate])),o=jt(t),r=o?Mt(o,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',p=m.teams.map(c=>{const g=i.has(c.id),y=d.get(c.id)??4,f=n.get(c.id)??m.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${c.id}" ${g?"checked":""} />
            <span class="team-dot" style="background:${c.color}"></span>
            <span class="team-assign-name">${I(c.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Оценка</span>
            <input type="number" class="f_team_est" data-team="${c.id}" min="0.5" step="0.5" value="${y}" ${g?"":"disabled"} />
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${c.id}" value="${f}" ${g?"":"disabled"} />
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
            <input id="f_title" value="${V(t.title)}" />
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
              <input id="f_backlog" value="${V(t.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${["idea","ready","in_progress","blocked","done"].map(c=>`<option value="${c}" ${t.status===c?"selected":""}>${ft(c)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${V(t.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: оценка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${p}</div>
            <div class="meta" style="margin-top:6px">Итого объём: <strong class="mono" id="liveTotalEst">${B(t)}</strong> чел·нед. Дата старта — не раньше этой; если очередь команды занята, старт сдвинется позже.</div>
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
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??Y(m.items)}" />
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
  `}function jt(e){const t=e.assignments.length?e.assignments:kt();if(!t.length)return null;const a=e.id||"__draft__",i={...e,id:a,assignments:t},d=m.items.some(o=>o.id===a)?m.items.map(o=>o.id===a?i:o):[...m.items,i],{rollups:n}=wt({...m,items:d});return n.find(o=>o.item.id===a)??null}function qt(e){const t=z(e.teamId),a=(t==null?void 0:t.capacityPw)||1,i=Math.round(e.estimatePw/a*100)/100,d=O(e.workStartDate||m.startDate),n=it(d,i*7);return{start:d,end:n,weeks:i}}function Mt(e,t){const a=new Map(t.map(n=>[n.teamId,n])),i=e.slices.map(n=>{const o=z(n.teamId),r=a.get(n.teamId),p=r?O(r.workStartDate):n.plannedStartDate,s=r?qt(r):null,c=n.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",g=n.startDate>p?` <span class="meta">(план ${$(p)}, очередь сдвинула на ${$(n.startDate)})</span>`:n.startDate<p?` <span class="meta">(ждём план ${$(p)})</span>`:"",y=s?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(s.start)} → <span class="mono">${$(s.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${I((o==null?void 0:o.name)??n.teamId)}</strong>: <span class="mono">${$(n.startDate)} → ${$(n.endDate)}</span> <span class="meta">(${n.estimatePw} чел·нед ≈ ${n.durationWeeks} нед.)</span>${g}${c}${y}</div>`}).join(""),d=t.map(n=>qt(n).end).reduce((n,o)=>n>o?n:o,"0000-00-00");return i+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(d)}</strong> — меняется сразу при смене даты</div>`}function I(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function V(e){return I(e).replaceAll("'","&#39;")}function J(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),(e=document.querySelector("#prioPop"))==null||e.remove()}function oe(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-prio-no>Нет</button>
      <button type="button" class="btn btn-primary" data-prio-yes>Да</button>
    </div>
  `}function bt(e,t,a,i){var g,y;J(),e.classList.add("prio-ask");const d=document.createElement("div");d.id="prioPop",d.className="prio-confirm prio-confirm-float",d.setAttribute("data-stop-edit",""),d.innerHTML=oe(t),document.body.appendChild(d);const n=()=>{const f=e.getBoundingClientRect(),w=d.getBoundingClientRect();let h=f.right+8,k=f.top+f.height/2-w.height/2;h+w.width>window.innerWidth-8&&(h=Math.max(8,f.left-w.width-8)),k=Math.max(8,Math.min(k,window.innerHeight-w.height-8)),d.style.left=`${h}px`,d.style.top=`${k}px`};n();const o=()=>n();window.addEventListener("scroll",o,!0),window.addEventListener("resize",o);const r=()=>{window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",o),document.removeEventListener("mousedown",c,!0)},p=()=>{r(),J(),i()},s=()=>{r(),J(),a()},c=f=>{const w=f.target;d.contains(w)||e.contains(w)||p()};document.addEventListener("mousedown",c,!0),(g=d.querySelector("[data-prio-yes]"))==null||g.addEventListener("click",f=>{f.stopPropagation(),s()}),(y=d.querySelector("[data-prio-no]"))==null||y.addEventListener("click",f=>{f.stopPropagation(),p()})}function re(){if(u.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,a=null;const i=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(n=>n.classList.remove("is-dragging","drag-over"))},d=(n,o)=>{if(n===o)return;const r=Array.from(e.querySelectorAll("tr[data-row-id]")).map(y=>y.dataset.rowId),p=r.indexOf(n),s=r.indexOf(o);if(p<0||s<0)return;const c=[...r];c.splice(p,1),c.splice(s,0,n);const g=u.sortDir==="asc"?c:[...c].reverse();m.items=Ft(m.items,g),u.sortKey="priority",N()};e.querySelectorAll("[data-drag-handle]").forEach(n=>{const o=n.closest("tr[data-row-id]");if(!o)return;n.addEventListener("pointerdown",p=>{p.button===0&&(p.preventDefault(),p.stopPropagation(),t=o.dataset.rowId??null,a=p.pointerId,n.setPointerCapture(p.pointerId),i(),o.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),n.addEventListener("pointermove",p=>{if(t==null||p.pointerId!==a)return;const s=document.elementFromPoint(p.clientX,p.clientY),c=s==null?void 0:s.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(g=>g.classList.remove("drag-over")),c&&c.dataset.rowId!==t&&c.classList.add("drag-over")});const r=p=>{if(t==null||p.pointerId!==a)return;const s=t,c=document.elementFromPoint(p.clientX,p.clientY),g=c==null?void 0:c.closest("tr[data-row-id]"),y=g==null?void 0:g.dataset.rowId;try{n.releasePointerCapture(p.pointerId)}catch{}i(),document.body.classList.remove("prio-dragging"),t=null,a=null,y&&d(s,y)};n.addEventListener("pointerup",r),n.addEventListener("pointercancel",r)})}function _(){J(),K();const{slices:e,rollups:t}=wt(m),a=document.querySelector("#app");if(!a)return;const i=u.editingId!=null?m.items.find(d=>d.id===u.editingId)??null:null;a.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${It()}">${Et(It())}</span>
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
      <div class="print-only print-doc-header">
        <h1>VI Planer — ${Lt[u.tab]}</h1>
        <p>Старт портфеля: ${m.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${Xt(t,e)}
      <div class="tabs no-print">
        <button class="tab ${u.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${u.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${u.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${u.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${u.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${u.tab==="portfolio"?te(t):u.tab==="teams"?ee(e):u.tab==="queuesTest"?ae(e):u.tab==="timeline"?ne(t,e):se()}
      </div>
    </div>
    ${u.creating||i?ie(i):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,ce()}function kt(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const a of e){if(!a.checked)continue;const i=a.dataset.team,d=document.querySelector(`.f_team_est[data-team="${i}"]`),n=document.querySelector(`.f_team_start[data-team="${i}"]`),o=Math.max(.5,Number(d==null?void 0:d.value)||1),r=O((n==null?void 0:n.value)||m.startDate);t.push({teamId:i,estimatePw:o,workStartDate:r})}return t}function _t(){var o,r,p,s,c,g,y;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),a=kt();if(e&&(e.textContent=String(a.reduce((f,w)=>f+w.estimatePw,0)||0)),!t)return;if(!a.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const i=(u.editingId?m.items.find(f=>f.id===u.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:a,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},d={...i,id:u.editingId||"__draft__",assignments:a,title:((o=document.querySelector("#f_title"))==null?void 0:o.value.trim())||i.title,type:((r=document.querySelector("#f_type"))==null?void 0:r.value)||i.type,status:((p=document.querySelector("#f_status"))==null?void 0:p.value)||i.status,businessValue:Number((s=document.querySelector("#f_bv"))==null?void 0:s.value)||i.businessValue,timeCriticality:Number((c=document.querySelector("#f_tc"))==null?void 0:c.value)||i.timeCriticality,riskReduction:Number((g=document.querySelector("#f_rr"))==null?void 0:g.value)||i.riskReduction,jobSize:Number((y=document.querySelector("#f_js"))==null?void 0:y.value)||i.jobSize,manualRank:(()=>{var h;const f=(h=document.querySelector("#f_rank"))==null?void 0:h.value,w=Math.round(Number(f));return Number.isFinite(w)&&w>=1?w:i.manualRank??Y(m.items)})()},n=jt(d);if(!n){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=Mt(n,a)}function Tt(){const e=(n,o)=>{const r=document.querySelector(`#${n}`),p=Number(r==null?void 0:r.value);return Number.isFinite(p)?p:o},t=n=>{var o;return((o=document.querySelector(`#${n}`))==null?void 0:o.value)??""},a=kt();if(!a.length)return alert("Выберите хотя бы одну команду"),null;const i=t("f_rank").trim(),d=Math.max(1,Math.round(Number(i)||Y(m.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:a,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:nt(e("f_bv",5),1,10),timeCriticality:nt(e("f_tc",5),1,10),riskReduction:nt(e("f_rr",5),1,10),jobSize:nt(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:d}}function nt(e,t,a){return Math.min(a,Math.max(t,e))}function N(){vt(m),_()}function ce(){var s,c,g,y,f,w,h,k,j,L,q,C,R,S,T,M;document.querySelectorAll("[data-tab]").forEach(l=>{l.addEventListener("click",()=>{u.tab=l.dataset.tab,_()})});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{u.query=e.value}),e==null||e.addEventListener("change",()=>_());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{u.typeFilter=t.value,_()});const a=document.querySelector("#teamFilter");a==null||a.addEventListener("change",()=>{u.teamFilter=a.value,_()});const i=document.querySelector("#statusFilter");i==null||i.addEventListener("change",()=>{u.statusFilter=i.value,_()}),(s=document.querySelector("#addItem"))==null||s.addEventListener("click",()=>{u.creating=!0,u.editingId=null,_()}),(c=document.querySelector("#resetFilters"))==null||c.addEventListener("click",()=>{u.typeFilter="all",u.teamFilter="all",u.statusFilter="all",u.query="",u.sortKey="priority",u.sortDir="asc",_()}),document.querySelectorAll("[data-edit]").forEach(l=>{l.addEventListener("click",v=>{v.target.closest("[data-stop-edit], .prio-input, .prio-edit, #prioPop, .drag-handle")||(u.editingId=l.dataset.edit??null,u.creating=!1,_())})}),re(),document.querySelectorAll(".prio-input").forEach(l=>{const v=l.dataset.prioId,b=()=>{const P=m.items.find(x=>x.id===v);l.value=String((P==null?void 0:P.manualRank)??1)},D=()=>{const P=m.items.find(pe=>pe.id===v);if(!P)return;const x=Number(l.value);if(!Number.isFinite(x)||x<1){b();return}const E=Math.round(x);if(l.value=String(E),E===P.manualRank)return;const st=X(m.items,E,v),me=st?`Сменить на <span class="accent">${E}</span>?<br/>«${I(st.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${E}</span>?`;bt(l,me,()=>{m.items=ot(m.items,v,E),N()},b)};l.addEventListener("click",P=>P.stopPropagation()),l.addEventListener("mousedown",P=>P.stopPropagation()),l.addEventListener("keydown",P=>{P.key==="Enter"&&(P.preventDefault(),D()),P.key==="Escape"&&(J(),b(),l.blur())}),l.addEventListener("change",D)}),document.querySelectorAll("[data-sort]").forEach(l=>{l.addEventListener("click",v=>{v.stopPropagation();const b=l.dataset.sort;(b==="wsjf"||b==="estimate"||b==="eta"||b==="priority")&&Qt(b)})});const d=()=>{u.creating=!1,u.editingId=null,_()};(g=document.querySelector("#closeModal"))==null||g.addEventListener("click",d),(y=document.querySelector("#closeModal2"))==null||y.addEventListener("click",d),(f=document.querySelector("#modal"))==null||f.addEventListener("click",l=>{l.target.id==="modal"&&d()}),document.querySelectorAll(".f_team_check").forEach(l=>{l.addEventListener("change",()=>{const v=l.dataset.team,b=document.querySelector(`.f_team_est[data-team="${v}"]`),D=document.querySelector(`.f_team_start[data-team="${v}"]`);b&&(b.disabled=!l.checked),D&&(D.disabled=!l.checked),_t()})});const n=document.querySelector("#teamAssignList"),o=l=>{const v=l.target;v&&(v.classList.contains("f_team_est")||v.classList.contains("f_team_start")||v.classList.contains("f_team_check"))&&_t()};n==null||n.addEventListener("input",o),n==null||n.addEventListener("change",o),n==null||n.addEventListener("keyup",o),(w=document.querySelector("#saveItem"))==null||w.addEventListener("click",()=>{const l=Tt();if(!l)return;const v=l.manualRank??Y(m.items),b=document.querySelector("#f_rank"),D=()=>{if(X(m.items,v,null)){const E=Z("item");m.items=[...m.items,{...l,id:E,manualRank:m.items.length+1}],m.items=ot(m.items,E,v)}else m.items.push({...l,id:Z("item"),manualRank:v}),m.items=H(m.items);u.creating=!1,u.editingId=null,N()},P=()=>{if(!u.editingId)return;const x=m.items.findIndex(st=>st.id===u.editingId);if(x<0)return;const E=m.items[x];v!==E.manualRank?(m.items[x]={...E,...l,manualRank:E.manualRank},m.items=ot(m.items,u.editingId,v)):m.items[x]={...E,...l},u.creating=!1,u.editingId=null,N()};if(u.creating){const x=X(m.items,v,null);if(x&&b){bt(b,`Занять <span class="accent">${v}</span>?<br/>«${I(x.title)}» сдвинется вверх.`,D,()=>{});return}D();return}if(u.editingId){const x=m.items.find(E=>E.id===u.editingId);if(x&&v!==x.manualRank&&b){const E=X(m.items,v,u.editingId);bt(b,E?`Сменить на <span class="accent">${v}</span>?<br/>«${I(E.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${v}</span>?`,P,()=>{});return}P()}}),(h=document.querySelector("#deleteItem"))==null||h.addEventListener("click",()=>{u.editingId&&(m.items=m.items.filter(l=>l.id!==u.editingId),u.editingId=null,N())}),["f_bv","f_tc","f_rr","f_js"].forEach(l=>{var v;(v=document.querySelector(`#${l}`))==null||v.addEventListener("input",()=>{const b=document.querySelector("#liveWsjf");if(!b)return;const D=Tt();D&&(b.textContent=String(W({...D})))})}),document.querySelectorAll("[data-cap]").forEach(l=>{l.addEventListener("input",()=>{const v=l.dataset.cap,b=m.teams.find(P=>P.id===v);if(!b)return;b.capacityPw=Number(l.value),vt(m);const D=document.querySelector(`[data-cap-label="${v}"]`);D&&(D.textContent=`${b.capacityPw} чел·нед`)}),l.addEventListener("change",()=>_())});const r=document.querySelector("#ganttWeeks");r==null||r.addEventListener("input",()=>{const l=Math.max(4,Math.min(52,Number(r.value)||16));u.ganttWeeks=l;const v=document.querySelector("#ganttWeeksLabel");v&&(v.textContent=`${l} нед.`)}),r==null||r.addEventListener("change",()=>{u.ganttWeeks=Math.max(4,Math.min(52,Number(r.value)||16)),_()}),document.querySelectorAll("[data-team-name]").forEach(l=>{const v=()=>{const b=l.dataset.teamName,D=m.teams.find(x=>x.id===b);if(!D)return;const P=l.value.trim()||D.name;l.value=P,P!==D.name&&(D.name=P,N())};l.addEventListener("change",v),l.addEventListener("keydown",b=>{b.key==="Enter"&&(b.preventDefault(),l.blur())})}),(k=document.querySelector("#addTeam"))==null||k.addEventListener("click",()=>{const l=document.querySelector("#teamAddBar"),v=document.querySelector("#newTeamName"),b=document.querySelector("#newTeamDot");l&&(l.hidden=!1),b&&(b.style.background=yt()),v==null||v.focus()}),(j=document.querySelector("#cancelNewTeam"))==null||j.addEventListener("click",()=>{const l=document.querySelector("#teamAddBar"),v=document.querySelector("#newTeamName");l&&(l.hidden=!0),v&&(v.value="")});const p=()=>{const l=document.querySelector("#newTeamName"),v=(l==null?void 0:l.value.trim())||"";if(!v){l==null||l.focus();return}m.teams.push({id:Z("team"),name:v,capacityPw:3,color:yt()}),N()};(L=document.querySelector("#saveNewTeam"))==null||L.addEventListener("click",p),(q=document.querySelector("#newTeamName"))==null||q.addEventListener("keydown",l=>{l.key==="Enter"&&(l.preventDefault(),p())}),(C=document.querySelector("#exportPdfBtn"))==null||C.addEventListener("click",()=>{de()}),(R=document.querySelector("#exportBtn"))==null||R.addEventListener("click",()=>{const l=new Blob([JSON.stringify(m,null,2)],{type:"application/json"}),v=URL.createObjectURL(l),b=document.createElement("a");b.href=v,b.download=`vi-planer-${m.startDate}.json`,b.click(),URL.revokeObjectURL(v)}),(S=document.querySelector("#importBtn"))==null||S.addEventListener("click",()=>{var l;(l=document.querySelector("#fileInput"))==null||l.click()}),(T=document.querySelector("#fileInput"))==null||T.addEventListener("change",async l=>{var b;const v=(b=l.target.files)==null?void 0:b[0];if(v)try{const D=await v.text(),P=rt(JSON.parse(D));if(!P){alert("Неверный формат файла");return}m=P,N()}catch{alert("Не удалось прочитать JSON")}}),(M=document.querySelector("#resetBtn"))==null||M.addEventListener("click",l=>{l.stopPropagation(),le(l.currentTarget)})}function K(){var e,t;(e=document.querySelector("#resetPop"))==null||e.remove(),(t=document.querySelector("#resetBtn"))==null||t.classList.remove("reset-ask")}function le(e){var r,p;K(),J(),e.classList.add("reset-ask");const t=document.createElement("div");t.id="resetPop",t.className="reset-confirm",t.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(t);const a=()=>{const s=e.getBoundingClientRect(),c=t.offsetWidth,g=t.offsetHeight;let y=s.right-c,f=s.bottom+6;y<8&&(y=8),y+c>window.innerWidth-8&&(y=window.innerWidth-c-8),f+g>window.innerHeight-8&&(f=s.top-g-6),t.style.left=`${Math.max(8,y)}px`,t.style.top=`${Math.max(8,f)}px`};a();const i=()=>a();window.addEventListener("scroll",i,!0),window.addEventListener("resize",i);const d=()=>{window.removeEventListener("scroll",i,!0),window.removeEventListener("resize",i),window.removeEventListener("keydown",n),document.removeEventListener("mousedown",o)},n=s=>{s.key==="Escape"&&(d(),K())},o=s=>{const c=s.target;t.contains(c)||e.contains(c)||(d(),K())};(r=t.querySelector("#resetCancelBtn"))==null||r.addEventListener("click",()=>{d(),K()}),(p=t.querySelector("#resetConfirmBtn"))==null||p.addEventListener("click",()=>{d(),K(),m=structuredClone(ut),N()}),window.addEventListener("keydown",n),window.setTimeout(()=>document.addEventListener("mousedown",o),0)}function de(){const e=document.title,t=new Date().toISOString().slice(0,10);document.title=`VI-Planer-${Lt[u.tab]}-${t}`,document.body.classList.add("printing-tab");let a=document.querySelector("#printColorForce");a||(a=document.createElement("style"),a.id="printColorForce",document.head.appendChild(a)),a.textContent=`
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  `;const i=()=>{document.body.classList.remove("printing-tab"),document.title=e,a==null||a.remove(),window.removeEventListener("afterprint",i)};window.addEventListener("afterprint",i),window.setTimeout(()=>window.print(),50)}async function ue(){m=await Kt();const e=m.items.map(a=>a.manualRank).join(",");m={...m,items:H(m.items)};const t=m.items.map(a=>a.manualRank).join(",");e!==t&&vt(m),Nt(a=>{const i=document.querySelector("#syncStatus");i&&(i.dataset.status=a,i.textContent=Et(a))}),_()}ue()})();
