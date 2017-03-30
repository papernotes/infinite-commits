const LIST_CLASS = "commits-listing commits-listing-padded js-navigation-container js-active-navigation-container";
const GROUP_TITLE_CLASS = "commit-group-title";
const COMMITS_GROUP_CLASS = "commit-group table-list table-list-bordered";
const BASE_URL = "https://github.com/";
const FOOTER_CLASS = "paginate-container"

let commitsList = getCommitList(document);


init();
let newPagination = paginate(document);


function init() {
  document.addEventListener("scroll", debounce(checkIfButtonVisible, 300));
  addListener();
}


function paginate(dom) {
  let curDom = dom;
  let lastCommitDate;

  return function() {
    let afterURL = getAfterURL(curDom);
    let lastCommitDate = getLastCommitDate(getCommitList(curDom));

    if (afterURL != null) {
      let url = BASE_URL + afterURL;
      requestPage(url, function(dom) {
        curDom = dom;
        firstCommitDate = appendList(dom, lastCommitDate);
      });
    }
    else {
      removeListener();
    }
  }
}


// underscore.js debounce
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}


function textToDOM(str) {
  var parser = new DOMParser();
  var htmlDoc = parser.parseFromString(str, "text/html");
  return htmlDoc;
};


function appendList(dom, commitDate) {
  list = getCommitList(dom);
  firstCommit = getFirstCommitDate(list);

  if (firstCommit !== commitDate) {
    commitsList.innerHTML += list.innerHTML;
  }
  else {
    let newList = [].slice.call(list.children);

    // save the list items
    let head = newList[1];

    // save the headers and list items after the first group
    let tail = newList.slice(2, newList.length);
    let tailStr = "";

    tail.forEach(function(el) {
      tailStr += el.outerHTML;
    });

    appendSameDate(document, head.innerHTML);
    commitsList.innerHTML += tailStr;
  }
  return firstCommit;
}


function appendSameDate(dom, append) {
  let lastCommit = dom.getElementsByClassName(COMMITS_GROUP_CLASS);
  lastCommit = lastCommit[lastCommit.length-1];
  lastCommit.innerHTML += append;
}


function getLastCommitDate(list) {
  let titles = list.getElementsByClassName(GROUP_TITLE_CLASS);
  return titles[titles.length - 1].textContent;
}


function getFirstCommitDate(list) {
  let titles = list.getElementsByClassName(GROUP_TITLE_CLASS);
  return titles[0].textContent;
}


// https://www.w3schools.com/xml/dom_httprequest.asp
function requestPage(url, callback) {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback(textToDOM(this.responseText));
    }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}


function handleButton() {
  newPagination();
}


function checkIfButtonVisible() {
  let button = document.getElementsByClassName(FOOTER_CLASS)[0];
  if (isScrolledIntoView(button)) {
    handleButton();
  }
}


function addListener() {
  let paginationButton = document.getElementsByClassName("pagination")[0];
  if (paginationButton != null) {
    paginationButton.addEventListener("click", handleButton);
  }
  else {
    let paginateContainer = document.getElementsByClassName(FOOTER_CLASS)[0];
    paginateContainer.innerHTML = `<div class="pagination">No more commits!</div>`
  }
}


function removeListener() {
  let paginationButton = document.getElementsByClassName("pagination")[0];
  if (paginationButton != null) {
    paginationButton.removeEventListener("click", handleButton);
    paginationButton.innerHTML = "No more commits!";
  }
}


// http://stackoverflow.com/a/22480938
function isScrolledIntoView(el) {
  if (el == null) {
    return null;
  }

  let elemTop = el.getBoundingClientRect().top;
  let elemBottom = el.getBoundingClientRect().bottom;

  let isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
  return isVisible;
}


// get the upcoming content and return it (called at page bottom)
function getAfterURL(dom) {
  let paginationButton = dom.getElementsByClassName("pagination")[0];
  if (paginationButton != null && paginationButton.children != null) {
    let afterURL = paginationButton.children[0].getAttribute("href")

    // remove href for clicking
    paginationButton.children[0].removeAttribute("href");
    return afterURL;  
  }
  else {
    return null;
  }
}


// get the future commit list to insert to container (called at page bottom, after getAfterURL)
function getCommitList(dom) {
  return dom.getElementsByClassName(LIST_CLASS)[0];
}
