import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full px-4 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300 pt-16 pb-8">
      <div className="container mx-auto max-w-7xl ">
        
        {/* Top Section: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand & Description (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <Link to="/">
              <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-gray-900 dark:text-white">
                Vaani 
                <i className="fa fa-comments text-primary"></i>
              </h2>
            </Link>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
              Connect with language learners worldwide. Break barriers, share stories, and master new languages through real conversations.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-6">
              {['twitter', 'github', 'linkedin', 'instagram'].map((icon) => (
                <a 
                  key={icon}
                  href="#" 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all duration-300"
                >
                  <i className={`fa-brands fa-${icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Links Column 1: Product */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              {['Browse Rooms', 'Create Room', 'Pricing', 'Premium', 'AI Chat'].map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2: Resources */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              {['Documentation', 'Community Guides', 'Blog', 'Help Center'].map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3: Company */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 dark:border-slate-800 my-8"></div>

        {/* Bottom Section: Copyright & Developer Credit */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          
          <p>© {currentYear} Vaani Inc. All rights reserved.</p>

          {/* Developer Credit */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-900 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-800 shadow-sm">
            <span>Designed & Developed by</span>
            <a 
              href="https://github.com/rohitpant" // Replace with your actual portfolio/github link
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Rohit Pant
              <i className="fa-solid fa-heart text-red-500 animate-pulse text-xs"></i>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;