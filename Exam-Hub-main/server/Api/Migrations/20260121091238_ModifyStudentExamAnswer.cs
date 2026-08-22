using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizesApi.Migrations
{
    /// <inheritdoc />
    public partial class ModifyStudentExamAnswer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentExamAnswer_Exam",
                table: "StudentExamAnswer");

/*
            migrationBuilder.DropIndex(
                name: "IX_StudentExamAnswer_ExamId",
                table: "StudentExamAnswer");
*/

            migrationBuilder.DropIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer");

            migrationBuilder.RenameColumn(
                name: "QuestionId",
                table: "StudentExamAnswer",
                newName: "QuestionbankId");

/*
            migrationBuilder.RenameIndex(
                name: "IX_StudentExamAnswer_QuestionId",
                table: "StudentExamAnswer",
                newName: "IX_StudentExamAnswer_QuestionbankId");
*/

            migrationBuilder.AddColumn<long>(
                name: "ExamDetailsID",
                table: "StudentExamAnswer",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentExamAnswer_ExamDetailsID",
                table: "StudentExamAnswer",
                column: "ExamDetailsID");

            migrationBuilder.CreateIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer",
                columns: new[] { "AccountId", "ExamDetailsID", "QuestionbankId" },
                unique: true,
                filter: "[ExamDetailsID] IS NOT NULL AND [QuestionbankId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentExamAnswer_ExamDetail",
                table: "StudentExamAnswer",
                column: "ExamDetailsID",
                principalTable: "Exam_Details",
                principalColumn: "Exam_ID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentExamAnswer_ExamDetail",
                table: "StudentExamAnswer");

            migrationBuilder.DropIndex(
                name: "IX_StudentExamAnswer_ExamDetailsID",
                table: "StudentExamAnswer");

            migrationBuilder.DropIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer");

            migrationBuilder.DropColumn(
                name: "ExamDetailsID",
                table: "StudentExamAnswer");

            migrationBuilder.RenameColumn(
                name: "QuestionbankId",
                table: "StudentExamAnswer",
                newName: "QuestionId");

/*
            migrationBuilder.RenameIndex(
                name: "IX_StudentExamAnswer_QuestionbankId",
                table: "StudentExamAnswer",
                newName: "IX_StudentExamAnswer_QuestionId");
*/

            migrationBuilder.CreateIndex(
                name: "IX_StudentExamAnswer_ExamId",
                table: "StudentExamAnswer",
                column: "ExamId");

            migrationBuilder.CreateIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer",
                columns: new[] { "AccountId", "ExamId", "QuestionId" },
                unique: true,
                filter: "[QuestionId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentExamAnswer_Exam",
                table: "StudentExamAnswer",
                column: "ExamId",
                principalTable: "Exam_Details",
                principalColumn: "Exam_ID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
