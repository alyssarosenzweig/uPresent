document.addEventListener("keypress", slideSwitch);
document.addEventListener("click", slideSwitch);

function slideSwitch() {
	window.scrollBy(0, window.innerHeight)
}
