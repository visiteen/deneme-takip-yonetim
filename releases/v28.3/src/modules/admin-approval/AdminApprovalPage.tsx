import { useMemo, useState } from 'react'
import type { OrderRow } from '../orders/types'
import { approveOrder, rejectOrder } from './service'

export function AdminApprovalPage({rows,onChanged,onOpenOrders}:{rows:OrderRow[];onChanged:()=>Promise<void>;onOpenOrders?:(examId:string)=>void}){
 const pending=useMemo(()=>rows.filter(r=>r.admin_approval==='bekliyor'),[rows]); const [busy,setBusy]=useState<string|null>(null); const [rejecting,setRejecting]=useState<OrderRow|null>(null); const [reason,setReason]=useState('')
 const act=async(fn:()=>Promise<void>,id:string)=>{try{setBusy(id);await fn();await onChanged()}finally{setBusy(null)}}
 return <section><div className="page-title"><div><h1>Admin Onay</h1><p>Tüm yeni siparişler ve miktar değişiklikleri yönetici onayından geçer.</p></div><div className="badge">Bekleyen: {pending.length}</div></div>
 <div className="table-wrap"><table><thead><tr><th>Kurum</th><th>Deneme</th><th>Kaynak</th><th>Adet</th><th>Tutar</th><th>Son Sipariş</th><th>İşlem</th></tr></thead><tbody>{pending.map(r=><tr key={r.order_id}><td>{r.institution_name}</td><td><button className="link-button" onClick={()=>onOpenOrders?.(r.exam_id)}>{r.exam_name}</button><small>{r.publisher}</small></td><td>{r.source}</td><td>{r.quantity}</td><td>{Number(r.total_amount||0).toLocaleString('tr-TR')} TL</td><td>{r.last_order_date||'-'}</td><td className="actions"><button disabled={busy===r.order_id} onClick={()=>act(()=>approveOrder(r.order_id),r.order_id)}>Onayla</button><button className="danger" disabled={busy===r.order_id} onClick={()=>{setRejecting(r);setReason('')}}>Reddet</button></td></tr>)}{!pending.length&&<tr><td colSpan={7}>Onay bekleyen sipariş bulunmuyor.</td></tr>}</tbody></table></div>
 {rejecting&&<div className="modal-backdrop"><div className="modal"><h3>Siparişi Reddet</h3><p><b>{rejecting.institution_name}</b> · {rejecting.exam_name}</p><label>Red nedeni<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Kuruma ve kayıt geçmişine yansıyacak açıklama"/></label><div className="modal-actions"><button onClick={()=>setRejecting(null)}>Vazgeç</button><button className="danger" disabled={!reason.trim()||busy===rejecting.order_id} onClick={()=>act(()=>rejectOrder(rejecting.order_id,reason.trim()),rejecting.order_id).then(()=>setRejecting(null))}>Reddi Kaydet</button></div></div></div>}
 </section>
}
