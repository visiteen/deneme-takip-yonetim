import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Login } from './components/Login'
import { ExamImport } from './modules/exam-import/ExamImport'
import { getCurrentProfile, listExams } from './modules/exam-import/service'
import type { Exam } from './modules/exam-import/types'
import { ExamCalendar } from './modules/exam-calendar/ExamCalendar'
import { listOperationalSignals } from './modules/exam-calendar/service'
import type { OperationalSignal } from './modules/exam-calendar/types'
import { listOrderRows } from './modules/orders/service'
import type { OrderRow } from './modules/orders/types'
import { AdminApprovalPage } from './modules/admin-approval/AdminApprovalPage'
import { FinancePage } from './modules/finance/FinancePage'
import { listFinanceOrders } from './modules/finance/service'
import type { FinanceOrder } from './modules/finance/types'
import { listInstitutionCredits, listInstitutionCreditReceipts } from './modules/finance/creditService'
import type { InstitutionCredit, InstitutionCreditReceipt } from './modules/finance/creditTypes'
import { listAccountStatement } from './modules/finance/statementService'
import type { AccountStatementRow } from './modules/finance/statementTypes'
import { ExecutiveFinancePage } from './modules/executive-finance/ExecutiveFinancePage'
import { loadExecutiveFinance } from './modules/executive-finance/service'
import type { ExecutiveFinance, SupplierAccount, FinanceSignal } from './modules/executive-finance/types'
import { loadCashflow } from './modules/cashflow/service'
import type { CashflowProjection, CashflowItem } from './modules/cashflow/types'
import { listPriceHistory, listPriceIntelligence } from './modules/pricing/historyService'
import type { PriceHistoryRow, PriceIntelligence } from './modules/pricing/historyTypes'
import { loadSupplierAccounts } from './modules/supplier-accounts/service'
import type { SupplierSummary, SupplierPayment, SupplierStatement } from './modules/supplier-accounts/types'
import { loadSalesAccounts } from './modules/sales-accounts/service'
import type { SalesAccount, SalesOrder, PromiseRow } from './modules/sales-accounts/types'
import { OperationCenterPage } from './modules/operation-center/OperationCenterPage'
import { loadOperationCenter } from './modules/operation-center/service'
import { listDispatchOperations } from './modules/operations/dispatchService'
import type { DispatchOperation } from './modules/operations/dispatchTypes'
import { ProcurementPage } from './modules/procurement/ProcurementPage'
import { listWarehouseOrders } from './modules/warehouse/service'
import type { WarehouseOrder } from './modules/warehouse/types'
import { listProcurementNeeds, listOpenProcurementItems } from './modules/procurement/service'
import type { ProcurementNeed, OpenProcurementItem } from './modules/procurement/types'
import { OfferOrderCenterPage } from './modules/offer-order-center/OfferOrderCenterPage'
import { loadOfferOrderCenter } from './modules/offer-order-center/service'
import { InstitutionCenterPage } from './modules/institution-center/InstitutionCenterPage'
import { loadInstitutionCenter } from './modules/institution-center/service'
import { ExecutiveDashboardPage } from './modules/executive-dashboard/ExecutiveDashboardPage'
import { loadExecutiveDashboard } from './modules/executive-dashboard/service'
import { SmartAlertsPage } from './modules/smart-alerts/SmartAlertsPage'
import { loadSmartAlerts } from './modules/smart-alerts/service'
import { ReportingCenterPage } from './modules/reporting-center/ReportingCenterPage'
import { loadReportingCenter } from './modules/reporting-center/service'
import { InstitutionPortalPage } from './modules/institution-portal/InstitutionPortalPage'
import { loadInstitutionPortal } from './modules/institution-portal/service'
import { DataManagementPage } from './modules/data-management/DataManagementPage'
import { loadDataManagement } from './modules/data-management/service'
import { SystemManagementPage } from './modules/system-management/SystemManagementPage'
import { loadSystemManagement } from './modules/system-management/service'

type Profile = { id:string; full_name:string|null; role:'admin'|'kurum'; institution_id:string|null; is_active:boolean }

const menu = ['Genel Görünüm','Deneme Takvimi','Akıllı Uyarılar','Kurumlar Yönetimi','Teklif & Sipariş Merkezi','Admin Onay','Satınalma','Operasyon Merkezi','Finans','Raporlama','Veri Yönetimi','Sistem Yönetimi']

export default function App() {
  const [profile,setProfile]=useState<Profile|null>(null)
  const [dataManagementData,setDataManagementData]=useState<any>({batches:[],rules:null})
  const [systemManagementData,setSystemManagementData]=useState<any>({summary:null,users:[],institutions:[]})
  const [institutionPortalData,setInstitutionPortalData]=useState<any>({summary:null,exams:[],orders:[],operations:[]})
  const [institutionPortalView,setInstitutionPortalView]=useState<'portal'|'reports'>('portal')
  const [reportingData,setReportingData]=useState<any>({exams:[],institutions:[],publishers:[],monthly:[]})
  const [smartAlertsData,setSmartAlertsData]=useState<any>({summary:null,alerts:[]})
  const [executiveDashboardData,setExecutiveDashboardData]=useState<any>({summary:null,actions:[],exams:[]})
  const [institutionCenterData,setInstitutionCenterData]=useState<any>({institutions:[],history:[]})
  const [offerOrderData,setOfferOrderData]=useState<any>({orders:[],offers:[],exams:[],institutions:[]})
  const [loading,setLoading]=useState(true)
  const [active,setActive]=useState('Genel Görünüm')
  const [exams,setExams]=useState<Exam[]>([])
  const [signals,setSignals]=useState<OperationalSignal[]>([])
  const [orderRows,setOrderRows]=useState<OrderRow[]>([])
  const [procurementNeeds,setProcurementNeeds]=useState<ProcurementNeed[]>([])
  const [openProcurementItems,setOpenProcurementItems]=useState<OpenProcurementItem[]>([])
  const [warehouseOrders,setWarehouseOrders]=useState<WarehouseOrder[]>([])
  const [dispatchOperations,setDispatchOperations]=useState<DispatchOperation[]>([])
  const [financeOrders,setFinanceOrders]=useState<FinanceOrder[]>([])
  const [institutionCredits,setInstitutionCredits]=useState<InstitutionCredit[]>([])
  const [institutionCreditReceipts,setInstitutionCreditReceipts]=useState<InstitutionCreditReceipt[]>([])
  const [accountStatement,setAccountStatement]=useState<AccountStatementRow[]>([])
  const [executiveFinance,setExecutiveFinance]=useState<ExecutiveFinance|null>(null)
  const [supplierAccounts,setSupplierAccounts]=useState<SupplierAccount[]>([])
  const [financeSignals,setFinanceSignals]=useState<FinanceSignal[]>([])
  const [cashflowProjection,setCashflowProjection]=useState<CashflowProjection[]>([])
  const [cashflowItems,setCashflowItems]=useState<CashflowItem[]>([])
  const [priceHistory,setPriceHistory]=useState<PriceHistoryRow[]>([])
  const [priceIntelligence,setPriceIntelligence]=useState<PriceIntelligence[]>([])
  const [supplierSummaries,setSupplierSummaries]=useState<SupplierSummary[]>([])
  const [supplierPayments,setSupplierPayments]=useState<SupplierPayment[]>([])
  const [supplierStatement,setSupplierStatement]=useState<SupplierStatement[]>([])
  const [salesAccounts,setSalesAccounts]=useState<SalesAccount[]>([])
  const [salesOrders,setSalesOrders]=useState<SalesOrder[]>([])
  const [collectionPromises,setCollectionPromises]=useState<PromiseRow[]>([])
  const [operationRows,setOperationRows]=useState<any[]>([])
  const [operationSummary,setOperationSummary]=useState<any>(null)
  const [selectedExamId,setSelectedExamId]=useState<string|null>(null)
  const [error,setError]=useState('')

  const refreshInstitutionPortal = useCallback(async()=>{const data=await loadInstitutionPortal();setInstitutionPortalData(data)},[])
  const refreshReporting = useCallback(async()=>{ const data=await loadReportingCenter(); setReportingData(data) },[])
  const refreshDataManagement=useCallback(async()=>setDataManagementData(await loadDataManagement()),[])
  const refreshSystemManagement=useCallback(async()=>setSystemManagementData(await loadSystemManagement()),[])

  const refreshData = useCallback(async()=>{
    const [examData,signalData,ordersData,procurementData,openProcData,warehouseData,dispatchData,financeData,creditData,creditReceiptData,statementData]=await Promise.all([listExams(),listOperationalSignals(),listOrderRows(),listProcurementNeeds(),listOpenProcurementItems(),listWarehouseOrders(),listDispatchOperations(),listFinanceOrders(),listInstitutionCredits(),listInstitutionCreditReceipts(),listAccountStatement()])
    setExams(examData); setSignals(signalData); setOrderRows(ordersData); setProcurementNeeds(procurementData); setOpenProcurementItems(openProcData); setWarehouseOrders(warehouseData); setDispatchOperations(dispatchData); setFinanceOrders(financeData); setInstitutionCredits(creditData); setInstitutionCreditReceipts(creditReceiptData); setAccountStatement(statementData)
    const executiveData=await loadExecutiveFinance(); setExecutiveFinance(executiveData.summary); setSupplierAccounts(executiveData.suppliers); setFinanceSignals(executiveData.signals)
    const cashflowData=await loadCashflow(); setCashflowProjection(cashflowData.projection); setCashflowItems(cashflowData.items)
    const [ph,pi]=await Promise.all([listPriceHistory(),listPriceIntelligence()]); setPriceHistory(ph); setPriceIntelligence(pi)
    const sa=await loadSupplierAccounts(); setSupplierSummaries(sa.summaries); setSupplierPayments(sa.payments); setSupplierStatement(sa.statement)
    const sc=await loadSalesAccounts(); setSalesAccounts(sc.accounts); setSalesOrders(sc.orders); setCollectionPromises(sc.promises)
    const oc=await loadOperationCenter(); setOperationRows(oc.rows); setOperationSummary(oc.summary)
    setReportingData(await loadReportingCenter()); setSmartAlertsData(await loadSmartAlerts()); setExecutiveDashboardData(await loadExecutiveDashboard()); setInstitutionCenterData(await loadInstitutionCenter()); setOfferOrderData(await loadOfferOrderCenter()); setDataManagementData(await loadDataManagement()); setSystemManagementData(await loadSystemManagement())
  },[])

  const loadAll = refreshData
  const refresh = useCallback(async()=>{ try { setError(''); const p=await getCurrentProfile(); setProfile(p as Profile|null); if(p?.role==='admin') await refreshData(); else if(p?.role==='kurum'){await refreshReporting();await refreshInstitutionPortal()} } catch(e){ setError(e instanceof Error?e.message:'Yükleme hatası') } finally { setLoading(false) } },[refreshData,refreshReporting,refreshInstitutionPortal])
  useEffect(()=>{ refresh(); const {data}=supabase.auth.onAuthStateChange(()=>refresh()); return()=>data.subscription.unsubscribe() },[refresh])

  if(loading) return <div className="center">Yükleniyor...</div>
  if(!profile) return <Login onSuccess={refresh}/>

  if(profile.role==='kurum') {
    const ownInstitution=reportingData.institutions?.find((x:any)=>x.institution_id===profile.institution_id)
    return <div className="institution-report-shell"><header><div className="logo"><div>ZK</div><span><b>Zengin Kitabevi</b><small>Deneme Takip Kurum Paneli</small></span></div><div className="user"><span>{profile.full_name||ownInstitution?.name||'Kurum'}</span><button onClick={()=>supabase.auth.signOut()}>Çıkış</button></div></header><main>{institutionPortalView==='reports'?<><button className="ip-back" onClick={()=>setInstitutionPortalView('portal')}>← Kurum Paneline Dön</button><ReportingCenterPage {...reportingData} viewerRole="kurum" viewerInstitutionName={ownInstitution?.name||null}/></>:<InstitutionPortalPage data={institutionPortalData} institutionId={profile.institution_id!} institutionName={ownInstitution?.name||profile.full_name||'Kurum'} onRefresh={refresh} onReports={()=>setInstitutionPortalView('reports')}/>}</main></div>
  }

  const navigate=(target:string)=>setActive(target)
  const openOrdersForExam=(examId:string)=>{ setSelectedExamId(examId); setActive('Teklif & Sipariş Merkezi') }
  const openOperationsForExam=(examId:string)=>{ setSelectedExamId(examId); setActive('Operasyon Merkezi') }

  return <div className="app-shell"><aside><div className="logo"><div>ZK</div><span><b>Zengin Kitabevi</b><small>Deneme Takip Yönetimi</small></span></div><nav>{menu.map(m=><button key={m} className={active===m?'active':''} onClick={()=>setActive(m)}><span>{m}</span></button>)}</nav></aside><main><header><div><b>Production V1</b><span>Gerçek Supabase bağlantısı aktif</span></div><div className="user"><span>{profile.full_name || 'Admin'}</span><button onClick={()=>supabase.auth.signOut()}>Çıkış</button></div></header><div className="content">{error&&<div className="notice">{error}</div>}{active==='Deneme Takvimi'&&<><ExamImport userId={profile.id} onImported={refreshData}/><ExamCalendar exams={exams} signals={signals} onNavigate={navigate} onOpenOrders={openOrdersForExam} onOpenOperations={openOperationsForExam}/></>}
  {active==='Admin Onay'&&<AdminApprovalPage rows={orderRows} onChanged={refreshData} onOpenOrders={openOrdersForExam}/>} 
  {active==='Satınalma'&&<ProcurementPage rows={procurementNeeds} openItems={openProcurementItems} onRefresh={loadAll}/>} 
  {active==='Finans'&&<FinancePage rows={financeOrders} credits={institutionCredits} creditReceipts={institutionCreditReceipts} onRefresh={loadAll}/>} 
  {active==='Veri Yönetimi'&&<DataManagementPage data={dataManagementData} onRefresh={refreshDataManagement}/>} 
  {active==='Sistem Yönetimi'&&<SystemManagementPage data={systemManagementData} onRefresh={refreshSystemManagement}/>} 
  {active==='Raporlama'&&<ReportingCenterPage {...reportingData} viewerRole="admin" viewerInstitutionName={null}/>} 
  {active==='Akıllı Uyarılar'&&<SmartAlertsPage {...smartAlertsData} onRefresh={loadAll} onNavigate={(x)=>setActive(x)}/>} 
  {active==='Genel Görünüm'&&<ExecutiveDashboardPage {...executiveDashboardData} onNavigate={(t)=>setActive(t==='admin_onay'?'Admin Onay':t==='operasyon_riski'?'Operasyon Merkezi':t==='son_siparis'||t==='uygulama'?'Deneme Takvimi':'Genel Görünüm')}/>} 
  {active==='Kurumlar Yönetimi'&&<InstitutionCenterPage {...institutionCenterData} onRefresh={loadAll}/>} 
  {active==='Teklif & Sipariş Merkezi'&&<OfferOrderCenterPage {...offerOrderData} onRefresh={loadAll}/>} 
  {active==='Operasyon Merkezi'&&<OperationCenterPage rows={operationRows} summary={operationSummary} onRefresh={loadAll} selectedExamId={selectedExamId}/>}</div></main></div>
}
