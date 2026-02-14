
import { parseJsxToTree, reconstructFullCode } from './src/agent/uiTree';

const sampleCode = `import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function App() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Test App</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="bordered" padding="lg">
          <h2 className="text-xl font-semibold mb-2">Card Title</h2>
          <p className="text-gray-600 mb-4">This is a test card with nested elements.</p>
          <Button variant="primary" size="md">Click Me</Button>
        </Card>
        <Card variant="flat">
          <p>Simple Flat Card</p>
        </Card>
      </div>
    </div>
  );
}`;

console.log("--- ORIGINAL CODE ---");
console.log(sampleCode);

try {
    const tree = parseJsxToTree(sampleCode);
    console.log("\n--- PARSED TREE ---");
    console.log(JSON.stringify(tree, null, 2));

    const reconstructed = reconstructFullCode(tree);
    console.log("\n--- RECONSTRUCTED CODE ---");
    console.log(reconstructed);

    // Naive normalization for comparison (ignoring whitespace differences outside strings)
    const normOriginal = sampleCode.replace(/\s+/g, ' ');
    const normReconstructed = reconstructed.replace(/\s+/g, ' ');

    // Note: reconstructFullCode adds all imports back, so valid comparison needs to account for that
    // The sampleCode above has minimal imports. The reconstructor adds ALL whitelist imports.
    // So we should compare the BODY of the components.

    console.log("\n--- VERIFICATION ---");
    if (reconstructed.includes('<div className="p-8 bg-gray-50 min-h-screen">')) {
        console.log("✅ Root element preserved");
    } else {
        console.error("❌ Root element mismatch");
    }

    if (reconstructed.includes('<Button variant="primary" size="md">Click Me</Button>')) {
        console.log("✅ Button props preserved");
    } else {
        console.error("❌ Button props mismatch");
    }

    if (reconstructed.includes('This is a test card with nested elements.')) {
        console.log("✅ Text content preserved");
    } else {
        console.error("❌ Text content mismatch");
    }

} catch (error: any) {
    console.error("CRITICAL ERROR:", error.message);
}
