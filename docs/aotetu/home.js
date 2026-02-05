window.onload = generateInputFields;
function generateInputFields() {
    const count = document.getElementById('playerCount').value;
    const container = document.getElementById('nameFields');
    container.innerHTML = "";
    for (let i = 1; i <= count; i++) {
        container.innerHTML += `
            <div class="player-input-row">
                <span>${i}人目:</span>
                <input type="text" class="player-name" value="プレイヤー${i}" maxlength="10">
            </div>`;
    }
}
function startGame() {
    const count = document.getElementById('playerCount').value;
    const years = document.getElementById('gameYears').value;
    const nameInputs = document.querySelectorAll('.player-name');
    let url = `aotetu.html?players=${count}&years=${years}`;
    nameInputs.forEach((input, index) => {
        const name = input.value.trim() || `プレイヤー${index + 1}`;
        url += `&n${index + 1}=${encodeURIComponent(name)}`;
    });
    location.href = url;
}
