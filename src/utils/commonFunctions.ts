import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import config from '../config';
import { Constants } from '../commons/constants';
import mongoose from 'mongoose';

const transporter = nodemailer.createTransport(config.SMTP.TRANSPORT);

/**
 * function to convert an error into a readable form.
 * @param {} error
 */
export const convertErrorIntoReadableForm = (error: any) => {
	let errorMessage = '';
	if (error.message.indexOf('[') > -1) {
		errorMessage = error.message.substr(error.message.indexOf('['));
	} else {
		errorMessage = error.message;
	}
	errorMessage = errorMessage.replace(/"/g, '');
	errorMessage = errorMessage.replace('[', '');
	errorMessage = errorMessage.replace(']', '');
	error.message = errorMessage;
	return error;
};

/**
 * Send an email to perticular user mail
 * @param {*} email email address
 * @param {*} subject  subject
 * @param {*} content content
 * @param {*} cb callback
 */
export const sendEmail = async (payload: any, type: number) => {
	if (!payload.email) {
		throw new Error('Email is required');
	}
	/** setup email data with unicode symbols **/
	const mailData = emailTypes(payload, type),
		email = payload.email,
		ccEmail = payload.ccEmail,
		bccEmail = payload.bccEmail;

	let template: HandlebarsTemplateDelegate<any> | string = '';
	let result = '';
	if (mailData && mailData.template) {
		handlebars.registerHelper('if_lte', function (this: any, a: number, b: number, opts: any) {
			return a <= b ? opts.fn(this) : opts.inverse(this);
		});

		handlebars.registerHelper('if_gt', function (this: any, a: number, b: number, opts: any) {
			return a > b ? opts.fn(this) : opts.inverse(this);
		});

		template = handlebars.compile(mailData.template);
	}
	if (typeof template === 'function') {
		result = template(mailData.data);
	}

	const emailToSend: any = {
		to: email,
		cc: ccEmail,
		bcc: bccEmail,
		from: config.SMTP.SENDER,
		subject: mailData.Subject
	};

	if (payload.attachments && payload.attachments.length) {
		emailToSend.attachments = payload.attachments;
	}
	if (result) {
		emailToSend.html = result;
	}

	return await transporter.sendMail(emailToSend);
};

const emailTypes = (payload: any, type: any) => {
	const EmailStatus: any = {
		Subject: '',
		data: {
			serverUrl: process.env.SERVER_URL || 'https://www.example.xyz',
			frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000/v1/user/'
		},
		template: ''
	};

	switch (type) {
	case Constants.EMAIL_TYPES.FORGOT_PASSWORD:
		EmailStatus.Subject = Constants.EMAIL_SUBJECTS.FORGOT_PASSWORD;
		EmailStatus.template = Constants.EMAIL_CONTENTS.FORGOT_PASSWORD;
		EmailStatus.data.firstName = payload.firstName;
		EmailStatus.data.resetUrl = payload.resetUrl;
		break;
	default:
		EmailStatus.Subject = 'Welcome Email!';
		break;
	}
	return EmailStatus;
};

export const convertIdToMongooseId = (stringId: string) => {
	return new mongoose.Types.ObjectId(stringId);
};
