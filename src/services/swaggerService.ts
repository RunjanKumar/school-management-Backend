import fs from 'fs';
import j2s from 'joi-to-swagger';
import { Constants } from '../commons/constants';
import { SWAGGER } from '../config/swaggerConfig';
const MESSAGES = {
	FORBIDDEN: 'Forbidden',
	SUCCESS: 'action successful',
	INTERNAL_SERVER_ERROR: 'Internal Server Error',
	NOT_FOUND: 'Data Not Found',
	DATA_NOT_FOUND: 'Data Not Found',
	BAD_REQUEST: 'Bad Request',
	UNAUTHORIZED: 'Unauthorized',
	CONFLICT: 'Conflict',
	VALIDATION_ERROR: 'Validation Error',
	SERVER_ERROR: 'Server Error'
};
let singleton: Swagger | undefined;

interface SwaggerResponse {
	schema: {
		type: string;
		example: {
			status: boolean;
			statusCode: number;
			type: string;
			message: string;
		};
		properties: {
			statusCode: {
				type: string;
				format: string;
				example: number;
			};
		};
	};
}

const defaultResponse: { [key: number]: SwaggerResponse } = {
	200: {
		schema: {
			type: 'object',
			example: {
				status: true,
				statusCode: 200,
				type: 'Default',
				message: MESSAGES.SUCCESS
			},
			properties: {
				statusCode: {
					type: 'integer',
					format: 'int32',
					example: 200
				}
			}
		}
	},
	201: {
		schema: {
			type: 'object',
			example: {
				status: true,
				statusCode: 201,
				type: 'Default',
				message: MESSAGES.SUCCESS
			},
			properties: {
				statusCode: {
					type: 'integer',
					format: 'int32',
					example: 201
				}
			}
		}
	},
	400: {
		schema: {
			type: 'object',
			example: {
				status: false,
				statusCode: 400,
				type: Constants.ERROR_TYPES.BAD_REQUEST,
				message: MESSAGES.BAD_REQUEST
			},
			properties: {
				statusCode: {
					type: 'integer',
					format: 'int32',
					example: 401
				}
			}
		}
	},
	401: {
		schema: {
			type: 'object',
			example: {
				status: false,
				statusCode: 401,
				type: Constants.ERROR_TYPES.UNAUTHORIZED,
				message: MESSAGES.UNAUTHORIZED
			},
			properties: {
				statusCode: {
					type: 'integer',
					format: 'int32',
					example: 401
				}
			}
		}
	},
	404: {
		schema: {
			type: 'object',
			example: {
				status: false,
				statusCode: 404,
				type: Constants.ERROR_TYPES.DATA_NOT_FOUND,
				message: MESSAGES.NOT_FOUND
			},
			properties: {
				statusCode: {
					type: 'integer',
					format: 'int32',
					example: 401
				}
			}
		}
	},
	500: {
		schema: {
			type: 'object',
			example: {
				status: true,
				statusCode: 500,
				type: Constants.ERROR_TYPES.INTERNAL_SERVER_ERROR,
				message: MESSAGES.INTERNAL_SERVER_ERROR
			},
			properties: {
				statusCode: {
					type: 'integer',
					format: 'int32',
					example: 500
				}
			}
		}
	}
};

const optimizeSwaggerResponse = (status: number, resp: SwaggerResponse | undefined): SwaggerResponse | undefined => {
	const defaultStatus = [ 200, 401, 500 ];

	if (!resp) {
		return;
	}

	if (defaultStatus.includes(status) && !resp) {
		resp = defaultResponse[status];
	}
	if (resp) {
		if (resp.schema) {
			resp.schema.type = resp.schema.type ? resp.schema.type : 'object';
		}
		if (resp.schema.type === 'object') {
			if (resp.schema.example && resp.schema.example.constructor.name === 'Object') {
				resp.schema.example = { ...defaultResponse[status].schema.example, ...resp.schema.example };
			}
			if (resp.schema.properties) {
				resp.schema.properties = { ...defaultResponse[status].schema.properties, ...resp.schema.properties };
			} else {
				resp.schema.properties = defaultResponse[status].schema.properties;
			}
		}
	}
	return resp;
};

const mapSwaggerResponse = (data: { [key: number]: SwaggerResponse } | undefined): { [key: number]: SwaggerResponse } => {
	const returnData: any = {};
	[ 200, 201, 400, 401, 404, 500 ].forEach((status) => {
		returnData[status] = optimizeSwaggerResponse(status, data ? data[status] : data);
	});
	return returnData;
};

class Swagger {
	currentRoute: string[] = [];
	paths: { [key: string]: any } = {};
	definitions: { [key: string]: any } = {};

	static instance(): Swagger {
		if (!singleton) {
			singleton = new Swagger();
			return singleton;
		}

		return singleton;
	}

	createJsonDoc(info: any, host: any, basePath: any): void {
		let swaggerData: any = SWAGGER;

		if (info) {
			swaggerData = {
				...swaggerData,
				info
			};
		}

		if (host) {
			swaggerData = {
				...swaggerData,
				host
			};
		}

		if (basePath) {
			swaggerData = {
				...swaggerData,
				basePath
			};
		}

		fs.writeFileSync('swagger.json', JSON.stringify(swaggerData));
		return swaggerData;
	}

	addNewRoute(joiDefinitions: any, path: string, method: string): boolean {
		if (this.currentRoute.includes(path + method)) {
			return false;
		}

		this.currentRoute.push(path + method);

		const swaggerData = fs.readFileSync('swagger.json', 'utf-8');
		const otherData = JSON.parse(swaggerData);
		const name = joiDefinitions.model || Date.now();
		const tag = joiDefinitions.group || 'default';
		const summary = joiDefinitions.description || 'No desc';

		const toSwagger = j2s(joiDefinitions).swagger;
		if (toSwagger && toSwagger.properties && toSwagger.properties.body) {
			this.definitions = {
				...this.definitions,
				[name]: toSwagger.properties.body
			};
		}

		const pathArray = path.split('/').filter(Boolean);
		const transformPath = pathArray
			.map((pathValue) => {
				if (pathValue.charAt(0) === ':') {
					return `/{${pathValue.substr(1)}}`;
				}

				return `/${pathValue}`;
			})
			.join('');

		const parameters: any[] = [];

		const { body, params, query, headers, formData } = joiDefinitions;

		if (body) {
			parameters.push({
				in: 'body',
				name: 'body',
				schema: {
					$ref: `#/definitions/${name}`
				}
			});
		}

		if (params) {
			const getParams: string[] = [];
			const rxp = /{([^}]+)}/g;
			let curMatch;

			while ((curMatch = rxp.exec(transformPath))) {
				getParams.push(curMatch[1]);
			}
			const requiredFields = toSwagger.properties.params.required;
			getParams.forEach((param) => {
				const index = requiredFields ? requiredFields.findIndex((key: string) => key === param) : -1;

				if (index > -1) {
					toSwagger.properties.params.properties[param].required = true;
				}
				parameters.push({
					name: param,
					in: 'path',
					...toSwagger.properties.params.properties[param]
				});
			});
		}

		if (query) {
			const keys = Object.keys(toSwagger.properties.query.properties).map((key) => key);
			const requiredFields = toSwagger.properties.query.required;
			keys.forEach((key) => {
				const index = requiredFields ? requiredFields.findIndex((requiredKey: string) => requiredKey === key) : -1;
				if (index > -1) {
					toSwagger.properties.query.properties[key].required = true;
				}
				parameters.push({
					in: 'query',
					name: key,
					...toSwagger.properties.query.properties[key]
				});
			});
		}

		if (formData) {
			toSwagger.properties.formData.properties = {
				...(toSwagger.properties.formData.properties.file && toSwagger.properties.formData.properties.file.properties),
				...(toSwagger.properties.formData.properties.fileArray && toSwagger.properties.formData.properties.fileArray.properties),
				...(toSwagger.properties.formData.properties.files && toSwagger.properties.formData.properties.files.properties),
				...(toSwagger.properties.formData.properties.body && toSwagger.properties.formData.properties.body.properties)
			};
			const keys = Object.keys(toSwagger.properties.formData.properties).map((key) => key);
			const requiredFields = toSwagger.properties.formData.required;
			keys.forEach((key) => {
				const index = requiredFields ? requiredFields.findIndex((requiredKey: string) => requiredKey === key) : -1;
				if (index > -1) {
					toSwagger.properties.formData.properties[key].required = true;
				}
				parameters.push({
					in: 'formData',
					name: key,
					...toSwagger.properties.formData.properties[key]
				});
			});
		}

		if (headers) {
			const keys = Object.keys(toSwagger.properties.headers.properties).map((key) => key);
			const requiredFields = toSwagger.properties.headers.required;
			keys.forEach((key) => {
				const index = requiredFields ? requiredFields.findIndex((requiredKey: string) => requiredKey === key) : -1;
				if (index > -1) {
					toSwagger.properties.headers.properties[key].required = true;
				}
				parameters.push({
					in: 'header',
					name: key,
					...toSwagger.properties.headers.properties[key]
				});
			});
		}

		if (this.paths && this.paths[transformPath]) {
			this.paths[transformPath] = {
				...this.paths[transformPath],
				[method]: {
					tags: [ tag ],
					summary,
					responses: mapSwaggerResponse(joiDefinitions.response),
					parameters
				}
			};
		} else {
			this.paths = {
				...this.paths,
				[transformPath]: {
					[method]: {
						tags: [ tag ],
						summary,
						responses: mapSwaggerResponse(joiDefinitions.response),
						parameters
					}
				}
			};
		}

		const newData = {
			...otherData,
			definitions: this.definitions,
			paths: this.paths
		};

		fs.writeFileSync('swagger.json', JSON.stringify(newData));
		return true;
	}
}

export const swaggerDoc = Swagger.instance();
