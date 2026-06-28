/**
 * Server component shown where a free user hits a Premium surface. Links to
 * /pricing. Used for hard blocks (AI summaries, portfolio trend) and as the
 * overlay CTA on teaser surfaces (charts, screener).
 */

export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="upgrade-prompt" role="note">
      <p className="upgrade-prompt__title">{feature} is a Premium feature</p>
      <p className="upgrade-prompt__copy">Unlock full history, screeners, and AI summaries.</p>
      <a href="/pricing" className="upgrade-prompt__cta">
        See plans →
      </a>
    </div>
  );
}
