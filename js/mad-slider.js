/* mad slider 2024-05-21 */
document.addEventListener("DOMContentLoaded",function() {
    var sliders = document.querySelectorAll('.mad-slider');
    if (sliders) {
        sliders.forEach(function(item) { madSlider(item)} );
    }
});

function madSlider(wrapper, goto = 0) {
    var params = wrapper.dataset.config ? JSON.parse(wrapper.dataset.config) : {};

    var slidesPerView = params.slidesPerView ? params.slidesPerView : 1,
        slideMinWidth = params.slideMinWidth ? params.slideMinWidth : 0,
        autoplay = params.autoplay ? params.autoplay : 0, playid,
        counter = false,
        loop = (params.loop == undefined ? true : params.loop),
        pagination = params.pagination ? (params.pagination == true ? wrapper.querySelector('.mad-slider-pagination') : document.querySelector(params.pagination)) : NaN, paginationItems,
        breakpoints = params.breakpoints ? params.breakpoints : NaN,
        windowbreakpoints = params.windowbreakpoints ? params.windowbreakpoints : NaN;

    if (params.arrows) {
        if (params.prev) document.querySelector(params.prev).addEventListener('click', function () { clearInterval(playid); shiftSlide(-1) });
        if (params.next) document.querySelector(params.next).addEventListener('click', function () { clearInterval(playid); shiftSlide(1) });
        if (wrapper.querySelector('.mad-slider-prev')) {
            wrapper.querySelector('.mad-slider-prev').addEventListener('click', function () { clearInterval(playid); shiftSlide(-1) });
        }
        if (wrapper.querySelector('.mad-slider-next')) {
            wrapper.querySelector('.mad-slider-next').addEventListener('click', function () { clearInterval(playid); shiftSlide(1) });
        }

        counter = (params.counter == true ? wrapper.querySelector('.mad-slider-counter') : document.querySelector(params.counter));
    }

    var items = wrapper.querySelector('.mad-slides');
    var gap = parseFloat(window.getComputedStyle(items, null).getPropertyValue("gap")); 
    if (!gap) gap = 0;

    var posX1 = 0, posX2 = 0, posInitial, posFinal, i, posY1 = 0, posY2 = 0, noshift = false,
        slides = items.getElementsByClassName('mad-slide'),
        slidesLength = slides.length,
        slidesShift = loop ? slides.length : 0,
        slideSize = wrapper.offsetWidth / slidesPerView,
        threshold = slideSize / 10,
        index = 0,
        allowShift = true,
        autoheight = params.height && params.height == 'auto';

    if (counter) counter.innerHTML = (goto + 1) + " / " + slidesLength;    

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
        if (pagination.innerHTML == '') {
            for (i = 0; i < slidesLength; i++) {
                var button = document.createElement("span");
                button.classList.add('mad-slider-button');
                if (i == 0) button.classList.add('active');
    
                button.dataset.index = i;
                button.addEventListener('click', function () {
                    gotoSlide(this.dataset.index);
                });
                pagination.appendChild(button);
            }

            paginationItems = Array.from(pagination.getElementsByClassName('mad-slider-button'));

        } else {
            for (const child of pagination.children) {
                child.addEventListener('click', function () {
                    gotoSlide(this.dataset.index);
    
                    Array.from(pagination.children).forEach(element => {
                        element.classList.remove('active');
                    });
                    this.classList.add('active');
                });
            }

            paginationItems = Array.from(pagination.children);
        }
    }

    /* Mouse events */
    items.onmousedown = dragStart;
    items.onmousedup = dragEnd;
    /* Touch events */
    items.addEventListener('touchstart', dragStart, { passive: false });
    items.addEventListener('touchend', dragEnd, { passive: false });
    items.addEventListener('touchmove', dragAction, { passive: false, capture: true });
    /* Transition events */
    items.addEventListener('transitionend', checkIndex);

    function onResize() {
        if (slideMinWidth) {
            slidesPerView = parseInt(wrapper.offsetWidth / slideMinWidth);
            if (slidesPerView < 1) slidesPerView = 1;
        }

        if (breakpoints) {
            for (var [key, value] of Object.entries(breakpoints)) {
                if (wrapper.offsetWidth < parseInt(key)) {
                    slidesPerView = value;
                    break;
                }
            }
        }

        if (windowbreakpoints) {
            for (var [key, value] of Object.entries(windowbreakpoints)) {
                if (document.body.clientWidth < parseInt(key)) {
                    slidesPerView = value;
                    break;
                }
            }
        }

        gap = parseFloat(window.getComputedStyle(items, null).getPropertyValue("gap")); 
        if (!gap) gap = 0;

        slideSize = wrapper.offsetWidth / slidesPerView - (gap * (slidesPerView - 1) / (slidesPerView));
        
        threshold = slideSize / 5;
        Array.from(slides).forEach(element => {
            element.style.width = slideSize + "px";
        });

        items.style.left = -((index + slidesShift) * (slideSize + gap)) + "px";

        if (autoheight && slides.length) { 
            var h = slides[index].clientHeight;

            for (i = 1; i < slidesPerView; i++) {
                if (h < slides[index + i].clientHeight) h = slides[index + i].clientHeight;
            }
            items.style.height = h + "px";
        }


    }

    if (goto) {
        n = parseInt(goto);

        items.style.left = (-((slideSize + gap) * (n + slidesShift))) + "px";
        index = n;
    }

    onResize();
    window.addEventListener('resize', onResize);
    new ResizeObserver(onResize).observe(wrapper);

    function dragStart(e) {
        if (!allowShift) return;

        items.classList.add('dragging');
        
        clearInterval(playid);
        e = e || window.event;
        /* for mouse only */
        if (!e.touches) e.preventDefault();

        posInitial = items.offsetLeft;

        if (e.type == 'touchstart') {
            posX1 = e.touches[0].clientX;
            posY1 = e.touches[0].clientY;
        } else {
            posX1 = e.clientX;
            posY1 = e.clientY;
            document.onmouseup = dragEnd;
            document.onmousemove = dragAction;
        }
    }

    function dragAction(e) {
        e = e || window.event;

        if (noshift) return false;

        if (e.type == 'touchmove') {
            posX2 = posX1 - e.touches[0].clientX;
            posY2 = posY1 - e.touches[0].clientY;
            
        } else {
            posX2 = posX1 - e.clientX;

            var is = items.querySelectorAll('a');
            is.forEach(function(i) {
                i.style.pointerEvents = 'none';
            });
        }

        if (Math.abs(posY2) > 10) {
            noshift = true;
            posX1 = 0;
            posX2 = 0;
            return false;
        }

        if (Math.abs(posX2) > 10) {
            items.style.left = (parseInt(items.style.left.replace('px')) - parseInt(posX2)) + "px";
            if (e.type == 'touchmove') {
                posX1 = e.touches[0].clientX;
                posY1 = e.touches[0].clientY;
                
            } else {
                posX1 = e.clientX;
                posY1 = e.clientY;
            }
            return false;
        } 
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

        var is = items.querySelectorAll('a');
        is.forEach(function(i) {
            i.style.pointerEvents = '';
        });

        items.classList.remove('dragging');

        noshift = false;
        return false;
    }

    function shiftSlide(dir, action) {
        items.classList.add('shifting');

        if (allowShift) {
            if (!action) { posInitial = items.offsetLeft; }
            if (!loop) {
                if (index + dir > slidesLength - slidesPerView) {
                    dir = 0; index = slidesLength - slidesPerView; posInitial = -(slideSize + gap) * index;
                }
                if (index + dir < 0) { 
                    dir = 0; index = 0; posInitial = 0;
                }
            } 
            items.style.left = (posInitial - ((slideSize+ gap) * dir )) + "px";
            index += dir;
        };

        allowShift = dir == 0 ? true : false;

        if (paginationItems) {
            paginationItems.forEach(element => {
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
            items.style.left = (-((slideSize + gap) * (n + slidesShift))) + "px";
            index = n;
            allowShift = false;
        };

        if (paginationItems) {
            paginationItems.forEach(element => {
                element.classList.remove('active');
                if (element.dataset.index == index % slidesLength || (index == -1 && element.dataset.index == slidesLength - 1)) {
                    element.classList.add('active');
                }
            });
        }
    }

    function checkIndex() {
        items.classList.remove('shifting');

        if (index < 0) {
            index = slidesShift + index;
            items.style.left = -((index + slidesShift) * (slideSize + gap)) + "px";

        } else if (index > slidesLength - 1) {
            index = index % slidesLength;
            items.style.left = -((index + slidesShift) * (slideSize + gap)) + "px";
        }

        index = parseInt(index);

        if (autoheight && slides.length) { 
            var h = slides[index].clientHeight;

            for (i = 1; i < slidesPerView; i++) {
                if (h < slides[index + i].clientHeight) h = slides[index + i].clientHeight;
            }
            items.style.height = h + "px";
        }

        allowShift = true;

        if (counter) {
            counter.innerHTML = ((index) % slidesLength + 1) + " / " + slidesLength;
        }
    }
}