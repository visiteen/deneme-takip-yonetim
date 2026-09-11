import { useMemo, useState } from 'react'
import { parseExamWorkbook } from './parser'
import { commitBatch, createImportBatch, getBatchRows, insertImportRows, validateBatch } from './service'
import type { ImportRow } from './types'

export function ExamImport({ userId, onImported }: { userId: string; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [serverRows, setServerRows] = useState<any[]>([])
  const [batchId, setBatchId] = useState<string | null>(null)
  const [stage, setStage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const clientInvalid = useMemo(() => rows.filter(r => r.clientErrors.length).length, [rows])

  async function chooseFile(f: File | null) {
    if (!f) return
    setBusy(true); setMessage(''); setServerRows([]); setBatchId(null)
    try {
      const parsed = await parseExamWorkbook(f)
      setFile(f); setRows(parsed); setStage(2)
      setMessage(`${parsed.length} satır okundu.`)
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Dosya okunamadı') }
    finally { setBusy(false) }
  }

  async function validateServer() {
    if (!file || rows.length===0) return
    if (clientInvalid > 0) { setMessage('Önce Excel içindeki istemci doğrulama hatalarını düzeltin.'); return }
    setBusy(true); setMessage('')
    try {
      const id = await createImportBatch(file.name, userId)
      await insertImportRows(id, rows)
      const counts = await validateBatch(id)
      const details = await getBatchRows(id)
      setBatchId(id); setServerRows(details); setStage(3)
      setMessage(`Sunucu doğrulaması tamamlandı: ${counts.valid_rows} geçerli, ${counts.invalid_rows} hatalı.`)
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Doğrulama başarısız') }
    finally { setBusy(false) }
  }

  async function commit() {
    if (!batchId) return
    setBusy(true); setMessage('')
    try {
      const count = await commitBatch(batchId)
      setStage(4); setMessage(`${count} deneme başarıyla veritabanına aktarıldı.`); onImported()
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Aktarım başarısız') }
    finally { setBusy(false) }
  }

  const serverInvalid = serverRows.filter(r => !r.is_valid).length
  return <section>
    <div className="page-head"><div><h2>Deneme Takvimi / Toplu Import</h2><p>Excel dosyasını güvenli doğrulama sürecinden geçirerek merkezi Deneme Takvimi'ne aktar.</p></div></div>
    <div className="steps">{['Dosya Seç','Ön İzleme','Doğrulama','Aktar'].map((s,i)=><div className={`step ${stage>=i+1?'done':''}`} key={s}><span>{i+1}</span>{s}</div>)}</div>
    <div className="stats"><div><b>{rows.length}</b><span>Toplam Satır</span></div><div><b>{rows.length-clientInvalid}</b><span>İstemci Geçerli</span></div><div><b>{clientInvalid}</b><span>İstemci Hatalı</span></div><div><b>{serverRows.length ? serverRows.length-serverInvalid : '-'}</b><span>Sunucu Geçerli</span></div></div>
    <div className="card upload-card"><input id="xlsx" type="file" accept=".xlsx,.xls" onChange={e=>chooseFile(e.target.files?.[0] ?? null)} /><label htmlFor="xlsx" className="file-button">Excel Dosyası Seç</label><span>{file?.name ?? 'Henüz dosya seçilmedi'}</span></div>
    {message && <div className="notice">{message}</div>}
    {rows.length>0 && <div className="card table-wrap"><div className="toolbar"><strong>Ön İzleme</strong><button className="primary" disabled={busy || stage>=3} onClick={validateServer}>Sunucuda Doğrula</button>{stage===3 && <button className="success" disabled={busy || serverInvalid>0} onClick={commit}>Veritabanına Aktar</button>}</div><table><thead><tr><th>Satır</th><th>Kod</th><th>Yayın</th><th>Deneme</th><th>Kademe</th><th>Tür</th><th>Uygulama</th><th>Son Sipariş</th><th>Fiyat</th><th>Durum</th></tr></thead><tbody>{rows.map(r=>{const srv=serverRows.find(x=>x.row_no===r.rowNo); const errors=srv?.errors ?? r.clientErrors; return <tr key={r.rowNo} className={errors?.length?'row-error':''}><td>{r.rowNo}</td><td>{r.exam_code}</td><td>{r.publisher}</td><td>{r.exam_name}</td><td>{r.grade_level}</td><td>{r.exam_type}</td><td>{r.application_date}</td><td>{r.last_order_date}</td><td>{r.unit_price?.toLocaleString('tr-TR',{style:'currency',currency:'TRY'})}</td><td>{errors?.length ? <span className="badge bad" title={errors.join(' | ')}>{errors.length} hata</span> : <span className="badge ok">Geçerli</span>}</td></tr>})}</tbody></table></div>}
  </section>
}
