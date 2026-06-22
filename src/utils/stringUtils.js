export function cleanCodeBlock(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```js\s*/i, "")
    .replace(/^```javascript\s*/i, "")
    .replace(/^```ts\s*/i, "")
    .replace(/^```typescript\s*/i, "")
    .replace(/^```python\s*/i, "")
    .replace(/^```java\s*/i, "")
    .replace(/^```csharp\s*/i, "")
    .replace(/^```go\s*/i, "")
    .replace(/^```php\s*/i, "")
    .replace(/^```ruby\s*/i, "")
    .replace(/^```kotlin\s*/i, "")
    .replace(/^```swift\s*/i, "")
    .replace(/^```rust\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

export function stripCommentsAndStrings(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "")
    .replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '""');
}

export function countMatches(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function countLeadingSpaces(line) {
  const match = line.match(/^(\s*)/);

  return match
    ? match[1].replace(/\t/g, "    ").length
    : 0;
}