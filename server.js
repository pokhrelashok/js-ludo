const express = require('express')
const app = express()
const http = require('http')
const socket = require('socket.io')
const server = http.createServer(app);
const clientPath = `${__dirname}/`
const Game = require("./js/game.js")
app.use(express.static(clientPath))
server.on('error', (err) => {
    console.log('server error', err)
})
const io = socket(server);
let CONNECTED_SOCKETS = [];
let g = null;
let port = process.env.PORT || 8000;

io.on('connection', async (sock) => {
    sock.on("roll", () => {
        if (g.hasMoved == 1 && g.players[g.playerIndex].id === sock.id) {
            g.players[g.playerIndex].emit("removeGottiShake", "");
            g.makeRoll();
        }
    })
    sock.on("gottiClicked", (id) => {
        if (g.isPowerUpRunning && g.movableGottis.includes(id)) {
            //for the kill any gotti powerUp
            g.isPowerUpRunning = 0;
            let ind = -1;
            let killedPlayerIndex = -1;
            for (let j = 0; j < g.gottisOutside.length; j++) {
                if (g.gottisOutside[j].indexOf(id) != -1) {
                    ind = g.gottisOutside[j].indexOf(id);
                    killedPlayerIndex = j;
                    break;
                }
            }
            if (ind != -1 && killedPlayerIndex != -1) {
                g.gottisOutside[killedPlayerIndex].splice(ind, 1)
                g.allGottis[killedPlayerIndex][id] = 0;
                g.gottisInside[killedPlayerIndex].push(id);
                g.players.forEach(s => {
                    if (s) s.emit("killGotti", id, g.gottisOutside)
                })
                g.noPlayerChange = 0;
                g.playerIndicator();
            }
        } else if (Array.isArray(id)) {
            //for when the player clicks at the batta
            for (let i = 0; i < id.length; i++) {
                console.log(id[i])
                if (id[i].includes(g.currentPlayerColor) && g.players[g.playerIndex].id == sock.id && g.movableGottis.includes(id[i])) {
                    console.log("conditionns true")
                    g.moveGotti(id[i])
                }
                break;
            }
        } else if (g.players[g.playerIndex].id == sock.id && g.movableGottis.includes(id)) g.moveGotti(id);
    })
    sock.on("sendMessage", (message) => {
        let ind = g.players.indexOf(sock);
        let playerColor = '';
        if (ind == 0) playerColor = "red";
        else if (ind == 1) playerColor = "green";
        else if (ind == 2) playerColor = "yellow";
        else if (ind == 3) playerColor = "blue";
        g.players.forEach(socket => {
            if (socket) socket.emit("showMessage", message, playerColor)
        });
    })
    sock.on("finishedMoving", () => {
        if (g.players[g.playerIndex].id == sock.id) {
            console.log("finished moving" + sock.id)
            g.playerIndicator();
        }
    })
    sock.on("powerUpClicked", type => {
        if (g.isPowerUpActive == 1 && g.players[g.playerIndex].id == sock.id) {
            g.powerUpClicked(type);
        }
    })
    sock.on("gameOver", () => {
        let ind = gottisOutside[playerIndex].indexOf(id);
        if (ind >= 0) gottisOutside[playerIndex].splice(ind, 1)
        if (gottisOutside[playerIndex].length == 0 && gottisInside[playerIndex].length == 0) {
            ind = g.availablePlayers.indexOf(g.playerIndex)
            g.availablePlayers.splice(ind, 1);
            g.winners.push(g.currentPlayerColor);
            if (g.availablePlayers.length == 1) {
                g.playerIndicator();
                g.winners.push(g.currentPlayerColor);
                g.players.forEach(socket => {
                    if (socket) socket.emit("gameFinished", "")
                });
            }

        }
    })
    if (CONNECTED_SOCKETS.length > 0) {
        CONNECTED_SOCKETS.push(sock)
        g = new Game(CONNECTED_SOCKETS);
        CONNECTED_SOCKETS = [];
        g.startGame();
        console.log("starting game")

    } else {
        console.log("only one player")
        CONNECTED_SOCKETS.push(sock);
    }
})
server.listen(port, () => {
    console.log('server starrted on port ' + port)
})

//only one powerUp available in one turn, the powerup time shows