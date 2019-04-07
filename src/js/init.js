const COMMIT_LIST_CLASS = "commits-listing commits-listing-padded js-navigation-container js-active-navigation-container";
const FOOTER_CLASS = "paginate-container";
const BUTTON_CLASS = "btn btn-outline BtnGroup-item";
const GROUP_TITLE_CLASS = "commit-group-title";
const TIMEOUT_STRING = "Request took to long! Click to try again.";

let commitList;
let newPagination;
let isLoading = false;

// handle user landing on commits page
if(shouldInit()) {
    init();
}
document.addEventListener("scroll", debounce(shouldPaginate, 300));

//handle user lands on github and navigates to commits page
document.addEventListener("pjax:end", function() {
    if (shouldInit()) {
        init();
    }
});

/**
 * Determines whether script should execute based on the window url.
 * 
 * @returns { boolean }
 *          True if script should execute, False otherwise.
 */
function shouldInit() {
    return /https:\/\/github\.com\/[^\/]+\/[^\/]+\/commits/g.exec(window.location.href);
}

/**
 * Initializes script vars.
 */
function init() {
    commitList = getCommitList(document);
    newPagination = pagination(document);
    hidePaginationButtons();
}

/**
 * Loads and appends the commit list of the next url specified by getOlderURL().
 * 
 * @param   { Document } dom
 *          The Document object from which, all operations will be done.
 */
function pagination(dom) {
    let currDom = dom;
    let olderCommitsUrl = getOlderURL(currDom);
    let lastCommitDate = getLastCommitDate(getCommitList(currDom));

    return () => {
        hideLoader();
        if (isLoading) {
            return;
        }
        isLoading = true;
        lastCommitDate = getLastCommitDate(getCommitList(currDom))
    
        if (olderCommitsUrl) {
            showLoader();
            const timer = setTimeout(() => {
                isLoading = false;
                handleTimeout();
            }, 5000);

            getNextCommitList(olderCommitsUrl, dom => {
                resetTimeout(timer);
                isLoading = false;
                hideLoader();
                currDom = dom;
                appendCommitList(dom, lastCommitDate);
                olderCommitsUrl = getOlderURL(currDom)
            });
        }
    }
}

/**
 * From 'underscore.js'
 * 
 * Creates and returns a new debounced version of the passed function which
 * will pospone execution until after 'wait' milliseconds have elapsed.
 * 
 * @param   { function } func
 *          The function to be invoked.
 * @param   { number } wait
 *          The interval (in milliseconds), after which func will be re-invoked.   
 * @param   { boolean } immediate
 *          True if func should be invoked on the leading instead of trailing
 *          edge of the wait interval.
 * 
 * @returns { function }
 *          the debounced version of func.
 */
function debounce(func, wait, immediate) {
    let timeout;

    return () => {
        const context = this;
        const args = arguments;
        const later = () => {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (immediate && !timeout) {
            func.apply(context, args);
        }
    };
}

/**
 * Displays a loading animation on page.
 */
function showLoader() {
    const bottom = document.getElementsByClassName(FOOTER_CLASS)[0];

    const loaderContainer = document.createElement("div");
    loaderContainer.className = "loader-container";

    const loader = document.createElement("div");
    loader.className = "loader";

    loaderContainer.appendChild(loader);
    bottom.appendChild(loaderContainer);
}

/**
 * Hides a displayed loading animation on page.
 */
function hideLoader() {
    const loader = document.getElementsByClassName("loader-container")[0];
    if (loader) {
        loader.remove();
    }
}

/**
 * Calls Paginate if the first html in document of class, FOOTER_CLASS, is
 * completely visible.
 */
function shouldPaginate() {
    const bottom = document.getElementsByClassName(FOOTER_CLASS)[0];
    if (isScrolledIntoView(bottom)) {
        newPagination();
    }
}

/**
 * Get the href of the "Older" button which should give an older commit list.
 * 
 * @param   { Document } dom
 *          The dom object from which, we will grab the next commit list URL.
 * 
 * @returns { URL }
 *          The URL of the next commit list to load.
 */
function getOlderURL(dom) {
    const bottom = dom.getElementsByClassName(FOOTER_CLASS)[0];
    const bottomButtons = bottom.getElementsByClassName(BUTTON_CLASS);
    const olderButton = bottomButtons[bottomButtons.length - 1];
    const olderURL = olderButton.href;

    return olderURL;
}

/**
 * From 'https://stackoverflow.com/a/22480938'
 * 
 * Determines if a given element has been scrolled into view.
 * 
 * @param   { Element } element
 *          The element to test.
 * 
 * @returns { boolean | null }
 *          null if element is null
 *          or
 *          True if element is visible, False otherwise.
 */
function isScrolledIntoView(element) {
    if (element == null) {
        return null;
    }

    const top = element.getBoundingClientRect().top;
    const bottom = element.getBoundingClientRect().bottom;

    return (top >= 0) && (bottom <= window.innerHeight);
}

/**
 * Displays a retry button at bottom of page.
 */
function handleTimeout() {
    const bottom = document.getElementsByClassName(FOOTER_CLASS)[0];

    const retryButton = document.createElement("button");
    retryButton.id = "icRetryButton";
    retryButton.className = BUTTON_CLASS;
    retryButton.innerHTML = TIMEOUT_STRING;
    retryButton.addEventListener("click", () => {
        retryButton.parentNode.removeChild(retryButton);
        newPagination();
    });

    bottom.appendChild(retryButton);

    hideLoader();
}

/**
 * Resets timer, hides retry button.
 * 
 * @param   { number } timer 
 *          A Number, representing the ID value of the timer that is set. Use 
 *          this value with the clearTimeout() method to cancel the timer.
 */
function resetTimeout(timer) {
    clearTimeout(timer);

    const retryButton = document.getElementById("icRetryButton");
    if (retryButton) {
        retryButton.parentNode.removeChild(retryButton);
    }
}

/**
 * Hides Older/Newer navigation buttons.
 */
function hidePaginationButtons() {
    const bottom = document.getElementsByClassName(FOOTER_CLASS)[0];
    const bottomButtons = bottom.getElementsByClassName(BUTTON_CLASS);
    const newerButton = bottomButtons[0];
    const olderButton = bottomButtons[bottomButtons.length - 1];

    newerButton.style.visibility = "hidden";
    olderButton.style.visibility = "hidden";
}

/**
 * 
 * @param   { Document } dom 
 * @param   { string } lastCommitDate 
 */
function appendCommitList(dom, lastCommitDate) {
    const olderCommitList = getCommitList(dom);
    const firstCommitDate = getFirstCommitDate(commitList);

    // commits on next page are of a different date
    if (firstCommitDate !== lastCommitDate) {
        // don't need to aggregate dates, so just append html
        commitList.innerHTML += olderCommitList.innerHTML;
    } else {
        let newList = [].slice.call(olderCommitList.childrent);

        // save the commit list items
        let head = newList[1];

        // save the headers and list items after the first group
        let tail = newList.slice(2, newList.length);
        let tailStr = "";
        
        for (const element of tail) {
            tailStr += element.outerHTML;
        }

        appendSameDate(document, head.innerHTML);
        commitList.innerHTML += tailStr;
    }
}

/**
 * Aggregates commit date html and appends content accordingly.
 * 
 * @param   { Document } dom
 *          The document object containing the commit list we will be appending
 * t        to.
 * @param   { Node } append
 *          The html to append.
 */
function appendSameDate(dom, append) {
    let lastCommit = dom.getElementsByClassName(COMMITS_GROUP_CLASS);
    lastCommit = lastCommit[lastCommit.length-1];
    lastCommit.innerHTML += append;
  }

/**
 * Gets the commit list html from the given Document object.
 * 
 * @param   { Document } dom
 *          The dom object from which, the commit list should be grabbed.
 * 
 * @returns { Node }
 *          The first element, having class COMMIT_LIST_CLASS found in
 *          dom, if any.
 */
function getCommitList(dom) {
    return dom.getElementsByClassName(COMMIT_LIST_CLASS)[0];
}

/**
 * Parses a given Document Node for a last commit date string.
 * 
 * @param   { Node } commitListNode
 *          The commit list node object.
 * 
 * @returns { string }
 *          The text content representing last group commit date.
 */
function getLastCommitDate(commitListNode) {
    let titles = commitListNode.getElementsByClassName(GROUP_TITLE_CLASS);
    return titles[titles.length - 1].textContent;
}

/**
 * Parses a given Document Node for a first commit date string.
 * 
 * @param   { Node } commitListNode
 *          The commit list node object.
 * 
 * @returns { string }
 *          The text content representing last group commit date.
 */
function getFirstCommitDate(commitListNode) {
    let titles = commitListNode.getElementsByClassName(GROUP_TITLE_CLASS);
    return titles[0].textContent;
  }

/**
 * From 'https://www.w3schools.com/xml/dom_httprequest.asp'
 *
 * Makes a GET request for older commits page. 
 * 
 * @param   { URL } url
 *          The url to request.  
 * @param   { function } callback
 *          A callback function to handle the results of the request. 
 */
function getNextCommitList(url, callback) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(textToDOM(this.responseText));
        }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

/**
 * Parses text at html
 * 
 * @param   { string } text 
 * 
 * @returns { } TODOTODOTODO
 */
function textToDOM(text) {
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(text, "text/html");
    return htmlDoc;
  }