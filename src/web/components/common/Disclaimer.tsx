/**
 * Mandatory disclaimer (G2). Every report card, AI summary, and chart surface
 * MUST render this. Do not edit the copy without human approval (CLAUDE.md).
 */

export const DISCLAIMER_TEXT =
  'Automated, general information — not personalised advice. NGX data is delayed/end-of-day. Investing carries risk.';

export function Disclaimer() {
  return (
    <p className="disclaimer" role="note">
      {DISCLAIMER_TEXT}
    </p>
  );
}
