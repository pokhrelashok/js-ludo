const express = require('express')
const app = express()
const http = require('http')
const socket = require('socket.io')
const server = http.createServer(app);
const clientPath = `${__dirname}/`
const Game = require("./js/game.js")
let roomId = 0;
let games = {};
const Player = require("./js/player")
app.use(express.static(clientPath))
server.on('error', (err) => {
    console.log('server error', err)
})
const io = socket(server);
let port = process.env.PORT || 8000;
let playersInGame = {};
let gameLobby = {
    2: [],
    3: [],
    4: []
}
io.on('connection', async (sock) => {
    sock.on("roll", () => {
        if (games[sock.roomId].hasMoved == 1 && games[sock.roomId].players[games[sock.roomId].playerIndex].sock.id === sock.id) {
            games[sock.roomId].players[games[sock.roomId].playerIndex].sock.emit("removeGottiShake", "");
            games[sock.roomId].makeRoll();
        }
    })
    sock.on("gottiClicked", (id) => {
        if (games[sock.roomId].isPowerUpRunning && games[sock.roomId].movableGottis.includes(id)) {
            //for the kill any gotti powerUp
            games[sock.roomId].isPowerUpRunning = 0;
            let ind = -1;
            let killedPlayerIndex = -1;
            for (let j = 0; j < games[sock.roomId].gottisOutside.length; j++) {
                if (games[sock.roomId].gottisOutside[j].indexOf(id) != -1) {
                    ind = games[sock.roomId].gottisOutside[j].indexOf(id);
                    killedPlayerIndex = j;
                    break;
                }
            }
            if (ind != -1 && killedPlayerIndex != -1) {
                games[sock.roomId].gottisOutside[killedPlayerIndex].splice(ind, 1)
                games[sock.roomId].allGottis[killedPlayerIndex][id] = 0;
                games[sock.roomId].gottisInside[killedPlayerIndex].push(id);
                games[sock.roomId].players.forEach(player => {
                    if (player.sock) player.sock.emit("killGotti", id, games[sock.roomId].gottisOutside)
                })
                games[sock.roomId].noPlayerChange = 0;
                games[sock.roomId].playerIndicator();
            }
        } else if (Array.isArray(id)) {
            //for when the player clicks at the batta
            for (let i = 0; i < id.length; i++) {
                console.log(id[i])
                if (id[i].includes(games[sock.roomId].currentPlayerColor) && games[sock.roomId].players[games[sock.roomId].playerIndex].sock.id == sock.id && games[sock.roomId].movableGottis.includes(id[i])) {
                    console.log("conditionns true")
                    games[sock.roomId].moveGotti(id[i])
                }
                break;
            }
        } else if (games[sock.roomId].players[games[sock.roomId].playerIndex].sock.id == sock.id && games[sock.roomId].movableGottis.includes(id)) games[sock.roomId].moveGotti(id);
    })
    sock.on("sendMessage", (message) => {
        let ind = -1;
        games[sock.roomId].players.forEach((player, index) => {
            if (player.sock && player.sock.id == sock.id) ind = index;
        })
        let playerColor = '';
        if (ind == 0) playerColor = "red";
        else if (ind == 1) playerColor = "green";
        else if (ind == 2) playerColor = "yellow";
        else if (ind == 3) playerColor = "blue";
        games[sock.roomId].players.forEach(player => {
            if (player.sock) player.sock.emit("showMessage", message, playerColor)
        });
    })
    sock.on("finishedMoving", () => {
        if (games[sock.roomId].players[games[sock.roomId].playerIndex].sock.id == sock.id) {
            console.log("finished moving" + sock.id)
            games[sock.roomId].playerIndicator();
        }
    })
    sock.on("powerUpClicked", type => {
        if (games[sock.roomId].isPowerUpActive == 1 && games[sock.roomId].players[games[sock.roomId].playerIndex].sock.id == sock.id) {
            games[sock.roomId].powerUpClicked(type);
        }
    })
    sock.on("gameOver", () => {
        let ind = gottisOutside[playerIndex].indexOf(id);
        if (ind >= 0) gottisOutside[playerIndex].splice(ind, 1)
        if (gottisOutside[playerIndex].length == 0 && gottisInside[playerIndex].length == 0) {
            ind = games[sock.roomId].availablePlayers.indexOf(games[sock.roomId].playerIndex)
            games[sock.roomId].availablePlayers.splice(ind, 1);
            games[sock.roomId].winners.push(games[sock.roomId].currentPlayerColor);
            if (games[sock.roomId].availablePlayers.length == 1) {
                games[sock.roomId].playerIndicator();
                games[sock.roomId].winners.push(games[sock.roomId].currentPlayerColor);
                games[sock.roomId].players.forEach(player => {
                    if (player.sock) player.sock.emit("gameFinished", "")
                });
            }

        }
    })
    sock.on("playerName", name => {
        let p = new Player(name, sock);
        playersInGame[sock.id] = p;
        sock.emit("nameReceived", "");
    })
    sock.on("joinGame", type => {
        let num = parseInt(type.replace("players"))
        console.log("Number of players " + num)
        gameLobby[num].push(playersInGame[sock.id])
        console.log(gameLobby)
        if (gameLobby[num].length == num) {
            roomId++;
            let g = new Game(gameLobby[num])
            gameLobby[num].forEach(element => {
                element.sock.roomId = roomId;
            });
            games[roomId] = g;
            games[roomId].startGame();
            gameLobby[num] = [];
        } else {
            sock.emit("waitForPlayers", num - gameLobby[num].length)
        }
    })

})
server.listen(port, () => {
    console.log('server starrted on port ' + port)
})

//only one powerUp available in one turn, the powerup time shows