"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ExamPage = () => {
  const navigate = useNavigate();

  // Check if student is authenticated for exam
  useEffect(() => {
    const nationalId = localStorage.getItem("studentNationalId");
    const examToken = localStorage.getItem("examToken");

    if (!nationalId || !examToken) {
      navigate("/verify-student");
      return;
    }

    navigate("/get-exam");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef3131] mx-auto mb-4"></div>
        <p className="text-gray-600">جاري التحقق وبدء الامتحان...</p>
      </div>
    </div>
  );
};

export default ExamPage;
