import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { CSSTransition } from 'react-transition-group';
import PersonIcon from '@mui/icons-material/Person';
import Sidebar from './Sidebar';
import '../dash.css';

// Import icons
import BellIcon from '../icons/bell.png';
import MessengerIcon from '../icons/messenger.png';
import CaretIcon from '../icons/caret.png';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('User');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.name || decoded.sub);
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, []);

  const navigateToNotifications = () => {
    navigate('/notifications');
  };

  const navigateToMessages = () => {
    navigate('/messages');
  };

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} />

      <div className="main-content">
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
            <NavItem icon={<img src={BellIcon} alt="Bell" style={{ width: 20, height: 20 }} onClick={navigateToNotifications} />}>
              Notification
            </NavItem>

            <NavItem icon={<img src={MessengerIcon} alt="Messenger" style={{ width: 20, height: 20 }} onClick={navigateToMessages} />}>
              Messages
            </NavItem>

            <NavItem icon={<img src={CaretIcon} alt="Caret" style={{ width: 20, height: 20 }} />}>
              <DropdownMenu onLogout={handleLogout} />
              More
            </NavItem>
          </ToggleNavbar>
        </div>

        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Components
function ToggleNavbar({ children }) {
  const [showNavItems, setShowNavItems] = useState(false);
  const containerRef = useRef(null);

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

function NavItem({ icon, children }) {
  const [open, setOpen] = useState(false);

  // Check if there's a DropdownMenu as a child
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

function DropdownMenu({ onLogout }) {
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
        {children}
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
            leftIcon={<PersonIcon />}
            onClick={() => navigate('/profile')}
          >
            My Profile
          </DropdownItem>
          <DropdownItem
            onClick={() => navigate('/feedback')}
          >
            Feedback
          </DropdownItem>
          <DropdownItem
            onClick={onLogout}
            className="logout-button"
            style={{ color: '#dc3545' }}
          >
            Log out
          </DropdownItem>
        </div>
      </CSSTransition>
    </div>
  );
}

export default Layout; 