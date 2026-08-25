import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig.js';
import { isEngineer, isBoard } from '../../utils/roleUtils';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { axiosInstance } from '../../utils/authService';
import './StepPages.css';

const Step2AssignEngineers = ({ onNext, onPrev, currentStep, user }) => {
  // Check if user is Engineer - hide this page from engineers (allow Super Admin and Board)
  if (isEngineer(user) && !isBoard(user)) {
    return (
      <div className="step-page">
        <div className="step-header">
          <div className="step-title">
            <Users className="step-title-icon" />
            <div>
              <h2>Access Denied</h2>
              <p>This page is only accessible to Super Administrators and Board members.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [engineers, setEngineers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
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
      console.log('Step2AssignEngineers - Starting to fetch data...');
      
      const [engineersRes, classesRes, assignmentsRes] = await Promise.all([
        axiosInstance.get(`/Account/ByRoleName/Engineer`),
        axiosInstance.get(`/Class`),
        axiosInstance.get(`/Teams/Assignments`)
      ]);

      // Handle different response structures
      const engineersData = Array.isArray(engineersRes.data) ? engineersRes.data : 
                           (engineersRes.data?.$values ? engineersRes.data.$values : []);
      const classesData = Array.isArray(classesRes.data) ? classesRes.data : 
                         (classesRes.data?.$values ? classesRes.data.$values : []);
      const assignmentsData = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : 
                             (assignmentsRes.data?.$values ? assignmentsRes.data.$values : []);

      console.log('Step2AssignEngineers - Engineers data:', engineersData);
      console.log('Step2AssignEngineers - Classes data:', classesData);
      console.log('Step2AssignEngineers - Assignments data:', assignmentsData);
      console.log('Step2AssignEngineers - Engineers count:', engineersData.length);
      console.log('Step2AssignEngineers - Classes count:', classesData.length);
      console.log('Step2AssignEngineers - Assignments count:', assignmentsData.length);

      setEngineers(engineersData);
      setClasses(classesData);
      setAssignments(assignmentsData);
      
    } catch (error) {
      console.error('Step2AssignEngineers - Error fetching data:', error);
      showError(`Error loading data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEngineer = async () => {
    if (!selectedEngineer || !selectedClass) {
      showWarning('Please select both engineer and class');
      return;
    }

    try {
      const response = await axiosInstance.post(`/Account/AssignEngineerToClass`, {
        AccountId: parseInt(selectedEngineer),
        ClassId: parseInt(selectedClass)
      });

      showSuccess('Engineer assigned to class successfully!');
      setSelectedEngineer('');
      setSelectedClass('');
      fetchData();
    } catch (error) {
      console.error('Error assigning engineer:', error);
      showError(`Error assigning engineer to class: ${error.response?.data?.error || error.message}`);
    }
  };


  const getClassName = (classId) => {
    const normalizedClassId = Number(classId);
    const assignment = assignments.find(a => Number(a.assignedClassId) === normalizedClassId);
    if (assignment && assignment.className) {
      return assignment.className;
    }

    const classObj = classes.find(c => Number(c.id) === normalizedClassId);
    return classObj ? classObj.className : 'Unknown Class';
  };

  const getAccountName = (accountId) => {
    const normalizedAccountId = Number(accountId);
    const assignment = assignments.find(a => Number(a.accountId) === normalizedAccountId);
    if (assignment && assignment.accountName) {
      return assignment.accountName;
    }

    const engineer = engineers.find(e => Number(e.id) === normalizedAccountId);
    if (engineer && engineer.fullNameEn) {
      return engineer.fullNameEn;
    }
    return 'Unknown Account';
  };

  const getAccountRole = (accountId) => {
    const normalizedAccountId = Number(accountId);
    const assignment = assignments.find(a => Number(a.accountId) === normalizedAccountId);
    if (assignment) {
      return 'Engineer';
    }
    return 'Unknown';
  };

  const handleRemoveAssignment = async (accountId) => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Remove Assignment',
      message: 'Are you sure you want to remove this assignment? This action cannot be undone.',
      onConfirm: () => confirmRemoveAssignment(accountId),
      type: 'danger'
    });
  };

  const confirmRemoveAssignment = async (accountId) => {
    try {
      const response = await axiosInstance.delete(`/Account/RemoveAssignment/${accountId}`);
      showSuccess('Assignment removed successfully!');
      fetchData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      showError(`Error removing assignment: ${error.response?.data?.error || error.message}`);
    } finally {
      setConfirmationDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'warning'
      });
    }
  };

  const createTestEngineers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/Account/CreateTestEngineers`);
      showSuccess(response.data.message);
      fetchData();
    } catch (error) {
      console.error('Error creating test engineers:', error);
      showError(`Error creating test engineers: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestClasses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/Class/CreateTestData`);
      showSuccess(response.data.message);
      fetchData();
    } catch (error) {
      console.error('Error creating test classes:', error);
      showError(`Error creating test classes: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isStepComplete = assignments.length > 0;

  return (
    <div className="step-page step2-assign-engineers">
      <div className="step-header">
        <div className="step-title">
          <Users className="step-title-icon" />
          <div>
            <h2>Assign Engineers to Classes</h2>
            <p>Assign engineers to specific classes using the ReviewerSupervisorExtension table</p>
          </div>
        </div>
      </div>

      <div className="step-content step2-content">
        <div className="assignment-forms step2-assignment-forms">
          <div className="assignment-form step2-assignment-form">
            <h3>Assign Engineer to Class</h3>
            <div className="form-row step2-form-row">
              <div className="form-group step2-form-group">
                <label>Select Engineer:</label>
                <select 
                  value={selectedEngineer} 
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                >
                  <option value="">Choose an engineer...</option>
                  {(() => {
                    // Show only engineers not assigned to any class
                    const assignedIds = new Set((assignments || []).map(a => Number(a.accountId || a.AccountId)));
                    const unassignedEngineers = (engineers || []).filter(e => !assignedIds.has(Number(e.id || e.Id)));
                    return unassignedEngineers.length > 0 ? (
                      unassignedEngineers.map(engineer => (
                        <option key={engineer.id} value={engineer.id}>
                          {engineer.fullNameEn} - {engineer.email}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>All engineers are assigned</option>
                    );
                  })()}
                </select>
              </div>
              <div className="form-group">
                <label>Select Class:</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Choose a class...</option>
                  {classes.length > 0 ? (
                    classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} ({cls.gradeName})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No classes available</option>
                  )}
                </select>
              </div>
              <button 
                className="assign-button"
                onClick={handleAssignEngineer}
                disabled={!selectedEngineer || !selectedClass}
              >
                <Plus className="button-icon" />
                Assign Engineer
              </button>
            </div>
          </div>

        </div>

        <div className="assignments-overview">
          <div className="assignments-header">
            <h3>Current Assignments</h3>
            <div className="assignments-count">
              <span className="count-badge">{assignments.length}</span>
              <span>Engineer{assignments.length !== 1 ? 's' : ''} Assigned</span>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading assignments...</p>
            </div>
          ) : assignments.length > 0 ? (
            <div className="assignments-grid">
              {assignments.map(assignment => {
                const engineer = engineers.find(e => Number(e.id) === Number(assignment.accountId));
                const classInfo = classes.find(c => Number(c.id) === Number(assignment.assignedClassId));
                
                return (
                  <div key={assignment.accountId} className="assignment-card enhanced">
                    <div className="assignment-card-header">
                      <div className="engineer-avatar">
                        <Users className="avatar-icon" />
                      </div>
                      <div className="engineer-info">
                        <h4 className="engineer-name">{getAccountName(assignment.accountId)}</h4>
                        <span className="role-badge engineer">
                          <Users className="role-icon" />
                          Engineer
                        </span>
                      </div>
                      <button 
                        className="remove-button enhanced"
                        onClick={() => handleRemoveAssignment(assignment.accountId)}
                        title="Remove assignment"
                      >
                        <Trash2 className="remove-icon" />
                      </button>
                    </div>
                    
                    <div className="assignment-details">
                      <div className="detail-itemo">
                        <span className="detail-label">Assigned to:</span>
                        <span className="detail-value">{getClassName(assignment.assignedClassId)} - {classInfo.gradeName || 'N/A'}</span>
                      </div>
                      
                    
                    
                    </div>
                    
                    <div className="assignment-status">
                      <div className="status-indicator active">
                        <div className="status-dot"></div>
                        <span>Active Assignment</span>
                      </div>
                      <div className="assignment-date">
                        <span>Assigned: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-assignments enhanced">
              <div className="no-assignments-icon">
                <Users className="empty-icon" />
              </div>
              <h4>No Engineer Assignments</h4>
              <p>No engineers have been assigned to classes yet. Use the form above to create your first assignment.</p>
              <div className="no-assignments-tip">
                <AlertCircle className="tip-icon" />
                <span>Tip: Assign engineers to classes to enable team supervision</span>
              </div>
            </div>
          )}
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

export default Step2AssignEngineers;