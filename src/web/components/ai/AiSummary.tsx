/**
 * Renders a cached, gate-validated AI summary (spec §6.2). Server component —
 * it only displays already-generated, already-validated text (G1). Every figure
 * in the text was substituted deterministically, not authored by the model.
 * Carries the "automated, general information" framing (G2).
 */

import type { StoredSummary } from '@/api';

export function AiSummary({ data }: { data: StoredSummary }) {
  return (
    <section className="ai-summary" aria-label="Automated plain-English summary">
      <header className="ai-summary__head">
        <h2 className="ai-summary__title">In plain English</h2>
        <span className="ai-summary__badge">Automated · {data.period}</span>
      </header>
      <p className="ai-summary__body">{data.summary}</p>
      <p className="ai-summary__note">
        Written by AI around figures computed from the data — the model never produces a number.
        Automated, general information, not personalised advice.
      </p>
    </section>
  );
}
