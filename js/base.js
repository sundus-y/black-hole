$(document).ready(function(){
    updateLabel();
});

var current_player = 1;
var next_player = 2;
var other_has_moved = false;
var current_play = 1;
var playing_online = false;

function drag(ev) {
    ev.dataTransfer.setData("elem", ev.target.id);
    $('#'+ev.target.id).removeClass('mouse-over');
}

function drop(ev){
    ev.preventDefault();
    var data = ev.dataTransfer.getData("elem");
    var cell = $('#'+data);
    if(data.lastIndexOf(current_player+'-'+current_play+'-') !== -1){
        nextPlay();
        updateLabel();
        cell.removeAttr('draggable');
        $(ev.target).removeAttr('ondrop');
        $(ev.target).removeAttr('ondragover');
        $(ev.target).removeAttr('ondragleave');
        ev.target.appendChild(cell[0]);
        findWinner();
    }
    $(ev.target).removeClass('mouse-over');
}

function allowDrop(ev){
    ev.preventDefault();
    $('#'+ev.target.id).addClass('mouse-over');
}

function disallowDrop(ev){
    ev.preventDefault();
    $('#'+ev.target.id).removeClass('mouse-over');
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
        $(black_hole_elem).addClass('black-hole-element');
        black_hole.addClass('black-hole');
    }
}