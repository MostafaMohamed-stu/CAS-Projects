using System;

namespace Elsewedy_Capstone_System.DTOs
{
    public class AccountCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
    }

    public class StudentCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
        public bool IsLeader { get; set; }
        public long? ClassId { get; set; }
    }

    public class SupervisorCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
    }

    public class ReviewerCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
        public long? AssignedClassId { get; set; }
    }

    public class AdminCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
    }

    public class AccountUpdateDto
    {
        public string Email { get; set; }
        public string NationalId { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long? AccountTypeId { get; set; }
        public long? StatusId { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ChangePasswordDto
    {
        public string NewPassword { get; set; }
    }

    public class StudentUpdateDto
    {
        public string Email { get; set; }
        public string NationalId { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long? AccountTypeId { get; set; }
        public long? StatusId { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsLeader { get; set; }
        public long? ClassId { get; set; }
    }

    public class ReviewerUpdateDto
    {
        public string Email { get; set; }
        public string NationalId { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long? AccountTypeId { get; set; }
        public long? StatusId { get; set; }
        public bool? IsActive { get; set; }
        public long? AssignedClassId { get; set; }
    }
}



        public class LoginRequest { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
        public class CreateStaffAdminRequest { public string FullNameEn { get; set; } = string.Empty; public string? FullNameAr { get; set; } public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; public string? Phone { get; set; } public string RoleName { get; set; } = "Staff Admin"; public long? ClassId { get; set; } }
        public class CreateSimpleAccountRequest { public string FullNameEn { get; set; } = string.Empty; public string FullNameAr { get; set; } = string.Empty; public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; public string? Phone { get; set; } public string? NationalId { get; set; } public long? RoleId { get; set; } public string? RoleName { get; set; } public long? ClassId { get; set; } }
        public class UpdateAccountRequest { public string FullNameEn { get; set; } = string.Empty; public string? FullNameAr { get; set; } public string Email { get; set; } = string.Empty; public string? Phone { get; set; } public string RoleName { get; set; } = string.Empty; public long? ClassId { get; set; } public string? Password { get; set; } }
        public class AssignEngineerRequest { public long AccountId { get; set; } public long ClassId { get; set; } }
        public class AssignReviewerRequest { public long AccountId { get; set; } public long ClassId { get; set; } }
        public class AddStudentsToCapstoneRequest { public List<long> StudentIds { get; set; } = new(); }
        public class AddRolesToAccountsRequest { public List<long> AccountIds { get; set; } = new(); public string? RoleName { get; set; } public string? BusinessEntityName { get; set; } }