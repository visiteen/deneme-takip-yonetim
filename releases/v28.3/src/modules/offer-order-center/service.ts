import { supabase } from '../../lib/supabase'

export async function loadOfferOrderCenter(){
  const [orders, offers, exams, institutions] = await Promise.all([
    supabase.from('order_management_board').select('*').order('order_date',{ascending:false}),
    supabase.from('offers').select('*, institutions(name), offer_items(id,exam_id,quantity,unit_price,line_total,exams(exam_name,publisher,application_date,last_order_date))').order('created_at',{ascending:false}),
    supabase.from('exams').select('id,exam_code,publisher,exam_name,grade_level,exam_type,application_date,last_order_date,target_delivery_date,unit_price,is_active').eq('is_active',true).order('application_date'),
    supabase.from('institutions').select('id,code,name,city,district').eq('is_active',true).order('name')
  ])
  for(const r of [orders,offers,exams,institutions]) if(r.error) throw r.error
  return {orders:orders.data??[],offers:offers.data??[],exams:exams.data??[],institutions:institutions.data??[]}
}

export async function createOrder(institutionId:string,examId:string,quantity:number,notes?:string,overrideReason?:string){
 const {data,error}=await supabase.rpc('create_order_item_v2',{p_institution_id:institutionId,p_exam_id:examId,p_quantity:quantity,p_notes:notes||null,p_admin_override_reason:overrideReason||null})
 if(error) throw error; return data
}
export async function updateOrderQuantity(itemId:string,quantity:number,overrideReason?:string){
 const {data,error}=await supabase.rpc('update_order_item_quantity_v2',{p_order_item_id:itemId,p_new_quantity:quantity,p_admin_override_reason:overrideReason||null})
 if(error) throw error; return data
}
export async function approveOrder(orderId:string){const{data,error}=await supabase.rpc('admin_approve_order_v1',{p_order_id:orderId});if(error)throw error;return data}
export async function rejectOrder(orderId:string,reason:string){const{data,error}=await supabase.rpc('admin_reject_order_v1',{p_order_id:orderId,p_reason:reason});if(error)throw error;return data}
export async function convertOfferToOrder(offerId:string,overrideReason?:string){const{data,error}=await supabase.rpc('convert_offer_to_order_v1',{p_offer_id:offerId,p_admin_override_reason:overrideReason||null});if(error)throw error;return data}
export async function createOffer(institutionId:string,examId:string,quantity:number,unitPrice:number,validUntil?:string,notes?:string){const{data,error}=await supabase.rpc('create_offer_v1',{p_institution_id:institutionId,p_exam_id:examId,p_quantity:quantity,p_unit_price:unitPrice,p_valid_until:validUntil||null,p_notes:notes||null});if(error)throw error;return data}