import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, ProjectionType } from 'mongoose';

interface DbService {
	create: <T extends Document>(model: Model<T>, payload: Partial<T>) => Promise<T>;
	insertMany: <T extends Document>(model: Model<T>, payload: Partial<T>[]) => Promise<T[]>;
	find: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, projection?: ProjectionType<T>) => Promise<T[]>;
	findPagination: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, projection?: ProjectionType<T>, sort?: any, skip?: number, limit?: number) => Promise<T[]>;
	findOne: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, projection?: ProjectionType<T>) => Promise<T | null>;
	findOneWithSort: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, projection?: ProjectionType<T>, sort?: any) => Promise<T | null>;
	findOneAndUpdate: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, dataToUpdate: UpdateQuery<T>, options?: QueryOptions) => Promise<T | null>;
	updateOne: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, payload: UpdateQuery<T>, options?: QueryOptions<T>) => Promise<T | null>;
	updateMany: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, dataToUpdate: UpdateQuery<T>) => Promise<void>;
	deleteOne: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>) => Promise<boolean>;
	findOneAndDelete: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>) => Promise<T | null>;
	deleteMany: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>) => Promise<number>;
	aggregate: <T extends Document>(model: Model<T>, query: any[]) => Promise<any[]>;
	findOneWithPopulate: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, populatedKey: string, projection?: ProjectionType<T>, options?: QueryOptions) => Promise<T | null>;
	count: <T extends Document>(model: Model<T>, criteria: FilterQuery<T>) => Promise<number>;
}

const dbService: DbService = {
	create: async <T extends Document>(model: Model<T>, payload: Partial<T>): Promise<T> => {
		return await new model(payload).save();
	},

	insertMany: async <T extends Document>(model: Model<T>, payload: Partial<T>[]): Promise<T[]> => {
		return (await model.insertMany(payload)) as unknown as T[];
	},

	find: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, projection: ProjectionType<T> = {}): Promise<T[]> => {
		return (await model.find(criteria, projection).lean()) as T[];
	},

	findPagination: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, projection: ProjectionType<T> = {}, sort: any = { _id: -1 }, skip: number = 0, limit: number = 0): Promise<T[]> => {
		return (await model.find(criteria, projection).sort(sort).skip(skip).limit(limit).lean()) as T[];
	},

	findOne: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, projection: ProjectionType<T> = {}): Promise<T | null> => {
		return (await model.findOne(criteria, projection).lean()) as T | null;
	},

	findOneWithSort: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, projection: ProjectionType<T> = {}, sort: any = { _id: -1 }): Promise<T | null> => {
		return (await model.findOne(criteria, projection).sort(sort).lean()) as T | null;
	},

	updateOne: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, payload: Partial<T>, options?: QueryOptions<T>): Promise<T | null> => {
		return (await model.updateOne(criteria, payload).lean()) as unknown as T | null;
	},

	findOneAndUpdate: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, dataToUpdate: UpdateQuery<T>, options: QueryOptions = { new: true }): Promise<T | null> => {
		return (await model.findOneAndUpdate(criteria, dataToUpdate, options).lean()) as T | null;
	},

	findOneAndDelete: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>): Promise<T | null> => {
		return (await model.findOneAndDelete(criteria)) as T | null;
	},

	updateMany: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, dataToUpdate: UpdateQuery<T>): Promise<void> => {
		await model.updateMany(criteria, dataToUpdate).lean();
	},

	deleteOne: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>): Promise<boolean> => {
		const result = await model.deleteOne(criteria);
		return result.deletedCount > 0;
	},

	deleteMany: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>): Promise<number> => {
		const result = await model.deleteMany(criteria);
		return result.deletedCount || 0;
	},

	aggregate: async <T extends Document>(model: Model<T>, query: any[]): Promise<any[]> => {
		return await model.aggregate(query);
	},

	findOneWithPopulate: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>, populatedKey: string, projection: ProjectionType<T> = {}, options: QueryOptions = { lean: true }): Promise<T | null> => {
		return await model.findOne(criteria, projection, options).populate(populatedKey);
	},

	count: async <T extends Document>(model: Model<T>, criteria: FilterQuery<T>): Promise<number> => {
		return await model.countDocuments(criteria).lean();
	}
};

export default dbService;
