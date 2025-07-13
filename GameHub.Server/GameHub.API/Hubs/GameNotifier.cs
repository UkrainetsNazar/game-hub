using Microsoft.AspNetCore.SignalR;

public class GameNotifier : IGameNotifier
{
    private readonly IHubContext<GameHub> _hubContext;

    public GameNotifier(IHubContext<GameHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyGameUpdated(GameSession game)
    {
        var dto = GameMapper.ToDto(game);
        await _hubContext.Clients.Group(game.Id.ToString()).SendAsync("GameUpdated", dto);
    }

    public async Task NotifyGameTimeout(GameSession game)
    {
        var dto = GameMapper.ToDto(game);
        await _hubContext.Clients.Group(game.Id.ToString()).SendAsync("GameTimeout", dto);
    }
}
