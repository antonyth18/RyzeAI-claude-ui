import '../design-system/styles.css';
import { Button } from './Button';
import { Card } from './Card';
import { Input, Textarea } from './Input';
import { Table } from './Table';
import { Modal } from './Modal';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem } from './Sidebar';
import { Navbar } from './Navbar';
import { Chart } from './Chart';

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
    Chart
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
};

export const COMPONENT_WHITELIST = Object.keys(COMPONENT_MAP);
