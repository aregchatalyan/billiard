// A cushion is used to stop a ball moving off the table: when a ball
// collides with a cushion its velocity will be reversed.

// x, y is center point of cushion
// length is length of inner edge
// direction is angle along the length of the cushion.
// depth is distance from inside edge to outside (the edge of the table).
function Cushion(x, y, length, direction, depth) {
  const p = new Polygon(new Vector(x, y));
  const sqrt2 = Math.SQRT2;

  p.move(depth, direction - Math.PI / 4);

  p.line(depth * 2, direction + Math.PI / 4);
  p.line(length - 6 * depth / sqrt2, direction);
  p.line(depth * 2, direction - Math.PI / 4);

  this.polygon = p;

  this.start = p.points[1];
  this.end = p.points[2];
  this.direction = direction;
  this.to_end = this.end.difference(this.start);
  this.normal = this.to_end.normal();
  this.center = p.center();
}

Cushion.prototype.draw = function (ctx) {
  ctx.save();
  ctx.fillStyle = green;
  this.polygon.draw(ctx);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Returns a unit vector whose direction is from the ball to a point on the
// boundary of the cushion.
Cushion.prototype.ball_impact_vector = function (ball, position) {
  if (!position) {
    position = ball.position;
  }

  const points = this.polygon.points; // length == 4
  for (let i = 0; i < points.length; i++) {
    const sep = points[i].difference(position);
    if (sep.magnitude() <= ball.radius) {
      return sep.unit();
    }
  }

  for (let i = 1; i < points.length; i++) {
    const impact = this.impact_in_line(points[i - 1], points[i], position, ball.radius);
    if (impact) {
      return impact;
    }
  }

  const path_to_center = new Line(position, this.center);
  let any_intersect = false;
  for (let i = 1; i < points.length && !any_intersect; i++) {
    const edge = new Line(points[i - 1], points[i]);
    if (path_to_center.intersect(edge, ball.radius / 100)) {
      any_intersect = true;
    }
  }
  if (!any_intersect) {
    return this.center.difference(position).unit();
  }

  return null;
}

Cushion.prototype.impact_in_line = function (start, end, position, radius) {
  const ball_from_start = position.difference(start);
  const line_from_start = end.difference(start);

  const length = line_from_start.magnitude();
  const unit = line_from_start.unit();
  const normal = unit.normal();

  const d1 = ball_from_start.dot_product(unit);

  if (d1 < 0) return null;
  if (d1 > length) return null;

  const d2 = Math.abs(ball_from_start.dot_product(normal));
  if (d2 > radius) return null;

  return normal;
}

Cushion.prototype.cushion_aimpoint = function (ball, target) {
  const bounce_line = new Line(this.start, this.end);
  bounce_line.move(this.normal.unit().scale(-ball.radius));

  const start = bounce_line.start;
  const to_ball = target.difference(start);
  const direction = this.to_end.angle();
  const angle = 2 * direction - to_ball.angle();
  const magnitude = to_ball.magnitude();
  const virtual = polar_vector(magnitude, angle).add(start);
  const path = new Line(ball.position, virtual);

  const bounce_point = path.intersect(bounce_line);

  if (bounce_point && bounce_point.distance_from_line(bounce_line) == null) {
    return null;
  }
  return bounce_point;
}

Cushion.prototype.blocks_path = function (path, ball) {
  let radius = 0;
  if (ball) {
    radius = ball.radius;
  }
  return this.polygon.intersects(path, radius);
}
