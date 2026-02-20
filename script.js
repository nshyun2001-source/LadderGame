// =====================================================
// 굼뱅이 사다리 게임 - script.js
// =====================================================

// ── Comic Audio System ──
const ComicAudio = {
    ctx: null,
    bgmSource: null,
    bgmGain: null,
    isBgmPlaying: false,
    async init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    },
    stopBgm() {
        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource = null;
        }
        this.isBgmPlaying = false;
    },
    play(type) {
        this.init().then(() => {
            const ctx = this.ctx;
            const now = ctx.currentTime;

            const createPart = (freq, dur, wave, vol = 0.15) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = wave;
                osc.frequency.setValueAtTime(freq, now);
                g.gain.setValueAtTime(vol, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + dur);
                osc.connect(g);
                g.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + dur);
                return osc;
            };

            switch (type) {
                case 'pop': // '뿅!' - 꺾일 때
                    createPart(800, 0.1, 'sine');
                    const oscPop = ctx.createOscillator();
                    const gPop = ctx.createGain();
                    oscPop.frequency.setValueAtTime(900, now);
                    oscPop.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                    gPop.gain.setValueAtTime(0.2, now);
                    gPop.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    oscPop.connect(gPop);
                    gPop.connect(ctx.destination);
                    oscPop.start(now);
                    oscPop.stop(now + 0.1);
                    break;
                case 'boing': // '보잉~' - 스프링 느낌의 코믹한 출발
                    const durB = 0.4;
                    [1, 1.5, 2].forEach(multi => { // 하모닉스 추가
                        const oscB = ctx.createOscillator();
                        const gB = ctx.createGain();
                        oscB.type = multi === 1 ? 'triangle' : 'sine';
                        oscB.frequency.setValueAtTime(150 * multi, now);
                        oscB.frequency.exponentialRampToValueAtTime(600 * multi, now + durB);

                        // 바이브라토 (Pitch wobble)
                        const lfo = ctx.createOscillator();
                        const lfoGain = ctx.createGain();
                        lfo.frequency.setValueAtTime(25, now);
                        lfoGain.gain.setValueAtTime(20 * multi, now);
                        lfo.connect(lfoGain);
                        lfoGain.connect(oscB.frequency);
                        lfo.start(now);
                        lfo.stop(now + durB);

                        gB.gain.setValueAtTime(0.1 / multi, now);
                        gB.gain.exponentialRampToValueAtTime(0.001, now + durB);
                        oscB.connect(gB);
                        gB.connect(ctx.destination);
                        oscB.start(now);
                        oscB.stop(now + durB);
                    });
                    break;
                case 'tada': // '짜잔-!' - 도착
                    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                    notes.forEach((f, i) => {
                        const o = ctx.createOscillator();
                        const gNote = ctx.createGain();
                        o.frequency.setValueAtTime(f, now + i * 0.05);
                        gNote.gain.setValueAtTime(0, now);
                        gNote.gain.linearRampToValueAtTime(0.1, now + i * 0.05 + 0.02);
                        gNote.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                        o.connect(gNote);
                        gNote.connect(ctx.destination);
                        o.start(now);
                        o.stop(now + 0.8);
                    });
                    break;
                case 'click': // 버튼 클릭
                    createPart(1200, 0.05, 'sine', 0.1);
                    break;
                case 'camera': // 찰칵
                    const noise = ctx.createBufferSource();
                    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
                    noise.buffer = buffer;
                    const gn = ctx.createGain();
                    gn.gain.setValueAtTime(0.15, now);
                    gn.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    noise.connect(gn);
                    gn.connect(ctx.destination);
                    noise.start(now);
                    break;
                case 'crawl': // '기어가는 소리' - 더 쫀득하고 코믹한 엇박자
                    // 1. 낮은 쿵 소리 (Thump)
                    const oThump = ctx.createOscillator();
                    const gThump = ctx.createGain();
                    oThump.type = 'triangle';
                    oThump.frequency.setValueAtTime(120, now);
                    oThump.frequency.exponentialRampToValueAtTime(40, now + 0.05);
                    gThump.gain.setValueAtTime(0.15, now);
                    gThump.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    oThump.connect(gThump); gThump.connect(ctx.destination);
                    oThump.start(now); oThump.stop(now + 0.05);

                    // 2. 높은 쫀득 소리 (Squish/Blip)
                    const oSquish = ctx.createOscillator();
                    const gSquish = ctx.createGain();
                    oSquish.type = 'sine';
                    oSquish.frequency.setValueAtTime(1200 + Math.random() * 800, now);
                    oSquish.frequency.exponentialRampToValueAtTime(600, now + 0.03);
                    gSquish.gain.setValueAtTime(0.06, now);
                    gSquish.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                    oSquish.connect(gSquish); gSquish.connect(ctx.destination);
                    oSquish.start(now); oSquish.stop(now + 0.03);
                    break;
                case 'bgm': // 더 화려하고 코믹한 멀티파트 BGM
                    if (this.isBgmPlaying) return;
                    this.isBgmPlaying = true;

                    const bpm = 165;
                    const step = 60 / bpm;
                    const subStep = step / 2;

                    const bassLine = [130.81, 164.81, 196.00, 220.00, 196.00, 164.81, 130.81, 98.00];
                    const melodyLine = [523.25, 0, 659.25, 0, 783.99, 880.00, 783.99, 0];

                    this.bgmGain = ctx.createGain();
                    this.bgmGain.gain.setValueAtTime(0.06, now);
                    this.bgmGain.connect(ctx.destination);

                    const playLoop = (startTime) => {
                        if (!this.isBgmPlaying) return;
                        const barLength = 8 * subStep;

                        for (let i = 0; i < 8; i++) {
                            const t = startTime + i * subStep;

                            // 1. Bass
                            if (i % 2 === 0) {
                                const f = bassLine[i % bassLine.length];
                                const o = ctx.createOscillator();
                                const g = ctx.createGain();
                                o.type = 'triangle';
                                o.frequency.setValueAtTime(f, t);
                                g.gain.setValueAtTime(0.12, t);
                                g.gain.exponentialRampToValueAtTime(0.001, t + step * 0.7);
                                o.connect(g);
                                g.connect(this.bgmGain);
                                o.start(t);
                                o.stop(t + step);
                            }

                            // 2. Rhythmic Accent
                            if (i % 2 === 1) {
                                const n = ctx.createBufferSource();
                                const b = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
                                const d = b.getChannelData(0);
                                for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1;
                                n.buffer = b;
                                const gn = ctx.createGain();
                                gn.gain.setValueAtTime(0.02, t);
                                gn.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
                                n.connect(gn);
                                gn.connect(this.bgmGain);
                                n.start(t);
                            }

                            // 3. Melody
                            const mf = melodyLine[i];
                            if (mf > 0) {
                                const o = ctx.createOscillator();
                                const g = ctx.createGain();
                                o.type = 'square';
                                o.frequency.setValueAtTime(mf, t);
                                g.gain.setValueAtTime(0.035, t);
                                g.gain.exponentialRampToValueAtTime(0.001, t + subStep * 0.85);
                                o.connect(g);
                                g.connect(this.bgmGain);
                                o.start(t);
                                o.stop(t + subStep);

                                if (i === 6) { // Melody usually ends near here
                                    this.bgmSource = o;
                                    o.onended = () => playLoop(startTime + barLength);
                                }
                            }
                        }
                    };
                    playLoop(now);
                    break;
            }
        });
    }
};

// Global click listener for comic feedback
document.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.classList.contains('player-photo-label')) {
        ComicAudio.play('click');
    }
}, true);

// ── 상태 관리 ──
const state = {
    playerCount: 4,
    players: [],          // { id, photo, faceImg, result, moving }
    currentPlayerIndex: 0,
    ladderData: null,
    isRunning: false,
    currentFacingMode: 'user', // user (내면), environment (외면)
};

// ── DOM 요소 ──
const screens = {
    setup: document.getElementById('setup-screen'),
    capture: document.getElementById('capture-screen'),
    results: document.getElementById('results-screen'),
    ladder: document.getElementById('ladder-screen'),
};
const video = document.getElementById('video');
const shootCanvas = document.getElementById('canvas');
const photoPreview = document.getElementById('photo-preview');
const ladderCanvas = document.getElementById('ladder-canvas');
const charactersContainer = document.getElementById('characters-container');

// =====================================================
// SCREEN MANAGEMENT
// =====================================================
function setScreen(name) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[name].classList.remove('hidden');
    if (name === 'capture') startCamera();
    else stopCamera();
}

function showToast(msg, dur = 4000) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.add('hidden'), dur);
}

// =====================================================
// CAMERA
// =====================================================
async function startCamera() {
    try {
        if (video.srcObject) stopCamera();
        const constraints = {
            video: { facingMode: state.currentFacingMode },
            audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        // 내면 카메라(셀프)일 때만 좌우 반전
        if (state.currentFacingMode === 'user') {
            video.style.transform = 'scaleX(-1)';
        } else {
            video.style.transform = 'scaleX(1)';
        }
    } catch (err) {
        console.error(err);
        showToast('카메라 권한이 필요합니다.');
    }
}
function stopCamera() {
    video.srcObject?.getTracks().forEach(t => t.stop());
    video.srcObject = null;
}

async function extractFaceImage(photoDataURL) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            // 정밀 보정: 가이드 원 220px / 카메라 높이 480px = 0.45833...
            // 이 비율을 이미지 높이에 적용하여 화면의 가이드 원과 1:1로 일치시킴
            const cropSize = img.height * 0.4583;
            const sx = (img.width - cropSize) / 2;
            const sy = (img.height - cropSize) / 2;

            const fc = document.createElement('canvas');
            fc.width = fc.height = 120;
            const fCtx = fc.getContext('2d');
            fCtx.beginPath();
            fCtx.arc(60, 60, 60, 0, Math.PI * 2);
            fCtx.clip();
            fCtx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 120, 120);
            resolve(fc);
        };
        img.src = photoDataURL;
    });
}

// =====================================================
// SETUP
// =====================================================
const playerCountInput = document.getElementById('player-count');
const minusBtn = document.getElementById('minus-btn');
const plusBtn = document.getElementById('plus-btn');

function updateStepper(val) {
    let current = parseInt(playerCountInput.value);
    let next = current + val;
    if (next >= 2 && next <= 10) {
        playerCountInput.value = next;
    }
    // Update button states
    minusBtn.disabled = (parseInt(playerCountInput.value) <= 2);
    plusBtn.disabled = (parseInt(playerCountInput.value) >= 10);
}

minusBtn.addEventListener('click', () => updateStepper(-1));
plusBtn.addEventListener('click', () => updateStepper(1));

document.getElementById('start-setup-btn').addEventListener('click', () => {
    state.playerCount = parseInt(playerCountInput.value) || 4;
    state.players = Array.from({ length: state.playerCount }, (_, i) => ({
        id: i, photo: null, faceImg: null, result: '', moving: false, finished: false,
    }));
    state.currentPlayerIndex = 0;
    refreshCaptureUI();
    setScreen('capture');
});

// =====================================================
// CAPTURE
// =====================================================
function refreshCaptureUI() {
    const i = state.currentPlayerIndex;
    document.getElementById('capture-title').textContent =
        `🐛 굼뱅이 ${i + 1} 얼굴 찍기 (${i + 1}/${state.playerCount})`;
    video.classList.remove('hidden');
    photoPreview.classList.add('hidden');
    photoPreview.innerHTML = '';
    document.getElementById('capture-btn').classList.remove('hidden');
    document.getElementById('retake-btn').classList.add('hidden');
    document.getElementById('next-player-btn').classList.add('hidden');
}

document.getElementById('capture-btn').addEventListener('click', async () => {
    ComicAudio.play('camera'); // 찰칵 소리
    shootCanvas.width = video.videoWidth || 640;
    shootCanvas.height = video.videoHeight || 480;
    const ctx = shootCanvas.getContext('2d');
    ctx.translate(shootCanvas.width, 0);
    ctx.scale(-1, 1); // mirror
    ctx.drawImage(video, 0, 0);

    const photoData = shootCanvas.toDataURL('image/jpeg', 0.9);
    const player = state.players[state.currentPlayerIndex];
    player.photo = photoData;

    video.classList.add('hidden');
    photoPreview.classList.remove('hidden');
    photoPreview.innerHTML = `
        <div class="preview-photo" style="background-image:url(${photoData})"></div>
        <div class="compositing-badge">🐛 굼뱅이 머리 합성 중...</div>`;

    document.getElementById('capture-btn').classList.add('hidden');

    // Extract face
    const faceCanvas = await extractFaceImage(photoData);
    player.faceImg = faceCanvas;

    // Show preview with grub head
    const previewC = document.createElement('canvas');
    previewC.width = previewC.height = 120;
    previewC.style.cssText = 'border-radius:50%;box-shadow:0 8px 24px rgba(0,0,0,0.35);';
    drawGrubHead(previewC.getContext('2d'), 60, 60, 55, faceCanvas, 0);
    photoPreview.innerHTML = '';
    photoPreview.appendChild(previewC);
    const lbl = document.createElement('div');
    lbl.className = 'compositing-badge';
    lbl.style.color = '#afffaf';
    lbl.textContent = '✅ 굼뱅이 완성!';
    photoPreview.appendChild(lbl);

    document.getElementById('retake-btn').classList.remove('hidden');
    document.getElementById('next-player-btn').classList.remove('hidden');
});

document.getElementById('retake-btn').addEventListener('click', refreshCaptureUI);

document.getElementById('switch-camera-btn').addEventListener('click', () => {
    state.currentFacingMode = (state.currentFacingMode === 'user') ? 'environment' : 'user';
    startCamera();
});

document.getElementById('next-player-btn').addEventListener('click', () => {
    state.currentPlayerIndex++;
    if (state.currentPlayerIndex < state.playerCount) {
        refreshCaptureUI();
    } else {
        buildResultsScreen();
        setScreen('results');
    }
});

// =====================================================
// RESULTS
// =====================================================
function buildResultsScreen() {
    const c = document.getElementById('results-inputs');
    c.innerHTML = '';
    state.players.forEach((p, i) => {
        const d = document.createElement('div');
        d.className = 'result-item';
        d.innerHTML = `<label>🏁 ${i + 1}번 라인</label>
            <input type="text" id="result-${i}" placeholder="예: 당첨, 꽝, 커피사기">`;
        c.appendChild(d);
    });
}

document.getElementById('start-game-btn').addEventListener('click', () => {
    state.players.forEach((p, i) => {
        p.result = document.getElementById(`result-${i}`).value.trim() || `결과 ${i + 1}`;
    });
    state.isRunning = true; // 게임 상태 활성화
    setScreen('ladder');
    initLadder();
});

// =====================================================
// LADDER ENGINE
// =====================================================
function initLadder() {
    const W = ladderCanvas.clientWidth || 700;
    const H = ladderCanvas.clientHeight || 720;
    ladderCanvas.width = W;
    ladderCanvas.height = H;

    const cols = state.playerCount;
    const PAD = 65;
    const colW = cols > 1 ? (W - PAD * 2) / (cols - 1) : W - PAD * 2;
    const TOP = 90;
    const BOTTOM = H - 55;

    // ── 사다리 엔진 ──
    const rungs = [];
    const usedY = {}; // 세로선별 y좌표 중복 방지 (간격 유지)
    const SLOTS = 50; // 정밀도 상향
    const GAP_LIMIT = 12; // 최소 12px 간격 유지 (좀 더 촘촘하고 자연스럽게)

    const RUNG_TOP = TOP + 65;
    const RUNG_BOTTOM = BOTTOM - 65;

    const isOverlap = (col, yVal) => {
        if (!usedY[col]) return false;
        return usedY[col].some(ey => Math.abs(ey - yVal) < GAP_LIMIT);
    };

    // 1. 수평 가로대 배치 (간격당 3~9개 랜덤)
    for (let c = 0; c < cols - 1; c++) {
        const targetCount = 3 + Math.floor(Math.random() * 7);
        let placed = 0, cTries = 0;

        while (placed < targetCount && cTries++ < 400) {
            const s = Math.floor(Math.random() * SLOTS);
            const y = RUNG_TOP + (s / (SLOTS - 1)) * (RUNG_BOTTOM - RUNG_TOP);

            // 수평선은 ya와 yb가 동일하므로 양쪽 세로선 모두 체크
            if (!isOverlap(c, y) && !isOverlap(c + 1, y)) {
                rungs.push({ col: c, ya: y, yb: y, type: 'normal' });
                if (!usedY[c]) usedY[c] = [];
                if (!usedY[c + 1]) usedY[c + 1] = [];
                usedY[c].push(y);
                usedY[c + 1].push(y);
                placed++;
            }
        }
    }

    // 2. 긴 사선 추가 (간격당 1~2개) - 수평선 및 다른 사선과 절대 겹치지 않게
    for (let c = 0; c < cols - 1; c++) {
        const diagCount = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < diagCount; i++) {
            let ya, yb, type, found = false, dTries = 0;
            while (!found && dTries++ < 200) {
                const s = Math.floor(Math.random() * SLOTS);
                ya = RUNG_TOP + (s / (SLOTS - 1)) * (RUNG_BOTTOM - RUNG_TOP);

                if (Math.random() < 0.5) {
                    type = 'back';
                    yb = Math.max(TOP + 20, ya - (170 + Math.random() * 150));
                } else {
                    type = 'fwd';
                    yb = Math.min(BOTTOM - 20, ya + (170 + Math.random() * 150));
                }

                // 시작점(ya)은 c번 세로선, 끝점(yb)은 c+1번 세로선에서 중복 체크
                if (!isOverlap(c, ya) && !isOverlap(c + 1, yb)) {
                    rungs.push({ col: c, ya, yb, type });
                    if (!usedY[c]) usedY[c] = [];
                    if (!usedY[c + 1]) usedY[c + 1] = [];
                    usedY[c].push(ya);
                    usedY[c + 1].push(yb);
                    found = true;
                }
            }
        }
    }

    state.ladderData = { rungs, colW, PAD, cols, W, H, TOP, BOTTOM };
    drawLadder();
    buildGameElements();
}

function drawLadder() {
    const { rungs, colW, PAD, cols, W, H, TOP, BOTTOM } = state.ladderData;
    const ctx = ladderCanvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // ── Vertical rails ──
    for (let i = 0; i < cols; i++) {
        const x = PAD + i * colW;
        const grad = ctx.createLinearGradient(x, TOP, x, BOTTOM);
        grad.addColorStop(0, 'rgba(255,255,255,0.12)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.45)');
        grad.addColorStop(1, 'rgba(255,255,255,0.12)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(255,255,255,0.15)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, TOP);
        ctx.lineTo(x, BOTTOM);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // ── Rungs (diagonal-capable) ──
    rungs.forEach(r => {
        const x1 = PAD + r.col * colW;
        const x2 = x1 + colW;
        const y1 = r.ya;
        const y2 = r.yb;

        // Color by type
        let color, glowColor;
        if (r.type === 'back') {
            color = 'rgba(255,80,80,0.92)';   // 빨간 — 뒤로 가기
            glowColor = 'rgba(255,80,80,0.5)';
        } else if (r.type === 'fwd') {
            color = 'rgba(80,220,255,0.92)';  // 파란 — 앞으로 가기
            glowColor = 'rgba(80,220,255,0.5)';
        } else {
            color = 'rgba(255,220,80,0.90)';  // 노란 — 일반
            glowColor = 'rgba(255,220,80,0.45)';
        }

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = color;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.restore();
    });
    ctx.shadowBlur = 0;
}

// =====================================================
// GAME ELEMENTS (photo thumbnails + result labels)
// =====================================================
function buildGameElements() {
    charactersContainer.innerHTML = '';
    const { colW, PAD } = state.ladderData;

    state.players.forEach((p, i) => {
        const x = PAD + i * colW;

        // Photo thumbnail (top)
        const thumb = document.createElement('canvas');
        thumb.width = thumb.height = 64;
        thumb.id = `thumb-${i}`;
        thumb.className = 'player-photo-label';
        thumb.style.left = `${x}px`;
        thumb.title = '클릭하여 굼뱅이 출발!';
        thumb.onclick = () => startGrubAnimation(i);
        drawGrubHead(thumb.getContext('2d'), 32, 32, 30, p.faceImg, 0);
        charactersContainer.appendChild(thumb);

        // Result label (bottom)
        const lbl = document.createElement('div');
        lbl.className = 'result-label';
        lbl.id = `rlbl-${i}`;
        lbl.textContent = p.result;
        lbl.style.left = `${x}px`;
        charactersContainer.appendChild(lbl);
    });
}

// =====================================================
// DRAW GRUB HEAD  (Canvas 2D)
// =====================================================
function drawGrubHead(ctx, cx, cy, r, faceCanvas, wiggle) {
    ctx.save();

    // Comic style thick black outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Head base circle (vibrant yellow-green gradient)
    const headGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    headGrad.addColorStop(0, '#fff176'); // Yellow
    headGrad.addColorStop(0.7, '#aed581'); // Light Green
    headGrad.addColorStop(1, '#689f38'); // Deep Green
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Face photo overlay
    if (faceCanvas) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(faceCanvas, cx - r * 0.82, cy - r * 0.82, r * 1.64, r * 1.64);

        // Photo border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    } else {
        // Comic default face
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        // Left eye
        ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Right eye
        ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Pupils
        ctx.fillStyle = '#000';
        const pupX = Math.sin(wiggle * 0.5) * 2;
        ctx.beginPath(); ctx.arc(cx - r * 0.3 + pupX, cy - r * 0.2, r * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r * 0.3 + pupX, cy - r * 0.2, r * 0.1, 0, Math.PI * 2); ctx.fill();

        // Big Happy Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.1, r * 0.45, 0.3, Math.PI - 0.3);
        ctx.stroke();
    }

    // Antenna (Comic style)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const antWig = Math.sin(wiggle * 2) * 5;

    // Left
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy - r * 0.8);
    ctx.quadraticCurveTo(cx - r * 0.6 + antWig, cy - r * 1.3, cx - r * 0.4 + antWig, cy - r * 1.6);
    ctx.stroke();
    // Tip
    ctx.fillStyle = '#ff4081';
    ctx.beginPath(); ctx.arc(cx - r * 0.4 + antWig, cy - r * 1.6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();

    // Right
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.3, cy - r * 0.8);
    ctx.quadraticCurveTo(cx + r * 0.6 + antWig, cy - r * 1.3, cx + r * 0.4 + antWig, cy - r * 1.6);
    ctx.stroke();
    // Tip
    ctx.fillStyle = '#ff4081';
    ctx.beginPath(); ctx.arc(cx + r * 0.4 + antWig, cy - r * 1.6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();

    ctx.restore();
}

// =====================================================
// DRAW BODY SEGMENT
// =====================================================
function drawGrubSegment(ctx, cx, cy, r, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Bold comic outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
    ctx.stroke();

    // Vibrant gradient body
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#eeff41'); // Bright Lemon
    grad.addColorStop(0.5, '#76ff03'); // Neon Green
    grad.addColorStop(1, '#33691e'); // Dark Green
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Glossy highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Subtle crease
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.75, 0.5, Math.PI - 0.5);
    ctx.stroke();

    ctx.restore();
}

// =====================================================
// PATH FINDING  (diagonal-rung aware, supports backward/upward movement)
// =====================================================
function computePath(startCol) {
    const { rungs, colW, PAD, TOP, BOTTOM } = state.ladderData;
    let col = startCol;
    let currentY = TOP;
    const pts = [];
    let lastRungIdx = -1;

    for (let iter = 0; iter < 1000; iter++) {
        let best = null;
        let minDiff = Infinity;
        const EPS = 0.5; // 정밀도 보정값

        for (let i = 0; i < rungs.length; i++) {
            // 방금 사용한 가로대는 즉시 되돌아가지 않도록 제외 (무한 루프 방지)
            if (i === lastRungIdx) continue;

            const r = rungs[i];

            // 1. 현재 컬럼(col)에서 오른쪽(col+1)으로 가는 가로대 체크
            if (r.col === col) {
                const diff = r.ya - currentY;
                // 현재 위치보다 아래에 있거나, 거의 같은 높이인 경우
                if (diff >= -EPS) {
                    if (diff < minDiff) {
                        minDiff = diff;
                        best = { idx: i, encounterY: r.ya, newCol: col + 1, exitY: r.yb };
                    }
                }
            }

            // 2. 인접 컬럼(col-1)에서 왼쪽(col)으로 오는 가로대 체크
            if (r.col === col - 1) {
                const diff = r.yb - currentY;
                if (diff >= -EPS) {
                    if (diff < minDiff) {
                        minDiff = diff;
                        best = { idx: i, encounterY: r.yb, newCol: col - 1, exitY: r.ya };
                    }
                }
            }
        }

        // 더 이상 만날 가로대가 없거나 바닥에 도달한 경우 종료
        if (!best || best.encounterY >= BOTTOM - 1) break;

        // Waypoint 추가: 현재 줄에서 가로대 만나는 지점까지 직진
        pts.push({ x: PAD + col * colW, y: best.encounterY });
        // Waypoint: 가로대를 타고 옆 줄로 이동
        pts.push({ x: PAD + best.newCol * colW, y: best.exitY });

        lastRungIdx = best.idx;
        col = best.newCol;
        currentY = best.exitY; // may be ABOVE previous y for backward rungs!
    }

    return { path: pts, finalCol: col };
}

// =====================================================
// GRUB ANIMATION  (Canvas-based, requestAnimationFrame)
// 기능1: 지나온 경로 네온 trail 표시
// 기능2: 도착 후 꼬리 하나씩 접기 → 얼굴만 남기기
// =====================================================
async function startGrubAnimation(playerIdx) {
    const player = state.players[playerIdx];
    if (player.moving || player.finished) return; // 이미 이동 중이거나 완료된 경우 무시

    ComicAudio.play('bgm'); // 빠른 배경음악 시작
    ComicAudio.play('boing'); // 사다리 출발 소리

    // 출발한 굼뱅이 표시 (색상 변경 클래스 추가)
    const thumb = document.getElementById(`thumb-${playerIdx}`);
    if (thumb) thumb.classList.add('grub-started');

    player.moving = true;

    const { colW, PAD, TOP, BOTTOM, W, H } = state.ladderData;
    const { path, finalCol } = computePath(playerIdx);
    const startPt = { x: PAD + playerIdx * colW, y: TOP };
    const endPt = { x: PAD + finalCol * colW, y: BOTTOM };
    const rawPath = [startPt, ...path, endPt];

    // 중복 좌표 제거
    const waypoints = [rawPath[0]];
    for (let i = 1; i < rawPath.length; i++) {
        const prev = waypoints[waypoints.length - 1];
        if (Math.hypot(rawPath[i].x - prev.x, rawPath[i].y - prev.y) > 1) {
            waypoints.push(rawPath[i]);
        }
    }

    // 각 구간 길이 + 전체 경로 길이
    const segLens = [];
    let totalPathLen = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        const d = Math.hypot(waypoints[i + 1].x - waypoints[i].x,
            waypoints[i + 1].y - waypoints[i].y);
        segLens.push(d);
        totalPathLen += d;
    }

    // 누적 거리 → 위치 변환
    function posAtDist(d) {
        let acc = 0;
        for (let i = 0; i < segLens.length; i++) {
            const sl = segLens[i];
            if (d <= acc + sl) {
                const t = sl > 0 ? (d - acc) / sl : 0;
                return {
                    x: waypoints[i].x + (waypoints[i + 1].x - waypoints[i].x) * t,
                    y: waypoints[i].y + (waypoints[i + 1].y - waypoints[i].y) * t
                };
            }
            acc += sl;
        }
        return { x: waypoints[waypoints.length - 1].x, y: waypoints[waypoints.length - 1].y };
    }

    // ── 1) Trail 캔버스 (지나온 경로 네온 색상, z-index 20)
    const trailCanvas = document.createElement('canvas');
    trailCanvas.width = W;
    trailCanvas.height = H;
    trailCanvas.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20;';
    charactersContainer.appendChild(trailCanvas);
    const tCtx = trailCanvas.getContext('2d');

    const comicPopups = [];
    const FUNNY_WORDS = ["어이쿠!", "휘릭!", "뿅!", "우와~", "어맛!", "살려줘!", "배고파!", "가즈아!", "후다닥!", "슈슉!"];

    function addComicPopup(x, y) {
        ComicAudio.play('pop'); // 코믹 팝업 소리
        const text = FUNNY_WORDS[Math.floor(Math.random() * FUNNY_WORDS.length)];
        comicPopups.push({
            x, y: y - 30, text,
            life: 1.0, // 1초 지속
            vx: (Math.random() - 0.5) * 40,
            vy: -50 - Math.random() * 50
        });
    }

    function drawComicPopups(ctx, dt) {
        ctx.save();
        ctx.font = 'bold 24px Gaegu';
        ctx.textAlign = 'center';
        for (let i = comicPopups.length - 1; i >= 0; i--) {
            const p = comicPopups[i];
            p.life -= dt;
            if (p.life <= 0) {
                comicPopups.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeText(p.text, p.x, p.y);
            ctx.fillText(p.text, p.x, p.y);
        }
        ctx.restore();
    }

    function _strokePath(ctx, dist) {
        ctx.beginPath();
        let acc = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
            const p1 = waypoints[i], p2 = waypoints[i + 1];
            const sl = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (acc + sl > dist) {
                const r = (dist - acc) / sl;
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p1.x + (p2.x - p1.x) * r, p1.y + (p2.y - p1.y) * r);
                break;
            } else {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            acc += sl;
        }
        ctx.stroke();
    }

    function drawTrail(dist) {
        tCtx.clearRect(0, 0, W, H);
        if (dist <= 0) return;
        tCtx.save();
        tCtx.lineCap = 'round';
        tCtx.lineJoin = 'round';

        // 콤믹 스타일 무지개 궤적
        const grad = tCtx.createLinearGradient(0, TOP, 0, BOTTOM);
        grad.addColorStop(0, '#ff4081');
        grad.addColorStop(0.5, '#00e5ff');
        grad.addColorStop(1, '#b2ff59');

        tCtx.strokeStyle = '#000';
        tCtx.lineWidth = 14;
        _strokePath(tCtx, dist);

        tCtx.strokeStyle = grad;
        tCtx.lineWidth = 6;
        _strokePath(tCtx, dist);

        tCtx.restore();
    }

    // ── 2) 굼뱅이 캔버스 (z-index 50)
    const grubCanvas = document.createElement('canvas');
    grubCanvas.width = W;
    grubCanvas.height = H;
    grubCanvas.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:50;';
    charactersContainer.appendChild(grubCanvas);
    const gCtx = grubCanvas.getContext('2d');

    const SEGMENTS = 9;
    const HEAD_R = 22;
    const SEG_R = 16;
    const SEG_GAP = SEG_R * 1.6;
    const SPEED = 113;

    let traveled = 0;
    let wiggle = 0;
    let done = false;
    let lastTime = null;
    const history = [];

    function drawGrubFull(gc, head, activeSeg, wigAngle) {
        // Body segments (drawn from back to front)
        for (let s = activeSeg; s >= 1; s--) {
            // history index based on gap and speed
            const hIdx = Math.min(Math.round(s * SEG_GAP / (SPEED / 60)), history.length - 1);
            if (hIdx < 0) continue;

            const pos = history[hIdx];
            const hPrev = history[Math.min(hIdx + 3, history.length - 1)];
            const dx = pos.x - (hPrev ? hPrev.x : pos.x);
            const dy = pos.y - (hPrev ? hPrev.y : pos.y);
            const len = Math.hypot(dx, dy) || 1;

            // Wobble effect
            const wobble = Math.sin(wigAngle - s * 0.8) * 6;
            const alpha = 0.3 + 0.7 * (1 - s / (SEGMENTS + 1));

            drawGrubSegment(gc,
                pos.x + (-dy / len) * wobble,
                pos.y + (dx / len) * wobble,
                SEG_R * Math.max(0.65, 1 - s * 0.03),
                alpha
            );
        }

        // Head
        drawGrubHead(gc, head.x, head.y, HEAD_R, player.faceImg, wigAngle);
    }

    let lastTraveled = 0;

    function tick(now) {
        if (!state.isRunning) return; // 리셋 시 즉시 중단
        if (lastTime === null) lastTime = now;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (!done) {
            lastTraveled = traveled;
            traveled = Math.min(traveled + SPEED * dt, totalPathLen);

            // Crawl rhythmic sound
            const stepDist = 25;
            if (Math.floor(traveled / stepDist) > Math.floor(lastTraveled / stepDist)) {
                ComicAudio.play('crawl');
            }

            if (traveled >= totalPathLen) {
                done = true;
                addComicPopup(posAtDist(traveled).x, posAtDist(traveled).y);
            }

            // Junction popup logic
            let prevSeg = 0, currentSeg = 0;
            let acc = 0;
            for (let i = 0; i < path.length - 1; i++) {
                const sl = Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
                if (lastTraveled >= acc && lastTraveled < acc + sl) prevSeg = i;
                if (traveled >= acc && traveled < acc + sl) currentSeg = i;
                acc += sl;
            }
            if (currentSeg > prevSeg) {
                addComicPopup(path[currentSeg].x, path[currentSeg].y);
            }
        }

        // Update history for tail segments
        const headPos = posAtDist(traveled);
        history.unshift({ x: headPos.x, y: headPos.y });
        if (history.length > SEGMENTS * 25) history.pop();

        wiggle += done ? 0 : 9 * dt;

        drawTrail(traveled);
        gCtx.clearRect(0, 0, W, H);
        drawGrubFull(gCtx, headPos, SEGMENTS, wiggle);
        drawComicPopups(gCtx, dt);

        if (!done) {
            requestAnimationFrame(tick);
        } else {
            startTailFold(headPos);
        }
    }

    // ── 꼬리 접기: 뒤 세그먼트부터 하나씩 사라짐
    function startTailFold(finalHead) {
        let activeSeg = SEGMENTS;
        function foldStep() {
            if (!state.isRunning) return; // 리셋 시 중단
            gCtx.clearRect(0, 0, W, H);
            drawGrubFull(gCtx, finalHead, activeSeg, 0);
            if (activeSeg > 0) {
                activeSeg--;
                setTimeout(() => requestAnimationFrame(foldStep), 60);
            } else {
                // 모두 접힘 → 얼굴만 남음
                startHeadBounce(finalHead);
            }
        }
        requestAnimationFrame(foldStep);
    }

    // ── 얼굴만 남은 후 도착 바운스 애니메이션
    function startHeadBounce(finalHead) {
        if (!state.isRunning) return; // 리셋 시 중단
        ComicAudio.stopBgm(); // BGM 정지
        ComicAudio.play('tada'); // 도착 축하 소리
        let bf = 0;
        function bounce() {
            if (!state.isRunning) return; // 리셋 시 중단
            gCtx.clearRect(0, 0, W, H);
            const sc = 1 + 0.25 * Math.abs(Math.sin(bf * 0.22));
            gCtx.save();
            gCtx.translate(finalHead.x, finalHead.y);
            gCtx.scale(sc, sc);
            gCtx.translate(-finalHead.x, -finalHead.y);
            drawGrubHead(gCtx, finalHead.x, finalHead.y, HEAD_R + 5, player.faceImg, 0);
            gCtx.restore();
            bf++;
            if (bf < 120) requestAnimationFrame(bounce);
        }
        requestAnimationFrame(bounce);

        const rlbl = document.getElementById(`rlbl-${finalCol}`);
        if (rlbl) rlbl.classList.add('result-highlight');
        showToast(`🎉 결과: ${state.players[finalCol].result}!`, 5000);
        player.moving = false;
        player.finished = true; // 도착 완료 상태로 변경
    }

    requestAnimationFrame(tick);
}

function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// =====================================================
// RESET
// =====================================================
document.getElementById('reset-btn').addEventListener('click', () => {
    state.isRunning = false; // 모든 애니메이션 루프 중단
    ComicAudio.stopBgm();    // 음악 즉시 중지

    // 상태 초기화
    state.players.forEach(p => {
        p.moving = false;
        p.finished = false;
    });
    state.currentPlayerIndex = 0;

    // 컨테이너 비우기 (추가된 캔버스들 제거)
    charactersContainer.innerHTML = '';

    // 설정 화면의 스테퍼 등 초기값 복구 (선택 사항)
    playerCountInput.value = 4;
    updateStepper(0);

    setScreen('setup');
});
