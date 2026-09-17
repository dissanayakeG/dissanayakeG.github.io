# MongoDB Guide: Fundamentals to Advanced Usage

## Introduction to MongoDB

MongoDB is a popular NoSQL database that stores data in flexible, JSON-like documents. Unlike traditional relational databases that use tables and rows, MongoDB uses collections and documents, making it ideal for handling unstructured or semi-structured data.

### Key Features

- **Document-oriented**: Stores data in flexible, JSON-like documents
- **Schema-less**: No predefined schema required
- **Scalable**: Horizontal scaling through sharding
- **High performance**: Indexing, replication, and aggregation capabilities
- **Flexible query language**: Rich query capabilities

### MongoDB Structure Hierarchy

```
Database → Collections → Documents → Fields
```

- **Database**: Container for collections
- **Collection**: Group of MongoDB documents (similar to a table in RDBMS)
- **Document**: Set of key-value pairs stored in BSON format (Binary JSON)
- **Field**: A key-value pair in a document

### BSON Format

MongoDB uses BSON (Binary JSON) for storing documents. BSON extends JSON with additional data types and is optimized for:

- Data traversal
- Encoding/decoding
- Space efficiency

BSON supports data types like Date, ObjectID, Binary, etc. that aren't available in JSON.

## Installation and Setup

### Installing MongoDB Community Edition

#### On Ubuntu/Debian:

Reference : [https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)

```bash
# Import the MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

### Verifying Installation

```bash
# Check MongoDB version
mongod --version

# Check service status
sudo systemctl status mongod

# List installed MongoDB packages
dpkg -l | grep mongodb
```

## MongoDB Tools

### MongoDB Shell (mongosh)

The MongoDB Shell is an interactive JavaScript interface to MongoDB. It's used for querying and updating data as well as performing administrative operations.

```bash
# Connect to MongoDB instance
mongosh
```

### MongoDB Compass

Reference : [https://www.mongodb.com/docs/compass/current/install/](https://www.mongodb.com/docs/compass/current/install/)

```bash
wget https://downloads.mongodb.com/compass/mongodb-compass_1.45.4_amd64.deb
sudo apt install ./mongodb-compass_1.45.4_amd64.deb
mongodb-compass
```

MongoDB Compass is a GUI for MongoDB that allows you to:

- Visualize and explore your data
- Run ad hoc queries
- Perform CRUD operations
- View performance metrics
- Create and manage indexes

### MongoDB Atlas vs MongoDB Compass

- **MongoDB Atlas**: Cloud database service for MongoDB, offering automated deployments, backups, and scaling.
- **MongoDB Compass**: GUI tool for interacting with MongoDB databases, whether they're local or in the cloud.

## Basic MongoDB Operations

### Connecting to MongoDB

```javascript
// Connect to local MongoDB instance
mongosh

// Connect to a specific database
mongosh "mongodb://localhost:27017/databaseName"
```

### Database Operations

```javascript
// Show all databases
show dbs

// Switch to a specific database (creates it if doesn't exist)
use databaseName

// Get current database name
db.getName()

// Drop current database
db.dropDatabase()
```

### Running JavaScript in mongosh

MongoDB shell allows you to execute JavaScript code:

```javascript
// Define variables
const x = 10;
const y = 5;
print(x + y);

// Create functions
function calculateAverage(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
print(calculateAverage([1, 2, 3, 4, 5]));

// Use built-in JS methods
const now = new Date();
print(now);
```

## CRUD Operations (Create, Read, Update, Delete)

### Creating Documents

#### Insert One Document

```javascript
// Insert a single document
db.collectionName.insertOne({field1: value1, field2: value2})

// Example
db.movies.insertOne({"name": "Foo", "rating": 10})

// View available options
db.movies.insertOne.help()
```

#### Insert Multiple Documents

```javascript
// Create documents
m1 = {"name": "A Foo 1", "rating": 4}
m2 = {"name": "B Foo 2", "rating": 5}
m3 = {"name": "C Foo 3", "rating": 6}

// Insert multiple documents
db.movies.insertMany([m1, m2, m3])

// View available options
db.movies.insertMany.help()
```

### Reading Documents

```javascript
// Show all collections in the current database
show collections

// Find all documents in a collection
db.movies.find()

// Find documents that match criteria
db.movies.find({"name": "Foo 1"})

// Projection: include only specified fields
db.movies.find({"name": "Foo 1"}, {"name": 1}) // Only return name field

// Projection: exclude specified fields
db.movies.find({"name": "Foo 1"}, {"name": 0}) // Return all fields except name

// Project specific fields for all documents
db.movies.find({}, {"name": 1}) // Return only name field for all documents

// Count documents
db.movies.find().count()

// Limit results
db.movies.find().limit(2) // Return first 2 documents

// Sort results (1 for ascending, -1 for descending)
db.movies.find({}, {"name": 1}).sort({"name": 1}) // Sort by name in ascending order

// Skip results
db.movies.find({}, {"name": 1}).sort({"name": 1}).skip(1) // Skip first document

// Query operators
db.movies.find({"rating": {$lt: 5}}) // rating less than 5
db.movies.find({"rating": {$gt: 5}}) // rating greater than 5
db.movies.find({"rating": {$lte: 5}}) // rating less than or equal to 5
db.movies.find({"rating": {$gte: 5}}) // rating greater than or equal to 5
db.movies.find({"rating": {$ne: 5}}) // rating not equal to 5
db.movies.find({"rating": {$in: [3, 5, 7]}}) // rating is 3, 5, or 7

// Logical operators
db.movies.find({$and: [{"rating": {$gt: 5}}, {"name": /^A/}]}) // rating > 5 AND name starts with "A"
db.movies.find({$or: [{"rating": {$lt: 3}}, {"rating": {$gt: 7}}]}) // rating < 3 OR rating > 7
```

### Updating Documents

```javascript
// Update a single document
db.movies.updateOne({"name": "Foo 1"}, {$set: {rating: 6}})

// Update multiple documents
db.movies.updateMany({rating: 10}, {$set: {rating: 5}})

// View available options
db.movies.updateOne.help()
db.movies.updateMany.help()

// Update operators
db.movies.updateOne({"name": "Foo 1"}, {$inc: {rating: 1}}) // Increment rating by 1
db.movies.updateOne({"name": "Foo 1"}, {$push: {genres: "Action"}}) // Add to array
db.movies.updateOne({"name": "Foo 1"}, {$pull: {genres: "Comedy"}}) // Remove from array
db.movies.updateOne({"name": "Foo 1"}, {$unset: {director: ""}}) // Remove field
```

### Deleting Documents

```javascript
// Delete a single document
db.movies.deleteOne({"name": "Foo 1"})

// Delete multiple documents
db.movies.deleteMany({rating: 5})

// View available options
db.movies.deleteOne.help()
db.movies.deleteMany.help()

// Delete all documents in a collection
db.movies.deleteMany({})
```

## Advanced MongoDB Features

### Indexes

```javascript
// Create an index
db.movies.createIndex({"name": 1}) // 1 for ascending, -1 for descending

// Create a compound index
db.movies.createIndex({"name": 1, "rating": -1})

// Create a unique index
db.movies.createIndex({"name": 1}, {unique: true})

// List all indexes in a collection
db.movies.getIndexes()

// Drop an index
db.movies.dropIndex("name_1")
```

### Aggregation Framework

```javascript
// Simple aggregation example: group and count
db.movies.aggregate([
  {$group: {_id: "$rating", count: {$sum: 1}}}
])

// Multi-stage aggregation pipeline
db.movies.aggregate([
  {$match: {rating: {$gte: 5}}}, // Filter documents
  {$group: {_id: "$genre", avgRating: {$avg: "$rating"}}}, // Group and calculate average
  {$sort: {avgRating: -1}} // Sort by average rating descending
])
```

### Working with JavaScript in MongoDB Shell

```javascript
// Convert find cursor to an array for processing
const results = db.movies.find().toArray()

// Display results in a table format
console.table(results)

// Process results with JavaScript
results.forEach(movie => {
  print(`Movie: ${movie.name}, Rating: ${movie.rating}`)
})

// Calculate average rating
const avg = results.reduce((acc, movie) => acc + movie.rating, 0) / results.length
print(`Average Rating: ${avg}`)
```

### Data Import/Export

```bash
# Import JSON data
mongoimport --db=myDB --collection=movies --file=movies.json

# Export to JSON
mongoexport --db=myDB --collection=movies --out=movies.json

# Import BSON data (from mongodump)
mongorestore --db=myDB dump/myDB/

# Export to BSON (for backup)
mongodump --db=myDB
```

## MongoDB Security Best Practices

- Enable authentication
- Create specific users with appropriate privileges
- Use TLS/SSL for encrypted connections
- Enable role-based access control
- Regularly update MongoDB to the latest version
- Use firewalls to restrict access to MongoDB ports
- Audit database access and operations

### Enable Authentication

```javascript
// Create admin user
use admin
db.createUser({
  user: "adminUser",
  pwd: "securePassword",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})

// Create regular user
use myDatabase
db.createUser({
  user: "appUser",
  pwd: "appPassword",
  roles: [{ role: "readWrite", db: "myDatabase" }]
})
```

## MongoDB Atlas

MongoDB Atlas is the cloud-hosted database service provided by MongoDB, Inc. It offers:

- Automated deployment and scaling
- Backup and restoration
- Monitoring and alerts
- Security features (encryption, VPC peering, etc.)
- Global clusters for low-latency access worldwide

### Setting up MongoDB Atlas

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Configure network access (whitelist IP addresses)
4. Create database users
5. Connect to your cluster via connection string

## Tips and Best Practices

1. **Design your schema for your queries**: Unlike relational databases, MongoDB performs best when your schema design matches your access patterns.
2. **Use appropriate indexing**: Create indexes for frequently queried fields, but be mindful that each index adds overhead to write operations.
3. **Embed or reference**: Choose between embedding related data or using references based on your access patterns and the size/volatility of the data.
4. **Limit document size**: Keep documents under the 16MB limit and consider references for larger data.
5. **Use the aggregation framework**: For complex queries involving multiple operations.
6. **Implement data validation**: Use JSON Schema validation to enforce document structure.
7. **Monitor performance**: Use MongoDB's built-in tools to identify slow queries and optimize them.
8. **Use appropriate write concern**: Balance between performance and data durability based on your application needs.

## Common MongoDB Commands Cheat Sheet

```
// Database Operations
show dbs                  - List all databases
use <db>                  - Switch to database (creates if not exists)
db                        - Show current database
db.dropDatabase()         - Delete current database

// Collection Operations
show collections          - List all collections in current database
db.createCollection("name") - Create a new collection
db.collection.drop()      - Delete a collection

// CRUD Operations
db.collection.insertOne({}) - Insert one document
db.collection.insertMany([{}]) - Insert multiple documents
db.collection.find()      - Find all documents
db.collection.find({})    - Find documents matching criteria
db.collection.updateOne() - Update one document
db.collection.updateMany() - Update multiple documents
db.collection.deleteOne() - Delete one document
db.collection.deleteMany() - Delete multiple documents

// Aggregation
db.collection.aggregate([]) - Run aggregation pipeline

// Administration
db.getUsers()             - List all users in current database
db.createUser()           - Create new user
db.runCommand({})         - Run database command
```

## Mongoose: ODM for MongoDB

Mongoose is an Object Data Modeling (ODM) library for Node.js and MongoDB. It provides a higher-level abstraction layer on top of MongoDB's native driver, making it easier to work with MongoDB in a Node.js environment.

### Key Features of Mongoose

- **Schema Definition**: Define structured schemas for your MongoDB documents
- **Data Validation**: Enforce data integrity with built-in and custom validators
- **Middleware**: Implement pre and post hooks for database operations
- **Query Building**: Create complex queries with a chainable API
- **Relationship Management**: Define and work with relationships between documents
- **Type Casting**: Automatically convert data types as specified in the schema
- **Business Logic Hooks**: Attach methods to models for document instances

### Installing Mongoose

```bash
npm install mongoose
```

### Connecting to MongoDB with Mongoose

```javascript
const mongoose = require('mongoose');

// Connect to local MongoDB
mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Connection events
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB!");
});
```

### Creating a Schema

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define a schema
const movieSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  genre: [String],
  releaseDate: Date,
  director: {
    name: String,
    awards: Number
  },
  isAvailable: Boolean,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a model from the schema
const Movie = mongoose.model('Movie', movieSchema);
```

### Schema Data Types

Mongoose supports various data types:

- String
- Number
- Date
- Buffer
- Boolean
- Mixed
- ObjectId
- Array
- Decimal128
- Map

### Schema Validation

```javascript
const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    minlength: [4, 'Username must be at least 4 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  age: {
    type: Number,
    min: [18, 'Must be at least 18 years old'],
    max: [100, 'Age cannot exceed 100']
  }
});
```

### CRUD Operations with Mongoose

#### Creating Documents

```javascript
// Create a new document
const movie = new Movie({
  name: 'Inception',
  rating: 8.8,
  genre: ['Sci-Fi', 'Action'],
  releaseDate: new Date('2010-07-16'),
  director: {
    name: 'Christopher Nolan',
    awards: 11
  },
  isAvailable: true
});

// Save the document
movie.save()
  .then(doc => {
    console.log('Movie saved:', doc);
  })
  .catch(err => {
    console.error('Error saving movie:', err);
  });

// Alternative: create method
Movie.create({
  name: 'The Matrix',
  rating: 8.7,
  genre: ['Sci-Fi', 'Action']
})
  .then(doc => {
    console.log('Movie created:', doc);
  })
  .catch(err => {
    console.error('Error creating movie:', err);
  });
```

#### Reading Documents

```javascript
// Find all documents
Movie.find()
  .then(movies => {
    console.log('All movies:', movies);
  })
  .catch(err => {
    console.error('Error finding movies:', err);
  });

// Find with criteria
Movie.find({ rating: { $gte: 8 } })
  .then(movies => {
    console.log('Highly rated movies:', movies);
  });

// Find one document
Movie.findOne({ name: 'Inception' })
  .then(movie => {
    console.log('Found movie:', movie);
  });

// Find by ID
Movie.findById('60a1e2c9c8c8e52a4c8e2c9c')
  .then(movie => {
    console.log('Movie by ID:', movie);
  });

// Query building
Movie.find()
  .select('name rating')     // Select only name and rating fields
  .where('rating').gte(8)    // Rating greater than or equal to 8
  .where('genre').in(['Action', 'Adventure'])  // Genre is Action or Adventure
  .limit(5)                  // Limit to 5 results
  .sort('-rating')           // Sort by rating descending
  .exec()                    // Execute the query
  .then(movies => {
    console.log('Query result:', movies);
  });
```

#### Updating Documents

```javascript
// Update one document
Movie.updateOne(
  { name: 'Inception' },
  { rating: 9.0 }
)
  .then(result => {
    console.log('Update result:', result);
  });

// Find and update (returns updated document)
Movie.findOneAndUpdate(
  { name: 'The Matrix' },
  { $push: { genre: 'Cyberpunk' } },
  { new: true }  // Return the updated document
)
  .then(updatedMovie => {
    console.log('Updated movie:', updatedMovie);
  });

// Update multiple documents
Movie.updateMany(
  { rating: { $lt: 5 } },
  { isAvailable: false }
)
  .then(result => {
    console.log('Bulk update result:', result);
  });
```

#### Deleting Documents

```javascript
// Delete one document
Movie.deleteOne({ name: 'Inception' })
  .then(result => {
    console.log('Delete result:', result);
  });

// Find and delete (returns deleted document)
Movie.findOneAndDelete({ rating: { $lt: 5 } })
  .then(deletedMovie => {
    console.log('Deleted movie:', deletedMovie);
  });

// Delete multiple documents
Movie.deleteMany({ isAvailable: false })
  .then(result => {
    console.log('Bulk delete result:', result);
  });
```

### Middleware (Hooks)

Mongoose middleware (pre and post hooks) functions let you execute code before or after specific operations.

```javascript
// Pre-save hook
movieSchema.pre('save', function(next) {
  // 'this' refers to the document being saved
  console.log(`Saving movie: ${this.name}`);
  
  // You can modify the document here
  if (this.rating > 9.5) {
    this.genre.push('Masterpiece');
  }
  
  next(); // Call next to continue with the save operation
});

// Post-save hook
movieSchema.post('save', function(doc, next) {
  console.log(`Movie saved: ${doc.name}`);
  next();
});

// Pre-find hook
movieSchema.pre('find', function() {
  // 'this' refers to the query object
  this.start = Date.now();
});

// Post-find hook
movieSchema.post('find', function(docs) {
  console.log(`Query took ${Date.now() - this.start}ms`);
});
```

### Instance and Static Methods

```javascript
// Instance method (available on document instances)
movieSchema.methods.getSummary = function() {
  return `${this.name} (${this.rating}/10)`;
};

// Use instance method
const movie = await Movie.findOne({ name: 'Inception' });
console.log(movie.getSummary()); // "Inception (8.8/10)"

// Static method (available on the model)
movieSchema.statics.findByGenre = function(genre) {
  return this.find({ genre: genre });
};

// Use static method
const actionMovies = await Movie.findByGenre('Action');
```

### Virtual Properties

Virtual properties are not stored in MongoDB but computed from other fields.

```javascript
// Define a virtual property
movieSchema.virtual('nameAndRating').get(function() {
  return `${this.name} (${this.rating}/10)`;
});

// Use virtual property
const movie = await Movie.findOne();
console.log(movie.nameAndRating); // "Inception (8.8/10)"
```

### Populate (References)

Mongoose can populate references to other documents.

```javascript
// Define schemas with references
const directorSchema = new Schema({
  name: String,
  bio: String,
  birthDate: Date
});
const Director = mongoose.model('Director', directorSchema);

const filmSchema = new Schema({
  title: String,
  director: {
    type: Schema.Types.ObjectId,
    ref: 'Director'  // Reference to Director model
  }
});
const Film = mongoose.model('Film', filmSchema);

// Create a director and a film
const director = await Director.create({
  name: 'Christopher Nolan',
  bio: 'British-American film director...',
  birthDate: new Date('1970-07-30')
});

await Film.create({
  title: 'Interstellar',
  director: director._id  // Store only the reference ID
});

// Query with populate to get director details
const films = await Film.find().populate('director');
console.log(films[0].director.name); // "Christopher Nolan"
```

### Using Async/Await with Mongoose

Modern Node.js applications typically use async/await with Mongoose:

```javascript
// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mydatabase', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// CRUD operations with async/await
async function createMovie() {
  try {
    const movie = await Movie.create({
      name: 'The Dark Knight',
      rating: 9.0,
      genre: ['Action', 'Crime', 'Drama']
    });
    console.log('Movie created:', movie);
    return movie;
  } catch (error) {
    console.error('Error creating movie:', error);
  }
}

async function findMovies() {
  try {
    const movies = await Movie.find({ rating: { $gte: 8 } })
      .select('name rating')
      .limit(5);
    console.log('Found movies:', movies);
    return movies;
  } catch (error) {
    console.error('Error finding movies:', error);
  }
}

// Error handling with async/await
async function safeOperation() {
  try {
    await connectToMongoDB();
    const movie = await createMovie();
    await movie.remove();
    console.log('Operation completed successfully');
  } catch (error) {
    console.error('Operation failed:', error);
  } finally {
    // Clean up resources if needed
  }
}
```

### Schema Options

```javascript
const movieSchema = new Schema({
  name: String,
  rating: Number
}, {
  timestamps: true,  // Adds createdAt and updatedAt fields
  collection: 'films',  // Custom collection name
  versionKey: '_version',  // Custom version key (default: __v)
  id: false,  // Disable virtual id getter
  toJSON: { virtuals: true },  // Include virtuals when converting to JSON
  toObject: { virtuals: true }  // Include virtuals when converting to object
});
```

### Mongoose Best Practices

1. **Always handle connection errors**: Set up error listeners on the mongoose connection.
2. **Use schema validation**: Define strict schemas with validation rules.
3. **Use middleware wisely**: Avoid complex logic in middleware that could impact performance.
4. **Lean queries for better performance**: Use `.lean()` when you only need data and not full Mongoose documents.

  ```javascript
  const movies = await Movie.find().lean();
  ```
5. **Index fields you query frequently**: Add indexes to fields used in queries.

  ```javascript
  movieSchema.index({ name: 1 });
  movieSchema.index({ rating: -1, name: 1 });
  ```
6. **Use projection to limit fields returned**: Only request the fields you need.

  ```javascript
  const movies = await Movie.find().select('name rating');
  ```
7. **Batch operations for better performance**: Use `insertMany`, `updateMany`, or `deleteMany` for bulk operations.
8. **Be careful with unbounded arrays**: Large arrays within documents can degrade performance.
9. **Handle duplicate key errors**: Implement proper error handling for unique constraint violations.
10. **Use transactions for complex operations**: For operations that need to be atomic across multiple documents.

## Advanced MongoDB Use Cases

- **Real-time analytics**: Use change streams to track and react to data changes
- **Full-text search**: Implement text search and text indexing for content-heavy applications
- **Geospatial queries**: Build location-based services with geospatial indexes
- **Time series data**: Store and query time series data with time series collections
- **Graph relationships**: Model hierarchical data and graph relationships
- **Data archiving**: Implement data lifecycle management with TTL indexes
