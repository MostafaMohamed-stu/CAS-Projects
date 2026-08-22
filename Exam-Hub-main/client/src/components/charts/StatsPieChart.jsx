import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export default function StatsPieChart({ passPercentage, failPercentage, title }) {
    // Normalize pass/fail so the donut always has both colors and sums to ~100
    const rawPass = Math.max(0, Math.min(100, passPercentage || 0))
    let rawFail = typeof failPercentage === 'number' ? failPercentage : (100 - rawPass)

    // If backend fail is missing or inconsistent, derive it from pass
    if (rawFail < 0 || rawFail > 100 || Math.abs(rawPass + rawFail - 100) > 0.5) {
        rawFail = 100 - rawPass
    }

    const hasData = rawPass > 0 || rawFail > 0

    const normalizedPass = Math.round(rawPass * 100) / 100
    const normalizedFail = Math.round(rawFail * 100) / 100

    const data = [
        { name: 'Pass', value: normalizedPass },
        { name: 'Fail', value: normalizedFail }
    ]

    return (
        <div style={{
            background: 'var(--bg-main)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            height: '100%',
            minHeight: '400px', // Increased height
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
                <svg style={{ width: '22px', height: '22px', fill: 'url(#gradientPass)' }} viewBox="0 0 24 24">
                    <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z" />
                </svg>
                {title}
            </h3>

            {hasData ? (
                <div style={{ flex: 1, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                <linearGradient id="gradientPass" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                                <linearGradient id="gradientFail" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f87171" />
                                    <stop offset="100%" stopColor="#dc2626" />
                                </linearGradient>
                            </defs>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80} // Donut style
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell key="cell-pass" fill="url(#gradientPass)" />
                                <Cell key="cell-fail" fill="url(#gradientFail)" />
                            </Pie>
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
                                itemStyle={{ color: '#374151' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '0.9rem', fontWeight: '500' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text for Donut */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -60%)',
                            textAlign: 'center',
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
                            {normalizedPass}%
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '4px' }}>
                            Pass Rate
                        </div>
                    </div>
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
                    <span style={{ fontSize: '1rem', fontWeight: '500' }}>No exam data available</span>
                </div>
            )}
        </div>
    )
}
