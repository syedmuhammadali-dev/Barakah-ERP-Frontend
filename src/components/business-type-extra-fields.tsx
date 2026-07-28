"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessTypeExtraField } from "@/lib/business-types";

interface BusinessTypeExtraFieldsProps {
  fields: BusinessTypeExtraField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function BusinessTypeExtraFields({ fields, values, onChange }: BusinessTypeExtraFieldsProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4" data-testid="business-type-extra-fields">
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={`extra-field-${field.key}`}>{field.label}</Label>
          <Input
            id={`extra-field-${field.key}`}
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
            placeholder={`Enter ${field.label}`}
            value={values[field.key] ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
