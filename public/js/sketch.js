var results;
// var sound;
var emitInterval = null;
var emitDuration = 20000; // 30秒間
var emitIntervalTime = 1000; // 1秒ごとに送信
// let randomWord;


function preload() {
    // janken.mp3 を読み込む
    sound = loadSound('../janken.mp3', loaded, failed);
  }

function loaded() {
    console.log('Sound loaded successfully');
}
function failed() {
    console.error('Failed to load sound');
}


  
function setup() {
    let p5canvas = createCanvas(400, 400);
    p5canvas.parent('#canvas');


    // お手々が見つかると以下の関数が呼び出される．resultsに検出結果が入っている．
    gotDetections = function (_results) {
        results = _results;
        strokeWeight(5)
        let video_width = document.querySelector('#webcam').videoWidth;
        let video_height = document.querySelector('#webcam').videoHeight;
        // 取得したboundingBoxの値を現在のcanvas描画とあわせる前処理
        for (let d of results.detections) {
            let bb = d.boundingBox;
            let ratio = {
                x: width / video_width,
                y: height / video_height
            }
            bb.originX = ratio.x * bb.originX ;
            bb.originY = ratio.y * bb.originY;
            bb.width *= ratio.x;
            bb.height *= ratio.y;
        }
        adjustCanvas();
    }
}
var timer = 0;
var mode = 0;
var result_timer = 0;


function draw() {
    clear();
    if (results) {

        // console.log(results.detections);
        for (let detection of results.detections) {
            let index = detection.categories[0].index;
            let bb = detection.boundingBox;
            let name = detection.categories[0].categoryName;
            let score = detection.categories[0].score;
            let c = getColorByIndex(index);
            if(name!='person'){
                c = [...c, 200];
                stroke(c);
                strokeWeight(2);
                noFill();
                rect(
                    bb.originX, bb.originY,
                    bb.width, bb.height
                )
                fill(c);
                rect(
                    bb.originX, bb.originY - 20,
                    bb.width, 20
                )

                noStroke();
                fill(255);
                textAlign(LEFT, CENTER);
                text(`[${index}] ${name} - ${score.toFixed(2)}`, bb.originX + 10, bb.originY - 10);
                index++;
            }
        }

        if(mode == 1){
            // fill(0);
            noStroke();
            fill(255);
            textAlign(CENTER);
            textSize(30);
            text("bottleをカメラに写して準備", width/2, height/2);
        }


        for (let detection of results.detections) {

            //物が１つ以上なら
            if (results.detections.length > 0) { 

                let name = detection.categories[0].categoryName;

                /////////////////////
                //ゲーム開始判定 ボトル待ち
                /////////////////////
                if (name == 'bottle' && mode == 1) {
                    mode = 2;
                    socket.emit('ready', '');
                }
            }
        }
        if(mode == 2){
            // fill(0);
            noStroke();
            fill(255);
            textAlign(CENTER);
            textSize(30);
            text("相手の準備ができるまで待ってね", width/2, height/2);
        }

        /////////////////////
        //レディー状態
        /////////////////////
        
        if(mode == 3){
            // fill(0);
            noStroke();
            fill(255);
            textAlign(CENTER);
            textSize(30);
            text(randomWord, width/2,height/2+height/4+height/8);
        }

        /////////////////////
        //ゲーム開始　
        // sound.play()の再生が終わったら
        /////////////////////
        if (mode == 3 && !sound.isPlaying()) {

            // console.log(timer);
            if (!emitInterval) {

                /////////////////////
                //カウントダウン中・・・
                //映ったものをサーバに送って判断を仰ぐ　
                /////////////////////
                emitInterval = setInterval(() => {
                    for (let detection of results.detections) {
                    
                        //人間は除外
                        //if(name != 'person'){
                        socket.emit('janken_type', {
                            janken_type: detection.categories[0].categoryName,
                            id: socket.id
                        });
                        //}
                    }
                    timer++;
                }, emitIntervalTime);
                
                /////////////////////
                //制限時間終了　
                /////////////////////
                setTimeout(() => {
                    clearInterval(emitInterval);
                    emitInterval = null;
                    
                    //勝敗がついていない場合はモード４に
                    if(mode == 3){
                        mode = 4;
                    }
                }, emitDuration);
            }
        } 

        if(mode == 4){
            fill(0);
            noStroke();
            fill(255);
            textAlign(CENTER);
            textSize(30);
            text("引き分けです", width/2, height/2);
            if(result_timer++>100){
                mode = 1;
                timer = 0;
                result_timer = 0;
                document.getElementById('messages').innerText = "もう一度挑戦！";

            }
        }
        if(mode == 5){
            fill(0);
            noStroke();
            fill(255);
            textAlign(CENTER);
            textSize(30);
            text("あなたの負けです！",width/2, height/2);
            if(result_timer++>100){
                mode = 1;
                timer = 0;
                document.getElementById('messages').innerText = "もう一度挑戦！";
            }
        }
        if(mode == 6){
            fill(0);
            noStroke();
            fill(255);
            textAlign(CENTER);
            textSize(30);
            text("あなたの勝ちです！",width/2, height/2);
            if(result_timer++>100){
                mode = 1;
                timer = 0;
                document.getElementById('messages').innerText = "もう一度挑戦！";
            }
        }
    }
    noStroke();
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(15);
    text("mode: " + mode, 30, 30);

    if( mode == 3 ){
        noStroke();
        fill(255,128);
        textAlign(CENTER);
        textSize(150);
        text(timer, width/2, height/2);
        textSize(15);
    }

    noFill();
    rect(0, 0, 640, 480);

}
function getColorByIndex(index) {
    const colors = [
        [240, 128, 128], // ライトコーラル
        [173, 216, 230], // ライトブルー
        [144, 238, 144], // ライトグリーン
        [220, 220, 220], // グレイ
        [244, 164, 96],  // ライトサーモン
        [192, 192, 192], // シルバー
        [255, 222, 173], // ナバホホワイト
        [175, 238, 238], // パオダーターコイズ
        [255, 228, 196], // ビスク
        [221, 160, 221], // プラム
        [250, 128, 114], // サーモン
        [152, 251, 152], // パレグリーン
        [176, 224, 230], // パウダーブルー
        [255, 218, 185], // ピーチパフ
        [240, 230, 140], // カーキ
        [240, 128, 128], // ライトコーラル
        [144, 238, 144], // ライトグリーン
        [192, 192, 192], // シルバー
        [255, 228, 196], // ビスク
        [250, 128, 114]  // サーモン
    ];

    if (index < 0) {
        index = 0;
    }

    index = index % colors.length;

    return colors[index];
}


function adjustCanvas() {
    // Get an element by its ID
    var element_webcam = document.getElementById('webcam');
    resizeCanvas(element_webcam.clientWidth, element_webcam.clientHeight);
    //console.log(element_webcam.clientWidth);
}