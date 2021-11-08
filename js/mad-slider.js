/* mad slider */
document.addEventListener("DOMContentLoaded",function() {
    var sliders = document.querySelectorAll('.mad-slider');
    if (sliders) {
        sliders.forEach(function(item) {madSlider(item)});
    }
});

function madSlider(wrapper) {
    var params = wrapper.dataset.config ? JSON.parse(wrapper.dataset.config) : {};

    var slidesPerView = params.slidesPerView ? params.slidesPerView : 1,
        slideMinWidth = params.slideMinWidth ? params.slideMinWidth : 0,
        autoplay = params.autoplay ? params.autoplay : 0, playid,
        counter = false,
        loop = (params.loop == undefined ? true : params.loop),
        pagination = params.pagination ? (params.pagination == true ? wrapper.querySelector('.mad-slider-pagination') : document.querySelector(params.pagination)) : NaN,
        breakpoints = params.breakpoints ? params.breakpoints : NaN;

    if (params.arrows) {
        var prev = params.prev ? document.querySelector(params.prev) : wrapper.querySelector('.mad-slider-prev');
        var next = params.next ? document.querySelector(params.next) : wrapper.querySelector('.mad-slider-next');

        counter = (params.counter == true ? wrapper.querySelector('.mad-slider-counter') : document.querySelector(params.counter));

        if (prev) prev.addEventListener('click', function () { clearInterval(playid); shiftSlide(-1) });
        if (next) next.addEventListener('click', function () { clearInterval(playid); shiftSlide(1) });
    }

    var items = wrapper.querySelector('.mad-slides');

    var posX1 = 0, posX2 = 0, posInitial, posFinal, i,
        slides = items.getElementsByClassName('mad-slide'),
        slidesLength = slides.length,
        slidesShift = loop ? slides.length : 0,
        slideSize = wrapper.offsetWidth / slidesPerView,
        threshold = slideSize / 3,
        index = 0,
        allowShift = true,
        autoheight = params.height && params.height == 'auto' && slidesPerView == 1 ? true : false;

    if (counter) counter.innerHTML = "1 / " + slidesLength;    

    if (autoheight) {
        for (i = 0; i < slidesLength; i++) {
            slides[i].classList.add('mad-slide-autoheight');
        }
    }

    if (autoplay) {
        playid = setInterval(function() {shiftSlide(1)}, autoplay);
    }

    /* Clone first and last slide for loop */
    if (loop) {
        for (i = 0; i < slidesLength; i++) {
            items.appendChild(slides[i].cloneNode(true));
        }
        for (i = 0; i < slidesLength; i++) {
            items.insertBefore(slides[slides.length - 1 - i].cloneNode(true), slides[0]);
        }
    }

    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "flex";
        slides[i].addEventListener('click', function (e) {
            if (posInitial != posFinal) {
                e.preventDefault();
            }
        });
    }

    /* pagination */
    if (pagination) {
        for (i = 0; i < slidesLength; i++) {
            var button = document.createElement("span");
            button.classList.add('mad-slider-button');
            if (i == 0) button.classList.add('active');

            button.dataset.index = i;
            button.addEventListener('click', function () {
                gotoSlide(this.dataset.index);

                Array.from(pagination.getElementsByClassName('mad-slider-button')).forEach(element => {
                    element.classList.remove('active');
                });
                this.classList.add('active');
            });
            pagination.appendChild(button);
        }
    }

    /* Mouse events */
    items.onmousedown = dragStart;
    items.onmousedup = dragEnd;
    /* Touch events */
    items.addEventListener('touchstart', dragStart, { passive: true });
    items.addEventListener('touchend', dragEnd, { passive: true });
    items.addEventListener('touchmove', dragAction, { passive: true });
    /* Transition events */
    items.addEventListener('transitionend', checkIndex);

    function onResize() {
        if (slideMinWidth) {
            slidesPerView = parseInt(wrapper.offsetWidth / slideMinWidth);
            if (slidesPerView < 1) slidesPerView = 1;
        }

        if (breakpoints) {
            for (var [key, value] of Object.entries(breakpoints)) {
                if (wrapper.offsetWidth < key) {
                    slidesPerView = value;
                    break;
                }
            }
        }

        slideSize = wrapper.offsetWidth / slidesPerView;
        threshold = slideSize / 3;
        Array.from(slides).forEach(element => {
            element.style.width = slideSize + "px";
            items.style.left = -((index + slidesShift) * slideSize) + "px";
        });

        if (autoheight) { 
            var h = slides[index].clientHeight;

            for (i = 1; i < slidesPerView; i++) {
                h = slides[index + i].clientHeight > h ? slides[index + i].clientHeight : h;
            }
            items.style.height = h + "px";
        }
    }

    onResize();
    window.addEventListener('resize', onResize);
    new ResizeObserver(onResize).observe(wrapper);

    function dragStart(e) {
        clearInterval(playid);
        e = e || window.event;
        /* for mouse only */
        if (!e.touches) e.preventDefault();
        if (!allowShift) return;

        posInitial = items.offsetLeft;

        if (e.type == 'touchstart') {
            posX1 = e.touches[0].clientX;
        } else {
            posX1 = e.clientX;
            document.onmouseup = dragEnd;
            document.onmousemove = dragAction;
        }
    }

    function dragAction(e) {
        e = e || window.event;

        if (e.type == 'touchmove') {
            posX2 = posX1 - e.touches[0].clientX;
            posX1 = e.touches[0].clientX;
        } else {
            posX2 = posX1 - e.clientX;
            posX1 = e.clientX;
        }
        items.style.left = (items.offsetLeft - posX2) + "px";
    }

    function dragEnd(e) {
        posFinal = items.offsetLeft;
        i = parseInt((posInitial - posFinal) / slideSize);
        if (posFinal - posInitial < -threshold) {
            shiftSlide(i + 1, 'drag');
        } else if (posFinal - posInitial > threshold) {
            shiftSlide(i - 1, 'drag');
        } else {
            shiftSlide(i, 'drag');
        }

        document.onmouseup = null;
        document.onmousemove = null;
    }

    function shiftSlide(dir, action) {
        items.classList.add('shifting');

        if (allowShift) {
            if (!action) { posInitial = items.offsetLeft; }
            if (!loop) {
                if (index + dir > slidesLength - slidesPerView) {
                    dir = 0; index = slidesLength - slidesPerView; posInitial = -slideSize * index;
                }
                if (index + dir < 0) { 
                    dir = 0; index = 0; posInitial = 0;
                }
            } 
            items.style.left = (posInitial - (slideSize * dir)) + "px";
            index += dir;
        };

        allowShift = dir == 0 ? true : false;

        if (pagination) {
            Array.from(pagination.getElementsByClassName('mad-slider-button')).forEach(element => {
                element.classList.remove('active');
                if (element.dataset.index == index % slidesLength || (index == -1 && element.dataset.index == slidesLength - 1)) {
                    element.classList.add('active');
                }
            });
        }
    }

    function gotoSlide(n) {
        clearInterval(playid);

        n = parseInt(n);
        items.classList.add('shifting');

        if (allowShift && n != index) {
            items.style.left = (-(slideSize * (n + slidesShift))) + "px";
            index = n;
            allowShift = false;
        };
    }

    function checkIndex() {
        items.classList.remove('shifting');

        if (index < 0) {
            index = slidesShift + index;
            items.style.left = -((index + slidesShift) * slideSize) + "px";

        } else if (index > slidesLength - 1) {
            index = index % slidesLength;
            items.style.left = -((index + slidesShift) * slideSize) + "px";
        }
        items.style.height = slides[index].clientHeight + "px";

        allowShift = true;

        if (counter) {
            counter.innerHTML = ((index) % slidesLength + 1) + " / " + slidesLength;
        }
    }
}