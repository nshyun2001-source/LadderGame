import os

new_code = r"""// =====================================================
// GRUB ANIMATION  (Canvas-based, requestAnimationFrame)
// 기능1: 지나온 경로 네온 trail 표시
// 기능2: 도착 후 꼬리 하나씩 접기 → 얼굴만 남기기
// =====================================================
async function startGrubAnimation(playerIdx) {
    const player = state.players[playerIdx];
    if (player.moving) return;
    player.moving = true;

    const { colW, PAD, TOP, BOTTOM, W, H } = state.ladderData;
    const { path, finalCol } = computePath(playerIdx);
    const startPt = { x: PAD + playerIdx * colW, y: TOP };
    const endPt   = { x: PAD + finalCol  * colW, y: BOTTOM };
    const rawPath  = [startPt, ...path, endPt];

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
        const d = Math.hypot(waypoints[i+1].x - waypoints[i].x,
                             waypoints[i+1].y - waypoints[i].y);
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
                    x: waypoints[i].x + (waypoints[i+1].x - waypoints[i].x) * t,
                    y: waypoints[i].y + (waypoints[i+1].y - waypoints[i].y) * t
                };
            }
            acc += sl;
        }
        return { x: waypoints[waypoints.length-1].x, y: waypoints[waypoints.length-1].y };
    }

    // ── 1) Trail 캔버스 (지나온 경로 네온 색상, z-index 20)
    const trailCanvas = document.createElement('canvas');
    trailCanvas.width  = W;
    trailCanvas.height = H;
    trailCanvas.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20;';
    charactersContainer.appendChild(trailCanvas);
    const tCtx = trailCanvas.getContext('2d');

    function _strokePath(ctx, dist) {
        ctx.beginPath();
        ctx.moveTo(waypoints[0].x, waypoints[0].y);
        let acc = 0;
        for (let i = 0; i < segLens.length; i++) {
            const sl = segLens[i];
            if (dist <= acc + sl) {
                const t = sl > 0 ? (dist - acc) / sl : 0;
                ctx.lineTo(
                    waypoints[i].x + (waypoints[i+1].x - waypoints[i].x) * t,
                    waypoints[i].y + (waypoints[i+1].y - waypoints[i].y) * t
                );
                break;
            } else {
                ctx.lineTo(waypoints[i+1].x, waypoints[i+1].y);
            }
            acc += sl;
        }
        ctx.stroke();
    }

    function drawTrail(dist) {
        tCtx.clearRect(0, 0, W, H);
        if (dist <= 0) return;
        tCtx.save();
        tCtx.lineCap  = 'round';
        tCtx.lineJoin = 'round';
        // 외곽 글로우
        tCtx.strokeStyle = 'rgba(105,240,174,0.2)';
        tCtx.lineWidth   = 18;
        tCtx.shadowColor = 'rgba(105,240,174,0.6)';
        tCtx.shadowBlur  = 22;
        _strokePath(tCtx, dist);
        // 본선 (네온 그린)
        tCtx.strokeStyle = 'rgba(105,240,174,0.92)';
        tCtx.lineWidth   = 5;
        tCtx.shadowBlur  = 8;
        _strokePath(tCtx, dist);
        tCtx.restore();
    }

    // ── 2) 굼뱅이 캔버스 (z-index 50)
    const grubCanvas = document.createElement('canvas');
    grubCanvas.width  = W;
    grubCanvas.height = H;
    grubCanvas.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:50;';
    charactersContainer.appendChild(grubCanvas);
    const gCtx = grubCanvas.getContext('2d');

    const SEGMENTS = 7;
    const HEAD_R   = 22;
    const SEG_R    = 16;
    const SEG_GAP  = SEG_R * 1.9;
    const SPEED    = 75; // px/s

    let traveled = 0;
    let wiggle   = 0;
    let done     = false;
    let lastTime = null;
    const history = [];

    // 전체 굼뱅이 그리기 (activeSeg 조절 가능)
    function drawGrubFull(gc, head, activeSeg, wigAngle) {
        for (let s = activeSeg; s >= 1; s--) {
            const hIdx = Math.min(Math.round(s * SEG_GAP / (SPEED / 60)), history.length - 1);
            if (hIdx < 0) continue;
            const pos   = history[hIdx];
            const hPrev = history[Math.min(hIdx + 3, history.length - 1)];
            const dx  = pos.x - (hPrev ? hPrev.x : pos.x);
            const dy  = pos.y - (hPrev ? hPrev.y : pos.y);
            const len = Math.hypot(dx, dy) || 1;
            const wobble = Math.sin(wigAngle - s * 0.9) * 5;
            const alpha  = 0.4 + 0.6 * (1 - s / (SEGMENTS + 1));
            drawGrubSegment(gc,
                pos.x + (-dy / len) * wobble,
                pos.y + ( dx / len) * wobble,
                SEG_R * Math.max(0.7, 1 - s * 0.025),
                alpha
            );
        }
        drawGrubHead(gc,
            head.x + Math.sin(wigAngle * 1.3) * 2,
            head.y,
            HEAD_R, player.faceImg, wigAngle
        );
    }

    // ── 메인 이동 tick
    function tick(now) {
        if (lastTime === null) lastTime = now;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (!done) {
            traveled = Math.min(traveled + SPEED * dt, totalPathLen);
            if (traveled >= totalPathLen) done = true;
        }

        const head = posAtDist(traveled);
        history.unshift({ x: head.x, y: head.y });
        if (history.length > SEGMENTS * 18) history.pop();

        wiggle += done ? 0 : 5 * dt;

        drawTrail(traveled);
        gCtx.clearRect(0, 0, W, H);
        drawGrubFull(gCtx, head, SEGMENTS, wiggle);

        if (!done) {
            requestAnimationFrame(tick);
        } else {
            startTailFold(head);
        }
    }

    // ── 꼬리 접기: 뒤 세그먼트부터 하나씩 사라짐
    function startTailFold(finalHead) {
        let activeSeg = SEGMENTS;
        function foldStep() {
            gCtx.clearRect(0, 0, W, H);
            drawGrubFull(gCtx, finalHead, activeSeg, 0);
            if (activeSeg > 0) {
                activeSeg--;
                setTimeout(() => requestAnimationFrame(foldStep), 90);
            } else {
                // 모두 접힘 → 얼굴만 남음
                startHeadBounce(finalHead);
            }
        }
        requestAnimationFrame(foldStep);
    }

    // ── 얼굴만 남은 후 도착 바운스 애니메이션
    function startHeadBounce(finalHead) {
        let bf = 0;
        function bounce() {
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
    state.players.forEach(p => { p.moving = false; });
    setScreen('setup');
});
"""

path = '/Users/nosanghyeon/Antigravity/LadderGame/script.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep lines 1-442 (index 0-441), replace from line 443 onward
keep = lines[:442]
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(keep)
    f.write(new_code)

print("Done! Lines kept:", len(keep))
with open(path, 'r') as f:
    total = sum(1 for _ in f)
print("Total lines now:", total)
