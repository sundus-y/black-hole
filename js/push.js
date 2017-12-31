// Enable pusher logging - don't include this in production
Pusher.log = function(message) {
    if (window.console && window.console.log) {
        window.console.log(message);
    }
};

var pusher = new Pusher('5893435b77f64bb73bb4', {
    encrypted: true,
    authEndpoint: 'pusher/auth'
});

$(document).ready(function(){
    $('#create_game_form').on('submit',function(event){
        event.preventDefault();
        $('#create_game').attr('disabled',true);
        host = $('#host_name').val();
        var key = guid().toUpperCase();
        $('#new_game_key').val(key);
        $('#new_game_progress').show();
        host_channel = pusher.subscribe('private-'+key);

        host_channel.bind('pusher:subscription_succeeded', function() {
            setTimeout(function() {
                $('.new_progress_bar').text('Game Created');
            },1000);
            setTimeout(function(){
                $('.new_progress_bar').text('Waiting for your friend');
                $('#join_note').show();
            },2000);
        });

        host_channel.bind('client-user-joined', function(data) {
            client = data.name;
            $('.new_progress_bar').text(client + ' has joined the game.');
            host_channel.trigger('client-host-found', { player: "1", name: host});
            start_online_game(host,data.name);
            host_channel.trigger('client-start-round', {
                player: '1',
                name: host,
                game_count: game_count,
                current_player: current_player,
                next_player: next_player,
                other_has_moved: other_has_moved,
                current_play: current_play,
                playing_online: true,
                game_over: false
            });
            setTimeout(function(){
                $('#new_game_modal').modal('toggle');
            },1000);
        });

        host_channel.bind('client-make-move', function (data) {
            dropMade(data.source_id,data.destination_id);
        });
    });

    $('#join_game_form').on('submit',function(event){
        event.preventDefault();
        $('#join_game').attr('disabled',true);
        client = $('#client_name').val();
        var key = $('#join_game_key').val().toUpperCase();
        client_channel = pusher.subscribe('private-'+key);
        var host_not_found = true;
        $('#join_game_progress').show();

        client_channel.bind('pusher:subscription_succeeded', function() {
            console.log("Joined to Game");
            var triggered = client_channel.trigger('client-user-joined', { player: "2", name: client});
        });

        client_channel.bind('client-host-found', function(data){
            host_not_found = false;
            host = data.name;
            $('.join_progress_bar').text(host + ' has joined the game.');
            playing_online = true;
        });

        client_channel.bind('client-start-round', function (data) {
            start_online_game(data.name,client);
            game_count =  data.game_count;
            current_player = data.current_player;
            next_player = data.next_player;
            other_has_moved = data.other_has_moved;
            current_play = data.current_play;
            playing_online = true;
            game_over = false;
            setTimeout(function(){
                $('#join_game_modal').modal('toggle');
            },2000);
        });

        client_channel.bind('client-make-move', function (data) {
            dropMade(data.source_id,data.destination_id);
        });

        setTimeout(function(){
            if (host_not_found){
                $('.join_progress_bar').text("Host with '" + key + "' key was not found, Try Again !");
                pusher.unsubscribe('private-'+key);
                setTimeout(function(){
                    $('#join_game_modal').modal('toggle');
                },5000);
            }
        },5000);

    });
});

function start_online_game(host,client){
    $('#player1-name').text(host);
    $('#player2-name').text(client);
    playing_online = true;
    if (client_channel) {
        $('.player1-side').find('div.cell-player1').attr('draggable', false);
    } else if (host_channel) {
        $('.player2-side').find('div.cell-player2').attr('draggable', false);
    }
}

function sendMoveMessage(source_id,destination_id){
    if (client_channel){
        client_channel.trigger('client-make-move', {
            player: "1",
            source_id: source_id,
            destination_id: destination_id
        });
    } else if (host_channel) {
        host_channel.trigger('client-make-move', {
            player: "2",
            source_id: source_id,
            destination_id: destination_id
        });
    }
}

