const form = require('express-form');
const field = form.field;

const formLoginValid = form(
    field("username").trim().required(),
    field("username").trim().is(/^[a-zA-Z0-9]+(([',. -][a-zA-Z0-9])?[a-zA-Z0-9]*)*$/),
    field("password").required()
)

const formRegisterValid = form(
    field("username").trim().required(),
    field("username").trim().is(/^[a-zA-Z0-9]+(([',. -][a-zA-Z0-9])?[a-zA-Z0-9]*)*$/),
    field("email").trim().required(),
    field("email").trim().isEmail(),
    field("password").trim().required(),
    field("password").trim().minLength(6),
    field("confirm_password").trim().required(),
)


module.exports = { formLoginValid, formRegisterValid };