namespace CAS_Login_Back_End.Models.Responses;

/// <summary>
/// Response model for role information.
/// </summary>
public class RoleResponse
{
    public int RoleId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}
