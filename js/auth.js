
function Auth(options) {
  this.manifest = chrome.runtime.getManifest();
  this.clientId = encodeURIComponent(this.manifest.oauth2.client_id);
  this.scopes = encodeURIComponent(this.manifest.oauth2.scopes.join(' '));
  this.redirectUri = encodeURIComponent(chrome.identity.getRedirectURL());
  this.url = 'https://accounts.google.com/o/oauth2/auth' +
            '?client_id=' + this.clientId +
            '&response_type=' + encodeURIComponent("id_token token") +
            '&prompt=select_account' +
            '&redirect_uri=' + this.redirectUri +
            '&scope=' + this.scopes;

  this.expireTimer = null;
  this.token = null;

  this.signInCallback = options["signInCallback"];
  this.signOutCallback = options["signOutCallback"];
  this.loadingCallback = options["loadingCallback"];

  this.removeAccessToken = function() {
    this.token = null;
    chrome.storage.sync.remove(["access-token"], this.signOutCallback);
  }

  this.getNewAccessToken = function(callback) {
    chrome.identity.launchWebAuthFlow({'url': this.url, 'interactive': true}, function (redirectedTo) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          callback(null);
        } else {
          let url = new URL(redirectedTo.replace("#", "?"));
          let token = url.searchParams.get("access_token");

          this.token = token;
          chrome.storage.sync.set({ "access-token": token }, () => {
            callback(token);
          });
        }
      }
    );
  }

  this.getUserData = function(token, callback) {
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {headers: new Headers(
          {'Authorization': 'Bearer ' + token}
    )})
      .then(this.checkStatus)
      .then(JSON.parse)
      .then(callback)
      .catch((err) => {
        console.log(err);

        this.removeAccessToken();
        throw new Error("Token No Longer Valid");
      });
  }

  this.signIn = function(optionalCallback) {
    this.loadingCallback();

    this.getNewAccessToken((token) => {
      if (token) {
        if (optionalCallback) {
          optionalCallback();
        }
        this.getUserData(token, this.signInCallback);
        this.expireTimer = setTimeout(() => { this.removeAccessToken(); }, 3990 * 1000);
      } else {
        this.signInCallback(null);
      }
    })
  }

  this.getToken = function(callback) {
    if (this.token) {
      callback(this.token)
    } else {
      chrome.storage.sync.get(["access-token"], (response) => {
        if (response["access-token"]) {
          this.token = response["access-token"];
          callback(this.token);
        } else {
          callback(null);
        }
      });
    }
  }

  this.checkToken = function(token, callback) {
    if (token) {
      fetch("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + token)
        .then(this.checkStatus)
        .then(JSON.parse)
        .then(callback)
        .catch((err) => {
          console.log(err);
          this.removeAccessToken();
          callback(null);
        });
    }
  }

  this.getAndCheckToken = (callback) => {
    this.getToken((token) => {
      this.checkToken(token, (info) => {
        if (info) {
          this.getUserData(token, callback);
          this.expireTimer = setTimeout(() => { this.removeAccessToken(); }, info.expires_in * 1000);
        }
      })
    })
  }

  this.signOut = () => {
    this.loadingCallback();
    this.removeAccessToken();
  };

  this.checkStatus = function(response) {
    if (response.status >= 200 && response.status < 300 || response.status == 0) {
      return response.text();
    } else {
      return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }

  this.getAndCheckToken((info) => {
    this.signInCallback(info);
  });
}
