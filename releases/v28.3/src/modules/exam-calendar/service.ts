import { supabase } from '../../lib/supabase'
import type { OperationalSignal } from './types'

export async function listOperationalSignals(): Promise<OperationalSignal[]> {
  const { data: items, error: itemError } = await supabase.from('order_items').select('exam_id,order_id,orders!inner(id,status,admin_approval)')
  if (itemError) throw itemError
  const { data: operations, error: opError } = await supabase.from('operations').select('order_id,status,planned_delivery_date')
  if (opError) throw opError
  const opMap = new Map((operations ?? []).map((o:any)=>[o.order_id,o]))
  const map = new Map<string, OperationalSignal>()
  const now = new Date(); const today = new Date(now.getFullYear(),now.getMonth(),now.getDate())
  for (const item of (items ?? []) as any[]) {
    const order = Array.isArray(item.orders) ? item.orders[0] : item.orders
    if (!order || order.status === 'iptal') continue
    const current = map.get(item.exam_id) ?? { exam_id:item.exam_id, open_order_count:0, pending_approval_count:0, incomplete_operation_count:0, delivery_risk_count:0 }
    if (order.status !== 'teslim') current.open_order_count++
    if (order.admin_approval === 'bekliyor') current.pending_approval_count++
    const op:any = opMap.get(item.order_id)
    if (!op || !['teslim','iptal'].includes(op.status)) current.incomplete_operation_count++
    if (op?.planned_delivery_date && !['teslim','iptal'].includes(op.status)) {
      const [y,m,d] = op.planned_delivery_date.split('-').map(Number); const planned = new Date(y,m-1,d)
      if (Math.ceil((planned.getTime()-today.getTime())/86400000) <= 2) current.delivery_risk_count++
    }
    map.set(item.exam_id,current)
  }
  return [...map.values()]
}
