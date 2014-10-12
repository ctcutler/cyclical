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

  // Trig is *not* my strong suit but the following works experimentally. 
  var ratio;
  if (y > 0) {
    ratio = Math.acos(-x) / (2*Math.PI);
  } else {
    ratio = ((2*Math.PI) - Math.acos(-x)) / (2*Math.PI);
  }

  // adjust the ratio so that it starts at 12 o'clock on the circle
  return (ratio + .75) % 1;
}
