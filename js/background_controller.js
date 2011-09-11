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
    this.port.postMessage({
      method: 'SettingsReceived', 
      data: {
        inclusion_filters: settings.inclusion_filters,
        exclusion_filters: settings.filters,
        enable_filtering: settings.enable_filtering
      }
    });
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
  chrome.tabs.create({url: 'updates.html'});
};

/**
 * Initialize the main Background Controller
 */
BackgroundController.prototype.init = function() {
  chrome.browserAction.setBadgeBackgroundColor({color: [122, 214, 253, 255]})
  chrome.extension.onConnect.addListener(function(port) {
    if (port.name = 'stream') {
      this.port = port;
      this.port.onMessage.addListener(this.onMessage.bind(this));
      this.port.onDisconnect.addListener(this.onDisconnect.bind(this));
    }
  }.bind(this));
};

/**
 * When the port disconnects, we must null out the port, since there is no
 * consumer to use this port. We will later on connect back
 */
BackgroundController.prototype.onDisconnect = function(request) {
  this.port = null;
};

/**
 * Reset the filter and counter.
 */
BackgroundController.prototype.reset = function() {
  this.session_filter_log = {};
  this.session_filter_length = 0;
  chrome.browserAction.setBadgeText({text: ''});
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
    this.updateSettings();
  }
  else if (request.method == 'ResetCounter') {
    this.reset();
  }
  else if (request.method == 'SaveStat') {
    if (!this.session_filter_log[request.post_id]) {
      this.session_filter_length++;
      chrome.browserAction.setBadgeText({text: '' + this.session_filter_length})
    }
    this.session_filter_log[request.post_id] = {
      url: request.post_url,
      time: request.post_time,
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

/**
 * Mark posts as read. Just resets it.
 */
BackgroundController.prototype.markAsRead = function() {
  this.reset();
};
