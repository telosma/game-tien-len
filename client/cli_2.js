//trang thai nguoi choi
    OUT_TABLE = 1;
    PLAYER = 2;
    VISITOR =3;
    PLAYING = 4;

    table = null;
    state_user = {
        1 : 'Ngoai sanh',
        2 : 'Nguoi choi',
        3 : 'Khach'
    }
    var anh = {};
    var myGameArea = {
        canvas: document.createElement("canvas"),
        start: function(){
            this.canvas.width = 800;
            this.canvas.height = 500;
            this.context = this.canvas.getContext("2d");
            document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        },
        clear: function(){
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    myGameArea.canvas.setAttribute("id", "deck");
// trang thai ban choi
    PLAYING = 4;
    READY = 1;
    UNREADY = 2;

    state_table = {
        0 : 'Dang choi',
        1 : 'San sang bat dau choi',
        3 : 'Chua san sang'
    }

var socket = io.connect();

socket.on('receive_notice', function(notice) {
    alert(notice);
})

socket.on('login_success', function(list_table_info) {
    for(var i in list_table_info ){
        var table = list_table_info[i];
    }

    $('.container').hide();
    updateListTable(list_table_info);
    showListTableFrame();
})

socket.on('go_table_success', function(table_info, my_position) {
    $('.frame').hide();
    $('#nav').hide();
    $('#btn-leave-table').show();
    myGameArea.start();
    table = new Table(table_info,my_position);
    table.preLoadImages();
    table.drawPlayer();

    if (table.state == PLAYING) {
        table.load_cards(table_info);
    }
})

socket.on('leave_table_success', function(list_table_info) {
    $('#btn-play').hide();
    $('#btn-throw').hide();
    $('#btn-un-select').hide();
    $('#btn-sort').hide();
    $('#btn-start').hide();
    $('#btn-leave-table').hide();

    updateListTable(list_table_info);
    myGameArea.clear();
    document.body.removeChild(document.getElementById("deck"));
    showListTableFrame();
})

socket.on('start_game_success', function() {
})

socket.on('game_started', function() {
    $('#btn-sort').show();
    $('#btn-un-select').show();
})

socket.on('danh_bai_success', function() {
    table.getPlayedCard();
    table.play_sound.play();
    table.stop_count_down = true;
})

socket.on('danh_bai_unsuccess', function() {

})

socket.on('bo_luot_success', function() {

})

socket.on('update_user-go_table', function(id, username, position) {
    if(table){
        table.door_open.play();
        table.addPlayer({ id:id, username:username }, position);
        table.drawPlayer();
        if (table.bplayer.pos == table.my_position) {
            if (table.lplayer.id != null || table.rplayer.id != null || table.tplayer.id != null) {
                $('#btn-start').show();
            }
        }
    }
})

socket.on('update_user-leave_table', function(table_info, id) {
    table.drawPlayer();

    if(table) {
        table.removePlayer(id);
    }

    if (table_info.state == UNREADY) {
        $('#btn-start').hide();
    }
})

socket.on('update_user-danh_bai', function(user_id, cards) {
    // nguoi danh la chinh minh
    if (table.bplayer.id == user_id) {
        // selected_cards = [];
    } else {

    }

    table.getPlayer(user_id).danh_bai(cards);
    // updateGameArea();
})

socket.on('update_user-bo_luot', function(user_id) {
})

socket.on('update_game-ready', function() {
})

socket.on('update_game-unready', function() {
})

socket.on('update_game-start', function(table_info, my_cards) {
    table.bplayer.getMyCards(my_cards);
    // tai cac quan bai dang up
    table.load_cards(table_info);
    table.start_game();
})

socket.on('update_game-finish', function(table_info) {
    $('#btn-sort').hide();
    $('#btn-un-select').hide();
    $('#btn-play').hide();
    $('#btn-throw').hide();
    table.state = table_info.state;

    if (table_info.state == READY) {
        $('#btn-start').show();
    }

    var stt = 0;

    for (var opposite_score in table_info.stt) {
        if (table.bplayer.id == table_info.stt[opposite_score]) {
            switch (stt) {
                case 0:
                    alert("Chien thang \n Score: " + (table_info.exist_card  - opposite_score ));
                    table.laughing_sound.play();
                    break;
                case 1:
                    alert("Thua cuoc \n Score: " + (table_info.exist_card  - opposite_score ));
                    break;
                case 2:
                    alert("Thua cuoc \n Score: " + (table_info.exist_card  - opposite_score ));
                    break;
                case 3:
                    alert("Thua cuoc \n Score: " + (table_info.exist_card  - opposite_score ));
                    break;
                default:
                    break;
            }
        }

        stt ++;
    }

    sleep(1000);
    table.finish_game();
})

socket.on('update_game-ready', function() {

})

socket.on('update_game-unready', function() {

})

socket.on('update_game-new_turn', function(new_turn) {
    table.sec = 400;
    table.stop_count_down = false;
    table.turn_id = new_turn;

    if (new_turn == table.bplayer.id) {
        $('#btn-play').show();
        $('#btn-throw').show();
    } else {
        $('#btn-play').hide();
        $('#btn-throw').hide();
    }
})

socket.on('update_game-new_cycle', function(new_turn) {
    table.sec = 400;
    table.stop_count_down = false;
    table.cardsOnTable = {};
    table.setOfCardsInCycle  = [];
    table.turn_id = new_turn;

    if (new_turn == table.bplayer.id) {
        $('#btn-play').show();
        $('#btn-throw').show();
    } else {
        $('#btn-play').hide();
        $('#btn-throw').hide();
    }
})

function goTable(table_id) {
    socket.emit('go_table', table_id);
}

function showFrame(name) {
    $('.frame').hide();
    $('#' + name).show();
}

function showLoginFrame() {
    showFrame('login_frame');
}

function showTableFrame() {
    showFrame('table_frame');
}

function showListTableFrame() {
    showFrame('list_table_frame');
}

function updateListTable(list_table_info) {
    var content = $('#list_table_frame');
    content.html('');
    var status;
    for (var i = 0; i < list_table_info.length; i ++) {
        var table = list_table_info[i];
        if (table.state == PLAYER) {
            status = "đang chờ";
        } else if (table.state == PLAYING) {
            status = "đang chơi";
        }
        var item = '<tr class="table_item table table-hover table-responsive" table_id="'+ table.id + '"><td table_id="' + table.id + '">'
        + 'bàn chơi '+ table.id + '</td><td> số người ' + table.num_players +
        '</td><td>Trang thai : ' + '<span class=\"stt-' + table.state + '\">'  + status + '</span>' + '</td></tr>';
        content.append(item);
    }
}

var cardRank = ['bich','nhep','ro','co']
var cardNumber = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']

function getTableInfo(){
    players = []

    for(var i =0; i <4; i++){
        var player = {
            'id': i
        }
        players.push(player);
    }

    my_card = []

    card_deck = []

    for(var i=0; i< 52; i++){
        card_deck.push(i);
    }

    for(var i=0; i < 13 ; i++){
        var p = Math.floor((Math.random() * card_deck.length));
        my_card.push(card_deck[p]);
        card_deck.splice(p,1);
    }

    var info = {
        'id' : 1,
        'current_turn': 1,
        'players': players,
        'current_card': 10,
        'my_card': my_card
    }

    return info;
}

function getCard(card) {
    return {'number': card % 13 + 3 , 'rank': (card / 13 | 0)};
}

function getCards(cards) {
    var result = [];
    cards.forEach(function(card) {
        result.push(getCard(card));
    })

    return result;
}




$(document).ready(function() {
    $('.frame').hide();
    $('#login_frame').show();

    $('#register_form').submit(function() {
        let username = $('#register_form #username').val();
        let password = $('#register_form #password').val();
        let firstname = $('#firstname').val();
        let lastname = $('#lastname').val();

        socket.emit('register', username, password, firstname, lastname);
    })

    $('#login_form').submit(function() {
        let username = $('#login_form #username').val();
        let password = $('#login_form #password').val();
        socket.emit('login', username, password);

        return false;
    });


    $(document).on('click', '.table_item', function() {
        var table_id = $(this).attr('table_id');
        socket.emit('go_table', table_id);
    })

    $(document).on('click', '#btn-leave-table', function() {
        socket.emit('leave_table');
    })

    $(document).on('click', '#btn-start', function() {
        socket.emit('start_game');
    })

    $(document).on('click', '#btn-play', function() {
        table.sec = 400;
        socket.emit('danh_bai', obj2Arr(table.bplayer.slCard));
    })

    $(document).on('click', '#btn-un-select', function() {
        table.bplayer.slCard = {};
    })

    $(document).on('click', '#btn-throw', function() {
        table.sec = 400;
        table.stop_count_down = true;
        socket.emit('bo_luot');
    })

    $(document).on('click', '#btn-sort', function() {
        table.bplayer.slCard = {};
        var arr_card_value = obj2Arr(table.bplayer.myCard);
        var cards = getCards(obj2Arr(table.bplayer.myCard));
        var count = 0;
        for (var i = 0;i < cards.length-1; i++) {
            if (cards[i].number > cards[i+1].number) {
                break;
            } else {
                count ++;
            }
        }

        if (count == (cards.length-1)) {
            var sorted_arr_card = [];
            //....... Sap xep cac la bai theo phuong phap khac khong tang dan
            // Tim tu quy
            var count = 0;
            for (var i = 0; i < cards.length-1; i++ ) {
                if (cards[i].number == cards[i+1].number) {
                    count++;
                } else {
                    count = 0;
                }

                if (count == 3) { //phat hien tu quy
                    if (arr_card_value[i+1] != null && arr_card_value[i+1] != undefined) {
                        sorted_arr_card.push(arr_card_value[i+1]);
                        arr_card_value[i+1] = null;
                    }
                    if (arr_card_value[i] != null && arr_card_value[i] != undefined) {
                        sorted_arr_card.push(arr_card_value[i]);
                        arr_card_value[i] = null;
                    }
                    if (arr_card_value[i-1] != null && arr_card_value[i-1] != undefined) {
                        sorted_arr_card.push(arr_card_value[i-1]);
                        arr_card_value[i-1] = null;
                    }
                    if (arr_card_value[i-2] != null && arr_card_value[i-2] != undefined) {
                        sorted_arr_card.push(arr_card_value[i-2]);
                        arr_card_value[i-2] = null;
                    }
                }
            }

            // Tim cac la bai la la 2
            for (var ind = 0; ind < cards.length; ind++ ) {
                if (cards[ind].number == 15) {
                    if (arr_card_value[ind] != null && arr_card_value[ind] != undefined) {
                        sorted_arr_card.push(arr_card_value[ind]);
                        arr_card_value[ind] = null;
                    }
                }
            }
            var len = cards.length;
            for (var i=0; i < len; i++) { //cap nhat lai nhung la bai chua duoc sx
                if (arr_card_value[i] == null) {

                    arr_card_value.splice(i,1);
                    cards.splice(i,1);
                    i--;
                    len--;
                }
            }
            // Tim bo leo day
                // Sap xep theo chat sau do sap xep tang dan trong moi chat
            sortCardBySuite(cards, arr_card_value);
            for (var i = 0; i < cards.length-1; i ++) {
                if ((cards[i].rank == cards[i+1].rank) && (cards[i].number > cards[i+1].number)) {
                    var tmp = cards[i];
                    var tmp2 = arr_card_value[i];

                    cards[i] = cards[i+1];
                    arr_card_value[i] = arr_card_value[i+1];

                    cards[i+1] = tmp;
                    arr_card_value[i+1] = tmp;
                }
            }
            count = 0;
            for (var i=0; i < cards.length-1; i++){
                if (arr_card_value[i] != null && arr_card_value[i] != undefined &&
                    arr_card_value[i+1] != null && arr_card_value[i+1] != undefined) {
                    if ((cards[i].rank == cards[i+1].rank)&&(cards[i].number == cards[i+1].number-1)) {
                        count ++;
                    } else {
                        if (count > 1) {
                            for (var x = count; x >= 0; x--) {
                                if (arr_card_value[i-x] != null && arr_card_value[i-x] != undefined) {
                                    sorted_arr_card.push(arr_card_value[i-x]);
                                    arr_card_value[i-x] = null;
                                }
                            }
                        }
                        count = 0;
                    }
                }
            }
            var len1 = cards.length;
            for (var i=0; i<len1; i++) { //cap nhat lai nhung la bai chua duoc sx
                if (arr_card_value[i] == null) {
                    arr_card_value.splice(i,1);
                    cards.splice(i,1);
                    i--;
                    len1--;
                }
            }
            var tmp_card = sortCardByNumber(cards, arr_card_value); //nhung la bai con lai duoc sap xep theo bo
            for (var i = 0; i <  tmp_card.length; i++) {
                if (arr_card_value[i] != null && arr_card_value[i] != undefined) {
                    sorted_arr_card.push(arr_card_value[i]);
                    arr_card_value[i] = null;
                }
            }
            table.bplayer.getMyCards(sorted_arr_card);
        } else {
            var arr_card_value_sorted = sortCardByNumber(cards, obj2Arr(table.bplayer.myCard)); //cards: mang cac object card co dang card {number: , rank: }
                                                                                            //obj2Arr(table.bplayer.myCard): mang cac gia tri la bai vi du [3,7,1]
            table.bplayer.getMyCards(arr_card_value_sorted);
        }
    })
})


// chon bai de danh
selected_cards = [];


function selectCards(card_id) {

    if (selected_cards.indexOf(card_id) == -1) {
        selected_cards.push(card_id);
        $('[card_id='+card_id+']').addClass('card_item_selected');
    } else {
        selected_cards.splice(selected_cards.indexOf(card_id),1);
        $('[card_id='+card_id+']').removeClass('card_item_selected');
    }
}

function obj2Arr(obj){
    var arr = Object.keys(obj).map(function (key) {return obj[key]});
    return arr;
}

function Table(table_info,my_position){
    this.play_sound = new sound("./sound/play.mp3");
    this.laughing_sound = new sound("./sound/laughing.mp3");
    this.door_open = new sound("./sound/door_open.mp3");
    this.stop_count_down = false;
    this.sec = 400;
    this.setOfCardsInCycle = [];

    this.preLoadImages  = function(){
        for (var i = 0; i < 57; i++) {
            anh[i] = new Image();
            anh[i].src = "./faces/" + i + ".png";
        }
    }

    this.drawPlayer = function(){
        var ctx = myGameArea.context;
        ctx.fillStyle = "#FF0000";
        ctx.font = "24px Arial";
            if (this.bplayer.id !== null) {
                ctx.fillText(this.bplayer['username'], 300, 490);
            }

            if (this.tplayer.id !== null) {
                ctx.fillText(this.tplayer['username'], 300, 20);
            }

            if (this.lplayer.id !== null) {
                ctx.fillText(this.lplayer['username'], 0, 200);
            }

            if (this.rplayer.id !== null) {
                ctx.fillText(this.rplayer['username'], 740, 200);
            }
    }

    this.drawPlayerGoTable = function(posX, posY){
        var ctx = myGameArea.context;
        var sec = 30;
        var spriteW = 24;
        var spriteH = 30;
        var cycle = 0;
        var id = window.setInterval(function() {
            sec --;
            ctx.drawImage(
                anh[54],
                // source rectangle
                cycle * spriteW, 0, spriteW, spriteH,
               // destination rectangle
               posX, posY, spriteW, spriteH
            );

            cycle = (cycle + 1) % 8;
            if (sec == - 1) {
                clearInterval(id);
                return;
            }
        }, 100);
    }

    this.drawCountDown = function(posX, posY){
        if (table.stop_count_down) {
            return;
        }
        if (this.sec == 0) {
            this.stop_count_down = true;
            return;
        }
        var ctx = myGameArea.context;
        this.sec--;
        ctx.strokeStyle = "blue";
        ctx.strokeRect(posX, posY, 50, 50);
        ctx.lineWidth = 5;
        ctx.font = "30px Arial";
        ctx.fillText((this.sec/20|0),posX + 10, posY + 30);

    }

    this.getPlayedCard = function(){
        var tmp = Object.size(this.bplayer.myCard);
        var key;
        var keys = Object.keys(this.bplayer.myCard);
        var c;
        this.cardsOnTable = this.bplayer.slCard;

        for (var i in this.bplayer.slCard){
            delete this.bplayer.myCard[keys[i-1]];
        }

        this.bplayer.slCard = {};
    }

    this.id = table_info.id;
    this.state = table_info.state;
    this.my_position = my_position;

    $('#table_id').html(table_info.id);

    this.draw =  function(table_info){

    }

    this.load_state = function(table_info) {
        if ( table_info.state = PLAYING ) {
            $('#table_state').html('ban dang choi');
        } else {
            $('#table_state').html('ban chua choi');
        }
    }

    this.new_game = function() {

        // cap nhat lai du lieu
        table.cardsOnTable = {};
        table.setOfCardsInCycle = {};
        myGameArea.clear();
        this.drawPlayer();
        // $('#btn-start').show();
        $('#btn-play').hide();
        $('#btn-throw').hide();
        $('#btn-un-select').hide();
        $('#btn-leave-table').hide();
    }

    this.start_game = function() {
        $('#btn-start').hide();
        this.interval = setInterval(updateGameArea, 50);
    }


    this.finish_game = function() {
        clearInterval(this.interval);
        this.new_game();
    }

    this.addPlayer = function(player_info,position) {
        if( ((position - this.my_position) == 1) || ((position - this.my_position) == -3)){
            this.rplayer = new RightPlayer(player_info);
            this.rplayer.pos = position;
            if (this.rplayer.id)
                this.drawPlayerGoTable(770, 250);
        }

        if( (position - this.my_position == 2) || (position - this.my_position == -2) ){
            this.tplayer = new TopPlayer(player_info);
            this.tplayer.pos = position;
            if (this.tplayer.id)
                this.drawPlayerGoTable(400, 0);
        }

        if( (position - this.my_position == 3) || (position - this.my_position == -1) ){
            this.lplayer = new LeftPlayer(player_info);
            this.lplayer.pos = position;
            if (this.lplayer.id)
                this.drawPlayerGoTable(0, 250);
        }

        if(position - this.my_position == 0){
            this.bplayer = new BottomPlayer(player_info);
            this.bplayer.pos = position;
            if (this.bplayer.id)
                this.drawPlayerGoTable(400, 470);
        }

    }

    this.removePlayer = function(player_id){
        this.getPlayer(player_id).leave_table();

        if (this.lplayer.id == player_id) {
            this.lplayer = new LeftPlayer(null);
        }

        if (this.rplayer.id == player_id) {
            this.rplayer = new RightPlayer(null);
        }

        if (this.tplayer.id == player_id) {
            this.tplayer = new TopPlayer(null);
        }

        if (this.bplayer.id == player_id) {
            this.bplayer = BottomPlayer(null);
        }

        return this;
    }

    this.getPlayer = function(player_id){
        if (this.lplayer.id == player_id) {
            return this.lplayer;
        }

        if (this.rplayer.id == player_id) {
            return this.rplayer;
        }

        if (this.tplayer.id == player_id) {
            return this.tplayer;
        }
        if (this.bplayer.id == player_id) {
            return this.bplayer;
        }
    }

    this.load_cards = function(table_info) {
        for (var i in table_info.players) {
            if (table_info.players[i] && i != this.my_position) {
                var id = table_info.players[i].id ;
                this.getPlayer(id).load_num_cards(table_info.players[i].num_cards);
            }
        }
    }

    this.update_current_cards = function(cards) {
        this.cardsOnTable = {};
        for (var i in cards){
            this.cardsOnTable[i] = cards[i];
        }

        if (this.setOfCardsInCycle.length == 5){
            this.setOfCardsInCycle = [];
        }

        this.setOfCardsInCycle.push(this.cardsOnTable);
    }


    this.load_player = function(table_info) {
        for (var i = 0 ; i < 4 ; i++) {
            this.addPlayer(table_info.players[i], i);
        }
    }

    this.init = function() {
        this.load_state(table_info);
        this.load_player(table_info);
        this.load_cards(table_info);
    }

    this.updateArea = function() {
        var ctx =  myGameArea.context;
        var count = 0;
        var x = 400-this.setOfCardsInCycle.length*5;
        var y = 250-this.setOfCardsInCycle.length*25;

        for (var i = 0; i <  this.setOfCardsInCycle.length; i++) {
                count = 0;
                var angleInDegrees=0;
            for (var c in this.setOfCardsInCycle[i]) {
                count++;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angleInDegrees*Math.PI/180);
                ctx.drawImage(anh[this.setOfCardsInCycle[i][c]], - 30 + count*10, - 40 - count * 5, 60, 80);
                ctx.restore();
                angleInDegrees += 25;
            }
            x +=15;
            y +=25;
        }
    }

    this.init();
}

function Players(){

}

function LeftPlayer(player_info) {

    this.html = $('#left_player');

    if (!player_info) {
        this.id = null;
        this.html.html('Trong !');
        this.html.hide();
    } else {
        this.id = player_info.id;
        this.username = player_info.username;
        this.num_cards = player_info.num_cards;

        this.html.html(this.username);

        this.html.show();
    }

    this.go_table = function() {
        this.html.hide();
        this.html.fadeIn(1000);
    }

    this.leave_table = function() {
        this.html.hide();
    }

    this.load_num_cards = function(num_cards) {
        this.numcards = num_cards;
    }

    this.drawMyCards = function(){
        var ctx = myGameArea.context;
        var tmp = (13 - this.numcards)*10;
        // var count = 0;
        for(var c = 0; c < this.numcards; c++){
            ctx.drawImage(anh[53], 100, (100 + c*20 + tmp), 80, 60);
            // count++;
        }
    }

    this.danh_bai = function(cards) {
        this.numcards = this.numcards -  cards.length;
        table.update_current_cards(cards);
    }
}

function TopPlayer(player_info) {

    this.html = $('#top_player');

    if (!player_info) {
        this.id = null;
        this.html.html('Trong !');
        this.html.hide();
    } else {
        this.id = player_info.id;
        this.username = player_info.username;
        this.num_cards = player_info.num_cards;
        this.html.html(this.username);
        this.html.show();
    }

    this.go_table = function() {
        this.html.hide();
        this.html.fadeIn(1000);
    }

    this.leave_table = function() {
        this.html.hide();
    }

    this.load_num_cards = function(num_cards) {
        this.numcards = num_cards;
    }

    this.drawMyCards = function() {
        var ctx = myGameArea.context;
        for (var c = 0; c < this.numcards; c++) {
            ctx.drawImage(anh[52], 200 + c*30,40, 60, 80);
        }
    }

    this.danh_bai = function(cards) {
        this.numcards = this.numcards - cards.length;
        table.update_current_cards(cards);

    }
}

function RightPlayer(player_info) {
    var ctx = myGameArea.context;
    this.html = $('#right_player');

    if (!player_info) {
        this.id = null;
        this.html.html('Trong !');
        this.html.hide();
    } else {
        this.id = player_info.id;
        this.username = player_info.username;
        this.num_cards = player_info.num_cards;

        this.html.html(this.username);
        this.html.show();
    }

    this.go_table = function() {
        this.html.hide();
        this.html.fadeIn(1000);
    }

    this.leave_table = function(){
        this.html.hide();
    }

    this.load_num_cards = function(num_cards) {
        this.numcards = num_cards;
    }

    this.drawMyCards = function(num_cards) {
        var ctx = myGameArea.context;
        var tmp = (13 - this.numcards) * 10;
        for(c = 0; c < this.numcards; c++) {
            ctx.drawImage(anh[53], 650, (100 + c*20 + tmp), 80, 60);
        }
    }

    this.danh_bai = function(cards) {
        this.numcards = this.numcards - cards.length;
        table.update_current_cards(cards);
    }
}

function BottomPlayer(player_info) {
    this.myCard = {};
    this.slCard = {};
    this.drawMyCards = function() {
        var num = 1;
        var count = 0;
        var ctx = myGameArea.context;
        for (var temp in this.myCard) {
            if (this.slCard.hasOwnProperty(num)) {
                ctx.drawImage(anh[this.slCard[num]], 200 + 30*(num-1), 370, 60, 80);
            } else {
                ctx.drawImage(anh[this.myCard[temp]], 200 + 30*(num-1), 380, 60, 80);
            }

            num ++;
        }
    }

    this.getMyCards = function(arrCard) {
            this.myCard = {};
            var count = 1;
        for (var c in arrCard) {
            this.myCard[count] = arrCard[c];
            count++;
        }
    }

    this.html = $('#bottom_player');

    if (!player_info) {
        this.id = null;
        this.html.html('Trong !');
        this.html.hide();
    } else {
        this.id = player_info.id;
        this.username = player_info.username;
        this.num_cards = player_info.num_cards;

        this.html.html(this.username);
        this.html.show();
    }

    this.go_table = function() {
        this.html.hide();
        this.html.fadeIn(1000);
    }

    this.leave_table = function() {
        this.html.hide();
    }

    this.load_num_cards = function(num_cards) {
        $('#bottom_cards').html('');
        for(var i=0; i < num_cards; i++){
            $('#bottom_cards').append('<div class="card_item">'+''+'</div>')
        }
    }

    this.danh_bai = function(cards) {
        this.numcards = this.numcards - cards.length;
        table.update_current_cards(cards);
    }
}

//Plus
function getNumPlayer(table) {
    var _np = 0;
    if (table.lplayer.id) {
        _np++;
    }

    if (table.rplayer.id) {
        _np++;
    }

    if (table.tplayer.id) {
        _np++;
    }

    if (table.bplayer.id) {
        _np++;
    }

    return _np;
}

function sortCardByNumber(arr_card_obj, arr_card_value) { // tap cac doi tuong card co dang cards[0] {number: , rank: }
    for (var i= arr_card_obj.length; i > 0; i--) {
        for (var j = 0; j < i-1; j++) {
            if (arr_card_obj[j].number > arr_card_obj[j+1].number) {
                var tmp = arr_card_obj[j];
                var tmp2 = arr_card_value[j];

                arr_card_obj[j] = arr_card_obj[j+1];
                arr_card_value[j] = arr_card_value[j+1];

                arr_card_obj[j+1] = tmp;
                arr_card_value[j+1] = tmp2;
            }
        }
    }

    return arr_card_value;
}

function sortCardBySuite(arr_card_obj, arr_card_value) {
    for (var i = arr_card_obj.length; i > 0; i--) {
        for (var j = 0; j < i-1; j++) {
            if (arr_card_obj[j].rank > arr_card_obj[j+1].rank) {
                var tmp = arr_card_obj[j];
                var tmp2 = arr_card_value[j];

                arr_card_obj[j] = arr_card_obj[j+1];
                arr_card_value[j] = arr_card_value[j+1];

                arr_card_obj[j+1] = tmp;
                arr_card_value[j+1] = tmp2;
            }
        }
    }

    return arr_card_value;
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}

function getPosOfCard(evt){
                        var len = Object.size(table.bplayer.myCard);
                        var rect = myGameArea.canvas.getBoundingClientRect();
                        var dx = evt.clientX - rect.left - 200;
                        var dy = evt.clientY - rect.top - 400;
                        if((dx/30|0) == len){   // Dam bao rang khi click vao la bai cuoi cung se duoc chon vi la bai nay duoc bieu dien hinh anh la ca quan bai
                            return len-1;
                        }
                        else return((dx/30|0));
                } // end getPosOfCard
function selectCard(evt){
        var pos = getPosOfCard(evt);
        var keys = Object.keys(table.bplayer.myCard);
        if (table.bplayer.slCard.hasOwnProperty(pos+1)){
            delete table.bplayer.slCard[pos+1];
        }else{
            if (table.bplayer.myCard[keys[pos]] !== null && table.bplayer.myCard[keys[pos]] !== undefined ){
                table.bplayer.slCard[pos+1] = (table.bplayer.myCard[keys[pos]]);
            }
        }
    } // end selectCard
myGameArea.canvas.addEventListener("mousedown", selectCard, false);



function updateGameArea() {
    myGameArea.clear();
    table.drawPlayer();

    table.bplayer.drawMyCards();
    if (table.rplayer.id){
        table.rplayer.drawMyCards();
    }

    if (table.tplayer.id){
        table.tplayer.drawMyCards();
    }

    if (table.lplayer.id){
        table.lplayer.drawMyCards();
    }

    table.updateArea();

    if (table.turn_id == table.bplayer.id) {
        table.drawCountDown(100,400);
    }

    if (table.turn_id == table.rplayer.id) {
        table.drawCountDown(750,300);
    }

    if (table.turn_id == table.lplayer.id) {
        table.drawCountDown(20,300);
    }

    if (table.turn_id == table.tplayer.id) {
        table.drawCountDown(650, 50);
    }
}

Object.size = function(obj) {
    var size = 0, key;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }

    return size;
};
