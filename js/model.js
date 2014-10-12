var cycles;
var nextId;

function getNextId() {
  return nextId++;
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

function resetCycle(d) {
  if (isCycleComplete(d)) {
    var now = new Date().getTime();
    var cycleLength = d.end - d.start;
    d.start = now;
    d.end = now + cycleLength;
    update();
  }
}

function storeCycles() {
  localStorage["cycles"] = JSON.stringify(cycles);
}

function loadCycles() {
  if (!("cycles" in localStorage)) {
    localStorage["cycles"] = JSON.stringify([]);
  }
  cycles = JSON.parse(localStorage["cycles"]);
  nextId = 1;
  for (var i=0; i < cycles.length; i++) {
    if (cycles[i]["id"] >= nextId) {
      nextId = cycles[i]["id"] + 1;
    }
  }
}


