import { app } from './startup/app';
import { connectDB } from './startup/mongoStartup';
import { config } from './config';
import { runMigrations } from './utils/dbMigration';

const startServer = async () => {
  try {
    await connectDB();
    await runMigrations();
    
    app.listen(config.port, () => {
      console.log(`Auth Service listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
