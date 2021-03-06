const express = require('express');
const bcrypt = require('bcrypt');

const AccountModel = require('../models/account');

/**
 * Signup action
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
exports.signup = (req, res) => {
    /**
     * @type {Promise<string[]>}
     */
    const action = new Promise((resolve, reject) => {
        if (req.body.username && req.body.email && req.body.password) {
            const verification = {
                isUsernameError: !(req.body.username && req.body.username.length >= 3),
                isEmailError: !(req.body.email && req.body.email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)),
                isPasswordError: !(req.body.password && req.body.password.length >= 8),
            };

            if (!verification.isUsernameError && !verification.isEmailError && !verification.isPasswordError) {
                const findSimilarAccounts = AccountModel.find({
                    $or: [
                        { username: req.body.username },
                        { email: req.body.email },
                    ]
                });

                findSimilarAccounts
                    .then(accounts => {
                        if (accounts.length > 0) {
                            const errors = [];

                            accounts.forEach(account => {
                                if (account.username === req.body.username) {
                                    errors.push('There is already an account with this username.');
                                }

                                if (account.email === req.body.email) {
                                    errors.push('There is already an account with this email.');
                                }
                            });

                            reject(errors);
                        } else {
                            resolve();

                            const encryptPassword = bcrypt.hash(req.body.password, 10);

                            encryptPassword
                                .then(encryptedPassword => {
                                    const account = new AccountModel({
                                        username: req.body.username,
                                        email: req.body.email,
                                        password: encryptedPassword,
                                    });

                                    const accountSaving = account.save();

                                    accountSaving
                                        .then(() => {
                                            console.log(`New account: ${req.body.username} <${req.body.email}>`);
                                        })
                                        .catch(err => {
                                            console.log(err);
                                        });
                                })
                                .catch(err => {
                                    console.log(err);

                                    reject(["An error occured."]);
                                });
                        }
                    })
                    .catch(err => {
                        console.log(err);

                        reject(["An error occured."]);
                    })
            } else {
                reject(["Inputs doesn't match the requirements."]);
            }
        } else {
            reject(['Please complete the form before sending it.']);
        }
    });

    action
        .then(() => {
            res.end(JSON.stringify({
                success: true
            }));
        })
        .catch(err => {
            res.end(JSON.stringify({
                success: false,
                errors: err
            }));
        });
};

/**
 * Login action
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 */
exports.login = (req, res) => {
    /**
     * @type {Promise<string[]>}
     */
    const action = new Promise((resolve, reject) => {
        if (req.body.email && req.body.password) {
            const verification = {
                isEmailError: !(req.body.email && req.body.email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)),
                isPasswordError: !(req.body.password && req.body.password.length >= 8),
            };

            if (!verification.isEmailError && !verification.isPasswordError) {
                const findSimilarAccounts = AccountModel.findOne({
                    email: req.body.email
                }, "password");

                const credentialsError = "This credentials doesn't match with an existing account or the account doesn't exists.";

                findSimilarAccounts
                    .then(account => {
                        if (!account) {
                            reject([credentialsError]);
                        } else {
                            const checkPassword = bcrypt.compare(req.body.password, account.password)

                            checkPassword
                                .then(same => {
                                    if (same) {
                                        resolve();
                                    } else {
                                        reject([credentialsError]);
                                    }
                                })
                                .catch(err => {
                                    console.log(err);

                                    reject([credentialsError]);
                                });
                        }
                    }).catch(err => {
                        console.log(err);

                        reject(["An error occured."]);
                    });
            } else {
                reject(["Inputs doesn't match the requirements."]);
            }
        } else {
            reject(['Please complete the form before sending it.']);
        }
    });

    action
        .then(() => {
            res.end(JSON.stringify({
                success: true
            }));
        })
        .catch(err => {
            res.end(JSON.stringify({
                success: false,
                errors: err
            }));
        });
};