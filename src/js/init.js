let listClass = "commits-listing commits-listing-padded js-navigation-container js-active-navigation-container";
let groupTitleClass = "commit-group-title";
let commitsGroupClass = "commit-group table-list table-list-bordered";
let baseURL = "https://github.com/";

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
      let url = baseURL + afterURL;
      requestPage(url, function(dom) {
        curDom = dom;
        firstCommitDate = appendList(dom, lastCommitDate);
      })
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
  let lastCommit = dom.getElementsByClassName(commitsGroupClass);
  lastCommit = lastCommit[lastCommit.length-1];
  lastCommit.innerHTML += append;
}


function getLastCommitDate(list) {
  let titles = list.getElementsByClassName(groupTitleClass);
  return titles[titles.length - 1].textContent;
}


function getFirstCommitDate(list) {
  let titles = list.getElementsByClassName(groupTitleClass);
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
  let button = document.getElementsByClassName("paginate-container")[0];
  if (isScrolledIntoView(button)) {
    handleButton();
  }
}


function addListener() {
  let paginationButton = document.getElementsByClassName("pagination")[0];
  if (paginationButton != null) {
    paginationButton.addEventListener("click", handleButton);
  }
}

function removeListener() {
  let paginationButton = document.getElementsByClassName("pagination")[0];
  paginationButton.removeEventListener("click", handleButton);
}


// http://stackoverflow.com/a/22480938
function isScrolledIntoView(el) {
    var elemTop = el.getBoundingClientRect().top;
    var elemBottom = el.getBoundingClientRect().bottom;

    var isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    return isVisible;
}


// get the upcoming content and return it (called at page bottom)
function getAfterURL(dom) {
  let paginationButton = dom.getElementsByClassName("pagination")[0];
  if (paginationButton != null && paginationButton.children != null) {
    return paginationButton.children[0].getAttribute("href");  
  }
  else {
    return null;
  }
}


// get the future commit list to insert to container (called at page bottom, after getAfterURL)
function getCommitList(dom) {
  return dom.getElementsByClassName(listClass)[0];
}
