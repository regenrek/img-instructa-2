# Todos Architecture - Sequence Diagram

This document describes the complete flow of the todos functionality using TanStack Start, TanStack Query, and Server Functions.

## Architecture Overview

The todos system follows a server-first architecture:
- **Route Loader**: Prefetches data on SSR and navigation
- **TanStack Query**: Manages server state with caching and invalidation
- **Server Functions**: Type-safe backend functions with Zod validation
- **In-Memory Store**: Simple array-based storage (demo only)

## Sequence Diagrams

### 1. Initial Page Load (SSR + Hydration)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant RouteLoader
    participant QueryClient
    participant ServerFn as getTodos ServerFn
    participant ServerStore as In-Memory Store
    participant Component as RouteComponent
    participant ReactQuery as TanStack Query

    Note over Browser,ServerStore: SSR Phase
    Browser->>RouteLoader: Navigate to /
    RouteLoader->>QueryClient: ensureQueryData(['todos'])
    QueryClient->>ServerFn: Call getTodos()
    ServerFn->>ServerStore: Read todos array
    ServerStore-->>ServerFn: Return todos[]
    ServerFn-->>QueryClient: Return todos[]
    QueryClient->>QueryClient: Cache data with key ['todos']
    RouteLoader-->>Browser: HTML with todos data
    
    Note over Browser,ReactQuery: Client Hydration
    Browser->>Component: Hydrate React
    Component->>ReactQuery: useSuspenseQuery(['todos'])
    ReactQuery->>QueryClient: Get cached data
    QueryClient-->>ReactQuery: Return cached todos[]
    ReactQuery-->>Component: todos[] data
    Component->>Browser: Render UI with todos
```

### 2. Create Todo Flow

```mermaid
sequenceDiagram
    participant User
    participant Component as RouteComponent
    participant Handler as handleCreateTodo
    participant Mutation as useCreateTodoMutation
    participant ServerFn as createTodo ServerFn
    participant Zod as Zod Validator
    participant ServerStore as In-Memory Store
    participant QueryClient
    participant Toast as Sonner Toast

    User->>Component: Type text + click "Add"
    Component->>Handler: handleCreateTodo()
    Handler->>Handler: Validate: newTodoText.trim()
    
    alt Invalid (empty text)
        Handler->>Toast: toast.error('Cannot be empty')
        Toast-->>User: Show error toast
    else Valid
        Handler->>Mutation: mutate(text)
        Mutation->>Mutation: Set isPending = true
        Mutation->>ServerFn: createTodo({ data: { text } })
        ServerFn->>Zod: Validate data.text
        Zod-->>ServerFn: Validation result
        
        alt Validation fails
            ServerFn-->>Mutation: Throw validation error
            Mutation->>Toast: toast.error(error.message)
            Toast-->>User: Show error toast
            Mutation->>Mutation: Set isPending = false
        else Validation success
            ServerFn->>ServerStore: Push new todo to array
            ServerStore-->>ServerFn: Todo added
            ServerFn-->>Mutation: Return newTodo { id, text, completed }
            Mutation->>Mutation: Set isPending = false
            Mutation->>QueryClient: invalidateQueries(['todos'])
            QueryClient->>QueryClient: Mark ['todos'] as stale
            QueryClient->>ServerFn: Refetch getTodos()
            ServerFn->>ServerStore: Read todos array
            ServerStore-->>ServerFn: Return todos[] (including new)
            ServerFn-->>QueryClient: Return updated todos[]
            QueryClient->>QueryClient: Update cache
            QueryClient->>Component: Trigger re-render
            Mutation->>Toast: toast.success('Todo created!')
            Toast-->>User: Show success toast
            Component->>User: UI updates with new todo
        end
    end
```

### 3. Toggle Todo (Complete/Uncomplete)

```mermaid
sequenceDiagram
    participant User
    participant Component as RouteComponent
    participant Handler as handleToggleTodo
    participant Mutation as useToggleTodoMutation
    participant ServerFn as toggleTodo ServerFn
    participant Zod as Zod Validator
    participant ServerStore as In-Memory Store
    participant QueryClient
    participant Toast as Sonner Toast

    User->>Component: Click checkbox on todo
    Component->>Handler: handleToggleTodo(todoId)
    Handler->>Mutation: mutate(todoId)
    Mutation->>Mutation: Set isPending = true
    Mutation->>ServerFn: toggleTodo({ data: { id } })
    ServerFn->>Zod: Validate data.id
    Zod-->>ServerFn: Validation result
    
    alt Validation fails
        ServerFn-->>Mutation: Throw validation error
        Mutation->>Toast: toast.error(error.message)
        Toast-->>User: Show error toast
        Mutation->>Mutation: Set isPending = false
    else Validation success
        ServerFn->>ServerStore: Find todo by id
        ServerStore-->>ServerFn: Return todo or undefined
        
        alt Todo not found
            ServerFn-->>Mutation: Throw Error('Todo not found')
            Mutation->>Toast: toast.error('Todo not found')
            Toast-->>User: Show error toast
            Mutation->>Mutation: Set isPending = false
        else Todo found
            ServerFn->>ServerStore: Toggle todo.completed
            ServerStore-->>ServerFn: Todo updated
            ServerFn-->>Mutation: Return updated todo
            Mutation->>Mutation: Set isPending = false
            Mutation->>QueryClient: invalidateQueries(['todos'])
            QueryClient->>QueryClient: Mark ['todos'] as stale
            QueryClient->>ServerFn: Refetch getTodos()
            ServerFn->>ServerStore: Read todos array
            ServerStore-->>ServerFn: Return todos[] (with toggle applied)
            ServerFn-->>QueryClient: Return updated todos[]
            QueryClient->>QueryClient: Update cache
            QueryClient->>Component: Trigger re-render
            Component->>User: UI updates (checkbox reflects new state)
        end
    end
```

### 4. Delete Todo Flow

```mermaid
sequenceDiagram
    participant User
    participant Component as RouteComponent
    participant Handler as handleDeleteTodo
    participant Mutation as useDeleteTodoMutation
    participant ServerFn as deleteTodo ServerFn
    participant Zod as Zod Validator
    participant ServerStore as In-Memory Store
    participant QueryClient
    participant Toast as Sonner Toast

    User->>Component: Click "Delete" button
    Component->>Handler: handleDeleteTodo(todoId)
    Handler->>Mutation: mutate(todoId)
    Mutation->>Mutation: Set isPending = true
    Mutation->>ServerFn: deleteTodo({ data: { id } })
    ServerFn->>Zod: Validate data.id
    Zod-->>ServerFn: Validation result
    
    alt Validation fails
        ServerFn-->>Mutation: Throw validation error
        Mutation->>Toast: toast.error(error.message)
        Toast-->>User: Show error toast
        Mutation->>Mutation: Set isPending = false
    else Validation success
        ServerFn->>ServerStore: Find index of todo by id
        ServerStore-->>ServerFn: Return index or -1
        
        alt Todo not found (index === -1)
            ServerFn-->>Mutation: Throw Error('Todo not found')
            Mutation->>Toast: toast.error('Todo not found')
            Toast-->>User: Show error toast
            Mutation->>Mutation: Set isPending = false
        else Todo found
            ServerFn->>ServerStore: todos.splice(index, 1)
            ServerStore-->>ServerFn: Todo removed
            ServerFn-->>Mutation: Return { success: true }
            Mutation->>Mutation: Set isPending = false
            Mutation->>QueryClient: invalidateQueries(['todos'])
            QueryClient->>QueryClient: Mark ['todos'] as stale
            QueryClient->>ServerFn: Refetch getTodos()
            ServerFn->>ServerStore: Read todos array
            ServerStore-->>ServerFn: Return todos[] (without deleted)
            ServerFn-->>QueryClient: Return updated todos[]
            QueryClient->>QueryClient: Update cache
            QueryClient->>Component: Trigger re-render
            Mutation->>Toast: toast.success('Todo deleted!')
            Toast-->>User: Show success toast
            Component->>User: UI updates (todo removed from list)
        end
    end
```

### 5. Manual Refresh Flow

```mermaid
sequenceDiagram
    participant User
    participant Component as RouteComponent
    participant ReactQuery as useSuspenseQuery
    participant QueryClient
    participant ServerFn as getTodos ServerFn
    participant ServerStore as In-Memory Store

    User->>Component: Click "Refresh" button
    Component->>ReactQuery: refetch()
    ReactQuery->>QueryClient: Refetch ['todos']
    QueryClient->>ServerFn: Call getTodos()
    ServerFn->>ServerStore: Read todos array
    ServerStore-->>ServerFn: Return todos[]
    ServerFn-->>QueryClient: Return todos[]
    QueryClient->>QueryClient: Update cache
    QueryClient->>Component: Trigger re-render
    Component->>User: UI updates with latest todos
```

## Key Components

### Route Loader (`src/routes/(marketing)/index.tsx`)
```typescript
loader: async (opts) => {
  await opts.context.queryClient.ensureQueryData(todosQueries.list());
}
```
- Runs on SSR (server) and client navigation
- Prefetches todos data before component renders
- Seeds QueryClient cache for instant hydration

### TanStack Query Integration
- **Query Key**: `['todos']`
- **Stale Time**: 5 minutes (1000 * 60 * 5)
- **Suspense**: Uses `useSuspenseQuery` for automatic loading states

### Server Functions (`src/server/function/todos.ts`)
- **getTodos**: GET handler, returns all todos
- **createTodo**: POST handler with Zod validation, creates new todo
- **toggleTodo**: POST handler, toggles completed status
- **deleteTodo**: POST handler, removes todo from array

### Error Handling
- Zod validation errors caught in mutation
- Server-side errors (e.g., "Todo not found") caught in mutation
- All errors displayed via Sonner toast notifications

### State Management
- **Server State**: Managed by TanStack Query
- **UI State**: Local React state (`newTodoText`, `getResponse`, `postResponse`)
- **Storage**: In-memory array (demo only - would use database in production)

## Data Flow Summary

1. **Read**: Route Loader → QueryClient → Server Function → In-Memory Store
2. **Create/Update/Delete**: Component → Mutation → Server Function → Store → QueryClient Invalidation → Refetch
3. **UI Updates**: QueryClient cache updates → React Query triggers re-render

## Best Practices Implemented

✅ Fetch in route loaders (not `useEffect`)  
✅ Server functions for backend logic  
✅ Zod validation for type safety  
✅ Query invalidation after mutations  
✅ Toast notifications for user feedback  
✅ Suspense for loading states  
✅ SSR support with hydration  

