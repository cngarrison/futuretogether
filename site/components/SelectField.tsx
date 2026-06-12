import { JSX } from "preact";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  value: string;
  options: SelectOption[];
  /** Optional — omit for server-rendered / form-POST selects. */
  onChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  class?: string;
}

/**
 * Styled select with focus ring and consistent border colour.
 * The global `select` rule in styles.css handles appearance-none + chevron;
 * this component adds the focus ring, teal border, and signal binding on top.
 *
 * onChange is optional so SelectField works in server-rendered form-POST
 * routes (no JS handler needed) as well as interactive islands.
 */
export default function SelectField({
  value,
  options,
  onChange,
  disabled = false,
  id,
  name,
  class: className = "",
}: SelectFieldProps): JSX.Element {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange ? (e) => onChange(e.currentTarget.value) : undefined}
      disabled={disabled}
      class={`w-full px-3 py-2 border border-primary/30 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50 cursor-pointer ${className}`
        .trim()}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
