"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { studentAPI } from "../utils/api";

const CheckNationalIdPage = () => {
  const [nationalId, setNationalId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const checkNationalId = async () => {
    if (nationalId.length !== 14) {
      setError("National ID must be 14 digits");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await studentAPI.validateNationalId(nationalId);

      // Store the National ID for the next step
      localStorage.setItem("studentNationalId", nationalId);

      // Always navigate to complete student info page
      // The page will handle whether to show read-only or editable form
      setSuccess("تم العثور على الرقم القومي! جاري التوجيه لإكمال معلوماتك...");

      // Redirect to student info form after a short delay
      setTimeout(() => {
        navigate("/complete-student-info");
      }, 2000);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(
          "National ID not found in our records. Please visit our school to enroll your information first."
        );
      } else {
        setError(
          err.response?.data ||
          "Failed to validate National ID. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="py-12">
        <div className="max-w-md mx-auto px-4">
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

          <Card className="border-0 smooth-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-[#ef3131]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Check Your Information
              </CardTitle>
              <p className="text-gray-600 font-light">
                Enter your National ID to check if your information exists in
                our system
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="nationalId" className="text-base font-medium">
                  National ID
                </Label>
                <Input
                  id="nationalId"
                  value={nationalId}
                  onChange={(e) =>
                    setNationalId(
                      e.target.value.replace(/\D/g, "").slice(0, 14)
                    )
                  }
                  placeholder="Enter your 14-digit National ID"
                  className="mt-2 h-12 text-lg"
                  maxLength={14}
                  validation={{ nationalId: true }}
                  showValidation={true}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {nationalId.length}/14 digits
                </p>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <svg
                    className="h-4 w-4 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <AlertDescription className="text-red-700 font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <svg
                    className="h-4 w-4 text-green-600"
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
                  <AlertDescription className="text-green-700 font-medium">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={checkNationalId}
                className="w-full bg-[#ef3131] hover:bg-red-600 h-12 text-lg font-semibold rounded-full"
                disabled={nationalId.length !== 14 || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Checking...
                  </div>
                ) : (
                  "Check & Continue"
                )}
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-gray-600 text-sm mb-4">
                  Don't have your information registered yet?
                </p>
                <Link to="/apply-options">
                  <Button
                    variant="outline"
                    className="border-[#ef3131] text-[#ef3131] hover:bg-[#ef3131] hover:text-white bg-transparent"
                  >
                    Visit Our School to Enroll
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckNationalIdPage;
