/* DECIDO tarayıcı eklentisi — aktif sekmedeki ürünü /api/capture'a gönderir.
   Canlı sayfadan (kullanıcının tarayıcısında render olmuş) OG/JSON-LD okuyarak
   sunucu-taraflı bot bloklarını (H&M vb.) atlar. */

const $ = (id) => document.getElementById(id)

/** Sayfa bağlamında çalışır (chrome.scripting.executeScript ile inject edilir). */
function pageExtract() {
  const meta = (p) =>
    document.querySelector(`meta[property="${p}"]`)?.content ||
    document.querySelector(`meta[name="${p}"]`)?.content ||
    null

  let title = meta('og:title') || document.title || null
  let imageUrl = meta('og:image') || meta('og:image:url') || null
  let description = meta('og:description') || meta('description') || null
  let priceRaw = meta('product:price:amount') || meta('og:price:amount') || null
  let currency = meta('product:price:currency') || meta('og:price:currency') || null

  try {
    for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
      let data
      try { data = JSON.parse(el.textContent) } catch { continue }
      const nodes = Array.isArray(data) ? data : data['@graph'] || [data]
      for (const n of nodes) {
        if (!n || typeof n !== 'object') continue
        const t = n['@type']
        const isProduct = t === 'Product' || (Array.isArray(t) && t.includes('Product'))
        if (!isProduct) continue
        title = title || n.name || null
        const img = Array.isArray(n.image) ? n.image[0] : n.image
        imageUrl = imageUrl || (typeof img === 'string' ? img : img?.url) || null
        description = description || n.description || null
        const offers = Array.isArray(n.offers) ? n.offers[0] : n.offers
        if (offers) {
          priceRaw = priceRaw ?? offers.price ?? offers.lowPrice ?? null
          currency = currency || offers.priceCurrency || null
        }
      }
    }
  } catch { /* yoksay */ }

  // Fiyatı sayıya çevir ("1.299,00 TL" / "$1,299.00" / 1299).
  let price = null
  if (priceRaw != null) {
    let c = String(priceRaw).replace(/[^\d.,]/g, '')
    if (c.includes(',') && c.includes('.')) {
      c = c.lastIndexOf(',') > c.lastIndexOf('.')
        ? c.replace(/\./g, '').replace(',', '.')
        : c.replace(/,/g, '')
    } else if (c.includes(',')) {
      c = c.replace(',', '.')
    }
    const n = parseFloat(c)
    price = Number.isFinite(n) ? n : null
  }

  return { title, imageUrl, description, price, currency }
}

async function loadSettings() {
  const { endpoint, apikey } = await chrome.storage.sync.get(['endpoint', 'apikey'])
  if (endpoint) $('endpoint').value = endpoint
  if (apikey) $('apikey').value = apikey
  // Ayar yoksa paneli açık göster.
  if (!endpoint || !apikey) $('settings').open = true
}

$('save').addEventListener('click', async () => {
  const endpoint = $('endpoint').value.trim().replace(/\/$/, '')
  const apikey = $('apikey').value.trim()
  await chrome.storage.sync.set({ endpoint, apikey })
  $('status').textContent = 'Ayarlar kaydedildi.'
})

$('capture').addEventListener('click', async () => {
  const { endpoint, apikey } = await chrome.storage.sync.get(['endpoint', 'apikey'])
  if (!endpoint || !apikey) {
    $('status').textContent = 'Önce ayarları doldur.'
    $('settings').open = true
    return
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url) {
    $('status').textContent = 'Sekme URL’i okunamadı.'
    return
  }

  // Canlı sayfadan OG/JSON-LD oku — sunucu bot-bloğunu atlar (H&M vb.).
  let extracted = null
  try {
    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: pageExtract,
    })
    extracted = result ?? null
  } catch {
    // İzin yok / chrome:// sayfası → sunucu çıkarımına düş.
  }

  $('status').textContent = 'Ekleniyor…'
  try {
    const res = await fetch(`${endpoint}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apikey },
      body: JSON.stringify({ url: tab.url, source: 'extension', extracted }),
    })
    if (res.status === 201) $('status').textContent = '✓ Eklendi'
    else if (res.status === 200) $('status').textContent = '↻ Zaten listende'
    else if (res.status === 401) $('status').textContent = '⚠ API anahtarı hatalı'
    else $('status').textContent = '⚠ Eklenemedi (' + res.status + ')'
  } catch (e) {
    $('status').textContent = '⚠ Bağlanılamadı: ' + e.message
  }
})

loadSettings()
