"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { studentAPI } from "../utils/api";
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
import Footer from "../components/layout/Footer";

const ApplyPage = () => {
  const [nationalId, setNationalId] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    location: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    previousSchool: "",
    mathGrade: "",
    englishGrade: "",
    arabicGrade: "",
  });

  const validateNationalId = async () => {
    if (nationalId.length !== 14) {
      setError("National ID must be 14 digits");
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      // Call the real API to validate the National ID
      const response = await studentAPI.validateNationalId(nationalId);
      setIsValidated(true);
      setError("");
      // Store the student data for the next step
      localStorage.setItem("studentData", JSON.stringify(response.data));
    } catch (err) {
      console.error("Validation error:", err);
      if (err.response?.status === 404) {
        setError(
          "National ID not found in our records. Please contact administration."
        );
      } else {
        setError(
          err.response?.data ||
            "Failed to validate National ID. Please try again."
        );
      }
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In real app, this would submit to backend
    alert(
      "Application submitted successfully! You will receive an email with exam details."
    );
  };

  if (!isValidated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-12">
          <div className="max-w-md mx-auto px-4">
            <Link
              to="/"
              className="inline-flex items-center text-[#ef3131] hover:underline mb-6"
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
              Back to Home
            </Link>

            <Card>
              <CardHeader>
                <CardTitle className="text-center text-[#ef3131]">
                  Student Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input
                      id="nationalId"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="Enter your 14-digit National ID"
                      maxLength={14}
                      validation={{ nationalId: true }}
                      showValidation={true}
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={validateNationalId}
                    className="w-full bg-[#ef3131] hover:bg-red-600"
                  >
                    Validate ID
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center text-[#ef3131] hover:underline mb-6"
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
            Back to Home
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-[#ef3131]">
                Application Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Enter your full name"
                        validation={{ name: true }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          handleInputChange("dateOfBirth", e.target.value)
                        }
                        validation={{
                          date: true,
                          pastDate: true,
                          custom: (value) => {
                            if (!value) return true;
                            const age =
                              new Date().getFullYear() -
                              new Date(value).getFullYear();
                            return age >= 5 && age <= 18
                              ? true
                              : "Student must be between 5 and 18 years old";
                          },
                        }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder="Enter your phone number"
                        validation={{ phone: true }}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      placeholder="Enter your full location"
                      validation={{ minLength: 10, maxLength: 200 }}
                      required
                    />
                  </div>
                </div>

                {/* Parent Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Parent/Guardian Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parentName">Parent/Guardian Name</Label>
                      <Input
                        id="parentName"
                        value={formData.parentName}
                        onChange={(e) =>
                          handleInputChange("parentName", e.target.value)
                        }
                        placeholder="Enter parent/guardian full name"
                        validation={{ name: true }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="parentPhone">Parent Phone</Label>
                      <Input
                        id="parentPhone"
                        type="tel"
                        value={formData.parentPhone}
                        onChange={(e) =>
                          handleInputChange("parentPhone", e.target.value)
                        }
                        placeholder="Enter parent phone number"
                        validation={{ phone: true }}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) =>
                          handleInputChange("parentEmail", e.target.value)
                        }
                        placeholder="Enter parent email address"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Academic Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="previousSchool">Previous School</Label>
                      <Input
                        id="previousSchool"
                        value={formData.previousSchool}
                        onChange={(e) =>
                          handleInputChange("previousSchool", e.target.value)
                        }
                        placeholder="Enter your previous school name"
                        validation={{ minLength: 2, maxLength: 100 }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="mathGrade">Math Grade (Third Prep)</Label>
                      <Input
                        id="mathGrade"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.mathGrade}
                        onChange={(e) =>
                          handleInputChange("mathGrade", e.target.value)
                        }
                        placeholder="Enter math grade (0-100)"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="englishGrade">
                        English Grade (Third Prep)
                      </Label>
                      <Input
                        id="englishGrade"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.englishGrade}
                        onChange={(e) =>
                          handleInputChange("englishGrade", e.target.value)
                        }
                        placeholder="Enter English grade (0-100)"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="arabicGrade">
                        Arabic Grade (Third Prep)
                      </Label>
                      <Input
                        id="arabicGrade"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.arabicGrade}
                        onChange={(e) =>
                          handleInputChange("arabicGrade", e.target.value)
                        }
                        placeholder="Enter Arabic grade (0-100)"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#ef3131] hover:bg-red-600"
                >
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ApplyPage;
