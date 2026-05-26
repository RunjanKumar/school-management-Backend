import { app } from './startup/app';
import { connectDB } from './startup/mongoStartup';
import { config } from './config';
import { runMigrations } from './utils/dbMigration';

const startServer = async () => {
  try {
    await connectDB();
    await runMigrations();
    
    app.listen(config.port, () => {
      const baseUrl = `http://localhost:${config.port}`;
      console.log(`Auth Service listening on port ${config.port}`);
      console.log(`Auth Service URL: ${baseUrl}`);
      console.log(`Auth Service Swagger UI: ${baseUrl}/api-docs`);
      console.log(`Auth Service Swagger JSON: ${baseUrl}/swagger.json`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
