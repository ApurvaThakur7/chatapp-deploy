const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,//allows you to create a relationship between documents in different collections (schemas)
        ref:'user'
    },
    receiver_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    message:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true,
        default: 'text'
    },
},
{timestamps:true}
);

module.exports= mongoose.model('chat', chatSchema);