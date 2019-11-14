const express = require('express')
const app = express()
const http = require('http')
const socket = require('socket.io')
const UTILS = require("./js/utils")
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
const CONSTANTS = {
    defaultColors: ['red', 'green', 'yellow', 'blue']
}
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
    sock.on("finishedMoving", (result) => {
        if (games[sock.roomId].players[games[sock.roomId].playerIndex].sock.id == sock.id) {
            console.log("finished moving" + sock.id)
            if (result['gottiHome']) {
                let ind = games[sock.roomId].gottisOutside[games[sock.roomId].playerIndex].indexOf(result['gottiHome']);
                games[sock.roomId].gottisOutside[games[sock.roomId].playerIndex].splice(ind, 1);
                delete games[sock.roomId].allGottis[games[sock.roomId].playerIndex][result['gottiHome']];
            }
            if (result['gameFinished']) {
                games[sock.roomId].winners.push(games[sock.roomId].currentPlayerColor);
                delete games[sock.roomId].allGottis[games[sock.roomId].playerIndex];
                if (Object.keys(games[sock.roomId].allGottis).length == 1) {
                    console.log("game really done");
                    gameOver(sock);
                }
            }
            if (result["killed"]) {
                let killed = result['killed']
                let ind = -1;
                let killedPlayerIndex = -1;
                for (let j = 0; j < games[sock.roomId].gottisOutside.length; j++) {
                    if (games[sock.roomId].gottisOutside[j].indexOf(killed) !== -1) {
                        ind = games[sock.roomId].gottisOutside[j].indexOf(killed);
                        killedPlayerIndex = j;
                        games[sock.roomId].gottisOutside[killedPlayerIndex].splice(ind, 1)
                        games[sock.roomId].allGottis[killedPlayerIndex][killed] = 0;
                        games[sock.roomId].gottisInside[killedPlayerIndex].push(killed);
                        break;
                    }
                }
            }
            games[sock.roomId].playerIndicator();
        }
    })
    sock.on("powerUpClicked", type => {
        if (games[sock.roomId].isPowerUpActive == 1 && games[sock.roomId].players[games[sock.roomId].playerIndex].sock.id == sock.id) {
            games[sock.roomId].powerUpClicked(type);
        }
    })


    sock.on("disconnect", async () => {
        console.log("player disconnected!")
        console.log(playersInGame)
        if (playersInGame[sock.id]) {
            if (playersInGame[sock.id].inGame) {
                if (sock.playerIndex == games[sock.roomId].playerIndex) {
                    console.log("yes same player")
                    games[sock.roomId].noPlayerChange = 0;
                    games[sock.roomId].sixCount = 0;
                    games[sock.roomId].playerIndicator();
                }
                games[sock.roomId].players.forEach(player => {
                    if (player.sock) player.sock.emit("removePlayer", CONSTANTS.defaultColors[sock.playerIndex]);
                })
                delete games[sock.roomId].allGottis[sock.playerIndex]
                if (Object.keys(games[sock.roomId].allGottis).length == 1) {
                    await gameOver(sock);
                }
            } else {
                if (playersInGame[sock.id].gameMode != 0) {
                    console.log("this fucker has chosen number of players");
                    let ind = gameLobby[playersInGame[sock.id].gameMode].indexOf(playersInGame[sock.id]);
                    gameLobby[playersInGame[sock.id].gameMode].splice(ind, 1);
                }
            }
            delete playersInGame[sock.id];
            console.log("remaining players in the game rea")
            console.log(Object.keys(playersInGame).length)
            console.log("remaining players in the game rea")
        }
    })
    sock.on("playerName", name => {
        let p = new Player(name, sock);
        playersInGame[sock.id] = p;
        sock.emit("nameReceived", "");
    })
    sock.on("joinGame", type => {
        let num = parseInt(type.replace("players"))
        gameLobby[num].push(playersInGame[sock.id])
        if (gameLobby[num].length == num) {
            roomId++;
            let availablePlayers = [0, 1, 2, 3];
            if (num == 2) {
                availablePlayers = [0, 2];
            } else if (num == 3) {
                availablePlayers = [0, 2, 3];
            }
            gameLobby[num].forEach((element, index) => {
                element.sock.roomId = roomId;
                element.inGame = true;
                element.gameMode = num;
                element.sock.playerIndex = availablePlayers[index];
                console.log('index is!!!!!!')
                console.log(element.sock.playerIndex)
                console.log('index is!!!!!!')
            });
            let g = new Game(gameLobby[num])
            let temp = g.players;
            let j = -1;
            g.players = [];
            for (let i = 0; i < 4; i++) {
                if (availablePlayers.includes(i)) {
                    g.allGottis[i] = {};
                    for (let j = 0; j < g.gottisInside[i].length; j++) {
                        let col = g.gottisInside[i][j]
                        g.allGottis[i][col] = 0;
                    }
                    j++;
                    g.players[i] = temp[j];
                    g.players[i].playerColor = CONSTANTS.defaultColors[i];
                }
            }
            let places = [];
            let noOfPowerUps = 5 + Math.ceil(Math.random() * 5)
            for (let i = 0; i < noOfPowerUps; i++) {
                let loc = Math.ceil(Math.random() * 52);
                if (!places.includes(loc) && loc != 40 && loc != 1 && loc != 48 && loc != 14 && loc != 9 && loc != 22 && loc != 27 && loc != 35) {
                    g.powerUpsLocation[loc] = g.availablePowerUps[Math.floor(Math.random() * g.availablePowerUps.length)]
                }
            }
            //prepares the ludo board in all the players
            let playerIds = [];
            let names = []
            for (let i = 0; i < g.players.length; i++) {
                if (g.players[i] && g.players[i].sock) {
                    playerIds.push(g.players[i].sock.id)
                    names.push(g.players[i].name)
                } else {
                    playerIds.push(0)
                    names.push("")
                }
            }
            g.players.forEach(player => {
                if (player.sock) player.sock.emit("startGame", g.powerUpsLocation, availablePlayers, g.gottisInside, playerIds, names)
            });
            games[roomId] = g;
            games[roomId].playerIndicator();
            gameLobby[num] = [];
        } else {
            gameLobby[num].forEach(el => {
                el.sock.emit("waitForPlayers", num - gameLobby[num].length)
            })
        }
    })

})
server.listen(port, () => {
    console.log('server starrted on port ' + port)
})

gameOver = (sock) => {
    games[sock.roomId].playerIndex = (games[sock.roomId].playerIndex + 1) % 4;
    while (!games[sock.roomId].allGottis.hasOwnProperty(games[sock.roomId].playerIndex)) {
        games[sock.roomId].playerIndex = (games[sock.roomId].playerIndex + 1) % 4;
    }
    games[sock.roomId].winners.push(CONSTANTS.defaultColors[games[sock.roomId].playerIndex]);
    console.log("-----------------------w")
    console.log(games[sock.roomId].winners)
    console.log("-----------------------w")
    games[sock.roomId].players.forEach(player => {
        if (player.sock) player.sock.emit("gameOver", games[sock.roomId].winners)
        playersInGame[sock.id].inGame = false;
    })
    delete games[sock.roomId]
}

//only one powerUp available in one turn, the powerup time shows