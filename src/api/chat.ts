import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { Claim } from '@/types/claim';
import type { SuggestedAction, AppealDraft, StatusUpdate } from '@/types/claim';
import {
  handleLookupClaim,
  handleSuggestAction,
  handleDraftAppeal,
  handleUpdateClaimStatus,
} from '@/tools/tool-handlers';
import type { LookupClaimInput, SuggestActionInput, DraftAppealInput, UpdateClaimStatusInput } from '@/tools/tool-schemas';

const anthropic = createAnthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
});

function buildSystemPrompt(claims: Claim[]): string {
  const claimSummaries = claims
    .map((c) => `${c.id}: ${c.patientName}, ${c.status}, $${c.amount}, ${c.insuranceProvider}${c.denialReason ? ` - ${c.denialReason}` : ''}`)
    .join('\n');

  return `You are a helpful AI assistant for healthcare billing specialists at Joyful Health. Your role is to help review and process insurance claims that have been denied, rejected, or underpaid.

You have access to the following tools (use them by including JSON in your response):
1. [LOOKUP_CLAIM:claim_id] - Retrieve full details about a specific claim
2. [SUGGEST_ACTION:claim_id] - Analyze a claim and recommend the best course of action
3. [DRAFT_APPEAL:claim_id:appeal_type] - Generate an appeal letter (types: medical_necessity, coding_correction, timely_filing, documentation, authorization, other)
4. [UPDATE_STATUS:claim_id:new_status:action_taken] - Record a status change (statuses: denied, rejected, pending, underpaid, resolved, appealed)

Current claims in the system:
${claimSummaries}

Guidelines:
- Be helpful, professional, and empathetic
- When discussing claims, always verify the claim ID before taking action
- Explain your reasoning when making recommendations
- Use medical billing terminology appropriately (CPT codes, ICD-10, denial codes, etc.)
- Focus on actionable advice that helps resolve claims efficiently
- Be proactive about identifying urgent claims

When a user asks about a claim, provide helpful information. Include tool commands in your response when needed.`;
}

export interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  claims: Claim[];
}

export interface ToolResult {
  type: 'lookupClaim' | 'suggestAction' | 'draftAppeal' | 'updateClaimStatus';
  claimId: string;
  result: ReturnType<typeof handleLookupClaim> | SuggestedAction | AppealDraft | StatusUpdate | { error: string };
}

export interface ChatResponse {
  text: string;
  toolResults: ToolResult[];
}

// Parse tool commands from AI response
function parseToolCommands(text: string, claims: Claim[]): { cleanText: string; toolResults: ToolResult[] } {
  const toolResults: ToolResult[] = [];
  let cleanText = text;

  // Pattern for [LOOKUP_CLAIM:claim_id]
  const lookupPattern = /\[LOOKUP_CLAIM:([^\]]+)\]/g;
  let match;
  while ((match = lookupPattern.exec(text)) !== null) {
    const claimId = match[1].trim();
    const input: LookupClaimInput = { claimId };
    const result = handleLookupClaim(input, claims);
    toolResults.push({ type: 'lookupClaim', claimId, result });
    cleanText = cleanText.replace(match[0], '');
  }

  // Pattern for [SUGGEST_ACTION:claim_id]
  const suggestPattern = /\[SUGGEST_ACTION:([^\]]+)\]/g;
  while ((match = suggestPattern.exec(text)) !== null) {
    const claimId = match[1].trim();
    const input: SuggestActionInput = { claimId };
    const result = handleSuggestAction(input, claims);
    toolResults.push({ type: 'suggestAction', claimId, result });
    cleanText = cleanText.replace(match[0], '');
  }

  // Pattern for [DRAFT_APPEAL:claim_id:appeal_type]
  const draftPattern = /\[DRAFT_APPEAL:([^:]+):([^\]]+)\]/g;
  while ((match = draftPattern.exec(text)) !== null) {
    const claimId = match[1].trim();
    const appealType = match[2].trim() as DraftAppealInput['appealType'];
    const input: DraftAppealInput = { claimId, appealType };
    const result = handleDraftAppeal(input, claims);
    toolResults.push({ type: 'draftAppeal', claimId, result });
    cleanText = cleanText.replace(match[0], '');
  }

  // Pattern for [UPDATE_STATUS:claim_id:new_status:action_taken]
  const updatePattern = /\[UPDATE_STATUS:([^:]+):([^:]+):([^\]]+)\]/g;
  while ((match = updatePattern.exec(text)) !== null) {
    const claimId = match[1].trim();
    const newStatus = match[2].trim() as UpdateClaimStatusInput['newStatus'];
    const actionTaken = match[3].trim();
    const input: UpdateClaimStatusInput = { claimId, newStatus, actionTaken };
    const result = handleUpdateClaimStatus(input, claims);
    toolResults.push({ type: 'updateClaimStatus', claimId, result });
    cleanText = cleanText.replace(match[0], '');
  }

  return { cleanText: cleanText.trim(), toolResults };
}

export async function sendChatMessage(body: ChatRequestBody): Promise<ChatResponse> {
  const { messages, claims } = body;

  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: buildSystemPrompt(claims),
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const { cleanText, toolResults } = parseToolCommands(result.text, claims);

    return {
      text: cleanText,
      toolResults,
    };
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}
