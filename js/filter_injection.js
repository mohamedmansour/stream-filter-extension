/**
 * FilterInjection Content Script.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 * @constructor
 */
FilterInjection = function() {
  this.inclusion_filters = [];
  this.exclusion_filters = [];
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
    this.port = chrome.extension.connect({name: 'stream'});
    this.port.onMessage.addListener(this.onMessage.bind(this));
    this.port.postMessage({method: 'GetSettings'});
    this.port.postMessage({method: 'ResetCounter'});
    googlePlusContentPane.addEventListener('DOMNodeInserted',
                                           this.onGooglePlusContentModified.bind(this), false);
    setTimeout(this.renderAllItems.bind(this), 100);
  }
};

/**
 * Data has been received from the extension via Messaging provider.
 *
 * @param {Object} request The payload data received.
 */
FilterInjection.prototype.onMessage = function(request) {
  if (request.method == 'SettingsReceived') {
    this.onSettingsReceived(request.data);
  }
};

/**
 * Settings received, update content script.
 */
FilterInjection.prototype.onSettingsReceived = function(data) { 
  this.inclusion_filters = data.inclusion_filters;
  this.exclusion_filters = data.exclusion_filters;
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
  if (!itemDOM.parentNode) {
    return;
  }
  var textDOM = itemDOM.querySelector('div > div:nth-child(2) > div > div > div:nth-child(2) > div');
  var text = textDOM.innerText.toLowerCase();
  var callback = function(filter) {
    var nameDOM = itemDOM.querySelector(FilterInjection.ITEM_NAME_SELECTOR);
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
  
  
  // Check if we have any inclusion filters, if it doesn't match, then we exit
  // since it doesn't match those filters.
  if (this.inclusion_filters.length > 0) {
    var inclusion_match = '(' + this.inclusion_filters.join('|') + ')';
    if (!text.match(inclusion_match)) {
      callback('Inclusion');
      return;
    }
  }
  
  if (this.exclusion_filters.length > 0) {
    var exclusion_match = '(' + this.exclusion_filters.join('|') + ')';
    var match = text.match(exclusion_match);
    if (match) {
      callback('Exclusion');
      console.log(match);
      return;
    }
  }
};


// Main
var injection = new FilterInjection();
injection.init();
