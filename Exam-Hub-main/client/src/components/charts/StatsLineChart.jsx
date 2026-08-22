import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

export default function StatsLineChart({ data, title, userRole, selectedExamId = null }) {
    const hasData = data && data.length > 0
    const isSingleExam = selectedExamId && data && data.length === 1

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
                <svg style={{ width: '22px', height: '22px', fill: 'url(#gradientAreaStudent)' }} viewBox="0 0 24 24">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                </svg>
                {title}
            </h3>

            {hasData ? (
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {isSingleExam ? (
                            // Show as bar chart for single exam selection
                            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradientBarAverage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="Title"
                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                    stroke="transparent"
                                    tickMargin={10}
                                />
                                <YAxis
                                    domain={[0, 100]}
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
                                    itemStyle={{ color: '#374151' }}
                                    cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                                />
                                <Bar dataKey="AverageScore" radius={[6, 6, 0, 0]} maxBarSize={120}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="url(#gradientBarAverage)" />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : (
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradientAreaStudent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradientAreaClass" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="Title"
                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                    stroke="transparent"
                                    tickMargin={10}
                                />
                                <YAxis
                                    domain={[0, 100]}
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
                                    itemStyle={{ color: '#374151' }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="rect"
                                    wrapperStyle={{ fontSize: '0.85rem', fontWeight: '500', right: 0 }}
                                />

                                {userRole === 'student' ? (
                                    <>
                                        <Area
                                            type="monotone"
                                            dataKey="StudentScore"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#gradientAreaStudent)"
                                            name="My Score (%)"
                                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="AverageScore"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            fillOpacity={1}
                                            fill="url(#gradientAreaClass)"
                                            name="Class Avg (%)"
                                            dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        />
                                    </>
                                ) : (
                                    <Area
                                        type="monotone"
                                        dataKey="AverageScore"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#gradientAreaStudent)"
                                        name="Average Score (%)"
                                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                )}
                            </AreaChart>
                        )}
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
                    <span style={{ fontSize: '1rem', fontWeight: '500' }}>No trending data available</span>
                </div>
            )}
        </div>
    )
}
