
import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff } from "lucide-react"
import { isDevelopment } from "../../config/apiConfig"
import { staffAdminService } from "../../utils/staffAdminService"
import { axiosInstance } from "../../utils/authService"
import { authService } from "../../utils/authService"
import { validatePasswordComplexity } from "../../utils/inputValidation"
import PasswordStrengthIndicator from '../PasswordStrengthIndicator/PasswordStrengthIndicator.jsx'
import toast from "react-hot-toast"
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner"
import "./StaffAdminPage.css"

const StaffAdminPage = () => {
  const [activeSection, setActiveSection] = useState("accounts")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [editingAccount, setEditingAccount] = useState(null)
  const [editingTeam, setEditingTeam] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [assignLeaderFor, setAssignLeaderFor] = useState(null) // deprecated; no longer used
  const [availableTeamsByClass, setAvailableTeamsByClass] = useState([]) // deprecated

  const [accounts, setAccounts] = useState([])
  const [teams, setTeams] = useState([])
  const [roles, setRoles] = useState([])
  const [classes, setClasses] = useState([])
  const [teamGradeFilter, setTeamGradeFilter] = useState("")
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  
  // Bulk selection states
  const [selectedAccounts, setSelectedAccounts] = useState(new Set())
  const [selectedTeams, setSelectedTeams] = useState(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const selectAllAccountsRef = useRef(null)

  // Load data on component mount
  useEffect(() => {
    checkUserRole()
    loadAccounts()
    loadRoles()
    loadClasses()
    loadTeams()
    loadTeamMembers()
  }, [])

  const normalizeRoleName = (rawRole) => {
    if (!rawRole) return rawRole
    const role = String(rawRole).trim()
    const map = new Map([
      ["superadmin", "Super Admin"],
      ["super admin", "Super Admin"],
      ["super_admin", "Super Admin"],
      ["staffadmin", "Staff Admin"],
      ["staff admin", "Staff Admin"],
      ["staff_admin", "Staff Admin"],
      ["engineer", "Engineer"],
      ["student", "Student"],
    ])
    const key = role.toLowerCase()
    return map.get(key) || role
  }

  const loadTeamMembers = async () => {
    try {
      const res = await axiosInstance.get(`/TeamMembers`)
      const list = Array.isArray(res.data) ? res.data : (res.data?.$values || [])
      // Normalize keys used below
      const norm = list.map(tm => ({
        id: tm.id ?? tm.Id,
        teamId: tm.teamId ?? tm.TeamId,
        teamMemberAccountId: tm.teamMemberAccountId ?? tm.TeamMemberAccountId,
        memberName: tm.memberName ?? tm.MemberName ?? "Member",
      }))
      setTeamMembers(norm)
    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error('Error loading team members:', err)
      }
      setTeamMembers([])
    }
  }

  const normalizeForCompare = (value) => {
    if (!value) return ""
    return String(value).toLowerCase().replace(/\s|_/g, "")
  }

  const getAccountRoleForCompare = (account) => {
    const raw = (account && (account.roleName ?? account.role)) || ""
    return normalizeForCompare(raw)
  }

  const checkUserRole = async () => {
    try {
      const userData = authService.getStoredUser()
      if (!userData) {
        toast.error('Please log in to access this page')
        return
      }
      setUserRole(userData.role)
      setCurrentUserId(userData.id)
    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error('Error checking user role:', err)
      }
    }
  }

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const data = await staffAdminService.getAllAccounts()
      
      if (isDevelopment() === 'development') {
        console.log('StaffAdminPage - Accounts data loaded');
      }
      
      // Extract the actual array from the wrapped response
      const accountsArray = data?.$values || data || []
      setAccounts(Array.isArray(accountsArray) ? accountsArray : [])
    } catch (err) {
      if (String(err.message || '').includes('Not allowed (403)')) {
        toast.error('Not allowed: you do not have permission to access accounts.')
      } else {
        toast.error(`Error loading accounts: ${err.message}`)
      }
      if (isDevelopment() === 'development') {
        console.error('Error loading accounts:', err)
      }
      // Set empty array as fallback
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await staffAdminService.getRoles()
      // Extract the actual array from the wrapped response
      const rolesArray = data?.$values || data || []
      const normalizedRoles = Array.isArray(rolesArray) ? rolesArray : []
      // Ensure Super Admin and Staff Admin are always present in the dropdown
      const enforcedRoles = [
        { id: -1, roleName: 'Super Admin' },
        { id: -2, roleName: 'Staff Admin' }
      ]
      const existingRoleNames = new Set(normalizedRoles.map((r) => r.roleName))
      const mergedRoles = [...normalizedRoles]
      enforcedRoles.forEach((role) => {
        if (!existingRoleNames.has(role.roleName)) {
          mergedRoles.push(role)
        }
      })
      setRoles(mergedRoles)
    } catch (err) {
      toast.error(`Error loading roles: ${err.message}`)
      if (isDevelopment() === 'development') {
        console.error('Error loading roles:', err)
      }
      // Set default roles as fallback
      setRoles([
        { id: 1, roleName: 'Student' },
        { id: 2, roleName: 'Engineer' },
        { id: 3, roleName: 'Super Admin' },
        { id: 4, roleName: 'Staff Admin' },
        { id: 26, roleName: 'Board' }
      ])
    }
  }

  const loadClasses = async () => {
    try {
      const data = await staffAdminService.getClasses()
      // Extract the actual array from the wrapped response
      const classesArray = data?.$values || data || []
      setClasses(Array.isArray(classesArray) ? classesArray : [])
    } catch (err) {
      toast.error(`Error loading classes: ${err.message}`)
      if (isDevelopment() === 'development') {
        console.error('Error loading classes:', err)
      }
      // Set empty array as fallback
      setClasses([])
    }
  }

  const loadTeams = async () => {
    try {
      if (isDevelopment() === 'development') {
        console.log('StaffAdminPage - Loading teams...')
      }
      const data = await staffAdminService.getAllTeams()
      // Extract the actual array from the wrapped response
      const teamsArray = data?.$values || data || []
      setTeams(Array.isArray(teamsArray) ? teamsArray : [])
    } catch (err) {
      toast.error(`Error loading teams: ${err.message}`)
      if (isDevelopment() === 'development') {
        console.error('Error loading teams:', err)
      }
      // Set empty array as fallback
      setTeams([])
    }
  }

  const filteredAccounts = (accounts || []).filter((account) => {
    const name = (account?.fullNameEn || "").toString()
    const email = (account?.email || "").toString()
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole =
      !roleFilter || getAccountRoleForCompare(account) === normalizeForCompare(roleFilter)
    return matchesSearch && matchesRole
  })

  const filteredTeams = (teams || []).filter((team) => {
    const matchesSearch =
      team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.teamLeaderName && team.teamLeaderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (team.className && team.className.toLowerCase().includes(searchTerm.toLowerCase()))
    // Match by selected grade using classes map
    const cls = (classes || []).find(c => c.id === (team.classId || team.ClassId))
    const teamGradeName = cls?.gradeName || cls?.GradeName || ""
    const matchesGrade = !teamGradeFilter || (teamGradeName.toLowerCase() === teamGradeFilter.toLowerCase())
    return matchesSearch && matchesGrade
  })

  const handleDeleteAccount = async (id) => {
    // Prevent user from deleting themselves
    if (id === currentUserId) {
      toast.error("You cannot delete your own account")
      setShowDeleteConfirm(null)
      return
    }

    try {
      setLoading(true)
      await staffAdminService.deleteAccount(id)
      setAccounts(accounts.filter((acc) => acc.id !== id))
      setShowDeleteConfirm(null)
      toast.success('Account deleted successfully')
    } catch (err) {
      toast.error(`Error deleting account: ${err.message}`)
      if (isDevelopment() === 'development') {
        console.error('Error deleting account:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async (id) => {
    try {
      setLoading(true)
      // Delete team members first
      const membersToDelete = (teamMembers || []).filter(tm => tm.teamId === id)
      for (const m of membersToDelete) {
        try { await staffAdminService.deleteTeamMember(m.id) } catch (e) { 
          if (isDevelopment() === 'development') {
            console.error('Failed to delete member', e) 
          }
        }
      }
      await staffAdminService.deleteTeam(id)
      setTeams(teams.filter((team) => team.id !== id))
      // Update local teamMembers cache
      if (teamMembers && teamMembers.length) {
        setTeamMembers(teamMembers.filter(tm => tm.teamId !== id))
      }
      setShowDeleteConfirm(null)
      toast.success('Team deleted successfully')
    } catch (err) {
      toast.error(`Error deleting team: ${err.message}`)
      if (isDevelopment() === 'development') {
        console.error('Error deleting team:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  // Bulk selection handlers
  const handleSelectAccount = (accountId, checked) => {
    const newSelected = new Set(selectedAccounts)
    if (checked) {
      newSelected.add(accountId)
    } else {
      newSelected.delete(accountId)
    }
    setSelectedAccounts(newSelected)
  }

  const handleSelectTeam = (teamId, checked) => {
    const newSelected = new Set(selectedTeams)
    if (checked) {
      newSelected.add(teamId)
    } else {
      newSelected.delete(teamId)
    }
    setSelectedTeams(newSelected)
  }

  // Keep the select-all checkbox in indeterminate state when partially selected
  useEffect(() => {
    try {
      if (!selectAllAccountsRef.current) return
      const selectable = filteredAccounts.filter(acc => acc.id !== currentUserId)
      const isPartial = selectedAccounts.size > 0 && selectedAccounts.size < selectable.length
      selectAllAccountsRef.current.indeterminate = isPartial
    } catch (_) {
      // ignore
    }
  }, [selectedAccounts, filteredAccounts, currentUserId])

  const handleSelectAllAccounts = (checked) => {
    if (checked) {
      // Exclude current user from selection
      const allIds = new Set(filteredAccounts
        .filter(acc => acc.id !== currentUserId)
        .map(acc => acc.id))
      setSelectedAccounts(allIds)
    } else {
      setSelectedAccounts(new Set())
    }
  }

  const handleSelectAllTeams = (checked) => {
    if (checked) {
      const allIds = new Set(filteredTeams.map(team => team.id))
      setSelectedTeams(allIds)
    } else {
      setSelectedTeams(new Set())
    }
  }

  // Bulk delete handlers
  const handleBulkDeleteAccounts = async () => {
    try {
      setLoading(true)
      // Filter out current user from deletion
      const selectedIds = Array.from(selectedAccounts).filter(id => id !== currentUserId)
      let successCount = 0
      let errorCount = 0

      // Check if current user was in selection
      if (selectedAccounts.has(currentUserId)) {
        toast.warning("You cannot delete your own account. It has been excluded from the deletion.")
      }

      for (const id of selectedIds) {
        try {
          await staffAdminService.deleteAccount(id)
          successCount++
        } catch (err) {
          if (isDevelopment() === 'development') {
            console.error(`Error deleting account ${id}:`, err)
          }
          errorCount++
        }
      }

      // Update local state
      setAccounts(accounts.filter(acc => !selectedAccounts.has(acc.id)))
      setSelectedAccounts(new Set())

      if (errorCount === 0) {
        toast.success(`${successCount} account(s) deleted successfully`)
      } else {
        toast.error(`${successCount} account(s) deleted, ${errorCount} failed`)
      }
    } catch (err) {
      toast.error(`Error in bulk delete: ${err.message}`)
    } finally {
      setLoading(false)
      setShowBulkDeleteConfirm(null)
    }
  }

  const handleBulkDeleteTeams = async () => {
    try {
      setLoading(true)
      const selectedIds = Array.from(selectedTeams)
      let successCount = 0
      let errorCount = 0

      for (const id of selectedIds) {
        try {
          // Delete team members first
          const membersToDelete = (teamMembers || []).filter(tm => tm.teamId === id)
          for (const m of membersToDelete) {
            try { 
              await staffAdminService.deleteTeamMember(m.id) 
            } catch (e) { 
              if (isDevelopment() === 'development') {
                console.error('Failed to delete member', e) 
              }
            }
          }
          await staffAdminService.deleteTeam(id)
          successCount++
        } catch (err) {
          if (isDevelopment() === 'development') {
            console.error(`Error deleting team ${id}:`, err)
          }
          errorCount++
        }
      }

      // Update local state
      setTeams(teams.filter(team => !selectedTeams.has(team.id)))
      if (teamMembers && teamMembers.length) {
        setTeamMembers(teamMembers.filter(tm => !selectedTeams.has(tm.teamId)))
      }
      setSelectedTeams(new Set())

      if (errorCount === 0) {
        toast.success(`${successCount} team(s) deleted successfully`)
      } else {
        toast.error(`${successCount} team(s) deleted, ${errorCount} failed`)
      }
    } catch (err) {
      toast.error(`Error in bulk delete: ${err.message}`)
    } finally {
      setLoading(false)
      setShowBulkDeleteConfirm(null)
    }
  }

  const handleDeleteAllTeamsInGrade = async (gradeName) => {
    try {
      setLoading(true)
      const teamsInGrade = filteredTeams.filter(team => {
        const cls = (classes || []).find(c => c.id === (team.classId || team.ClassId))
        const teamGradeName = cls?.gradeName || cls?.GradeName || ""
        return teamGradeName.toLowerCase() === gradeName.toLowerCase()
      })

      let successCount = 0
      let errorCount = 0

      for (const team of teamsInGrade) {
        try {
          // Delete team members first
          const membersToDelete = (teamMembers || []).filter(tm => tm.teamId === team.id)
          for (const m of membersToDelete) {
            try { 
              await staffAdminService.deleteTeamMember(m.id) 
            } catch (e) { 
              if (isDevelopment() === 'development') {
                console.error('Failed to delete member', e) 
              }
            }
          }
          await staffAdminService.deleteTeam(team.id)
          successCount++
        } catch (err) {
          if (isDevelopment() === 'development') {
            console.error(`Error deleting team ${team.id}:`, err)
          }
          errorCount++
        }
      }

      // Update local state
      setTeams(teams.filter(team => {
        const cls = (classes || []).find(c => c.id === (team.classId || team.ClassId))
        const teamGradeName = cls?.gradeName || cls?.GradeName || ""
        return teamGradeName.toLowerCase() !== gradeName.toLowerCase()
      }))
      
      if (teamMembers && teamMembers.length) {
        setTeamMembers(teamMembers.filter(tm => {
          const team = teams.find(t => t.id === tm.teamId)
          if (!team) return false
          const cls = (classes || []).find(c => c.id === (team.classId || team.ClassId))
          const teamGradeName = cls?.gradeName || cls?.GradeName || ""
          return teamGradeName.toLowerCase() !== gradeName.toLowerCase()
        }))
      }

      if (errorCount === 0) {
        toast.success(`${successCount} team(s) deleted from ${gradeName}`)
      } else {
        toast.error(`${successCount} team(s) deleted from ${gradeName}, ${errorCount} failed`)
      }
    } catch (err) {
      toast.error(`Error deleting teams in grade: ${err.message}`)
    } finally {
      setLoading(false)
      setShowBulkDeleteConfirm(null)
    }
  }

  const handleSaveAccount = async (account) => {
    try {
      setLoading(true)
      if (account.id) {
        // Update existing account
        const updateData = {
          fullNameEn: account.name,
          fullNameAr: account.name,
          email: account.email,
          phone: account.phone || "",
          roleName: normalizeRoleName(account.role)
        }
        
        // Add password only if provided (for password updates)
        if (account.password && account.password.trim() !== "") {
          // Validate password complexity
          const passwordValidation = validatePasswordComplexity(account.password);
          if (!passwordValidation.isValid) {
            toast.error(`Password requirements: ${passwordValidation.errors.join(', ')}`);
            return;
          }
          updateData.password = account.password
        }
        
        // Add classId only if role is Student and classId is provided
        if (account.role === 'Student' && account.classId) {
          updateData.classId = account.classId
        }
        
        if (isDevelopment() === 'development') {
          console.log('StaffAdminPage - Updating account with data');
        }
        
        await staffAdminService.updateAccount(account.id, updateData)
        setAccounts(accounts.map((acc) => (acc.id === account.id ? { ...acc, ...updateData } : acc)))
        toast.success('Account updated successfully')
      } else {
        // Validate password for new accounts
        if (!account.password || account.password.trim() === "") {
          toast.error("Password is required for new accounts");
          return;
        }
        
        const passwordValidation = validatePasswordComplexity(account.password);
        if (!passwordValidation.isValid) {
          toast.error(`Password requirements: ${passwordValidation.errors.join(', ')}`);
          return;
        }
        
        // Create new account using CreateSimple endpoint (same as SuperAdminPage)
        const createData = {
          FullNameEn: account.name,
          FullNameAr: account.name, // Use English name as Arabic if not provided
          Email: account.email,
          Password: account.password,
          Phone: account.phone || "",
          RoleName: normalizeRoleName(account.role) || "Staff Admin"
        }
        
        // Add classId only if role is Student and classId is provided
        if (account.role === 'Student' && account.classId) {
          createData.ClassId = account.classId
        }
        
        const newAccount = await staffAdminService.createSimpleAccount(createData)
        setAccounts([...accounts, newAccount.account])
        toast.success('Account created successfully')
      }
      setEditingAccount(null)
    } catch (err) {
      toast.error(`Error saving account: ${err.message}`)
      if (isDevelopment() === 'development') {
        console.error('Error saving account:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTeam = async (team) => {
    try {
      setLoading(true)
      if (team.id) {
        // Update existing team
        const updateData = {
          TeamName: team.name,
          ClassId: team.classId,
          SupervisorAccountId: null, // Set to null since we're not managing supervisors in this interface
          TeamLeaderAccountId: team.teamLeaderAccountId
        }
        if (isDevelopment() === 'development') {
          console.log('StaffAdminPage - Updating team with data');
        }
        await staffAdminService.updateTeam(team.id, updateData)
        if (isDevelopment() === 'development') {
          console.log('StaffAdminPage - Team update successful, refetching teams...');
        }
        
        // Refetch teams data to get the updated information from the server
        await loadTeams()
        
        toast.success('Team updated successfully')
      } else {
        // Create new team (this would need a create team endpoint)
        setTeams([...teams, { ...team, id: Date.now() }])
        toast.success('Team created successfully')
      }
      setEditingTeam(null)
    } catch (err) {
      toast.error(`Error saving team: ${err.message}`)
      if (isDevelopment() === 'development') {
        console.error('Error saving team:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const openAssignLeaderModal = async (account) => {
    try {
      // Only students can be leaders; must have classId to match team class
      if (account.role !== 'Student' && account.role !== 'student') {
        toast.error('Only Student accounts can be assigned as team leaders')
        return
      }
      if (!account.classId && !account.ClassId) {
        toast.error('Student must have a class assigned before becoming a team leader')
        return
      }
      const classId = account.classId || account.ClassId
      // Filter teams to those in the same class and without a leader or allow reassignment
      const teamsInClass = (teams || []).filter(t => (t.classId === classId || t.ClassId === classId))
      setAvailableTeamsByClass(teamsInClass)
      setAssignLeaderFor(account)
    } catch (err) {
      toast.error('Failed to open assign leader dialog')
      if (isDevelopment() === 'development') {
        console.error(err)
      }
    }
  }

  const assignLeaderToTeam = async (teamId) => {
    try {
      if (!assignLeaderFor) return
      setLoading(true)
      await staffAdminService.assignTeamLeader(teamId, assignLeaderFor.id)
      // update local teams state
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, teamLeaderAccountId: assignLeaderFor.id, teamLeaderName: assignLeaderFor.name || assignLeaderFor.fullNameEn || assignLeaderFor.email } : t))
      toast.success('Team leader assigned successfully')
      setAssignLeaderFor(null)
    } catch (err) {
      toast.error(`Failed to assign leader: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Show permission denied if user doesn't have access
  if (userRole && userRole !== 'StaffAdmin' && userRole !== 'Super Admin') {
    return (
      <div className="staff-admin-page">
        <div className="header">
          <h1 className="page-title">Access Denied</h1>
          <p className="page-subtitle">You do not have permission to access this page</p>
        </div>
        <div className="error-message" style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '20px', 
          margin: '20px 0', 
          borderRadius: '4px',
          border: '1px solid #ffcdd2',
          textAlign: 'center'
        }}>
          Only Staff Admin and Super Admin can access this page.
        </div>
      </div>
    )
  }

  return (
    <div className="staff-admin-page">
      <div className="header">
        <h1 className="page-title">Staff Admin Dashboard</h1>
      
      </div>


      {loading && (
        <div className="page-loading">
          <LoadingSpinner />
        </div>
      )}

      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeSection === "accounts" ? "active" : ""}`}
          onClick={() => setActiveSection("accounts")}
        >
          Account Management
        </button>
        <button
          className={`nav-tab ${activeSection === "teams" ? "active" : ""}`}
          onClick={() => setActiveSection("teams")}
        >
          Team Management
        </button>
      </div>

      <div className="filters-section">
        <div className="filters">
          {activeSection === "teams" && (
            <select value={teamGradeFilter} onChange={(e) => setTeamGradeFilter(e.target.value)} className="filter-select">
              <option value="">All Grades</option>
              {Array.from(new Set((classes || []).map(c => c.gradeName || c.GradeName).filter(Boolean))).map(gn => (
                <option key={gn} value={gn}>{gn}</option>
              ))}
            </select>
          )}
          {activeSection === "accounts" && (
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
              <option value="">All Roles</option>
              {roles && roles.length > 0 && roles.map((role) => (
                <option key={role.id} value={role.roleName}>
                  {role.roleName}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder={`Search ${activeSection}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Bulk Actions */}
        <div className="bulk-actions">
          {activeSection === "accounts" && selectedAccounts.size > 0 && (
            <button 
              className="bulk-delete-btn"
              onClick={() => setShowBulkDeleteConfirm({ 
                type: "accounts", 
                count: selectedAccounts.size,
                action: handleBulkDeleteAccounts 
              })}
            >
              Delete Selected ({selectedAccounts.size})
            </button>
          )}
          {activeSection === "teams" && selectedTeams.size > 0 && (
            <button 
              className="bulk-delete-btn"
              onClick={() => setShowBulkDeleteConfirm({ 
                type: "teams", 
                count: selectedTeams.size,
                action: handleBulkDeleteTeams 
              })}
            >
              Delete Selected ({selectedTeams.size})
            </button>
          )}
          {activeSection === "teams" && teamGradeFilter && (
            <button 
              className="bulk-delete-grade-btn"
              onClick={() => setShowBulkDeleteConfirm({ 
                type: "teamsInGrade", 
                grade: teamGradeFilter,
                count: filteredTeams.length,
                action: () => handleDeleteAllTeamsInGrade(teamGradeFilter)
              })}
            >
              Delete All in {teamGradeFilter} ({filteredTeams.length})
            </button>
          )}
        </div>
      </div>

      <div className="content-area">
        {activeSection === "accounts" ? (
          <div className="accounts-section">
            {/* Select All Checkbox */}
            {filteredAccounts.filter(acc => acc.id !== currentUserId).length > 0 && (
              <div className="select-all-container">
                <label className="select-all-label">
                  <input
                    ref={selectAllAccountsRef}
                    type="checkbox"
                    checked={(() => {
                      const selectable = filteredAccounts.filter(acc => acc.id !== currentUserId)
                      if (selectable.length === 0) return false
                      return selectable.every(acc => selectedAccounts.has(acc.id))
                    })()}
                    onChange={() => {
                      const selectable = filteredAccounts.filter(acc => acc.id !== currentUserId)
                      const isAllSelected = selectable.length > 0 && selectable.every(acc => selectedAccounts.has(acc.id))
                      if (isAllSelected) {
                        const newSet = new Set(selectedAccounts)
                        selectable.forEach(acc => newSet.delete(acc.id))
                        setSelectedAccounts(newSet)
                      } else {
                        const newSet = new Set(selectedAccounts)
                        selectable.forEach(acc => newSet.add(acc.id))
                        setSelectedAccounts(newSet)
                      }
                    }}
                    className="select-all-checkbox"
                  />
                  {(() => {
                    const selectableCount = filteredAccounts.filter(acc => acc.id !== currentUserId).length
                    return `Select All (${selectableCount})`
                  })()}
                </label>
              </div>
            )}
            
            <div className="items-grid">
              {filteredAccounts.map((account) => (
                <div key={account.id} className="item-card">
                  <div className="item-header">
                    <div className="item-checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.has(account.id)}
                        onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                        className="item-checkbox"
                        disabled={account.id === currentUserId}
                        title={account.id === currentUserId ? "You cannot delete your own account" : ""}
                      />
                    </div>
                    <div className="item-title-container">
                      <h3 className="item-title">
                        {account.fullNameEn}
                        {account.id === currentUserId && <span className="current-user-badge">(You)</span>}
                      </h3>
                      <span className="item-role">{account.roleName}</span>
                    </div>
                  </div>
                  <div className="item-details">
                    <p>
                      <strong>Email:</strong> {account.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {account.phone || "N/A"} | <strong>Status:</strong> {account.statusName}
                    </p>
                    {account.roleName === 'Student' && account.className && (
                      <p>
                        <strong>Class:</strong> {account.className} {account.gradeName ? `(${account.gradeName})` : ''}
                      </p>
                    )}
                    {account.roleName === 'Student' && !account.className && (
                      <p>
                        <strong>Class:</strong> <em>Not assigned</em>
                      </p>
                    )}
                  </div>
                  <div className="item-actions">
                    <button className="edit-btn" onClick={() => {
                      // Ensure the role value exactly matches one of the dropdown option values
                      const targetKey = normalizeForCompare(account.roleName || "");
                      const matched = (roles || []).find(r => normalizeForCompare((r.roleName || r.RoleName || "")) === targetKey);
                      const roleValue = matched ? (matched.roleName || matched.RoleName) : (account.roleName || "");
                      setEditingAccount({
                        id: account.id,
                        name: account.fullNameEn,
                        email: account.email,
                        phone: account.phone,
                        role: roleValue,
                        classId: account.classId || null
                      })
                    }}>
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => setShowDeleteConfirm({ type: "account", id: account.id })}
                      disabled={account.id === currentUserId}
                      title={account.id === currentUserId ? "You cannot delete your own account" : ""}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="teams-section">
            {/* Select All Checkbox */}
            {filteredTeams.length > 0 && (
              <div className="select-all-container">
                <label className="select-all-label">
                  <input
                    type="checkbox"
                    checked={selectedTeams.size === filteredTeams.length && filteredTeams.length > 0}
                    onChange={(e) => handleSelectAllTeams(e.target.checked)}
                    className="select-all-checkbox"
                  />
                  Select All ({filteredTeams.length})
                </label>
              </div>
            )}
            
            <div className="items-grid">
              {filteredTeams.map((team) => (
                <div key={team.id} className="item-card">
                  <div className="item-header">
                    <div className="item-checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedTeams.has(team.id)}
                        onChange={(e) => handleSelectTeam(team.id, e.target.checked)}
                        className="item-checkbox"
                      />
                    </div>
                    <div className="item-title-container">
                      <h3 className="item-title">{team.teamName}</h3>
                      <span className="item-role">Team</span>
                    </div>
                  </div>
                  <div className="item-details">
                    <p>
                      <strong>Class:</strong> {team.className || "Not assigned"}
                    </p>
                    <p>
                      <strong>Team Leader:</strong> {team.teamLeaderName || "Not assigned"}
                    </p>
                    {/* Supervisor removed as requested */}
                  </div>
                  <div className="item-actions">
                    <button className="edit-btn" onClick={() => setEditingTeam({
                      id: team.id,
                      name: team.teamName,
                      classId: team.classId,
                      teamLeaderAccountId: team.teamLeaderAccountId
                    })}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => setShowDeleteConfirm({ type: "team", id: team.id })}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editingAccount && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingAccount.id ? "Edit Account" : "Add Account"}</h2>
              <button className="modal-close" onClick={() => setEditingAccount(null)}>
                ×
              </button>
            </div>
            <div className="modal-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingAccount.email}
                  onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Password {editingAccount.id ? "(Leave empty to keep current password)" : ""}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={editingAccount.password || ""}
                    onChange={(e) => setEditingAccount({ ...editingAccount, password: e.target.value })}
                    className="form-input"
                    placeholder={editingAccount.id ? "Enter new password (optional)" : "Enter password for new account"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {editingAccount.password && (
                  <PasswordStrengthIndicator 
                    password={editingAccount.password} 
                    showRequirements={true}
                  />
                )}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={editingAccount.phone || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, phone: e.target.value })}
                  className="form-input"
                  placeholder="Optional phone number"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editingAccount.role}
                  onChange={(e) => setEditingAccount({ ...editingAccount, role: e.target.value, classId: e.target.value === 'Student' ? editingAccount.classId : null })}
                  className="form-input"
                >
                  <option value="">Select Role</option>
                  {roles && roles.length > 0 && roles.map((role) => (
                    <option key={role.id} value={role.roleName}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>
              {/* Show class dropdown only when Student role is selected */}
              {editingAccount.role === 'Student' && (
                <div className="form-group">
                  <label>Class</label>
                  <select
                    value={editingAccount.classId || ""}
                    onChange={(e) => setEditingAccount({ ...editingAccount, classId: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Class</option>
                    {classes && classes.length > 0 && classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} {cls.gradeName ? `(${cls.gradeName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setEditingAccount(null)}>
                  Cancel
                </button>
                <button className="save-btn" onClick={() => handleSaveAccount(editingAccount)}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTeam && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTeam.id ? "Edit Team" : "Add Team"}</h2>
              <button className="modal-close" onClick={() => setEditingTeam(null)}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Team Name</label>
                <input
                  type="text"
                  value={editingTeam.name || ""}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Class</label>
                <select
                  value={editingTeam.classId || ""}
                  onChange={(e) => setEditingTeam({ ...editingTeam, classId: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select Class</option>
                  {classes && classes.length > 0 && classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} {cls.gradeName ? `(${cls.gradeName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Team Leader (team members)</label>
                <select
                  value={editingTeam.teamLeaderAccountId || ""}
                  onChange={(e) => setEditingTeam({ ...editingTeam, teamLeaderAccountId: e.target.value ? parseInt(e.target.value) : null })}
                  className="form-input"
                >
                  <option value="">Select Leader</option>
                  {teamMembers
                    .filter(tm => tm.teamId === editingTeam.id)
                    .map(tm => (
                      <option key={tm.teamMemberAccountId} value={tm.teamMemberAccountId}>{tm.memberName}</option>
                    ))}
                </select>
              </div>
              {/* Supervisor field removed as requested */}
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setEditingTeam(null)}>
                  Cancel
                </button>
                <button className="save-btn" onClick={() => handleSaveTeam(editingTeam)}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-dialog">
            <div className="delete-confirm-header">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this {showDeleteConfirm.type}?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="delete-confirm-actions">
              <button className="delete-confirm-cancel" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="delete-confirm-delete"
                onClick={() => {
                  if (showDeleteConfirm.type === "account") {
                    handleDeleteAccount(showDeleteConfirm.id)
                  } else {
                    handleDeleteTeam(showDeleteConfirm.id)
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-dialog">
            <div className="delete-confirm-header">
              <h3>Confirm Bulk Delete</h3>
              {showBulkDeleteConfirm.type === "teamsInGrade" ? (
                <p>Are you sure you want to delete all {showBulkDeleteConfirm.count} teams in {showBulkDeleteConfirm.grade}?</p>
              ) : (
                <p>Are you sure you want to delete {showBulkDeleteConfirm.count} selected {showBulkDeleteConfirm.type}?</p>
              )}
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="delete-confirm-actions">
              <button className="delete-confirm-cancel" onClick={() => setShowBulkDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="delete-confirm-delete"
                onClick={showBulkDeleteConfirm.action}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign leader modal removed: leader assignment is now part of Team Management edit */}
    </div>
  )
}

export default StaffAdminPage
