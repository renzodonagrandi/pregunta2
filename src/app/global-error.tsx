'use client'

// Replaces the root layout when it fails, so it can't rely on next-intl
// providers or global styles; kept bilingual and inline-styled on purpose.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang='es'>
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          margin: 0,
        }}
      >
        <main style={{ textAlign: 'center', padding: 16 }}>
          <h1>Algo salió mal · Algo deu errado</h1>
          <button type='button' onClick={reset}>
            Reintentar · Tentar novamente
          </button>
        </main>
      </body>
    </html>
  )
}
