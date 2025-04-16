<template>
  <div class="game-container">
    <div class="header">
      <h1 class="header-title">可爱 2048 游戏</h1>
      <div class="score-board">
        <div class="score">得分: {{ score }}</div>
        <div class="high-score">最高分: {{ highScore }}</div>
      </div>
    </div>
    <div
      class="game-board"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div
        v-for="(row, i) in board"
        :key="i"
        class="game-row"
      >
        <div
          v-for="(tile, j) in row"
          :key="`${i}-${j}`"
          class="game-cell"
        >
          <transition name="tile-appear">
            <div
              v-if="tile!== 0"
              class="game-tile"
              :style="{
                backgroundImage: `url(${images[tile]})`,
                transform: `translate(${tileMovements[i * 4 + j].x}px, ${tileMovements[i * 4 + j].y}px) scale(${tileScales[i * 4 + j]})`,
              }"
              @transitionend="resetTileMovement(i * 4 + j)"
            ></div>
          </transition>
        </div>
      </div>
    </div>
    <div class="game-rules">
      <p>游戏规则：使用键盘方向键（上、下、左、右）或滑动屏幕控制卡片移动，相同的卡片会合并成一个数值更大的卡片，目标是合并出数值为 2048 的卡片。</p>
    </div>
    <div
      class="win-modal"
      :style="{ display: isWinModalVisible? 'flex' : 'none' }"
    >
      <div class="win-modal-content">
        <p>恭喜你已经合并了一只宇宙无敌最可爱的猫咪</p>
        <button @click="closeWinModal">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const gameBoard = ref(null);
const winModal = ref(null);
const score = ref(0);
const storedHighScore = localStorage.getItem('highScore');
const highScore = ref(storedHighScore &&!isNaN(parseInt(storedHighScore))? parseInt(storedHighScore) : 0);
const board = ref([
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
]);
const isWinModalVisible = ref(false);

const images = {
  2: 'https://p9-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/df099f209335f8b25e1d4ab9ce2867ff_1741677321668230149.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213321&x-signature=reNM%2F907NNX7Rc%2BE4FflYbWaRKo%3D',
  4: 'https://p9-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/322b9826909d14458d22e0931fd06aac_1741677330491084517.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213330&x-signature=a1ptVuhTOwjrpRZSdnL%2FUKYV9MY%3D',
  8: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/1a563d103b7496a5b9eb365ff9ea58bd_1741677409407029394.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213409&x-signature=L0drmZ0N1Z2%2BjUD9g9gcP0Nn7TM%3D',
  16: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/f51aebc9e6d5eee19fc026e3f1070185_1741677412756659826.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213412&x-signature=%2F%2FMLyi7m%2Bu%2Fo%2F%2FTQeYqmUWeDtLQ%3D',
  32: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/8693822e52091fd6896366ae4e922bc2_1741677429462075923.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213429&x-signature=tLOJO0F5DKTLStoKnja6l2fr%2FOg%3D',
  64: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/5fbb02d79c0f16f69ec86ea7a83d7e36_1741677431738410576.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213431&x-signature=Ry8L%2FkXszOCFFHkMeIdKm6Ktg%2FQ%3D',
  128: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/f2c91103fc53286b5d481390c12d665f_1741677444595987213.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213444&x-signature=X5AHPsnNLXS25hlANqlvTtpSQmc%3D',
  256: 'https://p9-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/9f4e790544e519f8c110d2c73e7b03bf_1741677446066399364.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213446&x-signature=DmV9R3QrONwWz%2F4fUnoceUjiU8E%3D',
  512: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/8f72db8a79741930894920bc8faced83_1741677458934448994.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213458&x-signature=YxMhmlrT%2FY7brkyal9u5oaifd3g%3D',
  1024: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/f565fa57b977fa953208f7a2b4edd839_1741677459756646895.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213459&x-signature=r0bBAR7T7NVF3dyu1aGI%2FlWfR4w%3D',
  2048: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_generation/dbb80e7d3948b8af02664915eeee38d2_1741677502512862779.png~tplv-a9rns2rl98-image.png?rk3s=25bff839&x-expires=1773213502&x-signature=Bv%2FEdGFqr%2Bq47a8g1D4KiU9XYqQ%3D'
};

const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);

const tileMovements = ref(Array(16).fill({ x: 0, y: 0 }));
const tileScales = ref(Array(16).fill(1));

const addRandomTile = () => {
  const emptyCells = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board.value[i][j] === 0) {
        emptyCells.push({ i, j });
      }
    }
  }
  if (emptyCells.length > 0) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { i, j } = emptyCells[randomIndex];
    board.value[i][j] = Math.random() < 0.9? 2 : 4;
    tileScales.value[i * 4 + j] = 0;
    setTimeout(() => {
      tileScales.value[i * 4 + j] = 1;
    }, 50);
  }
};

const mergeTiles = (row) => {
  let hasMerged = Array(row.length).fill(false);
  let newRow = Array(row.length).fill(0);
  let targetIndex = 0;

  for (let i = 0; i < row.length; i++) {
    if (row[i]!== 0) {
      if (targetIndex > 0 && newRow[targetIndex - 1] === row[i] &&!hasMerged[targetIndex - 1]) {
        newRow[targetIndex - 1] *= 2;
        score.value += newRow[targetIndex - 1];
        if (newRow[targetIndex - 1] === 2048) {
          showWinModal();
        }
        hasMerged[targetIndex - 1] = true;
        tileScales.value[targetIndex - 1] = 1.2;
        setTimeout(() => {
          tileScales.value[targetIndex - 1] = 1;
        }, 200);
      } else {
        newRow[targetIndex] = row[i];
        targetIndex++;
      }
    }
  }

  return newRow;
};

const calculateTileMovements = (oldBoard, newBoard) => {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (oldBoard[i][j]!== 0) {
        let newI = -1;
        let newJ = -1;
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            if (newBoard[x][y] === oldBoard[i][j]) {
              newI = x;
              newJ = y;
              break;
            }
          }
          if (newI!== -1) break;
        }
        if (newI!== -1) {
          const cellSize = gameBoard.value.offsetWidth / 4;
          const dx = (newJ - j) * cellSize;
          const dy = (newI - i) * cellSize;
          tileMovements.value[i * 4 + j] = { x: dx, y: dy };
        }
      }
    }
  }
};

const moveLeft = () => {
  const oldBoard = JSON.parse(JSON.stringify(board.value));
  let moved = false;
  for (let i = 0; i < 4; i++) {
    const oldRow = [...board.value[i]];
    board.value[i] = mergeTiles(board.value[i]);
    if (oldRow.join(',')!== board.value[i].join(',')) {
      moved = true;
    }
  }
  if (moved) {
    calculateTileMovements(oldBoard, board.value);
    addRandomTile();
  }
  updateScore();
};

const moveRight = () => {
  const oldBoard = JSON.parse(JSON.stringify(board.value));
  let moved = false;
  for (let i = 0; i < 4; i++) {
    const oldRow = [...board.value[i]];
    const reversedRow = board.value[i].slice().reverse();
    const newReversedRow = mergeTiles(reversedRow);
    board.value[i] = newReversedRow.reverse();
    if (oldRow.join(',')!== board.value[i].join(',')) {
      moved = true;
    }
  }
  if (moved) {
    calculateTileMovements(oldBoard, board.value);
    addRandomTile();
  }
  updateScore();
};

const moveUp = () => {
  const oldBoard = JSON.parse(JSON.stringify(board.value));
  let moved = false;
  for (let j = 0; j < 4; j++) {
    let column = [];
    for (let i = 0; i < 4; i++) {
      column.push(board.value[i][j]);
    }
    const oldColumn = [...column];
    const newColumn = mergeTiles(column);
    for (let i = 0; i < 4; i++) {
      board.value[i][j] = newColumn[i];
    }
    if (oldColumn.join(',')!== newColumn.join(',')) {
      moved = true;
    }
  }
  if (moved) {
    calculateTileMovements(oldBoard, board.value);
    addRandomTile();
  }
  updateScore();
};

const moveDown = () => {
  const oldBoard = JSON.parse(JSON.stringify(board.value));
  let moved = false;
  for (let j = 0; j < 4; j++) {
    let column = [];
    for (let i = 0; i < 4; i++) {
      column.push(board.value[i][j]);
    }
    const oldColumn = [...column];
    const reversedColumn = column.slice().reverse();
    const newReversedColumn = mergeTiles(reversedColumn);
    const newColumn = newReversedColumn.reverse();
    for (let i = 0; i < 4; i++) {
      board.value[i][j] = newColumn[i];
    }
    if (oldColumn.join(',')!== newColumn.join(',')) {
      moved = true;
    }
  }
  if (moved) {
    calculateTileMovements(oldBoard, board.value);
    addRandomTile();
  }
  updateScore();
};

const handleKeyPress = (event) => {
  switch (event.key) {
    case 'ArrowLeft':
      moveLeft();
      break;
    case 'ArrowRight':
      moveRight();
      break;
    case 'ArrowUp':
      moveUp();
      break;
    case 'ArrowDown':
      moveDown();
      break;
  }
};

const handleTouchStart = (event) => {
  touchStartX.value = event.touches[0].clientX;
  touchStartY.value = event.touches[0].clientY;
};

const handleTouchMove = (event) => {
  touchEndX.value = event.touches[0].clientX;
  touchEndY.value = event.touches[0].clientY;
};

const handleTouchEnd = () => {
  const xDiff = touchEndX.value - touchStartX.value;
  const yDiff = touchEndY.value - touchStartY.value;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) {
      moveRight();
    } else {
      moveLeft();
    }
  } else {
    if (yDiff > 0) {
      moveDown();
    } else {
      moveUp();
    }
  }
};

const showWinModal = () => {
  isWinModalVisible.value = true;
};

const closeWinModal = () => {
  isWinModalVisible.value = false;
};

const updateScore = () => {
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('highScore', highScore.value);
  }
};

const resetTileMovement = (index) => {
  tileMovements.value[index] = { x: 0, y: 0 };
};

onMounted(() => {
  addRandomTile();
  addRandomTile();
  window.addEventListener('keydown', handleKeyPress);
});
</script>

<style scoped>
.game-container {
  background-color: #faf8ef;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 500px;
  color: #776e65;
  margin-bottom: 20px;
}

.header-title {
  margin: 0;
}

.score-board {
  display: flex;
  gap: 10px;
}

.score,
.high-score {
  background-color: #bbada0;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
}

.game-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 10px;
  background-color: #bbada0;
  padding: 10px;
  border-radius: 5px;
  width: 100%;
  max-width: 500px;
  margin-bottom: 20px;
}

.game-row {
  display: contents;
}

.game-cell {
  background-color: rgba(238, 228, 218, 0.35);
  border-radius: 5px;
  aspect-ratio: 1/1;
}

.game-tile {
  width: 100%;
  height: 100%;
  background-size: cover;
  border-radius: 5px;
  animation: tile-appear 0.3s ease-out;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes tile-appear {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.tile-appear-enter-active {
  animation: tile-appear 0.3s ease-out;
}

.tile-appear-leave-active {
  animation: tile-appear 0.3s ease-in reverse;
}

.game-rules {
  text-align: left;
  color: #776e65;
  width: 100%;
  max-width: 500px;
  font-size: 14px;
}

.win-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: none;
  align-items: center;
  justify-content: center;
  animation: fade-in 0.3s ease-out;
}

.win-modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
