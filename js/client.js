const CONSTANTS = {
    defaultColors: ['red', 'green', 'yellow', 'blue']
}
const showMessage = (text, color) => {
    const d = document.querySelector("." + color + ".home" + " .message");
    let p;
    if (!text.includes(".gif")) {
        p = document.createElement("p");
        p.innerHTML = text;
    } else {
        p = document.createElement("img")
        p.src = text;
    }
    d.appendChild(p)
    setTimeout(() => {
        d.removeChild(p)
    }, 3000);
}
const sock = io();
let GAMEDATA = {
    playerIds: [],
    playerIndex: '',
    movableGottis: [],
    currentPlayerColor: '',
}


function createPowerup(type) {
    this.type = type;
    let desc = '';
    if (type == "freeRoll") {
        desc = "Gives you an extra free roll! Yeaaa";
    } else if (type == 'skipTurn') {
        desc = "Skips the next players' turn!"
    } else if (type == 'killAnyGotti') {
        desc = "Kill any player in the Arena!"
    }
    let elem = document.createElement("div");
    elem.className = "powerUp";
    elem.classList.add(type)
    this.description = document.createElement("p");
    this.description.innerText = desc;
    elem.appendChild(this.description);
    this.image = elem;
}

document.querySelector(".playerName").addEventListener("keypress", (e) => {
    if (e.keyCode == 13) {
        e.preventDefault();
        enterGame();
    }
})

sock.on("nameReceived", () => {
    document.querySelector("#startGameDialogue").classList.remove("hidden");
    document.querySelector(".playerName").classList.add("hidden");
})

sock.on("waitForPlayers", (num) => {
    let p = document.createElement("p");
    p.innerText = "WAITING FOR " + num + " PLAYERS!"
    document.querySelector(".waitingForPlayers").classList.remove("hidden");
    document.querySelector("#startGameDialogue").classList.add("hidden");
    document.querySelector(".waitingForPlayers").innerHTML = '';
    document.querySelector(".waitingForPlayers").appendChild(p);
})
enterGame = () => {
    let name = document.querySelector(".playerName input").value.toUpperCase();
    document.querySelector("#startGameDialogue").classList.remove("hidden");
    document.querySelector(".playerName").classList.add("hidden");
    sock.emit("playerName", name);
}

sock.on("startGame", (powerUps, availablePlayers, gottisInside, playerIds, names) => {
    document.querySelector("#startGameDialogue").classList.add("hidden");
    document.querySelector(".waitingForPlayers").classList.add("hidden")
    GAMEDATA.playerIds = playerIds;
    document.querySelector("#Canvas").classList.remove("hidden");
    document.querySelector(".properties").classList.remove("hidden");
    for (let i = 0; i <= availablePlayers.length; i++) {
        if (availablePlayers.includes(i)) {
            //adding profile pictures
            let profilePic = document.createElement("img");
            let name = document.createElement("h1");
            name.innerText = names[i]
            profilePic.src = "./images/pp.jpg"
            profilePic.classList.add("profilePic");
            console.log(CONSTANTS.defaultColors[i])
            document.querySelector("." + CONSTANTS.defaultColors[i] + ".home").appendChild(profilePic)
            document.querySelector("." + CONSTANTS.defaultColors[i] + ".home").appendChild(name)
            //placing gottis in positions
            for (let j = 0; j < 4; j++) {
                let gotti = document.createElement("img");
                name.classList.add("name")
                gotti.classList.add("Gotti");
                gotti.id = gottisInside[i][j];
                let col = gotti.id.slice(0, gotti.id.length - 1)
                gotti.src = './images/gottis/' + col + '.png ';
                let pnt = document.querySelectorAll(".home_" + col + ".inner_space");
                pnt[j].appendChild(gotti);
            }
        }
    }
    //placing powerUps in positions
    for (var key in powerUps) {
        if (powerUps.hasOwnProperty(key)) {
            let location = document.getElementById(key);
            powerup = new createPowerup(powerUps[key]);
            location.appendChild(powerup.image)
        }
    }
})


sock.on("showMessage", (message, color) => {
    showMessage(message, color)
})

sock.on("powerUpTime", async () => {
    let pp = document.querySelector(".powerUps");
    pp.classList.add("timer");
    await new Promise(r => setTimeout(r, 5000))
    pp.classList.remove("timer")

})

sock.on("gameOver", (winners) => {
    document.querySelector("#Canvas").classList.add("hidden");
    document.querySelector(".properties").classList.add("hidden");
    document.querySelector("#endGameDialogue").classList.remove("hidden");
    winners.forEach((element, index) => {
        let e = document.createElement("button");
        e.innerText = (index + 1) + ".  " + element;
        document.querySelector("#endGameDialogue div").appendChild(e);
    })
})

sock.on("playerIndicator", (currentPlayerColor, id) => {
    console.log("adding highlight");
    let all = document.querySelectorAll(".home .profilePic");
    for (let i = 0; i < all.length; i++) {
        if (all[i].className.includes("highLight")) {
            all[i].classList.remove("highLight");
            break;
        }
    }
    GAMEDATA.currentPlayerColor = currentPlayerColor;
    let home = document.querySelector("." + currentPlayerColor + ".home .profilePic");
    home.classList.add('highLight');
    if (sock.id === id) {
        document.querySelector(".gif").classList.add("heartBeat");
    }
})

sock.on("removeGottiShake", () => {
    document.querySelector(".gif").classList.remove("heartBeat");
})

document.addEventListener("click", async (e) => {
    //if a gotti has been clicked
    let gottiId = e.target.id;
    if (gottiId.includes("playAgain")) {
        document.querySelector("#endGameDialogue div").innerHTML = '';
        document.querySelector("#endGameDialogue").classList.add("hidden");
        document.querySelector("#startGameDialogue").classList.remove("hidden");
    } else if (gottiId.includes("players")) {
        sock.emit("joinGame", gottiId);
    } else if ((e.target.className == "roll" || e.target.className.includes("gif"))) {
        console.log("roll please")
        sock.emit("roll", "hey");
    } else if (!e.target.className.includes("powerUps") && e.target.className.includes("powerUp") && GAMEDATA.playerIds[GAMEDATA.playerIndex] == sock.id) {
        sock.emit("powerUpClicked", e.target.className.replace("powerUp ", ""))
    }
    //if he clicks in the box instead
    else if (gottiId.includes("sendMessage")) {
        console.log("sendiong messahe")
        sendMessage();
    } else if (gottiId.includes("gif")) {
        let src = gottiId.split(" ")[1];
        src = "./images/GIFS/" + src + ".gif";
        sendMessage(src);
    } else if (/^\d*$/.test(gottiId)) {
        try {
            let ch = document.getElementById(gottiId).getElementsByClassName("Gotti");
            if (ch[0]) {
                console.log("yess there is a fucking child")
                let ids = []
                for (let i = 0; i < ch.length; i++) {
                    ids.push(ch[i].id)
                }
                sock.emit("gottiClicked", ids);
            }
        } catch (err) {}
    } else await sock.emit("gottiClicked", gottiId);

})
document.querySelector("#messageBox").addEventListener("keypress", (e) => {
    if (e.keyCode == 13) {
        e.preventDefault();
        sendMessage();
    }
})

sendMessage = (src) => {
    let message;
    if (src) {
        message = src;
    } else {
        message = document.getElementById("messageBox").value;
        document.getElementById("messageBox").value = "";
    }
    if (message) sock.emit("sendMessage", message)
}

sock.on("removePlayer", (color) => {
    console.log("removing player")
    let name = document.querySelector("." + color + " .name");
    name.parentElement.removeChild(name);
    let profile = document.querySelector("." + color + " .profilePic");
    profile.parentElement.removeChild(profile);
    for (let i = 1; i <= 4; i++) {
        let gotti = document.querySelector("#" + color + i);
        if (gotti) {
            gotti.parentElement.removeChild(gotti);
        }
    }
})

sock.on("rollTheDice", async (movementAmount) => {
    let gif = document.querySelector(".gif");
    gif.src = './images/GIFS/' + movementAmount + ".gif";
})


sock.on("removeShakeAnimation", (gottisInside, gottisOutside) => {
    removeShakeAnimation(gottisInside, gottisOutside)
})

removeShakeAnimation = (gottisInside, gottisOutside) => {
    for (let i = 0; i < gottisOutside.length; i++) {
        for (let j = 0; j < gottisOutside[i].length; j++) {
            let gotti = document.querySelector("#" + gottisOutside[i][j]);
            if (gotti) gotti.classList.remove("useMe")
        }
    }
    for (let i = 0; i < gottisInside.length; i++) {
        for (let j = 0; j < gottisInside[i].length; j++) {
            let gotti = document.querySelector("#" + gottisInside[i][j]);
            if (gotti) gotti.classList.remove("useMe")
        }
    }
}

sock.on("moveGotti", async (id, playerIndex, positions, gottisInside, gottisOutside, result) => {
    GAMEDATA.playerIndex = playerIndex;
    removeShakeAnimation(gottisInside, gottisOutside);
    let g = document.getElementById(id);
    let fd;
    for (let i = 0; i < positions.length - 1;) {
        fd = document.getElementById(positions[i]);
        //if two gottis incountered in the way removes the classes that makes them smaller
        fdGottis = fd.getElementsByClassName("Gotti");
        if (fdGottis.length <= 2) {
            fd.classList.remove("twoGotti")
        } else if (fdGottis.length == 3) {
            fd.classList.remove("multipleGotti");
        }
        //if the gotti has reached the finish line
        i++;
        fd = document.getElementById(positions[i]);
        if (fd) {
            fdGottis = fd.getElementsByClassName("Gotti");
            //checks the position for any opponents or powerups
            await new Promise(r => setTimeout(r, 200))
            if (fdGottis.length === 2) fd.classList.add("twoGotti")
            else if (fdGottis.length > 2) fd.classList.add("multipleGotti")
            fd.appendChild(g);
        }
        if (i == positions.length - 1) {
            if (result["killed"]) killGotti(result['killed']);
            if (result['powerUp']) addPowerUp(result['powerUp'])
            if (result["gottiHome"]) gottiHome(result['gottiHome'])
            if (result["gameFinished"]) gottiHome(result['gottiHome'])
        }
    }
    if (GAMEDATA.playerIds[GAMEDATA.playerIndex] == sock.id) {
        sock.emit("finishedMoving", result);
    }
})

sock.on("getGottiOut", (id, position, gottisInside, gottisOutside) => {
    removeShakeAnimation(gottisInside, gottisOutside);
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
    sock.emit("finishedMoving", "");
})

sock.on("addPowerUp", (destinationID) => {
    addPowerUp(destinationID)
})

addPowerUp = (destinationID) => {
    let dest = document.getElementById(destinationID);
    let child = dest.getElementsByClassName("powerUp")[0]
    dest.removeChild(child);
    if (GAMEDATA.playerIds[GAMEDATA.playerIndex] == sock.id) document.querySelector(".powerUps").appendChild(child);
}

sock.on("killGotti", (killed) => {
    killGotti(killed);
})

killGotti = (killed) => {
    let color = killed.substr(0, killed.length - 1);
    let spots = document.getElementsByClassName("home_" + color);
    for (let j = 0; j < spots.length; j++) {
        if (spots[j].children.length == 0) {
            spots[j].appendChild(document.querySelector("#" + killed))
            break;
        }
    }
}

gameFinished = () => {
    let endGame = document.querySelector("#endGameDialogue");
    for (let i = 0; i < totalPlayersCount; i++) {
        let el = document.createElement("button");
        el.innerHTML = this.winners[i];
        endGame.children[0].appendChild(el);
    }
    endGame.classList.remove("hidden");
    document.querySelector("#Canvas").classList.add("hidden");
}

gottiHome = (id) => {
    let col = id.replace(/[0-9]/g, "");
    let gotti = document.querySelector('#' + id);
    document.querySelector(".finished_" + col).appendChild(gotti);
    console.log(gotti);
    console.log(document.querySelector(".finished_" + col))
}

sock.on("removePowerUp", type => {
    let pp = document.querySelector(".powerUps");
    pp.classList.remove("timer");
    let p = document.querySelector(".powerUps");
    let c = p.querySelector("." + type);
    p.removeChild(c);
})
sock.on("addShakeAnimation", movableGottis => {
    movableGottis.forEach(element => {
        var d = document.getElementById(element);
        d.classList.add("useMe")
    });
})