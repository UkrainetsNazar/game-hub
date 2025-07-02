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

    public async Task<(string AccessToken, string RefreshToken)> Login(LoginDto request)
    {
        var user = await _dbContext.Players
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName);

        if (user == null) return (null!, null!);

        using var hmac = new HMACSHA256(user.PasswordSalt!);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.Password!));
        if (!computedHash.SequenceEqual(user.PasswordHash!)) return (null!, null!);

        var accessToken = _jwtService.GenerateToken(user.Id, user.UserName!);
        var refreshToken = GenerateRefreshToken();

        user.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync();

        return (accessToken, refreshToken.Token);
    }

    private RefreshToken GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return new RefreshToken
        {
            Token = Convert.ToBase64String(randomBytes),
            Expires = DateTime.UtcNow.AddDays(30),
            Created = DateTime.UtcNow
        };
    }

    public async Task<(string AccessToken, string RefreshToken)?> RefreshToken(string token)
    {
        var refreshToken = await _dbContext.RefreshTokens
            .Include(rt => rt.Player)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken == null || !refreshToken.IsActive)
            return null;

        refreshToken.Revoked = DateTime.UtcNow;

        var player = refreshToken.Player;
        var newAccessToken = _jwtService.GenerateToken(player.Id, player.UserName!);
        var newRefreshToken = GenerateRefreshToken();

        player.RefreshTokens.Add(newRefreshToken);

        await _dbContext.SaveChangesAsync();

        return (newAccessToken, newRefreshToken.Token);
    }

    public async Task<bool> RevokeRefreshToken(string token)
    {
        var refreshToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
        if (refreshToken == null || !refreshToken.IsActive) return false;

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