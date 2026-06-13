const fs   = require('fs')
const path = require('path')

class SaleStore {
  constructor() {
    this._sales   = []
    this._file    = ''
    this._dirty   = false
  }

  init(dataDir) {
    this._file = path.join(dataDir, 'flea_sales_data.json')
    this._load()
  }

  _load() {
    if (!fs.existsSync(this._file)) return
    try {
      const data = JSON.parse(fs.readFileSync(this._file, 'utf8'))
      this._sales = Array.isArray(data) ? data : []
      console.log(`[SaleStore] ${this._sales.length} Sales geladen.`)
    } catch(e) {
      console.error('[SaleStore] Ladefehler:', e.message)
    }
  }

  save() {
    if (!this._dirty) return
    try {
      fs.writeFileSync(this._file, JSON.stringify(this._sales, null, 2))
      this._dirty = false
    } catch(e) {
      console.error('[SaleStore] Speicherfehler:', e.message)
    }
  }

  // Einzelne Sale hinzufügen (Live)
  add(sale) {
    if (this._sales.some(s => s.id === sale.id)) return false
    this._sales.unshift(sale)
    this._dirty = true
    this._schedSave()
    return true
  }

  // Viele Sales auf einmal (historischer Scan)
  bulkAdd(sales) {
    let added = 0
    const ids = new Set(this._sales.map(s => s.id))
    for (const s of sales) {
      if (ids.has(s.id)) continue
      this._sales.push(s)
      ids.add(s.id)
      added++
    }
    if (added > 0) {
      this._sales.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      this._dirty = true
      this._schedSave()
    }
    return added
  }

  _saveTimer = null
  _schedSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer)
    this._saveTimer = setTimeout(() => this.save(), 2000)
  }

  getAll()   { return this._sales }
  get count(){ return this._sales.length }

  buildStats() {
    const sales = this._sales
    if (!sales.length) return this._emptyStats()

    const totalRevenue = sales.reduce((s, x) => s + (x.totalPrice || 0), 0)
    const totalItems   = sales.reduce((s, x) => s + (x.count || 1), 0)

    // Daily
    const dailyMap = {}
    for (const s of sales) {
      const d = s.date
      if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, sales: 0, items: 0 }
      dailyMap[d].revenue += s.totalPrice || 0
      dailyMap[d].sales++
      dailyMap[d].items += s.count || 1
    }
    const daily = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date))

    // Top Items
    const itemMap = {}
    for (const s of sales) {
      const id = s.templateId
      if (!itemMap[id]) itemMap[id] = { templateId: id, name: s.itemName, revenue: 0, count: 0 }
      itemMap[id].revenue += s.totalPrice || 0
      itemMap[id].count++
    }
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Streak
    const today = new Date().toISOString().slice(0, 10)
    let streak = 0
    let d = new Date()
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10)
      if (dailyMap[key]?.revenue > 0) streak++
      else if (i > 0) break
      d.setDate(d.getDate() - 1)
    }

    // Buyer stats
    const buyers = new Set(sales.map(s => s.buyer).filter(Boolean))

    return {
      totalRevenue,
      totalSales: sales.length,
      totalItems,
      daily,
      topItems,
      streak,
      uniqueBuyers: buyers.size,
    }
  }

  _emptyStats() {
    return {
      totalRevenue: 0, totalSales: 0, totalItems: 0,
      daily: [], topItems: [], streak: 0, uniqueBuyers: 0,
    }
  }
}

module.exports = new SaleStore()
