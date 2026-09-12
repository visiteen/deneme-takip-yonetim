import {useMemo,useState} from 'react'
import type {ProcurementNeed,OpenProcurementItem} from './types'
import {createProcurementFromNeed,receiveProcurementGoods} from './service'
import {openProcurementPdf} from './procurementPdf'
import {formatDateTR} from '../exam-calendar/dateLogic'

function statusText(v:string){
  if(v==='siparis_verildi') return 'Sipariş Verildi'
  if(v==='kismi_mal_kabul') return 'Kısmi Mal Kabul'
  if(v==='tamamlandi') return 'Tamamlandı'
  if(v==='iptal') return 'İptal'
  return 'Taslak'
}

export function ProcurementPage({
  rows,
  openItems,
  onRefresh
}:{
  rows:ProcurementNeed[]
  openItems:OpenProcurementItem[]
  onRefresh?:()=>Promise<void>|void
}){
  const [onlyNeed,setOnlyNeed]=useState(true)
  const [search,setSearch]=useState('')
  const [busy,setBusy]=useState<string|null>(null)
  const [message,setMessage]=useState('')
  const [receiptQty,setReceiptQty]=useState<Record<string,string>>({})
  const [referenceNo,setReferenceNo]=useState<Record<string,string>>({})

  const filtered=useMemo(()=>rows.filter(r=>
    (!onlyNeed||r.procurement_need_qty>0)&&
    (!search||[r.publisher,r.exam_name,r.exam_code].join(' ').toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')))
  ),[rows,onlyNeed,search])

  const activeItems=useMemo(()=>openItems.filter(x=>
    x.procurements.status!=='tamamlandi' && x.procurements.status!=='iptal'
  ),[openItems])

  const total=filtered.reduce((s,r)=>s+r.procurement_need_qty,0)

  async function create(r:ProcurementNeed){
    try{
      setBusy(r.exam_id);setMessage('')
      await createProcurementFromNeed(
        r.exam_id,
        r.procurement_need_qty,
        r.target_delivery_date??undefined,
        `${r.exam_code} için sistem tarafından önerilen satınalma`
      )
      setMessage(`${r.publisher} · ${r.exam_name}: ${r.procurement_need_qty} adet satınalma oluşturuldu. Açık Satınalmalar bölümünden PDF çıktısı alabilirsiniz.`)
      await onRefresh?.()
    }catch(e:any){setMessage(e?.message??'Satınalma oluşturulamadı.')}
    finally{setBusy(null)}
  }

  async function receive(item:OpenProcurementItem){
    const qty=Number(receiptQty[item.id]??0)
    if(!Number.isFinite(qty)||qty<=0){setMessage('Mal kabul miktarı 0 dan büyük olmalıdır.');return}
    try{
      setBusy(`receipt-${item.id}`);setMessage('')
      await receiveProcurementGoods(item.id,qty,referenceNo[item.id]||undefined,'Panel üzerinden mal kabul')
      setMessage(`${item.procurements.procurement_no}: ${qty} adet mal kabul edildi ve fiziksel stok güncellendi.`)
      setReceiptQty(v=>({...v,[item.id]:''}))
      setReferenceNo(v=>({...v,[item.id]:''}))
      await onRefresh?.()
    }catch(e:any){setMessage(e?.message??'Mal kabul işlemi yapılamadı.')}
    finally{setBusy(null)}
  }

  return <section>
    <div className="page-head"><div><h2>Satınalma</h2><p>Stok açığını satınalmaya dönüştür, yayınevine PDF ile bildir ve gelen ürünleri mal kabul ile stoğa al.</p></div><span className="record-count">{activeItems.length} açık satınalma</span></div>

    {message&&<div className="action-message">{message}</div>}

    <div className="procurement-section-title"><div><span>01</span><div><h3>Satınalma İhtiyacı</h3><p>Onaylı rezervasyonları fiziksel stok ve yoldaki satınalmalarla karşılaştırır.</p></div></div></div>
    <div className="procurement-summary">
      <div><span>Satınalma Gereken Deneme</span><b>{filtered.filter(r=>r.procurement_need_qty>0).length}</b></div>
      <div><span>Toplam Açık Adet</span><b>{total.toLocaleString('tr-TR')}</b></div>
      <div><span>Yoldaki Açık Satınalma</span><b>{filtered.reduce((s,r)=>s+r.open_procurement_qty,0).toLocaleString('tr-TR')}</b></div>
    </div>

    <div className="card procurement-card">
      <div className="procurement-filters">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Yayın, deneme veya kod ara..."/>
        <label><input type="checkbox" checked={onlyNeed} onChange={e=>setOnlyNeed(e.target.checked)}/> Sadece satınalma gerekenler</label>
      </div>
      <div className="table-scroll"><table>
        <thead><tr><th>Yayın / Deneme</th><th>Uygulama</th><th>Fiziksel Stok</th><th>Rezerve</th><th>Kullanılabilir</th><th>Açık Satınalma</th><th>Net İhtiyaç</th><th>Durum</th><th>Aksiyon</th></tr></thead>
        <tbody>{filtered.map(r=><tr key={r.exam_id} className={r.procurement_need_qty>0?'procurement-critical':''}>
          <td><div className="exam-title"><b>{r.publisher}</b><span>{r.exam_name}</span><small>{r.exam_code} · {r.grade_level} · {r.exam_type}</small></div></td>
          <td>{formatDateTR(r.application_date)}</td><td><b>{r.physical_stock}</b></td><td><b>{r.reserved_stock}</b></td>
          <td><b className={r.available_stock<0?'negative-stock':''}>{r.available_stock}</b></td><td>{r.open_procurement_qty}</td>
          <td><b className="need-qty">{r.procurement_need_qty}</b></td>
          <td><span className={`status-pill ${r.procurement_state==='satinalma_gerekli'?'critical':r.procurement_state==='satinalma_acik'?'warning':'ok'}`}>{r.procurement_state==='satinalma_gerekli'?'Satınalma Gerekli':r.procurement_state==='satinalma_acik'?'Satınalma Açık':'Stok Yeterli'}</span></td>
          <td>{r.procurement_need_qty>0?<button disabled={busy===r.exam_id} onClick={()=>create(r)}>{busy===r.exam_id?'Oluşturuluyor...':'Satınalma Oluştur'}</button>:<span className="muted-text">—</span>}</td>
        </tr>)}</tbody>
      </table></div>
      {filtered.length===0&&<div className="empty-state"><b>Açık satınalma ihtiyacı yok</b><p>Mevcut stok ve açık satınalmalar rezervasyonları karşılıyor.</p></div>}
    </div>

    <div className="procurement-section-title second"><div><span>02</span><div><h3>Açık Satınalmalar / Mal Kabul</h3><p>Oluşturulan satınalma siparişlerinin PDF çıktısını al, yayınevine ilet ve gelen miktarı fiziksel stoğa kabul et.</p></div></div></div>

    <div className="open-procurement-list">
      {activeItems.map(item=>{
        const p=item.procurements,e=item.exams
        const remaining=Math.max(0,Number(item.ordered_quantity)-Number(item.received_quantity))
        const pct=Math.min(100,Math.round((Number(item.received_quantity)/Number(item.ordered_quantity))*100))
        return <article className="card open-procurement-card" key={item.id}>
          <div className="procurement-card-head">
            <div><span className="proc-no">{p.procurement_no}</span><h3>{p.publisher}</h3><p>{e.exam_name} · {e.exam_code}</p></div>
            <span className={`status-pill ${p.status==='kismi_mal_kabul'?'warning':'info'}`}>{statusText(p.status)}</span>
          </div>
          <div className="purchase-meta">
            <div><span>Sipariş</span><b>{item.ordered_quantity} adet</b></div>
            <div><span>Mal Kabul</span><b>{item.received_quantity} adet</b></div>
            <div><span>Kalan</span><b>{remaining} adet</b></div>
            <div><span>Beklenen Tarih</span><b>{formatDateTR(p.expected_receipt_date)}</b></div>
          </div>
          <div className="receipt-progress"><div style={{width:`${pct}%`}}></div></div>
          <div className="procurement-actions">
            <button className="pdf-button" onClick={()=>openProcurementPdf(item)}>Satınalma PDF</button>
            <div className="receipt-form">
              <input type="number" min="1" max={remaining} value={receiptQty[item.id]??''} onChange={ev=>setReceiptQty(v=>({...v,[item.id]:ev.target.value}))} placeholder={`Mal kabul (max ${remaining})`}/>
              <input value={referenceNo[item.id]??''} onChange={ev=>setReferenceNo(v=>({...v,[item.id]:ev.target.value}))} placeholder="İrsaliye / Referans No"/>
              <button disabled={busy===`receipt-${item.id}`||remaining<=0} onClick={()=>receive(item)}>{busy===`receipt-${item.id}`?'Kaydediliyor...':'Mal Kabul Yap'}</button>
            </div>
          </div>
        </article>
      })}
      {activeItems.length===0&&<div className="card empty-state"><b>Açık satınalma bulunmuyor</b><p>Yeni satınalma oluşturulduğunda burada PDF ve mal kabul aksiyonları açılır.</p></div>}
    </div>
  </section>
}
