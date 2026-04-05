using KtcBackend;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace KtcBackend.Controllers
{
    public record ApprovalInput(string ApproverId, string ApproverRole);

    [ApiController]
    [Route("api/[controller]")]
    public class HolidayController : ControllerBase
    {
        private readonly KtcContext _db;
        public HolidayController(KtcContext db) => _db = db;

        private void UpdateOverallStatus(HolidayRequest req)
        {
            if (req.ManagerStatus == "rejected" || req.GMStatus == "rejected")
            {
                req.Status = "rejected";
                return;
            }

            var requester = _db.Employees.Find(req.EmpId);
            var requesterPosition = (requester?.Position ?? string.Empty).Trim().ToLowerInvariant();
            var isManagerRequest = requesterPosition == "manager";

            // Correct hierarchy:
            // - Employee requests: manager approval only
            // - Manager requests: GM approval only
            req.Status = isManagerRequest
                ? (req.GMStatus == "approved" ? "approved" : "pending")
                : (req.ManagerStatus == "approved" ? "approved" : "pending");
        }

        [HttpGet("{empId}")]
        public IActionResult Get(string empId)
            => Ok(_db.HolidayRequests.Where(h => h.EmpId == empId));

        // admin: all requests
        [HttpGet]
        public IActionResult GetAll()
            => Ok(_db.HolidayRequests);

        [HttpGet("pending")]
        public IActionResult GetPending([FromQuery] string? role)
        {
            var requests = _db.HolidayRequests.AsQueryable();

            var normalizedRole = (role ?? string.Empty).Trim().ToLowerInvariant();

            if (normalizedRole == "manager")
            {
                // Managers see requests from regular employees (not managers or GMs)
                var employeeIds = _db.Employees
                    .Where(e => e.Position.ToLower() != "manager" && e.Position.ToLower() != "general manager")
                    .Select(e => e.Id);

                requests = requests.Where(r => employeeIds.Contains(r.EmpId) && r.ManagerStatus == "pending");
            }
            else if (normalizedRole == "admin")
            {
                // General manager sees manager requests only, pending GM approval.
                var managerIds = _db.Employees
                    .Where(e => e.Position.ToLower() == "manager")
                    .Select(e => e.Id);

                requests = requests.Where(r => managerIds.Contains(r.EmpId) && r.GMStatus == "pending");
            }
            else
            {
                requests = requests.Where(h => h.Status == "pending");
            }

            return Ok(requests);
        }

        // admin actions
        [HttpPost("approve/{id}")]
        public IActionResult Approve(int id, [FromBody] ApprovalInput input)
        {
            var req = _db.HolidayRequests.Find(id);
            if (req == null) return NotFound();

            var approverRole = (input.ApproverRole ?? string.Empty).Trim().ToLowerInvariant();

            if (approverRole == "manager")
            {
                if (req.ManagerStatus != "pending")
                    return BadRequest("Request is not pending manager approval.");

                req.ManagerStatus = "approved";
                req.ManagerId = input.ApproverId;
            }
            else if (approverRole == "admin")
            {
                // GM should only approve manager requests.
                var requester = _db.Employees.Find(req.EmpId);
                var requesterPosition = (requester?.Position ?? string.Empty).Trim().ToLowerInvariant();
                if (requesterPosition != "manager")
                    return BadRequest("General manager can only approve manager requests.");

                req.GMStatus = "approved";
                req.GMId = input.ApproverId;
            }
            else if (approverRole == "system_admin")
            {
                req.ManagerStatus = "approved";
                req.GMStatus = "approved";
                req.ManagerId = input.ApproverId;
                req.GMId = input.ApproverId;
            }
            else
            {
                return BadRequest("Invalid approver role");
            }

            UpdateOverallStatus(req);
            _db.SaveChanges();
            return Ok(req);
        }

        [HttpPost("reject/{id}")]
        public IActionResult Reject(int id, [FromBody] ApprovalInput input)
        {
            var req = _db.HolidayRequests.Find(id);
            if (req == null) return NotFound();

            var approverRole = (input.ApproverRole ?? string.Empty).Trim().ToLowerInvariant();

            if (approverRole == "manager")
            {
                if (req.ManagerStatus != "pending")
                    return BadRequest("Request is not pending manager approval.");

                req.ManagerStatus = "rejected";
                req.ManagerId = input.ApproverId;
            }
            else if (approverRole == "admin")
            {
                var requester = _db.Employees.Find(req.EmpId);
                var requesterPosition = (requester?.Position ?? string.Empty).Trim().ToLowerInvariant();
                if (requesterPosition != "manager")
                    return BadRequest("General manager can only reject manager requests.");

                req.GMStatus = "rejected";
                req.GMId = input.ApproverId;
            }
            else if (approverRole == "system_admin")
            {
                req.ManagerStatus = "rejected";
                req.GMStatus = "rejected";
                req.ManagerId = input.ApproverId;
                req.GMId = input.ApproverId;
            }
            else
            {
                return BadRequest("Invalid approver role");
            }

            UpdateOverallStatus(req);
            _db.SaveChanges();
            return Ok(req);
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

            if (requesterPosition == "manager")
            {
                req.ManagerStatus = "approved";
                req.ManagerId = req.EmpId;
                req.GMStatus = "pending";
                req.gm_id = "";
            }
            else
            {
                req.ManagerStatus = "pending";
                req.ManagerId = "";
                // Employee requests do not require GM approval.
                req.GMStatus = "approved";
                req.gm_id = "";
            }

            UpdateOverallStatus(req);
            req.SubmittedAt = DateTime.UtcNow;
            _db.HolidayRequests.Add(req);
            _db.SaveChanges();
            return CreatedAtAction(nameof(Get), new { empId = req.EmpId }, req);
        }
    }
}