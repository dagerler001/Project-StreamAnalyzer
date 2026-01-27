import { useState, useRef, useEffect } from "react"
import { SegmentedControl, type SegmentedControlOption } from "./SegmentedControl"

export type InputType = "url" | "id" | "file"

export type InputPanelProps = {
  onAnalyze: (inputType: InputType, value: string | File) => void
  isLoading?: boolean
}

const INPUT_OPTIONS: SegmentedControlOption[] = [
  { value: "url", label: "URL" },
  { value: "id", label: "Channel/VOD ID" },
  { value: "file", label: "Local File" },
]

export const InputPanel = ({ onAnalyze, isLoading = false }: InputPanelProps) => {
  const [inputType, setInputType] = useState<InputType>("url")
  const [urlValue, setUrlValue] = useState("")
  const [idValue, setIdValue] = useState("")
  const [fileValue, setFileValue] = useState<File | null>(null)

  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputType === "url" && urlInputRef.current) {
      urlInputRef.current.focus()
    }
  }, [inputType])

  const handleAnalyze = () => {
    if (isLoading) return

    if (inputType === "url" && urlValue.trim()) {
      onAnalyze("url", urlValue.trim())
    } else if (inputType === "id" && idValue.trim()) {
      onAnalyze("id", idValue.trim())
    } else if (inputType === "file" && fileValue) {
      onAnalyze("file", fileValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleAnalyze()
    }
  }

  const isDisabled =
    isLoading ||
    (inputType === "url" && !urlValue.trim()) ||
    (inputType === "id" && !idValue.trim()) ||
    (inputType === "file" && !fileValue)

  return (
    <div className="input-panel">
      <SegmentedControl
        options={INPUT_OPTIONS}
        value={inputType}
        onChange={(value) => setInputType(value as InputType)}
        style={{ marginBottom: "1rem" }}
      />

      {inputType === "url" && (
        <div className="input-field">
          <label htmlFor="url-input" className="input-label">
            Playlist URL
          </label>
          <input
            ref={urlInputRef}
            id="url-input"
            type="url"
            className="input"
            placeholder="https://example.com/playlist.m3u8"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
      )}

      {inputType === "id" && (
        <div className="input-field">
          <label htmlFor="id-input" className="input-label">
            Channel or VOD ID
          </label>
          <input
            id="id-input"
            type="text"
            className="input"
            placeholder="e.g., test-channel-hd"
            value={idValue}
            onChange={(e) => setIdValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
      )}

      {inputType === "file" && (
        <div className="input-field">
          <label htmlFor="file-input" className="input-label">
            Select M3U8 File
          </label>
          <input
            id="file-input"
            type="file"
            className="input-file"
            accept=".m3u8,.m3u"
            onChange={(e) => setFileValue(e.target.files?.[0] ?? null)}
            disabled={isLoading}
          />
          {fileValue && (
            <p className="input-file-name">{fileValue.name}</p>
          )}
        </div>
      )}

      <button
        className="button-primary"
        onClick={handleAnalyze}
        disabled={isDisabled}
      >
        {isLoading ? "Analyzing..." : "Analyze"}
      </button>
    </div>
  )
}
