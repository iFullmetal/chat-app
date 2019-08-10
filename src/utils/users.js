const users = []

const addUser = ({ id, username, room})=>{
    //делаю так, чтобы регистр не умел значения + убираю пробелы по бокам, если они есть
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //валидация
    if (!username || !room ){
        return {
            error: 'Username and room are required!'
        }
    }

    //проверяю, есть ли уже такой юзер
    const existingUser = users.find((user)=>{
        return user.room === room && user.username === username
    })

    if(existingUser){
        return {
            error: 'Username is in use!'
        }
    }

    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id)=>{
    //ищу позицию юзера с таким id в массиве
    const index = users.findIndex((user) => user.id === id)

    if(index !== -1){
        //удаляю юзера по индексу в массиве и возвращаю его
        return users.splice(index, 1)[0]
    }
}

const getUser = (id)=>{
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room)=>{
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}