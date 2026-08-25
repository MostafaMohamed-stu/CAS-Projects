using System.Text.RegularExpressions;
using System.Web;

namespace Elsewedy_Capstone_System.Services
{
    /// <summary>
    /// XSS Protection Service
    /// Provides server-side protection against Cross-Site Scripting attacks
    /// </summary>
    public class XssProtectionService
    {
        /// <summary>
        /// Sanitizes HTML content by removing dangerous tags and attributes
        /// </summary>
        /// <param name="html">The HTML string to sanitize</param>
        /// <returns>Sanitized HTML</returns>
        public static string SanitizeHtml(string html)
        {
            if (string.IsNullOrEmpty(html)) return string.Empty;

            // Remove script tags and their content
            html = Regex.Replace(html, @"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", RegexOptions.IgnoreCase);

            // Remove javascript: protocols
            html = Regex.Replace(html, @"javascript:", "", RegexOptions.IgnoreCase);

            // Remove on* event handlers
            html = Regex.Replace(html, @"\son\w+\s*=\s*[""'][^""']*[""']", "", RegexOptions.IgnoreCase);

            // Remove dangerous tags
            var dangerousTags = new[] { "script", "iframe", "object", "embed", "form", "input", "button" };
            foreach (var tag in dangerousTags)
            {
                html = Regex.Replace(html, $@"<\/?{tag}\b[^>]*>", "", RegexOptions.IgnoreCase);
            }

            // Remove dangerous attributes
            var dangerousAttrs = new[] { "onload", "onerror", "onclick", "onmouseover", "onfocus", "onblur" };
            foreach (var attr in dangerousAttrs)
            {
                html = Regex.Replace(html, $@"\s{attr}\s*=\s*[""'][^""']*[""']", "", RegexOptions.IgnoreCase);
            }

            return html;
        }

        /// <summary>
        /// Escapes HTML special characters to prevent XSS
        /// </summary>
        /// <param name="text">The text to escape</param>
        /// <returns>HTML-escaped text</returns>
        public static string EscapeHtml(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;

            return HttpUtility.HtmlEncode(text);
        }

        /// <summary>
        /// Sanitizes user input for display
        /// </summary>
        /// <param name="input">User input to sanitize</param>
        /// <param name="allowHtml">Whether to allow HTML tags (default: false)</param>
        /// <returns>Sanitized input</returns>
        public static string SanitizeInput(string input, bool allowHtml = false)
        {
            if (string.IsNullOrEmpty(input)) return string.Empty;

            if (allowHtml)
            {
                return SanitizeHtml(input);
            }
            else
            {
                return EscapeHtml(input);
            }
        }

        /// <summary>
        /// Validates and sanitizes email addresses
        /// </summary>
        /// <param name="email">Email to validate</param>
        /// <returns>Sanitized email or null if invalid</returns>
        public static string? SanitizeEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return null;

            // Remove any HTML/script tags
            var cleanEmail = EscapeHtml(email.Trim());

            // Basic email validation
            var emailRegex = new Regex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$");
            if (!emailRegex.IsMatch(cleanEmail)) return null;

            return cleanEmail;
        }

        /// <summary>
        /// Validates and sanitizes phone numbers
        /// </summary>
        /// <param name="phone">Phone number to validate</param>
        /// <returns>Sanitized phone or null if invalid</returns>
        public static string? SanitizePhone(string phone)
        {
            if (string.IsNullOrEmpty(phone)) return null;

            // Remove all non-digit characters
            var cleanPhone = Regex.Replace(phone, @"\D", "");

            // Validate length (assuming 11 digits for Egyptian numbers)
            if (cleanPhone.Length != 11) return null;

            return cleanPhone;
        }

        /// <summary>
        /// Sanitizes URLs to prevent javascript: and data: protocols
        /// </summary>
        /// <param name="url">URL to sanitize</param>
        /// <returns>Sanitized URL or null if dangerous</returns>
        public static string? SanitizeUrl(string url)
        {
            if (string.IsNullOrEmpty(url)) return null;

            var cleanUrl = url.Trim();

            // Check for dangerous protocols
            var dangerousProtocols = new[] { "javascript:", "data:", "vbscript:", "file:" };
            var lowerUrl = cleanUrl.ToLower();

            foreach (var protocol in dangerousProtocols)
            {
                if (lowerUrl.StartsWith(protocol))
                {
                    return null;
                }
            }

            // Allow only http, https, and relative URLs
            if (!cleanUrl.StartsWith("http://") &&
                !cleanUrl.StartsWith("https://") &&
                !cleanUrl.StartsWith("/") &&
                !cleanUrl.StartsWith("./") &&
                !cleanUrl.StartsWith("../"))
            {
                return null;
            }

            return cleanUrl;
        }

        /// <summary>
        /// Validates input length to prevent buffer overflow attacks
        /// </summary>
        /// <param name="input">Input to validate</param>
        /// <param name="maxLength">Maximum allowed length</param>
        /// <returns>True if valid, false otherwise</returns>
        public static bool ValidateLength(string input, int maxLength)
        {
            if (string.IsNullOrEmpty(input)) return true;
            return input.Length <= maxLength;
        }

        /// <summary>
        /// Validates that input contains only allowed characters
        /// </summary>
        /// <param name="input">Input to validate</param>
        /// <param name="allowedPattern">Regex pattern for allowed characters</param>
        /// <returns>True if valid, false otherwise</returns>
        public static bool ValidatePattern(string input, string allowedPattern)
        {
            if (string.IsNullOrEmpty(input)) return true;
            return Regex.IsMatch(input, allowedPattern);
        }

        /// <summary>
        /// Comprehensive input validation with XSS protection
        /// </summary>
        /// <param name="inputData">Dictionary containing input fields</param>
        /// <param name="validationRules">Validation rules for each field</param>
        /// <returns>Validation result with sanitized data and errors</returns>
        public static ValidationResult ValidateAndSanitizeInput(Dictionary<string, string> inputData, Dictionary<string, ValidationRule> validationRules)
        {
            var errors = new List<string>();
            var sanitizedData = new Dictionary<string, string>();

            foreach (var field in validationRules.Keys)
            {
                var value = inputData.ContainsKey(field) ? inputData[field] : string.Empty;
                var rule = validationRules[field];

                // Sanitize based on field type
                string? sanitizedValue = null;

                switch (rule.Type)
                {
                    case "email":
                        sanitizedValue = SanitizeEmail(value);
                        if (string.IsNullOrEmpty(sanitizedValue) && rule.Required)
                        {
                            errors.Add($"{field} is required and must be a valid email");
                        }
                        break;

                    case "phone":
                        sanitizedValue = SanitizePhone(value);
                        if (string.IsNullOrEmpty(sanitizedValue) && rule.Required)
                        {
                            errors.Add($"{field} is required and must be a valid phone number");
                        }
                        break;

                    case "url":
                        sanitizedValue = SanitizeUrl(value);
                        if (string.IsNullOrEmpty(sanitizedValue) && rule.Required)
                        {
                            errors.Add($"{field} is required and must be a valid URL");
                        }
                        break;

                    case "text":
                    case "textarea":
                        sanitizedValue = SanitizeInput(value, rule.AllowHtml);
                        if (rule.MaxLength > 0 && !ValidateLength(sanitizedValue, rule.MaxLength))
                        {
                            errors.Add($"{field} must be less than {rule.MaxLength} characters");
                        }
                        break;
                }

                // Check required fields
                if (rule.Required && string.IsNullOrEmpty(sanitizedValue))
                {
                    errors.Add($"{field} is required");
                }

                // Check pattern validation
                if (!string.IsNullOrEmpty(rule.Pattern) && !string.IsNullOrEmpty(sanitizedValue))
                {
                    if (!ValidatePattern(sanitizedValue, rule.Pattern))
                    {
                        errors.Add($"{field} contains invalid characters");
                    }
                }

                sanitizedData[field] = sanitizedValue ?? string.Empty;
            }

            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                SanitizedData = sanitizedData,
                Errors = errors
            };
        }
    }

    /// <summary>
    /// Validation rule for input fields
    /// </summary>
    public class ValidationRule
    {
        public string Type { get; set; } = "text";
        public bool Required { get; set; } = false;
        public int MaxLength { get; set; } = 0;
        public bool AllowHtml { get; set; } = false;
        public string Pattern { get; set; } = string.Empty;
    }

    /// <summary>
    /// Result of input validation
    /// </summary>
    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public Dictionary<string, string> SanitizedData { get; set; } = new();
        public List<string> Errors { get; set; } = new();
    }
}
