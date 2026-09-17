# Flutter Local Database with Drift and Riverpod

This guide shows a simple structure for a Flutter application that uses:

```text
Flutter UI
  → Riverpod providers
    → Repository
      → Drift database
        → SQLite
```

The UI should not contain database queries. The repository owns database access, while Riverpod creates and supplies shared objects.

## How to use this guide

- Part 1 explains the Drift, Riverpod, and `go_router` patterns used throughout the guide.
- Part 2 builds a complete example application in twelve incremental steps. Start here after Part 1, or use it as a practical reference if you already know the concepts.
- Part 3 covers the everyday development loop, app and launcher icons, Android signing and release builds, Linux installation, web builds, and common clean-build commands.

# Part 1: Core concepts

## Using Drift for a Local Database in Dart

Drift is a type-safe SQLite library for Dart and Flutter. Tables are defined in Dart, queries are checked and generated as Dart code, and the database can be replaced with an in-memory executor in tests.

### 1. Define database tables

```dart
class Items extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text().unique()();
}
```

Drift generates a row class named `Item` from this definition. `autoIncrement()` creates a generated primary key, while `unique()` prevents duplicate item names.

Common column definitions include:

```dart
integer()                         // required integer
text()                            // required text
text().nullable()                 // nullable text
integer().autoIncrement()         // generated primary key
dateTime().withDefault(...)       // database default value
```

### 2. Create the database class

```dart
part 'app_database.g.dart';

@DriftDatabase(tables: [Items])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor])
      : super(executor ?? driftDatabase(name: 'my_app'));

  @override
  int get schemaVersion => 1;
}
```

`@DriftDatabase` registers the tables, while `_$AppDatabase` is the generated base class. The optional `QueryExecutor` makes the database easy to replace in tests.

Generate the supporting code after changing tables or the database class:

```bash
dart run build_runner build --delete-conflicting-outputs
```

Never edit `app_database.g.dart` manually.

### 3. Keep queries in a repository

```dart
class DriftItemsRepository implements ItemsRepository {
  DriftItemsRepository({required AppDatabase database})
      : _database = database;

  final AppDatabase _database;
}
```

The repository is the application-facing data API. It owns Drift queries so widgets do not depend on tables, SQL, or database lifecycle details.

### 4. Read and watch data

```dart
final query = _database.select(_database.items)
  ..orderBy([
    (table) => OrderingTerm.asc(table.name),
  ]);

final items = await query.get(); // one-time read
final itemsStream = query.watch(); // continuously updated stream
```

Use `where` to filter a query:

```dart
final query = _database.select(_database.items)
  ..where((table) => table.id.equals(itemId));
```

`get()` returns a `Future`; `watch()` returns a `Stream` that emits when the relevant data changes.

### 5. Write data and use transactions

```dart
// ItemsCompanion comes from the generated app_database.g.dart file.
final id = await _database.into(_database.items).insert(
      ItemsCompanion.insert(name: normalizedName),
    );

await (_database.update(_database.items)
      ..where((table) => table.id.equals(id)))
    .write(ItemsCompanion(name: Value(newName)));

await (_database.delete(_database.items)
      ..where((table) => table.id.equals(id)))
    .go();
```

Use `Value(...)` when constructing a companion for an update or nullable field. Use a transaction when related writes must all succeed or all roll back. For example, add a group of starter items as one operation:

```dart
await _database.transaction(() async {
  await _database.into(_database.items).insert(
        ItemsCompanion.insert(name: 'Milk'),
      );
  await _database.into(_database.items).insert(
        ItemsCompanion.insert(name: 'Bread'),
      );
});
```

If either insert fails, Drift rolls back both inserts so the database is not left with a partial starter set.

## Riverpod service pattern in Dart

Riverpod manages dependencies and state outside widgets. Providers expose values to the widget tree, while services coordinate application operations such as exporting data. Widgets read provider state and trigger actions; they do not construct repositories or contain data-access logic.

Import Riverpod wherever a provider or consumer widget is declared:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
```

### 1. Wrap the app with `ProviderScope`

```dart
void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}
```

`ProviderScope` makes Riverpod providers available throughout the widget tree.

### 2. Choose a provider type

Choose the provider from the behavior of the value it exposes, not from the widget that reads it.

| Provider | `ref.watch(...)` exposes | Use it for |
| --- | --- | --- |
| `Provider<T>` | `T` | Synchronous, read-only or derived values, configuration, repositories, and services. |
| `FutureProvider<T>` | `AsyncValue<T>` | A simple asynchronous read that needs loading and error states. |
| `StreamProvider<T>` | `AsyncValue<T>` | Live data that changes over time, such as a Drift `watch()` query. |
| `NotifierProvider<Controller, State>` | `State` | Synchronous state changed by user actions. The first type is the controller; the second is the exposed state. |
| `AsyncNotifierProvider<Controller, State>` | `AsyncValue<State>` | Asynchronous state that also needs methods for refresh, save, or other side effects. |
| `StreamNotifierProvider<Controller, State>` | `AsyncValue<State>` | A stream-backed state object that also needs controller methods. |

#### Read-only data with `Provider`

Use `Provider` for a value that Riverpod can create synchronously and that widgets should not modify directly. Configuration is a common example:

```dart
class AppConfig {
  const AppConfig({
    required this.defaultCurrency,
    required this.showPrices,
  });

  final String defaultCurrency;
  final bool showPrices;
}

final appConfigProvider = Provider<AppConfig>((ref) {
  return const AppConfig(
    defaultCurrency: 'USD',
    showPrices: true,
  );
});
```

#### Asynchronous and live data

`FutureProvider` is a good fit for a simple one-time asynchronous read. `StreamProvider` is the natural choice for a Drift query that uses `watch()` and continuously emits updates.

```dart
final itemsFutureProvider = FutureProvider<List<Item>>((ref) {
  return ref.watch(itemsRepositoryProvider).getItems();
});

final itemsStreamProvider = StreamProvider<List<Item>>((ref) {
  return ref.watch(itemsRepositoryProvider).watchItems();
});
```

Both providers expose `AsyncValue<List<Item>>` to widgets. `AsyncValue` represents loading, data, and error states.

#### Mutable state with notifiers

Use a `Notifier` when state is synchronous but must change in response to user actions. Use an `AsyncNotifier` when its initial value or its actions are asynchronous.

```dart
class ItemFilterController extends Notifier<String> {
  @override
  /// Riverpod calls build() when it creates or rebuilds this controller.
  /// Return the initial synchronous state exposed by itemFilterProvider.
  String build() => '';

  void update(String value) => state = value;
  void clear() => state = '';
}

final itemFilterProvider =
    NotifierProvider<ItemFilterController, String>(ItemFilterController.new);

class ItemsController extends AsyncNotifier<List<Item>> {
  @override
  Future<List<Item>> build() {
    /// Riverpod calls build() when it creates or rebuilds this controller.
    /// Returning a Future makes the provider asynchronous: it exposes loading,
    /// then data or an error after the repository request completes.
    return ref.watch(itemsRepositoryProvider).getItems();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(itemsRepositoryProvider).getItems(),
    );
  }
}

final itemsControllerProvider =
    AsyncNotifierProvider<ItemsController, List<Item>>(ItemsController.new);
```

`ItemFilterController` extends `Notifier<String>`, so it owns a `String` state. Its `build()` method initializes that state; the empty string means that no filter is active initially. `NotifierProvider<ItemFilterController, String>` exposes the current `String` state. Read `itemFilterProvider.notifier` when an action needs the `ItemFilterController`.

`ItemsController` extends `AsyncNotifier<List<Item>>`. Its asynchronous `build()` loads the initial list, so `AsyncNotifierProvider` exposes `AsyncValue<List<Item>>`: `AsyncLoading` while the request runs, `AsyncData` when it succeeds, or `AsyncError` when it fails.

`StreamNotifierProvider` is the stream equivalent of `AsyncNotifierProvider`: choose it when a stream-backed value also needs controller methods. Otherwise, the simpler `StreamProvider` is enough.

### 3. Read providers from a widget

Use `ref.watch` in `build` to rebuild a widget when a value changes. Use `ref.read` inside callbacks to run an action without subscribing the callback to updates.

```dart
import 'package:flutter/material.dart';

class ItemsPage extends ConsumerWidget {
  const ItemsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(itemsStreamProvider);
    final filter = ref.watch(itemFilterProvider);

    return items.when(
      data: (value) => Text('${value.length} items; filter: $filter'),
      loading: () => const CircularProgressIndicator(),
      error: (error, stackTrace) => Text('Error: $error'),
    );
  }
}

void clearFilter(WidgetRef ref) {
  ref.read(itemFilterProvider.notifier).clear();
}
```

## Routing with `go_router`

`go_router` provides declarative, URL-based navigation for Flutter. Keeping routes in one router configuration makes navigation easier to understand, test, and extend.

### 1. Install `go_router`

From the Flutter project root:

```bash
flutter pub add go_router
```

Import it where the router or navigation methods are used:

```dart
import 'package:go_router/go_router.dart';
```

### 2. Define routes

Create `lib/app_router.dart`:

```dart
import 'package:my_app/ui/items/add_item_page.dart';
import 'package:my_app/ui/dashboard/dashboard_page.dart';
import 'package:go_router/go_router.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const DashboardPage(),
    ),
    GoRoute(
      path: '/items/add',
      builder: (context, state) => const AddItemsPage(),
    ),
  ],
);
```

The root route renders `DashboardPage`. The `/items/add` route renders `AddItemsPage`.
The `path` is the URL pattern and `builder` creates the page for that location.

Keep route configuration separate from page widgets. For a larger application, group related routes in the same feature area or compose them into the central router.

### 3. Connect the router to the app

Use `MaterialApp.router` instead of the classic `MaterialApp` constructor:

```dart
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'My App',
      routerConfig: appRouter,
    );
  }
}
```

When using Riverpod, `ProviderScope` still wraps the application:

```dart
void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}
```

### 4. Navigate between routes

Import `go_router` in the widget and use the `BuildContext` extensions:

```dart
// Replace the current location.
context.go('/settings');

// Push a new page onto the navigation stack.
context.push('/items/42');

// Return to the previous page.
context.pop();
```

Use `go` when changing app location, such as moving from a dashboard to a section. Use `push` when opening a page that the user should be able to close with Back.

### 5. Use path and query parameters

Pass a path parameter as part of the URL:

```dart
context.push('/items/${item.id}');
```

Read it in the route builder:

```dart
final itemId = int.parse(state.pathParameters['itemId']!);
```

For optional filtering or sorting values, use query parameters:

```dart
context.go('/items?sort=name');
```

Read them with:

```dart
final sort = state.uri.queryParameters['sort'];
```

Validate and handle invalid parameters before passing them to a page or repository.

### 6. Define nested routes

A child route can share a parent URL:

```dart
GoRoute(
  path: '/items/:itemId',
  builder: (context, state) => ItemDetailPage(
    itemId: int.parse(state.pathParameters['itemId']!),
  ),
  routes: [
    GoRoute(
      path: 'edit',
      builder: (context, state) => EditItemPage(
        itemId: int.parse(state.pathParameters['itemId']!),
      ),
    ),
  ],
),
```

The child path is relative, so the full URL is `/items/:itemId/edit`.

### 7. Redirect based on application state

Use `redirect` for guards such as authentication or onboarding:

```dart
final appRouter = GoRouter(
  redirect: (context, state) {
    final signedIn = false; // Read this from app state in a real app.
    final goingToLogin = state.matchedLocation == '/login';

    if (!signedIn && !goingToLogin) return '/login';
    if (signedIn && goingToLogin) return '/';
    return null;
  },
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const DashboardPage(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
  ],
);
```

Return `null` to allow navigation. In a Riverpod application, connect the router to the relevant authentication provider and refresh the router when that state changes.

# Part 2: Build the example application

The following steps apply the Part 1 concepts in one small Flutter application.

## 1. Project setup

Create a Flutter project:

```bash
flutter create my_app
cd my_app
```

Add the packages:

```bash
flutter pub add drift drift_flutter flutter_riverpod go_router

flutter pub add --dev drift_dev build_runner sqlite3
```

A useful structure is:

```text
lib/
  app_router.dart
  data/
    local/
      tables.dart
      app_database.dart
    repository/
      items_repository.dart
      repository_providers.dart
  ui/
    dashboard/
      dashboard_page.dart
    items/
      add_item_page.dart
test/
  repository/
    items_repository_test.dart
```

## 2. Define Drift tables

File: `lib/data/local/tables.dart`

```dart
import 'package:drift/drift.dart';

class Items extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text()();
  RealColumn get price => real()();
  DateTimeColumn get createdAt =>
      dateTime().withDefault(currentDateAndTime)();
}
```

`Items` is the table definition. Drift generates a row class named `Item` from it.

Common column definitions:

```dart
integer()                         // integer column
text()                            // required text column
text().nullable()                 // nullable text column
integer().autoIncrement()        // generated primary key
text().unique()                   // no duplicate values
dateTime().withDefault(...)       // database default value
```

A foreign-key relationship can be defined like this:

```dart
IntColumn get categoryId =>
    integer().references(Categories, #id);
```

## 3. Create the Drift database

File: `lib/data/local/app_database.dart`

```dart
import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'tables.dart';

part 'app_database.g.dart';

@DriftDatabase(tables: [Items])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor])
      : super(executor ?? driftDatabase(name: 'my_app'));

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (migrator) async {
          await migrator.createAll();
        },
      );
}
```

What these parts mean:

- `@DriftDatabase` registers the tables.
- `_$AppDatabase` is a generated base class.
- `QueryExecutor` allows a custom database, which is useful for tests.
- `schemaVersion` identifies the database schema version.
- `onCreate` creates tables for a new database.
- `app_database.g.dart` is generated code and must not be edited manually.

Generate Drift code after changing tables or the database class:

```bash
dart run build_runner build --delete-conflicting-outputs
```

## 4. Create the repository interface

File: `lib/data/repository/items_repository.dart`

The repository is the app-facing data API. The UI calls repository methods instead of writing Drift queries directly.

```dart
import '../local/app_database.dart';

abstract interface class ItemsRepository {
  ///Item comes from the generated lib/data/local/app_database.g.dart
  Stream<List<Item>> watchItems();
  Future<List<Item>> getItems();
  Future<Item> createItem({
    required String name,
    required double price,
  });
}
```

The interface is a contract. It says what the application can do, without saying how the data is stored.

## 5. Implement the repository with Drift

File: `lib/data/repository/items_repository.dart`

```dart
import 'package:drift/drift.dart';

import '../local/app_database.dart';
import 'items_repository.dart';

class DriftItemsRepository implements ItemsRepository {
  DriftItemsRepository({required AppDatabase database})
      : _database = database;

  final AppDatabase _database;

  @override
  Stream<List<Item>> watchItems() {
    final query = _database.select(_database.items)
      ..orderBy([
        (table) => OrderingTerm.asc(table.name),
      ]);
    return query.watch();
  }

  @override
  Future<List<Item>> getItems() {
    final query = _database.select(_database.items)
      ..orderBy([
        (table) => OrderingTerm.asc(table.name),
      ]);
    return query.get();
  }

  @override
  Future<Item> createItem({
    required String name,
    required double price,
  }) async {
    ///ItemsCompanion comes from the generated lib/data/local/app_database.g.dart
    final id = await _database.into(_database.items).insert(
          ItemsCompanion.insert(
            name: name,
            price: price,
          ),
        );

    return (_database.select(_database.items)
          ..where((table) => table.id.equals(id)))
        .getSingle();
  }
}
```

### Understanding `_database`

```dart
final AppDatabase _database;
```

`_database` is a private field containing the `AppDatabase` instance. The underscore is Dart's convention for a private library member.

### Reading data

```dart
_database.select(_database.items)
```

Creates a typed select query.

```dart
query.get()
```

Executes the query once and returns a `Future`.

```dart
query.watch()
```

Returns a `Stream` that emits new results when the table changes.

### Filtering data

```dart
final query = _database.select(_database.items)
  ..where((table) => table.id.equals(id));
```

The `..` is Dart's cascade operator. It configures the query and then keeps the same query object.

The condition is similar to:

```sql
SELECT * FROM items WHERE id = ?;
```

### Inserting data

```dart
final id = await _database.into(_database.items).insert(
      ItemsCompanion.insert(
        name: name,
        price: price,
      ),
    );
```

`into` chooses the table. `ItemsCompanion.insert` contains the values to insert. The returned value is the generated row ID.

For nullable fields, use `Value` when constructing a companion:

```dart
ItemsCompanion(
  name: Value(name),
)
```

### Updating data

```dart
final changedRows = await (_database.update(_database.items)
      ..where((table) => table.id.equals(id)))
    .write(
      ItemsCompanion(
        name: Value(newName),
        price: Value(newPrice),
      ),
    );
```

`changedRows` tells how many rows were updated.

### Deleting data

```dart
final deletedRows = await (_database.delete(_database.items)
      ..where((table) => table.id.equals(id)))
    .go();
```

`go()` executes the delete query and returns the number of deleted rows.

## 6. Use transactions for related operations

```dart
return _database.transaction(() async {
  final category = await createOrGetCategory(name: categoryName);

  return createList(
    categoryId: category.id,
    name: listName,
  );
});
```

A transaction groups operations into one unit:

```text
begin transaction
  ├── find or create category
  └── create list
commit if successful
rollback if an error occurs
```

If an operation throws an exception, Drift rolls back the transaction. This prevents partially saved data.

Use a transaction when multiple writes must all succeed or all fail.

## 7. Connect Drift to Riverpod

File: `lib/data/repository/repository_providers.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../local/app_database.dart';
import 'items_repository.dart';

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final database = AppDatabase();
  ref.onDispose(database.close);
  return database;
});

final itemsRepositoryProvider = Provider<ItemsRepository>((ref) {
  return DriftItemsRepository(
    database: ref.watch(appDatabaseProvider),
  );
});

final itemsStreamProvider = StreamProvider<List<Item>>((ref) {
  return ref.watch(itemsRepositoryProvider).watchItems();
});
```

`Provider<T>` supplies a shared object of type `T`.

`StreamProvider<T>` exposes a stream and gives the UI loading, data, and error states.

The dependency chain is:

```text
itemsStreamProvider
  → itemsRepositoryProvider
    → appDatabaseProvider
      → AppDatabase
```

## 8. Enable Riverpod in the app

First, define the application routes in `lib/app_router.dart`:

```dart
import 'package:my_app/ui/items/add_item_page.dart';
import 'package:my_app/ui/dashboard/dashboard_page.dart';
import 'package:go_router/go_router.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const DashboardPage(),
    ),
    GoRoute(
      path: '/items/add',
      builder: (context, state) => const AddItemsPage(),
    ),
  ],
);
```

Then connect that router to `main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_router.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}
```

`ProviderScope` makes Riverpod providers available to the widget tree.

Without it, widgets cannot read or watch providers.

The root widget renders the dashboard as the app's home page:

```dart
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Items',
      routerConfig: appRouter,
    );
  }
}
```

The resulting widget tree is:

```text
ProviderScope
  └── MyApp
        └── MaterialApp.router
              └── appRouter
                    └── DashboardPage
```

## 9. Read live data in a widget

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/repository/repository_providers.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itemsAsync = ref.watch(itemsStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Items'),
        actions: [
          IconButton(
            onPressed: () => context.push('/items/add'),
            icon: const Icon(Icons.add),
            tooltip: 'Add item',
          ),
        ],
      ),
      body: itemsAsync.when(
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('No items yet.'));
          }

          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return ListTile(
                title: Text(item.name),
                trailing: Text(item.price.toStringAsFixed(2)),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text('Error: $error')),
      ),
    );
  }
}
```

`ref.watch(itemsStreamProvider)` listens for changes. When Drift emits a new list, Riverpod rebuilds the widget.

`.when` chooses the correct UI for the asynchronous state:

```text
loading → progress indicator
data    → list of items
error   → error message
```

## 10. Save data from a widget

Use `ConsumerWidget` or `ConsumerState` when a widget needs `ref`:

```dart
Future<void> saveItem(WidgetRef ref) async {
  await ref.read(itemsRepositoryProvider).createItem(
        name: 'Milk',
        price: 4.25,
      );
}
```

Use `read` for actions such as save, update, delete, import, or export. The action does not need to rebuild the widget when the provider changes.

Use `watch` when the widget should rebuild as the provider changes.

```dart
ref.read(provider);   // get the current object
ref.watch(provider);  // listen and rebuild when it changes
```

### Add an item page

Create `lib/ui/items/add_item_page.dart`. The page uses the repository provider
to save the form, invalidates the list provider, and returns to the dashboard with
`context.pop()` after a successful save.

```dart
class AddItemsPage extends ConsumerStatefulWidget {
  const AddItemsPage({super.key});

  @override
  ConsumerState<AddItemsPage> createState() => _AddItemsPageState();
}

class _AddItemsPageState extends ConsumerState<AddItemsPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _priceController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    await ref.read(itemsRepositoryProvider).createItem(
          name: _nameController.text.trim(),
          price: double.parse(_priceController.text.trim()),
        );
    ref.invalidate(itemsStreamProvider);
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add item'),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (value) => value == null || value.trim().isEmpty
                  ? 'Enter a name'
                  : null,
            ),
            TextFormField(
              controller: _priceController,
              decoration: const InputDecoration(labelText: 'Price'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (value) => double.tryParse(value?.trim() ?? '') == null
                  ? 'Enter a valid price'
                  : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _save,
              child: const Text('Save item'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 11. Database migrations

Suppose a version-1 application has `id`, `name`, and `price`, and version 2 adds an optional note. Add the new column to the table:

```dart
TextColumn get note => text().nullable()();
```

Then increase the schema version:

```dart
@override
int get schemaVersion => 2;
```

Add upgrade logic:

```dart
@override
MigrationStrategy get migration => MigrationStrategy(
      onCreate: (migrator) async {
        await migrator.createAll();
      },
      onUpgrade: (migrator, from, to) async {
        if (from < 2) {
          await migrator.addColumn(items, items.note);
        }
      },
    );
```

After changing the schema:

```bash
dart run build_runner build --delete-conflicting-outputs
```

Do not delete or recreate the production database to handle a normal schema change. Use a migration so existing user data is preserved.

## 12. Test the repository

Use an in-memory SQLite database in tests:

```dart
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:my_app/data/local/app_database.dart';
import 'package:my_app/data/repository/items_repository.dart';

void main() {
  late AppDatabase database;
  late ItemsRepository repository;

  setUp(() {
    database = AppDatabase(NativeDatabase.memory());
    repository = DriftItemsRepository(database: database);
  });

  tearDown(() async {
    await database.close();
  });

  test('creates an item', () async {
    final item = await repository.createItem(
      name: 'Milk',
      price: 4.25,
    );

    expect(item.name, 'Milk');
  });
}
```

Repository tests verify database behavior without starting the whole application.

# Part 3: Development and deployment commands

Unless stated otherwise, run commands in this section from the Flutter project root.

## Daily development loop

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze
flutter test
flutter run
```

Use `build_runner` after changing Drift tables, generated database code, or generated models. Use `flutter analyze` and `flutter test` before building an APK or app bundle.

`flutter run` starts a debug build by default. Debug builds are for everyday development, hot reload, logs, breakpoints, and fast iteration. They are larger and slower to start than release builds because they include debugging and runtime support.

## Choose a target device

List available targets, then pass a device ID with `-d`:

```bash
flutter devices
flutter run -d <device-id>
```

Examples:

```bash
flutter run -d linux
flutter run -d chrome
flutter run -d emulator-5554
```

For Android devices, enable USB debugging, connect the device, unlock it, and accept the debugging prompt. You can also confirm the device with ADB:

```bash
adb devices
```

## Add app and launcher icons for Android and Linux

Keep a high-resolution PNG source image in the project, for example
`assets/icons/app_icon.png`. A PNG is the most portable source for generated
Android launcher icons. An SVG can also be kept as a Flutter asset for a Linux
desktop-entry icon.

In `pubspec.yaml`, add every asset that the running Flutter application or
Linux desktop launcher must access to the `flutter` asset list. The
`flutter_launcher_icons` setting below does **not** bundle its `image_path`
automatically:

```yaml
flutter:
  assets:
    - assets/icons/app_icon.png
    - assets/icons/app_icon.svg

dev_dependencies:
  flutter_launcher_icons: ^0.14.0

flutter_launcher_icons:
  android: true
  image_path: assets/icons/app_icon.png
```

Run the generator whenever the PNG source changes:

```bash
flutter pub get
dart run flutter_launcher_icons
```

This writes Android's launcher-icon resources under `android/app/src/main/res/`.
Build the Android app normally afterwards:

```bash
flutter build apk --release
```

For Linux, Flutter does not generate a native launcher icon from this package.
After `flutter build linux --release`, assets declared under `flutter.assets`
are copied into the bundle at:

```text
build/linux/x64/release/bundle/data/flutter_assets/<asset-path>
```

For example, `assets/icons/app_icon.png` becomes
`build/linux/x64/release/bundle/data/flutter_assets/assets/icons/app_icon.png`.
If you copy the complete bundle to `/opt/my_app`, the desktop entry can use:

```ini
Icon=/opt/my_app/data/flutter_assets/assets/icons/app_icon.png
```

Use the actual file extension and path that exists in the installed bundle.
Neither shell commands nor `.desktop` entries require escaping underscores, so
write `my_app`, not `my\_app`.

## Understand Android build modes

Flutter has three common Android build modes:

```bash
flutter run --debug
flutter run --profile
flutter run --release
```

Debug mode is the default for `flutter run`. Use it while coding.

Profile mode is for near-production performance testing on a real device:

```bash
flutter run --profile -d <device-id>
```

Profile mode is not a debug build. It is much closer to release behavior but still keeps performance tooling available. It does not require production signing credentials.

Release mode is optimized for distribution or final device testing:

```bash
flutter build apk --release
flutter build appbundle --release
```

Release output is smaller and faster than debug output because Dart code is compiled ahead of time and debug-only tooling is removed. The APK is written under:

```text
build/app/outputs/flutter-apk/
```

`flutter run --release` builds, installs, and starts a release-mode app on a
connected device. `flutter build apk --release` creates an APK file without
starting it. For Google Play, build an Android App Bundle instead:

```bash
flutter build appbundle --release
```

The resulting `.aab` is written under `build/app/outputs/bundle/release/`.

### A practical development-to-production path

| Stage | Use it for | Normal command | Signing expectation |
| --- | --- | --- | --- |
| Everyday coding | Hot reload, logs, breakpoints | `flutter run` | Debug key |
| Measure performance | Profiling on a real device | `flutter run --profile` | Debug key |
| Test the optimized app locally | Startup and release-only behavior | `flutter build apk --release` | Debug key is acceptable only for local testing |
| Distribute a signed APK directly | Testers or private distribution | `flutter build apk --release` | Your release key |
| Publish through Google Play | Play Console upload | `flutter build appbundle --release` | Your upload key |

The third stage is useful, but it must not be confused with a publishable
artifact. **Release mode** describes how Flutter compiles the app; **release
signing** describes whose identity signs the Android package. They are related,
but they are not the same setting.

## Build, sign, and distribute an Android release

### Why `flutter build apk --release` may work at first

A new Flutter Android project often allows this command immediately:

```bash
flutter build apk --release
```

That does not necessarily mean the APK is production-signed. Many starter projects sign the `release` build type with Android's debug keystore so developers can build and install a release-mode APK locally before creating a real upload key.

In a Kotlin DSL project, check `android/app/build.gradle.kts`. The equivalent
release build type looks like:

```kotlin
android {
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}
```

In a Groovy Gradle project, check `android/app/build.gradle`. The same idea
looks like:

```groovy
android {
    buildTypes {
        release {
            signingConfig signingConfigs.debug
        }
    }
}
```

This APK can be useful for local testing, but it is not a proper production artifact for app-store distribution.

### When release builds stop working

`flutter build apk --release` stops working when the project changes from debug-signing release builds to requiring a real release/upload key.

This usually happens after editing one of these files:

```text
android/app/build.gradle.kts
android/app/build.gradle
```

Use `.kts` examples when the project has `build.gradle.kts`. Use Groovy examples when the project has `build.gradle`.

A stricter Kotlin Gradle setup may load signing values from:

```text
android/key.properties
```

and fail release builds when required values are missing. That is intentional for production projects because it prevents accidentally publishing an APK signed with the wrong key.

### What Android signing keys are

Android apps must be signed before Android will install or distribute them. The signature proves that future updates come from the same app owner.

There are three common signing situations:

- The **debug keystore** is generated for local development, normally by the
  Android tools. It is fine for testing on your own device and must never be
  used to publish an app.
- A **release keystore** is a private key you control. It can sign apps that
  you distribute yourself.
- With Google Play App Signing, an **upload key** signs the bundle you upload
  to Play. Google then signs the installed app with the separate app-signing
  key it manages. In this common setup, protect and back up the upload key.

For a self-distributed app, future updates must be signed with the same release
key. For Play App Signing, future uploads must use the registered upload key
(or a replacement approved by Google Play). Treat every non-debug keystore and
its passwords as production credentials: store them securely and keep an
off-machine backup.

### Create an upload or release key

Create the key once, before configuring production signing. Choose a secure
location outside the repository and record the alias and passwords in your
password manager:

```bash
keytool -genkey -v \
  -keystore /absolute/path/to/upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -storetype JKS \
  -validity 10000
```

`keytool` comes with the JDK. It prompts for the keystore password, key
password, and certificate details. The command does not upload anything; it
only creates the local credential file. Do not commit the resulting `.jks`
file, and do not paste its passwords into source code.

### Configure production signing

Keep signing credentials out of Git. A common setup uses these files:

```text
android/key.properties
android/key.properties.example
<your-upload-keystore>.jks
```

`android/key.properties.example` is safe to commit because it contains placeholders. `android/key.properties` and real `.jks` or `.keystore` files should be ignored by Git.

Example `android/key.properties`:

```properties
storePassword=<keystore-password>
keyPassword=<key-password>
keyAlias=<key-alias>
storeFile=<path-to-upload-keystore.jks>
```

The `storeFile` path is resolved relative to the Android Gradle project unless your Gradle file handles it differently. The referenced keystore must exist, and the alias/password values must match it.

Then configure the release signing block. Edit exactly one file, based on what
your project already contains:

| Project file | Gradle language | Use the matching example below |
| --- | --- | --- |
| `android/app/build.gradle.kts` | Kotlin DSL | Kotlin |
| `android/app/build.gradle` | Groovy DSL | Groovy |

Do not add a second Gradle file just to use a different example.

Kotlin Gradle example for `android/app/build.gradle.kts`:

```kotlin
import java.util.Properties

val signingPropertiesFile = rootProject.file("key.properties")
val signingProperties = Properties()
if (signingPropertiesFile.exists()) {
    signingPropertiesFile.inputStream().use(signingProperties::load)
}

val requiredSigningProperties = listOf(
    "storeFile",
    "storePassword",
    "keyAlias",
    "keyPassword",
)
val missingSigningProperties = requiredSigningProperties.filter {
    signingProperties.getProperty(it).isNullOrBlank()
}
if (missingSigningProperties.isNotEmpty()) {
    throw GradleException(
        "Missing Android release-signing values in android/key.properties: " +
            missingSigningProperties.joinToString(),
    )
}

android {
    signingConfigs {
        create("release") {
            keyAlias = signingProperties.getProperty("keyAlias")
            keyPassword = signingProperties.getProperty("keyPassword")
            storeFile = signingProperties.getProperty("storeFile")?.let(rootProject::file)
            storePassword = signingProperties.getProperty("storePassword")
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

Groovy Gradle example for `android/app/build.gradle`:

```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

def requiredSigningProperties = ['storeFile', 'storePassword', 'keyAlias', 'keyPassword']
def missingSigningProperties = requiredSigningProperties.findAll {
    !keystoreProperties[it]
}
if (!missingSigningProperties.isEmpty()) {
    throw new GradleException(
        "Missing Android release-signing values in android/key.properties: ${missingSigningProperties.join(', ')}"
    )
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? rootProject.file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

After production signing is configured:

```bash
flutter build apk --release
flutter build appbundle --release
```

## Test a local Android release

### Local release testing without production keys

Sometimes you want release performance locally before a production keystore exists. There are two clear ways to do that.

Option 1: keep the starter-project behavior and sign every release build with the debug key:

```kotlin
buildTypes {
    release {
        signingConfig = signingConfigs.getByName("debug")
    }
}
```

This is simple, but it makes it too easy to create a debug-signed release APK
by accident. Use it only while the app is private and in early development.

Option 2: keep production signing enforced by default, but add an explicit
opt-in Gradle property for local builds. This is the better long-term pattern.
The property must control both the missing-property check and the selected
signing configuration. Add the following around the Kotlin example above:

```kotlin
val allowDebugReleaseSigning = providers.gradleProperty("allowDebugReleaseSigning")
    .map(String::toBoolean)
    .getOrElse(false)

if (missingSigningProperties.isNotEmpty() && !allowDebugReleaseSigning) {
    throw GradleException(
        "Missing Android release-signing values in android/key.properties: " +
            missingSigningProperties.joinToString(),
    )
}

buildTypes {
    release {
        signingConfig = if (allowDebugReleaseSigning) {
            signingConfigs.getByName("debug")
        } else {
            signingConfigs.getByName("release")
        }
    }
}
```

When using this option, replace the unconditional
`if (missingSigningProperties.isNotEmpty())` failure in the preceding Kotlin
example with the conditional one above. Otherwise Gradle fails before it can
select the debug key.

Then build a local release APK with debug signing:

```bash
ORG_GRADLE_PROJECT_allowDebugReleaseSigning=true flutter build apk --release
```

This produces a release-mode APK, but it is signed with the debug key. Use it for local testing only.

### Keep debug symbols for release builds

Use `--split-debug-info` when you want separate symbol files for release builds:

```bash
flutter build apk --release --split-debug-info=build/app/symbols
```

With the explicit local debug-signing property:

```bash
ORG_GRADLE_PROJECT_allowDebugReleaseSigning=true flutter build apk --release --split-debug-info=build/app/symbols
```

The APK is still release mode. The debug information is written separately under:

```text
build/app/symbols/
```

Keep these symbol files for crash decoding. They are not the same thing as a debug APK.

## Install an Android release on a physical device

Verify that Flutter and ADB can see the device:

```bash
flutter devices
adb devices
```

Install the most recent built APK through Flutter:

```bash
flutter install -d <device-id>
```

Or install a specific APK with ADB:

```bash
adb -s <device-id> install -r build/app/outputs/flutter-apk/app-release.apk
```

For ordinary development, prefer:

```bash
flutter run -d <device-id>
```

It builds, installs, starts the app, and keeps logs attached.

## Build, install, and launch a Linux release

### Build and run the release bundle

```bash
flutter build linux --release
./build/linux/x64/release/bundle/<app-name>
```

Flutter creates a runnable bundle rather than a `.deb`. The bundle is written to `build/linux/x64/release/bundle/`; replace `<app-name>` with the executable name produced by the build. Run the executable from that directory, or use the full path above. Keep the complete bundle together: the executable requires its adjacent `lib/` and `data/` directories.

### Install for all users and add a terminal command

To install the bundle locally for all users, replace `<app-name>` consistently with the executable name:

```bash
sudo install -d /opt/<app-name>
sudo cp -a build/linux/x64/release/bundle/. /opt/<app-name>/
sudo ln -sf /opt/<app-name>/<app-name> /usr/local/bin/<app-name>
<app-name>
```

This installs the bundle in `/opt/<app-name>` and makes it available as the `<app-name>` terminal command.

### Add a desktop-menu launcher

Create `~/.local/share/applications/<app-name>.desktop`, replacing the placeholders with the application name, display name, installed executable path, and the path to an icon asset declared in `pubspec.yaml`. The file extension must match a file that exists in the installed bundle:

```ini
[Desktop Entry]
Name=My app
Comment=My app
Exec=/opt/<app-name>/<app-name>
Icon=/opt/<app-name>/data/flutter_assets/assets/icons/<app-icon>.png
Terminal=false
Type=Application
Categories=Utility;
```

The application should then appear in the desktop environment's app menu. If it does not appear immediately, log out and back in, or refresh the desktop-entry cache when `update-desktop-database` is available:

```bash
update-desktop-database ~/.local/share/applications
```

For a launcher without a system-wide installation, use the absolute path to the built executable in `Exec=` instead. That launcher will stop working if the project or build directory is moved or cleaned.

### Package for distribution

Flutter does not produce a Debian package from `flutter build linux`. Use a Linux packaging tool, such as Fastforge, when you need a distributable `.deb` (or AppImage/RPM) for Debian or Ubuntu users.

## Build a web release

```bash
flutter build web --release
```

Web output is written under `build/web/`.

## Enable desktop and web targets

Enable only the platforms required by the project:

```bash
flutter config --enable-linux-desktop
flutter config --enable-web
flutter create --platforms=linux,web .
```

Check the resulting targets with:

```bash
flutter devices
```

`flutter create --platforms=... .` adds platform files to an existing project. Review the generated files before committing them.

## Clean builds and common workflows

Use this sequence when stale generated files or build artifacts cause confusing errors:

```bash
flutter clean
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze
flutter test
```

If the problem is limited to generated Drift files, try the build-runner command first; a full clean is slower and is not normally needed after every code change.

### Typical development flow

```text
define or change a table
→ update schemaVersion and migration if necessary
→ generate Drift code
→ add repository methods
→ expose shared objects or streams with Riverpod
→ use providers in widgets
→ run analyzer and tests
```

## Important rules

- Do not edit `app_database.g.dart` manually.
- Keep Drift queries inside the repository layer.
- Use `watch()` and `StreamProvider` for live UI data.
- Use `read()` for one-time actions.
- Use transactions for related writes.
- Add migrations when changing a database used by existing users.
- Use interfaces when a repository or service may need a different implementation in tests or in the future.
