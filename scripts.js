document.addEventListener("keypress", slideSwitch);
document.addEventListener("click", slideSwitch);

function slideSwitch(e) {
	e.preventDefault();
	window.scrollBy(0, window.innerHeight)
}

function load() {
	setTimeout(function() {
			window.scrollTo(0, 0);
	}, 0);
}
