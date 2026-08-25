using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Login")]
public partial class Login
{
    [Key]
    public long Id { get; set; }

    public long AccountId { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public long StatusId { get; set; }

    [ForeignKey("AccountId")]
    [InverseProperty("Logins")]
    public virtual Account Account { get; set; } = null!;

    [ForeignKey("StatusId")]
    [InverseProperty("Logins")]
    public virtual Status Status { get; set; } = null!;
}
