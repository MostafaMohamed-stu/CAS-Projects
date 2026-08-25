import { logoutFromAdmission } from "../utils/casAuth";
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Alert, AlertDescription } from "../components/ui/Alert";
import { examAPI } from "../utils/api";
import * as XLSX from "xlsx";
import { ArrowLeft } from "lucide-react";

const ExcelUploadPage = () => {
  const navigate = useNavigate();
  const { adminToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [userInfo, setUserInfo] = useState({ fullName: "", role: "" });

  useEffect(() => {
    // Check if admin is authenticated
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(adminToken.split(".")[1]));
      setUserInfo({
        fullName: payload.fullName || payload.FullName || "",
        role: payload.role || payload.Role || "",
      });
    } catch {
      setUserInfo({ fullName: "", role: "SuperAdmin" });
    }
  }, [adminToken, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".xlsx")) {
        setError("Please select an Excel file (.xlsx)");
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size too large. Maximum size is 10MB.");
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError("");
      setSuccess("");
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await examAPI.importQuestions(formData);

      setSuccess("Questions imported successfully!");
      setUploadResult(response.data);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById("excel-file");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access denied. Only SuperAdmin can upload exam questions.");
      } else if (err.response?.status === 401) {
        setError("Authentication required. Please log in again.");
        navigate("/admin/login");
      } else {
        setError(
          err.response?.data || "Failed to upload file. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template structure with proper Arabic characters
    const templateData = [
      [
        "Question Title",
        "Choice 1",
        "Choice 2",
        "Choice 3",
        "Choice 4",
        "Correct Answer",
        "Section",
      ],
          // English Math Questions (MathEN)
    ["What is 2 + 2?", "3", "4", "5", "6", "4", "MathEN"],
    ["What is 5 Ã— 3?", "12", "15", "18", "20", "15", "MathEN"],
    ["What is 10 Ã· 2?", "3", "4", "5", "6", "5", "MathEN"],
    ["What is the square root of 16?", "2", "4", "8", "16", "4", "MathEN"],
    ["What is 7 Ã— 8?", "49", "56", "63", "64", "56", "MathEN"],

      // Arabic Math Questions (MathAR)
      ["Ù…Ø§ Ù‡Ùˆ Ù†Ø§ØªØ¬ Ù¢ + Ù£ØŸ", "Ù¤", "Ù¥", "Ù¦", "Ù§", "Ù¥", "MathAR"],
      ["Ù…Ø§ Ù‡Ùˆ Ù†Ø§ØªØ¬ Ù¤ Ã— Ù¢ØŸ", "Ù¦", "Ù¨", "Ù¡Ù ", "Ù¡Ù¢", "Ù¨", "MathAR"],
      ["Ù…Ø§ Ù‡Ùˆ Ù†Ø§ØªØ¬ Ù¡Ù  Ã· Ù¢ØŸ", "Ù£", "Ù¤", "Ù¥", "Ù¦", "Ù¥", "MathAR"],
      ["Ù…Ø§ Ù‡Ùˆ Ø§Ù„Ø¬Ø°Ø± Ø§Ù„ØªØ±Ø¨ÙŠØ¹ÙŠ Ù„Ù€ Ù¢Ù¥ØŸ", "Ù£", "Ù¤", "Ù¥", "Ù¦", "Ù¥", "MathAR"],
      ["Ù…Ø§ Ù‡Ùˆ Ù†Ø§ØªØ¬ Ù¦ Ã— Ù§ØŸ", "Ù£Ù¦", "Ù¤Ù¢", "Ù¤Ù¨", "Ù¥Ù¤", "Ù¤Ù¢", "MathAR"],

      // English Language Questions
      [
        "Choose the correct verb form: He _____ to school.",
        "go",
        "goes",
        "going",
        "gone",
        "goes",
        "English",
      ],
      [
        "What is the past tense of 'run'?",
        "runs",
        "running",
        "ran",
        "runned",
        "ran",
        "English",
      ],
      [
        "Choose the correct article: _____ apple is red.",
        "A",
        "An",
        "The",
        "None",
        "An",
        "English",
      ],
      [
        "What is the plural of 'child'?",
        "childs",
        "children",
        "childes",
        "child's",
        "children",
        "English",
      ],
      [
        "Choose the correct pronoun: _____ is my book.",
        "Me",
        "I",
        "This",
        "That",
        "This",
        "English",
      ],

      // Arabic Language Questions
      [
        "Ù…Ø§ Ù‡Ùˆ Ø¬Ù…Ø¹ ÙƒÙ„Ù…Ø© 'ÙƒØªØ§Ø¨'ØŸ",
        "ÙƒØªØ¨",
        "ÙƒØªØ§Ø¨Ø§Øª",
        "ÙƒØªØ§Ø¨ÙˆÙ†",
        "ÙƒØªØ§Ø¨ÙŠÙ†",
        "ÙƒØªØ¨",
        "Arabic",
      ],
      [
        "Ù…Ø§ Ù‡Ùˆ Ù…ÙØ±Ø¯ ÙƒÙ„Ù…Ø© 'Ø£Ù‚Ù„Ø§Ù…'ØŸ",
        "Ù‚Ù„Ù…",
        "Ù‚Ù„Ø§Ù…",
        "Ø£Ù‚Ù„Ø§Ù…",
        "Ù‚Ù„Ù…ÙˆÙ†",
        "Ù‚Ù„Ù…",
        "Arabic",
      ],
      [
        "Ù…Ø§ Ù‡Ùˆ Ø¬Ù…Ø¹ ÙƒÙ„Ù…Ø© 'Ø·Ø§Ù„Ø¨'ØŸ",
        "Ø·Ù„Ø§Ø¨",
        "Ø·Ù„Ø¨Ø§Øª",
        "Ø·Ø§Ù„Ø¨ÙˆÙ†",
        "Ø·Ø§Ù„Ø¨ÙŠÙ†",
        "Ø·Ù„Ø§Ø¨",
        "Arabic",
      ],
      [
        "Ù…Ø§ Ù‡Ùˆ Ù…ÙØ±Ø¯ ÙƒÙ„Ù…Ø© 'Ù…Ø¯Ø§Ø±Ø³'ØŸ",
        "Ù…Ø¯Ø±Ø³Ø©",
        "Ù…Ø¯Ø§Ø±Ø³",
        "Ù…Ø¯Ø±Ø³ÙˆÙ†",
        "Ù…Ø¯Ø±Ø³ÙŠÙ†",
        "Ù…Ø¯Ø±Ø³Ø©",
        "Arabic",
      ],
      [
        "Ù…Ø§ Ù‡Ùˆ Ø¬Ù…Ø¹ ÙƒÙ„Ù…Ø© 'Ù…Ø¹Ù„Ù…'ØŸ",
        "Ù…Ø¹Ù„Ù…ÙˆÙ†",
        "Ù…Ø¹Ù„Ù…ÙŠÙ†",
        "Ù…Ø¹Ù„Ù…Ø§Øª",
        "Ù…Ø¹Ù„Ù…",
        "Ù…Ø¹Ù„Ù…ÙˆÙ†",
        "Arabic",
      ],

      // Software Questions
      [
        "What is HTML?",
        "A programming language",
        "A markup language",
        "A database",
        "An operating system",
        "A markup language",
        "Software",
      ],
      [
        "What is CSS used for?",
        "Database management",
        "Styling web pages",
        "Server programming",
        "Mobile app development",
        "Styling web pages",
        "Software",
      ],
      [
        "What is JavaScript?",
        "A markup language",
        "A programming language",
        "A database",
        "An operating system",
        "A programming language",
        "Software",
      ],
      [
        "What is a database?",
        "A programming language",
        "A markup language",
        "A collection of organized data",
        "An operating system",
        "A collection of organized data",
        "Software",
      ],
      [
        "What is an API?",
        "A programming language",
        "A markup language",
        "A database",
        "Application Programming Interface",
        "Application Programming Interface",
        "Software",
      ],

      // IQ Questions
      [
        "Which number comes next: 2, 4, 8, 16, ?",
        "18",
        "24",
        "32",
        "34",
        "32",
        "IQ",
      ],
      [
        "Which item does not belong?",
        "Triangle",
        "Square",
        "Circle",
        "Cube",
        "Cube",
        "IQ",
      ],
      [
        "If all roses are flowers, which statement must be true?",
        "All flowers are roses",
        "Some roses are not flowers",
        "Every rose is a flower",
        "No flowers are roses",
        "Every rose is a flower",
        "IQ",
      ],
      [
        "Complete the pattern: A, C, E, G, ?",
        "H",
        "I",
        "J",
        "K",
        "I",
        "IQ",
      ],
      [
        "A clock shows 3:00. What is the angle between its hands?",
        "30 degrees",
        "60 degrees",
        "90 degrees",
        "120 degrees",
        "90 degrees",
        "IQ",
      ],
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 40 }, // Question Title
      { wch: 20 }, // Choice 1
      { wch: 20 }, // Choice 2
      { wch: 20 }, // Choice 3
      { wch: 20 }, // Choice 4
      { wch: 20 }, // Correct Answer
      { wch: 15 }, // Section
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Exam Questions Template"
    );

    // Generate XLSX file with proper encoding for Arabic characters
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      bookSST: false,
      compression: true,
    });

    // Create and download file
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exam_questions_template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef3131] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-40 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#ef3131]">
                Super Admin Dashboard
              </h1>
              {userInfo.fullName && (
                <p className="mt-1 text-sm text-gray-600">
                  Welcome {userInfo.fullName} ({userInfo.role})
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/super-admin/dashboard")}
                className="border-gray-400 text-gray-800 hover:bg-gray-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  logoutFromAdmission();
                }}
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Exam Questions
            </h1>
            <p className="text-gray-600">
              Upload an Excel file containing exam questions with support for
              Arabic characters. Only SuperAdmin users can access this feature.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="border-0 smooth-shadow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Upload Excel File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-700">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <label
                    htmlFor="excel-file"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Excel File (.xlsx) - Supports Arabic Characters
                  </label>
                  <input
                    id="excel-file"
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ef3131] file:text-white hover:file:bg-red-600 file:cursor-pointer"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum file size: 10MB
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isLoading}
                    className="flex-1 bg-[#ef3131] hover:bg-red-600"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </div>
                    ) : (
                      "Upload Questions"
                    )}
                  </Button>

                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="border-gray-300 hover:border-[#ef3131] hover:text-[#ef3131]"
                  >
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Instructions Section */}
            <Card className="border-0 smooth-shadow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Excel File Format
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Your Excel file should have the following columns:
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-mono space-y-1">
                      <div>
                        <strong>Column A:</strong> Question Title
                      </div>
                      <div>
                        <strong>Column B:</strong> Choice 1
                      </div>
                      <div>
                        <strong>Column C:</strong> Choice 2
                      </div>
                      <div>
                        <strong>Column D:</strong> Choice 3
                      </div>
                      <div>
                        <strong>Column E:</strong> Choice 4
                      </div>
                      <div>
                        <strong>Column F:</strong> Correct Answer
                      </div>
                      <div>
                        <strong>Column G:</strong> Section Name
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Important Notes
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>â€¢ First row should be headers (will be skipped)</li>
                    <li>â€¢ Section values must match an existing section</li>
                    <li>â€¢ Empty rows will be ignored</li>
                    <li>
                      â€¢ Questions will be assigned to sections based on Column G
                    </li>
                    <li>
                      â€¢ Arabic characters are fully supported in the template
                    </li>
                    <li>â€¢ Use MathEN section for English math questions</li>
                    <li>â€¢ Use MathAR section for Arabic math questions</li>
                    <li>â€¢ Use IQ section for intelligence questions</li>
                    <li>â€¢ Only SuperAdmin users can upload questions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Supported Section Values
                  </h3>
                  <div className="text-sm text-gray-600">
                    <div className="grid grid-cols-2 gap-2">
                      <div>â€¢ Arabic (Arabic)</div>
                      <div>â€¢ English (English)</div>
                      <div>â€¢ MathEN (English)</div>
                      <div>â€¢ MathAR (Arabic)</div>
                      <div>â€¢ Software (English)</div>
                      <div>â€¢ IQ (Language-neutral)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <Card className="mt-8 border-0 smooth-shadow">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResult.importedCount}
                    </div>
                    <div className="text-sm text-green-700">
                      Questions Imported
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadResult.questions?.length || 0}
                    </div>
                    <div className="text-sm text-blue-700">
                      Sections Created
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {
                        new Set(
                          uploadResult.questions?.map((q) => q.sectionName) ||
                            []
                        ).size
                      }
                    </div>
                    <div className="text-sm text-purple-700">
                      Unique Sections
                    </div>
                  </div>
                </div>

                {uploadResult.questions &&
                  uploadResult.questions.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Imported Questions Preview
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                        {uploadResult.questions
                          .slice(0, 5)
                          .map((question, index) => (
                            <div
                              key={index}
                              className="mb-3 p-3 bg-white rounded border"
                            >
                              <div className="font-medium text-sm text-gray-900">
                                {question.questionTitle}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Section: {question.sectionName}
                              </div>
                            </div>
                          ))}
                        {uploadResult.questions.length > 5 && (
                          <div className="text-sm text-gray-500 text-center">
                            ... and {uploadResult.questions.length - 5} more
                            questions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExcelUploadPage;

