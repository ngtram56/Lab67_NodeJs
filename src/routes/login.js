const express = require('express');
const router = express.Router();

const loginController = require('../controller/LoginController');
const {
    formLoginValid,
    formRegisterValid
} = require('../middlewares/ValidateForm');

// GET method
router.get('/login', loginController.loginGet);
router.get('/register', loginController.registerGet);
router.get('/logout', loginController.logout);

// POST method
router.post('/login', formLoginValid, loginController.loginPost);
router.post('/register', formRegisterValid, loginController.registerPost);



module.exports = router;