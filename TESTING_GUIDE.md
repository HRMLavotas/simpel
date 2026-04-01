# Testing Guide - SIMPEL Application

## Overview

Panduan lengkap untuk testing aplikasi SIMPEL menggunakan Vitest, React Testing Library, dan TestSprite.

## Test Structure

```
src/
├── test/
│   ├── setup.ts                 # Global test setup
│   ├── testUtils.tsx            # Test utilities and helpers
│   └── integration/             # Integration tests
│       └── employee-workflow.test.tsx
├── hooks/
│   └── __tests__/              # Hook tests
│       ├── useAuth.test.tsx
│       └── useEmployeeValidation.test.ts
├── components/
│   ├── __tests__/              # Component tests
│   │   └── ErrorBoundary.test.tsx
│   └── employees/
│       └── __tests__/
│           └── EmployeeFormModal.test.tsx
├── pages/
│   └── __tests__/              # Page tests
│       ├── Auth.test.tsx
│       └── Dashboard.test.tsx
└── lib/
    └── __tests__/              # Utility tests
        └── logger.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test src/hooks/__tests__/useAuth.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --grep "employee"
```

## Test Categories

### 1. Unit Tests

Test individual functions, hooks, and components in isolation.

**Example: Hook Test**
```typescript
import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';

it('should handle sign in', async () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  });

  await result.current.signIn('test@example.com', 'password');
  
  expect(result.current.user).toBeTruthy();
});
```

**Example: Component Test**
```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

it('should catch errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

### 2. Integration Tests

Test complete user workflows and interactions between components.

**Example: Employee Workflow**
```typescript
it('should add new employee', async () => {
  const user = userEvent.setup();
  
  render(<Employees />);
  
  // Click add button
  await user.click(screen.getByRole('button', { name: /tambah/i }));
  
  // Fill form
  await user.type(screen.getByLabelText(/nama/i), 'John Doe');
  await user.type(screen.getByLabelText(/nip/i), '199001012020121001');
  
  // Submit
  await user.click(screen.getByRole('button', { name: /simpan/i }));
  
  // Verify
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 3. E2E Tests (Future)

Test complete user journeys using Playwright or Cypress.

## Test Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Hooks | 20% | 80% |
| Components | 5% | 70% |
| Pages | 0% | 60% |
| Utils | 0% | 80% |
| Overall | ~5% | 70% |

## Testing Best Practices

### 1. Test User Behavior, Not Implementation

❌ **Bad:**
```typescript
it('should set loading state to true', () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(true);
});
```

✅ **Good:**
```typescript
it('should show loading spinner while authenticating', () => {
  render(<LoginForm />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### 2. Use Accessible Queries

Priority order:
1. `getByRole` - Best for accessibility
2. `getByLabelText` - Good for forms
3. `getByPlaceholderText` - OK for inputs
4. `getByText` - OK for content
5. `getByTestId` - Last resort

❌ **Bad:**
```typescript
const button = container.querySelector('.submit-button');
```

✅ **Good:**
```typescript
const button = screen.getByRole('button', { name: /submit/i });
```

### 3. Avoid Testing Implementation Details

❌ **Bad:**
```typescript
it('should call useState', () => {
  const spy = vi.spyOn(React, 'useState');
  render(<Component />);
  expect(spy).toHaveBeenCalled();
});
```

✅ **Good:**
```typescript
it('should update counter when button clicked', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### 4. Use waitFor for Async Operations

❌ **Bad:**
```typescript
it('should load data', () => {
  render(<DataList />);
  expect(screen.getByText('Item 1')).toBeInTheDocument(); // Fails!
});
```

✅ **Good:**
```typescript
it('should load data', async () => {
  render(<DataList />);
  await waitFor(() => {
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  cleanup(); // Unmount components
  vi.clearAllMocks(); // Clear mock calls
});
```

## Mocking

### Mock Supabase Client

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));
```

### Mock React Router

```typescript
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-id' }),
  };
});
```

### Mock Custom Hooks

```typescript
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    role: 'admin_pusat',
    isLoading: false,
  }),
}));
```

## Common Test Patterns

### Testing Forms

```typescript
it('should validate and submit form', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  
  render(<EmployeeForm onSubmit={onSubmit} />);
  
  // Fill form
  await user.type(screen.getByLabelText(/nama/i), 'John Doe');
  await user.type(screen.getByLabelText(/nip/i), '199001012020121001');
  
  // Submit
  await user.click(screen.getByRole('button', { name: /simpan/i }));
  
  // Verify
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      nip: '199001012020121001',
    });
  });
});
```

### Testing Error States

```typescript
it('should display error message', async () => {
  mockSupabase.from.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    then: vi.fn().mockResolvedValue({ 
      data: null, 
      error: new Error('Failed') 
    }),
  });
  
  render(<DataList />);
  
  await waitFor(() => {
    expect(screen.getByText(/error|gagal/i)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
it('should show loading spinner', () => {
  render(<DataList isLoading={true} />);
  
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### Testing Conditional Rendering

```typescript
it('should show admin controls for admin users', () => {
  render(<Dashboard role="admin_pusat" />);
  
  expect(screen.getByRole('button', { name: /tambah/i })).toBeInTheDocument();
});

it('should hide admin controls for regular users', () => {
  render(<Dashboard role="user" />);
  
  expect(screen.queryByRole('button', { name: /tambah/i })).not.toBeInTheDocument();
});
```

## Debugging Tests

### 1. Use screen.debug()

```typescript
it('should render component', () => {
  render(<Component />);
  screen.debug(); // Prints DOM to console
});
```

### 2. Use screen.logTestingPlaygroundURL()

```typescript
it('should render component', () => {
  render(<Component />);
  screen.logTestingPlaygroundURL(); // Opens testing playground
});
```

### 3. Use --ui flag

```bash
npm run test:ui
```

Opens Vitest UI for interactive debugging.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## TestSprite Integration

TestSprite adalah MCP tool untuk automated testing. Setelah server terkoneksi, gunakan untuk:

1. **Generate test cases** untuk komponen baru
2. **Analyze test coverage** dan identifikasi gap
3. **Suggest test improvements** berdasarkan best practices
4. **Auto-generate mocks** untuk dependencies

### Using TestSprite

```typescript
// TestSprite akan membantu generate test seperti ini:
describe('NewComponent', () => {
  // TestSprite generated tests
  it('should render correctly', () => {
    // Auto-generated test
  });
  
  it('should handle user interactions', async () => {
    // Auto-generated test
  });
});
```

## Next Steps

1. ✅ Setup test infrastructure (DONE)
2. ✅ Create test utilities (DONE)
3. ✅ Add unit tests for hooks (DONE)
4. ✅ Add component tests (DONE)
5. ✅ Add integration tests (DONE)
6. ⏳ Increase coverage to 70%
7. ⏳ Add E2E tests with Playwright
8. ⏳ Setup CI/CD pipeline

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TestSprite Documentation](https://testsprite.com/docs)

## Support

Jika ada pertanyaan atau issue dengan testing, silakan:
1. Check dokumentasi ini
2. Review existing tests sebagai contoh
3. Konsultasi dengan team lead
