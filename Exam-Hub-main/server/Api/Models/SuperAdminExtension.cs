using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class SuperAdminExtension
{
    public long AccountId { get; set; }

    public long StatusId { get; set; }

    public virtual Account Account { get; set; } = null!;

    public virtual Status Status { get; set; } = null!;
}
