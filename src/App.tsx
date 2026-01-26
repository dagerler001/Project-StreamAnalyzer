import './App.css'

function App() {
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
            <p className="placeholder">Ingest controls will live here.</p>
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
            <p className="placeholder">Results output will render here.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
