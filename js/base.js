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
        if (game_over === true){
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
        } else if (playing_online === true) {
            nextOnlineGame();
        } else if (playing_online === false) {
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
    if (result.length !== 0) {
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
    $('#'+source_id).removeAttr('draggable')
        .appendTo($('#'+destination_id));
    $('#'+destination_id).removeAttr('ondrop')
        .removeAttr('ondragover')
        .removeAttr('ondragleave');
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

function setupModal() {
    if (game_count == 2) {
        $('.round_2_result').show();
        $('h3.round_2_winner').show();
        $('#modal_next_game').text('Restart Game');
    } else {
        $('.round_2_result').hide();
        $('h3.round_2_winner').hide();
        $('#modal_next_game').text('Play Round 2');
    }
    $('#game_over_modal').modal('toggle');
}

function show_result(results){
    var result_container = $('.round_' + game_count + '_result');
    var winner_div = $('h3.round_' + game_count + '_winner');
    $('#round_title').text("Round " + game_count + " of 2");
    var p1_cells = results[0][0].clone();
    var p2_cells = results[0][1].clone();
    blackHoleAnimation(results[0][0],results[0][1]);
    setTimeout(function(){
        setupModal();
        setupScoreCellAnimation(p1_cells);
        setupScoreCellAnimation(p2_cells);
        scoreCellAnimation(p1_cells,1,result_container).then(function(){
            scoreAnimation(result_container, results[1][0],1).then(function(){
                scoreCellAnimation(p2_cells,2,result_container).then(function(){
                    scoreAnimation(result_container, results[1][1],2).then(function(){
                        winnerTextAnimation(winner_div,results[1]);
                    });
                });
            });
        });
    },950);
}

function blackHoleAnimation(p1_elems,p2_elems) {
    var black_hole_position = [$('.black-hole').data('row'), $('.black-hole').data('col')];
    p1_elems.css('position', 'absolute');
    p2_elems.css('position', 'absolute');
    $.each(p1_elems, function (index, elem) {
        moveToBlackHole($(elem), black_hole_position);
    });
    $.each(p2_elems, function (index, elem) {
        moveToBlackHole($(elem), black_hole_position);
    });
    setTimeout(function(){
        p1_elems.remove();
        p2_elems.remove();
    },900);
}

function setupScoreCellAnimation(cells){
    cells.removeAttr('id');
    cells.removeAttr('style');
    cells.velocity({opacity:0,scaleX:0,scaleY:0});
}

function winnerTextAnimation(winner_div,results){
    var winner_text, winner_color;
    var player1_name = $('#player1-name').text();
    var player2_name = $('#player2-name').text();
    if (results[0] < results[1]) {
        winner_text = player1_name + ' Wins Round ' + game_count;
        winner_color ='red';
    } else if (results[0] > results[1]) {
        winner_text = player2_name + ' Wins Round ' + game_count;
        winner_color = 'blue';
    } else {
        winner_text = 'Round ' + game_count + ' is a Draw';
        winner_color = 'black';
    }
    winner_div.text(winner_text);
    winner_div.css('color',winner_color);
    return $.Velocity.animate(winner_div,"fadeIn",{duration:500});
}

function scoreCellAnimation(elems,player,result_container){
    var deferred = $.Deferred();
    result_container.find('.player-'+player+'-black-hole-elem').append(elems);
    if (elems.length === 0){
        result_container.find('.player-'+player+'-black-hole-elem')
            .append("--- EMPTY ---")
            .css("font-size",'30px');
        deferred.resolve('prefect score');
    }
    $.each(elems,function(index,elem){
        setTimeout(function(){
            $(elem).velocity({opacity:1,scaleX:1,scaleY:1},'easeOutElastic');
            if (index+1 === elems.length){
                deferred.resolve('done showing');
            }
        },200*(index+1));
    });
    return deferred.promise();
}

function scoreAnimation(result_container, score, player) {
    var score_div = result_container.find('.player-'+player+'-score');
    score_div.text("= " + score);
    return $.Velocity.animate(score_div[0],"fadeIn",{duration:500});
}

function moveToBlackHole(cell, black_hole_position) {
    var row = parseInt($(cell).parent().data('row'));
    var col = parseInt($(cell).parent().data('col'));
    var bh_row = parseInt(black_hole_position[0]);
    var bh_col = parseInt(black_hole_position[1]);
    if(row < bh_row){
        if(parseInt(col) === bh_col){
            cell.velocity({
                translateX:'30px',translateY:'76px',
                opacity: 0,
                scaleX: 0.8,scaleY:0.8,
                backgroundColor:'#000000',color:'#000000'
            },{
                duration: 800
            });
        }
        if(parseInt(col) > bh_col){
            cell.velocity({
                translateX:'-40px',translateY: "76px",
                opacity: 0,
                scaleX: 0.8,scaleY:0.8,
                backgroundColor:'#000000',color:'#000000'
            },{
                duration: 800
            });
        }
    }
    if(row === bh_row){
        if(parseInt(col) < bh_col){
            cell.velocity({
                translateX:'72px',translateY: "0px",
                opacity: 0,
                scaleX: 0.8,scaleY:0.8,
                backgroundColor:'#000000',color:'#000000'
            },{
                duration: 800
            });
        }
        if(parseInt(col) > bh_col){
            cell.velocity({
                translateX:'-76px',translateY: "0px",
                opacity: 0,
                scaleX: 0.8,scaleY:0.8,
                backgroundColor:'#000000',color:'#000000'
            },{
                duration: 800
            });
        }
    }
    if(row > bh_row){
        if(parseInt(col) < bh_col){
            cell.velocity({
                translateX:'32px',translateY: "-76px",
                opacity: 0,
                scaleX: 0.8,scaleY:0.8,
                backgroundColor:'#000000',color:'#000000'
            },{
                duration: 800
            });
        }
        if(parseInt(col) === bh_col){
            cell.velocity({
                translateX:'-43.5px',translateY: "-76px",
                opacity: 0,
                scaleX: 0.8,scaleY:0.8,
                backgroundColor:'#000000',color:'#000000'
            },{
                duration: 800
            });
        }
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
    start_online_game(host, client);
}

function newGame(){
    game_count = 1;
    resetGame();
}