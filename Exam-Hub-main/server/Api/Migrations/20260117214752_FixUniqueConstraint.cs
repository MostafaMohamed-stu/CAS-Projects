using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizesApi.Migrations
{
    /// <inheritdoc />
    public partial class FixUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE [StudentExamAnswer] DROP CONSTRAINT [UQ_StudentExamAnswer_AccountExam]");

            migrationBuilder.CreateIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer",
                columns: new[] { "AccountId", "ExamId", "QuestionId" },
                unique: true,
                filter: "[QuestionId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer");

            migrationBuilder.CreateIndex(
                name: "UQ_StudentExamAnswer_AccountExam",
                table: "StudentExamAnswer",
                columns: new[] { "AccountId", "ExamId" },
                unique: true);
        }
    }
}
