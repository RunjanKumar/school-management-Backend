import Joi from 'joi';
import moment from 'moment';
import mongoose from 'mongoose';
import { Constants } from '../commons/constants';

const joiUtils: any = {
	Joi: Joi.extend((joi) => ({
		type: 'string',
		base: joi.string(),
		messages: {
			'string.objectId': '{{#label}} must be a valid id'
		},
		rules: {
			mongoId: {
				validate(value: any, helpers: any) {
					if (mongoose.Types.ObjectId.isValid(value)) {
						return new mongoose.Types.ObjectId(value);
					}
					return helpers.error('string.objectId');
				}
			},
			password: {
				validate(value: any, helpers: any) {
					if (!Constants.REGEX.PASSWORD.test(value)) {
						return helpers.error(Constants.RESPONSE_MESSAGES.PASSWORD_VALIDATION_FAILED);
					}
					return value;
				}
			},
			capitalize: {
				validate(value: any) {
					if (typeof value !== 'string') {
						return '';
					}
					return value
						?.split(' ')
						?.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
						?.join(' ');
				}
			}
		}
	}))
};

joiUtils.Joi = joiUtils.Joi.extend((joi: any) => ({
	type: 'date',
	base: joi.date(),
	messages: {
		'date.dateOnly': '{{#label}} must contain only date.',
		'date.timeMustBeGreaterToday': '{{#label}} must be greater than today.',
		'date.invalid': '{{#label}} is invalid.'
	},
	rules: {
		dateOnly: {
			validate(value: any, helpers: any) {
				const date = new Date(value);
				if (date) {
					const timestamp = new Date(value || new Date()).setHours(0, 0, 0, 0);
					return new Date(timestamp);
				}
				return helpers.error('date.dateOnly');
			}
		},
		startOfDayDate: {
			validate(value: any, helpers: any) {
				const parsedDate = moment(value);
				if (!parsedDate.isValid()) {
					return helpers.error('date.invalid');
				}
				return parsedDate.startOf('day').toDate();
			}
		},
		timeMustBeGreaterToday: {
			validate: (value: any, helpers: any) => {
				if (moment(value).isBefore(moment().startOf('day'))) {
					return helpers.error('date.timeMustBeGreaterToday');
				}
				return value;
			}
		},
		endOfDayDate: {
			validate(value: any, helpers: any) {
				const parsedDate = moment(value);
				if (!parsedDate.isValid()) {
					return helpers.error('date.dateOnly');
				}
				return parsedDate.endOf('day').toDate();
			}
		}
	}
}));

joiUtils.Joi.file = ({ name, description = 'File' }: any) => {
	return { [name]: Joi.any().meta({ swaggerType: 'file' }).optional().description(description) };
};

joiUtils.Joi.fileArray = ({ name, description = 'File', maxCount }: any) => {
	const joiValidation: any = Joi.any().meta({ swaggerType: 'file' }).optional().description(description);
	if (maxCount) {
		joiValidation.maxCount = maxCount;
	}
	return { [name]: joiValidation };
};

joiUtils.Joi.files = ({ maxCount, description = 'File' }: any) => {
	const joiValidation: any = Joi.any().meta({ swaggerType: 'file' }).optional().description(description);
	joiValidation.maxCount = maxCount;
	return joiValidation;
};

export default joiUtils;
