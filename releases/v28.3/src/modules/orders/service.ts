import { supabase } from '../../lib/supabase'
import type { OrderRow } from './types'

export async function listOrderRows(): Promise<OrderRow[]> {
  const { data, error } = await supabase.from('order_items').select(`id, order_id, exam_id, quantity, previous_quantity, unit_price, line_total, exams!inner(exam_code,publisher,exam_name,grade_level,exam_type,application_date,last_order_date,target_delivery_date), orders!inner(id,order_no,institution_id,source,status,admin_approval,order_date,approved_at,institutions!inner(name,code), operations(status,planned_delivery_date), payments(amount))`)
  if (error) throw error
  return ((data ?? []) as any[]).map((item:any) => {
    const order = Array.isArray(item.orders) ? item.orders[0] : item.orders; const exam = Array.isArray(item.exams) ? item.exams[0] : item.exams
    const institution = Array.isArray(order?.institutions) ? order.institutions[0] : order?.institutions; const operation = Array.isArray(order?.operations) ? order.operations[0] : order?.operations
    const payments = Array.isArray(order?.payments) ? order.payments : (order?.payments ? [order.payments] : []); const paid = payments.reduce((sum:number,p:any)=>sum + Number(p?.amount ?? 0),0)
    return {item_id:item.id,order_id:item.order_id,order_no:order?.order_no??'—',institution_id:order?.institution_id,institution_name:institution?.name??'Kurum',institution_code:institution?.code??null,source:order?.source??'kurum',status:order?.status??'siparis',admin_approval:order?.admin_approval??'bekliyor',order_date:order?.order_date,approved_at:order?.approved_at??null,exam_id:item.exam_id,exam_code:exam?.exam_code??'—',publisher:exam?.publisher??'—',exam_name:exam?.exam_name??'—',grade_level:exam?.grade_level??'—',exam_type:exam?.exam_type??'—',application_date:exam?.application_date,last_order_date:exam?.last_order_date,target_delivery_date:exam?.target_delivery_date??null,quantity:Number(item.quantity??0),previous_quantity:item.previous_quantity==null?null:Number(item.previous_quantity),unit_price:Number(item.unit_price??0),line_total:Number(item.line_total??(Number(item.quantity??0)*Number(item.unit_price??0))),operation_status:operation?.status??null,planned_delivery_date:operation?.planned_delivery_date??null,paid_amount:paid}
  }).sort((a,b)=>String(b.order_date).localeCompare(String(a.order_date)))
}
