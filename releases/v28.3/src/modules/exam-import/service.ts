import { supabase } from '../../lib/supabase'
import type { Exam, ImportRow } from './types'

export async function getCurrentProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) return null
  const { data, error } = await supabase.from('profiles').select('id, full_name, role, institution_id, is_active').eq('id', userData.user.id).single()
  if (error) throw error
  return data
}

export async function listExams(): Promise<Exam[]> {
  const { data, error } = await supabase.from('exams').select('*').order('application_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as Exam[]
}

export async function createImportBatch(fileName: string, userId: string) {
  const { data, error } = await supabase.from('exam_import_batches').insert({ file_name: fileName, created_by: userId }).select('id').single()
  if (error) throw error
  return data.id as string
}

export async function insertImportRows(batchId: string, rows: ImportRow[]) {
  const payload = rows.map((r) => ({
    batch_id: batchId,
    row_no: r.rowNo,
    exam_code: r.exam_code || null,
    publisher: r.publisher || null,
    exam_name: r.exam_name || null,
    grade_level: r.grade_level || null,
    exam_type: r.exam_type || null,
    application_date: r.application_date,
    last_order_date: r.last_order_date,
    target_delivery_date: r.target_delivery_date,
    unit_price: r.unit_price,
    is_active: r.is_active,
    notes: r.notes,
  }))
  const { error } = await supabase.from('exam_import_rows').insert(payload)
  if (error) throw error
}

export async function validateBatch(batchId: string) {
  const { data, error } = await supabase.rpc('validate_exam_import_batch', { p_batch_id: batchId })
  if (error) throw error
  return data?.[0] ?? { total_rows: 0, valid_rows: 0, invalid_rows: 0 }
}

export async function getBatchRows(batchId: string) {
  const { data, error } = await supabase.from('exam_import_rows').select('row_no,is_valid,errors,exam_code,publisher,exam_name').eq('batch_id', batchId).order('row_no')
  if (error) throw error
  return data ?? []
}

export async function commitBatch(batchId: string) {
  const { data, error } = await supabase.rpc('commit_exam_import_batch', { p_batch_id: batchId })
  if (error) throw error
  return Number(data ?? 0)
}
