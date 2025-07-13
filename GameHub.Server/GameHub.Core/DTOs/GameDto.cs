public class GameDto
{
    public Guid Id { get; set; }
    public string Board { get; set; } = "";
    public string? PlayerXName { get; set; }
    public string? PlayerOName { get; set; }
    public string CurrentTurn { get; set; } = "X";
    public int Status { get; set; }
    public string? WinnerSymbol { get; set; }
}
