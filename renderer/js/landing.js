// ── LANDING MODAL ─────────────────────────
let _landingShown = false

function showLanding() {
  if (_landingShown) return
  _landingShown = true

  const overlay = document.createElement('div')
  overlay.id = '__landing'
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9000;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);
    animation:landingIn .3s ease;
  `

  const today     = new Date().toISOString().slice(0, 10)
  const todayRev  = fleaStats?.daily?.find(d => d.date === today)?.revenue || 0
  const h         = new Date().getHours()
  const greeting  = h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend'
  const name      = settings?.playerName || 'Operator'
  const survRate  = raidData?.length > 0
    ? Math.round(raidData.filter(r => r.status === 'Survived').length / raidData.length * 100)
    : 0

  overlay.innerHTML = `
    <style>
      @keyframes landingIn { from{opacity:0} to{opacity:1} }
      @keyframes landingUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
      @keyframes landingOut { to{opacity:0;transform:scale(0.97)} }
      .landing-card {
        display:flex;align-items:center;gap:10px;
        padding:11px 14px;border-radius:10px;
        border:1px solid rgba(255,255,255,0.07);
        background:rgba(255,255,255,0.04);
        cursor:pointer;transition:all .15s;
        text-decoration:none;
      }
      .landing-card:hover {
        background:rgba(255,255,255,0.08);
        border-color:var(--ac);
        transform:translateY(-1px);
      }
    </style>

    <div style="
      background:#161616;
      border:1px solid rgba(255,255,255,0.1);
      border-radius:16px;padding:28px;
      width:460px;max-width:94vw;
      animation:landingUp .35s ease;
    ">

      <!-- Header -->
      <div style="text-align:center;margin-bottom:22px">
        <div style="
          width:52px;height:52px;border-radius:14px;
          background:var(--ac);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 12px;font-size:22px;
        "><i class="ti ti-crosshair" style="color:#fff"></i></div>
        <div style="font-size:17px;font-weight:800;color:#fff">${greeting}, ${esc(name)}!</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:3px">
          ${new Date().toLocaleDateString('de-DE', {weekday:'long', day:'numeric', month:'long'})}
        </div>
      </div>

      <!-- Live Stats Ticker -->
      <div style="
        background:rgba(255,255,255,0.04);border-radius:8px;
        padding:10px 14px;margin-bottom:18px;
        display:flex;gap:16px;font-size:11px;flex-wrap:wrap;
      ">
        <div style="display:flex;align-items:center;gap:5px">
          <div style="width:6px;height:6px;border-radius:50%;background:#10b981"></div>
          <span style="color:rgba(255,255,255,0.5)">${(settings?.gameMode || 'pve').toUpperCase()}</span>
        </div>
        ${fleaStats ? `
          <div style="color:rgba(255,255,255,0.4)">
            Heute: <strong style="color:var(--ac)">${fmtRub(todayRev)}</strong>
          </div>
          <div style="color:rgba(255,255,255,0.4)">
            Gesamt: <strong style="color:rgba(255,255,255,0.7)">${fmtRub(fleaStats.totalRevenue)}</strong>
          </div>
        ` : ''}
        ${raidData?.length > 0 ? `
          <div style="color:rgba(255,255,255,0.4)">
            Survival: <strong style="color:#10b981">${survRate}%</strong>
          </div>
        ` : ''}
      </div>

      <!-- Tab Auswahl -->
      <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">
        Wohin möchtest du?
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:18px">
        ${[
          { page:'overview', icon:'ti-layout-dashboard', label:'Overview',    sub:'Tagesübersicht', accent:true },
          { page:'flea',     icon:'ti-coin',             label:'Flea Market', sub:`${(fleaStats?.totalSales||0).toLocaleString('de-DE')} Sales` },
          { page:'raids',    icon:'ti-sword',            label:'Raids',       sub:`${raidData?.length||0} getrackt` },
          { page:'quests',   icon:'ti-checkup-list',     label:'Quests',      sub:`${window._questDone||0} erledigt` },
          { page:'stats',    icon:'ti-chart-bar',        label:'Stats',       sub:'Übersicht' },
          { page:'hideout',  icon:'ti-home-2',           label:'Hideout',     sub:`${window._hideoutDone||0}/${window._hideoutTotal||'?'} Stationen` },
        ].map(t => `
          <div class="landing-card ${t.accent ? 'landing-card-accent' : ''}"
            onclick="closeLanding('${t.page}')"
            style="${t.accent ? `border-color:var(--ac);background:var(--ac-dim);` : ''}">
            <i class="ti ${t.icon}" style="font-size:18px;color:${t.accent ? 'var(--ac)' : 'rgba(255,255,255,0.3)'};flex-shrink:0"></i>
            <div style="min-width:0">
              <div style="font-size:13px;font-weight:700;color:${t.accent ? 'var(--ac)' : '#fff'};white-space:nowrap">${t.label}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.3)">${t.sub}</div>
            </div>
            ${t.accent ? '<span style="margin-left:auto;font-size:9px;background:var(--ac-dim);color:var(--ac);padding:2px 6px;border-radius:4px;flex-shrink:0;border:1px solid var(--ac-border)">Standard</span>' : ''}
          </div>
        `).join('')}
      </div>

      <!-- Footer -->
      <div style="text-align:center;font-size:10px;color:rgba(255,255,255,0.2)">
        Klicke außerhalb oder drücke ESC zum Schließen
      </div>
    </div>
  `

  // Außerhalb klicken → schließen
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLanding('overview')
  })

  // ESC
  const onKey = (e) => {
    if (e.key === 'Escape') { closeLanding('overview'); document.removeEventListener('keydown', onKey) }
  }
  document.addEventListener('keydown', onKey)

  document.body.appendChild(overlay)
}

function closeLanding(page) {
  const el = document.getElementById('__landing')
  if (!el) return
  el.style.animation = 'landingOut .2s ease forwards'
  setTimeout(() => {
    el.remove()
    showPage(page)
  }, 180)
}