using Microsoft.EntityFrameworkCore;
using QuizesApi.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

var connectionString = "Server=Dbserver;Database=ElsewedySchoolSysDB_DEV;User Id=dev;Password=Elsewedyprojects@IATS2025;Encrypt=False";

var optionsBuilder = new DbContextOptionsBuilder<ElsewedySchoolSysDbDevContext>();
optionsBuilder.UseSqlServer(connectionString);

using (var context = new ElsewedySchoolSysDbDevContext(optionsBuilder.Options))
{
    var count = await context.StudentExamAnswers.CountAsync();
    Console.WriteLine($"Total rows in StudentExamAnswer: {count}");
    
    if (count > 0)
    {
        var firstRow = await context.StudentExamAnswers.FirstOrDefaultAsync();
        Console.WriteLine($"Sample Row: ID={firstRow.Id}, ExamId={firstRow.ExamId}, ExamDetailsId={firstRow.ExamDetailsId}");
    }
}
