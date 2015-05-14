var currentSlide = 0;

function slideSwitch(num) {
	currentSlide += num;
	window.location.hash = "#slide"+currentSlide;
}

document.addEventListener("keydown", function(e) {
		e.preventDefault();

		if(e.keyCode == 37 || e.keyCode == 38) {
			// up / left
			slideSwitch(-1);
		} else {
			slideSwitch(1);
		}
	});

document.addEventListener("click", function() {
		slideSwitch(1)
	});


