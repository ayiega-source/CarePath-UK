const jobs = [
  {id:1,title:"Registered Adult Nurse",employer:"Example NHS Trust",nation:"England",city:"Manchester",specialty:"Adult Nursing",salary:"£29,970–£36,483",type:"Full-time",tag:"Hospital"},
  {id:2,title:"Mental Health Nurse",employer:"Example Health Partnership",nation:"Scotland",city:"Glasgow",specialty:"Mental Health",salary:"£31,892–£39,735",type:"Full-time",tag:"Mental health"},
  {id:3,title:"Children's Staff Nurse",employer:"Example Children's Centre",nation:"Wales",city:"Cardiff",specialty:"Children's Nursing",salary:"£30,420–£37,030",type:"Permanent",tag:"Paediatrics"},
  {id:4,title:"Care Home Nurse",employer:"Example Care Group",nation:"Northern Ireland",city:"Belfast",specialty:"Care Home",salary:"£19–£23 per hour",type:"Full-time",tag:"Care home"},
  {id:5,title:"Community Staff Nurse",employer:"Example Community Services",nation:"England",city:"Birmingham",specialty:"Community Nursing",salary:"£28,407–£34,581",type:"Full-time",tag:"Community"},
  {id:6,title:"Registered Nurse – Ward",employer:"Example University Hospital",nation:"Scotland",city:"Edinburgh",specialty:"Adult Nursing",salary:"£30,229–£37,664",type:"Permanent",tag:"Hospital"}
];
let selectedJob = null;
let feePence = 500;
const grid = document.getElementById("jobGrid");
const modal = document.getElementById("modalBackdrop");
const fmtMoney = pence => new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(pence/100);

function renderJobs(){
  const keyword = document.getElementById("keyword").value.trim().toLowerCase();
  const nation = document.getElementById("nation").value;
  const specialty = document.getElementById("specialty").value;
  const filtered = jobs.filter(job =>
    (!keyword || `${job.title} ${job.employer} ${job.city}`.toLowerCase().includes(keyword)) &&
    (!nation || job.nation === nation) &&
    (!specialty || job.specialty === specialty)
  );
  document.getElementById("resultCount").textContent = `${filtered.length} role${filtered.length===1?"":"s"}`;
  document.getElementById("emptyState").hidden = filtered.length > 0;
  grid.innerHTML = filtered.map(job => `
    <article class="job-card">
      <div class="job-top"><span class="job-tag">${escapeHtml(job.tag)}</span><span class="job-type">${escapeHtml(job.type)}</span></div>
      <h3>${escapeHtml(job.title)}</h3><div class="employer">${escapeHtml(job.employer)}</div>
      <div class="job-meta"><span>⌖ ${escapeHtml(job.city)}, ${escapeHtml(job.nation)}</span><span>◷ ${escapeHtml(job.type)}</span></div>
      <div class="job-bottom"><span class="salary">${escapeHtml(job.salary)}</span><button class="apply-link" data-job="${job.id}">View & apply →</button></div>
    </article>`).join("");
  grid.querySelectorAll("[data-job]").forEach(button => button.addEventListener("click",()=>openApply(Number(button.dataset.job))));
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function openApply(id){
  selectedJob = jobs.find(job=>job.id===id);
  document.getElementById("modalTitle").textContent = `Apply for ${selectedJob.title}`;
  document.getElementById("modalJobInfo").textContent = `${selectedJob.employer} · ${selectedJob.city}, ${selectedJob.nation}`;
  document.getElementById("modalFee").textContent = fmtMoney(feePence);
  document.getElementById("feeConsent").checked = false;
  document.getElementById("modalError").textContent = "";
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeApply(){modal.hidden=true;document.body.style.overflow="";}
document.getElementById("searchBtn").addEventListener("click",renderJobs);
document.getElementById("keyword").addEventListener("keydown",e=>{if(e.key==="Enter")renderJobs();});
document.getElementById("nation").addEventListener("change",renderJobs);
document.getElementById("specialty").addEventListener("change",renderJobs);
document.getElementById("closeModal").addEventListener("click",closeApply);
modal.addEventListener("click",e=>{if(e.target===modal)closeApply();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)closeApply();});

document.getElementById("payBtn").addEventListener("click",async()=>{
  const error = document.getElementById("modalError");
  if(!selectedJob)return;
  if(!document.getElementById("feeConsent").checked){error.textContent="Please confirm that you have read the fee disclosure.";return;}
  error.textContent="";
  const button=document.getElementById("payBtn");
  button.disabled=true;button.textContent="Connecting securely…";
  try{
    const response=await fetch("/api/create-checkout-session",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({jobId:selectedJob.id,feeConsent:true})
    });
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Unable to start payment. Please try again.");
    if(!data.url)throw new Error("Payment provider did not return a checkout link.");
    window.location.href=data.url;
  }catch(err){
    error.textContent=err.message||"Server unavailable. Start the backend and try again.";
    button.disabled=false;button.innerHTML='Continue to secure payment <span>→</span>';
  }
});
document.getElementById("year").textContent=new Date().getFullYear();
fetch("/api/config").then(r=>r.ok?r.json():null).then(config=>{
  if(config&&Number.isInteger(config.feePence)&&config.feePence>0){
    feePence=config.feePence;
    document.getElementById("displayFee").textContent=fmtMoney(feePence);
  }
}).catch(()=>{});
renderJobs();
