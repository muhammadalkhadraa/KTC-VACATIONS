using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System;

namespace KtcBackend
{
    public class KtcContext : DbContext
    {
        public KtcContext(DbContextOptions<KtcContext> options) : base(options) { }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<CheckInStatus> CheckInStatuses { get; set; }
        public DbSet<VacTrn> VacTransactions { get; set; }
        public DbSet<HolidayRequest> HolidayRequests { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Employee>().ToTable("employees");
            modelBuilder.Entity<Role>().ToTable("roles");
            modelBuilder.Entity<CheckInStatus>().ToTable("check_ins");
            modelBuilder.Entity<HolidayRequest>().ToTable("holiday_requests");
            modelBuilder.Entity<VacTrn>().ToTable("VAC_TRN", "dbo").HasKey(v => v.VacDocNo);
        }
    }

    public class Employee
    {
        [Column("id"), Key] public string Id { get; set; } = null!;
        [Column("name")] public string Name { get; set; } = null!;
        [Column("password")] public string Password { get; set; } = null!;
        [Column("role")] public string Role { get; set; } = null!;
        [Column("position")] public string Position { get; set; } = null!;
        [Column("department")] public string Department { get; set; } = null!;
        [Column("joined")] public DateTime Joined { get; set; }
        [Column("used_holidays")] public int UsedHolidays { get; set; }
        [Column("total_holidays")] public int TotalHolidays { get; set; }
    }

    public class Role
    {
        [Column("id"), Key] public int Id { get; set; }
        [Column("name")] public string Name { get; set; } = null!;
    }

    public class CheckInStatus
    {
        [Column("id"), Key] public int Id { get; set; }
        [Column("emp_id")] public string EmpId { get; set; } = null!;
        [Column("check_in_time")] public DateTime? CheckInTime { get; set; }
        [Column("check_out_time")] public DateTime? CheckOutTime { get; set; }
        [Column("state")] public string State { get; set; } = null!;
    }

    public class HolidayRequest
    {
        [Column("request_id"), Key] public int RequestId { get; set; }
        [Column("emp_id")] public string EmpId { get; set; }
        [Column("emp_name")] public string EmpName { get; set; }
        [Column("start_date")] public DateTime StartDate { get; set; }
        [Column("end_date")] public DateTime endDate { get; set; }
        [Column("days")] public int Days { get; set; }
        [Column("reason")] public string Reason { get; set; }
        [Column("status")] public string Status { get; set; }
        [Column("manager_status")] public string ManagerStatus { get; set; }
        [Column("manager_id")] public string ManagerId { get; set; }
        [Column("gm_status")] public string GMStatus { get; set; }
        [Column("gm_id")] public string GMId { get; set; }
        [Column("submitted_at")] public DateTime SubmittedAt { get; set; }
    }

    [Table("VAC_TRN", Schema = "dbo")]
    public class VacTrn
    {
        [Key, Column("VAC_DOC_NO")] public int VacDocNo { get; set; }
        [Column("COMP_CODE")] public string CompCode { get; set; } = "01";
        [Column("BRAN_CODE")] public string BranCode { get; set; } = "01";
        [Column("DEPT_CODE")] public string DeptCode { get; set; } = "02";
        [Column("EMPL_NO")] public string EmplNo { get; set; } = null!;
        
        [Column("VAC_START_DATE")] public DateTime? VacStartDate { get; set; }
        [Column("VAC_START_DATE_ORIGINAL")] public DateTime? VacStartDateOriginal { get; set; }
        [Column("VAC_END_DATE")] public DateTime? VacEndDate { get; set; }
        
        [Column("VAC_START_YEAR")] public int? VacStartYear { get; set; }
        [Column("VAC_START_MONTH")] public int? VacStartMonth { get; set; }
        
        [Column("VAC_DAYS")] public decimal? VacDays { get; set; }
        
        [Column("VAC_CODE")] public string? VacCode { get; set; }
        [Column("VAC_TYPE")] public string? VacType { get; set; }
        [Column("VAC_NOTE")] public string? VacNote { get; set; }
        
        [Column("SYS_DOC_STATUS")] public int? SysDocStatus { get; set; }
    }
}
