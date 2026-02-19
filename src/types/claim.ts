export type ClaimStatus =
  | 'denied'
  | 'rejected'
  | 'pending'
  | 'underpaid'
  | 'resolved'
  | 'appealed';

export type ClaimPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AppealType =
  | 'medical_necessity'
  | 'coding_correction'
  | 'timely_filing'
  | 'documentation'
  | 'authorization'
  | 'other';

export interface Claim {
  id: string;
  patientName: string;
  patientId: string;
  dateOfService: string;
  dateSubmitted: string;
  dateDenied?: string;
  deadlineDate?: string;
  status: ClaimStatus;
  priority: ClaimPriority;
  amount: number;
  amountPaid?: number;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  procedureCodes: string[];
  diagnosisCodes: string[];
  denialReason?: string;
  denialCode?: string;
  notes: string[];
  actionHistory: ClaimAction[];
  assignedTo?: string;
  facility?: string;
  providerNpi?: string;
}

export interface ClaimAction {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  notes?: string;
  previousStatus?: ClaimStatus;
  newStatus?: ClaimStatus;
}

export interface ClaimFilter {
  status: ClaimStatus | 'all';
  priority: ClaimPriority | 'all';
  search: string;
  insuranceProvider: string | 'all';
}

export type ClaimSortField = 'dateSubmitted' | 'amount' | 'deadlineDate' | 'priority' | 'patientName';
export type ClaimSortOrder = 'asc' | 'desc';

export interface ClaimSort {
  field: ClaimSortField;
  order: ClaimSortOrder;
}

export interface SuggestedAction {
  recommendedAction: string;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  nextSteps: string[];
}

export interface AppealDraft {
  subject: string;
  body: string;
  attachmentsNeeded: string[];
  appealType: AppealType;
}

export interface StatusUpdate {
  previousStatus: ClaimStatus;
  newStatus: ClaimStatus;
  actionTaken: string;
  notes: string;
  timestamp: string;
}
