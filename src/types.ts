// Domain Types for the TrackMyRoad & RoadWatch Platform

export interface RoadProject {
  id: string;
  name: string;
  code: string;
  type: string;
  country: string;
  region: string;
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
  qualityRating: number;
}

export interface RoadComplaint {
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
  imageUrl?: string; // base64 representation or standard placeholder
  assignedAuthority: string; // Executive engineer email
  assignedEngineerName: string;
  assignedAuthorityPhone: string;
  status: "Pending Verification" | "Under Review" | "Approved & Work Scheduled" | "Resolved";
  upvotes: number;
  dateSubmitted: string;
  source: string;
  isOfflineDraft?: boolean; // True if created offline and pending server synch
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
