import './App.css'
import { InputPanel, type InputType } from './components/InputPanel'
import { usePlaylistAnalysis } from './hooks/usePlaylistAnalysis'
import { ValidationPanel } from './components/ValidationPanel'
import { ClassificationBadges } from './components/ClassificationBadges'
import { LadderTable } from './components/LadderTable'

function App() {
  const { state, analyze } = usePlaylistAnalysis()

  const handleAnalyze = (inputType: InputType, value: string | File) => {
    analyze(inputType, value)
  }

  const isLoading = state.status === 'loading'

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-kicker">Stream ABR Advisor</p>
        <h1 className="app-title">Ingest + RFC Validation</h1>
        <p className="app-subtitle">
          Phase 1 foundation for playlist intake, structure checks, and ladder
          baseline extraction.
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
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
