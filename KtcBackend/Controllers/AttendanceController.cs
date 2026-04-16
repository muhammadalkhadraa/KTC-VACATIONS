using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace KtcBackend.Controllers
{
    public record StatusInput(int? Id, string EmpId, string State, DateTime? CheckInTime);
    public record WorkingHoursInput(int? Id, DateTime StartDate, DateTime? EndDate, string CheckInTime, string CheckOutTime);

    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly KtcContext _db;
        public AttendanceController(KtcContext db) => _db = db;

        [HttpGet("working-hours")]
        public async Task<IActionResult> GetWorkingHours()
        {
            var rules = await _db.WorkingHours.OrderByDescending(r => r.StartDate).ToListAsync();
            // Map to match frontend expectation (camelCase + time strings)
            return Ok(rules.Select(r => new {
                id = r.Id,
                start_date = r.StartDate.ToString("yyyy-MM-dd"),
                end_date = r.EndDate?.ToString("yyyy-MM-dd"),
                check_in_time = r.CheckInTime.ToString(@"hh\:mm"),
                check_out_time = r.CheckOutTime.ToString(@"hh\:mm")
            }));
        }

        [HttpGet("history/{empId}")]
        public async Task<IActionResult> GetHistory(string empId)
        {
            var id = empId.Trim().ToUpper();
            var history = await _db.CheckInStatuses
                .Where(h => h.EmpId == id)
                .OrderByDescending(h => h.CheckInTime)
                .ToListAsync();
            
            return Ok(history.Select(h => new {
                id = h.Id,
                empId = h.EmpId,
                state = h.State,
                checkInTime = h.CheckInTime,
                checkOutTime = h.CheckOutTime
            }));
        }

        [HttpPost("status")]
        public async Task<IActionResult> PostStatus([FromBody] StatusInput input)
        {
            var id = input.EmpId.Trim().ToUpper();
            
            if (input.State == "in")
            {
                var record = new CheckInStatus
                {
                    EmpId = id,
                    State = "in",
                    CheckInTime = DateTime.Now
                };
                _db.CheckInStatuses.Add(record);
                await _db.SaveChangesAsync();
                return Ok(record);
            }
            else if (input.State == "out")
            {
                // Find the existing "in" record to update
                CheckInStatus? record = null;
                if (input.Id.HasValue)
                {
                    record = await _db.CheckInStatuses.FindAsync(input.Id.Value);
                }
                
                if (record == null)
                {
                    // Fallback: finding latest record for today
                    record = await _db.CheckInStatuses
                        .Where(h => h.EmpId == id && h.State == "in")
                        .OrderByDescending(h => h.CheckInTime)
                        .FirstOrDefaultAsync();
                }

                if (record != null)
                {
                    record.State = "out";
                    record.CheckOutTime = DateTime.Now;
                    await _db.SaveChangesAsync();
                    return Ok(record);
                }
                
                return BadRequest("No active check-in record found to check out.");
            }

            return BadRequest("Invalid state.");
        }

        [HttpPost("working-hours")]
        public async Task<IActionResult> UpsertWorkingHours([FromBody] WorkingHoursInput input)
        {
            if (input.StartDate > (input.EndDate ?? DateTime.MaxValue))
                return BadRequest("Start date cannot be after end date.");

            // Parse times
            if (!TimeSpan.TryParse(input.CheckInTime, out var inTime) || !TimeSpan.TryParse(input.CheckOutTime, out var outTime))
                return BadRequest("Invalid time format. Use HH:mm.");

            // Check for overlaps
            var overlaps = await _db.WorkingHours
                .Where(r => r.Id != input.Id)
                .Where(r => 
                    (r.EndDate == null || r.EndDate >= input.StartDate) && 
                    (input.EndDate == null || input.EndDate >= r.StartDate))
                .AnyAsync();

            if (overlaps)
                return BadRequest("The selected date range overlaps with an existing shift rule.");

            if (input.Id.HasValue)
            {
                var rule = await _db.WorkingHours.FindAsync(input.Id.Value);
                if (rule == null) return NotFound();
                rule.StartDate = input.StartDate;
                rule.EndDate = input.EndDate;
                rule.CheckInTime = inTime;
                rule.CheckOutTime = outTime;
            }
            else
            {
                _db.WorkingHours.Add(new WorkingHoursRule {
                    StartDate = input.StartDate,
                    EndDate = input.EndDate,
                    CheckInTime = inTime,
                    CheckOutTime = outTime
                });
            }

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("working-hours/{id}")]
        public async Task<IActionResult> DeleteWorkingHours(int id)
        {
            var rule = await _db.WorkingHours.FindAsync(id);
            if (rule == null) return NotFound();
            _db.WorkingHours.Remove(rule);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
