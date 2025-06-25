import * as signalR from "@microsoft/signalr";
import { useAuth } from "../context/AuthContext";

let connection = null;

export const createHubConnection = (token) => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:5001/gamehub", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();

  return connection;
};
