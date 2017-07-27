// validation regexes ans functions to test against

const regex = {
    email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!$%@#£€*?&]{6,}$/ // passwords need to have numbers and letters and six chars, but we're not very strict about special letters and capitalisation
};

module.exports = {
    regex,
    email: (email) => {
        return regex.email.test(email);
    },
    password: (pass) => {
        return regex.password.test(pass);
    }
}