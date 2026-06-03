'use client';

import type { FieldDefinition } from '@/lib/registry/types';
import { getNestedValue } from '@/builder/utils/props';

interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const id = `field-${field.key.replace(/\./g, '-')}`;

  if (field.type === 'boolean') {
    return (
      <div className="field">
        <label className="field-checkbox-row" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="field-label" style={{ margin: 0 }}>
            {field.label}
          </span>
        </label>
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <div className="field">
        <label className="field-label" htmlFor={id}>
          {field.label}
        </label>
        <select
          id={id}
          className="field-select"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="field">
        <label className="field-label" htmlFor={id}>
          {field.label}
        </label>
        <input
          id={id}
          type="number"
          className="field-input"
          value={value === undefined || value === null ? '' : Number(value)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={field.placeholder}
        />
      </div>
    );
  }

  if (field.type === 'color') {
    return (
      <div className="field">
        <label className="field-label" htmlFor={id}>
          {field.label}
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            id={id}
            type="color"
            value={String(value ?? '#000000')}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: 40, height: 36, padding: 2, cursor: 'pointer' }}
          />
          <input
            type="text"
            className="field-input"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
          />
        </div>
      </div>
    );
  }

  if (field.type === 'richtext' || field.type === 'json') {
    const displayValue =
      field.type === 'json' && typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value ?? '');

    return (
      <div className="field">
        <label className="field-label" htmlFor={id}>
          {field.label}
        </label>
        <textarea
          id={id}
          className="field-textarea"
          value={displayValue}
          onChange={(e) => {
            if (field.type === 'json') {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            } else {
              onChange(e.target.value);
            }
          }}
          placeholder={field.placeholder}
          rows={field.type === 'json' ? 8 : 4}
        />
        {field.helpText && <p className="field-help">{field.helpText}</p>}
      </div>
    );
  }

  const inputType = field.type === 'url' || field.type === 'image' ? 'url' : 'text';

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {field.label}
      </label>
      <input
        id={id}
        type={inputType}
        className="field-input"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
      {field.helpText && <p className="field-help">{field.helpText}</p>}
    </div>
  );
}

export function getFieldValue(props: Record<string, unknown>, key: string): unknown {
  return getNestedValue(props, key);
}
