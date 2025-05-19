class Teacher {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'teacher';
        this.x = gameBoard.offsetWidth / 2;
        this.y = gameBoard.offsetHeight / 2;
        this.speed = 8;
        this.updatePosition();
        this.pressedKeys = new Set();
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    move() {
        if (!gameState.isPlaying) return;

        let dx = 0;
        let dy = 0;

        if (this.pressedKeys.has('ArrowLeft')) dx -= 1;
        if (this.pressedKeys.has('ArrowRight')) dx += 1;
        if (this.pressedKeys.has('ArrowUp')) dy -= 1;
        if (this.pressedKeys.has('ArrowDown')) dy += 1;

        // 대각선 이동시 속도 정규화
        if (dx !== 0 && dy !== 0) {
            const normalizer = 1 / Math.sqrt(2);
            dx *= normalizer;
            dy *= normalizer;
        }

        const newX = this.x + dx * this.speed;
        const newY = this.y + dy * this.speed;

        this.x = Math.max(0, Math.min(newX, gameBoard.offsetWidth - 40));
        this.y = Math.max(0, Math.min(newY, gameBoard.offsetHeight - 40));

        this.updatePosition();
    }

    checkCollision(student) {
        const teacherRect = this.element.getBoundingClientRect();
        const studentRect = student.element.getBoundingClientRect();

        return !(teacherRect.right < studentRect.left || 
                teacherRect.left > studentRect.right || 
                teacherRect.bottom < studentRect.top || 
                teacherRect.top > studentRect.bottom);
    }
}

class Student {
    constructor(name, x, y) {
        this.name = name;
        this.element = document.createElement('div');
        this.element.className = 'student';
        this.element.textContent = name;
        this.setPosition(x, y);
        this.isDistracted = false;
        this.distractionProbability = 0.008;
        this.moveSpeed = 2;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    focus() {
        if (this.isDistracted) {
            this.isDistracted = false;
            this.element.classList.remove('distracted');
            gameState.addScore(1);
        }
    }

    distract() {
        this.isDistracted = true;
        this.element.classList.add('distracted');
    }

    move() {
        if (!gameState.isPlaying) return;

        const dx = (Math.random() - 0.5) * this.moveSpeed * 2;
        const dy = (Math.random() - 0.5) * this.moveSpeed * 2;

        const newX = Math.max(0, Math.min(this.x + dx, gameBoard.offsetWidth - this.element.offsetWidth));
        const newY = Math.max(0, Math.min(this.y + dy, gameBoard.offsetHeight - this.element.offsetHeight));

        this.setPosition(newX, newY);

        if (!this.isDistracted && Math.random() < this.distractionProbability) {
            this.distract();
        }
    }
}

const gameState = {
    score: 0,
    timeLeft: 60,
    isPlaying: false,
    students: [],
    teacher: null,
    gameLoop: null,
    timerInterval: null,

    addScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    },

    updateTimer() {
        document.getElementById('timer').textContent = this.timeLeft;
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    },

    startGame() {
        if (this.isPlaying) return;

        this.score = 0;
        this.timeLeft = 60;
        this.isPlaying = true;
        document.getElementById('score').textContent = '0';
        this.updateTimer();

        const studentsContainer = document.querySelector('.students-container');
        studentsContainer.innerHTML = '';
        this.students = [];

        this.teacher = new Teacher();
        studentsContainer.appendChild(this.teacher.element);

        const studentNames = ['류태경', '오시우', '최서우', '임예준', '조민형'];
        studentNames.forEach((name, i) => {
            const student = new Student(name,
                Math.random() * (gameBoard.offsetWidth - 60),
                Math.random() * (gameBoard.offsetHeight - 60)
            );
            studentsContainer.appendChild(student.element);
            this.students.push(student);
        });

        this.gameLoop = setInterval(() => {
            if (this.teacher) this.teacher.move();
            this.students.forEach(student => student.move());
        }, 33);

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
        }, 1000);

        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('game-over').classList.add('hidden');
    },

    endGame() {
        this.isPlaying = false;
        clearInterval(this.gameLoop);
        clearInterval(this.timerInterval);

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('start-btn').style.display = 'block';
    }
};

const gameBoard = document.querySelector('.game-board');
const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');

// 조이스틱 관련 변수
let joystickActive = false;
let joystickPos = { x: 0, y: 0 };
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
const actionButton = document.getElementById('action-button');

// 조이스틱 이벤트 처리
function handleJoystickStart(event) {
    joystickActive = true;
    updateJoystickPosition(event);
}

function handleJoystickMove(event) {
    if (!joystickActive) return;
    updateJoystickPosition(event);
}

function handleJoystickEnd() {
    joystickActive = false;
    joystickPos = { x: 0, y: 0 };
    joystickStick.style.transform = 'translate(-50%, -50%)';
}

function updateJoystickPosition(event) {
    const touch = event.touches ? event.touches[0] : event;
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let x = touch.clientX - centerX;
    let y = touch.clientY - centerY;

    // 조이스틱 범위 제한
    const maxDistance = rect.width / 2;
    const distance = Math.sqrt(x * x + y * y);
    if (distance > maxDistance) {
        const angle = Math.atan2(y, x);
        x = Math.cos(angle) * maxDistance;
        y = Math.sin(angle) * maxDistance;
    }

    // 정규화된 좌표 (-1 ~ 1)
    joystickPos.x = x / maxDistance;
    joystickPos.y = y / maxDistance;

    // 조이스틱 시각적 업데이트
    joystickStick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
}

// 터치 이벤트 리스너
joystickBase.addEventListener('touchstart', handleJoystickStart);
joystickBase.addEventListener('touchmove', handleJoystickMove);
joystickBase.addEventListener('touchend', handleJoystickEnd);

// 액션 버튼 이벤트
actionButton.addEventListener('touchstart', () => {
    if (!gameState.teacher) return;
    gameState.students.forEach(student => {
        if (gameState.teacher.checkCollision(student)) {
            student.focus();
        }
    });
});

// 키보드 이벤트
document.addEventListener('keydown', (event) => {
    if (!gameState.teacher) return;

    gameState.teacher.pressedKeys.add(event.key);

    if (event.key === ' ') {
        gameState.students.forEach(student => {
            if (gameState.teacher.checkCollision(student)) {
                student.focus();
            }
        });
    }
});

document.addEventListener('keyup', (event) => {
    if (!gameState.teacher) return;
    gameState.teacher.pressedKeys.delete(event.key);
});

// Teacher 클래스의 move 메소드 수정
Teacher.prototype.move = function() {
    if (!gameState.isPlaying) return;

    let dx = 0;
    let dy = 0;

    // 키보드 입력 처리
    if (this.pressedKeys.has('ArrowLeft')) dx -= 1;
    if (this.pressedKeys.has('ArrowRight')) dx += 1;
    if (this.pressedKeys.has('ArrowUp')) dy -= 1;
    if (this.pressedKeys.has('ArrowDown')) dy += 1;

    // 조이스틱 입력 처리
    if (joystickActive) {
        dx = joystickPos.x;
        dy = joystickPos.y;
    }

    // 대각선 이동시 속도 정규화
    if (dx !== 0 && dy !== 0) {
        const normalizer = 1 / Math.sqrt(2);
        dx *= normalizer;
        dy *= normalizer;
    }

    const newX = this.x + dx * this.speed;
    const newY = this.y + dy * this.speed;

    this.x = Math.max(0, Math.min(newX, gameBoard.offsetWidth - 40));
    this.y = Math.max(0, Math.min(newY, gameBoard.offsetHeight - 40));

    this.updatePosition();
};

startButton.addEventListener('click', () => gameState.startGame());
restartButton.addEventListener('click', () => gameState.startGame());