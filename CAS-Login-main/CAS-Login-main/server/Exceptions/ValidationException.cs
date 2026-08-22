namespace CAS_Login_Back_End.Exceptions;

/// <summary>
/// Exception thrown when validation fails for a request.
/// </summary>
public class ValidationException : Exception
{
    public IReadOnlyCollection<string> Errors { get; }

    public ValidationException(string message) : base(message)
    {
        Errors = new List<string>();
    }

    public ValidationException(string message, params string[] errors) : base(message)
    {
        Errors = errors.ToList().AsReadOnly();
    }

    public ValidationException(string message, IEnumerable<string> errors) : base(message)
    {
        Errors = errors.ToList().AsReadOnly();
    }
}
