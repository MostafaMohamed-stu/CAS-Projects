import React, { useState } from 'react';
import { Users, UserPlus, Building, CheckCircle, ArrowRight, Info, AlertCircle, Clock } from 'lucide-react';
import Step1AssignAccounts from './Step1AssignAccounts';
import Step2AssignEngineers from './Step2AssignEngineers';
import Step3CreateTeams from './Step3CreateTeams';
import Step4AssignLeaders from './Step4AssignLeaders';
import Step5AddMembers from './Step5AddMembers';
import Step6AddToSystem from './Step6AddToSystem';
import { isEngineer } from '../../utils/roleUtils';
import './SuperAdminPage.css';

const SuperAdminPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('team-creation');
  const [currentStep, setCurrentStep] = useState(1);
  const [isWorkflowComplete, setIsWorkflowComplete] = useState(false);

  const teamCreationSteps = [
    {
      id: 1,
      title: "Create User Accounts",
      description: "Create user accounts for students, engineers, and super admins.",
      details: [
        "Create student accounts for team members",
        "Create engineer accounts for supervision",
        "Create super admin accounts for system management",
        "Set up login credentials for each account"
      ],
      icon: <Users className="step-icon" />,
      status: "pending"
    },
    {
      id: 2,
      title: "Assign Engineers & Reviewers",
      description: "Assign engineers and reviewers to specific classes using the ReviewerSupervisorExtension table.",
      details: [
        "Select engineers and reviewers from the accounts table",
        "Assign them to classes from the TblClass table",
        "This creates the foundation for team supervision",
        "Only super admins can perform this step"
      ],
      icon: <UserPlus className="step-icon" />,
      status: "pending"
    },
    {
      id: 3,
      title: "Create Teams",
      description: "Create teams and assign them to the classes where engineers/reviewers are assigned.",
      details: [
        "Use the Teams table to create new teams",
        "Assign each team to a specific class (ClassId)",
        "Set team names and basic information",
        "Ensure teams are linked to classes with assigned supervisors"
      ],
      icon: <Building className="step-icon" />,
      status: "pending"
    },
    {
      id: 4,
      title: "Add Team Members",
      description: "Add students as team members to their respective teams.",
      details: [
        "Use the TeamMembers table to add students to teams",
        "Link students (TeamMemberAccountId) to their teams (TeamId)",
        "Add team member descriptions if needed",
        "Ensure all team members are from the same class"
      ],
      icon: <Building className="step-icon" />,
      status: "pending"
    },
    {
      id: 5,
      title: "Assign Team Leaders",
      description: "Select and assign team leaders from the student accounts.",
      details: [
        "Choose team leaders from student accounts (Role ID: 1)",
        "Update the Teams table with TeamLeaderAccountId",
        "Ensure team leaders are from the same class as the team",
        "Verify team leader assignments in the database"
      ],
      icon: <CheckCircle className="step-icon" />,
      status: "pending"
    },
    // {
    //   id: 6,
    //   title: "Add to Our System",
    //   description: "Add student accounts to the CapstoneProject system with Student role.",
    //   details: [
    //     "View all student accounts that are not registered in CapstoneProject",
    //     "Select specific students or select all",
    //     "Add selected students to AccountRoles table",
    //     "Students will gain access to the CapstoneProject system"
    //   ],
    //   icon: <Users className="step-icon" />,
    //   status: "pending"
    // },
  ];

  // Filter steps based on user role - hide step 2 for engineers
  const filteredSteps = React.useMemo(() => {
    if (isEngineer(user)) {
      return teamCreationSteps.filter(step => step.id !== 2);
    }
    return teamCreationSteps;
  }, [user]);

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "pending";
  };

  const nextStep = () => {
    const currentIndex = filteredSteps.findIndex(step => step.id === currentStep);
    if (currentIndex < filteredSteps.length - 1) {
      setCurrentStep(filteredSteps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = filteredSteps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(filteredSteps[currentIndex - 1].id);
    }
  };

  const handleWorkflowComplete = () => {
    setIsWorkflowComplete(true);
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setIsWorkflowComplete(false);
  };

  return (
    <div className="super-admin-page">
      <div className="super-admin-header">
        <h1>Capstone Management Dashboard</h1>
        <p>Accounts and Teams and projects management</p>
      </div>

      {activeTab === 'team-creation' && (
        <div className="steps-overview">
          <h3>Management Sections</h3>
          <div className="steps-mini">
            {filteredSteps.map((step) => (
              <button
                key={step.id}
                className={`step-mini ${getStepStatus(step.id)} ${currentStep === step.id ? 'active' : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="step-mini-icon">
                  {step.icon}
                </div>
                <span className="step-mini-name">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

       <div className="super-admin-content">
         {activeTab === 'team-creation' && (
           <div className="workflow-section">
             {isWorkflowComplete ? (
               <div className="workflow-success">
                 <div className="success-header">
                   <CheckCircle className="success-icon" />
                   <h2>Team Creation Completed Successfully!</h2>
                   <p>Your team has been created and is ready for use. All steps have been completed successfully.</p>
                 </div>
                 
                 <div className="success-summary">
                   <h3>What was accomplished:</h3>
                   <ul>
                     <li>✅ Engineers and reviewers assigned to classes</li>
                     <li>✅ Teams created and linked to classes</li>
                     <li>✅ Team leaders assigned from student accounts</li>
                     <li>✅ Team members added to their respective teams</li>
                     <li>✅ Projects created and assigned to teams</li>
                   </ul>
                 </div>

                 <div className="success-actions">
                   <button className="reset-button" onClick={resetWorkflow}>
                     Create Another Team
                   </button>
                   <button className="dashboard-button" onClick={() => window.location.reload()}>
                     Go to Dashboard
                   </button>
                 </div>
               </div>
             ) : (
               <>
                 {currentStep === 1 && (
                   <Step1AssignAccounts 
                     onNext={nextStep} 
                     onPrev={prevStep} 
                     currentStep={currentStep}
                     user={user}
                   />
                 )}
                 {currentStep === 2 && !isEngineer(user) && (
                   <Step2AssignEngineers 
                     onNext={nextStep} 
                     onPrev={prevStep} 
                     currentStep={currentStep}
                     user={user}
                   />
                 )}
                 {currentStep === 3 && (
                   <Step3CreateTeams 
                     onNext={nextStep} 
                     onPrev={prevStep} 
                     currentStep={currentStep}
                     user={user}
                   />
                 )}
                 {currentStep === 4 && (
                   <Step5AddMembers 
                     onNext={nextStep} 
                     onPrev={prevStep} 
                     currentStep={currentStep}
                     user={user}
                   />
                 )}
                 {currentStep === 5 && (
                   <Step4AssignLeaders 
                     onNext={handleWorkflowComplete} 
                     onPrev={prevStep} 
                     currentStep={currentStep}
                     user={user}
                   />
                 )}
                 {/* {currentStep === 6 && (
                   <Step6AddToSystem 
                     onNext={handleWorkflowComplete} 
                     onPrev={prevStep} 
                     currentStep={currentStep}
                     user={user}
                   />
                 )} */}
               </>
             )}
           </div>
         )}

        {activeTab === 'project-creation' && (
          <div className="workflow-section">
            <div className="workflow-header">
              <h2>Project Creation Workflow</h2>
              <p>Coming Soon - Project creation steps will be available after team setup is complete</p>
            </div>
            <div className="coming-soon">
              <Building className="coming-soon-icon" />
              <h3>Project Creation Feature</h3>
              <p>This feature will be available soon. You'll be able to create projects, assign supervisors, and manage project timelines.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
