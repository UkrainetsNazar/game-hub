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
    private readonly IServiceScopeFactory _scopeFactory;

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

    public GameHub(IGameService gameService, IServiceScopeFactory scopeFactory)
    {
        _gameService = gameService;
        _scopeFactory = scopeFactory;
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
                string? winnerName = game.PlayerXId == winnerId ? game.PlayerXName : game.PlayerOName;

                game.Status = GameStatus.Timeout;
                game.WinnerId = winnerId;
                game.WinnerName = winnerName;

                await _gameService.UpdatePlayerStatsAsync(game.PlayerXId, game.PlayerOId!.Value, winnerId);
                await _gameService.SaveGameAsync(game);

                await Clients.Group(game.Id.ToString()).SendAsync("GameUpdated", game);
                await Clients.Group(game.Id.ToString()).SendAsync("GameTimeout", game);

                StopTimer(game.Id);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task<GameDto> CreateGame()
    {
        var game = await _gameService.CreateGameAsync(UserId);
        game.PlayerXName = Context.User?.Identity?.Name;

        await Groups.AddToGroupAsync(Context.ConnectionId, game.Id.ToString());
        _connectionToGame[Context.ConnectionId] = game.Id.ToString();

        Console.WriteLine($"User {UserId} created game {game.Id} and joined group");

        return GameMapper.ToDto(game);
    }

    public async Task<GameDto> JoinGame(string gameId)
    {
        if (!Guid.TryParse(gameId, out var parsedGameId))
            throw new HubException("Invalid game ID.");

        var game = await _gameService.GetGameAsync(parsedGameId);
        if (game == null)
            throw new HubException("Game not found.");

        if (game.PlayerOId != null)
            throw new HubException("Game room is full.");

        Console.WriteLine($"User {UserId} attempting to join game {gameId}");

        var updatedGame = await _gameService.JoinGameAsync(parsedGameId, UserId);

        var userName = Context.User?.Identity?.Name;

        if (updatedGame.PlayerXId == UserId)
        {
            updatedGame.PlayerXName = userName;
        }
        else if (updatedGame.PlayerOId == UserId)
        {
            updatedGame.PlayerOName = userName;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
        _connectionToGame[Context.ConnectionId] = gameId;

        Console.WriteLine($"User {UserId} successfully joined game {gameId}");
        Console.WriteLine($"Sending GameUpdated to group {gameId}");

        await Clients.Group(gameId).SendAsync("GameUpdated", GameMapper.ToDto(updatedGame));

        if (updatedGame.Status == GameStatus.InProgress)
        {
            StartTurnTimer(updatedGame.Id);
        }

        return GameMapper.ToDto(updatedGame);
    }

    public async Task<GameDto> MakeMove(string gameId, int cellIndex)
    {
        if (!Guid.TryParse(gameId, out var parsedGameId))
            throw new HubException("Invalid game ID.");

        var game = await _gameService.MakeMoveAsync(parsedGameId, UserId, cellIndex);

        if (string.IsNullOrWhiteSpace(game.PlayerXName) && game.PlayerXId == UserId)
        {
            game.PlayerXName = Context.User?.Identity?.Name;
        }

        if (string.IsNullOrWhiteSpace(game.PlayerOName) && game.PlayerOId == UserId)
        {
            game.PlayerOName = Context.User?.Identity?.Name;
        }

        var dto = GameMapper.ToDto(game);

        await Clients.Group(gameId).SendAsync("GameUpdated", dto);

        if (game.Status == GameStatus.InProgress)
        {
            StartTurnTimer(game.Id);
        }
        else
        {
            StopTimer(game.Id);
        }

        return dto;
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
        using var scope = _scopeFactory.CreateScope();
        var gameService = scope.ServiceProvider.GetRequiredService<IGameService>();
        var notifier = scope.ServiceProvider.GetRequiredService<IGameNotifier>();

        var game = await gameService.GetGameAsync(gameId);
        if (game == null || game.Status != GameStatus.InProgress || game.PlayerOId == null)
            return;

        var winnerId = game.CurrentTurn == "X" ? game.PlayerOId.Value : game.PlayerXId;
        var winnerName = game.PlayerXId == winnerId ? game.PlayerXName : game.PlayerOName;

        game.Status = GameStatus.Timeout;
        game.WinnerId = winnerId;
        game.WinnerName = winnerName;

        await gameService.UpdatePlayerStatsAsync(game.PlayerXId, game.PlayerOId.Value, winnerId);
        await gameService.SaveGameAsync(game);

        await notifier.NotifyGameUpdated(game);
        await notifier.NotifyGameTimeout(game);

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