using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace KtcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoleController : ControllerBase
    {
        private readonly KtcContext _db;
        public RoleController(KtcContext db) => _db = db;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Role>>> GetAll()
        {
            return await _db.Roles.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Role>> Create([FromBody] Role role)
        {
            _db.Roles.Add(role);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = role.Id }, role);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var role = await _db.Roles.FindAsync(id);
            if (role == null) return NotFound();

            _db.Roles.Remove(role);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
