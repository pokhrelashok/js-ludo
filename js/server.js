const express = require('express')
const app = express()
const http = require('http')
const socket = require('socket.io')
const server = http.createServer(app);
const clientPath = `${__dirname}/../`
app.use(express.static(clientPath))
server.on('error', (err) => {
    console.log('server error', err)
})

const io = socket(server);
io.on('connection', (sock) => {
    sock.emit("message", "Hi you are connected!")
    console.log("someone connected")
})
server.listen(8000, () => {
    console.log('server starrted on port 8000')
})