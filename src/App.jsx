import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "./supabase";

const TABLE    = "provider_issues";
const SHA_PIN  = "SHA2025";

const SHA_BLUE   = "#0050A0";
const SHA_GREEN  = "#28B446";
const SHA_CYAN   = "#28AAE6";
const SHA_BLUE_D = "#003A75";
const SHA_GREEN_D= "#1A7A30";
const SHA_CYAN_D = "#1478A8";
const SHA_BLUE_L = "#E8F2FC";
const SHA_GREEN_L= "#EAF7ED";
const SHA_CYAN_L = "#E8F8FD";

const COUNTIES = ["Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"];
const ISSUE_TYPES = ["Level Mismatch","FID/MFL Code Issue","Contracting Issue","Facility Change of Name","Registration Issue","Credentialing Issue","Suspended/Deactivated Provider","Banking/Payment Details","Claims Dispute","Other"];
const STATUSES = ["Submitted","Under Review","Awaiting Documents","In Progress","Resolved","Closed","Escalated"];

const STATUS_META = {
  "Submitted":          { color:"#3B82F6", bg:"#EFF6FF", icon:"📨" },
  "Under Review":       { color:"#8B5CF6", bg:"#F5F3FF", icon:"🔍" },
  "Awaiting Documents": { color:"#F59E0B", bg:"#FFFBEB", icon:"📎" },
  "In Progress":        { color:"#0EA5E9", bg:"#F0F9FF", icon:"⚙️" },
  "Resolved":           { color:SHA_GREEN, bg:SHA_GREEN_L, icon:"✅" },
  "Closed":             { color:"#6B7280", bg:"#F9FAFB", icon:"🔒" },
  "Escalated":          { color:"#EF4444", bg:"#FEF2F2", icon:"🚨" },
};
const PIE_COLORS = [SHA_BLUE,SHA_CYAN,SHA_GREEN,"#F59E0B","#EF4444","#8B5CF6","#1D9E75","#D85A30"];

function genRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "SHA-" + Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
}
function fmtDate(s){ return s ? new Date(s).toLocaleDateString("en-KE",{day:"2-digit",month:"short",year:"numeric"}) : "—"; }

// ── DEEP LINK: read hash on load ─────────────────────────
function getInitialPortal() {
  const hash = window.location.hash.replace('#','').toLowerCase();
  if (hash === 'provider') return 'provider';
  if (hash === 'provider-home') return 'provider-home';
  if (hash === 'sha') return 'sha';
  return 'home';
}

export default function App() {
  const [portal, setPortal] = useState(getInitialPortal);
  const [issues, setIssues] = useState([]);

  // Update hash when portal changes
  useEffect(() => {
    if (portal === 'home') window.location.hash = '';
    else window.location.hash = portal;
  }, [portal]);

  useEffect(() => {
    loadIssues();
    const ch = supabase.channel("provider-rt")
      .on("postgres_changes",{event:"*",schema:"public",table:TABLE}, loadIssues)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const loadIssues = async () => {
    const { data } = await supabase.from(TABLE).select("*").order("created_at",{ascending:false});
    if (data) setIssues(data.map(r => ({ ...r.data, id:r.id, refNo:r.ref_no, submittedAt:r.created_at })));
  };

  const saveIssue = async (issue) => {
    await supabase.from(TABLE).insert([{ id:issue.id, ref_no:issue.refNo, data:{ ...issue } }]);
    await loadIssues();
  };

  const updateIssue = async (id, updates) => {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;
    await supabase.from(TABLE).update({ data: { ...issue, ...updates } }).eq("id", id);
    await loadIssues();
  };

  if (portal==="home")          return <Home onSelect={setPortal}/>;
  if (portal==="provider-home") return <ProviderHome onSelect={setPortal}/>;
  if (portal==="provider")      return <ProviderPortal issues={issues} saveIssue={saveIssue} onBack={()=>setPortal("provider-home")}/>;
  if (portal==="sha")           return <SHAPortal issues={issues} updateIssue={updateIssue} onBack={()=>setPortal("home")}/>;
}

/* ── PROVIDER-ONLY LANDING ─────────────────────────────── */
function ProviderHome({onSelect}) {
  return (
    <div style={{minHeight:"100vh",background:"#0B1F3A",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',Arial,sans-serif",padding:24}}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} .pcard2{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer} .pcard2:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,0,0,0.3)}`}</style>
      <div style={{animation:"float 4s ease-in-out infinite",fontSize:56,marginBottom:16}}>🏥</div>
      <div style={{textAlign:"center",marginBottom:48,animation:"fadeUp 0.5s ease"}}>
        <div style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:-0.5,lineHeight:1.2}}>Health Care Provider</div>
        <div style={{fontSize:26,fontWeight:800,color:"#28AAE6",letterSpacing:-0.5,lineHeight:1.2}}>Customer Service Portal</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",marginTop:8}}>Social Health Authority · Provider Management Department</div>
        <div style={{fontSize:13,color:"#28AAE6",marginTop:4,fontStyle:"italic"}}>Bima Bora, Afya Nyumbani</div>
      </div>
      <div style={{animation:"fadeUp 0.5s 0.15s ease both"}}>
        <div className="pcard2" onClick={()=>onSelect("provider")} style={{background:"#fff",borderRadius:20,padding:"48px 48px",width:300,textAlign:"center",boxShadow:"0 16px 48px rgba(0,0,0,0.25)"}}>
          <div style={{fontSize:52,marginBottom:20}}>🏨</div>
          <div style={{fontSize:22,fontWeight:800,color:"#0B1F3A",marginBottom:10}}>Healthcare Provider</div>
          <div style={{fontSize:14,color:"#6B7280",lineHeight:1.7,marginBottom:28}}>Submit a provider issue or track the status of your existing submissions</div>
          <div style={{background:"#0050A0",color:"#fff",padding:"14px 28px",borderRadius:12,fontSize:14,fontWeight:700}}>Enter Provider Portal →</div>
        </div>
      </div>
      <div style={{marginTop:40,textAlign:"center"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>SHA Kenya © 2025 · Secure</div>
        <div style={{fontSize:12,color:"#28AAE6",marginTop:6}}>📧 providermanagement@sha.go.ke</div>
      </div>
    </div>
  );
}

/* ── HOME ──────────────────────────────────────────────── */
function Home({onSelect}) {
  return (
    <div style={{minHeight:"100vh",background:"#0B1F3A",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',Arial,sans-serif",padding:24}}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} .pcard{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer} .pcard:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,0,0,0.3)}`}</style>
      <div style={{animation:"float 4s ease-in-out infinite",fontSize:56,marginBottom:16}}>🏥</div>
      <div style={{textAlign:"center",marginBottom:48,animation:"fadeUp 0.5s ease"}}>
        <div style={{fontSize:30,fontWeight:800,color:"#fff",letterSpacing:-1}}>SHA Provider Portal</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",marginTop:6}}>Social Health Authority · Provider Management Department</div>
        <div style={{fontSize:13,color:SHA_CYAN,marginTop:4,fontStyle:"italic"}}>Bima Bora, Afya Nyumbani</div>
      </div>
      <div style={{display:"flex",gap:20,flexWrap:"wrap",justifyContent:"center",animation:"fadeUp 0.5s 0.15s ease both"}}>
        <div className="pcard" onClick={()=>onSelect("provider")} style={{background:"#fff",borderRadius:20,padding:"40px 36px",width:260,textAlign:"center",boxShadow:"0 16px 48px rgba(0,0,0,0.25)"}}>
          <div style={{fontSize:44,marginBottom:16}}>🏨</div>
          <div style={{fontSize:20,fontWeight:800,color:"#0B1F3A",marginBottom:8}}>Healthcare Provider</div>
          <div style={{fontSize:13,color:"#6B7280",lineHeight:1.6,marginBottom:24}}>Submit an issue or track the status of your existing submissions</div>
          <div style={{background:SHA_BLUE,color:"#fff",padding:"11px 24px",borderRadius:10,fontSize:13,fontWeight:700}}>Enter Provider Portal →</div>
        </div>
        <div className="pcard" onClick={()=>onSelect("sha")} style={{background:`linear-gradient(135deg,${SHA_BLUE},${SHA_BLUE_D})`,borderRadius:20,padding:"40px 36px",width:260,textAlign:"center",boxShadow:`0 16px 48px ${SHA_BLUE}50`}}>
          <div style={{fontSize:44,marginBottom:16}}>🔐</div>
          <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:8}}>SHA Internal Staff</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.6,marginBottom:24}}>Manage issues, update statuses and review analytics</div>
          <div style={{background:"rgba(255,255,255,0.15)",color:"#fff",border:"1.5px solid rgba(255,255,255,0.3)",padding:"11px 24px",borderRadius:10,fontSize:13,fontWeight:700}}>Staff Login →</div>
        </div>
      </div>
      <div style={{marginTop:48,fontSize:11,color:"rgba(255,255,255,0.2)"}}>SHA Kenya © 2025 · Secure · Internal Use Only</div>
    </div>
  );
}

/* ── PROVIDER PORTAL ───────────────────────────────────── */
function ProviderPortal({issues,saveIssue,onBack}) {
  const [view,setView]             = useState("form");
  const [lastRef,setLastRef]       = useState("");
  const [trackRef,setTrackRef]     = useState("");
  const [trackedIssue,setTracked]  = useState(null);
  const [trackErr,setTrackErr]     = useState("");
  const [submitting,setSubmitting] = useState(false);

  const emptyForm = { facilityName:"",mflCode:"",county:"",contactPerson:"",contactPhone:"",contactEmail:"",issueType:"",description:"" };
  const [form,setForm]   = useState(emptyForm);
  const [errors,setErrors] = useState({});

  const validate = () => {
    const e={};
    if(!form.facilityName.trim()) e.facilityName="Required";
    if(!form.county) e.county="Required";
    if(!form.issueType) e.issueType="Required";
    if(!form.contactPerson.trim()) e.contactPerson="Required";
    if(!form.description.trim()) e.description="Required";
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSubmit = async () => {
    if(!validate()) return;
    setSubmitting(true);
    const ref = genRef();
    const issue = { ...form, id:Date.now().toString(), refNo:ref, status:"Submitted",
      assignedTo:"", internalNotes:"",
      history:[{action:"Issue submitted by provider",by:"Provider",at:new Date().toISOString()}]
    };
    await saveIssue(issue);
    setLastRef(ref); setForm(emptyForm); setErrors({});
    setView("success"); setSubmitting(false);
  };

  const handleTrack = () => {
    setTrackErr("");
    const found = issues.find(i => i.refNo===trackRef.trim().toUpperCase());
    if(found){ setTracked(found); }
    else setTrackErr("No issue found with that reference number. Please check and try again.");
  };

  const inp = (k) => ({
    width:"100%",padding:"10px 12px",border:`1.5px solid ${errors[k]?"#EF4444":"#E5E7EB"}`,
    borderRadius:8,fontSize:13,color:"#111827",background:"#fff",boxSizing:"border-box",fontFamily:"inherit",outline:"none"
  });

  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"'Segoe UI',Arial,sans-serif"}}>
      <style>{`input:focus,select:focus,textarea:focus{outline:2px solid ${SHA_BLUE}!important;outline-offset:1px} @keyframes pop{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      <div style={{background:"#fff",borderBottom:"1px solid #E5E7EB",padding:"14px 28px",display:"flex",alignItems:"center",gap:14,position:"sticky",top:0,zIndex:50}}>
        <button onClick={onBack} style={{border:"none",background:"#F3F4F6",cursor:"pointer",color:"#374151",fontSize:12,fontWeight:700,padding:"6px 12px",borderRadius:8,fontFamily:"inherit"}}>← Back</button>
        <div style={{width:1,height:24,background:"#E5E7EB"}}/>
        <div style={{width:36,height:36,borderRadius:10,background:SHA_BLUE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏥</div>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:SHA_BLUE_D}}>Health Care Provider Customer Service Portal</div>
          <div style={{fontSize:11,color:"#9CA3AF"}}>providermanagement@sha.go.ke</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {[{l:"Submit Issue",v:"form"},{l:"Track My Issue",v:"track"}].map(t=>(
            <button key={t.v} onClick={()=>setView(t.v)} style={{padding:"9px 18px",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,borderRadius:8,background:view===t.v?SHA_BLUE:"transparent",color:view===t.v?"#fff":"#374151"}}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:700,margin:"0 auto",padding:"28px 20px"}}>
        {view==="success" && (
          <div style={{background:"#fff",borderRadius:20,padding:48,textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.07)",animation:"pop 0.4s cubic-bezier(.34,1.56,.64,1)"}}>
            <div style={{fontSize:64,marginBottom:16}}>✅</div>
            <div style={{fontWeight:800,fontSize:22,color:SHA_BLUE_D,marginBottom:8}}>Issue Submitted!</div>
            <div style={{fontSize:14,color:"#6B7280",marginBottom:28}}>Your issue has been received. Save your reference number to track progress.</div>
            <div style={{background:SHA_GREEN_L,border:`2px solid ${SHA_GREEN}`,borderRadius:14,padding:"20px 32px",display:"inline-block",marginBottom:28}}>
              <div style={{fontSize:11,fontWeight:700,color:SHA_GREEN_D,letterSpacing:1,marginBottom:6}}>YOUR REFERENCE NUMBER</div>
              <div style={{fontFamily:"monospace",fontSize:28,fontWeight:800,color:SHA_BLUE_D,letterSpacing:3}}>{lastRef}</div>
              <div style={{fontSize:11,color:"#6B7280",marginTop:6}}>Keep this number to track your issue</div>
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button onClick={()=>setView("form")} style={{background:SHA_BLUE,color:"#fff",border:"none",padding:"12px 24px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit Another</button>
              <button onClick={()=>{setTrackRef(lastRef);setView("track");}} style={{background:"#F3F4F6",color:"#374151",border:"none",padding:"12px 24px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Track This Issue</button>
            </div>
          </div>
        )}

        {view==="form" && (
          <div>
            <div style={{background:`linear-gradient(135deg,${SHA_BLUE},${SHA_BLUE_D})`,borderRadius:14,padding:"22px 26px",marginBottom:20,color:"#fff"}}>
              <div style={{fontWeight:800,fontSize:18,marginBottom:4}}>Submit a Provider Issue</div>
              <div style={{fontSize:13,opacity:0.7}}>Fill in the details below. You will receive a reference number to track your issue.</div>
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:26,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <ProvSection label="📍 Facility Information"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
                <PField label="Facility / Provider Name" k="facilityName" required errors={errors}>
                  <input value={form.facilityName} onChange={e=>setForm(p=>({...p,facilityName:e.target.value}))} placeholder="e.g. Nairobi West Hospital" style={inp("facilityName")}/>
                </PField>
                <PField label="MFL Code / FID" k="mflCode" errors={errors}>
                  <input value={form.mflCode} onChange={e=>setForm(p=>({...p,mflCode:e.target.value}))} placeholder="e.g. 13412" style={inp("mflCode")}/>
                </PField>
                <PField label="County" k="county" required errors={errors}>
                  <select value={form.county} onChange={e=>setForm(p=>({...p,county:e.target.value}))} style={inp("county")}>
                    <option value="">Select county…</option>
                    {COUNTIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </PField>
                <PField label="Issue Type" k="issueType" required errors={errors}>
                  <select value={form.issueType} onChange={e=>setForm(p=>({...p,issueType:e.target.value}))} style={inp("issueType")}>
                    <option value="">Select issue…</option>
                    {ISSUE_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </PField>
              </div>
              <ProvSection label="👤 Contact Information"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 16px"}}>
                <PField label="Contact Person" k="contactPerson" required errors={errors}>
                  <input value={form.contactPerson} onChange={e=>setForm(p=>({...p,contactPerson:e.target.value}))} placeholder="Full name" style={inp("contactPerson")}/>
                </PField>
                <PField label="Phone Number" k="contactPhone" errors={errors}>
                  <input value={form.contactPhone} onChange={e=>setForm(p=>({...p,contactPhone:e.target.value}))} placeholder="07XX XXX XXX" style={inp("contactPhone")}/>
                </PField>
                <PField label="Email Address" k="contactEmail" errors={errors}>
                  <input value={form.contactEmail} onChange={e=>setForm(p=>({...p,contactEmail:e.target.value}))} placeholder="email@facility.co.ke" style={inp("contactEmail")}/>
                </PField>
              </div>
              <ProvSection label="📝 Issue Details"/>
              <PField label="Description of Issue" k="description" required errors={errors}>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                  placeholder="Describe your issue in detail…" rows={4}
                  style={{...inp("description"),resize:"vertical"}}/>
              </PField>
              <button onClick={handleSubmit} disabled={submitting} style={{width:"100%",background:SHA_BLUE,color:"#fff",border:"none",padding:"13px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:8,opacity:submitting?0.7:1}}>
                {submitting ? "Submitting…" : "Submit Issue →"}
              </button>
            </div>
          </div>
        )}

        {view==="track" && (
          <div>
            <div style={{background:"#fff",borderRadius:14,padding:26,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:17,color:SHA_BLUE_D,marginBottom:6}}>Track Your Issue</div>
              <div style={{fontSize:13,color:"#6B7280",marginBottom:18}}>Enter the reference number you received when you submitted your issue.</div>
              <div style={{display:"flex",gap:10}}>
                <input value={trackRef} onChange={e=>{setTrackRef(e.target.value.toUpperCase());setTrackErr("");setTracked(null);}}
                  placeholder="e.g. SHA-AB3XY7Z9" onKeyDown={e=>e.key==="Enter"&&handleTrack()}
                  style={{flex:1,padding:"12px 16px",border:"1.5px solid #E5E7EB",borderRadius:10,fontSize:14,fontFamily:"monospace",letterSpacing:2,color:"#111827",outline:"none"}}/>
                <button onClick={handleTrack} style={{background:SHA_BLUE,color:"#fff",border:"none",padding:"12px 22px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Search</button>
              </div>
              {trackErr && <div style={{marginTop:10,color:"#EF4444",fontSize:13,fontWeight:600}}>⚠ {trackErr}</div>}
            </div>
            {trackedIssue && (
              <div style={{background:"#fff",borderRadius:14,padding:26,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:18,color:SHA_BLUE_D}}>{trackedIssue.facilityName}</div>
                    <div style={{fontSize:12,color:"#9CA3AF",fontFamily:"monospace",marginTop:2}}>{trackedIssue.refNo}</div>
                  </div>
                  <div style={{background:STATUS_META[trackedIssue.status]?.bg,color:STATUS_META[trackedIssue.status]?.color,border:`1.5px solid ${STATUS_META[trackedIssue.status]?.color}40`,padding:"8px 18px",borderRadius:24,fontSize:13,fontWeight:700}}>
                    {STATUS_META[trackedIssue.status]?.icon} {trackedIssue.status}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  {[["Issue Type",trackedIssue.issueType],["County",trackedIssue.county],["MFL/FID",trackedIssue.mflCode||"—"],["Date Submitted",fmtDate(trackedIssue.submittedAt)],["Contact Person",trackedIssue.contactPerson],["Assigned To",trackedIssue.assignedTo||"Pending assignment"]].map(([k,v])=>(
                    <div key={k} style={{background:"#F9FAFB",borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:9,fontWeight:700,color:"#9CA3AF",letterSpacing:0.8,marginBottom:3}}>{k.toUpperCase()}</div>
                      <div style={{fontSize:12,fontWeight:600,color:"#111827"}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"#F9FAFB",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
                  <div style={{fontSize:9,fontWeight:700,color:"#9CA3AF",letterSpacing:0.8,marginBottom:6}}>DESCRIPTION</div>
                  <div style={{fontSize:13,color:"#374151",lineHeight:1.6}}>{trackedIssue.description}</div>
                </div>
                <div style={{fontSize:10,fontWeight:700,color:"#9CA3AF",letterSpacing:0.8,marginBottom:10}}>ACTIVITY TIMELINE</div>
                {(trackedIssue.history||[]).slice().reverse().map((h,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:SHA_BLUE,marginTop:5,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:12,color:"#111827",fontWeight:500}}>{h.action}</div>
                      <div style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{h.by} · {new Date(h.at).toLocaleString("en-KE")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SHA INTERNAL PORTAL ───────────────────────────────── */
function SHAPortal({issues,updateIssue,onBack}) {
  const [authed,setAuthed]   = useState(false);
  const [pin,setPin]         = useState("");
  const [pinErr,setPinErr]   = useState("");
  const [tab,setTab]         = useState("dashboard");
  const [selected,setSelected] = useState(null);
  const [fStatus,setFStatus] = useState("All");
  const [fCounty,setFCounty] = useState("All");
  const [fType,setFType]     = useState("All");
  const [search,setSearch]   = useState("");
  const [toast,setToast]     = useState(null);
  const [saving,setSaving]   = useState(false);
  const [editStatus,setEditStatus]   = useState("");
  const [editAssigned,setEditAssigned] = useState("");
  const [editNote,setEditNote]       = useState("");

  useEffect(() => {
    if(selected){ setEditStatus(selected.status); setEditAssigned(selected.assignedTo||""); setEditNote(""); }
  },[selected]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),3000); };

  const handleSave = async () => {
    if(!selected) return;
    setSaving(true);
    const newHistory = [...(selected.history||[])];
    if(editStatus!==selected.status) newHistory.push({action:`Status changed to "${editStatus}"`,by:"SHA Staff",at:new Date().toISOString()});
    if(editAssigned!==selected.assignedTo) newHistory.push({action:`Assigned to ${editAssigned||"unassigned"}`,by:"SHA Staff",at:new Date().toISOString()});
    if(editNote.trim()) newHistory.push({action:`Note: ${editNote.trim()}`,by:"SHA Staff",at:new Date().toISOString()});
    await updateIssue(selected.id,{status:editStatus,assignedTo:editAssigned,internalNotes:(selected.internalNotes||"")+(editNote?"\n["+new Date().toLocaleString("en-KE")+"] "+editNote:""),history:newHistory});
    setEditNote(""); setSaving(false); showToast("Issue updated.");
  };

  const filtered = useMemo(()=>issues.filter(i=>
    (fStatus==="All"||i.status===fStatus)&&(fCounty==="All"||i.county===fCounty)&&
    (fType==="All"||i.issueType===fType)&&
    (!search||i.facilityName?.toLowerCase().includes(search.toLowerCase())||i.refNo?.toLowerCase().includes(search.toLowerCase()))
  ),[issues,fStatus,fCounty,fType,search]);

  const byType   = useMemo(()=>{const m={};issues.forEach(i=>{m[i.issueType]=(m[i.issueType]||0)+1;});return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));},[issues]);
  const byCounty = useMemo(()=>{const m={};issues.forEach(i=>{m[i.county]=(m[i.county]||0)+1;});return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>({name,count}));},[issues]);
  const byStatus = useMemo(()=>{const m={};issues.forEach(i=>{m[i.status]=(m[i.status]||0)+1;});return Object.entries(m).map(([name,count])=>({name,count}));},[issues]);
  const openCount = issues.filter(i=>!["Resolved","Closed"].includes(i.status)).length;
  const resolvedCount = issues.filter(i=>["Resolved","Closed"].includes(i.status)).length;

  if(!authed) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,#0B1F3A,#0E3A5A)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',Arial,sans-serif"}}>
      <style>{`input:focus{outline:2px solid ${SHA_BLUE}!important}`}</style>
      <div style={{background:"#fff",borderRadius:20,padding:44,width:340,boxShadow:"0 32px 80px rgba(0,0,0,0.4)",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:14}}>🔐</div>
        <div style={{fontWeight:800,fontSize:20,color:SHA_BLUE_D,marginBottom:4}}>SHA Staff Access</div>
        <div style={{fontSize:13,color:"#9CA3AF",marginBottom:28}}>Internal use only. Enter your department PIN.</div>
        <input type="password" value={pin} onChange={e=>setPin(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&(pin===SHA_PIN?setAuthed(true):setPinErr("Incorrect PIN."))}
          placeholder="Enter PIN"
          style={{width:"100%",padding:"12px",border:`1.5px solid ${pinErr?"#EF4444":"#E5E7EB"}`,borderRadius:10,fontSize:18,textAlign:"center",letterSpacing:8,marginBottom:8,fontFamily:"monospace",color:"#111827",boxSizing:"border-box",outline:"none"}}/>
        {pinErr && <div style={{color:"#EF4444",fontSize:12,marginBottom:10}}>{pinErr}</div>}
        <button onClick={()=>{pin===SHA_PIN?setAuthed(true):setPinErr("Incorrect PIN.");}}
          style={{width:"100%",background:SHA_BLUE,color:"#fff",border:"none",padding:"13px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
          Access Dashboard
        </button>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#9CA3AF",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Back to Home</button>
        <div style={{marginTop:16,fontSize:11,color:"#D1D5DB"}}>Staff PIN: SHA2025</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"'Segoe UI',Arial,sans-serif"}}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}} input:focus,select:focus,textarea:focus{outline:2px solid ${SHA_BLUE}!important;outline-offset:1px}`}</style>
      {toast && <div style={{position:"fixed",top:14,right:14,zIndex:9999,background:SHA_GREEN,color:"#fff",padding:"11px 20px",borderRadius:10,fontWeight:700,fontSize:13,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>{toast}</div>}
      <div style={{background:SHA_BLUE,padding:"0 28px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:14,paddingTop:14}}>
          <button onClick={onBack} style={{border:"none",background:"rgba(255,255,255,0.1)",cursor:"pointer",color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:700,padding:"6px 12px",borderRadius:8,fontFamily:"inherit"}}>← Home</button>
          <div style={{width:1,height:20,background:"rgba(255,255,255,0.15)"}}/>
          <div style={{width:34,height:34,borderRadius:8,background:`linear-gradient(135deg,${SHA_GREEN},${SHA_CYAN})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏥</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>SHA Internal Dashboard</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Provider Management Department</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            {[{l:"Active",v:openCount,c:"#60A5FA"},{l:"Resolved",v:resolvedCount,c:"#34D399"},{l:"Total",v:issues.length,c:SHA_CYAN}].map(s=>(
              <div key={s.l} style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"6px 14px",textAlign:"center"}}>
                <div style={{fontSize:17,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:4,marginTop:10}}>
          {[{id:"dashboard",l:"📊 Dashboard"},{id:"issues",l:"📋 All Issues"},{id:"analytics",l:"📈 Analytics"}].map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setSelected(null);}} style={{padding:"9px 18px",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,borderRadius:"8px 8px 0 0",background:tab===t.id?"#F1F5F9":"transparent",color:tab===t.id?SHA_BLUE_D:"rgba(255,255,255,0.6)"}}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1280,margin:"0 auto",padding:"24px 20px"}}>
        {tab==="dashboard" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
              {[{l:"New This Week",v:issues.filter(i=>(Date.now()-new Date(i.submittedAt||Date.now()))/(1000*60*60*24)<=7).length,icon:"📨",c:"#3B82F6"},
                {l:"Pending Action",v:openCount,icon:"⚙️",c:"#F59E0B"},
                {l:"Resolved",v:resolvedCount,icon:"✅",c:SHA_GREEN},
                {l:"Escalated",v:issues.filter(i=>i.status==="Escalated").length,icon:"🚨",c:"#EF4444"}
              ].map(c=>(
                <div key={c.l} style={{background:"#fff",borderRadius:12,padding:"18px 20px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",borderLeft:`4px solid ${c.c}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:22}}>{c.icon}</span><div style={{fontSize:10,fontWeight:700,color:"#6B7280",letterSpacing:0.7}}>{c.l.toUpperCase()}</div></div>
                  <div style={{fontSize:28,fontWeight:800,color:c.c}}>{c.v}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:22,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,color:SHA_BLUE_D}}>Recent Submissions</div>
                <button onClick={()=>setTab("issues")} style={{fontSize:12,color:SHA_BLUE,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>View All →</button>
              </div>
              {issues.slice(0,8).map((issue,i)=>(
                <div key={issue.id} onClick={()=>{setSelected(issue);setTab("issues");}}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 8px",borderRadius:10,cursor:"pointer",borderBottom:i<7?"1px solid #F3F4F6":"none"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{width:34,height:34,borderRadius:9,background:STATUS_META[issue.status]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{STATUS_META[issue.status]?.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{issue.facilityName}</div>
                    <div style={{fontSize:11,color:"#9CA3AF"}}>{issue.issueType} · {issue.county}</div>
                  </div>
                  <div style={{fontFamily:"monospace",fontSize:11,color:"#9CA3AF"}}>{issue.refNo}</div>
                  <div style={{background:STATUS_META[issue.status]?.bg,color:STATUS_META[issue.status]?.color,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{issue.status}</div>
                </div>
              ))}
              {issues.length===0 && <div style={{textAlign:"center",padding:40,color:"#9CA3AF",fontSize:13}}>No issues submitted yet.</div>}
            </div>
          </div>
        )}

        {tab==="issues" && (
          <div style={{display:"grid",gridTemplateColumns:selected?"1fr 400px":"1fr",gap:16}}>
            <div>
              <div style={{background:"#fff",borderRadius:12,padding:"12px 16px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                <input placeholder="🔍 Search facility or ref no…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{flex:"1 1 180px",padding:"8px 10px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,color:"#111827",fontFamily:"inherit",outline:"none"}}/>
                {[{v:fStatus,s:setFStatus,opts:["All",...STATUSES],ph:"All Statuses"},{v:fType,s:setFType,opts:["All",...ISSUE_TYPES],ph:"All Issue Types"},{v:fCounty,s:setFCounty,opts:["All",...COUNTIES],ph:"All Counties"}].map((f,i)=>(
                  <select key={i} value={f.v} onChange={e=>f.s(e.target.value)} style={{flex:"1 1 120px",padding:"8px 10px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:12,color:"#111827",fontFamily:"inherit",outline:"none"}}>
                    <option value="All">{f.ph}</option>
                    {f.opts.filter(o=>o!=="All").map(o=><option key={o}>{o}</option>)}
                  </select>
                ))}
                <span style={{fontSize:12,color:"#6B7280",fontWeight:700}}>{filtered.length}/{issues.length}</span>
              </div>
              <div style={{background:"#fff",borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:SHA_BLUE}}>
                        {["Date","Facility","County","Issue","Ref No.","Status","Contact"].map(h=>(
                          <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",letterSpacing:0.7,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length===0 ? (
                        <tr><td colSpan={7} style={{textAlign:"center",padding:48,color:"#9CA3AF",fontSize:13}}>No issues match your filters.</td></tr>
                      ) : filtered.map((issue,i)=>(
                        <tr key={issue.id} onClick={()=>setSelected(selected?.id===issue.id?null:issue)}
                          style={{background:selected?.id===issue.id?"#E8F2FC":i%2===0?"#fff":"#FAFAFA",cursor:"pointer",borderBottom:"1px solid #F3F4F6",borderLeft:selected?.id===issue.id?`3px solid ${SHA_BLUE}`:"3px solid transparent"}}>
                          <td style={{padding:"10px 14px",fontSize:11,color:"#6B7280",whiteSpace:"nowrap"}}>{fmtDate(issue.submittedAt)}</td>
                          <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,color:"#111827",minWidth:150,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{issue.facilityName}</td>
                          <td style={{padding:"10px 14px"}}><span style={{background:SHA_BLUE_L,color:SHA_BLUE,padding:"2px 8px",borderRadius:20,fontWeight:600,fontSize:11}}>{issue.county}</span></td>
                          <td style={{padding:"10px 14px",fontSize:11,color:SHA_CYAN_D,fontWeight:600,minWidth:130}}>{issue.issueType}</td>
                          <td style={{padding:"10px 14px",fontSize:11,fontFamily:"monospace",color:"#9CA3AF"}}>{issue.refNo}</td>
                          <td style={{padding:"10px 14px"}}><span style={{background:STATUS_META[issue.status]?.bg,color:STATUS_META[issue.status]?.color,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{STATUS_META[issue.status]?.icon} {issue.status}</span></td>
                          <td style={{padding:"10px 14px",fontSize:11,color:"#6B7280"}}>{issue.contactPerson}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {selected && (
              <div style={{background:"#fff",borderRadius:14,padding:22,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",position:"sticky",top:86,maxHeight:"calc(100vh-110px)",overflowY:"auto",animation:"slideIn 0.25s ease"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontWeight:800,fontSize:15,color:SHA_BLUE_D}}>Issue Details</div>
                  <button onClick={()=>setSelected(null)} style={{border:"none",background:"#F3F4F6",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:13,color:"#374151"}}>✕</button>
                </div>
                <div style={{background:SHA_BLUE_L,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
                  <div style={{fontWeight:800,fontSize:15,color:SHA_BLUE_D,marginBottom:2}}>{selected.facilityName}</div>
                  <div style={{fontSize:11,fontFamily:"monospace",color:SHA_BLUE,marginBottom:4}}>{selected.refNo}</div>
                  <div style={{fontSize:12,color:SHA_BLUE}}>{selected.issueType}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                  {[["County",selected.county],["MFL/FID",selected.mflCode||"—"],["Contact",selected.contactPerson],["Phone",selected.contactPhone||"—"],["Email",selected.contactEmail||"—"],["Submitted",fmtDate(selected.submittedAt)]].map(([k,v])=>(
                    <div key={k} style={{background:"#F9FAFB",borderRadius:8,padding:"9px 11px"}}>
                      <div style={{fontSize:9,fontWeight:700,color:"#9CA3AF",letterSpacing:0.7,marginBottom:3}}>{k.toUpperCase()}</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#111827",wordBreak:"break-all"}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"#F9FAFB",borderRadius:10,padding:"11px 13px",marginBottom:14}}>
                  <div style={{fontSize:9,fontWeight:700,color:"#9CA3AF",letterSpacing:0.7,marginBottom:4}}>DESCRIPTION</div>
                  <div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{selected.description||"—"}</div>
                </div>
                <div style={{borderTop:"1px solid #F3F4F6",paddingTop:14,marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:6}}>Update Status</div>
                  <select value={editStatus} onChange={e=>setEditStatus(e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${STATUS_META[editStatus]?.color}60`,borderRadius:8,fontSize:12,color:STATUS_META[editStatus]?.color,background:STATUS_META[editStatus]?.bg,fontWeight:700,fontFamily:"inherit",outline:"none"}}>
                    {STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:6}}>Assigned To</div>
                  <input value={editAssigned} onChange={e=>setEditAssigned(e.target.value)} placeholder="Officer name" style={{width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:12,color:"#111827",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:6}}>Add Internal Note</div>
                  <textarea value={editNote} onChange={e=>setEditNote(e.target.value)} rows={3} placeholder="Action taken, update, or note…" style={{width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:12,color:"#111827",resize:"vertical",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <button onClick={handleSave} disabled={saving} style={{width:"100%",background:SHA_BLUE,color:"#fff",border:"none",padding:"11px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:16,opacity:saving?0.7:1}}>
                  {saving?"Saving…":"💾 Save Changes"}
                </button>
                <div style={{borderTop:"1px solid #F3F4F6",paddingTop:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#9CA3AF",letterSpacing:0.8,marginBottom:10}}>ACTIVITY LOG</div>
                  {(selected.history||[]).slice().reverse().map((h,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:10}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:SHA_BLUE,marginTop:5,flexShrink:0}}/>
                      <div>
                        <div style={{fontSize:12,color:"#111827",fontWeight:500}}>{h.action}</div>
                        <div style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{h.by} · {new Date(h.at).toLocaleString("en-KE")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="analytics" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {[{l:"Total Issues",v:issues.length,c:SHA_BLUE},{l:"Active",v:openCount,c:"#F59E0B"},{l:"Resolution Rate",v:issues.length?`${Math.round(resolvedCount/issues.length*100)}%`:"—",c:SHA_GREEN}].map(c=>(
                <div key={c.l} style={{background:"#fff",borderRadius:12,padding:"18px 20px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",borderTop:`3px solid ${c.c}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#6B7280",letterSpacing:0.7,marginBottom:6}}>{c.l.toUpperCase()}</div>
                  <div style={{fontSize:28,fontWeight:800,color:c.c}}>{c.v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <div style={{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <div style={{fontWeight:800,fontSize:14,color:SHA_BLUE_D,marginBottom:4}}>Issues by Type</div>
                <div style={{fontSize:11,color:"#6B7280",marginBottom:14}}>Most frequent issue categories</div>
                {byType.length===0?<div style={{textAlign:"center",padding:40,color:"#D1D5DB",fontSize:13}}>No data</div>:(
                  <ResponsiveContainer width="100%" height={240}><BarChart data={byType} layout="vertical" margin={{left:10,right:24}}>
                    <XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={150}/>
                    <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"none"}}/><Bar dataKey="count" radius={[0,6,6,0]}>{byType.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Bar>
                  </BarChart></ResponsiveContainer>
                )}
              </div>
              <div style={{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <div style={{fontWeight:800,fontSize:14,color:SHA_BLUE_D,marginBottom:4}}>Status Pipeline</div>
                <div style={{fontSize:11,color:"#6B7280",marginBottom:14}}>Current resolution status</div>
                {byStatus.length===0?<div style={{textAlign:"center",padding:40,color:"#D1D5DB",fontSize:13}}>No data</div>:(
                  <ResponsiveContainer width="100%" height={240}><PieChart>
                    <Pie data={byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({name,percent})=>`${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`}>
                      {byStatus.map(e=><Cell key={e.name} fill={STATUS_META[e.name]?.color||SHA_BLUE}/>)}
                    </Pie><Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"none"}}/><Legend/>
                  </PieChart></ResponsiveContainer>
                )}
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:12,padding:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <div style={{fontWeight:800,fontSize:14,color:SHA_BLUE_D,marginBottom:4}}>Top Counties by Issue Volume</div>
              <div style={{fontSize:11,color:"#6B7280",marginBottom:14}}>Geographic distribution</div>
              {byCounty.length===0?<div style={{textAlign:"center",padding:40,color:"#D1D5DB",fontSize:13}}>No data</div>:(
                <ResponsiveContainer width="100%" height={200}><BarChart data={byCounty} margin={{left:0,right:16,bottom:28}}>
                  <XAxis dataKey="name" tick={{fontSize:10}} angle={-30} textAnchor="end"/>
                  <YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{fontSize:12,borderRadius:8,border:"none"}}/>
                  <Bar dataKey="count" radius={[6,6,0,0]}>{byCounty.map((_,i)=><Cell key={i} fill={i===0?SHA_CYAN:SHA_BLUE} fillOpacity={Math.max(0.45,1-i*0.05)}/>)}</Bar>
                </BarChart></ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProvSection({label}){
  return <div style={{fontWeight:700,fontSize:13,color:SHA_BLUE,margin:"18px 0 12px",paddingBottom:6,borderBottom:`1.5px solid ${SHA_BLUE}20`}}>{label}</div>;
}
function PField({label,k,required,errors,children}){
  return <div style={{marginBottom:14}}>
    <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{label}{required&&<span style={{color:"#EF4444"}}> *</span>}</label>
    {children}
    {errors[k]&&<div style={{fontSize:11,color:"#EF4444",marginTop:3}}>⚠ {errors[k]}</div>}
  </div>;
}
