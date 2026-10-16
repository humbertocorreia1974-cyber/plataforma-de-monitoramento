import { copy } from '@/content/copy';

export default function WelcomePage() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>{copy.onboarding.welcomeTitle}</h1>
      <ol style={{ paddingLeft: '1.25rem', lineHeight: 1.8 }}>
        {copy.onboarding.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      {copy.onboarding.helpTips.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f4f4f5', borderRadius: 8 }}>
          <strong>Dicas rápidas:</strong>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            {copy.onboarding.helpTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
