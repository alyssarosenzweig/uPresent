window.addEventListener("load", function(e) {
    var currentSlide = 0;
    var blankSlide = false;

    function slideSwitch(num) {
        if (document.getElementById("slide"+(currentSlide + num))) {
            currentSlide += num;
        } // else slide doesn't exist and there's nothing to switch to
        window.location.hash = "#slide"+currentSlide;
    }

    function makeBlankSlide(actuallyBlank) {
	    var slide = document.getElementById("slide"+(currentSlide));
	    
	    if(!blankSlide) {
	    	if(actuallyBlank) {
	   		slide.style.visibility = 'hidden';
			blankSlide = true;
		}
	    } else {
	    	slide.style.visibility = 'visible';
	    	blankSlide = false;
	    }
    }

    document.addEventListener("keydown", function(e) {
        e.preventDefault();
        console.log(e.keyCode);
	
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
    });

    document.addEventListener("click", function(e) {
	e.preventDefault();

	// switch differently based on which button is pressed

	if(e.which == 1) {
		slideSwitch(1);
	} else {
		slideSwitch(-1);
	}
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

