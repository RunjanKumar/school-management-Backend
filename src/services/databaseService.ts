import { Model, FilterQuery, UpdateQuery, QueryOptions, ProjectionType } from 'mongoose';

interface DbService {
	create: <T>(model: Model<T>, payload: Partial<T>) => Promise<T>;
	insertMany: <T>(model: Model<T>, payload: Partial<T>[]) => Promise<T[]>;
	find: <T>(model: Model<T>, criteria: FilterQuery<T>, projection?: ProjectionType<T>) => Promise<T[]>;
	findPagination: <T>(model: Model<T>, criteria: FilterQuery<T>, projection?: ProjectionType<T>, sort?: any, skip?: number, limit?: number) => Promise<T[]>;
	findOne: <T>(model: Model<T>, criteria: FilterQuery<T>, projection?: ProjectionType<T>) => Promise<T | null>;
	findOneWithSort: <T>(model: Model<T>, criteria: FilterQuery<T>, projection?: ProjectionType<T>, sort?: any) => Promise<T | null>;
	findOneAndUpdate: <T>(model: Model<T>, criteria: FilterQuery<T>, dataToUpdate: UpdateQuery<T>, options?: QueryOptions) => Promise<T | null>;
	updateOne: <T>(model: Model<T>, criteria: FilterQuery<T>, payload: UpdateQuery<T>, options?: any) => Promise<boolean>;
	updateMany: <T>(model: Model<T>, criteria: FilterQuery<T>, dataToUpdate: UpdateQuery<T>) => Promise<void>;
	deleteOne: <T>(model: Model<T>, criteria: FilterQuery<T>) => Promise<boolean>;
	findOneAndDelete: <T>(model: Model<T>, criteria: FilterQuery<T>) => Promise<T | null>;
	deleteMany: <T>(model: Model<T>, criteria: FilterQuery<T>) => Promise<number>;
	aggregate: <T>(model: Model<T>, query: any[]) => Promise<any[]>;
	findOneWithPopulate: <T>(model: Model<T>, criteria: FilterQuery<T>, populatedKey: string, projection?: ProjectionType<T>, options?: QueryOptions) => Promise<T | null>;
	count: <T>(model: Model<T>, criteria: FilterQuery<T>) => Promise<number>;
}

const dbService: DbService = {
	create: async <T>(model: Model<T>, payload: Partial<T>): Promise<T> => {
		return (await new model(payload).save()) as T;
	},

	insertMany: async <T>(model: Model<T>, payload: Partial<T>[]): Promise<T[]> => {
		return (await model.insertMany(payload)) as unknown as T[];
	},

	find: async <T>(model: Model<T>, criteria: FilterQuery<T>, projection: ProjectionType<T> = {}): Promise<T[]> => {
		return (await model.find(criteria, projection).lean()) as T[];
	},

	findPagination: async <T>(model: Model<T>, criteria: FilterQuery<T>, projection: ProjectionType<T> = {}, sort: any = { _id: -1 }, skip: number = 0, limit: number = 0): Promise<T[]> => {
		return (await model.find(criteria, projection).sort(sort).skip(skip).limit(limit).lean()) as T[];
	},

	findOne: async <T>(model: Model<T>, criteria: FilterQuery<T>, projection: ProjectionType<T> = {}): Promise<T | null> => {
		return (await model.findOne(criteria, projection).lean()) as T | null;
	},

	findOneWithSort: async <T>(model: Model<T>, criteria: FilterQuery<T>, projection: ProjectionType<T> = {}, sort: any = { _id: -1 }): Promise<T | null> => {
		return (await model.findOne(criteria, projection).sort(sort).lean()) as T | null;
	},

	updateOne: async <T>(model: Model<T>, criteria: FilterQuery<T>, payload: UpdateQuery<T>, options?: any): Promise<boolean> => {
		const result = await model.updateOne(criteria, payload, options);
		return result.matchedCount > 0;
	},

	findOneAndUpdate: async <T>(model: Model<T>, criteria: FilterQuery<T>, dataToUpdate: UpdateQuery<T>, options: QueryOptions = { new: true }): Promise<T | null> => {
		return (await model.findOneAndUpdate(criteria, dataToUpdate, options).lean()) as T | null;
	},

	findOneAndDelete: async <T>(model: Model<T>, criteria: FilterQuery<T>): Promise<T | null> => {
		return (await model.findOneAndDelete(criteria)) as T | null;
	},

	updateMany: async <T>(model: Model<T>, criteria: FilterQuery<T>, dataToUpdate: UpdateQuery<T>): Promise<void> => {
		await model.updateMany(criteria, dataToUpdate).lean();
	},

	deleteOne: async <T>(model: Model<T>, criteria: FilterQuery<T>): Promise<boolean> => {
		const result = await model.deleteOne(criteria);
		return result.deletedCount > 0;
	},

	deleteMany: async <T>(model: Model<T>, criteria: FilterQuery<T>): Promise<number> => {
		const result = await model.deleteMany(criteria);
		return result.deletedCount || 0;
	},

	aggregate: async <T>(model: Model<T>, query: any[]): Promise<any[]> => {
		return await model.aggregate(query);
	},

	findOneWithPopulate: async <T>(model: Model<T>, criteria: FilterQuery<T>, populatedKey: string, projection: ProjectionType<T> = {}, options: QueryOptions = { lean: true }): Promise<T | null> => {
		return await model.findOne(criteria, projection, options).populate(populatedKey);
	},

	count: async <T>(model: Model<T>, criteria: FilterQuery<T>): Promise<number> => {
		return await model.countDocuments(criteria).lean();
	}
};

export default dbService;
