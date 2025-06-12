public interface IGameService
{
    Task<GameSession> CreateGameAsync(Guid playerXId);
    Task<GameSession> JoinGameAsync(Guid gameId, Guid playerOId);
    Task<GameSession?> GetGameAsync(Guid gameId);
    Task<GameSession> MakeMoveAsync(Guid gameId, Guid playerId, int cellIndex);
    Task SaveGameAsync(GameSession game);
    bool CheckWin(char[] board, char symbol);
}
