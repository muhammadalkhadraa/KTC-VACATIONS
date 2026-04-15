using KtcBackend;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System;

namespace KtcBackend.Controllers
{
    public record ApprovalInput(string ApproverId, string ApproverRole);

    [ApiController]
    [Route("api/[controller]")]
    public class HolidayController : ControllerBase
    {
        private readonly KtcContext _db;
        public HolidayController(KtcContext db) => _db = db;

        private HolidayRequest MapToDto(VacTrn v)
        {
            var emp = _db.Employees.FirstOrDefault(e => e.Id == v.EmplNo);
            var statusStr = v.SysDocStatus switch 
            {
                1 => "pending",
                2 => "approved",
                3 => "rejected",
                _ => "pending"
            };

            return new HolidayRequest
            {
                RequestId = v.VacDocNo,
                EmpId = v.EmplNo,
                EmpName = emp?.Name ?? "Unknown",
                StartDate = v.VacStartDate ?? DateTime.UtcNow,
                endDate = v.VacEndDate ?? DateTime.UtcNow,
                Days = (int)(v.VacDays ?? 0),
                Reason = v.VacNote ?? "",
                Status = statusStr,
                ManagerStatus = statusStr, // Simplified for VacTrn mapping
                GMStatus = statusStr,
                ManagerId = "",
                GMId = "",
                SubmittedAt = v.VacStartDateOriginal ?? DateTime.UtcNow
            };
        }

        [HttpGet("{empId}")]
        public IActionResult Get(string empId)
            => Ok(_db.VacTransactions.Where(v => v.EmplNo == empId).ToList().Select(v => MapToDto(v)));

        // admin: all requests
        [HttpGet]
        public IActionResult GetAll()
            => Ok(_db.VacTransactions.ToList().Select(v => MapToDto(v)));

        [HttpGet("pending")]
        public IActionResult GetPending([FromQuery] string? role)
        {
            var requests = _db.VacTransactions.AsQueryable();

            var normalizedRole = (role ?? string.Empty).Trim().ToLowerInvariant();

            if (normalizedRole == "manager")
            {
                var employeeIds = _db.Employees
                    .Where(e => e.Position.ToLower() != "manager" && e.Position.ToLower() != "general manager")
                    .Select(e => e.Id);

                // Assuming SysDocStatus = 1 is pending
                requests = requests.Where(r => employeeIds.Contains(r.EmplNo) && r.SysDocStatus == 1);
            }
            else if (normalizedRole == "admin")
            {
                var managerIds = _db.Employees
                    .Where(e => e.Position.ToLower() == "manager")
                    .Select(e => e.Id);

                requests = requests.Where(r => managerIds.Contains(r.EmplNo) && r.SysDocStatus == 1);
            }
            else
            {
                requests = requests.Where(r => r.SysDocStatus == 1);
            }

            return Ok(requests.ToList().Select(v => MapToDto(v)));
        }

        // admin actions
        [HttpPost("approve/{id}")]
        public IActionResult Approve(int id, [FromBody] ApprovalInput input)
        {
            var vac = _db.VacTransactions.Find(id);
            if (vac == null) return NotFound();

            // Set state to approved map
            vac.SysDocStatus = 2; // 2 = Approved
            _db.SaveChanges();
            
            return Ok(MapToDto(vac));
        }

        [HttpPost("reject/{id}")]
        public IActionResult Reject(int id, [FromBody] ApprovalInput input)
        {
            var vac = _db.VacTransactions.Find(id);
            if (vac == null) return NotFound();

            // set state to rejected
            vac.SysDocStatus = 3; // 3 = Rejected
            _db.SaveChanges();

            return Ok(MapToDto(vac));
        }

        [HttpPost]
        public IActionResult Submit([FromBody] HolidayRequest req)
        {
            var requester = _db.Employees.Find(req.EmpId);
            if (requester == null)
                return BadRequest("Unknown employee");

            var requesterPosition = (requester.Position ?? string.Empty).Trim().ToLowerInvariant();
            if (requesterPosition == "general manager")
                return BadRequest("General manager cannot create holiday requests");

            var vac = new VacTrn
            {
                CompCode = "01",
                BranCode = "01",
                DeptCode = "02",
                EmplNo = req.EmpId,
                VacStartDate = req.StartDate,
                VacStartDateOriginal = DateTime.UtcNow,
                VacEndDate = req.endDate,
                VacDays = req.Days,
                VacStartYear = req.StartDate.Year,
                VacStartMonth = req.StartDate.Month,
                VacNote = req.Reason ?? "",
                SysDocStatus = 1 // 1 = pending
            };

            _db.VacTransactions.Add(vac);
            _db.SaveChanges();

            return CreatedAtAction(nameof(Get), new { empId = vac.EmplNo }, MapToDto(vac));
        }
    }
}