window.addEventListener("load", function(e) {
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

			if(getBulletPointCount(currentSlide) > 0 && listIndex < getBulletPointCount(currentSlide)) {
				for(var i = 0; i < slide.children.length; ++i) {
					if(slide.children[i].tagName == "UL") {
						var bullet = slide.children[i].children[listIndex];
						if(bullet) bullet.style.visibility = bullet.style.visibility != 'visible' ? 'visible' : 'hidden';
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
});
