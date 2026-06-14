import React, { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Coins, 
  FileText, 
  Filter, 
  Globe, 
  MapPin, 
  MessageSquare, 
  Plus, 
  Search, 
  Send, 
  Building2, 
  Calendar, 
  ChevronRight, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertOctagon, 
  ThumbsUp,
  Wifi,
  WifiOff,
  User,
  ShieldAlert,
  ChevronDown,
  Info
} from "lucide-react";
import { RoadProject, RoadComplaint, ChatMessage } from "./types";

// Static premium SVGs representing typical road issues
const HOLES_SVGS = {
  pothole: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60' fill='%23475569'><rect width='100' height='60' fill='%23334155'/><circle cx='45' cy='32' r='18' fill='%231e293b'/><ellipse cx='48' cy='32' rx='22' ry='12' fill='%230f172a'/><path d='M25,28 Q35,18 45,30 M42,38 Q65,45 70,30' stroke='%23475569' stroke-width='2' fill='none'/><circle cx='65' cy='25' r='5' fill='%230f172a'/></svg>",
  cracking: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60' fill='%23475569'><rect width='100' height='60' fill='%23334155'/><path d='M10,20 L30,25 L45,15 L50,35 L70,38 L90,20 M30,25 L35,45 L40,55 M70,38 L65,55' stroke='%230f172a' stroke-width='3' fill='none'/><path d='M11,20 L29,25 L44,15 L51,35 L69,38 M31,26 L36,44' stroke='%23e2e8f0' stroke-width='0.5' fill='none'/></svg>",
  flooding: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60' fill='%23475569'><rect width='100' height='60' fill='%231e293b'/><path d='M0,40 Q25,35 50,40 T100,40 L100,60 L0,60 Z' fill='%2338bdf8' opacity='0.7'/><path d='M0,45 Q25,48 50,42 T100,45 L100,60 L0,60 Z' fill='%230284c7' opacity='0.8'/><circle cx='50' cy='30' r='6' fill='%23334155'/><path d='M44,30 Q50,22 56,30' fill='none' stroke='%23ef4444' stroke-width='2'/></svg>",
  shoulder: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60' fill='%23475569'><rect width='90' height='60' fill='%23334155'/><rect x='90' y='0' width='10' height='60' fill='%2316a34a'/><path d='M75,0 L82,60' stroke='%23facc15' stroke-width='2' stroke-dasharray='4,4'/><path d='M85,15 L95,20 L87,35 L90,50' stroke='%23ef4444' stroke-width='4' fill='none'/></svg>"
};

// Helper to render simple inline bold markdown (e.g. **text**)
const parseInlineFormatting = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-slate-900 border-b border-transparent">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

// Custom layout-informed Markdown text block renderer
const renderChatBubbleContent = (content: string) => {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Match lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.replace(/^[-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-1 pb-0.5 ml-2">
              <span className="text-blue-600 font-bold select-none">•</span>
              <span className="text-xs text-slate-700 font-medium leading-normal">
                {parseInlineFormatting(text)}
              </span>
            </div>
          );
        }

        // Match clean dividers or horizontal rules
        if (trimmed === "***" || trimmed === "---" || trimmed === "___") {
          return <hr key={idx} className="my-2 border-slate-200" />;
        }

        // Handle raw ###, ## or # tags if present - strip and bold
        if (trimmed.startsWith('### ') || trimmed.startsWith('###')) {
          const text = trimmed.replace(/^###\s*/, '');
          return (
            <h5 key={idx} className="font-bold text-slate-950 text-xs mt-3.5 mb-1 block uppercase tracking-wider font-sans border-l-2 border-blue-500 pl-2">
              {parseInlineFormatting(text)}
            </h5>
          );
        }
        if (trimmed.startsWith('## ') || trimmed.startsWith('##')) {
          const text = trimmed.replace(/^##\s*/, '');
          return (
            <h4 key={idx} className="font-bold text-slate-950 text-sm mt-4 mb-1.5 block font-sans">
              {parseInlineFormatting(text)}
            </h4>
          );
        }
        if (trimmed.startsWith('# ') || trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#\s*/, '');
          return (
            <h3 key={idx} className="font-extrabold text-slate-950 text-base mt-4.5 mb-2 block font-sans">
              {parseInlineFormatting(text)}
            </h3>
          );
        }

        if (trimmed === "") {
          return <div key={idx} className="h-1" />;
        }

        return (
          <p key={idx} className="text-xs text-slate-700 leading-normal">
            {parseInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export default function App() {
  // Application Data States
  const [roads, setRoads] = useState<RoadProject[]>([]);
  const [reports, setReports] = useState<RoadComplaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<"roads" | "report" | "ledger" | "assistant">("roads");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [selectedRoadDetails, setSelectedRoadDetails] = useState<RoadProject | null>(null);

  // Network Offline Emulation States
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [offlineBuffer, setOfflineBuffer] = useState<RoadComplaint[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // New Complaint Form States
  const [formRoadId, setFormRoadId] = useState<string>("");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formSeverity, setFormSeverity] = useState<"Low" | "Medium" | "High" | "Extreme">("Medium");
  const [formLocation, setFormLocation] = useState<string>("");
  const [formLat, setFormLat] = useState<number>(0);
  const [formLng, setFormLng] = useState<number>(0);
  const [formName, setFormName] = useState<string>("");
  const [formContact, setFormContact] = useState<string>("");
  const [formImage, setFormImage] = useState<string>(HOLES_SVGS.pothole); // default svg
  const [selectedPresetImage, setSelectedPresetImage] = useState<keyof typeof HOLES_SVGS>("pothole");
  const [fileUploadHover, setFileUploadHover] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // AI Assistant Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init-message",
      role: "assistant",
      content: "**Welcome to RoadWatch AI!** \n\nI am your simple AI helper for the **TrackMyRoad** website. Ask me anything about:\n- **Companies & Budgets** for our highways.\n- **Department Contacts** (emails and phone numbers of road engineers).\n- **Complaint Email Drafts** to send directly to repair departments.",
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Initialize and Fetch from the server API
  useEffect(() => {
    fetchCoreData();
    
    // Load local offline cache if it exists
    const cachedOffline = localStorage.getItem("track_my_road_offline_buffer");
    if (cachedOffline) {
      try {
        setOfflineBuffer(JSON.parse(cachedOffline));
      } catch (e) {
        console.error("Failed to parse cached reports", e);
      }
    }
  }, []);

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const roadsResponse = await fetch("/api/roads");
      const reportsResponse = await fetch("/api/reports");
      
      if (roadsResponse.ok && reportsResponse.ok) {
        const roadsData = await roadsResponse.json();
        const reportsData = await reportsResponse.json();
        setRoads(roadsData);
        setReports(reportsData);
        setErrorStatus(null);
      } else {
        setErrorStatus("Server API routes did not bind successfully. Running local simulation instead.");
        setupFallbackInitialState();
      }
    } catch (err: any) {
      console.warn("Express Server not responding directly. Using robust client-side simulation fallbacks.");
      setupFallbackInitialState();
    } finally {
      setLoading(false);
    }
  };

  // Safe fallback offline datasets in case client is entirely disconnected or container boots raw
  const setupFallbackInitialState = () => {
    setRoads([
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
        budgetSanctioned: 12000000000,
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
        budgetSanctioned: 4500000000,
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
        budgetSanctioned: 150000000,
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
        budgetSpent: 19200000,
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
      }
    ]);

    setReports([
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
      }
    ]);
  };

  // Sync Offline Queue and Buffer to the Live server
  const handleSyncQueue = async () => {
    if (offlineBuffer.length === 0) return;
    setIsSyncing(true);
    let successfullySynced: string[] = [];

    // Attempt sequential posts to the API server
    for (const report of offlineBuffer) {
      try {
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report)
        });
        if (response.ok) {
          successfullySynced.push(report.id);
        }
      } catch (err) {
        console.error("Synch failed for item", report.id, err);
      }
    }

    // Filter out successful synchs
    const updatedBuffer = offlineBuffer.filter(r => !successfullySynced.includes(r.id));
    setOfflineBuffer(updatedBuffer);
    localStorage.setItem("track_my_road_offline_buffer", JSON.stringify(updatedBuffer));
    setIsSyncing(false);

    // Refresh central feed
    fetchCoreData();
  };

  // Local/Internal Client submission logic
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formLocation) {
      alert("Please complete the required details.");
      return;
    }

    const matchedRoad = roads.find(r => r.id === formRoadId);
    
    // Construct local payload mimicking report object
    const simulatedId = `local-rep-${Date.now().toString().slice(-4)}`;
    const pendingReport: RoadComplaint = {
      id: simulatedId,
      roadId: formRoadId || "custom",
      roadName: matchedRoad ? matchedRoad.name : "Local Highway / Municipality Road",
      roadCode: matchedRoad ? matchedRoad.code : "Local Area",
      country: matchedRoad ? matchedRoad.country : "Global Segment",
      region: matchedRoad ? matchedRoad.region : formLocation,
      title: formTitle,
      description: formDescription,
      severity: formSeverity,
      locationText: formLocation,
      lat: formLat || 0,
      lng: formLng || 0,
      reporterName: formName || "Anonymous Citizen",
      reporterContact: formContact || "No Contact",
      imageUrl: formImage,
      assignedAuthority: matchedRoad ? matchedRoad.executiveEngineer.email : "ee.pwd.maintenance@gov.in",
      assignedEngineerName: matchedRoad ? matchedRoad.executiveEngineer.name : "Assigned Regional Division Engineer",
      assignedAuthorityPhone: matchedRoad ? matchedRoad.executiveEngineer.phone : "311 Public Hotline",
      status: "Pending Verification",
      upvotes: 1,
      dateSubmitted: new Date().toISOString(),
      source: "Citizen Web Submission",
      isOfflineDraft: isOfflineSimulated
    };

    if (isOfflineSimulated) {
      // Offline mode: push to buffer
      const newBuffer = [pendingReport, ...offlineBuffer];
      setOfflineBuffer(newBuffer);
      localStorage.setItem("track_my_road_offline_buffer", JSON.stringify(newBuffer));
      
      // Opt-in reports list temporarily for local feedback
      setReports(prev => [pendingReport, ...prev]);
      setSubmitSuccess(true);
      resetForm();
    } else {
      // Online mode: POST to backend
      try {
        const response = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roadId: formRoadId,
            title: formTitle,
            description: formDescription,
            severity: formSeverity,
            locationText: formLocation,
            lat: formLat,
            lng: formLng,
            reporterName: formName,
            reporterContact: formContact,
            imageUrl: formImage
          })
        });

        if (response.ok) {
          const freshReport = await response.json();
          setReports(prev => [freshReport, ...prev]);
          setSubmitSuccess(true);
          resetForm();
        } else {
          // If server fails, save to local buffer
          throw new Error("HTTP failure");
        }
      } catch (err) {
        console.warn("Server unavailable for post. Saving report in offline fallback cache.");
        pendingReport.isOfflineDraft = true;
        const newBuffer = [pendingReport, ...offlineBuffer];
        setOfflineBuffer(newBuffer);
        localStorage.setItem("track_my_road_offline_buffer", JSON.stringify(newBuffer));
        setReports(prev => [pendingReport, ...prev]);
        setSubmitSuccess(true);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormRoadId("");
    setFormTitle("");
    setFormDescription("");
    setFormLocation("");
    setFormLat(0);
    setFormLng(0);
    setFormName("");
    setFormContact("");
    setFormSeverity("Medium");
  };

  // Handle complaint upvoting
  const handleUpvote = async (reportId: string) => {
    // If local offline report, modify local array only
    if (reportId.startsWith("local-")) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r));
      return;
    }

    try {
      const response = await fetch(`/api/reports/${reportId}/upvote`, {
        method: "POST"
      });
      if (response.ok) {
        const updatedReport = await response.json();
        setReports(prev => prev.map(r => r.id === reportId ? updatedReport : r));
      }
    } catch (err) {
      // Failover fallback upvote locally
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r));
    }
  };

  // Submit message to AI Chatbot
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const citizenQuestion = chatInput.trim();
    const newUserMessage: ChatMessage = {
      id: `chat-msg-${Date.now()}`,
      role: "user",
      content: citizenQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, newUserMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        const newAssistantMessage: ChatMessage = {
          id: `chat-msg-resp-${Date.now()}`,
          role: "assistant",
          content: responseData.text,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, newAssistantMessage]);
      } else {
        throw new Error("API Failure");
      }
    } catch (err) {
      // offline simulation mode response directly on client
      setTimeout(() => {
        let fallbackReply = "I am currently disconnected from our remote intelligence sync. However, based on cached TrackMyRoad records, the coordinates of the state roads are logged offline. Select 'Database' tab to retrieve engineer hotlines.";
        const newAssistantMessage: ChatMessage = {
          id: `chat-msg-fallback-${Date.now()}`,
          role: "assistant",
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, newAssistantMessage]);
      }, 800);
    } finally {
      setChatLoading(false);
    }
  };

  // Copy helper for text copying
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Convert files to base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFormImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset photo selector helper
  const selectPresetAndLoad = (presetKey: keyof typeof HOLES_SVGS) => {
    setSelectedPresetImage(presetKey);
    setFormImage(HOLES_SVGS[presetKey]);
  };

  // Rapid routing trigger to write complaints in reporting form
  const handleTriggerComplaintDraft = (road: RoadProject) => {
    setFormRoadId(road.id);
    setFormTitle(`Repair Request for ${road.code} Corridor Segment`);
    setFormLocation(`${road.region}, Area Route Sector`);
    setFormDescription(`Urgent repair needed on the active tarmac layers of ${road.code} constructed by contractor ${road.contractor}. Citizens of ${road.region} report deep surface splitting that puts active transport at risk. Under the public budgetary fund source (${road.fundingSource}), please authorize the warranty relaying process immediately.`);
    setActiveTab("report");
  };

  // Filtering Logic
  const filteredRoads = roads.filter(road => {
    const matchesCountry = selectedCountry === "All" || road.country === selectedCountry;
    const matchesSearch = searchQuery === "" || 
      road.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      road.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      road.contractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      road.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "Low": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "Medium": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "High": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Extreme": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending Verification": return <Clock className="w-4 h-4 text-slate-500" />;
      case "Under Review": return <ShieldAlert className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case "Approved & Work Scheduled": return <Building2 className="w-4 h-4 text-emerald-500" />;
      case "Resolved": return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending Verification": return "text-slate-600 bg-slate-100";
      case "Under Review": return "text-yellow-700 bg-yellow-100";
      case "Approved & Work Scheduled": return "text-emerald-700 bg-emerald-100";
      case "Resolved": return "text-teal-700 bg-teal-100";
      default: return "text-slate-600 bg-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* 1. Title bar (RoadWatch) and App Header (TrackMyRoad) */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-mono font-bold tracking-tight text-xl flex items-center gap-2 shadow-xs">
              <Building2 className="w-5 h-5" />
              <span>RoadWatch</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:inline"></div>
            <div>
              <p className="font-sans font-bold text-lg tracking-tight text-slate-900">TrackMyRoad</p>
              <p className="text-xs text-slate-500 font-mono">Public Road Budget & Repair Portal</p>
            </div>
          </div>

          {/* Emulated Network Resilience Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-center font-mono">
            
            <button
               id="network-simulation-toggle"
               onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all duration-300 ${
                 isOfflineSimulated 
                   ? "bg-amber-50 text-amber-700 border border-amber-200" 
                   : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
               }`}
               title="Turn off internet to test offline reporting"
            >
              <span className={`w-2 h-2 rounded-full ${isOfflineSimulated ? "bg-amber-500" : "bg-blue-600"} pulsing-dot`}></span>
              <span>{isOfflineSimulated ? "📴 Offline Mode (No Internet)" : "📶 Online Mode (Connected)"}</span>
            </button>

            {offlineBuffer.length > 0 && (
              <button
                id="sync-buffer-button"
                onClick={handleSyncQueue}
                disabled={isSyncing || isOfflineSimulated}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  isOfflineSimulated 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                    : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm shadow-blue-600/10"
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sync {offlineBuffer.length} Draft{offlineBuffer.length > 1 ? "s" : ""}</span>
              </button>
            )}

            <button
              onClick={fetchCoreData}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:text-slate-800 transition flex items-center gap-1"
              title="Refresh database state"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Offline Alert Sticky Banner */}
      {isOfflineSimulated && (
        <div id="offline-alert-banner" className="bg-amber-100 text-amber-800 border-b border-amber-200 px-4 py-2 text-center text-sm font-mono font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600" />
          <span>You are in <strong>Offline Mode</strong>. Pothole reports you submit will be saved to your phone's storage. Turn online when ready to sync to the department.</span>
        </div>
      )}

      {/* Main Application Base */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-6">
        
        {/* Banner Intro */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full text-xs font-mono font-semibold">
              <Globe className="w-3.5 h-3.5" />
              <span>Global Road Repair & Tracking Project</span>
            </div>
            <h1 id="main-impact-title" className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              See Road Budgets and Report Potholes Easily
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              We put construction companies, spending amounts, and repair dates in one simple tool. Anyone can report road damage, see where budget money goes, and find the engineer in charge.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
            <button
              onClick={() => setActiveTab("report")}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm shadow-blue-600/10"
            >
              <Plus className="w-4 h-4" />
              <span>Report Pothole</span>
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 border border-slate-200 font-medium text-slate-700 px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Chat with RoadWatch AI</span>
            </button>
          </div>
        </div>

        {/* Dashboard Tabs Grid Controller */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200 pb-2">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full font-sans">
            <button
              id="tab-roads"
              onClick={() => { setActiveTab("roads"); setSelectedRoadDetails(null); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "roads" 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Road Budgets & Costs</span>
            </button>

            <button
              id="tab-report"
              onClick={() => { setActiveTab("report"); setSubmitSuccess(false); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "report" 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Report Road Issues</span>
            </button>

            <button
              id="tab-ledger"
              onClick={() => setActiveTab("ledger")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "ledger" 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Public Reports Feed <span className="bg-slate-200 text-slate-700 text-xs px-1.5 py-0.5 rounded-full ml-1 font-mono font-semibold">{reports.length}</span></span>
            </button>

            <button
              id="tab-assistant"
              onClick={() => setActiveTab("assistant")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "assistant" 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat Assistant</span>
            </button>
          </div>

          {/* Quick Context information */}
          {activeTab === "roads" && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto font-sans">
              {["All", "India", "United States", "United Kingdom", "Kenya"].map((ctr) => (
                <button
                  key={ctr}
                  onClick={() => setSelectedCountry(ctr)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    selectedCountry === ctr 
                      ? "bg-blue-600 text-white font-bold" 
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  {ctr}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LOADING & STATE VIEWS */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center gap-4 shadow-xs">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-mono text-sm">Loading records...</p>
          </div>
        )}

        {/* NOT LOADING VIEWS: RENDER TAB PANELS */}
        {!loading && (
          <div className="space-y-6">

            {/* TAB 1: SANCTIONED INFRASTRUCTURE SPENDING & CONTRACTS LEDGER */}
            {activeTab === "roads" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Roads List left col */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Search and context filter bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-xs">
                    <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search by road code, place name, company, or department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-0 ring-0 hover:ring-0 focus:ring-0 outline-none text-sm text-slate-800 placeholder-slate-400 flex-1"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")} 
                        className="text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Empty state search */}
                  {filteredRoads.length === 0 && (
                    <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                      <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                      <h3 className="font-semibold text-slate-900 text-lg">No roads found</h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto">
                        Try searching different words, like "NH-48", "I-95", "Pune", or "Mumbai".
                      </p>
                    </div>
                  )}

                  {/* Road items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRoads.map((road) => {
                      const utilRate = ((road.budgetSpent / road.budgetSanctioned) * 100);
                      const isOverBudget = road.budgetSpent > road.budgetSanctioned;

                      return (
                        <div 
                          key={road.id} 
                          className={`bg-white rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                            selectedRoadDetails?.id === road.id 
                              ? "border-blue-600 shadow-sm ring-1 ring-blue-600/20" 
                              : "border-slate-200 hover:border-slate-350 hover:shadow-xs"
                          }`}
                        >
                          <div className="p-5 space-y-4">
                            
                            {/* Card badge country & code */}
                            <div className="flex items-center justify-between">
                              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-mono font-medium text-xs">
                                {road.code}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                <span>{road.country}</span>
                              </div>
                            </div>

                            {/* Road Details header */}
                            <div>
                              <h3 className="font-bold text-slate-900 group-hover:text-slate-800 text-base leading-snug">
                                {road.name}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">{road.type} • {road.region}</p>
                            </div>

                            {/* Budget metric box panel */}
                            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-150 font-mono space-y-2.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Approved Budget:</span>
                                <span className="text-slate-800 font-semibold">
                                  {road.currency.includes("₹") ? "₹" : road.currency.includes("£") ? "£" : "$"}{road.budgetSanctioned.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Amount Spent So Far:</span>
                                <span className={isOverBudget ? "text-red-600 font-bold" : "text-blue-700 font-semibold"}>
                                  {road.currency.includes("₹") ? "₹" : road.currency.includes("£") ? "£" : "$"}{road.budgetSpent.toLocaleString()}
                                </span>
                              </div>

                              {/* Fund utility bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500">Spent of Approved Budget</span>
                                  <span className={isOverBudget ? "text-red-600 font-bold" : "text-blue-700"}>
                                    {utilRate.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      isOverBudget 
                                        ? "bg-red-500" 
                                        : utilRate > 95 
                                          ? "bg-amber-500" 
                                          : "bg-blue-600"
                                    }`}
                                    style={{ width: `${Math.min(utilRate, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Contractor & Periodicity status lines */}
                            <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
                              <div>
                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Building Company</p>
                                <p className="text-slate-700 font-medium truncate mt-0.5">{road.contractor}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Last Repaired Date</p>
                                <p className="text-slate-700 font-medium mt-0.5">{road.lastRelayingDate}</p>
                              </div>
                            </div>

                          </div>

                          {/* Quick selection footer actions */}
                          <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between gap-2.5">
                            <button
                              onClick={() => setSelectedRoadDetails(road)}
                              className="text-slate-650 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <span>View Construction Details</span>
                              <ChevronRight className="w-4.5 h-4.5" />
                            </button>

                            <button
                              onClick={() => handleTriggerComplaintDraft(road)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Report Pothole</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Right hand side inspector details */}
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 sticky top-24 space-y-6 shadow-sm">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span>Road Details & Contact</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Select any road on the left to see its engineers, public budget records, and email addresses for direct complaints.
                      </p>
                    </div>

                    {selectedRoadDetails ? (
                      <div className="space-y-6 animate-fadeIn">
                        {/* Selected info header */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-medium">
                              {selectedRoadDetails.code}
                            </span>
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">
                              {selectedRoadDetails.country}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900">{selectedRoadDetails.name}</h4>
                          <p className="text-xs text-slate-500">{selectedRoadDetails.type}</p>
                        </div>

                        {/* Authority Details card */}
                        <div className="space-y-4">
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            <span>Department Engineer in Charge</span>
                          </p>

                          <div className="space-y-3">
                            <div>
                              <p className="text-slate-405 text-[10px] uppercase font-mono tracking-wider">Engineer Name</p>
                              <p className="text-sm font-bold text-slate-800">{selectedRoadDetails.executiveEngineer.name}</p>
                              <p className="text-xs text-blue-600 font-semibold">{selectedRoadDetails.executiveEngineer.designation}</p>
                            </div>

                            <div>
                              <p className="text-slate-405 text-[10px] uppercase font-mono tracking-wider">Department Division</p>
                              <p className="text-xs text-slate-600 font-medium">{selectedRoadDetails.executiveEngineer.department}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 pt-1.5 font-mono">
                              <a 
                                href={`mailto:${selectedRoadDetails.executiveEngineer.email}`}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs text-slate-650 hover:text-slate-900 border border-slate-200 transition"
                              >
                                <span className="text-slate-500">📧 Email:</span>
                                <span className="text-slate-800 truncate select-all">{selectedRoadDetails.executiveEngineer.email}</span>
                              </a>
                              <a 
                                href={`tel:${selectedRoadDetails.executiveEngineer.phone}`}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs text-slate-650 hover:text-slate-900 border border-slate-200 transition"
                              >
                                <span className="text-slate-500">📞 Phone:</span>
                                <span className="text-slate-800 font-bold select-all">{selectedRoadDetails.executiveEngineer.phone}</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Budget Transparency detailed metrics */}
                        <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-150">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-150 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-blue-600" />
                            <span>Budget & Capital Source</span>
                          </p>
                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Funding Source:</span>
                              <span className="text-slate-700 text-right max-w-[180px] truncate" title={selectedRoadDetails.fundingSource}>
                                {selectedRoadDetails.fundingSource}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Contractor (Company):</span>
                              <span className="text-slate-700">{selectedRoadDetails.contractor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Last Relaid Date:</span>
                              <span className="text-blue-600 font-semibold">{selectedRoadDetails.lastRelayingDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium">Next Planned Repair:</span>
                              <span className="text-amber-600 font-semibold">{selectedRoadDetails.nextScheduledResurfacing}</span>
                            </div>
                          </div>
                        </div>

                        {/* Trigger quick assistant guidance routing */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setActiveTab("assistant");
                              setChatInput(`Find the budget spent on ${selectedRoadDetails.code} and write me a complaint email.`);
                            }}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-755 px-4 py-2.5 rounded-xl border border-slate-250 text-xs font-bold transition flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span>Draft Complaint Email using AI Assistant</span>
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50">
                        <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
                        <h4 className="text-sm font-semibold text-slate-700">No Road Selected</h4>
                        <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                          Click <strong>"View Construction Details"</strong> on any road to display direct engineering contact channels.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: REPORT ROAD DISTRESS (REPORT COMPLAINT FORM) */}
            {activeTab === "report" && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  
                  {/* Form Intro */}
                  <div className="border-b border-slate-100 pb-4">
                    <h2 id="report-form-heading" className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="text-blue-600 w-5.5 h-5.5" />
                      <span>Report Road Distress / Potholes</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Write down road damages and report them here. If you are online, we will email your report straight to the repair departments. If you are offline, we save your report so you can send it later.
                    </p>
                  </div>

                  {submitSuccess ? (
                    <div className="p-8 text-center space-y-4 animate-scaleUp">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Report Submitted Successfully!</h3>
                      <p className="text-slate-505 text-sm max-w-sm mx-auto leading-relaxed">
                        {isOfflineSimulated 
                          ? "Report saved offline on your phone! We will send it to the engineer once you are online and click Sync." 
                          : "Your report is saved and published on our website. You can also upvote it in the public list."}
                      </p>
                      <div className="flex gap-3 justify-center pt-2">
                        <button
                          onClick={() => setSubmitSuccess(false)}
                          className="bg-slate-100 hover:bg-slate-200 border border-transparent text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition"
                        >
                          Submit Another Issue
                        </button>
                        <button
                          onClick={() => setActiveTab("ledger")}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
                        >
                          View Public Reports
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleComplaintSubmit} className="space-y-6">
                      
                      {/* Form section 1: Link to Road register (Auto Engineer routing) */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span>1. Which Road has this issue?</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formRoadId}
                          onChange={(e) => setFormRoadId(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-650 rounded-xl p-3 text-sm text-slate-800 outline-none transition"
                          required
                        >
                          <option value="">-- Choose the road or highway segment --</option>
                          {roads.map(r => (
                            <option key={r.id} value={r.id}>{r.code} - {r.name} ({r.country})</option>
                          ))}
                          <option value="custom">Other Local Street / Municipal Road</option>
                        </select>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Info className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <span>Choosing the correct road makes sure your email goes directly to the right engineer in charge!</span>
                        </p>
                      </div>

                      {/* Complaint Details title and description */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        <div className="md:col-span-2 space-y-4">
                          
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Issue Title / Short Heading <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formTitle}
                              onChange={(e) => setFormTitle(e.target.value)}
                              placeholder={`e.g. Big pothole in the left lane`}
                              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-650 rounded-xl p-3 text-sm text-slate-800 outline-none transition"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Tell us more about the damage <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={5}
                              value={formDescription}
                              onChange={(e) => setFormDescription(e.target.value)}
                              placeholder="How deep is it? Does it block cars? Is there water filling it up? Please write a brief description."
                              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-650 rounded-xl p-3 text-sm text-slate-800 outline-none transition leading-relaxed resize-none"
                              required
                            />
                          </div>

                        </div>

                        {/* Severity & Info right panel */}
                        <div className="space-y-4">
                          
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              How Bad is the Hazard? <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col gap-2">
                              {(["Low", "Medium", "High", "Extreme"] as const).map(sev => (
                                <button
                                  key={sev}
                                  type="button"
                                  onClick={() => setFormSeverity(sev)}
                                  className={`px-3 py-2 text-xs font-bold rounded-lg border text-left transition flex items-center justify-between ${
                                    formSeverity === sev 
                                      ? "bg-slate-100 border-blue-600 text-slate-800 ring-1 ring-blue-600/20" 
                                      : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  <span>{sev}</span>
                                  <span className={`w-2.5 h-2.5 rounded-full ${
                                    sev === 'Extreme' ? 'bg-red-500' :
                                    sev === 'High' ? 'bg-orange-500' :
                                    sev === 'Medium' ? 'bg-yellow-500' : 'bg-cyan-500'
                                  }`}></span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                            <span className="font-mono text-blue-600 font-semibold uppercase flex items-center gap-1 text-[10px]">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>What do these levels mean?</span>
                            </span>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              <strong>Extreme</strong>: Dangerous road damage that can damage cars or cause crashes. Needs repair immediately.
                            </p>
                          </div>

                        </div>

                      </div>

                      {/* Geographic details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Address / Landmark (Where is it?) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formLocation}
                            onChange={(e) => setFormLocation(e.target.value)}
                            placeholder="e.g. Opposite the library or outside Cafe Coffee Day"
                            className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-650 rounded-xl p-3 text-sm text-slate-800 outline-none transition"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                            <span>GPS Location (Optional)</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormLat(parseFloat((18.559 + Math.random() * 0.1).toFixed(6)));
                                setFormLng(parseFloat((73.804 + Math.random() * 0.1).toFixed(6)));
                              }}
                              className="text-[10px] font-mono text-blue-600 underline hover:text-blue-700"
                            >
                              Fill Current Location
                            </button>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              step="0.000001"
                              placeholder="Latitude: e.g. 18.5596"
                              value={formLat || ""}
                              onChange={(e) => setFormLat(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-650 rounded-xl p-3 text-sm text-slate-800 outline-none transition"
                            />
                            <input
                              type="number"
                              step="0.000001"
                              placeholder="Longitude: e.g. 73.8042"
                              value={formLng || ""}
                              onChange={(e) => setFormLng(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-650 rounded-xl p-3 text-sm text-slate-800 outline-none transition"
                            />
                          </div>
                        </div>

                      </div>

                      {/* File upload / Selector zone */}
                      <div className="space-y-4">
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          
                          {(Object.keys(HOLES_SVGS) as Array<keyof typeof HOLES_SVGS>).map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => selectPresetAndLoad(key)}
                              className={`bg-slate-50 rounded-xl p-2.5 border transition text-center flex flex-col items-center gap-2 ${
                                selectedPresetImage === key && formImage === HOLES_SVGS[key]
                                  ? "border-blue-600 ring-1 ring-blue-600/20"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <img 
                                src={HOLES_SVGS[key]} 
                                alt={key} 
                                className="w-16 h-10 object-cover rounded opacity-80"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-mono capitalize text-slate-605">
                                {key} Preset
                              </span>
                            </button>
                          ))}
                          
                        </div>

                        {/* Manual Custom Photo Selection */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Or upload a real photo of the road damage
                          </label>
                          <div 
                            className={`border border-dashed rounded-xl p-4 transition-all text-center ${
                              fileUploadHover ? "border-blue-600 bg-slate-50" : "border-slate-200 bg-slate-50/50"
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setFileUploadHover(true); }}
                            onDragLeave={() => setFileUploadHover(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setFileUploadHover(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === "string") setFormImage(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                              id="citizen-pothole-photo"
                            />
                            <label htmlFor="citizen-pothole-photo" className="cursor-pointer space-y-1 block">
                              <span className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold inline-block border border-transparent">
                                Choose Photo
                              </span>
                              <p className="text-[10px] text-slate-500">Drag and drop files here to upload.</p>
                            </label>
                          </div>
                        </div>

                      </div>

                      {/* Mini live visualizer */}
                      {formImage && (
                        <div className="flex items-center gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                          <img 
                            src={formImage} 
                            alt="Tarmac status preview" 
                            className="w-16 h-11 object-cover rounded-md border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-[10px]">
                            <p className="text-slate-700 font-semibold font-mono">Photo Attached</p>
                            <p className="text-slate-500">Your custom photo has been added to this report.</p>
                          </div>
                        </div>
                      )}

                      {/* Your Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Your Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g. Jane Smith"
                            className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-650 rounded-xl p-3 text-sm text-slate-800 outline-none transition"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Your Email or Phone (Optional)
                          </label>
                          <input
                            type="text"
                            value={formContact}
                            onChange={(e) => setFormContact(e.target.value)}
                            placeholder="e.g. jane@example.com"
                            className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-650 rounded-xl p-3 text-sm text-slate-800 outline-none transition"
                          />
                        </div>

                      </div>

                      {/* Submit action */}
                      <div className="pt-4 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-sm transition"
                        >
                          Clear
                        </button>
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Submit Report</span>
                          {isOfflineSimulated && <WifiOff className="w-4 h-4 ml-0.5 text-white" />}
                        </button>
                      </div>

                    </form>
                  )}

                </div>
              </div>
            )}

            {/* TAB 3: PUBLIC DISTREES LEDGER & FEED FEEDBACK */}
            {activeTab === "ledger" && (
              <div className="space-y-4">
                
                {/* Search feed heading summary */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Public Road Reports Feed</h3>
                    <p className="text-xs text-slate-500">List of reports submitted by citizens and their repair status.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Filters:</span>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "All") {
                          fetchCoreData();
                        } else {
                          const queried = reports.filter(r => r.severity === val);
                          setReports(queried);
                        }
                      }}
                      className="bg-slate-50 text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600/10"
                    >
                      <option value="All">Filter by: All Severities</option>
                      <option value="Extreme">Extreme</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    <button
                      onClick={fetchCoreData}
                      className="text-xs font-mono bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition"
                    >
                      Reset filter
                    </button>
                  </div>
                </div>

                {reports.length === 0 && (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="text-slate-700 font-semibold">No reports found.</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All roads are reported good! If you see any road damage, please go to the "Report Pothole/Damage" tab to add one.
                    </p>
                  </div>
                )}

                {/* Grid feed */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((rep) => (
                    <div 
                      key={rep.id} 
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-350 hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden relative shadow-xs"
                    >
                      {/* Visual offline warning indicator */}
                      {rep.isOfflineDraft && (
                        <div className="bg-amber-50 text-amber-700 border-b border-slate-100 px-3 py-1 text-[10px] font-mono flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <WifiOff className="w-3 h-3 text-amber-600" />
                            <span>Saved Offline</span>
                          </span>
                          <span>Will send when online</span>
                        </div>
                      )}

                      {/* Main Body */}
                      <div className="p-5 space-y-4">
                        
                        {/* Feed Card Top Header */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold capitalize ${getSeverityStyle(rep.severity)}`}>
                            {rep.severity} Severity
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            ID: {rep.id}
                          </span>
                        </div>

                        {/* Image Attachment inside Card */}
                        {rep.imageUrl && (
                          <div className="relative rounded-xl overflow-hidden border border-slate-150 h-36 bg-slate-50 flex items-center justify-center">
                            <img 
                              src={rep.imageUrl} 
                              alt="Reported asphalt details" 
                              className="w-full h-full object-cover opacity-90 hover:opacity-100 transition"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-2 left-2 bg-white/85 backdrop-blur text-[9px] text-blue-700 font-semibold font-mono px-2 py-0.5 rounded-full border border-slate-200/40">
                              Photo Evidence
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-slate-900 leading-snug truncate-2-lines" title={rep.title}>
                            {rep.title}
                          </h4>
                          <span className="text-xs bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-slate-600 italic font-medium inline-block max-w-full truncate">
                            🎯 Road: {rep.roadCode} ({rep.roadName})
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed truncate-3-lines" title={rep.description}>
                          {rep.description}
                        </p>

                        {/* Location Details block */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 font-mono text-[10px] space-y-1 text-slate-600">
                          <div className="flex items-center gap-1 text-slate-705">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{rep.locationText}</span>
                          </div>
                          {rep.lat && rep.lng && (
                            <div className="text-[9px] text-slate-400 pl-4.5">
                              GPS Coordinate: {rep.lat.toFixed(5)}° N, {rep.lng.toFixed(5)}° E
                            </div>
                          )}
                        </div>

                        {/* Verification workflow status indicator */}
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 uppercase tracking-widest font-semibold font-mono">Repair Status</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${getStatusColor(rep.status)}`}>
                              {getStatusIcon(rep.status)}
                              <span>{rep.status}</span>
                            </span>
                          </div>
                          <div className="bg-slate-50 text-[10px] p-2.5 rounded-xl border border-slate-150 space-y-1">
                            <p className="text-slate-400 uppercase tracking-wider text-[9px]">Responsible Engineer</p>
                            <p className="text-slate-705 font-bold">{rep.assignedEngineerName}</p>
                            <p className="text-slate-500 text-[9px] font-mono leading-tight">{rep.assignedAuthority}</p>
                          </div>
                        </div>

                      </div>

                      {/* Footer dynamic community interaction */}
                      <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3 flex justify-between items-center text-xs font-mono">
                        
                        <div className="text-[10px] text-slate-400">
                          {new Date(rep.dateSubmitted).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>

                        <button
                          onClick={() => handleUpvote(rep.id)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 hover:text-blue-700 rounded-full font-bold transition shadow-2xs"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{rep.upvotes} Upvote{rep.upvotes !== 1 ? "s" : ""}</span>
                        </button>

                      </div>

                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 4: ROADWATCH AI TRANSPARENCY ASSISTANT CHAT PANEL */}
            {activeTab === "assistant" && (
              <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl flex flex-col h-[580px] overflow-hidden shadow-sm relative">
                
                {/* Chat header panel */}
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full pulsing-dot"></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">RoadWatch AI Assistant</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Powered by Gemini 2.5-flash • Official Road Records</p>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono shrink-0 text-right text-slate-500">
                    {reports.length} Public Reports • {roads.length} Roads Tracked
                  </div>
                </div>

                {/* Suggestions triggers tray */}
                <div className="px-4 py-2 border-b border-slate-150 bg-slate-50/30 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
                  <span className="text-slate-400 shrink-0 font-medium">Quick Questions:</span>
                  {[
                    "What is the budget spent on NH-48?",
                    "Who is the engineer in charge of SH-17?",
                    "Can you write a complaint email for MDR-22 in Pune?",
                    "How does offline mode work?"
                  ].map((presetText, idx) => (
                    <button
                      key={idx}
                      onClick={() => setChatInput(presetText)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-slate-800 px-2.5 py-1 rounded-lg transition text-xs truncate max-w-xs cursor-pointer shadow-3xs"
                    >
                      {presetText.length > 45 ? presetText.substring(0, 45) + "..." : presetText}
                    </button>
                  ))}
                </div>

                {/* Conversation area scroll wrapper */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
                  {chatMessages.map((message, i) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-scaleUp`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-4 text-xs select-text ${
                        message.role === "user" 
                          ? "bg-blue-600 text-white font-medium rounded-tr-none self-end" 
                          : "bg-white text-slate-800 border border-slate-200 rounded-tl-none self-start leading-relaxed space-y-2 font-sans shadow-2xs"
                      }`}>
                        
                        {/* Content text interpreter */}
                        <div className="selection:bg-slate-100">
                          {message.role === "user" ? message.content : renderChatBubbleContent(message.content)}
                        </div>

                        {/* Copy copyable drafted templates */}
                        {message.role === "assistant" && (message.content.includes("SUBJECT:") || message.content.includes("TO:")) && (
                          <div className="mt-2 text-right border-t border-slate-105 pt-2 flex justify-end">
                            <button
                              onClick={() => copyToClipboard(message.content, i)}
                              className="bg-slate-50 hover:bg-slate-100 text-blue-600 hover:text-blue-700 font-mono text-[10px] px-2.5 py-1 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1 font-bold pointer-events-auto"
                            >
                              {copiedIndex === i ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Draft copied! Ready to send</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Complaint Email Draft</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        <div className="text-[9px] mt-2 opacity-50 block text-right font-mono self-end">
                          {message.timestamp}
                        </div>

                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-2 shadow-2xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>RoadWatch AI is looking up road records...</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Chat input box */}
                <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI about spent budgets, contractor efficiency, or request a hotline letter draft..."
                    className="bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl p-3 text-sm text-slate-800 outline-none flex-1 placeholder:text-slate-400 select-text outline-none focus:ring-1 focus:ring-blue-100 text-xs"
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white p-3 rounded-xl transition flex items-center justify-center h-11 w-11 hover:scale-102 active:scale-98 disabled:scale-100 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Grid footer */}
      <footer className="mt-12 border-t border-slate-205 bg-white py-6 text-center text-xs text-slate-500 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div>
            <span>© 2026 <strong className="text-slate-800">TrackMyRoad</strong> Project. All Rights Reserved.</span>
          </div>
          <div className="flex gap-4 text-slate-400">
            <span className="hover:text-blue-600 transition cursor-pointer">RTI transparency guidelines</span>
            <span>•</span>
            <span className="hover:text-blue-600 transition cursor-pointer">PWD Warranties protocol</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
