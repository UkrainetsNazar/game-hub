public class GameService(AppDbContext context) : IGameService
{
    private readonly AppDbContext _context = context;

    public async Task<GameSession> CreateGameAsync(Guid playerXId)
    {
        var game = new GameSession
        {
            PlayerXId = playerXId,
            Status = GameStatus.WaitingForOpponent,
            Board = new string('_', 9),
            CurrentTurn = "X",
            LastMoveTime = DateTime.UtcNow
        };

        _context.GameSessions.Add(game);
        await _context.SaveChangesAsync();
        return game;
    }

    public async Task<GameSession> JoinGameAsync(Guid gameId, Guid playerOId)
    {
        var game = await GetGameAsync(gameId);
        if (game == null || game.PlayerOId != null)
            throw new Exception("Game is not joinable.");

        if (game.PlayerXId == playerOId)
            throw new Exception("You cannot join your own game.");

        game.PlayerOId = playerOId;
        game.Status = GameStatus.InProgress;
        game.LastMoveTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return game;
    }

    public async Task<GameSession?> GetGameAsync(Guid gameId)
        => await _context.GameSessions.FindAsync(gameId);

    public async Task<GameSession> MakeMoveAsync(Guid gameId, Guid playerId, int cellIndex)
    {
        var game = await GetGameAsync(gameId);
        if (game == null || game.Status != GameStatus.InProgress)
            throw new Exception("Invalid game");

        var symbol = game.PlayerXId == playerId ? 'X' : game.PlayerOId == playerId ? 'O' : throw new Exception("Invalid player");

        if (game.CurrentTurn != symbol.ToString())
            throw new Exception("Not your turn");

        var board = game.Board.ToCharArray();
        if (cellIndex < 0 || cellIndex >= 9 || board[cellIndex] != '_')
            throw new Exception("Invalid move");

        board[cellIndex] = symbol;
        game.Board = new string(board);
        game.CurrentTurn = symbol == 'X' ? "O" : "X";
        game.LastMoveTime = DateTime.UtcNow;

        if (CheckWin(board, symbol))
        {
            game.Status = GameStatus.Won;
            game.WinnerId = playerId;
            game.WinnerSymbol = symbol.ToString();
            await UpdatePlayerStatsAsync(game.PlayerXId, game.PlayerOId!.Value, playerId);
        }
        else if (!board.Contains('_'))
        {
            game.Status = GameStatus.Draw;
            game.WinnerId = null;
            game.WinnerSymbol = null;
            await UpdatePlayerStatsAsync(game.PlayerXId, game.PlayerOId!.Value, null);
        }

        await _context.SaveChangesAsync();
        return game;
    }

    public async Task SaveGameAsync(GameSession game)
    {
        _context.GameSessions.Update(game);
        await _context.SaveChangesAsync();
    }

    public bool CheckWin(char[] board, char symbol)
    {
        int[][] wins =
        [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];

        return wins.Any(comb => comb.All(i => board[i] == symbol));
    }

    public async Task UpdatePlayerStatsAsync(Guid playerXId, Guid playerOId, Guid? winnerId)
    {
        var playerX = await _context.Players.FindAsync(playerXId);
        var playerO = await _context.Players.FindAsync(playerOId);

        if (playerX == null || playerO == null)
            return;

        if (winnerId == null)
        {
            playerX.Draw++;
            playerO.Draw++;
        }
        else if (winnerId == playerXId)
        {
            playerX.Win++;
            playerO.Lose++;
        }
        else
        {
            playerO.Win++;
            playerX.Lose++;
        }

        await _context.SaveChangesAsync();
    }
}
