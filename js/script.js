// js/script.js


// スクロール時にヘッダーの背景色を変更する
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
        header.classList.add('is-scrolled');
    } else {
        header.classList.remove('is-scrolled');
    }
});

// 星座の線を描画する関数
function drawConstellation() {
    const svg = document.getElementById('constellation-svg');
    svg.innerHTML = '';

    const stars = document.querySelectorAll('[data-star]');
    const scrollY = window.scrollY || window.pageYOffset;

    const points = Array.from(stars).map(el => {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + scrollY + rect.height / 2,
        };
    });

    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', document.body.scrollHeight);

    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#C3A364');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('stroke-opacity', '0.4');
    svg.appendChild(path);

    // 星本体(◆)も同じ座標にまとめて描く場合はここでcircle/pathを追加
    points.forEach((p, i) => {
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        star.setAttribute('cx', p.x);
        star.setAttribute('cy', p.y);
        star.setAttribute('r', i % 3 === 0 ? 4 : 2); // 3個に1個だけ大きく＝強弱をつける
        star.setAttribute('fill', '#F3F0E8');
        star.setAttribute('opacity', i % 3 === 0 ? 1 : 0.7);
        svg.appendChild(star);
    });
}

// 連続で呼ばれても、最後の1回だけ実行する(resizeの負荷対策)
function debounce(fn, delay = 150) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

window.addEventListener('load', drawConstellation);
window.addEventListener('resize', debounce(drawConstellation));

// フォント読み込み完了後にも再描画する
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawConstellation);
}

