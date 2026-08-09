import React, { useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "../../assets/graphics-and-video-edit.png";
import logo from "../../assets/logo.png";
import {
  FaBullseye,
  FaEye,
  FaStar,
  FaPhoneAlt,
  FaEnvelope,
  FaTelegramPlane,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import watermark from "../../assets/water-mark-.png";
import client1 from "../../assets/Addis Ababa University.jpg";
import client2 from "../../assets/Addis Amba College.jpg";
import client3 from "../../assets/Addis Ababa City Administration.jpg";
import client4 from "../../assets/Ai Ain News.jpg";
import client5 from "../../assets/Black Lihons Business Empire.jpg";
import client6 from "../../assets/Debark University.jpg";
import client7 from "../../assets/Digaf Microfinance.jpg";
import client8 from "../../assets/Haile Resort.jpg";
import client9 from "../../assets/Embassy Of The State Of Palasitne.jpg";
import client10 from "../../assets/Addis Ababa Diocese Office.jpg";
import client11 from "../../assets/Ethio Africa.jpg";
import client12 from "../../assets/University Of Gondar.jpg";
import founder from "../../assets/owner.png";

const Home = () => {
  const [language, setLanguage] = useState("EN");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const text = {
    EN: {
      home: "Home",
      about: "About Us",
      signin: "Sign In",
      signup: "Sign Up",
      heroTitle: "Learn Creative Skills. Build Your Future.",
      description:
        "Master Graphic Design and Video Editing skills with practical training, creative projects, and professional tools used by modern creators.",
      start: "Start Learning",
      login: "Login",
      aboutTitle: "About i Design & Advertising",
      aboutText:
        "i Design & Advertising empowers students to become professional designers and video editors through modern technology, creative education, and project-based learning.",
    },
    AM: {
      home: "መነሻ",
      about: "ስለ እኛ",
      signin: "ግባ",
      signup: "ተመዝገብ",
      heroTitle: "የፈጠራ ችሎታዎችን ይማሩ። የወደፊትዎን ይገንቡ።",
      description:
        "በግራፊክ ዲዛይን እና ቪዲዮ ኤዲቲንግ ሙያዎችን በተግባር ይማሩ።",
      start: "መማር ይጀምሩ",
      login: "ግባ",
      aboutTitle: "ስለ i Design & Advertising",
      aboutText:
        "i Design & Advertising ተማሪዎችን በዘመናዊ ቴክኖሎጂ እና በተግባር ትምህርት የተሻሉ ዲዛይነሮች እና ቪዲዮ ኤዲተሮች እንዲሆኑ ያግዛል።",
    },
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-8 py-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
              <img
                src={logo}
                alt="i Design & Advertising"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-blue-700 leading-tight">
                i Design & Advertising
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500">
                Graphic Design & Video Editing School
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 font-medium">
            <Link
              to="/"
              className="text-gray-700 font-semibold hover:text-blue-600 transition"
            >
              {text[language].home}
            </Link>

            <a
              href="#about"
              className="text-gray-700 font-semibold hover:text-blue-600 transition"
            >
              {text[language].about}
            </a>

            <Link
              to="/login"
              className="text-gray-700 font-semibold hover:text-blue-600 transition"
            >
              {text[language].signin}
            </Link>

            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
              <button
                onClick={() => setLanguage("EN")}
                className={`text-sm font-semibold px-2 py-1 rounded ${
                  language === "EN"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("AM")}
                className={`text-sm font-semibold px-2 py-1 rounded ${
                  language === "AM"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                አማ
              </button>
            </div>

            <Link
              to="/register"
              className="bg-blue-900 text-white px-5 py-2.5 rounded-full font-semibold shadow-md hover:bg-blue-800 transition"
            >
              {text[language].signup}
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100"
            >
              {text[language].signin}
            </Link>
            <button
              onClick={toggleMenu}
              className="text-gray-700 text-2xl focus:outline-none p-1"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 shadow-lg flex flex-col gap-4 animate-fadeIn">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-800 font-semibold text-lg hover:text-blue-600 py-1"
            >
              {text[language].home}
            </Link>

            <a
              href="#about"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-800 font-semibold text-lg hover:text-blue-600 py-1"
            >
              {text[language].about}
            </a>

            <div className="flex items-center justify-between border-y border-gray-100 py-3">
              <span className="text-gray-600 text-sm font-medium">Language:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage("EN")}
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    language === "EN"
                      ? "bg-blue-700 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("AM")}
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    language === "AM"
                      ? "bg-blue-700 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  አማ
                </button>
              </div>
            </div>

            <Link
              to="/register"
              onClick={() => setIsMenuOpen(false)}
              className="bg-blue-900 text-white text-center py-3 rounded-xl font-semibold shadow-md active:bg-blue-800"
            >
              {text[language].signup}
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B2E59] via-[#123D73] to-[#1B4D8A] text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid md:grid-cols-2 gap-10 items-center">
          {/* Text Box */}
          <div className="relative text-center md:text-left">
            <img
              src={watermark}
              alt=""
              className="absolute -top-12 left-1/2 -translate-x-1/2 md:translate-x-0 md:-left-8 w-[140%] h-[140%] object-cover opacity-[0.03] pointer-events-none"
            />

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
              {text[language].heroTitle}
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-blue-100 max-w-xl mx-auto md:mx-0">
              {text[language].description}
            </p>

            <div className="mt-8 flex justify-center md:justify-start gap-4">
              <Link
                to="/register"
                className="bg-white text-blue-900 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-50 transition"
              >
                {text[language].start}
              </Link>
            </div>
          </div>

          {/* Hero Image Block - Centered Mobile */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-2xl max-w-md mx-auto md:max-w-none w-full">
            <div className="text-center">
              <div className="flex justify-center items-center">
                <img
                  src={heroImage}
                  alt="i Design & Advertising"
                  className="w-full h-[280px] sm:h-[380px] md:h-[420px] object-cover rounded-2xl shadow-xl mx-auto"
                />
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold mt-6">
                Create Your Future
              </h3>
              <p className="mt-2 text-sm sm:text-base text-blue-100">
                Design • Edit • Create • Inspire
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
                <div className="bg-white text-gray-800 rounded-xl p-4 shadow">
                  <div className="text-3xl sm:text-4xl">🎨</div>
                  <h4 className="font-bold text-blue-700 mt-2 text-sm sm:text-base">
                    Graphic Design
                  </h4>
                  <p className="text-xs sm:text-sm mt-1 text-gray-600">
                    Photoshop <br /> Illustrator
                  </p>
                </div>

                <div className="bg-white text-gray-800 rounded-xl p-4 shadow">
                  <div className="text-3xl sm:text-4xl">🎬</div>
                  <h4 className="font-bold text-blue-700 mt-2 text-sm sm:text-base">
                    Video Editing
                  </h4>
                  <p className="text-xs sm:text-sm mt-1 text-gray-600">
                    Premiere Pro <br /> After Effects
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <h2 className="text-center text-2xl sm:text-4xl font-bold text-gray-900 px-4">
          Why Choose i Design & Advertising?
        </h2>

        <div className="max-w-6xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4 sm:px-8">
          {[
            ["🎓", "Expert Training"],
            ["💻", "Practical Projects"],
            ["🏆", "Professional Skills"],
            ["🚀", "Career Growth"],
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 sm:p-8 rounded-2xl shadow hover:-translate-y-2 transition text-center"
            >
              <div className="text-4xl">{item[0]}</div>
              <h3 className="mt-4 text-lg sm:text-xl font-bold text-blue-700">
                {item[1]}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Our Additional Services */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-[#06162E] via-[#0B2E59] to-[#123D73] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center">
            Our Additional Services
          </h2>

          <p className="text-center text-blue-100 mt-4 max-w-3xl mx-auto text-sm sm:text-base">
            Besides professional training, we provide creative design, branding,
            printing, and digital media services for businesses and individuals.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-10 sm:mt-12">
            {[
              { icon: "🎨", title: "Logo Design" },
              { icon: "🏷", title: "Sticker Design" },
              { icon: "👕", title: "T-Shirt Design" },
              { icon: "🚗", title: "Car Branding" },
              { icon: "🖨", title: "All Printables" },
              { icon: "🎬", title: "Video Editing" },
              { icon: "📱", title: "Short Video Promo" },
              { icon: "🏢", title: "Full Company Branding" },
            ].map((service, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow hover:bg-white/20 hover:-translate-y-1 transition text-center"
              >
                <div className="text-3xl sm:text-4xl">{service.icon}</div>
                <h3 className="font-bold text-base sm:text-xl text-white mt-3">
                  {service.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Trusted Clients */}
      <section className="py-16 sm:py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-blue-700">
            Our Trusted Clients
          </h2>

          <p className="text-center text-gray-600 mt-3 text-sm sm:text-base">
            We are proud to work with organizations and businesses that trust our creative services.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mt-10 sm:mt-12">
            {[
              { img: client1, title: "Addis Ababa University" },
              { img: client2, title: "Addis Amba College" },
              { img: client3, title: "Addis Ababa City Administration" },
              { img: client4, title: "Al Ain News" },
              { img: client5, title: "Black Lions Business Empire" },
              { img: client6, title: "Debark University" },
              { img: client7, title: "Digaf Microfinance" },
              { img: client8, title: "Haile Resort" },
              { img: client9, title: "Embassy of the State of Palestine" },
              { img: client10, title: "EOTC Addis Ababa Diocese Office" },
              { img: client11, title: "Ethio Africa" },
              { img: client12, title: "University of Gondar" },
            ].map((client, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl p-4 h-56 sm:h-64 flex flex-col items-center justify-between shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300"
              >
                <img
                  src={client.img}
                  alt={client.title}
                  className="h-20 sm:h-24 w-full object-contain mx-auto"
                />
                <p className="text-xs sm:text-sm font-semibold text-gray-800 text-center leading-tight flex items-center justify-center flex-1 mt-2">
                  {client.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section
        id="about"
        className="py-16 sm:py-20 bg-gradient-to-r from-[#06162E] via-[#0B2E59] to-[#123D73]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white">
            {text[language].aboutTitle}
          </h2>

          <p className="mt-6 text-base sm:text-lg text-blue-100 text-center max-w-4xl mx-auto leading-relaxed">
            {text[language].aboutText}
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {/* Mission */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl text-center md:text-left">
              <FaBullseye className="text-4xl sm:text-5xl text-blue-700 mx-auto md:mx-0 mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-700">Mission</h3>
              <p className="mt-3 text-gray-700 text-sm sm:text-base leading-relaxed">
                To empower the next generation of Ethiopian storytellers and digital creators by providing world-class, hands-on training in graphic design and video production.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl text-center md:text-left">
              <FaEye className="text-4xl sm:text-5xl text-blue-700 mx-auto md:mx-0 mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-700">Vision</h3>
              <p className="mt-3 text-gray-700 text-sm sm:text-base leading-relaxed">
                To become the leading hub for digital creative arts in Ethiopia, recognized for producing highly skilled, entrepreneurial graduates by 2035.
              </p>
            </div>

            {/* Values */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl text-center md:text-left">
              <FaStar className="text-4xl sm:text-5xl text-blue-700 mx-auto md:mx-0 mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-700">Values</h3>
              <p className="mt-3 text-gray-700 text-sm sm:text-base leading-relaxed">
                Creativity with Purpose, Practical Excellence, and Cultural Integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Owner Photo - Centered on Mobile */}
            <div className="flex justify-center">
              <div className="w-[260px] h-[260px] sm:w-[380px] sm:h-[380px] md:w-[430px] md:h-[430px] rounded-full overflow-hidden border-4 sm:border-8 border-blue-100 shadow-2xl">
                <img
                  src={founder}
                  alt="Abraham Haileleul"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Owner Information */}
            <div className="text-center md:text-left">
              <p className="text-blue-600 font-semibold uppercase tracking-widest text-xs sm:text-sm">
                Meet Our Founder
              </p>

              <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mt-2">
                Abraham Haileleul
              </h2>

              <h3 className="text-base sm:text-xl text-blue-700 font-semibold mt-2">
                Graphic Designer, Content Creator, Video Editor & Social Media Manager
              </h3>

              <div className="mt-6 space-y-3 sm:space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
                <p>I create, edit, and teach visual storytelling.</p>
                <p>
                  With over 5 years of experience as a graphic designer, video editor, and content creator, I build impactful visuals for modern brands.
                </p>
                <p>
                  As a design lecturer, I bridge industry reality with foundational theory to inspire the next generation of creatives.
                </p>
              </div>

              {/* Contact Information */}
              <div className="mt-8 space-y-3 flex flex-col items-center md:items-start">
                <div className="flex items-center gap-3">
                  <FaPhoneAlt className="text-blue-700 text-lg" />
                  <span className="text-gray-700 text-sm sm:text-base font-medium">
                    +251-985-67-26-10
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-blue-700 text-lg" />
                  <span className="text-gray-700 text-sm sm:text-base font-medium">
                    Abrahamhailu57@gmail.com
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <FaTelegramPlane className="text-blue-700 text-lg" />
                  <span className="text-gray-700 text-sm sm:text-base font-medium">
                    @Graphic2designer
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-8 px-4">
        <h2 className="text-xl sm:text-2xl font-bold">
          About i Design & Advertising
        </h2>

        <p className="mt-2 text-blue-200 text-xs sm:text-sm">
          Empowering the next generation of creators.
        </p>

        <p className="mt-4 text-xs text-blue-300">
          © 2026 i Design & Advertising. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
