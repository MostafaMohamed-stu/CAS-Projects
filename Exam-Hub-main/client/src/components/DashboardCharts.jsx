import StatsPieChart from './charts/StatsPieChart'
import StatsLineChart from './charts/StatsLineChart'
import StatsBarChart from './charts/StatsBarChart'

export default function DashboardCharts({ dashboardData, userRole, selectedExamId = null, filters = {} }) {
    const roleNorm = String(userRole || '').toLowerCase()

    if (!dashboardData) return null

    // Use data directly from dashboardData (backend now handles filtering by examId)
    // Handle case-insensitive property access for PascalCase backend DTOs
    const getValue = (obj, ...keys) => {
        for (const key of keys) {
            if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key]
        }
        return null
    }

    const passPercentage = getValue(dashboardData, 'passPercentage', 'PassPercentage', 'averagePassPercentage', 'AveragePassPercentage', 'overallPassPercentage', 'OverallPassPercentage') || 0
    const failPercentage = getValue(dashboardData, 'failPercentage', 'FailPercentage', 'averageFailPercentage', 'AverageFailPercentage', 'overallFailPercentage', 'OverallFailPercentage') || 0

    // Build normalized score distribution (case-insensitive)
    const dist = (dashboardData.scoreDistribution || [])
        .map(d => ({ Name: d.Name || d.name || '', Value: d.Value !== undefined ? d.Value : d.value }))

    // Ensure pass + fail always equals 100% (mutually exclusive or complementary)
    const totalPassFail = passPercentage + failPercentage
    let displayPass = passPercentage
    let displayFail = failPercentage
    
    // If pass and fail are both 0 but we have score distribution data, derive from it
    if ((passPercentage === 0 && failPercentage === 0) || totalPassFail === 0) {
        // Backend sends: "0-50%", "50-70%", "70-85%", "85-100%"
        // "Pass" is typically 85-100% bucket
        const passBucket = dist.find(d => d.Name.includes('85') || d.Name.includes('100'))
        const totalVal = dist.reduce((sum, d) => sum + (d.Value || 0), 0)
        
        if (passBucket && totalVal > 0) {
            displayPass = Math.round((passBucket.Value / totalVal) * 100)
            displayFail = 100 - displayPass
        } else if (totalVal > 0) {
            // If no explicit pass bucket, sum all non-fail buckets or derive from total
            const failBucket = dist.find(d => d.Name.includes('0-50') || d.Name.includes('50-70') || d.Name.includes('70-85'))
            if (failBucket) {
                displayFail = Math.round((failBucket.Value / totalVal) * 100)
                displayPass = 100 - displayFail
            }
        }
    } else if (totalPassFail > 0 && totalPassFail !== 100) {
        // Scale to 100%
        displayPass = Math.round((passPercentage / totalPassFail) * 100)
        displayFail = 100 - displayPass
    } else if (passPercentage > 0 && failPercentage === 0) {
        displayFail = 100 - displayPass
    } else if (failPercentage > 0 && passPercentage === 0) {
        displayPass = 100 - displayFail
    }

    let lineChartData = []
    if (roleNorm === 'student') {
        const recent = dashboardData.recentExams || []
        lineChartData = recent
            .map(exam => ({
                Title: exam.title || exam.Title || 'Exam',
                StudentScore: exam.studentScore || exam.StudentScore || 0,
                AverageScore: exam.averageScore || exam.AverageScore || 0
            }))
            .slice(-20)
    } else {
        // For teachers/admins: limit to latest 20 exams (approximate by taking last 20 entries)
        const breakdown = dashboardData.examBreakdown || []
        lineChartData = breakdown
            .map(exam => ({
                Title: exam.examTitle || exam.title || exam.Title || 'Exam',
                AverageScore: exam.averageScore || exam.AverageScore || 0
            }))
            .slice(-20)
    }

    // Prepare bar chart data (score distribution) - normalize field names
    const barChartData = dist.map(item => ({
        Name: item.Name,
        Value: item.Value
    }))

    console.log('[DashboardCharts] Dashboard data:', dashboardData)
    console.log('[DashboardCharts] Selected exam ID:', selectedExamId)
    console.log('[DashboardCharts] Filters:', filters)
    console.log('[DashboardCharts] passPercentage:', passPercentage, 'failPercentage:', failPercentage)
    console.log('[DashboardCharts] Line chart data:', lineChartData)
    console.log('[DashboardCharts] Bar chart data:', barChartData)
    console.log('[DashboardCharts] displayPass:', displayPass, 'displayFail:', displayFail)

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
        }}>
            <div className="animate-card stagger-1">
                <StatsPieChart
                    passPercentage={displayPass}
                    failPercentage={displayFail}
                    title="Pass vs Fail Overview"
                />
            </div>

            <div className="animate-card stagger-2">
                <StatsLineChart
                    data={lineChartData}
                    title={roleNorm === 'student' ? "My Performance Trend" : "Class Performance (Average Score)"}
                    userRole={roleNorm}
                    selectedExamId={selectedExamId}
                />
            </div>

            <div className="animate-card stagger-3">
                <StatsBarChart
                    data={barChartData}
                    title="Score Distribution"
                />
            </div>
        </div>
    )
}
