export type ImportRow = {
  rowNo: number
  exam_code: string
  publisher: string
  exam_name: string
  grade_level: string
  exam_type: string
  application_date: string | null
  last_order_date: string | null
  target_delivery_date: string | null
  unit_price: number | null
  is_active: boolean
  notes: string | null
  clientErrors: string[]
}

export type Exam = {
  id: string
  exam_code: string
  publisher: string
  exam_name: string
  grade_level: string
  exam_type: string
  application_date: string
  last_order_date: string
  target_delivery_date: string | null
  unit_price: number
  is_active: boolean
  notes: string | null
}
