import * as signalR from "@microsoft/signalr";

export const createHubConnection = (token) => {
  return new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5216/gamehub", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
};
