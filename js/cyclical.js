var WIDTH = 500;
var HEIGHT = 500;
var CENTER_X = WIDTH/2;
var CENTER_Y = HEIGHT/2;
var MIN_RADIUS = 10;
var MAX_RADIUS = CENTER_X - MIN_RADIUS;
var CYCLES = [
  { total: 86400, elapsed: 86400 * .33 },
  { total: 86400, elapsed: 86400 * .58 },
  { total: 86400, elapsed: 86400 * .71 },
  { total: 86400, elapsed: 86400 * .99 },
];

/**
 * We need to get coordinates for a point on a circle with the
 * given radius where the angle corresponds to the given ratio.  
 *
 * This is complicated by the following:
 * a) we want the coordinates relative the topmost point on the circle 
 * b) we want to move around the circle clockwise
 * c) sin/cos assume a coordinate space where y values are positive above the
 *    x-axis, SVG assumes the opposite
 */
function makeRelativeEndPoint(radius, ratio, isX) {
  // convert ratio into radians (0 => 0 . . . 1 => 2PI)
  var radians = ratio * 2 * Math.PI;

  // our method of finding points on the circle (the parametric equation) 
  // assumes we start at 3 o'clock, so adjust radians value for that, 
  // rolling over if we go past 2PI
  radians = (radians - (Math.PI/2)) % (2 * Math.PI);

  // get coordinate using parametric equation for a circle
  var coord = isX 
    ? radius * Math.cos(radians)
    : radius * -Math.sin(radians); // makes it CW, not CCW

  // translate coord so that it is relative to the top of the circle
  // not the center
  if (!isX) coord -= radius;

  // convert to SVG's assumption that y axis is positive _below_ the origin
  if (!isX) coord = -coord;

  return coord;
}

function getElapsedRatio(d) {
  return d.elapsed/d.total;
}

function getStartY(i) {
  return CENTER_Y - getRadius(i);
}

function getStartX(i) {
  return CENTER_X;
}

function getRadius(i) {
  var cycleCount = CYCLES.length;
  var radiusIncrement = (MAX_RADIUS - MIN_RADIUS) / cycleCount;
  return ((i + 1) * radiusIncrement) + MIN_RADIUS;
}

function makeInitialPathData(d, i) {
  var radius = getRadius(i);
  var startX = getStartX(i);
  var startY = getStartY(i);
  var xRadius = radius;
  var yRadius = radius;
  var xAxisRotation = 0;
  var elapsedRatio = getElapsedRatio(d);
  var largeArc = elapsedRatio > .5 ? 1 : 0;
  var sweep = 1; // always one as long as we start from the top and go clockwise
  var endDx = startX;
  var endDy = startY;
  var parts = [
    "M", startX, startY,
    "a", xRadius, yRadius, 
      xAxisRotation, largeArc, sweep,
      endDx, endDy
  ];
  return parts.join(" ");
}

function makePathData(d, i) {
  var radius = getRadius(i);
  var startX = getStartX(i);
  var startY = getStartY(i);
  var xRadius = radius;
  var yRadius = radius;
  var xAxisRotation = 0;
  var elapsedRatio = getElapsedRatio(d);
  var largeArc = elapsedRatio > .5 ? 1 : 0;
  var sweep = 1; // always one as long as we start from the top and go clockwise
  var endDx = makeRelativeEndPoint(radius, elapsedRatio, true);
  var endDy = makeRelativeEndPoint(radius, elapsedRatio, false);
  var parts = [
    "M", startX, startY,
    "a", xRadius, yRadius, 
      xAxisRotation, largeArc, sweep,
      endDx, endDy
  ];
  return parts.join(" ");
}

function makeCycleTipCX(d, i) {
  var relativeEndPoint = makeRelativeEndPoint(getRadius(i), getElapsedRatio(d), true);
  return relativeEndPoint + getStartX(i); // convert to absolute
}

function makeCycleTipCY(d, i) {
  var relativeEndPoint = makeRelativeEndPoint(getRadius(i), getElapsedRatio(d), false);
  return relativeEndPoint + getStartY(i); // convert to absolute
}

function render() {
  svg = d3.select("#mainSvg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  // FIXME: setting up transitions would be cool, but wow is it complicated
  // when acting on path data. . . here is some reading material:
  //   http://blog.visual.ly/creating-animations-and-transitions-with-d3-js/
  //   https://github.com/mbostock/d3/wiki/Transitions#wiki-attrTween
  //   https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_interpolateObject
  //   http://bl.ocks.org/mbostock/1098617
  //   https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-arc

  var cycle = svg.selectAll(".cycle")
    .data(CYCLES);
  cycle.enter()
    .append("path")
    .attr("class", "cycle")
    .attr("stroke", "green")
    .attr("d", makeInitialPathData)
    .attr("fill", "transparent");
  cycle
    .attr("d", makePathData);
  cycle.exit()
    .remove();

  var cycleTip = svg.selectAll("cycleTip")
    .data(CYCLES);
  cycleTip.enter()
    .append("circle")
    .attr("class", "cycleTip")
    .attr("r", "3")
    .attr("fill", "green");
  cycleTip
    .attr("cy", makeCycleTipCY)
    .attr("cx", makeCycleTipCX);
  cycleTip.exit()
    .remove();
}
