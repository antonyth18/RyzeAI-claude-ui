export function getIframeHTML(code: string): string {
  // Strip imports from the code as they won't resolve in the browser-side Babel standalone
  // without a complex setup. We assume React and whitelisted components are available globally.
  const strippedCode = code
    .replace(/import\s+.*?\s+from\s+['"].*?['"];?/g, '') // Remove imports
    .replace(/export\s+default\s+/g, '') // Remove export default
    .replace(/export\s+/g, ''); // Remove other exports

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
        .btn-primary { @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm; }
        .btn-outline { @apply border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg hover:bg-neutral-50 transition-colors; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        // Minimal shim for whitelisted components - STRICT DETERMINISTIC STYLING

        // Button Component
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

            return (
                <button className={\`\${baseStyles} \${variants[variant] || variants.primary} \${sizes[size] || sizes.md}\`} {...props}>
                    {children}
                </button>
            );
        };

        // Card Component
        const Card = ({ variant = 'default', padding = 'md', children }) => {
             const baseStyles = "bg-white rounded-xl overflow-hidden";
             
             const variants = {
                default: "border border-neutral-200 shadow-sm",
                bordered: "border border-neutral-200",
                flat: "bg-neutral-50"
             };

             const paddings = {
                none: "",
                sm: "p-3",
                md: "p-5",
                lg: "p-8"
             };

             return (
                <div className={\`\${baseStyles} \${variants[variant] || variants.default} \${paddings[padding] || paddings.md}\`}>
                    {children}
                </div>
             );
        };

        // Input Component
        const Input = ({ variant = 'default', error = false, ...props }) => {
            const baseStyles = "w-full px-3 py-2 rounded-lg outline-none transition-all text-sm";
            
            const variants = {
                default: "border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                filled: "bg-neutral-100 border-transparent focus:bg-white focus:ring-2 focus:ring-neutral-200"
            };

            const errorStyles = error ? "border-red-500 focus:ring-red-500" : "";

            return (
                <input className={\`\${baseStyles} \${variants[variant] || variants.default} \${errorStyles}\`} {...props} />
            );
        };

        // Textarea Component
        const Textarea = ({ variant = 'default', resize = true, ...props }) => {
            const baseStyles = "w-full px-3 py-2 rounded-lg outline-none transition-all text-sm min-h-[80px]";
            
             const variants = {
                default: "border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                filled: "bg-neutral-100 border-transparent focus:bg-white focus:ring-2 focus:ring-neutral-200"
            };

            const resizeStyle = resize ? "" : "resize-none";

            return (
                <textarea className={\`\${baseStyles} \${variants[variant] || variants.default} \${resizeStyle}\`} {...props} />
            );
        };

        // Sidebar Component (Strict Fixed Layout)
        const Sidebar = ({ children }) => (
            <aside className="w-64 h-full border-r border-neutral-200 bg-neutral-50/50 flex flex-col">
                {children}
            </aside>
        );

        // Navbar Component
        const Navbar = ({ variant = 'default', children }) => {
            const baseStyles = "h-16 flex items-center px-6";
            
            const variants = {
                default: "border-b border-neutral-200 bg-white",
                transparent: "bg-transparent"
            };

            return (
                <nav className={\`\${baseStyles} \${variants[variant] || variants.default}\`}>
                    {children}
                </nav>
            );
        };

        // Table Component
        const Table = ({ variant = 'default', children }) => {
            const baseStyles = "w-full text-left border-collapse text-sm";
            
             const variants = {
                default: "",
                striped: "[&_tbody_tr:nth-child(even)]:bg-neutral-50"
             };

             return (
                <div className="overflow-hidden rounded-lg border border-neutral-200">
                    <table className={\`\${baseStyles} \${variants[variant] || variants.default}\`}>
                        {children}
                    </table>
                </div>
            );
        };

        // Modal Component
        const Modal = ({ isOpen, onClose, size = 'md', children }) => {
            if (!isOpen) return null;
            
            const sizes = {
                sm: "max-w-sm",
                md: "max-w-md",
                lg: "max-w-lg",
                xl: "max-w-xl",
                full: "max-w-4xl"
            };

            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={\`bg-white rounded-2xl shadow-2xl p-6 w-full animate-in zoom-in-95 ease-out duration-200 \${sizes[size] || sizes.md} relative\`}>
                        {children}
                        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            );
        };

        // Chart Component
        const Chart = ({ type = 'bar', height = 'md' }) => {
            const heights = {
                sm: "h-48",
                md: "h-64",
                lg: "h-96"
            };

            return (
                <div className={\`w-full bg-neutral-50 rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 text-sm \${heights[height] || heights.md}\`}>
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                        {type === 'bar' && <path d="M12 20V10M18 20V4M6 20v-4" />}
                        {type === 'line' && <path d="M3 3v18h18M4 14l5-5 5 5 5-5" />}
                        {type === 'pie' && <circle cx="12" cy="12" r="10" />}
                     </svg>
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)} Chart Placeholder</span>
                </div>
            );
        };

        // Map components to global scope for the generated code
        window.React = React;
        window.Button = Button;
        window.Card = Card;
        window.Input = Input;
        window.Textarea = Textarea;
        window.Sidebar = Sidebar;
        window.Navbar = Navbar;
        window.Table = Table;
        window.Modal = Modal;
        window.Chart = Chart;

        // Injected User Code
        ${strippedCode}

        // Mount logic
        try {
          const container = document.getElementById('root');
          const root = ReactDOM.createRoot(container);
          
          // Check for App or GeneratedApp in local scope or window
          const AppToRender = 
            (typeof App !== 'undefined' ? App : window.App) || 
            (typeof GeneratedApp !== 'undefined' ? GeneratedApp : window.GeneratedApp);
          
          if (AppToRender) {
            root.render(<AppToRender />);
          } else {
            root.render(
              <div className="p-8 text-neutral-500 text-center">
                <p className="font-bold text-red-500">Render Error</p>
                <p className="text-sm">Component 'App' not found in the generated code.</p>
              </div>
            );
          }
        } catch (err) {
          console.error('Mounting error:', err);
          document.body.innerHTML = \`<div style="padding: 20px; color: red;">\${err.message}</div>\`;
        }
    </script>
</body>
</html>
  `;
}
