(function(){"use strict";function B(e){const t=e.businessValue+e.timeCriticality+e.riskReduction;return Math.round(t/Math.max(e.jobSize,.5)*100)/100}function z(e){return e.assignments.reduce((t,a)=>t+a.estimatePw,0)}function Wt(e,t){return e.assignments.some(a=>a.teamId===t)}function rt(e,t){const a=new Date(e+"T12:00:00");return a.setDate(a.getDate()+t),a.toISOString().slice(0,10)}function N(e,t){return rt(e,t*7)}function Ft(e){return e.reduce((t,a)=>a.endDate!==t.endDate?a.endDate>t.endDate?a:t:a.estimatePw!==t.estimatePw?a.estimatePw>t.estimatePw?a:t:a.durationWeeks>t.durationWeeks?a:t)}function $(e){const[t,a,i]=e.split("-");return`${i}.${a}.${t}`}function Z(e=new Date){const t=new Date(e),a=t.getDay(),i=a===0?-6:1-a;return t.setDate(t.getDate()+i),t.toISOString().slice(0,10)}function H(e){return!e||!/^\d{4}-\d{2}-\d{2}/.test(e)?Z():Z(new Date(e.slice(0,10)+"T12:00:00"))}function Bt(e,t){const a=new Date(H(e)+"T12:00:00").getTime(),i=new Date(H(t)+"T12:00:00").getTime();return Math.max(0,Math.round((i-a)/(168*3600*1e3)))}function Y(e){return[...e].sort((t,a)=>{const i=t.manualRank,u=a.manualRank;if(i!=null&&u!=null&&i!==u)return i-u;if(i!=null&&u==null)return-1;if(i==null&&u!=null)return 1;const n=B(a)-B(t);return n!==0?n:z(t)-z(a)})}function tt(e,t,a){return e.find(i=>i.id!==a&&i.manualRank!=null&&i.manualRank===t)}function lt(e,t,a){const i=Y(e),u=i.findIndex(s=>s.id===t);if(u<0)return e;const n=[...i],[o]=n.splice(u,1),r=Math.max(0,Math.min(n.length,Math.round(a)-1));n.splice(r,0,o);const p=new Map(n.map((s,l)=>[s.id,l+1]));return e.map(s=>{const l=p.get(s.id);return l==null||s.manualRank===l?s:{...s,manualRank:l}})}function Nt(e,t){if(t.length<2)return e;const a=Y(e),i=new Set(t),u=new Map(e.map(s=>[s.id,s])),n=t.map(s=>u.get(s)).filter(s=>!!s);let o=0;const r=[];for(const s of a)if(i.has(s.id)){const l=n[o++];l&&r.push(l)}else r.push(s);for(;o<n.length;)r.push(n[o++]);const p=new Map(r.map((s,l)=>[s.id,l+1]));return e.map(s=>{const l=p.get(s.id);return l==null||s.manualRank===l?s:{...s,manualRank:l}})}function G(e){let t=0;for(const a of e)a.manualRank!=null&&a.manualRank>t&&(t=a.manualRank);return t+1}function K(e){const t=[...e].sort((o,r)=>{const p=B(r)-B(o);return p!==0?p:z(o)-z(r)}),a=new Set,i=new Map;for(const o of t){const r=o.manualRank;r!=null&&Number.isFinite(r)&&r>=1&&!a.has(r)&&(a.add(r),i.set(o.id,r))}let u=1;const n=()=>{for(;a.has(u);)u+=1;const o=u;return a.add(o),u+=1,o};return e.map(o=>{const r=i.get(o.id)??n();return o.manualRank===r?o:{...o,manualRank:r}})}function $t(e){const t=e.items.filter(s=>s.status!=="done"),a=Y(t),i=new Map;for(const s of e.teams)i.set(s.id,[]);for(const s of a)for(const l of s.assignments){const v=i.get(l.teamId)??[];v.push({item:s,estimatePw:l.estimatePw,workStartDate:H(l.workStartDate||e.startDate)}),i.set(l.teamId,v)}const u=[],n={},o=52;for(const s of e.teams){const l=i.get(s.id)??[],v=Array.from({length:o},(g,w)=>({week:w,weekStart:N(e.startDate,w),usedPw:0,capacityPw:s.capacityPw,items:[]}));let y=0;l.forEach((g,w)=>{const h=Bt(e.startDate,g.workStartDate);let k=Math.max(y,h);for(;k<o&&v[k].usedPw>=s.capacityPw-.001;)k+=1;let q=g.estimatePw,x=k,M=N(e.startDate,k);const W=N(e.startDate,k);for(;q>.001&&x<o;){const S=v[x],T=Math.max(0,S.capacityPw-S.usedPw);if(T<=.001){x+=1;continue}const _=Math.min(T,q),C=N(e.startDate,x),A=_/S.capacityPw*7,O=S.usedPw/S.capacityPw*7;M=rt(C,O+A),S.usedPw+=_,S.items.push(g.item.id),q-=_,q>.001&&(x+=1)}const R=s.capacityPw>0?Math.round(g.estimatePw/s.capacityPw*100)/100:g.estimatePw;u.push({item:g.item,teamId:s.id,estimatePw:g.estimatePw,wsjf:B(g.item),effectiveRank:w+1,plannedStartDate:g.workStartDate,startWeek:k,endWeek:x,startDate:W,endDate:M,waitWeeks:k,delayedByQueue:k>h,durationWeeks:R}),y=x,v[y]&&v[y].usedPw>=s.capacityPw-.001?y=x+1:y=x}),n[s.id]=v}const r=new Map;for(const s of u){const l=r.get(s.item.id)??[];l.push(s),r.set(s.item.id,l)}const p=[];for(const s of a){const l=r.get(s.id)??[];if(!l.length)continue;const v=Ft(l),y=l.reduce((g,w)=>w.startWeek<g.startWeek?w:g);p.push({item:s,slices:[...l].sort((g,w)=>g.endDate===w.endDate?w.estimatePw-g.estimatePw:g.endDate<w.endDate?1:-1),wsjf:B(s),totalEstimatePw:z(s),startWeek:y.startWeek,endWeek:v.endWeek,startDate:y.startDate,endDate:v.endDate,waitWeeks:y.waitWeeks,bottleneckTeamId:v.teamId})}return u.sort((s,l)=>s.startWeek!==l.startWeek?s.startWeek-l.startWeek:l.wsjf-s.wsjf),{slices:u,rollups:p,load:n}}function et(e){return`${e}_${Math.random().toString(36).slice(2,9)}`}function ct(e){if(!e||typeof e!="object")return null;const t=e;if(!Array.isArray(t.teams)||!Array.isArray(t.items))return null;const a=H(String(t.startDate??Z())),i=t.items.map(u=>{const n=u;let o=[];return Array.isArray(n.assignments)&&n.assignments.length?o=n.assignments.filter(r=>r&&typeof r.teamId=="string").map(r=>({teamId:r.teamId,estimatePw:Math.max(.5,Number(r.estimatePw)||1),workStartDate:H(String(r.workStartDate||n.workStartDate||a))})):typeof n.teamId=="string"&&(o=[{teamId:n.teamId,estimatePw:Math.max(.5,Number(n.estimatePw)||1),workStartDate:a}]),!o.length&&Array.isArray(t.teams)&&t.teams[0]&&(o=[{teamId:t.teams[0].id,estimatePw:4,workStartDate:a}]),{id:String(n.id??et("item")),title:String(n.title??"Без названия"),type:n.type==="project"?"project":"product",backlog:String(n.backlog??"Backlog"),assignments:o,status:["idea","ready","in_progress","blocked","done"].includes(String(n.status))?n.status:"idea",owner:String(n.owner??"—"),businessValue:Number(n.businessValue)||5,timeCriticality:Number(n.timeCriticality)||5,riskReduction:Number(n.riskReduction)||5,jobSize:Number(n.jobSize)||5,notes:n.notes!=null?String(n.notes):void 0,manualRank:n.manualRank==null||n.manualRank===""?null:Number(n.manualRank)}});return{version:3,startDate:a,teams:t.teams,items:K(i)}}const F=Z(),dt=N(F,1),at=N(F,2),St=N(F,3),ut=N(F,4),mt=N(F,6),Pt=N(F,8),Dt={version:3,startDate:F,teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#2563eb"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#7c3aed"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#0d9488"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#c2410c"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:8,workStartDate:F}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",estimatePw:3,workStartDate:dt}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:3,workStartDate:ut}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",estimatePw:2,workStartDate:F}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",estimatePw:4,workStartDate:mt}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",estimatePw:10,workStartDate:F},{teamId:"data",estimatePw:4,workStartDate:St}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",estimatePw:6,workStartDate:dt},{teamId:"crm",estimatePw:3,workStartDate:ut}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",estimatePw:5,workStartDate:at},{teamId:"platform",estimatePw:3,workStartDate:at}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",estimatePw:7,workStartDate:dt},{teamId:"platform",estimatePw:2,workStartDate:F}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",estimatePw:7,workStartDate:F},{teamId:"platform",estimatePw:4,workStartDate:at},{teamId:"mobile",estimatePw:3,workStartDate:mt}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",estimatePw:8,workStartDate:St},{teamId:"data",estimatePw:3,workStartDate:ut},{teamId:"mobile",estimatePw:2,workStartDate:Pt}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",estimatePw:9,workStartDate:at},{teamId:"platform",estimatePw:3,workStartDate:mt},{teamId:"mobile",estimatePw:2,workStartDate:Pt}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},pt={...Dt,items:K(Dt.items)},It="vi-planer-v3";let xt="idle",nt=[];function Ot(){return null}function Rt(){return xt}function zt(e){return nt.push(e),()=>{nt=nt.filter(t=>t!==e)}}function Q(e){xt=e,nt.forEach(t=>t(e))}function Vt(){try{const e=localStorage.getItem(It)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!e)return null;const t=ct(JSON.parse(e));return t?{...t,items:K(t.items)}:null}catch{return null}}function Et(e){localStorage.setItem(It,JSON.stringify(e))}async function Ht(){try{const e=await fetch("/api/state",{cache:"no-store"});if(!e.ok)return null;const t=await e.json(),a=ct(t.state);return a?{...a,items:K(a.items)}:null}catch{return null}}async function Jt(e){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).ok}catch{return!1}}async function Kt(){return null}async function Ut(e){return!1}async function Yt(){Q("loading");const e=await Ht()??await Kt()??Vt()??structuredClone(pt);return Et(e),Q((Ot(),"saved")),e}let ft=null,vt=null;function gt(e){Et(e),vt=e,ft&&clearTimeout(ft),ft=setTimeout(async()=>{const t=vt;if(vt=null,!t)return;Q("loading");const a=await Ut(),i=a?!0:await Jt(t);if(a||i){Q("saved");return}Q("offline")},350)}function Lt(e){switch(e){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}const jt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды"},c={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16,confirmReset:!1};let m=structuredClone(pt);function J(e){return m.teams.find(t=>t.id===e)}function yt(e){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[e]}function qt(e){return new Map(e.map(t=>[t.item.id,t]))}function Gt(e){return e.assignments.map(t=>{const a=J(t.teamId);return(a==null?void 0:a.name)??t.teamId}).join(", ")}function Qt(e){return`<div class="teams-stack">${e.assignments.map(a=>{const i=J(a.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(i==null?void 0:i.color)??"#94a3b8"}"></span>${I((i==null?void 0:i.name)??a.teamId)} <span class="mono muted-inline">${a.estimatePw}чн · старт ${$(a.workStartDate)}</span></span>`}).join("")}</div>`}function Xt(e){const t=c.query.trim().toLowerCase(),a=qt(e),i=m.items.filter(n=>c.typeFilter!=="all"&&n.type!==c.typeFilter||c.teamFilter!=="all"&&!Wt(n,c.teamFilter)||c.statusFilter!=="all"&&n.status!==c.statusFilter?!1:t?n.title.toLowerCase().includes(t)||n.backlog.toLowerCase().includes(t)||n.owner.toLowerCase().includes(t)||Gt(n).toLowerCase().includes(t):!0);if(c.sortKey==="priority"){const n=Y(i);return c.sortDir==="asc"?n:[...n].reverse()}const u=c.sortDir==="asc"?1:-1;return[...i].sort((n,o)=>{var p,s;let r=0;if(c.sortKey==="wsjf")r=B(n)-B(o);else if(c.sortKey==="estimate")r=z(n)-z(o);else{const l=((p=a.get(n.id))==null?void 0:p.endDate)??"9999-99-99",v=((s=a.get(o.id))==null?void 0:s.endDate)??"9999-99-99";r=l<v?-1:l>v?1:0}return r!==0?r*u:n.title.localeCompare(o.title,"ru")})}function st(e,t){const a=c.sortKey===t,i=a?c.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${a?"sorted":""}" data-sort="${t}" title="Сортировать">${e}${i}</th>`}function Zt(e){c.sortKey===e?c.sortDir=c.sortDir==="asc"?"desc":"asc":(c.sortKey=e,c.sortDir=e==="wsjf"?"desc":"asc"),j()}function te(e,t){const a=m.items.filter(s=>s.status!=="done"),i=a.filter(s=>s.type==="product").length,u=a.filter(s=>s.type==="project").length,n=a.filter(s=>s.assignments.length>1).length,o=e.map(s=>s.endWeek),r=o.length?Math.max(...o)+1:0,p=m.teams.filter(s=>t.filter(v=>v.teamId===s.id).reduce((v,y)=>v+y.estimatePw,0)>s.capacityPw*8).length;return`
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${a.length}</div>
        <div class="hint">${i} продуктов · ${u} проектов · ${n} кросс-командных</div>
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
  `}function ee(){return`
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
  `}function ae(e,t){const a=qt(e),i=Xt(e),u=c.sortKey==="priority",n=i.map(o=>{const r=a.get(o.id),p=B(o),s=z(o),l=o.manualRank??"—",v=r?`<div class="eta-teams">${r.slices.map(y=>{const g=J(y.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(g==null?void 0:g.color)??"#64748b"}">${I((g==null?void 0:g.name)??y.teamId)}</span>: ${$(y.startDate)}→${$(y.endDate)}</div>`}).join("")}</div>`:"";return`
        <tr class="clickable ${u?"row-draggable":""}" data-edit="${o.id}" data-row-id="${o.id}">
          <td class="prio-cell">
            <div class="prio-edit" data-stop-edit>
              ${u?'<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>':""}
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
          <td>${Qt(o)}</td>
          <td><span class="badge badge-status-${o.status}">${yt(o.status)}</span></td>
          <td class="mono wsjf">${p}</td>
          <td class="mono">
            ${s}
            ${o.assignments.length>1?`<div class="meta">${o.assignments.map(y=>y.estimatePw).join(" + ")}</div>`:""}
          </td>
          <td class="mono ${r&&r.waitWeeks>4?"eta-late":"eta-good"}">
            ${r?`<span class="eta-final">${$(r.endDate)}</span>`:"—"}
            ${v}
          </td>
        </tr>
      `}).join("");return`
    ${ee()}
    <div class="panel">
      <div class="panel-header">
        <h2>Единый портфель (проекты + продукты)</h2>
        <div class="filters">
          <input id="q" placeholder="Поиск…" value="${U(c.query)}" />
          <select id="typeFilter">
            <option value="all" ${c.typeFilter==="all"?"selected":""}>Все типы</option>
            <option value="product" ${c.typeFilter==="product"?"selected":""}>Продукты</option>
            <option value="project" ${c.typeFilter==="project"?"selected":""}>Проекты</option>
          </select>
          <select id="teamFilter">
            <option value="all">Все команды</option>
            ${m.teams.map(o=>`<option value="${o.id}" ${c.teamFilter===o.id?"selected":""}>${I(o.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${c.statusFilter===o?"selected":""}>${yt(o)}</option>`).join("")}
          </select>
          <button class="btn" id="resetFilters" title="Сбросить фильтры и сортировку">Сбросить фильтры</button>
          <button class="btn btn-primary" id="addItem">+ Инициатива</button>
        </div>
      </div>
      ${u?"":'<p class="sort-prio-hint">Сейчас сортировка не по приоритету — перестановка строк отключена, приоритеты не меняются. Верните сортировку по «Приоритет», чтобы двигать строки.</p>'}
      <div style="overflow-x:auto">
        <table class="portfolio-table">
          <thead>
            <tr>
              ${st("Приоритет","priority")}
              <th>Тип</th>
              <th>Инициатива / исходный бэклог</th>
              <th>Команды (оценка · старт)</th>
              <th>Статус</th>
              ${st("WSJF","wsjf")}
              ${st("Оценка, чел·нед","estimate")}
              ${st("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${n||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function ne(e){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${m.teams.map(a=>{const i=e.filter(r=>r.teamId===a.id).sort((r,p)=>r.effectiveRank-p.effectiveRank),u=i.reduce((r,p)=>r+p.estimatePw,0),n=a.capacityPw>0?u/a.capacityPw:0,o=Math.min(100,Math.round(i.filter(r=>r.startWeek<8).reduce((r,p)=>{const s=Math.min(p.endWeek+1,8)-p.startWeek;return r+Math.max(0,s)*(p.estimatePw/Math.max(1,p.endWeek-p.startWeek+1))},0)/(a.capacityPw*8)*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${I(a.name)}</h3>
              <div class="meta">Ёмкость ${a.capacityPw} чел·нед/нед · спрос ${u.toFixed(1)} · ~${n.toFixed(1)} нед. до очистки</div>
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
  `}function se(e){const t=m.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда у команды появляется ёмкость с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${m.teams.map(i=>{const u=e.filter(s=>s.teamId===i.id).sort((s,l)=>{const v=s.item.manualRank??9999,y=l.item.manualRank??9999;return v!==y?v-y:s.effectiveRank-l.effectiveRank}),n=u.reduce((s,l)=>s+l.estimatePw,0),o=i.capacityPw>0?n/i.capacityPw:0,r=u.length?u[u.length-1].endDate:t,p=u.map((s,l)=>{const v=s.item.manualRank??"—",y=l>0?u[l-1]:null;let g="может взять сразу (есть свободная ёмкость)",w="take-now";s.startDate>s.plannedStartDate?(g=y?`ждёт очередь: после #${y.item.manualRank??"?"} «${y.item.title}»`:"сдвиг из‑за загрузки очереди",w="take-queue"):s.startDate>t&&(g=`ждёт плановый старт ${$(s.plannedStartDate)}`,w="take-plan");const h=s.item.assignments.filter(k=>k.teamId!==i.id).map(k=>{var q;return((q=J(k.teamId))==null?void 0:q.name)??k.teamId});return`
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
  `}function ie(e,t){const a=Math.max(4,...e.map(h=>h.endWeek+2),4),i=Math.max(4,Math.min(52,Math.round(c.ganttWeeks)||16));c.ganttWeeks=i;const u=Y(m.items.filter(h=>h.status!=="done")),n=new Map(u.map((h,k)=>[h.id,k])),o=100/i,r=`repeating-linear-gradient(90deg, #f8fafc 0, #f8fafc calc(${o}% - 1px), #e2e8f0 calc(${o}% - 1px), #e2e8f0 ${o}%)`,p=[],s=[];m.teams.forEach((h,k)=>{const q=t.filter(M=>M.teamId===h.id).sort((M,W)=>M.effectiveRank-W.effectiveRank);if(q.length<2)return;const x=`arrow-${h.id}`;s.push(`
      <marker id="${x}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${h.color}" fill-opacity="0.85" />
      </marker>
    `);for(let M=1;M<q.length;M++){const W=q[M-1],R=q[M],S=(n.get(W.item.id)??0)+.5,T=(n.get(R.item.id)??0)+.5,_=Math.min(i-.05,W.endWeek+.92),C=Math.min(i-.05,Math.max(.08,R.startWeek+.02)),A=C-_,O=(k%4-1.5)*.08,d=Math.max(.35,Math.abs(A)*.45)+Math.abs(O),f=_+(A>=0?d:-d*.35)+O,b=C-(A>=0?d:-d*.35)+O,D=Math.abs(S-T)<.02?`M ${_} ${S} H ${C}`:`M ${_} ${S} C ${f} ${S}, ${b} ${T}, ${C} ${T}`;p.push(`<path d="${D}" fill="none" stroke="${h.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${x})" />`)}});const l=[],v=[];for(const h of u){const k=e.find(R=>R.item.id===h.id);if(!k)continue;const q=k.slices.map(R=>{const S=t.filter(A=>A.teamId===R.teamId).sort((A,O)=>A.effectiveRank-O.effectiveRank),T=S.findIndex(A=>A.item.id===h.id);if(T<=0)return null;const _=S[T-1],C=J(R.teamId);return`#${_.item.manualRank} (${(C==null?void 0:C.name)??R.teamId})`}).filter(Boolean),x=[...new Set(q)],M=x.length?`<div class="meta gantt-dep-meta">после ${x.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',W=k.slices.map(R=>{const S=J(R.teamId),T=R.startWeek/i*100,_=Math.max(1,R.endWeek-R.startWeek+1)/i*100;return`<div class="gantt-bar ${R.teamId===k.bottleneckTeamId?"gantt-bot":""}" style="left:${T}%;width:${Math.max(_,2.5)}%;background:${(S==null?void 0:S.color)??"#64748b"}" title="${U((S==null?void 0:S.name)??"")}: ${$(R.endDate)}">${I((S==null?void 0:S.name)??"")}</div>`}).join("");l.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${h.manualRank??"—"}</span> ${I(h.title)}</div>
        <div class="meta">${h.type==="product"?"Продукт":"Проект"} · ETA ${$(k.endDate)}</div>
        ${M}
      </div>
    `),v.push(`<div class="gantt-track gantt-track-multi" style="background:${r}">${W}</div>`)}const y=Math.max(1,u.length),g=i<=12?1:i<=24?2:i<=36?3:4,w=Array.from({length:i},(h,k)=>{if(!(k%g===0||k===i-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${o}%"></div>`;const x=N(m.startDate,k),[,M,W]=x.split("-");return`<div class="gantt-axis-tick" style="width:${o}%">
      <span class="gantt-axis-w">Н${k+1}</span>
      <span class="gantt-axis-d">${W}.${M}</span>
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
        ${u.length?`<div class="gantt-layout">
          <div class="gantt-labels-col">
            <div class="gantt-axis-spacer">
              <span class="meta">нед. с ${$(m.startDate)}</span>
            </div>
            ${l.join("")}
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
              ${v.join("")}
            </div>
          </div>
        </div>`:'<div class="empty">Нет активных инициатив</div>'}
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски.</p>
    </div>
  `}const bt=["#2563eb","#7c3aed","#0d9488","#c2410c","#db2777","#059669","#d97706","#4f46e5","#0891b2","#be123c"];function kt(){const e=new Set(m.teams.map(t=>t.color));return bt.find(t=>!e.has(t))??bt[m.teams.length%bt.length]}function oe(){return`
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
          value="${U(t.name)}"
          aria-label="Название команды"
        />
        <input type="range" min="1" max="8" step="0.5" value="${t.capacityPw}" data-cap="${t.id}" />
        <span class="mono capacity-label" data-cap-label="${t.id}">${t.capacityPw} чел·нед</span>
      </div>
    `).join("")||'<div class="empty">Нет команд — создайте первую</div>'}
      </div>
      <div class="team-add-bar" id="teamAddBar" hidden>
        <span class="team-dot" id="newTeamDot" style="background:${kt()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">Создать</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>
    </div>
  `}function re(e){var s;const t=e??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((s=m.teams[0])==null?void 0:s.id)??"",estimatePw:4,workStartDate:m.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:G(m.items)},a=B(t),i=new Set(t.assignments.map(l=>l.teamId)),u=new Map(t.assignments.map(l=>[l.teamId,l.estimatePw])),n=new Map(t.assignments.map(l=>[l.teamId,l.workStartDate])),o=Mt(t),r=o?Tt(o,t.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',p=m.teams.map(l=>{const v=i.has(l.id),y=u.get(l.id)??4,g=n.get(l.id)??m.startDate;return`
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
                ${["idea","ready","in_progress","blocked","done"].map(l=>`<option value="${l}" ${t.status===l?"selected":""}>${yt(l)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${U(t.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: оценка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${p}</div>
            <div class="meta" style="margin-top:6px">Итого объём: <strong class="mono" id="liveTotalEst">${z(t)}</strong> чел·нед. Дата старта — не раньше этой; если очередь команды занята, старт сдвинется позже.</div>
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
              <input id="f_rank" type="number" min="1" step="1" value="${t.manualRank??G(m.items)}" />
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
  `}function Mt(e){const t=e.assignments.length?e.assignments:ht();if(!t.length)return null;const a=e.id||"__draft__",i={...e,id:a,assignments:t},u=m.items.some(o=>o.id===a)?m.items.map(o=>o.id===a?i:o):[...m.items,i],{rollups:n}=$t({...m,items:u});return n.find(o=>o.item.id===a)??null}function _t(e){const t=J(e.teamId),a=(t==null?void 0:t.capacityPw)||1,i=Math.round(e.estimatePw/a*100)/100,u=H(e.workStartDate||m.startDate),n=rt(u,i*7);return{start:u,end:n,weeks:i}}function Tt(e,t){const a=new Map(t.map(n=>[n.teamId,n])),i=e.slices.map(n=>{const o=J(n.teamId),r=a.get(n.teamId),p=r?H(r.workStartDate):n.plannedStartDate,s=r?_t(r):null,l=n.teamId===e.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",v=n.startDate>p?` <span class="meta">(план ${$(p)}, очередь сдвинула на ${$(n.startDate)})</span>`:n.startDate<p?` <span class="meta">(ждём план ${$(p)})</span>`:"",y=s?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(s.start)} → <span class="mono">${$(s.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${I((o==null?void 0:o.name)??n.teamId)}</strong>: <span class="mono">${$(n.startDate)} → ${$(n.endDate)}</span> <span class="meta">(${n.estimatePw} чел·нед ≈ ${n.durationWeeks} нед.)</span>${v}${l}${y}</div>`}).join(""),u=t.map(n=>_t(n).end).reduce((n,o)=>n>o?n:o,"0000-00-00");return i+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(e.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(u)}</strong> — меняется сразу при смене даты</div>`}function I(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function U(e){return I(e).replaceAll("'","&#39;")}function X(){var e;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(t=>{t.classList.remove("prio-ask")}),(e=document.querySelector("#prioPop"))==null||e.remove()}function le(e){return`
    <div class="prio-confirm-text">${e}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-prio-no>Нет</button>
      <button type="button" class="btn btn-primary" data-prio-yes>Да</button>
    </div>
  `}function wt(e,t,a,i){var v,y;X(),e.classList.add("prio-ask");const u=document.createElement("div");u.id="prioPop",u.className="prio-confirm prio-confirm-float",u.setAttribute("data-stop-edit",""),u.innerHTML=le(t),document.body.appendChild(u);const n=()=>{const g=e.getBoundingClientRect(),w=u.getBoundingClientRect();let h=g.right+8,k=g.top+g.height/2-w.height/2;h+w.width>window.innerWidth-8&&(h=Math.max(8,g.left-w.width-8)),k=Math.max(8,Math.min(k,window.innerHeight-w.height-8)),u.style.left=`${h}px`,u.style.top=`${k}px`};n();const o=()=>n();window.addEventListener("scroll",o,!0),window.addEventListener("resize",o);const r=()=>{window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",o),document.removeEventListener("mousedown",l,!0)},p=()=>{r(),X(),i()},s=()=>{r(),X(),a()},l=g=>{const w=g.target;u.contains(w)||e.contains(w)||p()};document.addEventListener("mousedown",l,!0),(v=u.querySelector("[data-prio-yes]"))==null||v.addEventListener("click",g=>{g.stopPropagation(),s()}),(y=u.querySelector("[data-prio-no]"))==null||y.addEventListener("click",g=>{g.stopPropagation(),p()})}function ce(){if(c.sortKey!=="priority")return;const e=document.querySelector("#portfolioBody");if(!e)return;let t=null,a=null;const i=()=>{e.querySelectorAll(".is-dragging, .drag-over").forEach(n=>n.classList.remove("is-dragging","drag-over"))},u=(n,o)=>{if(n===o)return;const r=Array.from(e.querySelectorAll("tr[data-row-id]")).map(y=>y.dataset.rowId),p=r.indexOf(n),s=r.indexOf(o);if(p<0||s<0)return;const l=[...r];l.splice(p,1),l.splice(s,0,n);const v=c.sortDir==="asc"?l:[...l].reverse();m.items=Nt(m.items,v),c.sortKey="priority",V()};e.querySelectorAll("[data-drag-handle]").forEach(n=>{const o=n.closest("tr[data-row-id]");if(!o)return;n.addEventListener("pointerdown",p=>{p.button===0&&(p.preventDefault(),p.stopPropagation(),t=o.dataset.rowId??null,a=p.pointerId,n.setPointerCapture(p.pointerId),i(),o.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),n.addEventListener("pointermove",p=>{if(t==null||p.pointerId!==a)return;const s=document.elementFromPoint(p.clientX,p.clientY),l=s==null?void 0:s.closest("tr[data-row-id]");e.querySelectorAll(".drag-over").forEach(v=>v.classList.remove("drag-over")),l&&l.dataset.rowId!==t&&l.classList.add("drag-over")});const r=p=>{if(t==null||p.pointerId!==a)return;const s=t,l=document.elementFromPoint(p.clientX,p.clientY),v=l==null?void 0:l.closest("tr[data-row-id]"),y=v==null?void 0:v.dataset.rowId;try{n.releasePointerCapture(p.pointerId)}catch{}i(),document.body.classList.remove("prio-dragging"),t=null,a=null,y&&u(s,y)};n.addEventListener("pointerup",r),n.addEventListener("pointercancel",r)})}function j(){X();const{slices:e,rollups:t}=$t(m),a=document.querySelector("#app");if(!a)return;const i=c.editingId!=null?m.items.find(u=>u.id===c.editingId)??null:null;a.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${Rt()}">${Lt(Rt())}</span>
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
        <h1>VI Planer — ${jt[c.tab]}</h1>
        <p>Старт портфеля: ${m.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${te(t,e)}
      <div class="tabs no-print">
        <button class="tab ${c.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${c.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${c.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${c.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${c.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${c.tab==="portfolio"?ae(t):c.tab==="teams"?ne(e):c.tab==="queuesTest"?se(e):c.tab==="timeline"?ie(t,e):oe()}
      </div>
    </div>
    ${c.creating||i?re(i):""}
    ${c.confirmReset?de():""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,ue()}function de(){return`
    <div class="modal-backdrop" id="resetConfirmBackdrop">
      <div class="modal modal-confirm" role="dialog" aria-modal="true" aria-labelledby="resetConfirmTitle">
        <div class="modal-head">
          <h3 id="resetConfirmTitle">Сбросить к демо-данным?</h3>
        </div>
        <div class="modal-body">
          <p class="confirm-warn">
            Все текущие изменения портфеля будут удалены и заменены демо-данными.
            Это действие нельзя отменить.
          </p>
        </div>
        <div class="modal-foot">
          <button class="btn" type="button" id="resetCancelBtn">Отмена</button>
          <button class="btn btn-danger" type="button" id="resetConfirmBtn">Да, сбросить</button>
        </div>
      </div>
    </div>
  `}function ht(){const e=Array.from(document.querySelectorAll(".f_team_check")),t=[];for(const a of e){if(!a.checked)continue;const i=a.dataset.team,u=document.querySelector(`.f_team_est[data-team="${i}"]`),n=document.querySelector(`.f_team_start[data-team="${i}"]`),o=Math.max(.5,Number(u==null?void 0:u.value)||1),r=H((n==null?void 0:n.value)||m.startDate);t.push({teamId:i,estimatePw:o,workStartDate:r})}return t}function Ct(){var o,r,p,s,l,v,y;const e=document.querySelector("#liveTotalEst"),t=document.querySelector("#liveEta"),a=ht();if(e&&(e.textContent=String(a.reduce((g,w)=>g+w.estimatePw,0)||0)),!t)return;if(!a.length){t.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const i=(c.editingId?m.items.find(g=>g.id===c.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:a,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},u={...i,id:c.editingId||"__draft__",assignments:a,title:((o=document.querySelector("#f_title"))==null?void 0:o.value.trim())||i.title,type:((r=document.querySelector("#f_type"))==null?void 0:r.value)||i.type,status:((p=document.querySelector("#f_status"))==null?void 0:p.value)||i.status,businessValue:Number((s=document.querySelector("#f_bv"))==null?void 0:s.value)||i.businessValue,timeCriticality:Number((l=document.querySelector("#f_tc"))==null?void 0:l.value)||i.timeCriticality,riskReduction:Number((v=document.querySelector("#f_rr"))==null?void 0:v.value)||i.riskReduction,jobSize:Number((y=document.querySelector("#f_js"))==null?void 0:y.value)||i.jobSize,manualRank:(()=>{var h;const g=(h=document.querySelector("#f_rank"))==null?void 0:h.value,w=Math.round(Number(g));return Number.isFinite(w)&&w>=1?w:i.manualRank??G(m.items)})()},n=Mt(u);if(!n){t.innerHTML='<div class="meta">Нет расчёта</div>';return}t.innerHTML=Tt(n,a)}function At(){const e=(n,o)=>{const r=document.querySelector(`#${n}`),p=Number(r==null?void 0:r.value);return Number.isFinite(p)?p:o},t=n=>{var o;return((o=document.querySelector(`#${n}`))==null?void 0:o.value)??""},a=ht();if(!a.length)return alert("Выберите хотя бы одну команду"),null;const i=t("f_rank").trim(),u=Math.max(1,Math.round(Number(i)||G(m.items)));return{title:t("f_title").trim()||"Без названия",type:t("f_type"),backlog:t("f_backlog").trim()||"Backlog",assignments:a,status:t("f_status"),owner:t("f_owner").trim()||"—",businessValue:it(e("f_bv",5),1,10),timeCriticality:it(e("f_tc",5),1,10),riskReduction:it(e("f_rr",5),1,10),jobSize:it(e("f_js",5),1,10),notes:t("f_notes").trim(),manualRank:u}}function it(e,t,a){return Math.min(a,Math.max(t,e))}function V(){gt(m),j()}function ue(){var s,l,v,y,g,w,h,k,q,x,M,W,R,S,T,_,C,A,O;document.querySelectorAll("[data-tab]").forEach(d=>{d.addEventListener("click",()=>{c.tab=d.dataset.tab,j()})});const e=document.querySelector("#q");e==null||e.addEventListener("input",()=>{c.query=e.value}),e==null||e.addEventListener("change",()=>j());const t=document.querySelector("#typeFilter");t==null||t.addEventListener("change",()=>{c.typeFilter=t.value,j()});const a=document.querySelector("#teamFilter");a==null||a.addEventListener("change",()=>{c.teamFilter=a.value,j()});const i=document.querySelector("#statusFilter");i==null||i.addEventListener("change",()=>{c.statusFilter=i.value,j()}),(s=document.querySelector("#addItem"))==null||s.addEventListener("click",()=>{c.creating=!0,c.editingId=null,j()}),(l=document.querySelector("#resetFilters"))==null||l.addEventListener("click",()=>{c.typeFilter="all",c.teamFilter="all",c.statusFilter="all",c.query="",c.sortKey="priority",c.sortDir="asc",j()}),document.querySelectorAll("[data-edit]").forEach(d=>{d.addEventListener("click",f=>{f.target.closest("[data-stop-edit], .prio-input, .prio-edit, #prioPop, .drag-handle")||(c.editingId=d.dataset.edit??null,c.creating=!1,j())})}),ce(),document.querySelectorAll(".prio-input").forEach(d=>{const f=d.dataset.prioId,b=()=>{const P=m.items.find(E=>E.id===f);d.value=String((P==null?void 0:P.manualRank)??1)},D=()=>{const P=m.items.find(ve=>ve.id===f);if(!P)return;const E=Number(d.value);if(!Number.isFinite(E)||E<1){b();return}const L=Math.round(E);if(d.value=String(L),L===P.manualRank)return;const ot=tt(m.items,L,f),fe=ot?`Сменить на <span class="accent">${L}</span>?<br/>«${I(ot.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${L}</span>?`;wt(d,fe,()=>{m.items=lt(m.items,f,L),V()},b)};d.addEventListener("click",P=>P.stopPropagation()),d.addEventListener("mousedown",P=>P.stopPropagation()),d.addEventListener("keydown",P=>{P.key==="Enter"&&(P.preventDefault(),D()),P.key==="Escape"&&(X(),b(),d.blur())}),d.addEventListener("change",D)}),document.querySelectorAll("[data-sort]").forEach(d=>{d.addEventListener("click",f=>{f.stopPropagation();const b=d.dataset.sort;(b==="wsjf"||b==="estimate"||b==="eta"||b==="priority")&&Zt(b)})});const u=()=>{c.creating=!1,c.editingId=null,j()};(v=document.querySelector("#closeModal"))==null||v.addEventListener("click",u),(y=document.querySelector("#closeModal2"))==null||y.addEventListener("click",u),(g=document.querySelector("#modal"))==null||g.addEventListener("click",d=>{d.target.id==="modal"&&u()}),document.querySelectorAll(".f_team_check").forEach(d=>{d.addEventListener("change",()=>{const f=d.dataset.team,b=document.querySelector(`.f_team_est[data-team="${f}"]`),D=document.querySelector(`.f_team_start[data-team="${f}"]`);b&&(b.disabled=!d.checked),D&&(D.disabled=!d.checked),Ct()})});const n=document.querySelector("#teamAssignList"),o=d=>{const f=d.target;f&&(f.classList.contains("f_team_est")||f.classList.contains("f_team_start")||f.classList.contains("f_team_check"))&&Ct()};n==null||n.addEventListener("input",o),n==null||n.addEventListener("change",o),n==null||n.addEventListener("keyup",o),(w=document.querySelector("#saveItem"))==null||w.addEventListener("click",()=>{const d=At();if(!d)return;const f=d.manualRank??G(m.items),b=document.querySelector("#f_rank"),D=()=>{if(tt(m.items,f,null)){const L=et("item");m.items=[...m.items,{...d,id:L,manualRank:m.items.length+1}],m.items=lt(m.items,L,f)}else m.items.push({...d,id:et("item"),manualRank:f}),m.items=K(m.items);c.creating=!1,c.editingId=null,V()},P=()=>{if(!c.editingId)return;const E=m.items.findIndex(ot=>ot.id===c.editingId);if(E<0)return;const L=m.items[E];f!==L.manualRank?(m.items[E]={...L,...d,manualRank:L.manualRank},m.items=lt(m.items,c.editingId,f)):m.items[E]={...L,...d},c.creating=!1,c.editingId=null,V()};if(c.creating){const E=tt(m.items,f,null);if(E&&b){wt(b,`Занять <span class="accent">${f}</span>?<br/>«${I(E.title)}» сдвинется вверх.`,D,()=>{});return}D();return}if(c.editingId){const E=m.items.find(L=>L.id===c.editingId);if(E&&f!==E.manualRank&&b){const L=tt(m.items,f,c.editingId);wt(b,L?`Сменить на <span class="accent">${f}</span>?<br/>«${I(L.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${f}</span>?`,P,()=>{});return}P()}}),(h=document.querySelector("#deleteItem"))==null||h.addEventListener("click",()=>{c.editingId&&(m.items=m.items.filter(d=>d.id!==c.editingId),c.editingId=null,V())}),["f_bv","f_tc","f_rr","f_js"].forEach(d=>{var f;(f=document.querySelector(`#${d}`))==null||f.addEventListener("input",()=>{const b=document.querySelector("#liveWsjf");if(!b)return;const D=At();D&&(b.textContent=String(B({...D})))})}),document.querySelectorAll("[data-cap]").forEach(d=>{d.addEventListener("input",()=>{const f=d.dataset.cap,b=m.teams.find(P=>P.id===f);if(!b)return;b.capacityPw=Number(d.value),gt(m);const D=document.querySelector(`[data-cap-label="${f}"]`);D&&(D.textContent=`${b.capacityPw} чел·нед`)}),d.addEventListener("change",()=>j())});const r=document.querySelector("#ganttWeeks");r==null||r.addEventListener("input",()=>{const d=Math.max(4,Math.min(52,Number(r.value)||16));c.ganttWeeks=d;const f=document.querySelector("#ganttWeeksLabel");f&&(f.textContent=`${d} нед.`)}),r==null||r.addEventListener("change",()=>{c.ganttWeeks=Math.max(4,Math.min(52,Number(r.value)||16)),j()}),document.querySelectorAll("[data-team-name]").forEach(d=>{const f=()=>{const b=d.dataset.teamName,D=m.teams.find(E=>E.id===b);if(!D)return;const P=d.value.trim()||D.name;d.value=P,P!==D.name&&(D.name=P,V())};d.addEventListener("change",f),d.addEventListener("keydown",b=>{b.key==="Enter"&&(b.preventDefault(),d.blur())})}),(k=document.querySelector("#addTeam"))==null||k.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName"),b=document.querySelector("#newTeamDot");d&&(d.hidden=!1),b&&(b.style.background=kt()),f==null||f.focus()}),(q=document.querySelector("#cancelNewTeam"))==null||q.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName");d&&(d.hidden=!0),f&&(f.value="")});const p=()=>{const d=document.querySelector("#newTeamName"),f=(d==null?void 0:d.value.trim())||"";if(!f){d==null||d.focus();return}m.teams.push({id:et("team"),name:f,capacityPw:3,color:kt()}),V()};if((x=document.querySelector("#saveNewTeam"))==null||x.addEventListener("click",p),(M=document.querySelector("#newTeamName"))==null||M.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),p())}),(W=document.querySelector("#exportPdfBtn"))==null||W.addEventListener("click",()=>{me()}),(R=document.querySelector("#exportBtn"))==null||R.addEventListener("click",()=>{const d=new Blob([JSON.stringify(m,null,2)],{type:"application/json"}),f=URL.createObjectURL(d),b=document.createElement("a");b.href=f,b.download=`vi-planer-${m.startDate}.json`,b.click(),URL.revokeObjectURL(f)}),(S=document.querySelector("#importBtn"))==null||S.addEventListener("click",()=>{var d;(d=document.querySelector("#fileInput"))==null||d.click()}),(T=document.querySelector("#fileInput"))==null||T.addEventListener("change",async d=>{var b;const f=(b=d.target.files)==null?void 0:b[0];if(f)try{const D=await f.text(),P=ct(JSON.parse(D));if(!P){alert("Неверный формат файла");return}m=P,V()}catch{alert("Не удалось прочитать JSON")}}),(_=document.querySelector("#resetBtn"))==null||_.addEventListener("click",()=>{c.confirmReset=!0,j()}),(C=document.querySelector("#resetCancelBtn"))==null||C.addEventListener("click",()=>{c.confirmReset=!1,j()}),(A=document.querySelector("#resetConfirmBackdrop"))==null||A.addEventListener("click",d=>{d.target===d.currentTarget&&(c.confirmReset=!1,j())}),(O=document.querySelector("#resetConfirmBtn"))==null||O.addEventListener("click",()=>{c.confirmReset=!1,m=structuredClone(pt),V()}),c.confirmReset){const d=f=>{f.key==="Escape"&&(window.removeEventListener("keydown",d),c.confirmReset=!1,j())};window.addEventListener("keydown",d)}}function me(){const e=document.title,t=new Date().toISOString().slice(0,10);document.title=`VI-Planer-${jt[c.tab]}-${t}`,document.body.classList.add("printing-tab");const a=()=>{document.body.classList.remove("printing-tab"),document.title=e,window.removeEventListener("afterprint",a)};window.addEventListener("afterprint",a),window.setTimeout(()=>window.print(),50)}async function pe(){m=await Yt();const e=m.items.map(a=>a.manualRank).join(",");m={...m,items:K(m.items)};const t=m.items.map(a=>a.manualRank).join(",");e!==t&&gt(m),zt(a=>{const i=document.querySelector("#syncStatus");i&&(i.dataset.status=a,i.textContent=Lt(a))}),j()}pe()})();
