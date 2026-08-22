using System;
using System.Collections.Generic;

namespace CAS_Login_Back_End.Data.Entities;

public partial class EmailSetting
{
    public long Id { get; set; }

    public string? SmtpServer { get; set; }

    public int? SmtpPort { get; set; }

    public string? SmtpUsername { get; set; }

    public string? SmtpPassword { get; set; }

    public string? SenderEmail { get; set; }
}
