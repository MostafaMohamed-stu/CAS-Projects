using System;
using System.Collections.Generic;

namespace AttendanceBehaviour_Backend.Models;

public partial class Notification
{
    public long Id { get; set; }

    public string? Title { get; set; }

    public string? Message { get; set; }

    public long? AccountId { get; set; }

    public long? ReadStatusId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Account? Account { get; set; }
}
