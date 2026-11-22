interface Props<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/** A row of mutually exclusive text choices, styled like the branch filter. */
export default function Segmented<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div className="branches" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="branch-filter" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
