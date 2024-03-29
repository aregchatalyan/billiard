// Players. Human players obey mouse commands; Computer plays have their own
// strategies.

function Player() {}

function Player_ctor(player, name, cue) {
  player.name = name;
  player.ball_color = false;
  player.cue_color = cue;
}

Player.prototype.join_game = function (game, table) {
  this.game = game;
  this.table = table;
}

Player.prototype.mouse_down = function (vec) {}
Player.prototype.mouse_up = function (vec) {}
Player.prototype.mouse_move = function (vec) {}

Player.prototype.begin_shot = function () {
  this.table.begin_shot();
}

// -- Human --

function HumanPlayer(name, cue) {
  Player_ctor(this, name, cue);
}

HumanPlayer.prototype = new Player();

HumanPlayer.prototype.mouse_down = function (vec) {
  const table = this.table;
  if (!table.is_stable()) return;
  if (!table.shot) {
    this.begin_shot();
  }
  if (!table.ball_in_hand) {
    const cue_ball = table.cue_ball;
    if (vec.distance_from(cue_ball.position) < cue_ball.radius) {
      table.shot.set_cueball_strikepoint(cue_ball, vec);
    }
  }
}

HumanPlayer.prototype.mouse_up = function (vec) {
  const table = this.table;
  if (table.ball_in_hand) {
    const cue_ball = table.cue_ball;
    cue_ball.position = vec;
    if (cue_ball.is_legal_ball_in_hand_position(table)) {
      table.ball_in_hand = 0;
    }
  } else if (table.shot) {
    table.shot.adjust(vec);
    table.commit_shot();
  }
}

HumanPlayer.prototype.mouse_move = function (vec) {
  const table = this.table;
  if (table.ball_in_hand) {
    table.cue_ball.position = vec;
  } else if (table.shot && table.shot.start) {
    table.shot.adjust(vec);
  }
}

// -- Computer --

function ComputerPlayer(name, cue) {
  Player_ctor(this, name, cue);
}

ComputerPlayer.prototype = new Player();


ComputerPlayer.prototype.get_direct_shots = function (legal_balls, cueball) {
  const pockets = this.table.pockets;
  const candidates = [];
  for (let i = 0; i < legal_balls.length; i++) {
    const ball = legal_balls[i];
    for (let j = 0; j < pockets.length; j++) {
      const pocket = pockets[j];
      const candidate = ShotCandidate.direct_shot(
        this.table, cueball, ball, pocket);
      if (candidate.is_possible()) {
        if (DEBUG) console.log('direct', pocket, candidate);
        candidates.push(candidate);
      }
    }
  }
  return candidates;
}

ComputerPlayer.prototype.get_cushion_shots = function (legal_balls, cueball) {
  const pockets = this.table.pockets;
  const cushions = this.table.cushions;
  const candidates = [];
  for (let i = 0; i < cushions.length; i++) {
    const cushion = cushions[i];
    for (let j = 0; j < legal_balls.length; j++) {
      const ball = legal_balls[j];
      for (let k = 0; k < pockets.length; k++) {
        const pocket = pockets[k];
        const candidate = ShotCandidate.cueball_cushion_shot(
          this.table, cueball, cushion, pocket, ball);
        if (candidate.is_possible()) {
          if (DEBUG) console.log('cushion: ', candidate);
          candidates.push(candidate);
        }
      }
    }
  }
  return candidates;
}

ComputerPlayer.prototype.get_potting_candidates = function () {
  const pockets = this.table.pockets;
  const balls = this.table.balls;
  const game = this.game;
  const cue_ball = this.table.cue_ball;
  const cushions = this.table.cushions;
  const candidates = [];

  for (let object_ball_index = 0; object_ball_index < balls.length;
       object_ball_index++) {
    const object_ball = balls[object_ball_index];
    if (!game.ball_is_ok_to_hit(object_ball, this)) {
      continue;
    }

    for (let pot_ball_index = 0; pot_ball_index < balls.length;
         pot_ball_index++) {
      const pot_ball = balls[pot_ball_index];
      if (!game.ball_is_good_to_pot(pot_ball, this)) {
        continue;
      }

      for (let pocket_index = 0; pocket_index < pockets.length;
           pocket_index++) {
        const pocket = pockets[pocket_index];
        for (let cueball_cushion_index = 0;
             cueball_cushion_index <= cushions.length; cueball_cushion_index++) {
          // cueball_cushion null implies no cushion.
          const cueball_cushion = cushions[cueball_cushion_index];
          for (let object_ball_cushion_index = 0;
               object_ball_cushion_index <= cushions.length;
               object_ball_cushion_index++) {
            const object_ball_cushion = cushions[object_ball_cushion_index];
            const candidate = this.get_shot(
              cue_ball, cueball_cushion, object_ball, object_ball_cushion,
              pot_ball, pocket);
            if (candidate) {
              candidates.push(candidate);
            }
          }
        }
      }
    }
  }

  return candidates;
}

ComputerPlayer.prototype.get_shot = function (
  cueball, cueball_cushion, object_ball, object_ball_cushion, pot_ball,
  pocket) {
  if ((cueball_cushion || object_ball_cushion) && this.table.is_break_shot) {
    return null;
  }

  const shot_candidate = ShotCandidate.canon_shot(
    this.table, cueball, cueball_cushion, pocket,
    object_ball, object_ball_cushion, pot_ball);

  if (shot_candidate && shot_candidate.is_possible()) {
    if (this.game.ball_is_great_to_pot(pot_ball, this)) {
      shot_candidate.difficulty *= 0.6;
      shot_candidate.strength = shot_candidate.base_strength;
      shot_candidate.great_shot = true;
      if (!shot_candidate.cueball_cushion) {
        shot_candidate.spin_strength = 0;
        shot_candidate.difficulty *= 0.7;
      }
    }
    if (DEBUG) console.log('get_shot: ', shot_candidate);
    return shot_candidate;
  }

  return null;
}

ComputerPlayer.prototype.get_random_shots = function (legal_balls, cueball, count) {
  const candidates = [];
  for (let i = 0; i < count; i++) {
    const ball = legal_balls[i % legal_balls.length];
    const offset = polar_vector(
      Math.random() * ball.radius * 1.9, Math.random() * 2 * Math.PI);
    const aimpoint = offset.add(ball.position);
    const candidate = ShotCandidate.pocketless_shot(this.table, cueball, aimpoint, ball);
    if (candidate.is_possible()) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

ComputerPlayer.prototype.grep_candidates = function (candidates, match_fn) {
  const match = [];

  for (let i = 0; i < candidates.length; ++i) {
    if (match_fn(candidates[i])) {
      match.push(candidates[i]);
    }
  }

  return match;
}

ComputerPlayer.prototype.get_easy_shot_candidates = function (
  legal_balls, cueball) {
  const candidates = this.get_direct_shots(legal_balls, cueball);
  const easy = this.grep_candidates(candidates, function (candidate) { return candidate.is_possible() && candidate.is_easy() });
  return easy.length !== 0;
}

ComputerPlayer.prototype.get_shot_candidates = function (legal_balls, cueball) {
  let easy;
  let candidates = this.get_potting_candidates();

  candidates = this.grep_candidates(
    candidates, function (candidate) {return candidate.is_possible()});

  if (candidates.length > 0) {
    easy = this.grep_candidates(
      candidates, function (candidate) {return candidate.is_easy()});
    if (DEBUG) console.log('Easy: ', easy.length, easy);
    if (easy.length > 0) {
      return easy;
    }

    let moderate = this.grep_candidates(
      candidates, function (candidate) {return candidate.is_moderate()});
    moderate.sort(ShotCandidate.sort_by_difficulty);
    if (DEBUG) console.log('Moderate: ', moderate.length, moderate);
    if (moderate.length > 0) {
      const difficulty = moderate[0].difficulty * 1.5;
      moderate = this.grep_candidates(moderate,
        function (candidate) { return candidate.difficulty < difficulty });
      return moderate;
    }
  }

  candidates = candidates.concat(this.get_random_shots(
    legal_balls, cueball, legal_balls.length * 20));

  if (candidates.length > 0) {
    easy = this.grep_candidates(
      candidates, function (candidate) {return candidate.is_easy()});
    if (easy.length > 0) {
      return easy;
    }
    const hard = this.grep_candidates(
      candidates, function (candidate) {return candidate.is_possible()});
    if (hard.length > 0) {
      return hard;
    }
    return candidates;
  }

  const random_aimpoint = new Vector(Math.random() * 2 - 1, Math.random() - 0.5);
  if (DEBUG) console.log('RANDOM: ', random_aimpoint);
  return [ ShotCandidate.random_shot(this.table, cueball, random_aimpoint) ];
}

ComputerPlayer.prototype.set_ball_in_hand_position = function (legal_balls) {
  const table = this.table;
  const pockets = table.pockets;
  const cue_ball = table.cue_ball;
  let positions = [];
  for (let i = 0; i < 500; i++) {
    const position = table.random_position(cue_ball);
    cue_ball.position = position;
    if (cue_ball.is_legal_ball_in_hand_position(table, position) &&
      this.get_easy_shot_candidates(legal_balls, cue_ball)) {
      positions.push(position);
    }
  }
  if (positions.length === 0) {
    const bbox = table.legal_ball_in_hand_bounding_box();
    const width = bbox.right - bbox.left - 2 * cue_ball.radius;
    const height = bbox.bottom - bbox.top - 2 * cue_ball.radius;
    const x = bbox.left + (Math.random() * width) + cue_ball.radius;
    const y = bbox.top + (Math.random() * height) + cue_ball.radius;
    positions = [ new Vector(x, y) ];
  }

  const index = Math.floor(Math.random() * positions.length);
  cue_ball.position = positions[index];
}

ComputerPlayer.prototype.begin_shot = function () {
  const table = this.table;
  const game = this.game;

  const shot = table.begin_shot();

  const legal_balls = this.game.legal_balls(this);
  if (DEBUG) console.log('BEGIN COMPUTER SHOT');

  if (table.ball_in_hand) {
    this.set_ball_in_hand_position(legal_balls);
    table.ball_in_hand = 0;
  }

  const shot_candidates = this.get_shot_candidates(legal_balls, table.cue_ball);

  let delay = 700;
  let display_time = 500;
  setTimeout(function () { shot_candidates[0].begin_shot(shot) }, delay);

  let shots_to_show = shot_candidates.length;
  if (DEBUG) {
    display_time *= 2;
    //shots_to_show *= 5;
  } else if (shots_to_show > 5) {
    shots_to_show = 5;
  }

  function preview_shot(index) {
    delay += display_time;
    setTimeout(function () { shot_candidates[index].begin_shot(shot) }, delay);
  }

  for (let i = 1; i < shots_to_show; i++) {
    preview_shot(i % shot_candidates.length);
  }

  let index = this.select_shot(shot_candidates);
  index = Math.floor(Math.random() * shot_candidates.length);

  preview_shot(index);

  delay += 1000;
  setTimeout(function () { shot_candidates[index].commit_shot(shot) }, delay);
}

// assume candidates.length > 0;
ComputerPlayer.prototype.select_shot = function (candidates) {
  if (candidates[0].great_shot) {
    return 0;
  }
  const cumulative = [];
  let total = 0;
  for (let i = 0; i < candidates.length; i++) {
    total += candidates[i].difficulty;
    cumulative.push(total);
  }
  const selection = Math.random() * total;
  for (let i = 0; i < cumulative.length; i++) {
    if (cumulative[i] > selection) {
      return cumulative.length - i - 1;
    }
  }
  return 0;
}
