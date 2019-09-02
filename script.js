function Game() {
    this.playerIndex = 0;
    this.movementAmount = 0;
    this.gameEnded = 0
    this.sixCount = 0
    this.currentPlayerColor = ''
    this.startRed = 40
    this.startGreen = 1
    this.startBlue = 27
    this.startYellow = 14
    //describes if a player has played his turn
    this.hasMoved = 1;
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
    this.makeRoll = async function () {
        let rand;
        if (this.gottisOutside[this.playerIndex].length == 0) {
            console.log("calling biased random")
            rand = this.biasedRandom(6, 50)
        } else rand = Math.ceil(Math.random() * 6)
        console.log(rand + "aayo hai")
        let gif = document.querySelector(".gif");
        console.log(gif)
        gif.src = rand + ".gif";
        this.movementAmount = rand;
        await new Promise(r => setTimeout(r, 3000));
        this.gameController();
    }


    this.playerIndicator = async function () {
        if (this.sixCount != 1 && this.sixCount != 2) this.playerIndex = (this.playerIndex + 1) % 4;
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
        let all = document.getElementsByClassName("home");
        console.log(all)
        for (let i = 0; i < all.length; i++) {
            if (all[i].className.includes("highLight")) {
                all[i].classList.remove("highLight");
                console.log("removed highlight")
                break;
            }
        }
        let home = document.querySelector("." + this.currentPlayerColor + ".home");
        home.classList.add('highLight')
    }

    this.playerIndicator();

    this.moveGotti = async function (amount, id) {
        if (id.includes(this.currentPlayerColor) && this.hasMoved == 0) {
            let g = document.getElementById(id);
            let currPos = parseInt(g.parentNode.id);
            let finalPos = currPos + amount;
            this.isSafe(finalPos);
            for (let i = currPos; i <= finalPos; i++) {
                await new Promise(r => setTimeout(r, 200))
                let fd = document.getElementById(i);
                console.log(fd)
                fd.appendChild(g);
            }
            this.hasMoved = 1;
        } else {
            console.log("afno gotti move garna sala")
        }
    }

    document.addEventListener("click", (e) => {
        //for gotti
        if (e.target.className.includes("Gotti")) {
            let gottiId = e.target.id;
            if (this.movementAmount == 6 && e.target.parentNode.className.includes('home') && e.target.parentNode.className.includes(this.currentPlayerColor)) {
                console.log("Nikaling gotti out")
                this.getGottiOut(gottiId)
            } else this.moveGotti(this.movementAmount, gottiId)
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
            let ind = this.gottisInside[this.playerIndex].indexOf(id);
            console.log(this.gottisInside[this.playerIndex])
            console.log(this.gottisInside[this.playerIndex][ind])
            if (ind >= 0) this.gottisInside[this.playerIndex].splice(ind, 1)
            this.gottisOutside[this.playerIndex].push(id)
            console.log(this.gottisOutside)
            console.log(this.gottisInside)
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
            this.hasMoved = 1;
        } else {
            console.log("sala chor")
        }
    }

    this.biasedRandom = (bias, degree) => {
        if (bias.constructor == Number) {
            temp = bias;
            bias = []
            bias.push(temp);
        }
        let rand = Math.random().toFixed(2);
        console.log("degree of bias = " + rand)
        if (rand > (degree / 100)) {
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
        console.log(this.gottisOutside[this.playerIndex])
        if (this.sixCount != 3) {
            //6 aayo vane kk garney
            if (this.movementAmount == 6) {
                if (this.gottisOutside[this.playerIndex].length == 0) {
                    console.log(this.gottisOutside)
                    this.getGottiOut(this.gottisInside[this.playerIndex][0]);
                } else {
                    console.log("option")
                }
            }
            //6 aayena vaney k garney
            else {
                if (this.gottisOutside[this.playerIndex].length == 0) {
                    //eutai gotti bahira xaina vane skip gar
                    this.hasMoved = 1;
                    console.log("player changed")
                } else if (this.gottisOutside[this.playerIndex].length == 1) {
                    console.log("yes automove")
                    this.moveGotti(this.movementAmount, this.gottisOutside[this.playerIndex][0]);
                    console.log("player changed")
                } else {
                    console.log("sala kei ta xaina bahira")
                    console.log("afai move gar sala")
                }
            }
        } else {
            console.log("3 ta xaxkka")
            this.sixCount = 0;
            this.movementAmount = 0;
            this.hasMoved = 1;
            console.log("player changed")
        }
        this.playerIndicator();
    }

    this.isSafe = function (position) {
        let fd = document.getElementById(position);
        console.log("katyo ki kattena?")
        if (fd.children) console.log(fd.children)
        else {
            console.log("noone else hyere")
        }
        if (fd.children.length > 1) {
            console.log("Katyo")
            for (let i = 0; i < fd.children.length; i++) {
                if (fd.children[i].id.includes(this.currentPlayerColor)) {
                    console.log("katyo")
                    let killed = fd.children[i].id;
                    console.log(killed)
                    let col = killed.substr(0, killed.length - 1)
                    console.log("color = " + col)
                    let spots = document.getElementsByClassName("home_" + col);
                    console.log(spots)
                    for (let i = 0; i < spots.length; i++) {
                        if (spots[i].children.length == 0) {
                            console.log("khali xa")
                            spots[i].appendChild(document.querySelector("#" + killed))
                        }
                    }
                } else {
                    console.log("same")
                }
            }
        } else {
            console.log(fd.children.length)
            console.log("kattena afu matra xa");
        }
    }
}

let g = new Game();