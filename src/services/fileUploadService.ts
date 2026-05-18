'use strict';

import fs from 'fs';
import path from 'path';

import CONFIG from '../config';
import { ObjectId } from 'mongoose';

/**
 * function to Upload file using File stream pipeline
 */
export const uploadFileToLocal = async (readableFile: any, filePath: any, pathToUpload: any): Promise<Record<string, string>> => {
	if (!fs.existsSync(pathToUpload)) {
		fs.mkdirSync(pathToUpload, { recursive: true });
	}

	const fullFilePath = path.join(pathToUpload, path.basename(filePath));
	const fileWriteStream = fs.createWriteStream(fullFilePath);
	return new Promise((resolve, reject) => {
		fileWriteStream.write(readableFile.buffer);
		fileWriteStream.end((err: any) => {
			if (err) {
				reject(err);
			} else {
				// As api gateway will only forward when file is added.
				const fileUrl = `${CONFIG.SERVER_URL}/${filePath}`;
				resolve({ filePath: fullFilePath, fileUrl });
			}
		});
	});
};

/**
 * Function to upload multiple files.
 * @param files - array of files
 * @param userId - user id
 * @returns array of file paths
 */
export const uploadManyFiles = async (files: any, userId: string | ObjectId) => {
	const uploadedFiles = [];
	for (const file of files) {
		const fileName = `${userId}_${Date.now()}_${file.originalname}`;
		const relativePath = `public/userFiles/${fileName}`;
		const basePath = path.join(__dirname, '../../public/userFiles');
		const filePath = await uploadFileToLocal(file, relativePath, basePath);
		uploadedFiles.push(filePath);
	}

	return uploadedFiles;
};

/**
 * Fuction to format file details before uploading on server.
 * @param {*} payload
 * @returns
 */
export const uploadFile = async (payload: any): Promise<Record<string, string>> => {
	const fileNameArray = payload.file.originalname.split('.');
	const fileExtention = fileNameArray[fileNameArray.length - 1];
	const filePath = CONFIG.PATH_TO_UPLOAD_FILES_ON_LOCAL_SERVER;
	const fileName = `${Date.now()}_${fileNameArray.filter((ele: any) => ele !== fileExtention).join('_')}.${fileExtention}`;

	return await uploadFileToLocal(payload.file, fileName, filePath);
};
