using SchoolAdmission.Repos.IRepos;
using SchoolAdmission.Models;
using SchoolAdmission.Data;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.DTOs;
namespace SchoolAdmission.Repos;

public class StudentRepo : GenericRepo<Account>, IStudentRepo {
    public StudentRepo(SchoolAdmissionDbContext db) : base(db)
    {
    }
    public async Task<Account?> getStudentByNationalIdWithIncludeAsync(string nationalId)
    {
        // Get applicant role ID - applicants don't have Login records, so we check Account.RoleId directly
        var applicantRole = await db.Roles
            .FirstOrDefaultAsync(r => r.RoleName == "Applicant" && r.BusinessEntity == "Admission");
        
        if (applicantRole == null)
            return null;

        var student = await db.Accounts
            .Include(a => a.Role)
            .Include(a => a.AdmissionProfile)
            .FirstOrDefaultAsync(a => a.NationalId == nationalId && a.RoleId == applicantRole.Id);

        return student;
    }

    public async Task<IEnumerable<object>> getAllStudentsAsync(){
        // Get applicant role ID
        var applicantRole = await db.Roles
            .FirstOrDefaultAsync(r => r.RoleName == "Applicant" && r.BusinessEntity == "Admission");
        
        if (applicantRole == null)
            return new List<object>();

        var students = await db.Accounts
            .Where(a => a.RoleId == applicantRole.Id && a.IsActive == true)
            .Select(a => new
            {
                id = a.Id,
                fullName = a.FullNameAr,
                nationalId = a.NationalId
            })
            .ToListAsync();
        return students;
    }

    public async Task<IEnumerable<object>> searchStudentsByNameAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return new List<object>();

        var applicantRole = await db.Roles
            .FirstOrDefaultAsync(r => r.RoleName == "Applicant" && r.BusinessEntity == "Admission");

        if (applicantRole == null)
            return new List<object>();

        var nameTrimmed = query.Trim();

        var students = await db.Accounts
            .Where(a => a.RoleId == applicantRole.Id 
                     && a.IsActive == true 
                     && (a.FullNameAr.Contains(nameTrimmed) || a.FullNameEn.Contains(nameTrimmed)))
            .Take(20)
            .Select(a => new
            {
                id = a.Id,
                fullName = !string.IsNullOrEmpty(a.FullNameAr) ? a.FullNameAr : a.FullNameEn,
                nationalId = a.NationalId
            })
            .ToListAsync();

        return students;
    }

    public async Task<bool> getStudentByEmailAsync(string email){
        var student = await db.Accounts
        .FirstOrDefaultAsync(a => a.Email == email);
        return student != null;

    }

    public async Task<bool> hasStudentCompletedExamAsync(string nationalId){
        // Get applicant role ID
        var applicantRole = await db.Roles
            .FirstOrDefaultAsync(r => r.RoleName == "Applicant" && r.BusinessEntity == "Admission");
        
        if (applicantRole == null)
            return false;

        var student = await db.Accounts
            .Include(a => a.StudentExamResult)
            .FirstOrDefaultAsync(a => a.NationalId == nationalId && a.RoleId == applicantRole.Id);
        return student?.StudentExamResult != null;
    }
    
    public async Task<bool> studentExistsAsync(string nationalId){
        // Get applicant role ID
        var applicantRole = await db.Roles
            .FirstOrDefaultAsync(r => r.RoleName == "Applicant" && r.BusinessEntity == "Admission");
        
        if (applicantRole == null)
            return false;

        return await db.Accounts.AnyAsync(a => a.NationalId == nationalId && a.RoleId == applicantRole.Id);
    }

    public async Task<long> getStudentRoleIdAsync(string roleName){
        var student = await db.Roles.FirstOrDefaultAsync(r => r.RoleName == roleName && r.BusinessEntity == "Admission");

        return student?.Id ?? -1;
    }

















    public async Task<string> UploadStudentDocumentAsync(string nationalId, string documentType, IFormFile file, string webRootPath){
        var student = await getStudentByNationalIdWithIncludeAsync(nationalId);
        if(student == null)
            throw new InvalidOperationException("Student not found");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
            throw new ArgumentException("Invalid file type. Only JPG, PNG, and PDF files are allowed.");

        if (file.Length > 10 * 1024 * 1024)
            throw new ArgumentException("File size too large. Maximum size is 10MB.");

        // Setup directory
        var uploadsPath = Path.Combine(webRootPath, "uploads", "documents");
        if (!Directory.Exists(uploadsPath))
            Directory.CreateDirectory(uploadsPath);

        // Save file
        var fileName = $"{nationalId}_{documentType}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        // Update admission profile record
        var relativePath = $"/uploads/documents/{fileName}";
        UpdateAdmissionProfileDocumentPath(student.AdmissionProfile, documentType, relativePath);

        await SaveChangesAsync();

        return relativePath;
    }

     private void UpdateAdmissionProfileDocumentPath(AdmissionProfile admissionProfile, string documentType, string path)
    {
        switch (documentType.ToLower())
        {
            case "birthcertificate":
                admissionProfile.BirthCertificatePath = path;
                break;
            case "successreport":
                admissionProfile.SuccessReportPath = path;
                break;
            case "tuitionfeereceipt":
                admissionProfile.TuitionFeeReceiptPath = path;
                break;
            case "preferencessheet":
                admissionProfile.PreferencesSheetPath = path;
                break;
            default:
                throw new ArgumentException("Invalid document type");
        }
    }

}