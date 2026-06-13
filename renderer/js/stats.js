function initStats() {}

function renderStats() {
  const el = document.getElementById('page-stats')
  if (!el) return

  const name     = settings?.playerName || '—'
  const gameMode = (settings?.gameMode || 'pve').toUpperCase()

  // Getrackte Raids
  const trackedTotal    = raidData?.length || 0
  const trackedSurvived = raidData?.filter(r => r.status === 'Survived').length    || 0
  const trackedKia      = raidData?.filter(r => r.status === 'KIA').length         || 0
  const trackedRun      = raidData?.filter(r => r.status === 'RunThrough').length  || 0
  const trackedMia      = raidData?.filter(r => r.status === 'MIA').length         || 0

  // Manuelle Initialwerte
  const manualLevel    = settings?.manualLevel    || 0
  const manualKills    = settings?.manualKills    || 0
  const manualPlaytime = settings?.manualPlaytime || 0
  const manualRaids    = settings?.manualRaids    || 0
  const manualSurvived = settings?.manualSurvived || 0

  // Kombiniert
  const total    = trackedTotal + manualRaids
  const survived = trackedSurvived + manualSurvived
  const kia      = trackedKia + Math.max(0, manualRaids - manualSurvived)
  const runThru  = trackedRun
  const mia      = trackedMia
  const survRate = total > 0 ? Math.round(survived / total * 100) : 0
  const kiaPct   = total > 0 ? Math.round(kia / total * 100) : 0
  const runPct   = total > 0 ? Math.round(runThru / total * 100) : 0
  const avgDur   = trackedTotal > 0 && raidData.some(r => r.duration)
    ? Math.round(raidData.filter(r => r.duration).reduce((s, r) => s + r.duration, 0)
        / raidData.filter(r => r.duration).length / 60)
    : 0

  el.innerHTML = `
    <div class="stats-wrap">

      <!-- Profil -->
      <div class="stats-profile-card">
        <div class="stats-avatar">${(name[0] || 'T').toUpperCase()}</div>
        <div class="stats-profile-info">
          <div class="stats-nickname">${esc(name)}</div>
          <div class="stats-level">${manualLevel > 0 ? `Level ${manualLevel} · ` : ''}${gameMode}</div>
          <div class="stats-side">${total} Raids · ${survRate}% Survival</div>
        </div>
        <div class="stats-xp-block">
          <div class="stats-xp-val">${fmtRub(fleaStats?.totalRevenue || 0)}</div>
          <div class="stats-xp-label">Gesamtumsatz</div>
        </div>
      </div>

      <!-- Grid -->
      <div class="stats-grid">

        <!-- Survival Ring -->
        <div class="stats-card stats-card-ring">
          <div class="stats-card-title">Survival Rate</div>
          <div class="stats-ring-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--ac)" stroke-width="10"
                stroke-dasharray="314.2" stroke-dashoffset="${314.2*(1-survRate/100)}"
                stroke-linecap="round" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1s ease"/>
              <circle cx="60" cy="60" r="38" fill="none" stroke="rgba(239,68,68,0.15)" stroke-width="7"/>
              <circle cx="60" cy="60" r="38" fill="none" stroke="#ef4444" stroke-width="7"
                stroke-dasharray="238.8" stroke-dashoffset="${238.8*(1-kiaPct/100)}"
                stroke-linecap="round" transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1s ease"/>
            </svg>
            <div class="stats-ring-center">
              <div class="stats-ring-val" style="color:var(--ac)">${survRate}%</div>
              <div class="stats-ring-label">Survival</div>
            </div>
          </div>
          <div class="stats-ring-legend">
            <div><span style="color:var(--ac)">●</span> Survived ${survRate}%</div>
            <div><span style="color:#ef4444">●</span> KIA ${kiaPct}%</div>
            <div><span style="color:#f59e0b">●</span> Run ${runPct}%</div>
          </div>
        </div>

        <!-- Raid Zahlen -->
        <div class="stats-card">
          <div class="stats-card-title">Raid Statistiken</div>
          ${total === 0
            ? `<div style="text-align:center;color:var(--t4);padding:20px;font-size:12px">
                Noch keine Raids.<br>
                <span style="font-size:11px;opacity:0.6">Stats in Einstellungen eintragen oder Raids spielen.</span>
               </div>`
            : `<div class="stats-numbers">
                <div class="stats-num-item">
                  <div class="stats-num-val">${total.toLocaleString('de-DE')}</div>
                  <div class="stats-num-label">Raids gesamt</div>
                </div>
                <div class="stats-num-item">
                  <div class="stats-num-val" style="color:#10b981">${survived.toLocaleString('de-DE')}</div>
                  <div class="stats-num-label">Survived</div>
                </div>
                <div class="stats-num-item">
                  <div class="stats-num-val" style="color:#ef4444">${kia.toLocaleString('de-DE')}</div>
                  <div class="stats-num-label">KIA</div>
                </div>
                <div class="stats-num-item">
                  <div class="stats-num-val" style="color:#f59e0b">${runThru.toLocaleString('de-DE')}</div>
                  <div class="stats-num-label">Run Through</div>
                </div>
                <div class="stats-num-item">
                  <div class="stats-num-val">${mia.toLocaleString('de-DE')}</div>
                  <div class="stats-num-label">MIA</div>
                </div>
                <div class="stats-num-item">
                  <div class="stats-num-val">${avgDur > 0 ? avgDur+' Min' : '—'}</div>
                  <div class="stats-num-label">Ø Dauer</div>
                </div>
              </div>`
          }
        </div>

        <!-- Profil Stats -->
        <div class="stats-card">
          <div class="stats-card-title">Spielerprofil</div>
          <div class="stats-numbers">
            <div class="stats-num-item">
              <div class="stats-num-val" style="color:var(--ac)">${manualLevel || '—'}</div>
              <div class="stats-num-label">Level</div>
            </div>
            <div class="stats-num-item">
              <div class="stats-num-val">${manualKills > 0 ? manualKills.toLocaleString('de-DE') : '—'}</div>
              <div class="stats-num-label">Kills</div>
            </div>
            <div class="stats-num-item">
              <div class="stats-num-val">${manualPlaytime > 0 ? manualPlaytime+'h' : '—'}</div>
              <div class="stats-num-label">Spielzeit</div>
            </div>
            <div class="stats-num-item">
              <div class="stats-num-val" style="color:rgba(255,255,255,0.3);font-size:11px">Settings</div>
              <div class="stats-num-label">manuell eingeben</div>
            </div>
          </div>
        </div>

        <!-- Flea Stats -->
        <div class="stats-card">
          <div class="stats-card-title">Flea Market</div>
          <div class="stats-numbers">
            <div class="stats-num-item">
              <div class="stats-num-val" style="color:var(--ac)">${fmtRub(fleaStats?.totalRevenue || 0)}</div>
              <div class="stats-num-label">Gesamtumsatz</div>
            </div>
            <div class="stats-num-item">
              <div class="stats-num-val">${(fleaStats?.totalSales || 0).toLocaleString('de-DE')}</div>
              <div class="stats-num-label">Verkäufe</div>
            </div>
            <div class="stats-num-item">
              <div class="stats-num-val">${(fleaStats?.uniqueBuyers || 0).toLocaleString('de-DE')}</div>
              <div class="stats-num-label">Käufer</div>
            </div>
            <div class="stats-num-item" style="border-color:rgba(245,158,11,0.2)">
              <div class="stats-num-val" style="color:#f59e0b">${fleaStats?.streak || 0}T 🔥</div>
              <div class="stats-num-label">Streak</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
}