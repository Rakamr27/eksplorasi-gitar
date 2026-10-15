const root = document.documentElement;
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animasi muncul-saat-scroll aktif kalau pengguna tidak mematikan animasi
if (!prefersReduced) root.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {

    const header = document.querySelector('.site-header');
    const progress = document.querySelector('.progress');
    const heroBg = document.querySelector('.hero-bg');
    const menuBtn = document.querySelector('.menu-btn');

    /* ---------- Scroll: header, progres, parallax hero ---------- */
    let ticking = false;
    const onScroll = () => {
        const max = root.scrollHeight - innerHeight;
        progress.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
        header.classList.toggle('scrolled', scrollY > 40);

        if (!prefersReduced && scrollY < innerHeight * 1.2) {
            heroBg.style.translate = `0 ${(scrollY * 0.18).toFixed(1)}px`;
        }
        ticking = false;
    };
    addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    /* ---------- Menu mobile ---------- */
    const setMenu = open => {
        header.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    };
    menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('open')));
    document.querySelectorAll('.main-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

    /* ---------- Muncul saat di-scroll ---------- */
    document.querySelectorAll('[data-stagger]').forEach(group => {
        [...group.children].forEach((child, i) => {
            child.setAttribute('data-reveal', '');
            child.style.setProperty('--i', i);
        });
    });

    if (!prefersReduced) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
        document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
    }

    /* ---------- Carousel jenis gitar ---------- */
    const track = document.querySelector('.carousel-track');
    const slides = [...track.children];
    const roll = document.querySelector('.count-roll');
    let current = 0;

    const setActive = i => {
        current = i;
        slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
        roll.style.setProperty('--n', i);
    };

    const goTo = (i, smooth = true) => {
        i = (i + slides.length) % slides.length;
        track.scrollTo({ left: slides[i].offsetLeft, behavior: (prefersReduced || !smooth) ? 'auto' : 'smooth' });
        setActive(i);
    };

    // slide yang paling terlihat menjadi aktif (berlaku juga saat digeser jari)
    const slideObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) setActive(slides.indexOf(entry.target));
        });
    }, { root: track, threshold: 0.6 });
    slides.forEach(s => slideObserver.observe(s));

    document.querySelectorAll('.arrow').forEach(btn => {
        btn.addEventListener('click', () => goTo(current + Number(btn.dataset.dir)));
    });

    track.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
    });

    // tautan "Akustik / Listrik / Bass" langsung membuka slide yang sesuai
    document.querySelectorAll('[data-slide]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            setMenu(false);
            goTo(Number(link.dataset.slide));
            document.getElementById('spotlight').scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        });
    });

    setActive(0);
    const fromHash = slides.findIndex(s => '#' + s.id === location.hash);
    if (fromHash > -1) goTo(fromHash, false);

    // log sederhana saat link sumber diklik (link tetap terbuka normal)
    document.querySelectorAll('.text-link').forEach(link => {
        link.addEventListener('click', function () {
            console.log('Mengarahkan ke referensi: ' + this.href);
        });
    });

    /* ---------- Gelombang senar di hero ---------- */
    const canvas = document.querySelector('.waves');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w = 0, h = 0, t = 0, raf = null;

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            const base = h * 0.70;
            const small = w < 700 ? 0.6 : 1;
            for (let i = 0; i < 6; i++) {
                const amp = (10 + i * 5) * small;
                const k = 1.2 + i * 0.35;
                const speed = 0.6 + i * 0.12;
                ctx.beginPath();
                for (let x = 0; x <= w; x += 6) {
                    // ujung gelombang terkunci seperti senar yang dijepit
                    const env = Math.sin(Math.PI * x / w);
                    const y = base + (i - 2.5) * 12 * small +
                        Math.sin((x / w) * Math.PI * 2 * k + t * speed + i) * amp * env;
                    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = `rgba(199, 154, 75, ${0.55 - i * 0.065})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        };

        const resize = () => {
            const dpr = Math.min(devicePixelRatio || 1, 2);
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw();
        };

        const loop = ts => { t = ts / 1000; draw(); raf = requestAnimationFrame(loop); };

        addEventListener('resize', resize);
        resize();

        if (!prefersReduced) {
            // animasi hanya jalan saat hero terlihat
            new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting && !raf) raf = requestAnimationFrame(loop);
                else if (!entry.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
            }).observe(canvas);
        }
    }

    /* ---------- Tombol tanya melayang ---------- */
    const fab = document.querySelector('.fab');
    if (fab) {
        if (!prefersReduced) {
            setTimeout(() => fab.classList.add('show-bubble'), 4500);
            setTimeout(() => fab.classList.remove('show-bubble'), 10500);
        }
        // sembunyi saat form kontak sudah terlihat
        new IntersectionObserver(([entry]) => {
            fab.classList.toggle('hidden', entry.isIntersecting);
        }, { threshold: 0.25 }).observe(document.getElementById('kontak'));
    }

    /* ---------- Form kontak ---------- */
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    const submitBtn = form.querySelector('button');
    const submitText = submitBtn.querySelector('.btn-text');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const nama = document.getElementById('nama').value.trim();
        const pesan = document.getElementById('pesan').value.trim();

        status.className = '';
        void status.offsetWidth; // restart animasi status

        if (nama === '' || pesan === '') {
            status.className = 'error';
            status.textContent = 'Nama dan pesan wajib diisi.';
            return;
        }

        status.className = 'ok';
        status.textContent = 'Pesan dari ' + nama + ' berhasil dikirim.';
        form.reset();

        // tombol berubah jadi centang sebentar
        submitBtn.classList.remove('sent');
        void submitBtn.offsetWidth;
        submitBtn.classList.add('sent');
        submitText.textContent = 'Terkirim';
        setTimeout(() => {
            submitBtn.classList.remove('sent');
            submitText.textContent = 'Kirim pesan';
        }, 2600);
    });
});