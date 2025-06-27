import * as signalR from "@microsoft/signalr";

export function createHubConnection(token) {
  return new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:5001/gamehub", {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}
