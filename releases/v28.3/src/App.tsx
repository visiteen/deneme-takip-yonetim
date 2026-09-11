import {useCallback,useEffect,useState} from 'react';
import {supabase} from './lib/supabase';
import {Login} from './components/Login';
import {getCurrentProfile,listExams} from './modules/exam-import/service';
import {ExamImport} from './modules/exam-import/ExamImport';
import {ExamCalendar} from './modules/exam-calendar/ExamCalendar';
import {listOperationalSignals} from './modules/exam-calendar/service';
import {listOrderRows} from './modules/orders/service';
import {AdminApprovalPage} from './modules/admin-approval/AdminApprovalPage';
import {listProcurementNeeds,listOpenProcurementItems} from './modules/procurement/service';
import {ProcurementPage} from './modules/procurement/ProcurementPage';
import {listFinanceOrders} from './modules/finance/service';
import {FinancePage} from './modules/finance/FinancePage';
import {loadOfferOrderCenter} from './modules/offer-order-center/service';
import {OfferOrderCenterPage} from './modules/offer-order-center/OfferOrderCenterPage';
import {loadInstitutionCenter} from './modules/institution-center/service';
import {InstitutionCenterPage} from './modules/institution-center/InstitutionCenterPage';
import {loadOperationCenter} from './modules/operation-center/service';
import {OperationCenterPage} from './modules/operation-center/OperationCenterPage';
import {loadExecutiveDashboard} from './modules/executive-dashboard/service';
import {ExecutiveDashboardPage} from './modules/executive-dashboard/ExecutiveDashboardPage';
import {loadSmartAlerts} from './modules/smart-alerts/service';
import {SmartAlertsPage} from './modules/smart-alerts/SmartAlertsPage';
import {loadReportingCenter} from './modules/reporting-center/service';
import {ReportingCenterPage} from './modules/reporting-center/ReportingCenterPage';
import {loadInstitutionPortal} from './modules/institution-portal/service';
import {InstitutionPortalPage} from './modules/institution-portal/InstitutionPortalPage';
import {loadDataManagement} from './modules/data-management/service';
import {DataManagementPage} from './modules/data-management/DataManagementPage';
import {loadSystemManagement} from './modules/system-management/service';
import {SystemManagementPage} from './modules/system-management/SystemManagementPage';

type Profile={id:string;full_name:string|null;role:'admin'|'kurum';institution_id:string|null;is_active:boolean};
const menu=['Genel Görünüm','Deneme Takvimi','Akıllı Uyarılar','Kurumlar Yönetimi','Teklif & Sipariş Merkezi','Admin Onay','Satınalma','Operasyon Merkezi','Finans','Raporlama','Veri Yönetimi','Sistem Yönetimi'];

export default function App(){
 const[profile,setProfile]=useState<Profile|null>(null),[loading,setLoading]=useState(true),[active,setActive]=useState('Genel Görünüm'),[error,setError]=useState('');
 const[exams,setExams]=useState<any[]>([]),[signals,setSignals]=useState<any[]>([]),[orders,setOrders]=useState<any[]>([]),[procNeeds,setProcNeeds]=useState<any[]>([]),[procItems,setProcItems]=useState<any[]>([]),[finance,setFinance]=useState<any[]>([]);
 const[offerOrder,setOfferOrder]=useState<any>({orders:[],offers:[],exams:[],institutions:[]}),[institutions,setInstitutions]=useState<any>({institutions:[],history:[]}),[operations,setOperations]=useState<any>({rows:[],summary:null}),[dashboard,setDashboard]=useState<any>({summary:null,actions:[],exams:[]}),[alerts,setAlerts]=useState<any>({summary:null,alerts:[]}),[reporting,setReporting]=useState<any>({exams:[],institutions:[],publishers:[],monthly:[]}),[portal,setPortal]=useState<any>({summary:null,exams:[],orders:[],operations:[]}),[dataMgmt,setDataMgmt]=useState<any>({batches:[],rules:null}),[systemMgmt,setSystemMgmt]=useState<any>({summary:null,users:[],institutions:[]}),[selectedExamId,setSelectedExamId]=useState<string|null>(null),[portalReports,setPortalReports]=useState(false);
 const loadAdmin=useCallback(async()=>{const[a,b,c,d,e,f,g,h,i,j,k,l]=await Promise.all([listExams(),listOperationalSignals(),listOrderRows(),listProcurementNeeds(),listOpenProcurementItems(),listFinanceOrders(),loadOfferOrderCenter(),loadInstitutionCenter(),loadOperationCenter(),loadExecutiveDashboard(),loadSmartAlerts(),loadReportingCenter()]);setExams(a);setSignals(b);setOrders(c);setProcNeeds(d);setProcItems(e);setFinance(f);setOfferOrder(g);setInstitutions(h);setOperations(i);setDashboard(j);setAlerts(k);setReporting(l);setDataMgmt(await loadDataManagement());setSystemMgmt(await loadSystemManagement())},[]);
 const loadPortal=useCallback(async()=>{setReporting(await loadReportingCenter());setPortal(await loadInstitutionPortal())},[]);
 const refresh=useCallback(async()=>{try{setError('');const p=await getCurrentProfile();setProfile(p as Profile|null);if(p?.role==='admin')await loadAdmin();else if(p?.role==='kurum')await loadPortal()}catch(e){setError(e instanceof Error?e.message:'Yükleme hatası')}finally{setLoading(false)}},[loadAdmin,loadPortal]);
 useEffect(()=>{refresh();const{data}=supabase.auth.onAuthStateChange(()=>refresh());return()=>data.subscription.unsubscribe()},[refresh]);
 if(loading)return <div className="center">Yükleniyor...</div>;
 if(!profile)return <Login onSuccess={refresh}/>;
 if(profile.role==='kurum'){const own=reporting.institutions?.find((x:any)=>x.institution_id===profile.institution_id);return <div className="institution-report-shell"><header><div className="logo"><div>ZK</div><span><b>Zengin Kitabevi</b><small>Deneme Takip Kurum Paneli</small></span></div><div className="user"><span>{profile.full_name||own?.name||'Kurum'}</span><button onClick={()=>supabase.auth.signOut()}>Çıkış</button></div></header><main>{portalReports?<><button className="ip-back" onClick={()=>setPortalReports(false)}>← Kurum Paneline Dön</button><ReportingCenterPage {...reporting} viewerRole="kurum" viewerInstitutionName={own?.name||null}/></>:<InstitutionPortalPage data={portal} institutionId={profile.institution_id!} institutionName={own?.name||profile.full_name||'Kurum'} onRefresh={refresh} onReports={()=>setPortalReports(true)}/>}</main></div>}
 const openOrders=(id:string)=>{setSelectedExamId(id);setActive('Teklif & Sipariş Merkezi')};const openOps=(id:string)=>{setSelectedExamId(id);setActive('Operasyon Merkezi')};
 return <div className="app-shell"><aside><div className="logo"><div>ZK</div><span><b>Zengin Kitabevi</b><small>Deneme Takip Yönetimi</small></span></div><nav>{menu.map(m=><button key={m} className={active===m?'active':''} onClick={()=>setActive(m)}>{m}</button>)}</nav></aside><main><header><div><b>V28.3 Entegrasyon</b><span>Gerçek Supabase bağlantısı</span></div><div className="user"><span>{profile.full_name||'Admin'}</span><button onClick={()=>supabase.auth.signOut()}>Çıkış</button></div></header><div className="content">{error&&<div className="notice">{error}</div>}{active==='Genel Görünüm'&&<ExecutiveDashboardPage {...dashboard} onNavigate={(t:string)=>setActive(t==='admin_onay'?'Admin Onay':t==='operasyon_riski'?'Operasyon Merkezi':t==='son_siparis'||t==='uygulama'?'Deneme Takvimi':'Genel Görünüm')}/>} {active==='Deneme Takvimi'&&<><ExamImport userId={profile.id} onImported={loadAdmin}/><ExamCalendar exams={exams} signals={signals} onNavigate={setActive} onOpenOrders={openOrders} onOpenOperations={openOps}/></>} {active==='Akıllı Uyarılar'&&<SmartAlertsPage {...alerts} onRefresh={loadAdmin} onNavigate={(x:string)=>setActive(x)}/>} {active==='Kurumlar Yönetimi'&&<InstitutionCenterPage {...institutions} onRefresh={loadAdmin}/>} {active==='Teklif & Sipariş Merkezi'&&<OfferOrderCenterPage {...offerOrder} onRefresh={loadAdmin}/>} {active==='Admin Onay'&&<AdminApprovalPage rows={orders} onChanged={loadAdmin} onOpenOrders={openOrders}/>} {active==='Satınalma'&&<ProcurementPage rows={procNeeds} openItems={procItems} onRefresh={loadAdmin}/>} {active==='Operasyon Merkezi'&&<OperationCenterPage rows={operations.rows} summary={operations.summary} onRefresh={loadAdmin} selectedExamId={selectedExamId}/>} {active==='Finans'&&<FinancePage rows={finance} onRefresh={loadAdmin}/>} {active==='Raporlama'&&<ReportingCenterPage {...reporting} viewerRole="admin" viewerInstitutionName={null}/>} {active==='Veri Yönetimi'&&<DataManagementPage data={dataMgmt} onRefresh={async()=>{setDataMgmt(await loadDataManagement());await loadAdmin()}}/>} {active==='Sistem Yönetimi'&&<SystemManagementPage data={systemMgmt} onRefresh={async()=>setSystemMgmt(await loadSystemManagement())}/>}</div></main></div>
}