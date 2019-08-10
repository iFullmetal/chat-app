const express = require('express')
const path = require('path')
const http = require('http')
//штука для реализации websocket
const socketio = require('socket.io')
//матюкательный фильтр
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users')

const app = express()
//с сокет.io настройка экспресса немного отличается(экспресс сам по себе и без этого кода делает http.createServer(app)) 
//но так я бы не смог получить доступ к серверу
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, '../public')))

//обтработка event'a 'connection' (встроенный event)
io.on('connection', (socket)=>{
    console.log('new websocket connection! ID:', socket.id)

    //socket.emit = отправить ивент только текущему соеденению(сокету)
    //socket.broadcast.emit - отправить ивент всем, кроме самого сокета(во всех комнатах)
    //io.to.emit - отправить ивент всем в текущей комнате
    //socket.broadcast.to.emot - отправить ивент всем в текущей комнате, кроме самого сокета, с которым идет соеденение
   
    //присоеденяюсь к комнате
    socket.on('join', ({username, room}, callback)=>{
        //добавляю юзера в массив
        const { error, user} = addUser({ id: socket.id, username, room })

        if(error){
            //отправляю error клиенту через acknowledgement
            callback(error)
            return
        }

        socket.join(user.room) //подключаю сокет к комнате room (room - просто строка)

        //теперь все ивенты, отправленные через to(room) будут приходить только тем сокетам, которые были присоеденены в комнату room

        socket.emit('message', generateMessage('Welcome!', 'Chat App'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`, 'Chat App'))
        io.to(user.room).emit('roomData', getUsersInRoom(user.room))

        callback()
    })

    //обработка ивентов для текущего сокета
    socket.on('clientMessageSent', (message, callback)=>{
        const filter = new Filter()

        if(filter.isProfane(message)){
            callback('Do not say bad words! Be polite as fuck!')
            return
        }

        const user = getUser(socket.id)
        //io.emit - отправить ивент всем сокетам
        io.to(user.room).emit('message', generateMessage(message, user.username))
        //вызываю метод, полученный от клиента и работает он тоже именно у клиента
        callback()
    })

    socket.on('sendLocation', (location, callback)=>{
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${location.latitude},${location.longitude}`, user.username))
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        //обрабатываю случай когда юзер приконнектился, но не прошел валидацию, т.е. его не пустили ни в одну комнату
        //а значит писать A user has left не нужно
        if(!user) return;

        io.to(user.room).emit('message', generateMessage(`${user.username} has left!`, 'Chat App'))
        io.to(user.room).emit('roomData', getUsersInRoom(user.room))
    })
})



server.listen(process.env.PORT, ()=>{
    console.log('Server is up on port', process.env.PORT)
})