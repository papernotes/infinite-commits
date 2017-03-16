let script = document.createElement('script');
script.src = chrome.extension.getURL('src/js/init.js');
script.setAttribute("id", "infinite-script");

script.onload = () => {
  s = document.getElementById("infinite-script");
  s.parentNode.removeChild(s);
};

(document.head || document.documentElement).appendChild(script);