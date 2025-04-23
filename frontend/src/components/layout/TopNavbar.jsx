import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import BellIcon from '../../icons/bell.png';
import MessengerIcon from '../../icons/messenger.png';
import CogIcon from '../../icons/cog.png';
import '../../dash.css';

// ----------------- ToggleNavbar -----------------
export function ToggleNavbar({ children }) {
    const [showNavItems, setShowNavItems] = useState(false);
    const containerRef = useRef(null);

    const navigate = useNavigate();

    const isActiveRoute = (path) => {
        return window.location.pathname === path;
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="toggle-navbar" ref={containerRef}>
            <button
                className="main-toggle-button"
                onClick={() => setShowNavItems(!showNavItems)}
            >
                More
            </button>
            {showNavItems && (
                <div className="navbar-items-exept">
                    {children}
                </div>
            )}
        </div>
    );
}

// ----------------- NavItem -----------------
export function NavItem({ icon, children }) {
    const [open, setOpen] = useState(false);

    const hasDropdown = React.Children.toArray(children).some(
        child => React.isValidElement(child) && child.type === DropdownMenu
    );

    const labelText = React.Children.toArray(children).filter(
        child => typeof child === 'string' || typeof child === 'number'
    );

    return (
        <li className="nav-item">
            <button className="icon-button" onClick={() => setOpen(!open)}>
                <div className="nav-icon-text">
                    {icon}
                    <span className="nav-text">{labelText}</span>
                </div>
            </button>
            {open && hasDropdown && React.Children.map(children, child =>
                React.isValidElement(child) && child.type === DropdownMenu ? child : null
            )}
        </li>
    );
}

// ----------------- DropdownMenu -----------------
export function DropdownMenu({ onLogout }) {
    const [activeMenu, setActiveMenu] = useState('main');
    const [menuHeight, setMenuHeight] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (dropdownRef.current) {
            setMenuHeight(dropdownRef.current.firstChild.offsetHeight);
        }
    }, []);

    function calcHeight(el) {
        const height = el.offsetHeight;
        setMenuHeight(height);
    }

    function DropdownItem({ children, leftIcon, onClick, className = '', style = {} }) {
        return (
            <button
                className={`menu-item ${className}`}
                onClick={onClick}
                style={{ color: 'black', ...style }}
            >
                {leftIcon && <span className="icon-left">{leftIcon}</span>}
                <span className="item-text">{children}</span>
            </button>
        );
    }

    return (
        <div className="dropdown" style={{ height: menuHeight }} ref={dropdownRef}>
            <CSSTransition
                in={activeMenu === 'main'}
                timeout={500}
                classNames="menu-primary"
                unmountOnExit
                onEnter={calcHeight}
            >
                <div className="menu">
                    <DropdownItem
                        leftIcon={<img src={CogIcon} alt="Settings" style={{ width: 20, height: 20 }} />}
                        onClick={() => navigate('/settings')}
                    >
                        Settings
                    </DropdownItem>
                    <DropdownItem
                        leftIcon={<span>🚪</span>}
                        onClick={onLogout}
                    >
                        Logout
                    </DropdownItem>
                </div>
            </CSSTransition>
        </div>
    );
}

// ----------------- TopNavbar Main -----------------
const TopNavbar = ({ toggleSidebar, handleLogout }) => {
    const navigate = useNavigate();

    return (
        <div className="top-navbar">
            <div className="navbar-left">
                <button className="menu-toggle" onClick={toggleSidebar}>
                    <span className="icon-menu">☰</span>
                </button>
                <div className="navbar-logo"><h2>Studio</h2></div>
                <div className="search-bar">
                    <input type="text" placeholder="Search..." />
                </div>
            </div>

            <ToggleNavbar>
                <NavItem icon={<img src={BellIcon} alt="Bell" style={{ width: 20 }} />}>
                    Notifications
                </NavItem>
                <NavItem icon={<img src={MessengerIcon} alt="Messenger" style={{ width: 20 }} />}>
                    Messages
                </NavItem>
                <NavItem icon={<span>⋮</span>}>
                    <DropdownMenu onLogout={handleLogout} />
                    More
                </NavItem>
            </ToggleNavbar>
        </div>
    );
};

export default TopNavbar;
