const fs   = require('fs')
const path = require('path')
const { EventEmitter } = require('events')

// Map Bundle → Anzeigename (aus TarkovMonitor MapBundles)
const MAP_NAMES = {
  'city_preset':          'Streets of Tarkov',
  'customs_preset':       'Customs',
  'factory4_day':         'Factory',
  'factory4_night':       'Factory (Night)',
  'factory_day_preset':   'Factory',
  'factory_night_preset': 'Factory (Night)',
  'interchange_preset':   'Interchange',
  'laboratory_preset':    'The Lab',
  'labyrinth_preset':     'Labyrinth',
  'lighthouse_preset':    'Lighthouse',
  'rezervbase_preset':    'Reserve',
  'shoreline_preset':     'Shoreline',
  'suburbs_preset':       'Suburbs',
  'tarkovstreets':        'Streets of Tarkov',
  'woods_preset':         'Woods',
  'sandbox_preset':       'Ground Zero',
  'sandbox_high_preset':  'Ground Zero+',
  // Direkte Location-Namen (aus TRACE-NetworkGameCreate)
  'bigmap':               'Customs',
  'factory4_day':         'Factory',
  'factory4_night':       'Factory (Night)',
  'interchange':          'Interchange',
  'laboratory':           'The Lab',
  'lighthouse':           'Lighthouse',
  'rezervbase':           'Reserve',
  'shoreline':            'Shoreline',
  'tarkovstreets':        'Streets of Tarkov',
  'woods':                'Woods',
  'sandbox':              'Ground Zero',
  'sandbox_high':         'Ground Zero+',
  'suburbs':              'Suburbs',
  'labyrinth':            'Labyrinth',
}

class RaidWatcher extends EventEmitter {
  constructor() {
    super()
    this._logPath    = ''
    this._position   = 0
    this._timer      = null
    this._currentRaid = null
  }

  start(logDir) {
    this._logDir = logDir
    this._findAndWatchApplication()
    this._timer = setInterval(() => this._poll(), 1000)
    console.log('[RaidWatcher] Gestartet')
  }

  stop() {
    if (this._timer) clearInterval(this._timer)
  }

  _findAndWatchApplication() {
    try {
      // Neueste Session finden
      const sessions = fs.readdirSync(this._logDir)
        .map(d => path.join(this._logDir, d))
        .filter(d => fs.statSync(d).isDirectory())
        .sort()
        .reverse()

      for (const session of sessions.slice(0, 3)) {
        const appLog = fs.readdirSync(session)
          .find(f => f.toLowerCase().startsWith('application'))
        if (appLog) {
          const newPath = path.join(session, appLog)
          if (newPath !== this._logPath) {
            this._logPath = newPath
            // Beim ersten Start: ans Ende der Datei springen (nur Live-Events)
            try { this._position = fs.statSync(newPath).size } catch { this._position = 0 }
            console.log('[RaidWatcher] Watching:', path.basename(newPath))
          }
          break
        }
      }
    } catch(e) { console.error('[RaidWatcher] findAndWatch:', e.message) }
  }

  _poll() {
    // Neue Session?
    this._findAndWatchApplication()
    if (!this._logPath) return

    try {
      const stat = fs.statSync(this._logPath)
      if (stat.size <= this._position) return

      const fd  = fs.openSync(this._logPath, 'r')
      const buf = Buffer.alloc(stat.size - this._position)
      fs.readSync(fd, buf, 0, buf.length, this._position)
      fs.closeSync(fd)
      this._position = stat.size

      const lines = buf.toString('utf8').split('\n')
      for (const line of lines) {
        this._parseLine(line.trim())
      }
    } catch(e) {
      // Datei noch nicht verfügbar
    }
  }

  _parseLine(line) {
    if (!line) return

    // ── RAID START ─────────────────────────────────────────────
    // TRACE-NetworkGameCreate profileStatus: '... Location: bigmap ...'
    if (line.includes('TRACE-NetworkGameCreate') && line.includes('Location:')) {
      const locMatch = line.match(/Location:\s*([a-zA-Z0-9_]+)/i)
      if (locMatch) {
        const locKey  = locMatch[1].toLowerCase()
        const mapName = MAP_NAMES[locKey] || MAP_NAMES[locKey + '_preset'] || locMatch[1]

        // RaidMode (PMC/Scav)
        const modeMatch = line.match(/GameMode:\s*(\w+)/i)
        const raidMode  = modeMatch ? modeMatch[1] : 'unknown'

        // ShortId
        const shortIdMatch = line.match(/shortId:\s*(\w+)/i)
        const shortId = shortIdMatch ? shortIdMatch[1] : ''

        this._currentRaid = {
          map:       mapName,
          mapKey:    locKey,
          raidMode,
          shortId,
          startTime: new Date().toISOString(),
          startTs:   Date.now(),
        }

        console.log('[RaidWatcher] Raid Start:', mapName, raidMode)
        this.emit('raid-start', this._currentRaid)
      }
      return
    }

    // ── RAID ENDE ──────────────────────────────────────────────
    // "SelectProfile" kommt wenn man nach dem Raid zurück ins Menü kommt
    if (line.includes('SelectProfile') && line.includes('ProfileId:') && this._currentRaid) {
      const duration = Math.round((Date.now() - this._currentRaid.startTs) / 1000)
      const raid = { ...this._currentRaid, duration }

      console.log('[RaidWatcher] Raid Ende:', raid.map, duration + 's')
      this.emit('raid-end', raid)

      // Status-Abfrage ans Frontend
      this.emit('raid-status-request', raid)
      this._currentRaid = null
      return
    }

    // Alternativ: "application|GameEnded" oder "local raid ended"
    if ((line.includes('GameEnded') || line.includes('local raid ended')) && this._currentRaid) {
      const duration = Math.round((Date.now() - this._currentRaid.startTs) / 1000)
      const raid = { ...this._currentRaid, duration }
      console.log('[RaidWatcher] Raid Ende (GameEnded):', raid.map)
      this.emit('raid-end', raid)
      this.emit('raid-status-request', raid)
      this._currentRaid = null
    }
  }

  getCurrentRaid() { return this._currentRaid }
}

module.exports = new RaidWatcher()