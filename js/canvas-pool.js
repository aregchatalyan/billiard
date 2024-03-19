// the main interaction with the web page

const white = '#ffffff';
const red = '#ff0000';
const yellow = '#ffff00';
const green = '#00ff00';
const black = '#000000';
const gray = '#444444';

const blue = '#0000ff';

const purple = '#ff00ff';
const gold = '#ffff80';
const orange = '#ffa000';
const darkgreen = '#008000';
const brown = '#808040';

const show_targeting_line = 1;
let game = '8 Ball';

const table_scale = 0.7;
const ball_scale = table_scale / 20;
const pocket_scale = 1.5;
const rack_ball_spacing = 0.01;

const skimming_friction = 1 / 400;
const rolling_threshold = skimming_friction * 30;
const rolling_friction = skimming_friction / 20;
const static_threshold = rolling_friction * 10;

let strength_scaling = 2.5;
let masse_scaling = 1;

const classes = [ 'ball', 'cushion', 'game', 'line', 'player', 'pocket', 'polygon', 'shot', 'shot-candidate', 'shot-candidate-path', 'table', 'vector' ];

for (let i = 0; i < classes.length; ++i) {
  document.write('<script type=\'text/javascript\' src=\'js/' + classes[i] + '.js\'></script>');
}

const status_message = (prefix, msg) => {
  const elem = document.getElementById('msg');
  let txt = prefix;
  if (msg != null) {
    txt += ': ' + msg;
  }
  elem.innerHTML = txt;
}

let draw_id = null;

let current_game;

const set_player_type = (form, index) => {
  if (!current_game) return;
  const type_rb = document.getElementsByName(form);
  for (let i = 0; i < type_rb.length; ++i) {
    if (type_rb[i].checked) {
      current_game.set_player_type(type_rb[i].value, index);
    }
  }
}

let DEBUG = false;

const set_debug_mode = (name) => {
  const debug_input = document.getElementsByName(name);
  DEBUG = debug_input[0].checked;
}

const init_pool_table = (name) => {

  if (draw_id) {
    clearInterval(draw_id);
    draw_id = null;
  }

  const game_rb = document.getElementsByName(name + '_game');
  for (let i = 0; i < game_rb.length; ++i) {
    if (game_rb[i].checked) game = game_rb[i].value;
  }

  const div = document.getElementById(name);
  let table;
  const canvas_name = name + '_canvas';

  const set_drawing_context = () => {
    let width = window.innerWidth - 200;
    if (width < 300) width = 300;
    const height = width / 2;

    let canvas_html = '<canvas';
    canvas_html += ' id=' + canvas_name;
    canvas_html += ' width=' + width;
    canvas_html += ' height=' + height;
    canvas_html += '>Sorry, your browser doesn\'t appear to support the HTML-5 Canvas</canvas>';
    div.innerHTML = canvas_html;

    const canvas = document.getElementById(canvas_name);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!table) {
      table = new Table();
      table.initialize(game);
    }

    // table center is (0,0);
    // length is -1 .. +1;
    // width is -.5 .. +.5
    ctx.translate(width / 2, height / 2);
    ctx.scale(height * table_scale, height * table_scale);

    table.ctx = ctx;

    const canvas_offset = new Vector(
      canvas.offsetLeft + width / 2,
      canvas.offsetTop + height / 2
    );

    const mouse_vec = (evt) => {
      const vec = new Vector(evt.clientX + window.scrollX, evt.clientY + window.scrollY);
      vec.subtract(canvas_offset);
      vec.scale_down(height * table_scale);
      return vec;
    }

    const mouse_down = (evt) => {
      evt.preventDefault();
      table.player().mouse_down(mouse_vec(evt));
    }

    const mouse_up = (evt) => {
      evt.preventDefault();
      table.player().mouse_up(mouse_vec(evt));
    }

    const mouse_move = (evt) => {
      evt.preventDefault();
      table.player().mouse_move(mouse_vec(evt));
    }

    canvas.addEventListener('touchstart', mouse_down, false);
    canvas.addEventListener('touchend', mouse_up, false);
    canvas.addEventListener('touchmove', mouse_move, false);
    canvas.addEventListener('mousedown', mouse_down, false);
    canvas.addEventListener('mouseup', mouse_up, false);
    canvas.addEventListener('mousemove', mouse_move, false);
  }

  set_drawing_context();

  if (table) {
    window.onresize = set_drawing_context;

    const key_down_fn = (evt) => {
      if (evt.keyCode === 48) { // '0'
        for (let i in table.balls) {
          table.balls[i].stop();
        }
      }
      if (evt.keyCode === 57) { // '9'
        table.ball_in_hand = 1;
      }
      if (evt.keyCode >= 49 && evt.keyCode <= 55) { // 1..7
        strength_scaling = ((evt.keyCode - 48) / 4) * 2.5;
      }
      if (evt.keyCode === 56) { // '8'
        masse_scaling = 4;
      }
    }

    const key_up_fn = (evt) => {
      if (evt.keyCode >= 49 && evt.keyCode <= 55) { // 1..7
        strength_scaling = 2.5;
      }
      if (evt.keyCode === 56) { // '8'
        masse_scaling = 1;
      }
    }

    document.onkeydown = key_down_fn;
    document.onkeyup = key_up_fn;

    const draw_fn = () => {
      table.draw();
      if (current_game !== table.game) {
        current_game = table.game;
        set_player_type('player1_type', 0);
        set_player_type('player2_type', 1);
      }
      if (table.is_stable() && table.update_id != null) {
        clearInterval(table.update_id);
        table.update_id = null;
        table.game.shot_complete();
        table.player().begin_shot();
      }
    }

    if (draw_id == null) {
      draw_id = setInterval(draw_fn, 50);
    }
  }
}
