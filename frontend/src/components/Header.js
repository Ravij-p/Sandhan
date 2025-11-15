import { MapPin, Phone, Mail } from "lucide-react";

const Header = () => (
  <header
    className="fixed top-0 left-0 right-0 z-50 px-4 py-2"
    style={{ backgroundColor: "#163233", color: "#fafaee" }}
  >
    <div className="container mx-auto flex flex-row md:flex-row justify-between items-center text-sm gap-x-6 overflow-x-auto whitespace-nowrap">
      <div className="flex flex-row items-center gap-x-6 overflow-x-auto whitespace-nowrap w-full">
        <a
          href="mailto:info@trushtiias.com"
          className="hover:text-[#f9dc41] transition-colors flex items-center"
          title="info@trushtiias.com"
        >
          <Mail size={18} className="mr-2" />
          <span>Email</span>
        </a>

        <a
          href="tel:+918866993381"
          className="hover:text-[#f9dc41] transition-colors flex items-center"
          title="+91 8866993381"
        >
          <Phone size={18} className="mr-2" />
          <span>Call</span>
        </a>

        <div className="flex items-center">
          <MapPin size={16} className="mr-2" />
          <span>Ahmedabad</span>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
