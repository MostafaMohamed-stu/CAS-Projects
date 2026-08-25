
import React from "react"
import { useNotification } from "../../contexts/NotificationContext"
import { API_BASE_URL } from '../../config/apiConfig.js';
import { getUserRole, isSuperAdmin, isCapstoneLead } from "../../utils/roleUtils";
import "./Header.css"

const Header = ({ user, studentId, apiBaseUrl = API_BASE_URL }) => {
  // user: The full user object with all user information (passed from Dashboard)
  // studentId: The ID of the currently logged-in user (passed from Dashboard)
  // No more hardcoded default values
  const [userName, setUserName] = React.useState("Student")
  const [loading, setLoading] = React.useState(false)
  const { showError } = useNotification()

  React.useEffect(() => {
    // If we have user data from props, use it directly
    if (user && user.fullNameEn) {
      setUserName(user.fullNameEn.trim())
      return
    }

    // Fallback to API call if no user data provided
    const fetchUserName = async () => {
      if (!studentId) {
        console.warn("No studentId provided to Header component")
        setUserName("Student")
        return
      }

      setLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/Account/${studentId}`, {
          timeout: 5000
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const name = (data?.fullNameEn || data?.fullNameEN)?.trim()
        setUserName(name || "Student")
      } catch (err) {
        console.error("Error fetching user name for studentId:", studentId, err)
        showError(err.message)
        setUserName("Student") // Fallback to default name
      } finally {
        setLoading(false)
      }
    }

    fetchUserName()
  }, [user, studentId, apiBaseUrl])

  // Get user role and format it nicely
  const userRole = user ? getUserRole(user) : null;
  
  let formattedRole = null;
  if (userRole) {
    // Check if role is Super Admin or SuperAdmin and replace with Capstone Lead
    const normalizedRole = userRole.toLowerCase().trim();
    if (normalizedRole === 'superadmin' || normalizedRole === 'super admin') {
      formattedRole = 'Super Admin';
    } else if (normalizedRole === 'capstonelead' || normalizedRole === 'capstone lead') {
      formattedRole = 'Capstone Lead';
    } else {
      formattedRole = userRole
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
    }
  }

  return (
    <header className="header" role="banner">
      <div className="greeting">
        <span className="greeting-text" aria-label="Greeting">
          Hi,
        </span>
        <span className="greeting-name" aria-label={`Welcome ${userName}`}>
          {loading ? "Loading..." : userName}
          {formattedRole && (
            <span className="greeting-role">, {formattedRole}</span>
          )}
        </span>


      </div>
    </header>
  )
}

export default React.memo(Header)

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded IDs or fallback values

