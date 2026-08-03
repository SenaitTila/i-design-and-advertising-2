import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="text-white font-bold text-xl tracking-wider">
            Creative Academy
          </Link>
          <p className="mt-4 text-sm text-gray-400 max-w-sm leading-relaxed">
            Empowering the next generation of creators, developers, and designers with world-class, project-based learning.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white text-sm font-semibold tracking-wider uppercase">Platform</h3>
          <ul className="mt-4 space-y-2">
            <li><Link to="/" className="text-sm hover:text-indigo-400 transition-colors">Browse Courses</Link></li>
            <li><Link to="/register" className="text-sm hover:text-indigo-400 transition-colors">Become an Instructor</Link></li>
            <li><Link to="#" className="text-sm hover:text-indigo-400 transition-colors">Pricing</Link></li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div>
          <h3 className="text-white text-sm font-semibold tracking-wider uppercase">Support</h3>
          <ul className="mt-4 space-y-2">
            <li><Link to="#" className="text-sm hover:text-indigo-400 transition-colors">Help Center</Link></li>
            <li><Link to="#" className="text-sm hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
            <li><Link to="#" className="text-sm hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
        <p className="text-xs text-gray-500">
          &copy; {currentYear} Creative Academy. All rights reserved.
        </p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          {/* Social Icons Placeholders */}
          <span className="text-gray-500 text-xs hover:text-white cursor-pointer">Twitter</span>
          <span className="text-gray-500 text-xs hover:text-white cursor-pointer">GitHub</span>
          <span className="text-gray-500 text-xs hover:text-white cursor-pointer">LinkedIn</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;