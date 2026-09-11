import { supabase } from '../../lib/supabase'

export async function loadOperationCenter(){
 const {data:rows,error}=await supabase.from('operation_management_board').select('*').order('target_delivery_date',{ascending:true}); if(error)throw error
 const all=(rows??[]) as any[]
 return {rows:all,summary:{total:all.length,ready:all.filter(x=>x.readiness_status==='hazir'||x.status==='dagitima_hazir').length,inDistribution:all.filter(x=>x.status==='dagitimda').length,delivered:all.filter(x=>x.status==='teslim').length,risk:all.filter(x=>x.delivery_risk===true||x.readiness_status==='risk').length}}
}
export async function startDispatch(operationId:string,method:string,trackingNo:string|null,notes:string|null){const{error}=await supabase.rpc('start_operation_dispatch_v1',{p_operation_id:operationId,p_delivery_method:method,p_tracking_no:trackingNo,p_notes:notes});if(error)throw error}
export async function markDelivered(operationId:string,notes:string|null){const{error}=await supabase.rpc('mark_operation_delivered_v1',{p_operation_id:operationId,p_notes:notes});if(error)throw error}
export async function createOperationException(operationId:string,type:string,description:string){const{error}=await supabase.rpc('create_operation_exception_v1',{p_operation_id:operationId,p_exception_type:type,p_description:description});if(error)throw error}
