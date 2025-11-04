# Helm Unit Tests

This directory contains unit tests for the learn-node Helm chart using [helm-unittest](https://github.com/helm-unittest/helm-unittest).

## Installation

Install the helm-unittest plugin:

```bash
helm plugin install https://github.com/helm-unittest/helm-unittest.git
```

Or update if already installed:

```bash
helm plugin update unittest
```

## Running Tests

### Run all tests

```bash
# From the chart directory
helm unittest .

# Or from the repository root
helm unittest k8s/learn-node/

# Using make (if added to Makefile)
make helm-test
```

### Run specific test suite

```bash
helm unittest -f 'tests/deployment_test.yaml' .
```

### Run with verbose output

```bash
helm unittest -3 .
```

### Run with colored output

```bash
helm unittest --color .
```

### Run with JUnit output (for CI/CD)

```bash
helm unittest --output-type JUnit --output-file test-results.xml .
```

## Test Structure

Tests are organized by Kubernetes resource type:

- `deployment_test.yaml` - Tests for Deployment template
- `service_test.yaml` - Tests for Service template
- `hpa_test.yaml` - Tests for HorizontalPodAutoscaler template
- `httproute_test.yaml` - Tests for HTTPRoute template (Gateway API)
- `configmap_test.yaml` - Tests for ConfigMap template
- `pvc_test.yaml` - Tests for PersistentVolumeClaim template
- `networkpolicy_test.yaml` - Tests for NetworkPolicy template

## Test Coverage

Each test file includes tests for:

- ✅ Default values rendering correctly
- ✅ Custom values being applied
- ✅ Conditional resources (enabled/disabled)
- ✅ Labels and annotations
- ✅ Resource specifications
- ✅ Metadata and naming

## Writing New Tests

### Basic test structure

```yaml
suite: test <resource-name>
templates:
  - <template-file>.yaml
tests:
  - it: should <test description>
    set:
      key.path: value
    asserts:
      - <assertion-type>:
          <assertion-parameters>
```

### Common assertions

- `isKind`: Check resource kind
- `equal`: Check value equality
- `contains`: Check if array contains item
- `isNull`: Check if value is null
- `isNotNull`: Check if value exists
- `hasDocuments`: Check document count
- `isSubset`: Check if object is subset
- `matchRegex`: Check regex pattern

### Example test

```yaml
- it: should set custom image tag
  set:
    image.tag: "v1.2.3"
  asserts:
    - equal:
        path: spec.template.spec.containers[0].image
        value: dxas90/learn-node:v1.2.3
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Install Helm Unittest
  run: helm plugin install https://github.com/helm-unittest/helm-unittest.git

- name: Run Helm Tests
  run: helm unittest k8s/learn-node/ --color --output-type JUnit --output-file test-results.xml

- name: Publish Test Results
  uses: EnricoMi/publish-unit-test-result-action@v2
  if: always()
  with:
    files: test-results.xml
```

### GitLab CI Example

```yaml
helm-test:
  stage: test
  image: alpine/helm:latest
  before_script:
    - helm plugin install https://github.com/helm-unittest/helm-unittest.git
  script:
    - helm unittest k8s/learn-node/ --output-type JUnit --output-file test-results.xml
  artifacts:
    reports:
      junit: test-results.xml
```

## Best Practices

1. **Test default values** - Ensure chart works with minimal configuration
2. **Test overrides** - Verify custom values are applied correctly
3. **Test conditionals** - Check features can be enabled/disabled
4. **Test edge cases** - Validate boundary conditions
5. **Use descriptive names** - Make test purposes clear
6. **Keep tests focused** - One concept per test
7. **Test integrations** - Verify resources work together

## Troubleshooting

### Plugin not found

```bash
helm plugin list
helm plugin install https://github.com/helm-unittest/helm-unittest.git
```

### Template rendering errors

Run with verbose output to see full error:

```bash
helm unittest -3 .
```

### Assertion failures

Check the actual vs expected output in the test results and verify:
- Template logic
- Values file structure
- Path expressions

## Resources

- [Helm Unittest Documentation](https://github.com/helm-unittest/helm-unittest/blob/main/DOCUMENT.md)
- [Assertion Types](https://github.com/helm-unittest/helm-unittest/blob/main/DOCUMENT.md#assertion-types)
- [Helm Testing Best Practices](https://helm.sh/docs/topics/chart_tests/)
