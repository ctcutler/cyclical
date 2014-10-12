

/* for js console testing:
s = document.createElement('script');
s.src = "file:///Users/ctcutler/src/cyclical/lib/d3.v3.min.js"
document.body.appendChild(s)

http://jsfiddle.net/r4T77/
*/


function create() {
  loadCycles();

  /*
  for (var i=0; i < cycles.length; i++) {
    console.log(cycles[i]);
  }
  */

  var svg = d3.select("#mainSvg");

  var drag = d3.behavior.drag()
    .on("drag", centerPointDragged)
    .on("dragend", centerPointDragEnd);

  update();

  svg.append("circle")
    .attr("id", "centerPoint")
    .call(drag);

  if (cycles.length == 0) {
    svg.append("text")
      .attr("id", "helpText")
      .attr("style", "text-anchor: middle;")
      .attr("x", CENTER_X)
      .attr("y", CENTER_Y)
      .attr("dy", 25)
      .text("Drag this up and let it go to create a cycle.");
  } 

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
    .append("form")
    // without this, page may spontaneously reload
    .attr("action", "javascript:void(0);"); 


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
    .attr("value", "Cancel")
    .on("click", closeCycleDialog);

  form
    .append("input")
    .attr("type", "submit")
    .attr("value", "Remove")
    .on("click", function () {
      for (var i=0; i < cycles.length; i++) {
        if (cycles[i]["id"] == cycleData["id"]) {
          cycles.splice(i, 1);
          break;
        }
      }
      closeCycleDialog();
      update();
    });

  form
    .append("input")
    .attr("type", "submit")
    .attr("value", "Save")
    .on("click", function() {
      cycleData["name"] = d3.select("#cycleName").property("value");
      closeCycleDialog();
      update();
    });
}

function closeCycleDialog() {
  d3.select("#dialog").remove();

  d3.select("#frostedGlass")
    .classed({'frostedGlassActive': false, 'frostedGlassInactive': true});
}

function resetCenterPoint() {
  d3.select("#centerPoint")
    .attr("r", CENTER_POINT_RADIUS)
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
  cycles.push(newCycle);
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

function cyclesKey(d) {
  return d.id;
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
    .data(cycles, cyclesKey);
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
    .data(cycles, cyclesKey);
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
    .data(cycles, cyclesKey);
  labelPath.enter()
    .append("path")
    .attr("class", "labelPath")
    .attr("id", function (d) { return "label"+d.id })
    .attr("d", makeLabelPathData);
  labelPath.exit().remove();

  var labelUse = svg.selectAll("use.label")
    .data(cycles, cyclesKey);
  labelUse.enter()
    .append("use")
    .attr("xlink:href", function (d) { return "#label"+d.id })
    .attr("class", "label")
    .attr("fill", "none")
    .attr("stroke", "none");
  labelUse.exit().remove();

  var text = svg.selectAll("text.label")
    .data(cycles, cyclesKey);
  text.enter()
    .append("text")
    .attr("class", "label")
    .attr("dy", -5) // moves the label off of the circle a bit
    .on("click", openCycleDialog)
    .attr("style", "fill:black;")
    .append("textPath")
    .attr("xlink:href", function (d) { return "#label"+d.id })
    .attr("class", "textPathLabel");
  text.exit().remove();

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
    .data(cycles, cyclesKey);
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

  if (cycles.length > 0) {
    svg.select("#helpText").remove();
  }

  storeCycles();
}
