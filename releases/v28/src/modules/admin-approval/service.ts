import { supabase } from '../../lib/supabase'
export async function approveOrder(orderId:string){const{error}=await supabase.rpc('admin_approve_order_v1',{p_order_id:orderId});if(error)throw error}
export async function rejectOrder(orderId:string,reason=''){const{error}=await supabase.rpc('admin_reject_order_v1',{p_order_id:orderId,p_reason:reason||null});if(error)throw error}
