import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, UserPlus, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig.js';
import { isEngineer } from '../../utils/roleUtils';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { axiosInstance } from '../../utils/authService';
import './StepPages.css';

const Step4AddMembers = ({ onNext, onPrev, currentStep, user }) => {
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentRoles, setStudentRoles] = useState({}); // Map of studentId -> role
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Step5AddMembers - Starting to fetch data...');
      console.log('Step5AddMembers - User object:', user);
      
      // Check if user is Engineer
      const isEngineerUser = isEngineer(user);
      console.log('Step5AddMembers - isEngineerUser:', isEngineerUser);
      
      // Fetch teams based on user role
      let teamsRes;
      if (isEngineerUser) {
        console.log('Step5AddMembers - User is Engineer, fetching assigned teams...');
        teamsRes = await axiosInstance.get(`/Teams/ByEngineer/${user.id}`);
        console.log('Step5AddMembers - Engineer teams response:', teamsRes.data);
      } else {
        console.log('Step5AddMembers - User is not Engineer, fetching all teams...');
        teamsRes = await axiosInstance.get(`/Teams`);
        console.log('Step5AddMembers - All teams response:', teamsRes.data);
      }
      
      const [studentsRes, membersRes] = await Promise.all([
        axiosInstance.get(`/StudentExtensions/WithAccountDetails`), // Students with clean structure
        axiosInstance.get(`/TeamMembers`)
      ]);
      
      console.log('Step5AddMembers - StudentExtensions API response:', studentsRes.data);
      console.log('Step5AddMembers - API response status:', studentsRes.status);
      console.log('Step5AddMembers - API response headers:', studentsRes.headers);

      // Handle different response structures
      const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : 
                       (teamsRes.data?.$values ? teamsRes.data.$values : []);
      
      // Process StudentExtensions data - handle both array and object with $values
      const rawStudentsData = studentsRes.data?.$values || studentsRes.data || [];
      console.log('Step5AddMembers - Raw API response:', rawStudentsData);
      console.log('Step5AddMembers - Response type:', typeof rawStudentsData);
      console.log('Step5AddMembers - Is array:', Array.isArray(rawStudentsData));
      console.log('Step5AddMembers - Students count:', rawStudentsData.length);
      
      // Ensure we have an array before mapping
      const studentsArray = Array.isArray(rawStudentsData) ? rawStudentsData : [];
      console.log('Step5AddMembers - Students array:', studentsArray);
      
      // Map the API response to our expected format
      const studentsData = studentsArray.map((student, index) => {
        console.log(`Step5AddMembers - Processing student ${index}:`, student);
        return {
          id: student.id,
          fullNameEn: student.fullNameEn,
          fullNameAr: student.fullNameAr,
          email: student.email,
          classId: student.classId,
          className: student.className,
          gradeId: student.gradeId,
          gradeName: student.gradeName,
          isLeader: student.isLeader,
          statusId: student.statusId
        };
      });
      
      console.log('Step5AddMembers - Processed students data:', studentsData);
      
      const membersData = Array.isArray(membersRes.data) ? membersRes.data : 
                         (membersRes.data?.$values ? membersRes.data.$values : []);

      setTeams(teamsData);
      setStudents(studentsData);
      setTeamMembers(membersData);
      
      console.log('Step5AddMembers - Data set:', {
        teams: teamsData.length,
        students: studentsData.length,
        members: membersData.length,
        isEngineerUser: isEngineerUser
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || selectedStudents.length === 0) {
      showWarning('Please select both team and at least one student');
      return;
    }

    // Check if all selected students have roles
    const studentsWithoutRoles = selectedStudents.filter(id => !studentRoles[id] || studentRoles[id].trim() === '');
    if (studentsWithoutRoles.length > 0) {
      const studentNames = studentsWithoutRoles.map(id => getStudentName(id)).join(', ');
      showWarning(`Please enter a role for: ${studentNames}`);
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Add each selected student as a team member with their individual role
      for (const studentId of selectedStudents) {
        try {
          const role = studentRoles[studentId] || 'Team Member';
          console.log('Step5AddMembers - Adding team member:', {
            teamId: selectedTeam,
            teamMemberAccountId: studentId,
            teamMemberDescription: role
          });

          const response = await axiosInstance.post(`/TeamMembers`, {
            teamId: parseInt(selectedTeam),
            teamMemberAccountId: parseInt(studentId),
            teamMemberDescription: role,
            statusId: 1 // Active status
          });

          if (response.status === 200 || response.status === 201) {
            successCount++;
          }
        } catch (error) {
          errorCount++;
          const studentName = getStudentName(studentId);
          errors.push(`${studentName}: ${error.response?.data?.message || error.message}`);
          console.error(`Error adding team member ${studentId}:`, error);
        }
      }

      // Refresh the data
      await fetchData();
      
      // Reset form
      setSelectedTeam('');
      setSelectedStudents([]);
      setStudentRoles({});

      // Show results
      if (successCount > 0 && errorCount === 0) {
        showSuccess(`Successfully added ${successCount} team member(s)!`);
      } else if (successCount > 0 && errorCount > 0) {
        showWarning(`Added ${successCount} member(s), but ${errorCount} failed. ${errors.join('; ')}`);
      } else {
        showError(`Failed to add members. ${errors.join('; ')}`);
      }
    } catch (error) {
      console.error('Error adding team members:', error);
      showError('Error adding team members: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Remove Team Member',
      message: 'Are you sure you want to remove this team member? This action cannot be undone.',
      onConfirm: () => confirmRemoveMember(memberId),
      type: 'danger'
    });
  };

  const confirmRemoveMember = async (memberId) => {
    try {
      setLoading(true);
      console.log('Step5AddMembers - Removing team member:', memberId);

      const response = await axiosInstance.delete(`/TeamMembers/${memberId}`);

      console.log('Step5AddMembers - Remove member response:', response);

      if (response.status === 200 || response.status === 204) {
        // Refresh the data
        await fetchData();
        showSuccess('Team member removed successfully!');
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      console.error('Error response:', error.response?.data);
      showError('Error removing team member: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setConfirmationDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'warning'
      });
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

  const getMembersForTeam = (teamId) => {
    return teamMembers.filter(member => member.teamId === teamId);
  };

  const getAvailableStudents = () => {
    // Get students who are not already team members
    const assignedStudentIds = teamMembers.map(member => member.teamMemberAccountId);
    
    // Filter by grade name (general grade like "Senior") if a team is selected
    let filteredStudents = students;
    if (selectedTeam) {
      const selectedTeamData = teams.find(team => team.id === parseInt(selectedTeam) || team.id === selectedTeam);
      if (selectedTeamData && selectedTeamData.gradeName) {
        // Extract the general grade name (e.g., "Senior" from "S2" or "Senior")
        const teamGradeName = selectedTeamData.gradeName.trim();
        
        // Normalize grade name - if it's something like "S2", "S1", etc., look for "Senior"
        // Otherwise, use the grade name as-is
        let targetGradeName = teamGradeName;
        
        // If grade name starts with "S" and is a number (like S1, S2, S3), use "Senior"
        if (/^S\d+$/i.test(teamGradeName)) {
          targetGradeName = "Senior";
        }
        // If grade name contains "Senior" or "senior", use "Senior"
        else if (teamGradeName.toLowerCase().includes("senior")) {
          targetGradeName = "Senior";
        }
        
        // Filter students by grade name (case-insensitive)
        filteredStudents = students.filter(student => {
          if (!student.gradeName) return false;
          const studentGradeName = student.gradeName.trim();
          
          // Check if student's grade name matches the target grade name
          if (studentGradeName.toLowerCase() === targetGradeName.toLowerCase()) {
            return true;
          }
          
          // Also check if student's grade name contains the target (for variations)
          if (targetGradeName.toLowerCase() === "senior") {
            return studentGradeName.toLowerCase().includes("senior") || 
                   /^S\d+$/i.test(studentGradeName);
          }
          
          return false;
        });
        
        console.log('Step5AddMembers - Filtering students by grade name:', targetGradeName, '(from team grade:', teamGradeName, ')');
        console.log('Step5AddMembers - Students in same grade:', filteredStudents.length);
      } else if (selectedTeamData && selectedTeamData.classId) {
        // Fallback to class ID if grade name is not available
        filteredStudents = students.filter(student => student.classId === selectedTeamData.classId);
        console.log('Step5AddMembers - Filtering students by class ID (fallback):', selectedTeamData.classId);
        console.log('Step5AddMembers - Students in same class:', filteredStudents.length);
      }
    }
    
    const availableStudents = filteredStudents.filter(student => {
      const isAssigned = assignedStudentIds.includes(student.id);
      console.log(`Step5AddMembers - Student ${student.fullNameEn} (ID: ${student.id}) - Assigned: ${isAssigned}`);
      return !isAssigned;
    });
    console.log('Step5AddMembers - Available students count:', availableStudents.length);
    console.log('Step5AddMembers - Available students:', availableStudents);
    console.log('Step5AddMembers - Assigned student IDs:', assignedStudentIds);
    console.log('Step5AddMembers - All students count:', students.length);
    console.log('Step5AddMembers - All students:', students);
    return availableStudents;
  };

  const getFilteredStudents = () => {
    const available = getAvailableStudents();
    if (!searchQuery.trim()) {
      return available;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return available.filter(student => {
      const nameEn = (student.fullNameEn || '').toLowerCase();
      const nameAr = (student.fullNameAr || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      return nameEn.includes(query) || nameAr.includes(query) || email.includes(query);
    });
  };

  const teamsWithMembers = teams.filter(team => getMembersForTeam(team.id).length > 0);
  const teamsWithoutMembers = teams.filter(team => getMembersForTeam(team.id).length === 0);

  const isStepComplete = teamsWithMembers.length > 0;

  return (
    <div className="step-page step5-add-members">
      <div className="step-header">
        <div className="step-title">
          <Users className="step-title-icon" />
          <div>
            <h2>Add Team Members</h2>
            <p>Add students as team members to their respective teams</p>
            {isEngineer(user) && (
              <p style={{ color: '#f59e0b', fontSize: '0.9em', marginTop: '8px' }}>
                <strong>Note:</strong> As an Engineer, you can only add members to teams from your assigned classes.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="step-content step5-content">
        <div className="add-member-section step5-add-member-section">
          <h3>Add Team Member</h3>
          <div className="add-member-form">
            <div className="form-row">
              <div className="form-group">
                <label style={{ 
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: 12,
                  color: '#1f2937',
                  fontSize: '0.95rem'
                }}>
                  Select Team:
                </label>
                <select 
                  value={selectedTeam} 
                  onChange={(e) => {
                    setSelectedTeam(e.target.value);
                    setSelectedStudents([]); // Clear selected students when team changes
                    setSearchQuery(''); // Clear search when team changes
                    setStudentRoles({}); // Clear roles when team changes
                  }}
                >
                  <option value="">Choose a team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.teamName} - {team.className}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ 
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: 12,
                  color: '#1f2937',
                  fontSize: '0.95rem'
                }}>
                  Select Students (multiple selection):
                </label>
                <div className="students-checkbox-list">
                  {getAvailableStudents().length > 0 ? (
                    <>
                      <div className="select-all-controls">
                        <button
                          type="button"
                          className="select-all-button-small"
                          onClick={() => {
                            const filtered = getFilteredStudents();
                            const filteredIds = filtered.map(s => s.id);
                            const allFilteredSelected = filteredIds.every(id => selectedStudents.includes(id));
                            
                            if (allFilteredSelected) {
                              // Deselect all filtered students
                              setSelectedStudents(selectedStudents.filter(id => !filteredIds.includes(id)));
                            } else {
                              // Select all filtered students
                              const newSelected = [...new Set([...selectedStudents, ...filteredIds])];
                              setSelectedStudents(newSelected);
                            }
                          }}
                        >
                          {(() => {
                            const filtered = getFilteredStudents();
                            const filteredIds = filtered.map(s => s.id);
                            const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedStudents.includes(id));
                            return allFilteredSelected ? 'Deselect Filtered' : 'Select Filtered';
                          })()}
                        </button>
                        <span>
                          {selectedStudents.length} of {getAvailableStudents().length} selected
                          {searchQuery && ` (${getFilteredStudents().length} shown)`}
                        </span>
                      </div>
                      <div className="student-search-container">
                        <input
                          type="text"
                          placeholder="Search students by name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="student-search-input"
                        />
                      </div>
                      <div className="students-checkbox-container">
                        {getFilteredStudents().length > 0 ? (
                          getFilteredStudents().map((student, index) => {
                            const isSelected = selectedStudents.includes(student.id);
                            const displayName = student.fullNameEn || 'Unknown Name';
                            const displayEmail = student.email || 'No Email';
                            const studentRole = studentRoles[student.id] || '';
                            return (
                              <div 
                                key={student.id || `student-${index}`} 
                                className="student-checkbox-item-wrapper"
                                style={{
                                  marginBottom: '8px'
                                }}
                              >
                                <label 
                                  className="student-checkbox-item"
                                  style={{
                                    marginBottom: isSelected ? '8px' : '0'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStudents([...selectedStudents, student.id]);
                                      } else {
                                        setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                        // Remove role when deselected
                                        const newRoles = { ...studentRoles };
                                        delete newRoles[student.id];
                                        setStudentRoles(newRoles);
                                      }
                                    }}
                                  />
                                  <span>
                                    <strong>{displayName}</strong>
                                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{displayEmail}</span>
                                  </span>
                                </label>
                                {isSelected && (
                                  <div className="student-role-input-container">
                                    <input
                                      type="text"
                                      placeholder="Enter role (e.g., Developer, Designer...)"
                                      value={studentRole}
                                      onChange={(e) => {
                                        setStudentRoles({
                                          ...studentRoles,
                                          [student.id]: e.target.value
                                        });
                                      }}
                                      className="student-role-input"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '30px 20px',
                            color: '#9ca3af'
                          }}>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>
                              {searchQuery ? 'No students found matching your search' : 'No available students'}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px 20px',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      border: '2px dashed #d1d5db'
                    }}>
                      <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.95rem', margin: 0 }}>
                        No available students
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button 
              className="add-button"
              onClick={handleAddMember}
              disabled={!selectedTeam || selectedStudents.length === 0 || loading}
            >
              <UserPlus className="button-icon" />
              {loading ? 'Adding...' : `Add ${selectedStudents.length} Member(s)`}
            </button>
          </div>
        </div>

        <div className="teams-members-overview">
          <div className="teams-with-members">
            <h3 style={{ marginTop: '30px' }}>Teams with Members</h3>
            {teamsWithMembers.length > 0 ? (
              <div className="teams-members-grid">
                {teamsWithMembers.map(team => (
                  <div key={team.id} className="team-members-card">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="member-count" style={{ width: '88px' }}>
                        {getMembersForTeam(team.id).length} member(s)
                      </span>
                    </div>
                    <div className="members-list">
                      {getMembersForTeam(team.id).map((member, index) => (
                        <div key={member.id || `member-${team.id}-${index}`} className="member-item">
                          <div className="member-info">
                            <span className="member-name">{getStudentName(member.teamMemberAccountId)}</span>
                            {member.teamMemberDescription && (
                              <span className="member-description">{member.teamMemberDescription}</span>
                            )}
                          </div>
                          <button 
                            className="remove-member-button"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="remove-icon" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <AlertCircle className="no-data-icon" />
                <p>No teams have members assigned yet.</p>
              </div>
            )}
          </div>

          <div className="teams-without-members">
            <h3 style={{ marginTop: '30px' }}>Teams without Members</h3>
            {teamsWithoutMembers.length > 0 ? (
              <div className="teams-grid">
                {teamsWithoutMembers.map(team => (
                  <div key={team.id} className="team-card needs-members">
                    <div className="team-header">
                      <h4>{team.teamName}</h4>
                      <span className="status-badge warning">Needs Members</span>
                    </div>
                    <div className="team-info">
                      <p><strong>Class:</strong> {team.className}</p>
                      <p><strong>Team Leader:</strong> {team.teamLeaderName || 'Not assigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <CheckCircle className="no-data-icon success" />
                <p>All teams have members assigned!</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={() => setConfirmationDialog({
          isOpen: false,
          title: '',
          message: '',
          onConfirm: null,
          type: 'warning'
        })}
        confirmText="Remove"
        cancelText="Cancel"
        type={confirmationDialog.type}
      />
    </div>
  );
};

export default Step4AddMembers;
