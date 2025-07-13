public interface IGameNotifier
{
    Task NotifyGameUpdated(GameSession game);
    Task NotifyGameTimeout(GameSession game);
}