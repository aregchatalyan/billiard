// A table is where the action occurs


function Table() {
  this.update_id = null;
  this.shot = null;
}

Table.prototype.initialize = function (game) {
  this.balls = [];
  this.pockets = [];
  this.cushions = [];

  this.pockets.push(new Pocket(this, -1, -.5, ball_scale, pocket_scale));
  this.pockets.push(new Pocket(this, -1, .5, ball_scale, pocket_scale));
  this.pockets.push(new Pocket(this, 0, -.5, ball_scale, pocket_scale));
  this.pockets.push(new Pocket(this, 0, .5, ball_scale, pocket_scale));
  this.pockets.push(new Pocket(this, 1, -.5, ball_scale, pocket_scale));
  this.pockets.push(new Pocket(this, 1, .5, ball_scale, pocket_scale));

  this.cushions.push(new Cushion(-1, 0.5, 1, Math.PI / 2, ball_scale * pocket_scale));
  this.cushions.push(new Cushion(0, 0.5, 1, Math.PI / 2, ball_scale * pocket_scale));
  this.cushions.push(new Cushion(0, -0.5, 1, -Math.PI / 2, ball_scale * pocket_scale));
  this.cushions.push(new Cushion(1, -0.5, 1, -Math.PI / 2, ball_scale * pocket_scale));
  this.cushions.push(new Cushion(1, 0.5, 1, Math.PI, ball_scale * pocket_scale));
  this.cushions.push(new Cushion(-1, -0.5, 1, 0, ball_scale * pocket_scale));

  // cue ball
  this.cue_ball = new Ball(.5, 0, ball_scale, white, 'cue');
  this.balls.push(this.cue_ball);
  this.ball_in_hand = 1;
  this.is_break_shot = false;

  status_message('game', game);

  if (game === '9 Ball') {
    this.game = new Game_9ball(this);
    this.is_break_shot = true;
  } else if (game === '8 Ball') {
    this.game = new Game_8ball(this);
    this.is_break_shot = true;
  } else {
    alert('unknown game: ' + game);
  }

  this.game.create_balls(ball_scale);
}

Table.prototype.legal_ball_in_hand_bounding_box = function () {
  if (this.is_break_shot) {
    return { 'left': 0.5 - this.cue_ball.radius, 'right': +1, 'top': -.5, 'bottom': +.5 };
  } else {
    return { 'left': -1, 'right': +1, 'top': -.5, 'bottom': +.5 };
  }
}

Table.prototype.player = function () {
  return this.game.player();
}

Table.prototype.get_ball_by_name = function (name, count) {
  if (!count) count = 1;
  for (let i = 0; i < this.balls.length; i++) {
    if (this.balls[i].name === name) {
      if (--count === 0) {
        return this.balls[i];
      }
    }
  }
  return null;
}

Table.prototype.get_pocket_by_position = function (x, y, distance) {
  const point = new Vector(x, y);
  for (let i = 0; i < this.pockets.length; i++) {
    const pocket = this.pockets[i];
    if (point.distance_from(pocket.position) < (distance ? distance : pocket.radius)) {
      return pocket;
    }
  }
  return null;
}

Table.prototype.replace_ball = function (ball) {
  ball.stop();
  let x = -0.5;
  let direction = -1;
  let done = 0;
  let count = 50;

  while (!done) {
    if (--count === 0) done = 1;
    if (direction === -1 && x < -1 + ball.radius) {
      x = -0.5;
      direction = 1;
    } else if (direction === 1 && x > 1 - ball.radius) {
      x = -0.5;
      // give up
      done = 1;
    } else {
      ball.position = new Vector(x, 0);
      const other = ball.find_overlapping_ball(this.balls);
      if (other != null) {
        const Dy = other.position.y;
        const h = ball.radius + other.radius;
        const Dx = Math.sqrt(h * h - Dy * Dy) + rack_ball_spacing;
        x = other.position.x + Dx * direction;
      } else {
        done = 1;
      }
    }
  }

  ball.position = new Vector(x, 0);
  this.balls.push(ball);
}

Table.prototype.begin_shot = function () {
  this.shot = new Shot(this);
  this.game.begin_shot(this.shot);
  return this.shot;
}

Table.prototype.commit_shot = function () {
  if (!this.shot) return;
  this.shot.commit();
  this.game.ball_struck();
  this.shot = null;
  this.is_break_shot = false;
  this.do_action();
}

Table.prototype.draw = function () {
  const ctx = this.ctx;

  ctx.fillStyle = gray;
  ctx.beginPath();
  ctx.rect(-1.5, -1, 3, 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.rect(-1.2, -0.7, 2.4, 1.4);
  ctx.closePath();
  ctx.fill();

  const outer = ball_scale * pocket_scale * Math.SQRT2;
  ctx.fillStyle = green;
  ctx.beginPath();
  ctx.rect(-1 - outer, -0.5 - outer, 2 + 2 * outer, 1 + 2 * outer);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = black;
  ctx.lineWidth = 0.005;
  ctx.beginPath();
  ctx.moveTo(0.5, 0.5);
  ctx.lineTo(0.5, -0.5);
  ctx.moveTo(0.5, 0.25);
  ctx.arc(0.5, 0, 0.25, Math.PI * 0.5, Math.PI * -0.5, true);
  ctx.closePath();
  ctx.stroke();

  for (let pocket in this.pockets) {
    this.pockets[pocket].draw(ctx);
  }

  for (let cushion in this.cushions) {
    this.cushions[cushion].draw(ctx);
  }

  const inner = outer / 2;
  ctx.fillStyle = brown;
  ctx.beginPath();
  ctx.moveTo(-1 - inner, -0.5 - inner);
  ctx.lineTo(-1 - inner, +0.5 + inner);
  ctx.lineTo(+1 + inner, +0.5 + inner);
  ctx.lineTo(+1 + inner, -0.5 - inner);
  ctx.moveTo(+1 + outer, -0.5 - outer);
  ctx.lineTo(+1 + outer, +0.5 + outer);
  ctx.lineTo(-1 - outer, +0.5 + outer);
  ctx.lineTo(-1 - outer, -0.5 - outer);
  ctx.lineTo(+1 + outer, -0.5 - outer);
  ctx.moveTo(+1 + inner, -0.5 - inner);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();


  for (let ball in this.balls) {
    this.balls[ball].draw(ctx);
  }

  if (this.shot) {
    this.shot.draw(ctx);
  }

  if (DEBUG && this.shot_candidate) {
    this.shot_candidate.draw(ctx);
  }
}

Table.prototype.update = function () {
  for (let i in this.balls) {
    this.balls[i].begin_update();
  }

  for (let i in this.balls) {
    const ball_i = this.balls[i];
    for (let j in this.balls) {
      if (i !== j) {
        const ball_j = this.balls[j];
        if (ball_i.do_collision(ball_j)) {
          this.game.collision(ball_i, ball_j);
        }
      }
    }
  }

  for (let i = 0; i < this.balls.length; i++) {
    const ball = this.balls[i];
    const cushion = ball.do_cushion(this);
    if (cushion) {
      this.game.cushion(ball, cushion);
    }
  }

  for (let i = 0; i < this.balls.length; i++) {
    this.balls[i].do_friction();
  }

  const potted = [];
  for (let i = 0; i < this.balls.length; i++) {
    if (this.balls[i].is_potted(this.pockets)) {
      this.balls[i].stop();
      potted.push(i);
    }
  }
  while (potted.length) {
    let i = potted.shift();
    this.game.potted(this.balls[i]);
    this.balls[i] = this.balls[0];
    this.balls.shift();
  }

  const off_table = [];
  for (let i = 0; i < this.balls.length; i++) {
    if (!this.balls[i].end_update()) {
      this.balls[i].stop();
      off_table.push(i);
    }
  }
  while (off_table.length) {
    let i = off_table.shift();
    this.game.off_table_balls.push(this.balls[i]);
    this.balls[i] = this.balls[0];
    this.balls.shift();
  }
}

Table.prototype.is_stable = function () {
  for (let i in this.balls) {
    if (!this.balls[i].is_stable()) return false;
  }
  return true;
}

Table.prototype.do_action = function () {

  const table = this;

  function update_fn() {
    table.update();
  }

  if (table.update_id == null) {
    table.update_id = setInterval(update_fn, 10);
  }

}

Table.prototype.path_blocked = function (ball_at_start, start_position, target, ball_at_target) {
  const balls = this.balls;
  const path = new Line(start_position, target);
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    if (ball !== ball_at_start && ball !== ball_at_target &&
      ball.blocks_path(path)) {
      return true;
    }
  }
  const cushions = this.cushions;
  for (let i = 0; i < cushions.length; i++) {
    if (cushions[i].blocks_path(path, ball_at_start)) {
      return true;
    }
  }

  return false;
}

Table.prototype.collision_would_pot_cueball = function (shot_candidate) {
  const cueball = shot_candidate.cueball;
  const aimpoint = shot_candidate.aimpoint;
  const object_ball = shot_candidate.object_ball;
  const cueball_destination = shot_candidate.cueball_destination;

  if (this.path_blocked(object_ball, aimpoint, cueball_destination, cueball)) {
    return false;
  }

  const pockets = this.pockets;
  for (let i = 0; i < pockets.length; i++) {
    if (pockets[i].shot_would_pot_cueball(shot_candidate)) {
      return true;
    }
  }
  return false;
}

Table.prototype.random_position = function (ball) {
  return new Vector(Math.random() * 2 * (1 - ball.radius) - 1,
    Math.random() * (1 - ball.radius) - 0.5);
}
