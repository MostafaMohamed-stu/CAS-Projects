import { useEffect, useMemo, useState } from "react"
import { axiosInstance } from "../../utils/authService"
import { ArrowLeft, Users, FileText, ClipboardList } from "lucide-react"
import "./TeamProfile.css"

const TeamProfile = ({ teamId, user, setCurrentPage }) => {
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [reviewers, setReviewers] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [project, setProject] = useState(null)

  const safeTeamId = useMemo(() => teamId, [teamId])

  const loadDbProject = async (tid) => {
    try {
      const res = await axiosInstance.get(`/Project/ByTeam/${tid}`)
      const p = res.data
      if (!p) return null
      return {
        nameEn: p.NameEn ?? p.nameEn ?? "",
        nameAr: p.NameAr ?? p.nameAr ?? "",
        description: p.ProjectDescription ?? p.projectDescription ?? "",
        additionalInformation: p.AdditionalInformation ?? p.additionalInformation ?? "",
      }
    } catch {
      return null
    }
  }

  const load = async () => {
    try {
      setLoading(true)
      // Base team info
      const tRes = await axiosInstance.get(`/Teams/${safeTeamId}`)
      const t = tRes.data || {}
      const normalizedTeam = {
        id: t.Id ?? t.id ?? safeTeamId,
        teamName: t.TeamName ?? t.teamName ?? "Team",
        classId: t.ClassId ?? t.classId ?? null,
        className: t.ClassName ?? t.className ?? "",
        teamLeaderAccountId: t.TeamLeaderAccountId ?? t.teamLeaderAccountId ?? null,
        teamLeaderName: t.TeamLeaderName ?? t.teamLeaderName ?? "",
      }
      setTeam(normalizedTeam)

      // Load project from database (via Project/My for current user)
      const dbProject = await loadDbProject(normalizedTeam.id)
      setProject(dbProject)

      // Members
      const tmRes = await axiosInstance.get(`/TeamMembers`)
      const tmList = tmRes.data?.$values || tmRes.data || []
      const filteredMembers = (Array.isArray(tmList) ? tmList : []).filter(m => (m.teamId ?? m.TeamId) === normalizedTeam.id).map(m => ({
        id: m.teamMemberAccountId ?? m.TeamMemberAccountId,
        fullName: m.memberName ?? m.MemberName ?? "Member",
        email: m.memberEmail ?? m.MemberEmail ?? "",
        role: m.teamMemberDescription ?? m.TeamMemberDescription ?? "Team Member",
      }))
      setMembers(filteredMembers)

      // Engineers by class (previously labeled Reviewers)
      if (normalizedTeam.classId) {
        const reviewersResponse = await axiosInstance.get(`/Account/Reviewers/ByClass/${normalizedTeam.classId}`)
        const rData = reviewersResponse.data
        const rList = Array.isArray(rData) ? rData : rData?.$values || []
        const mappedReviewers = rList.map(r => ({
          id: r.accountId,
          fullName: r.fullNameEn || r.fullNameAr || "Engineer",
          role: "Engineer"
        }))
        setReviewers(mappedReviewers)
      } else {
        setReviewers([])
      }

      // Capstone supervisors (global list; filter by optional class if needed)
      const csRes = await axiosInstance.get(`/Account/CapstoneSupervisors`)
      const csData = csRes.data
      const csList = Array.isArray(csData) ? csData : csData?.$values || []
      const mappedSupervisors = csList.map(s => ({
        id: s.accountId,
        fullName: s.fullNameEn || s.fullNameAr || "Supervisor",
        role: "Capstone Supervisor"
      }))
      setSupervisors(mappedSupervisors)
    } catch (e) {
      console.error("TeamProfile load error:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [safeTeamId])

  return (
    <div className="team-profile">
      <div className="profile-hero">
        <div className="profile-hero-content">
          <button className="back-btn" onClick={() => setCurrentPage("view-tasks")}> 
            <ArrowLeft size={16} /> Back to Teams
          </button>
          <h1 className="profile-title">Team Profile</h1>
          {team && <p className="profile-subtitle">{team.teamName} {team.className ? `• ${team.className}` : ""}</p>}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading team...</div>
      ) : !team ? (
        <div className="loading">Team not found</div>
      ) : (
        <div className="profile-grid">
          <div className="card project-card main-project">
            <div className="project-header">
              <div className="project-header-row">
                <div className="project-title-wrap">
                  <h3 className="project-title">
                    <ClipboardList size={18} /> {project?.nameEn || "Team Project"}
                  </h3>
                  {project?.nameAr && (
                    <div className="project-title-ar">{project.nameAr}</div>
                  )}
                </div>
                
              </div>
            </div>

            {project ? (
              <div className="project-body">
                <div className="project-meta">
                  <div className="meta-item">
                    <span className="meta-label">Team</span>
                    <span className="meta-value">{team?.teamName || "—"}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Class</span>
                    <span className="meta-value">{team?.className || "—"}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Leader</span>
                    <span className="meta-value">{team?.teamLeaderName || "—"}</span>
                  </div>
                </div>

                <div className="project-grid">
                  <div className="project-section">
                    <div className="section-label">Description</div>
                    <div className="section-box">
                      <p className="paragraph">{project.description || "—"}</p>
                    </div>
                  </div>
                  <div className="project-section">
                    <div className="section-label">Additional Info</div>
                    <div className="section-box">
                      <p className="paragraph">{project.additionalInformation || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty">No project details found for this team.</div>
            )}
          </div>

          <div className="right-column">
            <div className="card">
              <h3 className="section-title"><Users size={16} /> Members</h3>
              <div className="list">
                {members.length === 0 ? (
                  <div className="empty">No members found</div>
                ) : members.map((m) => (
                  <div key={m.id} className="list-item">
                    <div className="avatar">{(m.fullName || "M").charAt(0)}</div>
                    <div className="item-info">
                      <div className="name-row">
                        <span className="name">{m.fullName}</span>
                        {m.id === team.teamLeaderAccountId && <span className="badge">Leader</span>}
                      </div>
                      <span className="secondary">{m.role}</span>
                      {m.email && <span className="tertiary">{m.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="section-title"><FileText size={16} /> Engineers</h3>
              <div className="list">
                {reviewers.length === 0 ? (
                  <div className="empty">No engineers assigned</div>
                ) : reviewers.map((r) => (
                  <div key={r.id} className="list-item small">
                    <div className="avatar small">{(r.fullName || "E").charAt(0)}</div>
                    <div className="item-info">
                      <span className="name">{r.fullName}</span>
                      <span className="secondary">{r.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">Supervisors</h3>
              <div className="list">
                {supervisors.length === 0 ? (
                  <div className="empty">No supervisors listed</div>
                ) : supervisors.map((s) => (
                  <div key={s.id} className="list-item small">
                    <div className="avatar small">{(s.fullName || "S").charAt(0)}</div>
                    <div className="item-info">
                      <span className="name">{s.fullName}</span>
                      <span className="secondary">{s.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamProfile


