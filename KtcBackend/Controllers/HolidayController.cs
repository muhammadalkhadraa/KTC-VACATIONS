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
                "1" => "pending",
                "2" => "approved",
                "3" => "rejected",
                _ => "pending"
            };

            return new HolidayRequest
            {
                RequestId = v.VacDocNo ?? 0,
                EmpId = v.EmplNo,
                emp_name = emp?.Name ?? "Unknown",
                startDate = v.VacStartDate,
                end_date = v.VacEndDate,
                days = (int)v.VacDays,
                reason = v.VacNote ?? "",
                status = statusStr,
                manager_status = statusStr,
                manager_id = "",
                gm_status = statusStr,
                gm_id = "",
                submittedAt = v.VacStartDateOriginal ?? v.InsDateTime
            };
        }

        [HttpGet("{empId}")]
        public IActionResult Get(string empId)
            => Ok(_db.VacTransactions.Where(v => v.EmplNo == empId).ToList().Select(v => MapToDto(v)));

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

                requests = requests.Where(r => employeeIds.Contains(r.EmplNo) && r.SysDocStatus == "1");
            }
            else if (normalizedRole == "admin")
            {
                var managerIds = _db.Employees
                    .Where(e => e.Position.ToLower() == "manager")
                    .Select(e => e.Id);

                requests = requests.Where(r => managerIds.Contains(r.EmplNo) && r.SysDocStatus == "1");
            }
            else
            {
                requests = requests.Where(r => r.SysDocStatus == "1");
            }

            return Ok(requests.ToList().Select(v => MapToDto(v)));
        }

        [HttpPost("approve/{id}")]
        public IActionResult Approve(int id, [FromBody] ApprovalInput input)
        {
            var vac = _db.VacTransactions.FirstOrDefault(v => v.VacDocNo == id);
            if (vac == null) return NotFound();

            vac.SysDocStatus = "2"; // 2 = Approved
            _db.SaveChanges();
            
            return Ok(MapToDto(vac));
        }

        [HttpPost("reject/{id}")]
        public IActionResult Reject(int id, [FromBody] ApprovalInput input)
        {
            var vac = _db.VacTransactions.FirstOrDefault(v => v.VacDocNo == id);
            if (vac == null) return NotFound();

            vac.SysDocStatus = "3"; // 3 = Rejected
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

            // 1. Check if a request already exists for this exact key (Prevention of 500 duplicate key error)
            var comp = "01";
            var bran = "01";
            var dept = "02";
            var start = req.startDate.Date;

            var existing = _db.VacTransactions.FirstOrDefault(v => 
                v.CompCode == comp && 
                v.BranCode == bran && 
                v.EmplNo == req.EmpId && 
                v.DeptCode == dept && 
                v.VacStartDate == start);

            if (existing != null)
            {
                return Conflict("A vacation request already exists for this employee starting on this date.");
            }

            // 2. Generate a unique Document Number (since VAC_DOC_NO is not identity)
            int nextId = 1;
            if (_db.VacTransactions.Any(v => v.VacDocNo.HasValue))
            {
                nextId = (_db.VacTransactions.Max(v => v.VacDocNo) ?? 0) + 1;
            }

            var vac = new VacTrn
            {
                VacDocNo = nextId,
                CompCode = comp,
                BranCode = bran,
                DeptCode = dept,
                EmplNo = req.EmpId,
                VacStartDate = start,
                VacStartDateOriginal = DateTime.Now,
                VacEndDate = req.end_date.Date,
                VacDays = (double)req.days,
                VacStartYear = start.Year.ToString(),
                VacStartMonth = start.Month.ToString(),
                VacNote = req.reason ?? "",
                SysDocStatus = "1", // 1 = pending
                VacCode = "01",
                InsDateTime = DateTime.Now,
                ADate = DateTime.Now,
                UDate = DateTime.Now,
                Rsl = 1,
                DwSerial = 0
            };

            _db.VacTransactions.Add(vac);
            _db.SaveChanges();

            return CreatedAtAction(nameof(Get), new { empId = vac.EmplNo }, MapToDto(vac));
        }
    }
}