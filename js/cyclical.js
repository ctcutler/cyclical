var WIDTH = 800;
var HEIGHT = 800;
var CENTER_X = WIDTH/2;
var CENTER_Y = HEIGHT/2;
var MIN_RADIUS = 20;
var MAX_RADIUS = CENTER_X - MIN_RADIUS;
var NOW = new Date().getTime();
var SECOND = 1000;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;
var CYCLES = [
  { name: "get a haircut", start: NOW - (1 * WEEK), end: NOW + (3 * WEEK), id: 1 },
  { name: "call Mom", start: NOW - (12 * DAY), end: NOW + (2 * DAY), id: 2 },
  { name: "water the plants", start: NOW - (2 * DAY), end: NOW + (5 * DAY), id: 3 },
  { name: "coding break: get up and stretch", start: NOW - (16 * MINUTE), end: NOW + (14 * MINUTE), id: 4 },
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

function makePathData(d, i, elapsedRatio) {
  var radius = getRadius(i);
  var startX = getStartX(i);
  var startY = getStartY(i);
  var xRadius = radius;
  var yRadius = radius;
  var xAxisRotation = 0;
  if (!elapsedRatio)
    elapsedRatio = getElapsedRatio(d);
  var largeArc = elapsedRatio % 1 > .5 ? 1 : 0;
  var sweep = 1; // always one as long as we start from the top and go clockwise
  endDx = makeRelativeEndPoint(radius, elapsedRatio, true);
  endDy = makeRelativeEndPoint(radius, elapsedRatio, false);
  var parts = [
    "M", startX, startY,
    "a", xRadius, yRadius, 
      xAxisRotation, largeArc, sweep,
      endDx, endDy
  ];
  return parts.join(" ");
}

function makeInitialPathData(d, i) {
  return makePathData(d, i, 0);
}

function makeSubsequentPathData(d, i) {
  return makePathData(d, i);
}

function makeLabelPathData(d, i) {
  return makePathData(d, i+.1, .999);
}

function makeCycleTipCX(d, i) {
  var relativeEndPoint = makeRelativeEndPoint(getRadius(i), getElapsedRatio(d), true);
  return relativeEndPoint + getStartX(i); // convert to absolute
}

function makeCycleTipCY(d, i) {
  var relativeEndPoint = makeRelativeEndPoint(getRadius(i), getElapsedRatio(d), false);
  return relativeEndPoint + getStartY(i); // convert to absolute
}

function renderTimeQuantity(millis) {
  if (millis < SECOND) {
    return millis + " ms";
  } else if (millis < MINUTE) {
    return Math.round(millis/SECOND) + " seconds";
  } else if (millis < HOUR) {
    return Math.round(millis/MINUTE) + " minutes";
  } else if (millis < DAY) {
    return Math.round(millis/HOUR) + " hours";
  } else if (millis < WEEK) {
    return Math.round(millis/DAY) + " days";
  } else {
    return Math.round(millis/WEEK) + " weeks";
  }
}

function update() {

  svg = d3.select("#mainSvg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  svgDefs = svg.select("defs");

  // FIXME: setting up transitions would be cool, but wow is it complicated
  // when acting on path data. . . here is some reading material:
  //   http://blog.visual.ly/creating-animations-and-transitions-with-d3-js/
  //   https://github.com/mbostock/d3/wiki/Transitions#wiki-attrTween
  //   https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_interpolateObject
  //   http://bl.ocks.org/mbostock/1098617
  //   https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-arc

  var guideCircle = svg.selectAll("circle.guideCircle")
    .data(CYCLES);
  guideCircle.enter()
    .append("circle")
    .attr("class", "guideCircle")
    .attr("stroke", "#CCCCCC")
    .attr("fill", "transparent")
    .attr("r", function (d, i) { return getRadius(i); })
    .attr("cx", CENTER_X)
    .attr("cy", CENTER_Y);
  guideCircle.exit().remove();

  var cycle = svg.selectAll("path.cycle")
    .data(CYCLES);
  cycle.enter()
    .append("path")
    .attr("class", "cycle")
    .attr("stroke", "green")
    .attr("stroke-width", "3")
    .attr("d", makeInitialPathData)
    .attr("fill", "transparent");
  cycle.attr("d", makeSubsequentPathData);
  cycle.exit().remove();

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

  var labelPath = svgDefs.selectAll("path.labelPath")
    .data(CYCLES);
  labelPath.enter()
    .append("path")
    .attr("class", "labelPath")
    .attr("id", function (d) { return "label"+d.id })
    .attr("d", makeLabelPathData);
  labelPath.exit().remove();

  var labelUse = svg.selectAll("use.label")
    .data(CYCLES);
  labelUse.enter()
    .append("use")
    .attr("xlink:href", function (d) { return "#label"+d.id })
    .attr("class", "label")
    .attr("fill", "none")
    .attr("stroke", "none");
  labelUse.exit().remove();

  var text = svg.selectAll("text.label")
    .data(CYCLES);
  text.enter()
    .append("text")
    .attr("class", "label")
    .attr("style", "fill:black;")
    .append("textPath")
    .attr("xlink:href", function (d) { return "#label"+d.id })
    .attr("class", "textPathLabel");
  svg.selectAll(".textPathLabel")
    .text(function (d) { 
      return d.name 
        + " (" 
        + renderTimeQuantity(d.end - (new Date().getTime())) 
        + " remain)" 
    });
}
