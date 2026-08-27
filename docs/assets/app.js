(function(){"use strict";function F(t){const e=t.businessValue+t.timeCriticality+t.riskReduction;return Math.round(e/Math.max(t.jobSize,.5)*100)/100}function N(t){return t.assignments.reduce((e,a)=>e+a.estimatePw,0)}function At(t,e){return t.assignments.some(a=>a.teamId===e)}function ot(t,e){const a=new Date(t+"T12:00:00");return a.setDate(a.getDate()+e),a.toISOString().slice(0,10)}function B(t,e){return ot(t,e*7)}function Ft(t){return t.reduce((e,a)=>a.endDate!==e.endDate?a.endDate>e.endDate?a:e:a.estimatePw!==e.estimatePw?a.estimatePw>e.estimatePw?a:e:a.durationWeeks>e.durationWeeks?a:e)}function $(t){const[e,a,s]=t.split("-");return`${s}.${a}.${e}`}function X(t=new Date){const e=new Date(t),a=e.getDay(),s=a===0?-6:1-a;return e.setDate(e.getDate()+s),e.toISOString().slice(0,10)}function z(t){return!t||!/^\d{4}-\d{2}-\d{2}/.test(t)?X():X(new Date(t.slice(0,10)+"T12:00:00"))}function Bt(t,e){const a=new Date(z(t)+"T12:00:00").getTime(),s=new Date(z(e)+"T12:00:00").getTime();return Math.max(0,Math.round((s-a)/(168*3600*1e3)))}function Y(t){return[...t].sort((e,a)=>{const s=e.manualRank,l=a.manualRank;if(s!=null&&l!=null&&s!==l)return s-l;if(s!=null&&l==null)return-1;if(s==null&&l!=null)return 1;const n=F(a)-F(e);return n!==0?n:N(e)-N(a)})}function Z(t,e,a){return t.find(s=>s.id!==a&&s.manualRank!=null&&s.manualRank===e)}function rt(t,e,a){const s=Y(t),l=s.findIndex(i=>i.id===e);if(l<0)return t;const n=[...s],[o]=n.splice(l,1),r=Math.max(0,Math.min(n.length,Math.round(a)-1));n.splice(r,0,o);const p=new Map(n.map((i,c)=>[i.id,c+1]));return t.map(i=>{const c=p.get(i.id);return c==null||i.manualRank===c?i:{...i,manualRank:c}})}function Nt(t,e){if(e.length<2)return t;const a=Y(t),s=new Set(e),l=new Map(t.map(i=>[i.id,i])),n=e.map(i=>l.get(i)).filter(i=>!!i);let o=0;const r=[];for(const i of a)if(s.has(i.id)){const c=n[o++];c&&r.push(c)}else r.push(i);for(;o<n.length;)r.push(n[o++]);const p=new Map(r.map((i,c)=>[i.id,c+1]));return t.map(i=>{const c=p.get(i.id);return c==null||i.manualRank===c?i:{...i,manualRank:c}})}function G(t){let e=0;for(const a of t)a.manualRank!=null&&a.manualRank>e&&(e=a.manualRank);return e+1}function V(t){const e=[...t].sort((o,r)=>{const p=F(r)-F(o);return p!==0?p:N(o)-N(r)}),a=new Set,s=new Map;for(const o of e){const r=o.manualRank;r!=null&&Number.isFinite(r)&&r>=1&&!a.has(r)&&(a.add(r),s.set(o.id,r))}let l=1;const n=()=>{for(;a.has(l);)l+=1;const o=l;return a.add(o),l+=1,o};return t.map(o=>{const r=s.get(o.id)??n();return o.manualRank===r?o:{...o,manualRank:r}})}function $t(t){const e=t.items.filter(i=>i.status!=="done"),a=Y(e),s=new Map;for(const i of t.teams)s.set(i.id,[]);for(const i of a)for(const c of i.assignments){const v=s.get(c.teamId)??[];v.push({item:i,estimatePw:c.estimatePw,workStartDate:z(c.workStartDate||t.startDate)}),s.set(c.teamId,v)}const l=[],n={},o=52;for(const i of t.teams){const c=s.get(i.id)??[],v=Array.from({length:o},(g,w)=>({week:w,weekStart:B(t.startDate,w),usedPw:0,capacityPw:i.capacityPw,items:[]}));let y=0;c.forEach((g,w)=>{const h=Bt(t.startDate,g.workStartDate);let k=Math.max(y,h);for(;k<o&&v[k].usedPw>=i.capacityPw-.001;)k+=1;let E=g.estimatePw,D=k,R=B(t.startDate,k);const W=B(t.startDate,k);for(;E>.001&&D<o;){const S=v[D],C=Math.max(0,S.capacityPw-S.usedPw);if(C<=.001){D+=1;continue}const M=Math.min(C,E),T=B(t.startDate,D),d=M/S.capacityPw*7,f=S.usedPw/S.capacityPw*7;R=ot(T,f+d),S.usedPw+=M,S.items.push(g.item.id),E-=M,E>.001&&(D+=1)}const j=i.capacityPw>0?Math.round(g.estimatePw/i.capacityPw*100)/100:g.estimatePw;l.push({item:g.item,teamId:i.id,estimatePw:g.estimatePw,wsjf:F(g.item),effectiveRank:w+1,plannedStartDate:g.workStartDate,startWeek:k,endWeek:D,startDate:W,endDate:R,waitWeeks:k,delayedByQueue:k>h,durationWeeks:j}),y=D,v[y]&&v[y].usedPw>=i.capacityPw-.001?y=D+1:y=D}),n[i.id]=v}const r=new Map;for(const i of l){const c=r.get(i.item.id)??[];c.push(i),r.set(i.item.id,c)}const p=[];for(const i of a){const c=r.get(i.id)??[];if(!c.length)continue;const v=Ft(c),y=c.reduce((g,w)=>w.startWeek<g.startWeek?w:g);p.push({item:i,slices:[...c].sort((g,w)=>g.endDate===w.endDate?w.estimatePw-g.estimatePw:g.endDate<w.endDate?1:-1),wsjf:F(i),totalEstimatePw:N(i),startWeek:y.startWeek,endWeek:v.endWeek,startDate:y.startDate,endDate:v.endDate,waitWeeks:y.waitWeeks,bottleneckTeamId:v.teamId})}return l.sort((i,c)=>i.startWeek!==c.startWeek?i.startWeek-c.startWeek:c.wsjf-i.wsjf),{slices:l,rollups:p,load:n}}function tt(t){return`${t}_${Math.random().toString(36).slice(2,9)}`}function ct(t){if(!t||typeof t!="object")return null;const e=t;if(!Array.isArray(e.teams)||!Array.isArray(e.items))return null;const a=z(String(e.startDate??X())),s=e.items.map(l=>{const n=l;let o=[];return Array.isArray(n.assignments)&&n.assignments.length?o=n.assignments.filter(r=>r&&typeof r.teamId=="string").map(r=>({teamId:r.teamId,estimatePw:Math.max(.5,Number(r.estimatePw)||1),workStartDate:z(String(r.workStartDate||n.workStartDate||a))})):typeof n.teamId=="string"&&(o=[{teamId:n.teamId,estimatePw:Math.max(.5,Number(n.estimatePw)||1),workStartDate:a}]),!o.length&&Array.isArray(e.teams)&&e.teams[0]&&(o=[{teamId:e.teams[0].id,estimatePw:4,workStartDate:a}]),{id:String(n.id??tt("item")),title:String(n.title??"Без названия"),type:n.type==="project"?"project":"product",backlog:String(n.backlog??"Backlog"),assignments:o,status:["idea","ready","in_progress","blocked","done"].includes(String(n.status))?n.status:"idea",owner:String(n.owner??"—"),businessValue:Number(n.businessValue)||5,timeCriticality:Number(n.timeCriticality)||5,riskReduction:Number(n.riskReduction)||5,jobSize:Number(n.jobSize)||5,notes:n.notes!=null?String(n.notes):void 0,manualRank:n.manualRank==null||n.manualRank===""?null:Number(n.manualRank)}});return{version:3,startDate:a,teams:e.teams,items:V(s)}}const A=X(),lt=B(A,1),et=B(A,2),St=B(A,3),dt=B(A,4),ut=B(A,6),Pt=B(A,8),Dt={version:3,startDate:A,teams:[{id:"platform",name:"Platform",capacityPw:4,color:"#2563eb"},{id:"mobile",name:"Mobile",capacityPw:3,color:"#7c3aed"},{id:"data",name:"Data & Analytics",capacityPw:2.5,color:"#0d9488"},{id:"crm",name:"CRM / Sales Tech",capacityPw:3.5,color:"#c2410c"}],items:[{id:"p2",title:"Мобильный чекаут v2",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:8,workStartDate:A}],status:"ready",owner:"Маша Л.",businessValue:8,timeCriticality:5,riskReduction:5,jobSize:6,manualRank:null},{id:"j4",title:"Интеграция телефонии для отдела продаж",type:"project",backlog:"Projects backlog · Sales Ops",assignments:[{teamId:"crm",estimatePw:3,workStartDate:lt}],status:"ready",owner:"Сергей М.",businessValue:7,timeCriticality:7,riskReduction:3,jobSize:3,manualRank:null},{id:"p6",title:"Push-уведомления и deep links",type:"product",backlog:"Product backlog · Mobile",assignments:[{teamId:"mobile",estimatePw:3,workStartDate:dt}],status:"idea",owner:"Маша Л.",businessValue:6,timeCriticality:4,riskReduction:2,jobSize:3,manualRank:null},{id:"j6",title:"Дашборд KPI для совета директоров",type:"project",backlog:"Projects backlog · Exec",assignments:[{teamId:"data",estimatePw:2,workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:8,timeCriticality:9,riskReduction:2,jobSize:2,notes:"Нужен к ближайшему совету",manualRank:null},{id:"p5",title:"Админ-панель ролей и аудита",type:"product",backlog:"Product backlog · Platform",assignments:[{teamId:"platform",estimatePw:4,workStartDate:ut}],status:"idea",owner:"Аня К.",businessValue:5,timeCriticality:2,riskReduction:8,jobSize:4,manualRank:null},{id:"p1",title:"Единый каталог цен и остатков",type:"product",backlog:"Product backlog · Commerce",assignments:[{teamId:"platform",estimatePw:10,workStartDate:A},{teamId:"data",estimatePw:4,workStartDate:St}],status:"in_progress",owner:"Аня К.",businessValue:9,timeCriticality:7,riskReduction:6,jobSize:8,notes:"Data стартует после первых API Platform",manualRank:null},{id:"j1",title:"Внедрение EDI для крупного B2B-клиента",type:"project",backlog:"Projects backlog · Delivery",assignments:[{teamId:"platform",estimatePw:6,workStartDate:lt},{teamId:"crm",estimatePw:3,workStartDate:dt}],status:"ready",owner:"Игорь С.",businessValue:8,timeCriticality:9,riskReduction:4,jobSize:5,notes:"CRM — онбординг после ядра EDI",manualRank:null},{id:"j2",title:"Пилот Launchpad: клинический портал",type:"project",backlog:"Projects backlog · Launchpad",assignments:[{teamId:"mobile",estimatePw:5,workStartDate:et},{teamId:"platform",estimatePw:3,workStartDate:et}],status:"ready",owner:"Денис В.",businessValue:7,timeCriticality:8,riskReduction:7,jobSize:4,notes:"Обе команды стартуют одновременно",manualRank:null},{id:"j3",title:"Миграция отчётности клиента X на DWH",type:"project",backlog:"Projects backlog · Data",assignments:[{teamId:"data",estimatePw:7,workStartDate:lt},{teamId:"platform",estimatePw:2,workStartDate:A}],status:"ready",owner:"Павел Р.",businessValue:6,timeCriticality:6,riskReduction:8,jobSize:5,notes:"Platform — пайплайн выгрузки раньше Data",manualRank:null},{id:"p4",title:"Сквозная воронка лида → сделка",type:"product",backlog:"Product backlog · CRM",assignments:[{teamId:"crm",estimatePw:7,workStartDate:A},{teamId:"platform",estimatePw:4,workStartDate:et},{teamId:"mobile",estimatePw:3,workStartDate:ut}],status:"in_progress",owner:"Оля Т.",businessValue:9,timeCriticality:6,riskReduction:5,jobSize:6,notes:"Mobile подключается после событий Platform",manualRank:null},{id:"j5",title:"Compliance-пакет HIPAA для продукта Y",type:"project",backlog:"Projects backlog · Security",assignments:[{teamId:"platform",estimatePw:8,workStartDate:St},{teamId:"data",estimatePw:3,workStartDate:dt},{teamId:"mobile",estimatePw:2,workStartDate:Pt}],status:"blocked",owner:"Игорь С.",businessValue:8,timeCriticality:8,riskReduction:9,jobSize:6,notes:"Ждём юристов; старты сдвинуты",manualRank:null},{id:"p3",title:"Рекомендации в поиске (ML)",type:"product",backlog:"Product backlog · Growth",assignments:[{teamId:"data",estimatePw:9,workStartDate:et},{teamId:"platform",estimatePw:3,workStartDate:ut},{teamId:"mobile",estimatePw:2,workStartDate:Pt}],status:"idea",owner:"Катя Н.",businessValue:7,timeCriticality:3,riskReduction:6,jobSize:7,notes:"Serving и UI после модели",manualRank:null}]},mt={...Dt,items:V(Dt.items)},xt="vi-planer-v3";let It="idle",at=[];function Ot(){return null}function Et(){return It}function zt(t){return at.push(t),()=>{at=at.filter(e=>e!==t)}}function Q(t){It=t,at.forEach(e=>e(t))}function Ht(){try{const t=localStorage.getItem(xt)??localStorage.getItem("vi-planer-v2")??localStorage.getItem("vi-planer-v1");if(!t)return null;const e=ct(JSON.parse(t));return e?{...e,items:V(e.items)}:null}catch{return null}}function Rt(t){localStorage.setItem(xt,JSON.stringify(t))}async function Vt(){try{const t=await fetch("/api/state",{cache:"no-store"});if(!t.ok)return null;const e=await t.json(),a=ct(e.state);return a?{...a,items:V(a.items)}:null}catch{return null}}async function Ut(t){try{return(await fetch("/api/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).ok}catch{return!1}}async function Jt(){return null}async function Kt(t){return!1}async function Yt(){Q("loading");const t=await Vt()??await Jt()??Ht()??structuredClone(mt);return Rt(t),Q((Ot(),"saved")),t}let pt=null,ft=null;function vt(t){Rt(t),ft=t,pt&&clearTimeout(pt),pt=setTimeout(async()=>{const e=ft;if(ft=null,!e)return;Q("loading");const a=await Kt(),s=a?!0:await Ut(e);if(a||s){Q("saved");return}Q("offline")},350)}function Lt(t){switch(t){case"loading":return"Сохранение…";case"saved":return"Сохранено в облаке";case"error":return"Ошибка сохранения";case"offline":return"Только локально";default:return"Локально"}}function jt(t){const e=document.querySelector(`script[data-pdf-lib="${t}"]`);return e?e.dataset.loaded==="1"?Promise.resolve():new Promise((a,s)=>{e.addEventListener("load",()=>a()),e.addEventListener("error",()=>s(new Error(`Failed to load ${t}`)))}):new Promise((a,s)=>{const l=document.createElement("script");l.src=t,l.async=!0,l.dataset.pdfLib=t,l.onload=()=>{l.dataset.loaded="1",a()},l.onerror=()=>s(new Error(`Failed to load ${t}`)),document.head.appendChild(l)})}async function Gt(){var a,s;window.html2canvas||await jt("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"),(a=window.jspdf)!=null&&a.jsPDF||await jt("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");const t=window.html2canvas,e=(s=window.jspdf)==null?void 0:s.jsPDF;if(!t||!e)throw new Error("PDF libraries failed to load");return{html2canvas:t,jsPDF:e}}async function Qt(t,e,a){const{html2canvas:s,jsPDF:l}=await Gt(),n=await s(t,{scale:Math.min(2,window.devicePixelRatio||2),useCORS:!0,allowTaint:!0,backgroundColor:"#f3f5f8",logging:!1,windowWidth:Math.max(t.scrollWidth,t.clientWidth),windowHeight:Math.max(t.scrollHeight,t.clientHeight)}),o=n.toDataURL("image/png"),r=new l({orientation:"landscape",unit:"mm",format:"a4"}),p=r.internal.pageSize.getWidth(),i=r.internal.pageSize.getHeight(),c=8,v=8,y=p-c*2,g=i-c*2-v,w=y,h=n.height*w/n.width;let k=h,E=c+v,D=0;for(;k>0;){D>0&&r.addPage(),D===0&&(r.setFontSize(11),r.setTextColor(15,23,42),r.text(a,c,c+4)),r.addImage(o,"PNG",c,E,w,h);const R=D===0?g:i-c*2;if(k-=R,E-=R,D+=1,D>40)break}r.save(e)}const gt={portfolio:"Портфель",teams:"Очереди команд",queuesTest:"Очереди (тест)",timeline:"Сроки / Gantt",capacity:"Команды"},u={tab:"portfolio",typeFilter:"all",teamFilter:"all",statusFilter:"all",query:"",sortKey:"priority",sortDir:"asc",editingId:null,creating:!1,ganttWeeks:16};let m=structuredClone(mt);function H(t){return m.teams.find(e=>e.id===t)}function yt(t){return{idea:"Идея",ready:"Готово к работе",in_progress:"В работе",blocked:"Блокер",done:"Готово"}[t]}function qt(t){return new Map(t.map(e=>[e.item.id,e]))}function Xt(t){return t.assignments.map(e=>{const a=H(e.teamId);return(a==null?void 0:a.name)??e.teamId}).join(", ")}function Zt(t){return`<div class="teams-stack">${t.assignments.map(a=>{const s=H(a.teamId);return`<span class="team-chip"><span class="team-dot" style="background:${(s==null?void 0:s.color)??"#94a3b8"}"></span>${I((s==null?void 0:s.name)??a.teamId)} <span class="mono muted-inline">${a.estimatePw}чн · старт ${$(a.workStartDate)}</span></span>`}).join("")}</div>`}function te(t){const e=u.query.trim().toLowerCase(),a=qt(t),s=m.items.filter(n=>u.typeFilter!=="all"&&n.type!==u.typeFilter||u.teamFilter!=="all"&&!At(n,u.teamFilter)||u.statusFilter!=="all"&&n.status!==u.statusFilter?!1:e?n.title.toLowerCase().includes(e)||n.backlog.toLowerCase().includes(e)||n.owner.toLowerCase().includes(e)||Xt(n).toLowerCase().includes(e):!0);if(u.sortKey==="priority"){const n=Y(s);return u.sortDir==="asc"?n:[...n].reverse()}const l=u.sortDir==="asc"?1:-1;return[...s].sort((n,o)=>{var p,i;let r=0;if(u.sortKey==="wsjf")r=F(n)-F(o);else if(u.sortKey==="estimate")r=N(n)-N(o);else{const c=((p=a.get(n.id))==null?void 0:p.endDate)??"9999-99-99",v=((i=a.get(o.id))==null?void 0:i.endDate)??"9999-99-99";r=c<v?-1:c>v?1:0}return r!==0?r*l:n.title.localeCompare(o.title,"ru")})}function nt(t,e){const a=u.sortKey===e,s=a?u.sortDir==="asc"?" ↑":" ↓":"";return`<th class="sortable ${a?"sorted":""}" data-sort="${e}" title="Сортировать">${t}${s}</th>`}function ee(t){u.sortKey===t?u.sortDir=u.sortDir==="asc"?"desc":"asc":(u.sortKey=t,u.sortDir=t==="wsjf"?"desc":"asc"),_()}function ae(t,e){const a=m.items.filter(i=>i.status!=="done"),s=a.filter(i=>i.type==="product").length,l=a.filter(i=>i.type==="project").length,n=a.filter(i=>i.assignments.length>1).length,o=t.map(i=>i.endWeek),r=o.length?Math.max(...o)+1:0,p=m.teams.filter(i=>e.filter(v=>v.teamId===i.id).reduce((v,y)=>v+y.estimatePw,0)>i.capacityPw*8).length;return`
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
  `}function ne(){return`
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
  `}function se(t,e){const a=qt(t),s=te(t),l=u.sortKey==="priority",n=s.map(o=>{const r=a.get(o.id),p=F(o),i=N(o),c=o.manualRank??"—",v=r?`<div class="eta-teams">${r.slices.map(y=>{const g=H(y.teamId);return`<div class="eta-team"><span class="eta-team-name" style="color:${(g==null?void 0:g.color)??"#64748b"}">${I((g==null?void 0:g.name)??y.teamId)}</span>: ${$(y.startDate)}→${$(y.endDate)}</div>`}).join("")}</div>`:"";return`
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
            <div class="name">${I(o.title)}</div>
            <div class="meta">${I(o.backlog)} · ${I(o.owner)}</div>
          </td>
          <td>${Zt(o)}</td>
          <td><span class="badge badge-status-${o.status}">${yt(o.status)}</span></td>
          <td class="mono metric-num">${p}</td>
          <td class="mono metric-num">
            ${i}
            ${o.assignments.length>1?`<div class="meta">${o.assignments.map(y=>y.estimatePw).join(" + ")}</div>`:""}
          </td>
          <td class="mono ${r&&r.waitWeeks>4?"eta-late":"eta-good"}">
            ${r?`<span class="eta-final">${$(r.endDate)}</span>`:"—"}
            ${v}
          </td>
        </tr>
      `}).join("");return`
    ${ne()}
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
            ${m.teams.map(o=>`<option value="${o.id}" ${u.teamFilter===o.id?"selected":""}>${I(o.name)}</option>`).join("")}
          </select>
          <select id="statusFilter">
            <option value="all">Все статусы</option>
            ${["idea","ready","in_progress","blocked","done"].map(o=>`<option value="${o}" ${u.statusFilter===o?"selected":""}>${yt(o)}</option>`).join("")}
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
              ${nt("Приоритет","priority")}
              <th>Тип</th>
              <th>Инициатива / исходный бэклог</th>
              <th>Команды (оценка · старт)</th>
              <th>Статус</th>
              ${nt("WSJF","wsjf")}
              ${nt("Оценка, чел·нед","estimate")}
              ${nt("ETA","eta")}
            </tr>
          </thead>
          <tbody id="portfolioBody">
            ${n||'<tr><td colspan="8" class="empty">Нет элементов по фильтру</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function ie(t){return`
    <div class="panel">
      <div class="panel-header">
        <h2>Сквозной приоритет по командам</h2>
      </div>
      ${m.teams.map(a=>{const s=t.filter(r=>r.teamId===a.id).sort((r,p)=>r.effectiveRank-p.effectiveRank),l=s.reduce((r,p)=>r+p.estimatePw,0),n=a.capacityPw>0?l/a.capacityPw:0,o=Math.min(100,Math.round(s.filter(r=>r.startWeek<8).reduce((r,p)=>{const i=Math.min(p.endWeek+1,8)-p.startWeek;return r+Math.max(0,i)*(p.estimatePw/Math.max(1,p.endWeek-p.startWeek+1))},0)/(a.capacityPw*8)*100));return`
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${a.color}"></span>${I(a.name)}</h3>
              <div class="meta">Ёмкость ${a.capacityPw} чел·нед/нед · спрос ${l.toFixed(1)} · ~${n.toFixed(1)} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${o}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100,o)}%;background:${a.color}"></span></div>
          ${s.map(r=>{const p=r.item.assignments.length-1;return`
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
  `}function oe(t){const e=m.startDate;return`
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      «Может взять с …» — фактическая дата, когда у команды появляется ёмкость с учётом очереди и планового старта.
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel">
      <div class="panel-header">
        <h2>Очереди (тест) — когда команда может взять задачу</h2>
      </div>
      ${m.teams.map(s=>{const l=t.filter(i=>i.teamId===s.id).sort((i,c)=>{const v=i.item.manualRank??9999,y=c.item.manualRank??9999;return v!==y?v-y:i.effectiveRank-c.effectiveRank}),n=l.reduce((i,c)=>i+c.estimatePw,0),o=s.capacityPw>0?n/s.capacityPw:0,r=l.length?l[l.length-1].endDate:e,p=l.map((i,c)=>{const v=i.item.manualRank??"—",y=c>0?l[c-1]:null;let g="может взять сразу (есть свободная ёмкость)",w="take-now";i.startDate>i.plannedStartDate?(g=y?`ждёт очередь: после #${y.item.manualRank??"?"} «${y.item.title}»`:"сдвиг из‑за загрузки очереди",w="take-queue"):i.startDate>e&&(g=`ждёт плановый старт ${$(i.plannedStartDate)}`,w="take-plan");const h=i.item.assignments.filter(k=>k.teamId!==s.id).map(k=>{var E;return((E=H(k.teamId))==null?void 0:E.name)??k.teamId});return`
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${v}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${i.item.type}">${i.item.type==="product"?"П":"Пр"}</span>
                  ${I(i.item.title)}
                </div>
                <div class="take-line ${w}">
                  <strong>Может взять с ${$(i.startDate)}</strong>
                  <span class="meta"> · ${I(g)}</span>
                </div>
                <div class="meta">
                  ${i.estimatePw} чел·нед · план ${$(i.plannedStartDate)} · до ${$(i.endDate)}
                  ${h.length?` · ещё: ${h.map(I).join(", ")}`:""}
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
              <h3><span class="team-dot" style="background:${s.color}"></span>${I(s.name)}</h3>
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
  `}function re(t,e){const a=Math.max(4,...t.map(h=>h.endWeek+2),4),s=Math.max(4,Math.min(52,Math.round(u.ganttWeeks)||16));u.ganttWeeks=s;const l=Y(m.items.filter(h=>h.status!=="done")),n=new Map(l.map((h,k)=>[h.id,k])),o=100/s,r=`repeating-linear-gradient(90deg, #f8fafc 0, #f8fafc calc(${o}% - 1px), #e2e8f0 calc(${o}% - 1px), #e2e8f0 ${o}%)`,p=[],i=[];m.teams.forEach((h,k)=>{const E=e.filter(R=>R.teamId===h.id).sort((R,W)=>R.effectiveRank-W.effectiveRank);if(E.length<2)return;const D=`arrow-${h.id}`;i.push(`
      <marker id="${D}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${h.color}" fill-opacity="0.85" />
      </marker>
    `);for(let R=1;R<E.length;R++){const W=E[R-1],j=E[R],S=(n.get(W.item.id)??0)+.5,C=(n.get(j.item.id)??0)+.5,M=Math.min(s-.05,W.endWeek+.92),T=Math.min(s-.05,Math.max(.08,j.startWeek+.02)),d=T-M,f=(k%4-1.5)*.08,b=Math.max(.35,Math.abs(d)*.45)+Math.abs(f),x=M+(d>=0?b:-b*.35)+f,P=T-(d>=0?b:-b*.35)+f,L=Math.abs(S-C)<.02?`M ${M} ${S} H ${T}`:`M ${M} ${S} C ${x} ${S}, ${P} ${C}, ${T} ${C}`;p.push(`<path d="${L}" fill="none" stroke="${h.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${D})" />`)}});const c=[],v=[];for(const h of l){const k=t.find(j=>j.item.id===h.id);if(!k)continue;const E=k.slices.map(j=>{const S=e.filter(d=>d.teamId===j.teamId).sort((d,f)=>d.effectiveRank-f.effectiveRank),C=S.findIndex(d=>d.item.id===h.id);if(C<=0)return null;const M=S[C-1],T=H(j.teamId);return`#${M.item.manualRank} (${(T==null?void 0:T.name)??j.teamId})`}).filter(Boolean),D=[...new Set(E)],R=D.length?`<div class="meta gantt-dep-meta">после ${D.join(", ")}</div>`:'<div class="meta gantt-dep-meta">старт очереди</div>',W=k.slices.map(j=>{const S=H(j.teamId),C=j.startWeek/s*100,M=Math.max(1,j.endWeek-j.startWeek+1)/s*100;return`<div class="gantt-bar ${j.teamId===k.bottleneckTeamId?"gantt-bot":""}" style="left:${C}%;width:${Math.max(M,2.5)}%;background:${(S==null?void 0:S.color)??"#64748b"}" title="${U((S==null?void 0:S.name)??"")}: ${$(j.endDate)}">${I((S==null?void 0:S.name)??"")}</div>`}).join("");c.push(`
      <div class="gantt-label">
        <div class="name"><span class="prio-mini">${h.manualRank??"—"}</span> ${I(h.title)}</div>
        <div class="meta">${h.type==="product"?"Продукт":"Проект"} · ETA ${$(k.endDate)}</div>
        ${R}
      </div>
    `),v.push(`<div class="gantt-track gantt-track-multi" style="background:${r}">${W}</div>`)}const y=Math.max(1,l.length),g=s<=12?1:s<=24?2:s<=36?3:4,w=Array.from({length:s},(h,k)=>{if(!(k%g===0||k===s-1))return`<div class="gantt-axis-tick gantt-axis-tick-empty" style="width:${o}%"></div>`;const D=B(m.startDate,k),[,R,W]=D.split("-");return`<div class="gantt-axis-tick" style="width:${o}%">
      <span class="gantt-axis-w">Н${k+1}</span>
      <span class="gantt-axis-d">${W}.${R}</span>
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
  `}const bt=["#2563eb","#7c3aed","#0d9488","#c2410c","#db2777","#059669","#d97706","#4f46e5","#0891b2","#be123c"];function kt(){const t=new Set(m.teams.map(e=>e.color));return bt.find(e=>!t.has(e))??bt[m.teams.length%bt.length]}function ce(){return`
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
          value="${U(e.name)}"
          aria-label="Название команды"
        />
        <input type="range" min="1" max="8" step="0.5" value="${e.capacityPw}" data-cap="${e.id}" />
        <span class="mono capacity-label" data-cap-label="${e.id}">${e.capacityPw} чел·нед</span>
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
  `}function le(t){var i;const e=t??{id:"",title:"",type:"product",backlog:"Product backlog",assignments:[{teamId:((i=m.teams[0])==null?void 0:i.id)??"",estimatePw:4,workStartDate:m.startDate}],status:"idea",owner:"",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,notes:"",manualRank:G(m.items)},a=F(e),s=new Set(e.assignments.map(c=>c.teamId)),l=new Map(e.assignments.map(c=>[c.teamId,c.estimatePw])),n=new Map(e.assignments.map(c=>[c.teamId,c.workStartDate])),o=Mt(e),r=o?Ct(o,e.assignments):'<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>',p=m.teams.map(c=>{const v=s.has(c.id),y=l.get(c.id)??4,g=n.get(c.id)??m.startDate;return`
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${c.id}" ${v?"checked":""} />
            <span class="team-dot" style="background:${c.color}"></span>
            <span class="team-assign-name">${I(c.name)}</span>
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
            <input id="f_title" value="${U(e.title)}" />
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
              <input id="f_backlog" value="${U(e.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${["idea","ready","in_progress","blocked","done"].map(c=>`<option value="${c}" ${e.status===c?"selected":""}>${yt(c)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${U(e.owner)}" />
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
              <input id="f_rank" type="number" min="1" step="1" value="${e.manualRank??G(m.items)}" />
              <div class="meta" style="margin-top:6px">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
            </div>
            <div class="field">
              <label>Заметки</label>
              <textarea id="f_notes">${I(e.notes??"")}</textarea>
            </div>
          </div>
        </div>
        ${t?`<div class="modal-foot">
          <button class="btn" id="deleteItem" style="color:var(--bad)">Удалить</button>
        </div>`:""}
      </div>
    </div>
  `}function Mt(t){const e=t.assignments.length?t.assignments:ht();if(!e.length)return null;const a=t.id||"__draft__",s={...t,id:a,assignments:e},l=m.items.some(o=>o.id===a)?m.items.map(o=>o.id===a?s:o):[...m.items,s],{rollups:n}=$t({...m,items:l});return n.find(o=>o.item.id===a)??null}function _t(t){const e=H(t.teamId),a=(e==null?void 0:e.capacityPw)||1,s=Math.round(t.estimatePw/a*100)/100,l=z(t.workStartDate||m.startDate),n=ot(l,s*7);return{start:l,end:n,weeks:s}}function Ct(t,e){const a=new Map(e.map(n=>[n.teamId,n])),s=t.slices.map(n=>{const o=H(n.teamId),r=a.get(n.teamId),p=r?z(r.workStartDate):n.plannedStartDate,i=r?_t(r):null,c=n.teamId===t.bottleneckTeamId?' <span class="meta">← критический путь</span>':"",v=n.startDate>p?` <span class="meta">(план ${$(p)}, очередь сдвинула на ${$(n.startDate)})</span>`:n.startDate<p?` <span class="meta">(ждём план ${$(p)})</span>`:"",y=i?`<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${$(i.start)} → <span class="mono">${$(i.end)}</span></div>`:"";return`<div style="margin-bottom:8px"><strong>${I((o==null?void 0:o.name)??n.teamId)}</strong>: <span class="mono">${$(n.startDate)} → ${$(n.endDate)}</span> <span class="meta">(${n.estimatePw} чел·нед ≈ ${n.durationWeeks} нед.)</span>${v}${c}${y}</div>`}).join(""),l=e.map(n=>_t(n).end).reduce((n,o)=>n>o?n:o,"0000-00-00");return s+`<div class="eta-final-line">ETA с учётом очереди = <span class="eta-final mono">${$(t.endDate)}</span></div><div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${$(l)}</strong> — меняется сразу при смене даты</div>`}function I(t){return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function U(t){return I(t).replaceAll("'","&#39;")}function J(){var t;document.querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask").forEach(e=>{e.classList.remove("prio-ask")}),(t=document.querySelector("#prioPop"))==null||t.remove()}function de(t){return`
    <div class="prio-confirm-text">${t}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-prio-no>Нет</button>
      <button type="button" class="btn btn-primary" data-prio-yes>Да</button>
    </div>
  `}function wt(t,e,a,s){var v,y;J(),t.classList.add("prio-ask");const l=document.createElement("div");l.id="prioPop",l.className="prio-confirm prio-confirm-float",l.setAttribute("data-stop-edit",""),l.innerHTML=de(e),document.body.appendChild(l);const n=()=>{const g=t.getBoundingClientRect(),w=l.getBoundingClientRect();let h=g.right+8,k=g.top+g.height/2-w.height/2;h+w.width>window.innerWidth-8&&(h=Math.max(8,g.left-w.width-8)),k=Math.max(8,Math.min(k,window.innerHeight-w.height-8)),l.style.left=`${h}px`,l.style.top=`${k}px`};n();const o=()=>n();window.addEventListener("scroll",o,!0),window.addEventListener("resize",o);const r=()=>{window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",o),document.removeEventListener("mousedown",c,!0)},p=()=>{r(),J(),s()},i=()=>{r(),J(),a()},c=g=>{const w=g.target;l.contains(w)||t.contains(w)||p()};document.addEventListener("mousedown",c,!0),(v=l.querySelector("[data-prio-yes]"))==null||v.addEventListener("click",g=>{g.stopPropagation(),i()}),(y=l.querySelector("[data-prio-no]"))==null||y.addEventListener("click",g=>{g.stopPropagation(),p()})}function ue(){if(u.sortKey!=="priority")return;const t=document.querySelector("#portfolioBody");if(!t)return;let e=null,a=null;const s=()=>{t.querySelectorAll(".is-dragging, .drag-over").forEach(n=>n.classList.remove("is-dragging","drag-over"))},l=(n,o)=>{if(n===o)return;const r=Array.from(t.querySelectorAll("tr[data-row-id]")).map(y=>y.dataset.rowId),p=r.indexOf(n),i=r.indexOf(o);if(p<0||i<0)return;const c=[...r];c.splice(p,1),c.splice(i,0,n);const v=u.sortDir==="asc"?c:[...c].reverse();m.items=Nt(m.items,v),u.sortKey="priority",O()};t.querySelectorAll("[data-drag-handle]").forEach(n=>{const o=n.closest("tr[data-row-id]");if(!o)return;n.addEventListener("pointerdown",p=>{p.button===0&&(p.preventDefault(),p.stopPropagation(),e=o.dataset.rowId??null,a=p.pointerId,n.setPointerCapture(p.pointerId),s(),o.classList.add("is-dragging"),document.body.classList.add("prio-dragging"))}),n.addEventListener("pointermove",p=>{if(e==null||p.pointerId!==a)return;const i=document.elementFromPoint(p.clientX,p.clientY),c=i==null?void 0:i.closest("tr[data-row-id]");t.querySelectorAll(".drag-over").forEach(v=>v.classList.remove("drag-over")),c&&c.dataset.rowId!==e&&c.classList.add("drag-over")});const r=p=>{if(e==null||p.pointerId!==a)return;const i=e,c=document.elementFromPoint(p.clientX,p.clientY),v=c==null?void 0:c.closest("tr[data-row-id]"),y=v==null?void 0:v.dataset.rowId;try{n.releasePointerCapture(p.pointerId)}catch{}s(),document.body.classList.remove("prio-dragging"),e=null,a=null,y&&l(i,y)};n.addEventListener("pointerup",r),n.addEventListener("pointercancel",r)})}function _(){J(),K();const{slices:t,rollups:e}=$t(m),a=document.querySelector("#app");if(!a)return;const s=u.editingId!=null?m.items.find(l=>l.id===u.editingId)??null:null;a.innerHTML=`
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${Et()}">${Lt(Et())}</span>
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
        <h1>VI Planer — ${gt[u.tab]}</h1>
        <p>Старт портфеля: ${m.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${ae(e,t)}
      <div class="tabs no-print">
        <button class="tab ${u.tab==="portfolio"?"active":""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${u.tab==="teams"?"active":""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${u.tab==="queuesTest"?"active":""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${u.tab==="timeline"?"active":""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${u.tab==="capacity"?"active":""}" data-tab="capacity">Команды</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${u.tab==="portfolio"?se(e):u.tab==="teams"?ie(t):u.tab==="queuesTest"?oe(t):u.tab==="timeline"?re(e,t):ce()}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${u.creating||s?le(s):""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `,me()}function ht(){const t=Array.from(document.querySelectorAll(".f_team_check")),e=[];for(const a of t){if(!a.checked)continue;const s=a.dataset.team,l=document.querySelector(`.f_team_est[data-team="${s}"]`),n=document.querySelector(`.f_team_start[data-team="${s}"]`),o=Math.max(.5,Number(l==null?void 0:l.value)||1),r=z((n==null?void 0:n.value)||m.startDate);e.push({teamId:s,estimatePw:o,workStartDate:r})}return e}function Tt(){var o,r,p,i,c,v,y;const t=document.querySelector("#liveTotalEst"),e=document.querySelector("#liveEta"),a=ht();if(t&&(t.textContent=String(a.reduce((g,w)=>g+w.estimatePw,0)||0)),!e)return;if(!a.length){e.innerHTML='<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';return}const s=(u.editingId?m.items.find(g=>g.id===u.editingId):null)??{id:"__draft__",title:"Черновик",type:"product",backlog:"Backlog",assignments:a,status:"ready",owner:"—",businessValue:5,timeCriticality:5,riskReduction:5,jobSize:5,manualRank:null},l={...s,id:u.editingId||"__draft__",assignments:a,title:((o=document.querySelector("#f_title"))==null?void 0:o.value.trim())||s.title,type:((r=document.querySelector("#f_type"))==null?void 0:r.value)||s.type,status:((p=document.querySelector("#f_status"))==null?void 0:p.value)||s.status,businessValue:Number((i=document.querySelector("#f_bv"))==null?void 0:i.value)||s.businessValue,timeCriticality:Number((c=document.querySelector("#f_tc"))==null?void 0:c.value)||s.timeCriticality,riskReduction:Number((v=document.querySelector("#f_rr"))==null?void 0:v.value)||s.riskReduction,jobSize:Number((y=document.querySelector("#f_js"))==null?void 0:y.value)||s.jobSize,manualRank:(()=>{var h;const g=(h=document.querySelector("#f_rank"))==null?void 0:h.value,w=Math.round(Number(g));return Number.isFinite(w)&&w>=1?w:s.manualRank??G(m.items)})()},n=Mt(l);if(!n){e.innerHTML='<div class="meta">Нет расчёта</div>';return}e.innerHTML=Ct(n,a)}function Wt(){const t=(n,o)=>{const r=document.querySelector(`#${n}`),p=Number(r==null?void 0:r.value);return Number.isFinite(p)?p:o},e=n=>{var o;return((o=document.querySelector(`#${n}`))==null?void 0:o.value)??""},a=ht();if(!a.length)return alert("Выберите хотя бы одну команду"),null;const s=e("f_rank").trim(),l=Math.max(1,Math.round(Number(s)||G(m.items)));return{title:e("f_title").trim()||"Без названия",type:e("f_type"),backlog:e("f_backlog").trim()||"Backlog",assignments:a,status:e("f_status"),owner:e("f_owner").trim()||"—",businessValue:st(t("f_bv",5),1,10),timeCriticality:st(t("f_tc",5),1,10),riskReduction:st(t("f_rr",5),1,10),jobSize:st(t("f_js",5),1,10),notes:e("f_notes").trim(),manualRank:l}}function st(t,e,a){return Math.min(a,Math.max(e,t))}function O(){vt(m),_()}function me(){var i,c,v,y,g,w,h,k,E,D,R,W,j,S,C,M,T;document.querySelectorAll("[data-tab]").forEach(d=>{d.addEventListener("click",()=>{u.tab=d.dataset.tab,_()})});const t=document.querySelector("#q");t==null||t.addEventListener("input",()=>{u.query=t.value}),t==null||t.addEventListener("change",()=>_());const e=document.querySelector("#typeFilter");e==null||e.addEventListener("change",()=>{u.typeFilter=e.value,_()});const a=document.querySelector("#teamFilter");a==null||a.addEventListener("change",()=>{u.teamFilter=a.value,_()});const s=document.querySelector("#statusFilter");s==null||s.addEventListener("change",()=>{u.statusFilter=s.value,_()}),(i=document.querySelector("#addItem"))==null||i.addEventListener("click",()=>{u.creating=!0,u.editingId=null,_()}),(c=document.querySelector("#resetFilters"))==null||c.addEventListener("click",()=>{u.typeFilter="all",u.teamFilter="all",u.statusFilter="all",u.query="",u.sortKey="priority",u.sortDir="asc",_()}),document.querySelectorAll("[data-edit]").forEach(d=>{d.addEventListener("click",f=>{f.target.closest("[data-stop-edit], .prio-input, .prio-edit, #prioPop, .drag-handle")||(u.editingId=d.dataset.edit??null,u.creating=!1,_())})}),ue(),document.querySelectorAll(".prio-input").forEach(d=>{const f=d.dataset.prioId,b=()=>{const P=m.items.find(L=>L.id===f);d.value=String((P==null?void 0:P.manualRank)??1)},x=()=>{const P=m.items.find(be=>be.id===f);if(!P)return;const L=Number(d.value);if(!Number.isFinite(L)||L<1){b();return}const q=Math.round(L);if(d.value=String(q),q===P.manualRank)return;const it=Z(m.items,q,f),ye=it?`Сменить на <span class="accent">${q}</span>?<br/>«${I(it.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${q}</span>?`;wt(d,ye,()=>{m.items=rt(m.items,f,q),O()},b)};d.addEventListener("click",P=>P.stopPropagation()),d.addEventListener("mousedown",P=>P.stopPropagation()),d.addEventListener("keydown",P=>{P.key==="Enter"&&(P.preventDefault(),x()),P.key==="Escape"&&(J(),b(),d.blur())}),d.addEventListener("change",x)}),document.querySelectorAll("[data-sort]").forEach(d=>{d.addEventListener("click",f=>{f.stopPropagation();const b=d.dataset.sort;(b==="wsjf"||b==="estimate"||b==="eta"||b==="priority")&&ee(b)})});const l=()=>{u.creating=!1,u.editingId=null,_()};(v=document.querySelector("#closeModal"))==null||v.addEventListener("click",l),(y=document.querySelector("#closeModal2"))==null||y.addEventListener("click",l),(g=document.querySelector("#modal"))==null||g.addEventListener("click",d=>{d.target.id==="modal"&&l()}),document.querySelectorAll(".f_team_check").forEach(d=>{d.addEventListener("change",()=>{const f=d.dataset.team,b=document.querySelector(`.f_team_est[data-team="${f}"]`),x=document.querySelector(`.f_team_start[data-team="${f}"]`);b&&(b.disabled=!d.checked),x&&(x.disabled=!d.checked),Tt()})});const n=document.querySelector("#teamAssignList"),o=d=>{const f=d.target;f&&(f.classList.contains("f_team_est")||f.classList.contains("f_team_start")||f.classList.contains("f_team_check"))&&Tt()};n==null||n.addEventListener("input",o),n==null||n.addEventListener("change",o),n==null||n.addEventListener("keyup",o),(w=document.querySelector("#saveItem"))==null||w.addEventListener("click",()=>{const d=Wt();if(!d)return;const f=d.manualRank??G(m.items),b=document.querySelector("#f_rank"),x=()=>{if(Z(m.items,f,null)){const q=tt("item");m.items=[...m.items,{...d,id:q,manualRank:m.items.length+1}],m.items=rt(m.items,q,f)}else m.items.push({...d,id:tt("item"),manualRank:f}),m.items=V(m.items);u.creating=!1,u.editingId=null,O()},P=()=>{if(!u.editingId)return;const L=m.items.findIndex(it=>it.id===u.editingId);if(L<0)return;const q=m.items[L];f!==q.manualRank?(m.items[L]={...q,...d,manualRank:q.manualRank},m.items=rt(m.items,u.editingId,f)):m.items[L]={...q,...d},u.creating=!1,u.editingId=null,O()};if(u.creating){const L=Z(m.items,f,null);if(L&&b){wt(b,`Занять <span class="accent">${f}</span>?<br/>«${I(L.title)}» сдвинется вверх.`,x,()=>{});return}x();return}if(u.editingId){const L=m.items.find(q=>q.id===u.editingId);if(L&&f!==L.manualRank&&b){const q=Z(m.items,f,u.editingId);wt(b,q?`Сменить на <span class="accent">${f}</span>?<br/>«${I(q.title)}» сдвинется вверх.`:`Сменить приоритет на <span class="accent">${f}</span>?`,P,()=>{});return}P()}}),(h=document.querySelector("#deleteItem"))==null||h.addEventListener("click",()=>{u.editingId&&(m.items=m.items.filter(d=>d.id!==u.editingId),u.editingId=null,O())}),["f_bv","f_tc","f_rr","f_js"].forEach(d=>{var f;(f=document.querySelector(`#${d}`))==null||f.addEventListener("input",()=>{const b=document.querySelector("#liveWsjf");if(!b)return;const x=Wt();x&&(b.textContent=String(F({...x})))})}),document.querySelectorAll("[data-cap]").forEach(d=>{d.addEventListener("input",()=>{const f=d.dataset.cap,b=m.teams.find(P=>P.id===f);if(!b)return;b.capacityPw=Number(d.value),vt(m);const x=document.querySelector(`[data-cap-label="${f}"]`);x&&(x.textContent=`${b.capacityPw} чел·нед`)}),d.addEventListener("change",()=>_())});const r=document.querySelector("#ganttWeeks");r==null||r.addEventListener("input",()=>{const d=Math.max(4,Math.min(52,Number(r.value)||16));u.ganttWeeks=d;const f=document.querySelector("#ganttWeeksLabel");f&&(f.textContent=`${d} нед.`)}),r==null||r.addEventListener("change",()=>{u.ganttWeeks=Math.max(4,Math.min(52,Number(r.value)||16)),_()}),document.querySelectorAll("[data-team-name]").forEach(d=>{const f=()=>{const b=d.dataset.teamName,x=m.teams.find(L=>L.id===b);if(!x)return;const P=d.value.trim()||x.name;d.value=P,P!==x.name&&(x.name=P,O())};d.addEventListener("change",f),d.addEventListener("keydown",b=>{b.key==="Enter"&&(b.preventDefault(),d.blur())})}),(k=document.querySelector("#addTeam"))==null||k.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName"),b=document.querySelector("#newTeamDot");d&&(d.hidden=!1),b&&(b.style.background=kt()),f==null||f.focus()}),(E=document.querySelector("#cancelNewTeam"))==null||E.addEventListener("click",()=>{const d=document.querySelector("#teamAddBar"),f=document.querySelector("#newTeamName");d&&(d.hidden=!0),f&&(f.value="")});const p=()=>{const d=document.querySelector("#newTeamName"),f=(d==null?void 0:d.value.trim())||"";if(!f){d==null||d.focus();return}m.teams.push({id:tt("team"),name:f,capacityPw:3,color:kt()}),O()};(D=document.querySelector("#saveNewTeam"))==null||D.addEventListener("click",p),(R=document.querySelector("#newTeamName"))==null||R.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),p())}),(W=document.querySelector("#exportPdfBtn"))==null||W.addEventListener("click",()=>{ve()}),(j=document.querySelector("#downloadReqsBtn"))==null||j.addEventListener("click",()=>{fe()}),(S=document.querySelector("#exportBtn"))==null||S.addEventListener("click",()=>{const d=new Blob([JSON.stringify(m,null,2)],{type:"application/json"}),f=URL.createObjectURL(d),b=document.createElement("a");b.href=f,b.download=`vi-planer-${m.startDate}.json`,b.click(),URL.revokeObjectURL(f)}),(C=document.querySelector("#importBtn"))==null||C.addEventListener("click",()=>{var d;(d=document.querySelector("#fileInput"))==null||d.click()}),(M=document.querySelector("#fileInput"))==null||M.addEventListener("change",async d=>{var b;const f=(b=d.target.files)==null?void 0:b[0];if(f)try{const x=await f.text(),P=ct(JSON.parse(x));if(!P){alert("Неверный формат файла");return}m=P,O()}catch{alert("Не удалось прочитать JSON")}}),(T=document.querySelector("#resetBtn"))==null||T.addEventListener("click",d=>{d.stopPropagation(),pe(d.currentTarget)})}function K(){var t,e;(t=document.querySelector("#resetPop"))==null||t.remove(),(e=document.querySelector("#resetBtn"))==null||e.classList.remove("reset-ask")}function pe(t){var r,p;K(),J(),t.classList.add("reset-ask");const e=document.createElement("div");e.id="resetPop",e.className="reset-confirm",e.innerHTML=`
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `,document.body.appendChild(e);const a=()=>{const i=t.getBoundingClientRect(),c=e.offsetWidth,v=e.offsetHeight;let y=i.right-c,g=i.bottom+6;y<8&&(y=8),y+c>window.innerWidth-8&&(y=window.innerWidth-c-8),g+v>window.innerHeight-8&&(g=i.top-v-6),e.style.left=`${Math.max(8,y)}px`,e.style.top=`${Math.max(8,g)}px`};a();const s=()=>a();window.addEventListener("scroll",s,!0),window.addEventListener("resize",s);const l=()=>{window.removeEventListener("scroll",s,!0),window.removeEventListener("resize",s),window.removeEventListener("keydown",n),document.removeEventListener("mousedown",o)},n=i=>{i.key==="Escape"&&(l(),K())},o=i=>{const c=i.target;e.contains(c)||t.contains(c)||(l(),K())};(r=e.querySelector("#resetCancelBtn"))==null||r.addEventListener("click",()=>{l(),K()}),(p=e.querySelector("#resetConfirmBtn"))==null||p.addEventListener("click",()=>{l(),K(),m=structuredClone(mt),O()}),window.addEventListener("keydown",n),window.setTimeout(()=>document.addEventListener("mousedown",o),0)}async function fe(){const t="/vi_planer/",e=new URL("VI-Planer-requirements.md",new URL(t,window.location.href)).href;try{const a=await fetch(e);if(!a.ok)throw new Error(String(a.status));const s=await a.text(),l=new Blob([s],{type:"text/markdown;charset=utf-8"}),n=URL.createObjectURL(l),o=document.createElement("a");o.href=n,o.download="VI-Planer-requirements.md",o.click(),URL.revokeObjectURL(n)}catch(a){console.error(a),alert("Не удалось скачать файл требований")}}async function ve(){const t=document.querySelector("#exportPdfBtn"),e=document.querySelector("#pdfCapture");if(!e){alert("Не удалось найти содержимое для экспорта");return}const a=(t==null?void 0:t.textContent)??"Экспорт PDF";t&&(t.disabled=!0,t.textContent="PDF…");const s=new Date().toISOString().slice(0,10),l=`VI Planer — ${gt[u.tab]} · ${s}`,n=`VI-Planer-${gt[u.tab]}-${s}.pdf`.replaceAll(" ","_");document.body.classList.add("pdf-capturing");try{await Qt(e,n,l)}catch(o){console.error(o),alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).")}finally{document.body.classList.remove("pdf-capturing"),t&&(t.disabled=!1,t.textContent=a)}}async function ge(){m=await Yt();const t=m.items.map(a=>a.manualRank).join(",");m={...m,items:V(m.items)};const e=m.items.map(a=>a.manualRank).join(",");t!==e&&vt(m),zt(a=>{const s=document.querySelector("#syncStatus");s&&(s.dataset.status=a,s.textContent=Lt(a))}),_()}ge()})();
