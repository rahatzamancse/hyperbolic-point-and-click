/**
 * @file This file has a list of utility function for calculating poincare disk projections.
 */
/**
 * This module is a collection of functions for calculating poincare disk projections.
 * @module hyperbolic_functions
 */
/**
 * The coordinate system transformation from canvas to poincare disk.
 * @param {NodeObject} p - The node of a graph with defined `x` and `y` in the canvas.
 * @param {PoinDisk} poindisk - The poindisk object to use.
 * @returns {{x: number, y: number}} - The new position in the canvas of poindisk.
 */
function canvas_to_disk(p, poindisk){
  let rect = poindisk.boundbox;
  let x = ((p.x - rect.left)/(rect.right-rect.left)-0.5)*2;
  let y = ((p.y - rect.top)/(rect.bottom-rect.top)-0.5)*-2;

  return {'x': x, 'y': y};
  // if (x*x+y*y < 1.0){
  //   return {'x': x, 'y': y}
  // }else{
  //   // console.log("Something went wrong, probably rounding error")
  //   // Still gracefully returning the value
  //   return {'x': x, 'y': y}
  // }
}

/**
* Projects points from the Euclidean plane to the poincare disk
*@param {NodeObject} ePosition - Point with defined x and y in the canvas
*@param {float} centerX - x coordinate of geometric mean of data
*@param {float} centerY - y coordinate of geometric mean of data
*@param {PoinDisk} poindisk - The poindisk object to use
*@param {boolean} inPlace - Whether the data is already in place or not.
*@returns {{circle: {cx: number, cy: number, r: number}}} - A circle object with it's appropriate cx,cy, and r for the poincare projection
*/
function to_poincare(ePosition, centerX, centerY, poindisk, inPlace = true) {
  //0.005 is a hyperparameter, but seems to work well.
  let x = 0.005 * (ePosition.x - centerX);
  let y = 0.005 * (ePosition.y - centerY);

  let circleR = Math.hypot(x, y);
  let theta = Math.atan2(x, y);

  //hR performs inverse lamber projection
  let hR = Math.acosh((0.5 * circleR * circleR) + 1);
  //Poincare projection
  let poincareR = Math.tanh(hR / 2);

  //Polar to cartesian coordinates
  let poinx = poindisk.r + poindisk.r * (poincareR * Math.sin(theta));
  let poiny = poindisk.r + poindisk.r * (poincareR * Math.cos(theta));

  if (inPlace) {
    ePosition.center = { 'x': poinx, 'y': poiny }
    ePosition.circle = poincare_circle(canvas_to_disk(ePosition.center, poindisk), 0.2, poindisk)
  }
  return {
    center: { 'x': poinx, 'y': poiny },
    //Find circle with hyperbolic radius 0.05 at center
    circle: poincare_circle(canvas_to_disk({x: poinx, y: poiny}, poindisk), 0.05, poindisk)
  }
}


/**
 * The coordinate system transformation from canvas to poincare disk.
 * @param {NodeObject} p - A point with defined `x` and `y` in terms of the poincare disk.
 * @param {PoinDisk} poindisk - The poindisk object to use.
 * @returns {{'x': number, 'y': number}} - New position in canvas of p
 */
function disk_to_canvas(p, poindisk){
  let x = p.x*poindisk.r + poindisk.cx;
  let y = -p.y*poindisk.r + poindisk.cy;
  return {'x': x, 'y': y};
}


/**
 * Convert polar coordinates to cartesian coordinates.
 * @param {number} r - Radial component of polar coordinate
 * @param {number} theta - Angular component of polar coordinate
 * @param {NodeObject} center - center from which r and theta are calculated
 * @returns {{'x': number, 'y': number}}  - cartesian coordiates of point
 */
function polar_to_cart(r,theta,center={'x':0,'y':0}){
  return{
    'x': center.x + (r * Math.cos(theta)),
    'y': center.y + (r * Math.sin(theta))
  };
}

/**
 * Convert cartesian coordinates to polar coordinates.
 * @param {NodeObject} p - A point with defined 'x' and 'y'
 * @returns {{'r': number, 'theta': number}}  - polar coordinates of point
 */
function cart_to_polar(p){
  let r = Math.sqrt(p.x*p.x+p.y*p.y);
  let theta = Math.atan2(p.y,p.x);
  return {'r': r, "theta": theta};
}

/**
 * Euclidean Distance.
 * @param {NodeObject} p - A point with defined 'x' and 'y'
 * @param {NodeObject} q - A point with defined 'x' and 'y'
 * @returns {number}  - Euclidean distance between p and q
 */
function euclid_dist(p,q){
  return Math.sqrt(Math.pow(p.x-q.x,2) + Math.pow(p.y-q.y,2));
}

/**
 * Hyperbolic Distance.
 * @param {NodeObject} p - A point with defined 'x' and 'y'
 * @param {NodeObject} q - A point with defined 'x' and 'y'
 * @returns {number}  - Hyperbolic distance between p and q
 */
function hyper_dist(p,q){
  let pow = Math.pow;
  let numerator = 2*(pow(p.x-q.x,2)+pow(p.y-q.y,2));
  let denominator = ((1- pow(p.x,2) + pow(p.y,2)) * (1- pow(q.x,2) + pow(q.y,2)));

  return Math.acosh(1 + (numerator/denominator));
}

/**
 * Returns true distance from orgin given the distance in the projection.
 * @param {number} r - Poincare radius
 * @returns {number}  - True distance from origin
 */
function r_poincare_to_euclid(r){
  return Math.tanh(r/2);
}

/**
 * Returns Poincare distance from orgin given the true hyperbolic distance.
 * @param {number} r - Hyperbolic radius
 * @returns {number}  - Poincare distance from origin
 */
function hyper_radius_from_euclidean(r){
  return 2*Math.atanh(r)
}

/**
 * Characterizes the Euclidean line between p and q.
 * @param {NodeObject} p - A point with defined 'x' and 'y'
 * @param {NodeObject} q - A point with defined 'x' and 'y'
 * @returns {{'a': number, 'b': number, 'c': number}}  - Parameters of line in the standard form: ax + by -c = 0
 */
function euclid_line(p,q){
  //TODO: make this more robust to error
  let line =  {'a': p.y-q.y,
          'b': q.x - p.x,
          'c': p.x*q.y - q.x*p.y};
  if (Math.abs(line.b) > 0.001){
    return {'a': line.a/line.b, 'b': line.b/line.b, 'c': line.c/line.b}
  }else{
    return line
  }
}

/**
 * Returns a line perpendicular to pq that contains v
 * @param {LineObject} pq - A line with defined 'a' and 'b' and 'c'
 * @param {NodeObject} v - A point with defined 'x' and 'y'
 * @returns {{'a': number, 'b': number, 'c': number}}  - Parameters of line in the standard form: ax + by -c = 0
 */
function get_perpendicular_line(pq,v){
  //Returns a line perpendicular to pq that contains v
  return {'a': pq.b, 'b': -pq.a, 'c': -v.x * pq.b + v.y*pq.a};
}

/**
 * Returns Euclidean midpoint between p and q
 * @param {NodeObject} p - A point with defined 'x' and 'y'
 * @param {NodeObject} q - A point with defined 'x' and 'y'
 * @returns {{'x': number, 'y': number}}  - midpoint between p and q
 */
function find_midpoint(p,q){
  //Returns the midpoint between p and q
  return {'x': (p.x + q.x) / 2, 'y': (p.y + q.y) / 2};
}

/**
 * Finds the point of intersection of lines pq and xy
 * @param {LineObject} pq - A line with defined 'a','b','c'
 * @param {LineObject} xy - A line with defined 'a','b','c''
 * @returns {{'x': number, 'y': number}}  - Intersection point
 */
function find_intersection(pq,xy){
  //TODO: Handle parallel lines
  //Returns the point of intersection between lines pq and xy
  return {
    'x': (pq.c * xy.b - pq.b * xy.c) / (pq.b * xy.a - pq.a * xy.b),
    'y': (pq.a * xy.c - pq.c * xy.a) / (pq.b * xy.a - pq.a * xy.b)
  };
}

/**
 * Finds the point in the inversion of the unit circle.
 * See https://en.wikipedia.org/wiki/Inversive_geometry#Inversion_in_a_circle for details
 * @param {NodeObject} p - A point with defined 'x' and 'y'
 * @param {CircleObject} circle - A circle with defined 'cx', 'cy', and 'r'
 * @returns {{'x': number, 'y': number}}  - Inverted point
 */
function circle_inversion(p,circle){
  let cx = circle.cx
  let cy = circle.cy

  let dist = euclid_dist(p, {'x':cx, 'y': cy});
  let new_c = circle.r*circle.r/(dist*dist);
  let u = {'x': (p.x - cx), 'y': (p.y - cy)};
  return {'x': new_c * u.x + cx, 'y': new_c * u.y + cy};
}

//
/**
 * Hyperbolic geodesic between two points in Poincare disk
 * @param {NodeObject} p - startpoint
 * @param {NodeObject} q - endpoint
 * @param {PoinDisk} poindisk - Poindisk object
 * @returns {{'p1': NodeObject, 'p2': NodeObject, 'C': NodeObject, 'r': number, 'startAngle': number, 'endAngle': number}}  - Characterization of arc in the poincare disk.
 */
function poincare_geodesic(p,q, poindisk){
  //Steps of the algorithm are as follows:
  //Find inverted points outside the unit disk
  //Grab midpoints between them.
  //Construct perpendicular lines at midpoint
  //Get intersection of perpendicular lines, C
  //C, along with p and q, fully characterize the arc.

  let left = poindisk.boundbox.left
  let top = poindisk.boundbox.top
  p = {'x': p.x-left, 'y': p.y-top}
  q = {'x': q.x-left, 'y': q.y-top}


  let pp = circle_inversion(p,poindisk);
  let qq = circle_inversion(q,poindisk);
  let M = find_midpoint(p,pp);
  let N = find_midpoint(q,qq);
  let m = get_perpendicular_line(euclid_line(p,pp),M);
  let n = get_perpendicular_line(euclid_line(q,qq),N);
  let C = find_intersection(m,n);

  return {'p1': p, 'p2': q, 'c': C,
          'startAngle': Math.atan2((q.y - C.y), q.x - C.x),
          'endAngle': Math.atan2((p.y - C.y), p.x - C.x),
          'r': euclid_dist(p,C)};
}

/**
 * Hyperbolic geodesic between two points in Poincare disk
 * @param {ArcObject} arc - Object with valid p1, p2, C, r, startAngle, and endAngle attributes
 * @param {PoinDisk} poindisk - PoinDisk
 * @returns {Object}  - Path string for the arc.
 */
function arc_path(arc, poindisk){
  //Takes an arc object (generated by poincare_geodesic) and
  //return a canvas/svg path for it.
  //Edge case handling comes from: https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle

  //let x = arc.c.x;
  //let y = arc.c.y;
  let radius = arc.r;
  let startAngle = Math.min(arc.startAngle,arc.endAngle);
  let endAngle = Math.max(arc.startAngle,arc.endAngle);

  let start = polar_to_cart(radius, endAngle,arc.c);
  let end = polar_to_cart(radius, startAngle,arc.c);

  if (endAngle - startAngle >= Math.PI) {
    start = polar_to_cart(radius, startAngle,arc.c);
    end = polar_to_cart(radius, endAngle,arc.c);
  }

  return [
      "M", start.x, start.y,
      "A", radius, radius, 0, "0", 0, end.x, end.y
  ].join(" ");

}


//Circle functions--------------------------------------------------------------
/**
 * Generates circle object with the correct center and radius
 * @param {NodeObject} center - Center in the poincare disk of cricle
 * @param {number} r - hyperbolic radius of circle
 * @param {NodeObject} q - PoinDisk
 * @returns {{'cx': number, 'cy': number, 'r': number}}  - Circle with the projected cx, cy, and r
 */

//TODO: Allow for a circle given two/three points
function poincare_circle(center,r, poindisk){
  //Return a circle in the poincare disk with center center and hyperbolic radius r
  //Math is done in terms of the Poincare disk

  let e_center_radius = Math.sqrt(center.x*center.x + center.y*center.y);
  let cr = hyper_radius_from_euclidean(e_center_radius); //Hyperbolic distance from origin

  let dh1 = cr - r;
  let dh2 = cr + r;
  let de1 = r_poincare_to_euclid(dh1);
  let de2 = r_poincare_to_euclid(dh2);
  let er = (de2-de1)/2;
  let ecr = (de2+de1)/2;

  let c_theta = Math.atan2(center.y,center.x);
  let x = ecr * Math.cos(c_theta);
  let y = ecr * Math.sin(c_theta);
  let canvas_coord = disk_to_canvas({'x':x, 'y':y},poindisk)
  //Attributes that begin with p are in terms of the poincare disk.
  return {'cx':canvas_coord.x, 'cy': canvas_coord.y, 'r': er*(poindisk.r),'px': x, 'py': y,  'center': {'x': x, 'y':y},
          'hcenter': disk_to_canvas(center,poindisk)}
}
