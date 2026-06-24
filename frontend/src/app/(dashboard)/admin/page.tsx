'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { getAdminStats, type AdminStats } from '@/lib/api'

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(value: number) {
  return `${value.toFixed(1)}%`
}

function stars(rating: number) {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(5 - full)
}

function activityIcon(type: string) {
  if (type === 'event') return '📅'
  if (type === 'review') return '⭐'
  return '📋'
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('ro-RO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div style={{
      background: accent ? 'var(--vl-orange)' : 'var(--vl-surface)',
      border: `1px solid ${accent ? 'transparent' : 'var(--vl-border)'}`,
      borderRadius: 'var(--vl-radius-lg)',
      padding: '1.25rem 1.5rem',
      boxShadow: 'var(--vl-shadow-sm)',
    }}>
      <p style={{ fontSize: '0.8rem', color: accent ? 'rgba(255,255,255,0.75)' : 'var(--vl-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: accent ? '#fff' : 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)', lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '0.8rem', color: accent ? 'rgba(255,255,255,0.7)' : 'var(--vl-muted)', marginTop: 6 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--vl-font-display)',
      fontSize: '1.25rem',
      fontWeight: 700,
      color: 'var(--vl-dark)',
      marginBottom: '1rem',
      paddingBottom: '0.5rem',
      borderBottom: '2px solid var(--vl-orange-light)',
    }}>
      {children}
    </h2>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--vl-surface)',
      border: '1px solid var(--vl-border)',
      borderRadius: 'var(--vl-radius-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--vl-shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function HBarChart({ items, maxValue, colorKey }: {
  items: Array<{ label: string; value: number; sub?: string }>
  maxValue: number
  colorKey?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--vl-text)', fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--vl-muted)', fontWeight: 600 }}>
              {item.value}{item.sub ? ` ${item.sub}` : ''}
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--vl-surface-raised)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
              background: colorKey || 'var(--vl-orange)',
              borderRadius: 99,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 99,
      fontSize: '0.75rem',
      fontWeight: 600,
      color,
      background: bg,
    }}>
      {label}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, dbUser, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (dbUser && dbUser.role !== 'ADMIN') { router.push('/dashboard'); return }

    getAdminStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setFetching(false))
  }, [user, dbUser, loading, router])

  if (loading || fetching) {
    return (
      <>
        <Navbar />
        <main style={{ background: 'var(--vl-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--vl-muted)', fontSize: '1rem' }}>Se încarcă datele...</p>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main style={{ background: 'var(--vl-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--vl-error)', fontWeight: 600, marginBottom: 8 }}>Eroare la încărcare</p>
            <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>{error}</p>
          </div>
        </main>
      </>
    )
  }

  if (!stats) return null

  const { applications, users, events, marketplace, volunteering, reviews, recentActivity } = stats

  const topRolesMax = events.topRoles[0]?.applicationCount ?? 1
  const topSkillsMax = events.topSkills[0]?.usedInRoles ?? 1
  const topOrgsMax = events.topOrganizations[0]?.totalApplications ?? 1
  const topProductsMax = marketplace.topProducts[0]?.purchaseCount ?? 1
  const topVolMax = volunteering.topEventsByPoints[0]?.totalPointsAwarded ?? 1

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--vl-bg)', minHeight: '100vh', padding: '2rem 1.25rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '3px 10px',
              background: 'var(--vl-error-bg)',
              color: 'var(--vl-error)',
              borderRadius: 99,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}>
              ADMIN ONLY
            </div>
            <h1 style={{
              fontFamily: 'var(--vl-font-display)',
              fontSize: '2.25rem',
              fontWeight: 700,
              color: 'var(--vl-dark)',
              marginBottom: '0.5rem',
            }}>
              Panou de Administrare
            </h1>
            <p style={{ color: 'var(--vl-muted)', fontSize: '0.95rem' }}>
              Statistici și analize în timp real pentru platforma V-Link
            </p>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            <KpiCard label="Total Aplicații" value={applications.total} sub={`${applications.pending} în așteptare`} accent />
            <KpiCard label="Utilizatori" value={users.total} sub={`+${users.newThisMonth} luna aceasta`} />
            <KpiCard label="Evenimente" value={events.total} sub={`${events.active} active`} />
            <KpiCard label="Rată aprobare" value={pct(applications.approvalRate)} sub={`Respingere: ${pct(applications.rejectionRate)}`} />
            <KpiCard label="Rating mediu" value={reviews.overallAvgRating.toFixed(2)} sub={`${reviews.totalReviews} recenzii`} />
            <KpiCard label="Ore voluntariat" value={volunteering.totalHoursVolunteered.toLocaleString('ro-RO')} sub={`${volunteering.uniqueVolunteers} voluntari activi`} />
          </div>

          {/* Row 2: Applications breakdown + Monthly Trend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Application status breakdown */}
            <Card>
              <SectionTitle>Distribuție aplicații</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Aprobate', value: applications.approved, color: 'var(--vl-success)', bg: 'var(--vl-success-bg)' },
                  { label: 'Respinse', value: applications.rejected, color: 'var(--vl-error)', bg: 'var(--vl-error-bg)' },
                  { label: 'În așteptare', value: applications.pending, color: 'var(--vl-warning)', bg: 'var(--vl-warning-bg)' },
                  { label: 'Completate', value: applications.completed, color: 'var(--vl-info)', bg: 'var(--vl-info-bg)' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', padding: '1rem', background: item.bg, borderRadius: 'var(--vl-radius)', }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: item.color, fontFamily: 'var(--vl-font-display)' }}>{item.value}</p>
                    <p style={{ fontSize: '0.8rem', color: item.color, fontWeight: 500 }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--vl-muted)' }}>
                <span>Match score mediu: <strong style={{ color: 'var(--vl-dark)' }}>{applications.avgMatchScore}</strong></span>
                <span>Total: <strong style={{ color: 'var(--vl-dark)' }}>{applications.total}</strong></span>
              </div>
            </Card>

            {/* Monthly trend */}
            <Card>
              <SectionTitle>Trend aplicații (6 luni)</SectionTitle>
              {applications.monthlyTrend.length === 0 ? (
                <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>Fără date pentru perioada selectată.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {applications.monthlyTrend.map(m => (
                    <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--vl-muted)', width: 70, flexShrink: 0 }}>{m.month}</span>
                      <div style={{ flex: 1, height: 20, background: 'var(--vl-surface-raised)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${applications.total > 0 ? (m.total / Math.max(...applications.monthlyTrend.map(x => x.total))) * 100 : 0}%`, background: 'var(--vl-orange-light)' }} />
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${applications.total > 0 ? (m.approved / Math.max(...applications.monthlyTrend.map(x => x.total))) * 100 : 0}%`, background: 'var(--vl-orange)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--vl-text)', width: 30, textAlign: 'right', flexShrink: 0 }}>{m.total}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--vl-muted)' }}>
                      <span style={{ width: 12, height: 8, background: 'var(--vl-orange)', borderRadius: 2, display: 'inline-block' }} /> Aprobate
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--vl-muted)' }}>
                      <span style={{ width: 12, height: 8, background: 'var(--vl-orange-light)', borderRadius: 2, display: 'inline-block', border: '1px solid var(--vl-border)' }} /> Total
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Row 3: Top Roles + Top Skills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <Card>
              <SectionTitle>Cele mai căutate roluri</SectionTitle>
              {events.topRoles.length === 0
                ? <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>Fără date.</p>
                : <HBarChart
                    items={events.topRoles.map(r => ({ label: r.roleName, value: r.applicationCount, sub: 'aplicații' }))}
                    maxValue={topRolesMax}
                  />
              }
            </Card>
            <Card>
              <SectionTitle>Cele mai cerute skill-uri</SectionTitle>
              {events.topSkills.length === 0
                ? <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>Fără date.</p>
                : <HBarChart
                    items={events.topSkills.map(s => ({ label: s.skillName, value: s.usedInRoles, sub: 'roluri' }))}
                    maxValue={topSkillsMax}
                    colorKey="#6366F1"
                  />
              }
            </Card>
          </div>

          {/* Row 4: Top Organizations */}
          <Card style={{ marginBottom: '2.5rem' }}>
            <SectionTitle>Organizații după activitate</SectionTitle>
            {events.topOrganizations.length === 0 ? (
              <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>Fără date.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      {['Organizație', 'Evenimente', 'Total aplicații', 'Voluntari acceptați', 'Rată aprobare'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid var(--vl-border)', color: 'var(--vl-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.topOrganizations.map((org, i) => {
                      const orgApp = applications.byOrganization.find(o => o.orgId === org.orgId)
                      return (
                        <tr key={org.orgId} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--vl-surface-raised)' }}>
                          <td style={{ padding: '0.65rem 0.75rem', color: 'var(--vl-dark)', fontWeight: 500 }}>{org.orgName}</td>
                          <td style={{ padding: '0.65rem 0.75rem', color: 'var(--vl-text)' }}>{org.eventsCount}</td>
                          <td style={{ padding: '0.65rem 0.75rem', color: 'var(--vl-text)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {org.totalApplications}
                              <div style={{ flex: 1, maxWidth: 80, height: 6, background: 'var(--vl-surface-raised)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--vl-border)' }}>
                                <div style={{ height: '100%', width: `${topOrgsMax > 0 ? (org.totalApplications / topOrgsMax) * 100 : 0}%`, background: 'var(--vl-orange)' }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', color: 'var(--vl-text)' }}>{org.acceptedVolunteers}</td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            {orgApp ? (
                              <StatusBadge
                                label={pct(orgApp.approvalRate)}
                                color={orgApp.approvalRate >= 50 ? 'var(--vl-success)' : 'var(--vl-warning)'}
                                bg={orgApp.approvalRate >= 50 ? 'var(--vl-success-bg)' : 'var(--vl-warning-bg)'}
                              />
                            ) : <span style={{ color: 'var(--vl-muted)' }}>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Row 5: Marketplace + Volunteering */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Marketplace */}
            <Card>
              <SectionTitle>Marketplace — Produse populare</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--vl-info-bg)', borderRadius: 'var(--vl-radius)' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--vl-info)' }}>{marketplace.totalPointsEarned.toLocaleString('ro-RO')}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--vl-info)', fontWeight: 500 }}>Puncte câștigate</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--vl-warning-bg)', borderRadius: 'var(--vl-radius)' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--vl-warning)' }}>{marketplace.totalPointsSpent.toLocaleString('ro-RO')}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--vl-warning)', fontWeight: 500 }}>Puncte cheltuite</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--vl-success-bg)', borderRadius: 'var(--vl-radius)' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--vl-success)' }}>{marketplace.usersWithTransactions}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--vl-success)', fontWeight: 500 }}>Utilizatori activi</p>
                </div>
              </div>
              {marketplace.topProducts.length === 0 ? (
                <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>Fără tranzacții înregistrate.</p>
              ) : (
                <HBarChart
                  items={marketplace.topProducts.map(p => ({ label: p.name, value: p.purchaseCount, sub: `(${p.pointCost} pts)` }))}
                  maxValue={topProductsMax}
                  colorKey="#10B981"
                />
              )}
            </Card>

            {/* Volunteering */}
            <Card>
              <SectionTitle>Cele mai profitabile acțiuni</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--vl-orange-light)', borderRadius: 'var(--vl-radius)' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--vl-orange)' }}>{volunteering.totalPointsAwarded.toLocaleString('ro-RO')}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--vl-orange)', fontWeight: 500 }}>Puncte distribuite</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--vl-surface-raised)', borderRadius: 'var(--vl-radius)' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--vl-dark)' }}>{volunteering.totalLogs}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--vl-muted)', fontWeight: 500 }}>Sesiuni completate</p>
                </div>
              </div>
              {volunteering.topEventsByPoints.length === 0 ? (
                <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>Fără date de voluntariat.</p>
              ) : (
                <HBarChart
                  items={volunteering.topEventsByPoints.map(e => ({
                    label: e.eventTitle.length > 30 ? e.eventTitle.slice(0, 28) + '…' : e.eventTitle,
                    value: e.totalPointsAwarded,
                    sub: `pts (${e.volunteerCount} vol.)`,
                  }))}
                  maxValue={topVolMax}
                  colorKey="var(--vl-orange)"
                />
              )}
            </Card>
          </div>

          {/* Row 6: Reviews + Users */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Reviews */}
            <Card>
              <SectionTitle>Rating organizații</SectionTitle>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'var(--vl-warning-bg)', borderRadius: 'var(--vl-radius)' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--vl-warning)' }}>{reviews.overallAvgRating.toFixed(2)}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--vl-warning)' }}>{stars(reviews.overallAvgRating)}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--vl-muted)', marginTop: 2 }}>Medie generală</p>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'var(--vl-surface-raised)', borderRadius: 'var(--vl-radius)' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--vl-dark)' }}>{reviews.fiveStarCount}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--vl-muted)' }}>Recenzii 5★</p>
                </div>
              </div>
              {reviews.avgRatingByOrg.length === 0 ? (
                <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>Fără recenzii.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {reviews.avgRatingByOrg.slice(0, 6).map(org => (
                    <div key={org.orgId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--vl-border)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--vl-text)' }}>{org.orgName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: '#F59E0B' }}>{stars(org.avgRating)}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--vl-muted)' }}>{org.avgRating.toFixed(1)} ({org.reviewCount})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Users breakdown */}
            <Card>
              <SectionTitle>Utilizatori</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Voluntari', value: users.volunteers, color: 'var(--vl-info)', bg: 'var(--vl-info-bg)' },
                  { label: 'Organizatori', value: users.organizers, color: 'var(--vl-orange)', bg: 'var(--vl-orange-light)' },
                  { label: 'Noi luna aceasta', value: users.newThisMonth, color: 'var(--vl-success)', bg: 'var(--vl-success-bg)' },
                  { label: 'Noi săptămâna aceasta', value: users.newThisWeek, color: 'var(--vl-muted)', bg: 'var(--vl-surface-raised)' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.85rem', background: item.bg, borderRadius: 'var(--vl-radius)', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color, fontFamily: 'var(--vl-font-display)' }}>{item.value}</p>
                    <p style={{ fontSize: '0.75rem', color: item.color, fontWeight: 500 }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--vl-surface-raised)', borderRadius: 'var(--vl-radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--vl-muted)' }}>Total utilizatori înregistrați</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--vl-dark)', fontFamily: 'var(--vl-font-display)' }}>{users.total}</span>
              </div>
            </Card>
          </div>

          {/* Row 7: Recent Activity */}
          <Card>
            <SectionTitle>Activitate recentă</SectionTitle>
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--vl-muted)', fontSize: '0.875rem' }}>Fără activitate recentă.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentActivity.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--vl-border)' : 'none' }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{activityIcon(item.type)}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--vl-text)', margin: 0 }}>
                        <strong style={{ color: 'var(--vl-dark)' }}>{item.actor}</strong> — {item.description}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--vl-muted)', flexShrink: 0 }}>{formatDate(item.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </main>
    </>
  )
}
