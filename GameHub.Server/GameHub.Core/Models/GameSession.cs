using System.ComponentModel.DataAnnotations;

public class GameSession
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PlayerXId { get; set; }
    public Guid? PlayerOId { get; set; }

    public string Board { get; set; } = "_________";
    public string CurrentTurn { get; set; } = "X";
    public GameStatus Status { get; set; } = GameStatus.WaitingForOpponent;
    public DateTime LastMoveTime { get; set; } = DateTime.UtcNow;
}
