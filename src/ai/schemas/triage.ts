import { z } from 'zod';

export const TriageSchema = z.object({
    suspicion_level: z.enum(['baja', 'moderada', 'alta']),
    process_type: z.enum(['sospecha_neoplasica', 'sospecha_no_neoplasica', 'indeterminado']),
    requires_human_validation: z.literal(true),
});

export type Triage = z.infer<typeof TriageSchema>;
