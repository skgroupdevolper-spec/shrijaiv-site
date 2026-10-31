import type { Report } from '@/lib/reports';

/** The report itself — used on screen and on the print / PDF page */
export default function ReportView({ rep, logo }: { rep: Report; logo?: string }) {
  return (
    <div className="report-doc">
      <header className="report-head">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="report-logo" />
        )}
        <div>
          <h1>{rep.title}</h1>
          <p>{rep.subtitle}</p>
          <p className="report-meta">
            Period: <b>{rep.period}</b> · Generated {rep.generatedAt}
          </p>
        </div>
      </header>
      {rep.summary.length > 0 && (
        <div className="report-kpis">
          {rep.summary.map((s) => (
            <div key={s.label} className="report-kpi">
              <span>{s.label}</span>
              <b>{s.value}</b>
            </div>
          ))}
        </div>
      )}
      {rep.sections.map((sec) => (
        <section key={sec.title} className="report-sec">
          <h2>
            {sec.title} <small>({sec.rows.length})</small>
          </h2>
          {sec.rows.length === 0 ? (
            <p className="report-empty">No data for this period.</p>
          ) : (
            <div className="report-tablewrap">
              <table>
                <thead>
                  <tr>
                    {sec.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sec.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((v, j) => (
                        <td key={j} className={typeof v === 'number' ? 'num' : undefined}>
                          {typeof v === 'number' ? v.toLocaleString('en-IN') : (v ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
