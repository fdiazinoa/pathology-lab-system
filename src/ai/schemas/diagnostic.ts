import { z } from 'zod';

export const DiagnosticAssistanceSchema = z.object({
    differential_diagnoses: z.array(
        z.object({
            name: z.string(),
            confidence: z.enum(['alta', 'media', 'baja']),
        })
    ),
    overall_confidence: z.enum(['alta', 'media', 'baja']),
    requires_human_validation: z.literal(true),
});

export type DiagnosticAssistance = z.infer<typeof DiagnosticAssistanceSchema>;
