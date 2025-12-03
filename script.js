const GAME_URL = "https://kato-game-1.onrender.com";
const teachers = {
    1: { name: "kato", label: "Math / Kato", target: 15, speed: 1.0, blackboard: "y = ax² + ...", face:"kato-face", bg:"bg-classroom", skill:"逆回転時計" },
    2: { name: "matsuda", label: "English / Matsuda", target: 20, speed: 1.2, blackboard: "Open your textbook...", face:"matsuda-face", bg:"bg-classroom", skill:"没収ランチ" },
    3: { name: "sugawara", label: "Music / Sugawara", target: 25, speed: 0.8, blackboard: "♪ ~ ♫ ~ ♪", face:"sugawara-face", bg:"bg-music", skill:"フォルテシモ" },
    4: { name: "fukumorita", label: "Boss / Fukumorita", target: 30, speed: 1.5, blackboard: "FUTURE PATH...", face:"fukumorita-face", bg:"bg-classroom", skill:"神速巡回" },
    5: { name: "sudo", label: "Social / Sudo", target: 35, speed: 1.1, blackboard: "1192 Kamakura...", face:"sudo-face", bg:"bg-classroom", skill:"歴史の重み" },
    6: { name: "otani", label: "Classic / Otani", target: 40, speed: 1.3, blackboard: "Haru wa Akebono...", face:"otani-face", bg:"bg-classroom", skill:"儚き夢" },
    7: { name: "matsumura", label: "Science / Matsumura", target: 45, speed: 0.9, blackboard: "H2O + CO2...", face:"matsumura-face", bg:"bg-science", skill:"劇薬散布" },
    8: { name: "aota", label: "FINAL / Principal Aota", target: 60, speed: 2.0, blackboard: "SILENCE IS GOLD", face:"aota-face", bg:"bg-principal", skill:"絶対威圧" },
    9: { name: "endless", label: "ENDLESS SURVIVAL", target: 9999, speed: 1.0, blackboard: "SURVIVAL MODE", face:"fukumorita-face", bg:"bg-classroom", skill:"ランダム" }
};
const skillData = {
    "kato": { name: "加藤の時計", desc: "【A】時間を3秒止める", active: true, icon: "⏱️" },
    "matsuda": { name: "松田のランチ", desc: "【P】ライフ+1", active: false, icon: "❤️" },
    "sugawara": { name: "菅原のタクト", desc: "【P】睡眠速度1.5倍", active: false, icon: "🎵" },
    "fukumorita": { name: "福盛田のスニーカー", desc: "【P】寝るほど加速(最大3倍)", active: false, icon: "👟" },
    "sudo": { name: "須藤の暗記カード", desc: "【A】一瞬で5秒分スコア獲得", active: true, icon: "📜" },
    "otani": { name: "大谷の和歌", desc: "【P】先生が見る時間が短くなる", active: false, icon: "🌸" },
    "matsumura": { name: "松村の劇薬", desc: "【A】5秒間無敵になる", active: true, icon: "🧪" },
    "aota": { name: "校長のジャケット", desc: "【P】睡眠速度5.0倍", active: false, icon: "🧥" }
};
const dialogues = {
    1: { t: "こんなんで寝てんだったら\nお前もうマジで知らん。", s: "まさか！寝るわけないです！\n(今のうちに...)" },
    2: { t: "Sleeping is... death.", s: "No, no! I love English!\n(zzz...)" },
    3: { t: "しゃーべると... こんな... かんじ...", s: "（喋り方が遅くて眠くなる...）" },
    4: { t: "アディ...ダス...？", s: "（ナイキです先生...）" },
    5: { t: "鎌倉幕府を滅亡させます。", s: "平和にいきましょうよ...\n（スヤァ）" },
    6: { t: "春はあけぼの...だが、\n君の寝顔は風流ではないな。", s: "いと眠し...です..." },
    7: { t: "ちょっとお腹が鳴っちゃったな。", s: "（今のうちに寝よう）" },
    8: { t: "我が校は100年の歴史を誇る伝統校である。\nその校長である私の御前で眠ろうなど、\n言語道断！貴様の覚悟、見せてもらおうか！", s: "（話が長い...おやすみなさい）" },
    9: { t: "終わらない悪夢へようこそ...", s: "（記録更新してやる！）" }
};

const teacherNames = ["kato", "matsuda", "sugawara", "fukumorita", "sudo", "otani", "matsumura", "aota"];

let playerName = localStorage.getItem("soichiPlayerName") || "";
let unlockedStage = parseInt(localStorage.getItem("soichiGameStage")) || 1;
let unlockedPowers = JSON.parse(localStorage.getItem("soichiPowers")) || [];
let stageRanks = JSON.parse(localStorage.getItem("soichiRanks")) || {};

let equippedPower = localStorage.getItem("soichiEquippedPower");
if (equippedPower === "null") equippedPower = null;

let currentMenuStage = (unlockedStage > 8) ? 8 : unlockedStage; 
let battleStage = 1;

let justCleared = false;
let hp = 3, sleepTime = 0, isSleeping = false, isTeacherLooking = false, isInvincible = false;
let gameLoopId, teacherTimerId, zzzInterval, isGodMode = false, tapCount = 0, endlessSpeed = 1.0;
let isTimeStopped = false, sleepContinuous = 0;
let dialogueStep = 0;
let isInputBlocked = false;

let skillCoolDown = false; 
let isParryWindowOpen = false;
let isParried = false;

const AudioContext = window.AudioContext || window.webkitAudioContext; let audioCtx;
function initAudio() { try { if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){} }
function playSound(type) {
    try {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
        if (type === 'dead') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(50, now+0.3); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now+0.3); osc.start(now); osc.stop(now+0.3); }
        else if (type === 'clear') { osc.type = 'square'; osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(880, now+0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now+0.3); osc.start(now); osc.stop(now+0.3); }
        else if (type === 'skill') { osc.type = 'sine'; osc.frequency.setValueAtTime(880, now); osc.frequency.linearRampToValueAtTime(1760, now+0.5); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now+0.5); osc.start(now); osc.stop(now+0.5); }
        else if (type === 'cutin') { osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(100, now+0.3); gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now+0.3); osc.start(now); osc.stop(now+0.3); }
        else if (type === 'parry') { osc.type = 'square'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(2000, now+0.1); gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now+0.2); osc.start(now); osc.stop(now+0.2); }
    } catch(e){}
}

window.onload = function() {
    if(!playerName) {
        document.getElementById("name-screen").classList.remove("hidden");
    } else {
        initMenu();
        document.getElementById("menu-screen").classList.remove("hidden");
    }
};

function submitName() {
    const input = document.getElementById("player-name-input");
    if(input.value.trim() === "") return;
    playerName = input.value.trim();
    localStorage.setItem("soichiPlayerName", playerName);
    document.getElementById("name-screen").classList.add("hidden");
    initMenu();
    document.getElementById("menu-screen").classList.remove("hidden");
}

function changeName() {
    const input = document.getElementById("config-name-input");
    if(input.value.trim() !== "") {
        playerName = input.value.trim();
        localStorage.setItem("soichiPlayerName", playerName);
        alert("名前を変更しました");
    }
}

function initMenu() {
    if (!localStorage.getItem("soichiTutorialSeen")) {
        openTutorial();
        localStorage.setItem("soichiTutorialSeen", "true");
    }
    currentMenuStage = (unlockedStage > 8) ? 8 : unlockedStage;
    updateMenuVisuals(currentMenuStage);
    
    const endlessBtn = document.getElementById("endless-btn");
    const ngBtn = document.getElementById("ng-plus-btn");
    if (unlockedStage >= 9) {
        endlessBtn.style.display = "block";
        ngBtn.style.display = "block";
    } else {
        endlessBtn.style.display = "none";
        ngBtn.style.display = "none";
    }
    renderEquipMenu();
    document.getElementById("config-name-input").value = playerName;
}

function changeStage(dir) {
    let max = (unlockedStage > 8) ? 8 : unlockedStage;
    let next = currentMenuStage + dir;
    if (next < 1) next = max;
    if (next > max) next = 1;
    currentMenuStage = next;
    updateMenuVisuals(currentMenuStage);
}

function updateMenuVisuals(stageNum) {
    const t = teachers[stageNum];
    const rivalSprite = document.getElementById("menu-rival-sprite");
    const rivalName = document.getElementById("menu-rival-name");
    const rankDisplay = document.getElementById("menu-rank-display");
    const leftArrow = document.getElementById("arrow-left");
    const rightArrow = document.getElementById("arrow-right");
    
    if (unlockedStage <= 1) { leftArrow.style.display = "none"; rightArrow.style.display = "none"; } 
    else { leftArrow.style.display = "flex"; rightArrow.style.display = "flex"; }
    
    rivalSprite.className = `sprite ${t.face}`;
    rivalName.textContent = t.label;
    
    const rank = stageRanks[stageNum];
    rankDisplay.classList.remove("god");
    if (rank) {
        rankDisplay.textContent = rank;
        rankDisplay.style.display = "flex";
        if (rank === "チート") rankDisplay.classList.add("god");
    } else {
        rankDisplay.style.display = "none";
    }
}

function renderEquipMenu() {
    const descEl = document.getElementById("equip-desc");
    if (equippedPower && skillData[equippedPower]) {
        document.getElementById("current-equip").textContent = `装備中: ${skillData[equippedPower].name}`;
        descEl.textContent = skillData[equippedPower].desc;
    } else {
        document.getElementById("current-equip").textContent = "装備なし";
        descEl.textContent = "アイコンをタップで詳細表示";
    }
    Object.keys(skillData).forEach(p => {
        const el = document.getElementById(`skill-${p}`);
        if(el) {
            if (unlockedPowers.includes(p)) { el.style.display = "flex"; el.classList.add("unlocked"); } else { el.style.display = "none"; }
            if (equippedPower === p) el.classList.add("selected"); else el.classList.remove("selected");
        }
    });
}

function equipSkill(power) {
    const descEl = document.getElementById("equip-desc");
    descEl.textContent = skillData[power].desc;
    if (equippedPower === power) equippedPower = null; else equippedPower = power;
    localStorage.setItem("soichiEquippedPower", equippedPower);
    renderEquipMenu();
}

function openConfig() { document.getElementById("config-modal").style.display = "flex"; }
function closeConfig() { document.getElementById("config-modal").style.display = "none"; }
function openTutorial() { document.getElementById("tutorial-modal").style.display = "flex"; }
function closeTutorial() { document.getElementById("tutorial-modal").style.display = "none"; }

function newGamePlus() {
    if(confirm("能力はそのままで、ステージ1から始めますか？")) {
        localStorage.setItem("soichiGameStage", 1);
        localStorage.removeItem("soichiRanks");
        location.reload();
    }
}
function hardReset() {
    if(confirm("本当に全てのデータを消して初期化しますか？")) {
        localStorage.clear();
        location.reload();
    }
}

document.getElementById("game-title").addEventListener("click", () => { tapCount++; if(tapCount >= 7 && !isGodMode) { isGodMode = true; document.getElementById("cheat-msg").style.display = "block"; document.getElementById("game-title").classList.add("god-mode"); alert("隠しコマンド成功！無敵モードON！"); } });

function startSequence() { startDialogue(currentMenuStage); }
function startEndless() { startDialogue(9); }

function startDialogue(st) {
    battleStage = st;
    dialogueStep = 0;
    const d = dialogues[st] || { t: "...", s: "..." };
    document.getElementById("menu-screen").classList.add("hidden");
    document.getElementById("dialogue-screen").style.display = "flex";
    document.getElementById("diag-name").textContent = teachers[st].label.split(" / ")[1] || "TEACHER";
    document.getElementById("diag-name").className = "dialogue-name name-teacher";
    document.getElementById("diag-text").textContent = d.t;
}

function nextDialogue() {
    dialogueStep++;
    const st = battleStage;
    const d = dialogues[st] || { t: "...", s: "..." };
    if (dialogueStep === 1) {
        document.getElementById("diag-name").textContent = playerName || "YOU";
        document.getElementById("diag-name").className = "dialogue-name name-you";
        document.getElementById("diag-text").textContent = d.s;
    } else {
        document.getElementById("dialogue-screen").style.display = "none";
        showVsCutin();
    }
}

function showVsCutin() {
    const screen = document.getElementById("cutin-screen");
    const img = document.getElementById("cutin-img");
    const txt = document.getElementById("cutin-text");
    const t = teachers[battleStage];
    img.className = `cutin-teacher ${t.face}`;
    txt.textContent = t.label.split(" / ")[1] || "TEACHER";
    screen.style.display = "flex";
    playSound('cutin');
    setTimeout(() => { screen.style.display = "none"; realStartBattle(); }, 2000);
}

function realStartBattle() {
    initAudio();
    if(gameLoopId) clearInterval(gameLoopId);
    if(teacherTimerId) clearTimeout(teacherTimerId);
    
    hp = (equippedPower === 'matsuda') ? 4 : 3;
    isTimeStopped = false; sleepContinuous = 0; isInvincible = false;
    
    isSleeping = false; 
    isInputBlocked = true; 
    skillCoolDown = false;
    isParryWindowOpen = false;
    setTimeout(() => { isInputBlocked = false; }, 500); 
    
    const skillBtn = document.getElementById("active-skill-btn");
    if (equippedPower && skillData[equippedPower].active) {
        skillBtn.style.display = "flex"; 
        skillBtn.classList.remove("cooldown");
        skillBtn.textContent = skillData[equippedPower].icon;
    } else { 
        skillBtn.style.display = "none"; 
    }
    
    sleepTime = 0; isTeacherLooking = false; endlessSpeed = 1.0;
    document.getElementById("game-screen").classList.remove("hidden");
    
    const t = teachers[battleStage];
    const gameScreen = document.getElementById("game-screen");
    gameScreen.className = `screen ${t.bg}`;
    const timeFilter = document.getElementById("time-filter");
    timeFilter.className = "";
    if (battleStage >= 4 && battleStage <= 6) timeFilter.className = "time-sunset";
    if (battleStage >= 7) timeFilter.className = "time-night";
    document.getElementById("blackboard-text").textContent = t.blackboard;
    document.getElementById("target-score").textContent = (battleStage===9) ? "∞" : t.target;
    document.getElementById("student-sprite").className = "sprite student-awake"; 
    
    const overlay = document.getElementById("start-overlay");
    overlay.style.display = "block";
    setTimeout(() => { overlay.style.display = "none"; }, 1000);

    updateHearts(); updateProgress(); updateTeacherBehavior();
    gameLoopId = setInterval(gameLoop, 100);
}

function exitBattle() {
    clearInterval(gameLoopId);
    clearTimeout(teacherTimerId);
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("menu-screen").classList.remove("hidden");
    initMenu();
}

window.activateActiveSkill = function(event) {
    if(event) event.stopPropagation(); 
    if(isInputBlocked) return;
    const btn = document.getElementById("active-skill-btn");
    if (btn.classList.contains("cooldown")) return;
    playSound('skill');
    btn.classList.add("cooldown");
    if (equippedPower === 'kato') {
        isTimeStopped = true; isTeacherLooking = false; clearTimeout(teacherTimerId);
        const sprite = document.getElementById("teacher-sprite");
        let tName = getTeacherName(battleStage, sprite);
        sprite.className = `sprite ${tName}-back`; 
        document.getElementById("game-screen").style.filter = "invert(1)";
        document.getElementById("warning-bubble").style.display = "none";
        setTimeout(() => { isTimeStopped = false; document.getElementById("game-screen").style.filter = "none"; updateTeacherBehavior(); }, 3000);
    } else if (equippedPower === 'sudo') {
        sleepTime += 5.0; updateProgress();
    } else if (equippedPower === 'matsumura') {
        isInvincible = true; document.getElementById("student-sprite").style.opacity = "0.5";
        setTimeout(() => { isInvincible = false; document.getElementById("student-sprite").style.opacity = "1"; }, 5000);
    }
};

function getTeacherName(st, spriteEl) {
    if (st === 9) {
        for (let name of teacherNames) { if (spriteEl.className.includes(name)) return name; }
        return "kato";
    }
    return teachers[st].name;
}

function triggerTeacherSkill() {
    if(skillCoolDown || isTimeStopped || battleStage === 9) return; 
    if(Math.random() > 0.1) return;
    skillCoolDown = true; setTimeout(() => { skillCoolDown = false; }, 8000);
    const t = teachers[battleStage];
    const cutin = document.getElementById("skill-cutin");
    const skillName = document.getElementById("skill-name");
    const skillEffect = document.getElementById("skill-effect");
    const parryBtn = document.getElementById("parry-btn");
    skillName.textContent = t.skill;
    skillEffect.textContent = getSkillEffectText(battleStage);
    cutin.style.display = "flex"; cutin.style.transform = "translateX(0)";
    playSound('cutin');
    isParryWindowOpen = true; parryBtn.style.display = "flex";
    setTimeout(() => {
        isParryWindowOpen = false; parryBtn.style.display = "none";
        cutin.style.transform = "translateX(100%)";
        setTimeout(() => { cutin.style.display = "none"; }, 200);
        if (!isParried) { applyTeacherSkillEffect(battleStage); }
        isParried = false;
    }, 1000);
}

let isParried = false;
window.attemptParry = function(event) {
    if(event) event.stopPropagation();
    if(isParryWindowOpen) {
        isParried = true; isParryWindowOpen = false;
        document.getElementById("parry-btn").style.display = "none";
        playSound('parry');
        sleepTime += 3.0;
        const gameScreen = document.getElementById("game-screen");
        gameScreen.style.filter = "brightness(2)"; 
        setTimeout(() => { gameScreen.style.filter = "none"; }, 100);
        updateProgress();
    }
};

function getSkillEffectText(st) {
    switch(st) {
        case 1: return "睡眠ゲージ減少"; case 2: return "睡眠ゲージ減少";
        case 3: return "先生加速"; case 4: return "即時振り返り";
        case 5: return "睡眠禁止"; case 6: return "視界不良";
        case 7: return "視界不良"; case 8: return "ダメージ"; default: return "";
    }
}

function applyTeacherSkillEffect(st) {
    if(st === 1) { sleepTime = Math.max(0, sleepTime - 5); updateProgress(); } 
    if(st === 2) { sleepTime = Math.max(0, sleepTime - 10); updateProgress(); } 
    if(st === 3) { endlessSpeed = 2.0; setTimeout(() => { endlessSpeed = 1.0; }, 5000); } 
    if(st === 4) { 
        clearTimeout(teacherTimerId);
        const sprite = document.getElementById("teacher-sprite");
        let tName = teachers[battleStage].name;
        sprite.className = `sprite ${tName}-face`; isTeacherLooking = true;
        setTimeout(() => { updateTeacherBehavior(); }, 1000);
    }
    if(st === 5) { 
        isInputBlocked = true; document.getElementById("student-sprite").style.filter = "grayscale(100%)";
        setTimeout(() => { isInputBlocked = false; document.getElementById("student-sprite").style.filter = "none"; }, 3000);
    }
    if(st === 6) { document.getElementById("game-screen").style.filter = "blur(5px) hue-rotate(90deg)"; setTimeout(() => { document.getElementById("game-screen").style.filter = "none"; }, 4000); }
    if(st === 7) { document.getElementById("game-screen").style.filter = "brightness(0)"; setTimeout(() => { document.getElementById("game-screen").style.filter = "none"; }, 3000); }
    if(st === 8) { takeDamage(); }
}

function updateTeacherBehavior() {
    if (isTimeStopped) return;
    triggerTeacherSkill();
    let tName = teachers[battleStage].name;
    if (battleStage === 9) { tName = teacherNames[Math.floor(Math.random() * teacherNames.length)]; endlessSpeed += 0.05; }
    const sprite = document.getElementById("teacher-sprite"); 
    sprite.className = `sprite ${tName}-back`; isTeacherLooking = false;
    document.getElementById("warning-bubble").style.display = "none";
    let waitBase = 2000; if (tName === 'sugawara') waitBase = 3000; if (tName === 'fukumorita') waitBase = 1000; if (tName === 'aota') waitBase = 800;
    let speed = (battleStage === 9) ? endlessSpeed : teachers[battleStage].speed;
    if(battleStage === 3 && endlessSpeed === 2.0) speed = 2.0;
    let randomTime = (Math.random() * waitBase + 1000) / speed;
    teacherTimerId = setTimeout(() => {
        if (isTimeStopped) return;
        document.getElementById("warning-bubble").style.display = "block";
        sprite.className = `sprite ${tName}-side`;
        setTimeout(() => {
            if (isTimeStopped) return;
            document.getElementById("warning-bubble").style.display = "none";
            sprite.className = `sprite ${tName}-face`; isTeacherLooking = true;
            let lookBase = 1000; if (equippedPower === 'otani') lookBase = 500; 
            let lookTime = (battleStage === 9) ? Math.max(400, lookBase - endlessSpeed*50) : lookBase;
            setTimeout(() => { updateTeacherBehavior(); }, lookTime);
        }, 300); 
    }, randomTime);
}

function gameLoop() {
    if (isSleeping) {
        sleepContinuous += 0.1;
        let speedMultiplier = 1.0;
        if (sleepContinuous > 2.0) document.getElementById("game-screen").classList.add("zone-active");
        else document.getElementById("game-screen").classList.remove("zone-active");
        if (equippedPower === 'sugawara') speedMultiplier = 1.5;
        if (equippedPower === 'fukumorita') { let boost = 1.0 + (sleepContinuous * 0.2); if(boost > 3.0) boost = 3.0; speedMultiplier = boost; }
        if (equippedPower === 'aota') speedMultiplier = 5.0;
        let cheatMultiplier = isGodMode ? 5.0 : 1.0;
        sleepTime += 0.1 * speedMultiplier * cheatMultiplier;
        updateProgress();
        if (isTeacherLooking && !isInvincible) takeDamage();
    }
}

function updateProgress() { 
    if(battleStage === 9) { document.getElementById("progress-container").style.display = "none"; document.getElementById("target-score").textContent = sleepTime.toFixed(1); } 
    else { 
        document.getElementById("progress-container").style.display = "block";
        const t = teachers[battleStage]; const pct = Math.min(100, (sleepTime / t.target) * 100); 
        document.getElementById("progress-fill").style.width = pct + "%"; 
        document.getElementById("progress-text").textContent = Math.floor(pct) + "%";
        if (sleepTime >= t.target) stageClear(); 
    } 
}

function takeDamage() {
    if(isGodMode) return;
    hp--; updateHearts(); playSound('dead'); isInvincible = true;
    const gameScreen = document.getElementById("game-screen");
    gameScreen.classList.remove("shaking"); void gameScreen.offsetWidth; gameScreen.classList.add("shaking");
    const chalk = document.createElement("div"); chalk.className = "chalk-missile"; document.getElementById("game-screen").appendChild(chalk); setTimeout(() => chalk.remove(), 300);
    document.getElementById("student-sprite").className = "sprite student-hurt"; document.getElementById("game-screen").style.backgroundColor = "#500"; if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setTimeout(() => { document.getElementById("game-screen").style.backgroundColor = "transparent"; isInvincible = false; if(isSleeping) document.getElementById("student-sprite").className = "sprite student-sleep"; else document.getElementById("student-sprite").className = "sprite student-awake"; }, 500);
    if (hp <= 0) gameOver();
}

function updateHearts() { 
    const container = document.getElementById("hearts-container"); container.innerHTML = ""; 
    const maxHp = (equippedPower === 'matsuda') ? 4 : 3;
    for(let i=0; i<maxHp; i++) {
        const heart = document.createElement("div"); heart.className = "heart-icon";
        if (i >= hp) { heart.style.backgroundImage = "var(--heart-empty-svg)"; heart.classList.add("lost"); }
        if(isGodMode) heart.classList.add("god");
        container.appendChild(heart);
    }
}

function stageClear() {
    clearInterval(gameLoopId); clearTimeout(teacherTimerId); playSound('clear');
    let gotPower = false;
    let dropped = "";
    if (battleStage === 1 && !unlockedPowers.includes("kato")) { dropped="kato"; gotPower = true; alert("加藤先生の「懐中時計」を奪った！"); }
    if (battleStage === 2 && !unlockedPowers.includes("matsuda")) { dropped="matsuda"; gotPower = true; alert("松田先生の「ランチ」を奪った！"); }
    if (battleStage === 3 && !unlockedPowers.includes("sugawara")) { dropped="sugawara"; gotPower = true; alert("菅原先生の「タクト」を奪った！"); }
    if (battleStage === 4 && !unlockedPowers.includes("fukumorita")) { dropped="fukumorita"; gotPower = true; alert("福盛田先生の「スニーカー」を奪った！"); }
    if (battleStage === 5 && !unlockedPowers.includes("sudo")) { dropped="sudo"; gotPower = true; alert("須藤先生の「暗記カード」を奪った！"); }
    if (battleStage === 6 && !unlockedPowers.includes("otani")) { dropped="otani"; gotPower = true; alert("大谷先生の「和歌」を奪った！"); }
    if (battleStage === 7 && !unlockedPowers.includes("matsumura")) { dropped="matsumura"; gotPower = true; alert("松村先生の「劇薬」を奪った！"); }
    if (battleStage === 8 && !unlockedPowers.includes("aota")) { dropped="aota"; gotPower = true; alert("青田校長の「ジャケット」を奪った！"); }
    if(gotPower) { unlockedPowers.push(dropped); localStorage.setItem("soichiPowers", JSON.stringify(unlockedPowers)); }
    let rank = "B"; if (isGodMode) { rank = "チート"; } else if(hp >= 3) { rank = "S"; } else if(hp === 2) { rank = "A"; }
    const currentRank = stageRanks[battleStage];
    const rankOrder = { "S": 4, "A": 3, "B": 2, "チート": 1, undefined: 0 };
    if (rankOrder[rank] > rankOrder[currentRank] || (rank === "チート" && !currentRank)) { stageRanks[battleStage] = rank; localStorage.setItem("soichiRanks", JSON.stringify(stageRanks)); }
    if (battleStage === 8) { if (unlockedStage < 9) { unlockedStage = 9; localStorage.setItem("soichiGameStage", unlockedStage); } showEnding(); return; } 
    else if(battleStage >= unlockedStage) { unlockedStage++; localStorage.setItem("soichiGameStage", unlockedStage); justCleared = true; }
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
    const stamp = document.getElementById("rank-stamp"); stamp.style.display = "flex"; stamp.textContent = rank; stamp.classList.remove("god"); if (rank === "チート") stamp.classList.add("god");
    document.getElementById("result-screen").style.background = "#2b4528"; document.getElementById("result-title").textContent = "YOU WIN!"; document.getElementById("result-title").style.color = "gold"; document.getElementById("result-msg").textContent = gotPower ? "新しい能力をゲット！" : "次の相手へ...";
}

function returnToMenu() {
    document.getElementById("result-screen").classList.add("hidden");
    document.getElementById("menu-screen").classList.remove("hidden");
    renderEquipMenu();
    if (justCleared && battleStage < 9) { justCleared = false; playWalkAnimation(); } else { currentMenuStage = battleStage; if (unlockedStage > currentMenuStage && unlockedStage <= 8) { currentMenuStage = unlockedStage; } updateMenuVisuals(currentMenuStage); }
}

function playWalkAnimation() {
    currentMenuStage = battleStage; updateMenuVisuals(currentMenuStage); 
    const player = document.getElementById("menu-player"); const rival = document.getElementById("menu-rival");
    rival.style.opacity = "0"; player.classList.add("walk-right");
    setTimeout(() => { currentMenuStage = unlockedStage > 8 ? 8 : unlockedStage; updateMenuVisuals(currentMenuStage); rival.style.opacity = "1"; rival.classList.add("fade-in-right"); player.classList.remove("walk-right"); setTimeout(() => { rival.classList.remove("fade-in-right"); }, 1000); }, 1500); 
}

function gameOver() { clearInterval(gameLoopId); clearTimeout(teacherTimerId); document.getElementById("game-screen").classList.add("hidden"); document.getElementById("result-screen").classList.remove("hidden"); document.getElementById("rank-stamp").style.display = "none"; document.getElementById("result-screen").style.background = "#500"; document.getElementById("result-title").textContent = "GAME OVER"; document.getElementById("result-title").style.color = "red"; let msg = "補習決定..."; if (battleStage === 9) msg = `記録: ${sleepTime.toFixed(1)}秒`; document.getElementById("result-msg").textContent = msg; }

function showEnding() { 
    document.getElementById("game-screen").classList.add("hidden"); document.getElementById("ending-screen").classList.remove("hidden"); 
    document.getElementById("cert-name").textContent = playerName || "名無し";
    let usedGodMode = false; for(let i=1; i<=8; i++) { if(stageRanks[i] === "チート") usedGodMode = true; }
    const godNote = document.getElementById("god-mode-note"); if(usedGodMode) { godNote.style.display = "block"; } else { godNote.style.display = "none"; }
    for(let i=0; i<50; i++) { const conf = document.createElement("div"); conf.className = "confetti"; conf.style.left = Math.random() * 100 + "vw"; conf.style.backgroundColor = `hsl(${Math.random()*360}, 100%, 50%)`; conf.style.animationDuration = (Math.random() * 2 + 2) + "s"; document.getElementById("ending-screen").appendChild(conf); } 
}
const shareText = `【卒業証明書】私、${playerName || "名無し"}は加藤・松田・菅原・福盛田・須藤・大谷・松村・青田校長の目を盗み、完全爆睡したことを証明します！ #加藤先生ゲーム`;
function shareX() { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(GAME_URL)}`, '_blank'); }
function shareLine() { const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(GAME_URL)}`; window.open(lineUrl, '_blank'); }
async function shareNative() { if (navigator.share) { try { await navigator.share({ title: '激闘！加藤先生の授業', text: shareText, url: GAME_URL, }); } catch (err) { console.log('Share canceled'); } } else { navigator.clipboard.writeText(`${shareText} ${GAME_URL}`); alert("URLをコピーしました！"); } }

const startSleep = () => { 
    if(isInputBlocked || isSleeping) return;
    isSleeping = true; 
    if(!isInvincible) document.getElementById("student-sprite").className = "sprite student-sleep"; 
    if (!zzzInterval) zzzInterval = setInterval(spawnZzz, 400); 
};
const stopSleep = () => { 
    isSleeping = false; sleepContinuous = 0; 
    document.getElementById("game-screen").classList.remove("zone-active");
    if(!isInvincible) document.getElementById("student-sprite").className = "sprite student-awake"; 
    if (zzzInterval) { clearInterval(zzzInterval); zzzInterval = null; } 
};
function spawnZzz() { const zzz = document.createElement("div"); zzz.className = "zzz"; zzz.textContent = "z"; zzz.style.left = (50 + (Math.random()*20-10)) + "%"; zzz.style.top = "0px"; document.getElementById("player-area").appendChild(zzz); setTimeout(() => zzz.remove(), 2000); }

const touchLayer = document.getElementById("player-area"); 
touchLayer.addEventListener("touchstart", (e) => { 
    if(e.target.id === "active-skill-btn" || e.target.id === "parry-btn") return;
    initAudio(); e.preventDefault(); startSleep(); 
}); 
touchLayer.addEventListener("touchend", (e) => { 
    if(e.target.id === "active-skill-btn" || e.target.id === "parry-btn") return;
    e.preventDefault(); stopSleep(); 
}); 
document.addEventListener("keydown", (e) => { if (e.code === "Space") { if(isInputBlocked) return; initAudio(); startSleep(); } }); 
document.addEventListener("keyup", (e) => { if (e.code === "Space") stopSleep(); });
    </script>
</body>
</html>