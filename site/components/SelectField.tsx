import { JSX } from "preact";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
}

/**
 * Styled select with a consistent custom dropdown arrow.
 * Matches the focus/border style used across form inputs.
 */
export default function SelectField({
  value,
  options,
  onChange,
  disabled = false,
  id,
  name,
}: SelectFieldProps): JSX.Element {
  return (
    <div class="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a5f6e] focus:ring-2 focus:ring-[#1a5f6e]/20 bg-white transition-colors disabled:opacity-50 appearance-none pr-10 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div
        class="absolute right-3 top-1/2 pointer-events-none"
        style={{ transform: "translateY(-50%)", color: "#6b7280" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
