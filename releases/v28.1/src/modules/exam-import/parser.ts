import * as XLSX from 'xlsx'
import type { ImportRow } from './types'

const normalizeHeader = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('tr-TR')

function excelDateToIso(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }
  const s = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function parseActive(value: unknown): boolean {
  const s = String(value ?? 'EVET').trim().toLocaleUpperCase('tr-TR')
  return !['HAYIR', 'FALSE', '0', 'PASİF', 'PASIF'].includes(s)
}

function validate(row: Omit<ImportRow, 'clientErrors'>): string[] {
  const errors: string[] = []
  if (!row.exam_code) errors.push('Deneme kodu zorunlu')
  if (!row.publisher) errors.push('Yayın zorunlu')
  if (!row.exam_name) errors.push('Deneme adı zorunlu')
  if (!row.grade_level) errors.push('Sınıf/kademe zorunlu')
  if (!row.exam_type) errors.push('Sınav türü zorunlu')
  if (!row.application_date) errors.push('Uygulama tarihi geçersiz')
  if (!row.last_order_date) errors.push('Son sipariş tarihi geçersiz')
  if (row.unit_price === null || Number.isNaN(row.unit_price) || row.unit_price < 0) errors.push('Birim fiyat geçersiz')
  if (row.application_date && row.last_order_date && row.last_order_date > row.application_date) errors.push('Son sipariş tarihi uygulama tarihinden sonra olamaz')
  if (row.application_date && row.target_delivery_date && row.target_delivery_date > row.application_date) errors.push('Teslim hedef tarihi uygulama tarihinden sonra olamaz')
  return errors
}

export async function parseExamWorkbook(file: File): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames.find((name) => normalizeHeader(name) === 'deneme_import') ?? wb.SheetNames[0]
  if (!sheetName) throw new Error('Excel dosyasında okunabilir sayfa bulunamadı.')
  const sheet = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const rows: ImportRow[] = raw.map((record, index) => {
    const keyed = Object.fromEntries(Object.entries(record).map(([k, v]) => [normalizeHeader(k), v]))
    const base = {
      rowNo: index + 2,
      exam_code: String(keyed['deneme_kodu'] ?? '').trim(),
      publisher: String(keyed['yayin'] ?? '').trim(),
      exam_name: String(keyed['deneme_adi'] ?? '').trim(),
      grade_level: String(keyed['sinif_kademe'] ?? '').trim(),
      exam_type: String(keyed['sinav_turu'] ?? '').trim(),
      application_date: excelDateToIso(keyed['uygulama_tarihi']),
      last_order_date: excelDateToIso(keyed['son_siparis_tarihi']),
      target_delivery_date: excelDateToIso(keyed['teslim_hedef_tarihi']),
      unit_price: keyed['birim_fiyat'] === '' ? null : Number(keyed['birim_fiyat']),
      is_active: parseActive(keyed['aktif']),
      notes: String(keyed['not'] ?? '').trim() || null,
    }
    return { ...base, clientErrors: validate(base) }
  })
  const counts = new Map<string, number>()
  rows.forEach((r) => r.exam_code && counts.set(r.exam_code, (counts.get(r.exam_code) ?? 0) + 1))
  rows.forEach((r) => { if (r.exam_code && (counts.get(r.exam_code) ?? 0) > 1) r.clientErrors.push('Dosya içinde aynı deneme kodu tekrar ediyor') })
  return rows.filter((r) => Object.values(r).some((v) => v !== '' && v !== null))
}
