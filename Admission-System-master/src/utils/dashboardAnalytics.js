export const buildDashboardStats = (students, currentAdminRole) => {
  const isBoard = currentAdminRole === "Board";
  const totalStudents = students.length;
  const accepted = students.filter(
    (s) => s.Status === "2" || s.status === "2" || s.status === 2
  ).length;
  const pending = students.filter(
    (s) => s.Status === "1" || s.status === "1" || s.status === 1
  ).length;

  const interviewedStudents = students.filter((s) => {
    if (isBoard) {
      return s.interviewScores && s.interviewScores.length > 0;
    }

    const score = s.interviewScore ?? s.InterviewScore;
    return Number(score) > 0;
  });

  const averageScore = interviewedStudents.length
    ? interviewedStudents.reduce((sum, s) => {
        if (isBoard) {
          return sum + (s.totalPercentage || 0);
        }

        const score = s.interviewScore ?? s.InterviewScore;
        return sum + (Number(score) || 0);
      }, 0) / interviewedStudents.length
    : 0;

  return {
    totalStudents,
    accepted,
    interviewed: interviewedStudents.length,
    pending,
    averageScore,
  };
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};


const getNumericValue = (student, keys) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(student, key)) {
      const numeric = toNumber(student[key]);
      if (numeric !== null) return numeric;
    }
  }
  return null;
};

const getAverage = (students, keys) => {
  let total = 0;
  let count = 0;

  students.forEach((student) => {
    const value = getNumericValue(student, keys);
    if (value !== null) {
      total += value;
      count += 1;
    }
  });

  return count ? Number((total / count).toFixed(2)) : 0;
};

const getExamSectionPercentageAverage = (students, keys, sectionName) => {
  let total = 0;
  let count = 0;

  students.forEach((student) => {
    if (sectionName === "IQ" && !hasIqExamScore(student)) return;

    const score = getNumericValue(student, keys);
    const maximum = getExamSectionMaximum(student, sectionName);
    if (score !== null && maximum > 0) {
      total += (score * 100) / maximum;
      count += 1;
    }
  });

  return count ? Number((total / count).toFixed(2)) : 0;
};

export const buildDashboardAverages = (students) => ({
  ministryExamAverage: getAverage(students, [
    "ministryExamPercentage",
    "MinistryExamPercentage",
  ]),
  finalYearAverage: getAverage(students, [
    "finalYearScore",
    "FinalYearScore",
    "thirdPrepScore",
    "ThirdPrepScore",
  ]),
  mathPrepAverage: getAverage(students, ["mathScore", "MathScore"]),
  englishPrepAverage: getAverage(students, ["englishScore", "EnglishScore"]),
  examSoftwareAverage: getExamSectionPercentageAverage(
    students,
    ["examSoftwareScore", "ExamSoftwareScore"],
    "Software"
  ),
  examEnglishAverage: getExamSectionPercentageAverage(
    students,
    ["examEnglishScore", "ExamEnglishScore"],
    "English"
  ),
  examArabicAverage: getExamSectionPercentageAverage(
    students,
    ["examArabicScore", "ExamArabicScore"],
    "Arabic"
  ),
  examMathAverage: getExamSectionPercentageAverage(
    students,
    ["examMathScore", "ExamMathScore"],
    "Math"
  ),
  examIqAverage: getExamSectionPercentageAverage(
    students,
    ["examIqScore", "ExamIqScore"],
    "IQ"
  ),
});

export const buildDashboardAnalytics = (students, options = {}) => {
  const { interviewerFallbackName = "Interviewer" } = options;
  const acceptanceCounts = {
    accepted: 0,
    rejected: 0,
    waitlisted: 0,
    pending: 0,
  };
  const schoolMap = new Map();
  const laptopMap = new Map();
  const interviewerMap = new Map();
  const dailyMap = new Map();

  students.forEach((student) => {
    const statusValue = String(student.Status ?? student.status ?? "").trim();
    switch (statusValue) {
      case "2":
        acceptanceCounts.accepted += 1;
        break;
      case "3":
        acceptanceCounts.rejected += 1;
        break;
      case "4":
        acceptanceCounts.waitlisted += 1;
        break;
      case "1":
      default:
        acceptanceCounts.pending += 1;
        break;
    }

    const schoolType =
      student.previousSchoolType ||
      student.PreviousSchoolType ||
      student.schoolName ||
      student.SchoolName ||
      "Not Specified";
    schoolMap.set(schoolType, (schoolMap.get(schoolType) || 0) + 1);

    const hasLaptop = student.hasLaptop || student.HasLaptop;
    const laptopValue = hasLaptop ? "Has Laptop" : "No Laptop";
    laptopMap.set(laptopValue, (laptopMap.get(laptopValue) || 0) + 1);

    const interviewScores = Array.isArray(student.interviewScores)
      ? student.interviewScores
      : [];

    if (interviewScores.length > 0) {
      interviewScores.forEach((score) => {
        const interviewerName =
          score.admin ||
          score.interviewerName ||
          (score.interviewerId
            ? `Interviewer ${score.interviewerId}`
            : "Interviewer");
        const current = interviewerMap.get(interviewerName) || {
          total: 0,
          count: 0,
        };
        current.total += Number(score.score) || 0;
        current.count += 1;
        interviewerMap.set(interviewerName, current);
      });
    } else {
      const fallbackScore = student.interviewScore ?? student.InterviewScore;
      const scoreValue = Number(fallbackScore);
      if (!Number.isNaN(scoreValue) && scoreValue > 0) {
        const fallbackName =
          interviewerFallbackName ||
          student.interviewerName ||
          student.InterviewerName ||
          "Interviewer";
        const current = interviewerMap.get(fallbackName) || {
          total: 0,
          count: 0,
        };
        current.total += scoreValue;
        current.count += 1;
        interviewerMap.set(fallbackName, current);
      }
    }

    let dateValue =
      student.CreatedAt ||
      student.createdAt ||
      student.Created_At ||
      student.created_At ||
      student.createdDate ||
      student.createdOn ||
      student.appliedAt ||
      student.AppliedAt;

    if (dateValue) {
      const dateObj = new Date(dateValue);

      if (!Number.isNaN(dateObj.getTime())) {
        const isoDate = dateObj.toISOString().split("T")[0];
        dailyMap.set(isoDate, (dailyMap.get(isoDate) || 0) + 1);
      }
    }
  });

  const acceptanceData = [
    { name: "Accepted", value: acceptanceCounts.accepted },
    { name: "Rejected", value: acceptanceCounts.rejected },
    { name: "Waitlisted", value: acceptanceCounts.waitlisted },
    { name: "Pending", value: acceptanceCounts.pending },
  ].filter((item) => item.value > 0);
  if (!acceptanceData.length) acceptanceData.push({ name: "No Data", value: 1 });

  const schoolData = Array.from(schoolMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  if (!schoolData.length) schoolData.push({ name: "No Data", value: 0 });

  const laptopData = Array.from(laptopMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));
  if (!laptopData.length) laptopData.push({ name: "No Data", value: 1 });

  let globalTotal = 0;
  let globalCount = 0;

  const interviewerData = Array.from(interviewerMap.entries())
    .map(([name, value]) => {
      globalTotal += value.total;
      globalCount += value.count;
      return {
        name,
        value: value.count ? Number((value.total / value.count).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (globalCount > 0) {
    const globalAverage = Number((globalTotal / globalCount).toFixed(2));
    interviewerData.unshift({ name: "Global Average", value: globalAverage });
  }

  if (!interviewerData.length) {
    interviewerData.push({ name: "No Scores Yet", value: 0 });
  }

  const dailyData = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([iso, value]) => ({
      name: new Date(iso).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      }),
      value,
    }));
  if (!dailyData.length) dailyData.push({ name: "No Data", value: 0 });

  return { acceptanceData, schoolData, laptopData, interviewerData, dailyData };
};
import {
  getExamSectionMaximum,
  hasIqExamScore,
} from "./examScoring";
