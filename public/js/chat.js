const socket = io()

//Elements
const $messageForm = document.querySelector('#massage-form')
const $messageFormInput =$messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messagesTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options 
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

//Autoscroll function
const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visibe height
    const visibleHeight = $messages.offsetHeight
    
    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset+1) {
        $messages.scrollTop =$messages.scrollHeight
    }
}

//Sending message to the client
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messagesTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('kk:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//Sending location url
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        locationURL: message.url,
        createdAt: moment(message.createdAt).format('kk:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//Sidebar
socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML= html
})

//Handling 'Send' button
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled') //Disabled the button after clicking 'Send'
    
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        
        $messageFormButton.removeAttribute('disabled') //Enable the button after the message has been sent
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })

})

//Handling 'Send Location' button
$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not suppported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared!')
        })
    })
    
    $sendLocationButton.removeAttribute('disabled')
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})

