// js/script.js


// スクロール時にヘッダーの背景色を変更する
const header = document.querySelector('header');
const headerLogo = document.querySelector('.header__logo img');
const sections = [...document.querySelectorAll('main section')];

function updateHeader() {
   const isScrolled = window.scrollY > 0;
   const checkPoint = header.offsetHeight / 2;

   const currentSection = sections.find(section => {
      const rect = section.getBoundingClientRect();

      return rect.top <= checkPoint &&
             rect.bottom > checkPoint;
   });

   const darkSections = [
      'fv',
      'model-course',
      'ticket'
   ];

   // トップページはid、下層ページは data-dark 属性で「暗い背景」を判定する
   const isDark = currentSection
      ? darkSections.includes(currentSection.id) ||
        currentSection.hasAttribute('data-dark')
      : false;

   header.classList.toggle('is-scrolled', isScrolled);
   header.classList.toggle('is-dark', isDark);

   headerLogo.src = isDark
      ? 'logo/logo-main-fff.svg'
      : 'logo/logo-main.svg';
}

window.addEventListener('scroll', updateHeader);
window.addEventListener('resize', updateHeader);
window.addEventListener('load', updateHeader);


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

   svg.setAttribute(
   'width',
   document.documentElement.clientWidth
);
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

// ハンバーガーメニューの開閉
const menuButton = document.querySelector('.header__menu-button');
const nav = document.querySelector('.header__nav');

if (menuButton && nav) {
   // 開閉に必要な処理を1か所にまとめる。
   // 以前は「開く」と「閉じる」で別々に書いていたため、
   // 片方に処理を足すともう片方に足し忘れる作りになっていた
   function setMenu(isOpen) {
      header.classList.toggle('is-menu-open', isOpen);

      // メニューは position:fixed で画面に貼り付いているので、
      // そのままだと指で動かしたときに「後ろのページだけ」が流れてしまう。
      // 開いている間だけ body のスクロールを止める
      document.body.classList.toggle('is-menu-locked', isOpen);

      // 支援技術に開閉状態を伝える
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
   }

   function closeMenu() {
      setMenu(false);
   }

   menuButton.addEventListener('click', () => {
      setMenu(!header.classList.contains('is-menu-open'));
   });

   // メニュー内のリンクを押したら閉じる(開いたまま残らないように)
   nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
         closeMenu();
      }
   });

   // Escキーでも閉じられるようにする
   document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
         closeMenu();
      }
   });

   // メニューの外側を触ったら閉じる。
   // スマホにはEscキーが無いので、閉じる手段がボタンだけだと戻りにくい。
   // ボタン自身の上で閉じてしまうと、上の click と打ち消し合って
   // 「押しても開かない」状態になるため、ボタンとメニューの中は除外する
   document.addEventListener('click', (e) => {
      if (!header.classList.contains('is-menu-open')) return;
      if (menuButton.contains(e.target)) return;
      if (nav.contains(e.target)) return;

      closeMenu();
   });

   // PC幅に戻したときに開きっぱなしを解除する
   window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 1200) {
         closeMenu();
      }
   }));
}

// HOW TO 02：うつぼが岩穴から現れる
const eelImage = document.querySelector(
   '.how-to-enjoy__image--02'
);

if (eelImage) {
   const eelObserver = new IntersectionObserver(
      (entries, observer) => {
         entries.forEach(entry => {
            if (entry.isIntersecting) {
               entry.target.classList.add('is-visible');
               observer.unobserve(entry.target);
            }
         });
      },
      {
         threshold: 0.45
      }
   );

   eelObserver.observe(eelImage);
}


// 下部のチケットバー：FVを通り過ぎたら出し、TICKETとフッターでは引っ込める。
// TICKETセクションには同じ「チケットを購入する」ボタンがあるため、
// 両方出ていると押し場所が2つになって迷わせてしまう
const mobileCta = document.querySelector('.mobile-cta');
const ctaHideZones = [
   document.getElementById('fv'),
   document.getElementById('ticket'),
   document.querySelector('footer')
].filter(Boolean); // ページに無い要素は捨てる(下層ページ対策)

if (mobileCta && ctaHideZones.length) {
   // 「今どこが画面に入っているか」を覚えておく。
   // 監視は要素ごとに別々に届くので、状態をまとめて持つ必要がある
   const visibleZones = new Set();

   const ctaObserver = new IntersectionObserver(
      (entries) => {
         entries.forEach(entry => {
            if (entry.isIntersecting) {
               visibleZones.add(entry.target);
            } else {
               visibleZones.delete(entry.target);
            }
         });

         // 隠したい場所がひとつも見えていないときだけ出す。
         // ウツボと違い unobserve しない。行き来のたびに切り替えたいため
         mobileCta.classList.toggle('is-visible', visibleZones.size === 0);
      },
      {
         threshold: 0 // 1pxでも重なっていれば「見えている」扱い
      }
   );

   ctaHideZones.forEach(zone => ctaObserver.observe(zone));
}
