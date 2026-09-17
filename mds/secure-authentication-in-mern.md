# MERN Authentication

# What should be covered for secure auth implementation

- Use Access + Refresh Token
- Use Refresh token in HTTP-only cookies (HTTP-only cookies helps to prevents XSS attacks on refresh tokens)
- handle Access token in memory (React state)
- Consider Refresh token rotation

# Access/Refresh token

- AccessTokens should be short lived, and once expired should be refretch a new one from `/refresh` endpoint.

## How to handle access token in Express

```javascript
//Generate a JWT token
const token = jwt.sign({ userId: user.id }, 'secretKey', { expiresIn: '1h' });
```

## Why and when to use a refresh token

- Store refreshToken in HttpOnly cookies, and these cannot be accessed by JS.
- Once the accessToken is expired, we can call the `/refresh` endpoint and generate new accessToken
- It involves rotate refresh token, and generate new accessToken
- Normally, server should return refreshToken in **HTTP-only cookies** from `/login` and `/refresh` APIs.
- **HTTP-only cookies** prevent access through JavaScript, reducing the danger of **XSS attacks**. 
- The browser sends the cookies automatically when you call your server API with `withCredentials: true`

```javascript
axios.post("http://localhost:5000/api/auth/refresh", {}, {
  withCredentials: true,
});
//and in the server, you need to allo sending cookies
app.use(cors({
  origin: "http://localhost:5173",  // client
  credentials: true,                // allow cookies
}));
```

## How to handle refresh token in Express

```javascript
refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        res.status(401).json({ message: 'Refresh token not provided' });
        return;
      }

      let userIdFromToken: string;
      try {
        userIdFromToken = await this.getUserIdFromToken(token);
       //const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
      } catch (error) {
        res.status(403).json({ message: 'Invalid refresh token' });
        return;
      }

      const user = await UserModel.findById(userIdFromToken);
      // Verify token is still valid in database     

      // Invalidate the old token
      await authService.clearRefreshToken(userIdFromToken);

      // Generate new tokens
      const newAccessToken = await authService.generateSessionToken(user);
      const newRefreshToken = await authService.generateRefreshToken(user);
      await authService.storeUserRefreshToken(user, newRefreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        path: '/api/auth'
      });

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
```

## How to handle access/refresh tokens in React

- Do Not store accessTokens in localStorage or cookies (not HttpOnly), they are vulnerable to XSS attacks.
- Instead store them in memory (useState, redux, react context)

**BaseAPI.ts**
```javascript
const baseApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    withCredentials: true, //this is required to fetch the refresh token that set in cookies of http headers
    headers: {
        "Content-Type": "application/json",
    },
});

export default baseApi;
```

**ProtectedAPI.ts**

```javascript
import axios, { type InternalAxiosRequestConfig } from "axios";
import baseApi from "./baseApi";
import fetchCsrfToken from "./csrf";

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: any[] = [];

const protectedApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setApiToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    protectedApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete protectedApi.defaults.headers.common["Authorization"];
  }
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

protectedApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log("Request Interceptor: Adding Authorization header", accessToken);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

protectedApi.interceptors.response.use(
  (response) => response,
  async (error) => {

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return protectedApi(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await fetchCsrfToken();
        const refreshResponse = await baseApi.post("/auth/refresh", {}, { withCredentials: true });
        const newToken = refreshResponse.data.accessToken;
        setApiToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return protectedApi(originalRequest);
      } catch (err) {
        processQueue(err, null);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default protectedApi;
```

**csrf.ts**

```javascript
const fetchCsrfToken = async () => {
    const res = await baseApi.get("/auth/csrf-token", {
        withCredentials: true,
    });
    baseApi.defaults.headers.common["X-CSRF-Token"] = res.data.csrfToken;
};

export default fetchCsrfToken;
```

**AuthContext.tsx**

```javascript
import React, { createContext, useContext, useEffect, useState } from "react";
import baseApi from "./baseApi";
import fetchCsrfToken from "./csrf";

interface AuthContextType {
	accessToken: string | null;
	setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [accessToken, setAccessToken] = useState<string | null>(null);

	useEffect(() => {
		initAuth();
	}, []);

	const initAuth = async () => {
		try {
			await fetchCsrfToken();
			const response = await baseApi.post("/auth/refresh",{},{withCredentials: true,});
			if (response.data?.accessToken) {
				setAccessToken(response.data.accessToken);
			}
		} catch (error) {
			console.log("refresh fails at init", error);
			setAccessToken(null);
		}
	};

	return (
		<AuthContext.Provider value={{ accessToken, setAccessToken }}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
```

**App.tsx**

```javascript
//Wrap the app by the context
<AuthProvider>
    <Routes>
    	<Route path="/" element={<Home />} />
    	<Route path="/about" element={<About />} />
    	<Route path="/dashboard" element={<Dashboard />} />
    	<Route path="/login" element={<Login />} />
    	<Route path="/register" element={<Register />} />
    </Routes>
</AuthProvider>
```

**Auth functions**

```javascript
//Login
const handleSubmit: FormSubmitType = async (event) => {
		event.preventDefault();
		await fetchCsrfToken();
		await baseApi
			.post("/auth/login", {
				email: formData.email,
				password: formData.password,
			})
			.then((response: AxiosResponse<LoginResponse | null>) => {
				setAccessToken(response.data?.accessToken ?? "");
				navigate("/dashboard");
			});
};

//Register
const handleSubmit: FormSubmitType = async (event) => {
		event.preventDefault();
		await baseApi
			.post("/auth/register", {
				name: formData.username,
				email: formData.email,
				password: formData.password,
				confirmPassword: formData.confirmPassword,
			})
			.then(() => {
				navigate("/login");
			})
			.catch((error) => {
				setError(
					error.response?.data.message ||
						"Registration failed. Please try again."
				);
			});
};

//Logout
const logout = async () => {
		await baseApi.post("/auth/logout", {}, { withCredentials: true });
		setAccessToken(null);
		window.location.href = "/login";
};
```
# How to Handle CORS in the Server

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Access-Control-Allow-Credentials',
    'X-CSRF-Token'
  ],
  optionsSuccessStatus: 200
}));
```

# How to Handle CSRF token

- CSRF Protection Is Only Needed for Cookie-Based Auth (/login, /refresh)
- No need to send with requests that use **Authorization: Bearer accessToken** in headers, which are **not automatically sent by the browser**, They are **not vulnerable to CSRF**
- Access tokens in `Authorization` header are **not** susceptible to CSRF
- If any of `POST,PUT,PATCH,DELET` endpoint rely on cookies for authentication then CSRF protection should be added because HTTP methods change server state. (no need for `GET` since they are read only and don't change server state)

## How to handle CSRF in Express

```javascript
import csrf from "csurf";

// CSRF protection
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

app.use(csrfProtection);

// CSRF token endpoint
app.get("/api/auth/csrf-token", (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## How to handle CSRF in React

- covered above

## What is `withCredintials : true` in requests

- This can be used with axios or fetch api headers from the front-end.
- by default, browsers block sending cookies in cross-origin requests for security.
- This allows the browser to send cookies (like refresh tokens) and other credentials from the client to the server during a request.

## Create and Implement Authentication middleware in Express

```javascript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export default function jwtAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ message: 'Access Denied' });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
}

//Protected route
router.get("/protected", authenticateToken, (req, res) => {
	res.json({ message: "Protected route accessed" });
});
```

# Input sanitisazion and validation is must

```javascript
// Input validation
 if (!email || !password || !name) {
   res.status(400).json({ message: 'All fields are required' });
   return;
 }

 // Email format validation
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!emailRegex.test(email)) {
   res.status(400).json({ message: 'Invalid email format' });
   return;
 }

 // Password strength validation
 if (password.length < 8) {
   res.status(400).json({ message: 'Password must be at least 8 characters long' });
   return;
 }

 //login
 if (!user) {
   // Use same response time to prevent user enumeration
   await bcrypt.compare(password, '$2b$12$dummy.hash.to.prevent.timing.attacks');
   res.status(401).json({ message: 'Invalid credentials' });
   return;
 }
```

# What more to think of

- password hasing is the best practice when save them on DB

```javascript
//hash when registering
const hashedPassword = await bcrypt.hash(password, 10);

//Check if the password is correct when login
const passwordMatch = await bcrypt.compare(password, user.password);
```

- need to detect Refresh Token reuse, need to block it before an attacker could rotate it. and try to detect if the token is used befre
- access token should be short lived (10-15min)
- Add token blacklisting for JWT (Set in local, redis in production)
- From the BE, implement a rate limiting for `/auth/login`, `/auth/refresh`, and other sensitive endpoints.

```javascript
npm install express-rate-limit //install type as well
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15mins
  max: 5,
  message: "Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
```

- using `sameSite:"strict"` helps to **block sending cookies on cross-site navigation** which is great in terms of CSRF protection.
- But, **FE should be on the same domain or subdomain as the server/API**

### Use these features for better security

```javascript
import helmet from 'helmet';
//this helps to protect against XSS, clickjacking, insecure headers
//and it Adds secure HTTP headers

import rateLimit from 'express-rate-limit';

import mongoSanitize from 'express-mongo-sanitize';
//this prevent MongoDB operator injection
//Removes keys starting with `$` or containing `.` (MongoDB operators)
//Prevents **NoSQL injection attacks**

// Security middleware - should come first
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],             		// Only allow resources from your domain
      styleSrc: ["'self'", "'unsafe-inline'"], 	// Allow inline styles (not recommended unless needed)
      scriptSrc: ["'self'"],              		// Only allow scripts from your domain
      imgSrc: ["'self'", "data:", "https:"],  	// Allow self, data URLs, and HTTPS images
    },
  },
  hsts: {
    maxAge: 31536000, // Enforce HTTPS for 1 year
    includeSubDomains: true,
    preload: true // Request inclusion in browsers' HSTS preload list
  }
}));

// Rate limiting for Prevent brute-force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));// Body parsing middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());// Cookie parsing
app.use(mongoSanitize());// Sanitize user input
app.use('/api/auth', authLimiter, authRoutes);// Routes with specific rate limiting
```

### Extra Features to add in server

```javascript
// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Global error:', error);
  
  if (error.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ message: 'Invalid CSRF token' });
    return;
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});
```

### refer these

```javascript
X-Content-Type-Options: nosniff	//Disable MIME type sniffing and it prevents content spoofing / XSS
X-Frame-Options: DENY // Protect the site from being embedded in an <iframe> and it Prevents clickjacking
Referrer-Policy: strict-origin-when-cross-origin //Restrict referrer data and it Prevents sensitive info leakage
```