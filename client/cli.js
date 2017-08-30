function goTable(a) {
    socket.emit("go_table", a)
}

function showFrame(a) {
    $(".frame").hide(), $("#" + a).show()
}

function showLoginFrame() {
    showFrame("login_frame")
}

function showTableFrame() {
    showFrame("table_frame")
}

function showListTableFrame() {
    showFrame("list_table_frame")
}

function updateListTable(a) {
    var b = $("#list_table_frame");
    b.html("");
    for (var c = 0; c < a.length; c++) {
        var d = a[c],
            e = '<tr class="table_item" table_id="' + d.id + '"><td table_id="' + d.id + '">ban ' + d.id + "</td><td> so nguoi : " + d.num_players + "</td><td>Trang thai : " + d.state + "</td></tr>";
        b.append(e)
    }
}

function getTableInfo() {
    players = [];
    for (var a = 0; a < 4; a++) {
        var b = {
            id: a
        };
        players.push(b)
    }
    my_card = [], card_deck = [];
    for (var a = 0; a < 52; a++) card_deck.push(a);
    for (var a = 0; a < 13; a++) {
        var c = Math.floor(Math.random() * card_deck.length);
        my_card.push(card_deck[c]), card_deck.splice(c, 1)
    }
    var d = {
        id: 1,
        current_turn: 1,
        players: players,
        current_card: 10,
        my_card: my_card
    };
    return d
}

function getCard(a) {
    return {
        number: a % 13 + 3,
        rank: a / 13 | 0
    }
}

function getCards(a) {
    var b = [];
    return a.forEach(function(a) {
        b.push(getCard(a))
    }), b
}

function selectCards(a) {
    selected_cards.indexOf(a) == -1 ? (selected_cards.push(a), $("[card_id=" + a + "]").addClass("card_item_selected")) : (selected_cards.splice(selected_cards.indexOf(a), 1), $("[card_id=" + a + "]").removeClass("card_item_selected"))
}

function obj2Arr(a) {
    var b = Object.keys(a).map(function(b) {
        return a[b]
    });
    return b
}

function Table(a, b) {
    this.play_sound = new sound("./sound/play.mp3"), this.laughing_sound = new sound("./sound/laughing.mp3"), this.door_open = new sound("./sound/door_open.mp3"), this.stop_count_down = !1, this.sec = 400, this.setOfCardsInCycle = [], this.preLoadImages = function() {
        for (var a = 0; a < 57; a++) anh[a] = new Image, anh[a].src = "./faces/" + a + ".png"
    }, this.drawPlayer = function() {
        var a = myGameArea.context;
        a.fillStyle = "#FF0000", a.font = "30px Arial", null !== this.bplayer.id && a.fillText(this.bplayer.username, 300, 490), null !== this.tplayer.id && a.fillText(this.tplayer.username, 300, 20), null !== this.lplayer.id && a.fillText(this.lplayer.username, 0, 200), null !== this.rplayer.id && a.fillText(this.rplayer.username, 740, 200)
    }, this.drawPlayerGoTable = function(a, b) {
        var c = myGameArea.context,
            d = 30,
            e = 24,
            f = 30,
            g = 0,
            h = window.setInterval(function() {
                if (d--, c.drawImage(anh[54], g * e, 0, e, f, a, b, e, f), g = (g + 1) % 8, d == -1) return void clearInterval(h)
            }, 100)
    }, this.drawCountDown = function(a, b) {
        if (!table.stop_count_down) {
            if (0 == this.sec) return void(this.stop_count_down = !0);
            var c = myGameArea.context;
            this.sec--, c.strokeStyle = "blue", c.strokeRect(a, b, 50, 50), c.lineWidth = 5, c.font = "30px Arial", c.fillText(this.sec / 20 | 0, a + 10, b + 30)
        }
    }, this.getPlayedCard = function() {
        var c = (Object.size(this.bplayer.myCard), Object.keys(this.bplayer.myCard));
        this.cardsOnTable = this.bplayer.slCard;
        for (var e in this.bplayer.slCard) delete this.bplayer.myCard[c[e - 1]];
        this.bplayer.slCard = {}
    }, this.id = a.id, this.state = a.state, this.my_position = b, $("#table_id").html(a.id), this.draw = function(a) {}, this.load_state = function(a) {
        (a.state = PLAYING) ? $("#table_state").html("ban dang choi"): $("#table_state").html("ban chua choi")
    }, this.new_game = function() {
        table.cardsOnTable = {}, table.setOfCardsInCycle = {}, myGameArea.clear(), this.drawPlayer(), $("#btn-play").hide(), $("#btn-throw").hide(), $("#btn-un-select").hide(), $("#btn-leave-table").hide()
    }, this.start_game = function() {
        $("#btn-start").hide(), this.interval = setInterval(updateGameArea, 50)
    }, this.finish_game = function() {
        clearInterval(this.interval), this.new_game()
    }, this.addPlayer = function(a, b) {
        b - this.my_position != 1 && b - this.my_position != -3 || (this.rplayer = new RightPlayer(a), this.rplayer.pos = b, this.rplayer.id && this.drawPlayerGoTable(770, 250)), b - this.my_position != 2 && b - this.my_position != -2 || (this.tplayer = new TopPlayer(a), this.tplayer.pos = b, this.tplayer.id && this.drawPlayerGoTable(400, 0)), b - this.my_position != 3 && b - this.my_position != -1 || (this.lplayer = new LeftPlayer(a), this.lplayer.pos = b, this.lplayer.id && this.drawPlayerGoTable(0, 250)), b - this.my_position == 0 && (this.bplayer = new BottomPlayer(a), this.bplayer.pos = b, this.bplayer.id && this.drawPlayerGoTable(400, 470))
    }, this.removePlayer = function(a) {
        return this.getPlayer(a).leave_table(), this.lplayer.id == a && (this.lplayer = new LeftPlayer(null)), this.rplayer.id == a && (this.rplayer = new RightPlayer(null)), this.tplayer.id == a && (this.tplayer = new TopPlayer(null)), this.bplayer.id == a && (this.bplayer = BottomPlayer(null)), this
    }, this.getPlayer = function(a) {
        return this.lplayer.id == a ? this.lplayer : this.rplayer.id == a ? this.rplayer : this.tplayer.id == a ? this.tplayer : this.bplayer.id == a ? this.bplayer : void 0
    }, this.load_cards = function(a) {
        for (var b in a.players)
            if (a.players[b] && b != this.my_position) {
                var c = a.players[b].id;
                this.getPlayer(c).load_num_cards(a.players[b].num_cards)
            }
    }, this.update_current_cards = function(a) {
        this.cardsOnTable = {};
        for (var b in a) this.cardsOnTable[b] = a[b];
        5 == this.setOfCardsInCycle.length && (this.setOfCardsInCycle = []), this.setOfCardsInCycle.push(this.cardsOnTable)
    }, this.load_player = function(a) {
        for (var b = 0; b < 4; b++) this.addPlayer(a.players[b], b)
    }, this.init = function() {
        this.load_state(a), this.load_player(a), this.load_cards(a)
    }, this.updateArea = function() {
        for (var a = myGameArea.context, b = 0, c = 400 - 5 * this.setOfCardsInCycle.length, d = 250 - 25 * this.setOfCardsInCycle.length, e = 0; e < this.setOfCardsInCycle.length; e++) {
            b = 0;
            var f = 0;
            for (var g in this.setOfCardsInCycle[e]) b++, a.save(), a.translate(c, d), a.rotate(f * Math.PI / 180), a.drawImage(anh[this.setOfCardsInCycle[e][g]], -30 + 10 * b, -40 - 5 * b, 60, 80), a.restore(), f += 25;
            c += 15, d += 25
        }
    }, this.init()
}

function Players() {}

function LeftPlayer(a) {
    this.html = $("#left_player"), a ? (this.id = a.id, this.username = a.username, this.num_cards = a.num_cards, this.html.html(this.username), this.html.show()) : (this.id = null, this.html.html("Trong !"), this.html.hide()), this.go_table = function() {
        this.html.hide(), this.html.fadeIn(1e3)
    }, this.leave_table = function() {
        this.html.hide()
    }, this.load_num_cards = function(a) {
        this.numcards = a
    }, this.drawMyCards = function() {
        for (var a = myGameArea.context, b = 10 * (13 - this.numcards), c = 0; c < this.numcards; c++) a.drawImage(anh[53], 100, 100 + 20 * c + b, 80, 60)
    }, this.danh_bai = function(a) {
        this.numcards = this.numcards - a.length, table.update_current_cards(a)
    }
}

function TopPlayer(a) {
    this.html = $("#top_player"), a ? (this.id = a.id, this.username = a.username, this.num_cards = a.num_cards, this.html.html(this.username), this.html.show()) : (this.id = null, this.html.html("Trong !"), this.html.hide()), this.go_table = function() {
        this.html.hide(), this.html.fadeIn(1e3)
    }, this.leave_table = function() {
        this.html.hide()
    }, this.load_num_cards = function(a) {
        this.numcards = a
    }, this.drawMyCards = function() {
        for (var a = myGameArea.context, b = 0; b < this.numcards; b++) a.drawImage(anh[52], 200 + 30 * b, 40, 60, 80)
    }, this.danh_bai = function(a) {
        this.numcards = this.numcards - a.length, table.update_current_cards(a)
    }
}

function RightPlayer(a) {
    myGameArea.context;
    this.html = $("#right_player"), a ? (this.id = a.id, this.username = a.username, this.num_cards = a.num_cards, this.html.html(this.username), this.html.show()) : (this.id = null, this.html.html("Trong !"), this.html.hide()), this.go_table = function() {
        this.html.hide(), this.html.fadeIn(1e3)
    }, this.leave_table = function() {
        this.html.hide()
    }, this.load_num_cards = function(a) {
        this.numcards = a
    }, this.drawMyCards = function(a) {
        var b = myGameArea.context,
            d = 10 * (13 - this.numcards);
        for (c = 0; c < this.numcards; c++) b.drawImage(anh[53], 650, 100 + 20 * c + d, 80, 60)
    }, this.danh_bai = function(a) {
        this.numcards = this.numcards - a.length, table.update_current_cards(a)
    }
}

function BottomPlayer(a) {
    this.myCard = {}, this.slCard = {}, this.drawMyCards = function() {
        var a = 1,
            c = myGameArea.context;
        for (var d in this.myCard) this.slCard.hasOwnProperty(a) ? c.drawImage(anh[this.slCard[a]], 200 + 30 * (a - 1), 370, 60, 80) : c.drawImage(anh[this.myCard[d]], 200 + 30 * (a - 1), 380, 60, 80), a++
    }, this.getMyCards = function(a) {
        this.myCard = {};
        var b = 1;
        for (var c in a) this.myCard[b] = a[c], b++
    }, this.html = $("#bottom_player"), a ? (this.id = a.id, this.username = a.username, this.num_cards = a.num_cards, this.html.html(this.username), this.html.show()) : (this.id = null, this.html.html("Trong !"), this.html.hide()), this.go_table = function() {
        this.html.hide(), this.html.fadeIn(1e3)
    }, this.leave_table = function() {
        this.html.hide()
    }, this.load_num_cards = function(a) {
        $("#bottom_cards").html("");
        for (var b = 0; b < a; b++) $("#bottom_cards").append('<div class="card_item"></div>')
    }, this.danh_bai = function(a) {
        this.numcards = this.numcards - a.length, table.update_current_cards(a)
    }
}

function getNumPlayer(a) {
    var b = 0;
    return a.lplayer.id && b++, a.rplayer.id && b++, a.tplayer.id && b++, a.bplayer.id && b++, b
}

function sortCardByNumber(a, b) {
    for (var c = a.length; c > 0; c--)
        for (var d = 0; d < c - 1; d++)
            if (a[d].number > a[d + 1].number) {
                var e = a[d],
                    f = b[d];
                a[d] = a[d + 1], b[d] = b[d + 1], a[d + 1] = e, b[d + 1] = f
            }
    return b
}

function sortCardBySuite(a, b) {
    for (var c = a.length; c > 0; c--)
        for (var d = 0; d < c - 1; d++)
            if (a[d].rank > a[d + 1].rank) {
                var e = a[d],
                    f = b[d];
                a[d] = a[d + 1], b[d] = b[d + 1], a[d + 1] = e, b[d + 1] = f
            }
    return b
}

function sleep(a) {
    for (var b = (new Date).getTime(), c = 0; c < 1e7 && !((new Date).getTime() - b > a); c++);
}

function sound(a) {
    this.sound = document.createElement("audio"), this.sound.src = a, this.sound.setAttribute("preload", "auto"), this.sound.setAttribute("controls", "none"), this.sound.style.display = "none", document.body.appendChild(this.sound), this.play = function() {
        this.sound.play()
    }, this.stop = function() {
        this.sound.pause()
    }
}

function getPosOfCard(a) {
    var b = Object.size(table.bplayer.myCard),
        c = myGameArea.canvas.getBoundingClientRect(),
        d = a.clientX - c.left - 200;
    a.clientY - c.top - 400;
    return (d / 30 | 0) == b ? b - 1 : d / 30 | 0
}

function selectCard(a) {
    var b = getPosOfCard(a),
        c = Object.keys(table.bplayer.myCard);
    table.bplayer.slCard.hasOwnProperty(b + 1) ? delete table.bplayer.slCard[b + 1] : null !== table.bplayer.myCard[c[b]] && void 0 !== table.bplayer.myCard[c[b]] && (table.bplayer.slCard[b + 1] = table.bplayer.myCard[c[b]])
}

function updateGameArea() {
    myGameArea.clear(), table.drawPlayer(), table.bplayer.drawMyCards(), table.rplayer.id && table.rplayer.drawMyCards(), table.tplayer.id && table.tplayer.drawMyCards(), table.lplayer.id && table.lplayer.drawMyCards(), table.updateArea(), table.turn_id == table.bplayer.id && table.drawCountDown(100, 400), table.turn_id == table.rplayer.id && table.drawCountDown(750, 300), table.turn_id == table.lplayer.id && table.drawCountDown(20, 300), table.turn_id == table.tplayer.id && table.drawCountDown(650, 50)
}
OUT_TABLE = 1, PLAYER = 2, VISITOR = 3, PLAYING = 4, table = null, state_user = {
    1: "Ngoai sanh",
    2: "Nguoi choi",
    3: "Khach"
};
var anh = {},
    myGameArea = {
        canvas: document.createElement("canvas"),
        start: function() {
            this.canvas.width = 800, this.canvas.height = 500, this.context = this.canvas.getContext("2d"), document.body.insertBefore(this.canvas, document.body.childNodes[0])
        },
        clear: function() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }
    };
myGameArea.canvas.setAttribute("id", "deck"), PLAYING = 4, READY = 1, UNREADY = 2, state_table = {
    0: "Dang choi",
    1: "San sang bat dau choi",
    3: "Chua san sang"
};
var socket = io.connect();
socket.on("receive_notice", function(a) {
    alert(a)
}), socket.on("login_success", function(a) {
    for (var b in a) var c = a[b];
    $(".container").hide(), updateListTable(a), showListTableFrame()
}), socket.on("go_table_success", function(a, b) {
    $(".frame").hide(), $("#nav").hide(), $("#btn-leave-table").show(), myGameArea.start(), table = new Table(a, b), table.preLoadImages(), table.drawPlayer()
}), socket.on("leave_table_success", function(a) {
    $("#btn-play").hide(), $("#btn-throw").hide(), $("#btn-un-select").hide(), $("#btn-sort").hide(), $("#btn-start").hide(), $("#btn-leave-table").hide(), updateListTable(a), myGameArea.clear(), document.body.removeChild(document.getElementById("deck")), showListTableFrame()
}), socket.on("start_game_success", function() {}), socket.on("game_started", function() {
    $("#btn-sort").show(), $("#btn-un-select").show()
}), socket.on("danh_bai_success", function() {
    table.getPlayedCard(), table.play_sound.play(), table.stop_count_down = !0
}), socket.on("danh_bai_unsuccess", function() {}), socket.on("bo_luot_success", function() {}), socket.on("update_user-go_table", function(a, b, c) {
    table && (table.door_open.play(), table.addPlayer({
        id: a,
        username: b
    }, c), table.drawPlayer(), table.bplayer.pos == table.my_position && (null == table.lplayer.id && null == table.rplayer.id && null == table.tplayer.id || $("#btn-start").show()))
}), socket.on("update_user-leave_table", function(a, b) {
    table.drawPlayer(), table && table.removePlayer(b), a.state == UNREADY && $("#btn-start").hide()
}), socket.on("update_user-danh_bai", function(a, b) {
    table.bplayer.id == a, table.getPlayer(a).danh_bai(b)
}), socket.on("update_user-bo_luot", function(a) {}), socket.on("update_game-ready", function() {}), socket.on("update_game-unready", function() {}), socket.on("update_game-start", function(a, b) {
    table.bplayer.getMyCards(b), table.load_cards(a), table.start_game()
}), socket.on("update_game-finish", function(a) {
    $("#btn-sort").hide(), $("#btn-un-select").hide(), $("#btn-play").hide(), $("#btn-throw").hide(), table.state = a.state, a.state == READY && $("#btn-start").show();
    var b = 0;
    for (var c in a.stt) {
        if (table.bplayer.id == a.stt[c]) switch (b) {
            case 0:
                alert("Chien thang \n Score: " + (a.exist_card - c)), table.laughing_sound.play();
                break;
            case 1:
                alert("Thua cuoc \n Score: " + (a.exist_card - c));
                break;
            case 2:
                alert("Thua cuoc \n Score: " + (a.exist_card - c));
                break;
            case 3:
                alert("Thua cuoc \n Score: " + (a.exist_card - c))
        }
        b++
    }
    sleep(1e3), table.finish_game()
}), socket.on("update_game-ready", function() {}), socket.on("update_game-unready", function() {}), socket.on("update_game-new_turn", function(a) {
    table.sec = 400, table.stop_count_down = !1, table.turn_id = a, a == table.bplayer.id ? ($("#btn-play").show(), $("#btn-throw").show()) : ($("#btn-play").hide(), $("#btn-throw").hide())
}), socket.on("update_game-new_cycle", function(a) {
    table.sec = 400, table.stop_count_down = !1, table.cardsOnTable = {}, table.setOfCardsInCycle = [], table.turn_id = a, a == table.bplayer.id ? ($("#btn-play").show(), $("#btn-throw").show()) : ($("#btn-play").hide(), $("#btn-throw").hide())
}), j = 0;
var cardRank = ["bich", "nhep", "ro", "co"],
    cardNumber = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
$(document).ready(function() {
    $(".frame").hide(), $("#login_frame").show(), $("#register_form").submit(function() {
        socket.emit("register", $("#register_form #username").val(), $("#register_form #password").val(), $("#firstname").val(), $("#lastname").val())
    }), $("#login_form").submit(function() {
        return socket.emit("login", $("#login_form #username").val(), $("#login_form #password").val()), !1
    }), $(document).on("click", ".table_item", function() {
        var a = $(this).attr("table_id");
        socket.emit("go_table", a)
    }), $(document).on("click", "#btn-leave-table", function() {
        socket.emit("leave_table")
    }), $(document).on("click", "#btn-start", function() {
        socket.emit("start_game")
    }), $(document).on("click", "#btn-play", function() {
        table.sec = 400, socket.emit("danh_bai", obj2Arr(table.bplayer.slCard))
    }), $(document).on("click", "#btn-un-select", function() {
        table.bplayer.slCard = {}
    }), $(document).on("click", "#btn-throw", function() {
        table.sec = 400, table.stop_count_down = !0, socket.emit("bo_luot")
    }), $(document).on("click", "#btn-sort", function() {
        table.bplayer.slCard = {};
        for (var a = obj2Arr(table.bplayer.myCard), b = getCards(obj2Arr(table.bplayer.myCard)), c = 0, d = 0; d < b.length - 1 && !(b[d].number > b[d + 1].number); d++) c++;
        if (c == b.length - 1) {
            for (var e = [], c = 0, d = 0; d < b.length - 1; d++) b[d].number == b[d + 1].number ? c++ : c = 0, 3 == c && (null != a[d + 1] && void 0 != a[d + 1] && (e.push(a[d + 1]), a[d + 1] = null), null != a[d] && void 0 != a[d] && (e.push(a[d]), a[d] = null), null != a[d - 1] && void 0 != a[d - 1] && (e.push(a[d - 1]), a[d - 1] = null), null != a[d - 2] && void 0 != a[d - 2] && (e.push(a[d - 2]), a[d - 2] = null));
            for (var f = 0; f < b.length; f++) 15 == b[f].number && null != a[f] && void 0 != a[f] && (e.push(a[f]), a[f] = null);
            for (var g = b.length, d = 0; d < g; d++) null == a[d] && (a.splice(d, 1), b.splice(d, 1), d--, g--);
            sortCardBySuite(b, a);
            for (var d = 0; d < b.length - 1; d++)
                if (b[d].rank == b[d + 1].rank && b[d].number > b[d + 1].number) {
                    var h = b[d];
                    a[d];
                    b[d] = b[d + 1], a[d] = a[d + 1], b[d + 1] = h, a[d + 1] = h
                }
            c = 0;
            for (var d = 0; d < b.length - 1; d++)
                if (null != a[d] && void 0 != a[d] && null != a[d + 1] && void 0 != a[d + 1])
                    if (b[d].rank == b[d + 1].rank && b[d].number == b[d + 1].number - 1) c++;
                    else {
                        if (c > 1)
                            for (var j = c; j >= 0; j--) null != a[d - j] && void 0 != a[d - j] && (e.push(a[d - j]), a[d - j] = null);
                        c = 0
                    }
            for (var k = b.length, d = 0; d < k; d++) null == a[d] && (a.splice(d, 1), b.splice(d, 1), d--, k--);
            for (var l = sortCardByNumber(b, a), d = 0; d < l.length; d++) null != a[d] && void 0 != a[d] && (e.push(a[d]), a[d] = null);
            table.bplayer.getMyCards(e)
        } else {
            var m = sortCardByNumber(b, obj2Arr(table.bplayer.myCard));
            table.bplayer.getMyCards(m)
        }
    })
}), selected_cards = [], myGameArea.canvas.addEventListener("mousedown", selectCard, !1), Object.size = function(a) {
    var c, b = 0;
    for (c in a) a.hasOwnProperty(c) && b++;
    return b
};
