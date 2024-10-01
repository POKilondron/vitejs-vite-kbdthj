const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Установка размеров канваса
canvas.width = 800;
canvas.height = 600;

// Параметры игрока
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 50,
  speed: 10,
  dx: 0,
};

// Массив выстрелов
let bullets = [];

// Параметры врагов
let enemies = [];
let enemySpeed = 2;
let enemySpawnRate = 2000; // Время появления врагов (миллисекунды)

// Параметры бонусов
let bonuses = [];
const bonusSpawnRate = 5000; // Время появления бонусов (миллисекунды)
const bonusSize = 30; // Размер бонусов

// Переменные для уровней и очков
let score = 0;
let level = 1;
const scoreForNextLevel = 10; // Сколько очков нужно для повышения уровня

// Переменная для жизней
let lives = 100;

// Объект босса
let boss = null;
const bossWidth = 100;
const bossHeight = 100;
let bossHealth = 5; // Количество жизней босса

// Переменная для состояния паузы
let isPaused = false;

// Создание врагов
function createEnemy() {
  const x = Math.random() * (canvas.width - 50);
  enemies.push({
    x: x,
    y: 0,
    width: 50,
    height: 50,
  });
}

// Создание бонуса
function createBonus() {
  const x = Math.random() * (canvas.width - bonusSize);
  bonuses.push({
    x: x,
    y: 0,
    width: bonusSize,
    height: bonusSize,
    type: Math.random() < 0.5 ? 'health' : 'speed', // 50% шанс на здоровье или скорость
  });
}

// Управление игроком
function movePlayer() {
  player.x += player.dx;

  // Не выходить за границы канваса
  if (player.x < 0) {
    player.x = 0;
  }
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }
}

// Стрельба
let lastShotTime = 0; // Время последнего выстрела
const shotDelay = 300; // Задержка между выстрелами в миллисекундах

function shoot() {
  const currentTime = Date.now();
  if (currentTime - lastShotTime > shotDelay) { // Проверяем задержку
    bullets.push({
      x: player.x + player.width / 2 - 5,
      y: player.y,
      width: 10,
      height: 20,
      dy: -5,
    });
    lastShotTime = currentTime; // Обновляем время последнего выстрела
  }
}

// Движение выстрелов
function moveBullets() {
  bullets = bullets.filter(bullet => bullet.y > 0); // Удаление пуль за экраном
  bullets.forEach(bullet => {
    bullet.y += bullet.dy;
  });
}

// Движение врагов
function moveEnemies() {
  enemies.forEach(enemy => {
    enemy.y += enemySpeed;
  });

  // Удаление врагов, вышедших за экран
  enemies = enemies.filter(enemy => enemy.y < canvas.height);
}

// Движение бонусов
function moveBonuses() {
  bonuses.forEach(bonus => {
    bonus.y += 2; // Скорость падения бонусов
  });

  // Удаление бонусов, вышедших за экран
  bonuses = bonuses.filter(bonus => bonus.y < canvas.height);
}

// Проверка столкновений
function checkCollisions() {
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        // Удаление врага и пули при столкновении
        enemies.splice(enemyIndex, 1);
        bullets.splice(bulletIndex, 1);
        
        // Увеличиваем очки
        score++;

        // Проверяем, пора ли повышать уровень
        if (score % scoreForNextLevel === 0) {
          levelUp();
        }
      }
    });
  });
}

// Проверка столкновений с врагами
function checkEnemyCollisions() {
  enemies.forEach((enemy, enemyIndex) => {
    if (
      enemy.y + enemy.height > player.y &&
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x
    ) {
      // Удаление врага и уменьшение жизней при столкновении
      enemies.splice(enemyIndex, 1);
      lives--; // Уменьшаем жизнь игрока

      // Проверяем, не закончились ли жизни
      if (lives <= 0) {
        alert("Игра окончена!");
        resetGame();
      }
    }
  });
}

// Проверка столкновений с бонусами
function checkBonusCollisions() {
  bonuses.forEach((bonus, bonusIndex) => {
    if (
      bonus.y + bonus.height > player.y &&
      bonus.x < player.x + player.width &&
      bonus.x + bonus.width > player.x
    ) {
      // Удаление бонуса при столкновении
      if (bonus.type === 'health') {
        lives += 10; // Восстановление жизней
      } else if (bonus.type === 'speed') {
        player.speed += 2; // Увеличение скорости
        setTimeout(() => {
          player.speed -= 2; // Возврат скорости через 5 секунд
        }, 5000);
      }
      bonuses.splice(bonusIndex, 1); // Удаляем бонус
    }
  });
}

// Повышение уровня
function levelUp() {
  level++;
  enemySpeed += 1;

  if (level % 10 === 0) {
    spawnBoss();
  } else {
    enemySpawnRate -= 200; // Уменьшаем время между появлениями врагов
    if (enemySpawnRate < 500) {
      enemySpawnRate = 500; // Минимальная частота появления врагов
    }
    clearInterval(enemyInterval); // Перезапуск таймера появления врагов
    enemyInterval = setInterval(createEnemy, enemySpawnRate);
  }
}

// Функция для появления босса
function spawnBoss() {
  boss = {
    x: canvas.width / 2 - bossWidth / 2,
    y: 0,
    width: bossWidth,
    height: bossHeight,
    speed: 2,
  };
  enemySpawnRate = 2000; // Устанавливаем частоту появления врагов на время боя с боссом
  clearInterval(enemyInterval); // Отключаем обычных врагов
}

// Движение босса
function moveBoss() {
  if (boss) {
    boss.y += boss.speed;
    if (boss.x < player.x) {
      boss.x += boss.speed; // Двигается к игроку
    } else {
      boss.x -= boss.speed; // Двигается к игроку
    }
  }
}

// Проверка столкновений с боссом
function checkBossCollisions() {
  if (boss) {
    bullets.forEach((bullet, bulletIndex) => {
      if (
        bullet.x < boss.x + boss.width &&
        bullet.x + bullet.width > boss.x &&
        bullet.y < boss.y + boss.height &&
        bullet.y + bullet.height > boss.y
      ) {
        // Уменьшаем здоровье босса и удаляем пулю при столкновении
        bossHealth--;
        bullets.splice(bulletIndex, 1);

        // Проверка на поражение босса
        if (bossHealth <= 0) {
          boss = null; // Удаляем босса
          score += 5; // Увеличиваем очки за уничтожение босса
        }
      }
    });
  }
}

// Отрисовка игрока
function drawPlayer() {
  ctx.fillStyle = '#00f';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Отрисовка выстрелов
function drawBullets() {
  ctx.fillStyle = '#ff0';
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

// Отрисовка врагов
function drawEnemies() {
  ctx.fillStyle = '#f00';
  enemies.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });
}

// Отрисовка бонусов
function drawBonuses() {
  ctx.fillStyle = '#0f0';
  bonuses.forEach(bonus => {
    ctx.fillRect(bonus.x, bonus.y, bonus.width, bonus.height);
  });
}

// Отрисовка босса
function drawBoss() {
  ctx.fillStyle = '#ff00ff'; // Цвет босса
  ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
}

// Отрисовка очков и уровня
function drawScoreAndLevel() {
  ctx.fillStyle = '#000';
  ctx.font = '20px Arial';
  ctx.fillText('Очки: ' + score, 10, 20);
  ctx.fillText('Уровень: ' + level, 10, 50);
  ctx.fillText('Жизни: ' + lives, 10, 80);
}

// Очищение канваса
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Обновление состояния игры
function update() {
  if (!isPaused) { // Обновляем только если не на паузе
    clearCanvas();
    movePlayer();
    moveBullets();
    moveEnemies();
    moveBonuses(); // Двигаем бонусы

    if (boss) {
      moveBoss(); // Двигаем босса
    }

    checkCollisions();
    checkEnemyCollisions();
    checkBonusCollisions(); // Проверяем столкновения с бонусами
    checkBossCollisions();

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawBonuses(); // Рисуем бонусы

    if (boss) {
      drawBoss(); // Рисуем босса
    }

    drawScoreAndLevel();
  }
}

// Запуск игры
function startGame() {
  menu.style.display = 'none';
  canvas.style.display = 'block';
  lives = 100; // Сброс жизней
  score = 0; // Сброс очков
  level = 1; // Сброс уровня
  enemySpeed = 2; // Сброс скорости врагов
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - 60;
  bullets = [];
  enemies = [];
  bonuses = [];
  boss = null; // Удаление босса
  bossHealth = 5; // Сброс здоровья босса
  setInterval(update, 1000 / 60); // 60 кадров в секунду
  enemyInterval = setInterval(createEnemy, enemySpawnRate);
  setInterval(createBonus, bonusSpawnRate); // Таймер для появления бонусов
}

// Перезапуск игры
function restartGame() {
  resetGame();
  startGame();
}

// Сброс игры
function resetGame() {
  score = 0;
  level = 1;
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - 60;
  bullets = [];
  enemies = [];
  bonuses = [];
  boss = null;
  bossHealth = 5;
  lives = 100; // Сброс жизней
}

// Пауза игры
function togglePause() {
  isPaused = !isPaused; // Переключение состояния паузы
  if (isPaused) {
    clearInterval(enemyInterval); // Остановить врагов
  } else {
    enemyInterval = setInterval(createEnemy, enemySpawnRate); // Возобновить врагов
  }
}

// Обработка событий
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP') {
    togglePause(); // Пауза при нажатии P
  }
  if (e.code === 'Space') {
    shoot(); // Стрельба при нажатии пробела
  }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
