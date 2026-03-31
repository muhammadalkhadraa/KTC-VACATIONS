using KtcBackend;
using Microsoft.AspNetCore.Mvc;

namespace KtcBackend.Controllers
{
    public class LoginRequest
    {
        public string Id { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class RegisterUserRequest
    {
        public string Id { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Name { get; set; } = null!;
        // additional optional fields can be added later
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly KtcContext _db;
        public AuthController(KtcContext db) => _db = db;

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest credentials)
        {
            var emp = _db.Employees
                        .FirstOrDefault(e => e.Id == credentials.Id &&
                                             e.Password == credentials.Password);
            if (emp == null) return Unauthorized();
            return Ok(new { id = emp.Id, name = emp.Name, position = emp.Position, role = emp.Role });
        }

        [HttpPost("register")]
        public IActionResult RegisterUser([FromBody] RegisterUserRequest req)
        {
            if (_db.Employees.Any(e => e.Id == req.Id))
                return Conflict(new { message = "Employee ID already exists" });

            var emp = new Employee
            {
                Id = req.Id,
                Password = req.Password,
                Name = req.Name,
                Role = "employee",
                Department = "",
                Position = "",
                Joined = DateTime.UtcNow,
                TotalHolidays = 0,
                UsedHolidays = 0
            };
            _db.Employees.Add(emp);
            _db.SaveChanges();
            return CreatedAtAction(null, new { id = emp.Id });
        }
    }
}