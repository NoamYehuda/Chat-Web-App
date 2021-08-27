const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {genrateMessage, genrateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')
const { REPL_MODE_SLOPPY } = require('repl')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', genrateMessage ('Admin','Welcome!'))//Emits to the user who has joined
        socket.broadcast.to(user.room).emit('message', genrateMessage('Admin',`${user.username} has joined!`)) //Emitting to everyone except the one who joined
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })

    //Handling sending messages from one client to the others
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', genrateMessage(user.username ,message)) //Emits to everyone
        callback()
       
    })
    
    //Handling shared location
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', genrateLocationMessage(user.username ,`http://google.com/maps?q=${coords.latitude},${coords.longitude} `))
        callback()
    })

    //Handling disconnect client
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', genrateMessage('Admin', `${user.username} has left!`)) 
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })


})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

