import development from './environments/development';
import production from './environments/production';

type Env = 'development' | 'production';
const env: Env = (process.env.NODE_ENV as Env) || 'development';

const CONFIG: Record<Env, typeof development | typeof production> = { development, production };

export default CONFIG[env];
