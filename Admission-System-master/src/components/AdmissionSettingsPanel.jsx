import { createElement, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  MessageSquareText,
  Save,
  School,
  ShieldCheck,
  X,
} from "lucide-react";
import Button from "./ui/Button";
import { adminAPI } from "../utils/api";

const FACTORS = [
  {
    key: "schoolExam",
    label: "School Exam",
    help: "The total result of Math, English, Arabic, Software, and IQ.",
    icon: School,
  },
  {
    key: "interview",
    label: "Interview Score",
    help: "The combined score entered by the interview committee.",
    icon: MessageSquareText,
  },
  {
    key: "preparatoryCertificate",
    label: "Preparatory Certificate",
    help: "The student's certificate score, converted from 280 to a percentage.",
    icon: GraduationCap,
  },
  {
    key: "ministryExam",
    label: "Ministry Exam",
    help: "The Ministry exam percentage entered during registration.",
    icon: FileCheck2,
  },
];

const SUBJECTS = [
  { key: "math", label: "Math" },
  { key: "english", label: "English" },
  { key: "arabic", label: "Arabic" },
  { key: "software", label: "Software" },
  { key: "iq", label: "IQ" },
];

const copy = (value) => JSON.parse(JSON.stringify(value));

const payloadFrom = (settings) => ({
  schoolExam: settings.schoolExam,
  interview: settings.interview,
  preparatoryCertificate: settings.preparatoryCertificate,
  ministryExam: settings.ministryExam,
  subjectWeights: settings.subjectWeights,
  questionsPerSection: Number(settings.questionsPerSection),
  requireFullQuestionSet: Boolean(settings.requireFullQuestionSet),
  examDurationMinutes: Number(settings.examDurationMinutes),
});

const collectChanges = (before, after) => {
  const changes = [];

  FACTORS.forEach(({ key, label }) => {
    if (before[key].enabled !== after[key].enabled) {
      changes.push({
        label: `${label} included in final result`,
        before: before[key].enabled ? "Yes" : "No",
        after: after[key].enabled ? "Yes" : "No",
      });
    }
    if (before[key].weight !== after[key].weight) {
      changes.push({
        label: `${label} percentage`,
        before: `${before[key].weight}%`,
        after: `${after[key].weight}%`,
      });
    }
  });

  SUBJECTS.forEach(({ key, label }) => {
    if (before.subjectWeights[key] !== after.subjectWeights[key]) {
      changes.push({
        label: `${label} mark`,
        before: `${before.subjectWeights[key]}`,
        after: `${after.subjectWeights[key]}`,
      });
    }
  });

  if (before.questionsPerSection !== after.questionsPerSection) {
    changes.push({
      label: "Questions in each subject",
      before: before.questionsPerSection,
      after: after.questionsPerSection,
    });
  }
  if (before.requireFullQuestionSet !== after.requireFullQuestionSet) {
    changes.push({
      label: "Block exam when questions are insufficient",
      before: before.requireFullQuestionSet ? "Yes" : "No",
      after: after.requireFullQuestionSet ? "Yes" : "No",
    });
  }
  if (before.examDurationMinutes !== after.examDurationMinutes) {
    changes.push({
      label: "Exam duration",
      before: `${before.examDurationMinutes} minutes`,
      after: `${after.examDurationMinutes} minutes`,
    });
  }

  return changes;
};

const Toggle = ({
  checked,
  onChange,
  label,
  onText = "Included",
  offText = "Not included",
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`inline-flex h-11 min-w-32 items-center justify-between gap-3 rounded-xl border px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-red-100 ${
      checked
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-gray-300 bg-gray-100 text-gray-700"
    }`}
  >
    <span>{checked ? onText : offText}</span>
    <span
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-emerald-600" : "bg-gray-400"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  </button>
);

const NumberInput = ({
  id,
  value,
  onChange,
  suffix,
  disabled = false,
  min = 0,
}) => (
  <div className="relative w-full sm:w-40">
    <input
      id={id}
      type="number"
      min={min}
      step="1"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      onWheel={(event) => event.currentTarget.blur()}
      className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 pr-14 text-lg font-bold text-gray-900 outline-none transition focus:border-[#ef3131] focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
    />
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
      {suffix}
    </span>
  </div>
);

const TotalBadge = ({ value, label }) => {
  const valid = value === 100;
  return (
    <div
      className={`flex min-w-40 items-center justify-between gap-4 rounded-xl border-2 px-4 py-3 ${
        valid
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      <span className="text-sm font-bold">{label}</span>
      <span className="text-2xl font-black">{value}%</span>
    </div>
  );
};

const SectionHeading = ({ number, title, description }) => (
  <div className="flex items-start gap-4">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ef3131] text-lg font-black text-white">
      {number}
    </span>
    <div>
      <h2 className="text-2xl font-black text-gray-950">{title}</h2>
      <p className="mt-1 max-w-3xl text-base leading-7 text-gray-600">
        {description}
      </p>
    </div>
  </div>
);

const AdmissionSettingsPanel = ({ onSaved }) => {
  const [original, setOriginal] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const errorAlertRef = useRef(null);

  useEffect(() => {
    let active = true;
    adminAPI
      .getAdmissionSettings()
      .then((response) => {
        if (!active) return;
        setOriginal(copy(response.data));
        setDraft(copy(response.data));
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data ||
            "Could not load the settings. Please try again."
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-red-100 border-t-[#ef3131]" />
          <p className="mt-4 text-base font-semibold text-gray-600">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (!draft || !original) {
    return (
      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-lg text-red-800">
        <strong>Settings could not be opened.</strong> {error}
      </div>
    );
  }

  const factorTotal = FACTORS.reduce(
    (total, { key }) => total + (draft[key].enabled ? draft[key].weight : 0),
    0
  );
  const subjectTotal = SUBJECTS.reduce(
    (total, { key }) => total + draft.subjectWeights[key],
    0
  );
  const changes = collectChanges(original, draft);
  const hasNegativeValue =
    FACTORS.some(({ key }) => draft[key].weight < 0) ||
    SUBJECTS.some(({ key }) => draft.subjectWeights[key] < 0);

  const getValidationError = () => {
    if (hasNegativeValue) {
      return "Percentages and subject marks cannot be negative.";
    }
    if (factorTotal !== 100 && subjectTotal !== 100) {
      return `Final result percentages total ${factorTotal}% and school exam marks total ${subjectTotal}%. Each total must be exactly 100%.`;
    }
    if (factorTotal !== 100) {
      return `Final result percentages total ${factorTotal}%. They must total exactly 100%.`;
    }
    if (subjectTotal !== 100) {
      return `School exam subject marks total ${subjectTotal}%. They must total exactly 100%.`;
    }
    if (draft.questionsPerSection < 1) {
      return "Questions in each subject must be at least 1.";
    }
    if (draft.examDurationMinutes < 1) {
      return "Exam duration must be at least 1 minute.";
    }
    return "";
  };

  const validationError = getValidationError();

  const updateFactor = (key, field, value) => {
    setDraft((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
        ...(field === "enabled" && !value ? { weight: 0 } : {}),
      },
    }));
    setSuccess("");
  };

  const updateSubject = (key, value) => {
    setDraft((current) => ({
      ...current,
      subjectWeights: { ...current.subjectWeights, [key]: value },
    }));
    setSuccess("");
  };

  const showErrorAtTop = (message) => {
    setError(message);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        errorAlertRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        errorAlertRef.current?.focus({ preventScroll: true });
      });
    });
  };

  const reviewChanges = () => {
    setError("");
    if (validationError) {
      showErrorAtTop(validationError);
      return;
    }
    if (!changes.length) {
      showErrorAtTop("No settings have been changed.");
      return;
    }
    setShowConfirmation(true);
  };

  const saveChanges = async () => {
    try {
      setIsSaving(true);
      const response = await adminAPI.saveAdmissionSettings(payloadFrom(draft));
      const saved = response.data.settings;
      setOriginal(copy(saved));
      setDraft(copy(saved));
      setShowConfirmation(false);
      setSuccess(
        "Settings saved. They will be used by students who have not started the exam yet."
      );
      onSaved?.();
    } catch (requestError) {
      setShowConfirmation(false);
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data ||
          "The settings could not be saved. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 text-blue-950">
          <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={24} />
          <div>
            <p className="text-lg font-bold">Existing results are protected</p>
            <p className="mt-1 leading-6">
              Completed exams and exams already in progress keep their original settings.
              Students who have not started will use the new settings.
            </p>
          </div>
        </div>

        {error ? (
          <div
            ref={errorAlertRef}
            role="alert"
            tabIndex={-1}
            className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-red-900 outline-none focus:ring-4 focus:ring-red-200"
          >
            <AlertTriangle className="mt-0.5 shrink-0" size={22} />
            <p className="text-base font-semibold">{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <CheckCircle2 className="mt-0.5 shrink-0" size={22} />
            <p className="text-base font-semibold">{success}</p>
          </div>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <SectionHeading
              number="1"
              title="What counts toward the final result?"
              description="Choose which results are included. The percentages of all included items must total 100%."
            />
            <TotalBadge value={factorTotal} label="Final total" />
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200">
            <div className="hidden grid-cols-[1fr_160px_180px] gap-4 bg-gray-100 px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-600 md:grid">
              <span>Result source</span>
              <span>Use it?</span>
              <span>Percentage</span>
            </div>
            {FACTORS.map(({ key, label, help, icon }) => (
              <div
                key={key}
                className="grid gap-4 border-t border-gray-200 p-5 first:border-t-0 md:grid-cols-[1fr_160px_180px] md:items-center"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#ef3131]">
                    {createElement(icon, { size: 22 })}
                  </span>
                  <div>
                    <label htmlFor={`${key}-weight`} className="text-lg font-black text-gray-950">
                      {label}
                    </label>
                    <p className="mt-1 leading-6 text-gray-600">{help}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-gray-600 md:hidden">Use it?</p>
                  <Toggle
                    checked={draft[key].enabled}
                    onChange={(value) => updateFactor(key, "enabled", value)}
                    label={`Include ${label}`}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-gray-600 md:hidden">Percentage</p>
                  <NumberInput
                    id={`${key}-weight`}
                    value={draft[key].weight}
                    disabled={!draft[key].enabled}
                    suffix="%"
                    onChange={(value) => updateFactor(key, "weight", value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <SectionHeading
              number="2"
              title="How is the school exam divided?"
              description="Enter the full mark for each subject. These five marks must total 100."
            />
            <TotalBadge value={subjectTotal} label="Exam total" />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SUBJECTS.map(({ key, label }) => (
              <div key={key} className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4">
                <label htmlFor={`subject-${key}`} className="mb-3 block text-lg font-black text-gray-950">
                  {label}
                </label>
                <NumberInput
                  id={`subject-${key}`}
                  value={draft.subjectWeights[key]}
                  suffix="marks"
                  onChange={(value) => updateSubject(key, value)}
                />
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-xl bg-gray-100 p-4 text-base leading-7 text-gray-700">
            <strong>Example:</strong> If Math is worth 30 marks, it stays worth 30 whether
            the exam contains 1 Math question or 10 Math questions.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <SectionHeading
            number="3"
            title="Exam questions and time"
            description="Control how many questions appear and what happens when the question bank is incomplete."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border-2 border-gray-200 p-5">
              <label htmlFor="questions-per-section" className="text-lg font-black text-gray-950">
                Questions in each subject
              </label>
              <p className="mt-2 min-h-20 leading-6 text-gray-600">
                The system randomly selects up to this number from every subject.
              </p>
              <NumberInput
                id="questions-per-section"
                value={draft.questionsPerSection}
                suffix="questions"
                min={1}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, questionsPerSection: value }))
                }
              />
            </div>

            <div className="rounded-2xl border-2 border-gray-200 p-5">
              <p className="text-lg font-black text-gray-950">
                Block exam when questions are insufficient
              </p>
              <p className="mt-2 min-h-20 leading-6 text-gray-600">
                Yes: every subject must contain the full question count. No: the exam
                opens when every subject has at least one question.
              </p>
              <Toggle
                checked={draft.requireFullQuestionSet}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, requireFullQuestionSet: value }))
                }
                label="Block exam when questions are insufficient"
                onText="Yes"
                offText="No"
              />
            </div>

            <div className="rounded-2xl border-2 border-gray-200 p-5">
              <div className="flex items-center gap-2">
                <Clock3 className="text-[#ef3131]" size={22} />
                <label htmlFor="exam-duration" className="text-lg font-black text-gray-950">
                  Exam duration
                </label>
              </div>
              <p className="mt-2 min-h-20 leading-6 text-gray-600">
                The time available to each student after the exam actually starts.
              </p>
              <NumberInput
                id="exam-duration"
                value={draft.examDurationMinutes}
                suffix="minutes"
                min={1}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, examDurationMinutes: value }))
                }
              />
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold text-gray-700">
            {changes.length
              ? `${changes.length} change${changes.length === 1 ? "" : "s"} ready to review.`
              : "No unsaved changes."}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={!changes.length}
              onClick={() => {
                setDraft(copy(original));
                setError("");
                setSuccess("");
              }}
              className="h-12 px-6 text-base"
            >
              Cancel Changes
            </Button>
            <Button
              disabled={!changes.length || isSaving}
              onClick={reviewChanges}
              className="h-12 bg-[#ef3131] px-6 text-base hover:bg-red-600"
            >
              <Save className="mr-2" size={18} /> Review and Save
            </Button>
          </div>
        </div>
      </div>

      {showConfirmation ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-settings-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
              <div>
                <h2 id="confirm-settings-title" className="text-2xl font-black text-gray-950">
                  Confirm Settings Changes
                </h2>
                <p className="mt-2 text-base leading-6 text-gray-600">
                  Review every change before saving. Students who already started keep
                  their existing version.
                </p>
              </div>
              <button type="button" onClick={() => setShowConfirmation(false)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" aria-label="Close">
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-6">
              <div className="space-y-3">
                {changes.map((change) => (
                  <div key={change.label} className="rounded-xl border border-gray-200 p-4">
                    <p className="font-bold text-gray-950">{change.label}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-100 p-3">
                        <p className="text-xs font-bold uppercase text-gray-500">Current</p>
                        <p className="mt-1 text-lg font-bold text-gray-700">{change.before}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs font-bold uppercase text-emerald-700">New</p>
                        <p className="mt-1 text-lg font-black text-emerald-900">{change.after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-200 bg-gray-50 p-5">
              <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isSaving} className="h-12 flex-1 text-base">
                Go Back
              </Button>
              <Button onClick={saveChanges} disabled={isSaving} className="h-12 flex-1 bg-[#ef3131] text-base hover:bg-red-600">
                {isSaving ? "Saving..." : "Confirm and Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default AdmissionSettingsPanel;
