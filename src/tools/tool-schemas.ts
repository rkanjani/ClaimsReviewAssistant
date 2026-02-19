import { z } from 'zod';

export const lookupClaimSchema = z.object({
  claimId: z.string().describe('The claim ID to look up (e.g., CLM-1001)'),
});

export const suggestActionSchema = z.object({
  claimId: z.string().describe('The claim ID to analyze'),
});

export const draftAppealSchema = z.object({
  claimId: z.string().describe('The claim ID to draft an appeal for'),
  appealType: z.enum([
    'medical_necessity',
    'coding_correction',
    'timely_filing',
    'documentation',
    'authorization',
    'other',
  ]).describe('The type of appeal to draft'),
  additionalContext: z.string().optional().describe('Additional context for the appeal'),
});

export const updateClaimStatusSchema = z.object({
  claimId: z.string().describe('The claim ID to update'),
  newStatus: z.enum([
    'denied',
    'rejected',
    'pending',
    'underpaid',
    'resolved',
    'appealed',
  ]).describe('The new status to set'),
  actionTaken: z.string().describe('Description of the action taken'),
  notes: z.string().optional().describe('Additional notes about the status change'),
});

export type LookupClaimInput = z.infer<typeof lookupClaimSchema>;
export type SuggestActionInput = z.infer<typeof suggestActionSchema>;
export type DraftAppealInput = z.infer<typeof draftAppealSchema>;
export type UpdateClaimStatusInput = z.infer<typeof updateClaimStatusSchema>;

export const toolSchemas = {
  lookupClaim: lookupClaimSchema,
  suggestAction: suggestActionSchema,
  draftAppeal: draftAppealSchema,
  updateClaimStatus: updateClaimStatusSchema,
};
