import { z } from 'zod';

export const ClinicalReportSchema = z.object({
    clinical_data: z.string().optional(),
    macroscopy: z.string().optional(),
    microscopy: z.string().optional(),
    diagnostic_suggestions: z.array(z.string()).optional(),
    requires_review: z.literal(true),
});

export type ClinicalReport = z.infer<typeof ClinicalReportSchema>;
