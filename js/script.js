// js/script.js

const header = document.querySelector('header');
let scrollTimer;

window.addEventListener('scroll', () => {
    header.classList.add('is-hidden');   // スクロール中は透明に

    clearTimeout(scrollTimer);           // タイマーをリセット
    scrollTimer = setTimeout(() => {
        header.classList.remove('is-hidden'); // 止まって300ms後に表示
    }, 300);
});