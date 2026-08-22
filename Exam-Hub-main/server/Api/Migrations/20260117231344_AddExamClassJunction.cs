using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizesApi.Migrations
{
    /// <inheritdoc />
    public partial class AddExamClassJunction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Exam_Class",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Exam_ID = table.Column<long>(type: "bigint", nullable: false),
                    Class_ID = table.Column<long>(type: "bigint", nullable: false)
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
                    // table.ForeignKey(
                    //    name: "FK_ExamClass_TblClass",
                    //    column: x => x.Class_ID,
                    //    principalTable: "Tbl_Class",
                    //    principalColumn: "Id",
                    //    onDelete: ReferentialAction.Cascade);
                });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Exam_Class");
        }
    }
}
