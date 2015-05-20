window.addEventListener("load", function(e) {
    var currentSlide = 0;

    function slideSwitch(num) {
        if (document.getElementById("slide"+(currentSlide + num))) {
            currentSlide += num;
        } // else slide doesn't exist and there's nothing to switch to
        window.location.hash = "#slide"+currentSlide;
    }
    document.addEventListener("keydown", function(e) {
        //e.preventDefault();
        if(e.keyCode === 37 || e.keyCode === 33 || e.keyCode === 38 || e.keyCode === 8) {
            slideSwitch(-1);
        } else {
            slideSwitch(1);
        }
    });

    document.addEventListener("click", function() {
        slideSwitch(1)
    });

    function wheel(e) {
        e.preventDefault();
    }
    if (window.addEventListener) {
      window.addEventListener('DOMMouseScroll', wheel, false);
    }
    window.onmousewheel = document.onmousewheel = wheel;


    slideSwitch(0);
});

