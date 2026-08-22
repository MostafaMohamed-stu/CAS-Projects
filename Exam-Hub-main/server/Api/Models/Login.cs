using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class Login
{
    public long Id { get; set; }

    public long AccountId { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public long StatusId { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual Status Status { get; set; } = null!;
}
