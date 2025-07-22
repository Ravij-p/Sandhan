import { MapPin, Phone, Mail } from "lucide-react";

const Header = () => (
  <header
    className="fixed top-0 left-0 right-0 z-50 px-4 py-2"
    style={{ backgroundColor: "#163233", color: "#fafaee" }}
  >
    <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center text-sm space-y-2 md:space-y-0">
      {/* Left side: Email + Phone */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-6 space-y-1 sm:space-y-0">
        <a
          href="mailto:info@sandhanacademy.com"
          className="hover:text-[#f9dc41] transition-colors flex items-center text-left"
        >
          <Mail size={20} className="mr-2" />
          <span>info@sandhanacademy.com</span>
        </a>

        <a
          href="tel:+918866993381"
          className="hover:text-[#f9dc41] transition-colors flex items-center text-left"
        >
          <Phone size={20} className="mr-2" />
          <span>+91 8866993381</span>
        </a>
        <div className="flex items-center space-x-2 text-left">
          <MapPin size={16} />
          <span>Ahmedabad, Gujarat</span>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
