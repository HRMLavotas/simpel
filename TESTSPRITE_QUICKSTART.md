# TestSprite Quick Start Guide

## 🚀 Setup TestSprite

### 1. Prerequisites

TestSprite menggunakan `npx` yang sudah terinstall dengan Node.js. Tidak perlu install tambahan!

### 2. Verify Node.js Installation

```bash
node --version
npm --version
npx --version
```

### 3. Reconnect TestSprite MCP Server

TestSprite sudah dikonfigurasi dengan benar di `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "[YOUR_API_KEY]"
      }
    }
  }
}
```

**Untuk reconnect:**
1. Open Kiro
2. Go to MCP Server view in Kiro feature panel
3. Find "TestSprite" in the list
4. Click "Reconnect" or restart Kiro

### 4. Verify Connection

TestSprite MCP server should show as "Connected" in Kiro panel.

---

## 📖 Using TestSprite

### Generate Tests for a Component

```typescript
// Ask Kiro to use TestSprite:
"Use TestSprite to generate tests for src/components/employees/EmployeeFormModal.tsx"
```

TestSprite will analyze the component and generate:
- Unit tests for all props
- Tests for user interactions
- Tests for edge cases
- Tests for error handling

### Analyze Test Coverage

```typescript
// Ask Kiro:
"Use TestSprite to analyze test coverage for the employees module"
```

TestSprite will:
- Identify untested code paths
- Suggest missing test cases
- Recommend coverage improvements

### Generate Integration Tests

```typescript
// Ask Kiro:
"Use TestSprite to generate integration tests for the employee management workflow"
```

TestSprite will create:
- End-to-end workflow tests
- Multi-component interaction tests
- Data flow tests

### Auto-Generate Mocks

```typescript
// Ask Kiro:
"Use TestSprite to generate mocks for Supabase client"
```

TestSprite will:
- Create realistic mock data
- Generate mock functions
- Setup mock responses

---

## 🎯 TestSprite Best Practices

### 1. Start with Critical Paths

Focus TestSprite on:
- Authentication flow
- Data CRUD operations
- Form validation
- Error handling

### 2. Review Generated Tests

Always review and customize generated tests:
- Verify test assertions
- Add business logic checks
- Ensure realistic test data

### 3. Combine with Manual Tests

Use TestSprite for:
- Boilerplate test generation
- Coverage gap identification
- Mock generation

Write manually for:
- Complex business logic
- Edge cases specific to your domain
- Integration with external services

### 4. Iterate and Improve

1. Generate initial tests with TestSprite
2. Run tests and check coverage
3. Identify gaps
4. Use TestSprite to fill gaps
5. Repeat until target coverage reached

---

## 📊 TestSprite Commands

### Common Commands:

```bash
# Generate tests for a file
"Generate tests for [file path]"

# Analyze coverage
"Analyze test coverage for [module/component]"

# Generate mocks
"Generate mocks for [dependency]"

# Suggest improvements
"Suggest test improvements for [test file]"

# Generate integration tests
"Generate integration tests for [workflow]"
```

---

## 🔍 Example Workflow

### Step 1: Generate Component Tests

```
You: "Use TestSprite to generate tests for src/components/employees/EmployeeFormModal.tsx"

Kiro: [Generates comprehensive test suite]
```

### Step 2: Run Tests

```bash
npm test src/components/employees/__tests__/EmployeeFormModal.test.tsx
```

### Step 3: Check Coverage

```bash
npm test -- --coverage
```

### Step 4: Fill Gaps

```
You: "Use TestSprite to analyze coverage gaps in EmployeeFormModal tests"

Kiro: [Identifies missing test cases and generates them]
```

### Step 5: Verify

```bash
npm test -- --coverage
```

---

## 🎨 TestSprite Features

### 1. Smart Test Generation
- Analyzes component props and state
- Generates tests for all code paths
- Creates realistic test data

### 2. Coverage Analysis
- Identifies untested code
- Suggests missing test cases
- Recommends improvements

### 3. Mock Generation
- Creates realistic mocks
- Handles complex dependencies
- Generates mock data

### 4. Integration Test Generation
- Maps component interactions
- Creates workflow tests
- Tests data flow

### 5. Test Optimization
- Identifies redundant tests
- Suggests test refactoring
- Improves test performance

---

## 🐛 Troubleshooting

### TestSprite Not Connecting

**Problem:** MCP server shows as disconnected

**Solutions:**
1. Verify Node.js is installed: `node --version`
2. Check API key in `.kiro/settings/mcp.json`
3. Restart Kiro
4. Check MCP server logs in Kiro
5. Try running manually: `npx @testsprite/testsprite-mcp@latest`

### Tests Not Generating

**Problem:** TestSprite doesn't generate tests

**Solutions:**
1. Verify file path is correct
2. Check component is valid TypeScript/React
3. Ensure component is exported
4. Try with a simpler component first

### Generated Tests Failing

**Problem:** TestSprite-generated tests fail

**Solutions:**
1. Review test assertions
2. Check mock data is realistic
3. Verify component dependencies are mocked
4. Customize tests for your use case

---

## 📈 Coverage Goals

Use TestSprite to achieve:

| Phase | Target | Timeline |
|-------|--------|----------|
| Phase 1 | 50% | Week 1 |
| Phase 2 | 60% | Week 2 |
| Phase 3 | 70% | Week 3 |
| Phase 4 | 80% | Week 4 |

---

## 🎓 Learning Resources

- [TestSprite Documentation](https://testsprite.com/docs)
- [Vitest Best Practices](https://vitest.dev/guide/best-practices)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## ✅ Quick Checklist

- [x] Node.js installed (already have npm)
- [x] Configure TestSprite MCP
- [x] Add API key
- [ ] Reconnect MCP server
- [ ] Generate first test
- [ ] Run tests
- [ ] Check coverage
- [ ] Iterate and improve

---

**Status:** ✅ CONFIGURED & READY (No additional installation needed!)
**Next Step:** Reconnect MCP server dan mulai generate tests!
