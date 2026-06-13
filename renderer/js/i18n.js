// ── INTERNATIONALIZATION ──────────────────
const TRANSLATIONS = {
  de: {
    // Nav
    nav_overview: 'Overview', nav_flea: 'Flea', nav_raids: 'Raids',
    nav_quests: 'Quests', nav_stats: 'Stats', nav_hideout: 'Hideout',
    nav_settings: 'Settings',
    // Topbar
    online: 'Online', connecting: 'Verbinde...',
    // Settings
    settings_title: 'Einstellungen',
    settings_profile: 'Profil',
    settings_name: 'Charakter-Name',
    settings_name_ph: 'z.B. Coregenetic',
    settings_gamemode: 'Spielmodus',
    settings_logs: 'EFT Logs',
    settings_logpath: 'Log-Pfad',
    settings_logpath_ph: 'D:\\Battlestate Games\\Escape from Tarkov\\Logs',
    settings_autodetect: 'Auto-Detect',
    settings_display: 'Darstellung',
    settings_accent: 'Akzentfarbe',
    settings_sound: 'Sound',
    settings_language: 'Sprache',
    settings_sync: 'Cloud Sync (optional)',
    settings_pat: 'GitHub PAT',
    settings_gist: 'Gist ID',
    settings_manual: 'Manuelle Stats (Initial)',
    settings_level: 'Level',
    settings_kills: 'Kills',
    settings_playtime: 'Spielzeit (Stunden)',
    settings_totalraids: 'Raids gesamt',
    settings_survived: 'Survived',
    settings_save: 'Einstellungen speichern',
    settings_saved: '✓ Gespeichert!',
    // Overview
    good_morning: 'Guten Morgen', good_day: 'Guten Tag', good_evening: 'Guten Abend',
    today_flea: 'Heute Flea', total: 'Gesamt', raids_total: 'Raids gesamt',
    quests: 'Quests', completed: 'abgeschlossen', survival: 'Survival',
    // Flea
    flea_today: 'Heute',
    flea_loading: 'Lade Flea Daten...',
    flea_init: 'Initialisiere...', flea_total: 'Gesamt', flea_sales: 'Sales',
    flea_streak: 'Streak', flea_buyers: 'Käufer', flea_search: 'Item suchen...',
    flea_chart: 'Einnahmen — letzte 7 Tage', flea_daily: 'Tagesumsatz in ₽',
    last_sales: 'Letzte Verkäufe',
    // Raids
    raids_active: 'Raid läuft', survived_q: 'Wie ist der Raid gelaufen?',
    btn_survived: '✓ Survived', btn_kia: '✗ KIA',
    btn_runthrough: 'Run Through', btn_mia: 'MIA',
    raids_maps: 'Maps', raids_recent: 'Letzte Raids', raids_empty: 'Noch keine Raids',
    // Stats
    stats_survival: 'Survival Rate', stats_raids: 'Raid Statistiken',
    stats_profile: 'Spielerprofil', stats_playtime: 'Spielzeit',
    avg_duration: 'Ø Dauer',
    // Quests
    q_all: 'Alle', q_active: 'Offen', q_done: 'Erledigt',
    q_search: 'Quest suchen...', q_trader: 'Trader...',
    q_total: 'Gesamt',
    // Hideout
    h_progress: 'Hideout Fortschritt', h_complete: 'Stationen komplett',
    // Status bar
    sb_ready: 'Bereit', sb_sync: 'Letzter Sync',
    // Landing
    where_to: 'Wohin möchtest du?', default_tab: 'Standard',
    close_hint: 'Klicke außerhalb oder drücke ESC zum Schließen',
  },
  en: {
    // Nav
    nav_overview: 'Overview', nav_flea: 'Flea', nav_raids: 'Raids',
    nav_quests: 'Quests', nav_stats: 'Stats', nav_hideout: 'Hideout',
    nav_settings: 'Settings',
    // Topbar
    online: 'Online', connecting: 'Connecting...',
    // Settings
    settings_title: 'Settings',
    settings_profile: 'Profile',
    settings_name: 'Character Name',
    settings_name_ph: 'e.g. Coregenetic',
    settings_gamemode: 'Game Mode',
    settings_logs: 'EFT Logs',
    settings_logpath: 'Log Path',
    settings_logpath_ph: 'D:\\Battlestate Games\\Escape from Tarkov\\Logs',
    settings_autodetect: 'Auto-Detect',
    settings_display: 'Appearance',
    settings_accent: 'Accent Color',
    settings_sound: 'Sound',
    settings_language: 'Language',
    settings_sync: 'Cloud Sync (optional)',
    settings_pat: 'GitHub PAT',
    settings_gist: 'Gist ID',
    settings_manual: 'Manual Stats (Initial)',
    settings_level: 'Level',
    settings_kills: 'Kills',
    settings_playtime: 'Play Time (hours)',
    settings_totalraids: 'Total Raids',
    settings_survived: 'Survived',
    settings_save: 'Save Settings',
    settings_saved: '✓ Saved!',
    // Overview
    good_morning: 'Good Morning', good_day: 'Good Day', good_evening: 'Good Evening',
    today_flea: 'Today Flea', total: 'Total', raids_total: 'Total Raids',
    quests: 'Quests', completed: 'completed', survival: 'Survival',
    // Flea
    flea_today: 'Today',
    flea_loading: 'Loading Flea Data...',
    flea_init: 'Initializing...', flea_total: 'Total', flea_sales: 'Sales',
    flea_streak: 'Streak', flea_buyers: 'Buyers', flea_search: 'Search item...',
    flea_chart: 'Revenue — last 7 days', flea_daily: 'Daily revenue in ₽',
    last_sales: 'Recent Sales',
    // Raids
    raids_active: 'Raid in progress', survived_q: 'How did the raid go?',
    btn_survived: '✓ Survived', btn_kia: '✗ KIA',
    btn_runthrough: 'Run Through', btn_mia: 'MIA',
    raids_maps: 'Maps', raids_recent: 'Recent Raids', raids_empty: 'No raids yet',
    // Stats
    stats_survival: 'Survival Rate', stats_raids: 'Raid Statistics',
    stats_profile: 'Player Profile', stats_playtime: 'Play Time',
    avg_duration: 'Avg Duration',
    // Quests
    q_all: 'All', q_active: 'Active', q_done: 'Completed',
    q_search: 'Search quest...', q_trader: 'Trader...',
    q_total: 'Total',
    // Hideout
    h_progress: 'Hideout Progress', h_complete: 'stations complete',
    // Status bar
    sb_ready: 'Ready', sb_sync: 'Last sync',
    // Landing
    where_to: 'Where do you want to go?', default_tab: 'Default',
    close_hint: 'Click outside or press ESC to close',
  }
}

function t(key) {
  const lang = settings?.language || 'de'
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['de']?.[key] || key
}

// ── APPLY TRANSLATIONS ────────────────────
function applyTranslations() {
  const lang = settings?.language || 'en'
  document.documentElement.lang = lang

  // Alle Elemente mit data-i18n Attribut übersetzen
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    if (t(key)) el.textContent = t(key)
  })

  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh
    if (t(key)) el.placeholder = t(key)
  })
}