var SECOND = 1000;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;
var MONTH = 4 * WEEK; /* a bad approximation, of course */
var MIN_CYCLE = 1 * DAY;
var MAX_CYCLE = 6 * MONTH;

function renderTimeQuantity(millis) {
  var value;
  var units;
  if (millis < 2 * MINUTE) {
    value = Math.round(millis/SECOND);
    units = " second";
  } else if (millis < 2 * HOUR) {
    value = Math.round(millis/MINUTE);
    units = " minute";
  } else if (millis < 2 * DAY) {
    value = Math.round(millis/HOUR);
    units = " hour";
  } else if (millis < 2 * WEEK) {
    value = Math.round(millis/DAY);
    units = " day";
  } else if (millis < 2 * MONTH) {
    value = Math.round(millis/WEEK);
    units = " week";
  } else {
    value = Math.round(millis/MONTH);
    units = " month";
  }
  if (value != 1) units += "s";
  return value + units;
}
