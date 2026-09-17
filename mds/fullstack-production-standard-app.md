# SETUP A NODE/EXPRESS API LIKE A PRO

## INSTALL REQUIRED PACKAGES

```bash
mkdir server
cd server

pnpm init

pnpm add express @types/express @types/node eslint prettier helmet cors @types/cors bcrypt @types/bcrypt jsonwebtoken @types/jsonwebtoken dotenv zod sequelize sequelize-cli mysql2 http-status-codes googleapis express-session @types/express-session 
cookie-parser @types/cookie-parser

#logging using pino
pnpm add pino pino-pretty pino-http

#rate limit
pnpm add express-rate-limit

# auto load
pnpm add -D tsx typescript
```

### package.json

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### src/app.ts

```ts
import express from "express";

const app = express();

export default app;
```

### src/index.ts

```ts
import app from './app';

app.listen(Environment.PORT, () => {
    logger.info("Server started on port:" + `http://localhost:${Environment.PORT}`);
});
```

## SETUP COMMON API RESPONSE

### server/src/utils/api.response.ts

```ts
import { Response } from 'express';

interface ResponseParams<T> {
  res: Response;
  data: T;
  message?: string;
  status?: number;
}

export const apiResponse = <T>({
  res,
  data,
  message = 'Success',
  status = 200,
}: ResponseParams<T>) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};
```

### use it

```ts
apiResponse({
  res,
  data: user,
  message: 'User created successfully',
  status: 201,
});
```

## SETUP GLOBAL ERROR HANDLER MIDDLEWARE

### server/src/errors/AppError.ts

```ts
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}
```

### server/src/errors/ValidationError.ts

```ts
import { AppError } from './AppError';

export class ValidationError extends AppError {
  public details: unknown;

  constructor(message: string, details: unknown) {
    super(message, 400);
    this.details = details;
  }
}
```

### server/src/middlewares/error.middleware.ts

```ts
export default function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(
    {
      err,
      path: req.originalUrl,
      method: req.method,
    },
    err.message
  );

  if (err instanceof AppError) {
    return apiResponse({
      res,
      data: null,
      message: err.message,
      status: err.statusCode,
    });
  }

  return apiResponse({
    res,
    data: null,
    message: err.message,
    status: 500,
  });
}
```

### use it in the serve/app/index after all the routes

```ts
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

...
// Runs only if no route matched
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler
app.use(globalErrorHandler);
```

### usage example

```ts
throw new ValidationError('Invalid user data', []);
```

## SETUP LOGGER MIDDLEWARE

### server/src/utils/logger.ts

```ts
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import Environment from '@/config/env.config';

const isProduction = Environment.NODE_ENV === 'production';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
});

export const httpLogger = pino({
  level: 'info',
  transport: {
    target: 'pino/file',
    options: {
      destination: path.join(logsDir, 'http.log'),
      mkdir: true,
    },
  },
});

```

### server/src/middlewares/logger.middleware.ts

```ts
import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

export const requestLogger = pinoHttp({

    logger,

    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },

});
```

### use it in the serve/app/index before routes

```ts
import { requestLogger } from "./middlewares/requestLogger";

...
app.use(cookieParser());

// Logger middleware
app.use(requestLogger);
```

## SETUP ENVIRONMENT SCHEMA AND TYPE USING ZOD

### server/src/config/env.config.ts

```ts
import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().min(1, "PORT is required"),
    FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),
    DB_HOST: z.string().min(1, "DB_HOST is required"),
    DB_USER: z.string().min(1, "DB_USER is required"),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().min(1, "DB_NAME is required"),
    DB_PORT: z.string().min(1, "DB_PORT is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    result.error.issues.forEach(issue =>
        console.error(` - ${issue.path.join('.')}: ${issue.message}`)
    );
    console.error("Environment configuration issue");
    process.exit(1);
}

const Environment = result.data;
console.table(Environment)

//Zod's type inference to automatically derive a TypeScript type from our schema
export type EnvironmentType = z.infer<typeof envSchema>;

export default Environment;
```

## SETUP SEQUELIZE MIGRATIONS

```bash
pnpm add sequelize sequelize-cli mysql2
```
### create .sequelizerc in the root path

```js
const path = require('path');

module.exports = {
  config: path.resolve('src', 'config', 'config.json'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src', 'seeders'),
  'migrations-path': path.resolve('src', 'migrations'),
};
```

### create config,models,seeders,migrations directories in the src
- or you can follow what mentioned in the doc https://sequelize.org/docs/v6/other-topics/migrations/

### add config/config.json

```json
{
  "development": {
    "username": "root",
    "password": null,
    "database": "database_development",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
}
```

### commands

```bash
# Creating the first Model (and Migration)
npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string

# you need to keep the migraion as js file, dont add "type":"module" in the package.json ts can compile
```

### example migration

```js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('Users', {
      id: { primaryKey: true, autoIncrement: false, type: Sequelize.STRING },
      name: Sequelize.STRING,
      email: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
```

### example model (you can keep/rename model to .ts)

```ts
import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
  NonAttribute,
  Association,
} from 'sequelize';
import type { Post } from './post';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;

  // Associations
  declare posts?: NonAttribute<Post[]>;

  declare static associations: {
    posts: Association<User, Post>;
  };

  static associate(models: { Post: typeof Post }) {
    User.hasMany(models.Post, { foreignKey: 'userId', as: 'posts' });
  }
}

export const initUserModel = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: { type: DataTypes.STRING, autoIncrement: false, primaryKey: true },
      name: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      indexes: [
        {
          name: 'idx_user_email',
          fields: ['email'],
        }
      ],
    }
  );

  return User;
};

```

### db.config.ts

```ts
const sequelize = new Sequelize(Environment.DB_NAME, Environment.DB_USER, Environment.DB_PASSWORD, {
  host: Environment.DB_HOST,
  port: Number(Environment.DB_PORT),
  dialect: 'mysql',
  logging: false,
});

export const connetDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    await sequelize.sync({ force: false });
    logger.info('Database synchronized');
  } catch (error) {
    logger.error(`Unable to connect to the database:' ${error}`);
  }
};

// Initialize models
export const User = initUserModel(sequelize);
export const Post = initPostModel(sequelize);

// Set up associations
Post.associate({ User});
User.associate({ Post });

export default sequelize;
```

### update server.ts

```ts
await connetDB();
app.listen(Environment.PORT, () => {
  logger.info("Server started on port:" + `http://localhost:${Environment.PORT}`);
});
```

### update package.json scripts

```json
"scripts": {
    "migrate": "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo",
    "migrate:undo:all": "sequelize-cli db:migrate:undo:all",
    "seed": "sequelize-cli db:seed:all",
    "seed:undo": "sequelize-cli db:seed:undo",
    "seed:undo:all": "sequelize-cli db:seed:undo:all"
  },
```

## SETUP ZOD REQUEST VALIDATOR MIDDLEWARE

### server/src/dtos/user.dto.ts

```ts
import { z } from 'zod';

export const createUserSchema = z.object({
    id: z.string().min(1, { message: "ID is required" }),
    name: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    picture: z.string().url().optional(),
    googleId: z.string().optional(),
    refreshToken: z.string().nullable().optional()

});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
```

### server/src/middlewares/validate.middliware.ts

```ts
import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '@/errors/BadRequestError';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequestError(`${result.error.issues.map((e) => e.message).join(', ')}`);
    }

    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      throw new BadRequestError(`${result.error.issues.map((e) => e.message).join(', ')}`);
    }

    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      throw new BadRequestError(`${result.error.issues.map((e) => e.message).join(', ')}`);
    }

    next();
  };
};

```

### use it

```ts
router.post('/test-route', validate(createUserSchema), testController.testMethod);
```

## SETUP AUTH MIDDLEWARE

### server/src/middlewares/auth.middleware.ts
```ts
export interface AuthenticatedRequest extends Request {
  user: User;
}

export default function jwtAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const { userId, email } = jwt.verify(token, Environment.JWT_SECRET) as JwtPayload;
    req.user = { userId, email };
    next();
  } catch {
    throw new UnauthorizedError();
  }
}
```

## SETUP eslint and PRETTIER

### server/eslint.config.js

```js
export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'src/migrations'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
```

### server/prettier.config.mjs

```js
/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  jsxSingleQuote: false,
  arrowParens: 'always',
  endOfLine: 'lf',
};
```

### server/.prettierignore

```js
dist
node_modules
pnpm-lock.yaml
*.min.js
```


## SETUP @ IMPORTS

```bash
pnpm add -D tsc-alias
pnpm add -D tsc-alias
```

### server/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

```

### package.json

```json
"scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --check .",
    "format:fix": "prettier --write ."
  },
```

## FINAL app.ts and server.ts SETUP

### src/app.ts
```ts
//import this top of all other imports, that guarantee the config is loaded first before anything else
//so we can validate the scema and decide if we can load the appor not
import Environment from './config/env.config';
//other imports


const app = express();

app.use(express.json()); // to parse application/json, otherwise req.body will be undefined

// Required for cross-origin browser requests
app.use(
  cors({
    origin: Environment.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Access-Control-Allow-Credentials',
      'X-CSRF-Token',
    ],
  })
);

app.use(
  session({
    secret: Environment.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: Environment.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use(cookieParser());

// Logger middleware
app.use(requestLogger);

app.use('/api/v1', rateLimiter, routerV1);

// Runs only if no route matched
app.use((req) => {
  throw new NotFoundError(`Route not found - ${req.originalUrl}`);
});

// Global error handler
app.use(globalErrorHandler);

export default app;
```

### server/src/index.ts

```ts
async function bootstrap() {
  try {
    await connetDB();

    app.listen(Environment.PORT, () => {
      logger.info('Server started on port:' + `http://localhost:${Environment.PORT}`);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server:');
    process.exit(1);
  }
}

bootstrap();
```

### package.json

```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "tsx watch src/index.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "migrate": "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo",
    "migrate:undo:all": "sequelize-cli db:migrate:undo:all",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix .",
    "format": "prettier --check .",
    "format:fix": "prettier --write ."
  }
```

# SETUP A REACT CLIENT LIKE A PRO

## INSTALL REQUIRED PACKAGES

```bash
mkdir client
cd client
pnpm create vite react-fe --template react-ts
pnpm add axios react-router-dom @tanstack/react-query lucide-react react-error-boundary
sonar nuqs

pnpm run dev
```

### INSTALL TAILWIND

```bash
# Reference : https://tailwindcss.com/docs/installation/using-vite
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D @types/node @types/react @types/react-dom
```

### CONFIGURE TAILWIND
```bash
cd client
then import "./App.css" in App.tsx
```


##  SETUP eslint AND PRETTIER

```bash
pnpm add eslint prettier
pnpm add -D @eslint/js globals typescript-eslint eslint-config-prettier eslint-plugin-prettier
```

### eslint.config.js

```jsx
export default tseslint.config(
  {
    ignores: ['dist', 'node_modules'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
```

### prettier.config.mjs

```js
/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  jsxSingleQuote: false,
  arrowParens: 'always',
  endOfLine: 'lf',
};
```

### .prettierignore

```bash
dist
node_modules
pnpm-lock.yaml
*.min.js
```

### package.json

```json
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --check .",
    "format:fix": "prettier --write .",
    "preview": "vite preview"
  },
```

## SETUP @ IMPORTS

### vite.config.ts

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### tsconfig.json

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### tsconfig.app.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

## SETUP REACT-QUERY

### src/lib/react-query.ts

```tsx
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error('Error', { description: error.message });
    },
  }),

  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error('Error', { description: error.message || 'Failed to update data' });
    },
  }),

  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default queryClient;

//use it
const { data, isLoading, refetch } = useEmails({...});

//custome hook
//src/features/emails/hooks/use-emails-hook.ts
export const useEmails = (params: GetEmailsParams) => {
  return useQuery({
    queryKey: [QUERY_KEYS.EMAILS, params],
    queryFn: () => getEmails(params),
    refetchInterval: 30 * 1000, // fetch every 30 seconds, only for dev testing
    refetchOnWindowFocus: true,
  });
};

//src/features/emails/api/index.ts
export const getEmails = async (params: GetEmailsParams): Promise<EmailsResponse> => {
  const { data } = await api.get<ApiResponse<EmailsResponse>>(API_URLS.EMAILS, {
    params,
  });

  return data.data;
};

```

## SETUP ROUTES WITH LAYOUT

### src/lib/routes.tsx

```tsx
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/emails',
        element: <EmailsPage />,
      },
      ...
    ],
  },
  {
    path: '/',
    element: <Login />,
  },
  ...
]);

//src/components/layouts/auth-layout.tsx
export default function AuthLayout() {
  const { isLoading, error, refetch } = useMe();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <Error error={error as Error} onRetry={() => refetch()} />;

  return (
    <main className="h-[100dvh] bg-white">
      <Outlet />
    </main>
  );
}
```

## SETUP AXIOS INTERCEPTER FOR REFRESH TOKEN SUPPORT

### src/api.ts
```tsx
import axios from 'axios';

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setApiToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const accessToken = data.data.accessToken;
        setApiToken(accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setApiToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

## SETUP AUTH-CONTEXT

### src/providers/auth-context.tsx

```tsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import type { AuthContextType } from '@/types/auth-context-type';
import type { User } from '@/types/user-type';
import api, { setApiToken } from '@/api';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    } finally {
      setApiToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const value: AuthContextType = {
    user,
    setUser,
    loading,
    setLoading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

//use it
const { user, logout } = useAuth();
```

### package.json

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --check .",
    "format:fix": "prettier --write .",
    "preview": "vite preview"
  },
```

## SETUP NUQS-CONTEXT

- NuqsProvider enables type-safe URL query string state management across the app

### client/src/providers/nuqs-provider.tsx

```tsx
interface NuqsProviderProps {
  children: React.ReactNode;
}

export function NuqsProvider({ children }: NuqsProviderProps) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
```


### FINAL app.tsx

```tsx
import { RouterProvider } from 'react-router-dom';
import { router } from '@/lib/routes';
import { AuthProvider } from '@/providers/auth-context';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/react-query';
import { Toaster } from 'sonner';
import { NuqsProvider } from '@/providers/nuqs-provider';

//Use Toaster from sonner for toas messages
function App() {
  return (
    <NuqsProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </NuqsProvider>
  );
}
```