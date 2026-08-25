import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, ArrowRight, AlertCircle, UserCheck, Users } from 'lucide-react';
import { authService } from '../../utils/authService';
import { API_BASE_URL } from '../../config/apiConfig';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { axiosInstance } from '../../utils/authService';
import './StepPages.css';

const Step4AssignLeaders = ({ onNext, onPrev, currentStep, user }) => {
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');

  console.log('Step4AssignLeaders: Component rendered');
  console.log('Step4AssignLeaders: Current props:', { onNext, onPrev, currentStep });

  useEffect(() => {
    console.log('Step4AssignLeaders: useEffect triggered - calling fetchData');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Step4AssignLeaders: Starting to fetch data...');
      console.log('Step4AssignLeaders: User prop:', user);
      
      // Use the user prop passed from parent component
      const userRole = user?.roleName || user?.role || '';
      const userId = user?.id;
      
      console.log('Step4AssignLeaders: User role:', userRole);
      console.log('Step4AssignLeaders: User ID:', userId);
      
      let teamsEndpoint = `${API_BASE_URL}/Teams`;
      
      // If user is Engineer, get only their teams (same as previous page)
      if (userRole.toLowerCase() === 'engineer' && userId) {
        teamsEndpoint = `${API_BASE_URL}/Teams/ByEngineer/${userId}`;
        console.log('Step4AssignLeaders: Using engineer-specific teams endpoint:', teamsEndpoint);
      } else {
        console.log('Step4AssignLeaders: Using all teams endpoint (Super Admin or other role)');
      }
      
      console.log('Step4AssignLeaders: Final teams endpoint:', teamsEndpoint);
      console.log('Step4AssignLeaders: About to make API call...');
      
      const teamsRes = await axiosInstance.get(teamsEndpoint.replace(API_BASE_URL, ''));

      console.log('Step4AssignLeaders: Teams response status:', teamsRes.status);
      console.log('Step4AssignLeaders: Teams response data:', teamsRes.data);

      // Handle both direct arrays and objects with $values property
      const teamsData = Array.isArray(teamsRes.data) 
        ? teamsRes.data 
        : (teamsRes.data?.$values || []);

      console.log('Step4AssignLeaders: Processed teams data:', teamsData);
      console.log('Step4AssignLeaders: Teams count:', teamsData.length);

      setTeams(teamsData);
      setStudents([]); // Clear students initially
      setTeamMembers([]); // Clear team members initially
    } catch (error) {
      console.error('Step4AssignLeaders: Error fetching data:', error);
      console.error('Step4AssignLeaders: Error response:', error.response);
      console.error('Step4AssignLeaders: Error message:', error.message);
    } finally {
      setLoading(false);
      console.log('Step4AssignLeaders: fetchData completed, loading set to false');
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      console.log('Step4AssignLeaders: Fetching members for team:', teamId);
      
      const response = await axiosInstance.get(`/TeamMembers`);
      const allTeamMembers = Array.isArray(response.data) ? response.data : (response.data?.$values || []);
      
      console.log('Step4AssignLeaders: All team members from API:', allTeamMembers);
      console.log('Step4AssignLeaders: Looking for team ID:', teamId, 'Type:', typeof teamId);
      
      // Filter members for the selected team (check both case variations)
      const teamMembersData = allTeamMembers.filter(member => {
        const matches = member.teamId === teamId || 
          member.TeamId === teamId ||
          member.teamId === parseInt(teamId) ||
          member.TeamId === parseInt(teamId);
        console.log(`Step4AssignLeaders: Member ${member.teamId || member.TeamId} matches ${teamId}:`, matches);
        return matches;
      });
      
      console.log('Step4AssignLeaders: Team members for team', teamId, ':', teamMembersData);
      
      // The team members data already includes member names and emails from the API
      // No need to fetch student details separately
      const enrichedTeamMembers = teamMembersData.map(member => ({
        ...member,
        memberName: member.MemberName || member.memberName || `Member ${member.teamMemberAccountId || member.TeamMemberAccountId}`,
        memberEmail: member.MemberEmail || member.memberEmail || 'No email',
        teamMemberAccountId: member.teamMemberAccountId || member.TeamMemberAccountId
      }));
      
      console.log('Step4AssignLeaders: Enriched team members:', enrichedTeamMembers);
      setTeamMembers(enrichedTeamMembers);
      
      // Clear selected leader when team changes
      setSelectedLeader('');
    } catch (error) {
      console.error('Step4AssignLeaders: Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  const handleTeamChange = (teamId) => {
    console.log('Step4AssignLeaders: Team changed to:', teamId);
    setSelectedTeam(teamId);
    setSelectedLeader(''); // Clear selected leader
    
    if (teamId) {
      fetchTeamMembers(teamId);
    } else {
      setTeamMembers([]);
    }
  };

  const handleAssignLeader = async () => {
    if (!selectedTeam || !selectedLeader) {
      showWarning('Please select both team and team leader');
      return;
    }

    try {
      setLoading(true);
      console.log('Step4AssignLeaders: Assigning team leader:', {
        teamId: selectedTeam,
        teamLeaderId: selectedLeader
      });

      const response = await axiosInstance.put(`/Teams/${selectedTeam}/AssignLeader`, {
        teamLeaderId: parseInt(selectedLeader)
      });

      console.log('Step4AssignLeaders: Assign leader response:', response);

      if (response.status === 200 || response.status === 204) {
        // Refresh the data
        await fetchData();
        
        // Reset form
        setSelectedTeam('');
        setSelectedLeader('');
        setTeamMembers([]);
        
        showSuccess('Team leader assigned successfully!');
      }
    } catch (error) {
      console.error('Error assigning team leader:', error);
      console.error('Error response:', error.response?.data);
      showError('Error assigning team leader: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.fullNameEn : 'Unknown Student';
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.teamName : 'Unknown Team';
  };

  const getClassName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.className : 'Unknown Class';
  };

  const getStudentsForTeam = (teamId) => {
    // Return team members for the selected team
    return teamMembers.filter(member => member.teamId === teamId);
  };

  console.log('Step4AssignLeaders: About to filter teams. Total teams:', teams.length);
  console.log('Step4AssignLeaders: Sample team structure:', teams[0]);
  
  const teamsWithoutLeaders = teams.filter(team => {
    const hasNoLeader = !team.teamLeaderName || team.teamLeaderName === null || team.teamLeaderName === '';
    console.log(`Step4AssignLeaders: Team ${team.teamName} - teamLeaderName: "${team.teamLeaderName}", hasNoLeader: ${hasNoLeader}`);
    return hasNoLeader;
  });
  
  const teamsWithLeaders = teams.filter(team => {
    const hasLeader = team.teamLeaderName && team.teamLeaderName !== null && team.teamLeaderName !== '';
    return hasLeader;
  });
  
  console.log('Step4AssignLeaders: All teams:', teams);
  console.log('Step4AssignLeaders: Teams without leaders:', teamsWithoutLeaders);
  console.log('Step4AssignLeaders: Teams with leaders:', teamsWithLeaders);

  const isStepComplete = teamsWithLeaders.length > 0;

  return (
    <div className="step-page step4-assign-leaders">
      <div className="step-header">
        <div className="step-title">
          <UserCheck className="step-title-icon" />
          <div>
            <h2>Assign Team Leaders</h2>
            <p>Select and assign team leaders from the student accounts</p>
          </div>
        </div>
      </div>

      <div className="step-content step4-content">
        <div className="assignment-section step4-assignment-section">
          <h3>Assign Team Leader</h3>
          <div className="assignment-form">
            <div className="form-row">
              <div className="form-group">
                <label>Select Team:</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">Choose a team...</option>
                  {(teamsWithoutLeaders.length > 0 ? teamsWithoutLeaders : teams).map(team => (
                    <option key={team.id} value={team.id}>
                      {team.teamName} - {team.className}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Team Leader:</label>
                <select
                  value={selectedLeader}
                  onChange={(e) => setSelectedLeader(e.target.value)}
                  className="form-select"
                  disabled={!selectedTeam || teamMembers.length === 0}
                >
                  <option value="">
                    {!selectedTeam 
                      ? "Select a team first..." 
                      : teamMembers.length === 0 
                        ? "No team members found. Add members first." 
                        : "Choose a team member..."
                    }
                  </option>
                  {selectedTeam && teamMembers.length > 0 && teamMembers.map(member => (
                    <option key={member.teamMemberAccountId} value={member.teamMemberAccountId}>
                      {member.memberName} - {member.memberEmail}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                className="assign-button"
                onClick={handleAssignLeader}
                disabled={!selectedTeam || !selectedLeader || teamMembers.length === 0}
              >
                <UserCheck className="button-icon" />
                Assign Leader
              </button>
            </div>
          </div>
        </div>

        <div className="teams-status">
          <div className="teams-without-leaders">
            <h3>Teams Without Leaders</h3>
            {teamsWithoutLeaders.length > 0 ? (
              <div className="teams-grid">
                {teamsWithoutLeaders.map(team => (
                  <div key={team.id} className="team-card needs-leader">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="status-badge warning">Needs Leader</span>
                    </div>
                    <div className="team-info">
                      <p><strong>Class:</strong> {team.className}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <CheckCircle className="no-data-icon success" />
                <p>All teams have leaders assigned!</p>
              </div>
            )}
          </div>

          <div className="teams-with-leaders">
            <h3>Teams With Leaders</h3>
            {teamsWithLeaders.length > 0 ? (
              <div className="teams-grid">
                {teamsWithLeaders.map(team => (
                  <div key={team.id} className="team-card has-leader">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="status-badge success">Complete</span>
                    </div>
                    <div className="team-info">
                      <p><strong>Class:</strong> {team.className}</p>
                      <p><strong>Team Leader:</strong> {team.teamLeaderName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <AlertCircle className="no-data-icon" />
                <p>No teams have leaders assigned yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Step4AssignLeaders;
