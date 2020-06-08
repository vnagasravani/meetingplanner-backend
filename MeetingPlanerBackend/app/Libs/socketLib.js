const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const logger = require('./loggerLib');
const events = require('events');
const tokenLib = require("./tokenLib");
const check = require("./checkLib");
const response = require('./responseLib');
const time = require('./timeLib');
const redisLib = require("./redisLib");
const emailLib = require('../Libs/emailLib');
const notificationModel = mongoose.model('notificationModel')
const userModel = mongoose.model('userModel');

let setServer = (server) => {

    let io = socketio.listen(server);
    let myio = io.of('/');

    myio.on('connection', (socket) => {
        socket.emit('verify', '');

        socket.on('set-user', (AuthToken) => {
            console.log(AuthToken)
            tokenLib.verifyClaimWithoutSecret(AuthToken, (err, Detail) => {
                if (err) {
                    socket.emit('get-errors', { status: 500, message: 'error occured while verifying authtoken' })

                }
                else {
                    if (Detail.data.adminId) {

                        let adminInfo = Detail.data;
                        let userId = adminInfo.adminId;
                        let userName = adminInfo.userName;
                        socket.userId = userId;
                        allInOne(userId, userName)
                    }
                    else {
                        let userInfo = Detail.data;
                        let userId = userInfo.userId;
                        let userName = userInfo.firstName;
                        socket.userId = userId
                        allInOne(userId, userName)
                    }
                    function allInOne(userId, userName) {
                        redisLib.setANewOnlineUserInHash('all-user-in-one', userId, userName, (err, userList) => {
                            if (err) {
                                socket.emit('get-errors', { status: 500, message: 'error occured while adding user in online-list' })
                            }
                            else {
                                redisLib.getAllUsersInAHash('all-user-in-one', (err, allOnlineUsers) => {
                                    if (err) {
                                        socket.emit('get-errors', { status: 500, message: 'error occured while getting users from online-list' })
                                    }
                                    else {
                                        console.log(userName + 'is online');
                                        socket.join('meeting');
                                        myio.to('meeting').emit('online-user-list', allOnlineUsers);
                                    }
                                })
                            }
                        })
                    }
                }

            })
        })
        socket.on('disconnect', () => {

            if (socket.userId) {

                redisLib.deleteUserFromHash('all-user-in-one', socket.userId);
                redisLib.getAllUsersInAHash('all-user-in-one', (err, allOnlineUsers) => {
                    if (err) {
                        socket.emit('get-errors', { status: 500, message: 'error occured while getting users from online-list' })

                    }
                    else {
                        socket.leave('meeting');
                        myio.to('meeting').emit('online-user-list', allOnlineUsers);
                    }
                })

            }

        })

        socket.on('user-message', (message) => {

            if (!message.notificationId) {
                message.notificationId = shortid.generate();
                notificationModel.findOne({ 'notificationId': message.notificationId }, (err, newMessage) => {
                    if (err) {
                        socket.emit('get-errors', { status: 500, message: 'error occured while finding message in message-list' })
                    }
                    else if (check.isEmpty(newMessage)) {
                        let event = new notificationModel({
                            notificationId: message.notificationId,
                            title: message.title,
                            userId: message.userId,
                            description: message.description,
                            userName: message.userName,
                            alert: message.alert,
                            userEmailId: message.userEmailId,
                            adminId: message.adminId,
                            adminName: message.adminUserName,
                            start: message.start,
                            end: message.end,
                            color: { primary: message.color.primary, secondary: message.color.secondary },
                            draggable: message.draggable,
                            resizable: { beforeStart: message.resizable.beforeStart, afterEnd: message.resizable.afterEnd },
                        })
                        event.save((err, result) => {
                            if (err) {
                                socket.emit('get-errors', { status: 500, message: 'error occured while saving message in message-list' })
                            }
                            else {
                                let apiResponse = response.generate(false, `${result.title} meeting is created by ${result.adminName}`, 200, result)
                                setTimeout(() => {
                                    socket.broadcast.emit(message.userId, apiResponse);
                                }, 1000);
                                let email = {
                                    email: result.userEmailId,
                                    subject: `new meeting schedule "${result.title}" has been created by ${result.adminName} `,
                                    html: `<h3>hi ${result.userName} </h3><br>
                                <p> please check new created meeting schedule </p><br>
                                Meeting Planner<br>
                                <b>Hemanth Reddy</b>
                                `
                                }
                                setTimeout(() => {
                                    emailLib.sendEmail(email);
                                }, 2000)
                            }
                        })
                    }
                })
            }
            else {
                notificationModel.update({ 'notificationId': message.notificationId }, message, { multi: true }, (err, updatedMessage) => {
                    if (err) {
                        socket.emit('get-errors', { status: 500, message: 'error occured while updating message in message-list' })
                    }
                    else if (check.isEmpty(updatedMessage)) {
                        socket.emit('get-errors', { status: 500, message: 'empty message' })
                    }
                    else {
                        let apiResponse = response.generate(false, `${message.title} meeting is updated by ${message.adminName}`, 200, null)
                        setTimeout(() => {
                            socket.broadcast.emit(message.userId, apiResponse);
                        }, 1000);
                        let email = {
                            email: message.userEmailId,
                            subject: `your meeting name "${message.title}" has been updated by ${message.adminName} `,
                            html: `<h3>hi ${message.userName} </h3><br>
                        <p>please check updated meeting schedule </p>
                        Meeting Planner<br>
                        <b>Hemanth Reddy</b>
                        
                        `
                        }
                        setTimeout(() => {
                            emailLib.sendEmail(email);
                        }, 2000);
                    }
                })
            }
        })
        socket.on('delete-message', (event) => {
            notificationModel.findOneAndRemove({ 'notificationId': event.notificationId }, (err, result) => {
                if (err) {
                    socket.emit('get-errors', { status: 500, message: 'error occured while deleting message from message-list' })
                }
                else {
                    let apiResponse = response.generate(false, `${event.title} meeting is deleted by ${event.adminName}`, 200, null)
                    setTimeout(() => {
                        socket.broadcast.emit(event.userId, apiResponse);
                    }, 1000);

                }

            })

        })

        socket.on('get-reminder', (meeting) => {
            if (meeting.alert == true) {
                setTimeout(() => {
                    socket.broadcast.emit(meeting.userId, meeting);
                }, 1000);
            }
        })

        socket.on('stop-reminder', (data) => {
            notificationModel.updateOne({ 'notificationId': data.notificationId }, { alert: true }, (err, result) => {
                if (err) {
                    socket.emit('get-errors', { status: 500, message: 'error occured while updating message list' })
                }
                else if (check.isEmpty(result)) {
                    socket.emit('get-errors', { status: 500, message: 'no message detail found' })
                }
                else {
                    let apiResponse = response.generate(false, `reminder for "${data.title}" meeting has been stopped by ${data.userName}`, 200, null)
                    socket.to('meeting').broadcast.emit(data.adminId, apiResponse);
                }
            })
        })
        socket.on('send-message-offline', (message) => {
            let sms = {
                email: message.userEmailId,
                subject: `Reminder!! less than 3 minutes left to start "${message.title}" meeting`,
                name: message.userName,
                html: `<h3>did you forget someting? </h3><br>
                <h4>according to your meeting schedule you have meeting within 3 minutes plz be on time </h4><br>
                <b>Hemanth Reddy</b>
                `
            }
            setTimeout(() => {
                emailLib.sendEmail(sms);
            }, 2000)
        })

        socket.on('user-profile-upload', (data) => {
            let options = {
                profilePic: true
            }
            userModel.update({ userId: data.userId }, options).exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'User Controller:profileUploadFunction', 10)
                    let apiResponse = response.generate(true, 'Failed To upload profile photo', 500, null)
                    socket.emit('profile-uploaded', apiResponse);

                } else if (check.isEmpty(result)) {
                    logger.info('No User Found with given Details', 'User Controller: profileUploadFunction')
                    let apiResponse = response.generate(true, 'No user found to upload profile photo', 404, null)
                    socket.emit('profile-uploaded', apiResponse);
                } else {
                    let apiResponse = response.generate(false, 'Profile photo uploaded successfully', 200, result)
                    socket.emit('profile-uploaded', apiResponse);
                }
            });
        })
    })


}















module.exports = {
    setServer: setServer
}