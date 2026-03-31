using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KtcBackend.Migrations
{
    /// <inheritdoc />
    public partial class FixSnakeCaseConflicts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Roles",
                table: "Roles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Employees",
                table: "Employees");

            migrationBuilder.DropPrimaryKey(
                name: "PK_HolidayRequests",
                table: "HolidayRequests");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CheckIns",
                table: "CheckIns");

            migrationBuilder.RenameTable(
                name: "Roles",
                newName: "roles");

            migrationBuilder.RenameTable(
                name: "Employees",
                newName: "employees");

            migrationBuilder.RenameTable(
                name: "HolidayRequests",
                newName: "holiday_requests");

            migrationBuilder.RenameTable(
                name: "CheckIns",
                newName: "check_ins");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "roles",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "roles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "Role",
                table: "employees",
                newName: "role");

            migrationBuilder.RenameColumn(
                name: "Position",
                table: "employees",
                newName: "position");

            migrationBuilder.RenameColumn(
                name: "Password",
                table: "employees",
                newName: "password");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "employees",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Joined",
                table: "employees",
                newName: "joined");

            migrationBuilder.RenameColumn(
                name: "Department",
                table: "employees",
                newName: "department");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "employees",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UsedHolidays",
                table: "employees",
                newName: "used_holidays");

            migrationBuilder.RenameColumn(
                name: "TotalHolidays",
                table: "employees",
                newName: "total_holidays");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "holiday_requests",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Reason",
                table: "holiday_requests",
                newName: "reason");

            migrationBuilder.RenameColumn(
                name: "Days",
                table: "holiday_requests",
                newName: "days");

            migrationBuilder.RenameColumn(
                name: "SubmittedAt",
                table: "holiday_requests",
                newName: "submitted_at");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "holiday_requests",
                newName: "start_date");

            migrationBuilder.RenameColumn(
                name: "ManagerStatus",
                table: "holiday_requests",
                newName: "manager_status");

            migrationBuilder.RenameColumn(
                name: "ManagerId",
                table: "holiday_requests",
                newName: "manager_id");

            migrationBuilder.RenameColumn(
                name: "GMStatus",
                table: "holiday_requests",
                newName: "gm_status");

            migrationBuilder.RenameColumn(
                name: "GMId",
                table: "holiday_requests",
                newName: "gm_id");

            migrationBuilder.RenameColumn(
                name: "EndDate",
                table: "holiday_requests",
                newName: "end_date");

            migrationBuilder.RenameColumn(
                name: "EmpName",
                table: "holiday_requests",
                newName: "emp_name");

            migrationBuilder.RenameColumn(
                name: "EmpId",
                table: "holiday_requests",
                newName: "emp_id");

            migrationBuilder.RenameColumn(
                name: "RequestId",
                table: "holiday_requests",
                newName: "request_id");

            migrationBuilder.RenameColumn(
                name: "State",
                table: "check_ins",
                newName: "state");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "check_ins",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "EmpId",
                table: "check_ins",
                newName: "emp_id");

            migrationBuilder.RenameColumn(
                name: "CheckOutTime",
                table: "check_ins",
                newName: "check_out_time");

            migrationBuilder.RenameColumn(
                name: "CheckInTime",
                table: "check_ins",
                newName: "check_in_time");

            migrationBuilder.AddPrimaryKey(
                name: "pk_roles",
                table: "roles",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_employees",
                table: "employees",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_holiday_requests",
                table: "holiday_requests",
                column: "request_id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_check_ins",
                table: "check_ins",
                column: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "pk_roles",
                table: "roles");

            migrationBuilder.DropPrimaryKey(
                name: "pk_employees",
                table: "employees");

            migrationBuilder.DropPrimaryKey(
                name: "pk_holiday_requests",
                table: "holiday_requests");

            migrationBuilder.DropPrimaryKey(
                name: "pk_check_ins",
                table: "check_ins");

            migrationBuilder.RenameTable(
                name: "roles",
                newName: "Roles");

            migrationBuilder.RenameTable(
                name: "employees",
                newName: "Employees");

            migrationBuilder.RenameTable(
                name: "holiday_requests",
                newName: "HolidayRequests");

            migrationBuilder.RenameTable(
                name: "check_ins",
                newName: "CheckIns");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Roles",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Roles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "role",
                table: "Employees",
                newName: "Role");

            migrationBuilder.RenameColumn(
                name: "position",
                table: "Employees",
                newName: "Position");

            migrationBuilder.RenameColumn(
                name: "password",
                table: "Employees",
                newName: "Password");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Employees",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "joined",
                table: "Employees",
                newName: "Joined");

            migrationBuilder.RenameColumn(
                name: "department",
                table: "Employees",
                newName: "Department");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Employees",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "used_holidays",
                table: "Employees",
                newName: "UsedHolidays");

            migrationBuilder.RenameColumn(
                name: "total_holidays",
                table: "Employees",
                newName: "TotalHolidays");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "HolidayRequests",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "reason",
                table: "HolidayRequests",
                newName: "Reason");

            migrationBuilder.RenameColumn(
                name: "days",
                table: "HolidayRequests",
                newName: "Days");

            migrationBuilder.RenameColumn(
                name: "submitted_at",
                table: "HolidayRequests",
                newName: "SubmittedAt");

            migrationBuilder.RenameColumn(
                name: "start_date",
                table: "HolidayRequests",
                newName: "StartDate");

            migrationBuilder.RenameColumn(
                name: "manager_status",
                table: "HolidayRequests",
                newName: "ManagerStatus");

            migrationBuilder.RenameColumn(
                name: "manager_id",
                table: "HolidayRequests",
                newName: "ManagerId");

            migrationBuilder.RenameColumn(
                name: "gm_status",
                table: "HolidayRequests",
                newName: "GMStatus");

            migrationBuilder.RenameColumn(
                name: "gm_id",
                table: "HolidayRequests",
                newName: "GMId");

            migrationBuilder.RenameColumn(
                name: "end_date",
                table: "HolidayRequests",
                newName: "EndDate");

            migrationBuilder.RenameColumn(
                name: "emp_name",
                table: "HolidayRequests",
                newName: "EmpName");

            migrationBuilder.RenameColumn(
                name: "emp_id",
                table: "HolidayRequests",
                newName: "EmpId");

            migrationBuilder.RenameColumn(
                name: "request_id",
                table: "HolidayRequests",
                newName: "RequestId");

            migrationBuilder.RenameColumn(
                name: "state",
                table: "CheckIns",
                newName: "State");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "CheckIns",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "emp_id",
                table: "CheckIns",
                newName: "EmpId");

            migrationBuilder.RenameColumn(
                name: "check_out_time",
                table: "CheckIns",
                newName: "CheckOutTime");

            migrationBuilder.RenameColumn(
                name: "check_in_time",
                table: "CheckIns",
                newName: "CheckInTime");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Roles",
                table: "Roles",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Employees",
                table: "Employees",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_HolidayRequests",
                table: "HolidayRequests",
                column: "RequestId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CheckIns",
                table: "CheckIns",
                column: "Id");
        }
    }
}
