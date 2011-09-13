/**
 * Global Settings.
 *
 * @author Mohamed Mansour 2011 (http://mohamedmansour.com)
 */
settings = {
  get version() {
    return localStorage['version'];
  },
  set version(val) {
    localStorage['version'] = val;
  },
  get opt_out() {
    var key = localStorage['opt_out'];
    return (typeof key == 'undefined') ? false : key === 'true';
  },
  set opt_out(val) {
    localStorage['opt_out'] = val;
  },
  get filters() {
    var key = localStorage['filters'];
    return (typeof key == 'undefined') ? [] : (key == '' ? [] : key.split(', '));
  },
  set filters(val) {
    if (typeof val == 'object') {
      localStorage['filters'] = val.sort().join(', ');
    }
  },
  get inclusion_filters() {
    var key = localStorage['inclusion_filters'];
    return (typeof key == 'undefined') ? [] : (key == '' ? [] : key.split(', '));
  },
  set inclusion_filters(val) {
    if (typeof val == 'object') {
      localStorage['inclusion_filters'] = val.sort().join(', ');
    }
  },
  get enable_filtering() {
    var key = localStorage['enable_filtering'];
    return (typeof key == 'undefined') ? true : key === 'true';
  },
  set enable_filtering(val) {
    localStorage['enable_filtering'] = val;
  },
  get autoreload() {
    var key = localStorage['autoreload'];
    return (typeof key == 'undefined') ? false : key === 'true';
  },
  set autoreload(val) {
    localStorage['autoreload'] = val;
  },
  get block_animated_gifs() {
    var key = localStorage['block_animated_gifs'];
    return (typeof key == 'undefined') ? 'none' : key;
  },
  set block_animated_gifs(val) {
    localStorage['block_animated_gifs'] = val;
  },
};