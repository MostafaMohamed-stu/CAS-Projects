import { useEffect, useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { axiosInstance } from "../../utils/authService"
import toast from "react-hot-toast"
import "./MyProjectPage.css"

const MyProjectPage = ({ user }) => {
  const [loading, setLoading] = useState(true)
  const [isLeader, setIsLeader] = useState(false)
  const [team, setTeam] = useState(null)
  const [form, setForm] = useState({
    nameEn: "",
    nameAr: "",
    description: "",
    additionalInformation: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const currentUserId = useMemo(() => user?.id ?? null, [user])

  const fetchProjectFromServer = async () => {
    try {
      const res = await axiosInstance.get(`/Project/My`)
      const data = res?.data || null
      if (data) {
        setForm({
          nameEn: data.nameEn || "",
          nameAr: data.nameAr || "",
          description: data.projectDescription || "",
          additionalInformation: data.additionalInformation || "",
        })
      }
    } catch {
      // No project yet on server — keep empty form
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      if (!currentUserId) {
        toast.error("User not found")
        setLoading(false)
        return
      }

      // Try to get team by leader. If found => user is leader
      let teamRes = null
      try {
        const res = await axiosInstance.get(`/Teams/ByLeader/${currentUserId}`)
        teamRes = res?.data || null
      } catch {
        teamRes = null
      }

      if (teamRes && teamRes.id) {
        setIsLeader(true)
        setTeam(teamRes)
        await fetchProjectFromServer()
        setLoading(false)
        return
      }

      // Not a leader: find team via membership
      const membersResp = await axiosInstance.get(`/TeamMembers`)
      const members = membersResp.data?.$values || membersResp.data || []
      const myMembership = members.find((m) => m.teamMemberAccountId === currentUserId)
      if (myMembership && myMembership.teamId) {
        // Fetch team details to show name
        try {
          const t = await axiosInstance.get(`/Teams/${myMembership.teamId}`)
          setTeam({ id: t.data?.Id || myMembership.teamId, teamName: t.data?.TeamName || myMembership.TeamName || "My Team" })
        } catch {
          setTeam({ id: myMembership.teamId, teamName: myMembership.TeamName || "My Team" })
        }
        await fetchProjectFromServer()
      }
      setIsLeader(false)
      setLoading(false)
    } catch (err) {
      console.error("MyProjectPage fetch error:", err)
      toast.error("Failed to load project info")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!team?.id) {
      toast.error("No team assigned")
      return
    }
    try {
      setIsSaving(true)
      setLastSavedAt(new Date())
      toast.loading("Saving to server...", { id: "save-project" })
      try {
        await axiosInstance.post(`/Project/My`, {
          nameEn: form.nameEn,
          nameAr: form.nameAr,
          additionalInformation: form.additionalInformation,
          projectDescription: form.description,
          statusId: 1
        })
        toast.success("Project saved", { id: "save-project" })
      } catch (err) {
        if (err?.response?.status === 403) {
          toast.error("Not allowed to save (leader or admin only)", { id: "save-project" })
        } else if (err?.response?.status === 429) {
          toast.error("Too many requests. Please wait", { id: "save-project" })
        } else {
          toast.error("Server error while saving", { id: "save-project" })
        }
      }
      setIsSaving(false)
    } catch (e) {
      setIsSaving(false)
      toast.error("Failed to save locally")
    }
  }

  if (loading) {
    return (
      <div className="my-project-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <div className="loading-title">Loading Project Data</div>
            <div className="loading-subtitle">Please wait while we fetch your project information...</div>
          </div>
        </div>
      </div>
    )
  }

  // If student doesn't have a team, show same alert and hide rest of page (like PhasesSection)
  if (!team) {
    return (
      <div className="my-project-page">
        <div className="no-team-message">
          <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>No Team Assigned</h3>
          <p style={{ color: '#6b7280', marginBottom: '12px' }}>
            You are not currently assigned to any team.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Please contact your instructor or administrator to be assigned to a team.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="my-project-page">
      <div className="hero" style={{ animation: 'fadeInDown 0.3s ease-out' }}>
        <div className="hero-content">
          <div className="hero-top">
            <h1 className="title">My Project</h1>
            <span className={`role-badge ${isLeader ? 'leader' : 'member'}`}>{isLeader ? 'Team Leader' : 'Team Member'}</span>
          </div>
          {team && <p className="subtitle">Team: {team.teamName || "My Team"}</p>}
          <p className="note">{isLeader ? "You can edit your team's project details." : "View only. Only the team leader can edit project details."}</p>
        </div>
      </div>

      

      <div className="meta-bar">
        {!isLeader && (
          <div className="readonly-banner">You are viewing your team project in read-only mode.</div>
        )}
        {!!lastSavedAt && (
          <div className="last-saved">Last saved {lastSavedAt.toLocaleTimeString()}</div>
        )}
      </div>

      <div className="myproject-grid" style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}>
        <div className="card form-card">
          <div className="section-header">
            <h3>Project Identity</h3>
            <p>Provide a clear, bilingual name and your company affiliation.</p>
          </div>
          <div className="form-group">
            <label>Project Name (EN)</label>
            <input
              type="text"
              className="input"
              value={form.nameEn}
              onChange={(e) => handleChange("nameEn", e.target.value)}
              disabled={!isLeader}
              placeholder="e.g., Smart Energy Monitoring System"
              maxLength={120}
            />
            <div className="help-row">
              <span className="help-text">Up to 120 characters</span>
              <span className="counter">{(form.nameEn || "").length}/120</span>
            </div>
          </div>

          <div className="form-group">
            <label>Project Name (AR)</label>
            <input
              type="text"
              className="input"
              value={form.nameAr}
              onChange={(e) => handleChange("nameAr", e.target.value)}
              disabled={!isLeader}
              placeholder="مثال: نظام مراقبة الطاقة الذكي"
              maxLength={120}
            />
            <div className="help-row">
              <span className="help-text">حتى ١٢٠ حرفًا</span>
              <span className="counter">{(form.nameAr || "").length}/120</span>
            </div>
          </div>

          

          <div className="section-header">
            <h3>Details</h3>
            <p>Summarize the scope, objectives, and technologies.</p>
          </div>
          <div className="form-group">
            <label>Project Description</label>
            <textarea
              className="textarea"
              rows={8}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={!isLeader}
              placeholder="Describe the project scope, objectives, and technologies used"
              maxLength={1200}
            />
            <div className="help-row">
              <span className="help-text">Aim for clarity and impact</span>
              <span className="counter">{(form.description || "").length}/1200</span>
            </div>
          </div>

          <div className="form-group">
            <label>Additional Information</label>
            <textarea
              className="textarea"
              rows={4}
              value={form.additionalInformation}
              onChange={(e) => handleChange("additionalInformation", e.target.value)}
              disabled={!isLeader}
              placeholder="Any extra notes or links"
              maxLength={800}
            />
            <div className="help-row">
              <span className="help-text">Links, references, constraints, etc.</span>
              <span className="counter">{(form.additionalInformation || "").length}/800</span>
            </div>
          </div>

          {isLeader && (
            <div className="actions">
              <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="right-column">
          <div className="card preview-card">
            <h3 className="preview-title">Live Preview</h3>
            <div className="preview-item"><span className="preview-label">Name (EN):</span><span className="preview-value">{form.nameEn || "—"}</span></div>
            <div className="preview-item"><span className="preview-label">Name (AR):</span><span className="preview-value">{form.nameAr || "—"}</span></div>
            
            <div className="preview-item multiline"><span className="preview-label">Description:</span><p className="preview-paragraph">{form.description || "—"}</p></div>
            <div className="preview-item multiline"><span className="preview-label">Additional:</span><p className="preview-paragraph">{form.additionalInformation || "—"}</p></div>
          </div>

          <div className="card tips-card">
            <h3 className="tips-title">Tips</h3>
            <ul className="tips-list">
              <li>Use clear, concise titles that reflect your project scope.</li>
              <li>Describe key objectives, stakeholders, and technologies used.</li>
              <li>Add link to prototype, or any documentation in Additional Information.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyProjectPage


