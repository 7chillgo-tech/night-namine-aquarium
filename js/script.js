// js/script.js


// 「動きを減らす」設定の人には、フェードやパララックスなどの演出を出さない。
// あちこちのアニメーションから共通で参照する
const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');


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


// points(星の座標)から、角を丸めた曲線のパス文字列を作る
function buildSmoothPath(points) {
   // 点が2つ以下なら曲線にしようがないので、直線でつなぐ
   if (points.length < 3) {
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
   }

   // 曲線のふくらみの強さ。1なら星の座標そのまま。
   // 大きくするほど、星から外側へ大きく膨らんで緩やかになる
   const curveStrength = 1.6;

   // 見えない境目の点(hidden)のすぐ隣は、大きく振れた星と繋がることが多く、
   // 同じ強さで伸ばすと境目の手前でフックのように折れてしまう。
   // そこだけ伸ばさない(=星の座標そのまま)弱い強さにする
   const edgeCurveStrength = 1;

   // 最初の点から描き始める
   let d = `M ${points[0].x} ${points[0].y}`;
   let prevMid = points[0];

   // 間の点(01〜02の間、02〜03の間…)を、次の点との中点まで曲線でつなぐ。
   // 最後の区間だけは、中点ではなく本当に最後の点まで曲線を伸ばす
   // (前は直線で締めていたが、そこだけ折れて見えていたため)
   for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const isLastSegment = i === points.length - 2;

      const nextMid = isLastSegment
         ? next
         : {
              x: (current.x + next.x) / 2,
              y: (current.y + next.y) / 2,
           };

      // 弱めるのは「これから見えない点(境目)へ向かう区間」だけにする。
      // 「見えない点から出てきた直後の区間」(起点→intro)まで弱めると、
      // そこは元々ちょうど良かったのに不自然な境目ができてしまうため
      const isApproachingHiddenPoint = next.hidden;
      const strength = isApproachingHiddenPoint ? edgeCurveStrength : curveStrength;

      // prevMid〜nextMidを結んだ弦の真ん中から星へ向かう向きに、
      // strength倍だけ遠くへ伸ばした点をコントロールポイントにする。
      // これにより、鋭角だった折れ目が丸くなるだけでなく、
      // 横に長い区間(01→02など)も緩やかな弧を描くようになる
      const chordMidX = (prevMid.x + nextMid.x) / 2;
      const chordMidY = (prevMid.y + nextMid.y) / 2;

      const control = {
         x: chordMidX + (current.x - chordMidX) * strength,
         y: chordMidY + (current.y - chordMidY) * strength,
      };

      d += ` Q ${control.x} ${control.y} ${nextMid.x} ${nextMid.y}`;
      prevMid = nextMid;
   }

   return d;
}

// 星座線を「たどってきた分だけ」表示するための、
// 描画済みのpath要素とその全長(px)を覚えておく変数
let constellationPath = null;
let constellationLength = 0;

// 星座の線を描画する関数
function drawConstellation() {
    const svg = document.getElementById('constellation-svg');
    if (!svg) return; // 下層ページには#constellation-svgが無いので、ここで抜ける
    svg.innerHTML = '';

    const stars = document.querySelectorAll('[data-star]');
    const scrollY = window.scrollY || window.pageYOffset;

    const points = Array.from(stars).map(el => {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + scrollY + rect.height / 2,
            // FV・MODEL COURSEの見えない通過点には data-star-hidden を付けてある。
            // 線の形には使うが、マーカーの丸は描かないようにする
            hidden: el.hasAttribute('data-star-hidden'),
        };
    });

   svg.setAttribute(
   'width',
   document.documentElement.clientWidth
);
    svg.setAttribute('height', document.body.scrollHeight);

    // FV・MODEL COURSEには「見えない通過点」(opacity:0の星)を置いてあるので、
    // 座標を計算で作らなくても、points(すべてのdata-star要素)をそのまま
    // buildSmoothPathに渡すだけで、境目付近も含めて自然な曲線になる
    const d = buildSmoothPath(points);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#C3A364');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('stroke-opacity', '0.4');
    svg.appendChild(path);

    // 星座線を、最初から全部ではなく「スクロールでたどってきた分だけ」見せる。
    // stroke-dasharrayに線の全長を指定すると、stroke-dashoffsetで隠す量を
    // 調整できるようになる(dashoffset=全長で全部隠れる、0で全部見える)
    if (motionMedia.matches) {
        // 動きを減らす設定の人には、最初から線を全部見せる
        constellationPath = null;
    } else {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        constellationPath = path;
        constellationLength = length;
        updateConstellationDraw();
    }

    // 星本体(◆)も同じ座標にまとめて描く場合はここでcircle/pathを追加。
    // ただし見えない通過点(FV・MODEL COURSE)には丸を描かない
    points.forEach((p, i) => {
        if (p.hidden) return;

        const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        star.setAttribute('cx', p.x);
        star.setAttribute('cy', p.y);
        star.setAttribute('r', i % 3 === 0 ? 4 : 2); // 3個に1個だけ大きく＝強弱をつける
        star.setAttribute('fill', '#F3F0E8');
        star.setAttribute('opacity', i % 3 === 0 ? 1 : 0.7);

        // 星ごとに瞬きのタイミングをずらす(実際の点滅はCSSの@keyframesで行う)
        if (!motionMedia.matches) {
            star.setAttribute('class', 'constellation-star');
            star.style.setProperty('--twinkle-delay', `${(i % 5) * 0.6}s`);
        }

        svg.appendChild(star);
    });
}

// pathの中で、y座標がtargetYに一番近い位置(=線の先端からの距離)を
// 二分探索で見つける。
// 最初「ページ全体のスクロール%」で線の進み具合を決めていたが、
// 星座線はHOW TO ENJOYでジグザグに大きく横へ振れる区間と、
// ほぼまっすぐ縦に伸びる区間が混ざっているため、スクロール%と
// 線の長さ%がまったく対応せず、今見ている場所より線が
// 手前で止まって見える(=「途中で消えている」ように見える)原因になっていた。
// 実際のy座標で探すことで、今スクロールして見えている高さと
// 線の先端がずれないようにする
function getLengthAtY(path, totalLength, targetY, iterations = 24) {
    let lo = 0;
    let hi = totalLength;

    for (let i = 0; i < iterations; i++) {
        const mid = (lo + hi) / 2;
        const point = path.getPointAtLength(mid);

        if (point.y < targetY) {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    return lo;
}

// 星座線を、今のスクロール位置に応じてどこまで表示するか更新する
function updateConstellationDraw() {
    if (!constellationPath) return;

    const svg = document.getElementById('constellation-svg');
    // 1200px以下は#constellation-svg自体をCSSでdisplay:noneにしてあるので、
    // 計算しても見えないし、隠れている間はgetBoundingClientRectの値も
    // あてにならないため何もしない
    if (!svg || getComputedStyle(svg).display === 'none') return;

    const scrollY = window.scrollY || window.pageYOffset;

    // 画面のちょうど下端だと線の先端が画面外(見えない場所)になるので、
    // 少し手前(画面の85%の高さ)を「今どこまで見えているか」の基準にする
    const targetY = scrollY + window.innerHeight * 0.85;

    const length = getLengthAtY(constellationPath, constellationLength, targetY);
    constellationPath.style.strokeDashoffset = constellationLength - length;
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


// 背景画像の軽いパララックス(FV・MODEL COURSE・TICKET)。
// スクロールに対して背景だけをわずかに遅らせて動かし、奥行きを出す。
//
// 【重要】縦方向(background-position-y)ではなく横方向をずらす。
// これらの写真はどれも横長で、background-size:coverだと縦方向の
// はみ出し(=動かせる余白)がほぼ0になる(例:modelcourse.jpgは1445×600で
// 横に長いため、箱の高さに合わせて拡大すると縦の余白が消える)。
// その状態で縦にずらすと、写真の上下に背景色(何もない部分)が
// 見えてしまう。横方向は余白が十分あるので、そちらを揺らす
const parallaxSections = [
    { el: document.getElementById('fv'), naturalWidth: 1440, naturalHeight: 850 },
    { el: document.getElementById('model-course'), naturalWidth: 1445, naturalHeight: 600 },
    { el: document.getElementById('ticket'), naturalWidth: 1672, naturalHeight: 941 },
].filter(item => item.el);

function updateParallax() {
    if (!parallaxSections.length || motionMedia.matches) return;

    const viewportHeight = window.innerHeight;

    parallaxSections.forEach(({ el, naturalWidth, naturalHeight }) => {
        const rect = el.getBoundingClientRect();
        const boxWidth = rect.width;
        const boxHeight = rect.height;
        if (!boxWidth || !boxHeight) return;

        // background-size:coverと同じ考え方で、実際に表示される画像の
        // 横幅(拡大後)を求める
        const coverScale = Math.max(boxWidth / naturalWidth, boxHeight / naturalHeight);
        const renderedWidth = naturalWidth * coverScale;

        // 画像が箱よりどれだけ横にはみ出しているか。その半分までしか
        // ずらせない(それ以上ずらすと画像の端(=はみ出していない側)が
        // 見えてしまう)
        const maxOffset = Math.max((renderedWidth - boxWidth) / 2, 0);

        // 画面の縦中央からどれだけ離れているか(px)を、揺れの元にする
        const distanceFromCenter = rect.top + boxHeight / 2 - viewportHeight / 2;
        const speed = 0.05;
        const offset = Math.max(Math.min(distanceFromCenter * speed, maxOffset), -maxOffset);

        // background-positionのX成分だけを上書きする。
        // Y成分(top / 50%)は元々のCSS(background-position)のまま生きる
        el.style.backgroundPositionX = `calc(50% + ${offset}px)`;
    });
}

// 星座線の伸び具合とパララックスは、どちらもスクロール位置に依存するので
// 1つのrequestAnimationFrameにまとめて、スクロール中の負荷を抑える
let scrollEffectsTicking = false;

function updateScrollEffects() {
    updateConstellationDraw();
    updateParallax();
    scrollEffectsTicking = false;
}

window.addEventListener('scroll', () => {
    if (scrollEffectsTicking) return;
    scrollEffectsTicking = true;
    requestAnimationFrame(updateScrollEffects);
});

window.addEventListener('load', updateParallax);
window.addEventListener('resize', debounce(updateParallax));


// MODEL COURSE・TICKET(暗いセクション)で、マウスに柔らかい光が追従する演出。
// タッチ操作では位置が飛んで不自然になるため、マウスのときだけ反応させる
if (!motionMedia.matches) {
    document.querySelectorAll('.cursor-glow').forEach(glow => {
        const section = glow.closest('section');
        if (!section) return;

        section.addEventListener('pointermove', (e) => {
            if (e.pointerType && e.pointerType !== 'mouse') return;

            const rect = section.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            glow.style.setProperty('--glow-x', `${x}%`);
            glow.style.setProperty('--glow-y', `${y}%`);
            glow.classList.add('is-active');
        });

        section.addEventListener('pointerleave', () => {
            glow.classList.remove('is-active');
        });
    });
}


// スクロールで見えたらふわっと出す(INTRO・HOW TO ENJOY・MODEL COURSE共通)。
// 対象には data-reveal 属性を付けてあるだけで、実際の見た目はCSS側で定義している
const revealTargets = document.querySelectorAll('[data-reveal]');

if (revealTargets.length) {
    if (motionMedia.matches) {
        // 動きを減らす設定の人には、最初から見えている状態にする
        revealTargets.forEach(target => target.classList.add('is-revealed'));
    } else {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );

        revealTargets.forEach(target => revealObserver.observe(target));
    }
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
