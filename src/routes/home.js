const express = require('express');
const router = express.Router();

const homeController = require('../controller/HomeController');

// Check login
function checkLogin(req, res, next) {
    var cookie = req.cookies.rememberCookie;
    // console.log(cookie);
    if (req.session.loggedin || cookie !== undefined) {
        next();
    } else {
        res.redirect('/login');
    }
}

// GET method
router.get('/', checkLogin, homeController.show);
router.get('/download', checkLogin, homeController.downloadFile);
router.get('/delete', checkLogin, homeController.deleteFile);

// POST method
router.post('/upload', checkLogin, homeController.uploadFile);
router.post('/create', checkLogin, homeController.createFile);
router.post('/createDir', checkLogin, homeController.createFolder);
router.post('/rename', checkLogin, homeController.rename);

router.get('/error', (req, res) => {
    res.render('error', {
        title: "Lỗi"
    });
})


module.exports = router;