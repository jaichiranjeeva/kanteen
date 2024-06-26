require('dotenv').config()
const express = require('express')
const verifyUser = express.Router()
const User = require('../models/User')
const userConnections = require('../utils')
const sendOtpVerificationMail = require('../authenticators/OtpVerification')
const bcrypt = require('bcrypt');

verifyUser.post('/mail', async (req, res) => {
    try {
        let { emailId } = req.body;
        emailId = emailId.toLowerCase();
        const existingUser = await User.findOne({ emailId: emailId });
        if (existingUser) {
            return res.status(409).json({ message: "Oops! It looks like that email address is already registered. Please use a different email to sign up.", success: false });
        }
        else {
            res.status(202).json({ message: "Email is valid and available for registeration. Proceeding with Verification...", success: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
})

verifyUser.get('/verify-mail', async (req, res) => {
    try {
        let { token, emailId } = req.query;
        emailId = emailId.toLowerCase();
        if (!token) {
            return res.status(400).send({ message: "Token is required", success: false })
        }
        if (userConnections[emailId] && userConnections[emailId].token === token) {
            userConnections[emailId].verified = true;
            userConnections[emailId].ws.send(JSON.stringify({ message: "Email Verified", success: true, type: "verified" }));
            res.status(200).send({ message: "Email Verified, Redirecting to registeration page..", success: true })
        }
        else {
            res.status(400).send({ message: "Token Invalid", success: false })
        }
    } catch (error) {
        console.log(error);
        res.status(400).send({ message: "Error in verifying email", success: false })
    }
})

verifyUser.post('/forgot-mail', async (req, res) => {
    try {
        let { emailId } = req.body;
        emailId = emailId.toLowerCase();
        const existingUser = await User.findOne({ emailId: emailId });
        if (!existingUser) {
            return res.status(404).json({ message: "Email is not registered, Please sign up", success: false });
        }
        else {
            let otp = Math.floor(100000 + Math.random() * 900000);
            sendOtpVerificationMail(emailId, otp,existingUser.name);
            res.status(200).json({ message: "Otp sent sucessfully, Redirecting to confirmation page..", success: true, otp: otp });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
verifyUser.put('/update-password', async (req, res) => {
    try{
        let {emailId,password} = req.body;
        emailId = emailId.toLowerCase();
        const salt = await bcrypt.genSalt(10);
        const Hashedpassword = await bcrypt.hash(password, salt);
        const user = await User.findOneAndUpdate({
            emailId: emailId
        },{
            password:Hashedpassword
        });
        res.status(200).send({message:"Password Updated Successfully, Please login again with new password..",success:true});
    }catch(err){
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
verifyUser.post('/resend-mail', async (req, res) => {
    try {
            let { emailId } = req.body;
            emailId = emailId.toLowerCase();
            const existingUser = await User.findOne({ emailId: emailId });
            let otp = Math.floor(100000 + Math.random() * 900000);
            sendOtpVerificationMail(emailId, otp,existingUser.name);
            res.status(200).json({ message: "Otp sent sucessfully", success: true, otp: otp });
        
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
verifyUser.put('/update', async (req, res) => {
    try {
        let { emailId, name, mobileNumber } = req.body;
        console.log(emailId, name, mobileNumber);
        emailId = emailId.toLowerCase();
        const user = await User.findOneAndUpdate({
            emailId: emailId
        }, {
            name: name,
            mobileNumber: mobileNumber
        });
        res.status(200).send({ message: "Profile Updated Successfully", success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
verifyUser.put('/updatepassword', async (req, res) => {
    try{
        let {emailId,password,currentpassword} = req.body;
        emailId = emailId.toLowerCase();
        const user = await  User.findOne({emailId:emailId})
        const isMatch = await bcrypt.compare(currentpassword, user.password);
        if (!isMatch) {
            return res.status(401).send({ message: "Invalid Credentials", success: false });
        }else{
            const salt = await bcrypt.genSalt(10);
            const Hashedpassword = await bcrypt.hash(password, salt);
            const user = await User.findOneAndUpdate({
                emailId: emailId
            },{
                password:Hashedpassword
            });
            res.status(200).send({message:"Password Updated Successfully, Please login again with new password..",success:true});
        }
    }catch(err){
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
module.exports = verifyUser;