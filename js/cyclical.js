var WIDTH = 500;
var HEIGHT = 500;
var CENTER_X = WIDTH/2;
var CENTER_Y = HEIGHT/2;
var MIN_RADIUS = 10;
var MAX_RADIUS = CENTER_X - MIN_RADIUS;
var NOW = new Date().getTime();
var CYCLES = [
  { start: NOW - (30 * 1000), end: NOW + (30 * 1000) },
  { start: NOW - (30 * 1000), end: NOW + (10 * 1000) },
  { start: NOW - (10 * 1000), end: NOW + (30 * 1000) },
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

  /*
  // arc paths don't handle near complete circles well
  // so we could cheat. . .
  console.log(ratio);
  var ratioRemainder = ratio % 1;
  if (ratioRemainder > .99) ratio -= (ratioRemainder - .99);
  if (ratioRemainder < .01) ratio += (.01 - ratioRemainder);
  console.log(ratio);
  */

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
  var now = new Date().getTime();
  return (now - d.start)/(d.end - d.start);
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

function makePathData(d, i, initialPath) {
  var radius = getRadius(i);
  var startX = getStartX(i);
  var startY = getStartY(i);
  var xRadius = radius;
  var yRadius = radius;
  var xAxisRotation = 0;
  var elapsedRatio = getElapsedRatio(d);
  var largeArc = elapsedRatio % 1 > .5 ? 1 : 0;
  var sweep = 1; // always one as long as we start from the top and go clockwise
  var endDx = initialPath ? startX : makeRelativeEndPoint(radius, elapsedRatio, true);
  var endDy = initialPath ? startY : makeRelativeEndPoint(radius, elapsedRatio, false);
  var parts = [
    "M", startX, startY,
    "a", xRadius, yRadius, 
      xAxisRotation, largeArc, sweep,
      endDx, endDy
  ];
  return parts.join(" ");
}

function makeInitialPathData(d, i) {
  return makePathData(d, i, true);
}

function makeSubsequentPathData(d, i) {
  return makePathData(d, i, false);
}

function makeCycleTipCX(d, i) {
  var relativeEndPoint = makeRelativeEndPoint(getRadius(i), getElapsedRatio(d), true);
  return relativeEndPoint + getStartX(i); // convert to absolute
}

function makeCycleTipCY(d, i) {
  var relativeEndPoint = makeRelativeEndPoint(getRadius(i), getElapsedRatio(d), false);
  return relativeEndPoint + getStartY(i); // convert to absolute
}

function update() {

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

  var cycle = svg.selectAll("path.cycle")
    .data(CYCLES);
  cycle.enter()
    .append("path")
    .attr("class", "cycle")
    .attr("stroke", "green")
    .attr("d", makeInitialPathData)
    .attr("fill", "transparent");
  cycle
    .attr("d", makeSubsequentPathData);
  cycle.exit()
    .remove();

  var cycleTip = svg.selectAll("circle.cycleTip")
    .data(CYCLES);
  cycleTip.enter()
    .append("circle")
    .attr("class", "cycleTip")
    .attr("r", "3")
    .attr("fill", "green");
  cycleTip
    .attr("cy", makeCycleTipCY)
    .attr("cx", makeCycleTipCX);
  cycleTip.exit().remove();
}
