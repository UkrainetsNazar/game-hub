using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

[Authorize]
public class GameHub : Hub
{
    private readonly IGameService _gameService;

    private static readonly ConcurrentDictionary<Guid, Timer> _gameTimers = new();

    private Guid UserId => Guid.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    public GameHub(IGameService gameService)
    {
        _gameService = gameService;
    }

    public async Task<GameSession> CreateGame()
    {
        var game = await _gameService.CreateGameAsync(UserId);
        await Groups.AddToGroupAsync(Context.ConnectionId, game.Id.ToString());
        return game;
    }

    public async Task<GameSession> JoinGame(string gameId)
    {
        var game = await _gameService.JoinGameAsync(Guid.Parse(gameId), UserId);
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
        await Clients.Group(gameId).SendAsync("GameUpdated", game);

        if (game.Status == GameStatus.InProgress)
        {
            StartTurnTimer(game.Id);
        }

        return game;
    }

    public async Task<GameSession> MakeMove(string gameId, int cellIndex)
    {
        var game = await _gameService.MakeMoveAsync(Guid.Parse(gameId), UserId, cellIndex);
        await Clients.Group(gameId).SendAsync("GameUpdated", game);

        if (game.Status == GameStatus.InProgress)
        {
            StartTurnTimer(game.Id);
        }
        else
        {
            StopTimer(game.Id);
        }

        return game;
    }

    private void StartTurnTimer(Guid gameId)
    {
        if (_gameTimers.TryGetValue(gameId, out var oldTimer))
        {
            oldTimer.Dispose();
        }

        var timer = new Timer(async _ =>
        {
            await HandleTimeout(gameId);
        }, null, TimeSpan.FromSeconds(20), Timeout.InfiniteTimeSpan);

        _gameTimers[gameId] = timer;
    }

    private async Task HandleTimeout(Guid gameId)
{
    var game = await _gameService.GetGameAsync(gameId);
    if (game == null || game.Status != GameStatus.InProgress || game.PlayerOId == null)
        return;

    Guid winnerId = game.CurrentTurn == "X" ? game.PlayerOId.Value : game.PlayerXId;

    game.Status = GameStatus.Timeout;
    game.WinnerId = winnerId;
    game.WinnerSymbol = game.PlayerXId == winnerId ? "X" : "O";

    await _gameService.UpdatePlayerStatsAsync(game.PlayerXId, game.PlayerOId.Value, winnerId);
    await _gameService.SaveGameAsync(game);

    await Clients.Group(gameId.ToString()).SendAsync("GameUpdated", game);
    await Clients.Group(gameId.ToString()).SendAsync("GameTimeout", game);

    StopTimer(gameId);
}

    private void StopTimer(Guid gameId)
    {
        if (_gameTimers.TryRemove(gameId, out var timer))
        {
            timer.Dispose();
        }
    }
}
