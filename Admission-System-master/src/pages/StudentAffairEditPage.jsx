"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Alert, AlertDescription } from "../components/ui/Alert";
import Header from "../components/layout/Header";
import { logoutFromAdmission } from "../utils/casAuth";
import { studentAffairAPI } from "../utils/api";

const StudentAffairEditPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    nationalId: "",
    studentName: "",
    dateOfBirth: "",
    location: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    mathScore: "",
    englishScore: "",
    thirdPrepScore: "",
    parentOccupation: "",
    city: "",
    district: "",
    streetName: "",
    buildingNo: "",
    isArabicStudy: false,
    isLanguagesStudy: false,
    hasOnlineTrainingCourses: null,
    hasIcdllicense: null,
    hasLaptop: null,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!location.state?.studentData) {
      navigate("/student-affair/search");
      return;
    }

    const studentData = location.state.studentData;
    setFormData({
      nationalId: studentData.nationalId || location.state.nationalId || "",
      studentName: studentData.studentName || "",
      dateOfBirth: studentData.dateOfBirth
        ? new Date(studentData.dateOfBirth).toISOString().split("T")[0]
        : "",
      location: studentData.location || "",
      phoneNumber: studentData.phoneNumber || "",
      parentPhoneNumber: studentData.parentPhoneNumber || "",
      mathScore: studentData.mathScore || "",
      englishScore: studentData.englishScore || "",
      thirdPrepScore: studentData.thirdPrepScore || "",
      parentOccupation: studentData.parentOccupation || "",
      city: studentData.city || "",
      district: studentData.district || "",
      streetName: studentData.streetName || "",
      buildingNo: studentData.buildingNo || "",
      isArabicStudy: studentData.previousSchoolType === "عربي",
      isLanguagesStudy: studentData.previousSchoolType === "لغات",
      hasOnlineTrainingCourses: studentData.hasOnlineTrainingCourses,
      hasIcdllicense: studentData.hasICDLLicense,
      hasLaptop: studentData.hasLaptop,
    });
  }, [location.state, navigate]);

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Apply max length constraints for text fields
    const maxLengths = {
      studentName: 100,
      parentOccupation: 80,
      location: 200,
      district: 50,
      streetName: 100,
      buildingNo: 20,
    };

    if (maxLengths[field] && value.length > maxLengths[field]) {
      processedValue = value.slice(0, maxLengths[field]);
    }

    // Apply numeric constraints for score fields
    const numericConstraints = {
      mathScore: { min: 0, max: 60 },
      englishScore: { min: 0, max: 60 },
      thirdPrepScore: { min: 0, max: 280 },
    };

    if (numericConstraints[field]) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (numValue < numericConstraints[field].min) {
          processedValue = numericConstraints[field].min.toString();
        } else if (numValue > numericConstraints[field].max) {
          processedValue = numericConstraints[field].max.toString();
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nationalId) errors.nationalId = "National ID is required";
    if (formData.nationalId && !/^\d{14}$/.test(formData.nationalId)) {
      errors.nationalId = "National ID must be exactly 14 digits";
    }
    if (!formData.studentName) errors.studentName = "Student name is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.phoneNumber) errors.phoneNumber = "Phone number is required";
    if (!formData.parentPhoneNumber)
      errors.parentPhoneNumber = "Parent phone number is required";
    if (!formData.parentOccupation)
      errors.parentOccupation = "Parent occupation is required";
    if (!formData.location) errors.location = "Location is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.district) errors.district = "District is required";
    if (!formData.streetName) errors.streetName = "Street name is required";
    if (!formData.buildingNo) errors.buildingNo = "Building number is required";

    // Validate max lengths
    if (formData.studentName && formData.studentName.length > 100) {
      errors.studentName = "Student name must be less than 100 characters";
    }
    if (formData.parentOccupation && formData.parentOccupation.length > 80) {
      errors.parentOccupation =
        "Parent occupation must be less than 80 characters";
    }
    if (formData.location && formData.location.length > 200) {
      errors.location = "Location must be less than 200 characters";
    }
    if (formData.district && formData.district.length > 50) {
      errors.district = "District must be less than 50 characters";
    }
    if (formData.streetName && formData.streetName.length > 100) {
      errors.streetName = "Street name must be less than 100 characters";
    }
    if (formData.buildingNo && formData.buildingNo.length > 20) {
      errors.buildingNo = "Building number must be less than 20 characters";
    }

    // Validate school type selection
    if (!formData.isArabicStudy && !formData.isLanguagesStudy) {
      errors.schoolType = "Please select a previous school type";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const nationalId = location.state.nationalId;
      const updateData = {};

      // Only include fields that have values
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== "" && formData[key] !== null) {
          if (key === "dateOfBirth") {
            updateData[key] = new Date(formData[key]);
          } else if (
            ["mathScore", "englishScore", "thirdPrepScore"].includes(key)
          ) {
            updateData[key] = parseFloat(formData[key]);
          } else if (key === "isArabicStudy" || key === "isLanguagesStudy") {
            // Skip these as we'll handle previousSchoolType separately
            return;
          } else {
            updateData[key] = formData[key];
          }
        }
      });

      // Add previousSchoolType based on radio button selection
      if (formData.isArabicStudy || formData.isLanguagesStudy) {
        updateData.previousSchoolType = formData.isArabicStudy
          ? "عربي"
          : "لغات";
      }

      // Add the three boolean fields
      if (formData.hasOnlineTrainingCourses !== null) {
        updateData.hasOnlineTrainingCourses = formData.hasOnlineTrainingCourses;
      }
      if (formData.hasICDLLicense !== null) {
        updateData.hasICDLLicense = formData.hasICDLLicense;
      }
      if (formData.hasLaptop !== null) {
        updateData.hasLaptop = formData.hasLaptop;
      }

      await studentAffairAPI.updateStudent(nationalId, updateData);

      setSuccess("Student information updated successfully!");

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Redirect back to search page after a short delay
      setTimeout(() => {
        navigate("/student-affair/search");
      }, 2000);
    } catch (err) {
      // Handle validation errors from backend
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const errors = {};
        err.response.data.errors.forEach((errorMessage) => {
          // Map error messages to specific fields
          if (
            errorMessage.includes("National ID") ||
            errorMessage.includes("national ID")
          ) {
            errors.nationalId = errorMessage;
          } else if (
            errorMessage.includes("age") ||
            errorMessage.includes("Date of Birth")
          ) {
            errors.dateOfBirth = errorMessage;
          } else if (errorMessage.includes("Math score")) {
            errors.mathScore = errorMessage;
          } else if (errorMessage.includes("English score")) {
            errors.englishScore = errorMessage;
          } else if (errorMessage.includes("Third prep score")) {
            errors.thirdPrepScore = errorMessage;
          } else if (errorMessage.includes("Phone number")) {
            errors.phoneNumber = errorMessage;
          } else if (errorMessage.includes("Parent phone number")) {
            errors.parentPhoneNumber = errorMessage;
          } else if (errorMessage.includes("Student name")) {
            errors.studentName = errorMessage;
          } else if (errorMessage.includes("Location")) {
            errors.location = errorMessage;
          } else if (errorMessage.includes("City")) {
            errors.city = errorMessage;
          } else if (errorMessage.includes("District")) {
            errors.district = errorMessage;
          } else if (errorMessage.includes("Street name")) {
            errors.streetName = errorMessage;
          } else if (errorMessage.includes("Building number")) {
            errors.buildingNo = errorMessage;
          } else if (errorMessage.includes("Parent occupation")) {
            errors.parentOccupation = errorMessage;
          } else if (
            errorMessage.includes("Previous school type") ||
            errorMessage.includes("School type")
          ) {
            errors.schoolType = errorMessage;
          } else {
            // General error
            setError(errorMessage);
          }
        });
        setFieldErrors(errors);
      } else {
        setError(
          err.response?.data ||
          "Failed to update student information. Please try again."
        );
      }

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutFromAdmission();
  };

  if (!location.state?.studentData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <Link
              to="/student-affair/search"
              className="inline-flex items-center text-[#ef3131] hover:underline"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Search
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-8 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="w-16 h-16 bg-[#ef3131]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-[#ef3131]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Edit Student Information
              </CardTitle>
              <p className="text-gray-600 font-medium mt-2">
                National ID:{" "}
                <span className="text-[#ef3131] font-bold">
                  {location.state.nationalId}
                </span>
              </p>
            </CardHeader>

            <CardContent className="p-8">
              {error && (
                <Alert className="border-red-200 bg-red-50 mb-6">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 mb-6">
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg
                      className="h-5 w-5 mr-2"
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
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="nationalId"
                        className="text-base font-medium text-blue-700"
                      >
                        National ID *
                      </Label>
                      <Input
                        id="nationalId"
                        type="text"
                        value={formData.nationalId}
                        onChange={(e) =>
                          handleInputChange(
                            "nationalId",
                            e.target.value.replace(/\D/g, "").slice(0, 14)
                          )
                        }
                        placeholder="Enter 14-digit National ID"
                        className={`mt-2 h-12 text-lg ${
                          fieldErrors.nationalId ? "border-red-500" : ""
                        }`}
                        maxLength={14}
                      />
                      {fieldErrors.nationalId && (
                        <p className="text-red-600 text-sm mt-1">
                          {fieldErrors.nationalId}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="studentName"
                        className="text-base font-medium text-blue-700"
                      >
                        Student Name *
                      </Label>
                      <Input
                        id="studentName"
                        type="text"
                        value={formData.studentName}
                        onChange={(e) =>
                          handleInputChange("studentName", e.target.value)
                        }
                        placeholder="Enter student name"
                        className={`mt-2 h-12 text-lg ${fieldErrors.studentName ? "border-red-500" : ""
                          }`}
                        maxLength={100}
                      />
                      {fieldErrors.studentName && (
                        <p className="text-red-600 text-sm mt-1">
                          {fieldErrors.studentName}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="dateOfBirth"
                        className="text-base font-medium text-blue-700"
                      >
                        Date of Birth *
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          handleInputChange("dateOfBirth", e.target.value)
                        }
                        className={`mt-2 h-12 text-lg ${fieldErrors.dateOfBirth ? "border-red-500" : ""
                          }`}
                      />
                      {fieldErrors.dateOfBirth && (
                        <p className="text-red-600 text-sm mt-1">
                          {fieldErrors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-base font-medium text-blue-700">
                        Previous School Type *
                      </Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="isArabicStudy"
                            name="studyType"
                            checked={formData.isArabicStudy}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                isArabicStudy: true,
                                isLanguagesStudy: false,
                              }))
                            }
                            className="w-4 h-4 text-[#ef3131] bg-gray-100 border-gray-300"
                          />
                          <Label
                            htmlFor="isArabicStudy"
                            className="text-base font-medium text-gray-700"
                          >
                            عربي
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="isLanguagesStudy"
                            name="studyType"
                            checked={formData.isLanguagesStudy}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                isArabicStudy: false,
                                isLanguagesStudy: true,
                              }))
                            }
                            className="w-4 h-4 text-[#ef3131] bg-gray-100 border-gray-300"
                          />
                          <Label
                            htmlFor="isLanguagesStudy"
                            className="text-base font-medium text-gray-700"
                          >
                            لغات
                          </Label>
                        </div>
                      </div>
                      {fieldErrors.schoolType && (
                        <p className="text-red-600 text-sm mt-1">
                          {fieldErrors.schoolType}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="phoneNumber"
                        className="text-base font-medium text-green-700"
                      >
                        Phone Number *
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          handleInputChange("phoneNumber", e.target.value)
                        }
                        placeholder="01012345678"
                        className="mt-2 h-12 text-lg"
                        maxLength={11}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="parentPhoneNumber"
                        className="text-base font-medium text-green-700"
                      >
                        Parent Phone Number *
                      </Label>
                      <Input
                        id="parentPhoneNumber"
                        type="tel"
                        value={formData.parentPhoneNumber}
                        onChange={(e) =>
                          handleInputChange("parentPhoneNumber", e.target.value)
                        }
                        placeholder="01012345678"
                        className="mt-2 h-12 text-lg"
                        maxLength={11}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="parentOccupation"
                        className="text-base font-medium text-green-700"
                      >
                        Parent Occupation *
                      </Label>
                      <Input
                        id="parentOccupation"
                        type="text"
                        value={formData.parentOccupation}
                        onChange={(e) =>
                          handleInputChange("parentOccupation", e.target.value)
                        }
                        placeholder="مثال: مهندس، مدرس"
                        className="mt-2 h-12 text-lg"
                        maxLength={80}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="location"
                        className="text-base font-medium text-purple-700"
                      >
                        Location *
                      </Label>
                      <Input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        placeholder="أدخل العنوان باللغة العربية"
                        className="mt-2 h-12 text-lg"
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="city"
                        className="text-base font-medium text-purple-700"
                      >
                        City *
                      </Label>
                      <select
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className="mt-2 h-12 text-lg w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ef3131] focus:border-transparent"
                      >
                        <option value="">اختر المحافظة</option>
                        <option value="القاهرة">القاهرة</option>
                        <option value="الإسكندرية">الإسكندرية</option>
                        <option value="الجيزة">الجيزة</option>
                        <option value="الشرقية">الشرقية</option>
                        <option value="الغربية">الغربية</option>
                        <option value="المنوفية">المنوفية</option>
                        <option value="القليوبية">القليوبية</option>
                        <option value="البحيرة">البحيرة</option>
                        <option value="كفر الشيخ">كفر الشيخ</option>
                        <option value="دمياط">دمياط</option>
                        <option value="الدقهلية">الدقهلية</option>
                        <option value="المنيا">المنيا</option>
                        <option value="أسيوط">أسيوط</option>
                        <option value="سوهاج">سوهاج</option>
                        <option value="قنا">قنا</option>
                        <option value="الأقصر">الأقصر</option>
                        <option value="أسوان">أسوان</option>
                        <option value="بني سويف">بني سويف</option>
                        <option value="الفيوم">الفيوم</option>
                        <option value="الوادي الجديد">الوادي الجديد</option>
                        <option value="مطروح">مطروح</option>
                        <option value="شمال سيناء">شمال سيناء</option>
                        <option value="جنوب سيناء">جنوب سيناء</option>
                        <option value="البحر الأحمر">البحر الأحمر</option>
                        <option value="بورسعيد">بورسعيد</option>
                        <option value="الإسماعيلية">الإسماعيلية</option>
                        <option value="السويس">السويس</option>
                      </select>
                    </div>

                    <div>
                      <Label
                        htmlFor="district"
                        className="text-base font-medium text-purple-700"
                      >
                        District *
                      </Label>
                      <Input
                        id="district"
                        type="text"
                        value={formData.district}
                        onChange={(e) =>
                          handleInputChange("district", e.target.value)
                        }
                        placeholder="مثال: المعادي"
                        className="mt-2 h-12 text-lg"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="streetName"
                        className="text-base font-medium text-purple-700"
                      >
                        Street Name *
                      </Label>
                      <Input
                        id="streetName"
                        type="text"
                        value={formData.streetName}
                        onChange={(e) =>
                          handleInputChange("streetName", e.target.value)
                        }
                        placeholder="اسم الشارع"
                        className="mt-2 h-12 text-lg"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="buildingNo"
                        className="text-base font-medium text-purple-700"
                      >
                        Building Number *
                      </Label>
                      <Input
                        id="buildingNo"
                        type="text"
                        value={formData.buildingNo}
                        onChange={(e) =>
                          handleInputChange("buildingNo", e.target.value)
                        }
                        placeholder="رقم المبنى"
                        className="mt-2 h-12 text-lg"
                        maxLength={20}
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Scores Section */}
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Academic Scores
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label
                        htmlFor="mathScore"
                        className="text-base font-medium text-orange-700"
                      >
                        Math Score
                      </Label>
                      <Input
                        id="mathScore"
                        type="text"
                        min="0"
                        max="60"
                        value={formData.mathScore}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string, decimal numbers, and partial decimal input
                          if (
                            value === "" ||
                            value === "." ||
                            value.endsWith(".") ||
                            /^\d*\.?\d*$/.test(value)
                          ) {
                            // Apply max validation immediately
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue > 60) {
                              handleInputChange("mathScore", "60");
                            } else {
                              handleInputChange("mathScore", value);
                            }
                          }
                        }}
                        placeholder="0-60"
                        className={`mt-2 h-12 text-lg ${fieldErrors.mathScore ? "border-red-500" : ""
                          }`}
                      />
                      {fieldErrors.mathScore && (
                        <p className="text-red-600 text-sm mt-1">
                          {fieldErrors.mathScore}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="englishScore"
                        className="text-base font-medium text-orange-700"
                      >
                        English Score
                      </Label>
                      <Input
                        id="englishScore"
                        type="text"
                        min="0"
                        max="60"
                        value={formData.englishScore}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string, decimal numbers, and partial decimal input
                          if (
                            value === "" ||
                            value === "." ||
                            value.endsWith(".") ||
                            /^\d*\.?\d*$/.test(value)
                          ) {
                            // Apply max validation immediately
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue > 60) {
                              handleInputChange("englishScore", "60");
                            } else {
                              handleInputChange("englishScore", value);
                            }
                          }
                        }}
                        placeholder="0-60"
                        className={`mt-2 h-12 text-lg ${fieldErrors.englishScore ? "border-red-500" : ""
                          }`}
                      />
                      {fieldErrors.englishScore && (
                        <p className="text-red-600 text-sm mt-1">
                          {fieldErrors.englishScore}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="thirdPrepScore"
                        className="text-base font-medium text-orange-700"
                      >
                        Third Prep Score
                      </Label>
                      <Input
                        id="thirdPrepScore"
                        type="text"
                        min="0"
                        max="280"
                        value={formData.thirdPrepScore}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string, decimal numbers, and partial decimal input
                          if (
                            value === "" ||
                            value === "." ||
                            value.endsWith(".") ||
                            /^\d*\.?\d*$/.test(value)
                          ) {
                            // Apply max validation immediately
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue > 280) {
                              handleInputChange("thirdPrepScore", "280");
                            } else {
                              handleInputChange("thirdPrepScore", value);
                            }
                          }
                        }}
                        placeholder="0-280"
                        className={`mt-2 h-12 text-lg ${fieldErrors.thirdPrepScore ? "border-red-500" : ""
                          }`}
                      />
                      {fieldErrors.thirdPrepScore && (
                        <p className="text-red-600 text-sm mt-1">
                          {fieldErrors.thirdPrepScore}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Additional Information
                  </h3>
                  <div className="space-y-6">
                    {/* Has Online Training Courses Radio Buttons */}
                    <div>
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-blue-700">
                          هل لديك دورات تدريبية أونلاين؟
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="hasOnlineTrainingCoursesYes"
                              name="hasOnlineTrainingCourses"
                              checked={
                                formData.hasOnlineTrainingCourses === true
                              }
                              onChange={() =>
                                handleInputChange(
                                  "hasOnlineTrainingCourses",
                                  true
                                )
                              }
                              className="w-4 h-4 text-[#ef3131] bg-gray-100 border-gray-300"
                            />
                            <Label
                              htmlFor="hasOnlineTrainingCoursesYes"
                              className="text-base font-medium text-blue-700"
                            >
                              نعم
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="hasOnlineTrainingCoursesNo"
                              name="hasOnlineTrainingCourses"
                              checked={
                                formData.hasOnlineTrainingCourses === false
                              }
                              onChange={() =>
                                handleInputChange(
                                  "hasOnlineTrainingCourses",
                                  false
                                )
                              }
                              className="w-4 h-4 text-[#ef3131] bg-gray-100 border-gray-300"
                            />
                            <Label
                              htmlFor="hasOnlineTrainingCoursesNo"
                              className="text-base font-medium text-blue-700"
                            >
                              لا
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Has ICDL License Radio Buttons */}
                    <div>
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-blue-700">
                          هل لديك رخصة ICDL؟
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="hasIcdllicenseYes"
                              name="hasIcdllicense"
                              checked={formData.hasIcdllicense === true}
                              onChange={() =>
                                handleInputChange("hasIcdllicense", true)
                              }
                              className="w-4 h-4 text-[#ef3131] bg-gray-100 border-gray-300"
                            />

                            <Label
                              htmlFor="hasIcdllicenseYes"
                              className="text-base font-medium text-blue-700"
                            >
                              نعم
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="hasIcdllicenseNo"
                              name="hasIcdllicense"
                              checked={formData.hasIcdllicense === false}
                              onChange={() =>
                                handleInputChange("hasIcdllicense", false)
                              }
                              className="w-4 h-4 text-[#ef3131] bg-gray-100 border-gray-300"
                            />
                            <Label
                              htmlFor="hasIcdllicenseNo"
                              className="text-base font-medium text-blue-700"
                            >
                              لا
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Has Laptop Radio Buttons */}
                    <div>
                      <div className="space-y-3">
                        <h3 className="text-base font-medium text-blue-700">
                          هل لديك لابتوب؟
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="hasLaptopYes"
                              name="hasLaptop"
                              checked={formData.hasLaptop === true}
                              onChange={() =>
                                handleInputChange("hasLaptop", true)
                              }
                              className="w-4 h-4 text-[#ef3131] bg-gray-100 border-gray-300"
                            />
                            <Label
                              htmlFor="hasLaptopYes"
                              className="text-base font-medium text-blue-700"
                            >
                              نعم
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="hasLaptopNo"
                              name="hasLaptop"
                              checked={formData.hasLaptop === false}
                              onChange={() =>
                                handleInputChange("hasLaptop", false)
                              }
                              className="w-4 h-4 text-[#ef3131] bg-gray-100 border-gray-300"
                            />
                            <Label
                              htmlFor="hasLaptopNo"
                              className="text-base font-medium text-blue-700"
                            >
                              لا
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    className="flex-1 bg-[#ef3131] hover:bg-red-600 h-12 text-lg font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      "Update Student Information"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/staff-admin/search")}
                    className="flex-1 h-12 text-lg font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentAffairEditPage;
