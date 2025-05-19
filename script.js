class Student {
    constructor(id, x, y) {
        this.id = id;
        this.element = document.createElement('div');
        this.element.className = 'student';
        this.element.textContent = id + 1;
        this.setPosition(x, y);
        this.isDistracted = false;
        this.distractionProbability = 0.005;
        this.moveSpeed = 1;

        this.element.addEventListener('click', () => this.handleClick());
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    handleClick() {
        if (this.isDistracted && gameState.isPlaying) {
            this.focus();
            gameState.addScore(1);
        }
    }

    focus() {
        this.isDistracted = false;
        this.element.classList.remove('distracted');
    }

    distract() {
        this.isDistracted = true;
        this.element.classList.add('distracted');
    }

    move() {
        if (!gameState.isPlaying) return;

        // 랜덤한 방향으로 움직임
        const dx = (Math.random() - 0.5) * this.moveSpeed * 2;
        const dy = (Math.random() - 0.5) * this.moveSpeed * 2;

        // 게임 보드 경계 확인
        const newX = Math.max(0, Math.min(this.x + dx, gameBoard.offsetWidth - this.element.offsetWidth));
        const newY = Math.max(0, Math.min(this.y + dy, gameBoard.offsetHeight - this.element.offsetHeight));

        this.setPosition(newX, newY);

        // 집중하고 있는 상태에서만 딴짓할 확률 계산
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

        // 게임 상태 초기화
        this.score = 0;
        this.timeLeft = 60;
        this.isPlaying = true;
        document.getElementById('score').textContent = '0';
        this.updateTimer();

        // 학생들 생성
        const studentsContainer = document.querySelector('.students-container');
        studentsContainer.innerHTML = '';
        this.students = [];

        for (let i = 0; i < 8; i++) {
            const student = new Student(i,
                Math.random() * (gameBoard.offsetWidth - 60),
                Math.random() * (gameBoard.offsetHeight - 60)
            );
            studentsContainer.appendChild(student.element);
            this.students.push(student);
        }

        // 게임 루프 시작
        this.gameLoop = setInterval(() => {
            this.students.forEach(student => student.move());
        }, 50);

        // 타이머 시작
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
        }, 1000);

        // UI 업데이트
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('game-over').classList.add('hidden');
    },

    endGame() {
        this.isPlaying = false;
        clearInterval(this.gameLoop);
        clearInterval(this.timerInterval);

        // 최종 점수 표시
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('start-btn').style.display = 'block';
    }
};

// DOM 요소
const gameBoard = document.querySelector('.game-board');
const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');

// 이벤트 리스너
startButton.addEventListener('click', () => gameState.startGame());
restartButton.addEventListener('click', () => gameState.startGame());