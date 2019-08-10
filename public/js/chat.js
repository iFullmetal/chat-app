const socket = io()

//html элементы
const $messageForm = document.querySelector('#message-form')
const $messageFormButton = document.querySelector('#button1')
const $messageFormInput = $messageForm.elements.message
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates (штуки из mustache)
const messagesTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//парсю query строку
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = ()=>{
    //последнее сообщение
    const $newMessage = $messages.lastElementChild
    //высчитываю высоту сообщения с учетом разметки
    const newMessageStyles = window.getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //видимая высота блока с сообщениями
    const visibleHeight = $messages.offsetHeight
    //общая высота блока с сообщениями
    const contentHeight = $messages.scrollHeight
    //насколько далеко я проскролился(нижняя координата скролла)
    const scrollOffset = $messages.scrollTop + visibleHeight
    //находится ли каретка внизу?
    //(общая высота-размер ондного сообщения, т.к. функция вызывается, когда уже пришло новое сообщение
    //но нужно проверить были ли скроллбар в самом низу до этого, поэтому вычитается высота одного сообщения)
    if(contentHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = contentHeight
    }

}

//обработчик ивента message
socket.on('message', (message)=>{
    console.log('message:', message)
    //рендерю сообщение в html документ через mustache
    const html = Mustache.render(messagesTemplate,{
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeEnd', html)
    autoScroll()
})

socket.on('locationMessage', (location) => {
    console.log(location.url)
    const html = Mustache.render(locationMessageTemplate, {
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a'),
        username: location.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', (users)=>{
    const html = Mustache.render(sidebarTemplate, {
        room: users[0].room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (event)=>{
    event.preventDefault()//чтобы не обновлялась страница сама собой
    
    if($messageFormInput.value === '') return;

    $messageFormButton.setAttribute('disabled', 'disabled')//на время отправки отключаю кнопку

    socket.emit('clientMessageSent', $messageFormInput.value, (error)=>{

        $messageFormButton.removeAttribute('disabled') //ивент дошел до сервера -> коллбэк вызван -> включаю кнопку обратно
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            console.log(error)
            return
        }
    }) //message - значение аргумента name в теге input
})

$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        alert('Geolocation is not supported by your browser.')
        return;
    }
    
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation', { latitude: position.coords.latitude, longitude: position.coords.longitude }, ()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

//сразу же при открытии страницы отправляю серверу свой ник и комнату
socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        //редирекчу на страницу ввода имени/комнаты
        location.href = '/'
    }
})