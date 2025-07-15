using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

public class AuthService(AppDbContext dbContext, JwtService jwtService)
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly JwtService _jwtService = jwtService;

    public async Task<Player> Register(RegisterDto request)
    {
        var isPlayerExist = await _dbContext.Players.AnyAsync(u => u.UserName == request.UserName);
        if (isPlayerExist)
            throw new Exception("Player with this username already exist");

        using var hmac = new HMACSHA256();

        var player = new Player
        {
            UserName = request.UserName,
            PasswordSalt = hmac.Key,
            PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.Password!))
        };

        _dbContext.Players.Add(player);
        await _dbContext.SaveChangesAsync();
        return player;
    }

    public async Task<(string AccessToken, string RefreshToken)> Login(LoginDto request, string ipAddress, string userAgent)
    {
        var user = await _dbContext.Players
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName);

        if (user == null) return (null!, null!);

        using var hmac = new HMACSHA256(user.PasswordSalt!);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.Password!));
        if (!computedHash.SequenceEqual(user.PasswordHash!)) return (null!, null!);

        var accessToken = _jwtService.GenerateToken(user.Id, user.UserName!);
        var refreshToken = GenerateRefreshToken(ipAddress, userAgent);

        user.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync();

        return (accessToken, refreshToken.Token);
    }

    private RefreshToken GenerateRefreshToken(string ipAddress, string userAgent)
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return new RefreshToken
        {
            Token = Convert.ToBase64String(randomBytes),
            Expires = DateTime.UtcNow.AddDays(21),
            Created = DateTime.UtcNow,
            CreatedByIp = ipAddress,
            CreatedByUserAgent = userAgent
        };
    }

    public async Task<(string AccessToken, string RefreshToken)?> RefreshToken(string token, string ipAddress, string userAgent)
    {
        var refreshToken = await _dbContext.RefreshTokens
            .Include(rt => rt.Player)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken == null || !refreshToken.IsActive)
            return null;

        if (refreshToken.CreatedByIp != ipAddress || refreshToken.CreatedByUserAgent != userAgent)
            return null;

        refreshToken.Revoked = DateTime.UtcNow;

        var player = refreshToken.Player;
        var newAccessToken = _jwtService.GenerateToken(player.Id, player.UserName!);
        var newRefreshToken = GenerateRefreshToken(ipAddress, userAgent);

        player.RefreshTokens.Add(newRefreshToken);
        await _dbContext.SaveChangesAsync();

        return (newAccessToken, newRefreshToken.Token);
    }

    public async Task<bool> RevokeRefreshToken(string? token, Guid userId)
    {
        if (string.IsNullOrEmpty(token)) return false;

        var refreshToken = await _dbContext.RefreshTokens
            .Include(rt => rt.Player)
            .FirstOrDefaultAsync(rt => rt.Token == token && rt.Player.Id == userId);

        if (refreshToken == null || !refreshToken.IsActive)
            return false;

        refreshToken.Revoked = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return true;
    }


    public async Task<PlayerProfileDto> GetProfileAsync(Guid userId)
    {
        var user = await _dbContext.Players.FirstOrDefaultAsync(u => u.Id == userId)
        ?? throw new Exception("User not found");

        var playerProfile = new PlayerProfileDto
        {
            UserName = user.UserName,
            Win = user.Win,
            Draw = user.Draw,
            Lose = user.Lose
        };

        return playerProfile;
    }
}

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
//.eyJzdWIiOiJhY2ExNmM2Ny0zOTdmLTQ5MzEtODZiNC1kMzQ5MmQ2YmQyMzkiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImFjYTE2YzY3LTM5N2YtNDkzMS04NmI0LWQzNDkyZDZiZDIzOSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJOYXphciIsImV4cCI6MTc1MjU4ODE1NSwiaXNzIjoiR2FtZUh1YiIsImF1ZCI6IkdhbWVIdWJVc2VycyJ9
//.oKOJDtKxFw71Fo1RMRZ5SguabU0CshIMUvCOTm948Ic

//ZPJ2V7IZSvZcfeirdn0VXZieNHtNQyyRNs268AATNRzpD4LhplE2TDyAY4xdH5rQUfG%2FhNjdWNdRtqVP72HIOQ%3D%3D


//ZPJ2V7IZSvZcfeirdn0VXZieNHtNQyyRNs268AATNRzpD4LhplE2TDyAY4xdH5rQUfG%2FhNjdWNdRtqVP72HIOQ%3D%3D