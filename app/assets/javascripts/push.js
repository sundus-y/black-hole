// Enable pusher logging - don't include this in production
Pusher.log = function(message) {
    if (window.console && window.console.log) {
        window.console.log(message);
    }
};

var pusher = new Pusher('5893435b77f64bb73bb4', {
    encrypted: true,
    authEndpoint: 'http://localhost:3000/pusher/auth',
});

$(document).ready(function(){
    $('#create_game_form').submit(function(event){
        event.preventDefault();
        var gname = $('#create_game_name').val();
        var channel = pusher.subscribe('private-'+gname);
        channel.bind('pusher:subscription_succeeded', function() {
            console.log("Game Created");
        });
        channel.bind('client-user-joined', function() {
            console.log("User Joined Game");
        });
    });

    $('#join_game_form').submit(function(event){
        event.preventDefault();
        var gname = $('#join_game_name').val();
        var channel = pusher.subscribe('private-'+gname);
        channel.bind('pusher:subscription_succeeded', function() {
            console.log("Joined to Game");
            var triggered = channel.trigger('client-user-joined', { player: "1"});
        });

    });
});

