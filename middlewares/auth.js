const isLogin = async (req, res, next) => {
  try {
    if (req.session.user) {}
    else{ 
      res.redirect('/login');
    }
    next();
  } catch (error) {
    console.log('Error in isLogin middleware:', error.message);
  }
}

const isLogout = async (req, res, next) => {
  try {

    if (req.session.user) {
      res.redirect('/dashboard');
    }
    next();
  } catch (error) {
    console.log('Error in isLogout middleware:', error.message);
  }
};

module.exports = {
  isLogin,
  isLogout
}


