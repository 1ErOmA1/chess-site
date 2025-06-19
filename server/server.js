const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: "*" } })

// Хранилище активных игр (временное, лучше потом заменить на БД)
const games = {}

io.on("connection", (socket) => {
    console.log("Игрок подключен:", socket.id)

    // Игрок хочет создать новую игру
    socket.on("createGame", (playerName) => {
        const gameId = `game_${Math.random().toString(36).substring(2, 9)}`
        games[gameId] = {
            players: [{ id: socket.id, name: playerName }],
            moves: [],
        }
        socket.join(gameId)
        socket.emit("gameCreated", gameId)
    })

    // Игрок хочет присоединиться к игре
    socket.on("joinGame", (gameId, playerName) => {
        if (!games[gameId]) return socket.emit("error", "Игра не найдена!")
        if (games[gameId].players.length >= 2) return socket.emit("error", "Комната заполнена!")

        games[gameId].players.push({ id: socket.id, name: playerName })
        socket.join(gameId)

        // Уведомляем всех в комнате, что игра началась
        io.to(gameId).emit("gameStart", games[gameId].players)
    })

    // Игрок сделал ход
    socket.on("makeMove", (gameId, move) => {
        if (!games[gameId]) return
        games[gameId].moves.push(move)
        // Пересылаем ход второму игроку
        socket.to(gameId).emit("opponentMove", move)
    })

    // Отключение игрока
    socket.on("disconnect", () => {
        console.log("Игрок отключен:", socket.id)
        // Можно добавить логику очистки игры, если игрок вышел
    })
})

server.listen(3000, () => {
    console.log("Сервер запущен на http://localhost:3000")
})