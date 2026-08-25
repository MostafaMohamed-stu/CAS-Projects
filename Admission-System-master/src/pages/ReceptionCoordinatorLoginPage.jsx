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
import { authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const ReceptionCoordinatorLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginReceptionCoordinator } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.receptionCoordinatorLogin({ email, password });

      // Store the token and update auth context
      loginReceptionCoordinator(response.data.token);

      // Redirect to student registration
      navigate("/reception-coordinator/register-student");
    } catch (err) {
      console.error("Login error:", err);
      // Handle different error response formats
      let errorMessage = "Invalid email or password";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.Message) {
          errorMessage = err.response.data.Message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="py-8 md:py-12">
        <div className="max-w-md mx-auto px-4">
          <Link
            to="/apply-options"
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("receptionCoordinatorToken");
            }}
            className="inline-flex items-center text-[#ef3131] hover:underline mb-6 md:mb-8 font-medium"
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
            <CardHeader className="text-center pb-6 md:pb-8">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ef3131]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg
                  className="h-8 w-8 md:h-10 md:w-10 text-[#ef3131]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                Reception Coordinator Login
              </CardTitle>
              <p className="text-gray-600 font-light mt-2">
                Access the applicant registration system
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reception@elsewedy-school.edu.eg"
                    className="mt-2 h-11 md:h-12"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-base font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-2 h-11 md:h-12"
                    required
                  />
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700 font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#ef3131] hover:bg-red-600 h-11 md:h-12 text-base md:text-lg font-semibold rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
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

export default ReceptionCoordinatorLoginPage;
