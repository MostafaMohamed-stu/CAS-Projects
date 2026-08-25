import React, { useState, useEffect } from 'react';
import { UserPlus, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Plus, Trash2, Edit } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig.js';
import { isEngineer } from '../../utils/roleUtils';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { axiosInstance } from '../../utils/authService';
import './StepPages.css';

const Step2CreateTeams = ({ onNext, onPrev, currentStep, user }) => {
  const [teams, setTeams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    classId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Step3CreateTeams - Starting to fetch data...');
      console.log('Step3CreateTeams - API_BASE_URL:', API_BASE_URL);
      console.log('Step3CreateTeams - User roleId:', user?.roleId);
      console.log('Step3CreateTeams - User object:', user);
      
      // Check if user is Engineer using the utility function
      const isEngineerUser = isEngineer(user);
      console.log('Step3CreateTeams - isEngineerUser (using utility):', isEngineerUser);
      
      // If user is Engineer, get only their assigned classes
      let classesRes;
      if (isEngineerUser) {
        console.log('Step3CreateTeams - User is Engineer, fetching assigned classes...');
        classesRes = await axiosInstance.get(`/Class/ByEngineer/${user.id}`);
        console.log('Step3CreateTeams - Engineer classes response:', classesRes.data);
      } else {
        console.log('Step3CreateTeams - User is not Engineer, fetching all classes...');
        classesRes = await axiosInstance.get(`/Class`);
        console.log('Step3CreateTeams - All classes response:', classesRes.data);
      }
      
      const teamsRes = await axiosInstance.get(`/Teams`);

      console.log('Step3CreateTeams - Teams response:', teamsRes.data);

      // Handle different response structures
      const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : 
                       (teamsRes.data?.$values ? teamsRes.data.$values : []);
      
      let classesData = [];
      if (isEngineerUser) {
        // For Engineers, use the classes directly from the new endpoint
        classesData = Array.isArray(classesRes.data) ? classesRes.data : 
                     (classesRes.data?.$values ? classesRes.data.$values : []);
        console.log('Step3CreateTeams - Engineer classes (direct from API):', classesData);
      } else {
        // For other roles, use all classes
        classesData = Array.isArray(classesRes.data) ? classesRes.data : 
                     (classesRes.data?.$values ? classesRes.data.$values : []);
      }

      setTeams(teamsData);
      setClasses(classesData);
      
      console.log('Step3CreateTeams - Data set:', {
        teams: teamsData.length,
        classes: classesData.length,
        userRole: user?.roleId,
        isEngineerUser: isEngineerUser,
        classesData: classesData
      });
    } catch (error) {
      console.error('Step3CreateTeams - Error fetching data:', error);
      console.error('Step3CreateTeams - Error response:', error.response?.data);
      console.error('Step3CreateTeams - Error status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.teamName || !newTeam.classId) {
      showWarning('Please fill in team name and select a class');
      return;
    }

    try {
      console.log('Step3CreateTeams - Creating team:', newTeam);
      
      const response = await axiosInstance.post(`/Teams/Create`, {
        teamName: newTeam.teamName,
        classId: parseInt(newTeam.classId)
      });

      console.log('Step3CreateTeams - Team creation response:', response.data);
      showSuccess('Team created successfully!');
      
      setNewTeam({ teamName: '', classId: '' });
      setShowCreateForm(false);
      fetchData(); // Refresh the data to show the new team
    } catch (error) {
      console.error('Step3CreateTeams - Error creating team:', error);
      console.error('Step3CreateTeams - Error response:', error.response?.data);
      showError(`Error creating team: ${error.response?.data?.error || error.message}`);
    }
  };

  const getClassName = (classId) => {
    const classObj = classes.find(c => c.id === classId);
    return classObj ? classObj.className : 'Unknown Class';
  };

  const getGradeName = (classId) => {
    const classObj = classes.find(c => c.id === classId);
    return classObj ? classObj.gradeName : 'Unknown Grade';
  };

  const isStepComplete = teams.length > 0;

  return (
    <div className="step-page step3-create-teams">
      <div className="step-header">
        <div className="step-title">
          <UserPlus className="step-title-icon" />
          <div>
            <h2>Create Teams</h2>
            <p>Create teams and assign them to classes where engineers/reviewers are assigned</p>
            {isEngineer(user) && (
              <p style={{ color: '#f59e0b', fontSize: '0.9em', marginTop: '8px' }}>
                <strong>Note:</strong> As an Engineer, you can only create teams for classes you are assigned to.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="step-content step3-content">
        <div className="create-section step3-create-section">
          <div className="section-header">
            <h3>Create New Team</h3>
            <button 
              className="toggle-form-button"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="button-icon" />
              {showCreateForm ? 'Cancel' : 'Create Team'}
            </button>
          </div>

          {showCreateForm && (
            <div className="create-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Team Name:</label>
                  <input
                    type="text"
                    value={newTeam.teamName}
                    onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                    placeholder="Enter team name..."
                  />
                </div>
                <div className="form-group">
                  <label>Assign to Class:</label>
                  {console.log('Step3CreateTeams - Rendering class dropdown. Classes count:', classes.length)}
                  {console.log('Step3CreateTeams - Classes array:', classes)}
                  <select
                    value={newTeam.classId}
                    onChange={(e) => setNewTeam({ ...newTeam, classId: e.target.value })}
                  >
                    <option value="">Choose a class...</option>
                    {classes.length === 0 ? (
                      <option value="" disabled>No classes available</option>
                    ) : (
                      classes.map((cls, index) => {
                        console.log(`Step3CreateTeams - Rendering class option ${index}:`, cls);
                        return (
                          <option key={cls.Id || cls.id || index} value={cls.Id || cls.id}>
                            {cls.ClassName || cls.className} ({cls.GradeName || cls.gradeName})
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="create-button" onClick={handleCreateTeam}>
                  <Plus className="button-icon" />
                  Create Team
                </button>
                <button 
                  className="cancel-button" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="teams-overview">
          <h3>Existing Teams</h3>
          {loading ? (
            <div className="loading">Loading teams...</div>
          ) : teams.length > 0 ? (
            <div className="teams-grid">
              {teams.map(team => (
                <div key={team.id} className="team-card">
                  <div className="team-header">
                    <h4>{team.teamName}</h4>
                    <div className="team-actions">
                      <button className="edit-button">
                        <Edit className="action-icon" />
                      </button>
                      <button className="remove-button">
                        <Trash2 className="action-icon" />
                      </button>
                    </div>
                  </div>
                  <div className="team-info">
                    <p><strong>Class:</strong> {getClassName(team.classId)}</p>
                    <p><strong>Grade:</strong> {getGradeName(team.classId)}</p>
                    {team.supervisorName && (
                      <p><strong>Supervisor:</strong> {team.supervisorName}</p>
                    )}
                    {team.teamLeaderName && (
                      <p><strong>Team Leader:</strong> {team.teamLeaderName}</p>
                    )}
                  </div>
                  <div className="team-status">
                    <span className="status-badge">
                      {team.teamLeaderName ? 'Complete' : 'Needs Leader'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-teams">
              <AlertCircle className="no-data-icon" />
              <p>No teams found. Create your first team to get started.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Step2CreateTeams;
