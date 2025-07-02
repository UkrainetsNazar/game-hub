using System.ComponentModel.DataAnnotations;

public class Player
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? UserName { get; set; }
    public byte[]? PasswordHash { get; set; }
    public byte[]? PasswordSalt { get; set; }
    public int Win { get; set; }
    public int Lose { get; set; }
    public int Draw { get; set; }
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}