// A shot represents a player's turn, from the initial strike of the
// (cue) ball to when the table returns to when all balls are stationary.
//
// For the computer player, it is also used as an anchor for information
// derrived for the planning of the shot.

function Shot(table) {
  this.table = table;
}

Shot.prototype.set_cueball_strikepoint = function (ball, point) {
  this.ball = ball;
  this.start = point;
  this.strength = 0;
  this.angle = point.angle();
}

Shot.prototype.adjust = function (point) {
  point.subtract(this.start);
  this.angle = point.angle();
  this.strength = point.magnitude();
  if (this.strength > .4) this.strength = .4;
}

Shot.prototype.commit = function () {
  const ball = this.ball;

  const velocity = polar_vector(this.strength * -strength_scaling, this.angle);
  const off_center = this.start.difference(ball.position).scale_down(ball.radius);

  const spin_speed = velocity.unit().dot_product(off_center);
  const spin = velocity.unit().scale(spin_speed);
  if (velocity.is_null()) spin.zero();

  const side = polar_vector(this.strength * masse_scaling, this.angle + Math.PI / 2).dot_product(off_center);

  ball.impulse(velocity, spin, side);
}

Shot.prototype.draw = function (ctx) {
  if (!this.start) return;
  ctx.strokeStyle = black;
  ctx.lineWidth = 0.005;
  ctx.beginPath();
  ctx.moveTo(this.start.x, this.start.y);
  const strength = this.strength * strength_scaling / 2.5;
  ctx.lineTo(
    this.start.x + strength * Math.sin(this.angle),
    this.start.y + strength * Math.cos(this.angle)
  );
  ctx.closePath();
  ctx.stroke();

  if (strength < 1) {
    ctx.strokeStyle = this.cue_color;
    ctx.lineWidth = 0.005;
    ctx.beginPath();
    ctx.moveTo(
      this.start.x + strength * Math.sin(this.angle),
      this.start.y + strength * Math.cos(this.angle)
    );
    ctx.lineTo(
      this.start.x + Math.sin(this.angle),
      this.start.y + Math.cos(this.angle)
    );
    ctx.closePath();
    ctx.stroke();
  }

  if (show_targeting_line) {
    const cue_ball = this.ball.position;
    ctx.strokeStyle = white;
    ctx.lineWidth = 0.001;
    ctx.beginPath();
    ctx.moveTo(cue_ball.x, cue_ball.y);
    ctx.lineTo(
      cue_ball.x - Math.sin(this.angle),
      cue_ball.y - Math.cos(this.angle)
    );
    ctx.closePath();
    ctx.stroke();
  }
}
