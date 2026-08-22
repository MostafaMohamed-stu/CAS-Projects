const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const hasIqExamScore = (student) =>
  student?.examIqScore !== null &&
  student?.examIqScore !== undefined;

export const getExamTotal = (student) => {
  if (student?.examTotal !== null && student?.examTotal !== undefined) {
    return toNumber(student.examTotal);
  }

  return (
    toNumber(student?.examMathScore) +
    toNumber(student?.examEnglishScore) +
    toNumber(student?.examArabicScore) +
    toNumber(student?.examSoftwareScore) +
    toNumber(student?.examIqScore)
  );
};

export const getExamMaximum = (student) =>
  toNumber(student?.examMaxScore) || (hasIqExamScore(student) ? 100 : 60);

export const getExamPercentage = (student) => {
  if (
    student?.examPercentage !== null &&
    student?.examPercentage !== undefined
  ) {
    return toNumber(student.examPercentage);
  }

  return (getExamTotal(student) * 100) / getExamMaximum(student);
};

export const getExamAdmissionContribution = (student, schoolExamWeight = 60) => {
  const weight = toNumber(student?.schoolExamWeight) || toNumber(schoolExamWeight) || 60;
  return (getExamPercentage(student) * weight) / 100;
};

export const calculateDynamicTotalPercentage = (student, hubSettings = null) => {
  if (!student) return 0;

  // 1. If backend already calculated TotalPercentage from dbo.HUB_Settings, use it directly!
  if (student.totalPercentage !== null && student.totalPercentage !== undefined && !isNaN(Number(student.totalPercentage))) {
    return Number(student.totalPercentage);
  }
  if (student.TotalPercentage !== null && student.TotalPercentage !== undefined && !isNaN(Number(student.TotalPercentage))) {
    return Number(student.TotalPercentage);
  }

  // 2. Dynamic weights from HUB_Settings or student metadata
  const schoolExamWeight = toNumber(hubSettings?.schoolExam?.weight ?? student?.schoolExamWeight ?? 60);
  const interviewWeight = toNumber(hubSettings?.interview?.weight ?? student?.interviewWeight ?? 40);
  const prepCertWeight = toNumber(hubSettings?.preparatoryCertificate?.weight ?? student?.preparatoryCertificateWeight ?? 0);
  const ministryExamWeight = toNumber(hubSettings?.ministryExam?.weight ?? student?.ministryExamWeight ?? 0);

  let total = 0;

  // School exam contribution
  if (schoolExamWeight > 0) {
    const examPct = getExamPercentage(student);
    total += (examPct * schoolExamWeight) / 100;
  }

  // Interview contribution (each score out of 40 max)
  if (interviewWeight > 0) {
    let interviewPct = 0;
    if (Array.isArray(student.interviewScores) && student.interviewScores.length > 0) {
      const sum = student.interviewScores.reduce((acc, item) => {
        const val = typeof item === 'object' && item !== null
          ? (item.score ?? item.Score ?? item.totalScore ?? item.value ?? item.interviewScore ?? 0)
          : Number(item || 0);
        return acc + (Number(val) || 0);
      }, 0);
      const expectedMax = 40 * Math.max(3, student.interviewScores.length);
      interviewPct = expectedMax > 0 ? (sum * 100) / expectedMax : 0;
    } else {
      const single = Number(student.interviewScore ?? student.InterviewScore ?? 0);
      interviewPct = (single * 100) / 40;
    }
    total += (interviewPct * interviewWeight) / 100;
  }

  // Preparatory Certificate contribution (out of 280 max)
  if (prepCertWeight > 0) {
    const prepScore = Number(student.finalYearScore ?? student.FinalYearScore ?? student.thirdPrepScore ?? 0);
    const prepPct = (prepScore * 100) / 280;
    total += (prepPct * prepCertWeight) / 100;
  }

  // Ministry exam contribution (percentage)
  if (ministryExamWeight > 0) {
    const ministryPct = Number(student.ministryExamPercentage ?? student.MinistryExamPercentage ?? 0);
    total += (ministryPct * ministryExamWeight) / 100;
  }

  return Math.round(total * 100) / 100;
};

export const getExamSectionMaximum = (student, sectionName) => {
  const configuredMaximums = {
    Arabic: student?.examArabicMaxScore,
    English: student?.examEnglishMaxScore,
    Math: student?.examMathMaxScore,
    Software: student?.examSoftwareMaxScore,
    IQ: student?.examIqMaxScore,
  };
  if (
    configuredMaximums[sectionName] !== null &&
    configuredMaximums[sectionName] !== undefined
  ) {
    return toNumber(configuredMaximums[sectionName]);
  }

  if (!hasIqExamScore(student)) return 15;

  const maximums = {
    Arabic: 15,
    English: 30,
    Math: 30,
    Software: 15,
    IQ: 10,
  };

  return maximums[sectionName] ?? 0;
};
