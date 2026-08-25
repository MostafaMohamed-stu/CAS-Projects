using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Elsewedy_Capstone_System.Models;

[Table("Roles")]
public partial class Role
{
    [Key]
    public long Id { get; set; }

    public string RoleName { get; set; } = null!;

    public int? OrderNo { get; set; }

    public string? BusinessEntity { get; set; }

}