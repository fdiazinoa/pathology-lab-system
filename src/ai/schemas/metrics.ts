import { z } from 'zod';

export const QuantitativeMetricsSchema = z.object({
    metrics: z.object({
        mitotic_figures_per_10_hpf: z.number().optional(),
        ki67_index_percent: z.number().min(0).max(100).optional(),
        necrosis_percent: z.number().min(0).max(100).optional(),
    }),
    estimated: z.literal(true),
    requires_manual_confirmation: z.literal(true),
});

export type QuantitativeMetrics = z.infer<typeof QuantitativeMetricsSchema>;
