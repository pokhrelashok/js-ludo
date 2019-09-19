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
    this.playerIndex = -1;
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
            let gottisToHide = document.querySelectorAll(".box_green .Gotti");
            gottisToHide.forEach(element => {
                element.classList.add("hidden")
            });
            gottisToHide = document.querySelectorAll(".box_blue .Gotti");
            gottisToHide.forEach(element => {
                element.classList.add("hidden")
            });

        } else if (this.totalPlayersCount == 3) {
            let gottisToHide = document.querySelectorAll(".box_green .Gotti");
            console.log(gottisToHide)
            gottisToHide.forEach(element => {
                element.classList.add("hidden")
            });
            this.availablePlayers = [0, 2, 3];
        }
        this.playerIndicator();
    }
    this.makeRoll = async function () {
        let rand;
        if (this.gottisOutside[this.playerIndex].length == 0) {
            console.log("calling biased random")
            rand = this.biasedRandom(6, 80)
        } else {
            rand = this.biasedRandom(6, 20)
            // rand = Math.ceil(Math.random() * 6)
        }
        console.log(rand + "aayo hai")
        let gif = document.querySelector(".gif");
        gif.src = rand + ".gif";
        this.movementAmount = rand;
        await new Promise(r => setTimeout(r, 3000));
        this.gameController();
    }



    this.playerIndicator = async function (noPlayerChange) {
        console.log(noPlayerChange)
        if (!noPlayerChange) noPlayerChange = 0;
        console.log("noPlayerChange" + noPlayerChange)
        if (this.sixCount != 1 && this.sixCount != 2 && noPlayerChange == 0) {
            this.playerIndex = (this.playerIndex + 1) % 4;
            while (!this.availablePlayers.includes(this.playerIndex)) {
                this.playerIndex = (this.playerIndex + 1) % 4;
                console.log(this.playerIndex)
            }
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
                console.log("removed highlight")
                break;
            }
        }
        let home = document.querySelector("." + this.currentPlayerColor + ".home .profilePic");
        home.classList.add('highLight')
    }

    this.moveGotti = async function (amount, id) {
        if (id.includes(this.currentPlayerColor) && this.hasMoved == 0) {
            let g = document.getElementById(id);
            let currPos = parseInt(g.parentNode.id);
            let finalPos = currPos + amount;

            //for gottis inside home
            let noPlayerChange = 0;
            if ((currPos >= 100 && finalPos < 106) || (currPos >= 110 && finalPos < 116) || (currPos >= 120 && finalPos < 126 || (currPos >= 130 && finalPos < 136)) || currPos < 100) {
                console.log("homeable")
                let fd = '';
                let fdGottis;
                let i = currPos;
                //indicated noPlayerChange xa ki xaina
                while (i < finalPos) {
                    this.removeAnimation();
                    console.log("I = " + i)
                    console.log("final pos = " + finalPos)
                    await new Promise(r => setTimeout(r, 200))
                    fd = document.getElementById(i);
                    //if two gottis incountered in the way
                    //checks the current position for multiple childrens
                    if (fd) {
                        fdGottis = fd.getElementsByClassName("Gotti");
                        console.log("no of gottis")
                        console.log(fdGottis)
                        if (fdGottis.length <= 2) {
                            fd.classList.remove("twoGotti")
                            console.log("removing class two gotti")
                            console.log(fd)
                        } else if (fdGottis.length == 3) {
                            fd.classList.remove("multipleGotti");
                        }
                    }


                    //moving to next position
                    i++;
                    if (i == 53) {
                        console.log("Changing value of final position")
                        i = i % 52;
                        finalPos = finalPos % 52;
                    }
                    if (i == 105 || i == 115 || i == 125 || i == 135) {
                        console.log("home");
                        i = finalPos;
                        let ind = this.gottisOutside[this.playerIndex].indexOf(id);
                        if (ind >= 0) this.gottisOutside[this.playerIndex].splice(ind, 1)
                        let gameOver = document.querySelector(".finished_" + this.currentPlayerColor);
                        //total game completed
                        if (this.gottisOutside[this.playerIndex].length == 0 && this.gottisInside[this.playerIndex].length == 0) {
                            console.log("you game is done mister");
                            let ind = this.availablePlayers.indexOf(this.playerIndex)
                            this.availablePlayers.splice(ind, 1);
                            this.winners.push(this.currentPlayerColor);
                            if (this.availablePlayers.length == 1) {
                                console.log("this game is done");
                                this.gameOver();
                            }
                        } else {
                            noPlayerChange = 1;
                        }
                        gameOver.appendChild(g);
                    } else {
                        fd = document.getElementById(i);
                        if (fd) fdGottis = fd.getElementsByClassName("Gotti");

                        //yedi final position ho vaney katdiney
                        if (i == finalPos && fdGottis && fdGottis.length > 0) {
                            console.log("lets check for cutting");
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
                        fd.appendChild(g);
                        console.log(fd)


                        //checking for powerup and adding powerup to the powerups
                        if (i == finalPos && fd.querySelector(".powerUp")) {
                            let p = fd.querySelector(".powerUp");
                            document.querySelector(".box_" + this.currentPlayerColor + " .powerUps").appendChild(p);
                        }


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
                        //adds the multiple gotti
                        if (fdGottis.length == 2) {
                            console.log("fd.children")
                            console.log(fd.children)
                            fd.classList.add("twoGotti")
                        } else if (fdGottis.length > 2) {
                            console.log("fd.children")
                            console.log(fd.children)
                            fd.classList.add("multipleGotti")
                        }
                    }
                }
                this.hasMoved = 1;
                //option deko khanda ma turn change garnu parxa so,
                this.playerIndicator(noPlayerChange);
            } else {
                console.log("cant pick this one");
                if (this.gottisOutside[this.playerIndex].length == 1) {
                    //bichara ko euta matra gotti raxa
                    this.sixCount = 0;
                    this.hasMoved = 1;
                    this.playerIndicator(noPlayerChange);
                }
            }

        } else {
            console.log("afno gotti move garna sala")
        }
    }

    this.removeAnimation = function () {
        //remove shake effect
        console.log("gotti moved");
        for (let i = 0; i < this.gottisOutside[this.playerIndex].length; i++) {
            let gotti = document.querySelector("#" + this.gottisOutside[this.playerIndex][i]);
            gotti.classList.remove("useMe")
        }
        for (let i = 0; i < this.gottisInside[this.playerIndex].length; i++) {
            let gotti = document.querySelector("#" + this.gottisInside[this.playerIndex][i]);
            gotti.classList.remove("useMe")
        }
    }

    document.addEventListener("click", (e) => {
        //for gotti
        if (e.target.className.includes("Gotti")) {
            if (this.clickAble == 1) {
                this.clickAble = 0;
                let gottiId = e.target.id;
                if (this.movementAmount == 6 && e.target.parentNode.className.includes('home') && e.target.parentNode.className.includes(this.currentPlayerColor)) {
                    console.log("Nikaling gotti out")
                    this.clickAble = 0;
                    this.getGottiOut(gottiId)
                } else this.moveGotti(this.movementAmount, gottiId)
            }
        } else if (e.target.className == "gameOver" || e.target.className == "gif") {
            if (this.hasMoved) {
                console.log("make a roll")
                this.makeRoll();
                this.hasMoved = 0;
            } else {
                console.log("arkako palo michxas")
            }
        }
    })

    this.getGottiOut = function (id) {
        if (this.hasMoved == 0) {
            //niskeko gotti lai gottisOutside ko array ma append garni
            this.removeAnimation();
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
            this.hasMoved = 1;
        } else {
            console.log("sala chor")
        }
    }

    this.biasedRandom = (...args) => {
        let degree = args.pop();
        let bias = args;
        let rand = Math.random().toFixed(2);
        console.log("degree of bias = " + rand)
        if (rand < (degree / 100)) {
            rand = Math.floor(Math.random() * bias.length);
            return bias[rand];
        } else {
            rand = Math.ceil(Math.random() * 6);
            return rand;
        }
    }

    this.gameController = async function () {
        if (this.movementAmount != 6) {
            this.sixCount = 0;
        } else {
            this.sixCount++;
        }
        if (this.sixCount != 3) {
            //6 aayo vane kk garney
            if (this.movementAmount == 6) {
                if (this.gottisOutside[this.playerIndex].length == 0) {
                    console.log(this.gottisOutside)
                    this.getGottiOut(this.gottisInside[this.playerIndex][0]);
                } else {
                    //shake all the gottis inside the home;
                    this.clickAble = 1;
                    console.log("option");
                    for (let i = 0; i < this.gottisOutside[this.playerIndex].length; i++) {
                        let gotti = document.querySelector("#" + this.gottisOutside[this.playerIndex][i]);
                        gotti.classList.add("useMe")
                    }
                    for (let i = 0; i < this.gottisInside[this.playerIndex].length; i++) {
                        let gotti = document.querySelector("#" + this.gottisInside[this.playerIndex][i]);
                        gotti.classList.add("useMe")
                    }

                }
            }
            //6 aayena vaney k garney
            else {
                if (this.gottisOutside[this.playerIndex].length == 0) {
                    //eutai gotti bahira xaina vane skip gar
                    this.hasMoved = 1;
                    this.playerIndicator();
                } else if (this.gottisOutside[this.playerIndex].length == 1) {
                    console.log("yes automove")
                    this.moveGotti(this.movementAmount, this.gottisOutside[this.playerIndex][0]);
                } else {
                    this.clickAble = 1;
                    console.log("option");
                    for (let i = 0; i < this.gottisOutside[this.playerIndex].length; i++) {
                        let gotti = document.querySelector("#" + this.gottisOutside[this.playerIndex][i]);
                        gotti.classList.add("useMe")
                    }
                }
            }
        } else {
            console.log("3 ta xaxkka")
            this.sixCount = 0;
            this.movementAmount = 0;
            this.hasMoved = 1;
            console.log("player changed")
            this.playerIndicator();
        }
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

let playerSelectionDiv = document.querySelector("#startGameDialogue")
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
        let g = new Game(totalPlayersCount);
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

//home to gotti lai blinkable banauni ki nabanauni decision linu jaroori
//implement freeRoll
//make overall ui better