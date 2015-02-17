openerp.im_chat_custom = function(instance) {

    instance.im_chat_custom = {};

		var _t = openerp._t;
	    var _lt = openerp._lt;
	    var QWeb = openerp.qweb;
	    var NBR_LIMIT_HISTORY = 20;
	    var USERS_LIMIT = 20;
	    var im_chat = instance.im_chat;

	    im_chat.UserWidget = openerp.Widget.extend({
	        "template": "im_chat.UserWidget",
	        events: {
	            "click": "activate_user",
	        },
	        init: function(parent, user) {
	            this._super(parent);
	            this.set("id", user.id);
	            var person = (user.name).split(' ');
	            if (person.length >= 2){
					final_str = person[1][0]+person[1][1]+person[0][0];
				}else{
					final_str = person[0][0]+person[0][1];
				}
	            this.set("name", final_str);
	            this.set("im_status", user.im_status);
	            this.set("image_url", user.image_url);
	        },
	        start: function() {
	            this.$el.data("user", {id:this.get("id"), name:this.get("name")});
	            this.$el.draggable({helper: "clone"});
	            this.on("change:im_status", this, this.update_status);
	            this.update_status();

	        },
	        update_status: function(){
	            this.$(".oe_im_user_online").toggle(this.get('im_status') !== 'offline');
	            var img_src = (this.get('im_status') == 'away' ? '/im_chat/static/src/img/yellow.png' : '/im_chat/static/src/img/green.png');
	            this.$(".oe_im_user_online").attr('src', img_src);
	        },
	        activate_user: function() {
	            this.trigger("activate_user", this.get("id"));
	        },
	    });

	    im_chat.Conversation = openerp.Widget.extend({
	        className: "openerp_style oe_im_chatview",
	        events: {
	            "keydown input": "keydown",
	            "click .oe_im_chatview_close": "click_close",
	            "click .oe_im_chatview_header": "click_header"
	        },
	        init: function(parent, c_manager, session, options) {
	            this._super(parent);
	            this.c_manager = c_manager;
	            this.options = options || {};
	            this.loading_history = true;
	            this.set("messages", []);
	            this.set("session", session);
	            this.set("right_position", 0);
	            this.set("bottom_position", 0);
	            this.set("pending", 0);
	            this.inputPlaceholder = this.options.defaultInputPlaceholder;
	        },
	        start: function() {
	            var self = this;
	            self.$().append(openerp.qweb.render("im_chat.Conversation", {widget: self}));
	            self.$().hide();
	            self.on("change:session", self, self.update_session);
	            self.on("change:right_position", self, self.calc_pos);
	            self.on("change:bottom_position", self, self.calc_pos);
	            self.full_height = self.$().height();
	            self.calc_pos();
	            self.on("change:pending", self, _.bind(function() {
	                if (self.get("pending") === 0) {
	                    self.$(".oe_im_chatview_nbr_messages").text("");
	                } else {
	                    self.$(".oe_im_chatview_nbr_messages").text("(" + self.get("pending") + ")");
	                }
	            }, self));
	            // messages business
	            self.on("change:messages", this, this.render_messages);
	            self.$('.oe_im_chatview_content').on('scroll',function(){
	                if($(this).scrollTop() === 0){
	                    self.load_history();
	                }
	            });
	            self.load_history();
	            self.$().show();
	            // prepare the header and the correct state
	            self.update_session();
	        },
	        show: function(){
	            this.$().animate({
	                height: this.full_height
	            });
	            this.set("pending", 0);
	        },
	        hide: function(){
	            this.$().animate({
	                height: this.$(".oe_im_chatview_header").outerHeight()
	            });
	        },
	        calc_pos: function() {
	            this.$().css("right", this.get("right_position"));
	            this.$().css("bottom", this.get("bottom_position"));
	        },
	        update_fold_state: function(state){
	            return new openerp.Model("im_chat.session").call("update_state", [], {"uuid" : this.get("session").uuid, "state" : state});
	        },
	        update_session: function(){
	            // built the name
	            var names = [];
	            var final_stri = '';
	            _.each(this.get("session").users, function(user){
	                if( (openerp.session.uid !== user.id) && !(_.isUndefined(openerp.session.uid) && !user.id) ){
	                    names.push(user.name);
						var person1 = (user.name).split(' ');
						if (person1.length >= 2){
							final_stri = person1[1][0]+person1[1][1]+person1[0][0];
						}else{
							final_stri = person1[0][0]+person1[0][1];
						}

	                }
	            });
	            this.$(".oe_im_chatview_header_name").text(final_stri);
	            this.$(".oe_im_chatview_header_name").attr('title', final_stri);
	            // update the fold state
	            if(this.get("session").state){
	                if(this.get("session").state === 'closed'){
	                    this.destroy();
	                }else{
	                    if(this.get("session").state === 'open'){
	                        this.show();
	                    }else{
	                        this.hide();
	                    }
	                }
	            }
			},
	        load_history: function(){
	            var self = this;
	            if(this.loading_history){
	                var data = {uuid: self.get("session").uuid, limit: NBR_LIMIT_HISTORY};
	                var lastid = _.first(this.get("messages")) ? _.first(this.get("messages")).id : false;
	                if(lastid){
	                    data["last_id"] = lastid;
	                }
	                openerp.session.rpc("/im_chat/history", data).then(function(messages){
	                    if(messages){
	                        self.insert_messages(messages);
	    					if(messages.length != NBR_LIMIT_HISTORY){
	                            self.loading_history = false;
	                        }
	                    }else{
	                        self.loading_history = false;
	                    }
	                });
	            }
	        },
	        received_message: function(message) {
	            if (this.get('session').state === 'open') {
	                this.set("pending", 0);
	            } else {
	                this.set("pending", this.get("pending") + 1);
	            }
	            this.insert_messages([message]);
	        },
	        send_message: function(message, type) {
	            var self = this;
	            var send_it = function() {
	                return openerp.session.rpc("/im_chat/post", {uuid: self.get("session").uuid, message_type: type, message_content: message});
	            };
	            var tries = 0;
	            send_it().fail(function(error, e) {
	                e.preventDefault();
	                tries += 1;
	                if (tries < 3)
	                    return send_it();
	            });
	        },
	        insert_messages: function(messages){
	        	var self = this;
	            // avoid duplicated messages
	        	messages = _.filter(messages, function(m){ return !_.contains(_.pluck(self.get("messages"), 'id'), m.id) ; });
	            // escape the message content and set the timezone
	            _.map(messages, function(m){
	                if(!m.from_id){
	                    m.from_id = [false, self.options["defaultUsername"]];
	                }
	                m.message = self.escape_keep_url(m.message);
	                m.message = self.smiley(m.message);
	                m.create_date = Date.parse(m.create_date).setTimezone("UTC").toString("yyyy-MM-dd HH:mm:ss");
	                return m;
	            });
	           	this.set("messages", _.sortBy(this.get("messages").concat(messages), function(m){ return m.id; }));
	        },
	        render_messages: function(){
	            var self = this;
	            var res = {};
	            var last_date_day, last_user_id = -1;
	            _.each(this.get("messages"), function(current){
	                // add the url of the avatar for all users in the conversation
	                current.from_id[2] = openerp.session.url(_.str.sprintf("/im_chat/image/%s/%s", self.get('session').uuid, current.from_id[0]));
	                var peon = (current.from_id[1]).split(' ');

	                if (peon.length >= 2){
	            		var final_strin = peon[1][0] + peon[1][1] + peon[0][0];
	                	current.from_id[1] = final_strin;
	                }else{
	                	var fil_strin = peon[0][0] + peon[0][1];
						current.from_id[1] = fil_strin;
	                }

	                var date_day = current.create_date.split(" ")[0];
	                if(date_day !== last_date_day){
	                    res[date_day] = [];
	                    last_user_id = -1;
	                }
	                last_date_day = date_day;
	                if(current.type == "message"){ // traditionnal message
	                    if(last_user_id === current.from_id[0]){
	                        _.last(res[date_day]).push(current);
	                    }else{
	                        res[date_day].push([current]);
	                    }
	                    last_user_id = current.from_id[0];
	                }else{ // meta message
	                    res[date_day].push([current]);
	                    last_user_id = -1;
	                }
	            });
	            // render and set the content of the chatview
	            console.log("\n ressssssssssssssss", res);
	            this.$('.oe_im_chatview_content_bubbles').html($(openerp.qweb.render("im_chat.Conversation_content", {"list": res})));
	            this._go_bottom();
	        },
	        keydown: function(e) {
	            if(e && e.which !== 13) {
	                return;
	            }
	            var mes = this.$("input").val();
	            if (! mes.trim()) {
	                return;
	            }
	            this.$("input").val("");
	            this.send_message(mes, "message");
	        },
	        get_smiley_list: function(){
	            var kitten = jQuery.deparam !== undefined && jQuery.deparam(jQuery.param.querystring()).kitten !== undefined;
	            var smileys = {
	                ":'(": "&#128546;",
	                ":O" : "&#128561;",
	                "3:)": "&#128520;",
	                ":)" : "&#128522;",
	                ":D" : "&#128517;",
	                ";)" : "&#128521;",
	                ":p" : "&#128523;",
	                ":(" : "&#9785;",
	                ":|" : "&#128528;",
	                ":/" : "&#128527;",
	                "8)" : "&#128563;",
	                ":s" : "&#128534;",
	                ":pinky" : "<img src='/im_chat/static/src/img/pinky.png'/>",
	                ":musti" : "<img src='/im_chat/static/src/img/musti.png'/>",
	            };
	            if(kitten){
	                _.extend(smileys, {
	                    ":)" : "&#128570;",
	                    ":D" : "&#128569;",
	                    ";)" : "&#128572;",
	                    ":p" : "&#128573;",
	                    ":(" : "&#128576;",
	                    ":|" : "&#128575;",
	                });
	            }
	            return smileys;
	        },
	        smiley: function(str){
	            var re_escape = function(str){
	                return String(str).replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1');
	             };
	             var smileys = this.get_smiley_list();
	            _.each(_.keys(smileys), function(key){
	                str = str.replace( new RegExp("(?:^|\\s)(" + re_escape(key) + ")(?:\\s|$)"), ' <span class="smiley">'+smileys[key]+'</span> ');
	            });
	            return str;
	        },
	        escape_keep_url: function(str){
	            var url_regex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi;
	            var last = 0;
	            var txt = "";
	            while (true) {
	                var result = url_regex.exec(str);
	                if (! result)
	                    break;
	                txt += _.escape(str.slice(last, result.index));
	                last = url_regex.lastIndex;
	                var url = _.escape(result[0]);
	                txt += '<a href="' + url + '" target="_blank">' + url + '</a>';
	            }
	            txt += _.escape(str.slice(last, str.length));
	            return txt;
	        },
	        _go_bottom: function() {
	            this.$(".oe_im_chatview_content").scrollTop(this.$(".oe_im_chatview_content").get(0).scrollHeight);
	        },
	        add_user: function(user){
	            return new openerp.Model("im_chat.session").call("add_user", [this.get("session").uuid , user.id]);
	        },
	        focus: function() {
	            this.$(".oe_im_chatview_input").focus();
	        },
	        click_header: function(){
	            this.update_fold_state();
	        },
	        click_close: function(event) {
	            event.stopPropagation();
	            this.update_fold_state('closed');
	        },
	        destroy: function() {
	            this.trigger("destroyed", this.get('session').uuid);
	            return this._super();
	        }
	    });
	}