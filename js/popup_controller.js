/** 
 * Popup Controller that places stats from the current session in.
 */
PopupController = function() {
  window.addEventListener('load', this.onLoad.bind(this), false);
};
PopupController.prototype.onLoad = function() {
  var filterDOM = document.querySelector('#filter-results > tbody');
  var bkg = chrome.extension.getBackgroundPage().controller;
  var filterSessions = bkg.getSessionFilters();
  
  var found = false;
  for (var key in filterSessions) {
    if (filterSessions.hasOwnProperty(key)) {
      var item =  filterSessions[key];
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' +  item.user_name + '</td>' + 
          '<td>' + item.filter + '</td>' + 
          '<td><a href="' + item.url + '" onclick="controller.openLink(this);">link</a></td>' +
          '<td>' + item.time + '</td>';
      filterDOM.appendChild(tr);
      found = true;
    }
  }
  
  if (!found) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="4" style="text-align: center;">No filtered results. <br />You might have to refresh your Stream.</td>';
    filterDOM.appendChild(tr);
  }
};
PopupController.prototype.openLink = function(e){
  window.open(e.href);
};
PopupController.prototype.openOptions = function(e) {
  window.open(chrome.extension.getURL('options.html'));
};
var controller = new PopupController();