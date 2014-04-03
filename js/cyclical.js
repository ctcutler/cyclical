var WIDTH = 800;
var HEIGHT = 800;
var CENTER_X = WIDTH/2;
var CENTER_Y = HEIGHT/2;
var MIN_RADIUS = 20;
var MAX_RADIUS = CENTER_X;

var NOW = new Date().getTime();
var SECOND = 1000;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;
var MIN_CYCLE = 5 * MINUTE;
var MAX_CYCLE = 365 * DAY;
var MARGIN = 20;

var CENTER_POINT_RADIUS = 5;
var CENTER_POINT_LABEL_OFFSET = CENTER_POINT_RADIUS + 5;

var radiusScale = d3.scale.log().domain([MIN_CYCLE, MAX_CYCLE]).range([0, MAX_RADIUS - MARGIN]);

var CYCLES = [
  //{ name: "30m", start: NOW, end: NOW + (30 * MINUTE), id: 1 },
  { name: "1h", start: NOW, end: NOW + (1 * HOUR), id: 2 },
  { name: "1d", start: NOW, end: NOW + (1 * DAY), id: 3 },
  //{ name: "7d", start: NOW, end: NOW + (7 * DAY), id: 4 },
  { name: "30d", start: NOW, end: NOW + (30 * DAY), id: 5 },
  //{ name: "90d", start: NOW, end: NOW + (90 * DAY), id: 6 },
  { name: "365d", start: NOW, end: NOW + (365 * DAY), id: 7 },
];


/* for js console testing:
s = document.createElement('script');
s.src = "file:///Users/ctcutler/src/cyclical/lib/d3.v3.min.js"
document.body.appendChild(s)

http://jsfiddle.net/r4T77/
*/

function getNextId() {
  var nextId = 1;
  for (var i=0; i < CYCLES.length; i++) {
    if (CYCLES[i]["id"] >= nextId) nextId = CYCLES[i]["id"] + 1;
  }
  return nextId;
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
function makeArcEndPoint(radius, ratio, isX) {
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

/**
 * The sort-of inverse of makeArcEndPoint. . . takes coordinates of the
 * center of a circle and of another point and determines how far around
 * the circle the other point is */
function getRatioFromCoordinates(x, y, cx, cy) {
  // make x and y relative to center of circle, not upper left corner
  // of window
  x -= cx;
  y -= cy;

  // make y positive *above* the x axis
  y = -y; 

  // convert x and y to unit circle coordinates
  var radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  x /= radius;
  y /= radius;

  /* Trig is *not* my strong suit but the following works experimentally. */
  var ratio;
  if (y > 0) {
    ratio = Math.acos(-x) / (2*Math.PI);
  } else {
    ratio = ((2*Math.PI) - Math.acos(-x)) / (2*Math.PI);
  }

  // adjust the ratio so that it starts at 12 o'clock on the circle
  return (ratio + .75) % 1;
}

function setElapsedRatio(d, newRatio) {
  /* Figure out the delta between the current
     ratio and the requested one, and adjust the start
     and end time based on that delta. */
  var span = d.end - d.start;
  var ratioDelta = newRatio - getElapsedRatio(d);
  var delta = ratioDelta * span;
  d.start -= delta;
  d.end -= delta;
}

function isCycleComplete(d) {
  return new Date().getTime() >= d.end;
}

function getElapsedRatio(d) {
  if (isCycleComplete(d)) {
    return .999; // ratio is never greater than 1
  } else {
    var now = new Date().getTime();
    return (now - d.start)/(d.end - d.start);
  }
}

function getStartY(d) {
  return CENTER_Y - getRadiusLog(d.end-d.start);
}

function getRadiusLog(ms) {
  return radiusScale(ms);
}

function resetCycle(d) {
  if (isCycleComplete(d)) {
    var now = new Date().getTime();
    var cycleLength = d.end - d.start;
    d.start = now;
    d.end = now + cycleLength;
    update();
  }
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

function renderTimeQuantity(millis) {
  var value;
  var units;
  if (millis < MINUTE) {
    value = Math.round(millis/SECOND);
    units = " second";
  } else if (millis < HOUR) {
    value = Math.round(millis/MINUTE);
    units = " minute";
  } else if (millis < DAY) {
    value = Math.round(millis/HOUR);
    units = " hour";
  } else if (millis < WEEK) {
    value = Math.round(millis/DAY);
    units = " day";
  } else {
    value = Math.round(millis/WEEK);
    units = " week";
  }
  if (value != 1) units += "s";
  return value + units;
}

function create() {
  var svg = d3.select("#mainSvg");

  var drag = d3.behavior.drag()
    .on("drag", centerPointDragged)
    .on("dragend", centerPointDragEnd);

  update();

  svg.append("circle")
    .attr("id", "centerPoint")
    .call(drag);

  svg.append("text")
    .attr("id", "centerPointLabel")
    .call(drag);

  svg.append("circle")
    .attr("id", "centerPointGuideCircle");

  resetCenterPoint();
}

function openCycleDialog(cycleData) {
  d3.select("#frostedGlass")
    .classed({'frostedGlassActive': true, 'frostedGlassInactive': false});
  var form = d3.select("#dialogLayer")
    .append("div")
    .attr("id", "dialog")
    .append("form");

  form
    .append("input")
    .attr("type", "text")
    .attr("value", cycleData["name"])
    .attr("id", "cycleName");

  form
    .append("br");

  form
    .append("input")
    .attr("type", "submit")
    .attr("value", "Remove")
    .on("click", closeCycleDialog);

  form
    .append("input")
    .attr("type", "submit")
    .attr("value", "Save")
    .on("click", closeCycleDialog);
}

function closeCycleDialog() {
  d3.select("#dialog").remove();

  d3.select("#frostedGlass")
    .classed({'frostedGlassActive': false, 'frostedGlassInactive': true});
}

function resetCenterPoint() {
  d3.select("#centerPoint")
    .attr("r", CENTER_POINT_RADIUS)
    .attr("fill", "red")
    .attr("cy", CENTER_Y)
    .attr("cx", CENTER_X);

  d3.select("#centerPointLabel")
    .attr("x", CENTER_X)
    .attr("y", CENTER_Y-CENTER_POINT_LABEL_OFFSET)
    .text("")
    .attr("text-anchor", "middle");

  d3.select("#centerPointGuideCircle")
    .attr("stroke", "black")
    .attr("fill", "transparent")
    .attr("r", 0)
    .attr("cx", CENTER_X)
    .attr("cy", CENTER_Y);
}

function centerPointDragEnd(d) {
  var now = new Date().getTime();
  var radius = d3.select("#centerPointGuideCircle").attr("r");
  var timeQuantity = radiusScale.invert(radius);
  var newCycle = {
    name: "New Cycle",
    start: now,
    end: now+timeQuantity,
    id: getNextId()
  };
  CYCLES.push(newCycle);
  resetCenterPoint();
  update();
  openCycleDialog(newCycle);
}

function centerPointDragged(d) {
  var newY = d3.event.y;
  if (newY >= 0 && newY <= CENTER_Y) {
    var radius = MAX_RADIUS - newY;
    var timeQuantity = radiusScale.invert(radius);

    d3.select("#centerPoint").attr("cy", newY);

    d3.select("#centerPointLabel")
      .attr("y", newY - CENTER_POINT_LABEL_OFFSET)
      .text(renderTimeQuantity(timeQuantity));

    d3.select("#centerPointGuideCircle")
      .attr("r", radius);
  }
}

function cycleTipDragged(d) {
  var ratio = getRatioFromCoordinates(d3.event.x, d3.event.y, CENTER_X, CENTER_Y);
  setElapsedRatio(d, ratio)
  update();
}

function update() {
  var drag = d3.behavior.drag()
    .on("drag", cycleTipDragged);

  var svg = d3.select("#mainSvg");
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
    .attr("r", function (d, i) { return getRadiusLog(d.end-d.start); })
    .attr("cx", CENTER_X)
    .attr("cy", CENTER_Y);
  guideCircle.exit().remove();

  var cycle = svg.selectAll("path.cycle")
    .data(CYCLES);
  cycle.enter()
    .append("path")
    .attr("class", "cycle")
    .attr("stroke", function (d) { return isCycleComplete(d) ? "red" : "green"; })
    .attr("stroke-width", "3")
    .attr("d", makeInitialPathData)
    .attr("fill", "transparent");
  cycle
    .attr("d", makeSubsequentPathData)
    .attr("stroke", function (d) { return isCycleComplete(d) ? "red" : "green"; });
  cycle.exit().remove();

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
    .attr("dy", -5) // moves the label off of the circle a bit
    .attr("style", "fill:black;")
    .append("textPath")
    .attr("xlink:href", function (d) { return "#label"+d.id })
    .attr("class", "textPathLabel");
  svg.selectAll(".textPathLabel")
    .text(function (d) { 
      if (isCycleComplete(d)) {
        return d.name;
      } else {
        var period = d.end - d.start;
        var remaining = period - (((new Date().getTime()) - d.start) % period);
        return d.name + " (" + renderTimeQuantity(remaining) + " left)";
      }
    });

 var cycleTip = svg.selectAll("circle.cycleTip")
    .data(CYCLES);
  cycleTip.enter()
    .append("circle")
    .attr("class", "cycleTip")
    .attr("r", 4)
    .attr("fill", function (d) { return isCycleComplete(d) ? "red" : "green"; })
    .on("click", resetCycle)
    .call(drag);
  cycleTip
    .attr("fill", function (d) { return isCycleComplete(d) ? "red" : "green"; })
    .attr("cy", makeCycleTipCY)
    .attr("cx", makeCycleTipCX);
  cycleTip.exit().remove();


}
