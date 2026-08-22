using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizesApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Exam_Class");

            migrationBuilder.DropIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer");

            migrationBuilder.DropColumn(
                name: "ExamId",
                table: "StudentExamAnswer");

            migrationBuilder.RenameColumn(
                name: "QuestionbankId",
                table: "StudentExamAnswer",
                newName: "QuestionBankID");

            migrationBuilder.RenameIndex(
                name: "IX_StudentExamAnswer_QuestionbankId",
                table: "StudentExamAnswer",
                newName: "IX_StudentExamAnswer_QuestionBankID");

            migrationBuilder.AddColumn<long>(
                name: "ExamQuestionID",
                table: "StudentExamAnswer",
                type: "bigint",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Class_ID",
                table: "Exam_Details",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer",
                columns: new[] { "AccountId", "ExamDetailsID", "QuestionBankID" },
                unique: true,
                filter: "[ExamDetailsID] IS NOT NULL AND [QuestionBankID] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer");

            migrationBuilder.DropColumn(
                name: "ExamQuestionID",
                table: "StudentExamAnswer");

            migrationBuilder.RenameColumn(
                name: "QuestionBankID",
                table: "StudentExamAnswer",
                newName: "QuestionbankId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentExamAnswer_QuestionBankID",
                table: "StudentExamAnswer",
                newName: "IX_StudentExamAnswer_QuestionbankId");

            migrationBuilder.AddColumn<long>(
                name: "ExamId",
                table: "StudentExamAnswer",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AlterColumn<long>(
                name: "Class_ID",
                table: "Exam_Details",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "Exam_Class",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Class_ID = table.Column<long>(type: "bigint", nullable: false),
                    Exam_ID = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Exam_Class__ID", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExamClass_ExamDetail",
                        column: x => x.Exam_ID,
                        principalTable: "Exam_Details",
                        principalColumn: "Exam_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExamClass_TblClass",
                        column: x => x.Class_ID,
                        principalTable: "Tbl_Class",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UQ_StudentExamAnswer_AccountExamQuestion",
                table: "StudentExamAnswer",
                columns: new[] { "AccountId", "ExamDetailsID", "QuestionbankId" },
                unique: true,
                filter: "[ExamDetailsID] IS NOT NULL AND [QuestionbankId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Class_Class_ID",
                table: "Exam_Class",
                column: "Class_ID");

            migrationBuilder.CreateIndex(
                name: "UQ_Exam_Class_ExamId_ClassId",
                table: "Exam_Class",
                columns: new[] { "Exam_ID", "Class_ID" },
                unique: true);
        }
    }
}
