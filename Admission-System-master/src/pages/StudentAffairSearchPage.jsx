"use client";

import { useState, useEffect, useRef } from "react";
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
import { studentAffairAPI } from "../utils/api";
import { logoutFromAdmission } from "../utils/casAuth";

const StudentAffairSearchPage = () => {
  const [searchMode, setSearchMode] = useState("nationalId"); // "nationalId" | "name"
  const [nationalId, setNationalId] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [nameSearchResults, setNameSearchResults] = useState([]);
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ fullName: "", role: "" });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get user info from JWT token
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserInfo({
          fullName: payload.fullName || payload.FullName || "",
          role: payload.role || payload.Role || "",
        });
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search by name
  useEffect(() => {
    if (searchMode !== "name" || !nameQuery.trim()) {
      setNameSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingName(true);
      try {
        const response = await studentAffairAPI.searchByName(nameQuery.trim());
        setNameSearchResults(response.data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Failed to search students by name:", err);
      } finally {
        setIsSearchingName(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [nameQuery, searchMode]);

  const executeSearch = async (targetNationalId) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await studentAffairAPI.searchStudent(targetNationalId);
      navigate("/student-affair/edit", {
        state: {
          studentData: response.data,
          nationalId: targetNationalId,
        },
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No student found with this national ID.");
      } else {
        setError(
          err.response?.data ||
          "Failed to search for student. Please try again."
        );
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!nationalId.trim()) {
      setError("Please enter a National ID");
      return;
    }
    await executeSearch(nationalId.trim());
  };

  const handleSelectStudent = (selectedNationalId) => {
    setShowDropdown(false);
    setNationalId(selectedNationalId);
    executeSearch(selectedNationalId);
  };

  const handleLogout = () => {
    logoutFromAdmission();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-12">
        <div className="max-w-md mx-auto px-4">
          {userInfo.fullName && (
            <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-700 text-center">
                Welcome <span className="font-semibold">{userInfo.fullName}</span> ({userInfo.role})
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <Link
              to="/admin/login"
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
              Back to Login
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>

          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-center text-[#ef3131]">
                Student Affair Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Mode Toggle */}
              <div className="flex rounded-lg bg-gray-100 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode("nationalId");
                    setError("");
                    setShowDropdown(false);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                    searchMode === "nationalId"
                      ? "bg-white text-[#ef3131] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Search by National ID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode("name");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                    searchMode === "name"
                      ? "bg-white text-[#ef3131] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Search by Name
                </button>
              </div>

              <div className="space-y-4">
                {searchMode === "nationalId" ? (
                  <div>
                    <Label htmlFor="nationalId">Student National ID</Label>
                    <Input
                      id="nationalId"
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="Enter 14-digit National ID"
                      maxLength={14}
                      validation={{ nationalId: true }}
                      showValidation={true}
                    />
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <Label htmlFor="nameQuery">Student Name</Label>
                    <div className="relative mt-1">
                      <Input
                        id="nameQuery"
                        type="text"
                        value={nameQuery}
                        onChange={(e) => setNameQuery(e.target.value)}
                        onFocus={() => {
                          if (nameSearchResults.length > 0) setShowDropdown(true);
                        }}
                        placeholder="Type name (e.g. يوسف)"
                        className="pr-9"
                      />
                      {isSearchingName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#ef3131]"></div>
                        </div>
                      )}
                    </div>

                    {/* Auto-complete Dropdown */}
                    {showDropdown && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                        {nameSearchResults.length > 0 ? (
                          <div className="py-1 divide-y divide-gray-100">
                            {nameSearchResults.map((student) => (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => handleSelectStudent(student.nationalId)}
                                className="w-full text-left px-4 py-3 hover:bg-red-50/60 transition-colors flex justify-between items-center group"
                              >
                                <div>
                                  <p className="font-semibold text-gray-900 group-hover:text-[#ef3131] text-sm">
                                    {student.fullName}
                                  </p>
                                  <p className="text-xs text-gray-500 font-mono">
                                    ID: {student.nationalId}
                                  </p>
                                </div>
                                <span className="text-xs font-medium text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Select →
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No matching students found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {searchMode === "nationalId" && (
                  <Button
                    onClick={handleSearch}
                    className="w-full bg-[#ef3131] hover:bg-red-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Searching...
                      </div>
                    ) : (
                      "Search Student"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentAffairSearchPage;
