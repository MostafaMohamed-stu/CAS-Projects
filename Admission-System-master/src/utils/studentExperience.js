const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const buildExamBlueprint = (portalData) => {
  const sections = portalData?.exam?.sections;
  if (!sections) return [];

  const isWeightedExam = Object.prototype.hasOwnProperty.call(sections, "IQ");
  const weightedMaximums = {
    Arabic: 15,
    English: 30,
    Math: 30,
    Software: 15,
    IQ: 10,
  };

  return Object.entries(sections)
    .map(([name, score]) => {
      const maxScore = isWeightedExam ? weightedMaximums[name] ?? 0 : 15;
      const numericScore = clamp(toNumber(score), 0, maxScore);
      const scorePercent = maxScore > 0
        ? Math.round((numericScore / maxScore) * 100)
        : 0;
      const weeklyHours =
        scorePercent >= 80 ? 1 : scorePercent >= 60 ? 2 : scorePercent >= 40 ? 3 : 4;

      return {
        name,
        score: numericScore,
        maxScore,
        scorePercent,
        weeklyHours,
        priority:
          scorePercent >= 80 ? "Maintain" : scorePercent >= 60 ? "Improve" : "Critical",
      };
    })
    .sort((a, b) => a.score - b.score);
};
