# NodeJs
## Overview

- When Node.js performs an I/O operation, like reading from the network, accessing a database or the filesystem, instead of blocking the thread and wasting CPU cycles waiting, Node.js will resume the operations when the response comes back.
- Whenever a new request is received, the request event is called, providing two objects: a request (an http.IncomingMessage object) and a response (an http.ServerResponse object).

 **Simplest NodeJs Server**
 
```javascript
const { createServer } = require('node:http')
//import { createServer } from 'node:http' 
//If you use import instead require, you need to add this in package.json ->"type": "module",

const hostname = '127.0.0.1'
const port = 3000

const server = createServer((req, res) => {
    res.statusCode = 200
    res.setHeader('Content-type', 'text/plain')
    res.end('Hello World')
})

server.listen(port, hostname, () => { console.log(`server is running a http://${hostname}:${port}/`) })
```

## Modules
- Before executing a module, Node.js wraps all the code inside that module with a function wrapper

```javascript
(function(exports, require, module, __filename, __dirname) {
    // Module code
});
```

### IIFE - Immediately Invoked Function Expression

- In Node.js, every module is wrapped in an Immediately Invoked Function Expression (IIFE) behind the scenes. This provides module scope isolation and gives access to special local variables like exports, require, module, __filename, and __dirname.
- This pattern ensures that variables defined in one module do not pollute the global scope, and it enables the CommonJS module system.
- 
```javascript
(function (exports, require, module, __filename, __dirname) {
    // Your module code here
})();
```

- Node.js supports two module systems. CommonJS Modules and  ES modules

### CommonJS Modules
```javascript

// math.js - Multiple exports using module.exports object
module.exports = {
  add: function(a, b) {
    return a + b;
  },
  subtract: function(a, b) {
    return a - b;
  }
};

//imports
const math = require('./math');
console.log(math.add(5, 3));      // 8
console.log(math.subtract(5, 3)); // 2

// math.js - Named Exports
function add(a, b) {
  return a + b;
}
module.exports.add = add; || module.exports = {add, subtract};

// imports
const math = require('./math');
let result = math.add(a, b); || const { add, subtract } = require('./math');

// math.js - Default Export
function anotherFunction(a, b) {
  return a * b;
}
module.exports = anotherFunction;

// imports
const math = require('./math');
const add = math;
```
- When you use the require() function to import the same module multiple times, the require() function evaluates the module once only at the first call and places it in a cache.
- From the subsequent calls, the require() function uses the exports object from the cache instead of executing the module again.
- File extensions are optional (but recommended for clarity)
- Always use relative paths for local modules (./ or ../)

### ES modules (Node ≥ 14.0.0)

- Extention is **.mjs** or set **"type" : "module"** in **nearest parent package.json**
- **File extensions are mandatory** in import path
- **Always use relative paths** for local modules (`./` or `../`)

```javascript
//Exports
export { add, subtract };
export default class User {}

//Imports
import { add, subtract } from './math.mjs';
import User from './user.js';

#Named vs Namespace Imports
// Named imports (specific exports)
import { add, subtract } from './math.js';

// Namespace import (all exports as an object)
import * as math from './math.js';
console.log(math.add(5, 3));
```

**Top-level await**

- ES Modules support top-level await (without async function):

```javascript
// data.js
export const data = await fetch('https://api.example.com/data')
  .then(response => response.json());

// app.js
import { data } from './data.js';
// data is already resolved when imported
console.log(data);
```

### Path Module
```javascript
const path = require('path'); //For common
import path from 'path'; //For ES

//Properties
path.sep
path.delimiter

//Methods
path.basename(path, [,ext]) //if the extension is provided, file name return without an extention
path.dirname(path) //return only dirname
path.extname(path) //console.log(path.extname('index.html')); //.html
path.format(pathObj)
path.isAbsolute(path)
path.join(...path) //console.log(path.join('/home', 'js', 'dist', 'app.js')) //\home\js\dist\app.js
path.normalize(path)
path.parse(path) //return an object -> path.parse("c://mad/react/app.js").basename)
path.relative(from, to)
path.resolve(...path)
```

### FS Module

- There are 3 types
- Promise API | Callback API | Sync API

**Promise API**

```javascript
import * as fs from "fs/promises"
import * as fs from "fs/promises"

try{
    //create directory
    await fs.mkdir("/home/madusanka/DEVS") //path should be correct and exist
    await fs.mkdir("/home/madusanka", {recursive:true}) //now the folder is created even if the parent folder not exists
    
    //read a directory
    const files = await fs.readdir("/home/madusanka/DEVS")
    for(const file of files){
        console.log(file)
    }

    //remove directory (directory should be empty)
    await fs.rmdir("/home/madusanka/DEVS/fs")

    //Create and write file
    await fs.writeFile("/home/madusanka/DEVS/abc.txt", "Hello World") //override file content if exist

    //Read file
    const data = await fs.readFile("/home/madusanka/DEVS/abc.txt", "utf-8")
    console.log(data);

    //Append file
    await fs.appendFile("/home/madusanka/DEVS/abc.txt", "\nnew content")

    //Copying file (destination file will be created if not present)
    await fs.copyFile("/home/madusanka/DEVS/abc.txt", "/home/madusanka/DEVS/abcd.txt")
 
}catch(error){
    console.log(error)
}
```

**Callback API**

- all the above function can be used, but import is changes and no need try catch, instead we use callback function

```javascript
import * as fs from "fs"

fs.mkdir("/home/intervest/DEVS/FS Module/new directory", function(error, data){
    if(error) throw error;
})
```

**Sync APi**

- no need to add callback as well, but use `Sync` at the end of the method name

```javascript
import * as fs from "fs"
fs.mkdirSync("/home/intervest/DEVS/FS Module/new directory", {recursive:true})
```

### Os Module
- The os module provides you with many useful properties and methods for interacting with the operating system and server.

```javascript
const os = require('os');
import os from 'os';

os.type()
os.arch() //x64
os.platform() //win32
os.release()
os.version()
os.uptime()
os.userInfo()
os.totalmem()
os.freemem()
os.cpus() //cpu as an object
os.networkInterfaces()
```

### URL Module

```javascript
import {URL} from 'url'

const myUrl = new URL("https://yahoo.com:8080?query=someQuery#someHash")

console.log(myUrl.hash)
console.log(myUrl.host)
console.log(myUrl.hostname)
console.log(myUrl.port)
console.log(myUrl.href)
console.log(myUrl.protocol)
console.log(myUrl.search)
console.log(myUrl.searchParams)

//Both works same
console.log(myUrl.toString())
console.log(myUrl.toJSON())
```

### Event Module

- Node.js is event-driven. It relies on the events core module to achieve the event-driven architecture.
- In the event-driven model, an EventEmitter object raises an event that causes the previously attached listeners of the event to execute.

```javascript
const EventEmitter = require('events');
//import EventEmitter from  'events';

const emitter = new EventEmitter();

emitter.on('saved', (arg) => {
    console.log(`A saved event occurred.`);
});

emitter.once('onetime', (arg) => {
    console.log(`This will be emited only one time, no matter how much time called.`);
});

emitter.emit('saved',{...someData});//A saved event occurred.

// remove the event listener
emitter.off('saved', log); //After removing, no effect on reemiting the same event
```
- The **EventEmitter** class can be extended as you need

```javascript
class Stock extends EventEmitter {....code}
```

### HTTP Module
- The http module is a core module of Node designed to support many features of the HTTP protocol.
- in real world we use Express like frameworks to create NodeJs servers

```javascript
import http from 'http'

const server = http.createServer((req,res)=>{
    // console.log(req)
    res.setHeader("Content-Type", "text/html")
    res.statusCode = 404
    res.statusMessage = "BAD"

    //Short way
    res.writeHead(202,"Good", {"Content-Type": "text/html"})

    res.write('<h1>Hello from NodeJs</h1>')
})

server.listen(8000, ()=>console.log("Server is Up!"))
```

### Routing

```javascript
import http from 'http'

const server = http.createServer((req, res) => {
    if (req.url === "/") {
        res.end("<h1>Home</h1>")
    }else if(req.url === "/about"){
        res.end("<h1>About</h1>")
    }else{
        res.end("<h1>Not Found :(</h1>")
    }
})

server.listen(8000, () => console.log("Server is Up!"))
```

### Serving Files

```javascript
import http from 'http'
import * as fs from 'fs'

const server = http.createServer((req, res) => {
    if (req.url === "/") {
        res.writeHead(200, "Good", { "Content-Type": "text/html" })
        fs.readFile("./public/Home.html", (error, data) => {
            if (error) throw error
            res.end(data)
        })

    } else {
        res.end("<h1>Not Found :(</h1>")
    }
})

server.listen(8000, () => console.log("Server is Up!"))
```

### Process module
- The process module has the env property that contains all the environment variables.
- Setting and getting an environment variable

```javascript
SET NODE_ENV=development //Windows
EXPORT NODE_ENV=development //Mac/Linux
process.env.NODE_ENV
```

## Stream

- Node.js streams provide an efficient way to work with large amounts of data (such as files or network responses) **without loading the entire dataset into memory**. Streams handle data in chunks and can be in one of four types: **Readable, Writable, Duplex** (both readable and writable), or **Transform** (modifies data as it passes through). Streams are ideal for performance-critical applications.

- Streams can **pipe** data between sources and destinations (e.g., reading from a file and writing to another).
- By default, the internal buffer size is **64 KB (65536 bytes)** for streams using binary mode.
- The buffer size can be customized using the `highWaterMark` option.
- This streaming approach improves memory usage and application responsiveness, especially with large data.

### Example: Reading a Large File Using `createReadStream`

```javascript
// Step 1: Generate a file with a large dataset
import fs from 'fs';

for (let i = 0; i < 10000; i++) {
  // Append data to 'data.txt'
  fs.writeFileSync("./data.txt", `${i}\n`, { flag: "a" });
}

import { createReadStream } from 'fs';

// Step 2: Read the file using a readable stream
// 'highWaterMark' can be used to set buffer size (in bytes)
// 'encoding' set to 'utf-8' to get string data instead of buffers
const stream = createReadStream("./data.txt", {
  encoding: "utf-8",
  // highWaterMark: 10000 // Optional: customize buffer size
});

// Step 3: Listen to 'data' event to process chunks
stream.on("data", (chunk) => {
  console.log(chunk); // Logs each chunk of data
});

```
- 'data' is a built-in event name defined by Node.js core, specifically for Readable streams. It's not an arbitrary name — it must be 'data' to work as expected.
- if you're using Node.js streams, you must use the core-defined event names like:

'data' — when a chunk is available
'end' — when the stream ends
'error' — if something goes wrong
'close' — when the stream is closed

# ExpressJs
```javascript
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

## Routing
- Each route can have one or more handler functions, which are executed when the route is matched.

```javascript
app.get('/', (req, res) => {
  res.send('Hello World!')
})
```
- **app.all(),** used to load middleware functions at a path for all HTTP request methods.
- Route paths can be strings, string patterns, or regular expressions.

### Route paths

```javascript
app.get('/ab?cd', (req, res) => { }) //match acd and abcd.
app.get('/ab+cd', (req, res) => { }) //match abcd, abbcd, abbbcd, and so on.
app.get('/ab*cd', (req, res) => { }) //match abcd, abxcd, abRANDOMcd, ab123cd, and so on.
app.get('/ab(cd)?e', (req, res) => { }) //match /abe and /abcde.
app.get('/a/', (req, res) => { }) //match anything with an “a” in it.
app.get('/.*fly$/', (req, res) => { }) //match butterfly and dragonfly, but not butterflyman, dragonflyman, and so on.
```

### Route parameters

- The name of route parameters must be made up of “word characters” ([A-Za-z0-9_]).
- In express 5, Regexp characters are not supported in route path

```javascript
app.get('/users/:userId/books/:bookId', (req, res) => {})
```

- To have more control over the exact string that can be matched by a route parameter, you can append a regular expression in parentheses (()):

```javascript
Route path: /user/:userId(\d+)
Request URL: http://localhost:3000/user/42
req.params: {"userId": "42"}
```

### Route handlers

- You can provide multiple callback functions that behave like middleware to handle a request.
- Route handlers can be in the form of a function, an array of functions, or combinations of both
- If the next() method is not called within a particular middleware function in Express.js, the subsequent middleware and route handlers will not be executed.

```javascript
const cb0 = function (req, res, next) {
  console.log('CB0')
  next() //Passing controll no next middleware or handler
}

const cb1 = function (req, res, next) {
  console.log('CB1')
  next() //Passing controll no next middleware or handler
}

app.get('/example/d', [cb0, cb1], (req, res, next) => {
  console.log('the response will be sent by the next function ...')
  next()
}, (req, res) => {
  res.send('Hello from D!')
})
```

### app.route()

- You can create chainable route handlers for a route path by using `app.route()`

```javascript
app.route('/book')
  .get((req, res) => {
    res.send('Get a random book')
  })
  .post((req, res) => {
    res.send('Add a book')
  })
  .put((req, res) => {
    res.send('Update the book')
  })
```

### express.Router
- Use the `express.Router` class to create modular, mountable route handlers.

```javascript
#Birds.js

const express = require('express') //or import if you use "type":"module" in nearest parent package.json
const router = express.Router()

//if the parent route /birds has path parameters, To make them accessible from the sub-routes.
const router = express.Router({ mergeParams: true }) 

// middleware that is specific to this router
const timeLog = (req, res, next) => {
  console.log('Time: ', Date.now())
  next()
}
router.use(timeLog)

// define the home page route
router.get('/', (req, res) => {
  res.send('Birds home page')
})
// define the about route
router.get('/about', (req, res) => {
  res.send('About birds')
})

//route handlers can be moved into separate controllers if you wish

module.exports = router ////or export default router, if you use "type":"module" in nearest parent package.json

# app.js
const birds = require('./birds') //or import if you use "type":"module" in nearest parent package.json
app.use('/birds', birds)
```

## Serving static files

- For more refer [Doc](https://expressjs.com/id/resources/middleware/serve-static.html)

```javascript
app.use(express.static('public'))
app.use(express.static('files'))
app.use('/static', express.static('public')) //To create a virtual path prefix
//path is relative to the directory from where you launch your node process
//If you run the express app from another directory, it’s safer to use the absolute path of the directory that you want to serve
app.use('/static', express.static(path.join(__dirname, 'public')))
```

## Middlewares

- `next('route')` will work only in middleware functions that were loaded by using the `app.METHOD()` or `router.METHOD()` functions.

```javascript
app.get('/user/:id', (req, res, next) => {
  // if the user ID is 0, skip to the next route
  if (req.params.id === '0') next('route')
  // otherwise pass the control to the next middleware function in this stack
  else next()
}, (req, res, next) => {
  // send a regular response
  res.send('regular')
})

// handler for the /user/:id path, which sends a special response
app.get('/user/:id', (req, res, next) => {
  res.send('special')
})

//Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
```
- **Error-handling middleware** always takes **four** arguments. You must provide four arguments to identify it as an error-handling middleware function. Even if you don’t need to use the next object, you must specify it to maintain the signature. Otherwise, the next object will be interpreted as regular middleware and will fail to handle errors.

## Template Engins

```javascript
npm install ejs

#index.js
import { router as viewRouter } from './routes/views.js'
const app = express();
app.set('view engine', 'ejs'); // Set the view engine to EJS
app.use('/views', viewRouter); // This will handle requests to /views

#routes/views.js
import express from 'express'
import { homePage } from '../controllers/views.js';

const router = express.Router()
router.get('/home', homePage);
export { router };

#controllers/views.js
const homePage = (req, res, next) => {
    res.render('index'); // Render the index view in the views folder
}
export { homePage };

#create a `views` directory in the root folder and add index.html with simple html template, now go to the
#http://localhost:5000/views/home and you can see the html file

```
