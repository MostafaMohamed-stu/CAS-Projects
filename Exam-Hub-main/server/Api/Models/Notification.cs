using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

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
