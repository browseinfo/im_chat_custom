openerp.im_chat_custom = function(instance) {

  //  instance.im_chat_custom = {};

    var _t = openerp._t;
    var _lt = openerp._lt;
    var QWeb = openerp.qweb;
    var NBR_LIMIT_HISTORY = 20;
    var USERS_LIMIT = 20;
    var im_chat = instance.im_chat;

    im_chat.UserWidget.include({
        init: function(parent, user) {
            this._super.apply(this, arguments);
            this.set("id", user.id);
            if (!user.user_code) {
                this.set("name", user.name);
            } else {
                this.set("name", user.user_code);
            }
            this.set("im_status", user.im_status);
            this.set("image_url", user.image_url);
        },
    });

    im_chat.Conversation.include({
        update_session: function(){
            // built the name
            var names = [];
            _.each(this.get("session").users, function(user){
                if( (openerp.session.uid !== user.id) && !(_.isUndefined(openerp.session.uid) && !user.id) ){
                    if (user.user_code) {
                        names.push(user.user_code);
                    } else {
                        names.push(user.name);
                    }
                }
            });
            this.$(".oe_im_chatview_header_name").text(names.join(", "));
            this.$(".oe_im_chatview_header_name").attr('title', names.join(", "));
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
        render_messages: function(){
            var self = this;
            var res = {};
            var last_date_day, last_user_id = -1;
            _.each(this.get("messages"), function(current){
                _.each(self.get('session').users, function(user) {
                    if (current.from_id[0] == user.id) {
                        if (user.user_code) {
                            current.from_id[1] = user.user_code;
                        } else {
                            current.from_id[1] = user.name;
                        }
                    }
                });
                // add the url of the avatar for all users in the conversation
                current.from_id[2] = openerp.session.url(_.str.sprintf("/im_chat/image/%s/%s", self.get('session').uuid, current.from_id[0]));
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
            this.$('.oe_im_chatview_content_bubbles').html($(openerp.qweb.render("im_chat.Conversation_content", {"list": res})));
            this._go_bottom();
        },
    });
}