public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = default!;
    public DateTime Expires { get; set; }
    public DateTime Created { get; set; }
    public DateTime? Revoked { get; set; }

    public string? CreatedByIp { get; set; }
    public string? CreatedByUserAgent { get; set; }

    public bool IsExpired => DateTime.UtcNow >= Expires;
    public bool IsActive => Revoked == null && !IsExpired;

    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = default!;
}
