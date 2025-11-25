const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

// SOUNDS
const bounceSound = new Audio('sounds/bounce.wav');
const scoreSound = new Audio('sounds/score.wav');
const winSound = new Audio('sounds/win.wav');

const grid = 15;
const paddleHeight = grid * 5; // 80
const maxPaddleY = canvas.height - grid - paddleHeight;

const maxScore = 5; // first to get 5 points win

let gameRunning = false;

var paddleSpeed = 6;
var ballSpeed = 4;      // base speed
var ballSpeedMax = 10;  // max speed
var ballSpeedIncrement = 0.002; // speed increment per frame

let gameMode = null; // "PVP" or "PVE"

let scoreLeft = 0;
let scoreRight = 0;

var playerOne = 'player one';
var playerTwo = 'player two';

document.getElementById('pvpBtn').addEventListener('click', () => startGame('PVP'));
document.getElementById('pveBtn').addEventListener('click', () => startGame('PVE'));

const leftPaddle = 
{
    // start in the middle of the game on the left side
    x: grid * 2,
    y: canvas.height / 2 - paddleHeight / 2,
    width: grid,
    height: paddleHeight,

    // paddle velocity
    dy: 0
};

const rightPaddle = 
{
    // start in the middle of the game on the right side
    x: canvas.width - grid * 3,
    y: canvas.height / 2 - paddleHeight / 2,
    width: grid,
    height: paddleHeight,

    // paddle velocity
    dy: 0
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: grid,
  height: grid,
  resetting: false,
  dx: ballSpeed,
  dy: -ballSpeed,
  speedMultiplier: 1 // speed multiplier
};

function startGame(mode) {
    gameMode = mode;
    gameRunning = true;
    document.getElementById('startMenu').style.display = 'none';
    
    document.getElementById('game').style.display = 'block';
    document.getElementById('score').style.display = 'block';

    // initialize variables
    scoreLeft = 0;
    scoreRight = 0;

    leftPaddle.y = canvas.height / 2 - paddleHeight / 2;
    rightPaddle.y = canvas.height / 2 - paddleHeight / 2;
    rightPaddle.dy = 0; 
    
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ballSpeed;
    ball.dy = -ballSpeed;
    ball.speedMultiplier = 1;


    if(mode == 'PVP'){
        playerTwo = 'player two';
    }
    else{
        playerTwo = '       cpu';
    }
    requestAnimationFrame(loop);
}


function collides(obj1, obj2) 
{
    return obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y;
}


function updateScore() {
    document.getElementById('score').textContent = `${playerOne}    ${scoreLeft} - ${scoreRight}    ${playerTwo}`;
}


function draw() {
    var fillColor = getComputedStyle(canvas).getPropertyValue('--fill-color');
    context.clearRect(0,0,canvas.width,canvas.height);

    // draw paddles
    context.fillStyle=fillColor
    context.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // draw ball
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    context.fillRect(0, 0, canvas.width, grid);
    context.fillRect(0, canvas.height- grid, canvas.width, canvas.height);
}

function paddleBounce(ball, paddle) {
    // (0 = top, 1 = bottom)
    let relativeY = (ball.y - paddle.y) / paddle.height;

    // rads
    let maxAngle = Math.PI / 4; // 45°
    let angle = (relativeY - 0.5) * 2 * maxAngle;

    // starting speed
    let speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

    let direction = ball.x < canvas.width / 2 ? 1 : -1;

    ball.dx = speed * Math.cos(angle) * direction;
    ball.dy = speed * Math.sin(angle);
}


// game loop
function loop() 
{
    if(!gameRunning)
        return;
    
    // detener juego si alguien ya ganó
    if (scoreLeft >= maxScore || scoreRight >= maxScore) {
        const winner = scoreLeft >= maxScore ? playerOne : playerTwo;
        document.getElementById('winnerMsg').textContent = `winner: ${winner}!`;
        document.getElementById('overlay').style.display = 'flex';
        winSound.play()
        gameRunning = false;
    }


    requestAnimationFrame(loop);
    draw();

    // The paddle "follows" the ball
    if (gameMode === 'PVE') {
        const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
        const speed = 4; 

        if (ball.y < paddleCenter) {
            rightPaddle.dy = -speed;
        } else if (ball.y > paddleCenter) {
            rightPaddle.dy = speed;
        } else {
            rightPaddle.dy = 0;
        }
        
    }

    // move paddles by their velocity
    leftPaddle.y += leftPaddle.dy;
    rightPaddle.y += rightPaddle.dy;

    // prevent paddles from going through walls
    if (leftPaddle.y < grid) {
        leftPaddle.y = grid;
    }
    else if (leftPaddle.y > maxPaddleY) {
        leftPaddle.y = maxPaddleY;
    }

    if (rightPaddle.y < grid) {
        rightPaddle.y = grid;
    }
    else if (rightPaddle.y > maxPaddleY) {
        rightPaddle.y = maxPaddleY;
    }

    // move ball by its velocity
    ball.x += ball.dx;
    ball.y += ball.dy;

    // prevent ball from going through walls by changing its velocity
    if (ball.y < grid) {
        ball.y = grid;
        ball.dy *= -1;
        bounceSound.play();
    }
    else if (ball.y + grid > canvas.height - grid) {
        ball.y = canvas.height - grid * 2;
        ball.dy *= -1;
        bounceSound.play();
    }

    // incrementar la velocidad gradualmente
    if (!ball.resetting) {  // solo mientras no se esté reiniciando
        ball.speedMultiplier += ballSpeedIncrement;

        // limitar la velocidad máxima
        const currentSpeed = Math.min(ballSpeed * ball.speedMultiplier, ballSpeedMax);
        // mantener la dirección pero ajustar velocidad
        ball.dx = Math.sign(ball.dx) * currentSpeed;
        ball.dy = Math.sign(ball.dy) * currentSpeed;
    }


    // reset ball if it goes past paddle (but only if we haven't already done so)
    if ( ball.x < 0  && !ball.resetting) {
        ball.resetting = true;
        scoreRight++;
        scoreSound.play();

        setTimeout(() => {
            ball.resetting = false;
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.speedMultiplier = 1;       // restart spped
            ball.dx = ballSpeed;             // base speed
            ball.dy = Math.sign(ball.dy) * ballSpeed;
        }, 1000);

    }
    else if ( ball.x > canvas.width && !ball.resetting) {
        ball.resetting = true;
        scoreLeft++;
        scoreSound.play();

        setTimeout(() => {
            ball.resetting = false;
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.speedMultiplier = 1;       // restart spped
            ball.dx = -ballSpeed;            // base speed
            ball.dy = Math.sign(ball.dy) * ballSpeed;
        }, 1000);
    }

    // check to see if ball collides with paddle. if they do change x velocity
    if (collides(ball, leftPaddle)) {
        paddleBounce(ball, leftPaddle);
        bounceSound.play();

        // move ball next to the paddle otherwise the collision will happen again
        // in the next frame
        ball.x = leftPaddle.x + leftPaddle.width;
    }
    else if (collides(ball, rightPaddle)) {
        paddleBounce(ball, rightPaddle);
        bounceSound.play();

        // move ball next to the paddle otherwise the collision will happen again
        // in the next frame
        ball.x = rightPaddle.x - ball.width;
    }



    // draw dotted line down the middle
    for (let i = 0; i < canvas.height; i += grid * 2) {
        context.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
    }


    updateScore();
}

// listen to keyboard events to move the paddles
document.addEventListener('keydown', function(e) 
{
    if (gameMode === 'PVE') {
        if (e.which === 87 || e.which === 38) leftPaddle.dy = -paddleSpeed; // W up arrow key
        else if (e.which === 83 || e.which === 40) leftPaddle.dy = paddleSpeed; // S down arrow key

        
    }
    else if (gameMode === 'PVP') {
        // up arrow key
        if (e.which === 38) {
            rightPaddle.dy = -paddleSpeed;
        }
        // down arrow key
        else if (e.which === 40) {
            rightPaddle.dy = paddleSpeed;
        }

        // w key
        if (e.which === 87) {
            leftPaddle.dy = -paddleSpeed;
        }
        // a key
        else if (e.which === 83) {
            leftPaddle.dy = paddleSpeed;
        }
    }
});

// listen to keyboard events to stop the paddle if key is released
document.addEventListener('keyup', function(e) 
{
    if (gameMode === 'PVE') {
        // Paleta izquierda
        if (e.which === 87 || e.which === 83 || e.which === 38 || e.which === 40) leftPaddle.dy = 0;

    }
    else if(gameMode === 'PVP' ){
        if (e.which === 38 || e.which === 40) {
            rightPaddle.dy = 0;
        }

        if (e.which === 83 || e.which === 87) {
            leftPaddle.dy = 0;
        }
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('overlay').style.display = 'none';
    startGame(gameMode);
});

document.getElementById('backButton').addEventListener('click', () => {
    document.getElementById('game').style.display = 'none';
    document.getElementById('score').style.display = 'none';

    document.getElementById('overlay').style.display = 'none';
    document.getElementById('startMenu').style.display = 'flex';
});

// Dark/Light Toggle

const themeBtn = document.getElementById("themeToggle");

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

window.addEventListener("load", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }
});

// CROSS BUTTON
const crossButton = document.getElementById("crossButton");

crossButton.addEventListener("click", () => {
    gameRunning = false;

    document.getElementById('game').style.display = 'none';
    document.getElementById('score').style.display = 'none';
    document.getElementById('startMenu').style.display = 'flex';
});


