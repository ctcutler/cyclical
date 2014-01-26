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

function getRadius(i) {
  var cycleCount = CYCLES.length;
  var radiusIncrement = (MAX_RADIUS - MIN_RADIUS) / cycleCount;
  return ((i + 1) * radiusIncrement) + MIN_RADIUS;
}

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
function makeRelativeEnd(radius, ratio, isX) {
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

function makePathData(d, i) {
  var radius = getRadius(i);
  var startX = CENTER_X;
  var startY = CENTER_Y - radius;
  var xRadius = radius;
  var yRadius = radius;
  var xAxisRotation = 0;
  var elapsedRatio = d.elapsed/d.total;
  var largeArc = elapsedRatio > .5 ? 1 : 0;
  var sweep = 1; // always one as long as we start from the top and go clockwise
  var endDx = makeRelativeEnd(radius, elapsedRatio, true, startX);
  var endDy = makeRelativeEnd(radius, elapsedRatio, false, startY);
  var parts = [
    "M", startX, startY,
    "a", xRadius, yRadius, 
      xAxisRotation, largeArc, sweep,
      endDx, endDy
  ];
  return parts.join(" ");
}

function render() {
  svg = d3.select("#mainSvg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  var cycle = svg.selectAll(".cycle")
    .data(CYCLES);
  cycle.enter()
    .append("path")
    .attr("class", "cycle")
    .attr("d", makePathData)
    .attr("stroke", "green")
    .attr("fill", "transparent");
  /*
  cycle
    .attr("x1", function (d) { return d.coords.x1 })
    .attr("y1", function (d) { return d.coords.y1 })
    .attr("x2", function (d) { return d.coords.x2 })
    .attr("y2", function (d) { return d.coords.y2 })
    .attr("class", function (d) { return "connection "+d.color });
  cycle.exit()
    .remove();
  */
}
