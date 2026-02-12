import './styles.css';
import { Button } from './Button';
import { Card } from './Card';
import { Input, Textarea } from './Input';
import { Table } from './Table';
import { Modal } from './Modal';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem } from './Sidebar';
import { Navbar } from './Navbar';
import { Chart } from './Chart';
import { ChatPanel } from './ChatPanel';
import { CodePanel } from './CodePanel';
import { PreviewPanel } from './PreviewPanel';

export {
    Button,
    Card,
    Input,
    Textarea,
    Table,
    Modal,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarItem,
    Navbar,
    Chart,
    ChatPanel,
    CodePanel,
    PreviewPanel
};

export const COMPONENT_MAP: Record<string, React.FC<any>> = {
    Button,
    Card,
    Input,
    Textarea,
    Table,
    Modal,
    Sidebar,
    Navbar,
    Chart,
    ChatPanel,
    CodePanel,
    PreviewPanel,
};

export const COMPONENT_WHITELIST = Object.keys(COMPONENT_MAP);
