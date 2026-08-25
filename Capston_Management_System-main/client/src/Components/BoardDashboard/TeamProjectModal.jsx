import React, { useState, useEffect, useMemo } from 'react';
import { axiosInstance } from '../../utils/authService';
import { X, Users, User, Building2, FileText, Loader2, UserCheck } from 'lucide-react';
import { showError } from '../../utils/toast';

const TeamProjectModal = ({ teamId, engineersByClass = [], onClose }) => {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const teamRes = await axiosInstance.get(`/Teams/${teamId}`);
      const teamData = teamRes.data || {};

      setTeam({
        id: teamData.Id || teamData.id || teamId,
        teamName: teamData.TeamName || teamData.teamName || 'Unknown Team',
        classId: teamData.ClassId || teamData.classId || null,
        className: teamData.ClassName || teamData.className || 'Unknown',
        gradeName: teamData.GradeName || teamData.gradeName || 'Unknown',
        leaderName: teamData.TeamLeaderName || teamData.teamLeaderName || 'No Leader',
        supervisorName: teamData.SupervisorName || teamData.supervisorName || 'No Supervisor'
      });

      // Fetch team members - handle .NET $values wrapper
      const extractArray = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.$values && Array.isArray(data.$values)) return data.$values;
        return [];
      };

      const membersRaw = teamData.TeamMembers || teamData.teamMembers;
      if (membersRaw) {
        const membersData = extractArray(membersRaw);
        if (Array.isArray(membersData) && membersData.length > 0) {
          setMembers(membersData.map(m => ({
            id: m.TeamMemberAccountId || m.teamMemberAccountId || m.Id || m.id,
            name: m.FullNameEn || m.fullNameEn || m.TeamMemberAccount?.FullNameEn || m.teamMemberAccount?.FullNameEn || 'Unknown',
            email: m.Email || m.email || m.TeamMemberAccount?.Email || m.teamMemberAccount?.Email || '',
            isLeader: m.IsLeader || m.isLeader || false
          })));
        }
      }

      // Fetch project
      try {
        const projectRes = await axiosInstance.get(`/Project/ByTeam/${teamId}`);
        const projectData = projectRes.data;
        if (projectData) {
          setProject({
            nameEn: projectData.NameEn || projectData.nameEn || '',
            nameAr: projectData.NameAr || projectData.nameAr || '',
            description: projectData.ProjectDescription || projectData.projectDescription || '',
            additionalInformation: projectData.AdditionalInformation || projectData.additionalInformation || ''
          });
        }
      } catch (error) {
        console.log('No project found for this team');
      }

    } catch (error) {
      console.error('Error fetching team data:', error);
      showError(`Error loading team profile: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get engineers for this team's class
  const teamEngineers = useMemo(() => {
    if (!team || (!team.className && !team.classId)) return [];
    
    // Find engineers assigned to this class
    const classEngineers = engineersByClass.find(ec => {
      // Match by classId if both are available
      if (team.classId && ec.classId) {
        return ec.classId === team.classId;
      }
      // Fallback to className match
      if (team.className && ec.className) {
        return ec.className === team.className;
      }
      return false;
    });
    
    return classEngineers?.engineers || [];
  }, [team, engineersByClass]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#e53e3e' }} />
            <p className="text-gray-600">Loading team profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Team Project Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Team Information */}
          <div className="rounded-lg p-6" style={{ background: 'linear-gradient(to right, rgba(229, 62, 62, 0.1), rgba(229, 62, 62, 0.05))' }}>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-8 h-8" style={{ color: '#e53e3e' }} />
              <h3 className="text-2xl font-bold text-gray-900">{team?.teamName}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Grade</p>
                <p className="font-semibold text-gray-900">{team?.gradeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class</p>
                <p className="font-semibold text-gray-900">{team?.className}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Team Leader</p>
                <p className="font-semibold text-gray-900">{team?.leaderName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Engineers (Class)</p>
                <p className="font-semibold text-gray-900">
                  {teamEngineers.length > 0 ? `${teamEngineers.length} Engineer${teamEngineers.length !== 1 ? 's' : ''}` : 'None'}
                </p>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#e53e3e' }} />
              Team Members ({members.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((member) => (
                <div
                  key={member.id}
                    className={`p-4 rounded-lg border ${
                    member.isLeader
                      ? 'border-gray-200'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                    style={member.isLeader ? { 
                      borderColor: '#e53e3e', 
                      backgroundColor: 'rgba(229, 62, 62, 0.1)' 
                    } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        {member.name}
                        {member.isLeader && (
                          <span className="text-xs text-white px-2 py-1 rounded" style={{ backgroundColor: '#e53e3e' }}>Leader</span>
                        )}
                      </p>
                      {member.email && (
                        <p className="text-sm text-gray-600 mt-1">{member.email}</p>
                      )}
                    </div>
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Information */}
          {project ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: '#e53e3e' }} />
                Project Information
              </h4>
              <div className="space-y-6">
                {/* Project Name (English) */}
                {project.nameEn && (
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Project Name</p>
                    <p className="text-xl font-bold text-gray-900">{project.nameEn}</p>
                  </div>
                )}

                {/* Description */}
                {project.description && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{project.description}</p>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                {project.additionalInformation && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Additional Information</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{project.additionalInformation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No project information available for this team</p>
            </div>
          )}

          {/* Engineers (Class) Details */}
          {teamEngineers.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5" style={{ color: '#e53e3e' }} />
                Engineers Assigned
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamEngineers.map((engineer, idx) => (
                  <div
                    key={engineer.id || idx}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'rgba(229, 62, 62, 0.3)', backgroundColor: 'rgba(229, 62, 62, 0.05)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{engineer.name}</p>
                      </div>
                      <UserCheck className="w-5 h-5" style={{ color: 'rgba(229, 62, 62, 0.6)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamProjectModal;

