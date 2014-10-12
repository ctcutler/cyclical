var WIDTH = 800;
var HEIGHT = 800;
var CENTER_X = WIDTH/2;
var CENTER_Y = HEIGHT/2;
var MIN_RADIUS = 20;
var MAX_RADIUS = CENTER_X;
var MARGIN = 20;
var CENTER_POINT_RADIUS = 5;
var CENTER_POINT_LABEL_OFFSET = CENTER_POINT_RADIUS + 5;

var radiusScale = d3.scale.log().domain([MIN_CYCLE, MAX_CYCLE]).range([0, MAX_RADIUS - MARGIN]);

function getStartY(d) {
  return CENTER_Y - getRadiusLog(d.end-d.start);
}

function getRadiusLog(ms) {
  return radiusScale(ms);
}

function makePathData(d, elapsedRatio) {
  var cycleLength = d.end - d.start;
  var radius = getRadiusLog(cycleLength);
  var startX = CENTER_X;
  var startY = getStartY(d);
  var xRadius = radius;
  var yRadius = radius;
  var xAxisRotation = 0;
  if (!elapsedRatio)
    elapsedRatio = getElapsedRatio(d);
  var largeArc = elapsedRatio % 1 > .5 ? 1 : 0;
  var sweep = 1; // always one as long as we start from the top and go clockwise
  endDx = makeArcEndPoint(radius, elapsedRatio, true);
  endDy = makeArcEndPoint(radius, elapsedRatio, false);
  var parts = [
    "M", startX, startY,
    "a", xRadius, yRadius, 
      xAxisRotation, largeArc, sweep,
      endDx, endDy
  ];
  return parts.join(" ");
}

function makeInitialPathData(d) {
  return makePathData(d, 0);
}

function makeSubsequentPathData(d) {
  return makePathData(d);
}

function makeLabelPathData(d) {
  return makePathData(d, .999);
}

function makeCycleTipCX(d, i) {
  var relativeEndPoint = makeArcEndPoint(getRadiusLog(d.end-d.start), getElapsedRatio(d), true);
  return relativeEndPoint + CENTER_X; // convert to absolute
}

function makeCycleTipCY(d, i) {
  var relativeEndPoint = makeArcEndPoint(getRadiusLog(d.end-d.start), getElapsedRatio(d), false);
  return relativeEndPoint + getStartY(d); // convert to absolute
}
