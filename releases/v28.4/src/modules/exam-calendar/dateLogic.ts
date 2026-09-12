import type { Exam } from '../exam-import/types'

export type DateStatusKey = 'normal'|'approaching'|'critical'|'last-day'|'closed'|'application-soon'|'completed'

export type ExamCalendarState = {
  orderDaysLeft: number
  applicationDaysLeft: number
  deliveryDaysLeft: number | null
  status: DateStatusKey
  statusLabel: string
  warning: string
  severity: 'ok'|'info'|'warning'|'critical'|'muted'
  actionLabel?: string
}

function todayLocal(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function parseLocalDate(value: string | null): Date | null {
  if (!value) return null
  const [y,m,d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function diffDays(value: string | null, base = todayLocal()): number | null {
  const date = parseLocalDate(value)
  if (!date) return null
  return Math.ceil((date.getTime() - base.getTime()) / 86400000)
}

export function formatDateTR(value: string | null) {
  const d = parseLocalDate(value)
  return d ? d.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
}

export function getExamCalendarState(exam: Exam, now = todayLocal()): ExamCalendarState {
  const orderDaysLeft = diffDays(exam.last_order_date, now) ?? 99999
  const applicationDaysLeft = diffDays(exam.application_date, now) ?? 99999
  const deliveryDaysLeft = diffDays(exam.target_delivery_date, now)

  if (applicationDaysLeft < 0) {
    return { orderDaysLeft, applicationDaysLeft, deliveryDaysLeft, status:'completed', statusLabel:'Uygulandı', warning:'Deneme uygulama tarihi geçti.', severity:'muted' }
  }
  if (orderDaysLeft < 0) {
    if (applicationDaysLeft <= 5) return { orderDaysLeft, applicationDaysLeft, deliveryDaysLeft, status:'application-soon', statusLabel:'Uygulama Yaklaşıyor', warning:`Sipariş kapandı. Uygulamaya ${applicationDaysLeft} gün kaldı.`, severity:'warning', actionLabel:'Operasyonu Kontrol Et' }
    return { orderDaysLeft, applicationDaysLeft, deliveryDaysLeft, status:'closed', statusLabel:'Sipariş Kapandı', warning:`Son sipariş tarihi ${Math.abs(orderDaysLeft)} gün önce geçti.`, severity:'muted' }
  }
  if (orderDaysLeft === 0) return { orderDaysLeft, applicationDaysLeft, deliveryDaysLeft, status:'last-day', statusLabel:'Bugün Son Gün', warning:'Sipariş kabulü bugün sona eriyor.', severity:'critical', actionLabel:'Siparişleri Gör' }
  if (orderDaysLeft <= 3) return { orderDaysLeft, applicationDaysLeft, deliveryDaysLeft, status:'critical', statusLabel:'Kritik', warning:`Son siparişe ${orderDaysLeft} gün kaldı.`, severity:'critical', actionLabel:'Siparişleri Gör' }
  if (orderDaysLeft <= 7) return { orderDaysLeft, applicationDaysLeft, deliveryDaysLeft, status:'approaching', statusLabel:'Yaklaşıyor', warning:`Son siparişe ${orderDaysLeft} gün kaldı.`, severity:'warning', actionLabel:'Siparişleri Gör' }
  return { orderDaysLeft, applicationDaysLeft, deliveryDaysLeft, status:'normal', statusLabel:'Normal', warning:`Son siparişe ${orderDaysLeft} gün var.`, severity:'ok' }
}

export function isThisWeekApplication(exam: Exam, now = todayLocal()) {
  const days = diffDays(exam.application_date, now)
  return days !== null && days >= 0 && days <= 7
}

export function isOrderApproaching(exam: Exam, now = todayLocal()) {
  const days = diffDays(exam.last_order_date, now)
  return days !== null && days >= 0 && days <= 7
}

export function isOrderClosed(exam: Exam, now = todayLocal()) {
  const days = diffDays(exam.last_order_date, now)
  const app = diffDays(exam.application_date, now)
  return days !== null && days < 0 && app !== null && app >= 0
}
