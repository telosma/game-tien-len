var express = require('express'),
    app = express(),
    sv = require('http').createServer(app),
    server = require('socket.io').listen(sv);
sv.listen(process.env.PORT || 5000);
if (process.env.PORT) {
    console.log('server listen on port:' + process.env.PORT);
} else {
    console.log('server listen on port:' + 5000);
}
var path = require('path');
app.use(express.static(__dirname + '/../client'));
app.get('/', function(req, res){
    res.sendfile(path.resolve(__dirname + '/../client/clientNoAccount.html'));
});

server.on('connection', function(socket) {

    console.log('co client ket noi toi');

    var user = new User(socket);

    socket.on('login',function(username, password) {
        user.login(username, password);
    })

    socket.on('logout', function() {
        user.logout();
    })

    socket.on('register',function(username, password, firstname, lastname) {
        user.register(username, password, firstname, lastname);
    })

    socket.on('go_table', function(table_id) {
        user.go_table(table_id);
    })

    socket.on('leave_table', function() {
        user.leave_table();
    })

    socket.on('start_game', function() {
        user.start_game();
    })

    socket.on('danh_bai', function(cards) {
        user.danh_bai(cards);
    })

    socket.on('bo_luot', function() {
        user.bo_luot();
    })


    socket.on('disconnect', function() {
        console.log(' user disconnect');
        user.leave_table();
    })

})


function Database(){
    this.id = 0;
    this.login = function(username, password) {
        this.id += 1;
        return this.id;
    }

    this.register = function(username, password, firstname, lastname){
        this.id += 1;
        return this.id;
    }
}


tables = []

for(var i =0; i < 10 ; i++){
    tables[i] = new Table(i);
}


// lay thong tin cac ban choi trong he thong
function get_list_table_info(){

    var list_tables = [];
    for(var  i in tables){
        list_tables[i] = {
            'id': tables[i].id,
            'state':tables[i].state,
            'num_players': tables[i].get_num_players()
        }
    }
    return list_tables;
}


database = new Database();


function User(socket) {

    LOGOUT = 0;
    OUT_TABLE = 1;

    PLAYER = 2;
    VISITOR =3;

    PLAYING = 4;



    this.socket = socket;

    // Sua khong required dang nhap
    // this.id = null;
    this.id = 0;


    this.username = null;

    this.state = LOGOUT;

    this.table = null;

    this.position = null;

    this.cards = [];

    this.is_in_cycle = false;

    this.rank = null;

    this.receive_notice = function(notice) {
        this.socket.emit("receive_notice", notice);
    }

    this.login = function(username,password) {

        /*
        *
        *
        Doan code xu lu Login nhung do tam thoi chua cai MONGODB nen cmt
        *
        *
        */

        console.log('username: ' + username);
        console.log('password: ' + password);
        var thisurs = this;
            this.id = database.login(username, password) ;
            this.username = username;
            this.receive_notice('Tao tai khoan thanh cong');
            this.socket.emit('login_success',get_list_table_info());
            console.log('user dang nhap thanh cong');
        //=============================================//



    }

    this.logout = function() {
        this.id = null;
        this.username = null;
        this.state = LOGOUT;
    }

    this.register = function(username, password, firstname, lastname) {
        var thisusr  = this;
        var newuser = new Account();
        newuser.username = username;
        newuser.password = password;
        newuser.firstname = firstname;
        newuser.lastname = lastname;
        console.log('co user dang ky tai khoan');
        console.log('username: ' + username);
        console.log('firstname: ' + newuser.firstname);
        console.log('lastname: ' + newuser.lastname);
        newuser.save(function(err, savedUser){
            if (err) {
                thisusr.receive_notice('email hoac mat khau khong hop le');
                return false;
            }
            if (savedUser) {
                thisusr.receive_notice('ban da dang ky thanh cong');
                console.log('nguoi choi dang ky thanh cong');
                return false;
            }
        })

    }

    this.go_table = function(table_id) {

        if(this.table){
            this.leave_table();
        }

        if(tables[table_id].add_player(this)) {
            console.log('vao ban thanh cong ' + this.table.id);
            this.table = tables[table_id];
            console.log(this.table.get_table_info());
            this.socket.emit('go_table_success', this.table.get_table_info(), this.position);
        }else{
            this.receive_notice('vao ban that bai');
            console.log('vao ban that bai');
        }
    }

    this.started = function() {
        this.socket.emit('game_started');
    }

    this.leave_table = function() {
        if(this.state == OUT_TABLE){
            this.receive_notice('ban chua vao phong nao ca');
        }else{
            if (this.table == null) {
                this.receive_notice('co loi, phong khong xac dinh');
            }else{
                if (this.state == PLAYING) {
                    this.bo_luot();
                }

                if (this.table.remove_player(this)) {
                    this.state = OUT_TABLE;
                    this.table = null;
                    this.socket.emit('leave_table_success',get_list_table_info());
                }else{
                    this.receive_notice('co loi, khong roi duoc phong');
                }
            }
        }
    }

    this.start_game = function() {
        if (this.table.ownerId == this.id) {
            console.log('trang thai hien tai, ( bat dau van choi ) ' + this.state);

            if (this.state != PLAYER ) {
                this.receive_notice('Co loi! Ban khong the bat dau van choi!');
            }else{
                if(this.table == null){
                    this.receive_notice('Phong choi khong xac dinh !');
                }

                if(this.table.start_game()){
                    this.socket.emit('start_game_success');
                }else{
                    this.receive_notice('Bat dau game that bai!');
                }
            }
        }else{
            this.receive_notice('Bat dat game that bai! Ban khong phai chu phong');
            console.log('Id cua chu phong: ' + this.table.ownerId);

            return false;
        }
    }

    this.danh_bai = function(cards) {
        console.log('user yc danh bai');
        if (this.state != PLAYING ) {
            this.receive_notice('Ban chua choi !');
        }else{
            if (this.table== null) {
                this.receive_notice('Ban choi khong xac dinh !');
            }

            if (this.table.danh_bai(this,cards)) {
                this.socket.emit('danh_bai_success');
            }else{
                this.socket.emit('danh_bai_unsuccess');
                this.receive_notice('La bai khong hop le!');
            }
        }
    }

    this.bo_luot = function() {
        if (this.state != PLAYING ) {
            this.receive_notice('Ban chua choi !');
        }else{
            if(this.table== null){
                this.receive_notice('Ban choi khong xac dinh !');
            }

            if (this.table.bo_luot(this)) {
                this.socket.emit('bo_luot_success');
            }else{
                this.receive_notice('Bo luot that bai!');
            }
        }
    }

    this.update_user_go_table = function(user_id,username,position) {
        this.socket.emit('update_user-go_table', user_id, username, position);
    }

    this.update_user_leave_table = function(table_info,user_id) {
        this.socket.emit('update_user-leave_table',  user_id);
    }

    this.update_user_danh_bai = function(user_id,cards) {
        this.socket.emit('update_user-danh_bai', user_id, cards);
    }

    this.update_user_bo_luot = function(user_id) {
        this.socket.emit('update_user-bo_luot', user_id);
    }

    this.update_game_start = function(table_info,my_cards) {
        this.socket.emit('update_game-start', table_info, my_cards);
    }

    this.update_game_finish = function(table_info){
        this.socket.emit('update_game-finish', table_info);
    }

    this.update_game_ready = function() {
        this.socket.emit('update_game-ready');
    }

    this.update_game_unready = function() {
        this.socket.emit('update_game-unready');
    }

    this.update_game_new_cycle = function(first_turn) {
        this.socket.emit('update_game-new_cycle', first_turn);
    }

    this.update_game_new_turn = function (new_turn,current_cards){
        this.socket.emit('update_game-new_turn', new_turn, current_cards);
    }
}


function Table(id){

    PLAYING = 4;
    READY = 1;
    UNREADY = 2;

    this.id = id;
    this.state = UNREADY;
    this.ownerId = null;
    this.players = [];
    var to;

    for(var i =0; i < 4 ; i++){
        this.players[i] = null;
    }

    this.current_cards = null;
    // vi tri cua nguoi choi dang co luot choi
    this.current_turn = null;

    //getter
    this.get_num_players = function() {
        var count =0;

        for(var i in this.players){
            if(this.players[i]){
                count += 1;
            }
        }

        return count;
    }


    this.get_table_info = function() {
        var table_info = {
            'id': this.id,
            'state': this.state,
        }

        var players = []

        if(this.state == PLAYING) {
            for( var i in this.players) {
                if(this.players[i]) {
                    players[i] = {
                        'id':this.players[i].id,
                        'username': this.players[i].username,
                        'num_cards': this.players[i].cards.length
                    }
                }

            }

            table_info.players = players;
            table_info.current_cards = this.current_cards;
            table_info.current_turn = this.players[this.current_turn].id;

        }else{
            for( var i in this.players){
                if(this.players[i]){
                    players[i] = {
                        'id':this.players[i].id,
                        'username': this.players[i].username,
                        'timein': this.players[i].timein
                    }
                }

            }
            table_info.players = players;
        }

        return table_info;
    }
    //action

    // them nguoi choi vao ban
    this.add_player = function(player) {
        // tim vi tri con trong
        var empty_slot = null;
        for(var i in this.players){
            if(this.players[i] == null){
                empty_slot = i;
                break;
            }
        }

        if(empty_slot == null){
            return false;
        }

        if (this.get_num_players() == 0) {
            player.timein = 1;
        }else{
            player.timein = 1;
            for (var i in this.players){
                if (this.players[i]) {
                    player.timein += this.players[i].timein;
                }
            }
        }

        // kiem tra nguoi choi da o trong ban hay chua
        if(this.players.indexOf(player) != -1 ){
            return false;
        }

        // them nguoi choi vao trong ban
        player.table = this;

        player.position = empty_slot;

        this.players[empty_slot] = player;

        // neu ban dang choi thi nguoi choi o trang thai nguoi xem,
        // neu khong thi la trang thai nguoi choi
        if (this.state == PLAYING) {
            player.state = VISITOR;
        }else{
            player.state = PLAYER;
        }

        //update thong tin toan bo player trong ban
        for (var i in this.players) {
            if(this.players[i])
                this.players[i].update_user_go_table(player.id,player.username,player.position);
        }

        // tim ra chu phong neu nhu chua xac dinh
        if (!this.ownerId) {
            this.ownerId =  this.getOwnerId();
        }

        return true;
    }

    // Xac dinh id cua chu phong
    this.getOwnerId = function(){
        _ownerid = null;
        var _timein = 1000000;
        for (var p in this.players){
            if (this.players[p]){
                if (_timein > this.players[p].timein){
                    _timein = this.players[p].timein;
                    _ownerid = this.players[p].id;
                }
            }
        }

        return _ownerid;
    }
    // loai bo nguoi choi khoi ban
    this.remove_player = function(player) {
        var _pid = player.id;

        // kiem tra nguoi choi co trong ban hay khong
        if (this.players.indexOf(player) == -1) {
            console.log('nguoi choi khong o trong ban')
            return false;
        }

        // loai bo nguoi choi ra khoi ban
        this.players[this.players.indexOf(player)] = null;

        if (this.ownerId == _pid){
            this.ownerId = null;
            this.ownerId =  this.getOwnerId();
        }

        if (this.state == READY){
            if (this.getNumPlayer < 2){
                this.state = UNREADY;
            }
        }

        // updatethong tin cho cac thanh vien trong ban
        for(var i in this.players){
            if(this.players[i])
                this.players[i].update_user_leave_table(_pid);
        }

        if (this.state == PLAYING){
            if( this.is_finish_game){
                this.finish_game();
            }else if(this.is_finish_cycle){
                this.is_finish_cycle();
            }
        }

        return true;
    }

    // tao vong choi moi
    this.new_cycle = function() {
        if (this.state == PLAYING){
            console.log('tao vong choi moi');

            // tim nguoi choi dau tien tiep theo trong vong
            var first_turn = null;

            for(var i =0; i < this.players.length; i++){
                if(this.players[i]){
                    if(this.players[i].is_in_cycle && this.players[i].cards.length >0){
                        first_turn = i;
                        break;
                    }
                }
            }

            console.log('first_turn ' + first_turn);

            this.current_turn = first_turn;
            this.current_cards = null;

            // tat ca moi nguoi deu trong vong choi
            for (var i in this.players) {
                if (this.players[i]) {
                    if (this.players[i].cards.length > 0) {
                        this.players[i].is_in_cycle = true;
                    }else{
                        this.players[i].is_in_cycle = false;
                    }

                    console.log('vong moi , is_in_cycle ' + this.players[i].is_in_cycle)
                }
            }

            // cap nhat thong tin
            var thistb = this;
            for(i in this.players){
                if(this.players[i]){
                    this.players[i].update_game_new_cycle(this.players[this.current_turn].id);

                    if(i == this.current_turn){
                        console.log('ham set timeout 20s');

                        this.to = setTimeout(function(){
                            thistb.players[thistb.current_turn].bo_luot();
                        }, 20000);
                    }
                }
            }

            return true;
        }
    }

    // ket thuc vong choi
    this.finish_cycle = function() {

    }

    // bat dau game
    this.start_game = function() {
        this.state = PLAYING;

        for (var i in this.players ) {
            if(this.players[i]){
                this.players[i].state = PLAYING;
                this.players[i].started();
            }
        }

        this.distributeCard();
        // luot choi dau tien
        this.current_turn = 0;
        this.current_cards = null;

        // cap nhat thong tin toi cac thanh vien
        for(var i in this.players){
            if(this.players[i]){
                this.players[i].update_game_start(this.get_table_info(),this.players[i].cards);
            }
        }

        // tat ca moi nguoi deu trong vong choi
        for(i in this.players){
            if(this.players[i]){
                if(this.players[i].cards.length > 0) {
                    this.players[i].is_in_cycle = true;
                }else{
                    this.players[i].is_in_cycle = false;
                }

                console.log('start game set is_in_cycle ' + this.players[i].is_in_cycle)
            }
        }

        // cap nhat thong tin bat dau mot vong choi moi
        for(i in this.players){
            if(this.players[i]){
                this.players[i].update_game_new_cycle(this.players[this.current_turn].id);
            }
        }

        // setTimeout cho luot cua nguoi choi dau tien
        var thistb = this;
        this.to = setTimeout(function(){
                    thistb.players[thistb.current_turn].bo_luot();
                }, 20000);

        return true;
    }

    this.distributeCard = function() {
        // tao bo bai
        var card_deck = []

        for(var i=0; i< 52; i++){
            card_deck.push(i);
        }

        // chia bai cho tung nguoi
        for( var u in this.players){
            if(this.players[u]){
                this.players[u].cards = [];

                for(var i=0; i < 13 ; i++){
                    var p = Math.floor((Math.random() * card_deck.length));
                    this.players[u].cards.push(card_deck[p]);
                    card_deck.splice(p, 1);
                }
            }
        }
    }

    // ket thuc game
    this.finish_game  = function() {
        // cap nhat ket qua choi toi cac thanh vien
        var table_info = this.get_table_info();
        var exist_card = 0;
        var num_player = 0;
        var stt = {};

        table_info.players.forEach(function(p) {
            if(p){
                exist_card += p.num_cards;
                num_player ++;
            }
        })

        table_info.players.forEach(function(p) {
            if(p){
                if (num_player == 1){
                    p['opposite_score'] = 10;
                }else{
                    p['opposite_score'] = (p.num_cards + exist_card);
                    stt[p['opposite_score']] = p.id;
                }
            }
        })

        table_info.exist_card = exist_card;
        table_info.stt = stt;
        table_info.state = this.state;

        this.new_game();

        this.players.forEach(function(p) {
            if(p){
                p.update_game_finish(table_info);
                p.state = PLAYER;
            }
        })
    }

    // tao game moi, cac nguoi choi o trang thai chuan bi choi
    this.new_game = function(){
        var _numplayer = 0;

        // cap nhat lai trang thai cac nguoi choi
        this.players.forEach(function(p) {
            if(p){
                p.state = PLAYER;
                p.cards = [];
                p.is_in_cycle = true;
                _numplayer ++;
            }
        })

        // cap nhat trang thai ban choi
        if (_numplayer > 1) {
            this.state = READY;
        }else{
            this.state = UNREADY;
        }


        // cap nhat thong tin toi cac thanh vien
        this.players.forEach(function(p) {
            if(p){
                // p.update_game_new_game(this.get_table_info);
            }
        })

    }

    this.is_finish_cycle = function() {
        // neu so nguoi trong vong chi con 1 nguoi thi la da ket thuc vong, co the bat dau vong moi
        var count =0;

        for (var i in this.players) {
            if (this.players[i] && this.players[i].is_in_cycle) {
                count += 1;
            }
        }

        if (count == 1 || count == 0) {
            return true;
        }

        return false;
    }

    this.is_finish_game = function() {
        if (this.state == PLAYING){
            console.log('kiem tra ket thuc game')

            // neu so nguoi con bai la 1 hoac 0 thi van choi da ket thuc
            var count = 0;
            for(var i in this.players){
                if ( (this.players[i]) && (this.players[i].state == PLAYING) && (this.players[i].cards.length == 0) ){
                    return true;

                }

                if( (this.players[i])  && (this.players[i].cards.length > 0) ){
                    count += 1;
                }
            }

            if(count == 0 || count == 1){
                return true;
            }

            return false;
        }

        return false;
    }

    this.danh_bai = function(player, cards) {
        console.log('nguoi choi danh bai : ');
        console.log('cac quan bai da danh : ');

        for(var i in cards){
            console.log(cards[i]);
        }

        console.log('trong bo bai : ');

        for(var i in player.cards){
            console.log(player.cards[i]);
        }

        // kiem tra quyen nguoi choi
        if ( player != this.players[this.current_turn]){
            console.log('nguoi choi khong co luot');
            return false;
        }

        // kiem tra cac quan bai co trung nhau khong
        for(var i =0; i < cards.length-1; i++){
            for(var j = i +1; j < cards.length; j++){
                if (cards[i] == cards[j]) {
                    console.log('cac quan bai trung nhau !');
                    return false;
                }
            }
        }

        // kiem tra xem bai co trong bai cua nguoi choi khong
        for (var i in cards) {
            if (player.cards.indexOf(cards[i]) == -1) {
                console.log('quan bai da danh khong co trong bo bai : ' + cards[i]);
                return false;
            }
        }

        //  kiem tra xem bai co hop le voi cac quan bai truoc do khong
        if (!this.check_cards(cards,this.current_cards)) {
            console.log('bai khong hop le voi cac quan bai tren ban');
            return false;
        }

        // loai bo cac quan bai ra khoi bai cua nguoi choi
        for(var i = 0; i < cards.length; i++){
            player.cards.splice(player.cards.indexOf(cards[i]),1);
        }

        // chuyen quan bai hien tai tren ban thanh cac quan bai moi
        this.current_cards = cards;

        // cap nhat thong tin cho cac thanh vien
        this.players.forEach(function(p) {
            if (p) {
                p.update_user_danh_bai(player.id,cards);
            }
        })

        clearTimeout(this.to);

        // kiem tra ket thuc game, ket thuc vong, hoac chuyen luot choi sang nguoi tiep theo
        console.log('tao luot choi moi')
        if (this.is_finish_game()) {
            this.finish_game();
        } else if ( this.is_finish_cycle()) {
            this.new_cycle();
        } else {
            console.log('this.new_turn()');
            this.new_turn();
        }

        console.log('tao luot choi moi xong ');
        return true;
    }


    this.check_cards = function(cards,current_cards){
        if( ! cards || cards.length == 0){
            return false;
        }

        cards = getCards(cards);

        if ( current_cards == null) {
            if (cards.length == 1)
                return true;
            else if (la_bo_doi(cards))
                return true;
            else if (la_bo_ba(cards))
                return true;
            else if (la_bo_day(cards))
                return true;
            else return false;
        }

        current_cards = getCards(current_cards);

        // quan bai don
        if(current_cards.length == 1){
            // quan bai hien tai la 2
            if( current_cards[0].number == 15){
                if( cards.length == 1){
                    if( cards[0].number == 15 && cards[0].rank > current_cards[0].rank){
                        return true;
                    }else {
                        return false;
                    }
                }else if( la_tu_quy(cards)){
                    return true;
                }else {
                    return false;
                }
            }else if (cards.length == 1){
                if (cards[0].number == 15)
                    return true;
                if ( (cards[0].number > current_cards[0].number) && (cards[0].rank == current_cards[0].rank) ){
                    return true;
                }
            }else if( la_tu_quy(cards)){
                return true;
            }else {
                return false;
            }
        }

        // bo doi
        if (la_bo_doi(current_cards)) {
            if ( cards.length == 2 && cards[0].number == 15 && cards[1].number == 15) {
                return true;
            } else if(la_bo_doi(cards)) {
                if (so_sanh_bo(cards,current_cards) > 0 ) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        // bo ba
        if (la_bo_ba(current_cards)) {
            if ((cards.length == 3) && (cards[0].number == 2) && (cards[1].number == 2) && (cards[2].number == 2)) {//3 la 2
                return true;
            } else if (la_bo_ba(cards)) {
                if (so_sanh_bo(cards,current_cards) > 0) {
                    return true;
                } else {
                    return false;
                }
            }else {
                return false;
            }
        }

        // tu quy
        if( la_tu_quy(current_cards) && la_tu_quy){
            if (so_sanh_bo(cards,current_cards) > 0) {
                return true;
            } else {
                return false;
            }
        }

        // la bo day
        if (la_bo_day(current_cards) && la_bo_day(cards)) {
            if (current_cards .length == cards.length) {
                if (so_sanh_bo_day(cards,current_cards) > 0) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        return false;;
    }

    function la_bo_ba(cards) {
        if(cards.length != 3){
            return false;
        }

        if (cards[0].number == cards[1].number && cards[0].number == cards[2].number) {
            return true;
        } else {
            return false;
        }
    }

    function so_sanh_bo(cards1,cards2){

        if(cards1.length != cards2.length){
            return false;
        }

        cards1 = sortCardByRank(cards1);
        cards2 = sortCardByRank(cards2);

        // truong hop bo cac quan 2
        if (cards1[0].number == 15 && cards2[0].number != 15) {
            return 1;
        }

        if (cards1[0].number != 15 && cards2[0].number == 15) {
            return -1;
        }

        if (cards1[0].number == 15 && cards2[0].number == 15) {
            if (cards1.length == 2){
                if ( (cards1[0].rank > cards2[0].rank) && (cards1[1].rank > cards2[1].rank) ) {
                    return 1;
                }else if( ( cards1[0].rank < cards2[0].rank) && (cards1[1].rank < cards2[1].rank) ) {
                    return -1;
                }else {
                    return 0;
                }
            }
        }

        // so sanh chat ( cac quan bai 2 bo phai du chat cua nhau )
        for(var i=0; i< cards1.length;i++){
            if(cards1[i].rank != cards2[i].rank){
                return false;
            }
        }
        //so sanh bo doi
            if (cards1[0].rank != cards2[0].rank){
                return 0;
            }
            else if (cards1[0].number > cards2[0].number){
                return 1;
            }
            else if (cards1[0].number < cards2[0].number){
                return -1;
            }
    }

    function la_bo_doi(cards){
        if(cards.length != 2){
            return false;
        }

        if( cards[0].number == cards[1].number){
            if (cards[0].number == 15)
                return true;
            if( cards[0].rank == 0 && cards[1].rank == 1){
                return true;
            }

            else if( cards[0].rank == 1 && cards[1].rank == 0){
                return true;
            }

            else if(cards[0].rank == 2 && cards[1].rank == 3){
                return true;
            }

            else if(cards[0].rank ==3 && cards[1].rank == 2){
                return true;
            }

            return false;;
        }
        else
            return false;
    }


    function la_tu_quy(cards){

        if(cards.length != 4){
            return false;
        }

        if( cards[0].number == cards[1].number
            && cards[0].number == cards[2].number
            && cards[0].number == cards[3].number){
            return true;
        }
        else
            return false;

    }

    function la_bo_day(cards) {
        if(cards.length < 3 ){
            return false;
        }

        // kiem tra co cung chat hay khong
        var rank = cards[0].rank;

        for(var i= 1 ; i< cards.length;i++){
            if(cards[i].rank !== rank){
                console.log('yc bo day phai dong chat');
                return false;
            }
        }

        // kiem tra xem co phai lien tiep nhau hay khong
        sortCardByNumber(cards);
        console.log(sortCardByNumber(cards));
        for(var i=0; i< cards.length -1; i++){
            if (cards[i].number == 15 || cards[i+1] == 15 ){
                console.log('bo day khong duoc chua la bai 2');
                return false;
            }
            else if(cards[i].number != cards[i+1].number-1){
                console.log('yc bo day phai la cac la bai lien nhau');
                return false;
            }
        }

        return true;
    }

    function so_sanh_bo_day(cards1,cards2){ // true neu bo day 1  > bo day 2
        if(cards1.length != cards2.length){
            return false;
        }

        if(cards1[0].rank != cards2[0].rank){
            return false;
        }

        cards1 = sort(cards1,function(item) { return item.number});
        cards2 = sort(cards2,function(item) { return item.number});

        if(cards1[0].number > cards2[cards2.length-1].number){
            return 1;
        }else if(cards1[cards1.length-1].number < cards2[0].number){
            return -1
        } else {
            return 0;
        }
    }

    // sap xep tang dan
    function sort_cards(cards){

        return sort(cards,function(card){
            return card.number;
        })
    }

    function sort(list,get_value_function){
        for(var i=0; i< list.length-1;i++){
            for(var j=0; j < list.length;j++){
                if(get_value_function(list[i]) > get_value_function(list[j])){
                    var tmp = list[i];
                    list[i] = list[j];
                    list[j] = tmp;
                }
            }
        }
        return list;
    }

    function sortCardByNumber(cards){
        for (var i= cards.length; i > 0; i--){
            for (var j = 0; j < i-1; j++){
                if (cards[j].number > cards[j+1].number){
                    var tmp = cards[j];
                    cards[j] = cards[j+1];
                    cards[j+1] = tmp;
                }
            }
        }
        return cards;
    }

    function sortCardByRank(cards){
        for (var i= cards.length; i > 0; i--){
            for (var j = 0; j < i-1; j++){
                if (cards[j].rank > cards[j+1].rank){
                    var tmp = cards[j];
                    cards[j] = cards[j+1];
                    cards[j+1] = tmp;
                }
            }
        }
        return cards;
    }
    // chuyen doi gia tri quan bai
    // var cardRank = ['bich','nhep','ro','co']
    // var cardNumber = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
    function getCard(card){
        return {'number': card % 13 + 3  , 'rank': (card / 13 | 0)};
    }

    function getCards(cards){
        var result =[];
        cards.forEach(function(card) {
            result.push(getCard(card));
        })
        return result;
    }

    // so sanh cac quan bai
    function cmpCard(card1,card2){ // tra ve true neu card1 > card2 va false neu nguoc lai
        if (card1.number == 15){
            if (card2.number == 15){
                if (card1.rank > card2.rank){
                    return true;
                }
                else if (card1.rank < card2.rank) {
                    return false;
                }
            }
            else {
                return true;
            }
        }else if ( (card1.number > card2.number) && (card1.rank == card2.rank) ){
            return true;
        }
        else if (card1.number == card2.number){
            if (card1.rank > card2.rank){
                return true;
            }else { return false;}
        }
    }

    this.bo_luot = function(player) {

        // khong den luot choi thi khong duoc phep
        if( this.players[this.current_turn] != player){
            console.log('bo luot that bai ! khong phai luot choi cua player');
            return false;
        }

        player.is_in_cycle = false;

        // cap nhat thong tin mot nguoi choi bo luot cho cac thanh vien
        for(var i in this.players){
            if(this.players[i]){
                this.players[i].update_user_bo_luot(player.id);
            }
        }
        clearTimeout(this.to);

        // chuyen turn sang nguoi choi moi

        if(this.is_finish_game()){
            this.finish_game();
        }else if ( this.is_finish_cycle()){
            this.new_cycle();
        } else {
            console.log('this.new_turn()');
            this.new_turn();
            console.log('tao luot choi moi xong ');

        }
        return true;
    }


    // bat dau mot luot choi moi
    this.new_turn = function() {

        console.log('tao luot moi ');

        // tim nguoi tiep theo
        var i = this.current_turn + 1;
        if( i >= 4){
            i = 0;
        }

        while(true){
            console.log('xet position : ' + i);
            if(this.players[i] && this.players[i].cards.length > 0 ){
                if( i == this.current_turn){
                    console.log('co loi trong new turn 1');
                    return false;
                }

                if( this.players[i].is_in_cycle){
                    break;
                }else{
                    i += 1;
                    if(i >= 4){
                        i=0;
                    }
                }

            }else {
                i += 1;
                if( i >= 4){
                    i = 0;
                }
                console.log('trong ' + i);
                if(i == this.current_turn){
                    console.log('co loi trong new turn 2 ');
                    return false;
                }
            }
        }



        this.current_turn = i;

        // cap nhat thong tin cho cac thanh vien
        console.log('cap nhat luot moi cho cac thanh vien ');
        var thistb = this;
        var current_player = this.players[this.current_turn];
        for(var i in this.players){
            if(this.players[i]){

                this.players[i].update_game_new_turn(this.players[this.current_turn].id);
            }
            if(i == this.current_turn){
                console.log('ham set timeout 20s');
                this.to = setTimeout(function(){
                    thistb.players[thistb.current_turn].bo_luot();
                }, 20000);
            }
        }
    }
    this.getNumPlayer = function(){
        var _np = 0;
        for (var p in this.players){
            if (this.players[p]){
                _np++;
            }
        }
        return _np;
    }

}
