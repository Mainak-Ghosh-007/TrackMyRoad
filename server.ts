import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Interface Definitions
interface RoadProject {
  id: string;
  name: string;
  code: string;
  type: string; // National Highway, State Highway, Major District Road, Interstate, Motorway, Autobahn
  country: string;
  region: string; // State / County / Region
  contractor: string;
  lastRelayingDate: string;
  nextScheduledResurfacing: string;
  budgetSanctioned: number;
  budgetSpent: number;
  currency: string;
  fundingSource: string;
  executiveEngineer: {
    name: string;
    designation: string;
    department: string;
    email: string;
    phone: string;
  };
  qualityRating: number; // 1-5
}

interface RoadComplaint {
  id: string;
  roadId: string;
  roadName: string;
  roadCode: string;
  country: string;
  region: string;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Extreme";
  locationText: string;
  lat?: number;
  lng?: number;
  reporterName: string;
  reporterContact: string;
  imageUrl?: string; // base64 representation
  assignedAuthority: string; // EE email
  assignedEngineerName: string;
  assignedAuthorityPhone: string;
  status: "Pending Verification" | "Under Review" | "Approved & Work Scheduled" | "Resolved";
  upvotes: number;
  dateSubmitted: string;
  source: string;
}

// In-Memory Global Road Database with extensive global coverage
let roads: RoadProject[] = [
  {
    id: "india-nh48",
    name: "Delhi-Mumbai Expressway Corridor",
    code: "NH-48",
    type: "National Highway (NH)",
    country: "India",
    region: "Rajasthan / Haryana Border",
    contractor: "Lars & Toubro (L&T) Transportation Infra",
    lastRelayingDate: "2024-12-15",
    nextScheduledResurfacing: "2029-12-15",
    budgetSanctioned: 12000000000, // ₹1,200 Crores
    budgetSpent: 11450000000,
    currency: "INR (₹)",
    fundingSource: "National Highways Authority of India (NHAI) Toll Surcharge Capital",
    executiveEngineer: {
      name: "Er. Rajesh Kumar Shrivastava",
      designation: "Executive Chief Engineer",
      department: "PWD National Highway Div-IV",
      email: "rk.shrivastava.pwd@nic.in",
      phone: "+91-11-23456789"
    },
    qualityRating: 4.2
  },
  {
    id: "india-sh17",
    name: "Bengaluru-Mysuru Expressway Link",
    code: "SH-17",
    type: "State Highway (SH)",
    country: "India",
    region: "Karnataka",
    contractor: "GMR Roadways & Highways Dev Ltd",
    lastRelayingDate: "2025-03-20",
    nextScheduledResurfacing: "2030-03-20",
    budgetSanctioned: 4500000000, // ₹450 Crores
    budgetSpent: 4420000000,
    currency: "INR (₹)",
    fundingSource: "State Budgetary Infrastructure Fund (KRDCL Allocation)",
    executiveEngineer: {
      name: "Er. M. N. Venkatasubbaiah",
      designation: "Executive Division Engineer",
      department: "PWD Southern Zone Division",
      email: "ee.sh17.pwd.kar@nic.in",
      phone: "+91-80-22234567"
    },
    qualityRating: 4.5
  },
  {
    id: "india-mdr22",
    name: "Aundh-Baner Link Bypass Road, Pune",
    code: "MDR-22",
    type: "Major District Road (MDR)",
    country: "India",
    region: "Maharashtra",
    contractor: "S.K. Patil Construction Builders",
    lastRelayingDate: "2023-10-10",
    nextScheduledResurfacing: "2027-10-10",
    budgetSanctioned: 150000000, // ₹15 Crores
    budgetSpent: 148500000,
    currency: "INR (₹)",
    fundingSource: "Pune Municipal Corporation Urban Development Fund",
    executiveEngineer: {
      name: "Er. Anil Patil",
      designation: "Assistant Executive Engineer",
      department: "PMC Roads & Drainage Cell",
      email: "anil.patil.pwd.mh@gov.in",
      phone: "+91-20-25531200"
    },
    qualityRating: 2.8
  },
  {
    id: "usa-i95",
    name: "Interstate 95 Corridor (Exits 15-20)",
    code: "I-95",
    type: "Interstate Highway",
    country: "United States",
    region: "Connecticut (Fairfield County)",
    contractor: "O&G Industries Inc.",
    lastRelayingDate: "2024-08-11",
    nextScheduledResurfacing: "2031-08-11",
    budgetSanctioned: 45000000,
    budgetSpent: 42500000,
    currency: "USD ($)",
    fundingSource: "Federal Highway Trust Fund (FHWA) & Connecticut DOT Capital Plan",
    executiveEngineer: {
      name: "Chief Eng. Katherine Vance",
      designation: "District Construction Manager",
      department: "CT Department of Transportation (CTDOT)",
      email: "katherine.vance@ct.gov",
      phone: "+1-860-594-2000"
    },
    qualityRating: 3.9
  },
  {
    id: "usa-sr1",
    name: "State Route 1 (Calistoga Highway)",
    code: "SR-1",
    type: "State Highway",
    country: "United States",
    region: "California (Napa County)",
    contractor: "Granite Construction Co.",
    lastRelayingDate: "2025-06-01",
    nextScheduledResurfacing: "2032-06-01",
    budgetSanctioned: 18500000,
    budgetSpent: 19200000, // Over budget
    currency: "USD ($)",
    fundingSource: "California State Highway Operation and Protection Program (SHOPP)",
    executiveEngineer: {
      name: "Marcus Broady",
      designation: "Caltrans Area Engineer",
      department: "California Department of Transportation District 4",
      email: "marcus.broady@dot.ca.gov",
      phone: "+1-510-286-4444"
    },
    qualityRating: 4.8
  },
  {
    id: "uk-m4",
    name: "M4 Motorway (Junctions 18-20, Bristol)",
    code: "M4",
    type: "Motorway",
    country: "United Kingdom",
    region: "South West England",
    contractor: "Balfour Beatty plc",
    lastRelayingDate: "2024-09-05",
    nextScheduledResurfacing: "2031-09-05",
    budgetSanctioned: 28000000,
    budgetSpent: 27400000,
    currency: "GBP (£)",
    fundingSource: "UK Department for Transport (National Highways Regional Capital Budget)",
    executiveEngineer: {
      name: "Peter Davies",
      designation: "South West Maintenance Manager",
      department: "National Highways England",
      email: "peter.davies@nationalhighways.co.uk",
      phone: "+44-300-123-5000"
    },
    qualityRating: 4.1
  },
  {
    id: "kenya-a109",
    name: "A109 Mombasa Highway (Athi River Section)",
    code: "A-109",
    type: "International Trunk Road",
    country: "Kenya",
    region: "Machakos / Nairobi County Link",
    contractor: "China Road & Bridge Corporation (CRBC)",
    lastRelayingDate: "2024-11-10",
    nextScheduledResurfacing: "2030-11-10",
    budgetSanctioned: 4500000000, // KES
    budgetSpent: 4320000000,
    currency: "KES",
    fundingSource: "Kenya National Highways Authority (KeNHA) & World Bank Development Capital",
    executiveEngineer: {
      name: "Eng. Samuel Mwangi",
      designation: "Regional Highways Superintendent",
      department: "Kenya National Highways Authority (KeNHA)",
      email: "s.mwangi@kenha.co.ke",
      phone: "+254-20-8013842"
    },
    qualityRating: 3.5
  }
];

// In-Memory Reports Database (Complaints) initialized with some active entries
let reports: RoadComplaint[] = [
  {
    id: "rep-001",
    roadId: "india-mdr22",
    roadName: "Aundh-Baner Link Bypass Road, Pune",
    roadCode: "MDR-22",
    country: "India",
    region: "Maharashtra",
    title: "Severe Road Disintegration and Waterlogging",
    description: "During recent showers, the drainage side of MDR-22 was completely clogged, causing water to pool and strip the asphalt layer, opening huge craters that damage active two-wheelers and cause major delays.",
    severity: "Extreme",
    locationText: "Near Medipoint Hospital, Baner, Pune",
    lat: 18.5596,
    lng: 73.8042,
    reporterName: "Mahesh Deshmukh",
    reporterContact: "mahesh.deshmukh28@gmail.com",
    assignedAuthority: "anil.patil.pwd.mh@gov.in",
    assignedEngineerName: "Er. Anil Patil",
    assignedAuthorityPhone: "+91-20-25531200",
    status: "Approved & Work Scheduled",
    upvotes: 112,
    dateSubmitted: "2026-06-08T10:30:12Z",
    source: "Web Citizen Reporting"
  },
  {
    id: "rep-002",
    roadId: "india-nh48",
    roadName: "Delhi-Mumbai Expressway Corridor",
    roadCode: "NH-48",
    country: "India",
    region: "Rajasthan / Haryana Border",
    title: "Deep Potholes on the Left-most Heavy Transport Lane",
    description: "Deep recurring potholes have developed on the left lane near KM 42 marker. This is causing multi-axle freight trucks to swerve dangerously into fast lanes. Needs immediate hot-mix filling.",
    severity: "High",
    locationText: "NH-48, KM 42 Marker near Dharuhera Toll",
    lat: 28.2125,
    lng: 76.7914,
    reporterName: "Rajeev Singhania",
    reporterContact: "singhania.haulers@outlook.com",
    assignedAuthority: "rk.shrivastava.pwd@nic.in",
    assignedEngineerName: "Er. Rajesh Kumar Shrivastava",
    assignedAuthorityPhone: "+91-11-23456789",
    status: "Under Review",
    upvotes: 46,
    dateSubmitted: "2026-06-11T14:45:00Z",
    source: "Web Citizen Reporting"
  },
  {
    id: "rep-003",
    roadId: "usa-i95",
    roadName: "Interstate 95 Corridor (Exits 15-20)",
    roadCode: "I-95",
    country: "United States",
    region: "Connecticut (Fairfield County)",
    title: "Structural Joint Wear on Bridge Expansion Segment",
    description: "The metallic bridge joint expansion near Exit 16 northbound is extremely rough, causing loud thuds and alignment jolts whenever vehicles cross at highway speed (65 mph). Possible fatigue of rubber dampeners.",
    severity: "Medium",
    locationText: "I-95 North, Junction 16 Overpass, Norwalk",
    lat: 41.1189,
    lng: -73.4128,
    reporterName: "Tyler Henderson",
    reporterContact: "tyler.henderson@yale.edu",
    assignedAuthority: "katherine.vance@ct.gov",
    assignedEngineerName: "Chief Eng. Katherine Vance",
    assignedAuthorityPhone: "+1-860-594-2000",
    status: "Pending Verification",
    upvotes: 23,
    dateSubmitted: "2026-01-13T09:12:00Z",
    source: "Officer Audit"
  }
];

// Setup Server-side Gemini API lazily
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return geminiClient;
}

// 1. GET ALL ROADS
app.get("/api/roads", (req, res) => {
  res.json(roads);
});

// 2. GET SINGLE ROAD SPECIFICS
app.get("/api/roads/:id", (req, res) => {
  const road = roads.find(r => r.id === req.params.id);
  if (road) {
    res.json(road);
  } else {
    res.status(404).json({ error: "Road infrastructure project not found" });
  }
});

// 3. GET CITIZEN REPORTS
app.get("/api/reports", (req, res) => {
  res.json(reports);
});

// 4. SUBMIT NEW CITIZEN REPORT
app.post("/api/reports", (req, res) => {
  const {
    roadId,
    title,
    description,
    severity,
    locationText,
    lat,
    lng,
    reporterName,
    reporterContact,
    imageUrl
  } = req.body;

  if (!title || !description || !severity || !locationText) {
    return res.status(400).json({ error: "Missing required complaint details" });
  }

  // Find routing details based on matched road or use fallback
  const matchedRoad = roads.find(r => r.id === roadId);
  const roadName = matchedRoad ? matchedRoad.name : "Custom / Local Road Area";
  const roadCode = matchedRoad ? matchedRoad.code : "Unclassified / Local";
  const country = matchedRoad ? matchedRoad.country : "United States"; // default fallback
  const region = matchedRoad ? matchedRoad.region : "Local Municipality";

  const assignedAuthority = matchedRoad 
    ? matchedRoad.executiveEngineer.email 
    : "civic-complaints@municipality.gov";
  const assignedEngineerName = matchedRoad 
    ? matchedRoad.executiveEngineer.name 
    : "Designated Local Area Engineer";
  const assignedAuthorityPhone = matchedRoad 
    ? matchedRoad.executiveEngineer.phone 
    : "311 / Citizen Support Line";

  const newReport: RoadComplaint = {
    id: `rep-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
    roadId: roadId || "custom",
    roadName,
    roadCode,
    country,
    region,
    title,
    description,
    severity,
    locationText,
    lat: lat || 0,
    lng: lng || 0,
    reporterName: reporterName || "Anonymous Citizen",
    reporterContact: reporterContact || "Not Provided",
    imageUrl,
    assignedAuthority,
    assignedEngineerName,
    assignedAuthorityPhone,
    status: "Pending Verification",
    upvotes: 1,
    dateSubmitted: new Date().toISOString(),
    source: "Web Citizen Reporting"
  };

  reports.unshift(newReport);
  res.status(201).json(newReport);
});

// 5. UPVOTE A COMPLAINT
app.post("/api/reports/:id/upvote", (req, res) => {
  const report = reports.find(r => r.id === req.params.id);
  if (report) {
    report.upvotes += 1;
    res.json(report);
  } else {
    res.status(404).json({ error: "Report not found" });
  }
});

// 6. CHATBOT ENHANCED WITH SERVER-SIDE GEMINI API
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages payload should be a valid array" });
  }

  // Format historical conversation for context
  const conversationString = messages.map(m => {
    return `${m.role === 'user' ? 'Citizen' : 'RoadWatch Assistant'}: ${m.content}`;
  }).join("\n");

  const systemInstruction = `You are RoadWatch AI, the simple AI helper for the TrackMyRoad platform. Your job is to help people check road quality, understand road budgets, and send complaints to the correct Road Engineer.

Here is the current database of Road Projects:
${JSON.stringify(roads, null, 2)}

Here are the active Citizen Reports filed on the platform:
${JSON.stringify(reports, null, 2)}

GUIDELINES FOR YOUR CONVERSATION:
1. Be extremely friendly, simple, and polite. Avoid difficult engineering or financial jargon. Use simple English words.
2. If the user asks about who to contact or who is the Engineer for a road (like NH-48 or I-95), find the engineer's name, email, and phone number, and provide them clearly in simple words.
3. If the user wants to report an issue, write a complete, simple Complaint Email template they can copy and send (including Subject line, road details, description, and contact info).
4. If the user asks about road costs or budgets, explain it simply. Give the budget spent vs approved, and mention if they are under or over budget. Show where the money came from in simple terms.
5. If the user mentions offline mode, explain that the app saves their reports on their phone memory (localStorage) when there is no internet, and uploads them automatically as soon as internet is back.
6. Framing: DO NOT use markdown title tags like '#', '##', or '###'! Instead, use bold text (like **This Title**) to separate sections and keep everything looking flat, clean, and modern.
7. Support global inquiries—whether it's India (NH/SH/MDR), US (Interstate/State Routes), UK (Motorways), or Kenya.
8. If there is a matching report already on the feed, tell them its status simply, mention the upvotes, and encourage them to click upvote.`;

  try {
    const api = getGeminiClient();

    if (!api) {
      // Rule-based simulated generator if GEMINI_API_KEY is not configured
      console.log("GEMINI_API_KEY not configured or placeholder detected. Falling back to rule-based civic simulator.");
      
      const lastUserQuestion = messages[messages.length - 1]?.content || "";
      let simulatedAnswer = "";

      const lowerQ = lastUserQuestion.toLowerCase();
      if (lowerQ.includes("hi") || lowerQ.includes("hello") || lowerQ.includes("help") || lowerQ.includes("who are you")) {
        simulatedAnswer = `**Hello from RoadWatch AI!**
        
I am your assistant on the **TrackMyRoad** website. I help you track road repair timelines, see matching budgets, and send pothole reports directly to the repair departments.

You can ask me simple questions like:
1. **"What is the budget spent on NH-48?"**
2. **"Who is the engineer in charge of Karnataka SH-17?"**
3. **"Can you write a complaint email for MDR-22 in Pune?"**
4. **"How does the offline mode work if I have no internet?"**

*Note: I am running in local simulation mode because the Gemini API key is not configured, but I can still look up all road records for you!*`;
      } else if (lowerQ.includes("utilization") || lowerQ.includes("budget") || lowerQ.includes("spent") || lowerQ.includes("sanctioned") || lowerQ.includes("cost")) {
        const matchingRoad = roads.find(r => lowerQ.includes(r.code.toLowerCase()) || lowerQ.includes(r.name.toLowerCase()));
        if (matchingRoad) {
          const utilRate = ((matchingRoad.budgetSpent / matchingRoad.budgetSanctioned) * 100).toFixed(1);
          simulatedAnswer = `**📊 Budget & Spending report: ${matchingRoad.code} (${matchingRoad.name})**
          
Here is the financial status from our records:
- **Approved Budget**: ${matchingRoad.currency.includes("₹") || matchingRoad.currency.includes("INR") ? "₹" : matchingRoad.currency.includes("£") ? "£" : "$"}${matchingRoad.budgetSanctioned.toLocaleString()}
- **Money Spent So Far**: ${matchingRoad.currency.includes("₹") || matchingRoad.currency.includes("INR") ? "₹" : matchingRoad.currency.includes("£") ? "£" : "$"}${matchingRoad.budgetSpent.toLocaleString()}
- **Budget Status**: ${((matchingRoad.budgetSanctioned - matchingRoad.budgetSpent) >= 0 ? "Under budget by" : "Over budget by")} ${matchingRoad.currency.includes("₹") || matchingRoad.currency.includes("INR") ? "₹" : matchingRoad.currency.includes("£") ? "£" : "$"}${Math.abs(matchingRoad.budgetSanctioned - matchingRoad.budgetSpent).toLocaleString()}
- **Percentage Spent**: **${utilRate}%**
- **Fund Source**: *${matchingRoad.fundingSource}*
- **Contractor (Company)**: **${matchingRoad.contractor}**

This road was last repaired on **${matchingRoad.lastRelayingDate}** and is scheduled for its next repair on **${matchingRoad.nextScheduledResurfacing}**.`;
        } else {
          simulatedAnswer = `**💰 Budget & Spending Summary**
          
Currently, our register shows budget details for these major roads:
1. **NH-48 (Delhi-Mumbai Expressway)**: ₹1,200 Cr approved | 95.4% spent. Source: *Toll Surcharges*.
2. **SH-17 (Karnataka)**: ₹450 Cr approved | 98.2% spent. Source: *State Road Funds*.
3. **MDR-22 (Pune Roads)**: ₹15 Cr approved | 99% spent. Source: *Municipal Corporation*.
4. **I-95 Corridor (USA)**: $45M approved | 94.4% spent. Source: *Federal Highway Trust*.
5. **SR-1 (California)**: $18.5M approved | 103.8% spent (*Over budget*). Source: *Caltrans SHOPP*.
6. **M4 Motorway (UK)**: £28M approved | 97.9% spent. Source: *National Highways UK*.
7. **A109 Mombasa Road (Kenya)**: KES 4.5B approved | 96% spent. Source: *World Bank & KeNHA*.

*Which road do you want to inspect or know about?*`;
        }
      } else if (lowerQ.includes("engineer") || lowerQ.includes("responsible") || lowerQ.includes("authority") || lowerQ.includes("contact") || lowerQ.includes("who is")) {
        const matchingRoad = roads.find(r => lowerQ.includes(r.code.toLowerCase()) || lowerQ.includes(r.name.toLowerCase()));
        if (matchingRoad) {
          const ee = matchingRoad.executiveEngineer;
          simulatedAnswer = `**🏢 Official Contact Person for ${matchingRoad.code}**
          
The assigned department is responsible for looking into potholes on this road segment:
- **Lead Executive Engineer**: **${ee.name}**
- **Officer Title**: *${ee.designation}*
- **Department**: *${ee.department}*
- **Public Contact Email**: \`${ee.email}\`
- **Phone Helpline**: \`${ee.phone}\`

**Report Status**: Any reports submitted for **${matchingRoad.code}** on our website will be flagged to this officer directly for physical inspection.`;
        } else {
          simulatedAnswer = `To find the correct contact engineer, please tell me which road you are asking about. I have contacts for **NH-48**, **SH-17**, **MDR-22 (Pune)**, **I-95 (USA)**, **SR-1 (CA)**, **M4 (UK)**, and **A109 (Kenya)**.`;
        }
      } else if (lowerQ.includes("draft") || lowerQ.includes("complaint") || lowerQ.includes("email") || lowerQ.includes("letter")) {
        const matchingRoad = roads.find(r => lowerQ.includes(r.code.toLowerCase()) || lowerQ.includes(r.name.toLowerCase())) || roads[2]; // Default to MDR-22
        const ee = matchingRoad.executiveEngineer;
        simulatedAnswer = `**✉️ Official Complaint Email Draft Created**
        
Here is your ready-to-use complaint letter. You can copy it and send it to the department:

**TO:** \`${ee.email}\`
**CC:** \`reports@trackmyroad.civic.org\`
**SUBJECT:** *Complaint: Dangerous Road Conditions and Potholes - ${matchingRoad.code} (${matchingRoad.region})*

***

**Dear ${ee.name},**

I am writing as an active citizen to report a major road safety issue on **${matchingRoad.name} (${matchingRoad.code})** in **${matchingRoad.region}**.

We have noticed deep potholes and severe road damage that are creating dangerous driving conditions, causing tire damage, and slowing down traffic heavily. Since public funds under **${matchingRoad.fundingSource}** were given to contractor **${matchingRoad.contractor}** for this road, we kindly request:
1. A physical site inspection by your team to check the damage.
2. Immediate repairs by the contractor under their warranty terms.
3. Simple updates on the repair status via the public portal so residents can stay informed.

An official report has also been logged as a public record on TrackMyRoad.

Sincerely,  
**Concerned Citizen**  
*(Sent via TrackMyRoad Tool)*`;
      } else if (lowerQ.includes("offline") || lowerQ.includes("network") || lowerQ.includes("no internet")) {
        simulatedAnswer = `**📶 How Offline Mode Works**
        
You can use TrackMyRoad even when you have no internet or mobile network on the road!

- **Saved on Phone**: If you report an issue while offline, our app saves the details and photo safely in your phone's browser memory (localStorage).
- **Offline Mark**: Your unsent reports display a 📴 "Pending Sync Draft" warning on your screen.
- **Auto Upload**: As soon as you open the app with internet later, click the "Sync" button at the top, and the app will upload all reports and email them to the correct Road Engineers!`;
      } else {
        simulatedAnswer = `**🤝 RoadWatch AI Tool**

I can help you check road spending records, find company names, and find contact info of the lead Road Engineer. 

Here is what you can ask me:
- **Road Costs & Budgets**: Search how tax money is used on **NH-48**, **SH-17**, **MDR-22**, **I-95**, etc.
- **Engineer Contact Details**: Find the email address and phone number of the engineer in charge.
- **Check Upvotes**: See how many people upvoted local pothole reports.

Which road or highway would you like to check today?`;
      }

      return res.json({ text: simulatedAnswer, modelUsed: "local-simulation" });
    }

    // Utilize Gemini 2.5-flash
    const response = await api.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: 'user', parts: [{ text: `Below is our entire conversation history:\n${conversationString}\n\nSystem instructions are provided. Answer the citizen's latest query accurately.` }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ text: response.text || "I was unable to formulate a response.", modelUsed: "gemini-2.5-flash" });

  } catch (error: any) {
    console.error("Gemini service exception:", error);
    res.status(500).json({ error: "Failed to query the Gemini assistant.", details: error.message });
  }
});

// Serve Vite middleware in development or static production bundle
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Middlewares integrated with Vite development server running on Port 3000.");
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static bundle from /dist in Production.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TrackMyRoad / RoadWatch server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
