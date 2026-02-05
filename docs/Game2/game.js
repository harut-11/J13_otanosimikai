// メインゲームロジック
class GameState {
    constructor() {
        this.turn = 1;
        this.gold = 1000;
        this.territoryOwners = {}; // territoryId -> playerId
        this.territorTroops = {}; // territoryId -> troop count
        this.playerTroops = {}; // playerId -> total troops
        this.playerGold = {}; // playerId -> gold
        this.selectedTerritory = null;
        this.gameMap = null;

        // プレイヤーID: 0は坪内、1-10は敵君主
        this.playerId = 0;
        this.playerName = '坪内';
        this.playerColor = '#1abc9c';

        // 初期化
        this.initializeGame();
    }

    initializeGame() {
        // プレイヤーは兵庫県（神戸電子専門帝国）から開始
        this.territoryOwners[28] = 0;
        this.territorTroops[28] = 500;

        // 敵君主の領土を設定
        ENEMIES.forEach(enemy => {
            enemy.strongholds.forEach(territoryId => {
                // 兵庫県は上書きしない
                if (territoryId !== 28) {
                    this.territoryOwners[territoryId] = enemy.id;
                    this.territorTroops[territoryId] = 300;
                }
            });
        });

        // その他の領土をランダムに割り当て
        Object.keys(PREFECTURES).forEach(id => {
            const intId = parseInt(id);
            // territoryOwnersにキーが存在しない場合のみ割り当て
            if (!(intId in this.territoryOwners)) {
                const randomEnemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
                this.territoryOwners[intId] = randomEnemy.id;
                this.territorTroops[intId] = Math.floor(Math.random() * 200) + 100;
            }
        });
        
        // デバッグ: 兵庫県の設定確認
        console.log('兵庫県のオーナー:', this.territoryOwners[28]);
        console.log('兵庫県の兵力:', this.territorTroops[28]);
    }

    getPlayerColor(playerId) {
        if (playerId === 0) return this.playerColor;
        const enemy = ENEMIES.find(e => e.id === playerId);
        return enemy ? enemy.color : '#555555';
    }

    getPlayerName(playerId) {
        if (playerId === 0) return this.playerName;
        const enemy = ENEMIES.find(e => e.id === playerId);
        return enemy ? enemy.name : 'Unknown';
    }

    trainTroops(territoryId) {
        if (this.territoryOwners[territoryId] !== 0) {
            return { success: false, message: '自分の領土ではありません' };
        }

        if (this.gold < 100) {
            return { success: false, message: '資金が不足しています' };
        }

        this.gold -= 100;
        this.territorTroops[territoryId] = (this.territorTroops[territoryId] || 0) + 50;
        return { success: true, message: `${PREFECTURES[territoryId].name}に50の兵を追加しました` };
    }

    attackTerritory(attackFrom, attackTo) {
        // 攻撃できるか確認
        if (this.territoryOwners[attackFrom] !== 0) {
            return { success: false, message: '自分の領土ではありません' };
        }

        if (this.territoryOwners[attackTo] === 0) {
            return { success: false, message: '自分の領土には攻撃できません' };
        }

        if (!ADJACENT_TERRITORIES[attackFrom].includes(attackTo)) {
            return { success: false, message: '隣接していない領土には攻撃できません' };
        }

        const attackTroops = this.territorTroops[attackFrom] || 0;
        const defendTroops = this.territorTroops[attackTo] || 0;

        if (attackTroops < 50) {
            return { success: false, message: '兵力が足りません（最低50必要）' };
        }

        // 戦闘結果を計算
        const attackPower = attackTroops + Math.random() * 100;
        const defendPower = defendTroops + Math.random() * 100;

        if (attackPower > defendPower) {
            // 攻撃成功
            const defenderId = this.territoryOwners[attackTo];
            this.territoryOwners[attackTo] = 0;
            this.territorTroops[attackTo] = Math.floor(attackTroops * 0.5);
            this.territorTroops[attackFrom] -= Math.floor(attackTroops * 0.6);

            return { 
                success: true, 
                message: `${PREFECTURES[attackTo].name}を占領しました！\n${PREFECTURES[attackTo].message}`,
                conquered: true
            };
        } else {
            // 攻撃失敗
            this.territorTroops[attackFrom] -= Math.floor(attackTroops * 0.3);
            return { success: false, message: `${PREFECTURES[attackTo].name}の攻撃に失敗しました` };
        }
    }

    computerTurn() {
        // AI敵君主の行動
        ENEMIES.forEach(enemy => {
            // 自分の領土から隣接する敵領土や他人の領土に攻撃
            Object.keys(PREFECTURES).forEach(id => {
                const intId = parseInt(id);
                if (this.territoryOwners[intId] === enemy.id) {
                    const myTroops = this.territorTroops[intId] || 100;
                    const adjacent = ADJACENT_TERRITORIES[intId];
                    
                    adjacent.forEach(adjId => {
                        const adjOwner = this.territoryOwners[adjId];
                        // 自分の領土ではない場合に攻撃検討
                        if (adjOwner !== enemy.id) {
                            const enemyTroops = this.territorTroops[adjId] || 50;
                            
                            // プレイヤー領土（0）を優先攻撃：30%確率
                            // 他の敵領土：40%確率
                            const attackProbability = (adjOwner === 0) ? 0.3 : 0.4;
                            
                            if (Math.random() < attackProbability && myTroops > enemyTroops * 0.8) {
                                const attackResult = Math.random() * (myTroops + enemyTroops);
                                const defendResult = Math.random() * (enemyTroops + myTroops * 0.5);
                                
                                if (attackResult > defendResult) {
                                    // 攻撃成功
                                    this.territoryOwners[adjId] = enemy.id;
                                    const remaining = Math.floor(myTroops * 0.6);
                                    this.territorTroops[adjId] = remaining;
                                    this.territorTroops[intId] -= Math.floor(myTroops * 0.4);
                                }
                            }
                        }
                    });
                }
            });
        });

        // 敵の兵力増加
        Object.keys(PREFECTURES).forEach(id => {
            const intId = parseInt(id);
            const owner = this.territoryOwners[intId];
            if (owner !== 0) {
                this.territorTroops[intId] = Math.min(
                    (this.territorTroops[intId] || 0) + 10,
                    500
                );
            }
        });
    }

    endTurn() {
        this.turn++;

        // プレイヤーの領土から収入（各領土の経済力に基づいて計算）
        let income = 0;
        Object.keys(PREFECTURES).forEach(id => {
            const intId = parseInt(id);
            if (this.territoryOwners[intId] === 0) {
                income += PREFECTURES[intId].income;
            }
        });
        this.gold += income;

        // プレイヤーの兵力を自然回復
        Object.keys(PREFECTURES).forEach(id => {
            const intId = parseInt(id);
            if (this.territoryOwners[intId] === 0) {
                this.territorTroops[intId] = Math.min(
                    (this.territorTroops[intId] || 0) + 5,
                    500
                );
            }
        });

        // AI敵君主のターン
        this.computerTurn();
    }

    checkWinCondition() {
        let playerTerritories = 0;
        Object.values(this.territoryOwners).forEach(owner => {
            if (owner === 0) playerTerritories++;
        });

        return playerTerritories >= 47;
    }

    getPlayerStats() {
        let playerTerritories = 0;
        let totalTroops = 0;

        Object.keys(PREFECTURES).forEach(id => {
            const intId = parseInt(id);
            if (this.territoryOwners[intId] === 0) {
                playerTerritories++;
                totalTroops += this.territorTroops[intId] || 0;
            }
        });

        return {
            territories: playerTerritories,
            troops: totalTroops,
            gold: this.gold
        };
    }

    getTerritoryInfo(territoryId) {
        const pref = PREFECTURES[territoryId];
        const owner = this.territoryOwners[territoryId];
        const troops = this.territorTroops[territoryId] || 0;

        return {
            name: pref.name,
            owner: this.getPlayerName(owner),
            troops: troops,
            income: pref.income,
            isPlayerOwned: owner === 0
        };
    }
}

// ゲーム初期化
let gameState = null;
let gameMap = null;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-map');
    gameState = new GameState();
    gameMap = new GameMap(canvas);
    gameState.gameMap = gameMap;

    // イベントリスナー設定
    canvas.addEventListener('click', handleMapClick);
    document.getElementById('train-troops').addEventListener('click', handleTrainTroops);
    document.getElementById('attack-territory').addEventListener('click', handleAttack);
    document.getElementById('end-turn').addEventListener('click', handleEndTurn);

    // 初期描画
    updateUI();
    updateTerritoryInfo(28);
    gameMap.drawMap(gameState);
    
    // ゲームループ
    setInterval(() => {
        gameMap.drawMap(gameState);
    }, 100);
});

function handleMapClick(e) {
    const rect = gameMap.canvas.getBoundingClientRect();
    const scaleX = gameMap.canvas.width / rect.width;
    const scaleY = gameMap.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const territoryId = gameMap.getTerritoryAtPoint(x, y);
    if (territoryId) {
        gameMap.selectTerritory(territoryId);
        gameState.selectedTerritory = territoryId;
        updateTerritoryInfo(territoryId);
        gameMap.drawMap(gameState);
    }
}

function handleTrainTroops() {
    if (!gameState.selectedTerritory) {
        setLogMessage('領土を選択してください');
        return;
    }

    const result = gameState.trainTroops(gameState.selectedTerritory);
    setLogMessage(result.message);
    updateUI();
    gameMap.drawMap(gameState);
}

function handleAttack() {
    if (!gameState.selectedTerritory) {
        setLogMessage('領土を選択してください');
        return;
    }

    // プレイヤーの領土か確認
    if (gameState.territoryOwners[gameState.selectedTerritory] !== 0) {
        setLogMessage('自分の領土を選択してください');
        return;
    }

    // 隣接する敵領土を取得
    const adjacent = ADJACENT_TERRITORIES[gameState.selectedTerritory];
    const enemyTerritories = adjacent.filter(adjId => 
        gameState.territoryOwners[adjId] !== 0
    );

    if (enemyTerritories.length === 0) {
        setLogMessage('攻撃できる敵領土がありません');
        return;
    }

    // 攻撃対象選択メニューを表示
    showAttackTargetMenu(gameState.selectedTerritory, enemyTerritories);
}

function showAttackTargetMenu(fromTerritory, targetTerritories) {
    const buttonsHtml = targetTerritories.map(targetId => `
        <button class="attack-button" onclick="performAttack(${fromTerritory}, ${targetId})">
            ${PREFECTURES[targetId].name} (兵力: ${gameState.territorTroops[targetId]})
        </button>
    `).join('');

    document.getElementById('attack-title').textContent = 
        `${PREFECTURES[fromTerritory].name}から攻撃先を選択:`;
    document.getElementById('attack-buttons').innerHTML = buttonsHtml;

    const menuOverlay = document.getElementById('attack-menu-overlay');
    const menu = document.getElementById('attack-menu');
    
    menuOverlay.classList.add('visible');
    menu.classList.add('visible');

    // キャンセルボタンのイベント
    document.getElementById('cancel-attack').onclick = () => {
        menuOverlay.classList.remove('visible');
        menu.classList.remove('visible');
    };

    menuOverlay.onclick = () => {
        menuOverlay.classList.remove('visible');
        menu.classList.remove('visible');
    };
}

function performAttack(attackFrom, attackTo) {
    // メニューを閉じる
    document.getElementById('attack-menu-overlay').classList.remove('visible');
    document.getElementById('attack-menu').classList.remove('visible');

    const result = gameState.attackTerritory(attackFrom, attackTo);
    
    if (result.success) {
        showPopup(result.message);
    }
    
    setLogMessage(result.message.split('\n')[0]); // 最初の行だけログに表示
    
    if (result.success && gameState.checkWinCondition()) {
        setLogMessage('全領土を統一しました！ゲームクリア！');
    }

    updateUI();
    gameMap.drawMap(gameState);
}

function handleEndTurn() {
    gameState.endTurn();
    gameState.selectedTerritory = null;
    gameMap.selectedTerritory = null;
    
    if (gameState.checkWinCondition()) {
        setLogMessage('全領土を統一しました！ゲームクリア！');
    } else {
        setLogMessage(`ターン ${gameState.turn} 開始。コンピュータが行動しました。`);
    }

    updateUI();
    gameMap.drawMap(gameState);
}

function updateTerritoryInfo(territoryId) {
    const info = gameState.getTerritoryInfo(territoryId);
    const html = `
        <p><strong class="strong">${info.name}</strong></p>
        <p>支配者: ${info.owner}</p>
        <p>駐屯兵力: ${info.troops}</p>
        <p>月間収入: <span style="color: #f1c40f;">${info.income}G</span></p>
        <p>${info.isPlayerOwned ? '<span style="color: #2ecc71;">※ 自分の領土</span>' : '<span style="color: #e74c3c;">※ 敵の領土</span>'}</p>
    `;
    document.getElementById('territory-info').innerHTML = html;
}

function updateUI() {
    const stats = gameState.getPlayerStats();
    document.getElementById('turn-count').textContent = gameState.turn;
    document.getElementById('territory-count').textContent = stats.territories;
    document.getElementById('total-troops').textContent = stats.troops;
    document.getElementById('gold').textContent = gameState.gold;
}

function setLogMessage(message) {
    document.getElementById('log-message').textContent = message;
}

function showPopup(message) {
    const popup = document.getElementById('popup-message');
    const overlay = document.getElementById('popup-overlay');
    const text = document.getElementById('popup-text');
    
    text.textContent = message;
    popup.classList.add('visible');
    overlay.classList.add('visible');
    
    // 3秒後に自動的にポップアップを閉じる
    setTimeout(() => {
        closePopup();
    }, 3000);
    
    // クリックでもポップアップを閉じられるように
    overlay.onclick = closePopup;
    popup.onclick = closePopup;
}

function closePopup() {
    const popup = document.getElementById('popup-message');
    const overlay = document.getElementById('popup-overlay');
    
    popup.classList.remove('visible');
    overlay.classList.remove('visible');
}
