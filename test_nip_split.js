// Test NIP splitting logic
const testNip = "199512012025212018 / 199608042025211010";

console.log("Original NIP:", testNip);
console.log("Length:", testNip.length);

// Current splitting logic
const nips = testNip.split(/[,;\/\s]+/).map(n => n.trim()).filter(n => n.length > 0);

console.log("\nSplit result:");
console.log("Number of NIPs:", nips.length);
nips.forEach((nip, idx) => {
  console.log(`  [${idx}] "${nip}" (length: ${nip.length})`);
});

// Test with different separators
const testCases = [
  "199512012025212018 / 199608042025211010",
  "199512012025212018/199608042025211010",
  "199512012025212018, 199608042025211010",
  "199512012025212018; 199608042025211010",
  "199512012025212018 199608042025211010",
];

console.log("\n\nTesting different formats:");
testCases.forEach(test => {
  const result = test.split(/[,;\/\s]+/).map(n => n.trim()).filter(n => n.length > 0);
  console.log(`\nInput: "${test}"`);
  console.log(`Result: [${result.join(', ')}]`);
  console.log(`Count: ${result.length}`);
});
