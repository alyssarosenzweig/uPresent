var currentSlide = 0;

function slideSwitch(num) {
	if(document.getElementById("slide"+(currentSlide + num))) {
		currentSlide += num;
		window.location.hash = "#slide"+currentSlide;
	} // else slide doesn't exist and there's nothing to switch to
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


