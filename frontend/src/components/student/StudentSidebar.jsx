import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const StudentSidebar = ({ links = [], isOpen, setIsOpen }) => {
  const location = useLocation();

  // Handle menu item selection
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
         fixed top-16 bottom-0 left-0 bg-[#06162E] border-r border-blue-900 z-50 transition-all duration-300 flex-col h-[calc(100vh-4rem)]
          
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
         
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 💻 PC AND TABLET SCREEN INTERACTION CONTROL EXPANDER (Hidden on Mobile) */}
        <div className="hidden md:flex p-4 border-b border-gray-100 items-center justify-between">
          {isOpen && <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Student Menu</span>}
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
          {links.map((item, idx) => {
            const isActive = location.pathname === item.path;
            
            // Extract the dynamic icon component reference
            const IconComponent = item.icon;

            return (
              <Link
                key={idx}
                to={item.path}
                onClick={handleLinkClick} // Only dismisses on mobile device views now!
                title={!isOpen ? item.title : undefined} // Native desktop hover tooltip when collapsed
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
                  ${isOpen ? 'space-x-3' : 'justify-center md:space-x-0'}
                  ${isActive 
                    ? 'bg-blue-600 text-white border border-blue-500' 
 : 'text-blue-100 hover:bg-blue-900 hover:text-white'
                  }`}
              >
                {/* Dynamic Icon Rendering with Integrated Badge Container */}
                <div className="relative flex items-center justify-center">
                  {IconComponent ? (
                    <IconComponent 
                      className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110
                        ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} 
                    />
                  ) : (
                    <div className="w-5 h-5 bg-gray-200 rounded-sm flex-shrink-0" />
                  )}

                  {/* 🚀 REAL-TIME BADGE ON SIDEBAR ICON */}
                  {item.unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white border border-white shadow-xs animate-pulse z-30">
                      {item.unreadCount}
                    </span>
                  )}
                </div>
                
                {/* Mobile: Always displays titles directly */}
                <span className="truncate ml-3 md:hidden">
                  {item.title}
                </span>

                {/* Desktop: Displays titles safely bound to the layout expansion arrow toggle state */}
                {isOpen && (
                  <span className="truncate ml-3 hidden md:block">
                    {item.title}
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

export default StudentSidebar;