using Microsoft.EntityFrameworkCore;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Player> Players { get; set; }
    public DbSet<GameSession> GameSessions { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<RefreshToken>()
        .HasOne(rt => rt.Player)
        .WithMany(u => u.RefreshTokens)
        .HasForeignKey(rt => rt.PlayerId);

    base.OnModelCreating(modelBuilder);
}

}