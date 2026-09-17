## Fundamentals

At its core, **JavaScript is a synchronous** programming language.

That means **code statements run one after another sequentially**. So time-consuming tasks block the rest of the execution flow and the program can be unresponsive until the execution is finished. 

**ex)** The browser may be unresponsive while a time-consuming task is undergoing (browser freez... when aleart popup, other area not works).

At its heart, **JS is a single-threaded language**.

But JS environments like Browser and Node.js have **provided asynchronous behavior** to the language.

Once the time-consuming task is pushed into the call stack, its execution on the call stack is brief.It initiates the asynchronous operation (delegating it to the web API/Node.js API).

It then immediately pops off the call stack, allowing the rest of the synchronous code to run.
This actual asynchronous operation happens outside the call stack, in the browser and Node.js environments.

Once the time-consuming task is handled, then its associated callback function will be moved into the callback queue(event queue),
and once the call stack is empty, then this process will be pushed into the call stack.

This process is done by the event loop, which is basically responsible for keeping an eye on both the call stack and the event queue...

## asynchronous operation

An asynchronous operation is a task that starts now but finishes later.

## promises and async/awaits

A Promise is typically used to wrap operations that are asynchronous, such as non-blocking, IO-bound tasks.

in JavaScript, there are two primary methods to handle asynchronous operations (Promises):

1. then() /catch()
2. async, await

## then() /catch()

// Promise-based function
```javascript
const promiseFunction = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        const success = true;

        setTimeout(() => {
            if (success) {
                resolve("done");
            } else {
                reject(new Error("Something went wrong"));
            }
        }, 1000);
    });
};
```

### usage
```javascript
promiseFunction()
    .then(result => {
        console.log("Success:", result);
    })
    .catch(error => {
        console.error("Error:", error.message);
});
```

## async, await

// Async function calling the promise
```javascript
async function myFunc() {
    try {
        const result = await promiseFunction();
        console.log("Success:", result);
    } catch (error) {
        console.error("Error:", (error as Error).message);
    }
}
```

- **Any function declared with async automatically returns a Promise, even if it doesn't explicitly return one.**
  - The caller of this async function can then handle its result using .then() / .catch() or async/await.

```javascript
async function fetchData() {
    return "data"; //Even though fetchData just returns a string, it implicitly returns a Promise that resolves to "data".
}
```
