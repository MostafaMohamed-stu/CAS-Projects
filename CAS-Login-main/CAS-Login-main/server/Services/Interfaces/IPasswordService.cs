namespace CAS_Login_Back_End.Services.Interfaces;

/// <summary>
/// Hashes and verifies account passwords.
/// </summary>
public interface IPasswordService
{
    string Hash(string password);

    bool Verify(string submittedPassword, string storedPasswordHash);
}
