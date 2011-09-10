/**
 * Options controller.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 */

// Extensions pages can all have access to the bacground page.
var bkg = chrome.extension.getBackgroundPage();

// When the DOM is loaded, make sure all the saved info is restored.
window.addEventListener('load', onLoad, false);

var dialog = null;

/**
 * Short form for getting elements by id.
 * @param {string} id The id.
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * document.createElement Shortcut.
 */
function createElement(tag, opt_attr) {
  var elt = document.createElement(tag);
  var attr = opt_attr ? opt_attr : {};
  if (attr.id) {
    elt.setAttribute('id', attr.id);
  }
  if (attr.class) {
    elt.setAttribute('class', attr.class);
  }
  if (attr.src) {
    elt.setAttribute('src', attr.src);
  }
  if (attr.href) {
    elt.setAttribute('href', attr.href);
  }
  if (attr.selected) {
    elt.setAttribute('selected', 'selected');
  }
  if (attr.disabled) {
    elt.setAttribute('disabled', 'disabled');
  }
  if (attr.html) {
    elt.innerHTML = attr.html;
  }
  return elt;
}

/**
 * When the options window has been loaded.
 */
function onLoad() {
  onRestore();
  $('button-save').addEventListener('click', onSave, false);
  $('button-close').addEventListener('click', onClose, false);
  $('filter-list-add').addEventListener('click', onFilterListAdd, false);
  $('filter-list-remove').addEventListener('click', onFilterListRemove, false);
  $('filter-list-remove-all').addEventListener('click', onFilterListRemoveAll, false);
  $('visit-extensions').addEventListener('click', onVisitExtension, false);
  
  dialog = new DialogController('add-filter-dialog');
  dialog.addEventListener('click', onDialogOk);
  dialog.addEventListener('load', onDialogLoad);
  dialog.setTemplate({header: 'Filter Text', ok: 'Add'});
  dialog.init();
}

function onVisitExtension() {
 var url = 'https://chrome.google.com/webstore/detail/' + chrome.i18n.getMessage('@@extension_id');
 window.open(url);
}

/**
 *  When the options window is closed;
 */
function onClose() {
  window.close();
}

/**
 * Saves options to localStorage.
 */
function onSave() {
  // Save settings.
  bkg.settings.opt_out = $('opt_out').checked;

  // Restore filter list.
  var filterList = [];
  var list = $('filter_list');
  for (var i = 0; i < list.length; i++) {
    filterList.push(list[i].value);
  }
  bkg.settings.filters = filterList;
  bkg.backgroundController.updateSettings();

  // Update status to let user know options were saved.
  var info = $('info-message');
  info.style.display = 'inline';
  info.style.opacity = 1;
  setTimeout(function() {
    info.style.opacity = 0.0;
  }, 1000);
}

/**
* Restore all options.
*/
function onRestore() {
  // Restore settings.
  $('version').innerHTML = ' (v' + bkg.settings.version + ')';
  $('opt_out').checked = bkg.settings.opt_out;

  // Restore filter list.
  var filterList = bkg.settings.filters;
  var list = $('filter_list');
  for (var i = 0; i < filterList.length; i++) {
    list.add(new Option(filterList[i]));
  }
}

/**
 * On Add Event.
 */
function onFilterListAdd() {
  dialog.setVisible(true);
}

/**
 * On Remove Event.
 */
function onFilterListRemove() {
  var list = $('filter_list');
  if (list.selectedIndex != -1) {
    list.remove(list.selectedIndex);
  }
  list.selectedIndex = list.length - 1;
}

/**
 * On Remove All Event.
 */
function onFilterListRemoveAll() {
  var list = $('filter_list');
  while (list.length != 0) {
    list.remove();
  }
}

/**
 * On Dialog Add Event.
 */
function onDialogOk(state) {
  if (state != DialogController.OK) {
    return;
  }
  var item = $('filter-item-add');
  if (item.value.trim().length == 0) {
    return;
  }
  var list = $('filter_list');
  var items = item.value.split(',');
  for (var i = 0; i < items.length; i++) {
    list.add(new Option(items[i].toLowerCase()));
  }
  list.selectedIndex = list.length - 1;
  dialog.setVisible(false);
}


/**
 * On Dialog Add Event.
 */
function onDialogLoad() {
  $('filter-item-add').value = '';
  $('filter-item-add').focus();
}