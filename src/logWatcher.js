const fs = require('fs')
const path = require('path')
const { EventEmitter } = require('events')

class LogWatcher extends EventEmitter {
  constructor() {
    super()
    this._logDir = ''
    this._positions = {}
    this._pollTimer = null
    this._sessionDir = ''
    this._scanning = false
  }

  // ── Start ────────────────────────────────
  start(logDir) {
    if (!logDir || !fs.existsSync(logDir)) {
      this.emit('error', `Log-Ordner nicht gefunden: ${logDir}`)
      return false
    }
    this._logDir = logDir
    this.log(`Start — LogDir: ${logDir}`)

    this._initialScan()
    return true
  }

  stop() {
    if (this._pollTimer) clearInterval(this._pollTimer)
    this._pollTimer = null
    this.log('Gestoppt.')
  }

  // ── Initial Scan ─────────────────────────
  async _initialScan() {
    this._scanning = true
    const salesFile = path.join(this._dataDir || '', 'flea_sales_data.json')
    const hasCache  = fs.existsSync(salesFile)

    if (hasCache) {
      this.log('Cache gefunden — überspringe historischen Scan.')
      this.emit('scan-progress', { status: 'Cache geladen', pct: 100 })
      this._startPolling()
      this._scanning = false
      return
    }

    // Vollständiger Scan
    const sessions = this._getSessions()
    this.log(`${sessions.length} Sessions gefunden — vollständiger Scan...`)

    let total = 0
    for (let i = 0; i < sessions.length; i++) {
      const dir = sessions[i]
      const sales = this._parsePushNotifications(dir, true)
      total += sales.length
      if (sales.length > 0) this.emit('sales-batch', sales)

      const pct = Math.round(((i + 1) / sessions.length) * 90)
      this.emit('scan-progress', {
        status: `Session ${i + 1}/${sessions.length}...`,
        pct,
        count: total
      })
    }

    this.log(`Scan fertig: ${total} Sales`)
    this.emit('scan-complete', { total })
    this._startPolling()
    this._scanning = false
  }

  // ── Polling ──────────────────────────────
  _startPolling() {
    this._sessionDir = this._findActiveSession() || ''
    this._pollTimer = setInterval(() => this._poll(), 1000)
    this.log(`Polling aktiv — Session: ${path.basename(this._sessionDir || 'keine')}`)
  }

  _poll() {
    const active = this._findActiveSession()
    if (active && active !== this._sessionDir) {
      this._sessionDir = active
      this.log(`Neue Session: ${path.basename(active)}`)
      this.emit('new-session', { dir: active })
    }
    if (!this._sessionDir) return

    // Neue Sales
    const pushFiles = this._getLogsByType(this._sessionDir, 'push-notification')
    for (const f of pushFiles) {
      const known = this._positions[f] || 0
      try {
        const stat = fs.statSync(f)
        if (stat.size <= known) continue
        const sales = this._readNewSales(f, known)
        if (sales.newSales.length > 0) this.emit('new-sales', sales.newSales)
        this._positions[f] = sales.newPos
      } catch {}
    }
  }

  // ── Parser ───────────────────────────────
  _parsePushNotifications(dir, historical = false) {
    const sales = []
    const files = this._getLogsByType(dir, 'push-notification')
    for (const f of files) {
      try {
        const content = fs.readFileSync(f, 'utf8')
        const parsed  = this._parseSalesFromContent(content)
        sales.push(...parsed)
        if (historical) this._positions[f] = fs.statSync(f).size
      } catch {}
    }
    return sales
  }

  _readNewSales(filePath, fromPos) {
    const fd     = fs.openSync(filePath, 'r')
    const stat   = fs.statSync(filePath)
    const size   = stat.size - fromPos
    const buf    = Buffer.alloc(size)
    fs.readSync(fd, buf, 0, size, fromPos)
    fs.closeSync(fd)
    const content  = buf.toString('utf8')
    const newSales = this._parseSalesFromContent(content)
    return { newSales, newPos: stat.size }
  }

  _parseSalesFromContent(content) {
    const sales = []
    // Format: "{"type":"RagfairSoldItem","eventId":"...","dialogId":"...","items":[...],"receivedItems":[...]}"
    const lines = content.split('\n')
    for (const line of lines) {
      if (!line.includes('RagfairSoldItem')) continue
      try {
        const jsonMatch = line.match(/\{.*"type"\s*:\s*"RagfairSoldItem".*\}/)
        if (!jsonMatch) continue
        const data = JSON.parse(jsonMatch[0])
        if (data.type !== 'RagfairSoldItem') continue

        // Timestamp aus Log-Zeile
        const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)/)
        const ts = tsMatch ? new Date(tsMatch[1]).toISOString() : new Date().toISOString()
        const date = ts.slice(0, 10)

        // Items und Preis
        const receivedItems = data.receivedItems || []
        const rubles = receivedItems
          .filter(i => i.templateId === '5449016a4bdc2d6f028b456f') // Rubles
          .reduce((sum, i) => sum + (i.stackObjectsCount || 1), 0)

        const soldItems = data.items || []
        for (const item of soldItems) {
          const sale = {
            id:          `${ts}_${item.templateId}_${Math.random().toString(36).slice(2,7)}`,
            timestamp:   ts,
            date,
            templateId:  item.templateId || '',
            itemName:    item.templateId || 'Unknown',
            count:       item.stackObjectsCount || 1,
            totalPrice:  rubles,
            buyer:       data.dialogId || '',
          }
          sales.push(sale)
        }
      } catch {}
    }
    return sales
  }

  // ── Helpers ──────────────────────────────
  _getSessions() {
    try {
      return fs.readdirSync(this._logDir)
        .map(d => path.join(this._logDir, d))
        .filter(d => fs.statSync(d).isDirectory())
        .sort()
    } catch { return [] }
  }

  _findActiveSession() {
    try {
      const sessions = this._getSessions().reverse().slice(0, 5)
      let best = null, bestTime = 0
      for (const dir of sessions) {
        const files = fs.readdirSync(dir).map(f => path.join(dir, f))
        const times = files.map(f => { try { return fs.statSync(f).mtimeMs } catch { return 0 } })
        const max   = Math.max(...times)
        if (max > bestTime) { bestTime = max; best = dir }
      }
      return best
    } catch { return null }
  }

  _getLogsByType(dir, type) {
    try {
      return fs.readdirSync(dir)
        .filter(f => f.toLowerCase().includes(type))
        .map(f => path.join(dir, f))
    } catch { return [] }
  }

  setDataDir(dir) { this._dataDir = dir }

  log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] [LogWatcher] ${msg}`
    console.log(line)
    this.emit('log', line)
  }
}

module.exports = new LogWatcher()
