using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class Notification
{
    public long Id { get; set; }

    public long? AccountId { get; set; }

    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    public long? ReadStatusId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Account? Account { get; set; }
}
