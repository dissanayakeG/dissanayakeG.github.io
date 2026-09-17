# PHP

## Create a local PHP Server

- If you want to run a PHP project or test a PHP file outside of the default web server directories (like `/var/www/html` on `Linux` or `xampp/htdocs` on `Windows`), you can use PHP’s built-in development server.

```bash
php -S localhost:<port> -> php -S localhost:8000 # -S should be uppercase
php -S localhost:8000 -t public
#-t public -> Sets the document root (the folder PHP serves) to the public/ directory.
```

## What is PHP

- php is a scripting language like js, not a programming language
- programming language = compile
- scripting language = interpreted
- static keyword can use for caching the values.

## How PHP works (simple)
1. Browser requests a URL (e.g. `https://example.com/` → server receives `GET /`).
2. Web server (Apache, Nginx, etc.) checks the document root for configured index files (e.g. `index.php`, `index.html`).
3. If an index file is found and PHP is configured, the server hands the .php file to the PHP handler (via mod_php or PHP-FPM).
4. PHP parses and compiles the script into opcodes (cached by OPcache for performance), executes it, and returns the output (HTML, JSON, etc.) to the web server → then to the browser.
5. If no index file exists and directory listing is enabled, the server returns a file listing (a security risk).
6. Use server config (e.g. `Options -Indexes` in Apache or `autoindex off` in Nginx) to prevent directory listings.

## PHP Fundamentals

### echo, print_r vs var_dump

- `echo` only print strings/numbers, return value is void
- `print_r` can print arrays and objects, return value is true or string, result is human-readable
- `var_dump` support all data types (strings, integers, floats, arrays, objects, booleans, NULL, etc), return value is void, result has more details (type, length...)

## PHP Types

- PHP keywords are case-insensitive -> null,NULL,NuLL

### Type juggling

- When comparing variables of different types, PHP will convert them to the common, comparable type.

```php
<?php
$qty = 20;
if($qty == '20') {
    echo 'Equal'; //Equal
}

$total = 100;
$qty = "20 pieces";
$total = $total + $qty;

echo $total; // 120 //PHP casts the string “20 pieces” as an integer 20 before calculating the sum
```

<!-- ## Operators -->

<!-- ## Control flow -->

## Functions

- PHP 8.0 introduced named parameters.
- Use named arguments to pass arguments to a function based on the parameter names.
- Put the named arguments after the positional arguments in function calls.
- you can ignore passing values for default parameters
- A variadic function accepts a variable number of arguments.
- Do use the ... operator to define a variadic function.
- Only the last parameter can be variadic.

```php
<?php

function sum($a, $b, int ...$numbers): int
{
    return array_sum($numbers);
}
```

<!-- ## Array -->

<!-- ## Sorting Arrays -->

## Advanced Functions

### Anonymous functions

- An anonymous function is a function without a name.
- An anonymous function is a Closure object.
- To access the variables from the parent scope inside an anonymous function, place the variables in the use construct.
- An anonymous function can be assigned to a variable, passed to a function, or returned from a function.

### Arrow functions (php 7.4)

- An arrow function provides a shorter syntax for writing a short anonymous function.
- An arrow function starts with the fn keyword and contains only one expression, the function’s return value.
- An arrow function has access to the variables in its parent scope automatically.

### Variable functions

- Append parentheses () to a variable name to call the function whose name is the same as the variable’s value.
- Use the `$this->$variable()` to call a method of a class.
- Use the className::$variable() to call a static method of a class.

```php
<?php

$f = 'strlen';
echo $f('Hello'); # strlen('Hello) -> 5
```

## Variable constructs(language construct)

- These are built-in language constructs, not regular functions.
- This means you cannot assign them to a variable, return them from a function, or call them dynamically
> (e.g., $f = 'isset'; $f($var) won’t work).
- There are 3 Variable constructs -> `isset($a1,$$a2, $a3,...)` | `empty($val)` | `is_null($val)`
- `isset()` is a language construct, not a function.
- `isset()` returns true if a variable is set and not null.
- `isset()` returns true if an array element exists and is not null.
- `isset()` returns true if a string index is valid or false otherwise.
- `isset()` returns true if all variables are set and not null. It’ll stop evaluating once it encounters an unset variable.
- `empty()` returns true for all of these `[false, 0, 0.0, "0", '', null, []]`
- Use the PHP `empty()` construct to check if a variable is not set or its value is false.
- The `is_null()` checks a value and returns true if that value is exactly null. Otherwise, it returns false.
- The `is_null()` behaves the same as the identity operator `(===)`.

## Advanced Array Operations
- Use the PHP `array_map()` method to create a new array by applying a callback function to every element of another array.

```php
<?php

$lengths = [10, 20, 30];
// calculate areas
$areas = array_map(
	fn ($length) => $length * $length,
	$lengths
);
print_r($areas);
```
- When you want to filter elements of an array, you often iterate over the elements and check whether the result array should include each element. You can do that by using `array_filter()`.

```php
<?php

$numbers = [1, 2, 3, 4, 5];
$odd_numbers = array_filter(
	$numbers,
	fn ($number) => $number % 2 === 1
);
print_r($odd_numbers);

# Using callback as a method of a class
array_filter($numbers,[**new Odd()**, 'isOdd']) //if isOdd is a public method of Odd class
array_filter($numbers,['Odd', 'isOdd']) //if isOdd is a static method of Odd class
array_filter($numbers,new Odd()) //if you want to pass __invoke() as the callback function
```
- you can pass 3rd argument as well.
- `ARRAY_FILTER_USE_KEY` if you want to filter by `$key` from the callback funcion.
- `ARRAY_FILTER_USE_BOTH` if you want to pass both the key and value of the element to the callback function.

- Use the PHP `array_reduce()` function to reduce an array to a single value using a callback function.

```php
<?php

$numbers = [10,20,30];
$total  = array_reduce(
    $numbers,
    fn ($previous, $current) => $previous + $current
);
echo $total; // 60
```

<!-- ## Organizing PHP files -->

## State Management

### cookie

- The web works based on the HTTP protocol. The HTTP protocol is `stateless`.
- Stateless means each request is `independent` and the server doesn’t automatically remember previous interactions.
- Cookies help solve this problem by allowing servers to store small pieces of data on the client (browser).
- A cookie is a small data record that the server sends to the browser, usually via the Set-Cookie response header.
- The browser stores this cookie and automatically includes it in `subsequent requests` to the `same server` using the Cookie request header.
- The browser will only send cookies to the same domain, path, and protocol (based on the cookie’s attributes like `domain`, `path`, `secure`, and `samesite`).
- Usually cookie used for enhance the user experience
  - `Session management:` to remember users and their login information
  - `Personalization:` store user’s preferences, themes, and other settings.
  - `Tracking:` cookies store user behavior.
- Use the PHP `setcookie()` function to set a cookie sent along with an HTTP header from the web server to the web browser.
- Use the superglobal variable `$_COOKIE` to access the cookies in PHP.

```php
# Setting a cookie
setcookie ( 
    string $name , 
    string $value = "" , 
    array $options = [] //expires, path, domain, secure, httponly and samesite
    ) : bool

setcookie('name','value',
          [	
            'expires' => time() + 7 * 86400,  // 7 days from now,
          	'path' => '/',
        	'secure' => true,
        	'httponly' => true,
        	'samesite' => 'Lax'
          ]);

# samesite can take a value of None, Lax, or Strict
# if $secure is set to true , the cookie should be transmitted over a secured HTTP (HTTPS) connection from the web browser.
# if $httponly is true, the cookie can be accessed only via the HTTP protocol, not JavaScript.

# Reading a cookie
    if (isset($_COOKIE['cookie_name'])) {...)
# Deleting a cookie
    unset($_COOKIE['cookie_name']);
	setcookie('cookie_name', null, time()-3600); //can be deleted by setting a past date as the expiry date
```

### Session

- HTTP is `stateless`, so to persist user-specific data across multiple requests, web applications use sessions.
- A session is managed by the application layer (e.g., `PHP`) , not by `Apache` or `Nginx`.
- Unlike cookies, you can store any data in the session.
- PHP allows you to work with `multiple sessions` with different names on the same script.
- When the `ession_start()` runs at the first time, PHP generates a unique session id and passes it to the web browser in the form of a cookie named `PHPSESSID` (usually `Set-Cookie: PHPSESSID=xyz`).
- If a session already exists, PHP checks the `PHPSESSID` cookie sent by the browser, the `session_start()` function will resume the existing session instead of creating a new one.
- Since PHP sends the `PHPSESSID` cookie in the header of the HTTP response, you need to call the `session_start()` function before any statement that outputs the content to the web browser.
- Otherwise, you will get a warning message saying the header cannot be modified because it is already sent. This is a well-known error message in PHP.

```php
<?php

# get session data stored location
# /tmp folder of the web server
echo ini_get('session.save_path'); //OR
echo session_save_path();

# store values
// store scalar value
$_SESSION['user'] = 'admin';
// store an array
$_SESSION['roles'] = ['administrator', 'approver', 'editor'];

# deleting session values
session_destroy();

# This  session_destroy() deletes all data associated with the current session. However, it does not unset data in the  $_SESSION array and cookie.

# To completely destroy the session data, you need to unset the variable in  $_SESSION array and remove the PHPSESSID cookie like this:

// remove cookie
if(isset($_COOKIE[session_name()])){
    setcookie(session_name(),'',time() - 3600, '/');
}

// unset data in $_SESSION
$_SESSION[] = array();

// destroy the session
session_destroy();
```

## Processing Forms

- users can input scripts like `<script>alert('Hello');</script>` into input fields.
- Hackers can input malicious code from another server to the user’s web browser, the risk is higher.
- This type of attack is called `cross-site scripting (XSS)` attack.
- Therefore, before displaying user input on a webpage, you should always escape the data. To do that, 
    you use the `htmlspecialchars()` function:
- When you use get request `($_GET)`, it appends input as query data, so use `htmlspecialchars()` to prevent XSS.
- When submiting a form to same file, use htmlspecialchars() to prevent XSS.

```php
# ex 1
<?php
if (isset($_POST['name'], $_POST['email'])) {
	$name = htmlspecialchars($_POST['name']);
	$email = htmlspecialchars($_POST['email']);

	// show the $name and $email
	echo "Thanks $name for your subscription.<br>";
	echo "Please confirm it in your inbox of the email $email.";
} else {
	echo 'You need to provide your name and email address.';
}

# ex 2
<form action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']) ?>" method="post">
```

### Form validation flow

`Validate → Sanitize → Escape`

Validate
- Ensure the input has the correct format, type, and value before using it.
- Use validation filters or regex — e.g. `filter_var($email, FILTER_VALIDATE_EMAIL)`

Sanitize
- Clean the input by removing or altering unwanted or dangerous characters before storing or processing.
- Use sanitization filters — e.g. `filter_var($name, FILTER_SANITIZE_STRING) or FILTER_SANITIZE_EMAIL`

Escape
- Neutralize special characters before displaying or outputting (HTML, JS, SQL, etc.) to prevent injection attacks.
- Use `htmlspecialchars()` when displaying in HTML, and `PDO prepared statements` when inserting into a database.

### isset() vs filter_has_var()

```php
<?php
	$_POST['email'] = 'example@phptutorial.net';
	if(isset($_POST['email'])) // return true

	$_POST['email'] = 'example@phptutorial.net';
	if(filter_has_var(INPUT_POST, 'email')) // return false //check request body


   //Use the filter_has_var() function to check if a variable exists in a specified type,
   //including INPUT_POST, INPUT_GET, INPUT_COOKIE, INPUT_SERVER, or INPUT_ENV.
```

- Use `filter_input()` and `filter_var()` functions to validate and sanitize data.

### filter_var() for sanitize and validate data

- Works on variables already in memory, not directly from the request. -> (user defined variables, superglobals like `$_GET('val')`)

```php
//filter_var ( mixed $value , int $filter = FILTER_DEFAULT , array|int $options = 0 ) : mixed

<?php

if (filter_has_var(INPUT_GET, 'id')) {
	// sanitize id
	// FILTER_SANITIZE_NUMBER_INT will remove all characters except the digits, plus, and minus signs from the id variable.
	$clean_id = filter_var($_GET['id'], FILTER_SANITIZE_NUMBER_INT);

	// validate id
	$id = filter_var($clean_id, FILTER_VALIDATE_INT);

	// validate id with options
    $id = filter_var($clean_id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 10]]);

	// show the id if it's valid
	echo $id === false ? 'Invalid id' : $id;
} else {
	echo 'id is required.';
}
```

### filter_input() for sanitize and validate user inputs (HTTP)

- `filter_input ( int $type , string $var_name , int $filter = FILTER_DEFAULT , array|int $options = 0 ) : mixed`
- allows you to get an external variable by its name and filter it using one or more built-in filters.
- The following example uses the filter_input() function to sanitize data for a search form:

```php
<?php

$term_html = filter_input(INPUT_GET, 'term', FILTER_SANITIZE_SPECIAL_CHARS); //value for showing on the search field
$term_url = filter_input(INPUT_GET, 'term', FILTER_SANITIZE_ENCODED); //value for displaying on the page

?>
<form action="search.php" method="get">
    <label for="term"> Search </label>
    <input type="search" name="term" id="term" value="<?php echo $term_html ?>">
    <input type="submit" value="Search">
</form>

<?php

if (null !== $term_html) {
	echo "The search result for <mark> $term_html </mark>.";
}
```

### filter_input vs. filter_var

- `filter_input` Validate and sanitize inputs like `POST request`. -> `INPUT_GET` and `INPUT_POST`
- `filter_var` Validate and sanitize a variable you already have in memory. -> `Any local variable including superglobals`
- you just can `$input = $_POST['email']`, if you want to use` filter_var`, instead of `filter_input`

```php
$input = $_POST['email'] ?? '';
$validated = filter_var($input, FILTER_VALIDATE_EMAIL);

//OR just
$validated = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
```

- `filter_input` Filtered value on success, false on failure or not found
- `filter_var` Filtered value on success, false on validation failure
- `filter_input` fails when Variable is not set in the input type or validation fails
- `filter_var` fails when Variable is invalid or fails validation
- `filter_input` can be used for Validate / sanitize form input
- `filter_var` can be used for validate/ sanitize variables
- If a variable doesn’t exist, the `filter_input()` function returns `null` while the `filter_var()` function returns an `empty string` and issues a `notice of an undefined index`.
- Also, the `filter_input()` function doesn’t get the current values of the `$_GET`, `$_POST`, … superglobal variables. Instead, it uses the `original values submitted in the HTTP request`. For example:

### CSRF

- CSRF (Cross-Site Request Forgery) is when another website tricks your browser into sending a legitimate request to a site where you’re already logged in.

- The trick works because your browser automatically includes cookies/session data for any site you’re logged into — even if the request didn’t come directly from you.

#### 1️⃣ You’re logged into your bank
- You log in at `yourbank.com`.
- Your browser now has a session cookie (e.g. `sessionid=abc123`) that keeps you logged in.
- So, any request sent to `yourbank.com` will automatically include that cookie — even if you didn’t type or click anything.

#### 2️⃣ You visit a malicious website
- You go to `malicious-site.com`.
- That site secretly contains some HTML like this:

```html
<form action="https://yourbank.com/transfer-fund" method="POST" id="attackForm">
	<input type="hidden" name="amount" value="10000" />
	<input type="hidden" name="to_account" value="attacker123" />
</form>

<script>
	document.getElementById("attackForm").submit(); // auto-submit when the page loads
</script>
```

#### 3️⃣ What happens next
- As soon as the page loads:
    - That hidden form automatically submits a POST request to `https://yourbank.com/transfer-fund`.
    - Your browser includes your bank’s login cookie (since you’re logged in there).
    - To your bank’s server, it looks like you legitimately submitted the transfer form — even though you didn’t.
    - So the bank would execute the transfer if it doesn’t have protection (CSRF defense).

#### 4️⃣ Why CSRF works
- It abuses the browser’s automatic cookie handling.
- The attacker’s page never sees your cookies, but it can trigger a request that includes them.

#### How websites defend against it
- A secure website adds a CSRF token to every sensitive form.

```php
session_start();
$_SESSION['token'] = bin2hex(random_bytes(35));

// in the form
<input type="hidden" name="token" value="<?= $_SESSION['token'] ?? '' ?>">

//Check the submitted token with the one stored in the $_SESSION to prevent the CSRF attacks.
```

- Then the server checks:
    - If the request includes this token.
    - If it matches the token stored in your session.
- The malicious site can’t know or guess that token, so the forged request fails.

### PRG (Post-Redirect-Get)
When a user submits a form (like a registration form or payment form):
- The form sends data with a POST request.
- The server processes it (e.g., inserts into DB, sends an email).
- The server then displays a “Success” page.
- Now, if the user refreshes the page, the browser says: “Resubmit the form data?”
- If they click Yes, the same POST request runs again — meaning the same data might get inserted twice, or payment might process again.
- That’s the double-submit problem.

The PRG Solution
- `POST`:The user submits the form → server processes the data.
- `REDIRECT`:Instead of showing a success message directly, the server sends a redirect response (HTTP 302 or 303) to a GET URL.
- `GET`:The browser then automatically loads that new URL — a normal GET request — where you display the success message.
- `Result`: Refreshing the page now only reloads the GET page, not the original POST submission.

```php
<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Process form (e.g., save to DB)
    $_SESSION['message'] = 'Form submitted successfully!';

    // Redirect to the same page using GET
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>PRG Example</title></head>
<body>
  <?php
  if (!empty($_SESSION['message'])) {
      echo '<p>' . htmlspecialchars($_SESSION['message']) . '</p>';
      unset($_SESSION['message']); // clear after showing
  }
  ?>

  <form method="post">
      <input type="text" name="name" placeholder="Enter name" required>
      <button type="submit">Submit</button>
  </form>
</body>
</html>
```

### File Upload

- Use the input with `type="file"` to create a file input element and include the `enctype="multipart/form-data"` attribute in the form to allow the file upload.
- Access the uploaded file information via the `$_FILES` array.
- Never trust the information on the `$_FILES` except the `tmp_name`.
- Always validate the information on the `$_FILES`.
- Use the `move_uploaded_file()` function to move the file from the temporary directory to another folder.
- File input element must have the multiple attribute and its name must have the square brackets `([])` like this

```php
<input type="file" name="files[]" id="files" multiple />
```

### password_hash and password_verify

- Use the PHP `password_hash()` function to create a hash password using a secure one-way hashing algorithm.
- Use the PHP `password_verify()` function to check if a password matches a hashed password created by the `password_hash()` function.

```php
password_hash(
     string $password,
     string|int|null $algo,
     array $options = []
): string

//PASSWORD_DEFAULT -> bcrypt
//PASSWORD_BCRYPT -> CRYPT_BLOWFISH
//PASSWORD_ARGON2I -> Argon2i
//PASSWORD_ARGON2ID -> Argon2id

<?php

$password = 'Password1';
echo password_hash($password, PASSWORD_DEFAULT);

password_verify(string $password, string $hash): bool
// $password is a plain text password to match.
// $hash is a hash created by the password_hash() function.
```

<!-- ## Login System -->

## Working with Files

```php
$f = fopen($filename, 'r'); //open the readme.txt for reading.
fclose($f); //close the file

if(file_exists($filename)){...}
# check if the file readme.txt exists in the current directory:
# $filename can be also a path to a directory. In this case, the file_exists() function returns true if the directory exists.

if (is_file($filename)) {...}
# check if a path is a file (not a directory) and exists

if (is_readable($filename)) {...}
# check if a file exists and readable

if (is_writable($filename)) {...}
# check if a file exists and writable
```

- Use the `fread(resource $stream , int $length)` function to read some or all contents from a file.
- Use the `fgets(resource $handle , int $length = ?)` function to read a line from a file.
- Use the `feof()` function to test the end-of-file has been reached.
- Use the `filesize()` function to get the size of the file.
- Use the PHP `file_get_contents()` function to read a file into a string.
- `file_get_contents()` function is a shortcut for opening a file, reading the whole file’s contents into a `string`, and close it.

```php
$content = file_get_contents(
	$filename = $filename,
    $use_include_path = false , 
    $context = null ,
	$offset = 5,
	$maxlen = 20
);
```

- Use the PHP `file()` to read the contents of a `local or remote` file into an `array`. Each line of the file will be an element of the array.

```php
<?php

$lines = file(
    'https://www.php.net/robots.txt',
    FILE_SKIP_EMPTY_LINES | FILE_IGNORE_NEW_LINES
);
//FILE_USE_INCLUDE_PATH -> Search for the file in the include path.
//FILE_IGNORE_NEW_LINES -> Skip the newline at the end of the array element.
//FILE_SKIP_EMPTY_LINES -> Skip empty lines in the file.

# If your system or network uses a proxy server (for internet access control, filtering, or security), direct connections to external URLs (like php.net) may be blocked.
# use stream_context_create() function in such cases
```

- The `readfile()` function reads data from a file and writes it to the output buffer.
- We can use `readfile()` to download a file.
- Use the PHP `copy($source,$dest,$context=?)` file function to copy a file from a location to another.
- The `copy()` function overwrites the destination file if it exists.
- Use PHP `unlink($filename,  $context=?)` function to delete a file.
- Use the PHP `rename($oldname,$newname,$context = ?)` file function to rename a file.

### CSV (comma-separated values)

#### Writing to a CSV file

- Use the fputcsv() function to write a row to a CSV file.

```php
fputcsv ( resource $handle , array $fields , string $delimiter = "," , string $enclosure = '"' , string $escape_char = "\\" ) : int|false

# ex
<?php

$data = [
	['Symbol', 'Company', 'Price'],
	['GOOG', 'Google Inc.', '800'],
];

$filename = 'stock.csv';
$f = fopen($filename, 'w');// open csv file for writing

if ($f === false) {
	die('Error opening the file ' . $filename);
}

// write each row at a time to a file
foreach ($data as $row) {
	fputcsv($f, $row);
}
fclose($f);// close the file
```

#### Reading from a CSV file

- Use the fgetcsv() function to read a row from a CSV file.

```php
fgetcsv ( resource $stream , int $length = 0 , string $separator = "," , string $enclosure = '"' , string $escape = "\\" ) : array

# ex
<?php

$filename = './stock.csv';
$data = [];

// open the file
$f = fopen($filename, 'r');

if ($f === false) {
	die('Cannot open the file ' . $filename);
}

// read each line in CSV file at a time
while (($row = fgetcsv($f)) !== false) {
	$data[] = $row;
}

// close the file
fclose($f);
```

- Use the PHP `filesize($filename)` function to get the size of a file in bytes.
- Use the `is_readable()`, `is_writable()`, `is_executable()` to check if a file exists and readable, writable, and executable.
- Use the `chmod()` function to set permissions for a file.

```php
<?php

#get the permissions set on a particular file
$permissions = fileperms('readme.txt');

# changing file permission
$filename = './readme.txt';
chmod($filename, 0644);
```

## Working with Directories

```php
<?php
# Use the opendir() function to open a directory and get the directory handle
$dh = opendir('./public');

# Use the readdir() function to read the entries in a directory specified by a directory handle.
if ($dh) {
	while ($e = readdir($dh)) {
		if ($e !== '.' && $e !== '..') {
			echo $e , PHP_EOL;
		}
	}
}

# Use getcwd() to get the current directory
echo getcwd();

# Use chdir() to change the current directory
chdir('./dev');
echo getcwd(); //dev

# Use the mkdir() function to create a new directory.
mkdir('./public/img')) //parent directory public must exist.
mkdir($dir, 0644); //can pass permissions, default is 0777, or ou can use chmod() function to change it

# Use the rmdir() function to remove a directory.
rmdir('./public/assets'); //need to have sufficient permissions && the directory needs to be empty

# Use the is_dir() function to check if a path is a directory and that directory exists in the file system.
is_dir('./public')

# Use the closedir() function once you are done with the directory.
closedir($dh);
```

- Use the PHP `glob()` function to get a list of files and directories that match a pattern.

```php
//Using the PHP glob() function to calculate the total size of PHP files
echo array_sum(array_map('filesize', glob('./src/*.php')));
```

- Use the PHP dirname() function to get the parent directory’s path of a file or directory path.

```php
<?php

echo '1.' , dirname("/htdocs/public") , PHP_EOL; 	#1./htdocs
echo '2.' , dirname("/htdocs/") , PHP_EOL; 			# 2.\
echo '3.' , dirname(".") , PHP_EOL; 				# 3..
echo '4.' , dirname("C:\\") , PHP_EOL; 				# 4.C:\
echo '5.' , dirname("/htdocs/public/css/dev", 2); 	# 5./htdocs/public
```

- Use the PHP basename() fuction to get the trailing name component of a file or directory path.

```php
<?php

echo "1) ".basename("/htdocs/index.php", ".php").PHP_EOL; 	# 1) index
echo "2) ".basename("/htdocs/index.php").PHP_EOL; 			#2) index.php
echo "3) ".basename("/htdocs/public").PHP_EOL; 				# 3) public
echo "4) ".basename("/htdocs/").PHP_EOL; 					# 4) htdocs
echo "5) ".basename(".").PHP_EOL; 							# 5) .
echo "6) ".basename("/"); 									# 6)
```

- Use the PHP pathinfo() function to get the components of a file path including dirname, basename, filename, and extesion.

```php
<?php

$path = 'htdocs/phptutorial/index.php';
$parts = pathinfo($path);
print_r($parts);
#result
Array
(
    [dirname] => htdocs/phptutorial
    [basename] => index.php
    [extension] => php
    [filename] => index
)

pathinfo($path, PATHINFO_BASENAME); //index.php
//PATHINFO_DIRNAME -> Return the directory name
//PATHINFO_BASENAME -> Return the base name
//PATHINFO_EXTENSION -> Return the file extension
//PATHINFO_FILENAME -> Return the file name (without the extension)
```

<!-- ## String operations -->

## Regular Expressions
- PHP regular expressions are strings with pattern enclosing in delimiters for example `"/pattern/"`.
- The `preg_match()` function searches for a match to a pattern in a string.
- The `preg_match_all()` function searches for all matches to a pattern in a string.
- The `preg_replace()` function searches a string for matches to a pattern and replaces them with a new string or pattern.
- The forward-slashes are delimiters. The delimiters can be one of the following characters `~, !, @, #, $` or braces including `{}, (), [], <>`. The braces help improve regular expressions’ readability in some cases.
- `'/\d+/' is similar to '{\d+}'`
- Anchors`(^, $)` – match at the beginning (^) and/or end ($) of a string or line.
    1. preg_match_all('/P/' , 'PHP', $matches) //match any 'P'
    2. preg_match_all('/^P/' , 'PHP', $matches) //match 'P' at the begining (1st character)

- Special characters must be escaped like `/\./g,  /\(/g`
- With character classes use back slash before `d,w,s` for escape, otherwise it will match character `d,w or s`.
- Use `\d` character class to match any single digit.
- Use `\w` character class to match any word character.
- Use `\s` character class to match any whitespace.
- The `\D, \W, \S` character class are the inverse sets of `\d, \w, and \s` character class.
- Use the dot character class `(.)` to match any character but a new line.

### Common regex patterns

```bash
/				start
/ 				end
/g 				global
/gi 			case insensitive
/\d/g 			select single digit
/\d+/g 			select one or more digits
/\d{9}/g 		select 9 digits in a row
/e+/g 			one or more than one e
/a?/g 			a is optional | match a zero or one time.
/a*/g 			match 0 or more, and a is optional
/\d{n,}/        match at least n times
/\d{n,m}/       match Between n and m Times
/./g 			match anything except new line
/\. /g 			match . (dot)
/.\./g 			match any character before .
/\w/g 			match any word character , negative is /\W
/\s/g 			match and white space, negative is /\S
/\w{4}/g 		select any words with or more than 4 characters
/\w{4,5}/g 		select any words with 4 or 5 characters
/[fc]at/g 		words start with f or c but end with at
/[q-z,A-Z]at/g	any character followed by “at”
/(t|T)he/g 		match the words "the" or "The"
/(t|e|r){2,3}/g match the word like "street" "stttreet" "strrret"
/A(?=B)/        matches A only if followed by B
/A(?!B)/        matches A only if not followed by B
(?<!B)A         matches A only if there’s B before it
(?<!B)A         matches A only if there’s no B before it
/^I/g			select beginning with I for whole chunk
/\.$/g 			select end of line with . for whole statements
/\.$/gm 		select end of line with . for multiple line
/(?<=[tT]he)./g	match very first character after the/The
/(?<![tT]he)./g select anything that does not have the/The before
/.(?=at)/g 		select any character followed by at
/.(?!at)/g 		select everything that not followed by at
```

### capturing groups and give names from groups

```php
<?php

$uri = 'posts/25';
$pattern = '{(\w+)/(\d+)}';

if (preg_match($pattern, $uri, $matches)) {
    print_r($matches);
}

# give names for groups using ?<name>
$uri = 'posts/25';
$pattern = '{(?<controller>\w+)/(?<id>\d+)}';

if (preg_match($pattern, $uri, $matches)) {
    print_r($matches);
}
# capturing groups has a number -> 1,2, they can access later by $1, $2
```

## PHP Date & Time

- Computers store a date and time as a UNIX timestamp or a timestamp in short.
- A timestamp is an integer that refers to the number of seconds between 1970-01-01 00:00:00 UTC (Epoch) and the date and time to be stored.
- Use the time() function to return the current timestamp since Epoch in local timezone.
- Use the date_default_timezone_set() function to set a specific timezone.
- Use the date() function to format the timestamp.
- Use mktime() function to create a timestasmp based on the year, month, day, hour, minute, and second.

```php
<?php

$current_time = time();
echo date('Y-m-d g:ia', $current_time) . '<br>'; #2021-07-13 5:47am

# adding timestamp
$one_week_later =  $current_time + 7 * 24 * 60 * 60; // 7 days later
echo date('Y-m-d g:ia',$one_week_later);

# subtracting timestamp
$yesterday = $current_time -  24 * 60 * 60; //1 day ago
echo date('Y-m-d g:ia',$yesterday);

# mktime
mktime(
    int $hour,
    int|null $minute = null,
    int|null $second = null,
    int|null $month = null,
    int|null $day = null,
    int|null $year = null
): int|false
```

### date() function

- Use the PHP date() function to format a timestamp in a specified format.

```php
<?php

echo date('Y'); //2025
$created_at = date("Y-m-d H:i:s");
echo $created_at;//2021-07-14 13:03:08 -> usefull for store in Mysql DB
```

# OOP with PHP

## Objects & Classes

- The `$this` variable references the current object of the class.
- Do use the method chaining by returning `$this` from a method to make the code more concise.

## Constructor and Destructor

### constructor promotion (PHP 8.0)

- When a constructor parameter includes an access modifier (public, private, or protected) PHP will treat it as both a constructor’s argument and an object’s property. And it assigns the constructor argument to the property.
- PHP automatically invokes the destructor when the object is deleted or the script is terminated.

## Properties

- Typed properties were introduced in PHP 7.4.
- Untyped properties default to null.
- Typed properties start uninitialized until you explicitly assign a value.
- You can’t access a typed property before it’s initialized — doing so causes a Fatal Error.
- To allow null and avoid errors, you can declare the property as nullable and initialize it:

```php
public ?string $name = null;
```

## Inheritance

- The constructor of the child class doesn’t automatically call the constructor of its parent class.
- Use `parent::__construct(arguments)` to call the parent constructor from the constructor in the child class.
- Use `parent::` to call the overridden method in the overriding method. You can't use `$this->`, it will recursively call the same method.
- Use the `final` method when you don’t want a child class’s method to override a parent class’s method.

## Abstract classes

- Abstract classes cannot be instantiated. Typically, an abstract defines an interface for other classes to extend.
- Similar to an abstract class, an abstract method is a method that does not have an implementation.
- If a class contains one or more abstract methods, it must be an abstract class.
- A class that extends an abstract class needs to implement the abstract methods of the abstract class.
- Note that all the methods in the interface must be public.

## Abstract classes

- An interface can also include constants.
- A class can inherit from one class only. However, it can implement multiple interfaces.
- When a class implements an interface, it’s called a `concrete class`.

## Polymorphism

- To implement polymorphism in PHP, you can use either abstract classes or interfaces.
- Polymorphism helps you create a generic framework that takes the different object types that share the same interface.
- By using polymorphism, you can reduce coupling and increase code reusability.

## Traits

- Inheritance makes the code very tightly coupled -> introduced `traits` (php 5.4).
- Inheritance allows classes to reuse the code vertically while the traits allow classes reuse the code horizontally.
- PHP allows you to compose multiple traits into a trait by using the use statement in the trait’s declaration.

### PHP trait’s method conflict resolution

#### Overriding trait method

- When a class uses multiple traits that share the same method name, PHP will raise a fatal error.
- use `inteadof` keyword

```php
trait FileLogger
{
	public function log($msg)
	{
		echo 'File Logger ' . date('Y-m-d h:i:s') . ':' . $msg . '<br/>';
	}
}

trait DatabaseLogger
{
	public function log($msg)
	{
		echo 'Database Logger ' . date('Y-m-d h:i:s') . ':' . $msg . '<br/>';
	}
}

class Logger
{
	use FileLogger, DatabaseLogger{
		FileLogger::log insteadof DatabaseLogger;
	}
}

$logger = new Logger();
$logger->log('this is a test message #1');
$logger->log('this is a test message #2');
```

#### Aliasing trait method

- if you want to use both log() methods from the FileLogger and DatabaseLogger traits, you can use an alias for the method of the trait within the class that uses the trait.

```php
class Logger
{
	use FileLogger, DatabaseLogger{
		DatabaseLogger::log as logToDatabase;
		FileLogger::log insteadof DatabaseLogger;
	}
}

$logger = new Logger();
$logger->log('this is a test message #1');
$logger->logToDatabase('this is a test message #2');
```

## Working with Objects

# Serialization in PHP

Serialization is the process of converting a PHP value (object, array, etc.) into a storable string representation that can be saved to a file, database, or transmitted over a network. Unserialization (or deserialization) is the reverse process—reconstructing the original PHP value from that string.

## Why Use Serialization?

- Persistence: Store objects in sessions, databases, or files
- Caching: Save expensive-to-create objects for later reuse
- Data transfer: Send complex data structures between systems
- Message queues: Pass objects between different parts of an application

### serialize

- The `serialize()` function converts an object into a storable string representation (a byte stream).
- It only serializes object properties, not methods.
- If the class defines a `__sleep()` method, PHP will automatically call it before serialization.
    - `__sleep()` must return an array of property names that should be serialized.
    - This method is mainly used to clean up or prepare data before serialization.
- If the class defines a `__serialize()` method, PHP will call it instead.
    - `__serialize()` must return an associative array of property names and values.
    - This method was introduced in PHP 7.4 to replace `__sleep()`.
- If both `__sleep()` and `__serialize()` are defined, `__sleep()` will be ignored.

### unserialize

- Use the `unserialize()` method to convert a serialized string into an object.
- The `unserialize()` method calls the `__unserialize()` or `__wakeup()` method of the object to perform re-initialization tasks.
- The `unserialize()` method calls the `__unserialize()` method only if an object has both `__unserialize()` and `__wakeup()` methods.
- The `unserialize()` function creates a completely new object that does not reference the original object.

### Complete Example: Session Cache

```php
class UserSession {
    public $userId;
    public $username;
    public $loginTime;
    private $cache; // Large temporary data
    private $apiClient; // Non-serializable resource
    
    public function __construct($userId, $username) {
        $this->userId = $userId;
        $this->username = $username;
        $this->loginTime = time();
        $this->cache = []; // Loaded separately
        $this->apiClient = new ApiClient(); // Resource
    }
    
    public function __sleep() {
        // Save session to disk
        // Exclude cache (too large) and apiClient (resource)        
        // Could perform cleanup here
        $this->cache = null;        
        return ['userId', 'username', 'loginTime'];
    }
    
    public function __wakeup() {
        // Restore session from disk        
        // Reinitialize resources
        $this->cache = [];
        $this->apiClient = new ApiClient();
        
        // Validate session isn't expired
        if (time() - $this->loginTime > 3600) {
            throw new Exception('Session expired');
        }
    }
}

// Usage
$session = new UserSession(123, 'alice');
$_SESSION['user'] = serialize($session); // __sleep() called

// Later request
$session = unserialize($_SESSION['user']); // __wakeup() called

# after PHP 7.4
class ModernUser {
    private $data;
    
    public function __serialize(): array {
        // Return array of data to serialize
        return [
            'data' => $this->data,
            'timestamp' => time()
        ];
    }
    
    public function __unserialize(array $data): void {
        // Receive the serialized data
        $this->data = $data['data'];
        // Can use the timestamp for validation
    }
}
```

### Clone Object

- When you copy an object using the assignment operator (=), both variables refer to the same object in memory.
- Any changes made to one will affect the other.

#### Shallow Copy

- we can use `clone` keyword to create a `shallow copy of an object`.

```php
$bob = new Person('Bob');

// clone an object
$alex = clone $bob;
$alex->name = 'Alex';

// show both objects
var_dump($bob);
var_dump($alex);

# output
object(Person)#1 (1) {
  ["name"]=> string(3) "Bob"
}
object(Person)#2 (1) {
  ["name"]=> string(4) "Alex"
}
```

- A shallow copy means PHP copies all properties of the object.
- However, if a property references another object, the reference is copied — both cloned and original objects will still point to the same referenced object.

### Deep copy with __clone method

- A deep copy duplicates not just the object itself, but also any referenced objects within it.
- PHP automatically calls the `__clone()` method after cloning an object.
- We can implement `__clone()` to manually clone the referenced objects, ensuring full independence between the original and the clone.

### Deep copy using serialize and unserialize functions

```php
<?php

function deep_clone($object)
{
	return unserialize(serialize($object));
}
```

### Compare Objects

- The comparison operator `(==)` returns true if two objects are the same or different instances of a class with the same properties’ values.
- The identity operator `(===)` returns true if two objects reference the exact same object instance in memory.

```php
$p1 = new Point(10, 20);
$p2 = new Point(10, 20);

var_dump($p1 == $p2);  // true  → same class, same property values
var_dump($p1 === $p2); // false → different instances

$p3 = $p1;

var_dump($p1 === $p3); // true  → same reference (identical instance)
```

### Anonymous Class

- An anonymous class is a class without a declared name.
- Inside the parentheses, you can define constructor, destructor, properties, and methods for the anonymous class like a regular class.
- An anonymous can implement one or multiple interfaces.
- Like a regular class, a class can inherit from one named class.
- To pass an argument to the constructor, we place it in parentheses that follow the class keyword.

```php
<?php

$myObject = new class {}; //syntax

# Example
$logger = new class(true) extends SimpleLogger { //pass an argument, and extend from named abstract class
    public function __construct(bool $newLine)
    {
        parent::__construct($newLine);
    }
};

$logger->log('Hello');
$logger->log('Bye');
```

## Namespaces and Autoloading

- We can give a namespace to a class and import it for use.
- We can use aliases to prevent name collision.
- We can use `(\)` to use global classes such as built-in classes or user-defined classes without a namespace.

```php

<?php

namespace Store\Model;
class Customer{}

#index.php
<?php

require 'src/Model/Customer.php';
use Store\Model\Customer;
$customer = new Customer('Bob');
```

- We can use `spl_autoload_register` function to autoload the classes, interfaces, and traits.
- The `spl_autoload_register()` function allows you to use multiple autoloading functions.

```php
# functions.php
<?php

function load_model($class_name)
{
	$path_to_file = 'models/' . $class_name . '.php';

	if (file_exists($path_to_file)) {
		require $path_to_file;
	}
}
spl_autoload_register('load_model');

# index.php
<?php

require 'functions.php';

$contact = new Contact('john.doe@example.com');
```

#### Composer Autoload

- There are two ways to use composer for auto loading
1. classmap
2. PSR-4

```php
# composer.json
{
	"autoload": {
		"classmap": ["app/models", "app/services"]
    }
}

# run composer dump-autoload and it will generate /vendor/autoload.php
# You just can import /vendor/autoload.php in the index.php 

# index.php
<?php

require_once __DIR__ . '/../vendor/autoload.php';
$user = new User('admin', '$ecurePa$$w0rd1');
```

- PSR-4 is auto-loading standard

```php
# composer.json
{
    "autoload": {
        "psr-4": {
            "Acme\\":"app/Acme"
        }
    }
}
# run the composer dump-autoload command to generate the autoload.php file
# index.php
<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Acme\Auth\User as User;
$user = new User('admin', '$ecurePa$$w0rd1');
```
