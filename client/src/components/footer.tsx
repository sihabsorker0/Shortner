import { Link } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <Link className="text-primary mr-2" size={20} />
                SihabShort
              </h2>
            </div>
            <p className="text-slate-600 mb-4">
              Professional URL shortening service with powerful analytics and custom branding options.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-slate-500">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-500">
                <i className="fab fa-github"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-500">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">Product</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-600 hover:text-slate-900">Features</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900">API</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900">Pricing</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900">Analytics</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-600 hover:text-slate-900">Documentation</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900">Help Center</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900">Contact</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900">Status</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-200">
          <p className="text-slate-400 text-sm text-center">
            &copy; 2024 SihabShort. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
