"use client";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Label from "../components/ui/Label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { RadioGroup, RadioGroupItem } from "../components/ui/RadioGroup";
import { examAPI } from "../utils/api";
import {
  resolveExamRemainingSeconds,
  shouldAutoSubmitFromTimer,
} from "../utils/examTimer";

const GetExamPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [examData, setExamData] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [savedPosition, setSavedPosition] = useState(null); // Save position before validation
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showFullScreenWarning, setShowFullScreenWarning] = useState(false);
  const [showCoordinatorExtension, setShowCoordinatorExtension] = useState(false);
  const [coordinatorEmail, setCoordinatorEmail] = useState("");
  const [coordinatorPassword, setCoordinatorPassword] = useState("");
  const [extensionMinutes, setExtensionMinutes] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use ref to store current answers for timer access
  const answersRef = useRef({});
  const autoSubmitTriggeredRef = useRef(false);
  const timerObservedPositiveRef = useRef(false);
  const autoSubmitHandlerRef = useRef(null);

  // Calculate progress
  const progress = examData
    ? (() => {
      const totalQuestions = examData.sections.reduce(
        (sum, section) =>
          sum + (examData.questionsData[section.sectionName]?.length || 0),
        0
      );
      const answeredQuestions = Object.keys(answers).length;
      return totalQuestions > 0
        ? (answeredQuestions / totalQuestions) * 100
        : 0;
    })()
    : 0;

  // Check authentication
  useEffect(() => {
    const nationalId = localStorage.getItem("studentNationalId");
    const examToken = localStorage.getItem("examToken");

    if (!nationalId || !examToken) {
      navigate("/verify-student");
      return;
    }

    // Load exam data
    loadExamData();
  }, [navigate]);

  // Update answers ref when answers state changes
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const loadExamData = async () => {
    try {
      setIsLoading(true);

      // Get student's national ID
      const nationalId = localStorage.getItem("studentNationalId");
      if (!nationalId) {
        setError("Student information not found. Please start over.");
        return;
      }

      // Get sections with school type logic
      const sectionsResponse = await examAPI.getSectionsWithSchoolType(
        nationalId
      );
      const sections = sectionsResponse.data.sections;
      const schoolType = sectionsResponse.data.schoolType;
      const examDurationMinutes =
        Number(sectionsResponse.data.examDurationMinutes) || 60;

      // Get questions for each section with school type logic
      const questionsData = {};

      for (const section of sections) {
        const questionsResponse =
          await examAPI.getQuestionsBySectionWithSchoolType(
            section.sectionName,
            nationalId
          );
        questionsData[section.sectionName] = questionsResponse.data.questions;
      }

      const remainingSeconds = resolveExamRemainingSeconds(
        sectionsResponse.data,
        examDurationMinutes
      );

      autoSubmitTriggeredRef.current = false;
      timerObservedPositiveRef.current = remainingSeconds > 0;
      setTimeLeft(remainingSeconds);
      setExamData({
        sections,
        questionsData,
        schoolType,
        examDurationMinutes,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data ||
          "Failed to load exam data. Please refresh the page."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!examData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;

        if (newTime <= 0) {
          clearInterval(timer);
          // Never submit from an initial/malformed zero. Auto-submit is allowed
          // only when a positive countdown on this page actually reaches zero.
          if (
            shouldAutoSubmitFromTimer(prev, newTime) &&
            !autoSubmitTriggeredRef.current
          ) {
            autoSubmitTriggeredRef.current = true;
            window.setTimeout(() => autoSubmitHandlerRef.current?.(), 0);
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examData]);

  // Browser timers may pause when a lab sleeps or a tab is throttled. Reconcile
  // against SQL-backed server time regularly and whenever the student returns.
  useEffect(() => {
    if (!examData) return;

    let isActive = true;
    const syncWithServer = async () => {
      try {
        const nationalId = localStorage.getItem("studentNationalId");
        if (!nationalId) return;

        const response = await examAPI.getExamTiming(nationalId);
        if (!isActive) return;

        const remainingSeconds = resolveExamRemainingSeconds(
          response.data,
          examData.examDurationMinutes
        );

        if (remainingSeconds > 0) {
          timerObservedPositiveRef.current = true;
          autoSubmitTriggeredRef.current = false;
          setTimeLeft(remainingSeconds);
          return;
        }

        setTimeLeft(0);
        if (
          timerObservedPositiveRef.current &&
          !autoSubmitTriggeredRef.current
        ) {
          autoSubmitTriggeredRef.current = true;
          window.setTimeout(() => autoSubmitHandlerRef.current?.(), 0);
        }
      } catch {
        // Keep the local countdown running during a temporary network interruption.
      }
    };

    const handleFocus = () => syncWithServer();
    const handleVisibilityChange = () => {
      if (!document.hidden) syncWithServer();
    };

    syncWithServer();
    const syncInterval = window.setInterval(syncWithServer, 15000);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(syncInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examData]);

  // Security: Prevent exit, fullscreen, etc.
  useEffect(() => {
    // Enter full-screen mode when exam starts
    const enterFullScreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Full-screen not supported or denied
      }
    };

    if (examData) {
      enterFullScreen();
    }

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handleKeyDown = (e) => {
      if (
        e.key === "F11" ||
        e.key === "Escape" ||
        (e.altKey && e.key === "F4") ||
        (e.ctrlKey &&
          (e.key === "w" ||
            e.key === "W" ||
            e.key === "t" ||
            e.key === "T" ||
            e.key === "n" ||
            e.key === "N"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        setShowExitWarning(true);
        return false;
      }
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        // Immediately try to re-enter full-screen
        setTimeout(async () => {
          try {
            await document.documentElement.requestFullscreen();
          } catch {
            setShowFullScreenWarning(true);
          }
        }, 100);
      }
    };

    const handleWindowBlur = () => {
      setShowExitWarning(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowExitWarning(true);
      }
    };

    const handleClickOutside = (e) => {
      // If click is outside the main exam container, show warning
      const examContainer = document.querySelector(".exam-container");
      if (examContainer && !examContainer.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        setShowExitWarning(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("click", handleClickOutside, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [examData]);

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: answerIndex,
      };
      // Update ref for timer access
      answersRef.current = newAnswers;
      return newAnswers;
    });
  };

  // Find first unanswered question
  const findFirstUnansweredQuestion = () => {
    for (
      let sectionIndex = 0;
      sectionIndex < examData.sections.length;
      sectionIndex++
    ) {
      const section = examData.sections[sectionIndex];
      const questions = examData.questionsData[section.sectionName] || [];

      for (
        let questionIndex = 0;
        questionIndex < questions.length;
        questionIndex++
      ) {
        const question = questions[questionIndex];
        if (answers[question.id] === undefined) {
          return { sectionIndex, questionIndex };
        }
      }
    }
    return null; // All questions answered
  };

  // Find next unanswered question from current position
  const findNextUnansweredQuestion = () => {
    // Start from current position
    for (
      let sectionIndex = currentSection;
      sectionIndex < examData.sections.length;
      sectionIndex++
    ) {
      const section = examData.sections[sectionIndex];
      const questions = examData.questionsData[section.sectionName] || [];

      // Start from current question if same section, otherwise from 0
      const startQuestionIndex =
        sectionIndex === currentSection ? currentQuestion + 1 : 0;

      for (
        let questionIndex = startQuestionIndex;
        questionIndex < questions.length;
        questionIndex++
      ) {
        const question = questions[questionIndex];
        if (answers[question.id] === undefined) {
          return { sectionIndex, questionIndex };
        }
      }
    }

    // If not found after current position, search from beginning
    return findFirstUnansweredQuestion();
  };

  // Validate all questions are answered
  const validateAllQuestionsAnswered = () => {
    const totalQuestions = examData.sections.reduce(
      (sum, section) =>
        sum + (examData.questionsData[section.sectionName]?.length || 0),
      0
    );
    const answeredQuestions = Object.keys(answers).length;
    return answeredQuestions === totalQuestions;
  };

  // Return to saved position after answering a question
  const returnToSavedPosition = () => {
    if (savedPosition) {
      setCurrentSection(savedPosition.section);
      setCurrentQuestion(savedPosition.question);
      setSavedPosition(null);
    }
  };

  const handleSubmitExam = async () => {
    // Check if all questions are answered
    if (!validateAllQuestionsAnswered()) {
      const firstUnanswered = findFirstUnansweredQuestion();
      if (firstUnanswered) {
        // Save current position
        setSavedPosition({
          section: currentSection,
          question: currentQuestion,
        });

        // Go to first unanswered question
        setCurrentSection(firstUnanswered.sectionIndex);
        setCurrentQuestion(firstUnanswered.questionIndex);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const nationalId = localStorage.getItem("studentNationalId");

      // Submit answers
      const response = await examAPI.submitAnswers({
        nationalId,
        answers: Object.entries(answers).map(([questionId, answerIndex]) => ({
          questionId: parseInt(questionId),
          chosenAnswer: answerIndex.toString(),
        })),
      });

      // Clear exam data
      localStorage.removeItem("examToken");
      localStorage.removeItem("examStartTime");
      localStorage.removeItem("examExtensionSeconds");

      // Store score data for completion page
      if (response.data && response.data.totalScore !== undefined) {
        localStorage.setItem("examScore", JSON.stringify({
          totalScore: response.data.totalScore,
          maxScore: response.data.maxScore ?? 100
        }));
      }

      // Redirect to completion page
      navigate("/exam-completed");
    } catch {
      setError("Failed to submit exam. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit function for timer (uses ref to get current answers)
  const handleAutoSubmit = async () => {
    try {
      setIsSubmitting(true);

      const nationalId = localStorage.getItem("studentNationalId");
      const currentAnswers = answersRef.current;

      // An empty attempt must never become an irreversible zero-score result.
      if (Object.keys(currentAnswers).length === 0) {
        setShowCoordinatorExtension(true);
        return;
      }

      // Submit answers
      const response = await examAPI.submitAnswers({
        nationalId,
        answers: Object.entries(currentAnswers).map(
          ([questionId, answerIndex]) => ({
            questionId: parseInt(questionId),
            chosenAnswer: answerIndex.toString(),
          })
        ),
      });

      // Clear exam data
      localStorage.removeItem("examToken");
      localStorage.removeItem("examStartTime");
      localStorage.removeItem("examExtensionSeconds");

      // Store score data for completion page
      if (response.data && response.data.totalScore !== undefined) {
        localStorage.setItem("examScore", JSON.stringify({
          totalScore: response.data.totalScore,
          maxScore: response.data.maxScore ?? 100
        }));
      }

      // Redirect to completion page
      navigate("/exam-completed");
    } catch {
      setError("Failed to submit exam. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    autoSubmitHandlerRef.current = handleAutoSubmit;
  });

  const handleCoordinatorExtension = async () => {
    try {
      // Validate extension minutes
      if (!extensionMinutes || extensionMinutes < 1 || extensionMinutes > 60) {
        setError("Please enter a valid number of minutes (1-60).");
        return;
      }

      // Validate coordinator credentials and get extension
      const extensionResponse = await examAPI.requestTimeExtension({
        nationalId: localStorage.getItem("studentNationalId"),
        coordinatorEmail,
        coordinatorPassword,
        extensionMinutes,
      });

      const serverRemainingSeconds = Number(
        extensionResponse.data.remainingSeconds
      );
      if (Number.isFinite(serverRemainingSeconds) && serverRemainingSeconds > 0) {
        autoSubmitTriggeredRef.current = false;
        setTimeLeft(Math.floor(serverRemainingSeconds));
      } else {
        setTimeLeft((current) => current + extensionMinutes * 60);
      }
      setShowCoordinatorExtension(false);
      setCoordinatorEmail("");
      setCoordinatorPassword("");
      setExtensionMinutes(15); // Reset to default
    } catch {
      setError("Invalid coordinator credentials or extension request failed.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef3131] mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الامتحان...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Exam</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#ef3131] hover:bg-red-600"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!examData) return null;

  const currentSectionData = examData.sections[currentSection];
  const currentQuestions =
    examData.questionsData[currentSectionData?.sectionName] || [];
  const currentQuestionData = currentQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 exam-container">
      {/* Header with Timer and Exit Button */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => setShowExitWarning(true)}
              className="inline-flex items-center text-[#ef3131] hover:underline font-medium cursor-pointer"
              disabled={isSubmitting}
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
              Exit Exam
            </button>

            {/* Timer Display */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-lg font-bold text-red-500">
                  {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>

              {/* Time Extension Button - Always available */}
              {timeLeft > 0 && (
                <Button
                  onClick={() => setShowCoordinatorExtension(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-sm rounded-full"
                  disabled={isSubmitting}
                >
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Request Extension
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-500">Exam Progress</h2>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#ef3131] to-red-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {Math.round(progress)}% Complete
            </p>
          </div>

          {/* Subject Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {examData.sections.map((section, index) => {
                const sectionQuestions =
                  examData.questionsData[section.sectionName] || [];
                const answeredQuestions = sectionQuestions.filter(
                  (q) => answers[q.id] !== undefined
                ).length;
                const totalQuestions = sectionQuestions.length;
                const isComplete =
                  answeredQuestions === totalQuestions && totalQuestions > 0;
                const hasUnanswered =
                  answeredQuestions < totalQuestions && answeredQuestions > 0;

                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSection(index);
                      setCurrentQuestion(0);
                    }}
                    disabled={isSubmitting}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 relative ${currentSection === index
                      ? "bg-white text-[#ef3131] shadow-sm border-b-2 border-[#ef3131]"
                      : "text-gray-600 hover:text-[#ef3131] hover:bg-white/50"
                      } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-center">
                      <span>{section.sectionName}</span>
                      {isComplete && (
                        <svg
                          className="h-4 w-4 ml-1 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {hasUnanswered && (
                        <div className="ml-1 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                          {answeredQuestions}/{totalQuestions}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#ef3131] to-red-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {currentSectionData?.sectionName}
                </CardTitle>
                <div className="flex flex-col items-end space-y-1">
                  <div className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full text-red-500">
                    Question {currentQuestion + 1} of {currentQuestions.length}
                  </div>
                  <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-red-500">
                    {Object.keys(answers).length} answered of {examData.sections.reduce((sum, section) => sum + (examData.questionsData[section.sectionName]?.length || 0), 0)} total
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div
                className={`space-y-8 ${currentSectionData?.sectionName === "Arabic" ||
                  currentSectionData?.sectionName === "MathAR"
                  ? "rtl"
                  : "ltr"
                  }`}
              >
                <div
                  className={`bg-gray-50 p-6 rounded-lg border-l-4 border-[#ef3131] ${currentSectionData?.sectionName === "Arabic" ||
                    currentSectionData?.sectionName === "MathAR"
                    ? "border-l-0 border-r-4"
                    : ""
                    }`}
                >
                  <h3
                    className={`text-xl font-semibold text-gray-900 leading-relaxed ${currentSectionData?.sectionName === "Arabic" ||
                      currentSectionData?.sectionName === "MathAR"
                      ? "text-right"
                      : "text-left"
                      }`}
                  >
                    {currentQuestionData?.questionTitle}
                  </h3>
                </div>

                <RadioGroup
                  value={answers[currentQuestionData?.id]?.toString() || ""}
                  onValueChange={(value) =>
                    handleAnswer(
                      currentQuestionData?.id,
                      Number.parseInt(value)
                    )
                  }
                  className="space-y-4"
                  disabled={isSubmitting}
                >
                  {currentQuestionData &&
                    [
                      currentQuestionData.choice1,
                      currentQuestionData.choice2,
                      currentQuestionData.choice3,
                      currentQuestionData.choice4,
                    ].map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-start p-4 border rounded-lg transition-all duration-200 cursor-pointer group ${currentSectionData?.sectionName === "Arabic" ||
                          currentSectionData?.sectionName === "MathAR"
                          ? "flex-row-reverse space-x-reverse space-x-3"
                          : "space-x-3"
                          } ${answers[currentQuestionData.id] === index
                            ? "border-2 border-[#ef3131] bg-red-100 shadow-lg ring-2 ring-red-200"
                            : "border-gray-200 hover:border-[#ef3131] hover:bg-red-50"
                          } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        onClick={() =>
                          !isSubmitting &&
                          handleAnswer(currentQuestionData.id, index)
                        }
                      >
                        <RadioGroupItem
                          value={index.toString()}
                          id={`option-${index}`}
                          className={`mt-1 ${answers[currentQuestionData.id] === index
                            ? "bg-[#ef3131] border-[#ef3131] text-white scale-110"
                            : ""
                            }`}
                          disabled={isSubmitting}
                        />
                        <Label
                          htmlFor={`option-${index}`}
                          className={`cursor-pointer flex-1 text-lg leading-relaxed transition-colors duration-200 ${currentSectionData?.sectionName === "Arabic" ||
                            currentSectionData?.sectionName === "MathAR"
                            ? "text-right"
                            : "text-left"
                            } ${answers[currentQuestionData.id] === index
                              ? "text-[#ef3131] font-semibold"
                              : "group-hover:text-[#ef3131]"
                            } ${isSubmitting ? "cursor-not-allowed" : ""}`}
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>

                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentQuestion((prev) => Math.max(0, prev - 1))
                      }
                      disabled={
                        (currentSection === 0 && currentQuestion === 0) ||
                        isSubmitting ||
                        !currentQuestionData
                      }
                      className="px-6 py-3 rounded-full border-2 hover:border-[#ef3131] hover:text-[#ef3131] transition-all duration-200"
                    >
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Previous
                    </Button>

                    {/* Return to Saved Position Button */}
                    {savedPosition && (
                      <Button
                        variant="outline"
                        onClick={returnToSavedPosition}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-full border-2 border-blue-500 text-blue-600 hover:border-blue-600 hover:text-blue-700 transition-all duration-200"
                      >
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
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        Return to Finish
                      </Button>
                    )}

                    {/* Skip to Next Unanswered Button */}
                    {savedPosition && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const nextUnanswered = findNextUnansweredQuestion();
                          if (nextUnanswered) {
                            setCurrentSection(nextUnanswered.sectionIndex);
                            setCurrentQuestion(nextUnanswered.questionIndex);
                          }
                        }}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-full border-2 border-green-500 text-green-600 hover:border-green-600 hover:text-green-700 transition-all duration-200"
                      >
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
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        Skip to Next Unanswered
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Button
                      onClick={() => {
                        if (
                          currentQuestion === currentQuestions.length - 1 &&
                          currentSection === examData.sections.length - 1
                        ) {
                          handleSubmitExam();
                        } else {
                          if (currentQuestion === currentQuestions.length - 1) {
                            setCurrentSection((prev) => prev + 1);
                            setCurrentQuestion(0);
                          } else {
                            setCurrentQuestion((prev) => prev + 1);
                          }
                        }
                      }}
                      disabled={
                        isSubmitting
                      }
                      className="bg-[#ef3131] hover:bg-red-600 px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </div>
                      ) : currentQuestion === currentQuestions.length - 1 &&
                        currentSection === examData.sections.length - 1 ? (
                        "Finish Exam"
                      ) : (
                        "Next"
                      )}
                      {!isSubmitting && (
                        <svg
                          className="h-5 w-5 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Exit Exam?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من رغبتك في الخروج من الاختبار؟ سيتم تسليم إجاباتك الحالية وإنهاء الاختبار.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowExitWarning(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
               العودة
              </Button>
              <Button
                onClick={() => {
                  setShowExitWarning(false);
                  handleAutoSubmit();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
               إنهاء الاختبار وتسليم الإجابات
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Warning Modal */}
      {showFullScreenWarning && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Full Screen Required
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              The exam must be taken in full-screen mode. Please return to
              full-screen to continue.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={async () => {
                  try {
                    await document.documentElement.requestFullscreen();
                    setShowFullScreenWarning(false);
                  } catch {
                    // Full-screen request denied
                  }
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Return to Full Screen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coordinator Extension Modal */}
      {showCoordinatorExtension && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader className="bg-orange-500 text-white rounded-t-lg">
              <CardTitle className="text-xl">
                Reception Coordinator Extension
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">
                Please ask a reception coordinator to enter their credentials to grant you
                extra time.
              </p>

              <div>
                <Label
                  htmlFor="coordinator-email"
                  className="text-gray-700 font-medium mb-1 block"
                >
                  Coordinator Email:
                </Label>
                <input
                  id="coordinator-email"
                  type="email"
                  value={coordinatorEmail}
                  onChange={(e) => setCoordinatorEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="coordinator@school.com"
                />
              </div>

              <div>
                <Label
                  htmlFor="coordinator-password"
                  className="text-gray-700 font-medium mb-1 block"
                >
                  Coordinator Password:
                </Label>
                <input
                  id="coordinator-password"
                  type="password"
                  value={coordinatorPassword}
                  onChange={(e) => setCoordinatorPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <Label
                  htmlFor="extension-minutes"
                  className="text-gray-700 font-medium mb-1 block"
                >
                  Minutes to Add:
                </Label>
                <input
                  id="extension-minutes"
                  type="number"
                  min="1"
                  max="60"
                  value={extensionMinutes}
                  onChange={(e) =>
                    setExtensionMinutes(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCoordinatorExtension(false);
                    setCoordinatorEmail("");
                    setCoordinatorPassword("");
                  }}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCoordinatorExtension}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Grant Extension
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GetExamPage;
