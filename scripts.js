document.addEventListener("keypress", slideSwitch);
document.addEventListener("click", slideSwitch);

function slideSwitch(e) {
	e.preventDefault();
	window.scrollBy(0, window.innerHeight)
}

function load() {
	window.scrollTo(0, 0);
}
