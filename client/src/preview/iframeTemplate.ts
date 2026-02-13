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
        // Minimal shim for whitelisted components
        const Button = ({ variant = 'primary', children, className = '', ...props }) => (
          <button className={\`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 \${
            variant === 'primary' 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20' 
              : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          } \${className}\`} {...props}>
            {children}
          </button>
        );

        const Card = ({ children, className = '' }) => (
          <div className={\`bg-white rounded-xl border border-neutral-200 shadow-sm p-4 \${className}\`}>
            {children}
          </div>
        );

        const Input = (props) => (
          <input className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" {...props} />
        );

        const Textarea = (props) => (
          <textarea className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" {...props} />
        );

        const Sidebar = ({ children, className = '' }) => (
          <aside className={\`w-64 border-r border-neutral-200 h-full bg-neutral-50/50 \${className}\`}>
            {children}
          </aside>
        );

        const Navbar = ({ children, className = '' }) => (
          <nav className={\`h-16 border-b border-neutral-200 flex items-center px-6 bg-white \${className}\`}>
            {children}
          </nav>
        );

        const Table = ({ children, className = '' }) => (
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <table className={\`w-full text-left border-collapse \${className}\`}>
              {children}
            </table>
          </div>
        );

        const Modal = ({ isOpen, onClose, children }) => {
          if (!isOpen) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full animate-in zoom-in-95 ease-out duration-200">
                {children}
                <button onClick={onClose} className="mt-4 text-sm text-neutral-500 hover:text-neutral-700">Close</button>
              </div>
            </div>
          );
        };

        const Chart = ({ className = '' }) => (
          <div className={\`w-full aspect-video bg-neutral-50 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 text-sm \${className}\`}>
            Chart Placeholder
          </div>
        );

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
