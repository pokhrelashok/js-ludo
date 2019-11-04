const UTILS = require("./utils")
const CONSTANTS = {
    startRed: 40,
    startGreen: 1,
    startBlue: 27,
    startYellow: 14,
    redStop: 38,
    greenStop: 51,
    yellowStop: 12,
    blueStop: 25,
    greenEntry: 100,
    yellowEntry: 110,
    blueEntry: 120,
    redEntry: 130,
    starPositions: [1, 9, 14, 22, 27, 35, 40, 48],
    timer: '',
}
class Sleep {
    constructor(duration) {
        this.promise = new Promise((resolve) => {
            this.promiseResolve = resolve
            this.timeout = setTimeout(() => {
                resolve()
            }, duration)
        })
    }

    async wait() {
        return await this.promise
    }

    cancel() {
        clearTimeout(this.timeout)
        this.promiseResolve()
    }
}

function Game(players) {
    this.playerIndex = 0;
    this.availablePowerUps = ['freeRoll', 'skipTurn', 'killAnyGotti'];
    this.movementAmount = 0;
    this.gameEnded = 0
    this.sixCount = 0
    this.currentPlayerColor = ''
    this.isPowerUpActive = 0;
    this.isPowerUpRunning = 0;
    this.movableGottisPositions = [];
    this.players = players;
    this.totalPlayersCount = players.length;
    this.winners = [];
    this.powerUps = [
        [],
        [],
        [],
        []
    ];

    //contains all the gottis as key and the positions as values red1=32
    this.allGottis = {
        0: {},
        1: {},
        2: {},
        3: {}
    };
    this.movableGottis = [];
    //indicates if a player has played his turn or not
    this.hasMoved = 1;
    this.noPlayerChange = 0;
    //holds opponent positions
    this.oppPositions = {}
    //indicates which location holds which powerups 1:freeRoll
    this.powerUpsLocation = {};
    this.gottisInside = [
        ['red1', 'red2', 'red3', 'red4'],
        ['green1', 'green2', 'green3', 'green4'],
        ['yellow1', 'yellow2', 'yellow3', 'yellow4'],
        ['blue1', 'blue2', 'blue3', 'blue4']
    ]
    this.gottisOutside = [
        [],
        [],
        [],
        []
    ]
    this.startGame = async () => {
        let availablePlayers = [0, 1, 2, 3]
        if (this.totalPlayersCount == 2) {
            availablePlayers = [0, 2];
            this.gottisInside[1] = ''
            this.gottisInside[3] = ''
            let temp = this.players;
            this.players = [];
            this.players[0] = temp[0];
            this.players[1] = '';
            this.players[2] = temp[1];
            this.allGottis = {
                0: {},
                2: {}
            };
        } else if (this.totalPlayersCount == 3) {
            availablePlayers = [0, 2, 3];
            this.gottisInside[1] = ''
            let temp = this.players;
            this.players = [];
            this.players[0] = temp[0];
            this.players[1] = '';
            this.players[2] = temp[1];
            this.players[3] = temp[2];
            this.allGottis = {
                0: {},
                2: {},
                3: {}
            };
        }
        //putting position data of all the gottis inside the allgottispositions
        for (let i = 0; i < this.gottisInside.length; i++) {
            for (let j = 0; j < this.gottisInside[i].length; j++) {
                this.allGottis[i][
                    [this.gottisInside[i][j]]
                ] = 0;
            }
        }
        let places = [];
        let noOfPowerUps = 5 + Math.ceil(Math.random() * 5)
        for (i = 0; i < noOfPowerUps; i++) {
            let loc = Math.ceil(Math.random() * 52);
            if (!places.includes(loc) && loc != 40 && loc != 1 && loc != 48 && loc != 14 && loc != 9 && loc != 22 && loc != 27 && loc != 35) {
                this.powerUpsLocation[loc] = this.availablePowerUps[Math.floor(Math.random() * this.availablePowerUps.length)]
            }
        }
        //prepares the ludo board in all the players
        let playerIds = [];
        for (i = 0; i < this.players.length; i++) {
            if (this.players[i]) playerIds.push(this.players[i].id)
            else playerIds.push(0)
        }
        this.players.forEach(socket => {
            if (socket) socket.emit("startGame", this.powerUpsLocation, availablePlayers, this.gottisInside, playerIds)
        });
        await this.playerIndicator();
    }
    this.playerIndicator = async function () {
        this.hasMoved = 1;
        this.movableGottis = [];
        this.movableGottisPositions = [];
        if (this.sixCount == 0 && this.noPlayerChange == 0) {
            if (this.powerUps[this.playerIndex].length > 0) {
                this.isPowerUpActive++;
                if (this.isPowerUpActive == 1) {
                    //power focus vanera event emit gar
                    this.hasMoved = 0;
                    CONSTANTS.timer = '';
                    //indicate powerUps that can be used
                    this.players[this.playerIndex].emit("powerUpTime", "");
                    this.players.forEach(socket => {
                        if (socket) socket.emit("showMessage", "Powerup Time", this.currentPlayerColor)
                    });
                    CONSTANTS.timer = new Sleep(5000);
                    await CONSTANTS.timer.wait();
                    this.hasMoved = 1;
                    //powerups bata focus hata vanera code han}
                }
            }
            if (this.noPlayerChange == 0) {
                this.isPowerUpActive = 0;
                this.players.forEach(s => {
                    if (s) s.emit("removeShakeAnimation", this.gottisInside, this.gottisOutside);
                });
                this.playerIndex = (this.playerIndex + 1) % 4;
                while (!this.allGottis.hasOwnProperty(this.playerIndex)) {
                    this.playerIndex = (this.playerIndex + 1) % 4;
                }
                await new Promise(r => setTimeout(r, 300));
                if (this.playerIndex == 0) this.currentPlayerColor = "red";
                else if (this.playerIndex == 1) this.currentPlayerColor = "green";
                else if (this.playerIndex == 2) this.currentPlayerColor = "yellow";
                else if (this.playerIndex == 3) this.currentPlayerColor = "blue";
                //adds highlight around home of current player
                this.players.forEach(socket => {
                    if (socket) socket.emit("playerIndicator", this.currentPlayerColor)
                });
            }
        }
        this.makeRoll = async function () {
            this.hasMoved = 0;
            this.oppPositions = {};
            let myPositions = [];

            for (let key in this.allGottis) {
                if (this.allGottis.hasOwnProperty(key)) {
                    for (let key2 in this.allGottis[key]) {
                        if (this.allGottis[key].hasOwnProperty(key2)) {
                            let val = this.allGottis[key][key2]
                            if (val > 0 && val < 100) {
                                if (key != this.playerIndex) this.oppPositions[val] = key2
                                else myPositions.push(val);
                            }
                        }
                    }
                }
            }
            console.log("--------------------------------------------")
            console.log("gottis inside")
            console.log(this.gottisInside)
            console.log("gottis inside")
            console.log("gottis Outside")
            console.log(this.gottisOutside)
            console.log("gottis Outside")
            console.log("all gottis")
            console.log(this.allGottis)
            console.log("all gottis")
            console.log("oppositions")
            console.log(this.oppPositions)
            console.log("oppositions")
            console.log("--------------------------------------------")
            //as he just rolled he still has to move his gotti
            // await this.players[this.playerIndex].emit("calculateAllGottiPos", this.gottisOutside);
            if (this.gottisOutside[this.playerIndex].length == 0) {
                this.movementAmount = UTILS.biasedRandom(6, 60)
                //sees if there is any players ahead and tries to cut it
            } else {
                let biases = [];
                myPositions.forEach(mine => {
                    for (key in this.oppPositions)
                        if ((key - mine) <= 6 && (key - mine) > 0) {
                            console.log("there is someone at" + key - mine);
                            biases.push(key - mine)
                        }
                })
                myPositions.forEach(mine => {
                    for (key in this.powerUpsLocation) {
                        if (key - mine <= 6 && (key - mine) > 0) {
                            console.log("a powerUp at" + key - mine);
                            biases.push(key - mine)
                        }
                    }
                })
                //cuts players with 30% chance
                if (biases.length > 0) {
                    this.movementAmount = UTILS.biasedRandom(biases, 100)
                } else this.movementAmount = UTILS.biasedRandom(6, 20)
            }
            console.log("the movement amount came to be " + this.movementAmount)
            this.players.forEach(async socket => {
                if (socket) await socket.emit("rollTheDice", this.movementAmount)
            });
            await new Promise(r => setTimeout(r, 3000));
            await this.gameController();

        }
        this.gameController = async function () {
            this.noPlayerChange = 0;
            if (this.movementAmount != 6) this.sixCount = 0;
            else this.sixCount++;
            if (this.sixCount != 3) {
                //j aayepani shake animation halney code same nai hunxa
                await this.findMovableGottis();
                //waiting for the calculations to be sent from the client to the server
                if (this.movableGottis.length == 0) this.playerIndicator();
                else if (this.movableGottis.length == 1) {
                    await this.moveGotti(this.movableGottis[0]);
                } else {
                    if (this.gottisOutside[this.playerIndex].length == 0) await this.moveGotti(this.movableGottis[0]);
                    //checks if all the available gottis are in the same position
                    else if (this.movableGottisPositions.every((val, i, arr) => val === arr[0])) this.moveGotti(this.movableGottis[0])

                }
            } else {
                this.sixCount = 0;
                this.playerIndicator();
            }
        }
        this.moveGotti = async function (id) {
            if (this.hasMoved == 0) {
                if (this.allGottis[this.playerIndex][id] == 0) {
                    this.getGottiOut(id)
                } else {
                    let positions = [];
                    let currPos = this.allGottis[this.playerIndex][id]
                    let finalPos = currPos + this.movementAmount;
                    for (let i = currPos; i <= finalPos; i++) {
                        if (i == 53) {
                            i = 1;
                            finalPos = finalPos % 52;
                        }
                        positions.push(i);
                        if (i == 105 || i == 115 || i == 125 || i == 135) {
                            //write gameOver code
                        }
                        if (this.currentPlayerColor == "red" && i == CONSTANTS.redStop) {
                            finalPos = CONSTANTS.redEntry + finalPos - i - 1;
                            i = CONSTANTS.redEntry - 1;
                        } else if (this.currentPlayerColor == "green" && i == CONSTANTS.greenStop) {
                            finalPos = CONSTANTS.greenEntry + finalPos - i - 1;
                            i = CONSTANTS.greenEntry - 1;
                        } else if (this.currentPlayerColor == "blue" && i == CONSTANTS.blueStop) {
                            finalPos = CONSTANTS.blueEntry + finalPos - i - 1;
                            i = CONSTANTS.blueEntry - 1;
                        } else if (this.currentPlayerColor == "yellow" && i == CONSTANTS.yellowStop) {
                            finalPos = CONSTANTS.yellowEntry + finalPos - i - 1;
                            i = CONSTANTS.yellowEntry - 1;
                        }
                    }
                    this.allGottis[this.playerIndex][id] = finalPos;
                    //checing final position for any gotti or powerUp
                    let result = this.checkFinalPosition(this.allGottis[this.playerIndex][id]);
                    this.players.forEach(async socket => {
                        if (socket) await socket.emit("moveGotti", id, this.playerIndex, positions, this.gottisInside, this.gottisOutside, result)
                    });
                }
            }
        }
        this.getGottiOut = function (id) {
            if (this.hasMoved == 0) {
                //niskeko gotti lai gottisOutside ko array ma append garni
                let ind = this.gottisInside[this.playerIndex].indexOf(id);
                if (ind >= 0) this.gottisInside[this.playerIndex].splice(ind, 1)
                this.gottisOutside[this.playerIndex].push(id)
                let position = 0;
                if (id.includes("red")) position = CONSTANTS.startRed
                else if (id.includes("green")) position = CONSTANTS.startGreen
                else if (id.includes("blue")) position = CONSTANTS.startBlue
                else position = CONSTANTS.startYellow
                this.allGottis[this.playerIndex][id] = position;
                this.players.forEach(async socket => {
                    if (socket) await socket.emit("getGottiOut", id, position, this.gottisInside, this.gottisOutside)
                });
            }
        }
        this.powerUpClicked = function (type) {
            CONSTANTS.timer.cancel();
            this.players[this.playerIndex].emit("removePowerUp", type)
            let ind = this.powerUps[this.playerIndex].indexOf(type);
            this.powerUps[this.playerIndex].splice(ind, 1);
            if (type.includes("freeRoll")) {
                this.noPlayerChange = 1;
            } else if (type.includes("skipTurn")) {
                this.playerIndex = (this.playerIndex + 1) % 4;
                while (!this.allGottis.hasOwnProperty(this.playerIndex)) {
                    this.playerIndex = (this.playerIndex + 1) % 4;
                }
            } else if ((type.includes("killAnyGotti"))) {
                this.isPowerUpRunning = 1;
                this.clickAble = 1;
                this.movableGottis = []
                for (let key in this.oppPositions) {
                    if (this.oppPositions.hasOwnProperty(key) && !CONSTANTS.starPositions.includes(key)) {
                        this.movableGottis.push(this.oppPositions[key])
                    }
                }
                if (this.movableGottis.length == 0) {
                    this.noPlayerChange = 0;
                    this.isPowerUpRunning = 0;
                    return
                } else {
                    this.noPlayerChange = 1;
                    this.players[this.playerIndex].emit("addShakeAnimation", this.movableGottis)
                }
            }
        }

        this.findMovableGottis = async () => {
            if (this.movementAmount == 6) {
                for (let key in this.allGottis[this.playerIndex]) {
                    if (this.allGottis[this.playerIndex].hasOwnProperty(key)) {
                        if (this.allGottis[this.playerIndex][key] == 0) {
                            this.movableGottis.push(key)
                            this.movableGottisPositions.push(0)
                        } else if (this.isOnFinishLine(this.allGottis[this.playerIndex][key])) {
                            this.movableGottis.push(key)
                            this.movableGottisPositions.push(this.allGottis[this.playerIndex][key])
                        }
                    }
                }
            } else {
                for (let key in this.allGottis[this.playerIndex]) {
                    if (this.allGottis[this.playerIndex].hasOwnProperty(key)) {
                        if (this.allGottis[this.playerIndex][key] != 0 && this.isOnFinishLine(this.allGottis[this.playerIndex][key])) {
                            this.movableGottis.push(key);
                            this.movableGottisPositions.push(this.allGottis[this.playerIndex][key])
                        }
                    }
                }
            }
            await this.players[this.playerIndex].emit("addShakeAnimation", this.movableGottis);
        }
        this.isOnFinishLine = (currPos) => {
            if (currPos > 100) {
                if ((currPos >= 100 && currPos + movementAmount < 106) || (currPos >= 110 && currPos + movementAmount < 116) || (currPos >= 120 && currPos + movementAmount < 126 || (currPos >= 130 && currPos + movementAmount < 136)) || currPos < 100) {
                    return 1;
                } else {
                    return 0;
                }
            } else return 2;
        }


        //returns the killed gotti name or the powerUp name or 0 for nothing
        this.checkFinalPosition = (fd) => {
            if (!CONSTANTS.starPositions.includes(fd)) {
                if (this.oppPositions.hasOwnProperty(fd)) {
                    let killed = UTILS.getKeyByValue(this.allGottis, fd);
                    let ind = -1;
                    let killedPlayerIndex = -1;
                    for (let j = 0; j < this.gottisOutside.length; j++) {
                        if (this.gottisOutside[j].indexOf(killed) != -1) {
                            ind = this.gottisOutside[j].indexOf(killed);
                            killedPlayerIndex = j;
                            break;
                        }
                    }
                    if (ind != -1) {
                        this.gottisOutside[killedPlayerIndex].splice(ind, 1)
                        this.allGottis[killedPlayerIndex][killed] = 0;
                        this.gottisInside[killedPlayerIndex].push(killed);
                    }
                    return {
                        "killed": this.oppPositions[fd]
                    };
                } else if (this.powerUpsLocation.hasOwnProperty(fd)) {
                    this.powerUps[this.playerIndex].push(this.powerUpsLocation[fd]);
                    delete this.powerUpsLocation[fd]
                    return {
                        "powerUp": fd
                    };
                }
                return 0
            }
            return 0
        }
    }

}

module.exports = Game;

//tyo kill any players marna milney namilney fix garna paryo ni hana