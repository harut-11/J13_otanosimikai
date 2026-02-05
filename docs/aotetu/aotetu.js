const urlParams = new URLSearchParams(window.location.search);
const playerCount = parseInt(urlParams.get('players')) || 4;
const maxYears = parseInt(urlParams.get('years')) || 1; // 設定年数

const CARD_DATA = [
  { name: "急行カード", type: "move", dice: 2, desc: "サイコロを2個振ることができます。" },
  { name: "特急カード", type: "move", dice: 3, desc: "サイコロを3個振ることができます。" },
  { name: "新幹線カード", type: "move", dice: 4, desc: "サイコロを4個振ることができます。" },
  { name: "1億円カード", type: "money", amount: 100000000, desc: "使うとその場で1億円が手に入ります。" },
  { name: "徳政令カード", type: "money", desc: "借金をゼロに戻します。" },
  { name: "ぶっとびカード", type: "warp", desc: "ランダムなマスへ飛びます。" }
];

const PROP_POOL = {
  low: [{ name: "おにぎり屋", price: 10000000, profit: 0.8 }, { name: "駄菓子屋", price: 5000000, profit: 1.0 }, { name: "地元定食屋", price: 30000000, profit: 0.4 }, { name: "たこ焼き屋", price: 50000000, profit: 0.5 }, { name: "うどん屋", price: 20000000, profit: 0.6 }],
  mid: [{ name: "観光農園", price: 100000000, profit: 0.2 }, { name: "ご当地デパート", price: 500000000, profit: 0.1 }, { name: "水産加工工場", price: 300000000, profit: 0.15 }, { name: "老舗旅館", price: 800000000, profit: 0.08 }, { name: "サファリパーク", price: 1200000000, profit: 0.06 }],
  high: [{ name: "高級ホテル", price: 3000000000, profit: 0.05 }, { name: "プロ球団", price: 5000000000, profit: 0.03 }, { name: "超高層ビル", price: 10000000000, profit: 0.02 }, { name: "自動車工場", price: 8000000000, profit: 0.04 }, { name: "リゾート開発", price: 15000000000, profit: 0.01 }]
};

const REGIONS = ["北海道", "東北","関東", "中部", "近畿", "中国", "四国", "九州"];
const TILE_TYPES = ['plus', 'minus', 'card', 'property', 'special'];
const TILES_PER_REGION = 10;
const TILE_COUNT = REGIONS.length * TILES_PER_REGION;

const players = Array.from({length: playerCount}, (_, i) => {
  const nameParam = urlParams.get(`n${i+1}`);
  return { id: i, name: nameParam ? decodeURIComponent(nameParam) : `プレイヤー${i+1}`, money: 0, pos: 0, color: ['#e63946', '#457b9d', '#2a9d8f', '#f4a261'][i], cards: [], hasBonby: false };
});

let turnIdx = 0; 
let passedYears = 0;
let totalTurns = 0; 
let currentDiceCount = 1; 
let cardUsedThisTurn = false; 
let canBuyNow = false; const map = []; 
let isBonbyActive = false;


function initMap() {
  map.length = 0; // 配列を空にする
  const tempTiles = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    let type = TILE_TYPES[i % TILE_TYPES.length];
    if (i === 0) type = 'start'; if (i === TILE_COUNT - 1) type = 'goal';
    tempTiles.push({ id: i, type });
  }
  const midTiles = tempTiles.slice(1, -1);
  for (let i = midTiles.length - 1; i > 0; i--) { 
    const j = Math.floor(Math.random() * (i + 1)); 
    [midTiles[i], midTiles[j]] = [midTiles[j], midTiles[i]]; 
  }
  const shuffledTiles = [tempTiles[0], ...midTiles, tempTiles[tempTiles.length - 1]];

  shuffledTiles.forEach((tile, i) => {
    const region = REGIONS[Math.floor(i / TILES_PER_REGION)];
    let title = ""; let properties = [];
    switch(tile.type) {
      case 'start': title = "(始)"; break; 
      case 'goal': title = "九州ゴール！"; break; 
      case 'plus': title = "プラス駅"; break; 
      case 'minus': title = "マイナス駅"; break; 
      case 'card': title = "カード駅"; break;
      case 'property': 
        title = `${region}の駅`;
        let pool = i < 20 ? [...PROP_POOL.low] : (i < 50 ? [...PROP_POOL.low, ...PROP_POOL.mid] : [...PROP_POOL.mid, ...PROP_POOL.high]);
        for(let j=0; j < (4 + Math.floor(Math.random() * 5)); j++) { 
            const tpl = pool[Math.floor(Math.random() * pool.length)]; 
            properties.push({...tpl, owner: null, stationName: title}); 
        }
        properties.sort((a, b) => a.price - b.price); break;
      case 'special': title = Math.random() < 0.2 ? "宝くじ駅" : "先生駅"; break;
    }
    map.push({ ...tile, id: i, region, title, properties });
  });
}

function render() {
  const displayYear = passedYears + 1;
  document.getElementById('yearLabel').textContent = `${displayYear}年目 / ${maxYears}年`;
  
  const tileLayer = document.getElementById('tile-layer');
  const cp = players[turnIdx];
  const currentRegion = REGIONS[Math.floor(cp.pos / TILES_PER_REGION)];
  document.getElementById('regionTitle').textContent = `📍 エリア: ${currentRegion}`;

  tileLayer.innerHTML = '';
  map.filter(t => t.region === currentRegion).forEach(t => {
    const div = document.createElement('div');
    div.className = `tile type-${t.type}`;
    div.innerHTML = `<b>${t.title}</b>`;
    players.filter(p => p.pos === t.id).forEach((p, idx) => {
      const token = document.createElement('div');
      token.className = 'player-token'; token.style.background = p.color; token.style.left = (idx * 15) + "px"; token.textContent = p.name ? p.name.charAt(0) : (p.id + 1);
      if(p.hasBonby) { const bonby = document.createElement('div'); bonby.className = 'bonby-mark'; bonby.textContent = '😈'; token.appendChild(bonby); }
      div.appendChild(token);
    });
    tileLayer.appendChild(div);
  });

  document.getElementById('currentPlayerDisplay').textContent = cp.name + (cp.hasBonby ? " (貧)" : "");
  document.getElementById('currentPlayerDisplay').style.color = cp.color;
  document.getElementById('moneyDisplay').innerHTML = formatMoneyJapanese(cp.money);
  
  const goalIndex = TILE_COUNT - 1;
  document.getElementById('playerList').innerHTML = [...players].sort((a,b)=>b.money-a.money).map(p=>{
  const remaining = goalIndex - p.pos;  
    return `<div>${(p.hasBonby?'😈':'')}${p.name}: ${formatMoneyJapanese(p.money)} <span style="color:#666;">(あと${remaining}マス)</span></div>`;
  }).join('');
  
  const inv = document.getElementById('inventory');
  inv.innerHTML = cp.cards.length === 0 ? "なし" : "";
  cp.cards.forEach((card, idx) => {
    const btn = document.createElement('button'); btn.className = "item-btn"; btn.textContent = card.name;
    btn.onmouseover = () => { document.getElementById('cardDesc').textContent = card.desc; };
    btn.onclick = () => useCard(idx);
    if (cardUsedThisTurn || document.getElementById('rollBtn').style.display === 'none') btn.disabled = true;
    inv.appendChild(btn);
  });

  const myProps = [];
  map.forEach(t => t.properties.forEach(pr => { if(pr.owner === cp.id) myProps.push(pr); }));
  document.getElementById('myPropertyList').innerHTML = myProps.length === 0 ? "なし" : myProps.map(pr => `<div class="prop-item">${pr.name} (${pr.stationName})</div>`).join('');
}

let isGoalReachedThisYear = false; 

// --- movePlayer 関数内のゴール到達判定部分を修正 ---
function movePlayer(dice) {
  let steps = 0;
  const p = players[turnIdx];
  let forward = true;

  const interval = setInterval(() => {
    // --- 移動ロジック ---
    if (forward) {
      if (p.pos === TILE_COUNT - 1) {
        forward = false; 
        p.pos--;
      } else {
        p.pos++;
      }
    } else {
      if (p.pos === 0) {
        forward = true;
        p.pos++;
      } else {
        p.pos--;
      }
    }

    if (isBonbyActive) checkBonbyTransfer(p);
    render();
    steps++;

    if (steps >= dice) {
      clearInterval(interval);

      // --- ゴール到達判定 ---
      if (p.pos === TILE_COUNT - 1) {
        
        // 【追加】① 誰かがゴールしたので、全員に物件配当（決算）を出す
        processSettlement();

        // 【追加】② 一番乗りボーナスの付与
        // ※isGoalReachedThisYear フラグは外部（グローバル）で定義されている前提
        let bonusMsg = "";
        if (!isGoalReachedThisYear) {
          p.money += 30000000;
          isGoalReachedThisYear = true; // その年度のボーナス終了
          bonusMsg = `<br>💰 <b>ゴール一番乗りボーナス：¥3,000万獲得！</b>`;
        }

        addLog(`🚩 <span style="color:${p.color}">${p.name}</span> が九州ゴールに到着！${bonusMsg}`);
        
        document.getElementById('rollBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'none';
        document.getElementById('endTurnBtn').disabled = true;

        const currentYearNum = passedYears + 1;

        if (currentYearNum >= maxYears) {
            setTimeout(() => {
                alert(`${p.name} がゴール！${maxYears}年間の全日程を終了しました。`);
                showFinalResults();
            }, 500);
        } else {
            setTimeout(() => {
                alert(`${p.name} がゴール！年度末決算を行い、次の年へ進みます。`);

                passedYears++; 
                isGoalReachedThisYear = false; // 【追加】次年度のためにフラグをリセット

                // --- 貧乏神の割り当て ---
                players.forEach(pl => pl.hasBonby = false);
                let farthestPlayer = players.reduce((prev, curr) => {
                    return (prev.pos < curr.pos) ? prev : curr;
                });
                farthestPlayer.hasBonby = true;
                isBonbyActive = true; 

                // 2. プレイ順の並び替え
                players.sort((a, b) => b.pos - a.pos);

                addLog(`😈 貧乏神は最後尾の <span style="color:${farthestPlayer.color}">${farthestPlayer.name}</span> につきました。`);

                // 3. リセット処理
                players.forEach(pl => pl.pos = 0);
                initMap();
                
                totalTurns = 0; 
                turnIdx = 0; 
                
                addLog(`🚀 ${passedYears + 1}年目スタート！`);
                render(); 

                document.getElementById('rollBtn').style.display = 'block';
                addLog(`🎲 ${players[turnIdx].name} の番です。`);
            }, 500);
        }
        return;
      } else {
        handleLanding(p);
      }
    }
  }, 150);
}


function checkBonbyTransfer(movingPlayer) {
  if (!isBonbyActive) return;
  
  players.forEach(p => {
    if (p !== movingPlayer && p.pos === movingPlayer.pos) {
      // 同じマスに誰かいたら、動いているプレイヤーの状態に関わらず
      // 「今貧乏神を持っている人」から「持っていない人」へ移る（なすりつけ）
      const bonbyOwner = players.find(pl => pl.hasBonby);
      if (bonbyOwner && (bonbyOwner === movingPlayer || bonbyOwner === p)) {
        if (bonbyOwner === movingPlayer) {
          movingPlayer.hasBonby = false;
          p.hasBonby = true;
          addLog(`😈 貧乏神が <span style="color:${movingPlayer.color}">${movingPlayer.name}</span> から <span style="color:${p.color}">${p.name}</span> に移った！`);
        } else {
          p.hasBonby = false;
          movingPlayer.hasBonby = true;
          addLog(`😈 貧乏神が <span style="color:${p.color}">${p.name}</span> から <span style="color:${movingPlayer.color}">${movingPlayer.name}</span> に移った！`);
        }
      }
    }
  });
}

function assignBonbyToFarthest() {
  if (!isBonbyActive) return;

  // 全員のフラグを一旦解除
  players.forEach(p => p.hasBonby = false);

  // 一番位置(pos)が小さいプレイヤー（＝スタートに近く、ゴールから遠い人）を探す
  let farthestPlayer = players[0];
  players.forEach(p => {
    if (p.pos < farthestPlayer.pos) {
      farthestPlayer = p;
    }
  });

  farthestPlayer.hasBonby = true;
  addLog(`😈 貧乏神は現在最後尾の <span style="color:${farthestPlayer.color}">${farthestPlayer.name}</span> につきました。`);
  render();
}

function handleLanding(p) {
  const t = map[p.pos];
  document.getElementById('tileInfo').innerHTML = `<b>${t.title}</b>`;
  if (t.type === 'plus' || t.type === 'minus') {
    startRoulette(t.type, (val) => {
      const amount = val * 1000;
      if (t.type === 'plus') { p.money += amount; addLog(`${p.name}: +${formatMoneyJapanese(amount)}`); }
      else { p.money -= amount; addLog(`${p.name}: -${formatMoneyJapanese(amount)}`); }
      finishTurn();
    });
  } else if (t.type === 'card') {
    startRoulette('card', (card) => { p.cards.push({...card}); addLog(`${p.name}: 「${card.name}」を入手`); finishTurn(); });
  } else if (t.type === 'special') {
    if (t.title === "宝くじ駅") { startRoulette('lottery', (prize) => { p.money += prize.amount; addLog(`${p.name}: 宝くじ当選！`); finishTurn(); }); }
    else { startRoulette('teacher', (event) => { if(event.type === "money") p.money += event.val; if(event.type === "card") p.cards.push(event.val); addLog(`${p.name}: ${event.msg}`); finishTurn(); }); }
  } else if (t.type === 'property') {
    canBuyNow = true; updatePropertyUI(p, t); finishTurn();
  } else { finishTurn(); }
}

function updatePropertyUI(p, t) {
  let html = `<b>📍 ${t.title}</b><div style="margin-top:5px;">`;
  t.properties.forEach((prop, idx) => {
    const isOwned = prop.owner !== null;
    html += `<div class="prop-item"><span>${prop.name}<br><small>${formatMoneyJapanese(prop.price)}</small></span>
    <button class="prop-btn" onclick="buyProp(${p.id}, ${t.id}, ${idx})" ${(isOwned || !canBuyNow) ? 'disabled' : ''}>${isOwned ? (prop.owner === p.id ? '所有中' : '売約済') : '購入'}</button></div>`;
  });
  document.getElementById('tileInfo').innerHTML = html + `</div>`;
}

window.buyProp = (pid, tid, pidx) => {
  const p = players[pid]; const prop = map[tid].properties[pidx];
  if(p.money >= prop.price) { p.money -= prop.price; prop.owner = pid; addLog(`${p.name}: ${prop.name}を購入`); updatePropertyUI(p, map[tid]); render(); }
  else { alert("資金不足です！"); }
};
function startRoulette(mode, callback) {
  const overlay = document.getElementById('slotOverlay');
  const display = document.getElementById('slotMachine');
  const title = document.getElementById('slotTitle');
  const stopBtn = document.getElementById('slotStopBtn');

  const lotteryGrades = [
    { name: "1等: 10億円", amount: 1000000000 },
    { name: "2等: 5億円", amount: 500000000 },
    { name: "3等: 1億円", amount: 100000000 },
    { name: "4等: 1000万円", amount: 10000000 },
    { name: "5等: 100万円", amount: 1000000 },
    { name: "はずれ", amount: 0 }
  ];

  const teacherEvents = [
    { msg: "遅刻した！坪内先生に怒られた！3000万失う", type: "money", val: -30000000, label: "遅刻した！坪内先生(怒)3000万失う" },
    { 
      msg: "内定出た！！志摩先生からご褒美！カードをもらう", 
      type: "card", 
      val: () => CARD_DATA[Math.floor(Math.random() * CARD_DATA.length)], 
      label: "内定出た！志摩先生(祝)ご褒美としてカードをもらう" 
    },
    { msg: "坪内先生に励まされた！2000万もらう", type: "money", val: 20000000, label: "坪内先生(励)2000万もらう" },
    { msg: "三輪先生に叱られた！1000万失う", type: "money", val: -10000000, label: "三輪先生(叱)1000万失う" }
  ];

  if (mode === 'plus') title.textContent = "プラス駅：ボーナス！";
  else if (mode === 'minus') title.textContent = "マイナス駅：支払い発生！";
  else if (mode === 'card') title.textContent = "カード駅：カードを引く";
  else if (mode === 'lottery') title.textContent = "宝くじ駅：抽選開始！";
  else if (mode === 'teacher') title.textContent = "先生駅：運命のダーツ！";

  overlay.style.display = 'flex';
  stopBtn.style.display = 'block';
  
  let timer;
  if (mode === 'teacher') {
    display.innerHTML = '<div class="darts-spin"><img src="../pictures/sensei.png"></div>';
  } else {
    timer = setInterval(() => {
      if (mode === 'card') display.textContent = CARD_DATA[Math.floor(Math.random()*CARD_DATA.length)].name;
      else if (mode === 'lottery') display.textContent = lotteryGrades[Math.floor(Math.random()*lotteryGrades.length)].name;
      else display.textContent = formatMoneyJapanese(Math.floor(Math.random() * 5000) * 1000);
    }, 80);
  }

  stopBtn.onclick = () => {
    if (stopBtn.style.display === 'none') return; // 連打防止
    clearInterval(timer);
    stopBtn.style.display = 'none';
    let result;
    if (mode === 'teacher') {
      const eventTpl = teacherEvents[Math.floor(Math.random() * teacherEvents.length)];
      display.innerHTML = `<div>${eventTpl.label}！</div>`;
      result = { ...eventTpl, val: (typeof eventTpl.val === 'function' ? eventTpl.val() : eventTpl.val) };
    } else if (mode === 'lottery') {
      result = lotteryGrades[Math.floor(Math.random() * lotteryGrades.length)];
      display.textContent = result.name;
    } else if (mode === 'card') {
      result = CARD_DATA[Math.floor(Math.random() * CARD_DATA.length)];
      display.textContent = result.name;
    } else {
      const val = (Math.floor(Math.random()*5000)+1000);
      display.textContent = formatMoneyJapanese(val * 1000);
      result = val;
    }
    setTimeout(() => {
      overlay.style.display = 'none';
      callback(result);
    }, 1500);
  };
}

document.getElementById('endTurnBtn').onclick = () => {
  const cp = players[turnIdx]; if (cp.hasBonby) triggerBonbyEvil(cp);
  const monthCount = Math.floor(totalTurns / players.length);
  
  // 終了判定
  // const totalMonthsPassed = Math.floor((totalTurns + 1) / players.length);
  // if (totalMonthsPassed >= maxYears * 12) {
  //   showFinalResults();
  //   return;
  // }
  // ↑ このブロックをすべてコメントアウト、または削除します

  canBuyNow = false; document.getElementById('endTurnBtn').disabled = true; document.getElementById('rollBtn').style.display = 'block';
  turnIdx = (turnIdx + 1) % players.length; totalTurns++; currentDiceCount = 1; cardUsedThisTurn = false;
  updateDiceVisuals(); render();
};

function showFinalResults() {
  const overlay = document.getElementById('resultOverlay');
  const rankingList = document.getElementById('finalRankings');
  const sorted = [...players].sort((a, b) => b.money - a.money);
  rankingList.innerHTML = sorted.map((p, i) => `<div>${i+1}位: ${p.name} <br> <span style="font-weight:bold; color:#2a9d8f;">${p.money.toLocaleString()}</span></div>`).join('');
  overlay.style.display = 'flex';
}

function triggerBonbyEvil(p) {
  const loss = 5000000 + Math.floor(Math.random() * 10) * 1000000;
  p.money -= loss; addLog(`😈 貧乏神: ${p.name} から ${loss.toLocaleString()} 奪った！`);
}

function updateDiceVisuals() {
  const diceScene = document.getElementById('diceScene'); diceScene.innerHTML = '';
  for (let i = 0; i < currentDiceCount; i++) {
    const cube = document.createElement('div'); cube.className = 'dice-cube';
    cube.innerHTML = `<div class=\"dice-face face-1\">1</div><div class=\"dice-face face-2\">2</div><div class=\"dice-face face-3\">3</div><div class=\"dice-face face-4\">4</div><div class=\"dice-face face-5\">5</div><div class=\"dice-face face-6\">6</div>`;
    diceScene.appendChild(cube);
  }
}

// --- サイコロ操作：ストップボタンの即時非表示化 ---
document.getElementById('rollBtn').onclick = () => {
  // 連打防止
  if (document.getElementById('rollBtn').style.display === 'none') return;
  
  document.getElementById('rollBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display = 'block';
  document.querySelectorAll('.dice-cube').forEach(c => c.classList.add('dice-rolling'));
};

document.getElementById('stopBtn').onclick = () => {
  // ストップボタンを即座に消して連打を防止
  document.getElementById('stopBtn').style.display = 'none';
  
  let total = 0; 
  const rots = {1:'rotateY(0deg)', 2:'rotateY(-90deg)', 3:'rotateX(-90deg)', 4:'rotateX(90deg)', 5:'rotateY(90deg)', 6:'rotateY(180deg)'};
  
  document.querySelectorAll('.dice-cube').forEach((cube) => { 
    cube.classList.remove('dice-rolling'); 
    const res = Math.floor(Math.random() * 6) + 1; 
    total += res; 
    cube.style.transform = rots[res]; 
  });

  // 少し待ってから移動開始
  setTimeout(() => { 
    movePlayer(total); 
  }, 800);
};

function useCard(idx) {
  if (cardUsedThisTurn || document.getElementById('rollBtn').style.display === 'none') return;
  const cp = players[turnIdx];
  const card = cp.cards[idx];
  
  if (card.type === "move") { 
    currentDiceCount = card.dice; 
    updateDiceVisuals(); 
  } else if (card.type === "warp") { 
    cp.pos = Math.floor(Math.random() * TILE_COUNT); 
    addLog(`${cp.name}: ${card.name}でどこかへ飛んだ！`);
    if (isBonbyActive) assignBonbyToFarthest();
  } else if (card.type === "money") { 
    
    // 1. 徳政令カードの場合の処理
    if (card.name === "徳政令カード") {
      let savedCount = 0;
      players.forEach(p => {
        if (p.money < 0) {
          p.money = 0;
          savedCount++;
        }
      });

      if (savedCount > 0) {
        addLog(`📜 ${cp.name} が徳政令カードを発動！全プレイヤーの借金が帳消しになった！`);
      } else {
        addLog(`${cp.name} は徳政令カードを使ったが、誰も借金していなかった。`);
      }
    } 
    // 2. それ以外の「お金がもらえるカード」（1億円カードなど）の処理
    else if (card.amount) {
      cp.money += card.amount;
      addLog(`💰 ${cp.name} は ${card.name} を使った！ ${formatMoneyJapanese(card.amount)} 手に入れた！`);
    }
  }
  
  cp.cards.splice(idx, 1); 
  cardUsedThisTurn = true; 
  render();
}

function finishTurn() { 

    document.getElementById('endTurnBtn').disabled = false; 
    render(); 
}
function addLog(m) { 
    const e = document.createElement('div'); 
    e.innerHTML = m; 
    document.getElementById('log').prepend(e); 
}

// 金額を「〇億〇万円」形式に変換する関数
function formatMoneyJapanese(amount) {
  if (amount === 0) return "0円";
  
  const absAmount = Math.abs(amount);
  const oku = Math.floor(absAmount / 100000000);
  const man = Math.floor((absAmount % 100000000) / 10000);
  
  let text = "";
  if (oku > 0) text += oku + "億";
  if (man > 0) text += man + "万";
  if (oku === 0 && man === 0) text += "0"; 
  
  const formatted = (amount < 0 ? "-" : "") + text + "円";
  
  // 借金（マイナス）の場合は CSSクラス「money-minus」を適用する
  if (amount < 0) {
    return `<span class="money-minus">${formatted}</span>`;
  }
  return formatted;
}

function processSettlement() {
  addLog(`💰 <b style="color:#f39c12;">ゴール達成につき年度末決算！物件収益が入ります。</b>`);
  players.forEach(p => {
    let yearlyProfit = 0;
    map.forEach(t => {
      if (t.properties) {
        t.properties.forEach(pr => {
          if (pr.owner === p.id) {
            yearlyProfit += Math.floor(pr.price * pr.profit);
          }
        });
      }
    });
    if (yearlyProfit > 0) {
      p.money += yearlyProfit;
      addLog(`${p.name}: 物件利益 +${formatMoneyJapanese(yearlyProfit)}`);
    }
  });
}

initMap(); 
updateDiceVisuals(); 
render();
