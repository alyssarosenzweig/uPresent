document.addEventListener("keypress", slideSwitch);
document.addEventListener("click", slideSwitch);

var currentSlide = 0;

function slideSwitch(e) {
	if(e !== undefined) e.preventDefault();
	
	var slides = document.getElementsByClassName("slide");
	for(var i = 0; i < slides.length; ++i) {
		var number = slides[i].id.slice("slide".length) * 1;
		if(number > currentSlide) {
			// jump to slides[i]
			window.location.hash = "#slide" + number;
			
			currentSlide = number;
			break;
		}
	}
}

function load() {
	slideSwitch();
}
