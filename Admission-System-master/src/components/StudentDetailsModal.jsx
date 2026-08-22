import { useState, useEffect } from "react";
import Button from "./ui/Button";
import { studentAPI } from "../utils/api";

const StudentDetailsModal = ({ student, isOpen, onClose }) => {
  const [studentDetails, setStudentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && student) {
      loadStudentDetails();
    }
  }, [isOpen, student]);

  const loadStudentDetails = async () => {
    if (!student?.nationalId) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await studentAPI.validateNationalId(student.nationalId);
      setStudentDetails(response.data);
    } catch (err) {
      setError("Failed to load student details");
      console.error("Error loading student details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Student Details
              </h3>
              <p className="text-sm text-gray-500">
                {student?.fullName} - {student?.nationalId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading student details...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {studentDetails && !isLoading && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-blue-700">Full Name</label>
                    <p className="text-blue-900 font-medium">{studentDetails.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-700">National ID</label>
                    <p className="text-blue-900 font-medium font-mono">{studentDetails.nationalId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-700">Date of Birth</label>
                    <p className="text-blue-900 font-medium">
                      {studentDetails.dateOfBirth 
                        ? new Date(studentDetails.dateOfBirth).toLocaleDateString("en-GB")
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-700">Email</label>
                    <p className="text-blue-900 font-medium">{studentDetails.email || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Academic Scores */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-green-900 mb-4">
                  Academic Scores
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-green-700">Math Score</label>
                    <p className="text-green-900 font-medium">{studentDetails.mathScore || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">English Score</label>
                    <p className="text-green-900 font-medium">{studentDetails.english || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">Final Year Score</label>
                    <p className="text-green-900 font-medium">{studentDetails.prepScore || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">Ministry Exam %</label>
                    <p className="text-green-900 font-medium">{studentDetails.ministryPercentage || "Not specified"}%</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-purple-700">Student Phone</label>
                    <p className="text-purple-900 font-medium">{studentDetails.phoneNumber || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-700">Parent Phone</label>
                    <p className="text-purple-900 font-medium">{studentDetails.parentPhoneNumber || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-orange-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-orange-900 mb-4">
                  Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-orange-700">Full Address</label>
                    <p className="text-orange-900 font-medium">{studentDetails.location || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-orange-700">City</label>
                    <p className="text-orange-900 font-medium">{studentDetails.city || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-orange-700">District</label>
                    <p className="text-orange-900 font-medium">{studentDetails.district || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-orange-700">Street Name</label>
                    <p className="text-orange-900 font-medium">{studentDetails.streetName || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-orange-700">Building No</label>
                    <p className="text-orange-900 font-medium">{studentDetails.buildingNo || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Parent Occupation</label>
                    <p className="text-gray-900 font-medium">{studentDetails.parentOccupation || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Previous School Type</label>
                    <p className="text-gray-900 font-medium">{studentDetails.previousSchoolType || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Has ICDL License</label>
                    <p className="text-gray-900 font-medium">
                      {studentDetails.hasICDLLicense === true ? "Yes" : 
                       studentDetails.hasICDLLicense === false ? "No" : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Has Online Training</label>
                    <p className="text-gray-900 font-medium">
                      {studentDetails.hasOnlineTrainingCourses === true ? "Yes" : 
                       studentDetails.hasOnlineTrainingCourses === false ? "No" : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Has Laptop</label>
                    <p className="text-gray-900 font-medium">
                      {studentDetails.hasLaptop === true ? "Yes" : 
                       studentDetails.hasLaptop === false ? "No" : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="mr-3"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
