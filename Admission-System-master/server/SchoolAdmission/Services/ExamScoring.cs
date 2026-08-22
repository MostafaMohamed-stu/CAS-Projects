using SchoolAdmission.Models;

namespace SchoolAdmission.Services;

public static class ExamScoring
{
    public const string ArabicSection = "Arabic";
    public const string EnglishSection = "English";
    public const string MathEnglishSection = "MathEN";
    public const string MathArabicSection = "MathAR";
    public const string SoftwareSection = "Software";
    public const string IqSection = "IQ";

    public static readonly string[] ScoredSectionNames =
    {
        ArabicSection,
        EnglishSection,
        MathEnglishSection,
        MathArabicSection,
        SoftwareSection,
        IqSection
    };

    public static string? ResolveMathSection(string? schoolType)
    {
        if (string.IsNullOrWhiteSpace(schoolType))
            return null;

        var normalized = schoolType.Trim();

        if (normalized.Equals("\u0644\u063a\u0627\u062a", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Languages", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Language", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Ù„ØºØ§Øª", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Ã™â€žÃ˜ÂºÃ˜Â§Ã˜Âª", StringComparison.OrdinalIgnoreCase))
        {
            return MathEnglishSection;
        }

        if (normalized.Equals("\u0639\u0631\u0628\u064a", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Arabic", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Ø¹Ø±Ø¨ÙŠ", StringComparison.OrdinalIgnoreCase) ||
            normalized.Equals("Ã˜Â¹Ã˜Â±Ã˜Â¨Ã™Å ", StringComparison.OrdinalIgnoreCase))
        {
            return MathArabicSection;
        }

        return null;
    }

    public static string[] GetRequiredSections(string? schoolType)
    {
        var mathSection = ResolveMathSection(schoolType);
        if (mathSection == null)
            return Array.Empty<string>();

        return
        [
            EnglishSection,
            ArabicSection,
            SoftwareSection,
            IqSection,
            mathSection
        ];
    }

    public static int CalculateSectionScore(int correctAnswers, int denominator, int weight)
    {
        if (denominator <= 0 || correctAnswers <= 0)
            return 0;

        var score = (double)correctAnswers / denominator * weight;
        return Math.Clamp(
            (int)Math.Round(score, MidpointRounding.AwayFromZero),
            0,
            weight);
    }

    public static int GetTotal(StudentExamResult? result)
    {
        if (result == null)
            return 0;

        return result.ExamArabicScore +
               result.ExamEnglishScore +
               result.ExamMathScore +
               result.ExamSoftwareScore +
               (result.ExamIqScore ?? 0);
    }

}
