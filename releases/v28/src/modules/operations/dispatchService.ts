import { supabase } from '../../lib/supabase'
import type { DispatchOperation } from './dispatchTypes'
export async function listDispatchOperations():Promise<DispatchOperation[]>{const{data,error}=await supabase.from('operations').select('id,order_id,status,planned_delivery_date,delivery_method,tracking_no,shipped_at,delivered_at,notes').order('planned_delivery_date',{ascending:true});if(error)throw error;return(data??[]) as DispatchOperation[]}
