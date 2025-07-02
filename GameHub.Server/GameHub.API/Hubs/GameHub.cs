using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

[Authorize]
public class GameHub : Hub
{
    private readonly IGameService _gameService;
    private static readonly ConcurrentDictionary<Guid, Timer> _gameTimers = new();
    private static readonly ConcurrentDictionary<string, string> _connectionToGame = new();

    private Guid UserId
    {
        get
        {
            var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out var id)
                ? id
                : throw new HubException("Invalid user ID.");
        }
    }

    public GameHub(IGameService gameService)
    {
        _gameService = gameService;
    }

    public string WhoAmI()
    {
        var userName = Context.User?.Identity?.Name;

        if (string.IsNullOrEmpty(userName))
        {
            throw new HubException("Unauthorized");
        }

        return userName;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connectionToGame.TryRemove(Context.ConnectionId, out var gameIdStr) && Guid.TryParse(gameIdStr, out var gameId))
        {
            var game = await _gameService.GetGameAsync(gameId);
            if (game != null && game.Status == GameStatus.InProgress)
            {
                Guid? winnerId = game.PlayerXId == UserId ? game.PlayerOId : game.PlayerXId;
                string winnerSymbol = game.PlayerXId == winnerId ? "X" : "O";

                game.Status = GameStatus.Timeout;
                game.WinnerId = winnerId;
                game.WinnerSymbol = winnerSymbol;

                await _gameService.UpdatePlayerStatsAsync(game.PlayerXId, game.PlayerOId!.Value, winnerId);
                await _gameService.SaveGameAsync(game);

                await Clients.Group(game.Id.ToString()).SendAsync("GameUpdated", game);
                await Clients.Group(game.Id.ToString()).SendAsync("GameTimeout", game);

                StopTimer(game.Id);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task<GameSession> CreateGame()
    {
        var game = await _gameService.CreateGameAsync(UserId);
        await Groups.AddToGroupAsync(Context.ConnectionId, game.Id.ToString());
        _connectionToGame[Context.ConnectionId] = game.Id.ToString();
        return game;
    }

    public async Task<GameSession> JoinGame(string gameId)
    {
        if (!Guid.TryParse(gameId, out var parsedGameId))
            throw new HubException("Invalid game ID.");

        var game = await _gameService.GetGameAsync(parsedGameId);
        if (game == null)
            throw new HubException("Game not found.");

        if (game.PlayerOId != null)
            throw new HubException("Game room is full.");

        var updatedGame = await _gameService.JoinGameAsync(parsedGameId, UserId);
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
        _connectionToGame[Context.ConnectionId] = gameId;

        await Clients.Group(gameId).SendAsync("GameUpdated", updatedGame);

        if (updatedGame.Status == GameStatus.InProgress)
        {
            StartTurnTimer(updatedGame.Id);
        }

        return updatedGame;
    }

    public async Task<GameSession> MakeMove(string gameId, int cellIndex)
    {
        if (!Guid.TryParse(gameId, out var parsedGameId))
            throw new HubException("Invalid game ID.");

        var game = await _gameService.MakeMoveAsync(parsedGameId, UserId, cellIndex);
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
        if (_gameTimers.TryRemove(gameId, out var oldTimer))
        {
            oldTimer.Dispose();
        }

        var timer = new Timer(async _ =>
        {
            try
            {
                await HandleTimeout(gameId);
            }
            catch (Exception ex)
            {
                throw new Exception("Timer error" + ex);
            }
        }, null, TimeSpan.FromSeconds(20), Timeout.InfiniteTimeSpan);

        _gameTimers[gameId] = timer;
    }

    private async Task HandleTimeout(Guid gameId)
    {
        var game = await _gameService.GetGameAsync(gameId);
        if (game == null || game.Status != GameStatus.InProgress || game.PlayerOId == null)
            return;

        var winnerId = game.CurrentTurn == "X" ? game.PlayerOId.Value : game.PlayerXId;
        var winnerSymbol = game.PlayerXId == winnerId ? "X" : "O";

        game.Status = GameStatus.Timeout;
        game.WinnerId = winnerId;
        game.WinnerSymbol = winnerSymbol;

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