import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// File paths
const claimsPath = path.join(__dirname, '../src/data/claims.json'); // Immutable source of truth
const dataPath = path.join(__dirname, '../src/data/data.json'); // Mutable working copy

// Initialize data.json from claims.json if it doesn't exist
function initializeDataFile() {
  if (!fs.existsSync(dataPath)) {
    const claimsData = fs.readFileSync(claimsPath, 'utf-8');
    fs.writeFileSync(dataPath, claimsData);
    console.log('Initialized data.json from claims.json');
  }
}

// Reset data.json to claims.json state
function resetDataFile() {
  const claimsData = fs.readFileSync(claimsPath, 'utf-8');
  fs.writeFileSync(dataPath, claimsData);
  console.log('Reset data.json to claims.json state');
}

// Load claims from data.json
function loadClaims() {
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(rawData);
}

// Save claims to data.json
function saveClaims(claimsData: any[]) {
  fs.writeFileSync(dataPath, JSON.stringify(claimsData, null, 2));
}

// Initialize data file on startup
initializeDataFile();

// Load initial claims data from data.json (mutable copy)
let rawClaimsData = loadClaims();

// Transform claims for internal use
interface TransformedClaim {
  id: string;
  patientName: string;
  patientId: string;
  dateOfService: string;
  dateSubmitted: string;
  deadlineDate?: string;
  status: string;
  priority: string;
  amount: number;
  amountPaid?: number;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  procedureCodes: string[];
  denialReason?: string;
  denialCode?: string;
  notes: string[];
  facility: string;
  providerNpi: string;
}

function getDaysUntil(date: string): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function computePriority(claim: any): string {
  const deadline = claim.filingDeadline;
  const amount = claim.totalBilledAmount;

  if (deadline) {
    const days = getDaysUntil(deadline);
    if (days <= 14) return 'urgent';
    if (days <= 30) return 'high';
  }

  if (amount >= 10000) return 'high';
  if (amount >= 5000) return 'medium';

  return 'low';
}

function transformClaim(raw: any): TransformedClaim {
  return {
    id: raw.claimId,
    patientName: raw.patient.name,
    patientId: raw.patient.memberId,
    dateOfService: raw.dateOfService,
    dateSubmitted: raw.dateSubmitted,
    deadlineDate: raw.filingDeadline || undefined,
    status: raw.status,
    priority: computePriority(raw),
    amount: raw.totalBilledAmount,
    amountPaid: raw.totalPaidAmount > 0 ? raw.totalPaidAmount : undefined,
    insuranceProvider: raw.payer.name,
    insurancePolicyNumber: raw.payer.payerId,
    procedureCodes: raw.lineItems.map((item: any) => item.cptCode),
    denialReason: raw.denialReason || undefined,
    denialCode: raw.denialCode || undefined,
    notes: raw.payerNotes ? [raw.payerNotes] : [],
    facility: raw.provider.facility,
    providerNpi: raw.provider.npi,
  };
}

// Mutable claims array - we'll reload this when data changes
let claims: TransformedClaim[] = rawClaimsData.map(transformClaim);

// Function to reload claims from data.json
function reloadClaims() {
  rawClaimsData = loadClaims();
  claims = rawClaimsData.map(transformClaim);
}

// Function to update a claim in both memory and data.json
function updateClaimInData(claimId: string, updates: Partial<{ status: string; notes: string }>) {
  // Update in raw data
  const rawIndex = rawClaimsData.findIndex((c: any) => c.claimId.toLowerCase() === claimId.toLowerCase());
  if (rawIndex !== -1) {
    if (updates.status) {
      rawClaimsData[rawIndex].status = updates.status;
    }
    if (updates.notes) {
      // Add to payerNotes or create a priorActions entry
      rawClaimsData[rawIndex].priorActions = rawClaimsData[rawIndex].priorActions || [];
      rawClaimsData[rawIndex].priorActions.push({
        date: new Date().toISOString().split('T')[0],
        type: 'status_change',
        description: updates.notes,
        outcome: updates.status || 'updated',
      });
    }
    // Save to file
    saveClaims(rawClaimsData);
    // Reload transformed claims
    reloadClaims();
  }
}

// Initialize Anthropic client
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Helper to find a claim by ID, numeric ID, or patient name
function findClaim(query: string): TransformedClaim | undefined {
  const searchTerm = query.toLowerCase().trim();

  return claims.find((c) => {
    // Match full claim ID (e.g., CLM-1001)
    if (c.id.toLowerCase() === searchTerm) return true;
    // Match with CLM- prefix added
    if (`clm-${searchTerm}` === c.id.toLowerCase()) return true;
    // Match numeric part only (e.g., 1001)
    const numericId = c.id.replace(/\D/g, '');
    if (numericId === searchTerm.replace(/\D/g, '') && /^\d+$/.test(searchTerm)) return true;
    // Match patient name (partial or full)
    if (c.patientName.toLowerCase().includes(searchTerm)) return true;
    return false;
  });
}

// System prompt for the AI (dynamic to reflect current claims state)
function getSystemPrompt() {
  return `You are a helpful AI assistant for healthcare billing specialists at Joyful Health. Your role is to help review and process insurance claims that have been denied, rejected, or underpaid.

You have access to the following tools:
- lookupClaim: Get detailed information about a specific claim
- suggestAction: Analyze a claim and recommend next steps
- draftAppeal: Generate an appeal letter for a claim
- updateClaimStatus: Update the status of a claim

Current claims in the system:
${claims.map((c) => `${c.id}: ${c.patientName}, ${c.status}, $${c.amount}, ${c.insuranceProvider}${c.denialReason ? ` - ${c.denialReason}` : ''}`).join('\n')}

Guidelines:
- Be helpful, professional, and empathetic
- When discussing claims, use the lookupClaim tool to get full details
- Use suggestAction to analyze claims and recommend next steps
- Use draftAppeal to generate appeal letters when requested
- Always explain your reasoning when making recommendations
- Focus on actionable advice that helps resolve claims efficiently`;
}

// API endpoint to get all claims
app.get('/api/claims', (req, res) => {
  res.json(claims);
});

// API endpoint to get a specific claim
app.get('/api/claims/:id', (req, res) => {
  const claim = claims.find((c) => c.id.toLowerCase() === req.params.id.toLowerCase());
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }
  res.json(claim);
});

// API endpoint to update claim status (persists to data.json)
app.patch('/api/claims/:id', (req, res) => {
  const claimIndex = claims.findIndex((c) => c.id.toLowerCase() === req.params.id.toLowerCase());
  if (claimIndex === -1) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const { status, notes, actionTaken } = req.body;

  // Persist changes to data.json
  updateClaimInData(req.params.id, {
    status,
    notes: actionTaken ? `${actionTaken}${notes ? ': ' + notes : ''}` : notes,
  });

  res.json(claims[claimIndex]);
});

// API endpoint to reset data to original state
app.post('/api/reset', (req, res) => {
  resetDataFile();
  reloadClaims();
  res.json({ success: true, message: 'Data reset to original state' });
});

// API endpoint to execute confirmed actions
app.post('/api/execute-action', (req, res) => {
  const { type, payload } = req.body;

  try {
    if (type === 'updateClaimStatus') {
      const { claimId, newStatus, actionTaken, notes } = payload;
      updateClaimInData(claimId, {
        status: newStatus,
        notes: `${actionTaken}${notes ? ': ' + notes : ''}`,
      });
      res.json({ success: true, message: `Claim ${claimId} status updated to ${newStatus}` });
    } else if (type === 'draftAppeal') {
      // Appeal drafts don't modify data, just acknowledge
      res.json({ success: true, message: 'Appeal draft approved' });
    } else if (type === 'suggestAction') {
      // Suggested actions don't modify data, just acknowledge
      res.json({ success: true, message: 'Action recommendation acknowledged' });
    } else {
      res.status(400).json({ error: `Unknown action type: ${type}` });
    }
  } catch (error) {
    console.error('Execute action error:', error);
    res.status(500).json({ error: 'Failed to execute action' });
  }
});

// Chat endpoint with streaming
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: getSystemPrompt(),
    messages,
    tools: {
      lookupClaim: tool({
        description: 'Look up detailed information about a specific claim. Can search by full claim ID (CLM-1001), numeric ID (1001), or patient name.',
        inputSchema: z.object({
          query: z.string().describe('The claim ID (e.g., CLM-1001 or 1001) or patient name to look up'),
        }),
        execute: async ({ query }) => {
          const claim = findClaim(query);
          if (!claim) {
            return { error: `No claim found matching "${query}"` };
          }

          // Format a readable summary with markdown
          const formattedDetails = `**Claim ${claim.id}**

- **Patient:** ${claim.patientName} (ID: ${claim.patientId})
- **Status:** ${claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
- **Amount Billed:** $${claim.amount.toLocaleString()}${claim.amountPaid ? `\n- **Amount Paid:** $${claim.amountPaid.toLocaleString()}` : ''}
- **Insurance:** ${claim.insuranceProvider}
- **Date of Service:** ${claim.dateOfService}
- **Procedures:** ${claim.procedureCodes.join(', ')}${claim.denialReason ? `\n- **Denial Reason:** ${claim.denialReason}${claim.denialCode ? ` (${claim.denialCode})` : ''}` : ''}${claim.deadlineDate ? `\n- **Filing Deadline:** ${claim.deadlineDate}` : ''}`;

          return {
            claim,
            // Include action marker for client-side claim selection
            __action: { type: 'SELECT_CLAIM', claimId: claim.id },
            summary: formattedDetails,
          };
        },
      }),

      suggestAction: tool({
        description: 'Analyze a claim and suggest the best course of action. Can search by full claim ID (CLM-1001), numeric ID (1001), or patient name.',
        inputSchema: z.object({
          query: z.string().describe('The claim ID (e.g., CLM-1001 or 1001) or patient name to analyze'),
        }),
        execute: async ({ query }) => {
          const claim = findClaim(query);
          if (!claim) {
            return { error: `No claim found matching "${query}"` };
          }

          let recommendation = '';
          let reasoning = '';
          let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          let confidence: 'low' | 'medium' | 'high' = 'medium';
          const nextSteps: string[] = [];

          switch (claim.status) {
            case 'denied':
              recommendation = 'File an appeal';
              reasoning = `Claim denied with reason: "${claim.denialReason}". Review the denial details and prepare an appeal with supporting documentation.`;
              confidence = 'high';
              nextSteps.push(
                'Review the complete denial letter and payer notes',
                'Gather supporting medical documentation',
                'Draft an appeal letter addressing the denial reason',
                'Submit appeal before the filing deadline'
              );
              break;
            case 'rejected':
              recommendation = 'Correct and resubmit';
              reasoning = `Claim was rejected due to: "${claim.denialReason}". Correct the identified issues and resubmit.`;
              confidence = 'high';
              nextSteps.push(
                'Review the rejection reason carefully',
                'Correct any coding or information errors',
                'Resubmit the corrected claim'
              );
              break;
            case 'underpaid':
              recommendation = 'Request reconsideration';
              reasoning = `Payment received was less than expected. Review contract rates and appeal if underpaid.`;
              confidence = 'medium';
              nextSteps.push(
                'Compare payment to contracted rates',
                'Prepare underpayment appeal if warranted'
              );
              break;
            default:
              recommendation = 'Review claim';
              reasoning = 'Evaluate the claim status and determine appropriate action.';
              confidence = 'low';
          }

          if (claim.deadlineDate) {
            const daysUntil = getDaysUntil(claim.deadlineDate);
            if (daysUntil <= 14) urgency = 'critical';
            else if (daysUntil <= 30) urgency = 'high';
          }

          return {
            claimId: claim.id,
            recommendation,
            reasoning,
            urgency,
            confidence,
            nextSteps,
            filingDeadline: claim.deadlineDate,
            __action: { type: 'SELECT_CLAIM', claimId: claim.id },
            __confirmation: {
              type: 'suggestAction',
              claimId: claim.id,
              data: {
                recommendedAction: recommendation,
                reasoning,
                confidence,
                urgency,
                nextSteps,
              },
            },
          };
        },
      }),

      draftAppeal: tool({
        description: 'Generate an appeal letter draft for a denied or rejected claim. Can search by full claim ID (CLM-1001), numeric ID (1001), or patient name.',
        inputSchema: z.object({
          query: z.string().describe('The claim ID (e.g., CLM-1001 or 1001) or patient name to draft an appeal for'),
          appealType: z.enum(['medical_necessity', 'coding_correction', 'authorization', 'timely_filing', 'other']).describe('The type of appeal'),
          additionalContext: z.string().optional().describe('Additional context for the appeal'),
        }),
        execute: async ({ query, appealType, additionalContext }) => {
          const claim = findClaim(query);
          if (!claim) {
            return { error: `No claim found matching "${query}"` };
          }

          const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const appealTypeLabels: Record<string, string> = {
            medical_necessity: 'Medical Necessity',
            coding_correction: 'Coding Correction',
            authorization: 'Prior Authorization',
            timely_filing: 'Timely Filing',
            other: 'General Appeal',
          };

          const subject = `${appealTypeLabels[appealType]} Appeal - Claim ${claim.id} - ${claim.patientName}`;
          const body = `${today}

${claim.insuranceProvider}
Claims Appeal Department

RE: ${appealTypeLabels[appealType]} Appeal
Claim Number: ${claim.id}
Patient Name: ${claim.patientName}
Date of Service: ${claim.dateOfService}
Billed Amount: $${claim.amount}
${claim.denialCode ? `Denial Code: ${claim.denialCode}` : ''}

Dear Appeals Committee,

I am writing to formally appeal the denial of the above-referenced claim.

The claim was denied with reason: "${claim.denialReason}". We respectfully disagree with this determination.

${additionalContext ? `Additional Context: ${additionalContext}\n\n` : ''}We request reconsideration based on the enclosed supporting documentation.

Thank you for your prompt attention to this matter.

Sincerely,
[Provider Name]
[Contact Information]`;

          const attachmentsNeeded = ['Medical records', 'Physician notes', 'Supporting documentation'];

          return {
            subject,
            body,
            claimId: claim.id,
            appealType,
            attachmentsNeeded,
            __action: { type: 'SELECT_CLAIM', claimId: claim.id },
            __confirmation: {
              type: 'draftAppeal',
              claimId: claim.id,
              data: {
                subject,
                body,
                attachmentsNeeded,
                appealType,
              },
              executionPayload: {
                claimId: claim.id,
                appealType,
                body,
                subject,
              },
            },
          };
        },
      }),

      updateClaimStatus: tool({
        description: 'Update the status of a claim. This change will be persisted. Can search by full claim ID (CLM-1001), numeric ID (1001), or patient name.',
        inputSchema: z.object({
          query: z.string().describe('The claim ID (e.g., CLM-1001 or 1001) or patient name to update'),
          newStatus: z.enum(['denied', 'rejected', 'pending', 'underpaid', 'resolved', 'appealed']).describe('The new status'),
          actionTaken: z.string().describe('Description of the action taken'),
          notes: z.string().optional().describe('Additional notes'),
        }),
        execute: async ({ query, newStatus, actionTaken, notes }) => {
          const claim = findClaim(query);
          if (!claim) {
            return { error: `No claim found matching "${query}"` };
          }

          const previousStatus = claim.status;
          const timestamp = new Date().toISOString();

          // DO NOT auto-execute - return confirmation marker instead
          return {
            __action: { type: 'SELECT_CLAIM', claimId: claim.id },
            __confirmation: {
              type: 'updateClaimStatus',
              claimId: claim.id,
              data: {
                previousStatus,
                newStatus,
                actionTaken,
                notes: notes || '',
                timestamp,
              },
              executionPayload: {
                claimId: claim.id,
                newStatus,
                actionTaken,
                notes: notes || '',
              },
            },
            message: `Status update requires approval: ${previousStatus} → ${newStatus}`,
          };
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  try {
    let hasText = false;
    const confirmations: any[] = [];
    const processedActions = new Set<string>();

    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        const text = (part as any).textDelta ?? (part as any).text ?? '';
        if (text) {
          hasText = true;
          res.write(text);
        }
      } else if (part.type === 'tool-result') {
        const toolResult = (part as any).output;
        // Write actions IMMEDIATELY when tool results come in (for instant claim selection)
        if (toolResult?.__action) {
          const actionKey = JSON.stringify(toolResult.__action);
          if (!processedActions.has(actionKey)) {
            processedActions.add(actionKey);
            res.write(`\n[[ACTION:${actionKey}]]\n`);
          }
        }
        if (toolResult?.__confirmation) {
          confirmations.push(toolResult.__confirmation);
        }
      }
    }

    // Write collected confirmations at the end (after text)
    for (const confirmation of confirmations) {
      res.write(`\n[[CONFIRMATION:${JSON.stringify(confirmation)}]]\n`);
    }

    if (!hasText) {
      res.write("I'm sorry I wasn't able to respond to that. Please contact your system administrator or try again.");
    }
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    if (!res.writableEnded) {
      res.write("I'm sorry I wasn't able to respond to that. Please contact your system administrator or try again.");
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
