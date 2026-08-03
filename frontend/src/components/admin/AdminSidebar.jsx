// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const AdminSidebar = ({ sections = [], isOpen, setIsOpen }) => {
  const location = useLocation();

  // Handle section layout transitions cleanly across different form factors
  const handleLinkClick = () => {
    // Only auto-collapse the menu if the user is browsing on a mobile screen width
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* 🌫️ MOBILE DRAW OVERLAY BACKDROP - Only active on small screens when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 📑 DYNAMIC SMART HYBRID SIDEBAR */}
      <aside 
        className={`
          /* 📌 MOBILE BASE SETTINGS: Floating system drawer panel */
         fixed top-16 bottom-0 left-0 bg-[#06162E] border-r border-blue-900 z-50 transition-all duration-300 flex flex-col h-[calc(100vh-4rem)]
          
          /* 💻 PC AND TABLET SETTINGS: Preserved native smart inline block flow */
          md:sticky md:translate-x-0 md:z-20
          
          /* 📏 SCREEN WIDTH DYNAMIC STATES MAP */
          ${isOpen 
            ? 'translate-x-0 w-64' 
            : '-translate-x-full md:translate-x-0 md:w-16'
          }
        `}
      >
        {/* Mobile Header Title Row (Completely hidden on PC & Tablets) */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between md:hidden">
         <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Admin Area</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 💻 PC AND TABLET SCREEN INTERACTION CONTROL EXPANDER (Hidden on Mobile) */}
        <div className="hidden md:flex p-4 border-b border-gray-100 items-center justify-between">
          {isOpen &&<span className="text-xs font-bold uppercase tracking-wider text-blue-200">Admin Menu</span>}
          <button 
            onClick={() => setIsOpen(!isOpen)}
           className="p-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 border border-blue-700 mx-auto text-white transition-colors cursor-pointer"
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isOpen ? '←' : '→'}
          </button>
        </div>

        {/* Navigation Options List Framework */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sections?.map((sec, idx) => {
            const isActive = location.pathname === sec.path;
            
            // Extract the Icon component reference
            const IconComponent = sec.icon;

            return (
              <Link
                key={idx}
                to={sec.path}
                onClick={handleLinkClick} // Only dismisses on mobile viewports now!
                title={!isOpen ? sec.title : undefined} // Shows a native tooltip hover if the PC sidebar is collapsed
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                  ${isOpen ? 'space-x-3' : 'justify-center md:space-x-0'}
                  ${isActive 
                    ? 'bg-blue-600 text-white border border-blue-500' 
 : 'text-blue-100 hover:bg-blue-900 hover:text-white'
                  }`}
              >
                {/* Dynamic Icon Rendering instead of the old circle div */}
                {IconComponent ? (
                  <IconComponent 
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110
                     ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} 
                  />
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded-sm flex-shrink-0" />
                )}
                
                {/* Mobile: Always displays labels directly */}
                <span className="truncate ml-3 md:hidden">
                  {sec.title}
                </span>

                {/* Desktop: Displays labels safely tied to the layout expansion state */}
                {isOpen && (
                  <span className="truncate ml-3 hidden md:block">
                    {sec.title}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;