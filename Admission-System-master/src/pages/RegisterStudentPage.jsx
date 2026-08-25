"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import Checkbox from "../components/ui/Checkbox";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { receptionCoordinatorAPI } from "../utils/api";

const DRAFT_KEY = "receptionCoordinatorRegisterDraft";

const GOVERNORATE_MAP = {
  "01": "Cairo",
  "02": "Alexandria",
  "03": "Port Said",
  "04": "Suez",
  "11": "Damietta",
  "12": "Dakahlia",
  "13": "Sharqia",
  "14": "Qalyubia",
  "15": "Kafr El Sheikh",
  "16": "Gharbia",
  "17": "Monufia",
  "18": "Beheira",
  "19": "Ismailia",
  "21": "Giza",
  "22": "Beni Suef",
  "23": "Fayoum",
  "24": "Minya",
  "25": "Assiut",
  "26": "Sohag",
  "27": "Qena",
  "28": "Aswan",
  "29": "Luxor",
  "31": "Red Sea",
  "32": "New Valley",
  "33": "Matrouh",
  "34": "North Sinai",
  "35": "South Sinai",
  "88": "Outside Egypt",
};

const evaluateDateOfBirth = (dateValue) => {
  if (!dateValue) {
    return { isValid: false, error: "Date of Birth is required" };
  }

  const dateOfBirth = new Date(dateValue);
  if (isNaN(dateOfBirth.getTime())) {
    return { isValid: false, error: "Please enter a valid date" };
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const octoberFirst = new Date(currentYear, 9, 1);

  if (today < octoberFirst) {
    octoberFirst.setFullYear(currentYear - 1);
  }

  const minDate = new Date(octoberFirst.getFullYear() - 18, 9, 1);
  const maxDate = new Date(octoberFirst.getFullYear() - 1, 9, 1);

  if (dateOfBirth < minDate || dateOfBirth > maxDate) {
    return {
      isValid: false,
      error:
        "Student must be 18 years or younger on October 1st of the current academic year",
    };
  }

  return { isValid: true, error: null };
};

const initialFormData = {
  studentName: "",
  nationalId: "",
  mathScore: "",
  englishScore: "",
  finalYearScore: "",
  ministryExamPercentage: "",
  dateOfBirth: "",
};

const RegisterStudentPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isAcceptanceLetterReceived, setIsAcceptanceLetterReceived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [birthdateError, setBirthdateError] = useState("");
  const [age, setAge] = useState("");
  const [isDobValid, setIsDobValid] = useState(null);
  const [students, setStudents] = useState([]);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef(null);
  const navigate = useNavigate();

  const completionPercent = useMemo(() => {
    const requiredFields = [
      formData.studentName,
      formData.nationalId,
      formData.dateOfBirth,
      formData.mathScore,
      formData.englishScore,
      formData.finalYearScore,
    ];

    if (isAcceptanceLetterReceived) {
      requiredFields.push(formData.ministryExamPercentage);
    }

    const completed = requiredFields.filter(
      (value) => String(value ?? "").trim() !== ""
    ).length;

    return Math.round((completed / requiredFields.length) * 100);
  }, [formData, isAcceptanceLetterReceived]);

  const ageStatus = useMemo(() => {
    const ageNumber = Number(age);
    if (!Number.isFinite(ageNumber) || age === "") return "Pending";
    if (ageNumber <= 18) return "Within age policy";
    return "Needs DOB review";
  }, [age]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) => {
      const fullName = (student.fullName || "").toString().toLowerCase();
      const nationalId = (student.nationalId || "").toString();
      return fullName.includes(query) || nationalId.includes(query);
    });
  }, [students, searchQuery]);

  const duplicateStudent = useMemo(() => {
    if (!/^\d{14}$/.test(formData.nationalId)) return null;
    return students.find((student) => student.nationalId === formData.nationalId) || null;
  }, [students, formData.nationalId]);

  const nationalIdInsights = useMemo(() => {
    const id = formData.nationalId;
    if (!/^\d{14}$/.test(id)) {
      return {
        isComplete: false,
        isDatePartValid: false,
        inferredDateString: null,
        governorate: null,
        birthDateMatchesInput: null,
      };
    }

    const centuryDigit = id[0];
    const centuryBase = centuryDigit === "2" ? 1900 : centuryDigit === "3" ? 2000 : null;
    const year = Number(id.slice(1, 3));
    const month = Number(id.slice(3, 5));
    const day = Number(id.slice(5, 7));
    const governorateCode = id.slice(7, 9);
    const governorate = GOVERNORATE_MAP[governorateCode] || `Code ${governorateCode}`;

    if (!centuryBase) {
      return {
        isComplete: true,
        isDatePartValid: false,
        inferredDateString: null,
        governorate,
        birthDateMatchesInput: null,
      };
    }

    const fullYear = centuryBase + year;
    const dobDate = new Date(fullYear, month - 1, day);
    const isDatePartValid =
      dobDate.getFullYear() === fullYear &&
      dobDate.getMonth() + 1 === month &&
      dobDate.getDate() === day;

    const inferredDateString = isDatePartValid
      ? `${fullYear.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : null;

    const birthDateMatchesInput = formData.dateOfBirth
      ? inferredDateString === formData.dateOfBirth
      : null;

    return {
      isComplete: true,
      isDatePartValid,
      inferredDateString,
      governorate,
      birthDateMatchesInput,
    };
  }, [formData.nationalId, formData.dateOfBirth]);

  const validationRadar = useMemo(() => {
    const dobEvaluation = evaluateDateOfBirth(formData.dateOfBirth);
    const inRange = (value, min, max) => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) && parsed >= min && parsed <= max;
    };

    return [
      {
        label: "National ID format",
        pass: /^\d{14}$/.test(formData.nationalId),
      },
      {
        label: "DOB admission policy",
        pass: dobEvaluation.isValid,
      },
      {
        label: "Math score range (0-60)",
        pass: inRange(formData.mathScore, 0, 60),
      },
      {
        label: "English score range (0-60)",
        pass: inRange(formData.englishScore, 0, 60),
      },
      {
        label: "Final Prep score range (0-280)",
        pass: inRange(formData.finalYearScore, 0, 280),
      },
      {
        label: "Ministry percentage (when required)",
        pass:
          !isAcceptanceLetterReceived ||
          inRange(formData.ministryExamPercentage, 0, 100),
      },
    ];
  }, [
    formData.nationalId,
    formData.dateOfBirth,
    formData.mathScore,
    formData.englishScore,
    formData.finalYearScore,
    formData.ministryExamPercentage,
    isAcceptanceLetterReceived,
  ]);

  useEffect(() => {
    const token = localStorage.getItem("receptionCoordinatorToken");
    if (!token) {
      navigate("/reception-coordinator/login");
      return;
    }

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft);
      if (parsed?.formData) {
        setFormData((prev) => ({ ...prev, ...parsed.formData }));
      }
      if (typeof parsed?.isAcceptanceLetterReceived === "boolean") {
        setIsAcceptanceLetterReceived(parsed.isAcceptanceLetterReceived);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [navigate]);

  useEffect(() => {
    const hasAnyValue =
      Object.values(formData).some((value) => String(value ?? "").trim() !== "") ||
      isAcceptanceLetterReceived;

    if (!hasAnyValue) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }

    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        formData,
        isAcceptanceLetterReceived,
      })
    );
  }, [formData, isAcceptanceLetterReceived]);

  const loadStudents = useCallback(async () => {
    try {
      setIsLoadingStudents(true);
      const response = await receptionCoordinatorAPI.getStudents();
      setStudents(response.data);
    } catch {
      setError("Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("receptionCoordinatorToken");
    if (token && students.length === 0) {
      loadStudents();
    }
  }, [loadStudents, students.length]);

  useEffect(() => {
    const onKeyDown = async (event) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        formRef.current?.requestSubmit();
        return;
      }

      if (event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        document.getElementById("nationalId")?.focus();
        return;
      }

      if (event.altKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        setIsStudentsModalOpen(true);
        await loadStudents();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loadStudents]);

  const calculateAge = (dateValue) => {
    if (!dateValue) return "";
    const birth = new Date(dateValue);
    if (isNaN(birth.getTime())) return "";

    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      years -= 1;
    }
    return years.toString();
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    const maxLengths = {
      studentName: 100,
    };

    if (maxLengths[field] && value.length > maxLengths[field]) {
      processedValue = value.slice(0, maxLengths[field]);
    }

    const numericConstraints = {
      mathScore: { min: 0, max: 60 },
      englishScore: { min: 0, max: 60 },
      finalYearScore: { min: 0, max: 280 },
      ministryExamPercentage: { min: 0, max: 100 },
    };

    if (numericConstraints[field]) {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        if (numericValue < numericConstraints[field].min) {
          processedValue = numericConstraints[field].min.toString();
        } else if (numericValue > numericConstraints[field].max) {
          processedValue = numericConstraints[field].max.toString();
        }
      }
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));

    if (error) setError("");
    if (success) setSuccess("");

    if (field === "dateOfBirth") {
      if (birthdateError) setBirthdateError("");

      setAge(calculateAge(value));

      if (value) {
        setTimeout(() => {
          const validation = validateDateOfBirth(value);
          setIsDobValid(validation === null);
        }, 500);
      } else {
        setAge("");
        setIsDobValid(null);
      }
    } else if (birthdateError) {
      setBirthdateError("");
    }
  };

  const handleDecimalScoreChange = (field, value, max) => {
    if (
      value === "" ||
      value === "." ||
      value.endsWith(".") ||
      /^\d*\.?\d*$/.test(value)
    ) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > max) {
        handleInputChange(field, String(max));
      } else {
        handleInputChange(field, value);
      }
    }
  };

  const validateDateOfBirth = (dateValue) => {
    const evaluation = evaluateDateOfBirth(dateValue);
    setBirthdateError(evaluation.error || "");
    setIsDobValid(evaluation.isValid);
    return evaluation.error;
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.studentName) errors.push("Student name is required");
    if (!formData.nationalId) errors.push("National ID is required");
    if (!formData.dateOfBirth) errors.push("Date of Birth is required");

    if (formData.studentName && formData.studentName.length > 100) {
      errors.push("Student name must be less than 100 characters");
    }

    if (
      isAcceptanceLetterReceived &&
      (!formData.ministryExamPercentage || formData.ministryExamPercentage === "")
    ) {
      errors.push("Please enter the Ministry Exam percentage");
    }

    if (isAcceptanceLetterReceived) {
      const percentage = parseFloat(formData.ministryExamPercentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors.push("Ministry Exam percentage must be between 0 and 100");
      }
    }

    const mathScore = parseFloat(formData.mathScore);
    const englishScore = parseFloat(formData.englishScore);
    const finalYearScore = parseFloat(formData.finalYearScore);

    if (isNaN(mathScore) || mathScore < 0 || mathScore > 60) {
      errors.push("Math score must be between 0 and 60");
    }

    if (isNaN(englishScore) || englishScore < 0 || englishScore > 60) {
      errors.push("English score must be between 0 and 60");
    }

    if (isNaN(finalYearScore) || finalYearScore < 0 || finalYearScore > 280) {
      errors.push("Final Prep score must be between 0 and 280");
    }

    return errors;
  };

  const resetForm = (clearMessages = true) => {
    setFormData(initialFormData);
    setIsAcceptanceLetterReceived(false);
    setBirthdateError("");
    setAge("");
    setIsDobValid(null);
    if (clearMessages) {
      setError("");
      setSuccess("");
    }
    setFormKey((prev) => prev + 1);
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError("");
    setSuccess("");

    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join("\n"));
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const dateValidationError = validateDateOfBirth(formData.dateOfBirth);
    if (dateValidationError) {
      setError(dateValidationError);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const dateOfBirth = new Date(formData.dateOfBirth);
      const dateOnlyString = dateOfBirth.toISOString().split("T")[0];

      const studentData = {
        studentName: formData.studentName,
        nationalId: formData.nationalId,
        mathScore: parseFloat(formData.mathScore),
        englishScore: parseFloat(formData.englishScore),
        finalYearScore: parseFloat(formData.finalYearScore),
        isAcceptanceLetterReceived: formData.ministryExamPercentage !== "" && formData.ministryExamPercentage !== null,
        ministryExamPercentage: formData.ministryExamPercentage !== "" && formData.ministryExamPercentage !== null
          ? parseFloat(formData.ministryExamPercentage)
          : 0,
        dateOfBirth: dateOnlyString,
      };

      await receptionCoordinatorAPI.registerStudent(studentData);

      setSuccess("Student registered successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });

      await loadStudents();
      resetForm(false);
      setError("");
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = "Failed to register student. Please try again.";

      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData?.errors) {
        errorMessage = Object.values(errorData.errors).flat().join('\n');
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData) {
        errorMessage = JSON.stringify(errorData);
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(239,49,49,0.12),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(239,49,49,0.08),transparent_30%),linear-gradient(to_bottom,#f8fafc,#f1f5f9)]">
      <Header />

      <div className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            to="/apply-options"
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("receptionCoordinatorToken");
            }}
            className="inline-flex items-center text-[#ef3131] hover:underline mb-8 font-medium"
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
            Back to Application Options
          </Link>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <Card className="border-0 shadow-2xl bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#ef3131] via-red-500 to-[#ef3131] text-white p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg
                        className="h-7 w-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-2xl md:text-3xl font-bold">
                        Register New Student
                      </CardTitle>
                      <p className="text-white/90 mt-1">
                        High-accuracy intake form for reception coordinators
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={async () => {
                      setIsStudentsModalOpen(true);
                      await loadStudents();
                    }}
                    className="bg-slate-900 text-white hover:bg-black rounded-full px-5"
                  >
                    Registered Students ({students.length})
                  </Button>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm text-white/90 mb-2">
                    <span>Form completion</span>
                    <span>{completionPercent}%</span>
                  </div>
                  <div className="h-2 bg-white/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/90">
                    <span className="px-2 py-1 rounded-full bg-white/15 border border-white/20">
                      `Ctrl+Enter` submit
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/15 border border-white/20">
                      `Alt+N` focus National ID
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/15 border border-white/20">
                      `Alt+R` open students list
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 md:p-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">{success}</p>
                  </div>
                )}

                <form ref={formRef} key={formKey} onSubmit={handleSubmit} className="space-y-7">
                  <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="studentName" className="text-base font-medium text-gray-700">
                          Student Name In Arabic:
                        </Label>
                        <Input
                          key={`studentName-${formKey}`}
                          id="studentName"
                          value={formData.studentName}
                          onChange={(e) => handleInputChange("studentName", e.target.value)}
                          placeholder="Enter student's full name"
                          className="mt-2 h-11 md:h-12 text-base bg-white"
                          validation={{ name: true }}
                          required
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <Label htmlFor="nationalId" className="text-base font-medium text-gray-700">
                          National ID:
                        </Label>
                        <Input
                          key={`nationalId-${formKey}`}
                          id="nationalId"
                          value={formData.nationalId}
                          onChange={(e) =>
                            handleInputChange(
                              "nationalId",
                              e.target.value.replace(/\D/g, "").slice(0, 14)
                            )
                          }
                          placeholder="Enter National ID (e.g., 14 digits)"
                          className="mt-2 h-11 md:h-12 text-base bg-white"
                          maxLength={14}
                          validation={{ nationalId: true }}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">{formData.nationalId.length}/14 digits</p>
                        {duplicateStudent && (
                          <p className="text-sm text-amber-700 mt-1">
                            Warning: this National ID already exists for {duplicateStudent.fullName || "a student"}.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="dateOfBirth" className="text-base font-medium text-gray-700">
                        Date of Birth:
                      </Label>
                      <div className="mt-2 flex items-center gap-3">
                        <Input
                          key={`dateOfBirth-${formKey}`}
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value) {
                              const result = validateDateOfBirth(e.target.value);
                              setIsDobValid(result === null);
                            }
                          }}
                          className="h-11 md:h-12 text-base bg-white"
                          required
                          max={new Date().toISOString().split("T")[0]}
                          validation={{
                            custom: (value) => {
                              if (!value) return true;
                              const validationError = evaluateDateOfBirth(value).error;
                              return validationError === null ? true : validationError;
                            },
                          }}
                          showValidation={true}
                          hideErrorMessage={true}
                        />
                        <input
                          id="age"
                          value={age}
                          readOnly
                          placeholder="Age"
                          aria-label="Age"
                          className={`${isDobValid === null
                              ? "border-gray-200"
                              : isDobValid
                                ? "border-green-400 focus:border-green-500 focus-visible:ring-green-500"
                                : "border-red-300 focus:border-red-500 focus-visible:ring-red-500"
                            } flex h-11 md:h-12 rounded-md border bg-white px-2 text-base text-center font-medium select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 w-14`}
                          style={{ width: "3.25rem" }}
                        />
                      </div>
                      {birthdateError && <p className="text-sm text-red-600 mt-1">{birthdateError}</p>}
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Scores</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="mathScore" className="text-base font-medium text-gray-700">
                          Math Score:
                        </Label>
                        <Input
                          key={`mathScore-${formKey}`}
                          id="mathScore"
                          type="text"
                          min="0"
                          max="60"
                          value={formData.mathScore}
                          onChange={(e) => handleDecimalScoreChange("mathScore", e.target.value, 60)}
                          placeholder="Enter Math score (0-60)"
                          className="mt-2 h-11 md:h-12 text-base bg-white"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">Allowed range: 0.0 to 60.0</p>
                      </div>

                      <div>
                        <Label htmlFor="englishScore" className="text-base font-medium text-gray-700">
                          English Score:
                        </Label>
                        <Input
                          key={`englishScore-${formKey}`}
                          id="englishScore"
                          type="text"
                          min="0"
                          max="60"
                          value={formData.englishScore}
                          onChange={(e) => handleDecimalScoreChange("englishScore", e.target.value, 60)}
                          placeholder="Enter English score (0-60)"
                          className="mt-2 h-11 md:h-12 text-base bg-white"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">Allowed range: 0.0 to 60.0</p>
                      </div>

                      <div>
                        <Label htmlFor="finalYearScore" className="text-base font-medium text-gray-700">
                          Final Prep Score:
                        </Label>
                        <Input
                          key={`finalYearScore-${formKey}`}
                          id="finalYearScore"
                          type="text"
                          min="0"
                          max="280"
                          value={formData.finalYearScore}
                          onChange={(e) => handleDecimalScoreChange("finalYearScore", e.target.value, 280)}
                          placeholder="Enter Final Prep score (0-280)"
                          className="mt-2 h-11 md:h-12 text-base bg-white"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">Allowed range: 0.0 to 280.0</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Verification</h3>

                    <div>
                      <Label htmlFor="ministryExamPercentage" className="text-base font-medium text-gray-700">
                        Ministry Exam Percentage:
                      </Label>
                      <Input
                        key={`ministryExamPercentage-${formKey}`}
                        id="ministryExamPercentage"
                        type="text"
                        min="0"
                        max="100"
                        value={formData.ministryExamPercentage}
                        onChange={(e) =>
                          handleDecimalScoreChange("ministryExamPercentage", e.target.value, 100)
                        }
                        placeholder="Enter Ministry Exam percentage (0-100)"
                        className="mt-2 h-11 md:h-12 text-base bg-white"
                      />
                      <p className="text-sm text-gray-500 mt-1">Allowed range: 0.00 to 100.00</p>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <Button
                      type="submit"
                      className="w-full bg-[#ef3131] hover:bg-red-600 h-12 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Registering Student...
                        </div>
                      ) : (
                        "Register Student"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 border-gray-300"
                      onClick={() => resetForm()}
                    >
                      Clear Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6 xl:sticky xl:top-24">
              <Card className="border border-red-100 shadow-sm bg-white">
                <CardContent className="p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-3">Submission Progress</h3>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ef3131] to-red-600 transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{completionPercent}% complete</p>
                  <p className="text-xs text-gray-500 mt-1">Date of birth status: {ageStatus}</p>
                </CardContent>
              </Card>

              <Card className="border border-indigo-100 shadow-sm bg-indigo-50/40">
                <CardContent className="p-5">
                  <h3 className="text-base font-bold text-indigo-900 mb-3">Identity Intelligence</h3>
                  {nationalIdInsights.isComplete ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-indigo-700">Gov. Code Insight</span>
                        <span className="font-semibold text-indigo-900">{nationalIdInsights.governorate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-700">DOB from National ID</span>
                        <span className="font-semibold text-indigo-900">
                          {nationalIdInsights.inferredDateString || "Invalid DOB segment"}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-indigo-200">
                        <p
                          className={`${nationalIdInsights.birthDateMatchesInput === null
                              ? "text-sm text-gray-600"
                              : nationalIdInsights.birthDateMatchesInput
                                ? "text-sm text-green-700 font-medium"
                                : "text-base text-amber-800 font-bold"
                            }`}
                        >
                          {nationalIdInsights.birthDateMatchesInput === null ? (
                            "Enter Date of Birth to validate consistency."
                          ) : nationalIdInsights.birthDateMatchesInput ? (
                            "National ID and Date of Birth are consistent."
                          ) : (
                            <span className="block rounded-md border border-amber-300 bg-amber-100 px-3 py-2">
                              National ID DOB segment does not match Date of Birth field.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Enter a full 14-digit National ID to unlock identity diagnostics.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-emerald-100 shadow-sm bg-emerald-50/40">
                <CardContent className="p-5">
                  <h3 className="text-base font-bold text-emerald-900 mb-3">Validation Radar</h3>
                  <div className="space-y-2">
                    {validationRadar.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-sm bg-white/70 border border-emerald-100 rounded-md px-3 py-2"
                      >
                        <span className="text-gray-700">{item.label}</span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.pass
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {item.pass ? "OK" : "Review"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
                  <Button
                    type="button"
                    onClick={async () => {
                      setIsStudentsModalOpen(true);
                      await loadStudents();
                    }}
                    className="w-full bg-[#ef3131] hover:bg-red-600"
                  >
                    Show Registered Students
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchQuery("");
                      loadStudents();
                    }}
                  >
                    Refresh Student List
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {isStudentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsStudentsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#ef3131] to-red-600 text-white">
              <div>
                <h3 className="text-lg font-semibold">Registered Students</h3>
                <p className="text-xs text-white/85">Search by student name or national ID</p>
              </div>
              <button
                onClick={() => setIsStudentsModalOpen(false)}
                className="text-white/90 hover:text-white text-xl leading-none"
                aria-label="Close"
              >
                x
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search by name or national ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef3131]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadStudents}
                  className="h-11 whitespace-nowrap"
                >
                  Refresh
                </Button>
              </div>

              <div className="max-h-[50vh] overflow-auto rounded-md border">
                {isLoadingStudents ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ef3131]"></div>
                    <span className="ml-2 text-gray-600">Loading students...</span>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="border-b">
                        <th className="py-3 px-3 font-semibold text-gray-700">Name</th>
                        <th className="py-3 px-3 font-semibold text-gray-700">National ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="py-2.5 px-3">{student.fullName || "-"}</td>
                          <td className="py-2.5 px-3 font-medium">{student.nationalId || "-"}</td>
                        </tr>
                      ))}
                      {!isLoadingStudents && filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan="2" className="py-8 text-center text-gray-500">
                            No students found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
              <p className="text-xs text-gray-600">Total loaded: {students.length}</p>
              <button
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                onClick={() => setIsStudentsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterStudentPage;
