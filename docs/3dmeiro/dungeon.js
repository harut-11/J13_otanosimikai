/* =========================================
   修正版 JavaScript コード (WASD対応)
   ========================================= */

// --- 既存の定数設定 ---
const WALL_TYPES = [
    [0,0,0,0], [1,1,1,1], [1,0,0,0], [1,1,0,0],
    [1,0,1,0], [1,0,0,1], [1,1,1,0], [1,0,1,1],
    [1,1,0,1], [0,1,0,0], [0,1,1,0], [0,1,0,1],
    [0,1,1,1], [0,0,1,0], [0,0,1,1], [0,0,0,1]
];

function charToWallIndex(char) {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 63) return code - 48;
    return 1;
}

const MAP_SIZE = 21; 
let MAP_W = MAP_SIZE;
let MAP_H = MAP_SIZE;
let MAP_STR = []; 
let visitedMap = []; 

// ★変更：オフセットを0に戻す（キャンバス外に表示するため不要）
const MAP_OFFSET_Y = 0; 

const CHIP_SIZE_2D = Math.floor(220 / MAP_SIZE);

let player = { x: 1, y: 1, dir: 3 };

const DIRS = [
    {x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}
];

let goal = { x: 1, y: 1 };
let startTime = 0;
let animationId = null;

// ★追加：HTMLのタイマー要素を取得
const timerElement = document.getElementById('timer-box');

function isOutOfBounds(x, y) {
    return (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H);
}

// --- generateMaze (変更なし) ---
function generateMaze() {
    let map = [];
    for (let y = 0; y < MAP_H; y++) {
        let row = [];
        for (let x = 0; x < MAP_W; x++) row.push('1');
        map.push(row);
    }
    function dig(x, y) {
        map[y][x] = '0';
        const dirs = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        for (let dir of dirs) {
            let nx = x + (dir.x * 2);
            let ny = y + (dir.y * 2);
            if (nx > 0 && nx < MAP_W - 1 && ny > 0 && ny < MAP_H - 1) {
                if (map[ny][nx] === '1') {
                    map[y + dir.y][x + dir.x] = '0';
                    dig(nx, ny);
                }
            }
        }
    }
    dig(1, 1);
    for (let y = 1; y < MAP_H - 1; y++) {
        for (let x = 1; x < MAP_W - 1; x++) {
            if (map[y][x] === '1') {
                if (Math.random() < 0.05) {
                    const wallType = Math.floor(Math.random() * 14) + 2;
                    map[y][x] = String.fromCharCode(48 + wallType);
                }
            }
        }
    }
    MAP_STR = map.map(row => row.join(''));
}

// --- ゲームロジック ---
const cvs3d = document.getElementById('view3d');
const ctx3d = cvs3d.getContext('2d');
const cvs2d = document.getElementById('view2d');
const ctx2d = cvs2d.getContext('2d');

function updateVisited() {
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            let ty = player.y + dy;
            let tx = player.x + dx;
            if (!isOutOfBounds(tx, ty)) {
                visitedMap[ty][tx] = true;
            }
        }
    }
}

function init() {
    generateMaze();
    visitedMap = [];
    for(let y = 0; y < MAP_H; y++) {
        let row = [];
        for(let x = 0; x < MAP_W; x++) row.push(false);
        visitedMap.push(row);
    }

    player.x = 1; player.y = 1; player.dir = 3; 
    updateVisited();

    let foundGoal = false;
    for (let y = MAP_H - 2; y > 0; y--) {
        for (let x = MAP_W - 2; x > 0; x--) {
            if (MAP_STR[y][x] === '0') {
                goal = { x: x, y: y };
                foundGoal = true;
                break;
            }
        }
        if (foundGoal) break;
    }

    startTime = Date.now();
    draw3D();
    
    if (animationId) cancelAnimationFrame(animationId);
    tick();

    // ★修正：矢印キーに加えてWASDキーでも操作可能に変更
    window.onkeydown = (e) => {
        const code = e.code;
        // スクロール防止対象にWASDを追加
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(code)) {
            e.preventDefault();
        }

        // W または ↑ で前進
        if(code === "ArrowUp"   || code === "KeyW") movePlayer(0);
        // S または ↓ で後退
        if(code === "ArrowDown" || code === "KeyS") movePlayer(2);
        // A または ← で左回転
        if(code === "ArrowLeft" || code === "KeyA") turnPlayer(1);
        // D または → で右回転
        if(code === "ArrowRight"|| code === "KeyD") turnPlayer(3);
    };
}

function tick() {
    draw2D();
    animationId = requestAnimationFrame(tick);
}

function turnPlayer(direction) {
    if (direction === 1) player.dir = (player.dir + 1) % 4;
    else player.dir = (player.dir + 3) % 4;
    draw();
}

function movePlayer(direction) {
    let moveDir = player.dir;
    if (direction === 2) moveDir = (player.dir + 2) % 4; 

    const nextX = player.x + DIRS[moveDir].x;
    const nextY = player.y + DIRS[moveDir].y;

    if (isOutOfBounds(nextX, nextY)) return;
    if (MAP_STR[nextY][nextX] === '1') return; 

    const currentWallIdx = charToWallIndex(MAP_STR[player.y][player.x]);
    const currentWallData = WALL_TYPES[currentWallIdx];
    if (currentWallData[moveDir] === 1) return;

    const nextWallIdx = charToWallIndex(MAP_STR[nextY][nextX]);
    const nextWallData = WALL_TYPES[nextWallIdx];
    const oppositeDir = (moveDir + 2) % 4; 
    if (nextWallData[oppositeDir] === 1) return;

    player.x = nextX;
    player.y = nextY;
    
    updateVisited();
    draw3D();

    if (player.x === goal.x && player.y === goal.y) {
        setTimeout(() => {
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
            alert("Game Clear! Time: " + elapsedTime + "s");
            init(); 
        }, 10);
    }
}

// --- 描画処理 ---
const COLOR_FRONT = "#AAAAAA"; 
const COLOR_SIDE  = "#777777"; 
const SPREAD_X = [0, 70, 110, 140, 160]; 
const SPREAD_Y = [0, 60, 90, 110, 120];

function draw() {
    ctx2d.fillStyle = "#000";
    ctx2d.fillRect(0, 0, cvs2d.width, cvs2d.height);
    draw3D();
    draw2D();
}

// ★変更：HTML要素を更新し、キャンバス描画位置を元に戻した draw2D
function draw2D() {
    // 1. 時間の更新（キャンバスではなくHTML要素に書き込む）
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    if(timerElement) {
        timerElement.innerText = "Time: " + elapsedTime + "s";
    }

    // 2. キャンバスクリア
    ctx2d.fillStyle = "#000";
    ctx2d.fillRect(0, 0, cvs2d.width, cvs2d.height);

    for(let y=0; y<MAP_H; y++) {
        for(let x=0; x<MAP_W; x++) {
            
            // 未探索ならスキップ
            if (!visitedMap[y][x]) continue; 

            const wallIdx = charToWallIndex(MAP_STR[y][x]);
            const wall = WALL_TYPES[wallIdx];
            
            // ★変更：オフセットを削除 (offsetYは0なのでそのまま計算)
            const px = x * CHIP_SIZE_2D;
            const py = y * CHIP_SIZE_2D;

            if (x === goal.x && y === goal.y) {
                ctx2d.fillStyle = "#FF0000"; 
                ctx2d.fillRect(px, py, CHIP_SIZE_2D, CHIP_SIZE_2D);
            }
            else if (MAP_STR[y][x] === '1') {
                ctx2d.fillStyle = "#777777"; 
                ctx2d.fillRect(px, py, CHIP_SIZE_2D, CHIP_SIZE_2D);
            } 
            else {
                ctx2d.fillStyle = "#000"; 
                ctx2d.fillRect(px, py, CHIP_SIZE_2D, CHIP_SIZE_2D);
            }
            
            ctx2d.strokeStyle = "#222";
            ctx2d.strokeRect(px, py, CHIP_SIZE_2D, CHIP_SIZE_2D);

            ctx2d.strokeStyle = "#555";
            ctx2d.lineWidth = 1;
            ctx2d.beginPath();
            if(wall[0]) { ctx2d.moveTo(px, py); ctx2d.lineTo(px+CHIP_SIZE_2D, py); } 
            if(wall[1]) { ctx2d.moveTo(px, py); ctx2d.lineTo(px, py+CHIP_SIZE_2D); } 
            if(wall[2]) { ctx2d.moveTo(px, py+CHIP_SIZE_2D); ctx2d.lineTo(px+CHIP_SIZE_2D, py+CHIP_SIZE_2D); } 
            if(wall[3]) { ctx2d.moveTo(px+CHIP_SIZE_2D, py); ctx2d.lineTo(px+CHIP_SIZE_2D, py+CHIP_SIZE_2D); } 
            ctx2d.stroke();
        }
    }

    // プレイヤー描画（オフセット削除）
    const cx = player.x * CHIP_SIZE_2D + CHIP_SIZE_2D/2;
    const cy = player.y * CHIP_SIZE_2D + CHIP_SIZE_2D/2;
    
    ctx2d.fillStyle = "yellow"; 
    ctx2d.beginPath(); ctx2d.arc(cx, cy, CHIP_SIZE_2D/3, 0, Math.PI*2); ctx2d.fill();
    
    ctx2d.strokeStyle = "white"; ctx2d.lineWidth = 2;
    ctx2d.beginPath(); ctx2d.moveTo(cx, cy);
    ctx2d.lineTo(cx + DIRS[player.dir].x * (CHIP_SIZE_2D/2), cy + DIRS[player.dir].y * (CHIP_SIZE_2D/2));
    ctx2d.stroke();
}

// --- 3D描画ヘルパー関数 (変更なし) ---
function hasWall(x, y, dir) {
    if (isOutOfBounds(x, y)) return true;
    const idx = charToWallIndex(MAP_STR[y][x]);
    return WALL_TYPES[idx][dir] === 1;
}
function checkBoundaryWall(x1, y1, dir) {
    const dx = DIRS[dir].x;
    const dy = DIRS[dir].y;
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const oppositeDir = (dir + 2) % 4;
    return hasWall(x1, y1, dir) || hasWall(x2, y2, oppositeDir);
}
// ★新規追加：特定の深さ(depth)の床に色を塗る関数
function drawFloor(depth, color) {
    if (depth > 3) return;
    
    const W = cvs3d.width; 
    const H = cvs3d.height;

    // 現在の深さの「壁の底辺」のY座標
    let currentWallBottom = H - SPREAD_Y[depth];
    
    // 1つ手前の深さの「壁の底辺」のY座標（ここが床の描画終了位置）
    // depthが0（目の前）の場合は画面最下部(H)まで塗る
    let prevWallBottom = (depth === 0) ? H : (H - SPREAD_Y[depth - 1]);

    // 床の描画範囲（台形ではなく簡易的に矩形で描画）
    let sx = SPREAD_X[depth]; // 横の開始位置
    let w = W - sx * 2;       // 横幅
    let h = prevWallBottom - currentWallBottom; // 高さ

    // 1. 色を塗る
    ctx3d.fillStyle = color;
    ctx3d.fillRect(sx, currentWallBottom, w, h);

    // 2. フォグ（遠くを暗くする）
    if (depth > 0) {
        ctx3d.fillStyle = "rgba(0, 0, 0, " + (depth * 0.3) + ")";
        ctx3d.fillRect(sx, currentWallBottom, w, h);
    }
}

// ★修正：draw3D関数（ゴール判定を追加）
function draw3D() {
    // 背景を黒でリセット
    ctx3d.fillStyle = "#000000"; 
    ctx3d.fillRect(0, 0, cvs3d.width, cvs3d.height);

    const frontWallColor = COLOR_FRONT;
    const sideWallColor  = COLOR_SIDE;

    // 奥(3)から手前(0)に向かって描画
    for (let d = 3; d >= 0; d--) {
        // その深さにある座標を計算
        let tx = player.x + DIRS[player.dir].x * d;
        let ty = player.y + DIRS[player.dir].y * d;

        let rightDir = (player.dir + 3) % 4;
        let leftDir = (player.dir + 1) % 4;

        // ★追加部分：もしその場所がゴールなら「赤い床」を描く
        if (tx === goal.x && ty === goal.y) {
            drawFloor(d, "#FF0000"); // 赤色で床を描画
        }

        // --- 以下は既存の壁描画ロジック ---
        if (d >= 1) {
            let offsets = [-2, 2, -1, 1]; 
            offsets.forEach(offset => {
                let prevTx = player.x + DIRS[player.dir].x * (d - 1);
                let prevTy = player.y + DIRS[player.dir].y * (d - 1);
                let nearX = prevTx + DIRS[rightDir].x * offset;
                let nearY = prevTy + DIRS[rightDir].y * offset;

                if (!isOutOfBounds(nearX, nearY)) {
                    if (checkBoundaryWall(nearX, nearY, player.dir)) {
                        drawDiagonal(d, offset, frontWallColor);
                    }
                }
            });

            let prevX = player.x + DIRS[player.dir].x * (d - 1);
            let prevY = player.y + DIRS[player.dir].y * (d - 1);

            if (checkBoundaryWall(prevX, prevY, player.dir)) {
                drawRectDepth(d, frontWallColor);
            }
        }

        if (checkBoundaryWall(tx, ty, leftDir)) {
             drawSideWall(d, -1, sideWallColor);
        }
        if (checkBoundaryWall(tx, ty, rightDir)) {
             drawSideWall(d, 1, sideWallColor);
        }
    }
}
function drawRectDepth(depth, color) {
    if (depth > 3) return;
    const W = cvs3d.width; const H = cvs3d.height;
    let sx = SPREAD_X[depth]; let sy = SPREAD_Y[depth];
    ctx3d.fillStyle = color;
    ctx3d.fillRect(sx, sy, W - sx*2, H - sy*2);
    if (depth > 0) {
        ctx3d.fillStyle = "rgba(0, 0, 0, " + (depth * 0.3) + ")";
        ctx3d.fillRect(sx, sy, W - sx*2, H - sy*2);
    }
    ctx3d.strokeStyle = "#000"; 
    ctx3d.strokeRect(sx, sy, W - sx*2, H - sy*2);
}
function drawSideWall(depth, side, color) {
    if (depth > 3) return;
    const W = cvs3d.width; const H = cvs3d.height;
    let x1 = SPREAD_X[depth]; let y1 = SPREAD_Y[depth];
    let x2 = SPREAD_X[depth+1]; let y2 = SPREAD_Y[depth+1];
    ctx3d.beginPath();
    if (side === -1) { 
        ctx3d.moveTo(x1, y1); ctx3d.lineTo(x2, y2);
        ctx3d.lineTo(x2, H - y2); ctx3d.lineTo(x1, H - y1);
    } else { 
        ctx3d.moveTo(W - x1, y1); ctx3d.lineTo(W - x2, y2);
        ctx3d.lineTo(W - x2, H - y2); ctx3d.lineTo(W - x1, H - y1);
    }
    ctx3d.fillStyle = color;
    ctx3d.fill();
    if (depth > 0) {
        ctx3d.fillStyle = "rgba(0, 0, 0, " + (depth * 0.3) + ")";
        ctx3d.fill();
    }
    ctx3d.strokeStyle = "#000"; 
    ctx3d.stroke();
}
function drawDiagonal(depth, offset, color) {
    if (depth > 3) return;
    const W = cvs3d.width; const H = cvs3d.height;
    let sx = SPREAD_X[depth]; let sy = SPREAD_Y[depth];
    let blockWidth = W - sx * 2; let blockHeight = H - sy * 2;
    let centerX = sx;
    let drawX = centerX + (blockWidth * offset);
    ctx3d.fillStyle = color;
    ctx3d.fillRect(drawX, sy, blockWidth, blockHeight);
    if (depth > 0) {
        ctx3d.fillStyle = "rgba(0, 0, 0, " + (depth * 0.3) + ")";
        ctx3d.fillRect(drawX, sy, blockWidth, blockHeight);
    }
    ctx3d.strokeStyle = "#000";
    ctx3d.strokeRect(drawX, sy, blockWidth, blockHeight);
}

init();