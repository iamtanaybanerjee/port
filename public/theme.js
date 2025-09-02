const themeToggleElement = document.getElementById("toggle-theme");

const setTheme = (themeName) => {
  document.querySelector("html").setAttribute("data-theme", themeName);
};

const toggleTheme = (event) => {
  if (event.target.checked) setTheme("dark");
  else setTheme("light");
};

const setInitialTheme = () => {
  const preferedTheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  if (preferedTheme) {
    themeToggleElement.checked = true;
    setTheme("dark");
  } else {
    themeToggleElement.checked = false;
    setTheme("light");
  }
};

themeToggleElement.addEventListener("change", toggleTheme);
document.addEventListener("DOMContentLoaded", setInitialTheme);
