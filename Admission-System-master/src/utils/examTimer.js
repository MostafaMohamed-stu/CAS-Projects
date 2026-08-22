export const resolveExamRemainingSeconds = (
  responseData,
  fallbackDurationMinutes,
  nowMilliseconds = Date.now()
) => {
  const serverRemainingSeconds = Number(responseData?.remainingSeconds);
  if (Number.isFinite(serverRemainingSeconds) && serverRemainingSeconds >= 0) {
    return Math.floor(serverRemainingSeconds);
  }

  const endTimeText = String(responseData?.examEndsAtUtc || "");
  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(endTimeText);
  const parsedEndTime = hasExplicitTimezone ? Date.parse(endTimeText) : NaN;
  if (Number.isFinite(parsedEndTime)) {
    return Math.max(0, Math.ceil((parsedEndTime - nowMilliseconds) / 1000));
  }

  return Math.max(1, Number(fallbackDurationMinutes) || 60) * 60;
};

export const shouldAutoSubmitFromTimer = (previousSeconds, nextSeconds) =>
  previousSeconds > 0 && nextSeconds <= 0;
