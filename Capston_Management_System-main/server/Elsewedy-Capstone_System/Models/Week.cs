using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elsewedy_Capstone_System.Models;

[Table("Weeks")]
public partial class Week
{
    [Key]
    public long Id { get; set; }

    public string? WeekTitle { get; set; }

    [Column(TypeName = "date")]
    public DateOnly? StartDate { get; set; }

    [Column(TypeName = "date")]
    public DateOnly? EndDate { get; set; }

    public string? BusinessEntityName { get; set; }
}
