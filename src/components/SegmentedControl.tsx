import { type CSSProperties } from "react"

export type SegmentedControlOption = {
  value: string
  label: string
}

export type SegmentedControlProps = {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  style?: CSSProperties
}

export const SegmentedControl = ({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps) => {
  return (
    <div className="segmented-control" style={style}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segmented-control-option ${
            value === option.value ? "active" : ""
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
