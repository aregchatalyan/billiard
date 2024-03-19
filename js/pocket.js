// Pockets are where balls are potted!

function Pocket(table, x, y, ball_scale, pocket_scale) {
  this.table = table;
  this.position = new Vector(x, y);
  this.radius = ball_scale * pocket_scale;
  const aimpoint_vector = new Vector(0, 0);
  if (x > 0) {
    aimpoint_vector.x = -1;
  } else if (x < 0) {
    aimpoint_vector.x = 1;
  }

  if (y > 0) {
    aimpoint_vector.y = -1;
  } else if (y < 0) {
    aimpoint_vector.y = 1;
  }

  this.aimpoint_vector = aimpoint_vector.unit();
}

Pocket.prototype.draw = function (ctx) {
  ctx.save();
  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

Pocket.prototype.shot_would_pot_cueball = function (shot_candidate) {
  const cueball = shot_candidate.cueball;
  const aimpoint = shot_candidate.aimpoint;
  const object_ball = shot_candidate.object_ball;
  const cueball_destination = shot_candidate.cueball_destination;
  const pocket_aimpoint = this.get_aimpoint(object_ball);

  // no in-off from hanging ball
  if (pocket_aimpoint.distance_from(object_ball.position) < object_ball.radius ||
    this.position.distance_from(object_ball.position) < object_ball.radius) {
    return false;
  }

  const path = new Line(aimpoint, cueball_destination);

  const distance_from_pocket =
    this.position.distance_from_line(path);
  if (distance_from_pocket != null &&
    distance_from_pocket < this.radius + cueball.radius) {
    return true;
  }

  const distance_from_pocket_aimpoint =
    pocket_aimpoint.distance_from_line(path);

  return distance_from_pocket_aimpoint != null &&
    distance_from_pocket_aimpoint < this.radius;
}

// calc appropriate aimpoint for the object ball: usually we aim for a point
// close to the mouth of the pocket, but if the ball is closer to the pocet than
// that, then use the pocket itself.
Pocket.prototype.get_aimpoint = function (ball) {
  const table = this.table;
  const aimpoint = this.position.clone();
  const delta = this.aimpoint_vector;
  const radius = this.radius + ball.radius * 2;
  const scale = radius / 20;
  for (let i = 0; i < 20; i++) {
    if (!table.path_blocked(ball, ball.position, aimpoint, null)) {
      return aimpoint;
    }
    aimpoint.add_scaled(delta, scale);
  }
  return aimpoint;
}

Pocket.prototype.get_ball_in_hand_candidate = function (cueball, object_ball) {
  const pocket_to_ball = object_ball.position.difference(this.aimpoint);
  const angle = pocket_to_ball.angle() + (Math.random() - 0.5) * Math.PI / 2;
  const magnitude = (1 + Math.random() * 3) * (object_ball.radius + cueball.radius);
  return polar_vector(magnitude, angle).add(object_ball.position);
}
