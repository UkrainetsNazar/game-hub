public static class GameMapper
{
    public static GameDto ToDto(GameSession game)
    {
        return new GameDto
        {
            Id = game.Id,
            Board = game.Board,
            PlayerXName = game.PlayerXName,
            PlayerOName = game.PlayerOName,
            CurrentTurn = game.CurrentTurn,
            Status = (int)game.Status,
            WinnerName = game.WinnerName
        };
    }
}
