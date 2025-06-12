using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

public class GameHub(IGameService gameService) : Hub
{
    private readonly IGameService _gameService = gameService;

    private static readonly ConcurrentDictionary<Guid, Timer> _gameTimers = new();

    public async Task JoinGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
    }

    public async Task MakeMove(string gameId, int cellIndex, string playerId)
    {
        var game = await _gameService.MakeMoveAsync(Guid.Parse(gameId), Guid.Parse(playerId), cellIndex);

        await Clients.Group(gameId).SendAsync("GameUpdated", game);

        if (game.Status == GameStatus.InProgress)
        {
            StartTurnTimer(game.Id);
        }
        else
        {
            StopTimer(game.Id);
        }
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
        if (game == null || game.Status != GameStatus.InProgress)
            return;

        game.Status = GameStatus.Timeout;
        await _gameService.SaveGameAsync(game);

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