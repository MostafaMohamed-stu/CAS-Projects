
import React, { useState, useEffect, useCallback, useRef } from "react"
import { useNotification } from "../../contexts/NotificationContext"
import { API_BASE_URL, isDevelopment } from '../../config/apiConfig.js';
import { axiosInstance } from '../../utils/authService';
import "./BottomSection.css"

const BottomSection = ({ currentStudentId = null, user = null }) => {
  const [teamMembers, setTeamMembers] = useState([])
  const [reviewers, setReviewers] = useState([])
  const [capstoneSupervisor, setCapstoneSupervisor] = useState(null)
  const [teamClassInfo, setTeamClassInfo] = useState({ id: null, name: null })
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [hasTeam, setHasTeam] = useState(true)
  const { showError } = useNotification()

  // Use the passed currentStudentId or fall back to user.id
  const effectiveStudentId = currentStudentId || user?.id
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000

  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)
  const sectionRef = useRef(null)

  // Intersection Observer for entrance animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Helper functions
  const extractArrayFromResponse = useCallback((data, fallbackKeys = []) => {
    if (isDevelopment() === 'development') {
      console.log("Extracting array from response data");
    }
    
    if (Array.isArray(data)) {
      return data
    }

    for (const key of ["$values", "teamMembers", "data", ...fallbackKeys]) {
      if (data?.[key] && Array.isArray(data[key])) {
        return data[key]
      }
    }

    return []
  }, [])

  const extractReviewersFromResponse = useCallback((reviewersData) => {
    if (isDevelopment() === 'development') {
      console.log("Extracting reviewers from response data");
    }
    
    if (Array.isArray(reviewersData)) {
      return reviewersData
    }

    for (const key of ["$values", "reviewers", "data"]) {
      if (reviewersData?.[key] && Array.isArray(reviewersData[key])) {
        return reviewersData[key]
      }
    }

    return []
  }, [])

  const determineRole = useCallback((reviewer) => {
    const roleMap = {
      1: "Engineer",
      2: "Engineer", 
      3: "Engineer",
      4: "Engineer",
      5: "Engineer",
      6: "Engineer",
      7: "Engineer",
      8: "Engineer",
      9: "Engineer",
      10: "Engineer"
    }
    const role = roleMap[reviewer.roleId] || "Engineer"
    return role;
  }, [])

  const fetchTeamData = useCallback(
    async (attempt = 0) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      try {
        const axiosConfig = {
          signal: abortControllerRef.current.signal,
          timeout: 15000,
        }

        // Fetch all data in parallel for better performance
        const [teamMemberResponse, teamResponse] = await Promise.all([
          axiosInstance.get(`/TeamMembers`),
          axiosInstance.get(`/Teams`)
        ]);
        
        const allTeamMembers = extractArrayFromResponse(teamMemberResponse.data)

        if (!isMountedRef.current) return

        const currentStudentTeam = allTeamMembers.find((tm) => tm.teamMemberAccountId === effectiveStudentId)

        if (!currentStudentTeam) {
          setHasTeam(false)
          setLoading(false)
          return
        }
        setHasTeam(true)

        const studentTeamMembers = allTeamMembers.filter((tm) => tm.teamId === currentStudentTeam.teamId)
        
        // Handle team data safely
        const teamsData = extractArrayFromResponse(teamResponse.data);
        const team = teamsData.find(t => t.id === currentStudentTeam.teamId)

        // Build member details directly from TeamMembers API to avoid forbidden Account/{id} calls
        const teamMembersWithDetails = studentTeamMembers.map((tm) => ({
          name: tm.memberName || tm.MemberName || "Unknown Member",
          id: tm.teamMemberAccountId || tm.TeamMemberAccountId,
          role: tm.teamMemberDescription || tm.TeamMemberDescription || "Team Member",
          accountId: tm.teamMemberAccountId || tm.TeamMemberAccountId,
          email: tm.memberEmail || tm.MemberEmail || ""
        }))

        if (!isMountedRef.current) return
        setTeamMembers(teamMembersWithDetails)

        // Get class ID for reviewers
        let classId = team?.classId;
        let className = team?.className;
        
        if (isDevelopment() === 'development') {
          console.log("Initial classId from team:", classId);
          console.log("Initial className from team:", className);
        }
        
        // If team doesn't have classId, try to get it from student extension
        if (!classId) {
          try {
            const studentExtResponse = await axiosInstance.get(`/Dashboard/Student/${effectiveStudentId}`);
            if (studentExtResponse.data?.StudentExtension?.ClassId) {
              classId = studentExtResponse.data.StudentExtension.ClassId;
              if (isDevelopment() === 'development') {
                console.log("Got classId from student extension:", classId);
              }
            }
          } catch (extError) {
            if (isDevelopment() === 'development') {
              console.warn("Error fetching student extension:", extError);
            }
          }
        }
        
        if (isDevelopment() === 'development') {
          console.log("Final classId for reviewers:", classId);
          console.log("Final className for reviewers:", className);
        }

        // Note: We don't fetch class details separately since the ClassController doesn't have a GET by ID endpoint
        // We'll use whatever class name we have from the team data
        if (!className && classId) {
          if (isDevelopment() === 'development') {
            console.log(`No className available for classId: ${classId}. The ClassController doesn't have a GET by ID endpoint.`);
          }
        }

        // Set team class info
        setTeamClassInfo({ id: classId, name: className });

        // Fetch engineers (previously reviewers) and supervisors in parallel
        const fetchPromises = [];
        
        if (classId) {
          if (isDevelopment() === 'development') {
            console.log(`Fetching reviewers for classId: ${classId}`);
          }
          fetchPromises.push(
            axiosInstance.get(`/Account/Reviewers/ByClass/${classId}`)
              .then(reviewerResponse => {
                if (isDevelopment() === 'development') {
                  console.log("Reviewers API call successful");
                }
                
                const reviewersArray = extractReviewersFromResponse(reviewerResponse.data)
                
                // Check if the data is sample data or real data
                const isSampleData = reviewersArray.some(reviewer => 
                  reviewer.email === "ahmed@example.com" || 
                  reviewer.email === "sarah@example.com"
                );
                
                if (isSampleData) {
                  if (isDevelopment() === 'development') {
                    console.log("API returned sample data - no real reviewers found for this class");
                  }
                  return []; // Return empty array to show "No reviewers found"
                }
                
                // Accept all engineers since they're already filtered by class from the API
                const filteredReviewers = reviewersArray;
                
                const mappedReviewers = filteredReviewers.map((reviewer) => {
                  const mappedReviewer = {
                    name: reviewer.fullNameEn || "Unknown Engineer",
                    role: "Engineer",
                    id: reviewer.accountId || reviewer.id,
                    assignedClassId: classId, // Since API already filtered by class
                  };
                  return mappedReviewer;
                });
                
                return mappedReviewers;
              })
              .catch(error => {
                if (isDevelopment() === 'development') {
                  console.warn("Error fetching reviewers:", error)
                }
                return []
              })
          );
        } else {
          fetchPromises.push(Promise.resolve([]));
        }

        // Fetch capstone supervisors (real accounts only; no fallback)
        fetchPromises.push(
          axiosInstance.get(`/Account/CapstoneSupervisors`)
            .then(supervisorsResponse => {
              const supervisorsArray = extractArrayFromResponse(supervisorsResponse.data);
              
              if (!supervisorsArray || supervisorsArray.length === 0) {
                return [];
              }

              return supervisorsArray.map((supervisor) => ({
                name: supervisor.fullNameEn || supervisor.fullNameAr || supervisor.FullNameEn || supervisor.FullNameAr || "Unknown Supervisor",
                role: "Capstone Supervisor",
                id: supervisor.id || supervisor.accountId || supervisor.Id || supervisor.AccountId,
              }));
            })
            .catch(error => {
              if (isDevelopment() === 'development') {
                console.warn("Error fetching capstone supervisors:", error);
              }
              return [];
            })
        );

        const [reviewersList, supervisorsList] = await Promise.all(fetchPromises);

        if (!isMountedRef.current) return;
        setReviewers(reviewersList);
        setCapstoneSupervisor(supervisorsList);

        setLoading(false)
        setRetryCount(0)
      } catch (error) {
        if (isDevelopment() === 'development') {
          console.error("Error fetching team data:", error)
        }
        
        if (attempt < MAX_RETRIES && isMountedRef.current) {
          if (isDevelopment() === 'development') {
            console.log(`Retrying... Attempt ${attempt + 1}/${MAX_RETRIES}`)
          }
          setRetryCount(attempt + 1)
          
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchTeamData(attempt + 1)
            }
          }, RETRY_DELAY * (attempt + 1))
        } else {
          showError(error.message || "Failed to load team data")
          setLoading(false)
        }
      }
    },
    [effectiveStudentId, API_BASE_URL, extractArrayFromResponse, extractReviewersFromResponse, determineRole]
  )

  useEffect(() => {
    fetchTeamData()
    
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchTeamData])

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    setRetryCount(0)
    fetchTeamData()
  }, [fetchTeamData])

  // Enhanced render functions
  const renderLoadingState = (message) => (
    <div className="loading-container" role="status" aria-label={message}>
      <div className="loading-spinner" aria-hidden="true"></div>
      <div className="loading-text">
        <span className="loading-title">{message}</span>
        <span className="loading-subtitle">Please wait...</span>
      </div>
    </div>
  )

  const renderErrorState = (message) => (
    <div className="error-container" role="alert">
      <div className="error-icon" aria-hidden="true">
        ⚠️
      </div>
      <div className="error-message">{message}</div>
      <button onClick={handleRetry} className="retry-button" aria-label="Retry loading data">
        Try Again
      </button>
      {retryCount > 0 && (
        <span className="retry-indicator" aria-live="polite">
          Retrying... ({retryCount}/{MAX_RETRIES})
        </span>
      )}
    </div>
  )

  const renderNoDataState = (message) => (
    <div className="no-data" role="status" aria-label={message}>
      <div className="no-data-icon" aria-hidden="true">
        📋
      </div>
      <span>{message}</span>
    </div>
  )

  const renderReviewersSection = () => {
    if (isDevelopment() === 'development') {
      console.log("renderReviewersSection - Info:", {
        loading,
        teamClassInfo,
        reviewers,
        reviewersLength: reviewers.length
      });
    }

    if (loading) {
      return renderLoadingState("Loading engineers");
    }

    if (!teamClassInfo.id) {
      return (
        <div className="no-data" role="status" aria-label="No class assigned">
          <div className="no-data-icon" aria-hidden="true">
            🏫
          </div>
          <span>No class assigned to this team</span>
        </div>
      );
    }

    if (reviewers.length === 0) {
      return (
        <div className="no-data" role="status" aria-label="No reviewers for class">
          <div className="no-data-icon" aria-hidden="true">
            👥
          </div>
          <span>No engineers assigned to class: {teamClassInfo.name || `Class ${teamClassInfo.id}`}</span>
        </div>
      );
    }

    // Since API already filtered reviewers by class, we don't need to filter again
    if (isDevelopment() === 'development') {
      console.log("Reviewers are already filtered by class from API");
      console.log("Team class info:", teamClassInfo);
      console.log("All available reviewers:", reviewers);
    }
    
    const assignedReviewers = reviewers; // No need to filter again
    
    if (isDevelopment() === 'development') {
      console.log("All reviewers are assigned to this class:", assignedReviewers);
      console.log("Reviewers count:", assignedReviewers.length);
    }

    if (assignedReviewers.length === 0) {
      return (
        <div className="no-data" role="status" aria-label="Reviewers not assigned to team class">
          <div className="no-data-icon" aria-hidden="true">
            ⚠️
          </div>
          <span>Engineers are not assigned to class: {teamClassInfo.name || `Class ${teamClassInfo.id}`}</span>
        </div>
      );
    }

    return (
      <>
        {assignedReviewers.map((reviewer, index) => (
          <div
            key={reviewer.id || index}
            className="reviewer"
            role="listitem"
            tabIndex="0"
            aria-label={`Engineer: ${reviewer.name}, Role: ${reviewer.role}`}
          >
            <div className="reviewer-avatar" aria-hidden="true">
              {reviewer.name.charAt(0).toUpperCase()}
            </div>
            <div className="reviewer-info">
              <span className="reviewer-name">{reviewer.name}</span>
              <span className="reviewer-role">{reviewer.role}</span>
            </div>
          </div>
        ))}
      </>
    );
  };

  if (!hasTeam) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={`bottom-section ${isVisible ? "visible" : ""}`}
      role="region"
      aria-label="Team information"
    >
      {/* Team Members Card */}
      <article className="section-card " aria-labelledby="team-members-title">
        <h3 id="team-members-title" className="section-title">
          Team Members
        </h3>
        <div className="team-members" role="list" aria-label="Team members list">
          {loading
            ? renderLoadingState("Loading team members")
            : teamMembers.length > 0
                ? teamMembers.map((member, index) => (
                    <div
                      key={member.accountId || index}
                      className="team-member"
                      role="listitem"
                      tabIndex="0"
                      aria-label={`Team member: ${member.name}, ID: ${member.id}, Role: ${member.role}`}
                    >
                      <div className="member-avatar" aria-hidden="true">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-info">
                        <span className="member-name">{member.name}</span>
                        <span className="member-role">{member.role}</span>
                      </div>
                    </div>
                  ))
                : renderNoDataState("No team members found")}
        </div>
      </article>

      {/* Engineers Card */}
      <article className="section-card reviewers-card" aria-labelledby="reviewers-title">
        <h3 id="reviewers-title" className="section-title">
          Engineers
        </h3>
        <div className="reviewers" role="list" aria-label="Reviewers list">
          {renderReviewersSection()}
        </div>
      </article>

      {/* Capstone Supervisor Card */}
      <article className="section-card supervisor-card" aria-labelledby="supervisor-title">
        <h3 id="supervisor-title" className="section-title">
          Capstone Supervisor
        </h3>
        <div className="supervisor-container">
          {loading ? (
            renderLoadingState("Loading supervisor")
          ) : capstoneSupervisor && capstoneSupervisor.length > 0 ? (
            capstoneSupervisor.map((supervisor, index) => (
              <div
                key={supervisor.id || index}
                className="supervisor"
                tabIndex="0"
                aria-label={`Supervisor: ${supervisor.name}, Role: ${supervisor.role}`}
              >
                <div className="supervisor-avatar" aria-hidden="true">
                  {supervisor.name.charAt(0).toUpperCase()}
                </div>
                <div className="supervisor-info">
                  <span className="supervisor-name">{supervisor.name}</span>
                  <span className="supervisor-role">{supervisor.role}</span>
                  
                </div>
              </div>
            ))
          ) : (
            renderNoDataState("No supervisor assigned")
          )}
        </div>
      </article>
    </section>
  )
}

export default React.memo(BottomSection)

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentStudentId prop instead
 


