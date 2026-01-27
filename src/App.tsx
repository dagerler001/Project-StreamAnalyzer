import './App.css'
import { InputPanel, type InputType } from './components/InputPanel'
import { usePlaylistAnalysis } from './hooks/usePlaylistAnalysis'
import { ValidationPanel } from './components/ValidationPanel'
import { ClassificationBadges } from './components/ClassificationBadges'
import { LadderTable } from './components/LadderTable'
import { SampleControls } from './components/SampleControls'
import { BitrateChart } from './components/BitrateChart'
import { CodecSummary } from './components/CodecSummary'

function App() {
  const {
    state,
    analyze,
    sampleState,
    sampleConfig,
    updateSampleConfig,
    runSample,
    retrySample,
  } = usePlaylistAnalysis()

  const handleAnalyze = (inputType: InputType, value: string | File) => {
    analyze(inputType, value)
  }

  const isLoading = state.status === 'loading'
  const isSampling = sampleState.status === 'loading'
  const canSample = state.status === 'success'

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-kicker">Stream ABR Advisor</p>
        <h1 className="app-title">Sampling + Metrics</h1>
        <p className="app-subtitle">
          Phase 2: Configure sample windows, probe bitrate, and extract codec
          telemetry from live or VOD streams.
        </p>
      </header>

      <main className="app-main">
        <section className="panel">
          <header className="panel-header">
            <h2>Ingest</h2>
            <p className="panel-lede">
              Drop in a playlist URL, channel/VOD ID, or local file to begin.
            </p>
          </header>
          <div className="panel-body">
            <InputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>
        </section>

        <section className="panel">
          <header className="panel-header">
            <h2>Results</h2>
            <p className="panel-lede">
              Validation findings, classification, and ladder snapshots appear
              here.
            </p>
          </header>
          <div className="panel-body">
            {state.status === 'idle' && (
              <p className="placeholder">Results output will render here.</p>
            )}
            {state.status === 'loading' && (
              <p className="placeholder">Analyzing playlist...</p>
            )}
            {state.status === 'error' && (
              <div className="error-state">
                <p className="error-message">{state.error}</p>
              </div>
            )}
            {state.status === 'success' && (
              <div className="results-container">
                <section className="results-section">
                  <h3 className="results-section-title">Sample Configuration</h3>
                  <SampleControls
                    sampleConfig={sampleConfig}
                    onConfigChange={updateSampleConfig}
                    onRunSample={runSample}
                    streamType={state.result.classification.streamType}
                    ladder={state.result.ladder}
                    disabled={!canSample}
                    isLoading={isSampling}
                  />
                </section>

                <section className="results-section">
                  <h3 className="results-section-title">Validation</h3>
                  <ValidationPanel
                    issues={state.result.validation}
                    reliable={state.result.reliable}
                  />
                </section>

                <section className="results-section">
                  <h3 className="results-section-title">Classification</h3>
                  <ClassificationBadges classification={state.result.classification} />
                </section>

                <section className="results-section">
                  <h3 className="results-section-title">ABR Ladder</h3>
                  <LadderTable ladder={state.result.ladder} />
                </section>

                {/* Sample Results Section */}
                {sampleState.status !== 'idle' && (
                  <section className="results-section">
                    <h3 className="results-section-title">Sample Results</h3>

                    {sampleState.status === 'loading' && (
                      <div className="sample-loading">
                        <p className="placeholder">Sampling stream...</p>
                      </div>
                    )}

                    {sampleState.status === 'error' && (
                      <div className="sample-error">
                        <p className="error-message">{sampleState.error}</p>
                        <button
                          className="button-retry"
                          onClick={retrySample}
                          type="button"
                        >
                          Retry Sample
                        </button>
                      </div>
                    )}

                    {sampleState.status === 'success' && (
                      <div className="sample-metrics">
                        {/* Reliability Warning Banner */}
                        {!sampleState.result.reliable && (
                          <div className="sample-warning-banner">
                            <strong>Partial Results:</strong> Some issues were encountered during sampling.
                            {sampleState.result.diagnostics.errors.length > 0 && (
                              <ul className="diagnostics-list">
                                {sampleState.result.diagnostics.errors.map((error, idx) => (
                                  <li key={`error-${idx}`}>{error}</li>
                                ))}
                              </ul>
                            )}
                            {sampleState.result.diagnostics.warnings.length > 0 && (
                              <ul className="diagnostics-list">
                                {sampleState.result.diagnostics.warnings.map((warning, idx) => (
                                  <li key={`warning-${idx}`}>{warning}</li>
                                ))}
                              </ul>
                            )}
                            {sampleState.result.diagnostics.missingHeaders > 0 && (
                              <p className="diagnostics-note">
                                {sampleState.result.diagnostics.missingHeaders} of {sampleState.result.diagnostics.segmentCount} segments
                                had missing Content-Length headers.
                              </p>
                            )}
                            <button
                              className="button-retry-inline"
                              onClick={retrySample}
                              type="button"
                            >
                              Retry Sample
                            </button>
                          </div>
                        )}

                        {/* Codec Summary */}
                        <div className="metrics-subsection">
                          <h4 className="metrics-subsection-title">Detected Codecs</h4>
                          <CodecSummary codecs={sampleState.result.codecs} />
                        </div>

                        {/* Bitrate Chart */}
                        <div className="metrics-subsection">
                          <h4 className="metrics-subsection-title">Bitrate Over Time</h4>
                          <BitrateChart bitrateSeries={sampleState.result.bitrateSeries} />
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
