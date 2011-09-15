/**
 * Options controller.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 */

// Extensions pages can all have access to the bacground page.
var bkg = chrome.extension.getBackgroundPage();

// When the DOM is loaded, make sure all the saved info is restored.
window.addEventListener('load', onLoad, false);

var exlusionDialog = null;
var inclusionDialog = null;

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
  $('release-notes').addEventListener('click', onVisitReleaseNotes, false)
  $('button-save').addEventListener('click', onSave, false);
  $('button-close').addEventListener('click', onClose, false);
  $('exclusion-filter-list-add').addEventListener('click', onFilterListAdd, false);
  $('exclusion-filter-list-remove').addEventListener('click', onFilterListRemove, false);
  $('exclusion-filter-list-remove-all').addEventListener('click', onFilterListRemoveAll, false);
  
  $('inclusion-filter-list-add').addEventListener('click', onFilterListAdd, false);
  $('inclusion-filter-list-remove').addEventListener('click', onFilterListRemove, false);
  $('inclusion-filter-list-remove-all').addEventListener('click', onFilterListRemoveAll, false);
  
  $('visit-extensions').addEventListener('click', onVisitExtension, false);
  
  exlusionDialog = new DialogController('exclusion-add-filter-dialog');
  exlusionDialog.addEventListener('click', onDialogOk);
  exlusionDialog.addEventListener('load', onDialogLoad);
  exlusionDialog.setTemplate({header: 'Filter Text', ok: 'Add'});
  exlusionDialog.init();
  
  inclusionDialog = new DialogController('inclusion-add-filter-dialog');
  inclusionDialog.addEventListener('click', onDialogOk);
  inclusionDialog.addEventListener('load', onDialogLoad);
  inclusionDialog.setTemplate({header: 'Filter Text', ok: 'Add'});
  inclusionDialog.init();
}

function onVisitReleaseNotes() {
  window.open(chrome.extension.getURL('updates.html'));
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
  bkg.settings.enable_filtering = $('enable_filtering').checked;
  bkg.settings.autoreload = $('autoreload').checked;
  bkg.settings.block_animated_gifs = $('block_animated_gifs').value;

  // Restore filter list.  
  var inclusionFilterList = [];
  var list = $('inclusion_filter_list');
  for (var i = 0; i < list.length; i++) {
    inclusionFilterList.push(list[i].value);
  }
  bkg.settings.inclusion_filters = inclusionFilterList;
  
  var exlusionFilterList = [];
  list = $('exclusion_filter_list');
  for (var i = 0; i < list.length; i++) {
    exlusionFilterList.push(list[i].value);
  }
  bkg.settings.filters = exlusionFilterList;

  bkg.controller.updateSettings();

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
  $('enable_filtering').checked = bkg.settings.enable_filtering;
  $('autoreload').checked = bkg.settings.autoreload;
  $('block_animated_gifs').value = bkg.settings.block_animated_gifs;

  var blockAnimatedGifsElement = $('block_animated_gifs');
  blockAnimatedGifsElement.value = bkg.settings.block_animated_gifs;
  blockAnimatedGifsElement.addEventListener('change', function(e) {
    var value = this.options[this.selectedIndex].value;
    setBlockAnimatedGifsNote(value);
  }, false);
  setBlockAnimatedGifsNote(bkg.settings.block_animated_gifs);
  
  // Restore filter list.
  var exclusionFilterList = bkg.settings.filters;
  var list = $('exclusion_filter_list');
  for (var i = 0; i < exclusionFilterList.length; i++) {
    list.add(new Option(exclusionFilterList[i]));
  }
  
  var inclusionFilterList = bkg.settings.inclusion_filters;
  var list = $('inclusion_filter_list');
  for (var i = 0; i < inclusionFilterList.length; i++) {
    list.add(new Option(inclusionFilterList[i]));
  }
}

/**
 * Changes the note for the block gifs, to help and assist the user what
 * the options really mean.
 *
 * @param {string} type The type of message that needs to change.
 */
function setBlockAnimatedGifsNote(type) {
  var message = 'Keep animating, do not block or hide.';
  if (type == 'hide') {
    message = 'Experimental: Hides all the animated images and stores it in the popup.';
  }
  else if (type == 'freeze') {
    message = 'Experimental: Freezes all images by adding a play button on top of it!';
  }
  $('block_animated_gifs_note').innerHTML = message;
}

/**
 * On Add Event.
 */
function onFilterListAdd(e) {
  if (e.target.id.indexOf('inclusion') == 0) {
    inclusionDialog.setVisible(true);
  }
  else {
    exlusionDialog.setVisible(true);
  }
}

/**
 * On Remove Event.
 */
function onFilterListRemove(e) {
  var id = 'exclusion_filter_list';
  if (e.target.id.indexOf('inclusion') == 0) {
    id = 'inclusion_filter_list';
  }
  var list = $(id);
  if (list.selectedIndex != -1) {
    list.remove(list.selectedIndex);
  }
  list.selectedIndex = list.length - 1;
}

/**
 * On Remove All Event.
 */
function onFilterListRemoveAll(e) {
  var id = 'exclusion_filter_list';
  if (e.target.id.indexOf('inclusion') == 0) {
    id = 'inclusion_filter_list';
  }
  var list = $(id);
  while (list.length != 0) {
    list.remove();
  }
}

/**
 * On Dialog Add Event.
 */
function onDialogOk(id, state) {
  if (state != DialogController.OK) {
    return;
  }

  var idFilterList = 'exclusion_filter_list';
  var idFilterItemAdd = 'exclusion-filter-item-add';
  var specificDialog = exlusionDialog;
  if (id.indexOf('inclusion') == 0) {
    idFilterList = 'inclusion_filter_list';
    idFilterItemAdd = 'inclusion-filter-item-add';
    specificDialog = inclusionDialog;
  }
  
  var item = $(idFilterItemAdd);
  if (item.value.trim().length == 0) {
    return;
  }
  
  var list = $(idFilterList);
  var items = item.value.split(',');
  for (var i = 0; i < items.length; i++) {
    list.add(new Option(items[i].toLowerCase()));
  }
  list.selectedIndex = list.length - 1;
  specificDialog.setVisible(false);
}


/**
 * On Dialog Add Event.
 */
function onDialogLoad(id) {
  var idFilterItemAdd = 'exclusion-filter-item-add';
  if (id.indexOf('inclusion') == 0) {
    idFilterItemAdd = 'inclusion-filter-item-add';
  }
  $(idFilterItemAdd).value = '';
  $(idFilterItemAdd).focus();
}