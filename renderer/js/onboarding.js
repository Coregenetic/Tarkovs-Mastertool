// ── ONBOARDING ────────────────────────────
// Erscheint beim allerersten Start wenn kein Log-Pfad gesetzt ist

let _onboardingStep = 1
let _onboardingData = {}

function shouldShowOnboarding() {
  return !settings?.logPath || !settings?.playerName
}

async function showOnboarding() {
  const overlay = document.createElement('div')
  overlay.id = '__onboarding'
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9500;
    display:flex;align-items:center;justify-content:center;
    background:#111111;
    animation:fadeIn .3s ease;
  `
  document.body.appendChild(overlay)
  renderOnboardingStep(1)
}

function renderOnboardingStep(step) {
  _onboardingStep = step
  const overlay = document.getElementById('__onboarding')
  if (!overlay) return

  const steps = [
    {
      icon: 'ti-language',
      title: 'Choose your language / Sprache wählen',
      sub: 'This can be changed anytime in Settings.',
      content: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:8px 0">
          <button onclick="selectOnboardingLang(this,'de')" data-lang="de"
            style="padding:16px;border-radius:10px;border:2px solid ${(settings?.language||'de')==='de'?'var(--ac)':'rgba(255,255,255,0.1)'};
            background:${(settings?.language||'de')==='de'?'var(--ac-dim)':'#1e1e1e'};
            color:${(settings?.language||'de')==='de'?'var(--ac)':'rgba(255,255,255,0.6)'};
            cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s">
            <div style="font-size:28px;margin-bottom:6px">🇩🇪</div>
            <div style="font-size:14px;font-weight:700">Deutsch</div>
          </button>
          <button onclick="selectOnboardingLang(this,'en')" data-lang="en"
            style="padding:16px;border-radius:10px;border:2px solid ${(settings?.language||'de')==='en'?'var(--ac)':'rgba(255,255,255,0.1)'};
            background:${(settings?.language||'de')==='en'?'var(--ac-dim)':'#1e1e1e'};
            color:${(settings?.language||'de')==='en'?'var(--ac)':'rgba(255,255,255,0.6)'};
            cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s">
            <div style="font-size:28px;margin-bottom:6px">🇬🇧</div>
            <div style="font-size:14px;font-weight:700">English</div>
          </button>
        </div>
      `,
      btnLabel: 'Weiter / Next →',
      validate: () => {
        _onboardingData.language = document.querySelector('[data-lang][style*="var(--ac)"]')?.dataset.lang
          || settings?.language || 'de'
        return true
      }
    },
    {
      icon: 'ti-crosshair',
      title: 'Willkommen beim Tarkov Mastertool',
      sub: 'Dein persönlicher EFT Companion — lass uns kurz einrichten.',
      content: `
        <div style="text-align:center;padding:10px 0">
          <div style="font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7;max-width:320px;margin:0 auto">
            Tarkov Mastertool trackt deine Flea Market Sales, Raids, Quests und Hideout Fortschritt — alles lokal, ohne Account.
          </div>
        </div>
      `,
      btnLabel: 'Los geht\'s →',
    },
    {
      icon: 'ti-user',
      title: 'Wie heißt du in Tarkov?',
      sub: 'Dein In-Game Name für die Anzeige.',
      content: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <input id="ob-name" type="text" placeholder="z.B. Coregenetic"
            value="${settings?.playerName || ''}"
            style="padding:12px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);
            background:#1e1e1e;color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;width:100%"
            oninput="this.style.borderColor='var(--ac)'">
          <div style="display:flex;gap:8px">
            ${['PvE','PvP','Arena'].map(m => `
              <button onclick="selectOnboardingMode(this,'${m.toLowerCase()}')"
                data-mode="${m.toLowerCase()}"
                class="ob-mode-btn"
                style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);
                background:${(settings?.gameMode||'pve')===m.toLowerCase()?'var(--ac)':'#1e1e1e'};
                color:${(settings?.gameMode||'pve')===m.toLowerCase()?'#fff':'rgba(255,255,255,0.5)'};
                cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;
                transition:all .15s">${m}</button>
            `).join('')}
          </div>
        </div>
      `,
      btnLabel: 'Weiter →',
      validate: () => {
        const name = document.getElementById('ob-name')?.value?.trim()
        if (!name) { document.getElementById('ob-name').style.borderColor = '#ef4444'; return false }
        _onboardingData.playerName = name
        _onboardingData.gameMode   = document.querySelector('.ob-mode-btn[style*="var(--ac)"]')?.dataset.mode || 'pve'
        return true
      }
    },
    {
      icon: 'ti-folder',
      title: 'Wo liegen deine EFT Logs?',
      sub: 'Für Flea Sales Tracking und Raid Erkennung.',
      content: `
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;gap:8px">
            <input id="ob-logpath" type="text"
              placeholder="D:\\Battlestate Games\\Escape from Tarkov\\Logs"
              value="${settings?.logPath || ''}"
              style="flex:1;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);
              background:#1e1e1e;color:#fff;font-size:12px;font-family:'Inter',sans-serif;outline:none"
              oninput="this.style.borderColor='var(--ac)'">
            <button onclick="autoDetectLogPath()"
              style="padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);
              background:#1e1e1e;color:rgba(255,255,255,0.6);cursor:pointer;
              font-family:'Inter',sans-serif;font-size:12px;white-space:nowrap;transition:all .15s"
              onmouseover="this.style.borderColor='var(--ac)';this.style.color='var(--ac)'"
              onmouseout="this.style.borderColor='rgba(255,255,255,0.1)';this.style.color='rgba(255,255,255,0.6)'">
              Auto-Detect
            </button>
          </div>
          <div id="ob-path-status" style="font-size:11px;color:rgba(255,255,255,0.3);min-height:16px"></div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6">
            Standard-Pfade:<br>
            <code style="color:rgba(255,255,255,0.5);font-size:10px">C:\\Battlestate Games\\Escape from Tarkov\\Logs</code><br>
            <code style="color:rgba(255,255,255,0.5);font-size:10px">D:\\Battlestate Games\\Escape from Tarkov\\Logs</code>
          </div>
        </div>
      `,
      btnLabel: 'Weiter →',
      validate: () => {
        const p = document.getElementById('ob-logpath')?.value?.trim()
        if (!p) { document.getElementById('ob-path-status').textContent = '⚠ Bitte Pfad eingeben'; return false }
        _onboardingData.logPath = p
        return true
      }
    },
    {
      icon: 'ti-palette',
      title: 'Wähle deine Akzentfarbe',
      sub: 'Kann jederzeit in den Einstellungen geändert werden.',
      content: `
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:10px 0">
          ${[
            {c:'#e91e8c',n:'Pink'},
            {c:'#7c5cfc',n:'Lila'},
            {c:'#00d4ff',n:'Cyan'},
            {c:'#10b981',n:'Grün'},
            {c:'#f59e0b',n:'Gelb'},
            {c:'#ef4444',n:'Rot'},
          ].map(({c,n}) => `
            <div onclick="selectOnboardingColor('${c}')"
              style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer">
              <div id="ob-color-${c.replace('#','')}"
                style="width:44px;height:44px;border-radius:50%;background:${c};
                border:3px solid ${(settings?.accentColor||'#e91e8c')===c?'#fff':'transparent'};
                transition:all .2s;transform:${(settings?.accentColor||'#e91e8c')===c?'scale(1.15)':'scale(1)'}">
              </div>
              <span style="font-size:10px;color:rgba(255,255,255,0.4)">${n}</span>
            </div>
          `).join('')}
        </div>
      `,
      btnLabel: 'Fertig 🎉',
      validate: () => {
        _onboardingData.accentColor = document.querySelector('[id^="ob-color-"][style*="scale(1.15)"]')
          ? '#' + document.querySelector('[id^="ob-color-"][style*="scale(1.15)"]').id.replace('ob-color-','')
          : settings?.accentColor || '#e91e8c'
        return true
      }
    },
  ]

  const s = steps[step - 1]

  overlay.innerHTML = `
    <div style="
      background:#161616;border:1px solid rgba(255,255,255,0.08);
      border-radius:16px;padding:28px;width:440px;max-width:94vw;
      animation:landingUp .3s ease;
    ">

      <!-- Progress -->
      <div style="display:flex;gap:6px;margin-bottom:22px">
        ${steps.map((_, i) => `
          <div style="flex:1;height:3px;border-radius:2px;
            background:${i < step ? 'var(--ac)' : 'rgba(255,255,255,0.08)'}"></div>
        `).join('')}
      </div>

      <!-- Icon + Title -->
      <div style="text-align:center;margin-bottom:20px">
        <div style="
          width:48px;height:48px;border-radius:12px;
          background:var(--ac-dim);border:1px solid var(--ac-border);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 12px;
        "><i class="ti ${s.icon}" style="font-size:20px;color:var(--ac)"></i></div>
        <div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:4px">${s.title}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4)">${s.sub}</div>
      </div>

      <!-- Content -->
      <div style="margin-bottom:20px">${s.content}</div>

      <!-- Buttons -->
      <div style="display:flex;gap:8px">
        ${step > 1 ? `
          <button onclick="renderOnboardingStep(${step - 1})"
            style="padding:10px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);
            background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;
            font-family:'Inter',sans-serif;font-size:13px">← Zurück</button>
        ` : ''}
        <button onclick="onboardingNext()"
          style="flex:1;padding:12px;border-radius:8px;border:none;
          background:var(--ac);color:#fff;cursor:pointer;
          font-family:'Inter',sans-serif;font-size:14px;font-weight:700;
          transition:opacity .15s"
          onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
          ${s.btnLabel}
        </button>
      </div>

    </div>
  `

  // Validate function speichern
  overlay._validate = s.validate
  overlay._isLast   = step === steps.length
}

async function onboardingNext() {
  const overlay = document.getElementById('__onboarding')
  if (!overlay) return

  // Validieren
  if (overlay._validate && !overlay._validate()) return

  if (overlay._isLast) {
    // Speichern und schließen
    const newSettings = {
      ...settings,
      ..._onboardingData,
    }
    await window.api.saveSettings(newSettings)
    Object.assign(settings, newSettings)
    applyAccentColor(newSettings.accentColor || '#e91e8c')
    applySettingsToUI()

    // Neu starten mit neuen Settings
    if (newSettings.logPath) {
      // Settings wurden gespeichert — App neu laden
      window.location.reload()
    } else {
      overlay.remove()
    }
  } else {
    renderOnboardingStep(_onboardingStep + 1)
  }
}

function selectOnboardingLang(btn, lang) {
  document.querySelectorAll('[data-lang]').forEach(b => {
    b.style.borderColor = 'rgba(255,255,255,0.1)'
    b.style.background  = '#1e1e1e'
    b.style.color       = 'rgba(255,255,255,0.6)'
  })
  btn.style.borderColor = 'var(--ac)'
  btn.style.background  = 'var(--ac-dim)'
  btn.style.color       = 'var(--ac)'
  _onboardingData.language = lang
}

function selectOnboardingMode(btn, mode) {
  document.querySelectorAll('.ob-mode-btn').forEach(b => {
    b.style.background = '#1e1e1e'
    b.style.color = 'rgba(255,255,255,0.5)'
    b.style.borderColor = 'rgba(255,255,255,0.1)'
  })
  btn.style.background = 'var(--ac)'
  btn.style.color = '#fff'
  btn.style.borderColor = 'var(--ac)'
}

function selectOnboardingColor(color) {
  // Alle zurücksetzen
  document.querySelectorAll('[id^="ob-color-"]').forEach(el => {
    el.style.border = '3px solid transparent'
    el.style.transform = 'scale(1)'
  })
  // Ausgewählte setzen
  const el = document.getElementById('ob-color-' + color.replace('#',''))
  if (el) {
    el.style.border = '3px solid #fff'
    el.style.transform = 'scale(1.15)'
  }
  // Preview
  applyAccentColor(color)
  _onboardingData.accentColor = color
}

async function autoDetectLogPath() {
  const statusEl = document.getElementById('ob-path-status')
  const inputEl  = document.getElementById('ob-logpath')
  if (statusEl) statusEl.textContent = '🔍 Suche...'

  const candidates = [
    'C:\\Battlestate Games\\Escape from Tarkov\\Logs',
    'D:\\Battlestate Games\\Escape from Tarkov\\Logs',
    'E:\\Battlestate Games\\Escape from Tarkov\\Logs',
    'C:\\Program Files\\Battlestate Games\\EFT\\Logs',
  ]

  try {
    const found = await window.api.detectLogPath(candidates)
    if (found) {
      if (inputEl) { inputEl.value = found; inputEl.style.borderColor = '#10b981' }
      if (statusEl) statusEl.style.cssText = 'font-size:11px;color:#10b981'
      if (statusEl) statusEl.textContent = '✓ Log-Pfad gefunden!'
    } else {
      if (statusEl) statusEl.style.cssText = 'font-size:11px;color:#f59e0b'
      if (statusEl) statusEl.textContent = '⚠ Nicht gefunden — bitte manuell eingeben'
    }
  } catch {
    if (statusEl) statusEl.textContent = '⚠ Bitte manuell eingeben'
  }
}