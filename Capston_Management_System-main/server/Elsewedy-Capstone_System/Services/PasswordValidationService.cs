using System.Text.RegularExpressions;

namespace Elsewedy_Capstone_System.Services
{
    /// <summary>
    /// Password Validation Service
    /// Provides comprehensive password complexity validation
    /// </summary>
    public class PasswordValidationService
    {
        /// <summary>
        /// Validates password complexity requirements
        /// </summary>
        /// <param name="password">Password to validate</param>
        /// <returns>Password validation result</returns>
        public static PasswordValidationResult ValidatePassword(string password)
        {
            var result = new PasswordValidationResult
            {
                IsValid = true,
                Errors = new List<string>(),
                Requirements = new PasswordRequirements()
            };

            if (string.IsNullOrEmpty(password))
            {
                result.IsValid = false;
                result.Errors.Add("Password is required");
                return result;
            }

            // Check minimum length
            if (password.Length < 8)
            {
                result.IsValid = false;
                result.Errors.Add("Password must be at least 8 characters long");
            }
            else
            {
                result.Requirements.Length = true;
            }

            // Check for lowercase letter
            if (!Regex.IsMatch(password, @"[a-z]"))
            {
                result.IsValid = false;
                result.Errors.Add("Password must contain at least one lowercase letter (a-z)");
            }
            else
            {
                result.Requirements.Lowercase = true;
            }

            // Check for uppercase letter
            if (!Regex.IsMatch(password, @"[A-Z]"))
            {
                result.IsValid = false;
                result.Errors.Add("Password must contain at least one uppercase letter (A-Z)");
            }
            else
            {
                result.Requirements.Uppercase = true;
            }

            // Check for number
            if (!Regex.IsMatch(password, @"\d"))
            {
                result.IsValid = false;
                result.Errors.Add("Password must contain at least one number (0-9)");
            }
            else
            {
                result.Requirements.Number = true;
            }

            // Check for special character
            if (!Regex.IsMatch(password, @"[@$!%*?&_]"))
            {
                result.IsValid = false;
                result.Errors.Add("Password must contain at least one special character (@$!%*?&_)");
            }
            else
            {
                result.Requirements.Special = true;
            }

            // Calculate strength
            var metRequirements = new[] 
            { 
                result.Requirements.Length, 
                result.Requirements.Lowercase, 
                result.Requirements.Uppercase, 
                result.Requirements.Number, 
                result.Requirements.Special 
            }.Count(x => x);

            if (metRequirements < 3)
            {
                result.Strength = "weak";
            }
            else if (metRequirements < 5)
            {
                result.Strength = "medium";
            }
            else
            {
                result.Strength = "strong";
            }

            return result;
        }

        /// <summary>
        /// Validates password for account creation
        /// </summary>
        /// <param name="password">Password to validate</param>
        /// <returns>True if valid, false otherwise</returns>
        public static bool IsValidPassword(string password)
        {
            return ValidatePassword(password).IsValid;
        }

        /// <summary>
        /// Gets password strength
        /// </summary>
        /// <param name="password">Password to analyze</param>
        /// <returns>Password strength (weak, medium, strong)</returns>
        public static string GetPasswordStrength(string password)
        {
            return ValidatePassword(password).Strength;
        }
    }

    /// <summary>
    /// Password validation result
    /// </summary>
    public class PasswordValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
        public PasswordRequirements Requirements { get; set; } = new();
        public string Strength { get; set; } = "weak";
    }

    /// <summary>
    /// Password requirements checklist
    /// </summary>
    public class PasswordRequirements
    {
        public bool Length { get; set; }
        public bool Lowercase { get; set; }
        public bool Uppercase { get; set; }
        public bool Number { get; set; }
        public bool Special { get; set; }
    }
}
