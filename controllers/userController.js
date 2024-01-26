const User = require('../models/userModel'); 
const Chat = require('../models/chatModel'); 
const Group = require('../models/groupModel');
const bcrypt = require('bcrypt');
const groupModel = require('../models/groupModel');


  
const registerLoad = async(req, res) => {
  try{
     
      res.render('register');
  }
      catch(error){
      console.log(error.message);
  }

  }
  

const register = async (req, res) => {
  try {
    
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      image: 'image/' + req.file.filename,
      password: passwordHash
    });

    
    await user.save();

    res.render('register', { message: 'Registration is successful!' });
  } catch (error) {
    console.error(error);
    res.render('register', { error: 'Internal server error' });
  }
}

const loadLogin = async(req, res) =>{
    try{
        res.render('login');
    }
    catch (error) {
        console.log(error.message);
        
    }
}



const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    req.session.user = user; 
    return res.redirect('/dashboard');
  } catch (error) {
    console.error(error.message);
    res.render('login', { error: 'Internal server error' });
  }
}






const logout = async (req, res) => {
    try {
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.render('dashboard', { error: 'Failed to log out' });
        }
  
        
        res.redirect('/login');
      });
    } catch (error) {
      console.error(error.message);
      res.render('dashboard', { error: 'Internal server error' });
    }
  }

  const loadDashboard = async (req, res) => {
    try {
        const users = await User.find({ _id: { $nin: [req.session.user._id] } });

        
        res.render('dashboard', { user: req.session.user, users: users });
    } catch (error) {
        console.error(error.message);
    }
}

const saveChat= async (req, res) => {
  try {

      var chat =  await new Chat ({
      sender_id:req.body.sender_id,
      receiver_id:req.body.receiver_id,
      message:req.body.message,
    });

    var newChat = await chat.save();
    res.status(200).send({ success: true, msg:'chat successful', data : newChat });
    console.log('Sender ID:', req.body.sender_id);
    console.log('Receiver ID:', req.body.receiver_id);
    console.log('Message:', req.body.message);

  } catch (error) {
    console.error('Error saving chat:', error);
    res.status(400).send({ success: false, msg: error.message });
}

}

const loadGroups = async (req, res) => {
  try {
  
    const groups = await Group.find();
    console.log(groups);

    
    res.render('group', { groups: groups });
  } catch (error) {
    console.error(error.message);
    
    res.status(500).send('Internal Server Error');
  }
}


const createGroup = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user._id) {
      
      return res.redirect('/login');
    }

    const group = new Group({
      creator_id: req.session.user._id,
      name: req.body.name,
      limit: req.body.memberLimit,
    });
    await group.save();

    const updatedGroups = await Group.find({ creator_id: req.session.user._id });

    res.render('group', { message: req.body.name + ' group has been created successfully', groups: updatedGroups });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};



const groupChatPage = async (req, res) => {
    const groupName = req.params.groupName;

    
    res.render('groupchat', { user:User, groupName: groupName/*, group: group if needed */ });
};

module.exports = {
  registerLoad,
  register,
  loadDashboard,
  loadLogin,
  logout,
  login,
  saveChat,
  loadGroups,
  createGroup,
  groupChatPage
};
