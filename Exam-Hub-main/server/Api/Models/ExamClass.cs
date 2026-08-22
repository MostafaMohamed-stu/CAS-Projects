using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizesApi.Models;

[Table("Exam_Class")]
public class ExamClass
{
    [Key]
    public long Id { get; set; }

    [Column("Exam_ID")]
    public long ExamId { get; set; }

    [Column("Class_ID")]
    public long ClassId { get; set; }

    // Navigation properties
    [ForeignKey("ExamId")]
    public ExamDetail Exam { get; set; } = null!;

    [ForeignKey("ClassId")]
    public TblClass Class { get; set; } = null!;
}

