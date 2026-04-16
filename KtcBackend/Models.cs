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
        public DbSet<PrsMst> PersonnelMaster { get; set; }
        public DbSet<WorkingHoursRule> WorkingHours { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Employee>().ToTable("employees");
            modelBuilder.Entity<Role>().ToTable("roles");
            modelBuilder.Entity<CheckInStatus>().ToTable("CheckIns");
            modelBuilder.Entity<WorkingHoursRule>().ToTable("WorkingHours");
            modelBuilder.Entity<HolidayRequest>().ToTable("holiday_requests");
            modelBuilder.Entity<VacTrn>().ToTable("VAC_TRN", "dbo")
                .HasKey(v => new { v.CompCode, v.BranCode, v.EmplNo, v.DeptCode, v.VacStartDate });
            modelBuilder.Entity<PrsMst>().ToTable("PRS_MST", "dbo").HasKey(p => p.EmplNo);
        }
    }

    public class Employee
    {
        [Key] public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string Position { get; set; } = null!;
        public string Department { get; set; } = null!;
        public DateTime Joined { get; set; }
        public double UsedHolidays { get; set; }
        public double TotalHolidays { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? InsuranceStartDate { get; set; }
        public double? InitialBalance { get; set; }
        public bool? IsInitialBalanceSet { get; set; }
    }

    public class Role
    {
        [Column("id"), Key] public int Id { get; set; }
        [Column("name")] public string Name { get; set; } = null!;
    }

    public class CheckInStatus
    {
        [Key] public int Id { get; set; }
        public string EmpId { get; set; } = null!;
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public string State { get; set; } = null!;
    }

    public class WorkingHoursRule
    {
        [Key] public int Id { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public TimeSpan CheckInTime { get; set; }
        public TimeSpan CheckOutTime { get; set; }
    }

    public class HolidayRequest
    {
        [Column("request_id"), Key] public int RequestId { get; set; }
        [Column("emp_id")] public string EmpId { get; set; }
        [Column("emp_name")] public string emp_name { get; set; }
        [Column("start_date")] public DateTime startDate { get; set; }
        [Column("end_date")] public DateTime end_date { get; set; }
        [Column("days")] public double days { get; set; }
        [Column("reason")] public string reason { get; set; }
        [Column("status")] public string status { get; set; }
        [Column("manager_status")] public string manager_status { get; set; }
        [Column("manager_id")] public string manager_id { get; set; }
        [Column("gm_status")] public string gm_status { get; set; }
        [Column("gm_id")] public string gm_id { get; set; }
        [Column("submitted_at")] public DateTime submittedAt { get; set; }
    }

    [Table("VAC_TRN", Schema = "dbo")]
    public class VacTrn
    {
        [Column("VAC_DOC_NO")] public int? VacDocNo { get; set; }
        [Column("COMP_CODE")] public string CompCode { get; set; } = "01";
        [Column("BRAN_CODE")] public string BranCode { get; set; } = "01";
        [Column("DEPT_CODE")] public string DeptCode { get; set; } = "02";
        [Column("EMPL_NO")] public string EmplNo { get; set; } = null!;
        
        [Column("VAC_START_DATE")] public DateTime VacStartDate { get; set; }
        [Column("VAC_START_DATE_ORIGINAL")] public DateTime? VacStartDateOriginal { get; set; }
        [Column("VAC_END_DATE")] public DateTime VacEndDate { get; set; }
        
        [Column("VAC_START_YEAR")] public string? VacStartYear { get; set; }
        [Column("VAC_START_MONTH")] public string? VacStartMonth { get; set; }
        
        [Column("VAC_DAYS")] public double VacDays { get; set; }
        
        [Column("VAC_CODE")] public string VacCode { get; set; } = "01";
        [Column("VAC_TYPE")] public string? VacType { get; set; }
        [Column("VAC_NOTE")] public string VacNote { get; set; } = "";
        
        [Column("SYS_DOC_STATUS")] public string? SysDocStatus { get; set; }

        [Column("INS_DATETIME")] public DateTime InsDateTime { get; set; } = DateTime.Now;
        [Column("A_ID")] public string? AId { get; set; }
        [Column("A_DATE")] public DateTime ADate { get; set; } = DateTime.Now;
        [Column("A_TIME")] public string? ATime { get; set; }
        [Column("U_ID")] public string? UId { get; set; }
        [Column("U_DATE")] public DateTime UDate { get; set; } = DateTime.Now;
        [Column("U_TIME")] public string? UTime { get; set; }
        
        [Column("RSL")] public int Rsl { get; set; } = 1;
        [Column("DW_SERIAL")] public int DwSerial { get; set; } = 0;
    }

    [Table("PRS_MST", Schema = "dbo")]
    public class PrsMst
    {
        [Key, Column("EMPL_NO")] public string EmplNo { get; set; } = null!;
        [Column("EMPL_ENAME")] public string? NameEnglish { get; set; }
        [Column("BIRTH_DATE")] public DateTime? BirthDate { get; set; }
        [Column("INSUR_DATE")] public DateTime? InsuranceDate { get; set; }
        [Column("START_DATE")] public DateTime? StartDate { get; set; }
    }
}
