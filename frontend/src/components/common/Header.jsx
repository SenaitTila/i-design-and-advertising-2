// src/components/common/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../../store/authSlice";
import logo from "../../assets/logo.png";
import { 
  Home, 
  BookOpen, 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  LogOut,
  LayoutDashboard,
  Globe,
  User,
  SlidersHorizontal
} from "lucide-react";
import API from "../../api/authApi"; 

const Header = ({ onToggleMobileSidebar, isMobileSidebarOpen, setIsMobileSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false); // Main Navigation Menu state
  const [currentLang, setCurrentLang] = useState('en');
  const location = useLocation();
  const navigate = useNavigate();
  
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const cookies = document.cookie;
    if (cookies.includes('/en/am')) {
      setCurrentLang('am');
    } else {
      setCurrentLang('en');
    }
  }, []);

  // Handle mutual exclusion to ensure both menus are never open together
  const handleToggleMainMenu = () => {
    if (!isOpen && typeof setIsMobileSidebarOpen === 'function') {
      setIsMobileSidebarOpen(false); // Close the student sidebar if opening the main menu
    }
    setIsOpen(!isOpen);
  };

  const handleToggleWorkspaceMenu = () => {
    if (isOpen) {
      setIsOpen(false); // Close the main menu if opening the student sidebar
    }
    if (typeof onToggleMobileSidebar === 'function') {
      onToggleMobileSidebar();
    }
  };

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/en/${langCode}; path=/;`; 

    const googleSelect = document.querySelector('.goog-te-combo');
    if (googleSelect) {
      googleSelect.value = langCode;
      let event;
      if (document.createEvent) {
        event = document.createEvent('HTMLEvents');
        event.initEvent('change', true, true);
        googleSelect.dispatchEvent(event);
      } else {
        event = document.createEventObject();
        event.eventType = 'change';
        googleSelect.fireEvent('onchange', event);
      }
    } else {
      window.location.reload();
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout', {});
    } catch (err) {
      console.error("Session clean request failed on server:", err);
    } finally {
      dispatch(clearUser());
      setIsOpen(false);
      navigate("/login");
    }
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
  ];

  if (user) {
    navLinks.push({ name: "My Courses", path: "/student/my-courses", icon: BookOpen });
    if (user.role === 'admin') {
      navLinks.push({ name: "Admin Panel", path: "/admin/courses", icon: LayoutDashboard });
    }
  } else {
    navLinks.push({ name: "Sign In", path: "/login", icon: LogIn });
  }

  return (
   <header className="w-full bg-[#06162E] border-b border-blue-900 sticky top-0 z-50 shadow-md transition-all duration-300 h-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full w-full">

          {/* Left Side Section: Mobile Student Sidebar Burger + Brand Logo */}
          <div className="flex items-center gap-2">
            {/* 🍔 LEFT-SIDE STUDENT WORKSPACE MENU BUTTON (Visible only on Mobile) */}
            {onToggleMobileSidebar && (
              <button
                onClick={handleToggleWorkspaceMenu}
                className="md:hidden p-2 rounded-lg text-indigo-600 bg-indigo-50 border border-indigo-100 focus:outline-none transition-colors mr-1 cursor-pointer"
                title="Toggle Student Workspace"
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link
              to="/"
             className="flex items-center gap-2 font-extrabold text-xl text-white tracking-tight whitespace-nowrap group"
            >
              {/* Replaced GraduationCap with logo.png */}
              <img 
                src={logo} 
                alt="Logo" 
                className="w-8 h-8 object-contain transition-transform group-hover:scale-110" 
              />
              <span>i Design & Advertising</span>
            </Link>
          </div>

          {/* Desktop Navigation Row (PC / TABS Viewport Content) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
 ? "text-white bg-blue-600"
 : "text-blue-100 hover:text-white hover:bg-blue-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Desktop Language Selector Tool */}
            <div className="flex items-center ml-2 mr-1 bg-blue-900 p-1 rounded-lg border border-blue-700 space-x-1">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                 currentLang === 'en' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('am')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  currentLang === 'am' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                አማ
              </button>
            </div>

            {!user ? (
              <Link
                className="ml-2 flex items-center gap-1.5blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm hover:shadow active:scale-95 transition-all duration-150"
                to="/register"
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </Link>
            ) : (
              <div className="flex items-center gap-3 ml-2 pl-2 border-l border-gray-200">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-50/50 rounded-lg border border-indigo-100/40">
                  <div className="p-1 bg-indigo-600 rounded-md text-white">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 tracking-tight max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </nav>

          {/* 📱 RIGHT SIDE: Mobile Dropdown Trigger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={handleToggleMainMenu}
              aria-label="Toggle Menu"
              className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <SlidersHorizontal className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div id="google_translate_element" className="hidden"></div>

      {/* Mobile Drawer Dropdown Application Routing Lists Panel */}
      {isOpen && (
        <div className="md:hidden w-full border-t border-gray-100 px-4 pb-4 pt-2 space-y-2 bg-white shadow-inner animate-fade-in">
          {user && (
            <div className="mx-1 my-2 flex items-center gap-3 p-3 bg-indigo-50/60 border border-indigo-100/50 rounded-xl">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-gray-900 truncate">{user.name}</span>
                <span className="text-xs text-gray-400 capitalize font-medium">{user.role || 'student'} account</span>
              </div>
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                onClick={() => setIsOpen(false)}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive(link.path) ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-gray-400" /> Language
            </span>
            <div className="flex bg-gray-200/60 p-0.5 rounded-lg border space-x-1">
              <button
                type="button"
                onClick={() => { changeLanguage('en'); setIsOpen(false); }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${currentLang === 'en' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => { changeLanguage('am'); setIsOpen(false); }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${currentLang === 'am' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500'}`}
              >
                አማርኛ
              </button>
            </div>
          </div>

          {!user ? (
            <Link
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-xl text-base font-medium hover:bg-indigo-700 shadow-sm transition-colors"
              to="/register"
            >
              <UserPlus className="w-5 h-5" />
              <span>Sign Up</span>
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full bg-red-600 text-white py-3 rounded-xl text-base font-medium hover:bg-red-700 shadow-sm transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;