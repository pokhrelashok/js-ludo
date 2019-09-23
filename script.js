function createPowerup(type) {
    this.type = type;
    let desc = '';
    if (type == "freeRoll") {
        desc = "Gives you an extra free roll! Yeaaa";
    }
    let elem = document.createElement("div");
    elem.className = "powerUp";
    this.image = document.createElement("div");
    this.image.classList.add(type)
    this.description = document.createElement("p");
    this.description.innerText = desc;
    elem.appendChild(this.image);
    elem.appendChild(this.description);
    this.image = elem;
}


let powerUps = ['freeRoll'];


function Game(totalPlayersCount) {
    this.playerIndex = 0;
    this.clickAble = 0;
    this.movementAmount = 0;
    this.gameEnded = 0
    this.sixCount = 0
    this.currentPlayerColor = ''
    this.startRed = 40
    this.startGreen = 1
    this.startBlue = 27
    this.startYellow = 14
    this.greenStop = 51;
    this.yellowStop = 12;
    this.blueStop = 25;
    this.redStop = 38;
    this.greenEntry = 100;
    this.yellowEntry = 110;
    this.blueEntry = 120;
    this.totalPlayersCount = totalPlayersCount;
    this.winners = [];
    this.powerUps = [];
    this.redEntry = 130;
    this.movableGottis = [];
    this.availablePlayers = [0, 1, 2, 3]
    //describes if a player has played his turn
    this.hasMoved = 1;
    //defines if the players will change
    this.willPlayerChange = 0;
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
    this.rollBox = document.querySelector(".roll");
    this.startGame = function () {
        if (this.totalPlayersCount == 2) {
            this.availablePlayers = [0, 2];
        } else if (this.totalPlayersCount == 3) {
            this.availablePlayers = [0, 2, 3];
        }
        for (let i = 0; i <= this.availablePlayers.length; i++) {
            if (this.availablePlayers.includes(i)) {
                for (let j = 0; j < 4; j++) {
                    let gotti = document.createElement("img");
                    gotti.classList.add("Gotti");
                    gotti.id = this.gottisInside[i][j];
                    let col = gotti.id.slice(0, gotti.id.length - 1)
                    gotti.src = col + ".png";
                    let pnt = document.querySelectorAll(".home_" + col + ".inner_space");
                    pnt[j].appendChild(gotti);
                }
            }
        }
        this.playerIndicator();
    }
    this.makeRoll = async function () {
        this.hasMoved = 0;
        if (this.gottisOutside[this.playerIndex].length == 0) {
            console.log("calling biased random")
            this.movementAmount = this.biasedRandom(6, 75)
        } else {
            //sees if there is any players ahead and tries to cut it
            let biases = [];
            for (let i = 0; i < this.gottisOutside[this.playerIndex].length; i++) {
                let pos = parseInt(parseInt(document.getElementById(this.gottisOutside[this.playerIndex][i]).parentNode.id));
                if (pos < 100) {
                    for (let j = 1; j <= 6; j++) {
                        let k = pos + j;
                        if (k > 52) k = k % 52;
                        let tempPosition = document.getElementById(k);
                        let opps = tempPosition.querySelector(".Gotti");
                        if (opps) {
                            if (!opps.id.includes(this.currentPlayerColor)) {
                                biases.push(j);
                            }
                        }
                    }
                }
            }
            //cuts players with 30% chance
            if (biases.length > 0) this.movementAmount = this.biasedRandom(biases, 30)
            else this.movementAmount = this.biasedRandom(6, 80)
        }
        let gif = document.querySelector(".gif");
        gif.src = this.movementAmount + ".gif";
        //waits untile the gif rolls
        await new Promise(r => setTimeout(r, 3000));
        this.gameController();
    }


    this.playerIndicator = async function (noPlayerChange) {
        if (!noPlayerChange) noPlayerChange = 0;
        if (this.sixCount != 1 && this.sixCount != 2 && noPlayerChange == 0) {
            this.playerIndex = (this.playerIndex + 1) % 4;
            while (!this.availablePlayers.includes(this.playerIndex)) {
                this.playerIndex = (this.playerIndex + 1) % 4;
            }
            this.clickAble = 1;
        }
        if (this.playerIndex == 0) {
            this.currentPlayerColor = "red";
        }
        if (this.playerIndex == 1) {
            this.currentPlayerColor = "green";
        }
        if (this.playerIndex == 2) {
            this.currentPlayerColor = "yellow";
        }
        if (this.playerIndex == 3) {
            this.currentPlayerColor = "blue";
        }

        //adds highlight around home of current player
        let all = document.querySelectorAll(".home .profilePic");
        for (let i = 0; i < all.length; i++) {
            if (all[i].className.includes("highLight")) {
                all[i].classList.remove("highLight");
                break;
            }
        }
        let home = document.querySelector("." + this.currentPlayerColor + ".home .profilePic");
        home.classList.add('highLight');
    }

    //does all the processing required to move a gotti and check if anything can be cut
    this.moveGotti = async function (id) {
        if (this.hasMoved == 0) {
            this.clickAble = 0;
            let g = document.getElementById(id);
            if (g.parentNode.className.includes("inner_space")) {
                this.getGottiOut(id)
            } else {
                let currPos = parseInt(g.parentNode.id);
                let finalPos = currPos + this.movementAmount;
                //for gottis inside home
                let fd = '';
                let fdGottis;
                let i = currPos;
                while (i < finalPos) {
                    this.removeShakeAnimation();
                    fd = document.getElementById(i);
                    //if two gottis incountered in the way removes the classes that makes them smaller
                    if (fd) {
                        fdGottis = fd.getElementsByClassName("Gotti");
                        if (fdGottis.length <= 2) {
                            fd.classList.remove("twoGotti")
                        } else if (fdGottis.length == 3) {
                            fd.classList.remove("multipleGotti");
                        }
                    }

                    //moving to next position
                    i++;
                    if (i == 53) {
                        i = i % 52;
                        finalPos = finalPos % 52;
                    }
                    //if the gotti has reached the finish line
                    if (i == 105 || i == 115 || i == 125 || i == 135) {
                        i = finalPos;
                        let ind = this.gottisOutside[this.playerIndex].indexOf(id);
                        if (ind >= 0) this.gottisOutside[this.playerIndex].splice(ind, 1)
                        let gameOver = document.querySelector(".finished_" + this.currentPlayerColor);
                        //total game completed
                        if (this.gottisOutside[this.playerIndex].length == 0 && this.gottisInside[this.playerIndex].length == 0) {
                            let ind = this.availablePlayers.indexOf(this.playerIndex)
                            this.availablePlayers.splice(ind, 1);
                            this.winners.push(this.currentPlayerColor);

                            if (this.availablePlayers.length == 1) {
                                this.playerIndicator();
                                this.winners.push(this.currentPlayerColor);
                                this.gameOver();
                            }
                        } else {
                            this.noPlayerChange = 1;
                        }
                        gameOver.appendChild(g);
                    } else {
                        fd = document.getElementById(i);
                        //checks the position for any opponents or powerups
                        if (i == finalPos) this.checkFinalPosition(fd);
                        await new Promise(r => setTimeout(r, 200))
                        fd.appendChild(g);

                        //checks if they are at the stop positions
                        if (this.currentPlayerColor == "red" && i == this.redStop) {
                            finalPos = this.redEntry + finalPos - i - 1;
                            i = this.redEntry - 1;
                        } else if (this.currentPlayerColor == "green" && i == this.greenStop) {
                            finalPos = this.greenEntry + finalPos - i - 1;
                            console.log("new final position" + finalPos)
                            i = this.greenEntry - 1;
                        } else if (this.currentPlayerColor == "blue" && i == this.blueStop) {
                            finalPos = this.blueEntry + finalPos - i - 1;
                            i = this.blueEntry - 1;
                        } else if (this.currentPlayerColor == "yellow" && i == this.yellowStop) {
                            finalPos = this.yellowEntry + finalPos - i - 1;
                            i = this.yellowEntry - 1;
                        }
                        //adds the classes to make the gotti smaller when there are multiple gottis
                        if (fdGottis.length == 2) fd.classList.add("twoGotti")
                        else if (fdGottis.length > 2) fd.classList.add("multipleGotti")
                    }
                }
            }
            this.hasMoved = 1;
        }
    }


    this.checkFinalPosition = (fd) => {
        //checks for opponents in the final position
        let fdGottis = [];
        if (!fd.className.includes("hasStar")) {
            fdGottis = fd.getElementsByClassName("Gotti");
            if (fdGottis.length > 0) {
                for (let i = 0; i < fdGottis.length; i++) {
                    if (!fdGottis[i].id.includes(this.currentPlayerColor)) {
                        let killed = fdGottis[i].id;
                        let col = killed.substr(0, killed.length - 1)
                        let spots = document.getElementsByClassName("home_" + col);
                        for (let j = 0; j < spots.length; j++) {
                            if (spots[j].children.length == 0) {
                                spots[j].appendChild(document.querySelector("#" + killed))
                            }
                        }
                        //noPlayerChange gotti lai gottisOutside ko array ma append garni
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
                            this.gottisInside[killedPlayerIndex].push(killed)
                            console.log(this.gottisInside)
                            console.log(this.gottisOutside)
                        }
                        noPlayerChange = 1;
                        console.log("player change nagar hai")
                    } else {
                        noPlayerChange = 0;
                        console.log("same")
                    }
                }
            }
            //checks for powerUps in the final position
        }
        fdGottis = fd.getElementsByClassName("powerUp");
        if (fdGottis.length > 0) {
            document.querySelector(".box_" + this.currentPlayerColor + " .powerUps").appendChild(fdGottis[0]);
        }
    }

    this.removeShakeAnimation = function () {
        //remove shake effect
        for (let i = 0; i < this.gottisOutside[this.playerIndex].length; i++) {
            let gotti = document.querySelector("#" + this.gottisOutside[this.playerIndex][i]);
            gotti.classList.remove("useMe")
        }
        for (let i = 0; i < this.gottisInside[this.playerIndex].length; i++) {
            let gotti = document.querySelector("#" + this.gottisInside[this.playerIndex][i]);
            gotti.classList.remove("useMe")
        }
    }

    document.addEventListener("click", async (e) => {
        //if a gotti has been clicked
        let gottiId = e.target.id;
        console.log(this.movableGottis.includes(gottiId))
        console.log(this.clickAble === 1)
        if (this.movableGottis.includes(gottiId) && this.clickAble === 1) {
            console.log("move your ass gotti")
            await this.moveGotti(gottiId)
        } else if ((e.target.className == "gameOver" || e.target.className == "gif") && this.hasMoved == 1) {
            this.hasMoved = 0;
            this.movableGottis = [];
            this.makeRoll();
        } else console.log("has moved")
    });

    this.getGottiOut = function (id) {
        if (this.hasMoved == 0) {
            //niskeko gotti lai gottisOutside ko array ma append garni
            this.removeShakeAnimation();
            let ind = this.gottisInside[this.playerIndex].indexOf(id);
            if (ind >= 0) this.gottisInside[this.playerIndex].splice(ind, 1)
            this.gottisOutside[this.playerIndex].push(id)
            let position = 0;
            if (id.includes("red")) {
                position = this.startRed
            } else if (id.includes("green")) {
                position = this.startGreen
            } else if (id.includes("blue")) {
                position = this.startBlue
            } else {
                console.log("yellow")
                position = this.startYellow
            }
            fd = document.getElementById(position);
            g = document.getElementById(id);
            fd.appendChild(g);
            //nikalda kheri position ma multiple gotti check
            let fdLen = fd.getElementsByClassName("Gotti")
            if (fdLen.length == 2) {
                fd.classList.add("twoGotti")
            } else if (fdLen.length > 2) {
                fd.classList.add("multipleGotti")
            }
        }
    }

    //calculates biased random using the array and the probability sent
    this.biasedRandom = (bias, degree) => {
        if (!Array.isArray(bias)) {
            let temp = bias;
            bias = []
            bias.push(temp);
        }
        let rand = Math.random().toFixed(2);
        if (rand < (degree / 100)) {
            rand = Math.floor(Math.random() * bias.length);
            return bias[rand];
        } else {
            rand = Math.ceil(Math.random() * 6);
            return rand;
        }
    }

    //finds gottis that can be moved in each steps adds shake to gottis that can be moved
    this.findMovableGotti = function () {
        if (this.movementAmount == 6) {
            for (let i = 0; i < this.gottisInside[this.playerIndex].length; i++) {
                this.movableGottis.push(this.gottisInside[this.playerIndex][i])
                let gotti = document.querySelector("#" + this.gottisInside[this.playerIndex][i]);
                gotti.classList.add("useMe")
            }
        }
        //checks for the home gottis
        for (let i = 0; i < this.gottisOutside[this.playerIndex].length; i++) {
            if (this.isOnFinishLine(this.gottisOutside[this.playerIndex][i])) {
                this.movableGottis.push(this.gottisOutside[this.playerIndex][i])
                let gotti = document.querySelector("#" + this.gottisOutside[this.playerIndex][i]);
                gotti.classList.add("useMe")
            }
        }
        console.log(this.movableGottis);
    }

    this.gameController = async function () {
        this.hasMoved = 0;
        if (this.movementAmount != 6) {
            this.sixCount = 0;
        } else {
            this.sixCount++;
        }
        if (this.sixCount != 3) {
            //j aayepani shake animation halney code same nai hunxa
            this.findMovableGotti();
            this.noPlayerChange = 0;
            console.log("Movable length" + this.movableGottis.length)
            if (this.movableGottis.length == 0) {
                this.sixCount = 0;
                this.hasMoved = 1;
            } else if (this.movableGottis.length == 1) {
                await this.moveGotti(this.movableGottis[0]);
            } else {
                if (this.gottisOutside[this.playerIndex].length == 0) await this.moveGotti(this.movableGottis[0]);
                else {
                    this.clickAble = 1;
                }
            }
            this.playerIndicator(this.noPlayerChange);
        } else {
            this.sixCount = 0;
            this.hasMoved = 1;
            this.playerIndicator();
        }
    }


    //returns 1 if the gotti can move inside the finish line, 2 if the gotti aint in finish line and 0 if its in the finish line but cant make it
    this.isOnFinishLine = function (id) {
        let gotti = document.querySelector("#" + id);
        let currPos = parseInt(gotti.parentNode.id);
        if (currPos > 100) {
            if ((currPos >= 100 && currPos + this.movementAmount < 106) || (currPos >= 110 && currPos + this.movementAmount < 116) || (currPos >= 120 && currPos + this.movementAmount < 126 || (currPos >= 130 && currPos + this.movementAmount < 136)) || currPos < 100) {
                return 1;
            } else {
                return 0;
            }
        } else return 2;
    }

    this.gameOver = function () {
        let endGame = document.querySelector("#endGameDialogue");
        for (let i = 0; i < totalPlayersCount; i++) {
            let el = document.createElement("button");
            el.innerHTML = this.winners[i];
            endGame.children[0].appendChild(el);
        }
        endGame.classList.remove("hidden");
        document.querySelector("#Canvas").classList.add("hidden");
    }
}

let playerSelectionDiv = document.querySelector("#startGameDialogue");
document.querySelector("#playAgain").addEventListener("click", e => {
    document.querySelector("#endGameDialogue").classList.add("hidden");
    playerSelectionDiv.classList.remove("hidden");
})
playerSelectionDiv.addEventListener("click", e => {
    let totalPlayersCount = 4;
    if (e.target.id.includes("players")) {
        if (e.target.id == "2players") {
            totalPlayersCount = 2
            console.log(totalPlayersCount)
        } else if (e.target.id == '3players') {
            totalPlayersCount = 3;
        } else if ((e.target.id == '4players')) {
            totalPlayersCount = 4;
        }
        let g = {};
        g = new Game(totalPlayersCount);
        //placing powerups in the board
        let places = [];
        for (i = 0; i < 6; i++) {
            let loc = Math.ceil(Math.random() * 52);
            if (!places.includes(loc) && loc != 40 && loc != 1 && loc != 48 && loc != 14 && loc != 9 && loc != 22 && loc != 27 && loc != 35) {
                let location = document.getElementById(loc);
                let powerup = Math.floor(Math.random() * powerUps.length);
                powerup = powerUps[powerup];
                powerup = new createPowerup(powerup);
                g.powerUps.push(powerup);
                location.appendChild(powerup.image)
                places.push(loc)
            }
        }
        console.log(g.powerUps);
        playerSelectionDiv.classList.add("hidden");
        document.querySelector("#Canvas").classList.remove("hidden");
        g.startGame();
    }
})

//same thaum ma jump gardaixa ani ek step agadi nai khadaixa
//automove one gotti if two gotti are in the same position
//implement freeRoll
//make overall ui better
//implement finishing line ko gotti lai home huna dine ai