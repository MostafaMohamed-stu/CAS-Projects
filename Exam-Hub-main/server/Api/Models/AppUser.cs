using Microsoft.AspNetCore.Identity;

namespace QuizesApi.Models
{
    public class AppUser : IdentityUser
    {
       public string Role { get; set; } = string.Empty;
     }
}
