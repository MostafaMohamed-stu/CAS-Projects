using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizesApi.Migrations
{
    /// <inheritdoc />
    public partial class FixConstraints_Final : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop any potential ghost columns/constraints from previous failed states
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_StudentExamAnswer_ExamQuestion') ALTER TABLE [StudentExamAnswer] DROP CONSTRAINT [FK_StudentExamAnswer_ExamQuestion]");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_StudentExamAnswer_ExamQuestion_Real') ALTER TABLE [StudentExamAnswer] DROP CONSTRAINT [FK_StudentExamAnswer_ExamQuestion_Real]");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_StudentExamAnswer_QuestionBank') ALTER TABLE [StudentExamAnswer] DROP CONSTRAINT [FK_StudentExamAnswer_QuestionBank]");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_StudentExamAnswer_Exam') ALTER TABLE [StudentExamAnswer] DROP CONSTRAINT [FK_StudentExamAnswer_Exam]");

            // Clean up orphan data that violates the new constraints (e.g. answers for deleted exams or questions)
            migrationBuilder.Sql("DELETE FROM [StudentExamAnswer] WHERE [ExamId] NOT IN (SELECT [Exam_ID] FROM [Exam_Details])");
            migrationBuilder.Sql("DELETE FROM [StudentExamAnswer] WHERE [QuestionId] NOT IN (SELECT [Question_ID] FROM [Question_Bank])");

            // Drop the shadow property ExamQuestionId column if it exists (EF detected it as a change)
            migrationBuilder.Sql("IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'ExamQuestionId' AND Object_ID = Object_ID(N'StudentExamAnswer')) ALTER TABLE [StudentExamAnswer] DROP COLUMN [ExamQuestionId]");
            
            // Add the correct Foreign Keys
            // ExamId -> Exam_Details
            migrationBuilder.Sql("ALTER TABLE [StudentExamAnswer] ADD CONSTRAINT [FK_StudentExamAnswer_Exam] FOREIGN KEY ([ExamId]) REFERENCES [Exam_Details] ([Exam_ID]) ON DELETE CASCADE");

            // QuestionId -> Question_Bank
            migrationBuilder.Sql("ALTER TABLE [StudentExamAnswer] ADD CONSTRAINT [FK_StudentExamAnswer_QuestionBank] FOREIGN KEY ([QuestionId]) REFERENCES [Question_Bank] ([Question_ID])");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ExamQuestionId",
                table: "StudentExamAnswer",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentExamAnswer_ExamQuestionId",
                table: "StudentExamAnswer",
                column: "ExamQuestionId");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentExamAnswer_ExamQuestion_ExamQuestionId",
                table: "StudentExamAnswer",
                column: "ExamQuestionId",
                principalTable: "ExamQuestion",
                principalColumn: "Id");
        }
    }
}
