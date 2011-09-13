/**
 * FilterInjection Content Script.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 * @constructor
 */
FilterInjection = function() {
  this.settings = {};
  this.port = null;
};

FilterInjection.CONTENT_PANE_ID = '#contentPane';
FilterInjection.CONTENT_ITEM_SELECTOR = 'div[id^="update"]';
FilterInjection.ITEM_NAME_SELECTOR = 'span > a';


/**
 * Initialize the events that will be listening within this DOM.
 */
FilterInjection.prototype.init = function() {
  var googlePlusContentPane = document.querySelector(FilterInjection.CONTENT_PANE_ID);
  if (googlePlusContentPane) {
    this.initializePort();
    googlePlusContentPane.addEventListener('DOMNodeInserted',
                                           this.onGooglePlusContentModified.bind(this), false);
    setTimeout(this.renderAllItems.bind(this), 100);
  }
};

FilterInjection.prototype.initializePort = function() {
  this.port = chrome.extension.connect({name: 'stream'});
  this.port.onMessage.addListener(this.onMessage.bind(this));
  this.port.onDisconnect.addListener(this.onDisconnect.bind(this));
  this.port.postMessage({method: 'GetSettings'});
  this.port.postMessage({method: 'ResetCounter'});
};

/**
 * When the port has disconnected we need to refresh it to some degree.
 */
FilterInjection.prototype.onDisconnect = function(request) {
  this.port = null;
  setTimeout(this.initializePort.bind(this), 1000);
};

/**
 * Data has been received from the extension via Messaging provider.
 *
 * @param {Object} request The payload data received.
 */
FilterInjection.prototype.onMessage = function(request) {
  if (request.method == 'SettingsReceived') {
    this.settings = request.data;
  }
  else if (request.method == 'Reload') {
    if (request.autoreload) {
      window.location.reload();
    }
  }
};

/**
 * Render the "Share on ..." Link on each post.
 */
FilterInjection.prototype.onGooglePlusContentModified = function(e) {
  // This happens when a new stream is selected
  if (e.relatedNode && e.relatedNode.parentNode && e.relatedNode.parentNode.id == 'contentPane') {
    // We're only interested in the insertion of entire content pane
    this.renderAllItems(e.target);
  } else if (e.target.nodeType == Node.ELEMENT_NODE && e.target.id.indexOf('update') == 0) {
    this.renderItem(e.target);
  }
};

/**
 * Render on all the items of the documents, or within the specified subtree
 * if applicable
 */
FilterInjection.prototype.renderAllItems = function(subtreeDOM) {
  var queryDOM = typeof subtreeDOM == 'undefined' ? document : subtreeDOM;
  var items = queryDOM.querySelectorAll(FilterInjection.CONTENT_ITEM_SELECTOR);
  for (var i = 0; i < items.length; i++) {
    this.renderItem(items[i]);
  }
};

/**
 * Render item to filter text. This is a quick index of search remove.
 */
FilterInjection.prototype.renderItem = function(itemDOM) {
  if (!this.port || !itemDOM || !this.settings.enable_filtering || !itemDOM.parentNode || itemDOM.innerText == '') {
    return;
  }
  var textDOM = itemDOM.querySelector('div > div:nth-child(2) > div > div > div:nth-child(2) > div');
  var text = textDOM.innerText.toLowerCase();
  
  // Callback to gather stats.
  var onfilterCallback = function(filter) {
    var nameDOM = itemDOM.querySelector(FilterInjection.ITEM_NAME_SELECTOR);
    if (!itemDOM.parentNode) { // no clue why this happens ...
      return;
    }
    var googleID = nameDOM.getAttribute('oid');
    var name = nameDOM.innerText;
    var postID = itemDOM.id;
    var postURL = itemDOM.querySelector('a[target="_blank"]');
    this.port.postMessage({
      method: 'SaveStat',
      user_id: googleID,
      user_name: name,
      post_id: postID,
      post_time: postURL.innerText,
      post_url: postURL.href,
      filter: filter
    });
    itemDOM.parentNode.removeChild(itemDOM);
  }.bind(this);
  
  // Check if we want to block gifs from running.
  if (this.settings.block_animated_gifs) {
    var images = textDOM.querySelectorAll('div[data-content-type] img');
    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      var newSrcMatch = image.src.match(/(.+)no_expand=(\d)/);
      if (newSrcMatch) {
        // Check if it can animate by checking the expand parameter.
        // This doesn't necessarily mean it is a gif, but better than doing
        // anything else. This will guarantee the image is not animating.
        if (newSrcMatch[2] == '1') {
          var imagePartSrc = newSrcMatch[1];
          var newSrc = imagePartSrc.replace(/(.+)(refresh=)(\d+)(.+)/, '$1$21$4');
          image.src = newSrc + 'no_expand=0'; 
        }
      }
    }
    return;
  }
  
  // Checks if the item is a regex.
  var isRegexFilter = function(element) {
    return element[0] == '/' && element[element.length - 1] == '/';
  };
  
  // Check the exclusion filters first so we can show the user which filter
  // it was exluded in.
  if (this.settings.exclusion_filters.length > 0) {
    this.settings.exclusion_filters.forEach(function(element, index) {
      if (isRegexFilter(element)) {
        var found_pos = text.search(new RegExp(element.substring(1, element.length - 1)));
        if (found_pos != -1) {
          onfilterCallback('-' + element);
          return;
        }
      }
      else if (text.indexOf(element) != -1) {
        onfilterCallback('-' + element);
        return;
      }
    });
  }
  
  // Check if we have any inclusion filters, if it doesn't match, then we exit
  // since it doesn't match those filters.
  if (this.settings.inclusion_filters.length > 0) {
    this.settings.inclusion_filters.forEach(function(element, index) {
      if (isRegexFilter(element)) {
        var found_pos = text.search(new RegExp(element.substring(1, element.length - 1)));
        if (found_pos == -1) {
          onfilterCallback('+' + element);
          return;
        }
      }
      else if (text.indexOf(element) == -1) {
        onfilterCallback('+' + element);
        return;
      }
    });
  }
};

// Main
var injection = new FilterInjection();
injection.init();
