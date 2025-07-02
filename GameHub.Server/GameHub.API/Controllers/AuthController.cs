using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _authService.Register(request);
        return Ok(new { user.Id, user.UserName });
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        var tokens = await _authService.Login(request);

        if (tokens.AccessToken == null)
            return Unauthorized(new { message = "Username or password is incorrect" });

        return Ok(new
        {
            accessToken = tokens.AccessToken,
            refreshToken = tokens.RefreshToken
        });
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] string refreshToken)
    {
        var tokens = await _authService.RefreshToken(refreshToken);

        if (tokens == null)
            return Unauthorized(new { message = "Invalid refresh token" });

        return Ok(new
        {
            accessToken = tokens.Value.AccessToken,
            refreshToken = tokens.Value.RefreshToken
        });
    }

    [HttpPost("revoke-token")]
    public async Task<IActionResult> RevokeToken([FromBody] string refreshToken)
    {
        var result = await _authService.RevokeRefreshToken(refreshToken);

        if (!result)
            return NotFound(new { message = "Token not found or already revoked" });

        return Ok(new { message = "Token revoked" });
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> Profile()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub);
        if (userIdClaim == null)
        {
            return Unauthorized("UserId is not found.");
        }

        var userId = Guid.Parse(userIdClaim.Value);

        var profile = await _authService.GetProfileAsync(userId);
        return Ok(profile);
    }
}