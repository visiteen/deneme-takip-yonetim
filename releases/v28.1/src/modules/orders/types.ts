export type OrderRow = {
  item_id:string; order_id:string; order_no:string; institution_id:string; institution_name:string; institution_code:string|null;
  source:'admin'|'kurum'; status:'teklif'|'siparis'|'planlandi'|'teslim'|'iptal'; admin_approval:'bekliyor'|'onaylandi'|'reddedildi';
  order_date:string; approved_at:string|null; exam_id:string; exam_code:string; publisher:string; exam_name:string; grade_level:string; exam_type:string;
  application_date:string; last_order_date:string; target_delivery_date:string|null; quantity:number; previous_quantity:number|null; unit_price:number; line_total:number;
  operation_status:string|null; planned_delivery_date:string|null; paid_amount:number
}
