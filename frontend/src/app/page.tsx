import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--vl-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navbar minimal */}
      <nav
        style={{
          padding: '0 1.25rem',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--vl-border)',
          background: 'var(--vl-surface)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--vl-font-display)',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--vl-dark)',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 28, height: 28,
              background: 'var(--vl-orange)',
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="white" fillOpacity="0.9"/>
              <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="white"/>
            </svg>
          </span>
          V-Link
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '0.875rem', color: 'var(--vl-muted)', fontWeight: 500 }}>
            Autentificare
          </Link>
          <Link
            href="/register"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'var(--vl-orange)',
              color: '#fff',
              padding: '7px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'background 150ms',
            }}
          >
            Înregistrare
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background shape */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: 480,
            height: 480,
            background: 'radial-gradient(circle, rgba(232,82,10,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0%',
            left: '-5%',
            width: 320,
            height: 320,
            background: 'radial-gradient(circle, rgba(22,101,52,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ textAlign: 'center', maxWidth: 640, position: 'relative', zIndex: 1 }}>
          {/* Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--vl-orange-light)',
              color: 'var(--vl-orange-hover)',
              borderRadius: 999,
              padding: '4px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              border: '1px solid rgba(232,82,10,0.2)',
              letterSpacing: '0.03em',
            }}
          >
            <span>●</span> Platformă de voluntariat
          </div>

          <h1
            style={{
              fontFamily: 'var(--vl-font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 700,
              color: 'var(--vl-dark)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
            }}
          >
            Conectăm voluntari<br />
            <em style={{ color: 'var(--vl-orange)', fontStyle: 'italic' }}>cu scop</em>
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--vl-muted)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: 480,
              margin: '0 auto 2.5rem',
            }}
          >
            Găsește evenimente unde poți face diferența sau organizează activități și atrage voluntarii potriviți prin matching automat de skill-uri.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                background: 'var(--vl-orange)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(232,82,10,0.30)',
                transition: 'all 150ms',
              }}
            >
              Începe acum
            </Link>
            <Link
              href="/login"
              style={{
                background: 'var(--vl-surface)',
                color: 'var(--vl-text)',
                padding: '12px 28px',
                borderRadius: 10,
                fontWeight: 500,
                fontSize: '0.95rem',
                textDecoration: 'none',
                border: '1px solid var(--vl-border)',
                transition: 'all 150ms',
              }}
            >
              Autentificare
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section
        style={{
          padding: '4rem 1.25rem',
          background: 'var(--vl-surface)',
          borderTop: '1px solid var(--vl-border)',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[
            {
              icon: '🔍',
              title: 'Potrivire inteligentă',
              desc: 'Algoritmul nostru calculează automat compatibilitatea între skill-urile tale și cerințele rolului.',
            },
            {
              icon: '📋',
              title: 'Gestionare simplă',
              desc: 'Organizatorii creează evenimente cu roluri, track-uiesc aplicații și aprobă voluntarii potriviți.',
            },
            {
              icon: '🏆',
              title: 'Recompense & puncte',
              desc: 'Fiecare rol voluntar vine cu puncte și ore care îți construiesc profilul în comunitate.',
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: 'var(--vl-bg)',
                border: '1px solid var(--vl-border)',
                borderRadius: 14,
                padding: '1.75rem',
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3
                style={{
                  fontFamily: 'var(--vl-font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--vl-dark)',
                  marginBottom: '0.5rem',
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--vl-muted)', lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
