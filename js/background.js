let script = document.createElement('script');
script.src = "js/schedule.js";
document.body.appendChild(script);

chrome.browserAction.onClicked.addListener(function(activeTab) {
  var newURL = "https://my.uw.edu/";
  chrome.tabs.query({'url': newURL}, function(tabs) {
    if ( tabs.length > 0 ) {
      chrome.tabs.update(tabs[0].id, { 'active': true });
    } else {
      chrome.tabs.create({
        url: newURL,
        openerTabId: activeTab.id,
        index: activeTab.index + 1 }
      );
    }
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == "openNewTab") {
      chrome.tabs.query({'url': chrome.extension.getURL("uw2gcal.html")}, function(tabs) {
        if ( tabs.length > 0 ) {
          chrome.tabs.update(tabs[0].id, { 'active': true });
        } else {
          chrome.tabs.query({ currentWindow: true, active: true }, function(result) {
            chrome.tabs.create({
              url: chrome.extension.getURL("uw2gcal.html"),
              index: result[0].index + 1
            });
          })
        }
      });

      sendResponse({farewell: "goodbye"});
    }

    if (request.greeting == "newSchedule") {
      new Schedule(request.scheduleString);
      sendResponse({farewell: "goodbye"});
    }
  }
);
