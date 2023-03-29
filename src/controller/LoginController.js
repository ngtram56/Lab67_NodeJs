const connection = require('../database/Connection');

const bcrypt = require('bcrypt');
const saltRounds = 10;

class LoginController {
    // Login
    loginGet(req, res) {
        res.render('login', {
            username: '',
            password: '',
            success: req.flash('success'),
            error: req.flash('error'),
            csrfToken: req.csrfToken(),
            title: 'Trang đăng nhập'
        });
    };

    loginPost(req, res) {
        if (!req.form.isValid) {
            let flashmsg = [];
            // Handle errors
            let errors = new Set(req.form.errors);
            messageHandler(errors, flashmsg)
            // console.log(flashmsg);

            res.render('login', {
                errorLogin: flashmsg,
                username: req.form.username,
                password: req.form.password,
                title: 'Trang đăng nhập',
            });

        } else {
            let account = req.body;
            let username = account.username;
            let password = account.password;

            var sql = 'SELECT password FROM user WHERE username=?';
            connection.query(sql, username, function (error, result) {
                if (error) throw error;
                if (result.length > 0) {
                    var password_db = result[0].password
                    bcrypt.compare(password, password_db, function (err, matchPassword) {
                        if (matchPassword) {
                            // Authenticate the user
                            req.session.loggedin = true;
                            req.session.username = username;
                            // Check remember
                            if (account.remember === 'on') {
                                res.cookie('rememberCookie',username, { maxAge: 60 * 60 * 24, httpOnly: true });
                            }
                            // Redirect to home page
                            req.flash('success', 'Đăng nhập thành công');
                            res.redirect('/');
                        } else {
                            let flashmsg = ['Sai mật khẩu đăng nhập.'];
                            res.render('login', {
                                errorLogin: flashmsg,
                                username: req.form.username,
                                password: req.form.password,
                                title: 'Trang đăng nhập',
                            });
                        }
                    });
                } else {
                    let flashmsg = ['Sai tên đăng nhập.'];
                    res.render('login', {
                        errorLogin: flashmsg,
                        username: req.form.username,
                        password: req.form.password,
                        title: 'Trang đăng nhập',
                    });
                }
            });

        }
    }

    // Logout
    logout(req, res) {
        res.clearCookie("rememberCookie");
        req.session.loggedin = false;
        req.flash('success', 'Đăng xuất tài khoản thành công.');
        res.redirect('/');
    }

    // Register
    registerGet(req, res) {
        res.render('register', {
            username: '',
            email: '',
            password: '',
            conf_password: '',
            csrfToken: req.csrfToken(),
            title: 'Trang đăng ký'
        });
    }

    registerPost(req, res) {
        if (!req.form.isValid) {
            let flashmsg = []
            // Handle errors
            let errors = new Set(req.form.errors);
            messageHandler(errors, flashmsg)

            res.render('register', {
                errorRegister: flashmsg,
                username: req.form.username,
                email: req.form.email,
                password: req.form.password,
                conf_password: req.form.confirm_password,
                title: 'Trang đăng ký',
            });

        } else {
            let account = req.body;
            let username = account.username
            let email = account.email
            let password = account.password

            var sql = 'SELECT * FROM user WHERE username=?'
            connection.query(sql, username, function (err, result) {
                if (err) throw error

                if (result.length == 0) {
                    bcrypt.genSalt(saltRounds, function (err, salt) {
                        bcrypt.hash(password, salt, function (err, hashpassword) {
                            let accRegister = [username, email, hashpassword]
                            // console.log(accRegister);
        
                            var sql = 'INSERT INTO user(username, email, password) VALUES(?, ?, ?)';
                            connection.query(sql, accRegister, function (error) {
                                if (error) {
                                    let flashmsg = ['Đăng ký tài khoản không thành công. Error: ' + error.message];
                                    res.render('register', {
                                        errorRegister: flashmsg,
                                        title: 'Trang đăng ký',
                                    });
                                } else {
                                    let flashmsg = 'Đăng ký tài khoản thành công.';
                                    res.render('login', {
                                        successRegister: flashmsg,
                                        title: 'Trang đăng nhập',
                                    });
                                }
                            });
                        });
                    });
                } else {
                    let flashmsg = ['Tên người dùng đã tồn tại.'];
                    res.render('register', {
                        errorRegister: flashmsg,
                        username: account.username,
                        email: account.email,
                        password: account.password,
                        conf_password: account.confirm_password,
                        title: 'Trang đăng ký'
                    });
                }
            });
        }
    }
}

function messageHandler(errors, flashmsg) {
    if (errors.has('username is required')) {
        flashmsg.push('Tên người dùng không được bỏ trống.');
    }
    if (errors.has('username has invalid characters')) {
        flashmsg.push('Tên người dùng chứa ký tự đặc biệt hoặc không đúng định dạng.');
    }
    if (errors.has('email is required')) {
        flashmsg.push('Email không được bỏ trống.');
    }
    if (errors.has('email is not an email address')) {
        flashmsg.push('Địa chỉ email không hợp lệ.');
    }
    if (errors.has('password is required')) {
        flashmsg.push('Mật khẩu không được bỏ trống.');
    }
    if (errors.has('password is too short')) {
        flashmsg.push('Mật khẩu phải chứa ít nhất 6 ký tự.');
    }
    if (errors.has('confirm_password is required')) {
        flashmsg.push('Mật khẩu xác nhận không được bỏ trống.');
    }
    if (errors.has('confirm_password does not equal password')) {
        flashmsg.push('Mật khẩu xác nhận không khớp với mật khẩu.');
    }
}


module.exports = new LoginController;