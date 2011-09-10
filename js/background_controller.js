/**
 * Manages a single instance of the entire application.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 * @constructor
 */
BackgroundController = function() {
  this.onExtensionLoaded();
  this.port = null;
  this.session_filter_log = {};
  this.session_filter_length = 0;
};

/**
 * Triggered when the extension just loaded. Should be the first thing
 * that happens when chrome loads the extension.
 */
BackgroundController.prototype.onExtensionLoaded = function() {
  var currVersion = chrome.app.getDetails().version;
  var prevVersion = settings.version;
  if (currVersion != prevVersion) {
    // Check if we just installed this extension.
    if (typeof prevVersion == 'undefined') {
      this.onInstall();
    } else {
      this.onUpdate(prevVersion, currVersion);
    }
    settings.version = currVersion;
  }
};

/**
 * Triggered when the extension just installed.
 */
BackgroundController.prototype.onInstall = function() {
  chrome.tabs.create({url: 'options.html'});
};

/**
 * Inform all Content Scripts that new settings are available.
 */
BackgroundController.prototype.updateSettings = function() {
  if (this.port) {
    this.port.postMessage({method: 'SettingsReceived', data: settings.filters});
  }
};

/**
 * Triggered when the extension just uploaded to a new version. DB Migrations
 * notifications, etc should go here.
 *
 * @param {string} previous The previous version.
 * @param {string} current  The new version updating to.
 */
BackgroundController.prototype.onUpdate = function(previous, current) {
};

/**
 * Initialize the main Background Controller
 */
BackgroundController.prototype.init = function() {
  chrome.extension.onConnect.addListener(function(port) {
    if (port.name = 'stream') {
      this.port = port;
      this.port.onMessage.addListener(this.onMessage.bind(this));
    }
  }.bind(this));
};

/**
 * Listen on requests coming from content scripts.
 *
 * @param {object} request The request object to match data.
 * @param {object} sender The sender object to know what the source it.
 * @param {Function} sendResponse The response callback.
 */
BackgroundController.prototype.onMessage = function(request) {
  if (request.method == 'GetSettings') {
    this.port.postMessage({method: 'SettingsReceived', data: settings.filters});
  }
  else if (request.method == 'SaveStat') {
    if (!this.session_filter_log[request.post_id]) {
      this.session_filter_length++;
      chrome.browserAction.setBadgeText({text: '' + this.session_filter_length})
    }
    this.session_filter_log[request.post_id] = {
      url: request.post_url,
      user_id: request.user_id,
      user_name: request.user_name,
      filter: request.filter
    };
  }
};

/**
 * Return the list of posts filtered.
 */
BackgroundController.prototype.getSessionFilters = function() {
  return this.session_filter_log;
};