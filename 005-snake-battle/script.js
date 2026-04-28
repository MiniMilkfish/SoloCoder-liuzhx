/**
 * 贪吃蛇对战游戏 - 核心逻辑
 * 支持单人和双人对战模式
 */

// ==================== 游戏配置 ====================
const CONFIG = {
    GRID_SIZE: 20,
    GRID_COLS: 25,
    GRID_ROWS: 20,
    INITIAL_SNAKE_LENGTH: 3,
    BASE_SPEED: 120,
    FOOD_SCORE: 10,
    POWERUP_SCORE: 25,
    POWERUP_DURATION: 5000,
    POWERUP_SPAWN_CHANCE: 0.15,
    SPEED_UP_MULTIPLIER: 0.6,
    SLOW_DOWN_MULTIPLIER: 1.8,
};

// ==================== 方向枚举 ====================
const DIRECTION = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
};

// ==================== 道具类型 ====================
const POWERUP_TYPE = {
    SPEED_UP: 'speed_up',
    SLOW_DOWN: 'slow_down',
    INVINCIBLE: 'invincible',
};

// ==================== 颜色配置 ====================
const COLORS = {
    BACKGROUND: '#fffef9',
    GRID_LINE: 'rgba(52, 73, 94, 0.1)',
    PLAYER1: {
        HEAD: '#2980b9',
        BODY: '#3498db',
        EYE: '#ffffff',
        OUTLINE: '#1a5276',
    },
    PLAYER2: {
        HEAD: '#c0392b',
        BODY: '#e74c3c',
        EYE: '#ffffff',
        OUTLINE: '#922b21',
    },
    FOOD: {
        MAIN: '#27ae60',
        OUTLINE: '#1e8449',
        LEAF: '#2ecc71',
    },
    POWERUP: {
        SPEED_UP: { MAIN: '#f39c12', OUTLINE: '#d68910' },
        SLOW_DOWN: { MAIN: '#9b59b6', OUTLINE: '#7d3c98' },
        INVINCIBLE: { MAIN: '#e67e22', OUTLINE: '#ca6f1e' },
    },
};

// ==================== 音效系统 ====================
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            this.initialized = true;
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playEat() {
        this.playTone(523.25, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.4), 50);
    }

    playPowerUp() {
        this.playTone(440, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(554.37, 0.1, 'square', 0.3), 75);
        setTimeout(() => this.playTone(659.25, 0.15, 'square', 0.3), 150);
    }

    playCollision() {
        this.playTone(146.83, 0.3, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(110, 0.3, 'sawtooth', 0.3), 100);
    }

    playGameOver() {
        this.playTone(392, 0.2, 'square', 0.3);
        setTimeout(() => this.playTone(349.23, 0.2, 'square', 0.3), 150);
        setTimeout(() => this.playTone(329.63, 0.3, 'square', 0.3), 300);
    }

    playMove() {
        this.playTone(200, 0.03, 'sine', 0.1);
    }
}

// ==================== 排行榜系统 ====================
class Leaderboard {
    constructor() {
        this.SINGLE_KEY = 'snake_battle_single';
        this.MULTI_KEY = 'snake_battle_multi';
        this.MAX_ENTRIES = 10;
    }

    getSingleScores() {
        const data = localStorage.getItem(this.SINGLE_KEY);
        return data ? JSON.parse(data) : [];
    }

    getMultiScores() {
        const data = localStorage.getItem(this.MULTI_KEY);
        return data ? JSON.parse(data) : [];
    }

    addSingleScore(name, score) {
        const scores = this.getSingleScores();
        scores.push({ name, score, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        const trimmed = scores.slice(0, this.MAX_ENTRIES);
        localStorage.setItem(this.SINGLE_KEY, JSON.stringify(trimmed));
        return trimmed;
    }

    addMultiScores(winnerName, winnerScore, loserName, loserScore) {
        const scores = this.getMultiScores();
        scores.push({
            winner: { name: winnerName, score: winnerScore },
            loser: { name: loserName, score: loserScore },
            date: new Date().toISOString()
        });
        const trimmed = scores.slice(0, this.MAX_ENTRIES);
        localStorage.setItem(this.MULTI_KEY, JSON.stringify(trimmed));
        return trimmed;
    }

    renderSingle() {
        const scores = this.getSingleScores();
        const container = document.getElementById('single-leaderboard');
        
        if (scores.length === 0) {
            container.innerHTML = '<div class="leaderboard-empty">暂无记录，快去创造历史吧！</div>';
            return;
        }
        
        let html = '';
        scores.forEach((entry, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            html += `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank ${rankClass}">${index + 1}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score}</span>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    renderMulti() {
        const scores = this.getMultiScores();
        const container = document.getElementById('multi-leaderboard');
        
        if (scores.length === 0) {
            container.innerHTML = '<div class="leaderboard-empty">暂无记录，快去对战吧！</div>';
            return;
        }
        
        let html = '';
        scores.forEach((entry, index) => {
            html += `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">${index + 1}</span>
                    <span class="leaderboard-name">
                        ${entry.winner.name} (${entry.winner.score}) 
                        <span style="color: #e74c3c;">VS</span> 
                        ${entry.loser.name} (${entry.loser.score})
                    </span>
                </div>
            `;
        });
        container.innerHTML = html;
    }
}

// ==================== 蛇类 ====================
class Snake {
    constructor(id, startX, startY, direction, colors, controls) {
        this.id = id;
        this.name = id === 1 ? '玩家 1' : '玩家 2';
        this.colors = colors;
        this.controls = controls;
        
        this.body = [];
        for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            this.body.push({
                x: startX - direction.x * i,
                y: startY - direction.y * i,
            });
        }
        
        this.direction = { ...direction };
        this.nextDirection = { ...direction };
        this.score = 0;
        this.alive = true;
        
        this.baseSpeed = CONFIG.BASE_SPEED;
        this.currentSpeed = CONFIG.BASE_SPEED;
        this.lastMoveTime = 0;
        
        this.powerUps = {
            speedUp: { active: false, endTime: 0 },
            slowDown: { active: false, endTime: 0 },
            invincible: { active: false, endTime: 0 },
        };
    }

    get head() {
        return this.body[0];
    }

    setNextDirection(newDir) {
        if (newDir.x + this.nextDirection.x === 0 && newDir.y + this.nextDirection.y === 0) {
            return;
        }
        this.nextDirection = { ...newDir };
    }

    shouldMove(currentTime) {
        return currentTime - this.lastMoveTime >= this.currentSpeed;
    }

    move() {
        this.direction = { ...this.nextDirection };
        
        const newHead = {
            x: this.head.x + this.direction.x,
            y: this.head.y + this.direction.y,
        };
        
        this.body.unshift(newHead);
        this.body.pop();
        
        this.lastMoveTime = performance.now();
    }

    grow() {
        const tail = this.body[this.body.length - 1];
        const secondTail = this.body[this.body.length - 2] || this.direction;
        
        const newSegment = {
            x: tail.x - (secondTail.x - tail.x || this.direction.x),
            y: tail.y - (secondTail.y - tail.y || this.direction.y),
        };
        
        this.body.push(newSegment);
    }

    addScore(points) {
        this.score += points;
    }

    applyPowerUp(type) {
        const now = performance.now();
        const endTime = now + CONFIG.POWERUP_DURATION;
        
        switch (type) {
            case POWERUP_TYPE.SPEED_UP:
                this.powerUps.speedUp.active = true;
                this.powerUps.speedUp.endTime = endTime;
                break;
            case POWERUP_TYPE.SLOW_DOWN:
                this.powerUps.slowDown.active = true;
                this.powerUps.slowDown.endTime = endTime;
                break;
            case POWERUP_TYPE.INVINCIBLE:
                this.powerUps.invincible.active = true;
                this.powerUps.invincible.endTime = endTime;
                break;
        }
        
        this.updateSpeed();
    }

    updatePowerUps(currentTime) {
        let changed = false;
        
        for (const [key, powerUp] of Object.entries(this.powerUps)) {
            if (powerUp.active && currentTime >= powerUp.endTime) {
                powerUp.active = false;
                changed = true;
            }
        }
        
        if (changed) {
            this.updateSpeed();
        }
    }

    updateSpeed() {
        let speed = this.baseSpeed;
        
        if (this.powerUps.speedUp.active) {
            speed *= CONFIG.SPEED_UP_MULTIPLIER;
        }
        if (this.powerUps.slowDown.active) {
            speed *= CONFIG.SLOW_DOWN_MULTIPLIER;
        }
        
        this.currentSpeed = speed;
    }

    hasActivePowerUp() {
        return this.powerUps.speedUp.active || 
               this.powerUps.slowDown.active || 
               this.powerUps.invincible.active;
    }

    getActivePowerUpType() {
        if (this.powerUps.speedUp.active) return POWERUP_TYPE.SPEED_UP;
        if (this.powerUps.slowDown.active) return POWERUP_TYPE.SLOW_DOWN;
        if (this.powerUps.invincible.active) return POWERUP_TYPE.INVINCIBLE;
        return null;
    }

    die() {
        this.alive = false;
    }

    containsPosition(x, y) {
        return this.body.some(segment => segment.x === x && segment.y === y);
    }

    containsPositionExceptHead(x, y) {
        return this.body.slice(1).some(segment => segment.x === x && segment.y === y);
    }
}

// ==================== 食物类 ====================
class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    updatePulse(deltaTime) {
        this.pulsePhase += deltaTime * 0.005;
    }
}

// ==================== 道具类 ====================
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.spawnTime = performance.now();
        this.lifetime = 8000;
    }

    isExpired(currentTime) {
        return currentTime - this.spawnTime >= this.lifetime;
    }

    updatePulse(deltaTime) {
        this.pulsePhase += deltaTime * 0.008;
    }
}

// ==================== 渲染器 ====================
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
    }

    resize() {
        this.canvas.width = CONFIG.GRID_COLS * CONFIG.GRID_SIZE;
        this.canvas.height = CONFIG.GRID_ROWS * CONFIG.GRID_SIZE;
    }

    clear() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
    }

    drawGrid() {
        this.ctx.strokeStyle = COLORS.GRID_LINE;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= CONFIG.GRID_COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CONFIG.GRID_SIZE, 0);
            this.ctx.lineTo(x * CONFIG.GRID_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= CONFIG.GRID_ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CONFIG.GRID_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CONFIG.GRID_SIZE);
            this.ctx.stroke();
        }
    }

    drawSnake(snake) {
        const body = snake.body;
        const colors = snake.colors;
        const isInvincible = snake.powerUps.invincible.active;
        
        for (let i = body.length - 1; i >= 0; i--) {
            const segment = body[i];
            const isHead = i === 0;
            const size = CONFIG.GRID_SIZE - 2;
            const x = segment.x * CONFIG.GRID_SIZE + 1;
            const y = segment.y * CONFIG.GRID_SIZE + 1;
            
            const color = isHead ? colors.HEAD : colors.BODY;
            
            this.ctx.save();
            
            if (isInvincible && isHead) {
                const alpha = 0.5 + 0.5 * Math.sin(performance.now() * 0.01);
                this.ctx.globalAlpha = alpha;
            }
            
            if (snake.hasActivePowerUp() && !isHead) {
                const alpha = 0.7 + 0.3 * Math.sin(performance.now() * 0.008 + i * 0.5);
                this.ctx.globalAlpha = alpha;
            }
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = colors.OUTLINE;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.roundRect(x, y, size, size, 4);
            this.ctx.fill();
            this.ctx.stroke();
            
            if (isHead) {
                this.drawSnakeEyes(snake, x, y, size);
            }
            
            this.ctx.restore();
        }
    }

    drawSnakeEyes(snake, x, y, size) {
        const eyeSize = 4;
        const offset = 5;
        
        let eyeX1, eyeY1, eyeX2, eyeY2;
        
        if (snake.direction.x === 1) {
            eyeX1 = x + size - offset;
            eyeY1 = y + offset;
            eyeX2 = x + size - offset;
            eyeY2 = y + size - offset;
        } else if (snake.direction.x === -1) {
            eyeX1 = x + offset;
            eyeY1 = y + offset;
            eyeX2 = x + offset;
            eyeY2 = y + size - offset;
        } else if (snake.direction.y === 1) {
            eyeX1 = x + offset;
            eyeY1 = y + size - offset;
            eyeX2 = x + size - offset;
            eyeY2 = y + size - offset;
        } else {
            eyeX1 = x + offset;
            eyeY1 = y + offset;
            eyeX2 = x + size - offset;
            eyeY2 = y + offset;
        }
        
        this.ctx.fillStyle = snake.colors.EYE;
        this.ctx.beginPath();
        this.ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawFood(food) {
        const pulse = 1 + 0.1 * Math.sin(food.pulsePhase);
        const baseSize = CONFIG.GRID_SIZE - 4;
        const size = baseSize * pulse;
        const x = food.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        const y = food.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        this.ctx.fillStyle = COLORS.FOOD.MAIN;
        this.ctx.strokeStyle = COLORS.FOOD.OUTLINE;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = COLORS.FOOD.LEAF;
        this.ctx.strokeStyle = COLORS.FOOD.OUTLINE;
        this.ctx.beginPath();
        this.ctx.ellipse(-2, -size / 2 + 2, 4, 3, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawPowerUp(powerUp) {
        const pulse = 1 + 0.15 * Math.sin(powerUp.pulsePhase);
        const baseSize = CONFIG.GRID_SIZE - 6;
        const size = baseSize * pulse;
        const x = powerUp.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        const y = powerUp.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        
        const colors = COLORS.POWERUP[powerUp.type.toUpperCase().replace('_', '_')] || 
                       COLORS.POWERUP.SPEED_UP;
        
        const remainingRatio = 1 - (performance.now() - powerUp.spawnTime) / powerUp.lifetime;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.globalAlpha = 0.5 + 0.5 * remainingRatio;
        
        this.ctx.fillStyle = colors.MAIN;
        this.ctx.strokeStyle = colors.OUTLINE;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const px = Math.cos(angle) * size / 2;
            const py = Math.sin(angle) * size / 2;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.floor(size / 1.5)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let icon = '⚡';
        switch (powerUp.type) {
            case POWERUP_TYPE.SPEED_UP:
                icon = '⚡';
                break;
            case POWERUP_TYPE.SLOW_DOWN:
                icon = '🐌';
                break;
            case POWERUP_TYPE.INVINCIBLE:
                icon = '🛡️';
                break;
        }
        
        this.ctx.fillText(icon, 0, 0);
        
        this.ctx.restore();
    }

    roundRect(x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + width - r, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        this.ctx.lineTo(x + width, y + height - r);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        this.ctx.lineTo(x + r, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
    }
}

// ==================== 游戏主类 ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.soundManager = new SoundManager();
        this.leaderboard = new Leaderboard();
        
        this.gameMode = 'single';
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.lastFrameTime = 0;
        
        this.snakes = [];
        this.food = null;
        this.powerUps = [];
        
        this.keys = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupLeaderboard();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyPress(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('single-mode').addEventListener('click', () => {
            this.soundManager.init();
            this.startGame('single');
        });
        
        document.getElementById('multi-mode').addEventListener('click', () => {
            this.soundManager.init();
            this.startGame('multi');
        });
        
        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.hideLeaderboard();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('restart-pause-btn').addEventListener('click', () => {
            this.hidePauseOverlay();
            this.restartGame();
        });
        
        document.getElementById('restart-gameover-btn').addEventListener('click', () => {
            this.hideGameOverOverlay();
            this.restartGame();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitGame();
        });
        
        document.getElementById('quit-pause-btn').addEventListener('click', () => {
            this.hidePauseOverlay();
            this.quitGame();
        });
        
        document.getElementById('quit-gameover-btn').addEventListener('click', () => {
            this.hideGameOverOverlay();
            this.quitGame();
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLeaderboardTab(e.target.dataset.mode);
            });
        });
        
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
    }

    setupLeaderboard() {
        this.leaderboard.renderSingle();
        this.leaderboard.renderMulti();
    }

    switchLeaderboardTab(mode) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        document.querySelectorAll('.leaderboard-list').forEach(list => {
            list.classList.remove('active');
        });
        
        if (mode === 'single') {
            document.getElementById('single-leaderboard').classList.add('active');
        } else {
            document.getElementById('multi-leaderboard').classList.add('active');
        }
    }

    showLeaderboard() {
        this.leaderboard.renderSingle();
        this.leaderboard.renderMulti();
        document.getElementById('start-menu').classList.remove('active');
        document.getElementById('leaderboard').classList.add('active');
    }

    hideLeaderboard() {
        document.getElementById('leaderboard').classList.remove('active');
        document.getElementById('start-menu').classList.add('active');
    }

    handleKeyPress(e) {
        if (!this.isRunning) return;
        
        if (e.code === 'KeyP' || e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
            return;
        }
        
        if (this.isPaused) return;
        
        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            
            if (this.keys[snake.controls.UP]) {
                snake.setNextDirection(DIRECTION.UP);
            } else if (this.keys[snake.controls.DOWN]) {
                snake.setNextDirection(DIRECTION.DOWN);
            } else if (this.keys[snake.controls.LEFT]) {
                snake.setNextDirection(DIRECTION.LEFT);
            } else if (this.keys[snake.controls.RIGHT]) {
                snake.setNextDirection(DIRECTION.RIGHT);
            }
        }
    }

    startGame(mode) {
        this.gameMode = mode;
        this.isRunning = true;
        this.isPaused = false;
        this.gameOver = false;
        
        this.initSnakes();
        this.spawnFood();
        this.powerUps = [];
        
        this.updateUI();
        this.showGameScreen();
        
        this.lastFrameTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    initSnakes() {
        this.snakes = [];
        
        if (this.gameMode === 'single') {
            const startX = Math.floor(CONFIG.GRID_COLS / 2);
            const startY = Math.floor(CONFIG.GRID_ROWS / 2);
            
            const snake = new Snake(
                1,
                startX,
                startY,
                DIRECTION.RIGHT,
                COLORS.PLAYER1,
                { UP: 'KeyW', DOWN: 'KeyS', LEFT: 'KeyA', RIGHT: 'KeyD' }
            );
            
            this.snakes.push(snake);
        } else {
            const startX1 = Math.floor(CONFIG.GRID_COLS / 4);
            const startY1 = Math.floor(CONFIG.GRID_ROWS / 2);
            
            const startX2 = Math.floor(CONFIG.GRID_COLS * 3 / 4);
            const startY2 = Math.floor(CONFIG.GRID_ROWS / 2);
            
            const snake1 = new Snake(
                1,
                startX1,
                startY1,
                DIRECTION.RIGHT,
                COLORS.PLAYER1,
                { UP: 'KeyW', DOWN: 'KeyS', LEFT: 'KeyA', RIGHT: 'KeyD' }
            );
            
            const snake2 = new Snake(
                2,
                startX2,
                startY2,
                DIRECTION.LEFT,
                COLORS.PLAYER2,
                { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight' }
            );
            
            this.snakes.push(snake1, snake2);
        }
    }

    spawnFood() {
        let x, y;
        let validPosition = false;
        
        while (!validPosition) {
            x = Math.floor(Math.random() * CONFIG.GRID_COLS);
            y = Math.floor(Math.random() * CONFIG.GRID_ROWS);
            
            validPosition = true;
            
            for (const snake of this.snakes) {
                if (snake.containsPosition(x, y)) {
                    validPosition = false;
                    break;
                }
            }
            
            for (const powerUp of this.powerUps) {
                if (powerUp.x === x && powerUp.y === y) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        this.food = new Food(x, y);
    }

    spawnPowerUp() {
        if (Math.random() > CONFIG.POWERUP_SPAWN_CHANCE) return;
        
        let x, y;
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 50) {
            x = Math.floor(Math.random() * CONFIG.GRID_COLS);
            y = Math.floor(Math.random() * CONFIG.GRID_ROWS);
            
            validPosition = true;
            
            if (this.food && this.food.x === x && this.food.y === y) {
                validPosition = false;
            }
            
            if (validPosition) {
                for (const snake of this.snakes) {
                    if (snake.containsPosition(x, y)) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                for (const powerUp of this.powerUps) {
                    if (powerUp.x === x && powerUp.y === y) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        if (validPosition) {
            const types = [POWERUP_TYPE.SPEED_UP, POWERUP_TYPE.SLOW_DOWN, POWERUP_TYPE.INVINCIBLE];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (!this.isPaused && !this.gameOver) {
            this.update(deltaTime, currentTime);
        }
        
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime, currentTime) {
        const aliveSnakes = this.snakes.filter(s => s.alive);
        
        for (const snake of aliveSnakes) {
            snake.updatePowerUps(currentTime);
        }
        
        for (const snake of aliveSnakes) {
            if (snake.shouldMove(currentTime)) {
                snake.move();
                this.soundManager.playMove();
            }
        }
        
        if (this.food) {
            this.food.updatePulse(deltaTime);
        }
        
        for (const powerUp of this.powerUps) {
            powerUp.updatePulse(deltaTime);
        }
        
        this.powerUps = this.powerUps.filter(p => !p.isExpired(currentTime));
        
        this.checkCollisions();
    }

    checkCollisions() {
        const headCollisionPairs = [];
        
        for (const snake of this.snakes) {
            if (!snake.alive) continue;
            
            const head = snake.head;
            
            if (head.x < 0 || head.x >= CONFIG.GRID_COLS || 
                head.y < 0 || head.y >= CONFIG.GRID_ROWS) {
                if (!snake.powerUps.invincible.active) {
                    this.handleSnakeDeath(snake, '边界碰撞');
                    continue;
                } else {
                    if (head.x < 0) {
                        head.x = CONFIG.GRID_COLS - 1;
                    } else if (head.x >= CONFIG.GRID_COLS) {
                        head.x = 0;
                    }
                    if (head.y < 0) {
                        head.y = CONFIG.GRID_ROWS - 1;
                    } else if (head.y >= CONFIG.GRID_ROWS) {
                        head.y = 0;
                    }
                }
            }
            
            if (snake.containsPositionExceptHead(head.x, head.y)) {
                if (!snake.powerUps.invincible.active) {
                    this.handleSnakeDeath(snake, '自身碰撞');
                    continue;
                }
            }
            
            if (this.food && head.x === this.food.x && head.y === this.food.y) {
                snake.grow();
                snake.addScore(CONFIG.FOOD_SCORE);
                this.soundManager.playEat();
                this.spawnFood();
                this.spawnPowerUp();
                this.updateUI();
            }
            
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                if (head.x === powerUp.x && head.y === powerUp.y) {
                    snake.applyPowerUp(powerUp.type);
                    snake.addScore(CONFIG.POWERUP_SCORE);
                    this.soundManager.playPowerUp();
                    this.powerUps.splice(i, 1);
                    this.updateUI();
                }
            }
            
            for (const otherSnake of this.snakes) {
                if (otherSnake === snake || !otherSnake.alive) continue;
                
                const isHeadCollision = otherSnake.head.x === head.x && otherSnake.head.y === head.y;
                
                if (isHeadCollision) {
                    const pairKey = [snake.id, otherSnake.id].sort().join('-');
                    if (!headCollisionPairs.includes(pairKey)) {
                        headCollisionPairs.push(pairKey);
                    }
                } else if (otherSnake.containsPosition(head.x, head.y)) {
                    if (!snake.powerUps.invincible.active) {
                        this.handleSnakeDeath(snake, '碰撞对方蛇身');
                    }
                }
            }
        }
        
        for (const pairKey of headCollisionPairs) {
            const [id1, id2] = pairKey.split('-').map(Number);
            const snake1 = this.snakes.find(s => s.id === id1);
            const snake2 = this.snakes.find(s => s.id === id2);
            
            if (!snake1 || !snake2 || !snake1.alive || !snake2.alive) continue;
            
            if (!snake1.powerUps.invincible.active) {
                this.handleSnakeDeath(snake1, '互相碰撞');
            }
            if (!snake2.powerUps.invincible.active) {
                this.handleSnakeDeath(snake2, '互相碰撞');
            }
        }
        
        this.checkGameOver();
    }

    handleSnakeDeath(snake, reason) {
        snake.die();
        this.soundManager.playCollision();
        console.log(`${snake.name} 死亡: ${reason}`);
    }

    checkGameOver() {
        const aliveSnakes = this.snakes.filter(s => s.alive);
        
        if (aliveSnakes.length === 0) {
            this.gameOver = true;
            this.soundManager.playGameOver();
            
            if (this.gameMode === 'multi') {
                const snake1 = this.snakes[0];
                const snake2 = this.snakes[1];
                
                let winner, loser;
                if (snake1.score > snake2.score) {
                    winner = snake1;
                    loser = snake2;
                } else if (snake2.score > snake1.score) {
                    winner = snake2;
                    loser = snake1;
                } else {
                    winner = null;
                }
                
                if (winner) {
                    this.leaderboard.addMultiScores(
                        winner.name, winner.score,
                        loser.name, loser.score
                    );
                }
            } else {
                const snake = this.snakes[0];
                this.leaderboard.addSingleScore('玩家', snake.score);
            }
            
            this.showGameOverOverlay();
        } else if (this.gameMode === 'multi' && aliveSnakes.length === 1) {
            this.gameOver = true;
            this.soundManager.playGameOver();
            
            const winner = aliveSnakes[0];
            const loser = this.snakes.find(s => !s.alive);
            
            if (loser) {
                this.leaderboard.addMultiScores(
                    winner.name, winner.score,
                    loser.name, loser.score
                );
            }
            
            this.showGameOverOverlay();
        }
    }

    render() {
        this.renderer.clear();
        
        for (const snake of this.snakes) {
            if (snake.alive) {
                this.renderer.drawSnake(snake);
            }
        }
        
        if (this.food) {
            this.renderer.drawFood(this.food);
        }
        
        for (const powerUp of this.powerUps) {
            this.renderer.drawPowerUp(powerUp);
        }
    }

    updateUI() {
        if (this.gameMode === 'single') {
            document.getElementById('single-score').classList.remove('hidden');
            document.getElementById('player1-score').classList.add('hidden');
            document.getElementById('player2-score').classList.add('hidden');
            
            const scoreEl = document.querySelector('#single-score .score-value');
            if (this.snakes[0]) {
                scoreEl.textContent = this.snakes[0].score;
            }
        } else {
            document.getElementById('single-score').classList.add('hidden');
            document.getElementById('player1-score').classList.remove('hidden');
            document.getElementById('player2-score').classList.remove('hidden');
            
            const score1El = document.querySelector('#player1-score .score-value');
            const score2El = document.querySelector('#player2-score .score-value');
            
            if (this.snakes[0]) score1El.textContent = this.snakes[0].score;
            if (this.snakes[1]) score2El.textContent = this.snakes[1].score;
        }
    }

    showGameScreen() {
        document.getElementById('start-menu').classList.remove('active');
        document.getElementById('leaderboard').classList.remove('active');
        document.getElementById('game-screen').classList.remove('hidden');
    }

    hideGameScreen() {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('start-menu').classList.add('active');
    }

    togglePause() {
        if (!this.isRunning || this.gameOver) return;
        
        this.isPaused = !this.isPaused;
        
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
        
        if (this.isPaused) {
            this.showPauseOverlay();
        } else {
            this.hidePauseOverlay();
        }
    }

    showPauseOverlay() {
        document.getElementById('pause-overlay').classList.add('active');
    }

    hidePauseOverlay() {
        document.getElementById('pause-overlay').classList.remove('active');
    }

    showGameOverOverlay() {
        const overlay = document.getElementById('game-over-overlay');
        const title = document.getElementById('game-over-title');
        const scoresContainer = document.getElementById('game-over-scores');
        
        if (this.gameMode === 'single') {
            const snake = this.snakes[0];
            title.textContent = '游戏结束';
            scoresContainer.innerHTML = `
                <h3>最终得分</h3>
                <div class="final-score-item">
                    <span class="player-name">得分</span>
                    <span class="final-score">${snake.score}</span>
                </div>
            `;
        } else {
            const snake1 = this.snakes[0];
            const snake2 = this.snakes[1];
            
            let winner = null;
            if (snake1.alive) {
                winner = snake1;
            } else if (snake2.alive) {
                winner = snake2;
            } else if (snake1.score > snake2.score) {
                winner = snake1;
            } else if (snake2.score > snake1.score) {
                winner = snake2;
            }
            
            if (winner) {
                title.textContent = `${winner.name} 获胜！`;
            } else {
                title.textContent = '平局！';
            }
            
            scoresContainer.innerHTML = `
                <h3>最终比分</h3>
                <div class="final-score-item ${winner === snake1 ? 'winner' : ''}">
                    <span class="player-name player1">${snake1.name} ${winner === snake1 ? '👑' : ''}</span>
                    <span class="final-score">${snake1.score}</span>
                </div>
                <div class="final-score-item ${winner === snake2 ? 'winner' : ''}">
                    <span class="player-name player2">${snake2.name} ${winner === snake2 ? '👑' : ''}</span>
                    <span class="final-score">${snake2.score}</span>
                </div>
            `;
        }
        
        overlay.classList.add('active');
    }

    hideGameOverOverlay() {
        document.getElementById('game-over-overlay').classList.remove('active');
    }

    restartGame() {
        this.isRunning = false;
        this.startGame(this.gameMode);
    }

    quitGame() {
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        
        document.getElementById('pause-btn').textContent = '暂停';
        
        this.hideGameScreen();
    }
}

// ==================== 初始化游戏 ====================
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
