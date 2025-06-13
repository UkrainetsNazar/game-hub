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

        var user = new Player
        {
            UserName = request.UserName,
            PasswordSalt = hmac.Key,
            PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.Password!))
        };

        _dbContext.Players.Add(user);
        await _dbContext.SaveChangesAsync();
        return user;
    }

    public async Task<string> Login(LoginDto request)
    {
        var user = await _dbContext.Players.FirstOrDefaultAsync(u => u.UserName == request.UserName)
        ?? throw new Exception("Username or password is incorrect");

        using var hmac = new HMACSHA256(user.PasswordSalt!);
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(request.Password!));

        if (!computedHash.SequenceEqual(user.PasswordHash!))
            throw new Exception("Username or password is incorrect");

        var token = _jwtService.GenerateToken(user.Id, user.UserName!);
        return token;
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