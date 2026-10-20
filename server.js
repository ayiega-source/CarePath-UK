// Node.js / Express backend. Uses Stripe Checkout so this server never handles card numbers.
require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const path = require("path");
const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PORT = process.env.PORT || 3000;
const FEE_PENCE = Math.max(100, Number.parseInt(process.env.APPLICATION_FEE_PENCE || "500", 10));
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");

const jobs = [
  {id:1,title:"Registered Adult Nurse",employer:"Example NHS Trust"},
  {id:2,title:"Mental Health Nurse",employer:"Example Health Partnership"},
  {id:3,title:"Children's Staff Nurse",employer:"Example Children's Centre"},
  {id:4,title:"Care Home Nurse",employer:"Example Care Group"},
  {id:5,title:"Community Staff Nurse",employer:"Example Community Services"},
  {id:6,title:"Registered Nurse – Ward",employer:"Example University Hospital"}
];

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/config",(req,res)=>res.json({feePence:FEE_PENCE,currency:"GBP"}));

app.post("/api/create-checkout-session",async(req,res)=>{
  try {
    if(!stripe) return res.status(503).json({error:"Payments are not configured yet. Add STRIPE_SECRET_KEY to your .env file."});
    const {jobId,feeConsent}=req.body||{};
    const job=jobs.find(j=>j.id===Number(jobId));
    if(!job) return res.status(400).json({error:"Please choose a valid job."});
    if(feeConsent!==true) return res.status(400).json({error:"Fee disclosure consent is required."});
    const session=await stripe.checkout.sessions.create({
      mode:"payment",
      payment_method_types:["card"],
      line_items:[{price_data:{currency:"gbp",unit_amount:FEE_PENCE,product_data:{name:"CarePath UK platform service fee",description:`Platform service fee related to application for ${job.title}. Not an employer or NHS fee.`}},quantity:1}],
      metadata:{jobId:String(job.id),jobTitle:job.title,feeConsent:"true"},
      success_url:`${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${SITE_URL}/index.html?payment=cancelled`,
      billing_address_collection:"auto"
    });
    res.json({url:session.url});
  } catch(error) {
    console.error("Checkout error:",error.message);
    res.status(500).json({error:"Could not create secure checkout session."});
  }
});

// Verify payment on the server before unlocking the application form.
app.get("/api/verify-payment",async(req,res)=>{
  try{
    if(!stripe)return res.status(503).json({error:"Payments are not configured."});
    const id=String(req.query.session_id||"");
    if(!id.startsWith("cs_"))return res.status(400).json({error:"Invalid checkout session."});
    const session=await stripe.checkout.sessions.retrieve(id);
    if(session.payment_status!=="paid")return res.status(402).json({error:"Payment has not been confirmed."});
    const jobId=Number(session.metadata?.jobId);
    const job=jobs.find(j=>j.id===jobId);
    if(!job)return res.status(400).json({error:"Job not found."});
    res.json({paid:true,job:{id:job.id,title:job.title,employer:job.employer},reference:session.id});
  }catch(error){res.status(500).json({error:"Unable to verify payment."});}
});

app.post("/api/applications",async(req,res)=>{
  try{
    if(!stripe)return res.status(503).json({error:"Payments are not configured."});
    const {sessionId,fullName,email,phone,registrationStatus,coverNote}=req.body||{};
    if(!sessionId||!fullName||!email||!registrationStatus)
      return res.status(400).json({error:"Please complete all required fields."});
    const session=await stripe.checkout.sessions.retrieve(String(sessionId));
    if(session.payment_status!=="paid"||session.metadata?.feeConsent!=="true")
      return res.status(402).json({error:"A verified payment is required before submitting."});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({error:"Enter a valid email address."});
    // DEMO ONLY: persist applications to a database and send a receipt in production.
    // Do not log or store sensitive health or identity data unnecessarily.
    const reference="CP-"+Date.now().toString(36).toUpperCase();
    console.log("Demo application received:",{reference,jobId:session.metadata.jobId,fullName,email,phone,registrationStatus,coverNote});
    res.json({success:true,reference,message:"Demo application received. Configure secure database storage before going live."});
  }catch(error){res.status(500).json({error:"Unable to submit application."});}
});

app.listen(PORT,()=>console.log(`CarePath UK demo running at ${SITE_URL}`));
