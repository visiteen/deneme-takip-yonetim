import type { OpenProcurementItem } from './types'

function esc(value: unknown) {
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;')
}

function trDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('tr-TR')
}

export function openProcurementPdf(item: OpenProcurementItem) {
  const p = item.procurements
  const e = item.exams
  const remaining = Math.max(0, Number(item.ordered_quantity) - Number(item.received_quantity))
  const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>${esc(p.procurement_no)} Satınalma Siparişi</title>
<style>
@page{size:A4;margin:14mm}
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;color:#152034;margin:0;font-size:12px}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #152034;padding-bottom:14px;margin-bottom:20px}
.brand h1{margin:0;font-size:22px}.brand p{margin:4px 0 0;color:#526072}.doc{text-align:right}.doc b{font-size:17px}.doc span{display:block;color:#526072;margin-top:4px}
.box{border:1px solid #d7dee8;border-radius:8px;padding:12px;margin-bottom:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}.field span{display:block;color:#667085;font-size:10px;text-transform:uppercase;letter-spacing:.03em}.field b{display:block;margin-top:3px;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#f3f5f8;text-align:left;padding:9px;border:1px solid #d7dee8;font-size:10px}td{padding:10px 9px;border:1px solid #d7dee8;vertical-align:top}
.qty{text-align:right;font-weight:700}.footer{margin-top:26px;border-top:1px solid #d7dee8;padding-top:12px;color:#667085;font-size:10px;line-height:1.5}
.actions{position:fixed;right:16px;top:16px}@media print{.actions{display:none}}
button{background:#152034;color:white;border:0;border-radius:6px;padding:8px 12px;font-weight:700;cursor:pointer}
</style></head><body>
<div class="actions"><button onclick="window.print()">PDF / Yazdır</button></div>
<div class="header"><div class="brand"><h1>Zengin Kitabevi</h1><p>Deneme Takip Yönetim Sistemi</p></div>
<div class="doc"><b>SATINALMA SİPARİŞ FORMU</b><span>${esc(p.procurement_no)}</span></div></div>
<div class="box"><div class="grid">
<div class="field"><span>Yayınevi</span><b>${esc(p.publisher)}</b></div>
<div class="field"><span>Sipariş Tarihi</span><b>${trDate(p.order_date)}</b></div>
<div class="field"><span>Beklenen Mal Kabul</span><b>${trDate(p.expected_receipt_date)}</b></div>
<div class="field"><span>Durum</span><b>${esc(p.status.replaceAll('_',' ').toLocaleUpperCase('tr-TR'))}</b></div>
</div></div>
<table><thead><tr><th>Deneme Kodu</th><th>Yayın / Deneme</th><th>Kademe</th><th>Tür</th><th>Sipariş Adedi</th></tr></thead>
<tbody><tr><td>${esc(e.exam_code)}</td><td><b>${esc(e.publisher)}</b><br>${esc(e.exam_name)}</td><td>${esc(e.grade_level)}</td><td>${esc(e.exam_type)}</td><td class="qty">${esc(item.ordered_quantity)}</td></tr></tbody></table>
<div class="box" style="margin-top:14px"><div class="grid">
<div class="field"><span>Mal Kabul Edilen</span><b>${esc(item.received_quantity)} adet</b></div>
<div class="field"><span>Kalan Açık Miktar</span><b>${esc(remaining)} adet</b></div>
</div></div>
<div class="box"><b>Notlar</b><p>${esc(p.notes || 'Bu belge Zengin Kitabevi Deneme Takip Yönetim Sistemi üzerinden oluşturulmuştur.')}</p></div>
<div class="footer">Bu satınalma formu ilgili yayınevine sipariş bildirimi amacıyla hazırlanmıştır.<br>İleri fazda aynı satınalma kaydı üzerinden otomatik PDF üretimi ve e-posta gönderim akışı çalıştırılabilir.</div>
<script>setTimeout(()=>window.print(),300)</script>
</body></html>`
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) throw new Error('PDF penceresi açılamadı. Tarayıcı açılır pencere engelini kontrol edin.')
  w.document.open()
  w.document.write(html)
  w.document.close()
}
