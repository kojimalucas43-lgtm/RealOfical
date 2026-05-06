const game = document.getElementById("game");
const rows = 5;
const cols = 9;

let selected = false;
let sun = 50;
const sunDisplay = document.getElementById("sun-counter");

let grid = [];
let zombies = [];
let bullets = [];

// Criar grid
for (let r = 0; r < rows; r++) {
  grid[r] = [];
  for (let c = 0; c < cols; c++) {
    let cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.row = r;
    cell.dataset.col = c;

    cell.onclick = () => plantHere(r, c, cell);

    game.appendChild(cell);
    grid[r][c] = { plant: null, element: cell };
  }
}

function selectPlant() {
  if (sun >= 50) {
    selected = true;
  }
}

function plantHere(r, c, cell) {
  if (selected && !grid[r][c].plant && sun >= 50) {
    grid[r][c].plant = { hp: 100 };
    cell.classList.add("plant");
    selected = false;
    sun -= 50;
    updateSun();
  }
}

function updateSun() {
  sunDisplay.innerText = "Sol: " + sun;
}

// Criar zumbis
function spawnZombie() {
  let row = Math.floor(Math.random() * rows);
  let zombie = {
    row,
    col: cols - 1,
    hp: 100
  };

  let el = document.createElement("div");
  el.classList.add("zombie");
  grid[row][cols - 1].element.appendChild(el);

  zombie.element = el;
  zombies.push(zombie);
}

setInterval(spawnZombie, 4000);

// Movimentação dos zumbis
function moveZombies() {
  zombies.forEach(z => {
    if (z.hp <= 0) return;

    z.col -= 0.1;
    z.element.style.transform = `translateX(${z.col * 80}px)`;

    let cell = grid[z.row][Math.floor(z.col)];

    if (cell && cell.plant) {
      cell.plant.hp -= 0.5;

      if (cell.plant.hp <= 0) {
        cell.plant = null;
        cell.element.classList.remove("plant");
      }
    }
  });
}

setInterval(moveZombies, 100);

// Disparo das plantas
function shoot() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].plant) {
        let bullet = {
          row: r,
          col: c,
          x: c * 80
        };

        let el = document.createElement("div");
        el.classList.add("bullet");
        grid[r][c].element.appendChild(el);

        bullet.element = el;
        bullets.push(bullet);
      }
    }
  }
}

setInterval(shoot, 2000);

// Movimento dos projéteis
function moveBullets() {
  bullets.forEach(b => {
    b.x += 5;
    b.element.style.left = b.x + "px";

    zombies.forEach(z => {
      if (z.row === b.row && Math.abs(b.x - z.col * 80) < 20) {
        z.hp -= 20;
        b.element.remove();

        if (z.hp <= 0) {
          z.element.remove();
        }
      }
    });
  });
}

setInterval(moveBullets, 50);