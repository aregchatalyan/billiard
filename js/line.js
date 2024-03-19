// A line joins two points.

function Line(a, b) {
  this.start = a.clone();
  this.end = b.clone();
}

Line.prototype.equals = function (other, epsilon) {
  return this.start.equals(other.start, epsilon)
    && this.end.equals(other.end, epsilon);
}

Line.prototype.delta = function () {
  return this.end.difference(this.start);
}

Line.prototype.length = function () {
  return this.delta().magnitude();
}

Line.prototype.unit = function () {
  return this.delta().unit();
}

Line.prototype.angle = function () {
  return this.delta().angle();
}

Line.prototype.angle_from = function (other) {
  let diff = other.angle() - this.angle();
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

Line.prototype.move = function (vec) {
  this.start.add(vec);
  this.end.add(vec);
}

Line.prototype.intersect = function (other, epsilon) {
  const x1 = this.start.x;
  const y1 = this.start.y;
  const x2 = this.end.x;
  const y2 = this.end.y;
  const x3 = other.start.x;
  const y3 = other.start.y;
  const x4 = other.end.x;
  const y4 = other.end.y;

  let px = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
  let py = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
  const scale = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  px /= scale;
  py /= scale;

  if (!epsilon) {
    epsilon = 0;
  }
  const value_in_range = function (min, v, max) {
    if (v - min < -epsilon) {
      return false;
    }
    return max - v >= -epsilon;

    //return v >= min && v <= max;
  }

  if (!value_in_range(
    Math.max(Math.min(x1, x2), Math.min(x3, x4)),
    px,
    Math.min(Math.max(x1, x2), Math.max(x3, x4)))) {
    return null;
  }

  if (!value_in_range(
    Math.max(Math.min(y1, y2), Math.min(y3, y4)),
    py,
    Math.min(Math.max(y1, y2), Math.max(y3, y4)))) {
    return null;
  }

  return new Vector(px, py);
}
