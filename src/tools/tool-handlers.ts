import type { Claim, SuggestedAction, AppealDraft, StatusUpdate, AppealType } from '@/types/claim';
import type { LookupClaimInput, SuggestActionInput, DraftAppealInput, UpdateClaimStatusInput } from './tool-schemas';
import { formatCurrency, formatDate } from '@/lib/utils';

export function handleLookupClaim(
  input: LookupClaimInput,
  claims: Claim[]
): { claim: Claim; summary: string } | { error: string } {
  const claim = claims.find((c) => c.id.toLowerCase() === input.claimId.toLowerCase());

  if (!claim) {
    return { error: `Claim ${input.claimId} not found` };
  }

  const summary = `Claim ${claim.id} for patient ${claim.patientName}: ${formatCurrency(claim.amount)} billed to ${claim.insuranceProvider}. Status: ${claim.status}${claim.denialReason ? `. Denial reason: ${claim.denialReason}` : ''}.`;

  return { claim, summary };
}

export function handleSuggestAction(
  input: SuggestActionInput,
  claims: Claim[]
): SuggestedAction | { error: string } {
  const claim = claims.find((c) => c.id.toLowerCase() === input.claimId.toLowerCase());

  if (!claim) {
    return { error: `Claim ${input.claimId} not found` };
  }

  // Generate recommendation based on claim details
  let recommendedAction = '';
  let reasoning = '';
  let confidence: SuggestedAction['confidence'] = 'medium';
  let urgency: SuggestedAction['urgency'] = 'medium';
  const nextSteps: string[] = [];

  switch (claim.status) {
    case 'denied':
      if (claim.denialCode === 'CO-50') {
        recommendedAction = 'File a medical necessity appeal';
        reasoning = `The claim was denied with code CO-50 (Medical necessity not established). Based on the diagnosis codes (${claim.diagnosisCodes.join(', ')}) and procedure codes (${claim.procedureCodes.join(', ')}), this denial may be overturnable with proper documentation.`;
        confidence = 'high';
        nextSteps.push(
          'Gather supporting medical records',
          'Obtain peer-reviewed literature supporting the treatment',
          'Draft appeal letter emphasizing clinical necessity',
          'Include attending physician statement if available'
        );
      } else if (claim.denialCode === 'CO-15') {
        recommendedAction = 'Request retroactive authorization';
        reasoning = `The claim was denied due to lack of prior authorization. Consider filing for retroactive authorization if the procedure was emergent or if authorization was obtained but not properly documented.`;
        confidence = 'medium';
        urgency = 'high';
        nextSteps.push(
          'Check if authorization was actually obtained but not on file',
          'Document medical necessity for emergent procedure if applicable',
          'Contact insurance provider about retroactive auth process',
          'Prepare supporting documentation'
        );
      } else {
        recommendedAction = 'Review denial and prepare appeal';
        reasoning = `Claim denied with reason: "${claim.denialReason}". Review the specific denial reason and prepare appropriate documentation for appeal.`;
        nextSteps.push(
          'Review complete denial letter',
          'Identify specific documentation needed',
          'Prepare appeal with supporting evidence'
        );
      }
      break;

    case 'rejected':
      recommendedAction = 'Correct and resubmit claim';
      reasoning = `The claim was rejected, typically due to technical issues like coding errors. For denial reason "${claim.denialReason}", review the claim for accuracy before resubmission.`;
      confidence = 'high';
      urgency = 'medium';
      nextSteps.push(
        'Review procedure and diagnosis code combinations',
        'Check for missing modifiers',
        'Verify patient and provider information',
        'Resubmit corrected claim'
      );
      break;

    case 'underpaid':
      recommendedAction = 'Request reconsideration for underpayment';
      reasoning = `The claim was paid ${formatCurrency(claim.amountPaid || 0)} of ${formatCurrency(claim.amount)} billed. Review the contract rate schedule and request reconsideration if payment is below contracted rates.`;
      confidence = 'medium';
      nextSteps.push(
        'Review contract fee schedule',
        'Compare payment to expected contracted rate',
        'Prepare underpayment appeal with contract documentation',
        'Consider balance billing if appropriate'
      );
      break;

    case 'pending':
      recommendedAction = 'Monitor claim status';
      reasoning = `Claim is currently pending processing. Standard processing time is 30-45 days.`;
      confidence = 'high';
      urgency = 'low';
      nextSteps.push(
        'Set reminder to check status in 2 weeks',
        'Verify claim was received by payer',
        'Follow up if no response within 45 days'
      );
      break;

    case 'appealed':
      recommendedAction = 'Monitor appeal status';
      reasoning = `An appeal has been submitted for this claim. Track the appeal timeline and prepare for possible second-level appeal.`;
      confidence = 'medium';
      nextSteps.push(
        'Track appeal timeline (typically 30-60 days)',
        'Prepare additional documentation for potential escalation',
        'Contact insurance if no response within expected timeframe'
      );
      break;

    case 'resolved':
      recommendedAction = 'No action needed';
      reasoning = `This claim has been resolved with payment of ${formatCurrency(claim.amountPaid || 0)}.`;
      confidence = 'high';
      urgency = 'low';
      nextSteps.push('Archive claim documentation', 'Close case in tracking system');
      break;
  }

  // Adjust urgency based on deadline
  if (claim.deadlineDate) {
    const daysUntil = Math.ceil(
      (new Date(claim.deadlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil <= 7) {
      urgency = 'critical';
    } else if (daysUntil <= 14) {
      urgency = 'high';
    }
  }

  // Adjust urgency based on amount
  if (claim.amount > 10000 && urgency !== 'critical') {
    urgency = urgency === 'low' ? 'medium' : 'high';
  }

  return {
    recommendedAction,
    reasoning,
    confidence,
    urgency,
    nextSteps,
  };
}

const appealTypeLabels: Record<AppealType, string> = {
  medical_necessity: 'Medical Necessity',
  coding_correction: 'Coding Correction',
  timely_filing: 'Timely Filing',
  documentation: 'Documentation',
  authorization: 'Prior Authorization',
  other: 'General Appeal',
};

export function handleDraftAppeal(
  input: DraftAppealInput,
  claims: Claim[]
): AppealDraft | { error: string } {
  const claim = claims.find((c) => c.id.toLowerCase() === input.claimId.toLowerCase());

  if (!claim) {
    return { error: `Claim ${input.claimId} not found` };
  }

  const appealTypeLabel = appealTypeLabels[input.appealType];
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const subject = `${appealTypeLabel} Appeal - Claim ${claim.id} - ${claim.patientName}`;

  let body = `${today}

${claim.insuranceProvider}
Claims Appeal Department

RE: ${appealTypeLabel} Appeal
Claim Number: ${claim.id}
Patient Name: ${claim.patientName}
Patient ID: ${claim.patientId}
Date of Service: ${formatDate(claim.dateOfService)}
Billed Amount: ${formatCurrency(claim.amount)}
${claim.denialCode ? `Denial Code: ${claim.denialCode}` : ''}

Dear Appeals Committee,

I am writing to formally appeal the denial of the above-referenced claim`;

  if (claim.dateDenied) {
    body += ` dated ${formatDate(claim.dateDenied)}`;
  }
  body += '.\n\n';

  switch (input.appealType) {
    case 'medical_necessity':
      body += `The claim was denied stating that medical necessity was not established. We respectfully disagree with this determination for the following reasons:

1. The patient presented with documented diagnosis codes (${claim.diagnosisCodes.join(', ')}) which clearly indicate the clinical need for the procedures performed (${claim.procedureCodes.join(', ')}).

2. The treatment provided was consistent with current medical guidelines and standards of care for patients presenting with these conditions.

3. Conservative treatment options were considered/attempted prior to the services rendered, as documented in the enclosed medical records.

${input.additionalContext ? `Additional Context: ${input.additionalContext}\n\n` : ''}We request that you reconsider this claim based on the enclosed supporting documentation demonstrating the medical necessity of the services provided.`;
      break;

    case 'coding_correction':
      body += `Upon review of the denial, we have identified that the original claim may have contained coding that requires clarification or correction.

The services provided on the date of service included:
- Procedure codes: ${claim.procedureCodes.join(', ')}
- Diagnosis codes: ${claim.diagnosisCodes.join(', ')}

${input.additionalContext ? `Additional Context: ${input.additionalContext}\n\n` : ''}Please find enclosed the corrected claim information and supporting documentation. We request reconsideration of this claim with the updated information provided.`;
      break;

    case 'authorization':
      body += `The claim was denied due to lack of prior authorization. We are appealing this decision based on the following:

${claim.notes.some(n => n.toLowerCase().includes('authorization')) ?
  '- Prior authorization was obtained for this service as documented in our records.\n' :
  '- The service was medically necessary and urgent, qualifying for retrospective authorization consideration.\n'}
${input.additionalContext ? `Additional Context: ${input.additionalContext}\n\n` : ''}We request that this claim be reviewed for authorization consideration based on the medical necessity of the services provided.`;
      break;

    default:
      body += `We are appealing the denial of this claim and request reconsideration based on the enclosed documentation.

${claim.denialReason ? `The stated denial reason was: "${claim.denialReason}"\n\n` : ''}${input.additionalContext ? `Additional Context: ${input.additionalContext}\n\n` : ''}We believe this claim should be approved based on the supporting documentation provided.`;
  }

  body += `

Thank you for your prompt attention to this matter. Please contact our office if you require any additional information.

Sincerely,

_______________________
[Provider Name]
[Provider NPI: ${claim.providerNpi || '[NPI]'}]
[Facility: ${claim.facility || '[Facility Name]'}]
[Phone Number]
[Fax Number]`;

  const attachmentsNeeded = [
    'Medical records for date of service',
    'Physician notes supporting medical necessity',
  ];

  if (input.appealType === 'medical_necessity') {
    attachmentsNeeded.push('Peer-reviewed literature supporting treatment');
    attachmentsNeeded.push('Prior treatment records if applicable');
  }

  if (input.appealType === 'authorization') {
    attachmentsNeeded.push('Authorization confirmation (if available)');
    attachmentsNeeded.push('Documentation of medical urgency');
  }

  if (input.appealType === 'coding_correction') {
    attachmentsNeeded.push('Corrected claim form');
    attachmentsNeeded.push('Operative/procedure notes');
  }

  return {
    subject,
    body,
    attachmentsNeeded,
    appealType: input.appealType,
  };
}

export function handleUpdateClaimStatus(
  input: UpdateClaimStatusInput,
  claims: Claim[]
): StatusUpdate | { error: string } {
  const claim = claims.find((c) => c.id.toLowerCase() === input.claimId.toLowerCase());

  if (!claim) {
    return { error: `Claim ${input.claimId} not found` };
  }

  return {
    previousStatus: claim.status,
    newStatus: input.newStatus,
    actionTaken: input.actionTaken,
    notes: input.notes || '',
    timestamp: new Date().toISOString(),
  };
}
