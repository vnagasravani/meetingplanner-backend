'use strict';

const nodemailer = require('nodemailer');


let sendEmail = (sendEmailOptions) => {

    let account = {
        user: 'MeetingPlanner2020@gmail.com',
        pass: 'Vue@1508'
    }

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: account.user,
            pass: account.pass
        }
    });

    let mailOptions = {
        from: '"Meeting Planner " MeetingPlanner2020@gmail.com',
        to: sendEmailOptions.email, // list of receivers
        subject: sendEmailOptions.subject, // Subject line
        text: `Dear ${sendEmailOptions.name}`,
        html: sendEmailOptions.html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        else {
            console.log('Message sent successfully.', info);
        }

    });

}

module.exports = {
    sendEmail: sendEmail
}
