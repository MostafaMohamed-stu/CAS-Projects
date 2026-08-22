using System;
using System.Collections.Generic;

namespace QuizesApi.Models;

public partial class TicketType
{
    public long Id { get; set; }

    public string TicketTypeName { get; set; } = null!;

    public int? OrderNo { get; set; }

    public string? BusinessEntity { get; set; }

    public long StatusId { get; set; }

    public virtual Status Status { get; set; } = null!;

    public virtual ICollection<SubordinateTicket> SubordinateTickets { get; set; } = new List<SubordinateTicket>();
}
