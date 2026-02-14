
import { v4 as uuidv4 } from 'uuid';

export type UITreeNode = {
    id: string;
    type: string;
    props: Record<string, any>;
    children: Array<UITreeNode | string>;
};

export type UITree = {
    root: UITreeNode;
};

// --- Parser ---

export function parseJsxToTree(code: string): UITree {
    // 1. naive strip of imports/exports to get the root element
    // This assumes the code follows the standard format:
    // ... imports ...
    // export default function App() {
    //   return (
    //     <MATCH_THIS_ROOT> ... </MATCH_THIS_ROOT>
    //   );
    // }

    // We strictly look for the return statement of the default export
    const returnMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
    if (!returnMatch) {
        throw new Error("Could not find React return statement in generated code.");
    }
    const jsxContent = returnMatch[1];

    const root = parseJsxStructure(jsxContent);
    return { root };
}

function parseJsxStructure(jsx: string): UITreeNode {
    let cursor = 0;
    const stack: UITreeNode[] = [];
    let currentText = "";
    // Temporary root holder
    const rootHolder: UITreeNode = { id: 'root-holder', type: 'ROOT', props: {}, children: [] };
    stack.push(rootHolder);

    // Regex concepts (not used directly for full parse, but for tokenizing)
    // We'll walk character by character for robustness with nested structures

    while (cursor < jsx.length) {
        const char = jsx[cursor];

        // Check for tag start
        if (char === '<') {
            // Flush any accumulated text
            if (currentText.trim()) {
                if (stack.length > 0) {
                    stack[stack.length - 1].children.push(currentText); // Trim? Or keep whitespace? Request says "Do not remove whitespace unnecessarily".
                }
            }
            currentText = "";

            // Is it a closing tag? </...>
            if (jsx[cursor + 1] === '/') {
                const closeTagEnd = jsx.indexOf('>', cursor);
                if (closeTagEnd === -1) throw new Error("Unclosed tag found");

                // const tagName = jsx.slice(cursor + 2, closeTagEnd).trim();
                // Pop strict check could correspond here, but for now we trust structure is valid generic JSX
                const closedNode = stack.pop();
                // Check if closing matches? 

                cursor = closeTagEnd + 1;
                continue;
            }

            // It is an opening tag <Tag ...> or <Tag ... />
            const tagEnd = findTagEnd(jsx, cursor + 1); // Finds '>' but ignores inside strings/braces
            const tagContent = jsx.slice(cursor + 1, tagEnd);

            // Check self-closing
            const isSelfClosing = tagContent.trim().endsWith('/');

            // Parse tag name and props
            const cleanContent = isSelfClosing ? tagContent.slice(0, -1) : tagContent;
            const parts = cleanContent.trim().split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/); // Split by space avoiding quotes
            const type = parts[0];
            const propsString = cleanContent.substring(type.length).trim();
            const props = parseProps(propsString);

            const newNode: UITreeNode = {
                id: uuidv4(),
                type,
                props,
                children: []
            };

            if (stack.length > 0) {
                stack[stack.length - 1].children.push(newNode);
            }

            if (!isSelfClosing) {
                stack.push(newNode);
            }

            cursor = tagEnd + 1;
        } else {
            currentText += char;
            cursor++;
        }
    }

    // Return the actual root (child of placeholder)
    if (rootHolder.children.length !== 1) {
        // It might be text or multiple roots (which isn't valid React return usually but possible in Fragments)
        // For this project strictness, we assume one root
        // If mostly text/whitespace, find the node
        const nodeChild = rootHolder.children.find(c => typeof c !== 'string');
        if (!nodeChild) throw new Error("Failed to parse JSX structure: No root element found");
        return nodeChild as UITreeNode;
    }

    return rootHolder.children[0] as UITreeNode;
}


function findTagEnd(str: string, start: number): number {
    let inQuote = false;
    let quoteChar = '';
    let braceCount = 0;

    for (let i = start; i < str.length; i++) {
        const char = str[i];

        if (inQuote) {
            if (char === quoteChar) {
                inQuote = false;
            }
        } else {
            if (char === '"' || char === "'") {
                inQuote = true;
                quoteChar = char;
            } else if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
            } else if (char === '>' && braceCount === 0) {
                return i;
            }
        }
    }
    throw new Error("Malformed JSX: Tag not closed");
}

function parseProps(str: string): Record<string, any> {
    const props: Record<string, any> = {};
    if (!str) return props;

    let cursor = 0;
    while (cursor < str.length) {
        // Find prop name
        const match = str.slice(cursor).match(/([a-zA-Z0-9-:]+)=/);
        if (!match) {
            // Boolean prop?
            const nextSpace = str.indexOf(' ', cursor);
            const boolProp = nextSpace === -1 ? str.slice(cursor) : str.slice(cursor, nextSpace);
            if (boolProp.trim()) {
                props[boolProp.trim()] = true;
                cursor += boolProp.length;
            } else {
                cursor++;
            }
            continue;
        }

        const name = match[1];
        const valStart = cursor + match.index! + match[0].length;

        // Check value type
        if (str[valStart] === '"' || str[valStart] === "'") {
            const quote = str[valStart];
            const valEnd = str.indexOf(quote, valStart + 1);
            props[name] = str.slice(valStart + 1, valEnd);
            cursor = valEnd + 1;
        } else if (str[valStart] === '{') {
            // Bracketed value
            let braceCount = 1;
            let i = valStart + 1;
            while (i < str.length && braceCount > 0) {
                if (str[i] === '{') braceCount++;
                if (str[i] === '}') braceCount--;
                i++;
            }
            props[name] = str.slice(valStart, i); // Keep braces for exact reproduction
            cursor = i;
        }

        while (str[cursor] === ' ') cursor++;
    }
    return props;
}


// --- Serializer ---

export function serializeTree(node: UITreeNode): string {
    let out = `<${node.type}`;

    // Props
    const keys = Object.keys(node.props);
    if (keys.length > 0) {
        keys.forEach(key => {
            const val = node.props[key];
            if (val === true) {
                out += ` ${key}`;
            } else if (typeof val === 'string' && val.startsWith('{')) {
                out += ` ${key}=${val}`;
            } else {
                out += ` ${key}="${val}"`;
            }
        });
    }

    if (node.children.length === 0) {
        out += " />";
        return out;
    }

    out += ">";

    node.children.forEach(child => {
        if (typeof child === 'string') {
            out += child;
        } else {
            out += serializeTree(child);
        }
    });

    out += `</${node.type}>`;
    return out;
}

// Wrapper to attach imports/exports back
export function reconstructFullCode(tree: UITree): string {
    const serializedRoot = serializeTree(tree.root);
    return `import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { Chart } from '../components/Chart';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Activity, 
  Users, 
  Settings, 
  Search, 
  Bell, 
  Menu, 
  X, 
  Check, 
  ChevronRight, 
  ArrowRight,
  Home,
  FileText,
  MessageSquare,
  Shield,
  CreditCard,
  Mail,
  Calendar,
  Clock,
  LayoutDashboard
} from 'lucide-react';

export default function App() {
  return (
    ${serializedRoot}
  );
}`;
}
