export function getIframeHTML(code: string): string {
    // Extract component names from imports to create mocks for missing ones
    const importedComponents = new Set<string>();
    const importRegex = /import\s+([\s\S]*?)\s+from\s+['"].*?['"]/g;
    let match;
    const hooks = new Set(['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect']);

    while ((match = importRegex.exec(code)) !== null) {
        const importStr = match[1].trim();
        if (importStr.includes('{')) {
            const named = importStr.match(/\{([\s\S]*?)\}/);
            if (named) {
                named[1].split(',').forEach(i => {
                    const name = i.trim().split(/\s+as\s+/)[0].trim();
                    if (name && !hooks.has(name)) importedComponents.add(name);
                });
            }
        } else {
            const name = importStr.split(/\s+as\s+/)[0].trim();
            if (name && name !== 'React') importedComponents.add(name);
        }
    }

    // NEW: Greedy detection for anything that looks like a component (PascalCase)
    // This catches components in JSX, passed as props, or in arrays.
    const componentCandidateRegex = /\b[A-Z][a-zA-Z0-9]+\b/g;
    const commonGlobals = new Set(['React', 'ReactDOM', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Promise', 'Error']);

    while ((match = componentCandidateRegex.exec(code)) !== null) {
        const name = match[0];
        if (name && !hooks.has(name) && !commonGlobals.has(name)) {
            importedComponents.add(name);
        }
    }

    // Strip imports and handle exports for browser-side Babel standalone
    const strippedCode = code
        .replace(/^\s*[+-]?\s*import\s+[\s\S]*?from\s+['"].*?['"];?$/gm, '') // Remove imports (even with + or - prefixes)
        .replace(/export\s+default\s+/g, 'window.App = ') // Safely handle all export default styles
        .replace(/export\s+/g, '') // Remove other exports
        .replace(/module\.exports\s*=\s*/g, 'window.App = ') // Handle accidental CJS exports
        .replace(/require\(['"].*?['"]\)/g, 'undefined'); // Strip accidental requires

    // Generate local shimming declarations to shadow globals (e.g. var Text = ...)
    const shimmingScript = Array.from(importedComponents).map(name => {
        return `var ${name} = window['${name}'] || window.__SHIMS?.['${name}'];`;
    }).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        #root { min-height: 100vh; display: flex; flex-direction: column; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        // Expose React hooks to the global scope
        const { useState, useEffect, useMemo, useCallback, useRef, useContext, useReducer, useLayoutEffect } = React;

        // Minimal shim for whitelisted components - STRICT DETERMINISTIC STYLING
        const Container = ({ children, className = "" }) => <div className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 " + className}>{children}</div>;
        const Grid = ({ cols = 1, gap = 4, children, className = "" }) => (
            <div className={"grid grid-cols-1 md:grid-cols-" + cols + " gap-" + gap + " " + className}>
                {children}
            </div>
        );
        const Stack = ({ gap = 4, children, className = "" }) => <div className={"flex flex-col gap-" + gap + " " + className}>{children}</div>;
        const Inline = ({ gap = 4, children, className = "" }) => <div className={"flex flex-row flex-wrap gap-" + gap + " " + className}>{children}</div>;
        const Section = ({ children, className = "" }) => <section className={"py-12 " + className}>{children}</section>;

        const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
            const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95";
            const variants = {
                primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20",
                secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
                outline: "border border-neutral-200 text-neutral-700 hover:bg-neutral-50",
                ghost: "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20"
            };
            const sizes = {
                sm: "px-3 py-1.5 text-xs",
                md: "px-4 py-2 text-sm",
                lg: "px-6 py-3 text-base",
                icon: "p-2 aspect-square"
            };
            return <button className={baseStyles + " " + (variants[variant] || variants.primary) + " " + (sizes[size] || sizes.md) + (props.className ? " " + props.className : "")} {...props}>{children}</button>;
        };

        const Card = ({ variant = 'default', padding = 'md', children, className = "" }) => {
             const baseStyles = "rounded-xl overflow-hidden transition-all duration-300";
             const variants = {
                default: "bg-white border border-neutral-200 shadow-sm",
                bordered: "border border-neutral-200 bg-transparent",
                flat: "bg-neutral-50",
                glass: "backdrop-blur-md bg-white/10 border border-white/20 shadow-xl",
                neon: "bg-black/40 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-xl"
             };
             const paddings = { none: "", sm: "p-3", md: "p-5", lg: "p-8" };
             return <div className={baseStyles + " " + (variants[variant] || variants.default) + " " + (paddings[padding] || paddings.md) + " " + className}>{children}</div>;
        };

        const Input = ({ variant = 'default', error = false, ...props }) => {
            const baseStyles = "w-full px-3 py-2 rounded-lg outline-none transition-all text-sm";
            const variants = {
                default: "border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                filled: "bg-neutral-100 border-transparent focus:bg-white focus:ring-2 focus:ring-neutral-200"
            };
            const errorStyles = error ? "border-red-500 focus:ring-red-500" : "";
            return <input className={baseStyles + " " + (variants[variant] || variants.default) + " " + errorStyles + (props.className ? " " + props.className : "")} {...props} />;
        };

        const Textarea = ({ variant = 'default', resize = true, ...props }) => {
            const baseStyles = "w-full px-3 py-2 rounded-lg outline-none transition-all text-sm min-h-[80px]";
             const variants = {
                default: "border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                filled: "bg-neutral-100 border-transparent focus:bg-white focus:ring-2 focus:ring-neutral-200"
            };
            const resizeStyle = resize ? "" : "resize-none";
            return <textarea className={baseStyles + " " + (variants[variant] || variants.default) + " " + resizeStyle + (props.className ? " " + props.className : "")} {...props} />;
        };

        const Sidebar = ({ children, className = "" }) => (
            <aside className={"w-64 h-full border-r border-neutral-200 bg-neutral-50/50 flex flex-col " + className}>
                {children}
            </aside>
        );

        const Navbar = ({ variant = 'default', children, className = "" }) => {
            const baseStyles = "h-16 flex items-center px-6";
            const variants = { default: "border-b border-neutral-200 bg-white", transparent: "bg-transparent" };
            return <nav className={baseStyles + " " + (variants[variant] || variants.default) + " " + className}>{children}</nav>;
        };

        const Table = ({ variant = 'default', headers, data, children, className = "" }) => {
            const baseStyles = "w-full text-left border-collapse text-sm";
            const variants = { default: "", striped: "[&_tbody_tr:nth-child(even)]:bg-neutral-50/50", glass: "text-white [&_tbody_tr:hover]:bg-white/5" };
            const renderStatus = (val) => {
                if (typeof val !== 'string') return val;
                const lower = val.toLowerCase();
                if (['active', 'success', 'completed', 'paid'].includes(lower)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 capitalize">{val}</span>;
                if (['pending', 'processing', 'warning'].includes(lower)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 capitalize">{val}</span>;
                if (['failed', 'cancelled', 'error', 'overdue'].includes(lower)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 capitalize">{val}</span>;
                return val;
            };
            const normalizeRow = (row) => {
                if (Array.isArray(row)) return row;
                if (typeof row === 'object' && row !== null) return Object.values(row);
                return [row];
            };
            return (
                <div className={"overflow-hidden rounded-xl border border-neutral-200/60 dark:border-neutral-800 " + className}>
                    <table className={baseStyles + " " + (variants[variant] || variants.default)}>
                        {headers && (
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200/60 dark:border-neutral-800">
                                <tr>
                                    {headers.map((h, i) => <th key={i} className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-[10px]">{h}</th>)}
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {data ? data.map((row, i) => {
                                const cells = normalizeRow(row);
                                return (
                                    <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 transition-colors">
                                        {cells.map((cell, j) => <td key={j} className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{renderStatus(cell)}</td>)}
                                    </tr>
                                );
                            }) : children}
                        </tbody>
                    </table>
                </div>
            );
        };

        const Modal = ({ isOpen, onClose, size = 'md', children }) => {
            if (!isOpen) return null;
            const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", full: "max-w-4xl" };
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={"bg-white rounded-2xl shadow-2xl p-6 w-full animate-in zoom-in-95 ease-out duration-200 " + (sizes[size] || sizes.md) + " relative"}>
                        {children}
                        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            );
        };

        const Chart = ({ type = 'bar', data, title, height = 'md', className = "" }) => {
            const heights = { sm: "h-48", md: "h-64", lg: "h-96" };
            const chartData = (data || [
                { label: 'Jan', value: 45 }, { label: 'Feb', value: 52 },
                { label: 'Mar', value: 38 }, { label: 'Apr', value: 65 },
                { label: 'May', value: 48 }, { label: 'Jun', value: 59 }
            ]).map(d => {
                if (typeof d === 'object' && d !== null) return { label: d.label || d.date || d.name || '', value: Number(d.value || d.spend || d.clicks || d.conversions || d.y || 0) };
                return { label: '', value: Number(d) || 0 };
            });
            const max = Math.max(...chartData.map(d => d.value), 1);
            const len = chartData.length;
            return (
                <div className={"w-full bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-6 flex flex-col transition-all duration-300 hover:shadow-lg " + (heights[height] || heights.md) + " " + className}>
                    {title && <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500 rounded-full" />{title}</h3>}
                    <div className="flex-1 flex items-end gap-3 px-2 pb-6 border-b border-neutral-100 dark:border-neutral-800/50 relative">
                        {type === 'bar' && chartData.map((d, i) => (
                            <div key={i} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                                <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110 cursor-pointer relative" style={{ height: ((d.value/max)*100) + "%" }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{d.value}</div>
                                </div>
                                <span className="absolute -bottom-6 text-[10px] font-medium text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors">{d.label}</span>
                            </div>
                        ))}
                        {(type === 'line' || type === 'area') && (
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d={"M " + chartData.map((d, i) => (len > 1 ? (i / (len - 1)) * 100 : 50) + " " + (100 - (d.value / max) * 100)).join(' L ') + " L 100 100 L 0 100 Z"} fill="url(#lineGrad)" />
                                <path d={"M " + chartData.map((d, i) => (len > 1 ? (i / (len - 1)) * 100 : 50) + " " + (100 - (d.value / max) * 100)).join(' L ')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                </div>
            );
        };

        const IconMock = () => React.createElement('div', { className: "w-4 h-4 bg-neutral-200 rounded-sm flex-shrink-0" });
        const iconList = ['BarChart', 'LineChart', 'PieChart', 'Activity', 'Users', 'Settings', 'Search', 'Bell', 'Menu', 'X', 'Check', 'ChevronRight', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'TrendingUp', 'TrendingDown', 'DollarSign', 'Briefcase', 'Target', 'Home', 'FileText', 'MessageSquare', 'Shield', 'CreditCard', 'Mail', 'Calendar', 'Clock', 'LayoutDashboard', 'Zap', 'Filter', 'Download', 'Share2', 'MoreVertical', 'Plus', 'Trash2', 'Github', 'Twitter', 'Linkedin', 'Instagram', 'Youtube', 'Facebook', 'Globe', 'ExternalLink', 'Behance', 'Dribbble', 'Figma', 'Cpu'];
        iconList.forEach(icon => {
            if (!window[icon]) window[icon] = IconMock;
            if (!window[icon + 'Icon']) window[icon + 'Icon'] = IconMock;
        });

        // Avoid collisions with browser globals (e.g. window.Navigation, window.Image)
        const dangerousGlobals = new Set(['Navigation', 'Image', 'Option', 'Audio', 'Notification', 'History', 'Plugin', 'Selection', 'Range', 'Map', 'Set', 'URL', 'Location', 'Text']);

        window.__SHIMS = {};
        const importedNames = ${JSON.stringify(Array.from(importedComponents))};
        importedNames.forEach(name => {
            // Force shim if it's a dangerous global or if it doesn't exist yet
            if (dangerousGlobals.has(name) || !window[name]) {
                const shim = (props) => React.createElement('div', {
                    key: name,
                    className: "border border-dashed border-neutral-300 p-4 rounded-xl text-neutral-400 text-xs " + (props.className || "")
                }, [
                    React.createElement('div', { key: 'name', className: "font-bold mb-1 opacity-50 uppercase tracking-widest text-[8px]" }, name),
                    props.children
                ]);
                
                window.__SHIMS[name] = shim;
                // Try to set on window if possible (for non-shadowed access)
                try { window[name] = shim; } catch(e) {}
            }
        });

        window.React = React;
        window.ReactDOM = ReactDOM;
        window.useState = useState; window.useEffect = useEffect; window.useMemo = useMemo; window.useCallback = useCallback; window.useRef = useRef;
        window.Button = Button; window.Card = Card; window.Input = Input; window.Textarea = Textarea; window.Sidebar = Sidebar; window.Navbar = Navbar; window.Table = Table; window.DataTable = Table; window.Modal = Modal; window.Chart = Chart; window.LineChart = Chart; window.BarChart = Chart; window.PieChart = Chart; window.Container = Container; window.Grid = Grid; window.Stack = Stack; window.Inline = Inline; window.Section = Section;

        // Global Error Handler
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            console.error("Iframe Runtime Error:", msg, error);
            const container = document.getElementById('root');
            if (container) {
                container.innerHTML = '<div style="padding: 20px; color: #ef4444; background: #fee2e2; border: 1px solid #fecaca; rounded: 8px; font-family: monospace; font-size: 12px;"><strong>Runtime Error:</strong><br/>' + msg + '<br/><br/><small>Line: ' + lineNo + '</small></div>';
            }
            return false;
        };

        // Injected User Code
        try {
            // Shadowing Guard & Virtual Node Scope
            const __runUserCode = () => {
                const module = { exports: {} };
                const exports = module.exports;
                const require = (name) => window[name] || window.__SHIMS?.[name];

                ${shimmingScript}

                ${strippedCode}

                // Support both window.App and module.exports
                const FinalApp = window.App || module.exports.default || (module.exports.name ? module.exports : null) || (typeof App !== 'undefined' ? App : null);
                return FinalApp;
            };

            const AppToRender = __runUserCode();

            // Setup the mount point
            const container = document.getElementById('root');
            if (container) {
                const root = ReactDOM.createRoot(container);
                
                if (!AppToRender) {
                    root.render(React.createElement('div', { className: "p-8 text-red-500 font-bold" }, "Error: 'App' component or export not found."));
                }
                // If AppToRender is a Component (function)
                else if (typeof AppToRender === 'function' || (AppToRender.$$typeof && typeof AppToRender.type === 'function')) {
                    root.render(React.createElement(AppToRender));
                } 
                // If AppToRender is already an Element (object/JSX)
                else if (typeof AppToRender === 'object' && AppToRender.$$typeof) {
                    root.render(AppToRender);
                }
                else {
                    root.render(React.createElement('div', { className: "p-8 text-neutral-500" }, [
                        React.createElement('h2', { className: "text-lg font-bold text-red-500 mb-2" }, "Mount Error"),
                        React.createElement('p', { className: "text-sm" }, "Exported object is not a valid React component or element."),
                        React.createElement('pre', { className: "mt-4 p-4 bg-neutral-100 rounded text-[10px]" }, "Got type: " + typeof AppToRender + "\\n\\n" + JSON.stringify(AppToRender, null, 2))
                    ]));
                }
            }
        } catch (err) {
            console.error("Compilation/Mount Error:", err);
            const container = document.getElementById('root');
            if (container) {
                container.innerHTML = '<div style="padding: 20px; color: #ef4444; background: #fee2e2; border: 1px solid #fecaca; rounded: 8px; font-family: monospace; font-size: 12px;"><strong>Compilation Error:</strong><br/>' + err.message + '</div>';
            }
        }
    </script>
</body>
</html>
    `;
}
