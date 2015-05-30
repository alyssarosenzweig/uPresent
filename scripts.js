var currentSlide = 0;
var blankSlide = false;
var actualSlide = null;
var listIndex = -1;

function getBulletPointCount(slideNum) {
    var slide = document.getElementById("slide" + slideNum);

    var count = 0;
    
    for(var i = 0; i < slide.children.length; ++i) {
        if(slide.children[i].tagName == "UL") {
            count += slide.children[i].children.length;
        }
    }

    return count;
}

function slideSwitch(num) {
    actualSlide = document.getElementById("slide"+currentSlide);
    var slide = actualSlide;

    // only perform fancy bullet point transitions if requested by the presentation
    
    if(actualSlide.className.indexOf("transbullets") > -1) {
        if(num > 0)
            listIndex += num;

        var count = 0;

        if(getBulletPointCount(currentSlide) > 0 && listIndex < getBulletPointCount(currentSlide)) {
            for(var i = 0; i < slide.children.length; ++i) {
                if(slide.children[i].tagName == "UL") {
                    if(listIndex - count >= slide.children[i].children.length) {
                        count += slide.children[i].children.length;             
                    } else {
                        var bullet = slide.children[i].children[listIndex - count];
                        if(bullet) bullet.style.visibility = bullet.style.visibility != 'visible' ? 'visible' : 'hidden';
                        break;
                    }
                }
            }

            if(num < 0)
                listIndex += num;

            if(listIndex > -2) return;
        }

        if(num > 0)
            listIndex = -1;
        else
            listIndex = getBulletPointCount(currentSlide - 1) - 1;
    }

    // only switch slides if there is a slide to switch to

    if (document.getElementById("slide"+(currentSlide + num)))
        currentSlide += num;
    
    window.location.hash = "#slide"+currentSlide;
}

function makeBlankSlide(actuallyBlank) {
    var slide = document.getElementById("slide"+(currentSlide));
    
    if(!blankSlide && actuallyBlank) {
        slide.style.visibility = 'hidden';
        blankSlide = true;
    } else if(blankSlide) {
        slide.style.visibility = 'visible';
        blankSlide = false;
    }
}

function onKeydown(e) {
    e.preventDefault();

    if(e.keyCode == 17) return; // ctrl-key

    if(e.keyCode === 37 || e.keyCode === 33 || e.keyCode === 38 || e.keyCode === 8) {
        makeBlankSlide(false);
            slideSwitch(-1);
    } else if(e.keyCode == 190) { // blank slide
        makeBlankSlide(true);
    } else if(e.keyCode == 116 || e.keyCode == 27 || (e.keyCode == 70 && (e.ctrlKey || e.metaKey))) { // fullscreen --- start presentation button on my clicker
        var elem = document.documentElement;

        if(elem.requestFullScreen) elem.requestFullScreen();
        else if(elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if(elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        }
    } else {
        makeBlankSlide(false);
        slideSwitch(1);
    }
}

function onClick(e) {
    // switch differently based on which button is pressed
    slideSwitch( e.which == 1 ? 1 : -1 );
}

function onWheel(e) {
    e.preventDefault();
}

// register event handlers once the document loads

window.addEventListener("load", function() {
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onClick);

    if (window.addEventListener) {
      window.addEventListener('DOMMouseScroll', onWheel, false);
    }

    window.onmousewheel = document.onmousewheel = onWheel;

    window.location.hash = "#slide0";  // prevents some weird bugs
});
