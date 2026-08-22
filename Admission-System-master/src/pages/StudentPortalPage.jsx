"use client";

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Alert, AlertDescription } from "../components/ui/Alert";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { studentAPI } from "../utils/api";
import { buildExamBlueprint } from "../utils/studentExperience";

const STATUS_STYLES = {
  Accepted: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Waitlisted: "bg-amber-100 text-amber-700 border-amber-200",
  Pending: "bg-blue-100 text-blue-700 border-blue-200",
};

const normalizeNationalId = (value = "") => value.replace(/\D/g, "").slice(0, 14);

const StudentPortalPage = () => {
  const navigate = useNavigate();
  const [nationalId, setNationalId] = useState(localStorage.getItem("lastStudentNationalId") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [portalData, setPortalData] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const stageList = useMemo(() => {
    if (!portalData) return [];
    const s = portalData.stageProgress;
    return [
      { key: "registered", label: "Registration", done: s.registered },
      { key: "profileCompleted", label: "Profile Completed", done: s.profileCompleted },
      { key: "examCompleted", label: "Exam Submitted", done: s.examCompleted },
      {
        key: "interviews",
        label: "Interviews",
        done: s.interviewsCompletedCount >= s.interviewsExpectedCount,
        detail: `${s.interviewsCompletedCount}/${s.interviewsExpectedCount}`,
      },
      { key: "finalDecisionPublished", label: "Final Decision", done: s.finalDecisionPublished },
    ];
  }, [portalData]);

  const stagePercent = useMemo(() => {
    if (!stageList.length) return 0;
    const doneCount = stageList.filter((stage) => stage.done).length;
    return Math.round((doneCount / stageList.length) * 100);
  }, [stageList]);

  const examSectionsData = useMemo(() => {
    if (!portalData?.exam?.sections) return [];
    return Object.entries(portalData.exam.sections).map(([name, score]) => ({ name, score }));
  }, [portalData]);

  const examBlueprint = useMemo(() => buildExamBlueprint(portalData), [portalData]);

  const loadPortal = async (idOverride) => {
    const targetNationalId = normalizeNationalId(idOverride ?? nationalId);
    if (targetNationalId.length !== 14) {
      setError("National ID must be exactly 14 digits.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await studentAPI.getPortal(targetNationalId);
      setPortalData(response.data);
      setNationalId(targetNationalId);
      localStorage.setItem("lastStudentNationalId", targetNationalId);
      setLastSyncedAt(new Date());
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Student not found. Please check your National ID.");
      } else {
        setError(err.response?.data || "Failed to load student portal.");
      }
      setPortalData(null);
      setLastSyncedAt(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      <Header />

      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            to="/apply-options"
            className="inline-flex items-center text-[#ef3131] hover:underline mb-6 font-medium"
          >
            Back to Application Options
          </Link>

          <Card className="border-0 shadow-xl mb-6">
            <CardHeader className="bg-gradient-to-r from-[#ef3131] to-red-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Student Intelligence Portal</CardTitle>
              <p className="text-red-100 text-sm">
                Track admission status, progress timeline, exam analytics, and profile completion.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <Label htmlFor="nationalId" className="text-base font-medium">
                    National ID
                  </Label>
                  <Input
                    id="nationalId"
                    value={nationalId}
                    onChange={(e) => setNationalId(normalizeNationalId(e.target.value))}
                    className="mt-2 h-12 text-lg"
                    placeholder="Enter 14-digit National ID"
                    maxLength={14}
                    validation={{ nationalId: true }}
                    showValidation={true}
                  />
                  <p className="text-sm text-gray-500 mt-1">{nationalId.length}/14 digits</p>
                  {lastSyncedAt && (
                    <p className="text-xs text-gray-500 mt-1">Last synced: {lastSyncedAt.toLocaleString()}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => loadPortal()}
                    disabled={isLoading || nationalId.length !== 14}
                    className="h-12 px-8 bg-[#ef3131] hover:bg-red-600 rounded-full"
                  >
                    {isLoading ? "Loading..." : "Load Portal"}
                  </Button>
                  <Button
                    onClick={() => loadPortal(portalData?.student?.nationalId || nationalId)}
                    variant="outline"
                    className="h-12"
                    disabled={isLoading || nationalId.length !== 14}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {portalData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <Card className="xl:col-span-2">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{portalData.student.fullName}</h2>
                        <p className="text-sm text-gray-600 mt-1">National ID: {portalData.student.nationalId}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                          STATUS_STYLES[portalData.student.status.text] || STATUS_STYLES.Pending
                        }`}
                      >
                        {portalData.student.status.text}
                      </span>
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ef3131] to-red-600"
                        style={{ width: `${stagePercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#ef3131]">
                      Pipeline Completion: {stagePercent}%
                    </p>
                    <p className="mt-2 text-sm text-gray-700">Next Action: {portalData.insights.nextAction}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-500">Exam Score</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {portalData.exam.total}/{portalData.exam.max}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{portalData.exam.percentage}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-500">Interview Progress</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {portalData.interviews.count}/{portalData.interviews.expected}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Avg: {portalData.interviews.average}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Stage Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {stageList.map((stage) => (
                        <div
                          key={stage.key}
                          className={`rounded-lg border p-3 text-center ${
                            stage.done ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <p className="text-xs text-gray-500">{stage.label}</p>
                          <p
                            className={`text-sm font-semibold mt-2 ${
                              stage.done ? "text-green-700" : "text-gray-600"
                            }`}
                          >
                            {stage.done ? "Done" : "Pending"}
                          </p>
                          {stage.detail && <p className="text-xs text-gray-600 mt-1">{stage.detail}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Action Center</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => navigate("/check-national-id")}
                      variant="outline"
                      className="w-full border-[#ef3131] text-[#ef3131] hover:bg-[#ef3131] hover:text-white"
                    >
                      Complete/Review Profile
                    </Button>
                    <Button
                      onClick={() => navigate("/verify-student")}
                      variant="outline"
                      className="w-full border-[#ef3131] text-[#ef3131] hover:bg-[#ef3131] hover:text-white"
                    >
                      Verify For Exam
                    </Button>
                    <Button onClick={() => navigate("/contact")} variant="outline" className="w-full">
                      Contact Admission Team
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Exam Section Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={examSectionsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 15]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#ef3131">
                          {examSectionsData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={["#ef3131", "#e11d48", "#f97316", "#b91c1c"][index % 4]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="text-xs text-gray-600 mt-2">
                      Cohort Avg: {portalData.exam.benchmark.cohortAverageTotal} | Percentile:{" "}
                      {portalData.exam.benchmark.percentileRank}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preparation Blueprint</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {examBlueprint.map((section) => (
                      <div key={section.name} className="rounded-lg border px-3 py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{section.name}</p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              section.priority === "Critical"
                                ? "bg-red-100 text-red-700"
                                : section.priority === "Improve"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {section.priority}
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              section.priority === "Critical"
                                ? "bg-red-500"
                                : section.priority === "Improve"
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${section.scorePercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Score: {section.score}/{section.maxScore} ({section.scorePercent}%) | Suggested weekly focus:{" "}
                          {section.weeklyHours} hour(s)
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Gap Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portalData.profile.missingFields.length > 0 ? (
                      <ul className="space-y-2 text-sm">
                        {portalData.profile.missingFields.map((field) => (
                          <li key={field} className="flex items-center text-amber-700">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2" />
                            {field}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-green-700 text-sm font-medium">
                        Profile is complete. No missing required fields.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Uploaded {portalData.documents.uploadedCount} of {portalData.documents.totalCount} optional
                      documents.
                    </p>
                    <div className="space-y-2">
                      {portalData.documents.items.map((doc) => (
                        <div key={doc.key} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                          <span>{doc.label}</span>
                          <span className={doc.uploaded ? "text-green-700 font-semibold" : "text-gray-500"}>
                            {doc.uploaded ? "Uploaded" : "Not Uploaded"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StudentPortalPage;
