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
} from "react-icons/fa";
import watermark from "../../assets/water-mark-.png";
import client1 from "../../assets/Addis Ababa University.jpg";
import client2 from "../../assets/Addis Ababa Diocese Office.jpg";
import client3 from "../../assets/Addis Ababa City Administration.jpg";
import client4 from "../../assets/Ai Ain News.jpg";
import client5 from "../../assets/Black Lihons Business Empire.jpg";
import client6 from "../../assets/Debark University.jpg";
import client7 from "../../assets/Digaf Microfinance.jpg";
import client8 from "../../assets/Embassy Of The State Of Palasitne.jpg";
import client9 from "../../assets/Addis Ababa Diocese Office.jpg";
import client10 from "../../assets/Ethio Africa.jpg";
import client11 from "../../assets/University Of Gondar.jpg";
import founder from "../../assets/owner.png";
const Home = () => {

  const [language, setLanguage] = useState("EN");

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
        "i Design & Advertising empowers students to become professional designers and video editors through modern technology, creative education, and project-based learning."
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
        "i Design & Advertising ተማሪዎችን በዘመናዊ ቴክኖሎጂ እና በተግባር ትምህርት የተሻሉ ዲዛይነሮች እና ቪዲዮ ኤዲተሮች እንዲሆኑ ያግዛል።"
    }

  };


  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <header className="bg-white shadow-md">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-8 py-2">

          <div className="flex items-center gap-3">

            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
   <img
  
  src={logo}
  alt="i Design & Advertising"
  className="w-24 h-24 object-contain"
/>

            </div>

            <div>
              <h1 className="text-2xl font-bold text-blue-700">
                i Design & Advertising 
              </h1>
              <p className="text-xs text-gray-500">
                Graphic Design & Video Editing School
              </p>
            </div>

          </div>

<div className="flex items-center gap-8 font-medium">

  <Link 
    to="/"
    className="text-gray-700 font-semibold hover:text-blue-600"
  >
    {text[language].home}
  </Link>


  <a 
    href="#about"
    className="text-gray-700 font-semibold hover:text-blue-600"
  >
    {text[language].about}
  </a>


  <Link 
    to="/login"
    className="text-gray-700 font-semibold hover:text-blue-600"
  >
    {text[language].signin}
  </Link>


  <button
  onClick={() => setLanguage("EN")}
  className="text-gray-700 font-semibold hover:text-blue-600"
>
  EN
</button>


<button
  onClick={() => setLanguage("AM")}
  className="text-gray-700 font-semibold hover:text-blue-600"
>
  አማ
</button>


  <Link
    to="/register"
    className="bg-blue-900 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-blue-800 transition"
  >
    {text[language].signup}
  </Link>

</div>

        </nav>
      </header>
: {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B2E59] via-[#123D73] to-[#1B4D8A] text-white">
       <div className="max-w-7xl mx-auto px-8 py-12 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
           <img
  src={watermark}
  alt=""
  className="absolute -top-8 -left-8 w-[120%] h-[120%] object-cover opacity-[0.03] pointer-events-none"
/>

           

           <h2 className="mt-2 text-5xl md:text-6xl font-extrabold leading-tight">

{text[language].heroTitle}
  

</h2>
            <p className="mt-6 text-lg text-blue-100">

               {text[language].description}

            </p>

<div className="mt-10 flex gap-5">

  

</div>
</div> 


          {/* i Design & Advertising*/}

          <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-1 shadow-2xl">

            <div className="text-center">

              <img
  src={heroImage}
  alt="i Design & Advertising"
  className="w-full h-[420px] object-cover rounded-2xl shadow-xl"
/>
              <h3 className="text-3xl font-bold mt-6">

                Create Your Future

              </h3>

              <p className="mt-4 text-blue-100">

                Design • Edit • Create • Inspire

              </p>


              <div className="grid grid-cols-2 gap-4 mt-8">

                <div className="bg-white text-gray-800 rounded-xl p-5">

                  <div className="text-4xl">
                    🎨
                  </div>

                  <h4 className="font-bold text-blue-700 mt-3">
                    Graphic Design
                  </h4>

                  <p className="text-sm mt-2">
                    Photoshop
                    <br />
                    Illustrator
                  </p>

                </div>

                <div className="bg-white text-gray-800 rounded-xl p-5">

                  <div className="text-4xl">
                    🎬
                  </div>

                  <h4 className="font-bold text-blue-700 mt-3">
                    Video Editing
                  </h4>

                  <p className="text-sm mt-2">
                    Premiere Pro
                    <br />
                    After Effects
                  </p>

                </div>


              </div>


            </div>


          </div>


        </div>

      </section>


      {/* Features */}

      <section className="py-20 bg-gray-50">

        <h2 className="text-center text-4xl font-bold text-gray-900">

          Why Choose i Design & Advertising?

        </h2>

        <div className="max-w-6xl mx-auto mt-12 grid md:grid-cols-4 gap-6 px-8">

          {[
            ["🎓","Expert Training"],
            ["💻","Practical Projects"],
            ["🏆","Professional Skills"],
            ["🚀","Career Growth"]
          ].map((item,index)=>(

            <div 
              key={index}
              className="py-20 bg-white p-8 rounded-2xl shadow hover:-translate-y-2 transition"
            >

              <div className="text-4xl">
                {item[0]}
              </div>

              <h3 className="mt-4 text-xl font-bold text-blue-700">
                {item[1]}
              </h3>

            </div>

          ))}


        </div>


      </section>
      {/* Our Additional Services */}
<section className="py-20 bg-gradient-to-r from-[#06162E] via-[#0B2E59] to-[#123D73] text-white">
  <div className="max-w-7xl mx-auto px-8">

   <h2 className="text-4xl font-bold text-center text-white">
      Our Additional Services
    </h2>

    <p className="text-center text-blue-100 mt-4 max-w-3xl mx-auto">
      Besides professional training, we provide creative design, branding,
      printing, and digital media services for businesses and individuals.
    </p>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
 <div className="bg-white -50 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-2 transition">
        <div className="text-4xl">🎨</div>
        <h3 className="font-bold text-xl text-blue-700 mt-4">Logo Design</h3>
      </div>

      <div className="bg-white -50 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-2 transition">
        <div className="text-4xl">🏷</div>
        <h3 className="font-bold text-xl text-blue-700 mt-4">Sticker Design</h3>
      </div>

      <div className="bg-white -50 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-2 transition">
        <div className="text-4xl">👕</div>
        <h3 className="font-bold text-xl text-blue-700 mt-4">T-Shirt Design</h3>
      </div>

      <div className="bg-white -50 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-2 transition">
        <div className="text-4xl">🚗</div>
        <h3 className="font-bold text-xl text-blue-700 mt-4">Car Branding</h3>
      </div>

      <div className="bg-white -50 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-2 transition">
        <div className="text-4xl">🖨</div>
        <h3 className="font-bold text-xl text-blue-700 mt-4">All Printables</h3>
      </div>

      <div className="bg-white -50 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-2 transition">
        <div className="text-4xl">🎬</div>
        <h3 className="font-bold text-xl text-blue-700 mt-4">Video Editing</h3>
      </div>

      <div className="bg-white -50 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-2 transition">
        <div className="text-4xl">📱</div>
        <h3 className="font-bold text-xl text-blue-700 mt-4">Short Video Promo</h3>
      </div>

      <div className="bg-white -50 rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-2 transition">
        <div className="text-4xl">🏢</div>
        <h3 className="font-bold text-xl text-blue-700 mt-4">Full Company Branding</h3>
      </div>

    </div>

  </div>
</section>
<section className="py-20 bg-white">
  <div className="max-w-7xl mx-auto px-8">

    <h2 className="text-4xl font-bold text-center text-blue-700 mb-14"></h2>
    </div>
    </section>
      {/* =========================
   {/* =========================
    Our Trusted Clients
========================= */}

<section className="py-20 bg-gray-100">
  <div className="max-w-7xl mx-auto px-8">

    <h2 className="text-4xl font-bold text-center text-blue-700">
      Our Trusted Clients
    </h2>

    <p className="text-center text-gray-600 mt-4">
      We are proud to work with organizations and businesses that trust our creative services.
    </p>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mt-12">

      <div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client1} alt="Addis Ababa University" className="h-24 w-full object-contain" />
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Addis Ababa University
  </p>
</div>

<div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client2} alt="Addis Ababa Diocese Office" className="h-24 w-full object-contain" />
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Addis Ababa Diocese Office
  </p>
</div>
g <div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client3} alt="Addis Ababa City Administration" className="h-24 w-full object-contain" />
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Addis Ababa City Administration
  </p>
</div>

<div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client4} alt="Al Ain News" className="h-24 w-full object-contain" />
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Al Ain News
  </p>
</div>

<div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client5} alt="Black Lions Business Empire" className="h-24 w-full object-contain" />
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Black Lions Business Empire
  </p>
</div>

<div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client6} alt="Debark University" className="h-24 w-full object-contain"/>
 <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Debark University
  </p>
</div>

<div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client7} alt="Digaf Microfinance" className="h-24 w-full object-contain"/>
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Digaf Microfinance
  </p>
</div>

<div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client8} alt="Embassy of the State of Palestine" className="h-24 w-full object-contain" />
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Embassy of the State of Palestine
  </p>
</div>

<div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client9} alt="EOTC Addis Ababa Diocese Office" className="h-24 w-full object-contain" />
 <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    EOTC Addis Ababa Diocese Office
  </p>
</div>

<div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client10} alt="Ethio Africa" className="h-24 w-full object-contain"/>
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    Ethio Africa
  </p>
</div>
 <div className="bg-white border border-gray-200 rounded-2xl p-6 h-64 flex flex-col items-center justify-between shadow-md hover:shadow-2xl hover:border-blue-500 hover:-translate-y-2 transition-all duration-300">
  <img src={client11} alt="University of Gondar" className="h-24 w-full object-contain"/>
  <p className="mt-4 text-sm font-semibold text-gray-800 leading-5 text-center min-h-[50px] flex items-center justify-center">
    University of Gondar
  </p>
</div>

    </div>

  </div>
</section>
     {/* About Us */}
<section
  id="about"
  className="py-20 bg-gradient-to-r from-[#06162E] via-[#0B2E59] to-[#123D73]"
>
  <div className="max-w-6xl mx-auto px-8">

    <h2 className="text-4xl font-bold text-center text-white">
      {text[language].aboutTitle}
    </h2>

    <p className="mt-8 text-lg text-blue-100 text-center max-w-4xl mx-auto leading-8">
      {text[language].aboutText}
    </p>

    <div className="grid md:grid-cols-3 gap-8 mt-16">

      {/* Mission */}
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <FaBullseye className="text-5xl text-blue-700 mb-6" />
        <h3 className="text-3xl font-bold text-blue-700">Mission</h3>

        <p className="mt-5 text-gray-700">
          To empower the next generation of Ethiopian storytellers and digital creators by providing world-class, hands-on training in graphic design and video production.
        </p>
      </div>

      {/* Vision */}
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <FaEye className="text-5xl text-blue-700 mb-6" />
        <h3 className="text-3xl font-bold text-blue-700">Vision</h3>

        <p className="mt-5 text-gray-700">
          To become the leading hub for digital creative arts in Ethiopia, recognized for producing highly skilled, entrepreneurial graduates by 2035.
        </p>
      </div>

      {/* Values */}
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <FaStar className="text-5xl text-blue-700 mb-6" />
        <h3 className="text-3xl font-bold text-blue-700">Values</h3>

        <p className="mt-5 text-gray-700">
          Creativity with Purpose, Practical Excellence, and Cultural Integrity.
        </p>
      </div>

    </div>

  </div>
</section>

     {/* ================= Owner Section ================= */}
<section className="py-24 bg-white">
  <div className="max-w-7xl mx-auto px-8">
    <div className="grid md:grid-cols-2 gap-16 items-center">

      {/* Owner Photo */}
<div className="flex justify-center">
  <div className="w-[430px] h-[430px] rounded-full overflow-hidden border-8 border-blue-100 shadow-2xl">
    <img
      src={founder}
      alt="Abraham Haileleul"
      className="w-full h-full object-cover object-top"
    />
  </div>
</div>
      {/* Owner Information */}
      <div>

        <p className="text-blue-600 font-semibold uppercase tracking-widest">
          Meet Our Founder
        </p>

        <h2 className="text-5xl font-bold text-gray-900 mt-3">
         Abraham Haileleul
        </h2>

        <h3 className="text-xl text-blue-700 font-semibold mt-2">
          Graphic Designer,Content Creator,Video Editor & Social Media Manager
        </h3>

        <div className="mt-8 space-y-5 text-gray-700 leading-8">

          <p>
            I create, edit, and teach visual storytelling.
          </p>

          <p>
            With over 5 years of experience as a graphic designer,
            video editor, and content creator, I build impactful visuals
            for modern brands.
          </p>

          <p>
            As a design lecturer, I bridge industry reality with
            foundational theory to inspire the next generation of creatives.
          </p>

        </div>

        {/* Contact */}
        <div className="mt-10 space-y-4">

          <div className="flex items-center gap-4">
            <FaPhoneAlt className="text-blue-700 text-xl" />
            <span className="text-gray-700">
              +251-985-67-26-10
            </span>
          </div>
 <div className="flex items-center gap-4">
            <FaEnvelope className="text-blue-700 text-xl" />
            <span className="text-gray-700">
              Abrahamhailu57@gmail.com
            </span>
          </div>

          <div className="flex items-center gap-4">
            <FaTelegramPlane className="text-blue-700 text-xl" />
            <span className="text-gray-700">
              @Graphic2designer
            </span>
          </div>

        </div>

      </div>

    </div>
  </div>
</section>

      {/* Footer */}

      <footer className="bg-blue-900 text-white text-center py-8">

        <h2 className="text-2xl font-bold">
         About I Design & Advertising
        </h2>

        <p className="mt-3 text-blue-200">
          Empowering the next generation of creators.
        </p>


        <p className="mt-4 text-sm">
          © 2026 i Design & Advertising. All Rights Reserved.
        </p>


      </footer>


    </div>
  );
};

export default Home;