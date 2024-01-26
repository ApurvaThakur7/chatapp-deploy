const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    creator_id:{
        type:mongoose.Schema.Types.ObjectId,//allows you to create a relationship between documents in different collections (schemas)
        ref:'user'
    },
    name:{
        type:String,
        required:true
    },
    // image:{
    //     type:String,
    //     required:true
    // },
    limit:{
        type:Number,
        required:true
    }
    
},
{timestamps:true}
);

module.exports= mongoose.model('Group', groupSchema);