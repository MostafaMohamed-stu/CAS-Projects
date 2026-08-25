using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elsewedy_Capstone_System.Models;

[Table("AccountRoles")]
public class AccountRole
{
    [Key]
    [Column("ID")]
    public long Id { get; set; }

    [Column("RoleID")]
    public long RoleId { get; set; }

    [Column("AccountID")]
    public long AccountId { get; set; }

    [Column("BusinessEntityName")]
    public string BusinessEntityName { get; set; } = null!;
}


