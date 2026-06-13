// ── TOAST SYSTEM ──────────────────────────
let _toastContainer = null

function getToastContainer() {
  if (_toastContainer) return _toastContainer
  _toastContainer = document.createElement('div')
  _toastContainer.id = 'toast-container'
  _toastContainer.style.cssText = `
    position: fixed; bottom: 32px; right: 16px;
    display: flex; flex-direction: column-reverse; gap: 8px;
    z-index: 9999; pointer-events: none;
  `
  document.body.appendChild(_toastContainer)
  return _toastContainer
}

function showToast({ icon = '', title = '', sub = '', tag = '', duration = 4000, color = '' }) {
  const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim()
  const c  = color || ac

  const el = document.createElement('div')
  el.style.cssText = `
    background: #1e1e1e;
    border: 1px solid rgba(255,255,255,0.1);
    border-left: 3px solid ${c};
    border-radius: 10px;
    padding: 10px 14px;
    display: flex; align-items: center; gap: 10px;
    pointer-events: all;
    min-width: 260px; max-width: 320px;
    animation: toastIn .25s ease;
    cursor: pointer;
  `

  el.innerHTML = `
    <style>
      @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }
      @keyframes toastOut { to { opacity:0; transform:translateX(20px); } }
    </style>
    ${icon
      ? `<img src="${icon}" style="width:32px;height:32px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`
      : `<div style="width:32px;height:32px;border-radius:6px;background:${c}22;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px">💰</div>`
    }
    <div style="flex:1;min-width:0">
      ${tag ? `<div style="font-size:9px;font-weight:700;color:${c};letter-spacing:1px;margin-bottom:2px">${tag}</div>` : ''}
      <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>
      ${sub ? `<div style="font-size:11px;color:${c};font-weight:700;margin-top:1px">${sub}</div>` : ''}
    </div>
    <div style="font-size:12px;color:rgba(255,255,255,0.3);cursor:pointer;padding:2px 4px" onclick="this.closest('[style]').remove()">×</div>
  `

  el.addEventListener('click', () => remove())
  getToastContainer().appendChild(el)

  const remove = () => {
    el.style.animation = 'toastOut .2s ease forwards'
    setTimeout(() => el.remove(), 200)
  }

  setTimeout(remove, duration)
  return el
}
