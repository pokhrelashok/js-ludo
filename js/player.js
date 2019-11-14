class Player {
    constructor(name, sock) {
        this.name = name;
        this.sock = sock;
        this.gameMode = 0;
        this.profileUrl = '';
        this.inGame = false;
    }
}
module.exports = Player;