const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
 
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
 
app.use(express.static('public'));
 
let connectedClients = 0;
let ready_count = 0;
let janken_type_count = 0;
let janken_types  = [];



let randomWord;

// setup内で一度だけ単語をランダムに選ぶ
const words = ["backpack", "handbag", "tie", "bottle",
    "wine glass", "cup", "fork", "knife", "spoon", "bowl",
    "potted plant", "laptop", "mouse", "remote", "keyboard", "cell phone",
    "book", "clock", "scissors", "teddy bear", "hair drier",
    "toothbrush"];

function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    console.log("ランダムインデックス: ", randomIndex); // インデックスの確認
    const randomWord = words[randomIndex];
    console.log("選ばれた単語: ", randomWord); // 選ばれた単語の確認
    return randomWord;
}
    


 //conectionは事前に定義socketは接続してきたやつ
io.on('connection', (socket) => {
    if (connectedClients >= 2) {
        socket.emit('message', '空きがありません');
        socket.disconnect();
        return;
    }
 
    connectedClients++;
    socket.broadcast.emit('new_challenger', '挑戦者が現れました！');
    console.log('クライアントが接続されました',
    connectedClients, socket.id);
    if (connectedClients == 2){
       socket.emit('you_are_challenger','先客がいます');
    }

    
    // 接続するたびに新しいランダムな単語を選ぶ
    const randomWord = getRandomWord();
    socket.emit('random_word',randomWord);
    

    socket.on('ready',()=>{
        ready_count++
        console.log('ready_count:',ready_count);
        if(ready_count == 2){
            io.emit('start','ゲームを開始します！')
            ready_count = 0;
            
        }
    });

    socket.on('janken_type', (janken_type) => {
        janken_type_count++;
        janken_types.push(janken_type);
        if (janken_type_count == 2) {
            io.emit('result_match', janken_types);
            console.log(janken_types);
            janken_type_count = 0;
            janken_types = [];[]

        }
    });

    socket.on('disconnect', () => {
        //if(connectedClients){
            connectedClients--;
        //}
        socket.broadcast.emit('message', 'クライアントが切断されました。');
        console.log('クライアントが切断されました',
            connectedClients, socket.id);
    });

});
 
server.listen(3000, () => {
    console.log('サーバがポート3000で起動しました。');
});