import React from 'react';
import Input from './Input';
import { DETAIL_LABELS, STUDY_FIELDS } from '../services/structuredResultTemplates';

export default function StudyResultFields({ group, data, onChange, disabled = false }) {
    const fields = [...new Set([...(STUDY_FIELDS[group] || STUDY_FIELDS.B), ...Object.keys(data || {}).filter(key => DETAIL_LABELS[key])])].filter(key => key !== 'additionalText' || data?.additionalText);
    return <div className="grid gap-4 md:grid-cols-2">{fields.map(key => (
        <Input disabled={disabled} key={key} label={DETAIL_LABELS[key]} textarea lang="es" spellCheck value={data?.[key] || ''}
            onChange={event => onChange({ ...data, [key]: event.target.value })} />
    ))}</div>;
}
