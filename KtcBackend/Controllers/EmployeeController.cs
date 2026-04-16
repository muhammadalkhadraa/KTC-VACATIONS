using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System;

namespace KtcBackend.Controllers
{
    public record InitialBalanceRequest(string EmpId, double Balance);
    public record EmpDetailsUpdate(string EmpId, DateTime? Dob, DateTime? InsuranceDate, string? Role, string? Position);

    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeController : ControllerBase
    {
        private readonly KtcContext _db;
        public EmployeeController(KtcContext db) => _db = db;

        [HttpGet("{id}")]
        public IActionResult Get(string id)
        {
            var emp = _db.Employees.Find(id);
            if (emp == null) return NotFound();

            var prs = _db.PersonnelMaster.FirstOrDefault(p => p.EmplNo == id);

            // Calculate live balance prioritizing PRS_MST data
            double accrued = HolidayCalculator.CalculateAccruedHolidays(emp, DateTime.Today, prs);
            emp.TotalHolidays = (emp.InitialBalance ?? 0) + accrued;

            return Ok(emp);
        }

        [HttpPost("initial-balance")]
        public IActionResult SetInitialBalance([FromBody] InitialBalanceRequest req)
        {
            var emp = _db.Employees.Find(req.EmpId);
            if (emp == null) return NotFound();

            if (emp.IsInitialBalanceSet ?? false)
                return BadRequest("Initial balance has already been set and cannot be modified.");

            emp.InitialBalance = req.Balance;
            emp.IsInitialBalanceSet = true;
            _db.SaveChanges();

            return Ok(emp);
        }

        [HttpPost("details")]
        public IActionResult UpdateDetails([FromBody] EmpDetailsUpdate req)
        {
            var emp = _db.Employees.Find(req.EmpId);
            if (emp == null) return NotFound();

            if (req.Dob.HasValue) emp.DateOfBirth = req.Dob.Value;
            if (req.InsuranceDate.HasValue) emp.InsuranceStartDate = req.InsuranceDate.Value;
            if (!string.IsNullOrEmpty(req.Role)) emp.Role = req.Role;
            if (!string.IsNullOrEmpty(req.Position)) emp.Position = req.Position;
            
            _db.SaveChanges();
            return Ok(emp);
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var emps = _db.Employees.ToList();
            var prsList = _db.PersonnelMaster.ToList().ToDictionary(p => p.EmplNo);

            foreach (var emp in emps)
            {
                prsList.TryGetValue(emp.Id, out var prs);
                double accrued = HolidayCalculator.CalculateAccruedHolidays(emp, DateTime.Today, prs);
                emp.TotalHolidays = (emp.InitialBalance ?? 0) + accrued;
            }
            return Ok(emps);
        }
    }
}
