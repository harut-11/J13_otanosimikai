// マップ描画とインタラクション処理
class GameMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.selectedTerritory = null;
    }

    drawMap(gameState) {
        // 背景をクリア（日本地図の背景色）
        this.ctx.fillStyle = '#4a7ba7';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッドを描画
        this.drawGrid();

        // 県同士の隣接関係を線で表示
        this.drawTerritoryConnections();

        // 領土を描画
        this.drawTerritories(gameState);

        // 選択された領土をハイライト
        if (this.selectedTerritory) {
            this.highlightTerritory(this.selectedTerritory);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#3a5f7f';
        this.ctx.lineWidth = 0.5;
        const gridSize = 50;

        for (let i = 0; i < this.canvas.width; i += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }

        for (let i = 0; i < this.canvas.height; i += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }

    drawTerritoryConnections() {
        this.ctx.strokeStyle = '#2a4f6f';
        this.ctx.lineWidth = 1;

        Object.keys(ADJACENT_TERRITORIES).forEach(id => {
            const pref = PREFECTURES[id];
            ADJACENT_TERRITORIES[id].forEach(adjId => {
                if (adjId > id) {
                    const adjPref = PREFECTURES[adjId];
                    this.ctx.beginPath();
                    this.ctx.moveTo(pref.x, pref.y);
                    this.ctx.lineTo(adjPref.x, adjPref.y);
                    this.ctx.stroke();
                }
            });
        });
    }

    drawTerritories(gameState) {
        Object.keys(PREFECTURES).forEach(id => {
            const pref = PREFECTURES[id];
            const owner = gameState.territoryOwners[id];
            const troops = gameState.territorTroops[id] || 0;

            // 領土の円を描画
            this.ctx.fillStyle = owner ? gameState.getPlayerColor(owner) : '#888888';
            this.ctx.beginPath();
            this.ctx.arc(pref.x, pref.y, 18, 0, Math.PI * 2);
            this.ctx.fill();

            // 領土の境界線
            this.ctx.strokeStyle = owner ? gameState.getPlayerColor(owner) : '#999999';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            // 領土のアイコン背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(pref.x, pref.y, 17, 0, Math.PI * 2);
            this.ctx.fill();

            // 領土名を描画
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 7px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const displayName = pref.name.length > 4 ? pref.name.substring(0, 4) : pref.name;
            this.ctx.fillText(displayName, pref.x, pref.y - 5);

            // 兵力を描画
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.fillText(troops, pref.x, pref.y + 6);
        });
    }

    highlightTerritory(territoryId) {
        const pref = PREFECTURES[territoryId];
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(pref.x, pref.y, 24, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    getTerritoryAtPoint(x, y) {
        for (const [id, pref] of Object.entries(PREFECTURES)) {
            const distance = Math.sqrt((pref.x - x) ** 2 + (pref.y - y) ** 2);
            if (distance <= 18) {
                return parseInt(id);
            }
        }
        return null;
    }

    selectTerritory(territoryId) {
        this.selectedTerritory = territoryId;
    }
}
