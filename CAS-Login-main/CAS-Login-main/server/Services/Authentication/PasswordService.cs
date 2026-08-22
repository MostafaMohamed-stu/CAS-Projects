using System.Security.Cryptography;
using System.Text;
using CAS_Login_Back_End.Services.Interfaces;

namespace CAS_Login_Back_End.Services.Authentication;

/// <summary>
/// BCrypt password service that also accepts the exact stored hash.
/// </summary>
public sealed class PasswordService : IPasswordService
{
    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public bool Verify(string submittedPassword, string storedPasswordHash)
    {
        try
        {
            if (BCrypt.Net.BCrypt.Verify(submittedPassword, storedPasswordHash))
            {
                return true;
            }
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // The direct comparison below supports legacy/non-BCrypt values.
        }

        return FixedTimeEquals(submittedPassword, storedPasswordHash);
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left);
        var rightBytes = Encoding.UTF8.GetBytes(right);

        return leftBytes.Length == rightBytes.Length &&
               CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }
}
