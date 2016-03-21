var join_game_modal = '';
var new_game_modal = '';
var game_over_modal = '';
var game = '';

var game_count = 1;
var current_player = 1;
var next_player = 2;
var other_has_moved = false;
var current_play = 1;
var playing_online = false;
var game_over = false;

var client_channel = null;
var host_channel = null;

var host = '';
var client = '';

$(document).ready(function(){
    updateLabel();
    join_game_modal = $('#join_game_modal').clone();
    new_game_modal = $('#new_game_modal').clone();
    game_over_modal = $('#game_over_modal').clone();
    game = $('#main_container').clone();

    $('#new_game_modal').on('hidden.bs.modal', function(){
        $(this).remove();
        $('body').append(new_game_modal.clone());
    });

    $('#join_game_modal').on('hidden.bs.modal', function(){
        $(this).remove();
        $('body').append(join_game_modal.clone());
    });

    $('#game_over_modal').on('hidden.bs.modal', function(){
        if (game_over == true){
            $(this).remove();
            $('body').append(game_over_modal.clone());
            newGame();
        }
    });

    $('body').on('click','#reset_game', function(){
        resetGame();
    });

    $('body').on('click','#modal_next_game',function(){
        if (game_count == 2){
            game_over = true;
        } else if (playing_online == true) {
            nextOnlineGame();
        } else if (playing_online == false) {
            nextGame();
        }
    });
});

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4();
}

function drag(ev) {
    ev.dataTransfer.setData("elem", ev.target.id);
    $('#'+ev.target.id).removeClass('mouse-over');
}

function drop(ev){
    ev.preventDefault();
    var source_id = ev.dataTransfer.getData("elem");
    var destination_id = $(ev.target).attr('id');
    if(source_id.lastIndexOf(current_player+'-'+current_play+'-') !== -1){
        dropMade(source_id, destination_id);
        sendMoveMessage(source_id, destination_id);
    }
    $(ev.target).removeClass('mouse-over');
}

function dropMade(source_id, destination_id) {
    moveCell(source_id, destination_id);
    nextPlay();
    updateLabel();
    var result = findWinner();
    if (result.length != 0) {
        show_result(result);
    }
}

function allowDrop(ev){
    ev.preventDefault();
    $('#'+ev.target.id).addClass('mouse-over');
}

function disallowDrop(ev){
    ev.preventDefault();
    $('#'+ev.target.id).removeClass('mouse-over');
}

function moveCell(source_id,destination_id){
    $('#'+source_id).removeAttr('draggable');
    $('#'+destination_id).removeAttr('ondrop');
    $('#'+destination_id).removeAttr('ondragover');
    $('#'+destination_id).removeAttr('ondragleave');
    $('#'+source_id).appendTo($('#'+destination_id));
}

function nextPlay(){
    if (current_player == 1) {
        current_player = 2;
        next_player = 1;
    } else {
        current_player = 1;
        next_player = 2;
    }
    if (other_has_moved) {
        current_play += 1;
        other_has_moved = false;
    } else {
        other_has_moved = true;
    }
}

function updateLabel(){
    if (current_play <= 10){
        $('h2#player-'+current_player+'-turn').show();
        $('h2#player-'+next_player+'-turn').hide();
    } else {
        $('h2#player-'+current_player+'-turn').hide();
        $('h2#player-'+next_player+'-turn').hide();
    }
}

function findWinner(){
    if (current_play == 11){
        var black_hole = $('div[ondrop]');
        var id = black_hole.attr('id');
        var row = parseInt(id.match(/-(\d)-(\d)/)[1]);
        var col = parseInt(id.match(/-(\d)-(\d)/)[2]);
        var black_hole_elem = [];
        black_hole_elem.push($('div#board-'+row+'-'+(col-1))[0]);
        black_hole_elem.push($('div#board-'+row+'-'+(col+1))[0]);
        black_hole_elem.push($('div#board-'+(row-1)+'-'+(col))[0]);
        black_hole_elem.push($('div#board-'+(row-1)+'-'+(col+1))[0]);
        black_hole_elem.push($('div#board-'+(row+1)+'-'+(col))[0]);
        black_hole_elem.push($('div#board-'+(row+1)+'-'+(col-1))[0]);
        black_hole_elem = black_hole_elem.filter(function(element){return !!element;});
        var player_1_black_hole_elem = $(black_hole_elem).find("div[id*='player-1-']");
        var player_2_black_hole_elem = $(black_hole_elem).find("div[id*='player-2-']");
        black_hole.addClass('black-hole');
        var pl_1_result_sum = $.map(player_1_black_hole_elem,function(elem){
            return parseInt($(elem).text());
        }).reduce(function(a, b) {
            return a + b;
        },0);
        var pl_2_result_sum = $.map(player_2_black_hole_elem,function(elem){
            return parseInt($(elem).text());
        }).reduce(function(a, b) {
            return a + b;
        },0);
        return [[player_1_black_hole_elem, player_2_black_hole_elem],[pl_1_result_sum,pl_2_result_sum]];
    }
    return [];
}

function show_result(results){
    $('#game_over_modal').modal('toggle');
    var result_container = $('.round_' + game_count + '_result');
    var winner_div = $('h3.round_' + game_count + '_winner');
    $('#round_title').text("Round " + game_count + " of 2");
    results[0][0].removeAttr('id');
    results[0][1].removeAttr('id');
    result_container.find('.player-1-black-hole-elem').append($(results[0][0]));
    result_container.find('.player-2-black-hole-elem').append($(results[0][1]));
    result_container.find('.player-1-score').text("= "+results[1][0]);
    result_container.find('.player-2-score').text("= "+results[1][1]);
    if (game_count == 2) {
        $('.round_2_result').show();
        $('h3.round_2_winner').show();
        $('#modal_next_game').text('Restart Game');
    } else {
        $('.round_2_result').hide();
        $('h3.round_2_winner').hide();
        $('#modal_next_game').text('Play Round 2');
    }
    if (results[1][0] < results[1][1]) {
        winner_div.text('Player 1 Wins Round ' + game_count);
        winner_div.css('color','red');
    } else if (results[1][0] > results[1][1]) {
        winner_div.text('Player 2 Wins Round ' + game_count);
        winner_div.css('color','blue');
    } else {
        winner_div.text('Round ' + game_count + ' is a Draw');
    }
}

function resetGame(){
    $('#main_container').remove();
    $('body').append(game.clone());
    if (game_count == 1) {
        current_player = 1;
        next_player = 2;
    } else {
        current_player = 2;
        next_player = 1;
    }
    other_has_moved = false;
    current_play = 1;
    updateLabel();
}

function nextGame(){
    game_count = 2;
    resetGame();
}

function nextOnlineGame(){
    game_count = 2;
    resetGame();
    start_online_game(host, client, 1);
}

function newGame(){
    game_count = 1;
    resetGame();
}