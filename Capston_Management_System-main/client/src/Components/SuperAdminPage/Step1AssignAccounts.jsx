import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig.js';
import { isEngineer, isStaffAdmin } from '../../utils/roleUtils';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { axiosInstance } from '../../utils/authService';
import { validatePasswordComplexity } from '../../utils/inputValidation';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator/PasswordStrengthIndicator.jsx';
import './StepPages.css';

// Simple inline component for account creation
const SimpleCreateAccount = ({ roles, classes: parentClasses, onCreated }) => {
  const [form, setForm] = React.useState({
    fullNameEn: '',
    fullNameAr: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
    classId: ''
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [classes, setClasses] = React.useState(parentClasses || []);
  const [showPassword, setShowPassword] = React.useState(false);

  // Update classes when parentClasses changes
  React.useEffect(() => {
    if (parentClasses && Array.isArray(parentClasses)) {
      console.log('SimpleCreateAccount - Updating classes from parent:', parentClasses);
      setClasses(parentClasses);
    }
  }, [parentClasses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number validation - only allow 11 digits
    if (name === 'phone') {
      const phoneRegex = /^\d{0,11}$/;
      if (!phoneRegex.test(value)) {
        return; // Don't update if it doesn't match the pattern
      }
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
    
    // If role changes to Student, use classes from parent
    if (name === 'roleId' && value) {
      const selectedRole = roles.find(r => (r.id || r.Id) == value);
      console.log('Selected role:', selectedRole);
      console.log('Role name:', selectedRole?.roleName || selectedRole?.RoleName);
      
      if (selectedRole && (selectedRole.roleName || selectedRole.RoleName) === 'Student') {
        console.log('Using classes from parent for Student role...');
        console.log('Available classes:', parentClasses);
        setClasses(parentClasses || []);
      } else {
        console.log('Clearing classes for non-Student role');
        setClasses([]);
        setForm(prev => ({ ...prev, classId: '' }));
      }
    }
  };


  const submit = async () => {
    if (!form.fullNameEn || !form.fullNameAr || !form.email || !form.password || !form.roleId) {
      showWarning('Please fill all required fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      showWarning('Please enter a valid email address with @ symbol');
      return;
    }
    
    // Validate phone number length if provided
    if (form.phone && form.phone.length !== 11) {
      showWarning('Phone number must be exactly 11 digits');
      return;
    }
    
    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(form.password);
    if (!passwordValidation.isValid) {
      showWarning(`Password requirements: ${passwordValidation.errors.join(', ')}`);
      return;
    }
    
    // Check if Student role is selected and class is required
    const selectedRole = roles.find(r => (r.id || r.Id) == form.roleId);
    if (selectedRole && (selectedRole.roleName || selectedRole.RoleName) === 'Student' && !form.classId) {
      showWarning('Please select a class for the student');
      return;
    }
    
    setSubmitting(true);
    try {
      const selectedRole = roles.find(r => (r.id || r.Id) == form.roleId);
      const roleName = selectedRole?.roleName || selectedRole?.RoleName;

      const requestData = {
        FullNameEn: form.fullNameEn,
        FullNameAr: form.fullNameAr,
        Email: form.email,
        Password: form.password,
        Phone: form.phone || null,
      };

      // Always prefer sending RoleName (server supports RoleId or RoleName)
      if (roleName) {
        requestData.RoleName = roleName;
      } else if (form.roleId) {
        requestData.RoleId = Number(form.roleId);
      }

      // Add ClassId if provided
      if (form.classId) {
        requestData.ClassId = Number(form.classId);
      }

      await axiosInstance.post(`/Account/CreateSimple`, requestData);
      showSuccess('Account created successfully!');
      setForm({ fullNameEn: '', fullNameAr: '', email: '', password: '', phone: '', roleId: '', classId: '' });
      setClasses([]);
      onCreated && onCreated();
    } catch (e) {
      showError(e.response?.data?.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-row step1-form-row">
      <div className="form-group step1-form-group">
        <label>Full Name (EN)*</label>
        <input name="fullNameEn" value={form.fullNameEn} onChange={handleChange} placeholder="e.g. John Doe" />
      </div>
      <div className="form-group">
        <label>Full Name (AR)*</label>
        <input name="fullNameAr" value={form.fullNameAr} onChange={handleChange} placeholder="مثال: أحمد علي" />
      </div>
      <div className="form-group">
        <label>Email*</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
      </div>
      <div className="form-group">
        <label>Password*</label>
        <div style={{ position: 'relative' }}>
          <input 
            type={showPassword ? 'text' : 'password'} 
            name="password" 
            value={form.password} 
            onChange={handleChange} 
            placeholder="Strong password" 
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
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
        {form.password && (
          <PasswordStrengthIndicator 
            password={form.password} 
            showRequirements={true}
          />
        )}
      </div>
      <div className="form-group">
        <label>Phone (optional)</label>
        <input 
          name="phone" 
          value={form.phone} 
          onChange={handleChange} 
          placeholder="01025182782" 
          maxLength="11"
          type="tel"
        />
      </div>
      <div className="form-group">
        <label>Role*</label>
        <select name="roleId" value={form.roleId} onChange={handleChange}>
          <option value="">Choose role...</option>
          {(roles || []).map(r => (
            <option key={r.id || r.Id} value={r.id || r.Id}>{r.roleName || r.RoleName}</option>
          ))}
        </select>
      </div>
      
      {/* Show class dropdown only when Student role is selected */}
      {form.roleId && (() => {
        const selectedRole = roles.find(r => (r.id || r.Id) == form.roleId);
        const isStudent = selectedRole && (selectedRole.roleName || selectedRole.RoleName) === 'Student';
        console.log('Rendering class dropdown check:', { 
          formRoleId: form.roleId, 
          selectedRole, 
          isStudent, 
          classesLength: classes?.length,
          classesType: typeof classes
        });
        return isStudent;
      })() && (
        <div className="form-group">
          <label>Class*</label>
          <select 
            name="classId" 
            value={form.classId} 
            onChange={handleChange}
          >
            <option value="">
              Choose class...
            </option>
            {console.log('Step1AssignAccounts - Classes order:', (classes || []).map((cls, i) => `${i + 1}. ${cls.className || cls.ClassName} (${cls.gradeName || cls.GradeName})`))}
            {(classes || []).map((cls, index) => {
              console.log(`Class ${index}:`, cls);
              return (
                <option key={cls.id || cls.Id} value={cls.id || cls.Id}>
                  {cls.className || cls.ClassName} 
                  {cls.gradeName || cls.GradeName ? ` (${cls.gradeName || cls.GradeName})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}
      
      <button className="assign-button step1-create-btn" onClick={submit} disabled={submitting}>
        <Plus className="button-icon" /> Create Account
      </button>
    </div>
  );
};

const Step1AssignAccounts = ({ onNext, onPrev, currentStep, user }) => {
  const [engineers, setEngineers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Step1AssignAccounts - Starting to fetch data...');
      console.log('Step1AssignAccounts - API_BASE_URL:', API_BASE_URL);

      // Determine role first so we only call allowed endpoints
      const isEngineerUser = isEngineer(user);

      const engineersPromise = isEngineerUser
        ? Promise.resolve({ data: [] })
        : axiosInstance.get(`/Account/ByRoleName/Engineer`);
      const reviewersPromise = isEngineerUser
        ? Promise.resolve({ data: [] })
        : axiosInstance.get(`/Account/ByRoleName/Reviewer`);

      const assignmentsPromise = isEngineerUser
        ? axiosInstance.get(`/Teams/Assignments`)
        : Promise.resolve({ data: [] });

      const [engineersRes, reviewersRes, classesRes, rolesRes, assignmentsRes] = await Promise.all([
        engineersPromise,
        reviewersPromise,
        axiosInstance.get(`/Class`),
        axiosInstance.get(`/Account/Roles/Capstone`),
        assignmentsPromise
      ]);

      console.log('Step1AssignAccounts - Engineers response:', engineersRes.data);
      console.log('Step1AssignAccounts - Reviewers response:', reviewersRes.data);
      console.log('Step1AssignAccounts - Classes response:', classesRes.data);
      // Removed debug assignments endpoint

      // Handle different response structures
      const engineersData = Array.isArray(engineersRes.data) ? engineersRes.data : 
                           (engineersRes.data?.$values ? engineersRes.data.$values : []);
      const reviewersData = Array.isArray(reviewersRes.data) ? reviewersRes.data : 
                           (reviewersRes.data?.$values ? reviewersRes.data.$values : []);
      let classesData = Array.isArray(classesRes.data) ? classesRes.data : 
                         (classesRes.data?.$values ? classesRes.data.$values : []);
      let assignmentsData = [];
      if (isEngineerUser) {
        const rawAssign = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : (assignmentsRes.data?.$values || []);

        // Only keep assignments for the currently logged-in engineer
        const currentEngineerId = user?.id || user?.Id || user?.accountId || user?.AccountId;
        assignmentsData = rawAssign.filter(a => (a.accountId || a.AccountId) == currentEngineerId);

        // Build the set of class IDs from this engineer's assignments only
        const assignedIds = new Set(assignmentsData.map(a => a.assignedClassId || a.AssignedClassId));
        classesData = classesData.filter(cls => assignedIds.has(cls.id || cls.Id));
      }

      setEngineers(engineersData);
      setReviewers(reviewersData);
      setClasses(classesData);
      setAssignments(assignmentsData);
      const rawRoles = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.$values || []);
      console.log('Step1AssignAccounts - Raw roles from API:', rawRoles);
      console.log('Step1AssignAccounts - Full user object:', user);
      console.log('Step1AssignAccounts - User roleId:', user?.roleId);
      console.log('Step1AssignAccounts - User roleId type:', typeof user?.roleId);
      console.log('Step1AssignAccounts - User roleId === 5:', user?.roleId === 5);
      console.log('Step1AssignAccounts - User roleId == 5:', user?.roleId == 5);
      
      // Check if user is Engineer using the utility function
      // (computed above as well; keep for logs/clarity)
      // const isEngineerUser = isEngineer(user);
      const isStaffAdminUser = isStaffAdmin(user);
      
      console.log('Step1AssignAccounts - isEngineerUser (using utility):', isEngineerUser);
      
      const allowedNames = isEngineerUser
        ? ["Student"]
        : (isStaffAdminUser ? ["Student", "Engineer", "Super Admin", "Staff Admin", "Board"] : ["Student", "Engineer", "Super Admin", "Board"]);
      console.log('Step1AssignAccounts - Allowed names for this user:', allowedNames);
      let filtered = rawRoles.filter(r => (r.businessEntity || r.BusinessEntity) === 'CapstoneProject' &&
        allowedNames.includes((r.roleName || r.RoleName)));

      // Ensure dropdown shows all allowed roles even if API misses some
      if (isStaffAdminUser) {
        const existing = new Set(filtered.map(r => (r.roleName || r.RoleName)));
        const required = ["Student", "Engineer", "Super Admin", "Staff Admin", "Board"];
        required.forEach((name, idx) => {
          if (!existing.has(name)) {
            filtered.push({ id: -(idx + 1), roleName: name, businessEntity: 'CapstoneProject' });
          }
        });
      }

      console.log('Step1AssignAccounts - Filtered roles (final):', filtered);
      setRoles(filtered);
      
      console.log('Step1AssignAccounts - Data set:', {
        engineers: engineersData.length,
        reviewers: reviewersData.length,
        classes: classesData.length,
        assignments: assignmentsData.length
      });
      
      console.log('Step1AssignAccounts - Classes data:', classesData);
      console.log('Step1AssignAccounts - Engineers data:', engineersData);
    } catch (error) {
      console.error('Step1AssignAccounts - Error fetching data:', error);
      console.error('Step1AssignAccounts - Error response:', error.response?.data);
      console.error('Step1AssignAccounts - Error status:', error.response?.status);
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
      console.log('Step1AssignAccounts - Assigning engineer:', { selectedEngineer, selectedClass });
      
      const response = await axiosInstance.post(`/Account/AssignEngineerToClass`, {
        AccountId: parseInt(selectedEngineer),
        ClassId: parseInt(selectedClass)
      });

      console.log('Step1AssignAccounts - Engineer assignment response:', response.data);
      showSuccess('Engineer assigned to class successfully!');
      
      setSelectedEngineer('');
      setSelectedClass('');
      fetchData(); // Refresh the data to show the new assignment
    } catch (error) {
      console.error('Step1AssignAccounts - Error assigning engineer:', error);
      console.error('Step1AssignAccounts - Error response:', error.response?.data);
      showError(`Error assigning engineer to class: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAssignReviewer = async () => {
    if (!selectedReviewer || !selectedClass) {
      showWarning('Please select both reviewer and class');
      return;
    }

    try {
      console.log('Step1AssignAccounts - Assigning reviewer:', { selectedReviewer, selectedClass });
      
      const response = await axiosInstance.post(`/Account/AssignReviewerToClass`, {
        AccountId: parseInt(selectedReviewer),
        ClassId: parseInt(selectedClass)
      });

      console.log('Step1AssignAccounts - Reviewer assignment response:', response.data);
      showSuccess('Reviewer assigned to class successfully!');
      
      setSelectedReviewer('');
      setSelectedClass('');
      fetchData(); // Refresh the data to show the new assignment
    } catch (error) {
      console.error('Step1AssignAccounts - Error assigning reviewer:', error);
      console.error('Step1AssignAccounts - Error response:', error.response?.data);
      showError(`Error assigning reviewer to class: ${error.response?.data?.error || error.message}`);
    }
  };



  const isStepComplete = engineers.length > 0 || reviewers.length > 0;

  return (
    <div className="step-page step1-create-accounts">
      <div className="step-header">
        <div className="step-title">
          <Users className="step-title-icon" />
          <div>
            <h2>Create User Accounts</h2>
            <p>Create user accounts for students, engineers, and super admins. {user?.roleId === 5 ? 'Engineers can only create student accounts.' : 'Super admins can create any role.'}</p>
          </div>
        </div>
      </div>

      <div className="step-content step1-content">
        <div className="assignment-forms step1-assignment-forms">
          <div className="assignment-form step1-assignment-form">
            <h3>Create Account</h3>
            <SimpleCreateAccount roles={roles} classes={classes} onCreated={fetchData} />
          </div>

       
        </div>
      </div>

    </div>
  );
};

export default Step1AssignAccounts;
