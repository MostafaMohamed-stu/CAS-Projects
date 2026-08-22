import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function StatsBarChart({ data, title }) {
    // Gradient definitions mapping
    const GRADIENTS = [
        { id: 'gradRed', start: '#f87171', end: '#dc2626' },
        { id: 'gradYellow', start: '#fbbf24', end: '#d97706' },
        { id: 'gradGreen', start: '#34d399', end: '#059669' },
        { id: 'gradBlue', start: '#60a5fa', end: '#2563eb' }
    ]

    const hasData = data && data.length > 0

    return (
        <div style={{
            background: 'var(--bg-main)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            height: '100%',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <svg style={{ width: '22px', height: '22px', fill: 'url(#gradBlue)' }} viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
                {title}
            </h3>

            {hasData ? (
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                {GRADIENTS.map((grad) => (
                                    <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={grad.start} />
                                        <stop offset="100%" stopColor={grad.end} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="Name"
                                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                stroke="transparent"
                                tickMargin={10}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                stroke="transparent"
                                tickCount={6}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    padding: '12px'
                                }}
                                cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                            />
                            <Bar dataKey="Value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#${GRADIENTS[index % GRADIENTS.length].id})`}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-light)',
                    gap: '1rem'
                }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.2 }}>
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                    <span style={{ fontSize: '1rem', fontWeight: '500' }}>No distribution data available</span>
                </div>
            )}
        </div>
    )
}
