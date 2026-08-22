import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const HomePage = () => {
  const benefits = [
    {
      title: "Global Opportunities",
      desc: "Competitive education with local and international job opportunities",
    },
    {
      title: "Expert Faculty",
      desc: "Experienced teachers and experts from El Sewedy Electrometer",
    },
    {
      title: "Hands-on Training",
      desc: "Practical training at partner companies",
    },
    {
      title: "English Courses",
      desc: "English-language courses in a tech-driven environment",
    },
    {
      title: "Small Classes",
      desc: "Small class sizes with maximum 25 students per class",
    },
    {
      title: "Complete Package",
      desc: "Each student receives a laptop and school uniform",
    },
  ];

  const additionalBenefits = [
    "Various sports, arts, music, and drama activities",
    "Annual Capstone project to apply research skills",
    "Opportunities to join tech colleges and institutes",
    "Career guidance through the Career Development Center (CDC)",
    "Help with applying for competitions and representing the school locally and internationally",
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section
        className="relative min-h-[90vh] md:min-h-[100vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/sewedy.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/90 to-red-700/80" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight">
            El Sewedy International School
          </h1>
          <div className="inline-block bg-[#ef3131] px-4 md:px-6 py-2 md:py-3 rounded-lg mb-6 md:mb-8">
            <p className="text-lg md:text-2xl font-semibold">
              For Applied Technology and Software
            </p>
          </div>
          <p className="text-lg md:text-2xl mb-8 md:mb-12 max-w-4xl mx-auto font-light leading-relaxed">
            The best choice for your future in technology - Empowering the next
            generation of tech innovators
          </p>
          <Link to="/apply-options">
            <Button
              size="lg"
              className="bg-white !text-[#ef3131] hover:bg-gray-100 text-base md:text-lg px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Apply Now
              <svg
                className="ml-2 h-4 w-4 md:h-5 md:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </Link>
        </div>
      </section>

      {/* What is El Sewedy Section */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 md:mb-8">
              What is El Sewedy International School?
            </h2>
            <div className="w-24 h-1 bg-[#ef3131] mx-auto mb-6 md:mb-8"></div>
            <p className="text-base md:text-xl text-gray-700 max-w-5xl mx-auto leading-relaxed font-light">
              El Sewedy International School for Applied Technology and
              Software, established in 2022, is ranked among the top ten
              international schools for applied technology. Our mission is to
              empower students with the skills and knowledge needed for success
              in both local and global industries, fostering a brighter future
              through cutting-edge education and innovation.
            </p>
          </div>
        </div>
      </section>

      {/* Software Programming Specialization */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 md:mb-8">
              Software Programming Specialization
            </h2>
            <div className="w-24 h-1 bg-[#ef3131] mx-auto mb-6 md:mb-8"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardContent className="p-6 md:p-10">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#ef3131]/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                  <svg
                    className="h-6 w-6 md:h-8 md:w-8 text-[#ef3131]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#ef3131] mb-4 md:mb-6">
                  Integrated Systems (IS)
                </h3>
                <p className="text-gray-700 leading-relaxed text-base md:text-lg font-light">
                  Focuses on combining hardware and software solutions, teaching
                  students to design, implement, and maintain advanced
                  technological systems. Students learn to bridge the gap
                  between physical and digital components.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardContent className="p-6 md:p-10">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#ef3131]/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                  <svg
                    className="h-6 w-6 md:h-8 md:w-8 text-[#ef3131]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#ef3131] mb-4 md:mb-6">
                  Information Systems (IS)
                </h3>
                <p className="text-gray-700 leading-relaxed text-base md:text-lg font-light">
                  Emphasizes system analysis, database management, and
                  cybersecurity, preparing students to develop and manage
                  efficient digital solutions. Both programs equip students with
                  practical skills for the evolving tech industry.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why El Sewedy Section */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 md:mb-8">
              Why El Sewedy International School?
            </h2>
            <div className="w-24 h-1 bg-[#ef3131] mx-auto mb-6 md:mb-8"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
            {benefits.map((item, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white"
              >
                <CardContent className="p-6 md:p-8 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-[#ef3131]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <svg
                      className="h-6 w-6 md:h-8 md:w-8 text-[#ef3131]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed text-sm md:text-base">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Card className="border-0 shadow-lg bg-white max-w-4xl mx-auto">
              <CardContent className="p-6 md:p-10">
                <h3 className="text-xl md:text-2xl font-bold text-[#ef3131] mb-4 md:mb-6">
                  Additional Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-left">
                  {additionalBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-[#ef3131] rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700 font-light text-sm md:text-base">
                        {benefit}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Ready to Join Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-[#ef3131] to-red-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-6xl font-bold mb-6 md:mb-8">
            Ready to Join Our School?
          </h2>
          <p className="text-lg md:text-2xl mb-8 md:mb-12 max-w-4xl mx-auto font-light leading-relaxed">
            Take the first step towards a bright future in technology and
            innovation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Link to="/apply-options">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white !text-[#ef3131] hover:bg-gray-100 text-base md:text-lg px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Apply Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#ef3131] text-base md:text-lg px-8 md:px-12 py-3 md:py-4 rounded-full font-semibold bg-transparent transition-all duration-300"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 md:h-8 md:w-8 text-[#ef3131] mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 className="text-2xl md:text-3xl font-bold text-[#ef3131]">
                Our Location
              </h2>
            </div>
            <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8">
              New Zahraa October City, Sector D, Sidik El-Manshawi Street, next
              to Sector D Center and Talaat Harb School, Giza Governorate,
              Egypt.
            </p>
          </div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full h-[400px] rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3459.3564770884327!2d30.909490025375106!3d29.882827426211726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x145855d052038511%3A0x7d8fe87a2f888771!2z2YXYr9ix2LPYqSDYp9mE2LPZiNmK2K_ZiiDYp9mE2K_ZiNmE2YrYqSDZhNmE2KrZg9mG2YjZhNmI2KzZitinINin2YTYqti32KjZitmC2YrYqSDZiNin2YTYqNix2YXYrNmK2KfYqg!5e0!3m2!1sar!2seg!4v1753396469432!5m2!1sar!2seg"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
